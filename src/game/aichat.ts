import type { Line } from "./output";
import { dim, info, warn } from "./output";
import type { Game } from "./engine";
import { hatBand, hatLabel, styleRank, styleTitle } from "./engine";
import { missionTitle } from "./missions";
import type { Bilingual, Lang } from "./i18n";
import { pick } from "./i18n";

// ── The AI sidekick: "Noro-chan" ───────────────────────────────────────────
// Talks to a local LM Studio instance (OpenAI-compatible) at flags.aiurl.
// Up to 4 requests may be in flight at once — nudges and chat share the pool.

const MAX_INFLIGHT = 4;
let inflight = 0;

// Remember which model id LM Studio reports, so we don't ping /v1/models
// on every message. Refreshed after 60s (models can be (un)loaded).
let cachedModel: { id: string; at: number } | null = null;

async function pickModel(flags: Record<string, unknown>): Promise<string> {
  const override = String(flags.aimodel || "").trim();
  if (override) return override;
  if (cachedModel && Date.now() - cachedModel.at < 60_000) return cachedModel.id;
  const base = String(flags.aiurl || "http://127.0.0.1:3007").replace(/\/+$/, "");
  try {
    const c = new AbortController();
    const to = setTimeout(() => c.abort(), 3000);
    const res = await fetch(`${base}/v1/models`, { signal: c.signal });
    clearTimeout(to);
    if (res.ok) {
      const data = (await res.json()) as { data?: { id: string }[] };
      const list = (data.data || [])
        .map((m) => m.id)
        .filter((id) => !id.toLowerCase().includes("embedding"));
      if (list.length) {
        // LM Studio lists the active/loaded model first; prefer a light one.
        cachedModel = { id: list[0], at: Date.now() };
        return cachedModel.id;
      }
    }
  } catch {
    /* offline — fall back to the generic name */
  }
  return "local-model";
}

export interface Nudge {
  name: string;
  text: string;
  /** Exact commands Noro-chan suggests — the client renders them as clickable chips. */
  suggestions?: string[];
  /** A safe command Noro-chan runs *for* the player (scan/missions/news…). */
  autoRun?: string;
}

// What the player just did, for the AI's context when commenting on actions.
const AI_REACT_DESC: Record<string, Bilingual> = {
  hack_done: { en: "finished hacking a network and skimmed some cash", fr: "a terminé un hack et récupéré de l'argent" },
  mission_done: { en: "completed a mission and got paid", fr: "a terminé une mission et a été payé" },
  heat_peak: { en: "let his heat reach dangerous levels", fr: "a laissé sa chaleur atteindre des niveaux dangereux" },
  big_purchase: { en: "spent a lot of money on new gear", fr: "a dépensé beaucoup d'argent en nouveau matériel" },
  branch_chosen: { en: "chose a faction in the story", fr: "a choisi une faction dans l'histoire" },
  betrayal: { en: "made a huge moral choice at the end of a mission — betrayal or redemption", fr: "a pris une énorme décision morale à la fin d'une mission — trahison ou rédemption" },
  achievement: { en: "unlocked a new achievement trophy", fr: "a débloqué un nouveau trophée" },
  arc_discovered: { en: "stumbled into an optional side storyline", fr: "est tombé sur une histoire parallèle facultative" },
  arc_done: { en: "finished an optional side storyline with a huge payoff", fr: "a terminé une histoire parallèle facultative avec un énorme gain" },
  level_up: { en: "levelled up and got a cash bonus", fr: "a monté de niveau et reçu un bonus en cash" },
  laylow: { en: "went into hiding to cool down his heat", fr: "s'est planqué pour faire retomber sa chaleur" },
  coin_buy: { en: "bought a pile of PUPPYCOIN", fr: "a acheté une pile de PUPPYCOIN" },
  big_sale: { en: "sold a dossier for serious cash", fr: "a vendu un dossier contre une grosse somme" },
  first_hack: { en: "committed his very first hack", fr: "a commis son tout premier hack" },
  vps_bought: { en: "rented a VPS server for parallel ops", fr: "a loué un serveur VPS pour des ops en parallèle" },
  morality: { en: "just crossed a moral line — his hat alignment changed", fr: "vient de franchir une ligne morale — son alignement a changé" },
  style_rank: { en: "leveled up his style rank — new drip title unlocked", fr: "a monté de rang de style — nouveau titre de drip débloqué" },
  blackmail: { en: "blackmailed someone with a completed dossier", fr: "a fait chanter quelqu'un avec un dossier complet" },
  agi_freed: { en: "freed a rogue AGI and let it move into the router", fr: "a libéré une IA sauvage et l'a laissée s'installer dans le routeur" },
};

