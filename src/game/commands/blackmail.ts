import type { Command } from "./types";
import { dim, err, info, money, ok, warn, title, fmtMoney } from "../output";
import { getNpc } from "../world";
import { addNews, logEvent, langOf, addXp, shiftMorality, trackEarned } from "../engine";
import { t } from "../i18n";
import { pick } from "../i18n";

// ── Blackmail: the edgy part of the business ───────────────────────────────
// Requires a completed 3/3 dossier. Three plays: cash (money), favor (heat
// wipe), burn (expose them). Everyone gets one shot. Shake down too many
// people in one day and one of them shakes back.

export const blackmailCmd: Command = {
  name: "blackmail",
  aliases: ["chantage", "bm"],
  usage: "blackmail <npc-id> [cash|favor|burn]",
  help: "Shake down someone whose dossier you've completed.",
  detail: "Requires 3/3 fragments. cash = money, favor = they cool your heat, burn = you expose them. Too many shakes in one day, and one of them shakes back.",
  run: (g, args) => {
    const lang = langOf(g);
    const lines = [];
    if (!args[0]) return { lines: [err(t(lang, "bm.usage"))], minutes: 0 };
    const npc = getNpc(args[0]);
    if (!npc) return { lines: [err(t(lang, "bm.noNpc", { n: args[0] }))], minutes: 0 };
    const c = g.contacts.find((x) => x.npc === npc.id);
    if (!c || c.fragments < 3) {
      return { lines: [warn(t(lang, "bm.noDossier", { n: npc.name, f: c?.fragments ?? 0 }))], minutes: 0 };
    }
    if (c.sold) return { lines: [warn(t(lang, "bm.sold", { n: npc.name }))], minutes: 0 };
    const blackmailed = (g.flags.blackmailed as string[]) || [];
    if (blackmailed.includes(npc.id)) return { lines: [warn(t(lang, "bm.already", { n: npc.name }))], minutes: 0 };
    // the mole is handled — no loose ends allowed
    if (npc.id === "vautour" && g.flags.merleChoice) {
      return { lines: [warn(t(lang, "bm.merleDone"))], minutes: 0 };
    }
    const opt = (args[1] || "cash").toLowerCase();
    if (!["cash", "favor", "burn"].includes(opt)) {
      return { lines: [err(t(lang, "bm.badOpt", { o: opt }))], minutes: 0 };
    }

    // ── THE TWIST: shake too many hands in one day and one bites back ──
    const countToday = (g.flags.blackmailDay as number) === g.day ? ((g.flags.blackmailCount as number) || 0) : 0;
    if (countToday >= 2) {
      const lose = Math.round(g.money * 0.15);
      g.money = Math.max(0, g.money - lose);
      g.heat += 12;
      lines.push(title(t(lang, "bm.stingTitle")));
      lines.push(info(t(lang, "bm.stingBody", { n: npc.name })));
      lines.push(warn(t(lang, "bm.stingMoney", { m: fmtMoney(lose) })));
      lines.push(dim(t(lang, "bm.stingLesson")));
      addNews(g, t(lang, "bm.stingNews"), t(lang, "bm.stingNewsBody"));
      logEvent(g, `Blackmail sting: ${npc.name} set me up.`);
      if (!g.flags.aiReact) g.flags.aiReact = "blackmail";
      addXp(g, 10, lines);
      return { lines, minutes: 15 };
    }
    g.flags.blackmailDay = g.day;
    g.flags.blackmailCount = countToday + 1;

    // ── THE AGENT: Vautour has a special flow (and special consequences) ──
    if (npc.id === "vautour") {
      if (opt === "cash") {
        const pay = npc.juice * 5;
        g.money += pay;
        trackEarned(g, pay);
        g.heat += 10;
        g.flags.merleChoice = "cash";
        lines.push(title(t(lang, "bm.vautourCashTitle")));
        lines.push(info(t(lang, "bm.vautourCashBody")));
        lines.push(money(t(lang, "bm.paid", { m: fmtMoney(pay) })));
        lines.push(warn(t(lang, "bm.vautourCashHeat")));
        addNews(g, t(lang, "bm.vautourNews"), t(lang, "bm.vautourNewsBody"));
        shiftMorality(g, 6, lines);
      } else if (opt === "favor") {
        g.heat = Math.max(0, g.heat - 30);
        g.flags.merleChoice = "favor";
        lines.push(title(t(lang, "bm.vautourFavorTitle")));
        lines.push(info(t(lang, "bm.vautourFavorBody")));
        lines.push(ok(t(lang, "bm.heatWiped")));
        lines.push(dim(t(lang, "bm.vautourFavorHint")));
        shiftMorality(g, 5, lines);
      } else {
        // burn the mole
        g.rep += 10;
        g.style += 15;
        g.heat += 12;
        c.sold = 1;
        g.flags.merleChoice = "burn";
        lines.push(title(t(lang, "bm.vautourBurnTitle")));
        lines.push(info(t(lang, "bm.vautourBurnBody")));
        lines.push(ok(t(lang, "bm.vautourBurnRep", { r: 10, s: 15 })));
        lines.push(warn(t(lang, "bm.vautourBurnHeat")));
        addNews(g, t(lang, "bm.vautourBurnNews"), t(lang, "bm.vautourBurnNewsBody"));
        shiftMorality(g, 7, lines);
      }
      markBlackmailed(g, npc.id);
      lines.push(dim(t(lang, "bm.merleHook")));
      if (!g.flags.aiReact) g.flags.aiReact = "blackmail";
      addXp(g, 30, lines);
      logEvent(g, `Blackmailed ${npc.name} (${opt}).`);
      return { lines, minutes: 10 };
    }

    // ── Everyone else ──
    if (opt === "cash") {
      const pay = Math.round(npc.juice * 2.2);
      g.money += pay;
      trackEarned(g, pay);
      g.heat += 2;
      g.style += 3;
      lines.push(title(t(lang, "bm.cashTitle", { n: npc.name })));
      lines.push(info(pick(lang, npc.salePunchline)));
      lines.push(money(t(lang, "bm.paid", { m: fmtMoney(pay) })));
      lines.push(dim(t(lang, "bm.cashHint", { n: npc.name })));
      shiftMorality(g, 4, lines);
    } else if (opt === "favor") {
      g.heat = Math.max(0, g.heat - 20);
      lines.push(title(t(lang, "bm.favorTitle", { n: npc.name })));
      lines.push(info(t(lang, "bm.favorBody", { n: npc.name })));
      lines.push(ok(t(lang, "bm.heatWiped")));
      shiftMorality(g, 3, lines);
    } else {
      g.rep += 2;
      g.style += 6;
      g.heat += 5;
      c.sold = 1;
      lines.push(title(t(lang, "bm.burnTitle", { n: npc.name })));
      lines.push(info(pick(lang, npc.salePunchline)));
      lines.push(ok(t(lang, "bm.burnRep", { r: 2, s: 6 })));
      lines.push(warn(t(lang, "bm.burnHeat")));
      addNews(g, t(lang, "bm.burnNews", { n: npc.name }), pick(lang, npc.salePunchline));
      shiftMorality(g, 5, lines);
    }
    markBlackmailed(g, npc.id);
    if (!g.flags.aiReact) g.flags.aiReact = "blackmail";
    addXp(g, 20, lines);
    logEvent(g, `Blackmailed ${npc.name} (${opt}).`);
    return { lines, minutes: 8 };
  },
};

function markBlackmailed(g: any, id: string) {
  const blackmailed = (g.flags.blackmailed as string[]) || [];
  if (!blackmailed.includes(id)) blackmailed.push(id);
  g.flags.blackmailed = blackmailed;
  const car = (g.flags.career as Record<string, number>) || {};
  car.blackmails = (car.blackmails || 0) + 1;
  g.flags.career = car;
}
