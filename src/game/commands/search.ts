import type { Command } from "./types";
import { blank, dim, divider, err, info, l } from "../output";
import { fmtClock } from "../output";
import { getNpc } from "../world";
import { langOf } from "../engine";
import { t } from "../i18n";

export const searchCmd: Command = {
  name: "search",
  aliases: ["grep", "find"],
  usage: "search <term>   |   search",
  help: "Search your logs, news, and dossiers. Matches are highlighted.",
  detail: "Runs a full-text search over your event log, the news archive, and dossier fragments. Run 'search' alone to browse your recent log.",
  run: (g, args) => {
    const lang = langOf(g);
    const term = args.join(" ").trim().toLowerCase();
    const lines = [];

    if (!term) {
      lines.push(divider(t(lang, "search.log")));
      const recent = g.logs.slice(-40).reverse();
      if (!recent.length) {
        lines.push(dim(t(lang, "search.nolog")));
        return { lines, minutes: 1 };
      }
      for (const entry of recent) {
        lines.push(dim(`[${fmtClock(entry.day, entry.minutes)}] ${entry.text}`));
      }
      lines.push(blank);
      lines.push(info(t(lang, "search.hint")));
      return { lines, minutes: 1 };
    }

    lines.push(divider(t(lang, "search.title", { term })));
    let found = false;

    // logs
    for (const entry of g.logs) {
      if (entry.text.toLowerCase().includes(term)) {
        lines.push(l(`[${fmtClock(entry.day, entry.minutes)}] ${entry.text}`));
        found = true;
      }
    }
    // news
    for (const n of g.news) {
      const hay = `${n.headline} ${n.body}`.toLowerCase();
      if (hay.includes(term)) {
        lines.push(info(`📰 [${fmtClock(n.day, n.minutes)}] ${n.headline}`));
        if (n.body) lines.push(dim(`   ${n.body}`));
        found = true;
      }
    }
    // dossier fragments
    for (const c of g.contacts) {
      for (const frag of c.fragment_texts) {
        if (frag.toLowerCase().includes(term)) {
          const npc = getNpc(c.npc);
          lines.push(info(`📄 dossier (${npc?.name ?? c.npc}): ${frag}`));
          found = true;
        }
      }
    }
    if (!found) {
      lines.push(dim(t(lang, "search.none", { term })));
    } else {
      lines.push(blank);
      lines.push(info(t(lang, "search.hits", { term })));
    }
    return { lines, minutes: 2 };
  },
};
