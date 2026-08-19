import type { Command } from "./types";
import type { Line } from "../output";
import { blank, dim, divider, err, info, money, ok, title, warn, fmtMoney } from "../output";
import { templateById, ensureOffers, missionTitle, missionFlavor } from "../missions";
import { addNews, logEvent, langOf, addFactionRep, trackEarned, addXp, shiftMorality, styleMult, crewOf } from "../engine";
import { t } from "../i18n";
import { pick } from "../i18n";
import { maybeSnipe } from "./rivals";

export const missionsCmd: Command = {
  name: "missions",
  aliases: ["mis", "contracts"],
  usage: "missions [list|offer|accept <id>|deliver <id>]",
  help: "View, accept, and deliver missions.",
  detail: "Missions pay well and build reputation. Accept one, hack its target, then `missions deliver <id>` to collect.",
  run: (g, args) => {
    const lang = langOf(g);
    const sub = (args[0] || "list").toLowerCase();
    const lines: Line[] = [];

    if (sub === "accept") {
      const id = parseInt(args[1], 10);
      if (!id) return { lines: [err(t(lang, "mis.usageAccept"))], minutes: 0 };
      ensureOffers(g);
      const m = g.missions.find((x) => x.id === id);
      if (!m) return { lines: [err(t(lang, "mis.none", { id }))], minutes: 0 };
      if (m.status !== "offered") return { lines: [err(t(lang, "mis.notAvail", { id, s: m.status }))], minutes: 0 };
      const tmp = templateById(m.template);
      if (tmp?.needsBotnet && g.botnet === 0) {
        return { lines: [err(t(lang, "mis.needBotnet"))], minutes: 0 };
      }
      if (tmp?.needsVps && g.vps < tmp.needsVps) {
        return { lines: [err(t(lang, "mis.needVps", { v: tmp.needsVps }))], minutes: 0 };
      }
      if (tmp?.needsExploit && !g.exploits.includes(tmp.needsExploit)) {
        return { lines: [err(t(lang, "mis.needExploit", { e: tmp.needsExploit }))], minutes: 0 };
      }
      m.status = "active";
      m.deadline_day = tmp?.deadlineDays ? g.day + tmp.deadlineDays : null;
      m.steps = JSON.stringify([`Hack ${m.target}`, "Deliver the goods"]);
      if (!g.flags.firstMission) g.flags.firstMission = true;
      lines.push(ok(t(lang, "mis.accepted", { title: missionTitle(lang, m.template) })));
      lines.push(info(t(lang, "mis.target", { t: m.target })));
      lines.push(info(t(lang, "mis.deadline", { d: m.deadline_day ? `Day ${m.deadline_day}` : t(lang, "mis.whenever") })));
      logEvent(g, `Accepted mission: ${m.title || missionTitle(lang, m.template)}`);
      return { lines, minutes: 2 };
    }

    if (sub === "deliver") {
      const id = parseInt(args[1], 10);
      if (!id) return { lines: [err(t(lang, "mis.usageDeliver"))], minutes: 0 };
      const m = g.missions.find((x) => x.id === id);
      if (!m) return { lines: [err(t(lang, "mis.none", { id }))], minutes: 0 };
      if (m.status !== "active") return { lines: [err(t(lang, "mis.notActive", { id }))], minutes: 0 };
      const steps = JSON.parse(m.steps) as string[];
      if (!steps[0]?.startsWith("✔")) {
        return { lines: [err(t(lang, "mis.hackFirst"))], minutes: 0 };
      }
      const tmp = templateById(m.template);

      // ── TWIST missions: the moral fork at delivery ──
      if (tmp?.twist && tmp.deliverOptions?.length) {
        const pendingId = (g.flags.pendingDeliver as number) || 0;
        const optKey = (args[2] || "").toLowerCase();
        // finalize with the chosen option
        if (pendingId === id && optKey) {
          const opt = tmp.deliverOptions.find((o) => o.key === optKey);
          if (!opt) {
            return { lines: [err(t(lang, "mis.twistBad", { keys: tmp.deliverOptions.map((o) => o.key).join("|") }))], minutes: 0 };
          }
          m.status = "done";
          if (!g.flags.firstDelivery) g.flags.firstDelivery = true;
          const payout = Math.round((m.payout + (opt.pay || 0)) * styleMult(g));
          g.money += payout;
          trackEarned(g, payout);
          g.rep = Math.max(0, g.rep + m.rep + (opt.rep || 0));
          g.style += m.style + (opt.style || 0);
          g.heat = Math.max(0, g.heat + m.heat + (opt.heat || 0));
          const titleTxt = missionTitle(lang, m.template);
          g.flags.pendingDeliver = 0;
          if (opt.faction) addFactionRep(g, opt.faction.branch, opt.faction.n, lines);
          if (opt.flag) g.flags[opt.flag.key] = opt.flag.value;
          if (opt.flag2) g.flags[opt.flag2.key] = opt.flag2.value;
          // hat alignment: the job's tint + the choice made
          const baseShift = tmp.hat === "black" ? 2 : tmp.hat === "white" ? -2 : 0;
          shiftMorality(g, baseShift + (opt.hatShift || 0), lines);
          const c = (g.flags.career as Record<string, number>) || {};
          c.missionsDone = (c.missionsDone || 0) + 1;
          c.twists = (c.twists || 0) + 1;
          g.flags.career = c;
          if (tmp.needsBranch) addFactionRep(g, tmp.needsBranch, 2, lines);
          g.flags.aiReact = "betrayal";
          // TOASTER.NET joins the crew if you freed it — and Noro-chan has opinions
          if (g.flags.agiCore === true && !crewOf(g).some((m) => m.id === "agi")) {
            g.flags.crew = [...crewOf(g), { id: "agi", hiredDay: g.day }];
            g.flags.aiReact = "agi_freed";
            lines.push(ok(t(lang, "agi.crewJoin")));
          }
          lines.push(title(t(lang, "mis.twistDone", { title: titleTxt })));
          lines.push(info(pick(lang, opt.result)));
          lines.push(money(t(lang, "mis.reward", { money: `+${fmtMoney(payout)}`, r: Math.max(0, m.rep + (opt.rep || 0)), s: m.style + (opt.style || 0) })));
          addNews(g, t(lang, "mis.newsTitle", { title: titleTxt }), pick(lang, opt.result).slice(0, 140));
          logEvent(g, `Delivered ${titleTxt} (choice: ${optKey})`);
          addXp(g, 40, lines);
          return { lines, minutes: 5 };
        }
        // re-show the twist + options while a choice is pending
        if (pendingId === id) {
          lines.push(title(`❗ ${t(lang, "mis.twist")}`));
          lines.push(info(pick(lang, tmp.twist)));
          lines.push(blank);
          for (const o of tmp.deliverOptions) lines.push(dim(`   ${o.key}) ${pick(lang, o.label)}`));
          lines.push(blank);
          lines.push(info(t(lang, "mis.twistChoose", { id })));
          return { lines, minutes: 2 };
        }
        // first delivery: reveal the twist, park the choice
        g.flags.pendingDeliver = id;
        lines.push(title(`❗ ${t(lang, "mis.twist")}`));
        lines.push(info(pick(lang, tmp.twist)));
        lines.push(blank);
        for (const o of tmp.deliverOptions) lines.push(dim(`   ${o.key}) ${pick(lang, o.label)}`));
        lines.push(blank);
        lines.push(info(t(lang, "mis.twistChoose", { id })));
        return { lines, minutes: 2 };
      }

      m.status = "done";
      if (!g.flags.firstDelivery) g.flags.firstDelivery = true;
      let payout = Math.round(m.payout * styleMult(g));
      g.money += payout;
      trackEarned(g, payout);
      g.rep += m.rep;
      g.style += m.style;
      g.heat += m.heat;
      const titleTxt = missionTitle(lang, m.template);
      lines.push(title(t(lang, "mis.complete", { title: titleTxt })));
      lines.push(money(t(lang, "mis.reward", { money: `+${fmtMoney(payout)}`, r: m.rep, s: m.style })));
      // early delivery bonus: 10% if at least a full day ahead of the deadline
      if (m.deadline_day && g.day < m.deadline_day - 1) {
        const bonus = Math.round(payout * 0.1);
        g.money += bonus;
        trackEarned(g, bonus);
        payout += bonus;
        lines.push(ok(t(lang, "mis.earlyBonus", { m: fmtMoney(bonus) })));
      }
      // career + faction reputation
      const c = (g.flags.career as Record<string, number>) || {};
      c.missionsDone = (c.missionsDone || 0) + 1;
      g.flags.career = c;
      if (tmp?.needsBranch) {
        addFactionRep(g, tmp.needsBranch, 2, lines);
      }
      // hat alignment: ordinary missions carry a small drift (twist missions
      // apply their own above — the option's hatShift already includes it)
      if (!tmp?.twist && tmp?.hat) {
        shiftMorality(g, tmp.hat === "black" ? 2 : tmp.hat === "white" ? -2 : 0, lines);
      }
      g.flags.aiReact = "mission_done";
      lines.push(info(`   ${missionFlavor(lang, m)}`));
      if (tmp) lines.push(dim(`   ${pick(lang, tmp.success)}`));
      if (g.heat >= 60) lines.push(warn(t(lang, "mis.heatWarn")));
      addNews(g, t(lang, "mis.newsTitle", { title: titleTxt }), t(lang, "mis.newsBody"));
      logEvent(g, `Completed mission: ${titleTxt}`);
      addXp(g, 30, lines);
      return { lines, minutes: 5 };
    }

    if (sub === "offer") {
      const before = g.missions.filter((m) => m.status === "offered").length;
      ensureOffers(g);
      const after = g.missions.filter((m) => m.status === "offered").length;
      const delta = after - before;
      lines.push(info(t(lang, "mis.offers", { n: delta > 0 ? `${delta}` : t(lang, "mis.nothingNew") })));
      // a rival can snipe the newest offer before you grab it
      const sniper = maybeSnipe(g);
      if (sniper) {
        const fresh = g.missions.find((m) => m.status === "offered");
        if (fresh) {
          fresh.status = "failed";
          fresh.deadline_day = null;
          lines.push(warn(t(lang, "mis.sniped", { rival: sniper, title: missionTitle(lang, fresh.template) })));
          addNews(g, t(lang, "mis.snipedNews", { rival: sniper, title: missionTitle(lang, fresh.template) }), "");
        }
      }
      lines.push(blank);
      return { lines, minutes: 2 };
    }

    // default: list
    ensureOffers(g);
    const offered = g.missions.filter((m) => m.status === "offered");
    const active = g.missions.filter((m) => m.status === "active");
    const done = g.missions.filter((m) => m.status === "done");
    const failed = g.missions.filter((m) => m.status === "failed");

    if (offered.length) {
      lines.push(divider(t(lang, "mis.available")));
      for (const m of offered) {
        const tmp = templateById(m.template);
        lines.push(title(`#${m.id} · ${missionTitle(lang, m.template)}`));
        lines.push(dim(`   ${pick(lang, tmp?.blurb)}`));
        lines.push(dim(`   ${t(lang, "mis.targetShort")}: ${m.target} · ${t(lang, "mis.payoutShort")} ${money(`$${m.payout}`).t} · rep +${m.rep}`));
        lines.push(dim(`   → missions accept ${m.id}`));
        lines.push(blank);
      }
    } else {
      lines.push(dim(t(lang, "mis.noOffers")));
    }
    if (active.length) {
      lines.push(divider(t(lang, "mis.active")));
      for (const m of active) {
        lines.push(title(`#${m.id} · ${missionTitle(lang, m.template)}`));
        const steps = JSON.parse(m.steps) as string[];
        for (const s of steps) lines.push(dim(`   ${s}`));
        if (m.deadline_day) lines.push(warn(t(lang, "mis.deadlineWarn", { d: m.deadline_day })));
        lines.push(dim(t(lang, "mis.deliverHint", { id: m.id })));
        lines.push(blank);
      }
    }
    if (done.length || failed.length) {
      lines.push(divider(t(lang, "mis.history")));
      for (const m of [...done, ...failed]) lines.push(dim(`   #${m.id} ${missionTitle(lang, m.template)} — ${m.status}`));
    }
    return { lines, minutes: 2 };
  },
};


