import type { Command } from "./types";
import { blank, dim, divider, info, ok, warn } from "../output";
import { alignHistory, careerOf, crewOf, hatLabel, hatBand, langOf, levelOf, moralityOf, prestigeCount, prestigeMult, xpOf } from "../engine";
import { t } from "../i18n";

/** Your legend: the full story of your run, in numbers. */
export const legendCmd: Command = {
  name: "legend",
  usage: "legend",
  help: "The full legend of your run: hours, exploits, alignments, prestige.",
  detail: "An extended career screen: hours played, total stolen, alignment journey, crew, prestige multiplier, favorite target.",
  run: (g) => {
    const lang = langOf(g);
    const lines = [];
    const c = careerOf(g);
    const hours = (g.day - 1) * 24 + Math.floor(g.minutes / 60);
    lines.push(divider(t(lang, "legend.title", { name: g.name || "Dave" })));
    lines.push(dim(t(lang, "legend.hours", { h: hours, d: g.day })));
    lines.push(dim(t(lang, "legend.level", { l: levelOf(g), xp: xpOf(g) })));
    lines.push(dim(t(lang, "legend.money", { m: c.moneyEarned || 0 })));
    lines.push(dim(t(lang, "legend.hacks", { n: c.hacksDone || 0 })));
    lines.push(dim(t(lang, "legend.missions", { n: c.missionsDone || 0 })));
    if (c.bestDay) lines.push(dim(t(lang, "legend.bestDay", { m: c.bestEarn || 0, d: c.bestDay })));
    if (c.favTarget) lines.push(dim(t(lang, "legend.favTarget", { t: c.favTarget })));
    lines.push(dim(t(lang, "legend.align", { label: hatLabel(lang, hatBand(g)), v: moralityOf(g) })));
    const crew = crewOf(g);
    lines.push(dim(t(lang, "legend.crew", { n: crew.length })));
    const p = prestigeCount(g);
    if (p > 0) lines.push(ok(t(lang, "legend.prestige", { n: p, mult: Math.round((prestigeMult(g) - 1) * 100) })));
    lines.push(blank);
    // alignment journey
    const hist = alignHistory(g);
    if (hist.length) {
      lines.push(divider(t(lang, "legend.alignJourney")));
      for (const e of hist.slice(-12)) {
        lines.push(dim(`   Day ${e.day} — ${hatLabel(lang, e.band)} (${e.value}/100) — ${e.why}`));
      }
    }
    lines.push(blank);
    lines.push(dim(t(lang, "legend.tip")));
    return { lines, minutes: 1 };
  },
};
