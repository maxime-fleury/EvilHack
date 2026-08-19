import type { Command } from "./types";
import { blank, dim, divider, info, ok, warn } from "../output";
import { careerOf, crewOf, heatMult, langOf, levelOf } from "../engine";
import { t } from "../i18n";

/** Frank's mood, derived from real state — he has opinions. */
export const frankCmd: Command = {
  name: "frank",
  usage: "frank",
  help: "Check in with Frank. He has feelings about all of this.",
  detail: "Frank is a 2008 HP Pavilion with a soul (barely). His mood depends on your heat, your uptime, and how many RGB strips you've bolted onto his chassis.",
  run: (g) => {
    const lang = langOf(g);
    const lines = [];
    const c = careerOf(g);
    const heat = g.heat;
    const days = g.day;
    const level = levelOf(g);
    const crew = crewOf(g).length;
    lines.push(divider(t(lang, "frank.title")));
    lines.push(dim(t(lang, "frank.sub")));
    lines.push(blank);
    // mood
    let moodKey = "frank.moodFine";
    if (g.rgb > 0) moodKey = "frank.moodRgb";
    else if (heat >= 70) moodKey = "frank.moodHeat";
    else if (days >= 7) moodKey = "frank.moodUptime";
    else if (crew > 0) moodKey = "frank.moodCrew";
    else if ((c.moneyEarned || 0) > 5000) moodKey = "frank.moodRich";
    lines.push(info(t(lang, moodKey)));
    lines.push(blank);
    lines.push(dim(t(lang, "frank.stats", { days, heat, level, crew })));
    lines.push(blank);
    if (g.vps > 0) lines.push(dim(t(lang, "frank.vps")));
    if (heatMult(g) < 0.7) lines.push(dim(t(lang, "frank.quiet")));
    return { lines, minutes: 1 };
  },
};
