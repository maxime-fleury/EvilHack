import type { Command } from "./types";
import { blank, dim, err, info, ok, warn, title } from "../output";
import { langOf, styleRank, styleTitle, addNews, addXp } from "../engine";
import { t } from "../i18n";
import { blingOf } from "../engine";

export const flexCmd: Command = {
  name: "flex",
  usage: "flex",
  help: "Show off your drip. Style earns you respect. No style earns you… pity.",
  detail: "Flexing once per day builds reputation based on your style rank. Low style: the void stares back.",
  run: (g) => {
    const lang = langOf(g);
    const rank = styleRank(g);
    const lines = [];
    if (rank === 0) {
      lines.push(title(t(lang, "flex.failTitle")));
      lines.push(dim(t(lang, "flex.failBody")));
      lines.push(blank);
      lines.push(info(t(lang, "flex.hint")));
      return { lines, minutes: 1 };
    }
    // once per day
    const lastDay = (g.flags.flexDay as number) || 0;
    if (lastDay === g.day) {
      lines.push(warn(t(lang, "flex.cooldown", { d: g.day })));
      return { lines, minutes: 1 };
    }
    g.flags.flexDay = g.day;
    const repGain = Math.min(rank, 5);
    g.rep += repGain;
    const rankTitle = styleTitle(lang, rank);
    lines.push(ok(t(lang, "flex.ok", { title: rankTitle, r: repGain })));
    // the BASS shakes the walls — and the neighbors' patience
    if (blingOf(g).includes("bass")) {
      g.heat += 2;
      lines.push(warn(t(lang, "flex.bass")));
    }
    // top drip sometimes makes the darknet press
    if (rank >= 3 && Math.random() < 0.4) {
      addNews(g, t(lang, "flex.news", { title: rankTitle }), t(lang, "flex.newsBody"));
      lines.push(info(t(lang, "flex.famous")));
    }
    addXp(g, 5, lines);
    return { lines, minutes: 2 };
  },
};
