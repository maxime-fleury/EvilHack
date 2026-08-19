import type { Command } from "./types";
import type { Line } from "../output";
import { blank, dim, divider, err, info, money, ok, warn, fmtMoney } from "../output";
import type { Bilingual } from "../i18n";
import { pick, t } from "../i18n";
import { backdoorsOf, hasBackdoor, langOf, trackEarned, torPriceMult } from "../engine";

// ── Fake darknet programs ──────────────────────────────────────────────────
// Names stay English; descriptions are bilingual. Installed programs live in
// flags.programs and give real effects (see engine derived stats).

export interface TorProgram {
  id: string;
  name: string; // English
  price: number;
  repReq: number;
  desc: Bilingual;
  effect: Bilingual;
}

export const TOR_PROGRAMS: TorProgram[] = [
  { id: "sniffer", name: "Packet Sniffer 9000", price: 200, repReq: 0, desc: { en: "Eavesdrops on networks. 'For network diagnostics', the listing says. Sure.", fr: "Écoute les réseaux. « Pour diagnostiquer des réseaux », dit l'annonce. Bien sûr." }, effect: { en: "+chance to find dossier fragments", fr: "+chance de trouver des fragments de dossier" } },
  { id: "proxychain", name: "ProxyChain Deluxe", price: 350, repReq: 0, desc: { en: "Bounces your traffic through 4 VPNs, one of which is a fridge in Latvia.", fr: "Fait rebondir votre trafic à travers 4 VPN, dont un frigo en Lettonie." }, effect: { en: "-heat gain", fr: "-gain de chaleur" } },
  { id: "miner2", name: "HashRaptor (overclock)", price: 700, repReq: 2, desc: { en: "A mining plugin that 'eats' your fans. Literally. There are teeth marks.", fr: "Un plugin de minage qui « mange » vos ventilateurs. Littéralement. Il y a des traces de dents." }, effect: { en: "+mining income", fr: "+revenu de minage" } },
  { id: "wardialer", name: "Wardialer 2.0", price: 500, repReq: 1, desc: { en: "Calls every phone number in the city looking for modems. It found a fax machine. It's very proud.", fr: "Appelle tous les numéros de la ville à la recherche de modems. Il a trouvé un fax. Il est très fier." }, effect: { en: "reveals hidden networks", fr: "révèle des réseaux cachés" } },
  { id: "rootkit", name: "Rootkit 'Nice Try'", price: 1200, repReq: 4, desc: { en: "Hides your tracks so well even you can't find them. Installation instructions: 'trust me'.", fr: "Cache vos traces si bien que même vous ne les trouvez plus. Mode d'emploi : « fais-moi confiance »." }, effect: { en: "+hack speed · -heat", fr: "+vitesse de hack · -chaleur" } },
];

// Scam listings — they cost money and do nothing (funny).
const SCAMS: { id: string; name: string; price: number; repReq: number; desc: Bilingual }[] = [
  { id: "ultrasuite", name: "ULTRA HACKING SUITE 2024", price: 150, repReq: 0, desc: { en: "THE #1 HACKING SOFTWARE. 999 TOOLS. FREE MONEY. TRUST ME. (It's a .bat that opens cat videos.)", fr: "LE LOGICIEL DE HACK #1. 999 OUTILS. ARGENT GRATUIT. FAIS-MOI CONFIANCE. (C'est un .bat qui ouvre des vidéos de chats.)" } },
  { id: "socks", name: "SilkSocks Premium", price: 90, repReq: 0, desc: { en: "Hand-knitted hacker socks. They do not help. They are very warm though.", fr: "Chaussettes de hacker tricotées main. Elles n'aident pas. Mais elles sont très chaudes." } },
];

interface TorSite {
  id: string;
  name: string; // English
  desc: Bilingual;
  kind: "shop" | "forum" | "trap" | "story";
}