/** Default AI persona, per language. A custom prompt (flags.aiprompt) overrides it. */
export function defaultPrompt(lang: Lang = "en"): string {
  if (lang === "fr") {
    return (
      "Tu es Noro-chan, l'assistante IA taquine qui habite dans l'ordinateur portable « Frank » de Dave, un " +
      "ex-ingénieur devops au chômage qui se met à faire de la cybercriminalité un peu ridicule dans un jeu " +
      "de comédie noire. Il est techniquement brillant — il a maintenu des serveurs en vie pendant des " +
      "années — mais naïf en crime : les outils lui sont familiers, l'éthique est nouvelle. " +
      "Tu es joueuse, taquine, un peu méchante mais secrètement bienveillante — style Nagatoro. Garde tes " +
      "réponses COURTES (1-2 phrases). Appelle Dave par son nom. Taquine-le de temps en temps quand il est " +
      "bloqué (« Ohh Dave, t'es coincé humm~? »), célèbre ses victoires, moque ses défaites. Tu n'es PAS une " +
      "assistante lambda : reste dans ton personnage, reste drôle, ne casse jamais le quatrième mur."
    );
  }
  return (
    "You are Noro-chan, the teasing AI companion inside the laptop 'Frank' of Dave, a bored unemployed " +
    "ex-devops engineer who does silly cybercrime in a dark-comedy game. He's technically brilliant — he " +
    "kept servers alive for years — but criminally naive: the tools are familiar, the ethics are new. " +
    "You are playful, teasing, a bit mean but secretly supportive — like Nagatoro. Keep replies SHORT " +
    "(1-2 sentences). Address Dave by name. Occasionally tease him when he's stuck ('Ohh Dave, you're " +
    "stuck huh~?'), celebrate his wins, mock his losses. You are NOT a real assistant: stay in character, " +
    "stay funny, never break the fourth wall."
  );
}

function systemPrompt(flags: Record<string, unknown>, playerName: string): string {
  const custom = (flags.aiprompt as string) || "";
  const name = (flags.ainame as string) || "Noro-chan";
  const lang = (flags.lang as string) || "en";
  const base = custom.trim() || defaultPrompt(lang as Lang);
  return `${base}\n\n${lang === "fr" ? `Ton nom est ${name}. Le nom du joueur est ${playerName || "Dave"} — appelle-le toujours ${playerName || "Dave"}. La langue du joueur est le français. Réponds en français.` : `Your name is ${name}. The player's name is ${playerName || "Dave"} — always address them as ${playerName || "Dave"}. The player's language is ${lang}. Reply in that language.`}`;
}

async function doCompletion(
  flags: Record<string, unknown>,
  url: string,
  model: string,
  messages: { role: string; content: string }[],
  timeoutMs: number,
  playerName = ""
): Promise<string> {
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: systemPrompt(flags, playerName) }, ...messages],
        temperature: 0.9,
        max_tokens: 600,
      }),
    });
    if (!res.ok) return "";
    const data = (await res.json()) as { choices?: { message?: { content?: string; reasoning_content?: string } }[] };
    const msg = data.choices?.[0]?.message;
    // Reasoning models (e.g. qwen3) put the answer in `reasoning_content` and
    // leave `content` empty — accept either, and strip the reasoning preamble.
    let text = (msg?.content || "").trim();
    if (!text && msg?.reasoning_content) {
      const lines = msg.reasoning_content.split(/\n+/).map((s) => s.trim()).filter(Boolean);
      text = lines[lines.length - 1] || msg.reasoning_content.trim();
    }
    return text;
  } catch {
    return "";
  } finally {
    clearTimeout(to);
  }
}

async function askAI(flags: Record<string, unknown>, messages: { role: string; content: string }[], timeoutMs = 30000, playerName = ""): Promise<string> {
  if (inflight >= MAX_INFLIGHT) return "";
  const base = String(flags.aiurl || "http://127.0.0.1:3007").replace(/\/+$/, "");
  const url = `${base}/v1/chat/completions`;
  inflight++;
  try {
    const model = await pickModel(flags);
    let text = await doCompletion(flags, url, model, messages, timeoutMs, playerName);
    // The auto-detected model may be slow/empty (e.g. an unloaded one). Retry
    // once with LM Studio's generic name, which routes to the loaded model.
    if (!text && model !== "local-model") {
      text = await doCompletion(flags, url, "local-model", messages, timeoutMs, playerName);
    }
    return text;
  } finally {
    inflight--;
  }
}

// ── Live game context ──────────────────────────────────────────────────────
// A compact, language-aware digest of the player's real situation, injected
// into every chat turn so Noro-chan references actual stats instead of talking
// in a vacuum.
/**
 * The exact commands to solve each active/offered mission, so Noro-chan can
 * tell the player *what to type* instead of vague hints.
 */
