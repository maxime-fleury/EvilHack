import type { Command } from "./types";
import { blank, dim, divider, info, ok } from "../output";
import { langOf } from "../engine";
import { RIVALS } from "../world";
import { t } from "../i18n";
import { pick } from "../i18n";

/** The other hackers in the city, their activity, and their taunts. */
export const rivalsCmd: Command = {
  name: "rivals",
  usage: "rivals",
  help: "List rival hackers — who's ahead, and who's talking smack.",
  detail: "Rivals live in the same world: they snipe missions before you arrive and react to your legend in the news. Your rep is the scoreboard.",
  run: (g) => {
    const lang = langOf(g);
    const lines = [];
    lines.push(divider(t(lang, "rivals.title")));
    const sniped = (g.flags.rivalSnipes as Record<string, number>) || {};
    for (const r of RIVALS) {
      const s = sniped[r.id] || 0;
      lines.push(info(`   ${r.name}`));
      lines.push(dim(`      ${pick(lang, r.vibe)}`));
      lines.push(dim(`      ${t(lang, "rivals.score", { n: r.baseScore + s })}`));
      if (g.rep >= 10 && g.rep < r.baseScore * 3) lines.push(dim(`      “${pick(lang, r.taunt)}”`));
    }
    lines.push(blank);
    lines.push(dim(t(lang, "rivals.footer", { rep: g.rep })));
    return { lines, minutes: 1 };
  },
};

/** Occasional mission sniping: a rival takes a fresh offer before you can. */
export function maybeSnipe(g: { flags: Record<string, unknown>; rep: number }): string | null {
  if (g.rep < 5 || Math.random() > 0.18) return null;
  const sniped = (g.flags.rivalSnipes as Record<string, number>) || {};
  const r = RIVALS[Math.floor(Math.random() * RIVALS.length)];
  sniped[r.id] = (sniped[r.id] || 0) + 1;
  g.flags.rivalSnipes = sniped;
  return r.name;
}