const SITES: TorSite[] = [
  { id: "bazaar", name: "The 0day Bazaar", desc: { en: "A dark market stall. The seller is a man named Jerry. Of course it is.", fr: "Un étal du marché noir. Le vendeur est un homme nommé Jerry. Évidemment." }, kind: "shop" },
  { id: "forum", name: "The Leak Forum", desc: { en: "An anonymous board where people 'totally not' leak company secrets.", fr: "Un forum anonyme où les gens ne « font absolument pas » fuiter de secrets d'entreprise." }, kind: "forum" },
  { id: "catpics", name: "CatPics.void", desc: { en: "A site that promises cat pictures. This is a trap. You know it. You will still click.", fr: "Un site qui promet des photos de chats. C'est un piège. Vous le savez. Vous cliquerez quand même." }, kind: "trap" },
  { id: "nullsec", name: "NullSec Recruiting", desc: { en: "A page with a single blinking cursor and the words 'we saw your scan'.", fr: "Une page avec un seul curseur clignotant et les mots « on a vu ton scan »." }, kind: "story" },
  { id: "socks", name: "SilkSocks", desc: { en: "The finest socks the darknet has ever seen. Allegedly.", fr: "Les plus belles chaussettes que le darknet ait jamais vues. Soi-disant." }, kind: "shop" },
];

export function hasProgram(g: { flags: Record<string, unknown> }, id: string): boolean {
  return ((g.flags.programs as string[]) || []).includes(id);
}

function addProgram(g: { flags: Record<string, unknown> }, id: string) {
  const list = (g.flags.programs as string[]) || [];
  if (!list.includes(id)) list.push(id);
  g.flags.programs = list;
}