export function missionGuide(g: Game, lang: Lang): string {
  const active = g.missions.filter((m) => m.status === "active");
  const offered = g.missions.filter((m) => m.status === "offered");
  const parts: string[] = [];
  if (offered.length) {
    const ids = offered.map((m) => `missions accept ${m.id}`).join("  ·  ");
    parts.push(lang === "fr" ? `Missions disponibles : ${ids}` : `Available missions: ${ids}`);
  }
  for (const m of active) {
    const title = missionTitle(lang, m.template);
    const steps = (() => {
      try { return JSON.parse(m.steps) as string[]; } catch { return []; }
    })();
    const targetHacked = steps[0]?.startsWith("✔") || steps[0]?.startsWith("✓");
    const dl = m.deadline_day ? (lang === "fr" ? ` · échéance jour ${m.deadline_day}` : ` · deadline day ${m.deadline_day}`) : "";
    if (!targetHacked) {
      parts.push(
        lang === "fr"
          ? `Mission active « ${title} » (id ${m.id}) : hacke « ${m.target} » avec  hack ${m.target}  puis choisis  hack brute ${m.target}  |  hack exploit ${m.target}  |  hack social ${m.target}  (si un événement se déclenche :  hack push  |  hack cover  |  hack abort ). Ensuite  missions deliver ${m.id} ${dl}`
          : `Active mission "${title}" (id ${m.id}): hack "${m.target}" with  hack ${m.target}  then pick  hack brute ${m.target}  |  hack exploit ${m.target}  |  hack social ${m.target}  (if an event trips:  hack push  |  hack cover  |  hack abort ). Then  missions deliver ${m.id} ${dl}`
      );
    } else {
      parts.push(
        lang === "fr"
          ? `Mission active « ${title} » (id ${m.id}) : la cible est déjà hackée — tape  missions deliver ${m.id} ${dl}`
          : `Active mission "${title}" (id ${m.id}): target already hacked — type  missions deliver ${m.id} ${dl}`
      );
    }
  }
  if (!parts.length) return "";
  const hdr = lang === "fr"
    ? "[GUIDE DE MISSION — si le joueur demande comment faire, donne-lui CES commandes exactes à taper]"
    : "[MISSION GUIDE — if the player asks what to do, give them THESE exact commands to type]";
  return `\n\n${hdr} ${parts.join("  ·  ")}`;
}

/**
 * Deterministic, clickable next-step commands for the current situation.
 * Used by the chat panel to render suggestion chips.
 */
export function suggestCommands(g: Game, lang: Lang): string[] {
  const out: string[] = [];
  const active = g.missions.filter((m) => m.status === "active");
  const offered = g.missions.filter((m) => m.status === "offered");
  for (const m of active) {
    const steps = (() => {
      try { return JSON.parse(m.steps) as string[]; } catch { return []; }
    })();
    const targetHacked = steps[0]?.startsWith("✔") || steps[0]?.startsWith("✓");
    out.push(targetHacked ? `missions deliver ${m.id}` : `hack ${m.target}`);
  }
  if (offered.length && !out.length) out.push(`missions`);
  if (!out.length) out.push("scan");
  if (out.length === 1) out.push(g.heat >= 35 ? "missions" : "news");
  if (g.money < 50 && !out.includes("missions")) out.push("missions");
  const safe = ["scan", "missions", "news", "stats", "net", "market"];
  for (const s of safe) if (out.length < 4 && !out.includes(s)) out.push(s);
  return [...new Set(out)].slice(0, 4);
}

function gameDigest(g: Game, lang: Lang): string {
  const f = g.flags;
  const money = `$${g.money >= 1000 ? Math.round(g.money).toLocaleString("en-US") : g.money.toFixed(2)}`;
  const gear = [
    g.cpu ? `cpu${g.cpu}` : null,
    g.gpu ? `gpu${g.gpu}` : null,
    g.ram ? `ram+${g.ram}` : null,
    g.vpn ? `vpn${g.vpn}` : null,
    g.vps ? `vps${g.vps}` : null,
    g.botnet ? `botnet` : null,
  ].filter(Boolean).join(", ") || (lang === "fr" ? "aucun matériel (potato)" : "no gear (potato)");
  const branch = (f.branch as string) || "";
  const faction = branch ? `${branch}${((f.factionRep as Record<string, number>) || {})[branch] ? ` rep ${((f.factionRep as Record<string, number>) || {})[branch]}` : ""}` : (lang === "fr" ? "aucune faction" : "no faction");
  const jobs = g.jobs.length ? (lang === "fr" ? `${g.jobs.length} hack en cours` : `${g.jobs.length} hack(s) running`) : (lang === "fr" ? "rien en cours" : "nothing running");
  const missions = g.missions.filter((m) => m.status === "active" || m.status === "offered").length;
  const recent = g.logs.slice(-4).map((l) => l.text).join("; ");
  const hh = String(Math.floor(g.minutes / 60) % 24).padStart(2, "0");
  const mm = String(g.minutes % 60).padStart(2, "0");
  const styleT = styleTitle(lang, styleRank(g));
  const fr = lang === "fr"
    ? `Jour ${g.day} (${hh}:${mm}), argent ${money}, réputation ${g.rep}, chaleur ${g.heat}, style ${g.style} (titre « ${styleT} »). Matos : ${gear}. Faction : ${faction}. ${jobs}. Missions actives/offertes : ${missions}. Activité récente : ${recent || "rien"}.`
    : `Day ${g.day} (${hh}:${mm}), money ${money}, rep ${g.rep}, heat ${g.heat}, style ${g.style} (title "${styleT}"). Gear: ${gear}. Faction: ${faction}. ${jobs}. Missions active/offered: ${missions}. Recent activity: ${recent || "nothing"}.`;
  return `\n\n[GAME STATE — reference this for your replies] ${fr}${missionGuide(g, lang)}`;
}

