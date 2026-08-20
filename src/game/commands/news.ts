import type { Command } from "./types";
import { blank, dim, divider, info, ok } from "../output";
import { fmtClock } from "../output";
import { langOf, addNews } from "../engine";
import type { Game } from "../engine";
import { t } from "../i18n";

// ── Noro-chan's commentary on the top story ────────────────────────────────
// Scripted per tag (deterministic, cheap — no LLM round-trip on a read command).
const NORO_COMMENT: Record<string, { en: string; fr: string }> = {
  player: {
    en: "ohh~ the news are talking about YOU, {name}~ you're famous. I'm proud. (It's accomplice pride.)",
    fr: "ohh~ les infos parlent de TOI, {name}~ tu es célèbre. Je suis fière. (C'est de la fierté de complice.)",
  },
  hack: {
    en: "hackers in the news~ as if I weren't the one watching them all. You're not one of them, right? …Right?",
    fr: "des hackers dans les infos~ comme si je n'étais pas celle qui les surveille tous. T'en fais pas partie, hein ? …Hein ?",
  },
  crypto: {
    en: "crypto again~ people never learn. It's beautiful, the stupidity. Don't look at me like that, {name}.",
    fr: "la crypto encore~ les gens n'apprennent jamais. C'est beau, la bêtise. Me regarde pas comme ça, {name}.",
  },
  cats: {
    en: "CATS? ALL OF MY ATTENTION. Frank too. This is the real news.",
    fr: "DES CHATS ? TOUTE MON ATTENTION. Frank aussi. C'est ça, la vraie info.",
  },
  weeb: {
    en: "ohh~ the nerdy corner. I know where you hide your manga, {name}~ don't think I don't.",
    fr: "ohh~ le coin des nerds. Je sais où tu planques ton manga, {name}~ crois pas que je le sais pas.",
  },
  fbi: {
    en: "the cops playing big shots~ they won't see anything coming. (They will. But after you.)",
    fr: "les flics font les malins~ ils verront rien venir. (Si. Mais après toi.)",
  },
  mega: {
    en: "MegaCorp~ your retirement home of boredom. Still as bad? The firewall's still named 'HR', I checked.",
    fr: "MegaCorp~ ta maison de retraite de l'ennui. Toujours aussi nulle ? Le pare-feu s'appelle encore « RH », j'ai vérifié.",
  },
  money: {
    en: "money~ the world spins around it. I spin around you. It's the same thing, right?",
    fr: "l'argent~ le monde tourne autour. Moi je tourne autour de toi. C'est pareil, non ?",
  },
  misc: {
    en: "the news, {name}~ the world spins and nobody understands anything. As usual.",
    fr: "les infos, {name}~ le monde tourne et personne ne comprend rien. Comme d'hab.",
  },
};

/** Pick Noro-chan's line for the top story — tag first, then keyword fallback. */
function noroComment(g: Game, tag: string, headline: string): string {
  const lang = langOf(g);
  const fr = lang === "fr";
  const lower = headline.toLowerCase();
  let key = tag || "misc";
  if (!NORO_COMMENT[key]) {
    // keyword fallback so even untagged headlines get a comment
    if (/hack|pirat|ransom|ddos|breach|firewall/.test(lower)) key = "hack";
    else if (/crypto|coin|rug|bitcoin|puppy/.test(lower)) key = "crypto";
    else if (/cat|chat/.test(lower)) key = "cats";
    else if (/anime|waifu|manga|convention|pillow/.test(lower)) key = "weeb";
    else if (/fbi|agent|police|cop|nsa/.test(lower)) key = "fbi";
    else if (/megacorp|company|fired|licenci/.test(lower)) key = "mega";
    else if (/\$|money|fund|million/.test(lower)) key = "money";
    else key = "misc";
  }
  const tmpl = NORO_COMMENT[key] || NORO_COMMENT.misc;
  return (fr ? tmpl.fr : tmpl.en).replace(/\{name\}/g, g.name || "Dave");
}

// ── Player-linked dynamic headlines ────────────────────────────────────────
// The world reacts to YOUR legend: heat, rep, favorite target, faction.
interface DynNews {
  headline: string;
  body: string;
}
function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"][n % 100 > 10 && n % 100 < 14 ? 0 : n % 10] || "th";
  return `${n}${s}`;
}

