import type { Command } from "./types";
import type { Line } from "../output";
import { blank, dim, divider, err, info, ok, title, warn } from "../output";
import { t } from "../i18n";
import { langOf, addNews, logEvent } from "../engine";

export const chooseCmd: Command = {
  name: "choose",
  aliases: ["branch", "choice"],
  usage: "choose <a|b|c>",
  help: "Make a branching story choice when factions come calling.",
  detail: "When your reputation peaks, three factions will make you an offer. Choosing shapes which missions you get later.",
  run: (g, args) => {
    const lang = langOf(g);
    const pending = (g.flags.pendingChoice as string) || "";
    if (!pending) {
      return { lines: [err(t(lang, "choose.none"))], minutes: 0 };
    }
    const c = (args[0] || "").toLowerCase();
    const lines: Line[] = [];
    if (c === "a") {
      g.flags.branch = "nullsec";
      g.flags.pendingChoice = "";
      lines.push(title(t(lang, "choose.done", { choice: "NullSec" })));
      lines.push(info("Pierre: 'WELCOME TO THE GUILD. we have a discord. it has 3 members. one is a bot. the bot is the leader.'"));
      lines.push(info("You are now a NullSec operative. Missions, snacks, and extremely unprofessional group chats await."));
      addNews(g, "NullSec announces new recruit, snacks restocked", "'He's cool, I guess,' says Pierre, 14, definitively.");
    } else if (c === "b") {
      g.flags.branch = "syndicate";
      g.flags.pendingChoice = "";
      lines.push(title(t(lang, "choose.done", { choice: "The Syndicate" })));
      lines.push(info("A man in an expensive suit hands you a business card that just says 'YES'."));
      lines.push(info("You are now Syndicate family. The money is real. The salads are mysterious. The 'family' is cold."));
      addNews(g, "Syndicate expands 'family', sources cite 'a new friend'", "The Syndicate declined to comment, but a man in a suit nodded at reporters.");
    } else if (c === "c") {
      g.flags.branch = "solo";
      g.flags.pendingChoice = "";
      lines.push(title(t(lang, "choose.done", { choice: "Solo" })));
      lines.push(info("You told everyone to get lost. Frank beeps approvingly. It's just you, Frank, and the world."));
      lines.push(info("Solo missions pay less, but the style points are immaculate. And nobody steals your snacks."));
      addNews(g, "Mysterious lone hacker declines all factions", "Sources say the hacker 'just wants to be left alone, and maybe steal a snack budget'.");
    } else {
      return { lines: [err(t(lang, "choose.bad"))], minutes: 0 };
    }
    lines.push(blank);
    lines.push(dim("Your path is set. New missions will follow this branch."));
    logEvent(g, `Chose branch: ${g.flags.branch}`);
    g.flags.aiReact = "branch_chosen";
    return { lines, minutes: 5 };
  },
};
