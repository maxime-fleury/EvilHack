import type { Command } from "./types";
import { blank, dim, divider, err, info, money, ok, warn, fmtMoney } from "../output";
import { findTarget, hackMinutes, parallelSlots, langOf, skillLevel, heatMult, resolveHack, logEvent } from "../engine";
import type { Game } from "../engine";
import { t } from "../i18n";

interface PendingHack {
  target: string;
  vector: "brute" | "exploit" | "social";
  event: "firewall" | "admin" | "honeypot" | null;
  minutes: number;
  heatFactor: number;
  failChance: number;
  exploitOwned: boolean;
}

function pendingOf(g: Game): PendingHack | null {
  const p = g.flags.pendingHack;
  return p && typeof p === "object" ? (p as PendingHack) : null;
}
function setPending(g: Game, p: PendingHack | null) {
  if (p) g.flags.pendingHack = p;
  else delete g.flags.pendingHack;
}

/** Targets lock for a few in-game hours after a failed attempt. */
function isLocked(g: Game, name: string): boolean {
  const lock = g.flags.hackLock as { target: string; until: number } | undefined;
  if (!lock || lock.target !== name) return false;
  const now = g.day * 1440 + g.minutes;
  return now < lock.until;
}
function lockTarget(g: Game, name: string, hours: number) {
  g.flags.hackLock = { target: name, until: g.day * 1440 + g.minutes + hours * 60 };
}

const OS = ["Windows 98 (a classic)", "Linux (hardened, allegedly)", "a forgotten 2008 NAS", "Windows Server 2012 'don't ask'", "a smart fridge that got lost"];

