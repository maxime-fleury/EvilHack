import type { Command } from "./types";
import { blank, dim, divider, info, title } from "../output";
import { registry } from "./registry";
import { t, cmdHelp, cmdDetail } from "../i18n";
import { langOf } from "../engine";

export const helpCmd: Command = {
  name: "help",
  aliases: ["?"],
  usage: "help [command]",
  help: "Show this help, or details about a specific command.",
  detail: "Lists all commands grouped by category. Use `help <command>` for details on one command.",
  run: (g, args) => {
    const lang = langOf(g);
    const lines = [];
    if (args[0]) {
      const c = registry.get(args[0].toLowerCase());
      if (!c) {
        return { lines: [{ t: t(lang, "help.noSuch", { cmd: args[0] }), c: "err" }], minutes: 0 };
      }
      lines.push(title(c.name));
      lines.push(dim(t(lang, "help.usage", { usage: c.usage })));
      lines.push(info(cmdDetail(lang, c.name, c.detail)));
      if (c.aliases?.length) lines.push(dim(t(lang, "help.aliases", { a: c.aliases.join(", ") })));
      return { lines, minutes: 0 };
    }
    const groups: { label: string; names: string[] }[] = [
      { label: t(lang, "help.nav"), names: ["help", "tutorial", "achievements", "stats", "clear"] },
      { label: t(lang, "help.hacking"), names: ["scan", "hack", "missions", "tor", "raid"] },
      { label: t(lang, "help.economy"), names: ["shop", "buy", "inv", "miner", "coin", "sell", "career", "market"] },
      { label: t(lang, "help.intel"), names: ["people", "news", "search", "net", "backdoor", "ls"] },
      { label: t(lang, "help.story"), names: ["arcs", "mira", "choose", "flex", "blackmail", "rivals", "crew"] },
      { label: t(lang, "help.system"), names: ["settings", "save", "slots", "slot", "poweroff", "reboot", "screensaver", "reset", "whoami", "frank", "legend", "prestige"] },
    ];
    for (const gr of groups) {
      lines.push(divider(gr.label));
      for (const n of gr.names) {
        const c = registry.get(n)!;
        lines.push(dim(`  ${c.usage.padEnd(24)} ${cmdHelp(lang, c.name, c.help)}`));
      }
    }
    lines.push(blank);
    lines.push(info(t(lang, "help.tip")));
    return { lines, minutes: 0 };
  },
};
