import type { Command } from "./types";
import type { Line } from "../output";
import { blank, dim, divider, err, info, ok, fmtMoney } from "../output";
import { langOf } from "../engine";
import { ARCS, arcState } from "../arcs";
import { t } from "../i18n";
import { pick } from "../i18n";

export const arcsCmd: Command = {
  name: "arcs",
  aliases: ["side", "stories"],
  usage: "arcs [invest <amount>]",
  help: "Optional side storylines with big, optional payoffs.",
  detail: "Each arc is a chain of steps checked as you play — hack targets, sell dossiers, invest cash. Finish one for a big payout and a permanent perk. Skip them, and the world moves on without you.",
  run: (g, args) => {
    const lang = langOf(g);
    const lines: Line[] = [];

    if ((args[0] || "").toLowerCase() === "invest") {
      const amt = Math.round(parseFloat(args[1] || ""));
      if (!amt || amt < 10) return { lines: [err(t(lang, "arcs.investMin"))], minutes: 0 };
      const states = arcState(g);
      const st = states["gertie"];
      if (!st?.active || st.done) return { lines: [err(t(lang, "arcs.notActive"))], minutes: 0 };
      if (g.money < amt) {
        return { lines: [err(t(lang, "shop.notEnough", { need: fmtMoney(amt), have: fmtMoney(g.money) }))], minutes: 0 };
      }
      g.money -= amt;
      st.invest = (st.invest || 0) + amt;
      if (!st.investDay) st.investDay = g.day;
      states["gertie"] = st;
      g.flags.arcs = states;
      lines.push(ok(t(lang, "arcs.invested", { m: fmtMoney(amt), t: fmtMoney(st.invest) })));
      return { lines, minutes: 5 };
    }

    lines.push(divider(t(lang, "arcs.title")));
    const states = arcState(g);
    const known = ARCS.filter((a) => states[a.id]?.active || states[a.id]?.done);
    if (!known.length) {
      lines.push(dim(t(lang, "arcs.none")));
      return { lines, minutes: 0 };
    }
    for (const a of known) {
      const st = states[a.id];
      const status = st.done ? t(lang, "arcs.done") : t(lang, "arcs.active");
      lines.push(info(`   [${status}] ${pick(lang, a.title)} — ${st.step}/${a.steps.length}`));
      lines.push(dim(`     ${pick(lang, a.blurb)}`));
      for (let i = 0; i < a.steps.length; i++) {
        const mark = i < st.step ? "✔" : i === st.step && !st.done ? "▸" : "○";
        lines.push(dim(`       ${mark} ${pick(lang, a.steps[i].desc)}`));
      }
      lines.push(blank);
    }
    lines.push(dim(t(lang, "arcs.hint")));
    return { lines, minutes: 0 };
  },
};
