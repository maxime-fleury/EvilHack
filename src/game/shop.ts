import type { Line } from "./output";
import { dim, divider, money, title } from "./output";
import type { Bilingual, Lang } from "./i18n";
import { pick } from "./i18n";
import { shopDiscount } from "./engine";

export type Slot = "cpu" | "gpu" | "ram" | "vpn" | "botnet" | "vps" | "exploit" | "misc";

export interface ShopItem {
  id: string;
  slot: Slot;
  name: string; // stays English
  tier?: number; // for cpu/gpu/ram/vpn/botnet/vps — replaces current tier
  id_exp?: string; // for exploit items: the exploit id it grants
  price: number;
  desc: Bilingual;
  effect?: Bilingual;
  requiresRep?: number;
}

export const SHOP: ShopItem[] = [
  // CPU
  { id: "cpu1", slot: "cpu", tier: 1, name: "Toaster X CPU", price: 120, desc: { en: "A CPU from a toaster. It toasts. It computes. Barely.", fr: "Un CPU de grille-pain. Il grille. Il calcule. À peine." }, effect: { en: "+hack speed", fr: "+vitesse de hack" } },
  { id: "cpu2", slot: "cpu", tier: 2, name: "Hamster-Powered Core i5", price: 450, desc: { en: "Runs on a hamster wheel. The hamster is unionized and demands breaks.", fr: "Fonctionne sur une roue de hamster. Le hamster est syndiqué et exige des pauses." }, effect: { en: "+hack speed", fr: "+vitesse de hack" } },
  { id: "cpu3", slot: "cpu", tier: 3, name: "The Boring i9", price: 1400, desc: { en: "So fast it's boring. It has RGB but you turned it off because you're a professional.", fr: "Si rapide que c'est ennuyeux. Il a du RGB mais vous l'avez coupé, vous êtes un professionnel." }, effect: { en: "+hack speed", fr: "+vitesse de hack" } },
  { id: "cpu4", slot: "cpu", tier: 4, name: "Quantum Potato", price: 6000, desc: { en: "A potato that exists in all states until observed. Observing it makes it faster. Don't ask.", fr: "Une pomme de terre qui existe dans tous les états jusqu'à l'observation. L'observer la rend plus rapide. Ne posez pas de questions." }, effect: { en: "++hack speed", fr: "++vitesse de hack" } },
  // GPU
  { id: "gpu1", slot: "gpu", tier: 1, name: "GTX 760 Ti 'Grandma'", price: 180, desc: { en: "Your grandma's old GPU. She used it for solitaire. It mines okay.", fr: "Le vieux GPU de votre grand-mère. Elle jouait au solitaire. Il mine pas mal." }, effect: { en: "+mining", fr: "+minage" } },
  { id: "gpu2", slot: "gpu", tier: 2, name: "RTX 3090 'Space Heater'", price: 750, desc: { en: "Mines AND heats your apartment. You no longer need the heating. It's efficient.", fr: "Il mine ET chauffe votre appartement. Plus besoin de chauffage. C'est efficace." }, effect: { en: "+mining", fr: "+minage" } },
  { id: "gpu3", slot: "gpu", tier: 3, name: "RTX 5090 'Fusion Reactor'", price: 2600, desc: { en: "Mines so hard it briefly powers the city grid. The city has noticed.", fr: "Il mine si fort qu'il alimente brièvement le réseau de la ville. La ville a remarqué." }, effect: { en: "++mining", fr: "++minage" } },
  { id: "gpu4", slot: "gpu", tier: 4, name: "Quantum Toaster", price: 9000, desc: { en: "It's a toaster. It's quantum. It mines bread AND crypto. The bread is delicious.", fr: "C'est un grille-pain. Quantique. Il mine du pain ET de la crypto. Le pain est délicieux." }, effect: { en: "+++mining", fr: "+++minage" } },
  // RAM
  { id: "ram1", slot: "ram", tier: 1, name: "4GB RAM 'for the tabs'", price: 90, desc: { en: "Enough RAM for a few tabs. And one (1) hack at a time.", fr: "Assez de RAM pour quelques onglets. Et un (1) hack à la fois." }, effect: { en: "+1 parallel hack", fr: "+1 hack en parallèle" } },
  { id: "ram2", slot: "ram", tier: 2, name: "16GB RAM 'for the tabs²'", price: 320, desc: { en: "Now you can have tabs AND hacks. Revolutionary.", fr: "Maintenant vous pouvez avoir des onglets ET des hacks. Révolutionnaire." }, effect: { en: "+2 parallel hacks", fr: "+2 hacks en parallèle" } },
  { id: "ram3", slot: "ram", tier: 3, name: "64GB RAM 'for the tabs³'", price: 1100, desc: { en: "You don't need this. You bought it anyway. The tabs thank you.", fr: "Vous n'en avez pas besoin. Vous l'avez acheté quand même. Les onglets vous remercient." }, effect: { en: "+3 parallel hacks", fr: "+3 hacks en parallèle" } },
  // VPN
  { id: "vpn1", slot: "vpn", tier: 1, name: "Free Proxy 'TotallyAnonymous'", price: 60, desc: { en: "It's free. It's anonymous. It's also a honeypot. But it's free.", fr: "C'est gratuit. C'est anonyme. C'est aussi un piège à hackers. Mais c'est gratuit." }, effect: { en: "-heat gain", fr: "-gain de chaleur" } },
  { id: "vpn2", slot: "vpn", tier: 2, name: "Le VPN", price: 250, desc: { en: "Le VPN. Very French. Very secure. Refuses to work on Mondays.", fr: "Le VPN. Très français. Très sécurisé. Refuse de fonctionner le lundi." }, effect: { en: "-heat gain", fr: "-gain de chaleur" } },
  { id: "vpn3", slot: "vpn", tier: 3, name: "NordVPN (actually works)", price: 900, desc: { en: "It's NordVPN. It works. This is the ad they'd never run.", fr: "C'est NordVPN. Ça marche. C'est la pub qu'ils ne feront jamais." }, effect: { en: "--heat gain", fr: "--gain de chaleur" } },
  // Botnet
  { id: "bot1", slot: "botnet", tier: 1, name: "Elderly Printers LLC (starter)", price: 500, desc: { en: "Rent 100 ancient printers. They're slow, they jam, and they're perfect for DDoS.", fr: "Louez 100 imprimantes anciennes. Lentes, capricieuses, parfaites pour le DDoS." }, effect: { en: "unlocks DDoS missions", fr: "débloque les missions DDoS" } },
  { id: "bot2", slot: "botnet", tier: 2, name: "Elderly Printers LLC (premium)", price: 3000, desc: { en: "500 printers. They still jam. But now there are more of them.", fr: "500 imprimantes. Elles coincent toujours. Mais il y en a plus." }, effect: { en: "unlocks DDoS missions · faster", fr: "débloque les missions DDoS · plus rapide" } },
  // VPS
  { id: "vps1", slot: "vps", tier: 1, name: "Potato VPS", price: 400, desc: { en: "A VPS in a 'neutral country' (a basement in Belgium). Runs Ubuntu and bad decisions.", fr: "Un VPS dans un « pays neutre » (une cave en Belgique). Tourne sous Ubuntu et mauvaises décisions." }, effect: { en: "+1 parallel hack · heat ×0.85", fr: "+1 hack en parallèle · chaleur ×0.85" } },
  { id: "vps2", slot: "vps", tier: 2, name: "Gamer VPS", price: 1500, desc: { en: "A real datacenter VPS with RGB. It's offshore, which is a vibe.", fr: "Un vrai VPS en datacenter avec RGB. Offshore, ce qui est une ambiance." }, effect: { en: "+2 parallel hacks · heat ×0.7 · +mining", fr: "+2 hacks en parallèle · chaleur ×0.7 · +minage" } },
  { id: "vps3", slot: "vps", tier: 3, name: "Offshore Darknet VPS", price: 5000, desc: { en: "A server registered to a duck in a tax haven. Unlocks the big leagues.", fr: "Un serveur enregistré au nom d'un canard dans un paradis fiscal. Débloque la grande ligue." }, effect: { en: "+3 parallel hacks · heat ×0.5 · unlocks offshore missions", fr: "+3 hacks en parallèle · chaleur ×0.5 · débloque les missions offshore" } },
  // Exploits (software)
  { id: "exp1", slot: "exploit", id_exp: "sql", name: "SQL Injection for Dummies", price: 150, desc: { en: "A book. It's literally a book. But it works.", fr: "Un livre. Littéralement un livre. Mais ça marche." }, effect: { en: "unlocks 'SQL' style hacks", fr: "débloque les hacks style « SQL »" } },
  { id: "exp2", slot: "exploit", id_exp: "social", name: "Social Engineering 101", price: 550, desc: { en: "Learn to trick people into giving you their passwords by asking nicely.", fr: "Apprenez à piéger les gens pour obtenir leurs mots de passe en demandant poliment." }, effect: { en: "unlocks social missions", fr: "débloque les missions sociales" } },
  { id: "exp3", slot: "exploit", id_exp: "zero", name: "The 0-Day of the Day Calendar", price: 1800, desc: { en: "A wall calendar with a fresh zero-day every month. December is a doozy.", fr: "Un calendrier mural avec un 0-day frais chaque mois. Décembre est un sacré mois." }, effect: { en: "unlocks elite missions", fr: "débloque les missions d'élite" } },
  // Misc
  { id: "rgb", slot: "misc", name: "RGB Strip", price: 280, desc: { en: "+50 style. -10% efficiency. It looks SO good though.", fr: "+50 style. -10% d'efficacité. Mais ça rend TELLEMENT bien." }, effect: { en: "+style, -efficiency", fr: "+style, -efficacité" } },
  { id: "chair", slot: "misc", name: "Gamer Chair", price: 520, desc: { en: "It's a racing seat with wheels. You are not a racer. You are a hacker. It helps somehow.", fr: "C'est un siège de course à roulettes. Vous n'êtes pas un pilote. Vous êtes un hacker. Ça aide, d'une certaine façon." }, effect: { en: "+style", fr: "+style" } },
  { id: "toaster", slot: "misc", name: "Crypto Toaster", price: 380, desc: { en: "Mines crypto while toasting bread. The bread comes out crypto-flavored.", fr: "Mine de la crypto en grillant le pain. Le pain ressort avec un goût de crypto." }, effect: { en: "+mining, +heat", fr: "+minage, +chaleur" } },
  { id: "cam", slot: "misc", name: "Security Camera (for the cat)", price: 150, desc: { en: "You don't have a cat. You bought the camera anyway. It watches the empty room.", fr: "Vous n'avez pas de chat. Vous avez acheté la caméra quand même. Elle surveille la pièce vide." }, effect: { en: "-style", fr: "-style" } },
];

