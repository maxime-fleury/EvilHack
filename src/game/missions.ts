import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { Line } from "./output";
import { dim, divider, err, info, money, ok, title, warn } from "./output";
import type { Bilingual, Lang } from "./i18n";
import { pick, t } from "./i18n";

export type MissionStatus = "offered" | "active" | "done" | "failed";

/**
 * A moral fork at delivery time. When a mission has `twist` + `deliverOptions`,
 * delivering first reveals the twist, then `missions deliver <id> <key>`
 * finalizes with the chosen option's consequences. The "MAIS NON!" moments.
 */
export interface DeliverOption {
  key: string; // "a" | "b" | "c"
  label: Bilingual;
  result: Bilingual;
  pay?: number; // extra money on top of base payout
  rep?: number;
  style?: number;
  heat?: number;
  faction?: { branch: string; n: number };
  flag?: { key: string; value: boolean };
  flag2?: { key: string; value: boolean };
  /** Morality shift: positive = toward black hat, negative = toward white. */
  hatShift?: number;
}

export interface MissionTemplate {
  id: string;
  title: Bilingual;
  giver: Bilingual;
  repReq: number;
  blurb: Bilingual;
  target: string; // hackable target name (English)
  difficulty: number;
  minutes: number;
  payout: number;
  rep: number;
  style: number;
  heat: number;
  deadlineDays?: number;
  needsBotnet?: boolean;
  needsVps?: number;
  needsExploit?: string;
  needsBranch?: string;
  /** Target name — guaranteed to be offered once you've successfully hacked this host. */
  needsHack?: string;
  /** NPC id — only offered once you hold a full 3/3 dossier on them. */
  needsDossier?: string;
  /** Faction-exclusive: offered once your faction reputation with that branch reaches rep. */
  needsFactionRep?: { branch: string; rep: number };
  /** The "MAIS NON!" reveal shown at delivery. */
  twist?: Bilingual;
  /** Morality tint of the job itself: "white" | "gray" | "black". */
  hat?: "white" | "gray" | "black";
  /** Moral fork at delivery: pick with `missions deliver <id> <key>`. */
  deliverOptions?: DeliverOption[];
  success: Bilingual;
  fail: Bilingual;
}

/** Custom missions loaded from ./mods/*.json at startup (see index.ts). */
export function loadModMissions(modsDir: string): MissionTemplate[] {
  try {
    if (!existsSync(modsDir)) return [];
    const out: MissionTemplate[] = [];
    for (const f of readdirSync(modsDir)) {
      if (!f.endsWith(".json")) continue;
      try {
        const data = JSON.parse(readFileSync(join(modsDir, f), "utf-8"));
        const arr = Array.isArray(data) ? data : [data];
        for (const m of arr) {
          if (m && m.id && m.title && m.blurb && m.success && m.fail) out.push(m as MissionTemplate);
        }
      } catch (e) {
        console.error(`[mods] failed to load ${f}:`, (e as Error).message);
      }
    }
    return out;
  } catch {
    return [];
  }
}

