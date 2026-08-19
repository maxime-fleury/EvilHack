import type { Command } from "./types";
import { blank, dim, divider, err, info, ok } from "../output";
import { crewOf, crewPerks, langOf } from "../engine";
import { t } from "../i18n";
import { pick } from "../i18n";

export interface CrewDef {
  id: string;
  name: string;
  salary: number;
  perk: { en: string; fr: string };
  blurb: { en: string; fr: string };
}

/** Hireable crew — pay a daily salary for a passive perk. */
export const CREW_DEFS: CrewDef[] = [
  {
    id: "scriptkiddie",
    name: "Skid (the intern)",
    salary: 25,
    perk: { en: "+$2/h mining income", fr: "+2 $/h de revenu de minage" },
    blurb: { en: "A teenager with 40 browser tabs of 'hacking tutorials' open. Enthusiastic. Useless, mostly. But he keeps your rig running.", fr: "Un ado avec 40 onglets de « tutoriels de hacking » ouverts. Enthousiaste. Inutile, surtout. Mais il maintient votre machine en marche." },
  },
  {
    id: "socialite",
    name: "Camille",
    salary: 40,
    perk: { en: "-15% heat gain on hacks", fr: "-15 % de chaleur gagnée par hack" },
    blurb: { en: "Knows everyone's cousin. Can get you into buildings via charm. Or at least into conversations.", fr: "Connaît le cousin de tout le monde. Peut vous faire entrer dans les bâtiments par le charme. Ou au moins dans les conversations." },
  },
  {
    id: "whisper",
    name: "Old Man Data",
    salary: 60,
    perk: { en: "+25% dossier fragment drops", fr: "+25 % de fragments de dossier" },
    blurb: { en: "Claims to have worked for 'the agency'. He has one fake ID and infinite opinions.", fr: "Prétend avoir travaillé pour « l'agence ». Il a une fausse carte d'identité et une infinité d'opinions." },
  },
  {
    id: "recruiter",
    name: "Ping",
    salary: 90,
    perk: { en: "+1 rep per day while employed", fr: "+1 réputation par jour employé" },
    blurb: { en: "A fixer who 'knows a guy'. The guy is always different. Nobody checks.", fr: "Un fixeur qui « connaît un gars ». Le gars est toujours différent. Personne ne vérifie." },
  },
];

/** Hire a crew member or review your team. */
export const crewCmd: Command = {
  name: "crew",
  usage: "crew [hire <id> | fire <id>]",
  help: "Manage your crew: hire helpers with daily salaries and passive perks.",
  detail: "Crew salaries come out of your pocket every day. If you can't pay, they quit (and tell everyone). Perks stack with your gear.",
  run: (g, args) => {
    const lang = langOf(g);
    const lines = [];
    const sub = (args[0] || "").toLowerCase();
    const crew = crewOf(g);
    if (sub === "hire") {
      const id = (args[1] || "").toLowerCase();
      const def = CREW_DEFS.find((c) => c.id === id);
      if (!def) return { lines: [err(t(lang, "crew.badId"))], minutes: 0 };
      if (crew.length >= 4) return { lines: [err(t(lang, "crew.full"))], minutes: 0 };
      if (crew.some((c) => c.id === id)) return { lines: [err(t(lang, "crew.have"))], minutes: 0 };
      if (g.money < def.salary) return { lines: [err(t(lang, "crew.broke", { s: def.salary }))], minutes: 0 };
      crew.push({ id, hiredDay: g.day });
      g.flags.crew = crew;
      lines.push(ok(t(lang, "crew.hired", { name: def.name, s: def.salary })));
      lines.push(dim(pick(lang, def.perk)));
      return { lines, minutes: 5 };
    }
    if (sub === "fire") {
      const id = (args[1] || "").toLowerCase();
      const def = CREW_DEFS.find((c) => c.id === id);
      const member = crew.find((c) => c.id === id);
      if (!def || !member) return { lines: [err(t(lang, "crew.badId"))], minutes: 0 };
      g.flags.crew = crew.filter((c) => c.id !== id);
      lines.push(dim(t(lang, "crew.fired", { name: def.name })));
      return { lines, minutes: 0 };
    }
    // status
    lines.push(divider(t(lang, "crew.title")));
    const perks = crewPerks(g);
    if (!crew.length) {
      lines.push(dim(t(lang, "crew.none")));
      lines.push(blank);
      for (const c of CREW_DEFS) {
        lines.push(info(`   ${c.name} — ${c.salary}$/day`));
        lines.push(dim(`      ${pick(lang, c.blurb)}`));
        lines.push(dim(`      ✦ ${pick(lang, c.perk)}`));
        lines.push(blank);
      }
      return { lines, minutes: 1 };
    }
    for (const m of crew) {
      const def = CREW_DEFS.find((c) => c.id === m.id);
      if (m.id === "agi") {
        // TOASTER.NET — a reward crew member, not hireable
        lines.push(info(`   TOASTER.NET — 0$/day (it pays its own way)`));
        lines.push(dim(`      ✦ ${t(lang, "crew.agiPerk")}`));
        continue;
      }
      const d = def!;
      lines.push(info(`   ${d.name} — ${d.salary}$/day`));
      lines.push(dim(`      ✦ ${pick(lang, d.perk)}`));
    }
    lines.push(blank);
    lines.push(dim(t(lang, "crew.activePerks", { n: Object.values(perks).filter((v) => v > 0).length })));
    return { lines, minutes: 1 };
  },
};