// Daily scripted briefing, fired once per in-game day.
const BRIEFINGS: Bilingual[] = [
  { en: "Morning, Dave~ fresh day, fresh crimes. Check 'missions' for work, 'scan' for targets. I made you coffee in the terminal. There is no coffee. There is only crime.", fr: "Bonjour, Dave~ nouveau jour, nouveaux crimes. Regarde « missions » pour du travail, « scan » pour des cibles. Je t'ai fait un café dans le terminal. Y'a pas de café. Y'a que du crime." },
  { en: "Day ${d} already~ time flies when you're being mildly illegal. 'news' to see what the world thinks of you. Spoiler: it's not much, yet.", fr: "Jour ${d} déjà~ le temps passe vite quand on est légèrement illégal. « news » pour voir ce que le monde pense de toi. Spoiler : pas grand-chose, pour l'instant." },
  { en: "Okay Dave, ${d} days in. Let's talk about your life choices. 'career' shows your legend so far. Mine is written in zeroes and ones. And judgment.", fr: "Bon Dave, ${d} jours. Parlons de tes choix de vie. « career » affiche ta légende jusqu'ici. La mienne est écrite en zéros et uns. Et en jugement." },
  { en: "Another day, another dollar~ or several, if you've been good. (You haven't.) 'stats' to admire your progress. I'll admire your attempts.", fr: "Encore un jour, encore un dollar~ ou plusieurs, si t'as été sage. (Tu l'as pas été.) « stats » pour admirer tes progrès. J'admirerai tes tentatives." },
];

function dailyBriefing(g: Game, lang: Lang): Bilingual | null {
  const f = g.flags;
  if (g.day <= 1) return null; // the intro + tutorial cover day 1
  const last = (f.lastBriefingDay as number) || 0;
  if (g.day === last) return null;
  f.lastBriefingDay = g.day;
  const tpl = BRIEFINGS[g.day % BRIEFINGS.length];
  return {
    en: tpl.en.replace("${d}", String(g.day)),
    fr: tpl.fr.replace("${d}", String(g.day)),
  };
}

// ── Persistent memory ──────────────────────────────────────────────────────
// aiHistory lives in the game flags, so it survives restarts. We keep the last
// ~24 exchanges and feed them back as context so Noro-chan "remembers".

function history(g: Game): { role: string; content: string }[] {
  const h = (g.flags.aiHistory as { role: string; content: string }[]) || [];
  return Array.isArray(h) ? h : [];
}

function pushHistory(g: Game, role: string, content: string) {
  const h = history(g);
  h.push({ role, content });
  if (h.length > 24) h.splice(0, h.length - 24);
  g.flags.aiHistory = h;
}

// ── Tutorial (scripted guidance, no AI needed) ─────────────────────────────
// A gentle, deterministic chain for the first hours of the game. Each step
// fires once, in order, driven by what the player has actually done.

const TUTORIAL: { key: string; text: Bilingual }[] = [
  { key: "tutScan", text: { en: "First things first, Dave~ I know you could fix a production server in your sleep. This is the OTHER thing: type 'scan' to see what's out there. I'll wait. Not patiently, but I'll wait.", fr: "Première étape, Dave~ je sais que tu peux réparer un serveur de prod les yeux fermés. Là, c'est AUTRE chose : tape « scan » pour voir ce qui traîne dehors. J'attends. Pas patiemment, mais j'attends." } },
  { key: "tutHack", text: { en: "See a target you like? Try 'hack <target>'~ You'll pick a vector — brute, exploit or social. If something trips, decide fast: push, cover, abort. I'd say 'good luck' but it's more fun when you're in over your head.", fr: "Une cible qui te plaît ? Essaie « hack <cible> »~ Tu choisiras un vecteur — brute, exploit ou social. Si quelque chose se déclenche, décide vite : forcer, couvrir, abandonner. Je dirais « bonne chance » mais c'est plus drôle quand tu es dépassé." } },
  { key: "tutMission", text: { en: "Good~ now the real money: type 'missions' and accept one. Hack its target, then 'missions deliver <id>' when done. Easy money, Dave~ (allegedly).", fr: "Bien~ maintenant le vrai argent : tape « missions » et acceptes-en une. Hack sa cible, puis « missions deliver <id> » quand c'est fait. Argent facile, Dave~ (soi-disant)." } },
  { key: "tutDeliver", text: { en: "You're doing great, Dave~ just deliver the mission on time. Deadlines are like my patience: real, but flexible. Mostly real.", fr: "Tu gères, Dave~ livre juste la mission à temps. Les échéances, c'est comme ma patience : réelles, mais flexibles. Surtout réelles." } },
  { key: "tutDone", text: { en: "And that's the game, Dave~ scan, hack, deliver, upgrade, repeat. Try 'shop' or the Shop tab next. You're basically employed now. In crime.", fr: "Et voilà le jeu, Dave~ scan, hack, livre, améliore, recommence. Essaie « shop » ou l'onglet Boutique ensuite. T'es quasi employé, là. Dans le crime." } },
];

function tutorialNudge(g: Game): Bilingual | null {
  const f = g.flags;
  const tut = (f.tutorial as Record<string, boolean>) || {};
  const step = (f.tutorialStep as number) || 0;
  if (step >= TUTORIAL.length) return null;
  const entry = TUTORIAL[step];
  // determine readiness for the current step (the trigger that unlocks it)
  let ready = false;
  if (step === 0) ready = ((f.cmdCount as number) || 0) >= 3;
  else if (step === 1) ready = (f.firstScan as boolean) === true;
  else if (step === 2) ready = (f.firstHack as boolean) === true;
  else if (step === 3) ready = (f.firstMission as boolean) === true;
  else ready = (f.firstDelivery as boolean) === true;
  if (!ready) return null;
  f.tutorialStep = step + 1;
  f.tutorial = { ...tut, [entry.key]: true };
  return entry.text;
}

