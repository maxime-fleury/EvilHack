import type { Bilingual, Lang } from "./i18n";
import { pick } from "./i18n";

// ── The cast of fake people ────────────────────────────────────────────────
// Names stay in English; roles and secrets are bilingual.

export interface NpcSecret {
  title: Bilingual;
  text: Bilingual;
}

export interface Npc {
  id: string;
  name: string;
  role: Bilingual;
  employer: string; // hackable target where fragments drop
  juice: number; // how much their dossier sells for
  salePunchline: Bilingual;
  secrets: [NpcSecret, NpcSecret, NpcSecret];
}

export const NPCS: Npc[] = [
  {
    id: "brenda",
    name: "Brenda",
    role: { en: "The Intern", fr: "La Stagiaire" },
    employer: "MegaCorp HQ",
    juice: 90,
    salePunchline: {
      en: "BREAKING: intern knows where the good snacks are. Chaos follows.",
      fr: "EXCLUSIF : la stagiaire sait où sont les bons snacks. Chaos garanti.",
    },
    secrets: [
      { title: { en: "The Snack Map", fr: "La Carte des Snacks" }, text: { en: "Brenda maintains a color-coded spreadsheet of every vending machine in MegaCorp, including restock days.", fr: "Brenda tient un tableau coloré de tous les distributeurs de MegaCorp, jours de réapprovisionnement inclus." } },
      { title: { en: "The PowerPoint", fr: "Le PowerPoint" }, text: { en: "Brenda's 'internship report' is 4 slides of a frog in a tiny hat. She got a raise.", fr: "Le « rapport de stage » de Brenda fait 4 diapositives d'une grenouille en petit chapeau. Elle a eu une augmentation." } },
      { title: { en: "The Office Plant", fr: "La Plante de Bureau" }, text: { en: "Brenda is responsible for 'Kevin', the office plant. Kevin died in 2021. Nobody noticed.", fr: "Brenda s'occupe de « Kevin », la plante de bureau. Kevin est mort en 2021. Personne ne l'a remarqué." } },
    ],
  },
  {
    id: "vlad",
    name: "Vlad",
    role: { en: "Crypto Bro", fr: "Frère Crypto" },
    employer: "CryptoBros Collective",
    juice: 140,
    salePunchline: {
      en: "INTERVIEW: crypto bro admits his 'cold wallet' is a sticky note on his monitor.",
      fr: "INTERVIEW : un frère crypto avoue que son « wallet froid » est un post-it sur son écran.",
    },
    secrets: [
      { title: { en: "The Sticky Note", fr: "Le Post-it" }, text: { en: "Vlad's entire crypto fortune is secured by a password written on a post-it: 'Vl@dC0ins!'", fr: "Toute la fortune crypto de Vlad est protégée par un mot de passe écrit sur un post-it : « Vl@dC0ins! »" } },
      { title: { en: "The Lambo Deposit", fr: "L'Épargne Lambo" }, text: { en: "Vlad has been saving for a Lambo since 2017. Current balance: $1,247. He tells people it's 'imminent'.", fr: "Vlad économise pour une Lambo depuis 2017. Solde actuel : 1 247 $. Il dit à tout le monde que c'est « imminent »." } },
      { title: { en: "The Group Chat", fr: "Le Groupe de Discussion" }, text: { en: "Vlad runs a 400-member crypto group chat where 399 members are Vlad.", fr: "Vlad anime un groupe crypto de 400 membres… dont 399 sont Vlad." } },
    ],
  },
  {
    id: "chen",
    name: "Mrs. Chen",
    role: { en: "Landlord", fr: "Propriétaire" },
    employer: "Chen Realty LLC",
    juice: 160,
    salePunchline: {
      en: "EXPOSED: landlord's 'fixing the heating' is actually just yelling at the boiler.",
      fr: "RÉVÉLATION : « réparer le chauffage », c'est en fait juste crier sur la chaudière.",
    },
    secrets: [
      { title: { en: "The Boiler", fr: "La Chaudière" }, text: { en: "Mrs. Chen has 'fixed' the boiler 47 times by yelling at it in Mandarin. It works because the boiler is scared of her.", fr: "Mme Chen a « réparé » la chaudière 47 fois en lui criant dessus en mandarin. Ça marche parce que la chaudière a peur d'elle." } },
      { title: { en: "The Dumpling Empire", fr: "L'Empire des Raviolis" }, text: { en: "Mrs. Chen runs an underground dumpling operation out of unit 2B. Michelin sent a spy. They never returned.", fr: "Mme Chen dirige un trafic souterrain de raviolis depuis le logement 2B. Michelin a envoyé un espion. Il n'est jamais revenu." } },
      { title: { en: "The Deposit", fr: "La Caution" }, text: { en: "Mrs. Chen keeps every security deposit in a shoebox labeled 'DO NOT OPEN' under her bed. The shoebox contains exactly $14 and a lottery ticket.", fr: "Mme Chen garde toutes les cautions dans une boîte à chaussures marquée « NE PAS OUVRIR » sous son lit. La boîte contient exactement 14 $ et un ticket de loterie." } },
    ],
  },
  {
    id: "kowalski",
    name: "Agent Kowalski",
    role: { en: "FBI (allegedly)", fr: "FBI (soi-disant)" },
    employer: "NSA SubStation 7",
    juice: 200,
    salePunchline: {
      en: "LEAK: 'FBI agent' has 40,000 hours in World of Warcraft and a badge password of 'Thrall4Ever'.",
      fr: "FUITE : « agent du FBI » a 40 000 heures sur World of Warcraft et un mot de passe de badge « Thrall4Ever ».",
    },
    secrets: [
      { title: { en: "The Badge Password", fr: "Le Mot de Passe du Badge" }, text: { en: "Agent Kowalski's FBI badge reader password is 'Thrall4Ever'. His raid leader knows it. So do you now.", fr: "Le mot de passe du lecteur de badge de l'agent Kowalski est « Thrall4Ever ». Son chef de raid le connaît. Vous aussi, maintenant." } },
      { title: { en: "The Raid Schedule", fr: "Le Planning de Raid" }, text: { en: "Kowalski schedules stakeouts around Mythic raid nights. 'The suspect is most active between 8-11pm, conveniently.'", fr: "Kowalski planifie ses filatures autour des soirées raid Mythique. « Le suspect est le plus actif entre 20h et 23h, comme par hasard. »" } },
      { title: { en: "The Desk Plant", fr: "La Plante du Bureau" }, text: { en: "Kowalski's desk has a framed photo of his cat, 'Deputy Meow'. The cat has an official FBI visitor badge.", fr: "Le bureau de Kowalski a une photo encadrée de son chat, « Adjoint Miaou ». Le chat a un vrai badge de visiteur du FBI." } },
    ],
  },
  {
    id: "moreau",
    name: "Dr. Moreau",
    role: { en: "Professor", fr: "Professeur" },
    employer: "University LAN",
    juice: 110,
    salePunchline: {
      en: "SCANDAL: professor has reused the same final exam since 2009. Students knew. Everyone knew.",
      fr: "SCANDALE : le professeur réutilise le même examen final depuis 2009. Les étudiants le savaient. Tout le monde le savait.",
    },
    secrets: [
      { title: { en: "Exam 2009", fr: "Examen 2009" }, text: { en: "Dr. Moreau has administered the exact same 'Introduction to Databases' final since 2009. Question 3 still mentions 'floppy disks'.", fr: "Le Dr Moreau fait passer le même examen final d'« Introduction aux bases de données » depuis 2009. La question 3 parle encore de « disquettes »." } },
      { title: { en: "The Gradebook", fr: "Le Carnet de Notes" }, text: { en: "Dr. Moreau grades by rolling dice. A natural 20 is an A. He calls it 'holistic assessment'.", fr: "Le Dr Moreau note aux dés. Un 20 naturel vaut un A. Il appelle ça « évaluation holistique »." } },
      { title: { en: "The Coffee", fr: "Le Café" }, text: { en: "Dr. Moreau has a 'World's Best Professor' mug he bought himself in 2011. He brings it to every faculty meeting. Nobody has said anything.", fr: "Le Dr Moreau a une tasse « Meilleur professeur du monde » qu'il s'est achetée en 2011. Il l'apporte à chaque conseil de faculté. Personne n'a jamais rien dit." } },
    ],
  },
  {
    id: "chad",
    name: "Chad",
    role: { en: "Influencer", fr: "Influenceur" },
    employer: "Influencer Haus",
    juice: 180,
    salePunchline: {
      en: "INVESTIGATION: influencer with 2M followers has never had an original thought. Sources: 'he just yells'. ",
      fr: "ENQUÊTE : un influenceur avec 2M d'abonnés n'a jamais eu une seule pensée originale. Sources : « il gueule, c'est tout ». ",
    },
    secrets: [
      { title: { en: "The Scripts", fr: "Les Scripts" }, text: { en: "Chad's 'authentic, raw' videos are scripted by a 19-year-old named Greg who is paid in exposure and sadness.", fr: "Les vidéos « authentiques et brutes » de Chad sont écrites par Greg, 19 ans, payé en visibilité et en tristesse." } },
      { title: { en: "The Followers", fr: "Les Abonnés" }, text: { en: "1.7 million of Chad's 2M followers are 'ChadBot' accounts run by Chad on an old iPad.", fr: "1,7 million des 2M d'abonnés de Chad sont des comptes « ChadBot » gérés par Chad sur un vieil iPad." } },
      { title: { en: "The Merch", fr: "La Boutique" }, text: { en: "Chad's merch is drop-shipped from a warehouse that also sells 'I ❤️ my bulldog' shirts. He has no bulldog.", fr: "Les produits dérivés de Chad viennent d'un entrepôt qui vend aussi des t-shirts « J'❤️ mon bouledogue ». Il n'a pas de bouledogue." } },
    ],
  },
  {
    id: "gertie",
    name: "Grandma Gertie",
    role: { en: "Pyramid Scheme", fr: "Système pyramidal" },
    employer: "Gertie's Goodies",
    juice: 130,
    salePunchline: {
      en: "REPORT: 87-year-old runs $2M pyramid scheme through chain emails. Her secret: 'it's about the community'. ",
      fr: "RAPPORT : une dame de 87 ans dirige une pyramide à 2M $ via des e-mails en chaîne. Son secret : « c'est une histoire de communauté ». ",
    },
    secrets: [
      { title: { en: "The Chain Email", fr: "L'E-mail en Chaîne" }, text: { en: "Grandma Gertie's empire runs on chain emails promising 'AMAZING OPPORTUNITY!!!' forwarded 14 times. It has a 94% open rate.", fr: "L'empire de Mamie Gertie repose sur des e-mails en chaîne promettant une « OPPORTUNITÉ INCROYABLE !!! » transférés 14 fois. Taux d'ouverture : 94 %." } },
      { title: { en: "The Tupperware", fr: "Les Tupperwares" }, text: { en: "Gertie's real product is Tupperware she bought in bulk in 1987. The pyramid is real. The Tupperware is not.", fr: "Le vrai produit de Gertie, c'est du Tupperware acheté en gros en 1987. La pyramide est réelle. Les Tupperwares, non." } },
      { title: { en: "The Bragging Rights", fr: "La Gloire" }, text: { en: "Gertie is her own top earner. She pays herself in 'Gertie Bucks' and frames the certificates.", fr: "Gertie est sa propre meilleure vendeuse. Elle se paie en « Gertie Bucks » et encadre les certificats." } },
    ],
  },
  {
    id: "marcel",
    name: "Marcel",
    role: { en: "Ransomware Artist", fr: "Artiste du Rançongiciel" },
    employer: "CryptoBros Collective",
    juice: 220,
    salePunchline: {
      en: "PROFILE: ransomware artist insists he is 'more of a conceptual hacker'. Ransoms are paid in artisanal bread.",
      fr: "PORTRAIT : l'artiste du rançongiciel insiste : « je suis plutôt un hacker conceptuel ». Les rançons se paient en pain artisanal.",
    },
    secrets: [
      { title: { en: "The Bread", fr: "Le Pain" }, text: { en: "Marcel's ransomware demands payment in sourdough loaves. He runs a bakery as a front. The bakery does very well.", fr: "Le rançongiciel de Marcel exige un paiement en pains au levain. Il tient une boulangerie en façade. La boulangerie marche très bien." } },
      { title: { en: "The Manifesto", fr: "Le Manifeste" }, text: { en: "Marcel wrote a 40-page manifesto about ransomware as 'performance art'. Page 3 is a recipe for focaccia.", fr: "Marcel a écrit un manifeste de 40 pages sur le rançongiciel comme « art de la performance ». Page 3 : une recette de focaccia." } },
      { title: { en: "The Palette", fr: "La Palette" }, text: { en: "Marcel encrypts files with a custom cipher that spells 'BON APPÉTIT' in hex when decoded.", fr: "Marcel chiffre les fichiers avec un chiffre maison qui épelle « BON APPÉTIT » en hexadécimal une fois décodé." } },
    ],
  },
  {
    id: "pierre",
    name: "Pierre",
    role: { en: "NullSec Recruiter", fr: "Recruteur NullSec" },
    employer: "The Void",
    juice: 300,
    salePunchline: {
      en: "ALERT: mysterious recruiter for elite hacker collective is, in fact, 14 years old and grounded.",
      fr: "ALERTE : le mystérieux recruteur de l'élite des hackers est en réalité âgé de 14 ans et privé de sortie.",
    },
    secrets: [
      { title: { en: "The Age", fr: "L'Âge" }, text: { en: "Pierre, feared NullSec recruiter, is 14 years old. He types with two fingers and is currently grounded.", fr: "Pierre, redoutable recruteur de NullSec, a 14 ans. Il tape avec deux doigts et est actuellement privé de sortie." } },
      { title: { en: "The Handle", fr: "Le Pseudo" }, text: { en: "Pierre's hacker handle is 'xX_PhantomByte_Xx'. He chose it when he was 11 and refuses to change it.", fr: "Le pseudo de hacker de Pierre est « xX_PhantomByte_Xx ». Il l'a choisi à 11 ans et refuse de le changer." } },
      { title: { en: "The Homework", fr: "Les Devoirs" }, text: { en: "Pierre's 'encrypted dead drops' are homework assignments encrypted with a Caesar cipher. He's failing math.", fr: "Les « boîtes aux lettres chiffrées » de Pierre sont des devoirs chiffrés avec un chiffre de César. Il est nul en maths." } },
    ],
  },
  {
    id: "carol",
    name: "Carol",
    role: { en: "HR (fired you)", fr: "RH (vous a viré)" },
    employer: "MegaCorp HQ",
    juice: 100,
    salePunchline: {
      en: "INSIDE STORY: HR manager who fired Dave has been printing 'Employee of the Month' certificates for her cat.",
      fr: "HISTOIRE INTERNE : la RH qui a viré Dave imprime des certificats d'« Employé du mois » pour son chat.",
    },
    secrets: [
      { title: { en: "The Cat Certificates", fr: "Les Certificats du Chat" }, text: { en: "Carol prints 'Employee of the Month' certificates for her cat, Mittens. Mittens has won 11 years running.", fr: "Carol imprime des certificats d'« Employé du mois » pour son chat, Mittens. Mittens gagne depuis 11 ans." } },
      { title: { en: "The Tears", fr: "Les Larmes" }, text: { en: "Carol cried for 20 minutes after firing Dave. She keeps his 'World's Okayest IT Guy' mug as a memento.", fr: "Carol a pleuré 20 minutes après avoir viré Dave. Elle garde sa tasse « Tech le plus bof du monde » en souvenir." } },
      { title: { en: "The Exit Interview", fr: "L'Entretien de Sortie" }, text: { en: "Carol wrote in Dave's exit interview: 'Too good for us. Probably. I didn't read it. - C.'", fr: "Carol a écrit dans l'entretien de sortie de Dave : « Trop bien pour nous. Probablement. Je n'ai pas lu. — C. »" } },
    ],
  },
  {
    id: "yuki",
    name: "Yuki-Chan",
    role: { en: "VTuber (and cryptoscammer?)", fr: "VTuber (et arnaqueuse crypto ?)" },
    employer: "The Waifu Sim Server",
    juice: 240,
    salePunchline: {
      en: "EXPOSED: popular VTuber's 'real face' is a free stock avatar she edited in 2014.",
      fr: "EXPOSÉ : le « vrai visage » d'une VTuber populaire est un avatar libre de droits retouché en 2014.",
    },
    secrets: [
      { title: { en: "The Avatar", fr: "L'Avatar" }, text: { en: "Yuki-Chan's beloved VTuber model is a free stock avatar she tinted pink in 2014. 900k subscribers have never noticed.", fr: "Le modèle VTuber adoré de Yuki-Chan est un avatar libre de droits qu'elle a teinté en rose en 2014. 900 000 abonnés n'ont jamais rien remarqué." } },
      { title: { en: "The Waifu Bot", fr: "Le Bot Waifu" }, text: { en: "Her 'interactive waifu' service is a script that replies 'uwu that sounds tough' to everything. It has a 98% satisfaction rate.", fr: "Son service « waifu interactive » est un script qui répond « uwu ça a l'air dur » à tout. Il a un taux de satisfaction de 98 %." } },
      { title: { en: "The VladCoin Stash", fr: "La Réserve de VladCoin" }, text: { en: "Yuki-Chan's entire savings are in VladCoin. She bought at the top. She tells her chat it's 'diamond hands'.", fr: "Toutes les économies de Yuki-Chan sont en VladCoin. Elle a acheté au sommet. Elle dit à son chat que c'est des « mains de diamant »." } },
    ],
  },
];