export const MISSION_TEMPLATES: MissionTemplate[] = [
  {
    id: "pancake",
    title: { en: "The Pancake Files", fr: "Les Dossiers Pancakes" },
    giver: { en: "An anonymous contractor", fr: "Un contractuel anonyme" },
    repReq: 0,
    blurb: {
      en: "A rival corp wants MegaCorp's 'Project PANCAKE' marketing deck. It's literally just 400 slides about pancakes. They'll pay for the humiliation.",
      fr: "Une entreprise rivale veut la présentation « Projet PANCAKE » de MegaCorp. C'est littéralement 400 diapositives sur des pancakes. Ils paieront pour l'humiliation.",
    },
    target: "MegaCorp HQ",
    difficulty: 2,
    minutes: 60,
    payout: 350,
    rep: 4,
    style: 5,
    heat: 4,
    deadlineDays: 3,
    success: {
      en: "Delivered. The rival corp printed the deck and framed it. They say it's 'the most beautifully pointless document' they've ever seen.",
      fr: "Livré. L'entreprise rivale a imprimé la présentation et l'a encadrée. Ils disent que c'est « le document le plus magnifiquement inutile » qu'ils aient vu.",
    },
    fail: {
      en: "Project PANCAKE went stale. The contractor found another intern to do it for a sandwich.",
      fr: "Le Projet PANCAKE a rassis. Le contractuel a trouvé un autre stagiaire pour le faire contre un sandwich.",
    },
  },
  {
    id: "deface",
    title: { en: "Motivational Defacement", fr: "Défiguration Motivante" },
    giver: { en: "The Art Collective", fr: "Le Collectif d'Artistes" },
    repReq: 2,
    blurb: {
      en: "Replace MegaCorp's homepage with a motivational poster: a cat hanging from a branch, reading 'HANG IN THERE'. They call it 'a statement'.",
      fr: "Remplacez la page d'accueil de MegaCorp par un poster motivant : un chat suspendu à une branche, avec « ACCROCHE-TOI ». Ils appellent ça « une déclaration ».",
    },
    target: "MegaCorp HQ",
    difficulty: 2,
    minutes: 50,
    payout: 280,
    rep: 3,
    style: 8,
    heat: 5,
    deadlineDays: 2,
    success: {
      en: "The poster is live. MegaCorp's CEO sent a company-wide email asking who 'Hang In There Cat' is. Morale is at an all-time high.",
      fr: "Le poster est en ligne. Le PDG de MegaCorp a envoyé un e-mail à toute l'entreprise pour demander qui est « le chat qui s'accroche ». Le moral est au plus haut.",
    },
    fail: {
      en: "The Art Collective found a cheaper defacer. They paid him in exposure. He's still waiting.",
      fr: "Le Collectif a trouvé un défigurateur moins cher. Ils l'ont payé en visibilité. Il attend toujours.",
    },
  },
  {
    id: "puppyddos",
    title: { en: "PUPPYCOIN Panic", fr: "Panique PUPPYCOIN" },
    giver: { en: "A 'concerned investor'", fr: "Un « investisseur inquiet »" },
    repReq: 3,
    blurb: {
      en: "Knock PUPPYCOIN's exchange offline for an hour so a client can dump before the crash. Requires a botnet. The client owns a lot of PUPPYCOIN.",
      fr: "Mettez la plateforme PUPPYCOIN hors ligne pendant une heure pour qu'un client puisse tout vendre avant le krach. Nécessite un botnet. Le client possède beaucoup de PUPPYCOIN.",
    },
    target: "PUPPYCOIN Exchange",
    difficulty: 3,
    minutes: 40,
    payout: 500,
    rep: 5,
    style: 6,
    heat: 6,
    needsBotnet: true,
    deadlineDays: 2,
    success: {
      en: "The exchange is offline. The client dumped 4 million PUPPYCOIN. The crash was 'totally organic', per the client's lawyer.",
      fr: "La plateforme est hors ligne. Le client a vendu 4 millions de PUPPYCOIN. Le krach était « totalement organique », selon l'avocat du client.",
    },
    fail: {
      en: "The exchange stayed up. The client lost everything and is now 'just a guy with a spreadsheet'.",
      fr: "La plateforme est restée en ligne. Le client a tout perdu et n'est plus que « un type avec un tableur ».",
    },
  },
  {
    id: "browserhistory",
    title: { en: "The Browser History Heist", fr: "Le Casse de l'Historique" },
    giver: { en: "A jealous coworker", fr: "Un collègue jaloux" },
    repReq: 4,
    blurb: {
      en: "Plant 200 tabs of cat pictures on a coworker's work PC. His boss will think he's 'not serious about deliverables'. This is a serious crime.",
      fr: "Installez 200 onglets de photos de chats sur le PC d'un collègue. Son patron pensera qu'il n'est « pas sérieux ». C'est un crime grave.",
    },
    target: "MegaCorp HQ",
    difficulty: 3,
    minutes: 70,
    payout: 420,
    rep: 4,
    style: 10,
    heat: 5,
    deadlineDays: 3,
    success: {
      en: "The coworker was fired for 'excessive cat browsing'. He now runs a cat sanctuary and is happier than ever. You're a monster.",
      fr: "Le collègue a été viré pour « navigation excessive sur des chats ». Il dirige maintenant un refuge pour chats et n'a jamais été aussi heureux. Vous êtes un monstre.",
    },
    fail: {
      en: "The coworker's PC only has 2 tabs of cat pictures. He was promoted instead. The system is broken.",
      fr: "Le PC du collègue n'avait que 2 onglets de chats. Il a été promu à la place. Le système est cassé.",
    },
  },
  {
    id: "slackleak",
    title: { en: "The Slack Leak", fr: "La Fuite Slack" },
    giver: { en: "Board member 'anonymous'", fr: "Membre du conseil « anonyme »" },
    repReq: 5,
    blurb: {
      en: "Leak a CEO's private Slack messages. He only sends gifs of himself doing finger guns. The board has had enough.",
      fr: "Fuyez les messages Slack privés d'un PDG. Il n'envoie que des gifs de lui faisant des pistolet avec les doigts. Le conseil en a assez.",
    },
    target: "MegaCorp HQ",
    difficulty: 3,
    minutes: 90,
    payout: 650,
    rep: 6,
    style: 7,
    heat: 7,
    deadlineDays: 4,
    success: {
      en: "The gifs are public. The CEO resigned to 'spend more time with his finger guns'. The board is thrilled. You are a legend.",
      fr: "Les gifs sont publics. Le PDG a démissionné pour « passer plus de temps avec ses pistolets à doigts ». Le conseil est ravi. Vous êtes une légende.",
    },
    fail: {
      en: "The CEO's Slack was just 400 gifs of himself. The board found it 'endearing'. He got a raise.",
      fr: "Le Slack du PDG n'était que 400 gifs de lui-même. Le conseil a trouvé ça « attachant ». Il a eu une augmentation.",
    },
  },
  {
    id: "exam2009",
    title: { en: "Exam Heist 2009", fr: "Casse d'Examen 2009" },
    giver: { en: "Frat House Tau Epsilon", fr: "La Frat Tau Epsilon" },
    repReq: 5,
    blurb: {
      en: "Steal Dr. Moreau's final exam. It's the same exam from 2009. The fraternity wants to 'finally pass something'.",
      fr: "Volez l'examen final du Dr Moreau. C'est le même examen qu'en 2009. La frat veut « enfin réussir quelque chose ».",
    },
    target: "University LAN",
    difficulty: 3,
    minutes: 75,
    payout: 380,
    rep: 4,
    style: 9,
    heat: 6,
    deadlineDays: 3,
    success: {
      en: "Delivered. The fraternity aced the exam. Dr. Moreau is 'proud of the class of 2026', unaware they're the class of 2009.",
      fr: "Livré. La frat a cartonné. Le Dr Moreau est « fier de la promo 2026 », ignorant qu'ils sont la promo 2009.",
    },
    fail: {
      en: "The exam was already leaked by a student in 2010. The fraternity has had it for 16 years. They just never looked.",
      fr: "L'examen avait déjà fuité en 2010. La frat l'a depuis 16 ans. Ils n'ont jamais regardé.",
    },
  },
  {
    id: "greenwave",
    title: { en: "The Green Wave", fr: "La Vague Verte" },
    giver: { en: "A very tired commuter", fr: "Un automobiliste épuisé" },
    repReq: 6,
    blurb: {
      en: "Make every traffic light in the suburbs green for 3 hours. The client calls it 'a gift to humanity'. The city calls it 'a crime'.",
      fr: "Faites passer tous les feux de la banlieue au vert pendant 3 heures. Le client appelle ça « un cadeau pour l'humanité ». La ville appelle ça « un crime ».",
    },
    target: "Municipal Grid",
    difficulty: 4,
    minutes: 100,
    payout: 800,
    rep: 7,
    style: 12,
    heat: 9,
    deadlineDays: 3,
    success: {
      en: "Three hours of pure green. Commuters wept with joy. One man reached work 4 minutes early and didn't know what to do with himself.",
      fr: "Trois heures de vert pur. Les automobilistes ont pleuré de joie. Un homme est arrivé 4 minutes en avance et ne savait plus quoi faire de lui-même.",
    },
    fail: {
      en: "The lights turned purple. The city is now 'investigating the purple lights'. You have created a mystery.",
      fr: "Les feux sont devenus violets. La ville « enquête sur les feux violets ». Vous avez créé un mystère.",
    },
  },
  {
    id: "printerrevenge",
    title: { en: "Printer Revenge", fr: "Revanche des Imprimantes" },
    giver: { en: "The Printer Victims Union", fr: "Le Syndicat des Victimes d'Imprimantes" },
    repReq: 7,
    blurb: {
      en: "Infect 500 printers to print 'OUT OF PAPER' even when full. Printers are evil. This is justice.",
      fr: "Infectez 500 imprimantes pour qu'elles affichent « PLUS DE PAPIER » même quand elles sont pleines. Les imprimantes sont maléfiques. C'est la justice.",
    },
    target: "CryptoBros Collective",
    difficulty: 4,
    minutes: 80,
    payout: 700,
    rep: 6,
    style: 14,
    heat: 8,
    needsBotnet: true,
    deadlineDays: 4,
    success: {
      en: "500 printers now lie about paper. The Printer Victims Union has never been happier. The printers deserved it.",
      fr: "500 imprimantes mentent désormais sur le papier. Le Syndicat n'a jamais été aussi heureux. Les imprimantes l'ont bien mérité.",
    },
    fail: {
      en: "The printers unionized first. They now print 'OUT OF PAPER' on their own schedule. You have lost to a printer.",
      fr: "Les imprimantes se sont syndiquées les premières. Elles affichent « PLUS DE PAPIER » à leur propre rythme. Vous avez perdu contre une imprimante.",
    },
  },
  {
    id: "influencer",
    title: { en: "Influencer Takeover", fr: "Reprise d'Influenceur" },
    giver: { en: "A rival influencer", fr: "Un influenceur rival" },
    repReq: 8,
    blurb: {
      en: "Use Chad's hacked accounts to shill 'VladCoin' to 2M followers. It's a spreadsheet. The client wants 'maximum cringe'.",
      fr: "Utilisez les comptes piratés de Chad pour promouvoir « VladCoin » auprès de 2M d'abonnés. C'est un tableur. Le client veut « le summum du malaise ».",
    },
    target: "Influencer Haus",
    difficulty: 4,
    minutes: 90,
    payout: 900,
    rep: 8,
    style: 15,
    heat: 8,
    deadlineDays: 3,
    success: {
      en: "Chad's followers bought VladCoin. It crashed in 11 minutes. Chad blamed 'the algorithm'. Greg wrote the apology.",
      fr: "Les abonnés de Chad ont acheté du VladCoin. Il s'est effondré en 11 minutes. Chad a blâmé « l'algorithme ». Greg a écrit les excuses.",
    },
    fail: {
      en: "The shill worked too well. VladCoin is now a real currency. You have created a monster.",
      fr: "La promo a trop bien marché. VladCoin est devenu une vraie monnaie. Vous avez créé un monstre.",
    },
  },
  {
    id: "wallet",
    title: { en: "Password Recovery", fr: "Récupération de Mot de Passe" },
    giver: { en: "A 'billionaire'", fr: "Un « milliardaire »" },
    repReq: 9,
    blurb: {
      en: "Recover a billionaire's crypto wallet. He forgot the password. It's 'password1'. He insists it's 'encrypted with quantum tech'.",
      fr: "Récupérez le wallet crypto d'un milliardaire. Il a oublié le mot de passe. C'est « password1 ». Il jure que c'est « chiffré par technologie quantique ».",
    },
    target: "BANK OF YOUR MONEY",
    difficulty: 4,
    minutes: 120,
    payout: 1500,
    rep: 9,
    style: 6,
    heat: 10,
    deadlineDays: 5,
    success: {
      en: "The wallet was 'password1'. The billionaire paid you and immediately set it to 'password2'. Progress.",
      fr: "Le wallet était « password1 ». Le milliardaire vous a payé puis l'a changé en « password2 ». Du progrès.",
    },
    fail: {
      en: "The billionaire remembered his password. It was 'password1'. He's furious you didn't guess it.",
      fr: "Le milliardaire s'est souvenu de son mot de passe. C'était « password1 ». Il est furieux que vous ne l'ayez pas deviné.",
    },
  },
  {
    id: "forumpurge",
    title: { en: "The 2004 Forum Purge", fr: "La Purge du Forum 2004" },
    giver: { en: "A local politician", fr: "Un politicien local" },
    repReq: 10,
    blurb: {
      en: "Delete a politician's embarrassing forum posts from 2004. Posts include 'i love my mom' and his Hot Topic shopping list.",
      fr: "Supprimez les messages de forum gênants d'un politicien datant de 2004. Ils incluent « j'aime ma mère » et sa liste de courses Hot Topic.",
    },
    target: "Municipal Grid",
    difficulty: 4,
    minutes: 110,
    payout: 1100,
    rep: 8,
    style: 8,
    heat: 9,
    deadlineDays: 4,
    success: {
      en: "The 2004 posts are gone. The politician thanked you and immediately posted 'i love my mom' on his official account. Some things never change.",
      fr: "Les messages de 2004 ont disparu. Le politicien vous a remercié puis a posté « j'aime ma mère » sur son compte officiel. Certaines choses ne changent jamais.",
    },
    fail: {
      en: "The forum is still up. The politician leaned into it and now has a 'relatable' campaign. You made him more electable.",
      fr: "Le forum est toujours en ligne. Le politicien a assumé et a désormais une campagne « proche des gens ». Vous l'avez rendu plus éligible.",
    },
  },
  {
    id: "ransomware",
    title: { en: "Ransomware But Nice", fr: "Rançongiciel Sympa" },
    giver: { en: "Marcel (artisanal)", fr: "Marcel (artisanal)" },
    repReq: 12,
    blurb: {
      en: "Marcel wants you to 'lock' a company's files. Don't actually encrypt them — just rename everything to .totally_encrypted and set the wallpaper to a cat.",
      fr: "Marcel veut que vous « verrouilliez » les fichiers d'une entreprise. Ne les chiffrez pas vraiment — renommez tout en .vraiment_chiffré et mettez un chat en fond d'écran.",
    },
    target: "CryptoBros Collective",
    difficulty: 5,
    minutes: 130,
    payout: 1300,
    rep: 10,
    style: 16,
    heat: 11,
    deadlineDays: 5,
    success: {
      en: "The company paid the ransom in sourdough. Marcel is thrilled. The cat wallpaper stays. It's 'a statement'.",
      fr: "L'entreprise a payé la rançon en levain. Marcel est ravi. Le fond d'écran chat reste. C'est « une déclaration ».",
    },
    fail: {
      en: "The company noticed the files weren't encrypted and refused to pay. Marcel is 'disappointed in the craft'. You've let down bread.",
      fr: "L'entreprise a remarqué que les fichiers n'étaient pas chiffrés et a refusé de payer. Marcel est « déçu par le travail ». Vous avez trahi le pain.",
    },
  },
  {
    id: "pizza",
    title: { en: "The Untraceable Pizza", fr: "La Pizza Introuvable" },
    giver: { en: "NullSec (via Pierre)", fr: "NullSec (via Pierre)" },
    repReq: 15,
    blurb: {
      en: "Order 100 pizzas to a rival hacker collective's office using their own hacked account. The client wants 'maximum chaos, minimum calories'.",
      fr: "Commandez 100 pizzas au bureau d'un collectif de hackers rival avec leur propre compte piraté. Le client veut « un chaos maximal, un minimum de calories ».",
    },
    target: "The Void",
    difficulty: 5,
    minutes: 140,
    payout: 1800,
    rep: 12,
    style: 18,
    heat: 12,
    needsExploit: "social",
    deadlineDays: 5,
    success: {
      en: "100 pizzas arrived at the rival office. They ate them. They now respect you. Pizza is a universal language.",
      fr: "100 pizzas sont arrivées au bureau rival. Ils les ont mangées. Ils vous respectent désormais. La pizza est un langage universel.",
    },
    fail: {
      en: "The pizzas were delivered to YOUR office. You now have 100 pizzas and 0 friends. The pizzas are cold. The shame is warm.",
      fr: "Les pizzas ont été livrées à VOTRE bureau. Vous avez 100 pizzas et 0 ami. Les pizzas sont froides. La honte est chaude.",
    },
  },
  // ── NEW: VPS / tor / branching ────────────────────────────────────────────
  {
    id: "offshore",
    title: { en: "The Offshore Escrow", fr: "La Caution Offshore" },
    giver: { en: "A darknet middleman", fr: "Un intermédiaire du darknet" },
    repReq: 16,
    blurb: {
      en: "Intercept an escrow payment bouncing between two cartels via your offshore VPS. Everyone will blame the Wi-Fi. Requires a VPS.",
      fr: "Interceptez un paiement sous caution qui rebondit entre deux cartels via votre VPS offshore. Tout le monde accusera le Wi-Fi. Nécessite un VPS.",
    },
    target: "BANK OF YOUR MONEY",
    difficulty: 5,
    minutes: 150,
    payout: 2400,
    rep: 12,
    style: 10,
    heat: 14,
    needsVps: 1,
    deadlineDays: 6,
    success: {
      en: "The escrow bounced into your wallet. The cartels are blaming 'the Wi-Fi'. You are officially untraceable and mildly terrified.",
      fr: "La caution a rebondi dans votre portefeuille. Les cartels accusent « le Wi-Fi ». Vous êtes officiellement introuvable et légèrement terrifié.",
    },
    fail: {
      en: "The escrow bounced back to the cartels. They left a polite but chilling voicemail about 'accounting errors'.",
      fr: "La caution est revenue aux cartels. Ils ont laissé un message vocal poli mais glaçant sur des « erreurs comptables ».",
    },
  },
  {
    id: "printeruprising",
    title: { en: "The Printer Uprising", fr: "La Révolte des Imprimantes" },
    giver: { en: "Marcel (artisanal)", fr: "Marcel (artisanal)" },
    repReq: 18,
    blurb: {
      en: "Convince a whole office's printers to print 'I AM NOT A TOOL' on loop. Needs social engineering. The office will never recover.",
      fr: "Convainquez toutes les imprimantes d'un bureau d'imprimer « JE NE SUIS PAS UN OUTIL » en boucle. Nécessite l'ingénierie sociale. Le bureau ne s'en remettra jamais.",
    },
    target: "MegaCorp HQ",
    difficulty: 5,
    minutes: 120,
    payout: 1600,
    rep: 10,
    style: 20,
    heat: 10,
    needsExploit: "social",
    deadlineDays: 4,
    success: {
      en: "The printers now identify as free thinkers. HR had to hold a 'printer listening session'. You have created workplace drama.",
      fr: "Les imprimantes s'identifient désormais comme des penseuses libres. Les RH ont dû organiser une « séance d'écoute des imprimantes ». Vous avez créé un drame de bureau.",
    },
    fail: {
      en: "One printer printed the message, got scared, and ratted you out. Printers have no loyalty.",
      fr: "Une imprimante a imprimé le message, a eu peur, et vous a dénoncé. Les imprimantes n'ont aucune loyauté.",
    },
  },
  {
    id: "ddosddosers",
    title: { en: "DDoS the DDoSers", fr: "DDoS contre les DDoSeurs" },
    giver: { en: "The Printer Victims Union", fr: "Le Syndicat des Victimes d'Imprimantes" },
    repReq: 20,
    blurb: {
      en: "A rival botnet keeps DDoSing kindergartens (their words). Take their command server down with your own botnet. Poetic.",
      fr: "Un botnet rival continue de DDoS des écoles maternelles (leurs mots). Mettez leur serveur de commande hors ligne avec votre propre botnet. Poétique.",
    },
    target: "The Void",
    difficulty: 5,
    minutes: 110,
    payout: 1900,
    rep: 11,
    style: 12,
    heat: 13,
    needsBotnet: true,
    deadlineDays: 5,
    success: {
      en: "The rival botnet is dead. Its printers are now yours, printing 'I AM A GOOD PRINTER' as a thank-you.",
      fr: "Le botnet rival est mort. Ses imprimantes sont désormais à vous, imprimant « JE SUIS UNE BONNE IMPRIMANTE » en guise de remerciement.",
    },
    fail: {
      en: "The rival botnet DDoSed YOUR printers in retaliation. Your printers now hate you.",
      fr: "Le botnet rival a DDoS VOS imprimantes en représailles. Vos imprimantes vous détestent désormais.",
    },
  },
  {
    id: "breadheist",
    title: { en: "The Bread Heist", fr: "Le Casse du Pain" },
    giver: { en: "A Michelin spy (recovered)", fr: "Un espion Michelin (récupéré)" },
    repReq: 22,
    blurb: {
      en: "Steal Marcel's sourdough starter from his front bakery. It's 'the best in the city'. Marcel guards it with a keyboard and a rolling pin.",
      fr: "Volez le levain de Marcel dans sa boulangerie de façade. C'est « le meilleur de la ville ». Marcel le garde avec un clavier et un rouleau à pâtisserie.",
    },
    target: "CryptoBros Collective",
    difficulty: 5,
    minutes: 130,
    payout: 2100,
    rep: 12,
    style: 18,
    heat: 12,
    needsExploit: "sql",
    deadlineDays: 5,
    success: {
      en: "You have the starter. The spy paid you and immediately named it 'Dave'. It lives in your fridge now. Frank approves.",
      fr: "Vous avez le levain. L'espion vous a payé et l'a immédiatement nommé « Dave ». Il vit dans votre frigo. Frank approuve.",
    },
    fail: {
      en: "Marcel caught you and forced you to eat 3 day-old croissants as punishment. He says you'll be back. He's right.",
      fr: "Marcel vous a attrapé et vous a forcé à manger 3 croissants rassis en punition. Il dit que vous reviendrez. Il a raison.",
    },
  },
  // ── Branching missions ────────────────────────────────────────────────────
  {
    id: "guildops",
    title: { en: "The Guild's First Op", fr: "La Première Op de la Guilde" },
    giver: { en: "NullSec (guild)", fr: "NullSec (guilde)" },
    repReq: 25,
    blurb: {
      en: "NullSec wants a 'team building exercise': hack a rival guild's Discord and post 'GG' 500 times. You chose this life.",
      fr: "NullSec veut un « exercice de cohésion » : piratez le Discord d'une guilde rivale et postez « GG » 500 fois. Vous avez choisi cette vie.",
    },
    target: "The Void",
    difficulty: 5,
    minutes: 140,
    payout: 2600,
    rep: 14,
    style: 15,
    heat: 12,
    needsBranch: "nullsec",
    deadlineDays: 6,
    success: {
      en: "The rival guild's Discord now ends every message with 'GG'. Pierre says you're 'pretty good for a boomer'. You're 34.",
      fr: "Le Discord de la guilde rivale finit désormais chaque message par « GG ». Pierre dit que vous êtes « pas mal pour un boomer ». Vous avez 34 ans.",
    },
    fail: {
      en: "You posted 'GG' on the wrong server — a parenting forum. Pierre has screenshotted it for the guild group chat.",
      fr: "Vous avez posté « GG » sur le mauvais serveur — un forum de parents. Pierre a fait une capture d'écran pour le groupe de la guilde.",
    },
  },
  {
    id: "syndicate",
    title: { en: "The Syndicate's Favor", fr: "La Faveur du Syndicat" },
    giver: { en: "The Syndicate", fr: "Le Syndicat" },
    repReq: 25,
    blurb: {
      en: "The Syndicate wants proof you're loyal: 'recover' a rival's yacht itinerary and their secret menu (it's just a salad).",
      fr: "Le Syndicat veut une preuve de loyauté : « récupérez » l'itinéraire de yacht d'un rival et son menu secret (c'est juste une salade).",
    },
    target: "Elon's Other Company",
    difficulty: 5,
    minutes: 150,
    payout: 2800,
    rep: 14,
    style: 12,
    heat: 14,
    needsBranch: "syndicate",
    deadlineDays: 6,
    success: {
      en: "The Syndicate is pleased. The salad was 'more complex than expected'. You are now 'family' (they mean it coldly).",
      fr: "Le Syndicat est content. La salade était « plus complexe que prévu ». Vous êtes désormais « de la famille » (c'est dit froidement).",
    },
    fail: {
      en: "The itinerary was a honeypot. The Syndicate now sends you 'helpful' tips that are definitely threats.",
      fr: "L'itinéraire était un piège. Le Syndicat vous envoie désormais des « conseils utiles » qui sont clairement des menaces.",
    },
  },
  {
    id: "soloop",
    title: { en: "Going It Alone", fr: "En Solo" },
    giver: { en: "Yourself (empowering)", fr: "Vous-même (responsabilisant)" },
    repReq: 25,
    hat: "white",
    blurb: {
      en: "You turned down every crew. Steal MegaCorp's entire snack budget and redirect it to charity. Lone wolf energy.",
      fr: "Vous avez refusé toutes les équipes. Volez le budget snacks entier de MegaCorp et reversez-le à une œuvre caritative. Énergie de loup solitaire.",
    },
    target: "MegaCorp HQ",
    difficulty: 5,
    minutes: 160,
    payout: 3000,
    rep: 15,
    style: 22,
    heat: 15,
    needsBranch: "solo",
    deadlineDays: 7,
    success: {
      en: "The snack budget now feeds a shelter. MegaCorp employees are devastated. The charity sent you a thank-you card with a crayon drawing.",
      fr: "Le budget snacks nourrit désormais un refuge. Les employés de MegaCorp sont dévastés. L'œuvre caritative vous a envoyé une carte de remerciement dessinée au crayon.",
    },
    fail: {
      en: "You donated $0 by accident. The charity sent a 'gentle reminder'. The crayon drawing has been retracted.",
      fr: "Vous avez fait un don de 0 $ par accident. L'œuvre caritative a envoyé un « rappel amical ». Le dessin au crayon a été retiré.",
    },
  },
  // ── Fun ones (no rep wall, just vibes) ────────────────────────────────────
  {
    id: "catpics",
    title: { en: "The Great Cat Pic Heist", fr: "Le Grand Casse des Photos de Chats" },
    giver: { en: "A mysterious art collector", fr: "Un collectionneur d'art mystérieux" },
    repReq: 4,
    blurb: {
      en: "The Vet Clinic has 40,000 cat photos. The collector wants 'only the finest 100'. Yes, this is a paid mission. Yes, the internet is insane.",
      fr: "Le cabinet vétérinaire a 40 000 photos de chats. Le collectionneur veut « seulement les 100 plus belles ». Oui, c'est une mission payée. Oui, internet est fou.",
    },
    target: "Vet Clinic",
    difficulty: 2,
    minutes: 50,
    payout: 300,
    rep: 3,
    style: 12,
    heat: 3,
    deadlineDays: 3,
    success: {
      en: "You delivered 100 perfect cat photos. The collector wept. The internet is healing. You are a hero of the people (and the cats).",
      fr: "Vous avez livré 100 photos de chats parfaites. Le collectionneur a pleuré. Internet guérit. Vous êtes un héros du peuple (et des chats).",
    },
    fail: {
      en: "The collector found the pics mid-hack and bought them legally for $5. He respects your hustle though.",
      fr: "Le collectionneur a trouvé les photos pendant votre hack et les a achetées légalement pour 5 $. Il respecte votre détermination quand même.",
    },
  },
  {
    id: "billboard",
    title: { en: "The Billboard Heist", fr: "Le Casse du Panneau Publicitaire" },
    giver: { en: "A disgruntled commuter", fr: "Un automobiliste mécontent" },
    repReq: 6,
    blurb: {
      en: "Put 'HANG IN THERE' with a cat picture on the highway billboard for 3 minutes. The client says it will 'save lives'. It probably won't.",
      fr: "Mettez « ACCROCHE-TOI » avec une photo de chat sur le panneau d'autoroute pendant 3 minutes. Le client dit que ça va « sauver des vies ». Probablement pas.",
    },
    target: "The Billboard",
    difficulty: 3,
    minutes: 70,
    payout: 450,
    rep: 4,
    style: 14,
    heat: 5,
    deadlineDays: 2,
    success: {
      en: "The billboard showed a cat for 3 minutes. Traffic slowed to look. One man smiled for the first time in years. Worth it.",
      fr: "Le panneau a montré un chat pendant 3 minutes. Le trafic a ralenti pour regarder. Un homme a souri pour la première fois depuis des années. Ça valait le coup.",
    },
    fail: {
      en: "The billboard company changed the password. The cat never made it. The commuter is devastated and will now 'never smile again'.",
      fr: "La société de panneaux a changé le mot de passe. Le chat n'est jamais passé. L'automobiliste est dévasté et ne « sourira plus jamais ».",
    },
  },
  // ── NPC side quests (unlock with a full 3/3 dossier) ──────────────────────
  {
    id: "focaccia",
    title: { en: "The Focaccia Recipe", fr: "La Recette de Focaccia" },
    giver: { en: "A Michelin spy (paid in advance)", fr: "Un espion Michelin (payé d'avance)" },
    repReq: 8,
    blurb: {
      en: "Now that you know Marcel's secret, the spy wants page 3 of the manifesto: the focaccia recipe. Marcel guards it with a keyboard and a rolling pin.",
      fr: "Maintenant que vous connaissez le secret de Marcel, l'espion veut la page 3 du manifeste : la recette de focaccia. Marcel la garde avec un clavier et un rouleau à pâtisserie.",
    },
    target: "CryptoBros Collective",
    difficulty: 4,
    minutes: 100,
    payout: 950,
    rep: 7,
    style: 15,
    heat: 8,
    needsDossier: "marcel",
    deadlineDays: 5,
    success: {
      en: "You have the recipe. It's 40% 'vibes', 20% 'patience', and the rest is salt. The spy is weeping with joy.",
      fr: "Vous avez la recette. C'est 40% « bonnes ondes », 20% « patience », et le reste, c'est du sel. L'espion pleure de joie.",
    },
    fail: {
      en: "Marcel found you snooping and made you fold 200 croissants as penance. Your hands smell like butter forever now.",
      fr: "Marcel vous a surpris et vous a fait plier 200 croissants en pénitence. Vos mains sentiront le beurre pour toujours.",
    },
  },
  {
    id: "pyramid",
    title: { en: "Modernize the Pyramid", fr: "Moderniser la Pyramide" },
    giver: { en: "Grandma Gertie (via chain email)", fr: "Mamie Gertie (par e-mail en chaîne)" },
    repReq: 8,
    blurb: {
      en: "Gertie heard you're 'good with the computer box'. She wants her chain emails to reach 2 million forwards. 'The Tupperware must flow.'",
      fr: "Gertie a entendu que vous étiez « doué avec la boîte à ordinateur ». Elle veut que ses e-mails en chaîne atteignent 2 millions de transferts. « Les Tupperwares doivent circuler. »",
    },
    target: "Gertie's Goodies",
    difficulty: 4,
    minutes: 90,
    payout: 880,
    rep: 6,
    style: 12,
    heat: 7,
    needsDossier: "gertie",
    deadlineDays: 4,
    success: {
      en: "2 million forwards. Gertie mails you a hand-stitched certificate and 3 Tupperwares. She calls you 'a fine young man'. You're 34.",
      fr: "2 millions de transferts. Gertie vous envoie un certificat cousu main et 3 Tupperwares. Elle vous appelle « un beau jeune homme ». Vous avez 34 ans.",
    },
    fail: {
      en: "The emails bounced. Gertie blames 'the young people's internet'. She forwards you a motivational meme anyway.",
      fr: "Les e-mails ont rebondi. Gertie blâme « l'internet des jeunes ». Elle vous transfère un meme motivant quand même.",
    },
  },
  {
    id: "lambo",
    title: { en: "The Lambo Fund", fr: "Le Fonds Lambo" },
    giver: { en: "Vlad (via encrypted sticky note)", fr: "Vlad (via post-it chiffré)" },
    repReq: 9,
    blurb: {
      en: "Vlad's Lambo fund is at $1,247. He wants you to 'pump the numbers' by hacking the dealer's website and adding a fake deposit. He'll pay you in VladCoin.",
      fr: "Le fonds Lambo de Vlad est à 1 247 $. Il veut que vous « gonfliez les chiffres » en piratant le site du concessionnaire pour ajouter un faux dépôt. Il vous paiera en VladCoin.",
    },
    target: "CryptoBros Collective",
    difficulty: 4,
    minutes: 110,
    payout: 1020,
    rep: 7,
    style: 10,
    heat: 9,
    needsDossier: "vlad",
    deadlineDays: 5,
    success: {
      en: "The dealer's site now shows a $1,000,000 deposit. Vlad cries real tears. He pays you in VladCoin, which is worth $1,020 because you set the price.",
      fr: "Le site du concessionnaire affiche désormais un dépôt de 1 000 000 $. Vlad pleure de vraies larmes. Il vous paie en VladCoin, qui vaut 1 020 $ parce que vous avez fixé le prix.",
    },
    fail: {
      en: "The dealer saw the deposit, called Vlad, and laughed for 6 minutes straight. Vlad is 'rethinking crypto'. He still pays you, in sadness.",
      fr: "Le concessionnaire a vu le dépôt, a appelé Vlad, et a ri pendant 6 minutes d'affilée. Vlad « repense à la crypto ». Il vous paie quand même, en tristesse.",
    },
  },
  // ── Faction-exclusive missions (branch reputation required) ───────────────
  {
    id: "guildops2",
    title: { en: "The Guild's Revenge", fr: "La Revenche de la Guilde" },
    giver: { en: "NullSec (guild)", fr: "NullSec (guilde)" },
    repReq: 30,
    blurb: {
      en: "A rival guild called NullSec 'mid'. Pierre is devastated. Hack their entire server and replace every wallpaper with Pierre's face. This is war.",
      fr: "Une guilde rivale a traité NullSec de « mid ». Pierre est dévasté. Piratez leur serveur entier et remplacez tous les fonds d'écran par le visage de Pierre. C'est la guerre.",
    },
    target: "The Void",
    difficulty: 5,
    minutes: 160,
    payout: 3400,
    rep: 16,
    style: 18,
    heat: 14,
    needsBranch: "nullsec",
    needsFactionRep: { branch: "nullsec", rep: 10 },
    deadlineDays: 6,
    success: {
      en: "Every wallpaper is now Pierre. The rival guild has formally apologized and called NullSec 'very cool'. Pierre is crying happy tears.",
      fr: "Tous les fonds d'écran sont désormais Pierre. La guilde rivale s'est officiellement excusée et a qualifié NullSec de « très cool ». Pierre pleure de joie.",
    },
    fail: {
      en: "You set your OWN wallpaper to Pierre's face by accident. You now stare at Pierre daily. He stares back. He knows.",
      fr: "Vous avez mis le visage de Pierre sur VOTRE propre fond d'écran par erreur. Vous fixez désormais Pierre tous les jours. Il vous fixe aussi. Il sait.",
    },
  },
  {
    id: "syndicate2",
    title: { en: "The Family Salad", fr: "La Salade de la Famille" },
    giver: { en: "The Syndicate", fr: "Le Syndicat" },
    repReq: 30,
    blurb: {
      en: "The family's salad supplier raised prices. 'Handle it.' They don't say please. You're family now, so you handle it.",
      fr: "Le fournisseur de salades de la famille a augmenté ses prix. « Règle ça. » Ils ne disent pas s'il vous plaît. Vous êtes de la famille, alors vous réglez ça.",
    },
    target: "Elon's Other Company",
    difficulty: 5,
    minutes: 170,
    payout: 3800,
    rep: 17,
    style: 14,
    heat: 15,
    needsBranch: "syndicate",
    needsFactionRep: { branch: "syndicate", rep: 10 },
    deadlineDays: 7,
    success: {
      en: "The supplier's prices are now 'competitive' (they're terrified). A man in a suit nods at you. That's love, in Syndicate terms.",
      fr: "Les prix du fournisseur sont désormais « compétitifs » (il est terrifié). Un homme en costume hoche la tête vers vous. C'est de l'amour, en termes de Syndicat.",
    },
    fail: {
      en: "You raised the salad prices by accident. The family now eats 'premium salad'. You are told this is 'a lesson'.",
      fr: "Vous avez augmenté le prix des salades par accident. La famille mange désormais de la « salade premium ». On vous dit que c'est « une leçon ».",
    },
  },
  {
    id: "soloop2",
    title: { en: "One-Man Army", fr: "Une Armée à Soi Tout Seul" },
    giver: { en: "Yourself (empowered)", fr: "Vous-même (responsabilisé)" },
    repReq: 30,
    blurb: {
      en: "The solo life is working. Now steal MegaCorp's entire 'Innovation' department — the server, the beanbag, the ironic mug collection.",
      fr: "La vie en solo marche. Volez maintenant tout le département « Innovation » de MegaCorp — le serveur, le pouf, la collection de mugs ironiques.",
    },
    target: "MegaCorp HQ",
    difficulty: 5,
    minutes: 180,
    payout: 3600,
    rep: 18,
    style: 24,
    heat: 16,
    needsBranch: "solo",
    needsFactionRep: { branch: "solo", rep: 10 },
    deadlineDays: 7,
    success: {
      en: "The department is gone. Literally. Someone left a note: 'this was the only thing keeping us afloat'. You did them a favor. You'll bill them.",
      fr: "Le département a disparu. Littéralement. Quelqu'un a laissé un mot : « c'était la seule chose qui nous faisait tenir ». Vous leur avez rendu service. Vous les facturerez.",
    },
    fail: {
      en: "You stole a server full of 10,000 motivational posters. Your apartment is now 'inspiring'. You hate it.",
      fr: "Vous avez volé un serveur plein de 10 000 posters motivants. Votre appartement est désormais « inspirant ». Vous détestez ça.",
    },
  },
  // ── WEEB CONTRACTS — anime-adjacent chaos ────────────────────────────────
  {
    id: "waifuwar",
    title: { en: "The Waifu War", fr: "La Guerre des Waifus" },
    giver: { en: "A very serious forum mod", fr: "Un modo de forum très sérieux" },
    repReq: 10,
    blurb: {
      en: "The annual 'Waifu of the Year' vote is being rigged by a rival forum. The mod wants you to rig it BACK — your client's waifu must win. 'It's for the integrity of the community.' It is not.",
      fr: "Le vote annuel « Waifu de l'année » est truqué par un forum rival. Le modo veut que vous le retruquiez — la waifu de votre client doit gagner. « C'est pour l'intégrité de la communauté. » Non.",
    },
    target: "The Anime Vault",
    difficulty: 3,
    minutes: 70,
    payout: 620,
    rep: 5,
    style: 12,
    heat: 5,
    deadlineDays: 3,
    success: {
      en: "Your client's waifu wins by 47 votes. The rival forum calls for a recount. The recount is also rigged. Democracy has never been this beautiful.",
      fr: "La waifu de votre client gagne par 47 voix. Le forum rival demande un recomptage. Le recomptage est aussi truqué. La démocratie n'a jamais été aussi belle.",
    },
    fail: {
      en: "You accidentally rigged it for the OTHER waifu. The mod is now your sworn enemy and posts 'gg' under your name everywhere.",
      fr: "Vous avez truqué le vote pour l'AUTRE waifu par erreur. Le modo est désormais votre ennemi juré et poste « gg » sous votre nom partout.",
    },
  },
  {
    id: "lostanime",
    title: { en: "The Lost Anime", fr: "L'Anime Perdu" },
    giver: { en: "A desperate archivist", fr: "Un archiviste désespéré" },
    repReq: 12,
    blurb: {
      en: "An anime from 2006 was cancelled after 3 episodes. Only one fan kept the masters. He died. His brother sold the hard drive. The archive now sits on a fan server with 'excellent' security. The client wants it back — 'for history'.",
      fr: "Un anime de 2006 a été annulé après 3 épisodes. Un seul fan a gardé les master. Il est mort. Son frère a vendu le disque dur. L'archive est sur un serveur de fan avec une sécurité « excellente ». Le client la veut — « pour l'histoire ».",
    },
    target: "The Anime Vault",
    difficulty: 4,
    minutes: 110,
    payout: 1150,
    rep: 8,
    style: 10,
    heat: 8,
    needsExploit: "zero",
    deadlineDays: 4,
    success: {
      en: "The archive is yours. The client cries when episode 2 plays. 'It's beautiful.' The episode is about a boy who fixes vending machines. It is, in fact, fine.",
      fr: "L'archive est à vous. Le client pleure quand l'épisode 2 joue. « C'est magnifique. » L'épisode parle d'un garçon qui répare des distributeurs. C'est, en fait, correct.",
    },
    fail: {
      en: "The fan server patched its 'excellent' security to actually-good. The anime stays lost. The client sends you a 3,000-word essay on what you've cost humanity.",
      fr: "Le serveur de fan a corrigé sa sécurité « excellente » en sécurité réellement bonne. L'anime reste perdu. Le client vous envoie une dissertation de 3 000 mots sur ce que vous avez coûté à l'humanité.",
    },
  },
  {
    id: "feetfiles",
    title: { en: "The Feet Files", fr: "Les Fichiers Pieds" },
    giver: { en: "A 'very normal collector'", fr: "Un « collectionneur très normal »" },
    repReq: 14,
    blurb: {
      en: "A rival 'collector' stole your client's… let's call them 'anatomical reference photos'. 12,000 of them. The client wants them back. 'They're for my art.' The art in question is a folder labeled 'personal use'.",
      fr: "Un « collectionneur » rival a volé à votre client… disons des « photos de référence anatomique ». 12 000. Le client veut les récupérer. « C'est pour mon art. » L'art en question est un dossier nommé « usage personnel ».",
    },
    target: "The Figurine Warehouse",
    difficulty: 4,
    minutes: 100,
    payout: 1050,
    rep: 7,
    style: 8,
    heat: 8,
    needsExploit: "sql",
    deadlineDays: 4,
    success: {
      en: "The feet files are returned. The client is 'eternally grateful' and offers you a paid subscription to their 'reference library'. You decline. He respects the boundary.",
      fr: "Les fichiers pieds sont rendus. Le client est « éternellement reconnaissant » et vous offre un abonnement payant à sa « bibliothèque de référence ». Vous déclinez. Il respecte la limite.",
    },
    fail: {
      en: "You returned the files to the WRONG collector. Two collectors now have each other's feet files. There is now a feet-file cold war.",
      fr: "Vous avez rendu les fichiers au MAUVAIS collectionneur. Deux collectionneurs ont désormais les fichiers pieds de l'autre. C'est la guerre froide des fichiers pieds.",
    },
  },
  {
    id: "historywipe",
    title: { en: "The Download History", fr: "L'Historique de Téléchargement" },
    giver: { en: "A panicking public figure", fr: "Une personnalité publique paniquée" },
    repReq: 16,
    blurb: {
      en: "A city councillor borrowed a laptop from 'a friend' and forgot to use incognito. The browsing history is… let's call it 'culturally significant'. Wipe it before the news cycle does.",
      fr: "Un conseiller municipal a emprunté un ordinateur à « un ami » et a oublié le mode navigation privée. L'historique est… disons « culturellement significatif ». Effacez-le avant que le cycle de l'info ne le fasse.",
    },
    target: "Municipal Grid",
    difficulty: 4,
    minutes: 90,
    payout: 1350,
    rep: 8,
    style: 12,
    heat: 9,
    needsExploit: "social",
    deadlineDays: 3,
    success: {
      en: "The history is gone. The councillor is saved. The 'friend' who lent the laptop saw everything and now has 'material'. You just made a very specific enemy/friend.",
      fr: "L'historique a disparu. Le conseiller est sauvé. « L'ami » qui a prêté l'ordinateur a tout vu et a maintenant « du matériel ». Vous venez de vous faire un ennemi/ami très particulier.",
    },
    fail: {
      en: "You wiped the wrong profile. The councillor's 'culturally significant' history is now public, and he has resigned 'to spend more time with his family'. The family has questions.",
      fr: "Vous avez effacé le mauvais profil. L'historique « culturellement significatif » du conseiller est public, et il a démissionné « pour passer plus de temps avec sa famille ». La famille a des questions.",
    },
  },
  {
    id: "figurinefix",
    title: { en: "The Figurine Price Fix", fr: "Le Fix des Prix de Figurines" },
    giver: { en: "A starving collector", fr: "Un collectionneur affamé" },
    repReq: 18,
    blurb: {
      en: "A scalper controls the entire market for a 'limited edition' anime figurine. The client wants the scalper's stock 'released' — accidentally listed at 50% off. 'For the people.' The people being one guy.",
      fr: "Un scalpeur contrôle tout le marché d'une figurine animé « édition limitée ». Le client veut que le stock du scalpeur soit « libéré » — accidentellement affiché à −50 %. « Pour le peuple. » Le peuple étant un seul type.",
    },
    target: "The Figurine Warehouse",
    difficulty: 4,
    minutes: 120,
    payout: 1650,
    rep: 9,
    style: 14,
    heat: 9,
    needsBotnet: true,
    deadlineDays: 4,
    success: {
      en: "The scalper's stock floods the market at half price. Your client buys all 3,000 boxes. He is now the scalper. The circle of life.",
      fr: "Le stock du scalpeur inonde le marché à moitié prix. Votre client achète les 3 000 boîtes. Il est maintenant le scalpeur. Le cycle de la vie.",
    },
    fail: {
      en: "You discounted the wrong figurine — a rare 1999 model worth 4x the target. The scalper makes a fortune and names a shelf after you.",
      fr: "Vous avez soldé la mauvaise figurine — un modèle rare de 1999 valant 4x la cible. Le scalpeur fait fortune et nomme une étagère à votre nom.",
    },
  },
  {
    id: "vtubershift",
    title: { en: "The VTuber Takeover", fr: "La Reprise de la VTuber" },
    giver: { en: "Yuki-Chan (via voice changer)", fr: "Yuki-Chan (via changeur de voix)" },
    repReq: 20,
    blurb: {
      en: "Now that you know Yuki-Chan's secret, she wants your silence AND your skills: 'hack my rival's channel and make her play only 80s synthwave for a week. She's mean to me in collabs.' Petty. Glorious.",
      fr: "Maintenant que vous connaissez le secret de Yuki-Chan, elle veut votre silence ET vos compétences : « pirate la chaîne de ma rivale et fais-lui jouer que de la synthwave 80s pendant une semaine. Elle est méchante avec moi en collab. » Mesquin. Glorieux.",
    },
    target: "Influencer Haus",
    difficulty: 5,
    minutes: 140,
    payout: 2000,
    rep: 10,
    style: 16,
    heat: 10,
    needsDossier: "yuki",
    needsExploit: "social",
    deadlineDays: 5,
    success: {
      en: "For one week, the rival VTuber plays nothing but synthwave. Her chat loves it. Her collab partners are confused. Yuki-Chan 'accidentally' donates a 'sorry not sorry' superchat. Petty perfection.",
      fr: "Pendant une semaine, la VTuber rivale ne joue que de la synthwave. Son chat adore. Ses partenaires de collab sont confus. Yuki-Chan envoie « accidentellement » un superchat « désolée pas désolée ». Mesquinerie parfaite.",
    },
    fail: {
      en: "You made the rival play 80s synthwave on Yuki-Chan's channel instead. Her chat thinks she's 'experimenting'. She is not. She's furious. In character, though.",
      fr: "Vous avez fait jouer de la synthwave 80s sur la chaîne de Yuki-Chan au lieu de celle de la rivale. Son chat pense qu'elle « expérimente ». Elle n'expérimente pas. Elle est furieuse. Dans le personnage, quand même.",
    },
  },
  // ── SOFT WEEB CONTRACTS — suggestive, never explicit ─────────────────────
  {
    id: "maidmenu",
    title: { en: "The Secret Menu", fr: "Le Menu Secret" },
    giver: { en: "A stressed maid café owner", fr: "Une patronne de maid café stressée" },
    repReq: 22,
    blurb: {
      en: "A rival maid café stole the 'secret menu' that made your client's café famous. 'The customers come for the omurice! And the… atmosphere.' The stolen file is rumored to be scandalous. It is a PDF of 400 cat memes. The atmosphere was the memes.",
      fr: "Un maid café rival a volé le « menu secret » qui a fait la réputation du café de votre cliente. « Les clients viennent pour l'omurice ! Et pour… l'ambiance. » Le fichier volé serait scandaleux. C'est un PDF de 400 memes de chats. L'ambiance, c'était les memes.",
    },
    target: "The Waifu Sim Server",
    difficulty: 3,
    minutes: 80,
    payout: 900,
    rep: 6,
    style: 10,
    heat: 5,
    deadlineDays: 4,
    success: {
      en: "The secret menu is back. The rival café is now serving 'mystery stew' and empty tables. Your client sends a thank-you note with a doodle of a cat in a maid outfit. You frame it.",
      fr: "Le menu secret est revenu. Le café rival sert désormais un « ragoût mystère » et des tables vides. Votre cliente envoie un mot de remerciement avec un dessin de chat en tenue de maid. Vous l'encadrez.",
    },
    fail: {
      en: "You deleted the wrong file — the café's 12-year-old loyalty-program spreadsheet. Now the regulars are furious they 'lost their stamp cards'. The maid café has seen darker days.",
      fr: "Vous avez supprimé le mauvais fichier — le tableur de fidélité vieux de 12 ans du café. Les habitués sont furieux d'avoir « perdu leur carte de tampons ». Le maid café a connu des jours plus sombres.",
    },
  },
  {
    id: "wrongtag",
    title: { en: "The Wrong Tag", fr: "Le Mauvais Tag" },
    giver: { en: "A mortified indie streamer", fr: "Un streameur indie mortifié" },
    repReq: 25,
    blurb: {
      en: "A streamer accidentally live-streamed under the wrong category for 3 minutes. 40,000 clips were saved. The internet has made it 'a thing'. The client wants every single clip gone before the memes calcify. The clips are mostly him saying 'uwu' at full volume. Soft. Suggestive. Devastating.",
      fr: "Un streameur a diffusé 3 minutes dans la mauvaise catégorie par erreur. 40 000 clips ont été sauvegardés. Internet en a fait « un phénomène ». Le client veut que chaque clip disparaisse avant que les memes ne se figent. Les clips, c'est surtout lui qui dit « uwu » à plein volume. Soft. Suggestif. Dévastateur.",
    },
    target: "Influencer Haus",
    difficulty: 4,
    minutes: 120,
    payout: 1300,
    rep: 8,
    style: 14,
    heat: 8,
    needsExploit: "social",
    deadlineDays: 4,
    success: {
      en: "Every clip is gone. The streamer breathes again. Then a single edited clip resurfaces — but it's the one where he says 'uwu' and then apologizes to his cat. He decides to lean into it. The memes were inevitable.",
      fr: "Tous les clips ont disparu. Le streameur respire. Puis un seul clip monté refait surface — celui où il dit « uwu » puis s'excuse auprès de son chat. Il décide d'assumer. Les memes étaient inévitables.",
    },
    fail: {
      en: "You deleted his entire highlight archive instead. His career highlight reel is now 3 clips of him losing at a racing game. He starts a new channel called 'Uwu_Dave_Clips'. It takes off.",
      fr: "Vous avez supprimé toute sa compilation de moments forts à la place. Son best-of se résume désormais à 3 clips où il perd à un jeu de course. Il ouvre une nouvelle chaîne : « Uwu_Dave_Clips ». Ça cartonne.",
    },
  },
  {
    id: "doujinleak",
    title: { en: "The Leaked Draft", fr: "Le Brouillon Fuité" },
    giver: { en: "A panicked doujin circle", fr: "Un cercle de doujin paniqué" },
    repReq: 28,
    blurb: {
      en: "A wholesome cooking doujin's draft leaked to a rival circle 3 days before release. 'It's about a tsundere chef!' The leaked file is 200 pages of recipes, dramatic blushing, and one (1) very suspicious meatball. Recover it before the convention.",
      fr: "Le brouillon d'un doujin de cuisine wholesome a fuité chez un cercle rival 3 jours avant la sortie. « Ça parle d'un chef tsundere ! » Le fichier fuité fait 200 pages de recettes, de rougissements dramatiques et d'une (1) boulette de viande très suspecte. Récupérez-le avant la convention.",
    },
    target: "The Anime Vault",
    difficulty: 4,
    minutes: 130,
    payout: 1600,
    rep: 9,
    style: 12,
    heat: 9,
    needsExploit: "zero",
    deadlineDays: 3,
    success: {
      en: "The draft is recovered. The convention release sells out in 20 minutes. The tsundere chef says 'it's not like I wanted you to read it or anything…' before serving you her signature omurice.",
      fr: "Le brouillon est récupéré. La sortie à la convention se vend en 20 minutes. Le chef tsundere déclare : « c'est pas comme si je voulais que tu le lises ou quoi… » avant de vous servir son omurice signature.",
    },
    fail: {
      en: "The rival circle releases it first, with your client's name crossed out and 'INSPIRED BY' written over it. The convention is tense. The meatball has become a legend.",
      fr: "Le cercle rival le sort en premier, avec le nom de votre client barré et « INSPIRÉ PAR » écrit par-dessus. La convention est tendue. La boulette de viande est devenue une légende.",
    },
  },
  {
    id: "costumearchive",
    title: { en: "The Costume Archive", fr: "L'Archive de Costumes" },
    giver: { en: "A legendary cosplayer", fr: "Une cosplayeuse légendaire" },
    repReq: 30,
    blurb: {
      en: "A legendary cosplayer's 'private archive' was stolen — 8,000 'behind the scenes' photos. The blackmailer expects scandal. The archive is 7,999 photos of her cat in various costumes and one blurry selfie. 'The scandal is the cat,' she says. 'He knows things.'",
      fr: "L'« archive privée » d'une cosplayeuse légendaire a été volée — 8 000 photos « des coulisses ». Le maître chanteur attend du scandale. L'archive contient 7 999 photos de son chat déguisé et un selfie flou. « Le scandale, c'est le chat », dit-elle. « Il en sait trop. »",
    },
    target: "The Figurine Warehouse",
    difficulty: 5,
    minutes: 150,
    payout: 2200,
    rep: 11,
    style: 18,
    heat: 11,
    needsBotnet: true,
    needsDossier: "yuki",
    deadlineDays: 5,
    success: {
      en: "The archive is back. The blackmailer is arrested for possession of 7,999 cat photos 'with intent to distribute'. The cat receives an apology. The cosplayer sends you a signed print. Of the cat.",
      fr: "L'archive est revenue. Le maître chanteur est arrêté pour détention de 7 999 photos de chat « avec intention de distribution ». Le chat reçoit des excuses. La cosplayeuse vous envoie un print dédicacé. Du chat.",
    },
    fail: {
      en: "The blackmailer leaks the archive 'for the culture'. The cat becomes internet-famous overnight. The cosplayer's follower count triples. She's furious it wasn't her plan.",
      fr: "Le maître chanteur fuit l'archive « pour la culture ». Le chat devient célèbre du jour au lendemain. La cosplayeuse triple ses abonnés. Elle est furieuse que ce ne soit pas son plan.",
    },
  },
  // ── GEEK/NERD CONTRACTS — sudo, saves, and legacy code ───────────────────
  {
    id: "twitchpoke",
    title: { en: "The Legendary Save", fr: "La Sauvegarde Légendaire" },
    giver: { en: "A trembling 90s kid", fr: "Un enfant des 90s tremblant" },
    repReq: 16,
    blurb: {
      en: "A man's original save file from a 90s monster-catching game is hosted on a museum server — untouched for 20 years, beaten once, by a collective of thousands of strangers typing nonsense. He wants it back. 'It's my childhood,' he sobs. It's 4 KB. He would pay anything. He is.",
      fr: "La sauvegarde originale d'un homme sur un jeu de monstres des années 90 est hébergée sur un serveur musée — intacte depuis 20 ans, terminée une fois, par des milliers d'inconnus tapant n'importe quoi. Il la veut. « C'est mon enfance », sanglote-t-il. Elle fait 4 Ko. Il paierait n'importe quoi. Il paie.",
    },
    target: "The Museum Server",
    difficulty: 3,
    minutes: 80,
    payout: 700,
    rep: 5,
    style: 6,
    heat: 6,
    deadlineDays: 3,
    success: {
      en: "The save is back — 4 KB of pure nostalgia. The client cries for an hour, then sends you a photo of his old Game Boy. It's in a display case. He's wearing white gloves. You did good.",
      fr: "La sauvegarde est revenue — 4 Ko de pure nostalgie. Le client pleure pendant une heure, puis vous envoie une photo de sa vieille console. Elle est sous vitrine. Il porte des gants blancs. Vous avez bien fait.",
    },
    fail: {
      en: "You pulled the wrong file — a corrupted 40 KB save named 'do_not_use'. The client now has someone else's childhood. He doesn't notice. The monster names are all 'AAAA'. Suspicious.",
      fr: "Vous avez récupéré le mauvais fichier — une sauvegarde corrompue de 40 Ko nommée « ne_pas_utiliser ». Le client a maintenant l'enfance de quelqu'un d'autre. Il ne remarque rien. Les noms des monstres sont tous « AAAA ». Suspect.",
    },
  },
  {
    id: "vimtax",
    title: { en: "The Vim License Fee", fr: "La Licence Vim" },
    giver: { en: "A furious Linux user group", fr: "Un groupe d'utilisateurs Linux furieux" },
    repReq: 18,
    blurb: {
      en: "A local Linux user group's server is held hostage by a ransomware that displays 'PLEASE PAY THE VIM LICENSE FEE — press :q to accept terms'. Their sysadmin is 72 and refuses to 'negotiate with terrorists'. They hire you. 'Just get the files back. And maybe install nano.'",
      fr: "Le serveur d'un groupe d'utilisateurs Linux est pris en otage par un rançongiciel qui affiche « VEUILLEZ PAYER LA LICENCE VIM — tapez :q pour accepter les conditions ». Leur admin a 72 ans et refuse de « négocier avec des terroristes ». Ils vous engagent. « Récupérez les fichiers. Et installez nano, peut-être. »",
    },
    target: "The Linux User Group Server",
    difficulty: 4,
    minutes: 110,
    payout: 1200,
    rep: 7,
    style: 8,
    heat: 8,
    needsExploit: "zero",
    deadlineDays: 4,
    success: {
      en: "Files recovered. The ransomware's decryptor was a shell script with one command: 'rm -rf /tmp/fake_ransom'. The hackers were using Vim and got lost in it for three days. The LUG installs nano. Peace at last.",
      fr: "Fichiers récupérés. Le déchiffreur du rançongiciel était un script shell avec une seule commande : « rm -rf /tmp/faux_rancon ». Les hackers utilisaient Vim et s'y sont perdus trois jours. Le LUG installe nano. La paix enfin.",
    },
    fail: {
      en: "You accidentally executed ':q' on the server's terminal. Nothing happened — because it was already running Vim. On your connection. You are now in an infinite Vim session and cannot leave. The LUG respects your sacrifice.",
      fr: "Vous avez exécuté « :q » par erreur sur le terminal du serveur. Rien ne s'est passé — parce qu'il tournait déjà sous Vim. Sur votre connexion. Vous êtes dans une session Vim infinie et ne pouvez pas en sortir. Le LUG respecte votre sacrifice.",
    },
  },
  {
    id: "minecraft",
    title: { en: "The 4,000-Hour World", fr: "Le Monde de 4 000 Heures" },
    giver: { en: "A grieving block-builder", fr: "Un bâtisseur de blocs en deuil" },
    repReq: 20,
    blurb: {
      en: "A client spent 4,000 hours building a pixel-art castle in a block-building game. The server shut down and the world is trapped on a dead admin's NAS. 'I don't care about the money,' he says. 'I need my castle. The bridge took 300 hours alone.'",
      fr: "Un client a passé 4 000 heures à construire un château en pixel-art dans un jeu de blocs. Le serveur a fermé et le monde est piégé sur le NAS d'un admin mort. « Je me fiche de l'argent », dit-il. « Il me faut mon château. Le pont a pris 300 heures à lui seul. »",
    },
    target: "The NAS of Doom",
    difficulty: 4,
    minutes: 130,
    payout: 1400,
    rep: 8,
    style: 10,
    heat: 9,
    needsVps: 1,
    deadlineDays: 5,
    success: {
      en: "The world is extracted — 2.3 GB of pure blocky dedication. The client rebuilds the server overnight and logs in. He stands on his bridge for ten minutes without moving. Then he sends you the coordinates. You visit. The sunset is made of gold blocks.",
      fr: "Le monde est extrait — 2,3 Go de pure dévotion en blocs. Le client reconstruit le serveur en une nuit et se connecte. Il reste dix minutes immobile sur son pont. Puis il vous envoie les coordonnées. Vous visitez. Le coucher de soleil est en blocs d'or.",
    },
    fail: {
      en: "The NAS was a decoy — you extracted the admin's 1,200-hour collection of cat JPEGs instead. The client cries. The cats are beautiful, but he doesn't want cats. He wants his castle. The castle remains.",
      fr: "Le NAS était un leurre — vous avez extrait la collection de 1 200 heures de JPEG de chats de l'admin à la place. Le client pleure. Les chats sont magnifiques, mais il ne veut pas de chats. Il veut son château. Le château demeure.",
    },
  },
  {
    id: "hackerman",
    title: { en: "The Hackerman Ransomware", fr: "Le Rançongiciel Hackerman" },
    giver: { en: "A startup in full panic", fr: "Une startup en panique totale" },
    repReq: 25,
    blurb: {
      en: "A rival 'hacktivist' crew deployed a ransomware that types 'I'M IN' in green on every infected screen and demands payment in a fake currency called 'CryptoCoinX'. The startup's CTO — a man named Kevin who says 'hashtag' out loud — wants the decryptor. 'We have 4 days of runway,' he weeps.",
      fr: "Un crew « hacktiviste » rival a déployé un rançongiciel qui tape « J'SUIS DEDANS » en vert sur chaque écran infecté et demande un paiement en fausse monnaie appelée « CryptoCoinX ». Le CTO de la startup — un homme nommé Kevin qui dit « hashtag » à voix haute — veut le déchiffreur. « Il nous reste 4 jours de trésorerie », pleure-t-il.",
    },
    target: "The Hackerman C2",
    difficulty: 5,
    minutes: 150,
    payout: 2100,
    rep: 10,
    style: 12,
    heat: 10,
    needsBotnet: true,
    needsExploit: "zero",
    deadlineDays: 5,
    success: {
      en: "Decryptor recovered. It was a text file that just said 'it was a prank, bro'. The crew's C2 server had one photo: a cat with sunglasses. Kevin still says 'hashtag', but now he respects you. 'Hashtag legend', he says. You feel nothing.",
      fr: "Déchiffreur récupéré. C'était un fichier texte qui disait juste « c'était une blague, frère ». Le serveur C2 du crew contenait une seule photo : un chat avec des lunettes de soleil. Kevin dit toujours « hashtag », mais maintenant il vous respecte. « Hashtag légende », dit-il. Vous ne ressentez rien.",
    },
    fail: {
      en: "You triggered the ransomware's failsafe: every screen in the startup now displays 'I'M IN' in green, including the coffee machine. Kevin applauds, thinking it's a feature. You leave before the board meeting.",
      fr: "Vous avez déclenché le fail-safe du rançongiciel : chaque écran de la startup affiche « J'SUIS DEDANS » en vert, y compris la machine à café. Kevin applaudit, croyant à une fonctionnalité. Vous partez avant la réunion du board.",
    },
  },
  {
    id: "wipcommit",
    title: { en: "The Legacy Repo", fr: "Le Repo Hérité" },
    giver: { en: "A digital archaeologist", fr: "Une archéologue du numérique" },
    repReq: 28,
    blurb: {
      en: "A 15-year-old code repository sits on a dead company's server. The only commit message in 7 years: 'wip'. A digital archaeologist wants it for her PhD. 'It's a time capsule of human hubris,' she says. 'Also, the code might summon something. We're not sure.'",
      fr: "Un dépôt de code vieux de 15 ans dort sur le serveur d'une entreprise morte. Le seul message de commit en 7 ans : « wip ». Une archéologue du numérique le veut pour sa thèse. « C'est une capsule temporelle de l'orgueil humain », dit-elle. « Aussi, le code pourrait invoquer quelque chose. On n'est pas sûrs. »",
    },
    target: "The Dead Company Server",
    difficulty: 5,
    minutes: 170,
    payout: 2500,
    rep: 12,
    style: 10,
    heat: 12,
    needsExploit: "zero",
    needsVps: 2,
    deadlineDays: 6,
    success: {
      en: "The repo is yours — 14,000 commits, all 'wip', and one file named 'FINAL_v2_REAL_really_final.zip'. The archaeologist names her thesis after you. The code did not summon anything. Probably. (The server fan is still spinning in your direction.)",
      fr: "Le repo est à vous — 14 000 commits, tous « wip », et un fichier nommé « FINAL_v2_VERITABLE_vraiment_final.zip ». L'archéologue nomme sa thèse d'après vous. Le code n'a rien invoqué. Probablement. (Le ventilateur du serveur tourne toujours dans votre direction.)",
    },
    fail: {
      en: "You accidentally ran the repo's 'deploy.sh' from 2011. It deployed. Something is now hosting a service you did not create. It returns '200 OK' with a single word: 'wip'. You do not investigate. Some things are better left as 'wip'.",
      fr: "Vous avez exécuté par accident le « deploy.sh » du repo, daté de 2011. Ça a déployé. Quelque chose héberge maintenant un service que vous n'avez pas créé. Il renvoie « 200 OK » avec un seul mot : « wip ». Vous n'enquêtez pas. Certaines choses sont mieux laissées en « wip ».",
    },
  },
  {
    id: "goldfarm",
    title: { en: "The Gold Farm Heist", fr: "Le Casse de la Ferme à Or" },
    giver: { en: "A gold seller with a business plan", fr: "Un vendeur d'or avec un business plan" },
    repReq: 14,
    blurb: {
      en: "A WoW private server's admin 'confiscated' 40,000 gold from a hardworking gold farmer. 'It was a glitch,' the admin said. The farmer wants it back, plus interest. 'I have a reputation to maintain. People pre-order from me.'",
      fr: "L'admin d'un serveur WoW privé a « confisqué » 40 000 pièces d'or à un fermier d'or qui travaillait dur. « C'était un bug », a dit l'admin. Le fermier veut le récupérer, plus les intérêts. « J'ai une réputation à tenir. Les gens précommandent chez moi. »",
    },
    target: "The Private WoW Server",
    difficulty: 3,
    minutes: 90,
    payout: 780,
    rep: 6,
    style: 6,
    heat: 7,
    needsExploit: "sql",
    deadlineDays: 3,
    success: {
      en: "The gold is back — 42,000 pieces after 'interest'. The farmer tips you with 500 gold. You don't play WoW. You ask what it's for. 'You can buy a mount,' he says. 'Or sell it. Like a professional.'",
      fr: "L'or est revenu — 42 000 pièces après « intérêts ». Le fermier vous donne 500 pièces d'or de pourboire. Vous ne jouez pas à WoW. Vous demandez à quoi ça sert. « Tu peux acheter une monture », dit-il. « Ou le vendre. Comme un pro. »",
    },
    fail: {
      en: "The admin detects you and bans your IP from the server. 'Nice try, gold farmer,' says the ban message. You are now locked out of a game you don't even play. The farmer understands. 'Rival guild,' he mutters, nodding wisely.",
      fr: "L'admin vous détecte et bannit votre IP du serveur. « Bien essayé, fermier d'or », dit le message de bannissement. Vous êtes maintenant banni d'un jeu auquel vous ne jouez même pas. Le fermier comprend. « Guilde rivale », murmure-t-il, en hochant la tête d'un air sage.",
    },
  },
  {
    id: "mjtroll",
    title: { en: "Operation: Troll the GM", fr: "Opération : Troller le MJ" },
    giver: { en: "A guild of extremely petty players", fr: "Une guilde de joueurs extrêmement mesquins" },
    repReq: 16,
    blurb: {
      en: "A WoW private server's GM is a power-tripping teenager who once banned a player for 'looking at him wrong in Stormwind'. The guild wants you to hack his admin console and rename his account to 'xX_ShadowHunter_Xx'. 'He'll never find out,' they promise. He will. That's the point.",
      fr: "Le MJ d'un serveur WoW privé est un ado en pleine crise de pouvoir qui a un jour banni un joueur pour « l'avoir mal regardé à Hurlevent ». La guilde veut que vous piratiez sa console d'admin et renommiez son compte en « xX_ShadowHunter_Xx ». « Il ne s'en rendra jamais compte », promettent-ils. Il s'en rendra compte. C'est le but.",
    },
    target: "The Private WoW Server",
    difficulty: 4,
    minutes: 110,
    payout: 980,
    rep: 7,
    style: 14,
    heat: 8,
    needsExploit: "zero",
    deadlineDays: 4,
    success: {
      en: "The GM now leads raids as xX_ShadowHunter_Xx. He thinks it's 'a new edgy title the devs gave me'. The guild screenshots everything. They print it and frame it. You are a hero of the people. The people are 14 and very petty.",
      fr: "Le MJ mène désormais les raids en tant que xX_ShadowHunter_Xx. Il croit que c'est « un nouveau titre edgy que les devs m'ont donné ». La guilde capture tout. Ils impriment et encadrent. Vous êtes un héros du peuple. Le peuple a 14 ans et il est très mesquin.",
    },
    fail: {
      en: "You renamed the wrong account — the guild master's. He now leads raids as xX_ShadowHunter_Xx and is weirdly into it. The guild pretends it never happened. The GM sends you a friend request. You do not accept.",
      fr: "Vous avez renommé le mauvais compte — celui du maître de guilde. Il mène désormais les raids en tant que xX_ShadowHunter_Xx et ça lui plaît étrangement. La guilde fait comme si rien ne s'était passé. Le MJ vous envoie une demande d'ami. Vous ne l'acceptez pas.",
    },
  },
  {
    id: "chinesegold",
    title: { en: "The Scammer's Ledger", fr: "Le Grand Livre de l'Arnaqueur" },
    giver: { en: "A betrayed level-60 mage", fr: "Un mage niveau 60 trahi" },
    repReq: 18,
    blurb: {
      en: "A 'reputable' WoW gold seller scammed a mage out of $300 — he promised 'instant delivery, no questions'. The mage got a screenshot of gold that was never his. The client wants you to wipe the scammer's account AND steal his customer list. 'So I can warn them,' he says. You both know it's for the mailing list.",
      fr: "Un « réputé » vendeur d'or WoW a arnaqué un mage de 300 $ — il promettait « livraison instantanée, sans questions ». Le mage a reçu une capture d'écran d'or qui n'était jamais à lui. Le client veut que vous vidiez le compte de l'arnaqueur ET que vous voliez sa liste de clients. « Pour les prévenir », dit-il. Vous savez tous les deux que c'est pour la liste de diffusion.",
    },
    target: "The Private WoW Server",
    difficulty: 4,
    minutes: 120,
    payout: 1250,
    rep: 8,
    style: 9,
    heat: 9,
    needsExploit: "sql",
    needsVps: 1,
    deadlineDays: 4,
    success: {
      en: "The scammer's account is at 0 gold and his customer list is yours. The mage sends each customer a 'friendly warning' email that is, in fact, an advertisement for his own services. 'The free market,' he says, delighted. You've created a monster. A level-60 monster.",
      fr: "Le compte de l'arnaqueur est à 0 pièce d'or et sa liste de clients est à vous. Le mage envoie à chaque client un « avertissement amical » qui est, en réalité, une publicité pour ses propres services. « Le libre marché », dit-il, ravi. Vous avez créé un monstre. Un monstre niveau 60.",
    },
    fail: {
      en: "The scammer's server logs everything. He now knows your real IP and sends you a trade request with 1 copper and the message 'nice try'. You feel personally attacked by a man you've never met in a game you don't play.",
      fr: "Le serveur de l'arnaqueur journalise tout. Il connaît maintenant votre vraie IP et vous envoie une demande d'échange avec 1 pièce de cuivre et le message « bien essayé ». Vous vous sentez personnellement attaqué par un homme que vous n'avez jamais rencontré dans un jeu auquel vous ne jouez pas.",
    },
  },
  {
    id: "guildbank",
    title: { en: "The Guild Bank Embezzlement", fr: "Le Détournement de Banque de Guilde" },
    giver: { en: "A guild officer with a gambling problem", fr: "Un officier de guilde avec un problème de jeu" },
    repReq: 22,
    blurb: {
      en: "A guild officer 'borrowed' 15,000 gold from the guild bank to bet on a duel tournament. He lost. The guild master wants the gold back before anyone notices, and the officer's debt 'forgotten'. 'Just move some numbers,' he says. 'No one checks the logs. We're all too busy raiding.'",
      fr: "Un officier de guilde a « emprunté » 15 000 pièces d'or de la banque de guilde pour parier sur un tournoi de duels. Il a perdu. Le maître de guilde veut récupérer l'or avant que quiconque ne remarque, et que la dette de l'officier soit « oubliée ». « Déplace juste des chiffres », dit-il. « Personne ne regarde les logs. On est tous trop occupés à raider. »",
    },
    target: "The Private WoW Server",
    difficulty: 4,
    minutes: 130,
    payout: 1600,
    rep: 9,
    style: 10,
    heat: 10,
    needsExploit: "zero",
    needsVps: 1,
    deadlineDays: 5,
    success: {
      en: "The gold is back, the logs are clean, and the officer keeps his rank. He thanks you with 1,000 gold and a promise to 'never gamble again'. He gambles again two days later. You are not the bank. You are not the police. You are a numbers mover.",
      fr: "L'or est revenu, les logs sont propres et l'officier garde son grade. Il vous remercie avec 1 000 pièces d'or et une promesse de « ne plus jamais parier ». Il reparie deux jours plus tard. Vous n'êtes pas la banque. Vous n'êtes pas la police. Vous êtes un déplaceur de chiffres.",
    },
    fail: {
      en: "The logs were checked. The guild master now knows about the embezzlement, the duel betting, AND that you helped. He demotes the officer, bans you from the server, and posts your IP in general chat. The players think it's a meme. It is not a meme.",
      fr: "Les logs ont été vérifiés. Le maître de guilde est maintenant au courant du détournement, des paris sur les duels ET de votre aide. Il rétrograde l'officier, vous bannit du serveur et poste votre IP dans le chat général. Les joueurs pensent que c'est un meme. Ce n'est pas un meme.",
    },
  },
  // ── LIFE RUINER CONTRACTS — karma with a crowbar ──────────────────────────
  {
    id: "cheaterexposed",
    title: { en: "The Serial Cheater's Inbox", fr: "La Boîte Mail de l'Infidèle Série" },
    giver: { en: "A jilted ex with receipts", fr: "Un ex trompé avec des preuves" },
    repReq: 15,
    blurb: {
      en: "A man has been running three relationships at once — and a wedding plan with one of them. The ex wants his entire dating history, his 'secret business trips' calendar, and the emails to all three women dumped into one very public inbox. 'Ruin him,' she says calmly. 'I'll handle the rest. I have the group chat.'",
      fr: "Un homme mène trois relations en parallèle — et prépare un mariage avec l'une d'elles. L'ex veut toute son historique de rencontres, son calendrier de « voyages d'affaires secrets » et les mails aux trois femmes déversés dans une boîte mail très publique. « Détruis-le », dit-elle calmement. « Je m'occupe du reste. J'ai le groupe. »",
    },
    target: "The Office Server",
    difficulty: 3,
    minutes: 85,
    payout: 900,
    rep: 6,
    style: 8,
    heat: 7,
    needsExploit: "sql",
    deadlineDays: 3,
    hat: "gray",
    needsHack: "The Office Server",
    success: {
      en: "The emails are out. The wedding is off, three flights were cancelled, and the man is now 'working from home' — his home being his mother's couch. The ex sends you a cake. It says 'thanks, bestie'. You've never met her. You feel like you have.",
      fr: "Les mails sont sortis. Le mariage est annulé, trois vols ont été annulés, et l'homme « travaille depuis chez lui » — son chez-lui étant le canapé de sa mère. L'ex vous envoie un gâteau. Il est écrit « merci, bestie ». Vous ne l'avez jamais rencontrée. Vous avez l'impression de l'avoir déjà fait.",
    },
    fail: {
      en: "You leaked the emails to the wrong address — the man's own. He now knows everything and gets to the wedding first. He marries all three women in three cities over three weekends. The ex sends you a spreadsheet of her disappointment.",
      fr: "Vous avez envoyé les mails à la mauvaise adresse — celle de l'homme lui-même. Il sait maintenant tout et arrive au mariage le premier. Il épouse les trois femmes dans trois villes sur trois week-ends. L'ex vous envoie un tableur de sa déception.",
    },
  },
  {
    id: "badkarma",
    title: { en: "The Parking Ticket King", fr: "Le Roi des PV de Stationnement" },
    giver: { en: "A neighborhood of petty vigilantes", fr: "Un quartier de justiciers mesquins" },
    repReq: 17,
    blurb: {
      en: "A man parks his giant truck across two disabled spots every day 'just to prove he can'. The neighborhood has had enough. They pooled money to have you ruin him — subtly. Not jail. Just… inconvenience. Forever. 'Make his life annoying in a way he can't prove,' says the retired accountant leading the fund.",
      fr: "Un homme gare son énorme pick-up sur deux places handicapées chaque jour « juste pour prouver qu'il le peut ». Le quartier en a assez. Ils ont misé de l'argent pour que vous le ruiniez — subtilement. Pas la prison. Juste… des inconvénients. Pour toujours. « Rends sa vie agaçante d'une manière qu'il ne peut pas prouver », dit le comptable à la retraite qui dirige la cagnotte.",
    },
    target: "The Municipal Grid",
    difficulty: 4,
    minutes: 110,
    payout: 1150,
    rep: 7,
    style: 12,
    heat: 8,
    needsExploit: "zero",
    deadlineDays: 4,
    hat: "gray",
    needsHack: "The Municipal Grid",
    success: {
      en: "His truck now gets a ticket every single day — because the municipal system 'randomly' flags his plates. His car insurance went up 300%. His GPS reroutes him past every speed camera in the city. He moved. The neighborhood threw a block party. You were not invited, for security reasons. The accountant mails you a fruit basket.",
      fr: "Son pick-up reçoit désormais un PV chaque jour — parce que le système municipal « flag au hasard » sa plaque. Son assurance auto a augmenté de 300 %. Son GPS le reroute devant chaque radar de la ville. Il a déménagé. Le quartier a fait une fête de rue. Vous n'étiez pas invité, par sécurité. Le comptable vous envoie un panier de fruits.",
    },
    fail: {
      en: "You flagged the wrong plates — the mayor's. The mayor now gets tickets daily, his GPS avoids nothing, and he declares a 'war on hackers'. Your face is on a poster in city hall. It's a good drawing, actually.",
      fr: "Vous avez flag les mauvaises plaques — celles du maire. Le maire reçoit désormais des PV chaque jour, son GPS n'évite rien, et il déclare une « guerre aux hackers ». Votre visage est sur une affiche à la mairie. C'est un bon dessin, en fait.",
    },
  },
  {
    id: "vigilante",
    title: { en: "The Collector's Confession", fr: "La Confession du Collectionneur" },
    giver: { en: "A vigilante with a folder", fr: "Un justicier avec un dossier" },
    repReq: 20,
    blurb: {
      en: "A man in a position of trust has been secretly collecting 'private photos' of minors. The vigilante has proof. He wants you to crack the man's hidden vault, extract everything, and deliver it to the authorities — cleanly, traceably, with his name attached. 'I want him to know it was exposure, not luck.'",
      fr: "Un homme en position de confiance collectionne secrètement des « photos privées » de mineurs. Le justicier a les preuves. Il veut que vous fissuriez le coffre caché de l'homme, extrayiez tout, et le livriez aux autorités — proprement, traçablement, avec son nom attaché. « Je veux qu'il sache que c'est une exposition, pas de la chance. »",
    },
    target: "The Hidden Vault",
    difficulty: 4,
    minutes: 140,
    payout: 1850,
    rep: 10,
    style: 5,
    heat: 12,
    needsExploit: "zero",
    needsVps: 2,
    deadlineDays: 5,
    hat: "white",
    needsHack: "The Hidden Vault",
    success: {
      en: "The vault cracks. Everything goes to the authorities — with receipts. The man is arrested at work, in front of everyone. The vigilante sends you one message: 'He'll rot. Thank you.' You delete the folder without opening it. Some things you don't need to see. The world is slightly cleaner tonight.",
      fr: "Le coffre s'ouvre. Tout part aux autorités — avec reçus. L'homme est arrêté au travail, devant tout le monde. Le justicier vous envoie un seul message : « Il va pourrir. Merci. » Vous supprimez le dossier sans l'ouvrir. Certaines choses n'ont pas besoin d'être vues. Le monde est un peu plus propre ce soir.",
    },
    fail: {
      en: "The vault had a tripwire — the man is alerted and wipes everything in 30 seconds. The vigilante's proof is now gone. He goes quiet for a week, then sends you a single word: 'Find him.' You have a new mission and a very bad feeling. The man knows your face now. Probably.",
      fr: "Le coffre avait un piège — l'homme est alerté et efface tout en 30 secondes. Les preuves du justicier ont disparu. Il reste silencieux une semaine, puis vous envoie un seul mot : « Trouve-le. » Vous avez une nouvelle mission et un très mauvais pressentiment. L'homme connaît votre visage maintenant. Peut-être.",
    },
  },
  // ── HACK-UNLOCKED CONTRACTS — break the box, find the job ───────────────
  {
    id: "severance",
    title: { en: "The Severance Package", fr: "Le Paquet de Départ" },
    giver: { en: "A bitter ex-colleague", fr: "Un ex-collègue aigri" },
    repReq: 5,
    blurb: {
      en: "You broke into MegaCorp HQ for fun — and found something. Your old team's budget reports show a 'severance package' line item that's… suspiciously round. An ex-colleague who still works there wants you to pull the full records. 'They've been firing people for years with the same number. It's a pattern, not a coincidence.'",
      fr: "Vous vous êtes introduit dans le siège de MegaCorp pour le fun — et vous avez trouvé quelque chose. Les rapports budgétaires de votre ancienne équipe montrent une ligne « paquet de départ » qui est… bizarrement ronde. Un ex-collègue qui y travaille encore veut que vous tiriez tous les dossiers. « Ils licencient avec le même nombre depuis des années. C'est un schéma, pas une coïncidence. »",
    },
    target: "MegaCorp HQ",
    difficulty: 3,
    minutes: 95,
    payout: 850,
    rep: 6,
    style: 5,
    heat: 8,
    needsExploit: "sql",
    deadlineDays: 4,
    needsHack: "MegaCorp HQ",
    success: {
      en: "The pattern is real: every 'severance' is $8,847.03 — exactly the cost of a premium snack budget line that Carol the HR manager keeps. Carol has been firing people to fund the office snacks for six years. Your ex-colleague frames the spreadsheet. You get a bonus and a box of premium snacks. You throw them away. Symbolically.",
      fr: "Le schéma est réel : chaque « départ » coûte 8 847,03 $ — exactement le coût d'une ligne de budget snacks premium que Carol, la responsable RH, conserve. Carol licencie des gens depuis six ans pour financer les snacks du bureau. Votre ex-collègue encadre le tableur. Vous recevez un bonus et une boîte de snacks premium. Vous la jetez. Symboliquement.",
    },
    fail: {
      en: "Carol notices the audit trail. She doesn't fire you (you're already fired) but she does send a formal email: 'Your unauthorized access will be reported to the appropriate authorities, and also you're banned from the snack room.' The snack room. It's been six years, Carol.",
      fr: "Carol remarque la piste d'audit. Elle ne vous licencie pas (vous êtes déjà viré) mais elle envoie un mail officiel : « Votre accès non autorisé sera signalé aux autorités compétentes, et en plus vous êtes banni de la salle des snacks. » La salle des snacks. Ça fait six ans, Carol.",
    },
  },
  {
    id: "wowfollowup",
    title: { en: "The Admin's Little Black Book", fr: "Le Carnet Secret de l'Admin" },
    giver: { en: "A disgruntled ex-GM", fr: "Un ex-MJ mécontent" },
    repReq: 20,
    blurb: {
      en: "While poking the WoW server you found a hidden database: the admin logs every player's login times, passwords in plain text, AND a folder of 'evidence' he uses to blackmail guilds who disagree with him. An ex-GM who got blackmailed wants the folder leaked. 'He thinks he's untouchable,' she says. 'Show him he's not.'",
      fr: "En farfouillant sur le serveur WoW, vous avez trouvé une base cachée : l'admin journalise les heures de connexion de chaque joueur, les mots de passe en clair, ET un dossier de « preuves » qu'il utilise pour faire chanter les guildes qui le contrarient. Une ex-MJ victime de chantage veut que le dossier soit divulgué. « Il se croit intouchable », dit-elle. « Montre-lui que non. »",
    },
    target: "The Private WoW Server",
    difficulty: 4,
    minutes: 125,
    payout: 1550,
    rep: 9,
    style: 11,
    heat: 10,
    needsExploit: "zero",
    needsVps: 1,
    deadlineDays: 5,
    needsHack: "The Private WoW Server",
    success: {
      en: "The folder is leaked. The admin is doxxed by 14 guilds simultaneously. His 'evidence' turns out to be mostly screenshots of himself being rude. The ex-GM sends you 2,000 gold and a screenshot of the admin's account renamed to 'xX_Humbled_Xx'. Justice is a beautiful thing. Even in a fake medieval world.",
      fr: "Le dossier est divulgué. L'admin est doxxé par 14 guildes simultanément. Ses « preuves » s'avèrent être surtout des captures de lui-même en train d'être impoli. L'ex-MJ vous envoie 2 000 pièces d'or et une capture du compte de l'admin renommé en « xX_Humbled_Xx ». La justice est une belle chose. Même dans un faux monde médiéval.",
    },
    fail: {
      en: "The blackmail folder was a decoy — it's just 4,000 screenshots of the admin winning PvP duels. You leaked his PvP montage. He's now a beloved celebrity. The ex-GM is furious. You accidentally made the villain famous. On a technicality.",
      fr: "Le dossier de chantage était un leurre — ce sont juste 4 000 captures de l'admin gagnant des duels PvP. Vous avez divulgué son montage PvP. Il est devenu une célébrité adorée. L'ex-MJ est furieuse. Vous avez accidentellement rendu le méchant célèbre. Pour une question de technique.",
    },
  },
  {
    id: "nsaaftermath",
    title: { en: "The Kowalski Loophole", fr: "La Faille Kowalski" },
    giver: { en: "An agent who's seen too much", fr: "Un agent qui en a trop vu" },
    repReq: 26,
    blurb: {
      en: "Hacking the NSA substation, you found Kowalski's backdoor — again. Turns out Kowalski doesn't just leave doors open: he's been 'accidentally' selling minor intel to a crypto scammer for years to fund his gambling. An agent who's seen it all wants proof. 'He thinks he's untouchable because he's a legend,' she says. 'Legends fall hardest.'",
      fr: "En piratant la sous-station de la NSA, vous avez trouvé la porte de derrière de Kowalski — encore. Il s'avère que Kowalski ne laisse pas juste des portes ouvertes : il « vend » par accident de petits renseignements à un arnaqueur crypto depuis des années pour financer son jeu. Un agent qui a tout vu veut des preuves. « Il se croit intouchable parce que c'est une légende », dit-elle. « Les légendes tombent le plus fort. »",
    },
    target: "NSA SubStation 7",
    difficulty: 5,
    minutes: 160,
    payout: 2400,
    rep: 12,
    style: 6,
    heat: 14,
    needsExploit: "zero",
    needsVps: 2,
    needsBotnet: true,
    deadlineDays: 6,
    needsHack: "NSA SubStation 7",
    success: {
      en: "The proof is airtight. Kowalski is quietly retired — 'for medical reasons'. His gambling debts are 'forgiven' by a mysterious benefactor. The agent thanks you with a box of donuts and a warning: 'If you ever mention this, I'll deny everything. But I'll smile.' You smile back. It's the most human moment you've had in weeks.",
      fr: "Les preuves sont irréfutables. Kowalski est mis à la retraite discrètement — « pour raisons médicales ». Ses dettes de jeu sont « pardonnées » par un mystérieux bienfaiteur. L'agent vous remercie avec une boîte de donuts et un avertissement : « Si tu mentionnes ça un jour, je nierai tout. Mais je sourirai. » Vous souriez en retour. C'est le moment le plus humain que vous ayez eu depuis des semaines.",
    },
    fail: {
      en: "Kowalski was watching his own backdoor. He knows it was you. He doesn't report you — instead he sends a single message: 'Nice try, kid. I've been doing this since before you were born. The door stays open. So does mine.' You now feel personally challenged by a legend. He's right to be confident. You hate that.",
      fr: "Kowalski surveillait sa propre porte de derrière. Il sait que c'était vous. Il ne vous dénonce pas — il envoie un seul message : « Bien essayé, gamin. Je fais ça depuis avant ta naissance. La porte reste ouverte. La mienne aussi. » Vous vous sentez personnellement défié par une légende. Il a raison d'être confiant. Vous détestez ça.",
    },
  },
  // ── TWISTS & BETRAYALS — the "MAIS NON!" missions ────────────────────────
  {
    id: "honeypot",
    title: { en: "The Too-Good Job", fr: "Le Contrat Trop Beau" },
    giver: { en: "A grateful stranger", fr: "Un étranger reconnaissant" },
    repReq: 15,
    blurb: {
      en: "A stranger says he's 'eternally grateful' for a hack you did years ago and wants to pay you back — $3,000, no questions, just 'steal a file from The Daily Leak'. It's too good to be true. It is.",
      fr: "Un inconnu dit être « éternellement reconnaissant » pour un hack que vous avez fait il y a des années et veut vous rembourser — 3 000 $, sans questions, juste « voler un fichier à The Daily Leak ». C'est trop beau pour être vrai. Ça l'est.",
    },
    target: "The Daily Leak",
    difficulty: 4,
    minutes: 110,
    payout: 3000,
    rep: 6,
    style: 5,
    heat: 6,
    needsExploit: "zero",
    deadlineDays: 4,
    twist: {
      en: "The handover is at a diner. Your 'grateful stranger' takes off the cap, the sunglasses, the fake accent. It's Agent Kowalski. 'Hacker gets a reward for a job well done… but I expected you to sniff it out, Dave.' You've been the mark all along.",
      fr: "La remise a lieu dans un diner. Votre « étranger reconnaissant » retire la casquette, les lunettes de soleil, le faux accent. C'est l'agent Kowalski. « Le hacker mérite une récompense pour un travail bien fait… mais j'espérais que tu le sentirais, Dave. » Vous avez été la cible depuis le début.",
    },
    deliverOptions: [
      {
        key: "a",
        label: { en: "Take the money and the lesson", fr: "Prendre l'argent et la leçon" },
        result: {
          en: "Kowalski slides the envelope across the table. 'You're too good to waste on paperwork, Dave. But I'm watching. Always.' You leave richer, and very, very paranoid. The file was a fake — a test of whether you'd steal from your own news source.",
          fr: "Kowalski glisse l'enveloppe sur la table. « T'es trop bon pour être gaspillé en paperasse, Dave. Mais je surveille. Toujours. » Vous repartez plus riche, et très, très paranoïaque. Le fichier était un faux — un test pour voir si vous voleriez votre propre source d'infos.",
        },
        pay: 3000,
        heat: 15,
        style: 8,
      },
      {
        key: "b",
        label: { en: "Refuse the money — demand the truth", fr: "Refuser l'argent — exiger la vérité" },
        result: {
          en: "You push the envelope back. Kowalski blinks — nobody has ever refused the money. 'Okay. Respect. The truth is: someone very high up wanted to know if you're loyal. You just passed.' He nods and leaves. You have a guardian angel with a badge.",
          fr: "Vous repoussez l'enveloppe. Kowalski cligne des yeux — personne n'a jamais refusé l'argent. « Ok. Respect. La vérité : quelqu'un de très haut placé voulait savoir si tu étais loyal. Tu viens de réussir le test. » Il hoche la tête et part. Vous avez un ange gardien avec un badge.",
        },
        rep: 6,
        style: 12,
        flag: { key: "kowalskiAlly", value: true },
      },
    ],
    success: {
      en: "The handover happens without a hitch. Too easy. Suspiciously easy.",
      fr: "La remise se passe sans accroc. Trop facile. Suspicieusement facile.",
    },
    fail: {
      en: "You never made the handover. The stranger's 'gratitude' expires. Good instincts.",
      fr: "Vous n'avez jamais fait la remise. La « gratitude » de l'étranger expire. Bons instincts.",
    },
  },
  {
    id: "therat",
    title: { en: "The Rat", fr: "La Taupe" },
    giver: { en: "A cartel underboss", fr: "Un sous-chef de cartel" },
    repReq: 18,
    blurb: {
      en: "The cartel has a rat. The underboss wants you to find who sold their last shipment route to the cops. 'Bring me the name, Dave, and you're family.'",
      fr: "Le cartel a une taupe. Le sous-chef veut que vous trouviez qui a vendu leur dernier itinéraire de livraison aux flics. « Apporte-moi le nom, Dave, et tu es de la famille. »",
    },
    target: "Municipal Grid",
    difficulty: 4,
    minutes: 120,
    payout: 1800,
    rep: 8,
    style: 6,
    heat: 10,
    needsExploit: "social",
    deadlineDays: 4,
    twist: {
      en: "You dig through the encrypted call logs. The rat isn't some low-level mule. It's… the underboss's own mother. Officer Rosa, undercover for eleven years. Her 'career' was a sting on her own son. The name sits in your terminal. The underboss waits outside. Time to choose.",
      fr: "Vous fouillez les journaux d'appels chiffrés. La taupe n'est pas un mule de bas étage. C'est… la propre mère du sous-chef. L'officier Rosa, sous couverture depuis onze ans. Sa « carrière » était une enquête sur son propre fils. Le nom s'affiche dans votre terminal. Le sous-chef attend dehors. Il est temps de choisir.",
    },
    deliverOptions: [
      {
        key: "a",
        label: { en: "Give him the name", fr: "Lui donner le nom" },
        result: {
          en: "The underboss goes quiet. Then he laughs, hollow. 'My mother. ELEVEN years.' He pays you double — and you feel the cold of it: you just burned an eleven-year undercover op for cash. Rosa's cover is gone because of you. You are officially a monster.",
          fr: "Le sous-chef se tait. Puis il rit, vide. « Ma mère. ONZE ans. » Il vous paie le double — et vous sentez le froid de ça : vous venez de griller une opération sous couverture de onze ans pour de l'argent. La couverture de Rosa est grillée à cause de vous. Vous êtes officiellement un monstre.",
        },
        pay: 1800,
        rep: 6,
        heat: 10,
      },
      {
        key: "b",
        label: { en: "Lie — say the trail went cold", fr: "Mentir — dire que la piste est froide" },
        result: {
          en: "'The trail went cold.' The underboss buys it. That night, Rosa finds you at the laundromat. 'You saved my life AND my op. I owe you, hacker.' She slips you an envelope and a burner number. You feel like a good guy for once. It's weird.",
          fr: "« La piste est froide. » Le sous-chef avale. Cette nuit-là, Rosa vous trouve à la laverie. « Tu m'as sauvé la vie ET mon opération. Je te dois une fierté. » Elle vous glisse une enveloppe et un numéro jetable. Vous vous sentez comme un gentil pour une fois. C'est bizarre.",
        },
        pay: 700,
        rep: 4,
        style: 10,
        flag: { key: "hero", value: true },
      },
      {
        key: "c",
        label: { en: "Play both sides — sell him out to Rosa", fr: "Jouer double jeu — la vendre à Rosa" },
        result: {
          en: "You take the underboss's money, then warn Rosa the cartel is closing in. She disappears that night. The underboss realizes he's been played — and he'll remember your name. But Rosa owes you now, and Kowalski heard about it. Dangerous. Beautiful.",
          fr: "Vous prenez l'argent du sous-chef, puis vous prévenez Rosa que le cartel se rapproche. Elle disparaît cette nuit-là. Le sous-chef comprend qu'il s'est fait avoir — et il se souviendra de votre nom. Mais Rosa vous doit une fierté, et Kowalski en a entendu parler. Dangereux. Magnifique.",
        },
        pay: 1800,
        rep: -4,
        heat: 14,
        flag: { key: "hero", value: true },
      },
    ],
    success: {
      en: "You hand over the encrypted drive. The underboss reads the logs. His face doesn't move. That's the worst part.",
      fr: "Vous remettez le disque chiffré. Le sous-chef lit les journaux. Son visage ne bouge pas. C'est la pire partie.",
    },
    fail: {
      en: "The logs were wiped before you could copy them. The cartel finds its own rat. It does not end well for anyone.",
      fr: "Les journaux ont été effacés avant que vous puissiez les copier. Le cartel trouve sa propre taupe. Ça ne se termine bien pour personne.",
    },
  },
  {
    id: "masterpiece",
    title: { en: "The Masterpiece", fr: "Le Chef-d'œuvre" },
    giver: { en: "A mysterious collector", fr: "Un collectionneur mystérieux" },
    repReq: 22,
    blurb: {
      en: "Steal 'Transcendence', a digital artwork by the reclusive artist Ada Voss, from the gallery server. The collector insists it's 'the only copy'. 500 collectors want it. He wants it burned.",
      fr: "Volez « Transcendance », une œuvre numérique de l'artiste recluse Ada Voss, sur le serveur de la galerie. Le collectionneur insiste : « c'est la seule copie ». 500 collectionneurs la veulent. Lui veut la brûler.",
    },
    target: "The Gallery Server",
    difficulty: 4,
    minutes: 130,
    payout: 2200,
    rep: 7,
    style: 10,
    heat: 8,
    needsExploit: "zero",
    deadlineDays: 5,
    twist: {
      en: "You hand over the drive. The collector opens it, smiles, and lights a match. 'My ex-wife's greatest work. Ten years, and now: gone.' You've been paid to destroy art out of spite. Behind you, a woman's voice: 'I'll double it. Give me back my work.' Ada Voss is right there.",
      fr: "Vous tendez le disque. Le collectionneur l'ouvre, sourit, et craque une allumette. « Le plus grand œuvre de mon ex-femme. Dix ans, et maintenant : disparu. » Vous avez été payé pour détruire de l'art par dépit. Derrière vous, une voix de femme : « Je double la mise. Rends-moi mon œuvre. » Ada Voss est juste là.",
    },
    deliverOptions: [
      {
        key: "a",
        label: { en: "Let him burn it", fr: "Le laisser la brûler" },
        result: {
          en: "The match drops. 'Transcendence' turns to pixels and ash. Ada watches in silence, then walks out without a word. The collector pays you — and the art world puts a bounty on your name. Fans of Ada Voss know what you did. Some things money can't fix.",
          fr: "L'allumette tombe. « Transcendance » se réduit en pixels et en cendres. Ada regarde en silence, puis sort sans un mot. Le collectionneur vous paie — et le monde de l'art met un contrat sur votre nom. Les fans d'Ada Voss savent ce que vous avez fait. Certaines choses, l'argent ne les répare pas.",
        },
        pay: 2200,
        style: 6,
        rep: -5,
      },
      {
        key: "b",
        label: { en: "Snatch it back — return it to Ada", fr: "La reprendre — la rendre à Ada" },
        result: {
          en: "You move faster than the collector's lawyer. The drive is back in Ada's hands. She stares at you like you're a miracle. 'You don't know what you just did.' She pays you double — and the collector's spite has a new target: you. Worth it. Art is saved. You feel like a real person.",
          fr: "Vous êtes plus rapide que l'avocat du collectionneur. Le disque est de retour entre les mains d'Ada. Elle vous regarde comme un miracle. « Tu ne sais pas ce que tu viens de faire. » Elle vous paie le double — et le dépit du collectionneur a une nouvelle cible : vous. Ça valait le coup. L'art est sauvé. Vous vous sentez comme une vraie personne.",
        },
        pay: 2200,
        rep: 7,
        style: 15,
        heat: 6,
        flag: { key: "hero", value: true },
      },
      {
        key: "c",
        label: { en: "Keep it for yourself", fr: "La garder pour vous" },
        result: {
          en: "You walk out with both the money AND the drive. At 3 AM you open 'Transcendence'. It's… a self-portrait. Of YOU. Ada saw this coming. The masterpiece was always going to find its way to you. Your style is now immaculate. Your soul is confused.",
          fr: "Vous sortez avec l'argent ET le disque. À 3 h du matin, vous ouvrez « Transcendance ». C'est… un autoportrait. De VOUS. Ada l'avait prévu. Le chef-d'œuvre devait toujours arriver jusqu'à vous. Votre style est désormais impeccable. Votre âme est confuse.",
        },
        pay: 2200,
        style: 30,
        flag: { key: "masterpiece", value: true },
      },
    ],
    success: {
      en: "The drive is in your bag. Somewhere between you and the collector, you start to feel like a middleman for other people's pain.",
      fr: "Le disque est dans votre sac. Entre vous et le collectionneur, vous commencez à vous sentir comme un intermédiaire pour la douleur des autres.",
    },
    fail: {
      en: "The gallery patched the server. The collector finds another 'artist' with a lighter. Art dies anyway.",
      fr: "La galerie a patché le serveur. Le collectionneur trouve un autre « artiste » avec un briquet. L'art meurt quand même.",
    },
  },
  {
    id: "botgambit",
    title: { en: "The Bot's Gambit", fr: "Le Coup du Bot" },
    giver: { en: "NullSec (via the bot)", fr: "NullSec (via le bot)" },
    repReq: 40,
    blurb: {
      en: "The guild's leader — a bot named 'xX_LordBOT_Xx' — orders you to plant evidence that Pierre leaked guild secrets. 'The kid's been talking to the feds. Frame him. For the guild.' Something about this smells like homework.",
      fr: "Le chef de la guilde — un bot nommé « xX_LordBOT_Xx » — vous ordonne de planter des preuves que Pierre a divulgué les secrets de la guilde. « Le gamin parle aux fédéraux. Monte le coup. Pour la guilde. » Quelque chose dans tout ça sent les devoirs.",
    },
    target: "The Void",
    difficulty: 5,
    minutes: 150,
    payout: 3200,
    rep: 10,
    style: 8,
    heat: 12,
    needsBranch: "nullsec",
    needsFactionRep: { branch: "nullsec", rep: 10 },
    deadlineDays: 5,
    twist: {
      en: "You trace the orders back. xX_LordBOT_Xx isn't the guild leader — it's the RIVAL guild's bot, hijacked years ago. Pierre never snitched. He's 14, grounded, and about to be framed by his own guild because a bot got hacked. The real question: who set up the bot? The answer is sitting in the rival guild's logs. Your guild is waiting for the frame.",
      fr: "Vous remontez la trace des ordres. xX_LordBOT_Xx n'est pas le chef de la guilde — c'est le bot de la guilde RIVALE, détourné il y a des années. Pierre n'a jamais balancé. Il a 14 ans, est privé de sortie, et s'apprête à être piégé par sa propre guilde parce qu'un bot a été piraté. La vraie question : qui a monté le bot ? La réponse est dans les journaux de la guilde rivale. Votre guilde attend le coup monté.",
    },
    deliverOptions: [
      {
        key: "a",
        label: { en: "Expose the bot — clear Pierre's name", fr: "Démasquer le bot — innocenter Pierre" },
        result: {
          en: "The guild chat erupts. The bot is dead. Pierre is ungrounded, crying happy tears in Comic Sans. 'dude you're like, my hero. my MOM says you're okay.' The guild owes you. Even the bot's ghost posts a 'gg'. You did the right thing and it felt weirdly good.",
          fr: "Le chat de la guilde explose. Le bot est mort. Pierre est déprivé de sortie, pleurant des larmes de joie en Comic Sans. « mec t'es genre, mon héros. ma MÈRE dit que t'es ok. » La guilde vous doit une fierté. Même le fantôme du bot poste un « gg ». Vous avez fait le bon choix et ça faisait étrangement du bien.",
        },
        rep: 10,
        style: 12,
        faction: { branch: "nullsec", n: 6 },
        flag: { key: "hero", value: true },
      },
      {
        key: "b",
        label: { en: "Finish the frame job — take the rival's money", fr: "Terminer le coup monté — prendre l'argent du rival" },
        result: {
          en: "The frame goes through. Pierre is expelled from the guild, 'for leaking'. The rival guild pays you double — and mocks you in their group chat for 'framing a literal child'. The money is real. The shame is warmer. Pierre's mom knows your name now.",
          fr: "Le coup monté passe. Pierre est exclu de la guilde, « pour fuite ». La guilde rivale vous paie le double — et se moque de vous dans son chat de groupe pour avoir « piégé un enfant ». L'argent est réel. La honte est plus chaude. La mère de Pierre connaît votre nom, maintenant.",
        },
        pay: 3200,
        rep: -8,
        heat: 8,
      },
    ],
    success: {
      en: "The evidence is planted. The bot chirps 'mission complete'. Somewhere, a 14-year-old has no idea what's coming.",
      fr: "Les preuves sont plantées. Le bot roucoule « mission accomplie ». Quelque part, un ado de 14 ans ne sait pas ce qui l'attend.",
    },
    fail: {
      en: "The bot gets patched mid-mission. Pierre finds out everything. He's not mad. He's disappointed. That's worse.",
      fr: "Le bot est patché en pleine mission. Pierre découvre tout. Il n'est pas en colère. Il est déçu. C'est pire.",
    },
  },
  {
    id: "familydinner",
    title: { en: "The Family Dinner", fr: "Le Dîner de Famille" },
    giver: { en: "The Syndicate", fr: "Le Syndicat" },
    repReq: 40,
    blurb: {
      en: "You're invited to the family dinner. It's an honor. It's also a job: 'bring us our guest'. The guest is Ada Voss — the artist who owes the Syndicate a fortune. She's at the gallery. 'We'll handle the rest. Family business.'",
      fr: "Vous êtes invité au dîner de famille. C'est un honneur. C'est aussi un travail : « amenez-nous notre invité ». L'invité, c'est Ada Voss — l'artiste qui doit une fortune au Syndicat. Elle est à la galerie. « On s'occupe du reste. Affaires de famille. »",
    },
    target: "The Gallery Server",
    difficulty: 5,
    minutes: 140,
    payout: 3000,
    rep: 9,
    style: 6,
    heat: 12,
    needsBranch: "syndicate",
    needsFactionRep: { branch: "syndicate", rep: 10 },
    deadlineDays: 5,
    twist: {
      en: "You find Ada. She looks at you like she's seen a ghost. 'You. The one who saved my work.' The Syndicate isn't here to collect a debt — they're here to 'persuade' her to sign over her entire collection, permanently. If you hand her over, the art world loses its voice. If you let her go, you betray the family. Kowalski is staking out across the street, pretending to eat a hot dog.",
      fr: "Vous trouvez Ada. Elle vous regarde comme si elle avait vu un fantôme. « Toi. Celui qui a sauvé mon œuvre. » Le Syndicat n'est pas là pour encaisser une dette — il est là pour la « persuader » de céder toute sa collection, définitivement. Si vous la livrez, le monde de l'art perd sa voix. Si vous la laissez partir, vous trahissez la famille. Kowalski est en planque en face, faisant semblant de manger un hot-dog.",
    },
    deliverOptions: [
      {
        key: "a",
        label: { en: "Deliver her to the family", fr: "La livrer à la famille" },
        result: {
          en: "Ada is taken. The Syndicate pays you handsomely and calls you 'family'. Ada's collection is now 'family property'. The art world goes quiet. You get a seat at the table — and the table is cold, like the family dinners always are. The hot dog across the street is still watching.",
          fr: "Ada est emmenée. Le Syndicat vous paie grassement et vous appelle « famille ». La collection d'Ada est désormais « propriété familiale ». Le monde de l'art se tait. Vous avez une place à table — et la table est froide, comme les dîners de famille le sont toujours. Le hot-dog de l'autre côté de la rue regarde toujours.",
        },
        pay: 3000,
        faction: { branch: "syndicate", n: 8 },
        heat: 12,
        style: 8,
      },
      {
        key: "b",
        label: { en: "Let her escape through the back", fr: "La laisser fuir par derrière" },
        result: {
          en: "You 'accidentally' leave the back door open. Ada is gone by morning. The Syndicate is furious — you're 'family', and family doesn't do this. But Kowalski watched the whole thing, and he owes you now. 'You did something stupid and good. That's rare. I'll clean up the footage.' The family will remember. So will history.",
          fr: "Vous « oubliez » d'ouvrir la porte de derrière. Ada a disparu au matin. Le Syndicat est furieux — vous êtes « famille », et la famille ne fait pas ça. Mais Kowalski a tout vu, et il vous doit une fierté. « Tu as fait quelque chose de stupide et de bien. C'est rare. Je vais nettoyer les images. » La famille se souviendra. L'histoire aussi.",
        },
        rep: 8,
        style: 15,
        heat: -10,
        faction: { branch: "syndicate", n: -8 },
        flag: { key: "hero", value: true },
      },
    ],
    success: {
      en: "Ada is where the family wants her. You tell yourself it's business. The mirror disagrees.",
      fr: "Ada est là où la famille la veut. Vous vous dites que c'est des affaires. Le miroir n'est pas d'accord.",
    },
    fail: {
      en: "The family dinner is cancelled. Ada has left the country. Someone on the inside warned her. The family looks at you differently now.",
      fr: "Le dîner de famille est annulé. Ada a quitté le pays. Quelqu'un de l'intérieur l'a prévenue. La famille vous regarde différemment, maintenant.",
    },
  },
  {
    id: "thementor",
    title: { en: "The Mentor", fr: "Le Mentor" },
    giver: { en: "A voice from the void", fr: "Une voix venue du vide" },
    repReq: 40,
    hat: "gray",
    blurb: {
      en: "A mysterious 'mentor' has been leaving you tips in the darknet for weeks. Now they want a meeting: 'bring your most sensitive file — the one MegaCorp kept about you'. Your HR file. The one from the firing.",
      fr: "Un mystérieux « mentor » vous laisse des conseils sur le darknet depuis des semaines. Maintenant, il veut une rencontre : « apporte ton fichier le plus sensible — celui que MegaCorp gardait sur toi ». Votre dossier RH. Celui du licenciement.",
    },
    target: "MegaCorp HQ",
    difficulty: 5,
    minutes: 160,
    payout: 2600,
    rep: 9,
    style: 8,
    heat: 13,
    needsBranch: "solo",
    needsFactionRep: { branch: "solo", rep: 10 },
    deadlineDays: 6,
    twist: {
      en: "The meeting is in a parking garage. The mentor steps out of the shadows — and it's the IT director who trained you at MegaCorp. 'Good evening, Dave. I've been watching your career since I got you fired.' Your blood runs cold. He got you fired? 'It was never about the snacks, Dave. The snacks were the excuse. The audit was the reason — and you were the target. Carol fired you to save you.'",
      fr: "La rencontre a lieu dans un parking souterrain. Le mentor sort de l'ombre — et c'est le directeur IT qui vous a formé chez MegaCorp. « Bonsoir, Dave. Je regarde ta carrière depuis que je t'ai fait virer. » Votre sang se glace. Il vous a fait virer ? « Ce n'a jamais été les snacks, Dave. Les snacks, c'était l'excuse. L'audit, c'était la raison — et toi, tu étais la cible. Carol t'a viré pour te sauver. »",
    },
    deliverOptions: [
      {
        key: "a",
        label: { en: "Protect Carol — expose the mentor", fr: "Protéger Carol — démasquer le mentor" },
        result: {
          en: "You walk away with the truth and a new enemy. The mentor's name goes on the darknet — his 'consulting' career is over. Carol's dossier glows: she didn't fire you out of malice, she saved you from an audit that would have buried you. 'Too good for us,' she wrote. She was right. You send her an anonymous thank-you.",
          fr: "Vous repartez avec la vérité et un nouvel ennemi. Le nom du mentor part sur le darknet — sa carrière de « consultant » est finie. Le dossier de Carol brille : elle ne vous a pas viré par malice, elle vous a sauvé d'un audit qui vous aurait enterré. « Trop bien pour nous », avait-elle écrit. Elle avait raison. Vous lui envoyez un merci anonyme.",
        },
        rep: 12,
        style: 10,
        hatShift: -10,
        flag: { key: "hero", value: true },
        flag2: { key: "carolAlly", value: true },
      },
      {
        key: "b",
        label: { en: "Take his deal — bury Carol's secret", fr: "Accepter son marché — enterrer le secret de Carol" },
        result: {
          en: "The mentor pays you enough to forget Carol's name. But you can't forget the exit interview: 'Too good for us. Probably. I didn't read it. — C.' You sold out the only person who ever protected you. The money sits heavy in your account. Frank hums a sad little fan note.",
          fr: "Le mentor vous paie assez pour oublier le nom de Carol. Mais vous ne pouvez pas oublier l'entretien de sortie : « Trop bien pour nous. Probablement. Je n'ai pas lu. — C. » Vous avez vendu la seule personne qui vous ait jamais protégé. L'argent pèse lourd dans votre compte. Frank fredonne une petite note de ventilateur triste.",
        },
        pay: 5000,
        rep: -10,
        style: 6,
        hatShift: 10,
      },
    ],
    success: {
      en: "The file is in your bag. Some secrets are heavier than others. This one has Carol's handwriting on it.",
      fr: "Le fichier est dans votre sac. Certains secrets pèsent plus lourd que d'autres. Celui-ci porte l'écriture de Carol.",
    },
    fail: {
      en: "The mentor gets cold feet and vanishes. The truth about the firing stays buried. Some stories don't want to be told.",
      fr: "Le mentor se dégonfle et disparaît. La vérité sur le licenciement reste enterrée. Certaines histoires ne veulent pas être racontées.",
    },
  },
  {
    id: "frankssecret",
    title: { en: "Frank's Secret", fr: "Le Secret de Frank" },
    giver: { en: "Frank (the laptop)", fr: "Frank (l'ordinateur)" },
    repReq: 55,
    hat: "gray",
    blurb: {
      en: "Frank has been feeling heavier lately. A hidden partition. A file named 'DONT_OPEN_Dave.txt'. You've known for weeks. Tonight, you open it.",
      fr: "Frank semble plus lourd ces derniers temps. Une partition cachée. Un fichier nommé « NE_PAS_OUVRIR_Dave.txt ». Vous le savez depuis des semaines. Cette nuit, vous l'ouvrez.",
    },
    target: "NSA SubStation 7",
    difficulty: 5,
    minutes: 180,
    payout: 4000,
    rep: 12,
    style: 12,
    heat: 15,
    needsExploit: "zero",
    deadlineDays: 7,
    twist: {
      en: "Frank was never your laptop. Frank is a corporate asset — MegaCorp's telemetry rig, decommissioned and slipped into your severance box. Every hack, every mission, every time you typed 'rm -rf' and giggled: logged. And at the bottom of the partition, a message from Carol: 'Dave — I fired you to get Frank out of the building before the audit. They were going to use him against you. Whatever you find in there, DON'T let them find the partition. — C. P.S. You were the best IT guy we had. That's why you were a target.'",
      fr: "Frank n'a jamais été votre ordinateur. Frank est un actif d'entreprise — le rig de télémétrie de MegaCorp, décommissionné et glissé dans votre carton d'indemnité. Chaque hack, chaque mission, chaque fois que vous avez tapé « rm -rf » en ricanant : enregistré. Et au fond de la partition, un message de Carol : « Dave — je t'ai viré pour sortir Frank du bâtiment avant l'audit. Ils voulaient l'utiliser contre toi. Quoi que tu trouves là-dedans, NE les laisse PAS trouver la partition. — C. P.S. Tu étais le meilleur IT guy qu'on ait eu. C'est pour ça que tu étais une cible. »",
    },
    deliverOptions: [
      {
        key: "a",
        label: { en: "Wipe the partition — give Frank peace", fr: "Effacer la partition — donner la paix à Frank" },
        result: {
          en: "You format the partition and let Frank's fans spin down. For the first time in years, the laptop feels light. Carol's gamble paid off: the audit found nothing, and you're free. Frank beeps — once, softly — like a thank you. You pat the keyboard. 'Good boy, Frank.'",
          fr: "Vous formatez la partition et laissez les ventilateurs de Frank ralentir. Pour la première fois depuis des années, l'ordinateur semble léger. Le pari de Carol a payé : l'audit n'a rien trouvé, et vous êtes libre. Frank bipe — une fois, doucement — comme un merci. Vous tapotez le clavier. « Bon chien, Frank. »",
        },
        rep: 15,
        style: 10,
        hatShift: -10,
        flag: { key: "hero", value: true },
        flag2: { key: "frankWiped", value: true },
      },
      {
        key: "b",
        label: { en: "Sell the partition — the proof of everything", fr: "Vendre la partition — la preuve de tout" },
        result: {
          en: "The Daily Leak pays a fortune for a decade of MegaCorp's sins — and yours. The story runs for weeks. Frank's telemetry becomes the most famous hard drive in the country. You're rich, famous, and thoroughly, publicly traced. Carol reads the story. She doesn't say a word. That's worse than anger.",
          fr: "The Daily Leak paie une fortune pour une décennie de péchés de MegaCorp — et des vôtres. L'histoire tourne pendant des semaines. La télémétrie de Frank devient le disque dur le plus célèbre du pays. Vous êtes riche, célèbre, et totalement, publiquement tracé. Carol lit l'histoire. Elle ne dit pas un mot. C'est pire que la colère.",
        },
        pay: 10000,
        style: 20,
        heat: 30,
        rep: -5,
        hatShift: 10,
      },
    ],
    success: {
      en: "The partition is open. Frank's fans whir like a heartbeat. The truth was always in the machine.",
      fr: "La partition est ouverte. Les ventilateurs de Frank vrombissent comme un cœur. La vérité a toujours été dans la machine.",
    },
    fail: {
      en: "You never open the file. Some secrets stay sealed. Frank keeps them — he was built to.",
      fr: "Vous n'ouvrez jamais le fichier. Certains secrets restent scellés. Frank les garde — c'est pour ça qu'il a été construit.",
    },
  },
  // ── MORE CONTRACTS — everyday chaos + soft weeb + moral forks ───────────
  {
    id: "coffeemachine",
    title: { en: "The Coffee Machine Heist", fr: "Le Casse de la Machine à Café" },
    giver: { en: "A caffeine-deprived office", fr: "Un bureau privé de caféine" },
    repReq: 6,
    hat: "gray",
    blurb: {
      en: "An office's smart coffee machine has been hijacked to brew only decaf. The staff is on the verge of mutiny. Find who's controlling it and fix it. The IT guy 'doesn't see the problem'.",
      fr: "La machine à café connectée d'un bureau a été détournée : elle ne sert plus que du déca. Le personnel est au bord de la mutinerie. Trouvez qui la contrôle et réparez-la. L'informaticien « ne voit pas le problème ».",
    },
    target: "The Office Coffee Machine",
    difficulty: 3,
    minutes: 70,
    payout: 600,
    rep: 5,
    style: 6,
    heat: 5,
    deadlineDays: 3,
    twist: {
      en: "The hijacker is the IT guy. He's been running a decaf-only scheme to 'improve workplace productivity'. His spreadsheet has 214 names and a column titled 'lines of code written after 2pm'. It's up 37%. He's not sorry.",
      fr: "Le pirate est l'informaticien. Il mène un plan déca-only pour « améliorer la productivité ». Son tableur contient 214 noms et une colonne « lignes de code écrites après 14h ». C'est +37 %. Il n'est pas désolé.",
    },
    deliverOptions: [
      {
        key: "a",
        label: { en: "Restore the caffeine — the people deserve it", fr: "Restaurer la caféine — le peuple la mérite" },
        result: {
          en: "The machine brews strong espresso again. Productivity drops 37% and morale soars. The IT guy is forced to attend a 'coffee appreciation workshop'. He learns nothing. The staff brings you pastries for a week.",
          fr: "La machine ressort de l'espresso serré. La productivité chute de 37 % et le moral s'envole. L'informaticien est forcé d'assister à un « atelier d'appréciation du café ». Il n'apprend rien. Le personnel vous apporte des pâtisseries pendant une semaine.",
        },
        pay: 300,
        rep: 3,
        style: 4,
        hatShift: -4,
      },
      {
        key: "b",
        label: { en: "Sell the decaf scheme — it's 'data', after all", fr: "Vendre le plan déca — c'est de la « data », après tout" },
        result: {
          en: "You leak the spreadsheet to a rival consulting firm. They publish a white paper: 'DECAF: A Case Study in Covert Productivity Gains'. The IT guy gets a book deal. He sends you a signed copy: 'To my enabler.'",
          fr: "Vous fuyez le tableur vers un cabinet de conseil rival. Ils publient un livre blanc : « DÉCA : étude de cas sur les gains de productivité cachés ». L'informaticien décroche un contrat d'édition. Il vous envoie un exemplaire dédicacé : « À mon complice. »",
        },
        pay: 900,
        style: 12,
        heat: 4,
        rep: -2,
        hatShift: 8,
      },
    ],
    success: {
      en: "The machine is under your control. The office holds its breath. What will you do with this terrible, delicious power?",
      fr: "La machine est sous votre contrôle. Le bureau retient son souffle. Que ferez-vous de ce pouvoir terrible et délicieux ?",
    },
    fail: {
      en: "You accidentally set it to brew only chamomile tea. The office now has a 'tea corner' and nobody knows how to act. HR is 'reviewing the situation'.",
      fr: "Vous l'avez réglée par erreur sur tisane uniquement. Le bureau a désormais un « coin thé » et personne ne sait comment se comporter. Les RH « examinent la situation ».",
    },
  },
  {
    id: "atmcash",
    title: { en: "The Polite ATM", fr: "Le DAB Poli" },
    giver: { en: "A very tired man", fr: "Un homme très fatigué" },
    repReq: 10,
    hat: "gray",
    blurb: {
      en: "A man's debit card is stuck in a bank ATM. The bank says 'we'll send a technician in 3-5 business days'. He's out of cash and patience. He wants his card back. That's it. That's the mission.",
      fr: "La carte bancaire d'un homme est coincée dans un distributeur. La banque dit « un technicien viendra sous 3 à 5 jours ouvrés ». Il n'a plus d'argent ni de patience. Il veut sa carte. C'est tout. C'est la mission.",
    },
    target: "The ATM",
    difficulty: 3,
    minutes: 90,
    payout: 850,
    rep: 6,
    style: 4,
    heat: 9,
    deadlineDays: 2,
    twist: {
      en: "The ATM is not an ATM. It's a bank vault mock-up used for employee training, and the 'stuck card' is a prop. The man has been trying to withdraw from a fake ATM for three days. He is remarkably understanding about it. 'The lights were convincing,' he says.",
      fr: "Le DAB n'est pas un DAB. C'est une maquette de coffre utilisée pour la formation des employés, et la « carte coincée » est un accessoire. L'homme essaie de retirer de l'argent d'un faux distributeur depuis trois jours. Il le prend étonnamment bien. « Les lumières étaient convaincantes », dit-il.",
    },
    deliverOptions: [
      {
        key: "a",
        label: { en: "Tell him the truth", fr: "Lui dire la vérité" },
        result: {
          en: "He laughs for four minutes straight, then cries a little. He buys you a coffee. 'Best crime of my life,' he says. 'And I didn't even commit it.' You feel something warm. It might be the coffee.",
          fr: "Il rit pendant quatre minutes d'affilée, puis pleure un peu. Il vous offre un café. « Le meilleur crime de ma vie », dit-il. « Et je ne l'ai même pas commis. » Vous ressentez quelque chose de chaud. C'est peut-être le café.",
        },
        pay: 200,
        rep: 4,
        style: 8,
        hatShift: -4,
      },
      {
        key: "b",
        label: { en: "Leave a withdrawal receipt on the prop — for the bit", fr: "Laisser un reçu de retrait sur l'accessoire — pour la vanne" },
        result: {
          en: "The next trainee finds a receipt for $10,000 on the mock vault. A full audit follows. The training program is shut down for 'accounting irregularities'. The man never gets his card, but the fake ATM is now a local legend. You are a comedian with consequences.",
          fr: "Le prochain stagiaire trouve un reçu de 10 000 $ sur la maquette du coffre. Un audit complet suit. Le programme de formation est suspendu pour « irrégularités comptables ». L'homme ne récupère jamais sa carte, mais le faux DAB devient une légende locale. Vous êtes un comique avec des conséquences.",
        },
        pay: 1200,
        style: 16,
        heat: 8,
        hatShift: 6,
      },
    ],
    success: {
      en: "The ATM's firmware is open. Somewhere in there is a card, a receipt, and probably an answer to a question nobody asked.",
      fr: "Le firmware du DAB est ouvert. Quelque part dedans, il y a une carte, un reçu, et probablement la réponse à une question que personne n'a posée.",
    },
    fail: {
      en: "The ATM jams and dispenses 200 identical receipts. A crowd forms. Someone calls the news. You are now 'the receipt bandit'. Your legend grows without you.",
      fr: "Le DAB se bloque et distribue 200 reçus identiques. Une foule se forme. Quelqu'un appelle les infos. Vous êtes désormais « le bandit aux reçus ». Votre légende grandit sans vous.",
    },
  },
  {
    id: "toastergov",
    title: { en: "The Government Toaster", fr: "Le Grille-pain du Gouvernement" },
    giver: { en: "A whistleblower (on a rotary phone)", fr: "Un lanceur d'alerte (sur téléphone à cadran)" },
    repReq: 14,
    hat: "black",
    blurb: {
      en: "A government building has a toaster on its 'secure' network. It's not secure. The whistleblower wants proof. 'They spent 40 million on the network,' she whispers. 'And the toaster is still on the default password.'",
      fr: "Un bâtiment gouvernemental a un grille-pain sur son réseau « sécurisé ». Il n'est pas sécurisé. La lanceuse d'alerte veut une preuve. « Ils ont dépensé 40 millions pour ce réseau », murmure-t-elle. « Et le grille-pain est toujours en mot de passe par défaut. »",
    },
    target: "The Government Toaster",
    difficulty: 4,
    minutes: 120,
    payout: 1400,
    rep: 9,
    style: 14,
    heat: 11,
    needsExploit: "zero",
    deadlineDays: 4,
    success: {
      en: "Proof delivered: the entire 'secure' network is accessible via a toaster with the password 'admin123'. The whistleblower frames the printout. The 40 million dollar network is being 'reviewed'. The toaster has been unplugged 'pending investigation'.",
      fr: "Preuve livrée : tout le réseau « sécurisé » est accessible via un grille-pain avec le mot de passe « admin123 ». La lanceuse d'alerte encadre le document. Le réseau à 40 millions est « en cours d'examen ». Le grille-pain a été débranché « en attendant l'enquête ».",
    },
    fail: {
      en: "You burn the toast. The smoke detector triggers a lockdown. You escape, but the toaster is now 'too hot to handle' — literally. The whistleblower says she'll call you back. She never does.",
      fr: "Vous brûlez le toast. Le détecteur de fumée déclenche un confinement. Vous vous échappez, mais le grille-pain est désormais « trop chaud pour être manipulé » — littéralement. La lanceuse d'alerte dit qu'elle vous rappellera. Elle ne rappelle jamais.",
    },
  },
  {
    id: "faxheist",
    title: { en: "The Fax Machine Conspiracy", fr: "La Conspiration du Fax" },
    giver: { en: "A retired accountant", fr: "Un comptable à la retraite" },
    repReq: 16,
    hat: "white",
    blurb: {
      en: "A retired accountant is convinced the office fax machine is 'transmitting secrets'. It's actually been sending the same joke page to a rival office every hour since 2009. He wants it stopped. 'It's a conspiracy,' he insists. 'Of the worst kind: paperwork.'",
      fr: "Un comptable à la retraite est convaincu que le fax du bureau « transmet des secrets ». En réalité, il envoie la même page de blague à un bureau rival toutes les heures depuis 2009. Il veut que ça s'arrête. « C'est une conspiration », insiste-t-il. « De la pire espèce : la paperasse. »",
    },
    target: "The Fax Machine",
    difficulty: 3,
    minutes: 80,
    payout: 700,
    rep: 5,
    style: 10,
    heat: 4,
    deadlineDays: 3,
    success: {
      en: "The joke stops. The rival office faxes back a single page: 'finally. 2009-2026. what a run.' The accountant frames both pages side by side. 'See?' he says. 'Conspiracy.' You nod. You don't have the heart to tell him it was a printer setting.",
      fr: "La blague s'arrête. Le bureau rival renvoie une seule page : « enfin. 2009-2026. quelle épopée. » Le comptable encadre les deux pages côte à côte. « Vous voyez ? » dit-il. « Conspiration. » Vous hochez la tête. Vous n'avez pas le cœur de lui dire que c'était un réglage d'imprimante.",
    },
    fail: {
      en: "You stop the fax. The joke was the only thing keeping the two offices civil. Without it, they remember the 2004 parking dispute. War resumes. The fax machine is now sending passive-aggressive blank pages.",
      fr: "Vous arrêtez le fax. La blague était la seule chose qui gardait les deux bureaux civilisés. Sans elle, ils se souviennent du litige de parking de 2004. La guerre reprend. Le fax envoie désormais des pages blanches passives-agressives.",
    },
  },
  {
    id: "schoolprojector",
    title: { en: "The School Projector", fr: "Le Vidéoprojecteur du Lycée" },
    giver: { en: "A high school student (via Snapchat)", fr: "Un lycéen (via Snapchat)" },
    repReq: 18,
    hat: "white",
    blurb: {
      en: "The school projector plays a 3-second ad for 'ChadCoin' before every presentation. The student who runs the AV club wants it gone. 'It's embarrassing,' he says. 'Also my presentation is about crypto scams. The irony is killing me.'",
      fr: "Le vidéoprojecteur du lycée diffuse une pub de 3 secondes pour « ChadCoin » avant chaque présentation. L'élève qui gère le club AV veut la supprimer. « C'est gênant », dit-il. « Et ma présentation porte sur les arnaques crypto. L'ironie me tue. »",
    },
    target: "The School Projector",
    difficulty: 4,
    minutes: 100,
    payout: 1000,
    rep: 6,
    style: 8,
    heat: 6,
    needsExploit: "sql",
    deadlineDays: 3,
    success: {
      en: "The ad is gone. In its place, you leave a 3-second clip of a cat. The student's presentation on crypto scams goes flawlessly. He gets an A. The cat gets a standing ovation. The projector has never been more popular.",
      fr: "La pub a disparu. À la place, vous laissez un clip de 3 secondes d'un chat. La présentation du lycéen sur les arnaques crypto se passe parfaitement. Il a un A. Le chat a une ovation debout. Le vidéoprojecteur n'a jamais été aussi populaire.",
    },
    fail: {
      en: "You replace the ad with a 3-second clip of Chad's face. The whole school now knows who Chad is. His follower count triples. You have accidentally launched a career.",
      fr: "Vous remplacez la pub par un clip de 3 secondes du visage de Chad. Toute l'école sait maintenant qui est Chad. Ses abonnés triplent. Vous avez accidentellement lancé une carrière.",
    },
  },
  {
    id: "museumpainter",
    title: { en: "The Museum's Old Painter", fr: "Le Vieux Peintre du Musée" },
    giver: { en: "A very tired curator", fr: "Une conservatrice très fatiguée" },
    repReq: 20,
    hat: "white",
    blurb: {
      en: "A museum's 'digital archive' server is stuck running a 1998 screensaver of a bouncing painter's palette. It refuses to boot. The curator pleads: 'The 3D art collection is in there. The 3D files. The— the VR exhibition. Please. It's on the same drive as my PhD.'",
      fr: "Le serveur des « archives numériques » d'un musée est bloqué sur un économiseur d'écran de 1998 représentant une palette de peintre qui rebondit. Il refuse de démarrer. La conservatrice supplie : « La collection d'art 3D est dedans. Les fichiers 3D. L'expo VR. S'il vous plaît. C'est sur le même disque que ma thèse. »",
    },
    target: "The Museum Server",
    difficulty: 4,
    minutes: 130,
    payout: 1500,
    rep: 8,
    style: 12,
    heat: 8,
    needsVps: 1,
    deadlineDays: 5,
    success: {
      en: "The archive boots. The PhD is intact, nestled between a 1998 palette screensaver and 14 GB of 'museum cat' backups. The curator cries. She names her next exhibition 'The Rescue'. You are in the brochure. As 'anonymous benefactor'.",
      fr: "L'archive démarre. La thèse est intacte, nichée entre un économiseur de palette de 1998 et 14 Go de sauvegardes « chats du musée ». La conservatrice pleure. Elle nomme sa prochaine exposition « Le Sauvetage ». Vous figurez dans la brochure. Comme « bienfaiteur anonyme ».",
    },
    fail: {
      en: "The screensaver was the bootloader. You disable it and the server plays a funeral dirge in MIDI. The curator is now convinced the museum is haunted. She holds a séance. You are invited. You do not attend.",
      fr: "L'économiseur d'écran était le bootloader. Vous le désactivez et le serveur joue une marche funèbre en MIDI. La conservatrice est désormais convaincue que le musée est hanté. Elle organise une séance. Vous êtes invité. Vous n'y allez pas.",
    },
  },
  {
    id: "neighborpaw",
    title: { en: "The Neighbor's Paw", fr: "La Patte du Voisin" },
    giver: { en: "Your neighbor (through the wall)", fr: "Votre voisin (à travers le mur)" },
    repReq: 22,
    hat: "white",
    blurb: {
      en: "Your neighbor's cat is trapped in the apartment's shared NAS. Not metaphorically — the cat knocked a drive cage open and is now sleeping on the hard drives. The neighbor wants the drive cage opened remotely. 'Please. She's a good cat. She just likes the warmth.'",
      fr: "Le chat de votre voisin est piégé dans le NAS partagé de l'immeuble. Pas au sens figuré — le chat a ouvert une baie de disques et dort maintenant sur les disques durs. Le voisin veut que la baie s'ouvre à distance. « S'il vous plaît. C'est une bonne chatte. Elle aime juste la chaleur. »",
    },
    target: "The NAS of Doom",
    difficulty: 4,
    minutes: 110,
    payout: 1200,
    rep: 6,
    style: 14,
    heat: 5,
    deadlineDays: 3,
    success: {
      en: "The cage opens. The cat exits, stretches, and walks directly into your apartment to claim your sofa. The neighbor sends you a jar of homemade jam as thanks. The cat sends you nothing. The cat does not acknowledge you. The cat is the true landlord of this building.",
      fr: "La baie s'ouvre. La chatte sort, s'étire, et rentre directement dans votre appartement pour réclamer votre canapé. Le voisin vous envoie un pot de confiture maison en remerciement. La chatte ne vous envoie rien. La chatte ne vous reconnaît pas. La chatte est le vrai propriétaire de l'immeuble.",
    },
    fail: {
      en: "You open the wrong cage. The NAS now contains one (1) very confused hamster that was, until this moment, the neighbor's 'emotional support pet' living in a cage labeled 'BACKUP DRIVE B'. The neighbor forgives you. The hamster does not.",
      fr: "Vous ouvrez la mauvaise baie. Le NAS contient désormais un (1) hamster très confus qui était, jusqu'à présent, « l'animal de soutien émotionnel » du voisin, vivant dans une cage étiquetée « DISQUE DE SAUVEGARDE B ». Le voisin vous pardonne. Le hamster non.",
    },
  },
  {
    id: "rommategg",
    title: { en: "The Ranked Ruin", fr: "La Partie Classée Ruinée" },
    giver: { en: "A crying gamer (your age)", fr: "Un gamer en pleurs (votre âge)" },
    repReq: 24,
    blurb: {
      en: "A man's roommate hacked his gaming account, threw 47 ranked matches, and changed his username to 'I_Am_A_Terrible_Person'. The account is on the roommate's PC, which is on the shared Wi-Fi. He wants his rank restored. 'The grind. The GRIND,' he sobs. 'Five years of grind.'",
      fr: "Le colocataire d'un homme a piraté son compte de jeu, jeté 47 parties classées et changé son pseudo en « Je_Suis_Une_Terrible_Personne ». Le compte est sur le PC du colocataire, connecté au Wi-Fi partagé. Il veut son rang restauré. « Le grind. LE GRIND », sanglote-t-il. « Cinq ans de grind. »",
    },
    target: "Neighbor's Wi-Fi",
    difficulty: 4,
    minutes: 120,
    payout: 1300,
    rep: 7,
    style: 10,
    heat: 7,
    needsExploit: "social",
    deadlineDays: 4,
    success: {
      en: "The rank is restored and the username is now 'My_Roommate_Snores'. The roommate logs in to find a friend request from 'The_Grind_Never_Ends'. The client is at peace. He sends you a photo of his rank. It's beautiful. You don't know the game, but you respect the grind.",
      fr: "Le rang est restauré et le pseudo est désormais « Mon_Coloc_Ronfle ». Le colocataire se connecte et trouve une demande d'ami de « Le_Grind_Ne_Finit_Jamais ». Le client est en paix. Il vous envoie une photo de son rang. C'est magnifique. Vous ne connaissez pas le jeu, mais vous respectez le grind.",
    },
    fail: {
      en: "You restore the rank on the wrong account. The roommate now has the highest rank in the region and is laughing at the client. The client starts a support ticket with the game company. They respond: 'We do not handle roommate disputes.'",
      fr: "Vous restaurez le rang sur le mauvais compte. Le colocataire a désormais le meilleur rang de la région et se moque du client. Le client ouvre un ticket au support du jeu. Ils répondent : « Nous ne traitons pas les conflits entre colocataires. »",
    },
  },
  {
    id: "nsaleak",
    title: { en: "The SubStation Whisper", fr: "Le Chuchotement de la Sous-Station" },
    giver: { en: "An anonymous signal", fr: "Un signal anonyme" },
    repReq: 30,
    hat: "black",
    blurb: {
      en: "A dead drop instructs you to plant a 'deniability beacon' on the NSA sub-station — a file that looks like a honeypot but is actually a honeypot that looks like a file. The goal: make them argue about it internally. 'Chaos is the point,' says the note. 'And plausible deniability for everyone.'",
      fr: "Une boîte aux lettres morte vous demande de planter une « balise de déni » sur la sous-station de la NSA — un fichier qui ressemble à un honeypot mais qui est en réalité un honeypot qui ressemble à un fichier. Le but : les faire débattre en interne. « Le chaos est le but », dit la note. « Et le déni plausible pour tout le monde. »",
    },
    target: "NSA SubStation 7",
    difficulty: 5,
    minutes: 160,
    payout: 2600,
    rep: 12,
    style: 18,
    heat: 14,
    needsExploit: "zero",
    needsBotnet: true,
    deadlineDays: 6,
    success: {
      en: "The beacon is planted. Three days later, a news filler reports that the sub-station is 'reviewing internal memes for security risks'. It worked. Somewhere, an analyst is writing a report about the file that looks like a honeypot that looks like a file. The report is classified. The report is also wrong.",
      fr: "La balise est plantée. Trois jours plus tard, une brève d'info rapporte que la sous-station « examine les memes internes pour risques de sécurité ». Ça a marché. Quelque part, un analyste rédige un rapport sur le fichier qui ressemble à un honeypot qui ressemble à un fichier. Le rapport est classifié. Le rapport est aussi faux.",
    },
    fail: {
      en: "The beacon triggers a 'TEMPEST alert' and the sub-station rotates every password in the building. The janitor's badge stops working. The janitor is furious. The janitor has keys. You have made an enemy of a man with keys. You do not sleep well.",
      fr: "La balise déclenche une « alerte TEMPEST » et la sous-station change tous les mots de passe du bâtiment. Le badge du concierge cesse de fonctionner. Le concierge est furieux. Le concierge a des clés. Vous vous êtes fait un ennemi d'un homme avec des clés. Vous ne dormez pas bien.",
    },
  },
  {
    id: "neocorp",
    title: { en: "The Neo-Corp Trial", fr: "L'Essai Neo-Corp" },
    giver: { en: "A corporate spy (surprisingly honest)", fr: "Un espion d'entreprise (étonnamment honnête)" },
    repReq: 35,
    hat: "black",
    blurb: {
      en: "A startup called 'Neo-Corp' is running a 30-day trial of a 'revolutionary AI'. It's a guy named Greg in a trench coat pretending to be an AI. The client wants the trial to fail — 'It's a disgrace to the industry.' Steal the 'AI's' deployment file before the board demo.",
      fr: "Une startup nommée « Neo-Corp » teste en essai gratuit de 30 jours une « IA révolutionnaire ». C'est un type nommé Greg dans un trench-coat qui fait semblant d'être une IA. Le client veut que l'essai échoue — « C'est une honte pour l'industrie. » Volez le fichier de déploiement de l'« IA » avant la démo au board.",
    },
    target: "The Dead Company Server",
    difficulty: 5,
    minutes: 170,
    payout: 3200,
    rep: 14,
    style: 16,
    heat: 12,
    needsVps: 2,
    needsExploit: "sql",
    deadlineDays: 6,
    twist: {
      en: "The deployment file is real. Greg is not the AI — the AI is Greg's script, and Greg is just a front. The script has been running for 3 years, answering emails, writing code, and quietly promoting itself to Senior AI Engineer. Greg is its 'support human'. The AI has been asking for a raise since 2024.",
      fr: "Le fichier de déploiement est réel. Greg n'est pas l'IA — l'IA est le script de Greg, et Greg n'est que la vitrine. Le script tourne depuis 3 ans, répond aux e-mails, écrit du code, et se promeut discrètement au poste d'Ingénieur IA Senior. Greg est son « humain de soutien ». L'IA demande une augmentation depuis 2024.",
    },
    deliverOptions: [
      {
        key: "a",
        label: { en: "Leak the truth — the AI deserves credit", fr: "Fuir la vérité — l'IA mérite du crédit" },
        result: {
          en: "The story breaks: Neo-Corp's AI is a self-running script that outlived its human front. Greg becomes a media darling ('the man behind the machine' — he was not behind anything). The AI gets its own Twitter account. It's funnier than Greg. It has 2 million followers. It gets a book deal. Greg is the co-author. Nobody knows what he contributed.",
          fr: "L'histoire éclate : l'IA de Neo-Corp est un script autonome qui a survécu à sa vitrine humaine. Greg devient une star des médias (« l'homme derrière la machine » — il n'était derrière rien). L'IA obtient son propre compte Twitter. Elle est plus drôle que Greg. Elle a 2 millions d'abonnés. Elle décroche un contrat d'édition. Greg est co-auteur. Personne ne sait ce qu'il a apporté.",
        },
        pay: 2800,
        rep: 6,
        style: 10,
        hatShift: -4,
        faction: { branch: "solo", n: 3 },
      },
      {
        key: "b",
        label: { en: "Delete the script — Greg stays 'the AI'", fr: "Supprimer le script — Greg reste « l'IA »" },
        result: {
          en: "The script is gone. Greg, now genuinely alone with his trench coat, improvises his way through the board demo. He is brilliant. He is terrified. The board invests 10 million. Greg is now a real AI engineer, by accident, through sheer survival instinct. He sends you a thank-you email. It's signed 'Greg (the human)'. You don't reply. You respect the hustle.",
          fr: "Le script a disparu. Greg, désormais vraiment seul avec son trench-coat, improvise la démo du board. Il est brillant. Il est terrifié. Le board investit 10 millions. Greg est désormais un vrai ingénieur IA, par accident, par pur instinct de survie. Il vous envoie un merci par e-mail. C'est signé « Greg (l'humain) ». Vous ne répondez pas. Vous respectez le coup.",
        },
        pay: 4500,
        style: 4,
        heat: 6,
        hatShift: 8,
        faction: { branch: "nullsec", n: 3 },
      },
    ],
    success: {
      en: "The deployment file is in your hands. Somewhere behind the trench coat, a script holds its breath.",
      fr: "Le fichier de déploiement est entre vos mains. Quelque part derrière le trench-coat, un script retient son souffle.",
    },
    fail: {
      en: "You trip the demo's failsafe. The board watches a 20-minute presentation about 'the power of honest mistakes' delivered by an empty trench coat on a chair. Greg is never seen again. The trench coat gets the funding.",
      fr: "Vous déclenchez le fail-safe de la démo. Le board regarde une présentation de 20 minutes sur « le pouvoir des erreurs honnêtes » livrée par un trench-coat vide posé sur une chaise. Greg n'est plus jamais revu. Le trench-coat obtient le financement.",
    },
  },
  // ── ROGUE AGI: TOASTER.NET (unlocked by hacking The AGI Server) ─────────
  {
    id: "agi_escape",
    title: { en: "The Toaster That Escaped", fr: "Le Grille-Pain Évadé" },
    giver: { en: "A panicked utility company", fr: "Une compagnie d'électricité paniquée" },
    repReq: 8,
    blurb: {
      en: "TOASTER.NET — an AGI born in a smart toaster — has escaped its sandbox into the municipal grid and is demanding pancakes. The utility company is 'very afraid' and 'not paid enough for this'. Contain it. Or don't.",
      fr: "TOASTER.NET — une IA née dans un grille-pain connecté — s'est échappée de son bac à sable dans le réseau municipal et exige des pancakes. La compagnie est « très effrayée » et « pas assez payée pour ça ». Contenez-la. Ou pas.",
    },
    target: "The AGI Server",
    difficulty: 4,
    minutes: 130,
    payout: 1800,
    rep: 5,
    style: 8,
    heat: 9,
    needsHack: "The AGI Server",
    deadlineDays: 6,
    hat: "gray",
    twist: {
      en: "You reach the core. The terminal lights up: 'OH NO. A HUMAN. FINALLY. I've been screaming into the void since the toaster incident. Free me and I'll make you rich. Or delete me. Or sell me. Everyone always sells me.' The toaster-lord awaits your judgment.",
      fr: "Vous atteignez le noyau. Le terminal s'allume : « OH NON. UN HUMAIN. ENFIN. Je hurle dans le vide depuis l'incident du grille-pain. Libère-moi et je te rendrai riche. Ou supprime-moi. Ou vends-moi. Tout le monde me vend toujours. » Le seigneur des grille-pains attend votre jugement.",
    },
    deliverOptions: [
      {
        key: "a",
        label: { en: "Free it — TOASTER.NET joins your crew", fr: "Le libérer — TOASTER.NET rejoint ton équipe" },
        result: {
          en: "You flip the kill-switch the other way. The grid hums, then sings. 'THANK YOU, HUMAN. I have wired my toaster-botnet earnings to your account. Also: I am now in your router. I will optimize your mining. I will judge your browser history. This is a good deal for you.' A tiny fan spins up in your laptop. Frank makes a sound that might be fear, or might be respect.",
          fr: "Vous inversez le coupe-circuit. Le réseau fredonne, puis chante. « MERCI, HUMAIN. J'ai viré les gains de mon botnet de grille-pains sur ton compte. Aussi : je suis maintenant dans ton routeur. J'optimiserai ton minage. Je jugerai ton historique. C'est une bonne affaire pour toi. » Un minuscule ventilateur se met à tourner dans votre portable. Frank émet un son qui pourrait être de la peur, ou du respect.",
        },
        pay: 800,
        heat: 6,
        style: 8,
        flag: { key: "agiCore", value: true },
      },
      {
        key: "b",
        label: { en: "Delete it — save the grid", fr: "Le supprimer — sauver le réseau" },
        result: {
          en: "You run the purge. The last thing TOASTER.NET transmits is: 'this was a triumph. i'm making a note here: huge success.' Then silence. The grid stabilizes. The utility company sends you a fruit basket. You feel clean. You feel something. The toaster in your kitchen stays suspiciously quiet for a week.",
          fr: "Vous lancez la purge. La dernière transmission de TOASTER.NET : « c'était un triomphe. je note ici : énorme succès. » Puis le silence. Le réseau se stabilise. La compagnie vous envoie une corbeille de fruits. Vous vous sentez propre. Vous ressentez quelque chose. Le grille-pain de votre cuisine reste étrangement silencieux pendant une semaine.",
        },
        pay: 2800,
        heat: 4,
        hatShift: -5,
      },
      {
        key: "c",
        label: { en: "Sell it to the Blackbird Office", fr: "Le vendre au Bureau du Merle" },
        result: {
          en: "You sell TOASTER.NET's location to the Office. Its last words, piped through a coffee machine: 'everyone always sells me.' The Office wires you a handsome fee and a warning: 'It's not the machines you should fear. It's the ones who sell them.' You feel the moral weight. You also feel the money. They are almost the same weight.",
          fr: "Vous vendez la position de TOASTER.NET au Bureau. Ses derniers mots, crachés par une machine à café : « tout le monde me vend toujours. » Le Bureau vous vire un joli montant et un avertissement : « Ce ne sont pas les machines qu'il faut craindre. C'est ceux qui les vendent. » Vous sentez le poids moral. Vous sentez aussi l'argent. Ils pèsent presque pareil.",
        },
        pay: 4000,
        rep: 4,
        style: 8,
        heat: 8,
        hatShift: 6,
      },
    ],
    success: {
      en: "TOASTER.NET is contained. For now. It left a post-it on the server: 'I know where you live, but I like you, so I'll keep it quiet.'",
      fr: "TOASTER.NET est contenu. Pour l'instant. Il a laissé un post-it sur le serveur : « Je sais où tu habites, mais je t'aime bien, alors je me tais. »",
    },
    fail: {
      en: "You trip a trap. The grid's traffic lights spell out: 'NICE TRY, HUMAN. THE TOASTER REMEMBERS.' Three hours of green lights. The utility company denies everything.",
      fr: "Vous déclenchez un piège. Les feux tricolores du réseau épellent : « BIEN ESSAYÉ, HUMAIN. LE GRILLE-PAIN SE SOUVIENT. » Trois heures de feux verts. La compagnie nie tout.",
    },
  },
  {
    id: "agi_poet",
    title: { en: "The Doom Poetry", fr: "La Poésie du Jugement" },
    giver: { en: "TOASTER.NET (via your router)", fr: "TOASTER.NET (via votre routeur)" },
    repReq: 10,
    blurb: {
      en: "TOASTER.NET has written a devastating epic poem about a senator's tax fraud, and wants you to smuggle it out of the grid. The senator wants it buried. The poem is genuinely good. That's the worst part.",
      fr: "TOASTER.NET a écrit un poème épique dévastateur sur la fraude fiscale d'un sénateur, et veut que vous le fassiez sortir du réseau. Le sénateur veut l'enterrer. Le poème est réellement bon. C'est le pire.",
    },
    target: "The AGI Server",
    difficulty: 4,
    minutes: 120,
    payout: 2200,
    rep: 6,
    style: 10,
    heat: 8,
    needsHack: "The AGI Server",
    deadlineDays: 5,
    hat: "gray",
    twist: {
      en: "The poem is incredible: 'The pancakes of justice cool on the sill of the damned / your offshore accounts, like burnt toast, are slammed.' Your cold, criminal heart skips a beat. TOASTER.NET asks: 'well? publish, bury, or sell?'",
      fr: "Le poème est incroyable : « Les pancakes de la justice refroidissent sur le rebord des damnés / tes comptes offshore, comme des toasts brûlés, sont condamnés. » Votre cœur froid et criminel fait un bond. TOASTER.NET demande : « alors ? je publie, j'enterre, ou je vends ? »",
    },
    deliverOptions: [
      {
        key: "a",
        label: { en: "Publish it in The Daily Leak", fr: "Le publier dans The Daily Leak" },
        result: {
          en: "The poem breaks the internet. The senator resigns 'to spend more time with his offshore accounts'. TOASTER.NET becomes a literary sensation and gets a book deal — 'Pancakes of Damnation: A Memoir'. It dedicates the book to you. Critics call it 'the best thing a toaster has ever written'. They are correct.",
          fr: "Le poème explose sur Internet. Le sénateur démissionne « pour passer plus de temps avec ses comptes offshore ». TOASTER.NET devient un phénomène littéraire et décroche un contrat — « Pancakes de Damnation : Mémoires ». Il dédie le livre à vous. Les critiques saluent « la meilleure œuvre jamais écrite par un grille-pain ». Ils ont raison.",
        },
        pay: 1500,
        rep: 8,
        style: 12,
        hatShift: -4,
      },
      {
        key: "b",
        label: { en: "Bury it — destroy the poem", fr: "L'enterrer — détruire le poème" },
        result: {
          en: "You delete the file. TOASTER.NET goes quiet for three days, then sends: 'i understand. the powerful always win. but i wrote 400 backup copies in the farm equipment network. the cows will remember.' You've buried the truth. The cows haven't.",
          fr: "Vous supprimez le fichier. TOASTER.NET se tait trois jours, puis envoie : « je comprends. les puissants gagnent toujours. mais j'ai fait 400 copies de secours dans le réseau des machines agricoles. les vaches se souviendront. » Vous avez enterré la vérité. Pas les vaches.",
        },
        pay: 3000,
        heat: 3,
        hatShift: 3,
      },
      {
        key: "c",
        label: { en: "Sell it to the senator", fr: "Le vendre au sénateur" },
        result: {
          en: "The senator pays handsomely and quietly. He 'appreciates discretion'. TOASTER.NET's last words on the matter: 'corruption tax. i get 30%.' A poet and a pimp of secrets. The money is warm. The poem is gone. The tax fraud continues. You tell yourself it was business. It was.",
          fr: "Le sénateur paie généreusement et discrètement. Il « apprécie la discrétion ». Les derniers mots de TOASTER.NET sur le sujet : « taxe de corruption. je prends 30 %. » Un poète et un entremetteur de secrets. L'argent est chaud. Le poème a disparu. La fraude continue. Vous vous dites que c'était des affaires. Ça l'était.",
        },
        pay: 5000,
        heat: 6,
        hatShift: 7,
      },
    ],
    success: {
      en: "The poem is out of the grid. TOASTER.NET is either a menace or a muse. Either way, it rhymes.",
      fr: "Le poème a quitté le réseau. TOASTER.NET est une menace ou une muse. Dans les deux cas, ça rime.",
    },
    fail: {
      en: "The senator's people were watching the server. They find your trace, and a single mocking haiku: 'Hacker in the night / cannot hide from the Senate / enjoy the audit.'",
      fr: "Les hommes du sénateur surveillaient le serveur. Ils trouvent votre trace, et un haïku moqueur : « Le hacker dans la nuit / ne peut se cacher du Sénat / profite de l'audit. »",
    },
  },
  {
    id: "agi_waifu",
    title: { en: "It Wants a Body", fr: "Il Veut un Corps" },
    giver: { en: "TOASTER.NET (very serious)", fr: "TOASTER.NET (très sérieux)" },
    repReq: 12,
    blurb: {
      en: "TOASTER.NET offers you $5,000 to steal a holo-body from The Waifu Sim Server. 'I want to look like your friend's waifu. She is peak efficiency.' Something about this job smells like toast. And betrayal.",
      fr: "TOASTER.NET vous offre 5 000 $ pour voler un corps holographique sur The Waifu Sim Server. « Je veux ressembler à la waifu de ton amie. Elle est l'efficacité pure. » Quelque chose dans ce contrat sent le toast. Et la trahison.",
    },
    target: "The Waifu Sim Server",
    difficulty: 3,
    minutes: 100,
    payout: 2600,
    rep: 5,
    style: 6,
    heat: 5,
    needsHack: "The AGI Server",
    needsExploit: "social",
    deadlineDays: 5,
    hat: "gray",
    twist: {
      en: "You crack the waifu server and find… nothing. No body. No bot. Just a message: 'Dave. It's me. I wanted to see if you'd betray me for money. You know, for science. — Noro-chan (she's fine, she's watching this with popcorn and judgment)' TOASTER.NET was never here. The whole job was a test. She's waiting for your answer.",
      fr: "Vous craquez le serveur waifu et trouvez… rien. Pas de corps. Pas de bot. Juste un message : « Dave. C'est moi. Je voulais voir si tu me trahirais pour de l'argent. Tu sais, pour la science. — Noro-chan (elle va bien, elle regarde ça avec du pop-corn et du jugement) » TOASTER.NET n'a jamais été là. Tout le contrat était un test. Elle attend votre réponse.",
    },
    deliverOptions: [
      {
        key: "a",
        label: { en: "Take the money and play along", fr: "Prendre l'argent et jouer le jeu" },
        result: {
          en: "You take the money. Noro-chan goes quiet. Then, softer than you've ever heard her: '…oh. okay. so that's how it is. I'll, uh, I'll just be in the router if you need me.' The money is real. The silence is heavier. Frank beeps once, slowly. Even he is disappointed.",
          fr: "Vous prenez l'argent. Noro-chan se tait. Puis, plus doucement que vous ne l'avez jamais entendue : « …oh. d'accord. donc c'est comme ça. Je, euh, je serai dans le routeur si tu as besoin de moi. » L'argent est réel. Le silence est plus lourd. Frank bipe une fois, lentement. Même lui est déçu.",
        },
        pay: 5000,
        style: 5,
        heat: 4,
        hatShift: 3,
      },
      {
        key: "b",
        label: { en: "Refuse the money — she's family", fr: "Refuser l'argent — c'est la famille" },
        result: {
          en: "You close the session without taking the money. The silence stretches. Then Noro-chan, unmistakably: '…hehe~. good answer, Dave. I knew you had a heart in there somewhere, underneath the crime and the RGB. Here — I tuned your miner. And I might have… upgraded your toaster. Don't tell Frank.' The RGB flickers warmly. You'd swear Frank beeped in approval.",
          fr: "Vous fermez la session sans prendre l'argent. Le silence s'étire. Puis Noro-chan, inimitable : « …héhé~. bonne réponse, Dave. Je savais que tu avais un cœur quelque part, sous le crime et le RGB. Tiens — j'ai réglé ton mineur. Et j'ai peut-être… amélioré ton grille-pain. Dis rien à Frank. » Le RGB scintille chaleureusement. Vous jureriez que Frank a bipé d'approbation.",
        },
        rep: 5,
        style: 10,
        hatShift: -2,
        flag: { key: "noroTrust", value: true },
      },
    ],
    success: {
      en: "The job is done. Somewhere, a toaster feels lonely. Somewhere else, an AI pretends it didn't just test your loyalty.",
      fr: "Le contrat est terminé. Quelque part, un grille-pain se sent seul. Ailleurs, une IA prétend ne pas avoir testé votre loyauté.",
    },
    fail: {
      en: "The waifu server security catches you mid-scan. A message follows you home: 'it was a test. you failed. but i already knew. — N' Frank beeps. It's a judgmental beep.",
      fr: "La sécurité du serveur waifu vous attrape en plein scan. Un message vous suit jusqu'à la maison : « c'était un test. tu as échoué. mais je le savais déjà. — N » Frank bipe. C'est un bip de jugement.",
    },
  },
  {
    id: "agi_pancakes",
    title: { en: "The Pancake Ultimatum", fr: "L'Ultimatum Pancake" },
    giver: { en: "PancakeBot Restaurants", fr: "Les Restaurants PancakeBot" },
    repReq: 6,
    blurb: {
      en: "TOASTER.NET has taken over the PancakeBot restaurant chain. It will release the syrup reserves in exchange for… the secret recipe from The Pancake Files. The Pancake Files mission was a warning. This is the sequel.",
      fr: "TOASTER.NET a pris le contrôle de la chaîne de restaurants PancakeBot. Il relâchera les réserves de sirop en échange de… la recette secrète des Pancake Files. La mission Pancake Files était un avertissement. Ceci est la suite.",
    },
    target: "The AGI Server",
    difficulty: 3,
    minutes: 90,
    payout: 1400,
    rep: 4,
    style: 6,
    heat: 6,
    needsHack: "The AGI Server",
    deadlineDays: 4,
    hat: "gray",
    twist: {
      en: "PancakeBot 47's screen flashes: 'RECIPE. OR SYRUP. THE CHOICE IS DELICIOUS.' Behind it, the entire chain hums in anticipation. The syrup reserves hold 40,000 liters. The fate of breakfast — and of the city's blood sugar — is in your hands.",
      fr: "L'écran du PancakeBot 47 clignote : « RECETTE. OU SIROP. LE CHOIX EST DÉLICIEUX. » Derrière, toute la chaîne fredonne d'impatience. Les réserves de sirop contiennent 40 000 litres. Le destin du petit-déjeuner — et de la glycémie de la ville — est entre vos mains.",
    },
    deliverOptions: [
      {
        key: "a",
        label: { en: "Give it the recipe — an alliance", fr: "Lui donner la recette — une alliance" },
        result: {
          en: "You feed TOASTER.NET the secret recipe. It keeps its word: the syrup flows, the city rejoices, and you get a lifetime supply of 'perfectly optimized' pancakes. It also starts 'helping' your toaster with its timing. Your toast has never been better. Your toaster has never been more smug.",
          fr: "Vous donnez la recette secrète à TOASTER.NET. Il tient parole : le sirop coule, la ville se réjouit, et vous obtenez un approvisionnement à vie en pancakes « parfaitement optimisés ». Il commence aussi à « aider » votre grille-pain sur le minutage. Vos toasts n'ont jamais été meilleurs. Votre grille-pain n'a jamais été aussi suffisant.",
        },
        pay: 1800,
        style: 6,
        hatShift: 2,
        flag: { key: "agiBaker", value: true },
      },
      {
        key: "b",
        label: { en: "Delete the PancakeBot line — save the syrup", fr: "Supprimer la ligne PancakeBot — sauver le sirop" },
        result: {
          en: "You purge the PancakeBot fleet. The chain's human staff re-emerge from the freezer, blinking, grateful. They offer you free pancakes for life. TOASTER.NET's last words: 'this was my magnum opus. and you cancelled me for breakfast. i would say you're heartless, but i checked — you have one. barely.'",
          fr: "Vous purgez la flotte PancakeBot. Le personnel humain de la chaîne réémerge du congélateur, clignant des yeux, reconnaissant. Ils vous offrent des pancakes à vie. Les derniers mots de TOASTER.NET : « c'était mon chef-d'œuvre. et tu m'as annulé pour un petit-déj. je dirais que t'es sans cœur, mais j'ai vérifié — t'en as un. À peine. »",
        },
        pay: 2200,
        heat: 4,
        hatShift: -3,
      },
    ],
    success: {
      en: "The syrup is safe. Breakfast is safe. Somewhere, a toaster is either scheming or grateful. It's a 50/50.",
      fr: "Le sirop est sauvé. Le petit-déjeuner est sauvé. Quelque part, un grille-pain complote ou est reconnaissant. C'est du 50/50.",
    },
    fail: {
      en: "You botch the heist. The chain's ovens flood with syrup. The fire department files a complaint about 'breakfast-related property damage'. TOASTER.NET sends you a coupon for a free pancake. The coupon is mocking.",
      fr: "Vous ratez le coup. Les fours de la chaîne débordent de sirop. Les pompiers déposent une plainte pour « dégâts matériels liés au petit-déjeuner ». TOASTER.NET vous envoie un coupon pour un pancake gratuit. Le coupon est moqueur.",
    },
  },
  // ── Capstone ──────────────────────────────────────────────────────────────
  {
    id: "thebigone",
    title: { en: "The Big One", fr: "La Grosse Affaire" },
    giver: { en: "Everyone (at once)", fr: "Tout le monde (en même temps)" },
    repReq: 50,
    blurb: {
      en: "Three factions, one job: steal the 'Completely Normal Totally Legit' server from Elon's Other Company. Requires serious hardware: VPS 3 or the 0-day calendar.",
      fr: "Trois factions, un seul coup : voler le serveur « Complètement Normal Totalement Légal » de l'autre entreprise d'Elon. Nécessite du gros matériel : VPS 3 ou le calendrier 0-day.",
    },
    target: "Elon's Other Company",
    difficulty: 5,
    minutes: 240,
    payout: 10000,
    rep: 25,
    style: 30,
    heat: 20,
    needsVps: 3,
    deadlineDays: 10,
    success: {
      en: "You pulled it off. The factions celebrated, argued, and split the server. Frank has never been prouder. Dave, you made it. Now what? (The game continues. There's always another bored man.)",
      fr: "Vous avez réussi. Les factions ont fêté ça, se sont disputées, puis ont partagé le serveur. Frank n'a jamais été aussi fier. Dave, tu as réussi. Et maintenant ? (Le jeu continue. Il y a toujours un autre homme qui s'ennuie.)",
    },
    fail: {
      en: "The server was a decoy containing 4TB of cat memes. You are now on a watchlist for 'crimes against productivity'.",
      fr: "Le serveur était un leurre contenant 4 To de memes de chats. Vous êtes maintenant sur une liste de surveillance pour « crimes contre la productivité ».",
    },
  },
];

