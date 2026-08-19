import type { Command } from "./types";
import { dim, divider, err, info, money, ok, fmtMoney } from "../output";
import { miningRate, langOf } from "../engine";
import { t } from "../i18n";

export const minerCmd: Command = {
  name: "miner",
  aliases: ["mine"],
  usage: "miner [start|stop|status]",
  help: "Control your crypto mining rig.",
  detail: "Your rig mines in the background whenever time passes. Better GPU = more per hour. 'miner stop' halts it (why would you).",
  run: (g, args) => {
    const lang = langOf(g);
    const sub = (args[0] || "status").toLowerCase();
    const rate = miningRate(g);
    const active = g.flags.minerActive !== false;
    const lines = [];
    if (sub === "start") {
      g.flags.minerActive = true;
      lines.push(ok(t(lang, "miner.start", { r: fmtMoney(rate) })));
      return { lines, minutes: 1 };
    }
    if (sub === "stop") {
      g.flags.minerActive = false;
      lines.push(dim(t(lang, "miner.stop")));
      return { lines, minutes: 1 };
    }
    lines.push(divider(t(lang, "miner.title")));
    lines.push(info(t(lang, "miner.status", { s: active ? "mining ⛏" : "stopped" })));
    lines.push(money(t(lang, "miner.rate", { r: fmtMoney(rate) })));
    lines.push(dim(`   GPU: ${["Onboard Graphics", "GTX 760 Ti 'Grandma'", "RTX 3090 'Space Heater'", "RTX 5090 'Fusion'", "Quantum Toaster"][g.gpu]}`));
    if (g.toaster) lines.push(dim(t(lang, "miner.toaster")));
    lines.push(dim(t(lang, "miner.honest")));
    return { lines, minutes: 0 };
  },
};
