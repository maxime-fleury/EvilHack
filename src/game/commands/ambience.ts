import type { Command } from "./types";
import { blank, dim, divider, err, info, ok, title, warn, fmtMoney } from "../output";
import { langOf, careerOf, factionRep, levelOf } from "../engine";
import { t } from "../i18n";
import { peekSlot, currentSlot } from "../../db";

// ── Career record ──────────────────────────────────────────────────────────

export const careerCmd: Command = {
  name: "career",
  aliases: ["legend", "record"],
  usage: "career",
  help: "Show your career record: hacks, earnings, favorite target.",
  detail: "Tracks hours played, hacks done, money earned, your best day, and your favorite target. The legend of Dave, in numbers.",
  run: (g) => {
    const lang = langOf(g);
    const c = careerOf(g);
    const lines = [];
    lines.push(divider(t(lang, "career.title")));
    const hours = (g.day - 1) * 24 + Math.floor(g.minutes / 60);
    lines.push(dim(t(lang, "career.level", { l: levelOf(g) })));
    lines.push(dim(t(lang, "career.hours", { h: hours, d: g.day })));
    lines.push(dim(t(lang, "career.hacks", { n: c.hacksDone || 0 })));
    lines.push(dim(t(lang, "career.missions", { n: c.missionsDone || 0 })));
    lines.push(dim(t(lang, "career.moneyEarned", { m: fmtMoney(c.moneyEarned || 0) })));
    if (c.bestDay) lines.push(dim(t(lang, "career.bestDay", { m: fmtMoney(c.bestEarn || 0), d: c.bestDay })));
    lines.push(dim(t(lang, "career.favTarget", { t: c.favTarget || "the void (you hacked nothing yet)" })));
    if (c.twists) lines.push(info(t(lang, "career.twists", { n: c.twists })));
    lines.push(blank);
    if (!c.hacksDone && !c.missionsDone) lines.push(dim(t(lang, "career.none")));
    return { lines, minutes: 0 };
  },
};

// ── Save slots ─────────────────────────────────────────────────────────────

export const slotsCmd: Command = {
  name: "slots",
  aliases: ["saves"],
  usage: "slots",
  help: "List your 3 save slots.",
  detail: "Three save slots, three lives. Each has its own SQLite file — switching is instant and safe.",
  run: (g) => {
    const lang = langOf(g);
    const lines = [];
    lines.push(divider(t(lang, "slots.title")));
    const cur = currentSlot();
    for (let i = 1; i <= 3; i++) {
      const p = peekSlot(i);
      const marker = i === cur ? t(lang, "slots.current") : "";
      if (p && p.exists) {
        const who = p.name ? `${p.name} — ` : "";
        lines.push(info(`   [${i}] ${who}Day ${p.day} · ${fmtMoney(p.money)} · rep ${p.rep}${marker}`));
      } else {
        lines.push(dim(`   [${i}] ${t(lang, "slots.empty")}${marker}`));
      }
    }
    lines.push(blank);
    lines.push(dim(t(lang, "slots.usage")));
    return { lines, minutes: 0 };
  },
};

export const slotCmd: Command = {
  name: "slot",
  usage: "slot <1|2|3>",
  help: "Switch save slot (1, 2 or 3).",
  detail: "Switches the active save slot. Your current slot is saved automatically before the switch.",
  run: (g, args) => {
    const lang = langOf(g);
    const n = parseInt(args[0] || "", 10);
    if (!n || n < 1 || n > 3) return { lines: [err(t(lang, "slot.invalid"))], minutes: 0 };
    return {
      lines: [ok(t(lang, "slots.switched", { n }))],
      minutes: 0,
      slotSwitchTo: n,
    };
  },
};

// ── Power / ambiance ───────────────────────────────────────────────────────

export const poweroffCmd: Command = {
  name: "poweroff",
  aliases: ["shutdown", "power down"],
  usage: "poweroff",
  help: "Turn Frank off. He'll be sad.",
  detail: "Frank shuts down. While off, every command is refused except 'reboot'. He deserves the rest.",
  run: (g) => {
    const lang = langOf(g);
    g.flags.powered = false;
    const lines = t(lang, "power.off").split("\\n").map((s) => dim(s));
    return { lines, minutes: 0 };
  },
};

export const rebootCmd: Command = {
  name: "reboot",
  aliases: ["restart"],
  usage: "reboot",
  help: "Boot Frank back up.",
  detail: "Wakes Frank up with the full boot sequence. He missed you (he didn't).",
  run: (g) => {
    const lang = langOf(g);
    g.flags.powered = true;
    const lines = t(lang, "power.on").split("\\n").map((s) => dim(s));
    return { lines, minutes: 0 };
  },
};

export const screensaverCmd: Command = {
  name: "screensaver",
  aliases: ["saver", "screen"],
  usage: "screensaver",
  help: "Summon the floating logo. Vibes.",
  detail: "The EVILHACK logo floats across the screen. Frank's screensaver is the only thing that dreams.",
  run: (g) => {
    const lang = langOf(g);
    return { lines: [dim(t(lang, "saver.msg"))], minutes: 0, screensaver: true };
  },
};