export function getNpc(id: string): Npc | undefined {
  return NPCS.find((n) => n.id === id || n.name.toLowerCase() === id.toLowerCase());
}

// ── Hackable networks ──────────────────────────────────────────────────────

export interface TargetDef {
  id: string;
  name: string; // stays English
  difficulty: number; // 1..5
  basePayout: number;
  heat: number;
  flavor: Bilingual;
  loot: "cash" | "info" | "mission";
  npcDrop?: string;
  /** Which skill track this target trains (and which speeds it up). */
  skill?: "sql" | "social" | "zero";
}

export const TARGET_POOL: Omit<TargetDef, "id">[] = [
  { name: "Cafe Wi-Fi", difficulty: 1, basePayout: 25, heat: 1, flavor: { en: "Free Wi-Fi. The password is 'password'. The owner knows. He doesn't care.", fr: "Wi-Fi gratuit. Le mot de passe est « password ». Le propriétaire le sait. Il s'en fiche." }, loot: "cash" },
  { name: "HOA Router", difficulty: 1, basePayout: 40, heat: 2, flavor: { en: "The Homeowners Association router. It has a sticker: 'NO HACKING PLEASE'.", fr: "Le routeur de la copropriété. Il porte un autocollant : « SVP PAS DE HACK ». " }, loot: "cash" },
  { name: "Vet Clinic", difficulty: 2, basePayout: 90, heat: 3, flavor: { en: "They keep an unreasonable amount of cat photos on the shared drive.", fr: "Ils gardent une quantité déraisonnable de photos de chats sur le disque partagé." }, loot: "cash", npcDrop: "kowalski" },
  { name: "Chen Realty LLC", difficulty: 2, basePayout: 110, heat: 3, flavor: { en: "Mrs. Chen's property management server. The boiler is on the network. Somehow.", fr: "Le serveur de gestion immobilière de Mme Chen. La chaudière est sur le réseau. Ne demandez pas." }, loot: "info", npcDrop: "chen" },
  { name: "CryptoBros Collective", difficulty: 2, basePayout: 120, heat: 4, flavor: { en: "A 'decentralized autonomous collective' — a Discord server with a shared drive.", fr: "Un « collectif autonome décentralisé » — un serveur Discord avec un disque partagé." }, loot: "info", npcDrop: "vlad" },
  { name: "MegaCorp HQ", difficulty: 3, basePayout: 220, heat: 6, flavor: { en: "Your former employer. The firewall is named 'HR'. It's petty.", fr: "Votre ancien employeur. Le pare-feu s'appelle « RH ». C'est mesquin." }, loot: "info", npcDrop: "brenda", skill: "sql" },
  { name: "Influencer Haus", difficulty: 3, basePayout: 250, heat: 6, flavor: { en: "A warehouse of green screens and 'content'. The fridge has only sparkling water.", fr: "Un entrepôt de fonds verts et de « contenu ». Le frigo ne contient que de l'eau pétillante." }, loot: "info", npcDrop: "chad", skill: "social" },
  { name: "Gertie's Goodies", difficulty: 3, basePayout: 260, heat: 5, flavor: { en: "Grandma Gertie's 'business server'. It's a 2008 netbook duct-taped to a bread maker.", fr: "Le « serveur professionnel » de Mamie Gertie. C'est un netbook de 2008 scotché à une machine à pain." }, loot: "info", npcDrop: "gertie" },
  { name: "University LAN", difficulty: 4, basePayout: 400, heat: 8, flavor: { en: "The university network. Someone left a terminal logged in as 'admin'. Again.", fr: "Le réseau universitaire. Quelqu'un a laissé un terminal connecté en « admin ». Encore." }, loot: "info", npcDrop: "moreau" },
  { name: "Municipal Grid", difficulty: 4, basePayout: 480, heat: 9, flavor: { en: "City infrastructure. The traffic light system runs on Windows XP and vibes.", fr: "L'infrastructure de la ville. Les feux tricolores tournent sous Windows XP et bonne humeur." }, loot: "cash" },
  { name: "BANK OF YOUR MONEY", difficulty: 4, basePayout: 600, heat: 10, flavor: { en: "Your bank. They know you have $0. They send you 'premium offers' anyway.", fr: "Votre banque. Ils savent que vous avez 0 $. Ils vous envoient des « offres premium » quand même." }, loot: "cash" },
  { name: "NSA SubStation 7", difficulty: 5, basePayout: 1200, heat: 15, flavor: { en: "A regional NSA substation. Agent Kowalski left the backdoor open. Twice.", fr: "Une sous-station régionale de la NSA. L'agent Kowalski a laissé la porte de derrière ouverte. Deux fois." }, loot: "info", npcDrop: "kowalski", skill: "zero" },
  { name: "The Void", difficulty: 5, basePayout: 1500, heat: 12, flavor: { en: "NullSec's own network. Pierre's homework files are in plain sight. Do not touch.", fr: "Le réseau de NullSec. Les devoirs de Pierre sont en évidence. N'y touchez pas." }, loot: "info", npcDrop: "pierre", skill: "zero" },
  { name: "Elon's Other Company", difficulty: 5, basePayout: 2000, heat: 18, flavor: { en: "Nobody knows what this company does. Not even the company.", fr: "Personne ne sait ce que fait cette entreprise. Même pas l'entreprise." }, loot: "cash" },
];

