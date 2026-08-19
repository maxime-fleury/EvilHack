import type { Command } from "./types";
import { blank, dim, divider, info } from "../output";
import { langOf, xpOf, levelOf, xpIntoLevel, xpForNext } from "../engine";
import { t } from "../i18n";
import { ACHIEVEMENTS, achievementsLines } from "../achievements";

export const achievementsCmd: Command = {
  name: "achievements",
  aliases: ["ach", "trophies", "trophy", "succes"],
  usage: "achievements",
  help: "Show your achievements (trophies) and XP.",
  detail: "Every action gives XP. Level up for passive bonuses — faster hacks, quieter ops, better mining. Complete hidden criteria to unlock trophies.",
  run: (g) => {
    const lang = langOf(g);
    const lines = [];
    const lvl = levelOf(g);
    const next = xpForNext(g);
    lines.push(divider(t(lang, "ach.title")));
    lines.push(info(t(lang, "ach.level", { l: lvl, xp: xpOf(g), into: xpIntoLevel(g), next: next ? `${next}` : "MAX" })));
    const unlocked = ((g.flags.achievements as string[]) || []).length;
    lines.push(dim(t(lang, "ach.count", { got: unlocked, total: ACHIEVEMENTS.length })));
    lines.push(blank);
    lines.push(...achievementsLines(g, lang));
    return { lines, minutes: 0 };
  },
};
