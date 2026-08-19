import type { Command } from "./types";
import { blank, dim, divider, err, info, money, ok, warn, fmtMoney } from "../output";
import { langOf } from "../engine";
import { t } from "../i18n";

export const coinCmd: Command = {
  name: "coin",
  aliases: ["puppycoin", "crypto"],
  usage: "coin [price|buy <n>|sell <n>|sell all]",
  help: "Speculate on PUPPYCOIN. Definitely not a scam.",
  detail: "PUPPYCOIN's price drifts every few in-game hours. Buy low, sell high, lose everything. The classic.",
  run: (g, args) => {
    const lang = langOf(g);
    const sub = (args[0] || "status").toLowerCase();
    const price = g.flags.puppyPrice as number;
    const owned = g.flags.puppyOwned as number;
    const lines = [];

    if (sub === "price") {
      lines.push(money(t(lang, "coin.price", { p: fmtMoney(price) })));
      lines.push(dim(t(lang, "coin.moon")));
      return { lines, minutes: 0 };
    }
    if (sub === "buy") {
      const n = parseFloat(args[1]);
      if (!n || n <= 0) return { lines: [err(t(lang, "coin.buyUsage"))], minutes: 0 };
      const coins = n / price;
      if (g.money < n) return { lines: [err(t(lang, "coin.noMoney", { m: fmtMoney(g.money) }))], minutes: 0 };
      g.money -= n;
      g.flags.puppyOwned = (g.flags.puppyOwned as number) + coins;
      lines.push(ok(t(lang, "coin.bought", { c: coins.toFixed(2), m: fmtMoney(n) })));
      lines.push(warn(t(lang, "coin.dog")));
      if (!g.flags.aiReact) g.flags.aiReact = "coin_buy";
      return { lines, minutes: 5 };
    }
    if (sub === "sell") {
      if (owned <= 0) return { lines: [err(t(lang, "coin.none"))], minutes: 0 };
      let coinsToSell = owned;
      if (args[1] !== "all") {
        const n = parseFloat(args[1]);
        if (!n || n <= 0) return { lines: [err(t(lang, "coin.sellUsage"))], minutes: 0 };
        coinsToSell = Math.min(n, owned);
      }
      const proceeds = coinsToSell * price;
      g.money += proceeds;
      g.flags.puppyOwned = owned - coinsToSell;
      lines.push(ok(t(lang, "coin.sold", { c: coinsToSell.toFixed(2), m: fmtMoney(proceeds) })));
      if (proceeds > 0) lines.push(money(t(lang, "coin.profit")));
      else lines.push(dim(t(lang, "coin.lost")));
      return { lines, minutes: 5 };
    }
    // status
    lines.push(divider(t(lang, "coin.wallet")));
    lines.push(money(t(lang, "coin.price", { p: fmtMoney(price) })));
    lines.push(info(t(lang, "coin.owned", { c: owned.toFixed(2) })));
    lines.push(money(t(lang, "coin.value", { v: fmtMoney(owned * price) })));
    lines.push(dim(t(lang, "coin.actions")));
    lines.push(blank);
    lines.push(dim(t(lang, "coin.disclaimer")));
    return { lines, minutes: 0 };
  },
};