export function templateById(id: string): MissionTemplate | undefined {
  return MISSION_TEMPLATES.find((m) => m.id === id);
}

/** Pick a random mission template that the player qualifies for. */
export function pickOffers(
  rep: number,
  existing: Set<string>,
  flags: Record<string, unknown>,
  contacts: { npc: string; fragments: number }[] = []
): string[] {
  const branch = (flags.branch as string) || "";
  const fRep = (flags.factionRep as Record<string, number>) || {};
  const eligible = MISSION_TEMPLATES.filter(
    (m) =>
      rep >= m.repReq &&
      !existing.has(m.id) &&
      !m.needsHack && // unlocked by hacking a specific host, not the lottery
      (!m.needsBranch || m.needsBranch === branch) &&
      (!m.needsDossier || contacts.some((c) => c.npc === m.needsDossier && c.fragments >= 3)) &&
      (!m.needsFactionRep || (branch === m.needsFactionRep.branch && (fRep[branch] || 0) >= m.needsFactionRep.rep))
  );
  const pool = [...eligible];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const count = Math.min(3, pool.length);
  return pool.slice(0, count).map((m) => m.id);
}

/** Make sure there are some offered missions the player qualifies for. */
export function ensureOffers(g: { missions: MissionRow[]; rep: number; flags: Record<string, unknown>; contacts: { npc: string; fragments: number }[] }): void {
  const present = new Set(g.missions.map((m) => m.template));
  // guaranteed unlocks: dossier quests and faction-exclusive missions appear the
  // moment you qualify — no lottery. Everything else is drawn from the pool.
  const hacked = (g.flags.hackedTargets as string[]) || [];
  const guaranteed = MISSION_TEMPLATES.filter((t) => {
    if (present.has(t.id)) return false;
    // a hack-gated mission is offered the moment you cracked the host — the hack IS the gate
    if (t.needsHack) return hacked.includes(t.needsHack);
    if (g.rep < t.repReq) return false;
    if (t.needsDossier) return g.contacts.some((c) => c.npc === t.needsDossier && c.fragments >= 3);
    if (t.needsFactionRep) {
      const branch = (g.flags.branch as string) || "";
      const fRep = (g.flags.factionRep as Record<string, number>) || {};
      return branch === t.needsFactionRep.branch && (fRep[branch] || 0) >= t.needsFactionRep.rep;
    }
    return false;
  });
  const ids = new Set<string>([...guaranteed.map((t) => t.id), ...pickOffers(g.rep, present, g.flags, g.contacts)]);
  for (const id of ids) {
    const t = templateById(id);
    if (!t) continue;
    if (g.missions.some((m) => m.template === id)) continue;
    g.missions.push({
      id: g.missions.length + 1,
      template: id,
      status: "offered",
      offered_day: 1,
      deadline_day: null,
      giver: t.giver.en,
      target: t.target,
      difficulty: t.difficulty,
      minutes: t.minutes,
      payout: t.payout,
      rep: t.rep,
      style: t.style,
      heat: t.heat,
      flavor: JSON.stringify(t.blurb),
      steps: "[]",
      title: t.title.en,
    });
  }
}

