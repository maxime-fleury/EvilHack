import type { Command } from "./types";
import { blank, dim, divider, info, money, ok, warn, title, fmtMoney, fmtClock } from "../output";
import { cpuPower, miningRate, parallelSlots, heatMult, hackMinutes, snapshot, langOf, skillLevel, factionRep, careerOf, xpOf, levelOf, xpIntoLevel, xpForNext, moralityOf, hatBand, hatLabel, styleRank, styleTitle, styleMult, styleDiscount } from "../engine";
import { ACHIEVEMENTS } from "../achievements";
import { t } from "../i18n";

export const statsCmd: Command = {
  name: "stats",
  aliases: ["status", "me"],
  usage: "stats",
  help: "Show your full player sheet.",
  detail: "Displays money, reputation, heat, style, your laptop's hardware, and derived stats.",
  run: (g) => {
    const lang = langOf(g);
    const s = snapshot(g);
    const lines = [];
    lines.push(divider(t(lang, "stats.sheet", { name: g.name })));
    lines.push(dim(`   ${fmtClock(g.day, g.minutes)}`));
    const hot = g.heat >= 60 ? warn(`Heat: ${g.heat} — you're on everyone's radar!`) : g.heat >= 35 ? warn(`Heat: ${g.heat}`) : ok(`Heat: ${g.heat}`);
    lines.push(money(`   Money: ${fmtMoney(g.money)}    Rep: ${g.rep}    Style: ${g.style}`));
    const sRank = styleRank(g);
    const sTitle = styleTitle(lang, sRank);
    const thresholds = [0, 50, 150, 300, 500, 800, 1200];
    const nextStyle = thresholds[sRank + 1];
    lines.push(dim(t(lang, "stats.styleLine", { title: sTitle, r: sRank, mult: `+${Math.round((styleMult(g) - 1) * 100)}%`, disc: `${Math.round((1 - styleDiscount(g)) * 100)}%`, next: nextStyle ? `${nextStyle - g.style}` : "MAX" })));
    lines.push(hot);
    lines.push(dim(t(lang, "stats.title", { title: g.titles[g.titles.length - 1] || s.title })));
    lines.push(dim(t(lang, "hat.bar", { label: hatLabel(lang, hatBand(g)), m: moralityOf(g) })));
    lines.push(blank);
    lines.push(divider(t(lang, "stats.hardware")));
    lines.push(dim(t(lang, "stats.cpu", { cpu: ["Potato 2000", "Toaster X", "Hamster i5", "The Boring i9", "Quantum Potato"][g.cpu], p: cpuPower(g).toFixed(2) })));
    lines.push(dim(t(lang, "stats.gpu", { gpu: ["Onboard Graphics", "GTX 760 Ti 'Grandma'", "RTX 3090 'Space Heater'", "RTX 5090 'Fusion'", "Quantum Toaster"][g.gpu], r: fmtMoney(miningRate(g)) })));
    lines.push(dim(t(lang, "stats.ram", { n: g.ram, slots: parallelSlots(g) })));
    lines.push(dim(t(lang, "stats.vpn", { vpn: ["None (you are everyone's problem)", "Free Proxy", "Le VPN", "NordVPN (works)"][g.vpn], m: heatMult(g).toFixed(2) })));
    lines.push(dim(t(lang, "stats.botnet", { b: ["None", "Elderly Printers (starter)", "Elderly Printers (premium)"][g.botnet] })));
    lines.push(dim(t(lang, "stats.vps", { v: ["None", "Potato VPS", "Gamer VPS", "Offshore Darknet VPS"][g.vps] })));
    if (g.exploits.length) lines.push(dim(t(lang, "stats.exploits", { e: g.exploits.join(", ") })));
    lines.push(blank);
    lines.push(divider(t(lang, "stats.derived")));
    lines.push(dim(t(lang, "stats.hacktime", { m: hackMinutes(g, 3) })));
    lines.push(dim(t(lang, "stats.mining", { state: s.mining.active ? "active" : "stopped", r: fmtMoney(s.mining.rate) })));
    if (s.puppy.owned > 0) {
      lines.push(dim(t(lang, "stats.puppy", { owned: s.puppy.owned.toFixed(2), price: fmtMoney(s.puppy.price), value: money(fmtMoney(s.puppy.owned * s.puppy.price)).t })));
    }
    // xp & achievements
    lines.push(blank);
    lines.push(divider(t(lang, "ach.title")));
    const next = xpForNext(g);
    lines.push(dim(t(lang, "ach.level", { l: levelOf(g), xp: xpOf(g), into: xpIntoLevel(g), next: next ? `${next}` : "MAX" })));
    lines.push(dim(t(lang, "ach.count", { got: ((g.flags.achievements as string[]) || []).length, total: ACHIEVEMENTS.length })));
    // skills
    lines.push(blank);
    lines.push(divider(t(lang, "skills.title")));
    if (g.exploits.length) {
      const skillRows: [string, string][] = [
        [t(lang, "skills.sql"), "sql"],
        [t(lang, "skills.social"), "social"],
        [t(lang, "skills.zero"), "zero"],
      ];
      for (const [label, id] of skillRows) {
        if (g.exploits.includes(id)) {
          const lv = skillLevel(g, id as "sql" | "social" | "zero");
          lines.push(info(t(lang, "skills.level", { name: label, n: lv, bars: "█".repeat(Math.max(1, lv)) + "░".repeat(10 - lv) })));
        }
      }
    } else {
      lines.push(dim(t(lang, "skills.none")));
    }
    // faction reputation
    lines.push(blank);
    lines.push(divider(t(lang, "faction.title")));
    const branch = (g.flags.branch as string) || "";
    if (!branch) {
      lines.push(dim(t(lang, "faction.none")));
    } else {
      for (const [id, label] of [["nullsec", "NullSec"], ["syndicate", "The Syndicate"], ["solo", "Solo"]] as [string, string][]) {
        if (factionRep(g, id) > 0 || id === branch) {
          lines.push(info(t(lang, "faction.line", { name: label, n: factionRep(g, id) })));
        }
      }
      if (branch && factionRep(g, branch) >= 10) lines.push(dim(t(lang, "faction.discount")));
      if (branch && factionRep(g, branch) >= 20) lines.push(dim(t(lang, "faction.heatProt")));
    }
    // career
    lines.push(blank);
    lines.push(divider(t(lang, "career.title", { name: g.name })));
    const c = careerOf(g);
    lines.push(dim(t(lang, "career.hacks", { n: c.hacksDone || 0 })));
    lines.push(dim(t(lang, "career.moneyEarned", { m: fmtMoney(c.moneyEarned || 0) })));
    if (c.bestDay) lines.push(dim(t(lang, "career.bestDay", { m: fmtMoney(c.bestEarn || 0), d: c.bestDay })));
    lines.push(dim(t(lang, "career.favTarget", { t: c.favTarget || "the void" })));
    return { lines, minutes: 0 };
  },
};
