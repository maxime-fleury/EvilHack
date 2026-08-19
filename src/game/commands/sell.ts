import type { Command } from "./types";
import { blank, dim, divider, err, info, money, ok, warn, fmtMoney } from "../output";
import { getNpc, NPCS } from "../world";
import { addNews, logEvent, langOf, addXp } from "../engine";
import { t } from "../i18n";
import { pick } from "../i18n";

export const peopleCmd: Command = {
  name: "people",
  aliases: ["contacts", "dossiers"],
  usage: "people",
  help: "List people you have intel on.",
  detail: "Shows discovered contacts and their dossier progress. Hack their employer or read the news to collect fragments (3/3 to sell).",
  run: (g) => {
    const lang = langOf(g);
    const lines = [];
    lines.push(divider(t(lang, "people.title")));
    if (!g.contacts.length) {
      lines.push(dim(t(lang, "people.nobody")));
      return { lines, minutes: 0 };
    }
    for (const c of g.contacts) {
      const npc = getNpc(c.npc);
      if (!npc) continue;
      const frag = "●".repeat(c.fragments) + "○".repeat(3 - c.fragments);
      const status = c.sold ? t(lang, "people.sold") : c.fragments >= 3 ? t(lang, "people.ready") : "";
      lines.push(info(`   ${npc.name} — ${pick(lang, npc.role)}`));
      lines.push(dim(`     dossier ${frag} ${status ? `[${status}]` : ""}`));
      if (c.sold) lines.push(dim(`     ${pick(lang, npc.salePunchline)}`));
      else if (c.fragments >= 3) lines.push(dim(`     → sell ${npc.id}`));
      else lines.push(dim(t(lang, "people.hint", { e: npc.employer })));
      lines.push(blank);
    }
    return { lines, minutes: 0 };
  },
};

export const sellCmd: Command = {
  name: "sell",
  usage: "sell <npc-id>",
  help: "Sell a completed dossier to The Daily Leak.",
  detail: "Requires 3/3 dossier fragments. The price depends on how juicy the person is.",
  run: (g, args) => {
    const lang = langOf(g);
    if (!args[0]) {
      return { lines: [err(t(lang, "sell.usage"))], minutes: 0 };
    }
    const npc = getNpc(args[0]);
    if (!npc) return { lines: [err(t(lang, "sell.noNpc", { n: args[0] }))], minutes: 0 };
    const c = g.contacts.find((x) => x.npc === npc.id);
    if (!c || c.fragments < 3) {
      return { lines: [warn(t(lang, "sell.noDossier", { n: npc.name, f: c?.fragments ?? 0 }))], minutes: 0 };
    }
    if (c.sold) return { lines: [warn(t(lang, "sell.sold", { n: npc.name }))], minutes: 0 };
    const price = Math.round(npc.juice * (1 + g.rep / 100));
    g.money += price;
    g.style += 10;
    c.sold = 1;
    const car = (g.flags.career as Record<string, number>) || {};
    car.dossiersSold = (car.dossiersSold || 0) + 1;
    g.flags.career = car;
    const lines = [
      ok(t(lang, "sell.ok", { n: npc.name })),
      money(t(lang, "sell.money", { m: fmtMoney(price), j: npc.juice })),
      info(`   ${pick(lang, npc.salePunchline)}`),
    ];
    if (npc.id === "pierre") {
      lines.push(warn(t(lang, "sell.pierre")));
      g.rep = Math.max(0, g.rep - 5);
      lines.push(dim(t(lang, "sell.pierreRep")));
    }
    if (npc.id === "kowalski") {
      lines.push(warn(t(lang, "sell.kowalski")));
    }
    addNews(g, t(lang, "sell.newsTitle", { n: npc.name }), pick(lang, npc.salePunchline));
    logEvent(g, `Sold ${npc.name}'s dossier.`);
    if (!g.flags.aiReact) g.flags.aiReact = "big_sale";
    addXp(g, 20, lines);
    return { lines, minutes: 5 };
  },
};

// make sure every NPC can be discovered through some path hints
export function discoverHint(): string {
  return NPCS.map((n) => n.employer).join(", ");
}
