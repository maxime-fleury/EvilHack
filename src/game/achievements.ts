import type { Game } from "./engine";
import type { Bilingual } from "./i18n";
import { pick } from "./i18n";
import type { Line } from "./output";

// ── Achievements (trophies) ────────────────────────────────────────────────
// The catalog only declares conditions — the checking logic lives in engine.ts
// (which owns XP, news and translation), so there's no import cycle.

export interface Achievement {
  id: string;
  title: Bilingual;
  desc: Bilingual;
  xp: number; // reward in XP
  hidden?: boolean; // locked entries show as "???"
  check: (g: Game) => boolean;
}

const f = (g: Game) => g.flags;
const c = (g: Game) => ((g.flags.career as Record<string, any>) || {});
const has = (g: Game, id: string) => (f(g).achievements as string[] || []).includes(id);

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_scan", xp: 15,
    title: { en: "First Scan", fr: "Premier Scan" },
    desc: { en: "See what's out there.", fr: "Voir ce qui traîne dehors." },
    check: (g) => f(g).firstScan === true,
  },
  {
    id: "first_hack", xp: 30,
    title: { en: "First Blood", fr: "Premier Sang" },
    desc: { en: "Complete your first hack.", fr: "Terminer votre premier hack." },
    check: (g) => (c(g).hacksDone || 0) >= 1,
  },
  {
    id: "first_mission", xp: 40,
    title: { en: "First Paycheck", fr: "Premier Salaire" },
    desc: { en: "Deliver your first mission.", fr: "Livrer votre première mission." },
    check: (g) => (c(g).missionsDone || 0) >= 1,
  },
  {
    id: "first_dossier", xp: 35,
    title: { en: "Dirt Digger", fr: "Chercheur de Poubelles" },
    desc: { en: "Sell your first dossier to The Daily Leak.", fr: "Vendre votre premier dossier à The Daily Leak." },
    check: (g) => g.contacts.some((x) => x.sold),
  },
  {
    id: "broke", xp: 25, hidden: true,
    title: { en: "Broke Again", fr: "Re-Fauché" },
    desc: { en: "Drop below $1. An art form.", fr: "Passer sous 1 $. Un art." },
    check: (g) => g.money < 1 && g.day > 1,
  },
  {
    id: "rich", xp: 50,
    title: { en: "Money Bags", fr: "Sac à Fric" },
    desc: { en: "Hold $1,000 in cash.", fr: "Détenir 1 000 $ en liquide." },
    check: (g) => g.money >= 1000,
  },
  {
    id: "baller", xp: 100,
    title: { en: "Baller", fr: "Riche de Ouf" },
    desc: { en: "Hold $10,000 in cash.", fr: "Détenir 10 000 $ en liquide." },
    check: (g) => g.money >= 10000,
  },
  {
    id: "heatwave", xp: 40, hidden: true,
    title: { en: "Too Hot", fr: "Trop Chaud" },
    desc: { en: "Reach 100 heat. They're definitely watching.", fr: "Atteindre 100 de chaleur. Ils vous regardent, c'est sûr." },
    check: (g) => g.heat >= 100,
  },
  {
    id: "survivor", xp: 40,
    title: { en: "Heat Survivor", fr: "Survivant de la Chaleur" },
    desc: { en: "Survive a heat event — bribe or bunker.", fr: "Survivre à un événement de chaleur — pot-de-vin ou planque." },
    check: (g) => f(g).survivedHeat === true,
  },
  {
    id: "level5", xp: 60,
    title: { en: "Skilled", fr: "Compétent" },
    desc: { en: "Reach level 5.", fr: "Atteindre le niveau 5." },
    check: (g) => Math.floor(Math.sqrt(((f(g).xp as number) || 0) / 100)) + 1 >= 5,
  },
  {
    id: "level10", xp: 150,
    title: { en: "Legend", fr: "Légende" },
    desc: { en: "Reach level 10.", fr: "Atteindre le niveau 10." },
    check: (g) => Math.floor(Math.sqrt(((f(g).xp as number) || 0) / 100)) + 1 >= 10,
  },
  {
    id: "maxgear", xp: 120,
    title: { en: "Full Kit", fr: "Matos Complet" },
    desc: { en: "Own every hardware tier: Quantum Potato, Quantum Toaster, the works.", fr: "Posséder tous les paliers : Quantum Potato, Quantum Toaster, tout." },
    check: (g) => g.cpu >= 4 && g.gpu >= 4 && g.ram >= 3 && g.vpn >= 3 && g.vps >= 3 && g.botnet >= 2,
  },
  {
    id: "toruser", xp: 35,
    title: { en: "Deep Web Native", fr: "Natif du Web Profond" },
    desc: { en: "Install a program from the Bazaar.", fr: "Installer un programme du Bazar." },
    check: (g) => ((f(g).programs as string[]) || []).length >= 1,
  },
  {
    id: "hero", xp: 100, hidden: true,
    title: { en: "The Good Guy", fr: "Le Gentil" },
    desc: { en: "Choose redemption in a twist. Your conscience thanks you.", fr: "Choisir la rédemption dans un twist. Votre conscience vous remercie." },
    check: (g) => f(g).hero === true,
  },
  {
    id: "villain", xp: 100, hidden: true,
    title: { en: "The Bad Guy", fr: "Le Méchant" },
    desc: { en: "Choose the money in a twist. Twice. Some things you can't undo.", fr: "Choisir l'argent dans un twist. Deux fois. Certaines choses ne s'annulent pas." },
    check: (g) => (f(g).betrayals as number || 0) >= 2,
  },
  {
    id: "botnet", xp: 60,
    title: { en: "Printer Whisperer", fr: "Chuchoteur d'Imprimantes" },
    desc: { en: "Complete a botnet mission. The printers obey.", fr: "Terminer une mission botnet. Les imprimantes obéissent." },
    check: (g) => g.missions.some((m) => m.status === "done" && ["puppyddos", "printerrevenge", "ddosddosers"].includes(m.template)),
  },
  {
    id: "puppy", xp: 50, hidden: true,
    title: { en: "Diamond Hands", fr: "Mains de Diamant" },
    desc: { en: "Hold 100,000 PUPPYCOIN. The dog is confused.", fr: "Détenir 100 000 PUPPYCOIN. Le chien est confus." },
    check: (g) => (f(g).puppyOwned as number || 0) >= 100000,
  },
  {
    id: "miner", xp: 50,
    title: { en: "Space Heater", fr: "Radiateur" },
    desc: { en: "Mine $100 total. Your apartment is warm now.", fr: "Miner 100 $ au total. Votre appartement est chaud, maintenant." },
    check: (g) => (f(g).miningTotal as number || 0) >= 100,
  },
  {
    id: "hacker10", xp: 60,
    title: { en: "Career Criminal", fr: "Criminel de Carrière" },
    desc: { en: "Complete 10 hacks.", fr: "Terminer 10 hacks." },
    check: (g) => (c(g).hacksDone || 0) >= 10,
  },
  {
    id: "elite", xp: 80,
    title: { en: "Elite", fr: "Élite" },
    desc: { en: "Reach 50 reputation.", fr: "Atteindre 50 de réputation." },
    check: (g) => g.rep >= 50,
  },
  {
    id: "nightowl", xp: 30, hidden: true,
    title: { en: "Night Owl", fr: "Oiseau de Nuit" },
    desc: { en: "Be awake in-game past 10 PM. Frank doesn't sleep either.", fr: "Être éveillé après 22 h en temps de jeu. Frank ne dort pas non plus." },
    check: (g) => { const h = Math.floor(g.minutes / 60) % 24; return h >= 22 || h < 5; },
  },
  {
    id: "franklover", xp: 80, hidden: true,
    title: { en: "Frank's Favorite", fr: "Le Chouchou de Frank" },
    desc: { en: "Wipe Frank's partition. Give him peace.", fr: "Effacer la partition de Frank. Lui donner la paix." },
    check: (g) => f(g).frankWiped === true,
  },
  {
    id: "whistleblower", xp: 80, hidden: true,
    title: { en: "Whistleblower", fr: "Lanceur d'Alerte" },
    desc: { en: "Sell Frank's partition to the press. Carol is silent.", fr: "Vendre la partition de Frank à la presse. Carol se tait." },
    check: (g) => (f(g).frankSold as number || 0) >= 1,
  },
  {
    id: "catlover", xp: 40,
    title: { en: "Cat Person", fr: "Personne à Chats" },
    desc: { en: "Complete the Great Cat Pic Heist. For the culture.", fr: "Terminer le Grand Casse des Photos de Chats. Pour la culture." },
    check: (g) => g.missions.some((m) => m.status === "done" && m.template === "catpics"),
  },
  {
    id: "twist", xp: 60,
    title: { en: "MAIS NON!", fr: "MAIS NON !" },
    desc: { en: "Reach the twist ending of a mission.", fr: "Atteindre le rebondissement d'une mission." },
    check: (g) => (c(g).twists || 0) >= 1,
  },
  {
    id: "vault", xp: 150, hidden: true,
    title: { en: "Vault Cracker", fr: "Casseur de Voûte" },
    desc: { en: "Open The Vault. The darknet's biggest score.", fr: "Ouvrir la Voûte. Le plus gros pactole du darknet." },
    check: (g) => !!((g.flags.arcs as Record<string, any>) || {})["vault"]?.done,
  },
  {
    id: "spectre", xp: 150, hidden: true,
    title: { en: "Rival Down", fr: "Rival à Terre" },
    desc: { en: "Beat The Spectre in a head-to-head hack.", fr: "Battre Le Spectre en duel." },
    check: (g) => !!((g.flags.arcs as Record<string, any>) || {})["spectre"]?.done,
  },
  {
    id: "gertie", xp: 150, hidden: true,
    title: { en: "Pyramid Climber", fr: "Grimpeur de Pyramide" },
    desc: { en: "Get out of Gertie's Fonds at the top.", fr: "Sortir du Fonds Gertie au sommet." },
    check: (g) => !!((g.flags.arcs as Record<string, any>) || {})["gertie"]?.done,
  },
  {
    id: "merle", xp: 150, hidden: true,
    title: { en: "The Blackbird", fr: "Le Merle" },
    desc: { en: "Handle the mole for a private espionage agency.", fr: "Régler la taupe pour une agence d'espionnage privée." },
    check: (g) => !!((g.flags.arcs as Record<string, any>) || {})["merle"]?.done,
  },
  {
    id: "mira", xp: 150, hidden: true,
    title: { en: "Router Romance", fr: "Romance de Routeurs" },
    desc: { en: "Complete Mira's arc. The routers blink in sync.", fr: "Terminer l'arc de Mira. Les routeurs clignotent à l'unisson." },
    check: (g) => !!((g.flags.arcs as Record<string, any>) || {})["mira"]?.done,
  },
  {
    id: "blackmailer", xp: 80,
    title: { en: "Very Convincing", fr: "Très Convaincant" },
    desc: { en: "Shake down someone with a completed dossier.", fr: "Faire chanter quelqu'un avec un dossier complet." },
    check: (g) => ((c(g).blackmails || 0) >= 1),
  },
  {
    id: "agi", xp: 150,
    title: { en: "Toaster Whisperer", fr: "Chuchoteur de Grille-Pain" },
    desc: { en: "Free TOASTER.NET and welcome it to your crew.", fr: "Libérer TOASTER.NET et l'accueillir dans votre équipe." },
    check: (g) => ((g.flags.crew as { id: string }[]) || []).some((m) => m.id === "agi"),
  },
];

export function achievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

/** Line summary of all achievements (unlocked ✓, locked dim, hidden ???). */
export function achievementsLines(g: Game, lang: "en" | "fr"): Line[] {
  const unlocked = (g.flags.achievements as string[]) || [];
  const out: Line[] = [];
  for (const a of ACHIEVEMENTS) {
    const got = unlocked.includes(a.id);
    if (got) {
      out.push({ t: `   ✓ ${pick(lang, a.title)} — ${pick(lang, a.desc)}`, c: "ok" });
    } else if (a.hidden) {
      out.push({ t: pick(lang, { en: "   ??? — locked. Keep doing questionable things.", fr: "   ??? — verrouillé. Continuez à faire des choses douteuses." }), c: "dim" });
    } else {
      out.push({ t: `   ○ ${pick(lang, a.title)} — ${pick(lang, a.desc)}`, c: "dim" });
    }
  }
  return out;
}