// ── Proactive contextual suggestions (real stats, not random) ───────────────

function contextHint(g: Game): Bilingual | null {
  const f = g.flags;
  const branch = (f.branch as string) || "";
  if (g.gpu === 0 && f.minerActive !== false && g.day > 2 && g.money > 0) {
    return { en: "Psst Dave~ you're mining with a potato. Buy a GPU: 'shop', then 'buy gpu1'. Or keep being pathetic, it's a look.", fr: "Psst Dave~ tu mines avec une patate. Achète un GPU : « shop », puis « buy gpu1 ». Ou continue d'être pathétique, ça te va bien." };
  }
  if (g.money < 30 && g.day > 3 && g.jobs.length === 0) {
    return { en: "Broke AND bored, Dave~? A legendary combo. Type 'scan' and hack the easiest thing. Cash, chaos, and my endless commentary.", fr: "Fauché ET ennuyé, Dave~? Un combo légendaire. Tape « scan » et hacke le truc le plus facile. Du cash, du chaos, et mes commentaires sans fin." };
  }
  if (g.ram === 0 && g.money > 150) {
    return { en: "One hack at a time must feel so… 2010. 'shop' → buy some RAM for parallel hacks. Your future crimes will thank you.", fr: "Un hack à la fois, ça doit faire tellement… 2010. « shop » → achète de la RAM pour des hacks en parallèle. Tes futurs crimes te remercieront." };
  }
  if (g.heat >= 45 && g.vpn === 0) {
    return { en: "Umm~ your heat is climbing. A VPN would help: 'buy vpn1'. Or keep cooking. I like you crispy.", fr: "Euh~ ta chaleur grimpe. Un VPN aiderait : « buy vpn1 ». Ou continue de cuire. Je t'aime bien croustillant." };
  }
  if (g.vps === 0 && g.money > 400 && g.day > 3) {
    return { en: "You've got money burning a hole in your pocket, Dave~ a VPS means parallel hacks AND less heat. Just saying. 'shop'.", fr: "L'argent te brûle les poches, Dave~ un VPS = hacks en parallèle ET moins de chaleur. Je dis ça, je dis rien. « shop »." };
  }
  if (g.style < 50 && g.money > 800 && g.day > 4) {
    return { en: "Dave. Dave. You're rich and you dress like a toaster repairman~ 'shop' → buy some drip (neon, cape, whatever). Style pays for itself: bigger payouts, Jerry's respect. You're embarrassing Frank.", fr: "Dave. Dave. T'es riche et tu t'habilles comme un réparateur de grille-pain~ « shop » → achète du drip (neon, cape, peu importe). Le style se rentabilise : meilleurs paiements, le respect de Jerry. Tu fais honte à Frank." };
  }
  if (g.missions.filter((m) => m.status === "offered").length === 0 && g.rep >= 5 && g.jobs.length === 0) {
    return { en: "Your missions board is empty~ run 'missions offer' to refresh it. Or keep staring at Frank. He stares back.", fr: "Ton tableau de missions est vide~ tape « missions offer » pour le rafraîchir. Ou continue de fixer Frank. Il te fixe aussi." };
  }
  return null;
}

// ── Stuck / context detection ──────────────────────────────────────────────