export const torCmd: Command = {
  name: "tor",
  usage: "tor [visit <site> | install <id> | sell <target>]",
  help: "Browse the darknet: hidden services, programs, scams, and sold access.",
  detail: "Connect to hidden services. 'tor visit <site>' to open one, 'tor install <id>' to buy a program at the Bazaar, 'tor sell <target>' to sell a planted backdoor as access. Program prices drift with the market.",
  run: (g, args) => {
    const lang = langOf(g);
    const sub = (args[0] || "").toLowerCase();
    const lines: Line[] = [];

    if (sub === "visit") {
      const siteId = (args[1] || "").toLowerCase();
      const site = SITES.find((s) => s.id === siteId || s.name.toLowerCase() === siteId);
      if (!site) return { lines: [err(t(lang, "tor.noSite", { s: args[1] }))], minutes: 0 };
      lines.push(divider(`🌐 ${site.name}`));
      lines.push(dim(pick(lang, site.desc)));
      lines.push(blank);
      if (site.kind === "shop") {
        if (site.id === "bazaar") {
          lines.push(info(t(lang, "tor.progs")));
          for (const p of TOR_PROGRAMS) {
            const owned = hasProgram(g, p.id) ? " ✓" : "";
            const mult = torPriceMult(g, p.id);
            const tag = mult > 1.25 ? warn(` ▲`).t : mult < 0.8 ? ok(` ▼`).t : "";
            lines.push(info(`   ${p.name}  [${p.id}]  ${money(fmtMoney(Math.round(p.price * mult))).t}${tag}${owned}`));
            lines.push(dim(`     ${pick(lang, p.desc)}`));
            lines.push(dim(`     → ${pick(lang, p.effect)}`));
          }
          lines.push(blank);
          lines.push(info(t(lang, "tor.install")));
        } else {
          for (const s of SCAMS.filter((x) => x.id === "socks")) {
            lines.push(info(`   ${s.name}  [${s.id}]  ${money(fmtMoney(s.price)).t}`));
            lines.push(dim(`     ${pick(lang, s.desc)}`));
          }
        }
      } else if (site.kind === "forum") {
        const rumors: Bilingual[] = [
          { en: "Rumor: Mrs. Chen's boiler is on the network. 'It's a smart boiler,' she says. It is not smart.", fr: "Rumeur : la chaudière de Mme Chen est sur le réseau. « C'est une chaudière intelligente », dit-elle. Elle n'est pas intelligente." },
          { en: "Anonymous: 'MegaCorp's firewall is named HR. It blocks everything. Even itself.'", fr: "Anonyme : « Le pare-feu de MegaCorp s'appelle RH. Il bloque tout. Même lui-même. »" },
          { en: "Anonymous: 'saw the NSA substation guy leave his badge on the desk. again.'", fr: "Anonyme : « j'ai vu le gars de la sous-station NSA laisser son badge sur le bureau. encore. »" },
          { en: "Anonymous: 'PUPPYCOIN is going to the moon. source: trust me bro'", fr: "Anonyme : « PUPPYCOIN va sur la Lune. source : fais-moi confiance »" },
        ];
        for (const r of rumors) lines.push(dim(`   ▸ ${pick(lang, r)}`));
        lines.push(blank);
        lines.push(dim(t(lang, "tor.back")));
      } else if (site.kind === "trap") {
        lines.push(warn(t(lang, "tor.scam")));
        lines.push(dim("   The site stole $0 from you but 40 minutes of your life. The cats were adorable. You are not even mad."));
      } else if (site.kind === "story") {
        if (g.rep >= 3) {
          lines.push(info("'hey. you again. we liked your scan. — NullSec'"));
          lines.push(dim("The page now shows a QR code. Scanning it with your phone downloads a ringtone of a dial-up modem. Inspiring."));
          g.flags.nullsecContacted = true;
        } else {
          lines.push(dim("'come back when you've scanned something worth scanning.'"));
        }
      }
      return { lines, minutes: 2 };
    }

    if (sub === "sell") {
      // sell a planted backdoor as access — Jerry pays, the door is gone
      const target = args.slice(1).join(" ");
      if (!target || !hasBackdoor(g, target)) {
        return { lines: [err(t(lang, "tor.noBackdoor", { t: target }))], minutes: 0 };
      }
      const price = 150 + Math.round(Math.random() * 250);
      g.money += price;
      trackEarned(g, price);
      g.flags.backdoors = backdoorsOf(g).filter((b) => b.target !== target);
      const lines = [
        ok(t(lang, "tor.soldAccess", { t: target, m: fmtMoney(price) })),
        dim(t(lang, "tor.soldAccessNote")),
      ];
      return { lines, minutes: 5 };
    }

    if (sub === "install") {
      const id = (args[1] || "").toLowerCase();
      const prog = TOR_PROGRAMS.find((p) => p.id === id);
      const scam = SCAMS.find((s) => s.id === id);
      const item = prog || scam;
      if (!item) return { lines: [err(t(lang, "tor.noProg", { id: args[1] }))], minutes: 0 };
      if (prog && hasProgram(g, prog.id)) {
        return { lines: [warn(t(lang, "tor.haveProg", { name: prog.name }))], minutes: 0 };
      }
      if (g.rep < item.repReq) {
        return { lines: [err(t(lang, "tor.needRep", { r: item.repReq, have: g.rep }))], minutes: 0 };
      }
      const price = prog ? Math.round(item.price * torPriceMult(g, prog.id)) : item.price;
      if (g.money < price) {
        return { lines: [err(t(lang, "tor.noMoney", { m: fmtMoney(price) }))], minutes: 0 };
      }
      g.money -= price;
      if (scam) {
        g.flags.scamCount = ((g.flags.scamCount as number) || 0) + 1;
        g.heat += 1;
        return { lines: [warn(t(lang, "tor.scam"))], minutes: 10 };
      }
      addProgram(g, prog!.id);
      const lines = [
        ok(t(lang, "tor.installed", { name: prog!.name })),
        info(`   → ${pick(lang, prog!.effect)}`),
      ];
      return { lines, minutes: 5 };
    }

    // default: list sites
    lines.push(divider(t(lang, "tor.title")));
    lines.push(dim(t(lang, "tor.banner")));
    lines.push(blank);
    lines.push(info(t(lang, "tor.sites")));
    for (const s of SITES) {
      lines.push(info(`   ${s.name.padEnd(24)} — ${pick(lang, s.desc)}`));
    }
    lines.push(blank);
    lines.push(dim(t(lang, "tor.visit")));
    return { lines, minutes: 2 };
  },
};
