import type { Game } from "./engine";
import type { Bilingual } from "./i18n";

// ── Optional narrative arcs ────────────────────────────────────────────────
// Side storylines you can follow (or ignore) for big, optional payoffs.
// Each arc is a chain of steps checked after every command. Rewards are a
// pile of cash + a permanent perk flag that real mechanics read elsewhere.

export interface ArcState {
  active?: boolean;
  done?: boolean;
  step: number; // steps completed so far
  invest?: number;
  investDay?: number;
}

export interface ArcStep {
  desc: Bilingual;
  done: (g: Game) => boolean;
}

export interface ArcDef {
  id: string;
  title: Bilingual;
  hook: Bilingual; // news headline on discovery
  blurb: Bilingual; // one-liner in the arcs list
  discover: (g: Game) => boolean;
  intro: Bilingual[]; // shown when the arc activates
  steps: ArcStep[];
  finale: Bilingual[]; // shown on completion
  money?: number;
  rep?: number;
  style?: number;
  xp?: number;
  perkFlag?: string; // set true on completion (mechanics read it)
  perkText?: Bilingual;
  trophy?: string;
}

const career = (g: Game) => ((g.flags.career as Record<string, any>) || {});
const targets = (g: Game) => ((career(g).targetCounts as Record<string, number>) || {});
const hacked = (g: Game, name: string) => (targets(g)[name] || 0) >= 1;
const arc = (g: Game, id: string): ArcState => ((g.flags.arcs as Record<string, ArcState>) || {})[id] || { step: 0 };

export function arcState(g: Game): Record<string, ArcState> {
  return (g.flags.arcs as Record<string, ArcState>) || {};
}

export function isArcActive(g: Game, id: string): boolean {
  const a = arc(g, id);
  return !!a.active && !a.done;
}

export function isArcDone(g: Game, id: string): boolean {
  return !!arc(g, id).done;
}

