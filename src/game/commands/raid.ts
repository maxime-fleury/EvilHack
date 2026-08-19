import type { Command } from "./types";
import { dim, err, info } from "../output";
import { langOf, resolveRaid } from "../engine";
import { t } from "../i18n";

/** Heat raid: the cops knock — pick how to handle it. Every option is safe. */
export const raidCmd: Command = {
  name: "raid",
  aliases: ["flee", "pay", "brave"],
  usage: "raid flee | raid pay | raid brave",
  help: "Handle the police visit when your heat is through the roof.",
  detail: "When your heat reaches 80, the cops knock on the door. Choose how to deal with them: flee (free, loses a bit of heat), pay (costs money, drops a lot of heat), or brave it out (gain rep and style — you're a legend now). No choice can lose you the game.",
  run: (g, args) => {
    const lang = langOf(g);
    const choice = (args[0] || "").toLowerCase();
    if (!g.flags.raidPending) {
      return {
        lines: [err(t(lang, "raid.none"))],
        minutes: 0,
      };
    }
    if (choice !== "flee" && choice !== "pay" && choice !== "brave") {
      return {
        lines: [
          info(t(lang, "raid.how")),
          dim(`   → raid flee`),
          dim(`   → raid pay`),
          dim(`   → raid brave`),
        ],
        minutes: 0,
      };
    }
    return { lines: resolveRaid(g, choice as "flee" | "pay" | "brave"), minutes: 0 };
  },
};
