import type { Command } from "./types";
import { blank, dim, divider, err, info, ok, warn } from "../output";
import { prestigeCount, prestigeMult, langOf, levelOf, xpOf } from "../engine";
import { t } from "../i18n";

/** Reset the grind, keep the legend, earn a permanent income multiplier. */
export const prestigeCmd: Command = {
  name: "prestige",
  aliases: ["ng"],
  usage: "prestige",
  help: "Reset your money and gear for a permanent +10% income boost per prestige.",
  detail: "Requires level 5+ and rep 25+. Keeps: trophies, skills, alignment, career record, crew, backdoors, files. Resets: money, gear, exploits, heat, rep.",
  run: (g) => {
    const lang = langOf(g);
    const lines = [];
    if (levelOf(g) < 5) return { lines: [err(t(lang, "prestige.needLevel", { l: 5 }))], minutes: 0 };
    if (g.rep < 25) return { lines: [err(t(lang, "prestige.needRep", { r: 25 }))], minutes: 0 };
    const n = prestigeCount(g) + 1;
    g.flags.prestiges = n;
    // reset the grind
    g.money = 15;
    g.rep = 0;
    g.heat = 0;
    g.style = 0;
    g.cpu = 0;
    g.gpu = 0;
    g.ram = 0;
    g.vpn = 0;
    g.botnet = 0;
    g.vps = 0;
    g.rgb = 0;
    g.chair = 0;
    g.toaster = 0;
    g.cam = 0;
    g.flags.bling = []; // the drip is gone. the legend of the drip remains.
    g.exploits = [];
    g.flags.programs = [];
    g.flags.puppyOwned = 0;
    g.flags.puppyPrice = 0.02;
    // keep: trophies, skills, alignment, career, crew, backdoors, files, market
    lines.push(divider(t(lang, "prestige.title", { n })));
    lines.push(ok(t(lang, "prestige.done", { mult: Math.round((prestigeMult(g) - 1) * 100) })));
    lines.push(dim(t(lang, "prestige.kept")));
    lines.push(dim(t(lang, "prestige.lost")));
    lines.push(blank);
    lines.push(info(t(lang, "prestige.next", { n: n + 1, mult: Math.round((1 + (n + 1) * 0.1 - 1) * 100) })));
    return { lines, minutes: 10 };
  },
};
