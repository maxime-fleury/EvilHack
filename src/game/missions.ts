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
  /** NPC id — only offered once you hold a full 3/3 dossier on them. */
  needsDossier?: string;
  /** Faction-exclusive: offered once your faction reputation with that branch reaches rep. */
  needsFactionRep?: { branch: string; rep: number };
  /** The "MAIS NON!" reveal shown at delivery. */
  twist?: Bilingual;
  /** Moral fork at delivery: pick with `missions deliver <id> <key>`. */
  deliverOptions?: DeliverOption[];
  success: Bilingual;
  fail: Bilingual;
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
  const guaranteed = MISSION_TEMPLATES.filter((t) => {
    if (present.has(t.id) || g.rep < t.repReq) return false;
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
