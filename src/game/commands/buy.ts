import type { Command } from "./types";
import { blank, dim, divider, err, info, money, ok, warn, title, fmtMoney } from "../output";
import { itemById, shopLines } from "../shop";
import { langOf, shopDiscount, addXp, blingOf } from "../engine";
import { t } from "../i18n";

export const buyCmd: Command = {
  name: "buy",
  usage: "buy <item-id>",
  help: "Buy hardware or software from the shop.",
  detail: "Run 'inv' to see your current gear. Run 'buy' with no args to list the shop. Tier items replace your current tier — buy the next one up.",
  run: (g, args) => {
    const lang = langOf(g);
    if (!args[0]) {
      const lines = [...shopLines(lang)];
      lines.push(blank);
      lines.push(dim(t(lang, "shop.buyWith")));
      return { lines, minutes: 2 };
    }
    const it = itemById(args[0].toLowerCase());
    if (!it) return { lines: [err(t(lang, "shop.noItem", { id: args[0] }))], minutes: 0 };
    const disc = shopDiscount(g);
    const price = Math.round(it.price * disc);
    if (g.money < price) {
      return { lines: [err(t(lang, "shop.notEnough", { need: fmtMoney(price), have: fmtMoney(g.money) }))], minutes: 0 };
    }
    if (it.requiresRep && g.rep < it.requiresRep) {
      return { lines: [err(t(lang, "tor.needRep", { r: it.requiresRep, have: g.rep }))], minutes: 0 };
    }
    // tier check
    if (it.slot === "cpu" || it.slot === "gpu" || it.slot === "ram" || it.slot === "vpn" || it.slot === "botnet" || it.slot === "vps") {
      const current = g[it.slot];
      if (it.tier! <= current) {
        return { lines: [warn(t(lang, "shop.better", { slot: it.slot }))], minutes: 0 };
      }
    }
    if (it.slot === "exploit") {
      if (it.id_exp && g.exploits.includes(it.id_exp)) {
        return { lines: [warn(t(lang, "shop.owned", { name: it.name }))], minutes: 0 };
      }
    }
    if (it.slot === "misc") {
      const key = it.id as "rgb" | "chair" | "toaster" | "cam";
      const bling = blingOf(g);
      if (g[key] || bling.includes(it.id)) return { lines: [warn(t(lang, "shop.oneIsEnough", { name: it.name }))], minutes: 0 };
    }
    g.money -= price;
    const lines = [ok(t(lang, "shop.purchased", { name: it.name })), money(t(lang, "shop.balance", { price: fmtMoney(price), bal: fmtMoney(g.money) }))];
    if (it.slot === "cpu" || it.slot === "gpu" || it.slot === "ram" || it.slot === "vpn" || it.slot === "botnet" || it.slot === "vps") {
      const wasVps = g.vps;
      g[it.slot] = it.tier!;
      lines.push(info(t(lang, "shop.installed", { effect: it.effect ? pickEffect(it.effect, lang) : "" })));
      if (it.slot === "vps" && wasVps === 0) {
        lines.push(ok(t(lang, "vps.unlock")));
        if (!g.flags.aiReact) g.flags.aiReact = "vps_bought";
      }
    }
    if (it.slot === "exploit") {
      g.exploits.push(it.id_exp!);
      lines.push(info(t(lang, "shop.installed", { effect: it.effect ? pickEffect(it.effect, lang) : "" })));
    }
    if (it.price >= 400) g.flags.aiReact = "big_purchase";
    if (it.slot === "misc") {
      const key = it.id as "rgb" | "chair" | "toaster" | "cam";
      const BLING_STYLE: Record<string, number> = { neon: 60, gold: 120, holo: 90, bass: 80, throne: 150, cape: 50 };
      const BLING_HEAT: Record<string, number> = { neon: 4, bass: 15 };
      if (it.id in BLING_STYLE) {
        g.flags.bling = [...blingOf(g), it.id];
        g.style += BLING_STYLE[it.id];
        g.heat += BLING_HEAT[it.id] || 0;
        lines.push(info(t(lang, "shop.bling", { id: it.id })));
        if (BLING_HEAT[it.id]) lines.push(warn(t(lang, "shop.blingHeat", { h: BLING_HEAT[it.id] })));
      } else {
        g[key] = 1;
        if (it.id === "rgb") {
          g.style += 50;
          lines.push(info(t(lang, "shop.rgb")));
        } else if (it.id === "chair") {
          g.style += 30;
          lines.push(info(t(lang, "shop.chair")));
        } else if (it.id === "toaster") {
          g.heat += 5;
          lines.push(warn(t(lang, "shop.toaster")));
        } else if (it.id === "cam") {
          g.style -= 5;
          lines.push(dim(t(lang, "shop.cam")));
        }
      }
    }
    addXp(g, 5, lines);
    return { lines, minutes: 5 };
  },
};

