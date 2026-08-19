import type { Command } from "./types";
import { blank, dim, divider, err, info, ok, title } from "../output";
import type { Bilingual } from "../i18n";
import { pick, t } from "../i18n";
import { langOf } from "../engine";

// ── The tutorial ───────────────────────────────────────────────────────────
// A structured, relaunchable guide. `tutorial` shows the table of contents,
// `tutorial <n>` shows one chapter. Every chapter is bilingual and follows the
// game's real mechanics — so re-reading it never goes stale.

interface Chapter {
  n: number;
  title: Bilingual;
  // each entry: { cmd, how, tip } — the command to try, how it works, and a tip
  steps: { cmd: string; how: Bilingual; tip?: Bilingual }[];
  done?: Bilingual; // a little encouragement shown at the end
}

const CHAPTERS: Chapter[] = [
  {
    n: 1,
    title: { en: "Scan & hack — the core loop", fr: "Scan & hack — la boucle de base" },
    steps: [
      {
        cmd: "scan",
        how: { en: "Lists every hackable network around you, with difficulty (1–5), estimated time, payout and heat risk.", fr: "Liste tous les réseaux piratables autour de vous, avec difficulté (1–5), temps estimé, gain et risque de chaleur." },
        tip: { en: "`scan <target>` shows details for one network.", fr: "`scan <cible>` affiche les détails d'un réseau." },
      },
      {
        cmd: "hack <target>",
        how: { en: "Interactive break-in: recon first, then pick a vector — brute (fast, loud), exploit (quiet, needs the right exploit), social (charm, needs a sold dossier).", fr: "Effraction interactive : d'abord la recon, puis choisissez un vecteur — brute (rapide, bruyant), exploit (discret, nécessite le bon exploit), social (le charme, nécessite un dossier vendu)." },
        tip: { en: "If something trips mid-hack, decide: push (risky), cover (slower, safer), or abort (walk away). Failures lock the target for a few hours and spike your heat.", fr: "Si quelque chose se déclenche en plein hack, décidez : forcer (risqué), couvrir vos traces (plus lent, plus sûr), ou abandonner. Un échec verrouille la cible quelques heures et fait monter la chaleur." },
      },
    ],
    done: { en: "That's the heart of the game. Everything else feeds this loop.", fr: "C'est le cœur du jeu. Tout le reste alimente cette boucle." },
  },
  {
    n: 2,
    title: { en: "Missions — the real money", fr: "Missions — le vrai argent" },
    steps: [
      {
        cmd: "missions",
        how: { en: "Shows offers, your active missions and history. Accept one with `missions accept <id>`.", fr: "Affiche les offres, vos missions actives et l'historique. Acceptez-en une avec `missions accept <id>`." },
      },
      {
        cmd: "missions deliver <id>",
        how: { en: "Once you've hacked the mission's target (it appears in your scan list), deliver it for a big payout, rep and style.", fr: "Une fois la cible de la mission piratée (elle apparaît dans votre scan), livrez-la pour un gros gain, de la réputation et du style." },
        tip: { en: "Deadlines are real. Don't be late.", fr: "Les échéances sont réelles. Ne soyez pas en retard." },
      },
    ],
    done: { en: "Some deliveries hide a twist… a big choice will appear. Choose wisely (or don't).", fr: "Certaines livraisons cachent un rebondissement… un grand choix apparaîtra. Choisissez bien (ou pas)." },
  },
  {
    n: 3,
    title: { en: "Shop & upgrades", fr: "Boutique & améliorations" },
    steps: [
      {
        cmd: "shop",
        how: { en: "Browse hardware (CPU, GPU, RAM, VPN…), software exploits and lifestyle items.", fr: "Parcourez le matériel (CPU, GPU, RAM, VPN…), les exploits logiciels et les objets de style." },
        tip: { en: "`buy <id>` purchases and installs it. `inv` shows your gear.", fr: "`buy <id>` achète et installe. `inv` affiche votre équipement." },
      },
      {
        cmd: "buy gpu1",
        how: { en: "A GPU boosts mining income. RAM adds parallel hack slots. A VPN cuts the heat you generate.", fr: "Un GPU booste le minage. La RAM ajoute des emplacements de hack parallèles. Un VPN réduit la chaleur générée." },
      },
    ],
    done: { en: "Upgrade constantly — the game never ends, it only gets faster and richer.", fr: "Améliorez en continu — le jeu ne finit jamais, il devient juste plus rapide et plus riche." },
  },
  {
    n: 4,
    title: { en: "Passive income", fr: "Revenus passifs" },
    steps: [
      {
        cmd: "miner",
        how: { en: "Your crypto rig mines continuously (rate depends on GPU, VPS, programs). `miner start|stop|status` controls it.", fr: "Votre ferme de crypto mine en continu (la cadence dépend du GPU, VPS, programmes). `miner start|stop|status` la contrôle." },
      },
      {
        cmd: "coin",
        how: { en: "PUPPYCOIN: a volatile meme coin. `coin buy <$>`, `coin sell <n>`, `coin sell all`. Definitely not financial advice.", fr: "PUPPYCOIN : une meme coin volatile. `coin buy <$>`, `coin sell <n>`, `coin sell all`. Sûrement pas un conseil financier." },
      },
    ],
    done: { en: "Passive income keeps the lights on between heists.", fr: "Le revenu passif paie les factures entre deux braquages." },
  },
  {
    n: 5,
    title: { en: "Tor — the darknet", fr: "Tor — le darknet" },
    steps: [
      {
        cmd: "tor",
        how: { en: "The fake darknet: hidden services, forums, scams, and the Bazaar where you download programs.", fr: "Le darknet : services cachés, forums, arnaques, et le Bazar où vous téléchargez des programmes." },
        tip: { en: "`tor visit bazaar`, then `tor install <id>` to grab a program (wardialer, proxychain, rootkit…).", fr: "`tor visit bazaar`, puis `tor install <id>` pour récupérer un programme (wardialer, proxychain, rootkit…)." },
      },
    ],
    done: { en: "Careful — some 'deals' are scams. The cat videos are real though.", fr: "Attention — certaines « affaires » sont des arnaques. Les vidéos de chats, elles, sont réelles." },
  },
  {
    n: 6,
    title: { en: "Intel & dossiers", fr: "Renseignements & dossiers" },
    steps: [
      {
        cmd: "people",
        how: { en: "Hacking info-networks drops dossier fragments on people. Collect 3 on someone and you can sell them.", fr: "Pirater des réseaux d'infos fait tomber des fragments de dossier sur des personnes. Récupérez-en 3 sur quelqu'un et vous pourrez le vendre." },
      },
      {
        cmd: "sell <npc>",
        how: { en: "Sells a complete dossier to The Daily Leak for cash. Some people… it's better not to sell.", fr: "Vend un dossier complet à The Daily Leak contre de l'argent. Certaines personnes… mieux vaut ne pas les vendre." },
      },
    ],
    done: { en: "Intel is also your main source of fun side stories (see `arcs`).", fr: "Les renseignements sont aussi votre principale source d'histoires parallèles amusantes (voir `arcs`)." },
  },
  {
    n: 7,
    title: { en: "Progression", fr: "Progression" },
    steps: [
      {
        cmd: "stats",
        how: { en: "Your full sheet: money, rep, heat, style, hardware and derived stats.", fr: "Votre fiche complète : argent, réputation, chaleur, style, matériel et stats dérivées." },
      },
      {
        cmd: "achievements",
        how: { en: "Every action earns XP, every level gives passive perks. 25 trophies (some hidden) are there to collect.", fr: "Chaque action donne de l'XP, chaque niveau donne des perks passifs. 25 trophées (certains cachés) sont à collectionner." },
      },
      {
        cmd: "arcs",
        how: { en: "Optional side stories with big payoffs and permanent stat perks. The Vault, The Spectre, the Gertie Fonds…", fr: "Histoires parallèles facultatives avec de gros gains et des perks de stats permanents. La Voûte, Le Spectre, le Fonds Gertie…" },
      },
    ],
    done: { en: "Rep unlocks titles, factions and harder missions. Keep climbing.", fr: "La réputation débloque des titres, des factions et des missions plus dures. Continuez de grimper." },
  },
  {
    n: 8,
    title: { en: "System & settings", fr: "Système & paramètres" },
    steps: [
      {
        cmd: "settings",
        how: { en: "Language (FR/EN), theme, font size, sounds, animation — and Noro-chan's AI prompt, editable.", fr: "Langue (FR/EN), thème, taille de police, sons, animations — et le prompt IA de Noro-chan, modifiable." },
      },
      {
        cmd: "save · slots · slot",
        how: { en: "The game auto-saves every command. `slots` lists your 3 save slots, `slot <1|2|3>` switches lives.", fr: "Le jeu sauvegarde automatiquement à chaque commande. `slots` liste vos 3 emplacements, `slot <1|2|3>` change de vie." },
      },
      {
        cmd: "poweroff · reboot · screensaver",
        how: { en: "Ambiance: shut Frank down, boot him back up, or summon the floating logo.", fr: "Ambiance : éteignez Frank, redémarrez-le, ou invoquez le logo flottant." },
      },
    ],
    done: { en: "And when it all goes wrong: `reset` wipes the save (it keeps your language and preferences).", fr: "Et si tout va mal : `reset` efface la sauvegarde (il garde votre langue et vos préférences)." },
  },
];

