import type { Command } from "./types";
import { blank, dim, divider, err, info, ok } from "../output";
import { langOf } from "../engine";
import { t } from "../i18n";
import { defaultPrompt } from "../aichat";

interface SettingSpec {
  values?: string[];
  free?: boolean;
  label: { en: string; fr: string };
}

const KEYS: Record<string, SettingSpec> = {
  theme: { values: ["green", "amber", "blue", "matrix", "purple"], label: { en: "Terminal color theme", fr: "Thème de couleur du terminal" } },
  fontsize: { values: ["sm", "md", "lg"], label: { en: "Terminal font size", fr: "Taille de police du terminal" } },
  anim: { values: ["on", "off"], label: { en: "Typing/fade animation", fr: "Animation de frappe/transition" } },
  sound: { values: ["on", "off"], label: { en: "Terminal beeps", fr: "Bips du terminal" } },
  lang: { values: ["en", "fr"], label: { en: "Language", fr: "Langue" } },
  ainame: { free: true, label: { en: "AI assistant name", fr: "Nom de l'assistante IA" } },
  aiurl: { free: true, label: { en: "AI server URL (LM Studio)", fr: "URL du serveur IA (LM Studio)" } },
  aimodel: { free: true, label: { en: "AI model id (empty = auto-detect)", fr: "ID du modèle IA (vide = auto-détection)" } },
  aiprompt: { free: true, label: { en: "AI assistant prompt", fr: "Prompt de l'assistante IA" } },
};

function normalizeVal(key: string, v: string): string | boolean {
  if (v === "on") return true;
  if (v === "off") return false;
  return v;
}

export const settingsCmd: Command = {
  name: "settings",
  aliases: ["config"],
  usage: "settings [set <key> <value> | set-all <json> | ai]",
  help: "View or change game settings.",
  detail: "Keys: theme, fontsize, anim, sound, lang (en|fr), ainame, aiurl, aiprompt. `settings ai` shows the AI sidekick's editable persona prompt.",
  run: (g, args) => {
    const lang = langOf(g);
    const lines = [];
    const sub = (args[0] || "").toLowerCase();

    if (sub === "set") {
      const key = args[1]?.toLowerCase();
      const val = args.slice(2).join(" ").toLowerCase();
      const spec = KEYS[key || ""];
      if (!spec) return { lines: [err(t(lang, "settings.unknown", { k: key, keys: Object.keys(KEYS).join(", ") }))], minutes: 0 };
      if (!spec.free && !spec.values!.includes(val)) {
        return { lines: [err(t(lang, "settings.badValue", { v: val, k: key, allowed: spec.values!.join("|") }))], minutes: 0 };
      }
      g.flags[key] = normalizeVal(key, val);
      lines.push(ok(t(lang, "settings.set", { k: key, v: val })));
      if (key === "lang") {
        // the snapshot is rebuilt by resolve(); announce so the player knows
        lines.push(dim(val === "fr" ? "Le jeu est maintenant en français. Bonne chance, Dave." : "Game is now in English. Good luck, Dave."));
      }
      return { lines, minutes: 0 };
    }

    if (sub === "set-all") {
      try {
        const obj = JSON.parse(args.slice(1).join(" ")) as Record<string, unknown>;
        for (const [k, v] of Object.entries(obj)) {
          if (!KEYS[k]) continue;
          g.flags[k] = typeof v === "boolean" ? v : String(v);
        }
        lines.push(ok(t(lang, "settings.set", { k: "all", v: Object.keys(obj).join(", ") })));
      } catch {
        return { lines: [err(t(lang, "settings.badJson"))], minutes: 0 };
      }
      return { lines, minutes: 0 };
    }

    if (sub === "ai") {
      lines.push(divider((g.flags.ainame as string) || "Noro-chan"));
      lines.push(info(t(lang, "settings.aiUsage")));
      lines.push(dim(`   URL: ${g.flags.aiurl || "http://127.0.0.1:3007"}`));
      lines.push(dim(`   Model: ${g.flags.aimodel || "auto-detect (LM Studio reports it)"}`));
      lines.push(blank);
      const prompt = (g.flags.aiprompt as string) || defaultPrompt(lang);
      lines.push(dim(prompt.split("\n").slice(0, 6).join("\n")));
      lines.push(dim(`   (${prompt.length} chars — edit with: settings set aiprompt <text>)`));
      return { lines, minutes: 0 };
    }

    lines.push(divider("SETTINGS"));
    for (const [k, spec] of Object.entries(KEYS)) {
      const cur = g.flags[k];
      const display = typeof cur === "boolean" ? (cur ? "on" : "off") : String(cur ?? (spec.values ? spec.values[0] : ""));
      lines.push(info(`   ${pickLabel(lang, spec.label)}: ${display}`));
      if (spec.values) lines.push(dim(`     settings set ${k} ${spec.values.join("|")}`));
      else lines.push(dim(`     settings set ${k} <text>`));
      lines.push(dim(""));
    }
    lines.push(dim(`   ${t(lang, "settings.aiHint")}`));
    return { lines, minutes: 0 };
  },
};

function pickLabel(lang: string, b: { en: string; fr: string }): string {
  return lang === "fr" ? b.fr : b.en;
}