export const ARCS: ArcDef[] = [
  // ── THE VAULT ───────────────────────────────────────────────────────────
  {
    id: "vault",
    title: { en: "The Vault", fr: "La Voûte" },
    hook: { en: "Legendary 'The Vault' resurfaces on underground forums", fr: "La légendaire « Voûte » refait surface sur les forums" },
    blurb: { en: "A rumored server holding the darknet's biggest secrets (and money).", fr: "Un serveur mythique qui détiendrait les plus gros secrets (et l'argent) du darknet." },
    discover: (g) => g.flags.vaultHinted === true,
    intro: [
      { en: "Pierre: 'psst. the vault is REAL. i found the forums. you need: a bank trace, a MegaCorp badge, and bigger balls than me (easy).'", fr: "Pierre : « psst. la voûte est RÉELLE. j'ai trouvé les forums. il te faut : une trace bancaire, un badge MegaCorp, et plus de cran que moi (facile). »" },
      { en: "The Vault is rumored to hold the darknet's biggest score. Optional. Extremely profitable. Extremely illegal.", fr: "La Voûte détiendrait le plus gros pactole du darknet. Facultatif. Extrêmement rentable. Extrêmement illégal." },
      { en: "→ Type 'arcs' to track this arc.", fr: "→ Tapez « arcs » pour suivre cet arc." },
    ],
    steps: [
      { desc: { en: "Trace the Vault's location — hack BANK OF YOUR MONEY", fr: "Retracer la localisation de la Voûte — hacker BANK OF YOUR MONEY" }, done: (g) => hacked(g, "BANK OF YOUR MONEY") },
      { desc: { en: "Steal a vault access badge — hack MegaCorp HQ", fr: "Voler un badge d'accès à la Voûte — hacker MegaCorp HQ" }, done: (g) => hacked(g, "MegaCorp HQ") },
      { desc: { en: "Crack The Vault itself (difficulty 5)", fr: "Craquer la Voûte elle-même (difficulté 5)" }, done: (g) => hacked(g, "The Vault") },
    ],
    finale: [
      { en: "The Vault opens. Inside: not gold, but a ledger of every 'anonymous' darknet account ever. And a sticky note: 'Nice try. — The Spectre'.", fr: "La Voûte s'ouvre. À l'intérieur : pas d'or, mais le registre de tous les comptes « anonymes » du darknet. Et un post-it : « Bien essayé. — Le Spectre »." },
      { en: "You take a 'consulting fee'. A big one. The ledger stays. Some secrets are heavier than money.", fr: "Vous prélevez des « honoraires de conseil ». Des gros. Le registre reste. Certains secrets pèsent plus lourd que l'argent." },
    ],
    money: 15000,
    rep: 10,
    xp: 300,
    perkFlag: "arcVaultDone",
    perkText: { en: "Perk: 'Vault Key' — you now skim 25% more from every hack.", fr: "Perk : « Clé de la Voûte » — vous récupérez 25% de plus sur chaque hack." },
    trophy: "vault",
  },

  // ── THE SPECTRE ─────────────────────────────────────────────────────────
  {
    id: "spectre",
    title: { en: "The Spectre", fr: "Le Spectre" },
    hook: { en: "Mysterious hacker 'The Spectre' claims another big score", fr: "Le mystérieux hacker « Le Spectre » revendique un nouveau gros coup" },
    blurb: { en: "A rival keeps beating you to the big scores. Hunt them down — or don't. They're probably fine either way.", fr: "Un rival vous coiffe au poteau sur les gros coups. Traquez-le — ou pas. Il s'en remettra de toute façon." },
    discover: (g) => g.rep >= 40 && (career(g).hacksDone || 0) >= 5,
    intro: [
      { en: "The news keeps crediting 'The Spectre' for scores you were 'about to do anyway'. This is personal now.", fr: "Les infos créditent sans cesse « Le Spectre » pour des coups que vous « alliez faire de toute façon ». C'est personnel, maintenant." },
      { en: "Find their trail, dig up their identity, and beat them head-to-head. Optional. Vengeful. Profitable.", fr: "Trouvez sa trace, déterrez son identité, et battez-le en duel. Facultatif. Vindicatif. Rentable." },
      { en: "→ Type 'arcs' to track this arc.", fr: "→ Tapez « arcs » pour suivre cet arc." },
    ],
    steps: [
      { desc: { en: "Follow the Spectre's trail — hack NSA SubStation 7", fr: "Suivre la trace du Spectre — hacker NSA SubStation 7" }, done: (g) => hacked(g, "NSA SubStation 7") },
      { desc: { en: "Dig up the Spectre's identity — sell any dossier", fr: "Déterrer l'identité du Spectre — vendre un dossier" }, done: (g) => (career(g).dossiersSold || 0) >= 1 },
      { desc: { en: "Beat the Spectre head-to-head — hack Spectre's Rig (needs botnet)", fr: "Battre le Spectre en duel — hacker Spectre's Rig (nécessite un botnet)" }, done: (g) => hacked(g, "Spectre's Rig") },
    ],
    finale: [
      { en: "Spectre's Rig goes dark mid-hack. A message appears: 'gg. it was me, greg. the unpaid intern from Chad's team. i just wanted to feel something.'", fr: "Le serveur du Spectre s'éteint en plein hack. Un message apparaît : « gg. c'était moi, greg. le stagiaire non payé de l'équipe de Chad. je voulais juste ressentir quelque chose. »" },
      { en: "You beat The Spectre. Greg goes back to writing Chad's videos. You take his 'shade' — and a finder's fee.", fr: "Vous avez battu Le Spectre. Greg retourne écrire les vidéos de Chad. Vous prenez son « ombre » — et des frais de recherche." },
    ],
    money: 8000,
    rep: 15,
    style: 20,
    xp: 250,
    perkFlag: "arcSpectreDone",
    perkText: { en: "Perk: 'The Spectre's Shade' — your operations gain 15% less heat.", fr: "Perk : « L'Ombre du Spectre » — vos opérations génèrent 15% de chaleur en moins." },
    trophy: "spectre",
  },

  // ── GERTIE'S FONDS ──────────────────────────────────────────────────────
  {
    id: "gertie",
    title: { en: "Gertie's Fonds", fr: "Le Fonds Gertie" },
    hook: { en: "Grandma Gertie's investment opportunity 'not a scam', she insists", fr: "L'opportunité d'investissement de Mamie Gertie « n'est pas une arnaque », insiste-t-elle" },
    blurb: { en: "A pyramid scheme, but with your money at the top. Invest, wait, collect. Allegedly.", fr: "Une pyramide, mais avec votre argent au sommet. Investissez, attendez, encaissez. Soi-disant." },
    discover: (g) => g.contacts.some((c) => c.npc === "gertie") || g.rep >= 10,
    intro: [
      { en: "Gertie slides a flyer under your door: 'AMAZING OPPORTUNITY!!!' in Comic Sans. 'It's about the community, dear.'", fr: "Gertie glisse un prospectus sous votre porte : « OPPORTUNITÉ INCROYABLE !!! » en Comic Sans. « C'est une histoire de communauté, mon petit. »" },
      { en: "Invest in the Fonds with 'arcs invest <amount>'. Three tiers. Returns are 'totally real'. Optional. Lucrative. Probably fine.", fr: "Investissez dans le Fonds avec « arcs invest <montant> ». Trois paliers. Les rendements sont « complètement réels ». Facultatif. Lucratif. Probablement bien." },
      { en: "→ Type 'arcs' to track this arc.", fr: "→ Tapez « arcs » pour suivre cet arc." },
    ],
    steps: [
      { desc: { en: "Invest $200 in the Fonds", fr: "Investir 200 $ dans le Fonds" }, done: (g) => (arc(g, "gertie").invest || 0) >= 200 },
      { desc: { en: "Invest $800 more (total $1,000)", fr: "Investir 800 $ de plus (total 1 000 $)" }, done: (g) => (arc(g, "gertie").invest || 0) >= 1000 },
      {
        desc: { en: "Wait for the pyramid to mature (3 days)", fr: "Attendre que la pyramide mûrisse (3 jours)" },
        done: (g) => {
          const a = arc(g, "gertie");
          return (a.invest || 0) >= 1000 && !!a.investDay && g.day >= a.investDay + 3;
        },
      },
    ],
    finale: [
      { en: "Gertie hands you a plastic bag full of cash. 'The Fonds matured, dear. It was always about the community.' The bag smells faintly of Tupperware and victory.", fr: "Gertie vous tend un sac plastique plein de billets. « Le Fonds a mûri, mon petit. Ça a toujours été une histoire de communauté. » Le sac sent le Tupperware et la victoire." },
      { en: "The pyramid paid out. It wasn't a scam. It was… a very profitable scam. You got out at the top.", fr: "La pyramide a payé. Ce n'était pas une arnaque. C'était… une arnaque très rentable. Vous êtes sorti au sommet." },
    ],
    money: 5000,
    style: 5,
    xp: 200,
    perkFlag: "arcGertieDone",
    perkText: { en: "Perk: 'Focaccia Returns' — Gertie sends you a $10/day 'community dividend'.", fr: "Perk : « Rends de Focaccia » — Gertie vous envoie un « dividende communautaire » de 10 $/jour." },
    trophy: "gertie",
  },
];

export function arcById(id: string): ArcDef | undefined {
  return ARCS.find((a) => a.id === id);
}