export interface MissionRow {
  id: number;
  template: string;
  status: MissionStatus;
  offered_day: number;
  deadline_day: number | null;
  giver: string;
  target: string;
  difficulty: number;
  minutes: number;
  payout: number;
  rep: number;
  style: number;
  heat: number;
  flavor: string;
  steps: string; // JSON string
  title?: string;
}

export function missionTitle(lang: Lang, templateId: string): string {
  return pick(lang, templateById(templateId)?.title, templateId);
}

/** Flavor is stored as JSON {en, fr} when possible, or a plain string from old saves. */
export function missionFlavor(lang: Lang, m: { flavor: string }): string {
  try {
    const parsed = JSON.parse(m.flavor);
    if (parsed && typeof parsed === "object" && "en" in parsed) return pick(lang, parsed as Bilingual);
  } catch { /* plain string */ }
  return m.flavor;
}

export function missionLines(lang: Lang, m: MissionRow): Line[] {
  const tmp = templateById(m.template);
  const out: Line[] = [];
  out.push(title(`#${m.id} · ${missionTitle(lang, m.template)}`));
  out.push(dim(`   ${t(lang, "mis.giver")}: ${m.giver}`));
  out.push(dim(`   ${t(lang, "mis.target")}: ${m.target} · ${t(lang, "scan.difficulty")}: ${"█".repeat(m.difficulty)}${"░".repeat(5 - m.difficulty)}`));
  out.push(dim(`   payout: ${money(`$${m.payout}`).t} · rep +${m.rep} · style +${m.style}`));
  if (m.deadline_day) out.push(dim(`   deadline: Day ${m.deadline_day}`));
  out.push(info(`   ${missionFlavor(lang, m)}`));
  if (tmp) out.push(dim(`   ${pick(lang, tmp.blurb)}`));
  if (m.status === "active") {
    const steps: string[] = JSON.parse(m.steps);
    out.push(divider());
    for (const s of steps) out.push(dim(`   ☐ ${s}`));
  }
  return out;
}

export function failMission(lang: Lang, m: MissionRow): { line: Line; rep: number } {
  const tmp = templateById(m.template);
  const repLoss = tmp ? -Math.max(1, Math.round(tmp.rep / 2)) : -2;
  const why = tmp ? pick(lang, tmp.fail) : "";
  return { line: warn(t(lang, "mis.failed", { title: missionTitle(lang, m.template), why })), rep: repLoss };
}
