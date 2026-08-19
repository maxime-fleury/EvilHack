import type { Command } from "./types";
import { dim, divider, err, info, ok } from "../output";
import { introLines } from "../intro";
import { langOf } from "../engine";
import { t } from "../i18n";

export const saveCmd: Command = {
  name: "save",
  usage: "save",
  help: "Save the game.",
  detail: "Your progress is saved to SQLite after every command anyway. This command exists so you feel in control.",
  run: (g) => {
    const lang = langOf(g);
    return {
      lines: [
        ok(t(lang, "save.ok")),
        dim(t(lang, "save.dim")),
      ],
      minutes: 0,
    };
  },
};

export const resetCmd: Command = {
  name: "reset",
  usage: "reset",
  help: "Wipe your save and start over.",
  detail: "Deletes everything. Dave forgets everything. Frank remembers everything. Frank will never forget.",
  run: (g) => {
    const lang = langOf(g);
    return {
      lines: [
        dim(t(lang, "reset.wipe")),
        ok(t(lang, "reset.ok")),
        ...introLines(lang),
        dim(t(lang, "reset.again")),
      ],
      minutes: 0,
      reset: true,
    };
  },
};

export const whoamiCmd: Command = {
  name: "whoami",
  aliases: ["who"],
  usage: "whoami",
  help: "Reveal your true identity.",
  detail: "A deep philosophical investigation into the nature of the self.",
  run: (g) => {
    const lang = langOf(g);
    return {
      lines: [
        info(t(lang, "whoami.1", { name: g.name })),
        info(t(lang, "whoami.2")),
        dim(t(lang, "whoami.3")),
      ],
      minutes: 0,
    };
  },
};

export const clearCmd: Command = {
  name: "clear",
  usage: "clear",
  help: "Clear the terminal.",
  detail: "Wipes the visible terminal. Your crimes remain on the database, as they should.",
  run: () => ({ lines: [], minutes: 0, clear: true }),
};

export const creditsCmd: Command = {
  name: "credits",
  usage: "credits",
  help: "Who made this?",
  detail: "A brief and humble acknowledgment.",
  run: () => {
    return {
      lines: [
        divider("CREDITS"),
        info("EVILHACK — Unemployment Simulator (devops-to-crime pipeline)"),
        dim("Written by a bored AI in a shared checkout. Theme song: the hum of Frank's fan."),
        dim("No real people were hacked. All 'people' are fictional and very, very fake."),
        dim("Special thanks to the free snacks. They were the real victim."),
      ],
      minutes: 0,
    };
  },
};

export const aboutCmd: Command = {
  name: "about",
  usage: "about",
  help: "About this game.",
  detail: "The story so far: you were fired. That's it. That's the whole setup.",
  run: () => {
    return {
      lines: [
        divider("EVILHACK v0.1"),
        dim("A terminal RPG about unemployment, crime, and a laptop named Frank."),
        dim("You were a devops engineer. Now you're a devops criminal."),
        dim("Stack: Bun + bun:sqlite + vanilla JS + Bootstrap + mark.js. No build step. Just vibes."),
      ],
      minutes: 0,
    };
  },
};