export function itemById(id: string): ShopItem | undefined {
  return SHOP.find((i) => i.id === id);
}

export interface ShopSnapshotItem {
  id: string;
  name: string;
  slot: Slot;
  tier?: number;
  price: number;
  desc: string;
  effect?: string;
  requiresRep?: number;
  owned: boolean;
  canAfford: boolean;
  repOk: boolean;
}

/** Ownership + affordability per item, for the client Shop panel. */
export function shopSnapshot(g: Record<string, any>, lang: Lang): ShopSnapshotItem[] {
  const disc = shopDiscount(g as any);
  return SHOP.map((it) => {
    let owned = false;
    if ((it.slot === "cpu" || it.slot === "gpu" || it.slot === "ram" || it.slot === "vpn" || it.slot === "botnet" || it.slot === "vps") && it.tier !== undefined) {
      owned = (g[it.slot] as number) >= it.tier;
    } else if (it.slot === "exploit" && it.id_exp) {
      owned = (g.exploits as string[]).includes(it.id_exp);
    } else if (it.slot === "misc") {
      owned = !!g[it.id];
    }
    return {
      id: it.id,
      name: it.name,
      slot: it.slot,
      tier: it.tier,
      price: Math.round(it.price * disc),
      desc: pick(lang, it.desc),
      effect: it.effect ? pick(lang, it.effect) : undefined,
      requiresRep: it.requiresRep,
      owned,
      canAfford: g.money >= Math.round(it.price * disc),
      repOk: it.requiresRep ? g.rep >= it.requiresRep : true,
    };
  });
}

