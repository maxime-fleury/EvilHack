import type { Command } from "./types";
import { blank, dim, divider, info, ok, warn } from "../output";
import { buildTargets, hackMinutes, hasBackdoor, hasProgram, langOf } from "../engine";
import { t } from "../i18n";

function isDarknet(name: string): boolean {
  return ["The Fax Machine", "The ATM", "The Crypto ATM", "The Private WoW Server"].includes(name);
}

/** The network map: your PC, your VPS, and the world segmented by reach. */
export const netCmd: Command = {
  name: "net",
  usage: "net",
  help: "Show the network map: your gear, your routes, what's in reach.",
  detail: "Displays your position in the network (home, VPS) and every discovered host grouped by segment. Hosts on the darknet need a wardialer; a VPS gives you a second front door.",
  run: (g) => {
    const lang = langOf(g);
    const lines = [];
    lines.push(divider(t(lang, "net.title")));
    // your position
    lines.push(info(`   [YOU] ${g.name}@home — Frank (2008 HP Pavilion)`));
    if (g.vps > 0) lines.push(ok(`   [VPS] ${["Potato VPS", "Gamer VPS", "Offshore Darknet VPS"][Math.max(0, Math.min(2, g.vps - 1))]} — ${t(lang, "net.vpsDoor")}`));
    else lines.push(dim(t(lang, "net.noVps")));
    lines.push(blank);

    const targets = buildTargets(g);
    const reachable = targets.filter((t) => !isDarknet(t.name));
    const darknet = targets.filter((t) => isDarknet(t.name));

    lines.push(divider(t(lang, "net.local")));
    for (const tgt of reachable) {
      const bd = hasBackdoor(g, tgt.name) ? " 🔑" : "";
      lines.push(dim(`   ${tgt.name.padEnd(26)} ${"█".repeat(tgt.difficulty) + "░".repeat(5 - tgt.difficulty)}  ~${hackMinutes(g, tgt.difficulty, tgt.skill)}min${bd}`));
    }

    if (darknet.length) {
      lines.push(blank);
      if (hasProgram(g, "wardialer")) {
        lines.push(divider(t(lang, "net.darknet")));
        for (const tgt of darknet) {
          const bd = hasBackdoor(g, tgt.name) ? " 🔑" : "";
          lines.push(dim(`   ${tgt.name.padEnd(26)} ${"█".repeat(tgt.difficulty) + "░".repeat(5 - tgt.difficulty)}  ~${hackMinutes(g, tgt.difficulty, tgt.skill)}min${bd}`));
        }
      } else {
        lines.push(dim(t(lang, "net.needWardialer")));
      }
    }

    // routes / hints
    lines.push(blank);
    lines.push(divider(t(lang, "net.routes")));
    lines.push(dim(t(lang, "net.route1")));
    if (g.vps > 0) lines.push(dim(t(lang, "net.routeVps")));
    if (hasProgram(g, "rootkit")) lines.push(dim(t(lang, "net.routeRootkit")));
    lines.push(blank);
    const bd = buildTargets(g).filter((t) => hasBackdoor(g, t.name));
    if (bd.length) lines.push(info(t(lang, "net.backdoors", { n: bd.length })));
    return { lines, minutes: 1 };
  },
};
