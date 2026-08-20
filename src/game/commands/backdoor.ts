import type { Command } from "./types";
import { blank, dim, divider, err, info, ok, warn } from "../output";
import { backdoorsOf, findTarget, fuzzyTarget, hasBackdoor, hasProgram, langOf } from "../engine";
import { t } from "../i18n";

/** Leave (or list) persistent access on hacked hosts. */
export const backdoorCmd: Command = {
  name: "backdoor",
  aliases: ["doors"],
  usage: "backdoor [<target> | list]",
  help: "Leave a backdoor on a host you already hacked, or list your planted doors.",
  detail: "Requires the Rootkit program (tor install rootkit). Planting a door lets you revisit a host silently — no heat, fast, low payout (nothing new to steal). Doors can be burned when the heat event hits. Sell planted access on the darknet for cash.",
  run: (g, args) => {
    const lang = langOf(g);
    const lines = [];
    const sub = (args[0] || "").toLowerCase();
    if (sub === "list" || !args[0]) {
      const bd = backdoorsOf(g);
      lines.push(divider(t(lang, "backdoor.list")));
      if (!bd.length) {
        lines.push(dim(t(lang, "backdoor.none")));
        lines.push(dim(t(lang, "backdoor.hint")));
      } else {
        for (const b of bd) lines.push(dim(`   🔑 ${b.target} — ${t(lang, "backdoor.day", { d: b.day })}`));
        lines.push(blank);
        lines.push(dim(t(lang, "backdoor.sellHint")));
      }
      return { lines, minutes: 1 };
    }
    const name = args.join(" ");
    let tgt = findTarget(g, name);
    let noroFix: { bad: string; good: string } | undefined;
    if (!tgt) {
      const fz = fuzzyTarget(g, name);
      if (!fz) return { lines: [err(t(lang, "scan.noTarget", { name }))], minutes: 0 };
      tgt = fz;
      noroFix = { bad: name, good: fz.name };
    }
    if (!hasProgram(g, "rootkit")) return { lines: [err(t(lang, "backdoor.needRootkit"))], minutes: 0 };
    if (hasBackdoor(g, tgt.name)) return { lines: [err(t(lang, "backdoor.already", { target: tgt.name }))], minutes: 0 };
    const hacked = (g.flags.hackedTargets as string[]) || [];
    if (!hacked.includes(tgt.name)) return { lines: [err(t(lang, "backdoor.needHack", { target: tgt.name }))], minutes: 0 };
    if (noroFix) lines.push(ok(t(lang, "hack.noroFix", { bad: noroFix.bad, good: noroFix.good })));
    const bd = backdoorsOf(g);
    bd.push({ target: tgt.name, day: g.day });
    g.flags.backdoors = bd;
    lines.push(ok(t(lang, "backdoor.planted", { target: tgt.name })));
    lines.push(dim(t(lang, "backdoor.effect")));
    return { lines, minutes: 15 };
  },
};