// Hidden networks revealed by the Wardialer program (installed via tor).
export const TOR_HIDDEN: Omit<TargetDef, "id">[] = [
  { name: "The Fax Machine", difficulty: 2, basePayout: 90, heat: 3, flavor: { en: "A fax machine the wardialer found. It still receives faxes. It knows things.", fr: "Un fax que le wardialer a trouvé. Il reçoit encore des fax. Il en sait des choses." }, loot: "cash", skill: "zero" },
  { name: "The ATM", difficulty: 3, basePayout: 300, heat: 8, flavor: { en: "A standalone ATM running Windows 98. The screensaver is a fish.", fr: "Un DAB autonome sous Windows 98. L'économiseur d'écran est un poisson." }, loot: "cash" },
  { name: "The Crypto ATM", difficulty: 4, basePayout: 520, heat: 9, flavor: { en: "A crypto ATM. It converts cash to crypto and back, like a tax-free merry-go-round.", fr: "Un DAB crypto. Il convertit le cash en crypto et vice-versa, comme un manège sans taxes." }, loot: "info", npcDrop: "vlad" },
];

// Fun hosts you can hack just for the thrill (and a little cash). No mission required.
export const FUN_HOSTS: Omit<TargetDef, "id">[] = [
  { name: "Neighbor's Wi-Fi", difficulty: 1, basePayout: 20, heat: 1, flavor: { en: "Your neighbor's router. The password is 'password123'. The network name is 'FBI SURVEILLANCE VAN'.", fr: "Le routeur de votre voisin. Le mot de passe est « password123 ». Le réseau s'appelle « CAMIONNETTE FBI »." }, loot: "cash" },
  { name: "The School Projector", difficulty: 2, basePayout: 70, heat: 3, flavor: { en: "The school projector. It displays 'Nice try, Kevin' to whoever hacked it. Kevin is a legend.", fr: "Le projecteur de l'école. Il affiche « Bien essayé, Kévin » à celui qui l'a piraté. Kévin est une légende." }, loot: "cash" },
  { name: "The Office Coffee Machine", difficulty: 2, basePayout: 85, heat: 3, flavor: { en: "A smart coffee machine. It's on the network because of course it is. It brews 4 cups per hack, for morale.", fr: "Une machine à café connectée. Elle est sur le réseau, évidemment. Elle prépare 4 tasses par hack, pour le moral." }, loot: "cash" },
  { name: "The Billboard", difficulty: 3, basePayout: 220, heat: 6, flavor: { en: "A highway billboard. You can put anything on it. For three minutes, you are the king of the highway.", fr: "Un panneau d'autoroute. Vous pouvez y mettre ce que vous voulez. Pendant trois minutes, vous êtes le roi de l'autoroute." }, loot: "cash", skill: "social" },
  { name: "The Government Toaster", difficulty: 4, basePayout: 380, heat: 9, flavor: { en: "A classified toaster in a government building. It runs Linux. It has clearance. It toasts classified bread.", fr: "Un grille-pain classifié dans un bâtiment gouvernemental. Il tourne sous Linux. Il a une habilitation. Il grille du pain classifié." }, loot: "cash" },
  { name: "The Waifu Sim Server", difficulty: 2, basePayout: 110, heat: 3, flavor: { en: "A server hosting 4,000 'waifu' AI chatbots. They all know your name. They all ask about your day. It's oddly comforting.", fr: "Un serveur hébergeant 4 000 chatbots « waifu ». Ils connaissent tous votre nom. Ils demandent tous comment s'est passée votre journée. C'est étrangement réconfortant." }, loot: "info", npcDrop: "yuki", skill: "social" },
  { name: "The Anime Vault", difficulty: 3, basePayout: 260, heat: 6, flavor: { en: "A fan's legendary anime archive, curated since 2007. The security is a yandere wallpaper and hope.", fr: "L'archive légendaire d'un fan, soigneusement curatée depuis 2007. La sécurité, c'est un fond d'écran yandere et de l'espoir." }, loot: "cash", skill: "zero" },
  { name: "The Figurine Warehouse", difficulty: 4, basePayout: 520, heat: 9, flavor: { en: "A scalper's figurine empire. 3,000 boxes of 'limited edition' anime girls, untouched and unsold.", fr: "L'empire de figurines d'un scalpeur. 3 000 boîtes d'animés « édition limitée », jamais ouvertes, jamais vendues." }, loot: "info", npcDrop: "yuki", skill: "zero" },
];

