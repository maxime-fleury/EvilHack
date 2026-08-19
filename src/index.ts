import { readFileSync, existsSync } from "node:fs";
import { join, extname, normalize } from "node:path";
import { getDb } from "./db";
import { loadGame, dispatch, resolve, snapshot, langOf, saveGame, isIdentified, wallpaperUnlocked } from "./game/engine";
import { introLines } from "./game/intro";
import { complete, registry } from "./game/commands/registry";
import { shopSnapshot } from "./game/shop";
import { MISSION_TEMPLATES, loadModMissions } from "./game/missions";
import { chatReply, aiOnline } from "./game/aichat";
import { cmdHelp, cmdDetail } from "./game/i18n";

const NAME = "evilhack";
const MIN_PORT = 3000;
const MAX_PORT = 3600;
const PUBLIC_DIR = join(import.meta.dir, "..", "public");

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

function serveStatic(pathname: string): Response {
  let rel = decodeURIComponent(pathname);
  if (rel === "/") rel = "/index.html";
  const filePath = normalize(join(PUBLIC_DIR, rel));
  if (!filePath.startsWith(PUBLIC_DIR) || !existsSync(filePath)) {
    return new Response("404 — not found. Even the void is confused.", { status: 404 });
  }
  const body = readFileSync(filePath);
  const type = MIME[extname(filePath)] ?? "application/octet-stream";
  return new Response(body, { headers: { "content-type": type } });
}

async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    return (await req.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const db = getDb();

  if (url.pathname === "/api/intro" && req.method === "GET") {
    const g = loadGame(db);
    return Response.json({ lines: introLines(langOf(g), isIdentified(g), g.name) });
  }

  if (url.pathname === "/api/state" && req.method === "GET") {
    const g = loadGame(db);
    return Response.json({ state: snapshot(g) });
  }

  if (url.pathname === "/api/cmd" && req.method === "POST") {
    const body = await readJson(req);
    const cmd = String(body.cmd ?? "");
    if (!cmd.trim()) {
      return Response.json({ lines: [], state: snapshot(loadGame(db)) });
    }
    try {
      const g = loadGame(db);
      const res = dispatch(g, cmd);
      const { lines, state, nudge } = await resolve(g, res);
      return Response.json({ lines, state, nudge: nudge || null, clear: !!res.clear, reset: !!res.reset, screensaver: !!res.screensaver });
    } catch (e) {
      console.error("cmd error:", cmd, (e as Error).message);
      return Response.json(
        { lines: [{ t: "The database hiccuped. Your save is safe — try that again.", c: "err" }], state: snapshot(loadGame(db)) },
        { status: 500 }
      );
    }
  }

  // Dedicated settings endpoint: works even at the lock screen (before the
  // player identifies), so changing the language never gets swallowed as a
  // login name like it would through /api/cmd.
  if (url.pathname === "/api/settings" && req.method === "POST") {
    const body = await readJson(req);
    const g = loadGame(db);
    const obj = (body.settings ?? {}) as Record<string, unknown>;
    const KEYS = new Set(["theme", "fontsize", "anim", "sound", "lang", "ainame", "aiurl", "aimodel", "aiprompt", "sndvol", "ambient", "wallpaper", "wallpaperUrl"]);
    const BOOL_KEYS = new Set(["anim", "sound", "ambient"]);
    for (const [k, v] of Object.entries(obj)) {
      if (!KEYS.has(k)) continue;
      if (k === "wallpaper" && typeof v === "string" && !wallpaperUnlocked(g, v)) continue; // story-gated
      if (BOOL_KEYS.has(k)) g.flags[k] = v === true || v === "on" || v === "true";
      else g.flags[k] = typeof v === "boolean" ? v : String(v);
    }
    saveGame(db, g);
    return Response.json({ state: snapshot(g) });
  }

  if (url.pathname === "/api/ai-status" && req.method === "GET") {
    const probe = url.searchParams.get("url")?.trim();
    if (probe) {
      const online = await aiOnline({ aiurl: probe });
      return Response.json({ online, url: probe });
    }
    const g = loadGame(db);
    const online = await aiOnline(g.flags);
    return Response.json({ online, url: g.flags.aiurl || "http://127.0.0.1:3007" });
  }

  if (url.pathname === "/api/chat" && req.method === "POST") {
    const body = await readJson(req);
    const message = String(body.message ?? "");
    const g = loadGame(db);
    const reply = await chatReply(g, message);
    // chatReply pushes the exchange into g.flags.aiHistory — persist it so
    // Noro-chan actually remembers conversations across sessions.
    saveAfter(g);
    return Response.json({ reply });
  }

  if (url.pathname === "/api/complete" && req.method === "POST") {
    const body = await readJson(req);
    const line = String(body.line ?? "");
    return Response.json({ completions: complete(line) });
  }

  if (url.pathname === "/api/shop" && req.method === "GET") {
    const g = loadGame(db);
    return Response.json({ shop: shopSnapshot(g, langOf(g)) });
  }

  if (url.pathname === "/api/help" && req.method === "GET") {
    const lang = langOf(loadGame(db));
    const seen = new Set<string>();
    const commands = [...registry.values()]
      .filter((c) => {
        if (seen.has(c.name)) return false;
        seen.add(c.name);
        return true;
      })
      .map((c) => ({ name: c.name, usage: c.usage, help: cmdHelp(lang, c.name, c.help), detail: cmdDetail(lang, c.name, c.detail) }));
    return Response.json({ commands });
  }

  return serveStatic(url.pathname);
}

function saveAfter(g: ReturnType<typeof loadGame>) {
  try {
    saveGame(g.db, g);
  } catch {
    /* nudge may have mutated flags; ignore save errors */
  }
}

function findAvailablePort(start: number, end: number) {
  for (let port = start; port <= end; port++) {
    try {
      return Bun.serve({ port, fetch: handler });
    } catch {
      console.log(`  port ${port} busy — trying ${port + 1}…`);
    }
  }
  return null;
}

// JSON mods: drop mission files in ./mods and they're added to the pool.
const MODS_DIR = join(process.cwd(), "mods");
const modMissions = loadModMissions(MODS_DIR);
if (modMissions.length) {
  MISSION_TEMPLATES.push(...modMissions);
  console.log(`   mods: ${modMissions.length} custom mission(s) loaded from ${MODS_DIR}`);
}

const server = findAvailablePort(MIN_PORT, MAX_PORT);
if (!server) {
  console.error(`No free port between ${MIN_PORT} and ${MAX_PORT} — giving up.`);
  process.exit(1);
}
console.log(`🟤 ${NAME} running → http://localhost:${server.port}`);
console.log(`   Game data → ${join(process.cwd(), "data", "evilhack.db")}`);