function renderChapter(g: { name: string }, lang: "en" | "fr", ch: Chapter) {
  const lines = [];
  lines.push(divider(`TUTORIAL ${ch.n}/${CHAPTERS.length} — ${pick(lang, ch.title)}`));
  for (const s of ch.steps) {
    lines.push(title(`   ${s.cmd}`));
    lines.push(info(`      ${pick(lang, s.how)}`));
    if (s.tip) lines.push(dim(`      → ${pick(lang, s.tip)}`));
    lines.push(blank);
  }
  if (ch.done) lines.push(dim(`   ${pick(lang, ch.done)}`));
  lines.push(blank);
  lines.push(dim(t(lang, "tutorial.next", { n: ch.n + 1 <= CHAPTERS.length ? ch.n + 1 : 1 })));
  return lines;
}

export const tutorialCmd: Command = {
  name: "tutorial",
  aliases: ["tuto", "guide"],
  usage: "tutorial [start | skip | 1-8]",
  help: "Relaunch the tutorial — the guided walkthrough, or one chapter.",
  detail: "`tutorial start` replays the guided first-hack walkthrough (skippable any time). `tutorial skip` dismisses it. `tutorial` shows the chapters; `tutorial <n>` shows one chapter.",
  run: (g, args) => {
    const lang = langOf(g);
    const lines = [];
    const arg = (args[0] || "").toLowerCase();

    // ── start: replay the guided walkthrough from step 0 ───────────────────
    if (arg === "start" || arg === "replay") {
      g.flags.tutorialStep = 0;
      g.flags.tutorial = {};
      g.flags.tutorialDone = false;
      g.flags.tutorialSkipped = false;
      lines.push(ok(t(lang, "tutorial.restarted")));
      lines.push(info(t(lang, "tutorial.follow", { n: 1 })));
      lines.push(dim("   → scan"));
      lines.push(dim("   → hack <cible>"));
      lines.push(dim("   → missions"));
      lines.push(dim("   → missions deliver <id>"));
      lines.push(blank);
      lines.push(dim(t(lang, "tutorial.skipHint")));
      return { lines, minutes: 0 };
    }

    // ── skip: dismiss the guided walkthrough (replayable later) ────────────
    if (arg === "skip" || arg === "stop") {
      g.flags.tutorialDone = true;
      g.flags.tutorialSkipped = true;
      g.flags.tutorialStep = TUTORIAL_STEPS;
      lines.push(info(t(lang, "tutorial.skipped")));
      lines.push(dim(t(lang, "tutorial.resumeHint")));
      return { lines, minutes: 0 };
    }

    const want = parseInt(args[0] || "", 10);
    if (want) {
      const ch = CHAPTERS.find((c) => c.n === want);
      if (!ch) {
        return { lines: [err(t(lang, "tutorial.noChapter", { n: args[0], max: CHAPTERS.length }))], minutes: 0 };
      }
      return { lines: renderChapter(g, lang, ch), minutes: 0 };
    }

    lines.push(divider(t(lang, "tutorial.title")));
    lines.push(info(t(lang, "tutorial.intro")));
    lines.push(blank);
    for (const ch of CHAPTERS) {
      lines.push(title(`   ${ch.n}. ${pick(lang, ch.title)}`));
      lines.push(dim(`      ${ch.steps.map((s) => s.cmd).join("  ·  ")}`));
      lines.push(blank);
    }
    lines.push(dim(t(lang, "tutorial.open", { n: 1 })));
    lines.push(blank);
    lines.push(dim(t(lang, "tutorial.skippable")));
    lines.push(dim(t(lang, "tutorial.controls")));
    return { lines, minutes: 0 };
  },
};

// the guided walkthrough has 5 steps (scan → hack → missions → deliver → done)
const TUTORIAL_STEPS = 5;