// ── News filler templates ──────────────────────────────────────────────────

export interface NewsFiller {
  headline: Bilingual;
  body: Bilingual;
}

export const NEWS_FILLERS: NewsFiller[] = [
  { headline: { en: "Local man discovers 'sudo' works in real life", fr: "Un homme découvre que « sudo » marche dans la vraie vie" }, body: { en: "Experts are baffled. He has not been able to undo it.", fr: "Les experts sont perplexes. Il n'a pas pu annuler." } },
  { headline: { en: "Grandma Gertie's chain email reaches 1 million forwards", fr: "L'e-mail en chaîne de Mamie Gertie atteint 1 million de transferts" }, body: { en: "'It's about the community,' she says, from inside her pyramid.", fr: "« C'est une histoire de communauté », dit-elle, du sommet de sa pyramide." } },
  { headline: { en: "MegaCorp introduces 'synergy nap rooms'", fr: "MegaCorp inaugure des « salles de sieste synergiques »" }, body: { en: "Employees report the nap rooms are just closets with motivational posters.", fr: "Selon les employés, les salles de sieste sont des placards avec des affiches motivantes." } },
  { headline: { en: "PUPPYCOIN hits new high, analysts confused", fr: "PUPPYCOIN atteint un nouveau sommet, les analystes perplexes" }, body: { en: "PUPPYCOIN is now worth 4 cents. Analysts agree this is 'a number'.", fr: "PUPPYCOIN vaut maintenant 4 centimes. Les analystes conviennent que c'est « un chiffre »." } },
  { headline: { en: "Traffic lights in suburb turn green for 3 hours", fr: "Des feux tricolores restent verts pendant 3 heures en banlieue" }, body: { en: "Commuters describe it as 'suspiciously pleasant'. Police are on high alert for fun.", fr: "Les automobilistes décrivent ça comme « anormalement agréable ». La police est en alerte maximale contre le fun." } },
  { headline: { en: "NSA substation reports 'suspicious activity', then cancels the report", fr: "Une sous-station de la NSA signale une « activité suspecte », puis annule le rapport" }, body: { en: "'It was probably Agent Kowalski again,' an anonymous source told reporters.", fr: "« C'était probablement encore l'agent Kowalski », a confié une source anonyme." } },
  { headline: { en: "Study finds 9 out of 10 hackers are just IT guys", fr: "Étude : 9 hackers sur 10 sont juste des gars de l'IT" }, body: { en: "The 10th one is the IT guy's manager.", fr: "Le 10e est le manager du gars de l'IT." } },
  { headline: { en: "Crypto bro announces 'revolutionary' new coin", fr: "Un frère crypto annonce une pièce « révolutionnaire »" }, body: { en: "The coin is called 'VladCoin'. It is a spreadsheet.", fr: "La pièce s'appelle « VladCoin ». C'est un tableur." } },
  { headline: { en: "Vet clinic data breach: 40,000 cat photos leaked", fr: "Fuite de données chez un vétérinaire : 40 000 photos de chats dévoilées" }, body: { en: "The internet has never been more united. No cats were harmed. Several were memed.", fr: "Internet n'a jamais été aussi uni. Aucun chat blessé. Plusieurs ont été mémifiés." } },
  { headline: { en: "Professor denies rumors about 'floppy disks' exam", fr: "Un professeur dément les rumeurs sur l'examen « disquettes »" }, body: { en: "'Floppy disks are timeless,' said Dr. Moreau, adjusting his 2009 tie.", fr: "« Les disquettes sont intemporelles », a déclaré le Dr Moreau, en ajustant sa cravate de 2009." } },
  { headline: { en: "Ransomware attack demands payment in sourdough", fr: "Une attaque au rançongiciel exige un paiement en levain" }, body: { en: "The bakery involved reports record sales. The FBI is 'confused but impressed'.", fr: "La boulangerie concernée annonce des ventes records. Le FBI est « perplexe mais impressionné »." } },
  { headline: { en: "Chad releases 'most authentic video yet'", fr: "Chad publie sa « vidéo la plus authentique à ce jour »" }, body: { en: "Viewers praise the 'raw honesty'. The video was written by Greg, who remains unpaid.", fr: "Les spectateurs saluent « l'honnêteté brute ». La vidéo a été écrite par Greg, toujours impayé." } },
  { headline: { en: "HOA votes to make router password 'hunter2'", fr: "La copropriété vote pour que le mot de passe du routeur soit « hunter2 »" }, body: { en: "All 47 residents voted yes. The board did not see the irony.", fr: "Les 47 habitants ont voté oui. Le conseil n'a pas vu l'ironie." } },
  { headline: { en: "Influencer accused of buying followers, denies everything", fr: "Un influenceur accusé d'acheter des abonnés nie tout" }, body: { en: "'Those are my real fans,' said Chad's iPad, running ChadBot v3.", fr: "« Ce sont de vrais fans », a déclaré l'iPad de Chad, qui tournait ChadBot v3." } },
  { headline: { en: "Elon's Other Company announces... something", fr: "L'autre entreprise d'Elon annonce… quelque chose" }, body: { en: "The announcement was 4 minutes of a Tesla driving through a tunnel. Analysts are thrilled.", fr: "L'annonce durait 4 minutes : une Tesla roulant dans un tunnel. Les analystes sont ravis." } },
  { headline: { en: "Man fired for 'excessive snack dedication' seeks new career", fr: "Un homme viré pour « dévotion excessive aux snacks » cherche une nouvelle carrière" }, body: { en: "Local sources say he is 'probably fine' and 'definitely not doing anything illegal'.", fr: "Selon des sources locales, il va « probablement bien » et « ne fait sûrement rien d'illégal »." } },
  { headline: { en: "FBI agent's cat receives official visitor badge", fr: "Le chat d'un agent du FBI reçoit un vrai badge de visiteur" }, body: { en: "Deputy Meow is now cleared for 'maximum cuddling' in the substation.", fr: "L'Adjoint Miaou est désormais habilité aux « câlins maximaux » dans la sous-station." } },
  { headline: { en: "Bread-based currency gains traction in ransomware circles", fr: "La monnaie basée sur le pain gagne du terrain dans les milieux du rançongiciel" }, body: { en: "Economists call it 'the most delicious inflation in history'.", fr: "Les économistes parlent de « l'inflation la plus délicieuse de l'histoire »." } },
  { headline: { en: "MegaCorp's firewall named 'HR' gets hacked again", fr: "Le pare-feu de MegaCorp nommé « RH » se fait pirater à nouveau" }, body: { en: "Security experts say naming your firewall after the department everyone hates is 'a choice'.", fr: "Selon les experts, nommer son pare-feu comme le département que tout le monde déteste, c'est « un choix »." } },
  { headline: { en: "Landlord raises rent, boiler remains scared", fr: "Le loyer augmente, la chaudière reste terrorisée" }, body: { en: "Mrs. Chen declined to comment, but the boiler was heard trembling.", fr: "Mme Chen a refusé de commenter, mais on a entendu la chaudière trembler." } },
  { headline: { en: "Waifu of the Year vote rigged for the 5th time", fr: "Le vote « Waifu de l'année » truqué pour la 5e fois" }, body: { en: "Organizers promise 'full transparency' and ask everyone to please stop hacking the spreadsheets.", fr: "Les organisateurs promettent « une transparence totale » et demandent à tout le monde d'arrêter de pirater les tableurs." } },
  { headline: { en: "VTuber 'Yuki-Chan' reaches 900k subs, still no real face reveal", fr: "La VTuber « Yuki-Chan » atteint 900 000 abonnés, toujours pas de vrai visage" }, body: { en: "Her avatar is reportedly 'a free stock model tinted pink'. The chat believes what it wants to believe.", fr: "Son avatar serait « un modèle libre de droits teinté en rose ». Le chat croit ce qu'il veut croire." } },
  { headline: { en: "Anime convention reports 'unprecedented smell incident'", fr: "Une convention anime signale un « incident olfactif sans précédent »" }, body: { en: "Organizers deploy 3 extra industrial fans. Attendees describe the air as 'authentic'.", fr: "Les organisateurs déploient 3 ventilateurs industriels supplémentaires. Les visiteurs qualifient l'air d'« authentique »." } },
  { headline: { en: "Collector pays $40k for 'limited edition' figurine, still sealed", fr: "Un collectionneur paie 40 000 $ pour une figurine « édition limitée », toujours scellée" }, body: { en: "Experts confirm the figurine will remain in its box forever. Its true value: happiness. Or resale. One of the two.", fr: "Selon les experts, la figurine restera dans sa boîte pour toujours. Sa vraie valeur : le bonheur. Ou la revente. L'un des deux." } },
  { headline: { en: "Streamer caught running 4 'waifu' bots to fill chat", fr: "Un streameur surpris à faire tourner 4 bots « waifu » pour remplir son chat" }, body: { en: "The bots were more entertaining than the stream. They now have their own channel.", fr: "Les bots étaient plus divertissants que le stream. Ils ont maintenant leur propre chaîne." } },
  { headline: { en: "Study: 1 in 3 IT admins has a body pillow", fr: "Étude : 1 admin IT sur 3 a un body pillow" }, body: { en: "The remaining 2 in 3 are lying. The pillow industry is thriving.", fr: "Les 2 sur 3 restants mentent. L'industrie du body pillow se porte très bien." } },
];

// ── Title progression ──────────────────────────────────────────────────────

export const TITLES: { rep: number; title: Bilingual }[] = [
  { rep: 0, title: { en: "Retired DevOps", fr: "DevOps à la Retraite" } },
  { rep: 5, title: { en: "Freelance Menace", fr: "Menace Freelance" } },
  { rep: 15, title: { en: "Senior Engineer (of Crime)", fr: "Ingénieur Senior (du Crime)" } },
  { rep: 30, title: { en: "Full-Stack Criminal", fr: "Criminel Full-Stack" } },
  { rep: 50, title: { en: "NullSec Operative", fr: "Agent NullSec" } },
  { rep: 75, title: { en: "Principal Architect of Chaos", fr: "Architecte Principal du Chaos" } },
  { rep: 100, title: { en: "CEO of Unemployment", fr: "PDG du Chômage" } },
];

export function titleForRep(lang: Lang, rep: number): string {
  let t = TITLES[0].title;
  for (const tier of TITLES) if (rep >= tier.rep) t = tier.title;
  return pick(lang, t);
}