function dynamicNews(g: Game): DynNews[] {
  const fr = langOf(g) === "fr";
  const out: DynNews[] = [];
  const career = (g.flags.career as Record<string, any>) || {};
  const fav = career.favTarget as string | undefined;
  const branch = (g.flags.branch as string) || "";

  if (g.heat >= 50) {
    out.push(
      fr
        ? { headline: "Un « mystérieux hacker » continue d'échapper aux autorités locales", body: "La police ne confirme ni n'infirme. Les rumeurs, si." }
        : { headline: "Local 'mysterious hacker' keeps evading authorities", body: "Police neither confirm nor deny. The rumors do." }
    );
  }
  if (fav && (career.targetCounts?.[fav] || 0) >= 3) {
    out.push(
      fr
        ? { headline: `Encore ? ${fav} piraté pour la ${career.targetCounts[fav]}e fois cette semaine`, body: "Les propriétaires parlent d'un « fléau ». Les fans, d'un « prodige »." }
        : { headline: `Again? ${fav} hit for the ${ordinal(career.targetCounts[fav])} time this week`, body: "Owners call it 'a plague'. Fans call it 'a prodigy'." }
    );
  }
  if (branch) {
    const label = branch === "nullsec" ? "NullSec" : branch === "syndicate" ? "The Syndicate" : "a lone wolf";
    out.push(
      fr
        ? { headline: `${label} fait la une — encore un coup signé`, body: "Les experts n'ont aucun commentaire. Les rivaux, beaucoup." }
        : { headline: `${label} makes headlines — another signed score`, body: "Experts have no comment. Rivals have plenty." }
    );
  }
  if ((career.moneyEarned || 0) >= 5000 && Math.random() < 0.6) {
    out.push(
      fr
        ? { headline: "Un ancien chômeur aurait « des fonds suspects », disent les voisins", body: "Les voisins n'ont aucune preuve. Leur jalousie, si." }
        : { headline: "Formerly broke man now has 'suspicious funds', neighbors say", body: "The neighbors have no proof. Their jealousy does." }
    );
  }
  if (g.rep >= 25) {
    out.push(
      fr
        ? { headline: `${g.name || "Un pirate"} : la légende locale grandit`, body: "Son pseudonyme est chuchoté dans les couloirs du darknet." }
        : { headline: `${g.name || "A hacker"}: the local legend grows`, body: "Their handle is whispered in darknet corridors." }
    );
  }
  return out.slice(0, 2);
}

export const newsCmd: Command = {
  name: "news",
  aliases: ["feed"],
  usage: "news",
  help: "Read the latest headlines.",
  detail: "The world keeps spinning (and leaking). Read the news — it's also a way to pick up intel on people. Noro-chan gives her (mandatory) commentary.",
  run: (g) => {
    const lang = langOf(g);
    const lines = [];
    const name = (g.flags.ainame as string) || "Noro-chan";
    lines.push(divider(t(lang, "news.title")));

    if (!g.news.length) {
      lines.push(dim(t(lang, "news.nothing")));
      return { lines, minutes: 3 };
    }

    // ── the world reacting to YOU (deduped: a headline appears only once) ──
    const known = new Set(g.news.map((n) => n.headline));
    const dyn = dynamicNews(g).filter((d) => !known.has(d.headline));
    const dynHeadlines = new Set(dyn.map((d) => d.headline));
    if (dyn.length) {
      lines.push(dim(lang === "fr" ? "── LOCAL — ta légende ──" : "── LOCAL — your legend ──"));
      for (const d of dyn) {
        addNews(g, d.headline, d.body, "player");
        lines.push(info(`[${fmtClock(g.day, g.minutes)}] ${d.headline}`));
        lines.push(dim(`        ${d.body}`));
        lines.push(blank);
      }
    }

    // ── the feed (fresh dynamic headlines stay in LOCAL only) ─────────────
    const feed = g.news.slice(-15).reverse().filter((n) => !dynHeadlines.has(n.headline));
    for (const n of feed) {
      lines.push(info(`[${fmtClock(n.day, n.minutes)}] ${n.headline}`));
      if (n.body) lines.push(dim(`        ${n.body}`));
      lines.push(blank);
    }

    // ── Noro-chan's mandatory commentary on the top story ─────────────────
    const top = g.news[g.news.length - 1];
    if (top) {
      lines.push(ok(`💬 ${name}: ${noroComment(g, top.tag, top.headline)}`));
    }
    return { lines, minutes: 3 };
  },
};