export function shopLines(lang: Lang): Line[] {
  const out: Line[] = [];
  const groups: { label: Bilingual; ids: string[] }[] = [
    { label: { en: "CPU (hack speed)", fr: "CPU (vitesse de hack)" }, ids: ["cpu1", "cpu2", "cpu3", "cpu4"] },
    { label: { en: "GPU (mining)", fr: "GPU (minage)" }, ids: ["gpu1", "gpu2", "gpu3", "gpu4"] },
    { label: { en: "RAM (parallel hacks)", fr: "RAM (hacks parallèles)" }, ids: ["ram1", "ram2", "ram3"] },
    { label: { en: "VPN (heat reduction)", fr: "VPN (réduction de chaleur)" }, ids: ["vpn1", "vpn2", "vpn3"] },
    { label: { en: "VPS", fr: "VPS" }, ids: ["vps1", "vps2", "vps3"] },
    { label: { en: "Botnet", fr: "Botnet" }, ids: ["bot1", "bot2"] },
    { label: { en: "Software", fr: "Logiciels" }, ids: ["exp1", "exp2", "exp3"] },
    { label: { en: "Lifestyle", fr: "Style de vie" }, ids: ["rgb", "chair", "toaster", "cam"] },
  ];
  for (const g of groups) {
    out.push(divider(pick(lang, g.label)));
    for (const id of g.ids) {
      const it = itemById(id)!;
      out.push(title(`  ${it.name}`));
      out.push(dim(`    [${it.id}]  ${it.price >= 0 ? money(`$${it.price}`).t : ""}`));
      out.push(dim(`    ${pick(lang, it.desc)}`));
      if (it.effect) out.push(dim(`    → ${pick(lang, it.effect)}`));
    }
  }
  out.push(divider());
  out.push(dim(pick(lang, { en: "Buy with: buy <id>", fr: "Achetez avec : buy <id>" })));
  return out;
}