function pickEffect(effect: { en: string; fr: string }, lang: string): string {
  return effect[lang as "en" | "fr"] ?? effect.en;
}

export const shopCmd: Command = {
  name: "shop",
  usage: "shop",
  help: "Browse the shop — hardware, software, lifestyle items.",
  detail: "Lists everything Jerry sells, grouped by category. Buy with 'buy <id>'.",
  run: (g) => {
    const lang = langOf(g);
    const lines: import("../output").Line[] = [];
    lines.push(title(t(lang, "shop.title")));
    lines.push(dim(t(lang, "shop.jerry")));
    lines.push(...shopLines(lang));
    return { lines, minutes: 2 };
  },
};

export const invCmd: Command = {
  name: "inv",
  aliases: ["inventory"],
  usage: "inv",
  help: "Show your current gear and exploits.",
  detail: "Lists installed hardware, software exploits, and lifestyle items.",
  run: (g) => {
    const lang = langOf(g);
    const lines = [];
    lines.push(divider(t(lang, "inv.title", { name: g.name })));
    lines.push(dim(`   CPU: ${["Potato 2000 (stock)", "Toaster X", "Hamster i5", "The Boring i9", "Quantum Potato"][g.cpu]}`));
    lines.push(dim(`   GPU: ${["Onboard Graphics (stock)", "GTX 760 Ti 'Grandma'", "RTX 3090 'Space Heater'", "RTX 5090 'Fusion'", "Quantum Toaster"][g.gpu]}`));
    lines.push(dim(`   RAM: ${["Stock 512MB", "4GB 'for the tabs'", "16GB 'for the tabs²'", "64GB 'for the tabs³'"][g.ram]}`));
    lines.push(dim(`   VPN: ${["None (you are everyone's problem)", "Free Proxy 'TotallyAnonymous'", "Le VPN", "NordVPN (actually works)"][g.vpn]}`));
    lines.push(dim(`   Botnet: ${["None", "Elderly Printers LLC (starter)", "Elderly Printers LLC (premium)"][g.botnet]}`));
    if (g.vps > 0) lines.push(dim(`   VPS: ${["Potato VPS", "Gamer VPS", "Offshore Darknet VPS"][g.vps - 1]}`));
    if (g.exploits.length) lines.push(dim(`   Exploits: ${g.exploits.join(", ")}`));
    if ((g.flags.programs as string[])?.length) {
      lines.push(dim(`   Tor programs: ${((g.flags.programs as string[]) || []).join(", ")}`));
    }
    const misc = [];
    if (g.rgb) misc.push("RGB Strip");
    if (g.chair) misc.push("Gamer Chair");
    if (g.toaster) misc.push("Crypto Toaster");
    if (g.cam) misc.push("Security Camera (for the cat)");
    for (const id of blingOf(g)) {
      const names: Record<string, string> = { neon: "Neon Underglow", gold: "Gold-Plated Frank", holo: "Holo Anime Projector", bass: "Certified BASS", throne: "Throne of Villainy", cape: "Hacker Cape" };
      if (names[id]) misc.push(names[id]);
    }
    lines.push(dim(t(lang, "inv.lifestyle", { l: misc.length ? misc.join(", ") : t(lang, "inv.nothing") })));
    lines.push(blank);
    lines.push(dim(t(lang, "inv.upgrade")));
    return { lines, minutes: 0 };
  },
};
