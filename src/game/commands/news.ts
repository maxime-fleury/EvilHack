import type { Command } from "./types";
import { blank, dim, divider, info } from "../output";
import { fmtClock } from "../output";
import { langOf } from "../engine";
import { t } from "../i18n";

export const newsCmd: Command = {
  name: "news",
  aliases: ["feed"],
  usage: "news",
  help: "Read the latest headlines.",
  detail: "The world keeps spinning (and leaking). Read the news — it's also a way to pick up intel on people.",
  run: (g) => {
    const lang = langOf(g);
    const lines = [];
    lines.push(divider(t(lang, "news.title")));
    if (!g.news.length) {
      lines.push(dim(t(lang, "news.nothing")));
      return { lines, minutes: 0 };
    }
    for (const n of g.news.slice(-15).reverse()) {
      lines.push(info(`[${fmtClock(n.day, n.minutes)}] ${n.headline}`));
      if (n.body) lines.push(dim(`        ${n.body}`));
      lines.push(blank);
    }
    return { lines, minutes: 3 };
  },
};
