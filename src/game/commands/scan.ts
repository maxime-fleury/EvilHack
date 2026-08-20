import type { Command } from "./types";
import { blank, dim, divider, info, ok, warn } from "../output";
import { buildTargets, findTarget, fuzzyTarget, hackMinutes, langOf } from "../engine";
import { t } from "../i18n";
import { pick } from "../i18n";

function bars(n: number): string {
  return "█".repeat(n) + "░".repeat(5 - n);
}

export const scanCmd: Command = {
  name: "scan",
  usage: "scan [target]",
  help: "Scan nearby networks. Optionally inspect one.",
  detail: "Lists all hackable networks in range with difficulty ratings. `scan <name>` shows details for one target.",
  run: (g, args) => {
    const lang = langOf(g);
    const lines = [];
    lines.push(divider(t(lang, "scan.title")));
    if (!g.flags.firstScan) g.flags.firstScan = true;
    const targets = buildTargets(g);
    if (args[0]) {
      const raw = args.join(" ");
      let tgt = findTarget(g, raw);
      let noroFix: { bad: string; good: string } | undefined;
      if (!tgt) {
        const fz = fuzzyTarget(g, raw);
        if (!fz) {
          return { lines: [{ t: t(lang, "scan.noTarget", { name: raw }), c: "err" }], minutes: 0 };
        }
        tgt = fz;
        noroFix = { bad: raw, good: fz.name };
      }
      if (noroFix) lines.push(ok(t(lang, "hack.noroFix", { bad: noroFix.bad, good: noroFix.good })));
      lines.push(info(`   ${tgt.name}`));
      lines.push(dim(t(lang, "scan.difficulty", { bars: bars(tgt.difficulty) })));
      lines.push(dim(t(lang, "scan.eta", { m: hackMinutes(g, tgt.difficulty, tgt.skill) })));
      lines.push(dim(`   ${tgt.flavor}`));
      if (tgt.isMission) lines.push(warn(t(lang, "scan.mission")));
      else lines.push(dim(t(lang, "scan.payout", { lo: Math.round(tgt.basePayout * 0.7), hi: Math.round(tgt.basePayout * 1.3) })));
      lines.push(dim(t(lang, "scan.heat", { h: Math.round(tgt.heat) })));
      return { lines, minutes: 2 };
    }
    for (const tgt of targets) {
      lines.push(dim(`   ${tgt.name.padEnd(24)} ${bars(tgt.difficulty)}  ~${hackMinutes(g, tgt.difficulty, tgt.skill)}min`));
    }
    lines.push(blank);
    lines.push(dim(t(lang, "scan.hint")));
    return { lines, minutes: 5 };
  },
};