/** Strip surrounding quotes so `hack "MegaCorp HQ"` works like `hack MegaCorp HQ`. */
function cleanName(s: string): string {
  const t = s.trim();
  if (t.length >= 2 && ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'")))) return t.slice(1, -1).trim();
  return t;
}
const PORTS = ["3 ports open (21, 22, 1337)", "2 ports open (80, 443)", "4 ports open (you love to see it)", "1 port open (they tried)", "5 ports open (it's a museum)"];

export const hackCmd: Command = {
  name: "hack",
  aliases: ["hax"],
  usage: "hack <target> | hack brute|exploit|social <target> | hack push|cover|abort",
  help: "Recon a target, pick an approach, break in.",
  detail: "hack <target> starts recon. Then pick a vector: brute (fast, loud), exploit (quiet), social (charm). If something trips mid-hack, handle it: push (risky), cover (slower, safer), or abort (walk away).",
  run: (g, args) => {
    const lang = langOf(g);
    const [mode, ...rest] = args;
    const pending = pendingOf(g);

    // ── live-event handling ─────────────────────────────────────────────────
    if (mode === "push" || mode === "cover" || mode === "abort") {
      if (!pending || !pending.event) {
        return { lines: [err(t(lang, "hack.noEvent"))], minutes: 0 };
      }
      return resolveAfterEvent(g, mode);
    }

    // ── vector choice ───────────────────────────────────────────────────────
    if (mode === "brute" || mode === "exploit" || mode === "social") {
      const tgtName = cleanName(rest.join(" ")) || (pending ? pending.target : "");
      const tgt = findTarget(g, tgtName);
      if (!tgt) return { lines: [err(t(lang, "hack.noTarget", { name: tgtName }))], minutes: 0 };
      if (pending && pending.target !== tgt.name) {
        return {
          lines: [err(t(lang, "hack.alreadyPending", { t: pending.target, v: "brute | exploit | social" }))],
          minutes: 0,
        };
      }
      if (isLocked(g, tgt.name)) {
        return { lines: [err(t(lang, "hack.blocked", { t: tgt.name }))], minutes: 0 };
      }
      return chooseVector(g, tgt.name, mode);
    }

    // ── starting a hack: recon ──────────────────────────────────────────────
    const tgt = findTarget(g, cleanName(args.join(" ")));
    if (!tgt) {
      if (pending) {
        return {
          lines: [
            info(t(lang, "hack.alreadyPending", { t: pending.target, v: "brute | exploit | social" })),
            dim(`  ${t(lang, "hack.bruteLine")}`),
            dim(`  ${t(lang, "hack.exploitLine")}`),
            dim(`  ${t(lang, "hack.socialLine")}`),
          ],
          minutes: 0,
        };
      }
      return { lines: [err(t(lang, "hack.noTarget", { name: args.join(" ") }))], minutes: 0 };
    }
    const laylow = (g.flags.laylowUntil as number) || 0;
    if (laylow > 0 && g.day <= laylow) {
      return { lines: [err(t(lang, "hack.laylow", { d: laylow }))], minutes: 0 };
    }
    if ((tgt.needBotnet || tgt.name === "PUPPYCOIN Exchange") && g.botnet === 0) {
      return { lines: [err(t(lang, "hack.botnet"))], minutes: 0 };
    }
    if (isLocked(g, tgt.name)) {
      return { lines: [err(t(lang, "hack.blocked", { t: tgt.name }))], minutes: 0 };
    }
    const running = g.jobs.length;
    if (running >= parallelSlots(g)) {
      return { lines: [warn(t(lang, "hack.slots", { n: parallelSlots(g) }))], minutes: 0 };
    }

    setPending(g, { target: tgt.name, vector: "brute", event: null, minutes: 5, heatFactor: 1, failChance: 0.2, exploitOwned: false });
    const lines = [
      divider(t(lang, "hack.recon", { t: tgt.name, os: OS[Math.floor(Math.random() * OS.length)], ports: PORTS[Math.floor(Math.random() * PORTS.length)] })),
      dim(`   ${tgt.flavor}`),
      dim(t(lang, "hack.diff", { d: tgt.difficulty, m: hackMinutes(g, tgt.difficulty, tgt.skill) })),
      blank,
      info(t(lang, "hack.pickVector", { v: "" })),
      dim(`  ${t(lang, "hack.bruteLine")}`),
      dim(`  ${t(lang, "hack.exploitLine")}`),
      dim(`  ${t(lang, "hack.socialLine")}`),
      blank,
      dim(`   → type: hack ${"brute"} ${tgt.name}`),
    ];
    return { lines, minutes: 3 };
  },
};

/** The player picked a vector: roll the dice, maybe trip an event. */
function chooseVector(g: Game, tgtName: string, mode: "brute" | "exploit" | "social") {
  const lang = langOf(g);
  const tgt = findTarget(g, tgtName)!;
  const exploitOwned = g.exploits.includes(tgt.skill || "sql");
  const skill = skillLevel(g, tgt.skill || "sql");
  const diff = tgt.difficulty;

  let failChance = 0.12 + diff * 0.06 + g.heat / 200;
  let heatFactor = 1;
  let minutes = Math.max(10, hackMinutes(g, diff, tgt.skill) * 0.6);
  if (mode === "exploit") {
    failChance = Math.max(0.04, failChance - 0.12 - skill * 0.015 - (exploitOwned ? 0.1 : 0));
    heatFactor = 0.5;
    minutes = Math.max(15, minutes * 1.15);
  } else if (mode === "social") {
    failChance = Math.max(0.03, failChance - 0.1 - skill * 0.01 - (exploitOwned ? 0.15 : 0));
    heatFactor = 0.35;
    minutes = Math.max(20, minutes * 1.3);
  } else {
    failChance = Math.max(0.08, failChance + 0.08 - g.cpu * 0.02);
    heatFactor = 1.4;
    minutes = Math.max(8, minutes * 0.7);
  }

  const vectorName = mode === "brute" ? "brute force" : mode === "exploit" ? "exploit" : "social engineering";
  // 55% chance something trips on the way in
  const roll = Math.random();
  let event: PendingHack["event"] = null;
  const lines = [ok(t(lang, "hack.vectorChosen", { v: vectorName }))];
  if (roll < 0.55) {
    const ev = Math.random();
    if (ev < 0.35) event = "firewall";
    else if (ev < 0.7) event = "admin";
    else event = "honeypot";
  }

  if (event) {
    setPending(g, { target: tgtName, vector: mode, event, minutes, heatFactor, failChance, exploitOwned });
    lines.push(warn(t(lang, `hack.event${event[0].toUpperCase()}${event.slice(1)}`)));
    lines.push(blank);
    lines.push(dim(`  ${t(lang, "hack.push", { m: 10 })}`));
    lines.push(dim(`  ${t(lang, "hack.cover", { m: 20 })}`));
    lines.push(dim(`  ${t(lang, "hack.abort")}`));
    lines.push(blank);
    lines.push(dim("   → type: hack push | hack cover | hack abort"));
    return { lines, minutes: 5 };
  }

  // no event — resolve right away
  setPending(g, null);
  resolve(g, tgtName, mode, minutes, heatFactor, failChance, lines);
  return { lines, minutes };
}

/** The player handled the live event: push / cover / abort → resolution. */
function resolveAfterEvent(g: Game, choice: "push" | "cover" | "abort") {
  const lang = langOf(g);
  const p = pendingOf(g)!;
  const tgt = findTarget(g, p.target)!;
  const lines: ReturnType<typeof dim>[] = [];
  if (choice === "abort") {
    setPending(g, null);
    lines.push(dim(t(lang, "hack.eventAborted")));
    return { lines, minutes: 5 };
  }
  if (choice === "cover") {
    lines.push(dim(t(lang, "hack.eventCovered")));
    p.minutes += 10;
    p.failChance = Math.max(0.02, p.failChance - 0.15);
  } else {
    lines.push(dim(t(lang, "hack.eventResolved", { t: p.target })));
    p.minutes += 10;
  }
  setPending(g, null);
  resolve(g, p.target, p.vector, p.minutes, p.heatFactor, p.failChance, lines);
  return { lines, minutes: p.minutes };
}

/** Final roll + shared payout/fragments/heat/XP. */
function resolve(g: Game, tgtName: string, mode: "brute" | "exploit" | "social", minutes: number, heatFactor: number, failChance: number, lines: any[]) {
  const lang = langOf(g);
  const tgt = findTarget(g, tgtName)!;
  const failed = Math.random() < failChance;
  if (failed) {
    g.heat += Math.round(8 * heatMult(g)) + 4;
    lockTarget(g, tgtName, 4);
    logEvent(g, t(lang, "hack.logHacked", { target: tgtName }));
    lines.push(err(t(lang, "hack.fail", { t: tgtName })));
    return;
  }
  // link to an active mission targeting this network (if any)
  const mission = g.missions.find((m) => m.status === "active" && m.target === tgtName);
  const skim = resolveHack(g, tgtName, { isMission: !!mission, missionId: mission?.id, out: lines });
  lines.push(money(t(lang, "hack.skimmed", { m: fmtMoney(skim), target: tgtName })));
  const heatGain = Math.round(tgt.heat * heatMult(g) * heatFactor);
  g.heat += heatGain;
  if (heatGain > 0) lines.push(dim(t(lang, "hack.heat", { h: heatGain })));
  lines.push(ok(t(lang, "hack.done", { label: tgtName })));
  void mode;
}
