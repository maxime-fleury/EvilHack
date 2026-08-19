import type { Command } from "./types";
import { blank, dim, divider, info, ok, warn } from "../output";
import { marketOf, langOf } from "../engine";
import { NPCS, getNpc } from "../world";
import { t } from "../i18n";

const TOR_BASE: Record<string, number> = { sniffer: 200, proxychain: 350, miner2: 700, wardialer: 500, rootkit: 1200 };

/** The darknet market: today's prices for programs and hot dossiers. */
export const marketCmd: Command = {
  name: "market",
  usage: "market",
  help: "Show today's darknet market: program prices and hot dossiers.",
  detail: "Prices drift daily. When someone is 'in the news', their dossier is worth 2×. Buy low, sell scandalous.",
  run: (g) => {
    const lang = langOf(g);
    const lines = [];
    const m = marketOf(g);
    lines.push(divider(t(lang, "market.title")));
    // tor programs
    lines.push(divider(t(lang, "market.programs")));
    for (const [id, base] of Object.entries(TOR_BASE)) {
      const mult = m.tor?.[id] || 1;
      const price = Math.round(base * mult);
      const tag = mult > 1.25 ? warn(`▲ ${Math.round((mult - 1) * 100)}%`).t : mult < 0.8 ? ok(`▼ ${Math.round((1 - mult) * 100)}%`).t : "—";
      lines.push(dim(`   ${id.padEnd(14)} $${price}  ${tag}`));
    }
    lines.push(blank);
    // hot dossiers
    lines.push(divider(t(lang, "market.dossiers")));
    const scandalDay = m.scandalDay || 0;
    if (scandalDay === g.day) {
      for (const id of NPCS.map((n) => n.id)) {
        const mult = m.dossiers?.[id] || 1;
        const npc = getNpc(id)!;
        if (mult > 1) lines.push(ok(`   ${npc.name} — ×2 (${t(lang, "market.hot")})`));
      }
      lines.push(blank);
      lines.push(dim(t(lang, "market.sellNow")));
    } else {
      lines.push(dim(t(lang, "market.quiet")));
    }
    lines.push(blank);
    lines.push(dim(t(lang, "market.tip")));
    return { lines, minutes: 1 };
  },
};
