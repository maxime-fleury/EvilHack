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
  if (verb === "coin") return ["price", "buy", "sell", "status"].filter((s) => s.startsWith(prefix));
  if (verb === "settings") return ["set"].filter((s) => s.startsWith(prefix));
  if (verb === "buy" || verb === "shop") {
    return ["cpu1", "cpu2", "cpu3", "cpu4", "gpu1", "gpu2", "gpu3", "gpu4", "ram1", "ram2", "ram3", "vpn1", "vpn2", "vpn3", "bot1", "bot2", "exp1", "exp2", "exp3", "rgb", "chair", "toaster", "cam"].filter((s) => s.startsWith(prefix));
  }
  return [];
}