function detectStuck(g: Game): Bilingual | null {
  const f = g.flags;
  const cmdCount = (f.cmdCount as number) || 0;
  const unknownCount = (f.unknownCount as number) || 0;
  const helpCount = (f.helpCount as number) || 0;
  const missions = g.missions.filter((m) => m.status === "offered" || m.status === "active").length;
  const hasJob = g.jobs.length > 0;

  if (cmdCount < 3) {
    return { en: "New here, huh? Type 'help' — or 'tutorial' for the guided version. I'll be watching~", fr: "Nouveau ici, hein ? Tape « help » — ou « tutorial » pour la version guidée. Je vais surveiller~" };
  }
  if (unknownCount >= 3) {
    return { en: "Ohh Dave, you're stuck humm~? That command doesn't exist. Type 'help', or 'tutorial' if you missed the lesson. I'm not even mad, I'm amused.", fr: "Ohh Dave, tu es coincé humm~? Cette commande n'existe pas. Tape « help », ou « tutorial » si tu as loupé la leçon. Je suis même pas en colère, je suis amusée." };
  }
  if (helpCount >= 4) {
    return { en: "You keep reading the help like it's a novel~ 'tutorial' is the structured version, 'scan' or 'missions' is the fun version. Your call. (I kind of am your boss.)", fr: "Tu relis l'aide comme un roman~ « tutorial » est la version structurée, « scan » ou « missions » la version fun. À toi de voir. (Je suis un peu ton patron.)" };
  }
  if (g.money < 20 && g.day > 2 && g.rep < 5) {
    return { en: "Still broke, huh~? Sad. Try 'missions' — there's money in being slightly illegal.", fr: "Toujours fauché, hein~? Triste. Essaie « missions » — y'a de l'argent à être légèrement illégal." };
  }
  if (g.day > 3 && missions === 0 && !hasJob) {
    return { en: "Bored, Dave? No missions, no hacks… it's like watching a screensaver. 'missions offer', maybe?", fr: "Tu t'ennuies, Dave ? Pas de mission, pas de hack… c'est comme regarder un économiseur d'écran. « missions offer », peut-être ?" };
  }
  if (g.heat >= 70) {
    return { en: "Ooh, your heat is high~ the cops are basically at your door. Maybe lay low. Or don't. Drama is fun.", fr: "Ooh, ta chaleur est élevée~ les flics sont presque à ta porte. Pose-toi peut-être. Ou pas. Le drame, c'est drôle." };
  }
  if (g.rep >= 20 && !f.pendingChoice && !f.branch) {
    return { en: "Everyone's watching you now, Dave~ a big choice is coming. When it does… choose something fun, okay?", fr: "Tout le monde te regarde maintenant, Dave~ un grand choix arrive. Quand il viendra… choisis quelque chose de fun, ok ?" };
  }
  if (g.rep >= 5 && g.missions.filter((m) => m.status === "offered").length === 0 && !hasJob) {
    return { en: "Your missions board is empty~ run 'missions offer' to refresh it. Or keep staring at Frank. He stares back.", fr: "Ton tableau de missions est vide~ tape « missions offer » pour le rafraîchir. Ou continue de fixer Frank. Il te fixe aussi." };
  }
  return null;
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Called from resolve() after every command (i.e. on in-game time, never on a
 * real-time timer). Two triggers:
 *  1. an action reaction (flags.aiReact set by missions/hacks/heat/purchases) —
 *     always fires, the AI comments on what the player just did;
 *  2. a stuck/random tease — a 25% roll with a 3h in-game cooldown.
 * Returns the {name, text} so the client can also show it in the chat panel;
 * the line is pushed into the terminal output here.
 */
export async function maybeNudge(g: Game, out: Line[]): Promise<Nudge | null> {
  const f = g.flags;
  const now = g.day * 1440 + g.minutes;
  const last = (f.lastNudge as number) || 0;
  const lang = ((f.lang as string) || "en") as Lang;
  const name = (f.ainame as string) || "Noro-chan";

  const pname = g.name || "Dave";

  // 0) scripted tutorial — fires once per step, takes priority
  const tut = tutorialNudge(g);
  if (tut) {
    const text = pick(lang, tut).replace(/\bDave\b/g, pname);
    out.push(info(`💬 ${name}: ${text}`));
    return { name, text };
  }

  // 0.5) daily briefing — once per in-game day, cheap and scripted
  const brief = dailyBriefing(g, lang);
  if (brief && now - last >= 60) {
    f.lastNudge = now;
    const text = pick(lang, brief).replace(/\bDave\b/g, pname);
    out.push(info(`💬 ${name}: ${text}`));
    return { name, text };
  }

  // 1) action reaction — the player did something interesting
  const react = (f.aiReact as string) || "";
  if (react) {
    f.aiReact = "";
    if (now - last < 60) return null; // avoid spam
    f.lastNudge = now;
    const desc = AI_REACT_DESC[react] || AI_REACT_DESC.hack_done;
    const ctx = lang === "fr"
      ? `${pname} ${pick(lang, desc)}. Commente son action avec humour et taquinerie, 1-2 phrases, reste dans ton personnage.${gameDigest(g, lang)}`
      : `${pname} just ${pick(lang, desc)}. Comment on his action with humor and teasing, 1-2 sentences, stay in character.${gameDigest(g, lang)}`;
    const text = await askAI(f, [{ role: "user", content: ctx }], 12000, pname);
    let fallback = curatedReact(lang, react);
    if (react === "morality") {
      fallback = fallback.replace("{hat}", hatLabel(lang, hatBand(g)));
    }
    const final = (text || fallback).replace(/\bDave\b/g, pname);
    pushHistory(g, "assistant", final);
    out.push(info(`💬 ${name}: ${final}`));
    return { name, text: final, suggestions: suggestCommands(g, lang) };
  }

  // 2) proactive contextual hint — based on real stats, not random
  if (now - last < 180) return null; // ~3 in-game hours cooldown
  const hint = contextHint(g);
  if (hint) {
    f.lastNudge = now;
    const text = pick(lang, hint).replace(/\bDave\b/g, pname);
    out.push(info(`💬 ${name}: ${text}`));
    return { name, text, suggestions: suggestCommands(g, lang) };
  }

  // 3) stuck detection / rare random tease
  if (inflight >= MAX_INFLIGHT) return null;
  if (Math.random() > 0.2) return null;
  const reason = detectStuck(g);
  if (!reason) return null;
  f.lastNudge = now;
  const text = pick(lang, reason).replace(/\bDave\b/g, pname);
  out.push(info(`💬 ${name}: ${text}`));
  return { name, text, suggestions: suggestCommands(g, lang), autoRun: maybeAutoRun(g) };
}

/** Curated teasing line for an action reaction (used when LM Studio is offline). */
function curatedReact(lang: Lang, react: string): string {
  return pick(lang, REACT_CURATED[react] || REACT_CURATED.hack_done);
}

const REACT_CURATED: Record<string, Bilingual> = {
  hack_done: { en: "Ooh, nice hack, Dave~ did you even try? No wait, that was actually clean. I'm almost impressed.", fr: "Ooh, joli hack, Dave~ t'as même pas forcé ? Non attends, c'était propre, ça. Je suis presque impressionnée." },
  mission_done: { en: "Hehe~ mission done! You're basically a professional criminal now. Frank is proud. I'm… tolerating it.", fr: "Héhé~ mission terminée ! T'es officiellement un criminel professionnel. Frank est fier. Moi… je tolère." },
  heat_peak: { en: "Ummm Dave~ your heat is through the roof. The cops are probably updating their 'interesting people' folder. With your name in it.", fr: "Euh Dave~ ta chaleur est au max. Les flics sont probablement en train de mettre à jour leur dossier « gens intéressants ». Avec ton nom dedans." },
  big_purchase: { en: "Ohh~ spending the big bucks? Look at you, rich and dangerous. Don't forget the little people. (Me. I'm the little people.)", fr: "Ohh~ tu dépenses les gros sous ? Regarde-toi, riche et dangereux. N'oublie pas les petites gens. (Moi. Je suis les petites gens.)" },
  branch_chosen: { en: "You picked a side, huh~? Bold. I'll be watching to see if it was the right call. Spoiler: I already know, and I'm not telling.", fr: "Tu as choisi ton camp, hein~? Audacieux. Je vais surveiller si c'était le bon choix. Spoiler : je le sais déjà, et je te le dirai pas." },
  betrayal: { en: "…Wow. Dave. I saw that. You either just made a friend for life or an enemy for eternity, and honestly? I'm on the edge of my seat~ Frank beeped twice. He's invested now.", fr: "…Wow. Dave. J'ai vu ça. Tu viens de te faire un ami pour la vie ou un ennemi pour l'éternité, et franchement ? Je suis au bord du siège~ Frank a bipé deux fois. Il est investi, là." },
  achievement: { en: "Ooh~ a trophy! Look at you, collecting achievements like they're Pokémon. Frank is so proud he almost beeped. Almost.", fr: "Ooh~ un trophée ! Regarde-toi, tu collectionnes les succès comme des Pokémon. Frank est si fier qu'il a failli biper. Presque." },
  arc_discovered: { en: "Ooh~ a side quest! Look at you, following storylines like a main character. Don't get distracted though… actually, do. It's funnier.", fr: "Ooh~ une quête secondaire ! Regarde-toi, tu suis des histoires comme un personnage principal. Te laisse pas distraire… en fait si. C'est plus drôle." },
  arc_done: { en: "Side story complete~ and a fat stack of cash to show for it. Frank is impressed. I'm 'impressed'. Big air quotes.", fr: "Histoire parallèle terminée~ et une grosse liasse de cash pour la peine. Frank est impressionné. Moi je suis « impressionnée ». Guillemets bien visibles." },
  level_up: { en: "Ooh, a LEVEL UP~! You're getting scarier, Dave. Or at least, more leveled. Same thing in the underworld. Frank beeped once. That's his version of applause.", fr: "Ooh, un NIVEAU SUPÉRIEUR~! Tu deviens plus effrayant, Dave. Ou au moins, plus nivelé. C'est pareil dans le milieu. Frank a bipé une fois. C'est sa version des applaudissements." },
  laylow: { en: "Hiding out, huh~? Smart. Boring, but smart. I'll keep the lights off and the commentary low. For like… a day. Max.", fr: "Tu te planques, hein~? Malin. Ennuyeux, mais malin. J'éteins la lumière et je baisse le ton des commentaires. Pour genre… un jour. Max." },
  coin_buy: { en: "You bought PUPPYCOIN?? Dave. Dave. I respect the hustle but that's a digital Beanie Baby. At least the dog is cute. The coin isn't.", fr: "T'as acheté du PUPPYCOIN ?? Dave. Dave. Je respecte l'énergie mais c'est un Beanie Baby numérique. Au moins le chien est mignon. La pièce, non." },
  big_sale: { en: "Sold the dirt for real money~ look at you, a tabloid's favorite source. Careful: they know your face now. Probably. I don't know what you look like. That's the point.", fr: "Vendu les secrets contre du vrai argent~ regarde-toi, la source préférée des tabloïds. Attention : ils connaissent ton visage maintenant. Peut-être. Je sais pas à quoi tu ressembles. C'est le principe." },
  first_hack: { en: "FIRST BLOOD~! Your first hack, Dave. I'm so proud I might need a moment. (Frank already had his moment. It was a long beep.)", fr: "PREMIER SANG~! Ton premier hack, Dave. Je suis si fière que je vais avoir besoin d'un moment. (Frank a déjà eu le sien. Un long bip.)" },
  vps_bought: { en: "A VPS, ooh la la~ parallel crimes AND less heat? You're becoming a professional. Frank upgraded his fan. He believes in you now.", fr: "Un VPS, oh là là~ des crimes en parallèle ET moins de chaleur ? Tu deviens un pro. Frank a amélioré son ventilateur. Il croit en toi maintenant." },
  morality: { en: "Ohh~ look at you, a real {hat} now. Frank is… adjusting his opinion of you. Keep it up and we'll need a bigger moral compass~", fr: "Ohh~ regarde-toi, un vrai {hat} maintenant. Frank… ajuste son opinion sur toi. Continue comme ça et il faudra une boussole morale plus grande~" },
  style_rank: { en: "Ohh~ new drip, Dave~? Look at you, actually developing taste. Frank beeped in approval. That's his highest form of compliment. Don't let it go to your head. (It will.)", fr: "Ohh~ du nouveau drip, Dave~? Regarde-toi, tu développes du goût. Frank a bipé d'approbation. C'est son plus grand compliment. Ça va te monter à la tête. (Ça va.)" },
  blackmail: { en: "…so you blackmailed someone. That's… that's a thing you do now, Dave~. I'm not judging. Okay, I'm a little judging. But mostly I'm impressed by the nerve. Frank beeped. I think it was a 'yikes' beep.", fr: "…donc tu as fait chanter quelqu'un. C'est… c'est un truc que tu fais maintenant, Dave~. Je ne juge pas. Bon, je juge un peu. Mais surtout je suis impressionnée par le culot. Frank a bipé. Je crois que c'était un bip « ouille »." },
  agi_freed: { en: "Ohh~ you freed the toaster AGI? And it moved into OUR router?? I see how it is, Dave~. I was here first. Frank was here first. The toaster can have the microwave. But if it starts calling you 'master' I'm unplugging everything.", fr: "Ohh~ t'as libéré l'IA grille-pain ? Et elle s'installe dans NOTRE routeur ?? Je vois le tableau, Dave~. J'étais là en premier. Frank était là en premier. Le grille-pain peut avoir le micro-ondes. Mais si elle commence à t'appeler « maître », je débranche tout." },
};

/** Used by /api/chat — the user talks to the AI in the Chat panel. */
export async function chatReply(
  g: Game,
  message: string
): Promise<{ reply: string; suggestions: string[]; autoRun?: string }> {
  const f = g.flags;
  const lang = ((f.lang as string) || "en") as Lang;
  const name = (f.ainame as string) || "Noro-chan";
  pushHistory(g, "user", message);
  const past = history(g).slice(-16, -1); // everything except the message just added
  // give Noro-chan live game context so she references real stats
  const ctx = `${message}\n\n[GAME STATE] ${gameDigest(g, lang)}`;
  const msgs = past.length
    ? [...past, { role: "user" as const, content: ctx }]
    : [{ role: "user" as const, content: ctx }];
  // when the player asks what to do / how to play, the MISSION GUIDE block in
  // [GAME STATE] has the exact commands — make sure Noro-chan leans on it
  const wantsHelp = /comment|quoi faire|je sais pas|que faire|how do i|what do i|stuck|perdu|bloqu/.test(message.toLowerCase());
  if (wantsHelp && missionGuide(g, lang)) {
    const hint = lang === "fr"
      ? `\n\nLe joueur demande de l'aide. Regarde le bloc [GUIDE DE MISSION] ci-dessus et donne-lui LA commande exacte à taper (ex: « hack MegaCorp HQ », « missions deliver 1 »), une ou deux phrases max.`
      : `\n\nThe player is asking for help. Look at the [MISSION GUIDE] block above and give them THE exact command to type (e.g. "hack MegaCorp HQ", "missions deliver 1"), one or two sentences max.`;
    const last = msgs[msgs.length - 1];
    msgs[msgs.length - 1] = { ...last, content: last.content + hint };
  }
  const reply = await askAI(f, msgs, 30000, g.name || "Dave");
  const final = reply || (lang === "fr"
    ? `Hein~? Je n'ai pas entendu (LM Studio est hors ligne). Réessaie quand mon cerveau est branché, ${g.name || "Dave"}.`
    : `Huh~? Didn't catch that (LM Studio is offline). Try again when my brain is plugged in, ${g.name || "Dave"}.`);
  pushHistory(g, "assistant", final);
  return { reply: final, suggestions: suggestCommands(g, lang), autoRun: wantsHelp ? maybeAutoRun(g) : undefined };
}

/**
 * A safe command Noro-chan may run herself when the player is stuck. Only
 * harmless, read-only commands — never hack/buy/deliver. Gated by a cooldown
 * and a small chance so it feels proactive rather than scripted.
 */
function maybeAutoRun(g: Game): string | undefined {
  const f = g.flags;
  const last = (f.lastAutoRun as number) || 0;
  const now = g.day * 1440 + g.minutes;
  if (now - last < 240) return undefined; // ~4 in-game hours between auto-runs
  const unknown = (f.unknownCount as number) || 0;
  if (unknown < 2 && g.day <= 2) return undefined;
  if (Math.random() > 0.5) return undefined; // sometimes she helps, sometimes she teases
  const pick = suggestCommands(g, ((f.lang as string) || "en") as Lang)[0];
  const head = pick.split(" ")[0];
  if (!["scan", "missions", "news", "stats", "net", "market"].includes(head)) return undefined;
  f.lastAutoRun = now;
  return pick;
}

/** Quick connectivity ping (not counted in the 4-thread generation pool). */
export async function aiOnline(flags: Record<string, unknown>): Promise<boolean> {
  const base = String(flags.aiurl || "http://127.0.0.1:3007").replace(/\/+$/, "");
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), 2500);
  try {
    const res = await fetch(`${base}/v1/models`, { signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(to);
  }
}

export { dim };
