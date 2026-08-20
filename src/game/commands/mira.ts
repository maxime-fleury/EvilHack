import type { Command } from "./types";
import { blank, dim, divider, err, info, ok, money, fmtMoney } from "../output";
import { langOf } from "../engine";
import { arcState, arcById, isArcActive, isArcDone } from "../arcs";
import { t } from "../i18n";
import type { Game } from "../engine";

const GIFT_COST = 150;

/** The romance arc lives in g.flags.arcs.mira — read/write it in place. */
function miraState(g: Game): any {
  const states = arcState(g);
  if (!states.mira) states.mira = { step: 0 };
  g.flags.arcs = states;
  return states.mira;
}

export const miraCmd: Command = {
  name: "mira",
  aliases: ["m"],
  usage: "mira [reply | gift | date <flirt|shy|bro>]",
  help: "The girl hacker from 3B. Talk to her, gift her, say the thing.",
  detail: "Mira was fired the same Friday as you and hacks two floors up. Reply, help her with the office coffee machine, bring a gift, and — eventually — say the thing. Optional. Tender. Slightly illegal.",
  run: (g, args) => {
    const lang = langOf(g);
    const lines: ReturnType<typeof dim>[] = [];
    const sub = (args[0] || "").toLowerCase();

    // not discovered yet — she hasn't found you
    if (!isArcActive(g, "mira") && !isArcDone(g, "mira")) {
      return { lines: [err(t(lang, "mira.unknown"))], minutes: 0 };
    }

    const st = miraState(g);

    // ── epilogue after the arc is done ─────────────────────────────────────
    if (isArcDone(g, "mira")) {
      const choice = st.dateChoice === "flirt" ? t(lang, "mira.epFlirt") : st.dateChoice === "shy" ? t(lang, "mira.epShy") : t(lang, "mira.epBro");
      lines.push(divider(t(lang, "mira.title")));
      lines.push(info(t(lang, "mira.status", { s: t(lang, "mira.relationship", { r: choice }) })));
      lines.push(dim(t(lang, "mira.epilogue")));
      lines.push(blank);
      lines.push(dim(t(lang, "mira.perkReminder")));
      return { lines, minutes: 0 };
    }

    if (sub === "reply") {
      if (st.replied) return { lines: [err(t(lang, "mira.alreadyReply"))], minutes: 0 };
      st.replied = true;
      lines.push(ok(t(lang, "mira.replied")));
      lines.push(dim(t(lang, "mira.replyFlavor")));
      lines.push(dim(t(lang, "mira.noroJealous")));
      return { lines, minutes: 5 };
    }

    if (sub === "gift") {
      if (st.gifted) return { lines: [err(t(lang, "mira.alreadyGift"))], minutes: 0 };
      if (g.money < GIFT_COST) return { lines: [err(t(lang, "mira.noMoney", { m: fmtMoney(GIFT_COST) }))], minutes: 0 };
      g.money -= GIFT_COST;
      st.gifted = true;
      lines.push(money(t(lang, "mira.gifted", { m: fmtMoney(GIFT_COST) })));
      lines.push(dim(t(lang, "mira.giftFlavor")));
      return { lines, minutes: 15 };
    }

    if (sub === "date") {
      const choice = (args[1] || "").toLowerCase();
      if (!["flirt", "shy", "bro"].includes(choice)) {
        return { lines: [err(t(lang, "mira.badChoice"))], minutes: 0 };
      }
      if (st.dateChoice) return { lines: [err(t(lang, "mira.alreadyDate"))], minutes: 0 };
      st.dateChoice = choice;
      lines.push(ok(t(lang, `mira.date.${choice}`)));
      lines.push(dim(t(lang, "mira.dateFlavor")));
      lines.push(dim(t(lang, "mira.noroWatching")));
      return { lines, minutes: 10 };
    }

    // ── status: where the romance stands ───────────────────────────────────
    const def = arcById("mira")!;
    const stepIdx = Math.min(st.step, def.steps.length);
    lines.push(divider(t(lang, "mira.title")));
    if (st.replied) lines.push(ok(t(lang, "mira.doneReply")));
    else lines.push(dim(t(lang, "mira.todoReply")));
    if ((g.flags.career as any)?.targetCounts?.["The Office Coffee Machine"]) lines.push(ok(t(lang, "mira.doneCoffee")));
    else lines.push(dim(t(lang, "mira.todoCoffee")));
    if (st.gifted) lines.push(ok(t(lang, "mira.doneGift")));
    else lines.push(dim(t(lang, "mira.todoGift")));
    if (st.dateChoice) lines.push(ok(t(lang, "mira.doneDate")));
    else lines.push(dim(t(lang, "mira.todoDate")));
    lines.push(blank);
    const rel = st.replied ? (st.dateChoice ? t(lang, "mira.relDating") : t(lang, "mira.relFriends")) : t(lang, "mira.relStrangers");
    lines.push(info(t(lang, "mira.status", { s: rel })));
    void stepIdx;
    return { lines, minutes: 0 };
  },
};
