import type { Command } from "./types";
import { helpCmd } from "./help";
import { statsCmd } from "./stats";
import { scanCmd } from "./scan";
import { hackCmd } from "./hack";
import { missionsCmd } from "./missions";
import { buyCmd, invCmd, shopCmd } from "./buy";
import { sellCmd, peopleCmd } from "./sell";
import { newsCmd } from "./news";
import { searchCmd } from "./search";
import { minerCmd } from "./miner";
import { coinCmd } from "./coin";
import { settingsCmd } from "./settings";
import { saveCmd, resetCmd, whoamiCmd, clearCmd, creditsCmd, aboutCmd } from "./system";
import { torCmd } from "./tor";
import { chooseCmd } from "./choose";
import { careerCmd, slotsCmd, slotCmd, poweroffCmd, rebootCmd, screensaverCmd } from "./ambience";
import { achievementsCmd } from "./achievements";
import { arcsCmd } from "./arcs";
import { tutorialCmd } from "./tutorial";
import { netCmd } from "./net";
import { backdoorCmd } from "./backdoor";
import { rivalsCmd } from "./rivals";
import { crewCmd } from "./crew";
import { frankCmd } from "./frank";
import { marketCmd } from "./market";
import { lsCmd, catCmd, writeCmd } from "./files";
import { legendCmd } from "./legend";
import { prestigeCmd } from "./prestige";
import { flexCmd } from "./flex";
import { blackmailCmd } from "./blackmail";
import { raidCmd } from "./raid";

const COMMANDS: Command[] = [
  helpCmd,
  tutorialCmd,
  achievementsCmd,
  arcsCmd,
  statsCmd,
  scanCmd,
  hackCmd,
  missionsCmd,
  buyCmd,
  shopCmd,
  invCmd,
  sellCmd,
  peopleCmd,
  newsCmd,
  searchCmd,
  minerCmd,
  coinCmd,
  settingsCmd,
  saveCmd,
  resetCmd,
  whoamiCmd,
  clearCmd,
  creditsCmd,
  aboutCmd,
  torCmd,
  chooseCmd,
  careerCmd,
  slotsCmd,
  slotCmd,
  poweroffCmd,
  rebootCmd,
  screensaverCmd,
  netCmd,
  backdoorCmd,
  rivalsCmd,
  crewCmd,
  frankCmd,
  marketCmd,
  lsCmd,
  catCmd,
  writeCmd,
  legendCmd,
  prestigeCmd,
  flexCmd,
  blackmailCmd,
  raidCmd,
];

export const registry = new Map<string, Command>();

for (const c of COMMANDS) {
  registry.set(c.name, c);
  for (const a of c.aliases ?? []) registry.set(a, c);
}

/** For tab-completion: all valid first words. */
export function completions(): string[] {
  const names = new Set<string>();
  for (const c of COMMANDS) {
    names.add(c.name);
    for (const a of c.aliases ?? []) names.add(a);
  }
  return [...names];
}

/** Suggest completions for a partial command line. */
export function complete(line: string): string[] {
  const parts = line.trim().split(/\s+/);
  if (parts.length <= 1) {
    const prefix = parts[0]?.toLowerCase() ?? "";
    return completions()
      .filter((c) => c.startsWith(prefix))
      .sort();
  }
  // subcommand completions for known verbs
  const verb = parts[0].toLowerCase();
  const prefix = parts[parts.length - 1].toLowerCase();
  if (verb === "missions") {
    return ["accept", "deliver", "offer", "list"].filter((s) => s.startsWith(prefix));
  }
  if (verb === "arcs") {
    return ["invest"].filter((s) => s.startsWith(prefix));
  }
  if (verb === "tor") {
    return ["visit", "install", "bazaar", "forum", "catpics", "nullsec", "socks", "sniffer", "proxychain", "miner2", "wardialer", "rootkit", "ultrasuite"].filter((s) => s.startsWith(prefix));
  }
  if (verb === "choose") return ["a", "b", "c"].filter((s) => s.startsWith(prefix));
  if (verb === "miner") return ["start", "stop", "status"].filter((s) => s.startsWith(prefix));
  if (verb === "crew") return ["hire", "fire"].filter((s) => s.startsWith(prefix));
  if (verb === "backdoor") return ["list"].filter((s) => s.startsWith(prefix));
  if (verb === "raid") return ["flee", "pay", "brave"].filter((s) => s.startsWith(prefix));
  if (verb === "cat" || verb === "ls") return ["/home/dave/README.txt", "/home/dave/notes.txt", "/etc/frank.conf", "/var/log/crimes.log"].filter((s) => s.toLowerCase().startsWith(prefix));
  if (verb === "coin") return ["price", "buy", "sell", "status"].filter((s) => s.startsWith(prefix));
  if (verb === "settings") return ["set"].filter((s) => s.startsWith(prefix));
  if (verb === "buy" || verb === "shop") {
    return ["cpu1", "cpu2", "cpu3", "cpu4", "gpu1", "gpu2", "gpu3", "gpu4", "ram1", "ram2", "ram3", "vpn1", "vpn2", "vpn3", "bot1", "bot2", "vps1", "vps2", "vps3", "exp1", "exp2", "exp3", "rgb", "chair", "toaster", "cam", "neon", "gold", "holo", "bass", "throne", "cape"].filter((s) => s.startsWith(prefix));
  }
  return [];
}
