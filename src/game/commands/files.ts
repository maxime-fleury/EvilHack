import type { Command } from "./types";
import { blank, dim, divider, err, info, ok } from "../output";
import { langOf } from "../engine";
import { t } from "../i18n";

function fsOf(g: { flags: Record<string, unknown> }): Record<string, string> {
  return (g.flags.fs as Record<string, string>) || {};
}

function listDir(g: { flags: Record<string, unknown> }, dir: string): string[] {
  const fs = fsOf(g);
  const prefix = dir === "/" ? "/" : dir.endsWith("/") ? dir : dir + "/";
  const out = new Set<string>();
  for (const p of Object.keys(fs)) {
    if (!p.startsWith(prefix)) continue;
    const rest = p.slice(prefix.length);
    const top = rest.split("/")[0];
    if (top) out.add(top + (rest.includes("/") ? "/" : ""));
  }
  return [...out].sort();
}

/** Explore Frank's little disk. */
export const lsCmd: Command = {
  name: "ls",
  usage: "ls [dir]",
  help: "List files on Frank's disk.",
  detail: "Frank has a small filesystem with notes, configs, and suspiciously empty logs. Explore with `cat <path>`.",
  run: (g, args) => {
    const lang = langOf(g);
    const lines = [];
    const dir = args[0] || "/";
    const entries = listDir(g, dir);
    lines.push(divider(t(lang, "files.ls", { dir })));
    if (!entries.length) {
      lines.push(dim(t(lang, "files.empty")));
      return { lines, minutes: 0 };
    }
    for (const e of entries) lines.push(dim(`   ${e}`));
    lines.push(blank);
    lines.push(dim(t(lang, "files.hint")));
    return { lines, minutes: 0 };
  },
};

/** Read a file. */
export const catCmd: Command = {
  name: "cat",
  usage: "cat <path>",
  help: "Print a file from Frank's disk.",
  detail: "Files live under /home, /etc, /var/log. `write <path> <text>` creates or appends.",
  run: (g, args) => {
    const lang = langOf(g);
    const path = args.join(" ") || "";
    const fs = fsOf(g);
    if (!path || !fs[path] && !Object.keys(fs).some((p) => p.startsWith(path + "/"))) {
      return { lines: [err(t(lang, "files.noFile", { path }))], minutes: 0 };
    }
    if (fs[path] !== undefined) {
      const lines = fs[path].split("\n").map((l) => dim(l));
      return { lines, minutes: 0 };
    }
    // a directory: list its files
    const sub = Object.keys(fs).filter((p) => p.startsWith(path + "/"));
    const lines = sub.map((p) => dim(`   ${p}`));
    lines.push(blank);
    lines.push(dim(t(lang, "files.isDir")));
    return { lines, minutes: 0 };
  },
};

/** Write (create/append) a note on Frank's disk. */
export const writeCmd: Command = {
  name: "write",
  usage: "write <path> <text>",
  help: "Create or append a file on Frank's disk.",
  detail: "Useful for keeping your own notes. Keep it short — it's a 2008 hard drive.",
  run: (g, args) => {
    const lang = langOf(g);
    const path = args[0] || "";
    const text = args.slice(1).join(" ") || "";
    if (!path.startsWith("/")) return { lines: [err(t(lang, "files.badPath"))], minutes: 0 };
    if (text.length > 500) return { lines: [err(t(lang, "files.tooLong"))], minutes: 0 };
    const fs = fsOf(g);
    fs[path] = fs[path] ? fs[path] + "\n" + text : text;
    g.flags.fs = fs;
    return { lines: [ok(t(lang, "files.wrote", { path }))], minutes: 0 };
  },
};
