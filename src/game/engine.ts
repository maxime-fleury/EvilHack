import type { Database } from "bun:sqlite";
import type { Line } from "./output";
import { dim, err, info, money, ok, warn, title, blank, divider, fmtMoney, fmtClock } from "./output";
import { NPCS, NEWS_FILLERS, TARGET_POOL, TOR_HIDDEN, FUN_HOSTS, getNpc, titleForRep } from "./world";
import type { MissionRow } from "./missions";
import { failMission, templateById, ensureOffers, missionTitle, MISSION_TEMPLATES } from "./missions";
import { ACHIEVEMENTS } from "./achievements";
import { ARCS, arcState, isArcActive, isArcDone } from "./arcs";
import type { Bilingual, Lang } from "./i18n";
import { pick, t } from "./i18n";
import { registry } from "./commands/registry";
import { resetDb, switchSlot, getDb, currentSlot } from "../db";
import { introLines } from "./intro";
import { maybeNudge, defaultPrompt } from "./aichat";

// ── Row shapes ─────────────────────────────────────────────────────────────

export interface NewsRow {
  id: number;
  day: number;
  minutes: number;
  headline: string;
  body: string;
}

export interface JobRow {
  id: number;
  kind: string;
  label: string;
  target: string;
  total: number;
  remaining: number;
  payload: Record<string, unknown>;
}

export interface ContactRow {
  npc: string;
  discovered: number;
  fragments: number;
  fragment_texts: string[];
  sold: number;
}

export interface LogRow {
  id: number;
  day: number;
  minutes: number;
  text: string;
}

export interface Game {
  db: Database;
  name: string;
  money: number;
  rep: number;
  heat: number;
  style: number;
  day: number;
  minutes: number;
  cpu: number;
  gpu: number;
  ram: number;
  vpn: number;
  botnet: number;
  vps: number;
  rgb: number;
  chair: number;
  toaster: number;
  cam: number;
  exploits: string[];
  titles: string[];
  flags: Record<string, unknown>;
  missions: MissionRow[];
  contacts: ContactRow[];
  news: NewsRow[];
  jobs: JobRow[];
  logs: LogRow[];
}

// ── Derived stats ──────────────────────────────────────────────────────────

export function hasProgram(g: Game, id: string): boolean {
  return ((g.flags.programs as string[]) || []).includes(id);
}

/** The RGB strip looks great but costs efficiency: -10% while it's on. */
export function rgbPenalty(g: Game): number {
  let m = g.rgb ? 0.9 : 1;
  if (blingOf(g).includes("holo")) m *= 0.95; // the holographic anime girls are distracting
  return m;
}

// ── Style ranks (the Saints Row drip ladder) ───────────────────────────────

const STYLE_RANKS = [0, 50, 150, 300, 500, 800, 1200];

/** 0 (no drip) → 6 (legend). Drives titles, payout bonus and shop discount. */
export function styleRank(g: Game): number {
  let r = 0;
  for (let i = 0; i < STYLE_RANKS.length; i++) if (g.style >= STYLE_RANKS[i]) r = i;
  return r;
}

export function styleTitle(lang: Lang, rank: number): string {
  const T: Record<number, Bilingual> = {
    0: { en: "No Drip", fr: "Zéro Style" },
    1: { en: "Drip Adjacent", fr: "Drip Adjacent" },
    2: { en: "Certified Flexer", fr: "Flexeur Certifié" },
    3: { en: "Icon of Style", fr: "Icône de Style" },
    4: { en: "Darknet Fashion King", fr: "Roi de la Mode du Darknet" },
    5: { en: "The Unstoppable Flex", fr: "Le Flex Imparable" },
    6: { en: "Legend of Drip", fr: "Légende du Drip" },
  };
  return pick(lang, T[Math.min(rank, 6)]);
}

/** Payout multiplier from your drip: +2% per rank (max +12%). */
export function styleMult(g: Game): number {
  const r = styleRank(g);
  return 1 + (r >= 1 ? r * 0.02 : 0);
}

// ── Combo / streak ─────────────────────────────────────────────────────────
// Clean streaks are rewarded, never punished: the multiplier grows with
// consecutive hacks that keep heat below the danger line, and it simply
// resets (no penalty) when you slip — the game can never take anything away.

export function comboOf(g: Game): number {
  return Math.max(1, (g.flags.combo as number) || 1);
}

/** +4% loot per combo level, capped at ×1.6. */
export function comboMult(g: Game): number {
  return 1 + Math.min(comboOf(g) - 1, 15) * 0.04;
}

/** Call after a hack: heat under 60 extends the streak, over 85 resets it. */
export function updateCombo(g: Game, heatGain: number): void {
  const before = g.heat - heatGain;
  const after = g.heat;
  const combo = comboOf(g);
  if (before >= 60) {
    // came in hot — streak never starts above the danger line
    g.flags.combo = 1;
  } else if (after >= 85) {
    // crossed the danger line mid-hack: gentle reset, nothing lost
    g.flags.combo = 1;
  } else {
    g.flags.combo = Math.min(combo + 1, 30);
  }
}

/** Bilingual label for the HUD combo pill. */
export function comboLabel(lang: Lang, combo: number): string {
  return lang === "fr" ? `🔥 combo ×${combo}` : `🔥 streak ×${combo}`;
}

// ── Trophy perks ───────────────────────────────────────────────────────────
// Achievements stop being cosmetic: every milestone tier unlocks a permanent
//, always-positive bonus. Nothing here can ever take anything from the player.

export interface TrophyPerks {
  loot: number; // × loot from hacks/missions
  xp: number; // × XP gain
  heat: number; // × heat gain (less than 1 = quieter)
  discount: number; // × shop prices
}

const TROPHY_TIERS: { n: number; perk: Partial<TrophyPerks> }[] = [
  { n: 5, perk: { loot: 1.05 } },
  { n: 10, perk: { xp: 1.1 } },
  { n: 15, perk: { heat: 0.95 } },
  { n: 20, perk: { loot: 1.1 } },
  { n: 25, perk: { discount: 0.95 } },
  { n: 30, perk: { xp: 1.2 } },
  { n: 35, perk: { loot: 1.15, heat: 0.9 } },
];

export function trophyCount(g: Game): number {
  const list = (g.flags.achievements as string[]) || [];
  return list.length;
}

/** Accumulated permanent perks from every unlocked tier. */
export function trophyPerks(g: Game): TrophyPerks {
  const base: TrophyPerks = { loot: 1, xp: 1, heat: 1, discount: 1 };
  const n = trophyCount(g);
  for (const t of TROPHY_TIERS) {
    if (n >= t.n) {
      for (const [k, v] of Object.entries(t.perk)) base[k as keyof TrophyPerks] *= v;
    }
  }
  return base;
}

/** Name of the next perk tier to unlock, for the HUD tooltip. */
export function nextTrophyTier(g: Game): { n: number; perk: Partial<TrophyPerks> } | null {
  const n = trophyCount(g);
  return TROPHY_TIERS.find((t) => t.n > n) || null;
}

/** Human label for a perk, e.g. "+5% loot". */
export function perkLabel(lang: Lang, perk: Partial<TrophyPerks>): string {
  const parts: string[] = [];
  if (perk.loot && perk.loot !== 1) parts.push(`+${Math.round((perk.loot - 1) * 100)}% ${lang === "fr" ? "butin" : "loot"}`);
  if (perk.xp && perk.xp !== 1) parts.push(`+${Math.round((perk.xp - 1) * 100)}% XP`);
  if (perk.heat && perk.heat !== 1) parts.push(`−${Math.round((1 - perk.heat) * 100)}% ${lang === "fr" ? "chaleur" : "heat"}`);
  if (perk.discount && perk.discount !== 1) parts.push(`−${Math.round((1 - perk.discount) * 100)}% ${lang === "fr" ? "shop" : "shop"}`);
  return parts.join(" · ") || "?";
}

/** Jerry respects the drip: an extra shop discount at the top ranks. */
export function styleDiscount(g: Game): number {
  const r = styleRank(g);
  return r >= 5 ? 0.9 : r >= 3 ? 0.95 : 1;
}

/** Fires after a command that changed style — announces rank-ups. */
export function checkStyleRank(g: Game, out: Line[]): void {
  const r = styleRank(g);
  const prev = (g.flags.styleRank as number) || 0;
  if (r > prev) {
    g.flags.styleRank = r;
    g.flags.aiReact = "style_rank";
    out.push(ok(t(langOf(g), "style.rankUp", { title: styleTitle(langOf(g), r), s: g.style })));
  }
}

/** Bling items live in flags (no schema change needed). */
export function blingOf(g: Game): string[] {
  return (g.flags.bling as string[]) || [];
}

/** Story-gated wallpapers: rep tiers, Black Hat, prestige, drip. */
export function wallpaperUnlocked(g: Game, id: string): boolean {
  if (id === "matrix" || id === "custom") return true;
  if (id === "circuit") return g.rep >= 10;
  if (id === "deepnet") return g.rep >= 20 || prestigeCount(g) >= 1;
  if (id === "nightcity") return moralityOf(g) >= 67 || prestigeCount(g) >= 2;
  if (id === "gold") return blingOf(g).includes("gold") || styleRank(g) >= 4;
  return false;
}

export function cpuPower(g: Game): number {
  return (1 + g.cpu * 0.9) * rgbPenalty(g);
}
export function miningRate(g: Game): number {
  const agiBaker = g.flags.agiBaker ? 2 : 0; // TOASTER.NET perfects your toast timing
  return (2 + g.gpu * 9 + g.toaster * 4 + g.vps * 1.5 + (hasProgram(g, "miner2") ? 3 : 0) + levelOf(g) * 0.5 + agiBaker) * rgbPenalty(g);
}
export function parallelSlots(g: Game): number {
  return 1 + g.ram + g.vps;
}
export function heatMult(g: Game): number {
  let m = 1 / (1 + g.vpn * 0.45 + g.vps * 0.25);
  if (hasProgram(g, "proxychain")) m *= 0.9;
  if (hasProgram(g, "rootkit")) m *= 0.95;
  if (isArcDone(g, "spectre")) m *= 0.85; // arc perk: the Spectre's shade
  m *= Math.max(0.7, 1 - levelOf(g) * 0.01); // level perk: quieter ops
  m *= Math.max(0.7, 1 - crewPerks(g).heat); // a whisperer on the team cools traces
  m *= trophyPerks(g).heat; // achievement perk: trophies make you quieter
  if (isArcDone(g, "merle") && g.flags.merleChoice === "turn") m *= 0.92; // double agent covers your traces
  return m;
}

export function langOf(g: Game): Lang {
  return (g.flags.lang as Lang) || "en";
}

/**
 * The player must identify with a name before the game starts (no password —
 * Frank doesn't believe in them). A save is "identified" once a non-default
 * name is set, or the flag was explicitly recorded.
 */
export function isIdentified(g: Game): boolean {
  const f = g.flags.identified;
  if (f === true) return true;
  if (f === false) return false;
  // legacy saves: a real (non-default) name means they already logged in
  return !!g.name && g.name !== "Dave";
}

export function sanitizeName(raw: string): string {
  let n = raw.trim().slice(0, 16);
  n = n.replace(/[^\p{L}\p{N}_\- ]/gu, "");
  return n.trim();
}

// ── Hat alignment: 0 = white hat, 50 = gray, 100 = black ──────────────────
// Drifts with mission deliveries (see missions.ts hat + deliverOptions).

export function moralityOf(g: Game): number {
  const m = (g.flags.morality as number) ?? 25;
  return Math.max(0, Math.min(100, m));
}

export type HatBand = "white" | "gray" | "black";

export function hatBand(g: Game): HatBand {
  const m = moralityOf(g);
  if (m <= 33) return "white";
  if (m >= 67) return "black";
  return "gray";
}

/** Apply a morality shift (negative = toward white, positive = toward black). */
export function shiftMorality(g: Game, shift: number, out: Line[]): void {
  if (!shift) return;
  const before = hatBand(g);
  const cur = moralityOf(g) + shift;
  g.flags.morality = Math.max(0, Math.min(100, cur));
  const after = hatBand(g);
  const lang = langOf(g);
  const label = hatLabel(lang, after);
  if (after !== before) {
    out.push(warn(t(lang, "hat.band", { label })));
    out.push(dim(t(lang, "hat.think", { label })));
    if (!g.flags.aiReact) g.flags.aiReact = "morality";
    logEvent(g, t(lang, "hat.log", { label }));
    recordAlign(g, after, t(lang, "hat.why"));
  }
}

export function hatLabel(lang: Lang, band: HatBand): string {
  return t(lang, band === "white" ? "hat.white" : band === "black" ? "hat.black" : "hat.gray");
}

// ── Alignment history (for the Legend screen) ─────────────────────────────

export interface AlignEvent {
  day: number;
  band: HatBand;
  value: number;
  why: string;
}

export function alignHistory(g: Game): AlignEvent[] {
  return (g.flags.alignHistory as AlignEvent[]) || [];
}

function recordAlign(g: Game, band: HatBand, why: string) {
  const h = alignHistory(g);
  h.push({ day: g.day, band, value: moralityOf(g), why });
  g.flags.alignHistory = h.slice(-30);
}

// ── Backdoors: leave an access on a hacked host ────────────────────────────

export interface Backdoor {
  target: string;
  day: number;
}

export function backdoorsOf(g: Game): Backdoor[] {
  return (g.flags.backdoors as Backdoor[]) || [];
}

/** True if we left an access on this host. */
export function hasBackdoor(g: Game, target: string): boolean {
  return backdoorsOf(g).some((b) => b.target === target);
}

/** Re-hacking a backdoored host is silent: no heat, faster, no trace news. */
export function backdoorBonus(g: Game, target: string): { heat: number; speed: number } {
  return hasBackdoor(g, target) ? { heat: 0, speed: 0.55 } : { heat: 1, speed: 1 };
}

/** When the heat event lands, a known backdoor can be burned. */
export function maybeBurnBackdoor(g: Game, out: Line[]): void {
  const bd = backdoorsOf(g);
  if (!bd.length) return;
  const lang = langOf(g);
  const idx = Math.floor(Math.random() * bd.length);
  const [victim] = bd.splice(idx, 1);
  g.flags.backdoors = bd;
  out.push(warn(t(lang, "backdoor.burned", { target: victim.target })));
  logEvent(g, t(lang, "backdoor.burnedLog", { target: victim.target }));
}

// ── Market: fluctuating prices (the pattern puppycoin already uses) ────────

export interface MarketPrices {
  tor: Record<string, number>;
  dossiers: Record<string, number>;
  scandalDay: number;
}

export function marketOf(g: Game): MarketPrices {
  return (g.flags.market as MarketPrices) || { tor: {}, dossiers: {}, scandalDay: 0 };
}

/** Daily price walk: tor programs and dossier values drift with the news. */
export function walkMarket(g: Game, out: Line[]): void {
  const m = marketOf(g);
  const lang = langOf(g);
  m.tor = m.tor || {};
  m.dossiers = m.dossiers || {};
  const drift = (base: number) => Math.max(0.6, Math.min(1.6, base * (0.85 + Math.random() * 0.35)));
  // tor programs drift around their base price
  for (const p of ["sniffer", "proxychain", "miner2", "wardialer", "rootkit"]) {
    m.tor[p] = drift(m.tor[p] || 1);
  }
  // a random NPC is "in the news" today — their dossier is worth 2×
  const npcIds = NPCS.map((n) => n.id);
  const lucky = npcIds[Math.floor(Math.random() * npcIds.length)];
  m.scandalDay = g.day;
  m.dossiers = {};
  for (const id of npcIds) m.dossiers[id] = id === lucky ? 2 : 1;
  g.flags.market = m;
  const npc = getNpc(lucky);
  if (npc) {
    out.push(dim(t(lang, "market.scandal", { npc: npc.name })));
    addNews(g, t(lang, "market.scandalHead", { npc: npc.name }), t(lang, "market.scandalBody", { npc: npc.name }));
  }
}

/** Tor program price multiplier today (base × market). */
export function torPriceMult(g: Game, id: string): number {
  const m = marketOf(g);
  return (m.tor && m.tor[id]) || 1;
}

/** Dossier sale multiplier today (a scandal makes one NPC's file hot). */
export function dossierMult(g: Game, npcId: string): number {
  const m = marketOf(g);
  return (m.dossiers && m.dossiers[npcId]) || 1;
}

// ── Crew: hire helpers with salaries and passive perks ─────────────────────

export interface CrewMember {
  id: string;
  hiredDay: number;
}

export function crewOf(g: Game): CrewMember[] {
  return (g.flags.crew as CrewMember[]) || [];
}

export function crewPerks(g: Game): { mining: number; heat: number; fragments: number; rep: number } {
  const p = { mining: 0, heat: 0, fragments: 0, rep: 0 };
  for (const m of crewOf(g)) {
    if (m.id === "scriptkiddie") p.mining += 2;
    if (m.id === "socialite") p.heat += 0.15;
    if (m.id === "whisper") p.fragments += 0.25;
    if (m.id === "recruiter") p.rep += 1;
    if (m.id === "agi") {
      p.mining += 3; // it optimizes your toaster
      p.fragments += 0.25; // it sees everything
    }
  }
  return p;
}

/** Daily crew salaries — deducted at each day rollover. Members quit if broke. */
export function payCrew(g: Game, out: Line[]): void {
  const members = crewOf(g);
  if (!members.length) return;
  const lang = langOf(g);
  const SALARY: Record<string, number> = { scriptkiddie: 25, socialite: 40, whisper: 60, recruiter: 90, agi: 0 }; // TOASTER.NET pays its own way
  let total = 0;
  for (const m of members) total += SALARY[m.id] || 0;
  if (g.money >= total) {
    g.money -= total;
    out.push(dim(t(lang, "crew.paid", { m: fmtMoney(total), n: members.length })));
  } else {
    g.flags.crew = [];
    g.money = Math.max(0, g.money - total);
    out.push(warn(t(lang, "crew.quit")));
    logEvent(g, t(lang, "crew.quitLog"));
  }
}

// ── Prestige: reset the grind, keep the legend, earn a multiplier ──────────

export function prestigeCount(g: Game): number {
  return (g.flags.prestiges as number) || 0;
}

export function prestigeMult(g: Game): number {
  return 1 + prestigeCount(g) * 0.1; // +10% income per prestige
}

// ── Frank's filesystem: a tiny explorable home dir ─────────────────────────

export interface FsEntry {
  content: string;
  // directories are implicit by path prefix
}

export function fsOf(g: Game): Record<string, string> {
  return (g.flags.fs as Record<string, string>) || {};
}

/** Prepopulate Frank's disk with fun files on a fresh save. */
export function seedFs(g: Game) {
  const fs = fsOf(g);
  if (Object.keys(fs).length) return;
  const fr = langOf(g) === "fr";
  fs["/home/dave/README.txt"] = fr
    ? "Bienvenue sur Frank. L'ordinateur du chômage.\nFichiers utiles :\n  /home/dave/notes.txt — vos notes\n  /etc/frank.conf — la configuration de Frank\n  /var/log/crimes.log — ne rien voir ici\nÉcrivez avec : write <chemin> <texte>"
    : "Welcome to Frank. The unemployment machine.\nUseful files:\n  /home/dave/notes.txt — your notes\n  /etc/frank.conf — Frank's config\n  /var/log/crimes.log — see nothing here\nWrite with: write <path> <text>";
  fs["/home/dave/notes.txt"] = fr
    ? "(vide)\nIdées de crimes :\n- scanner le réseau\n- accepter une mission\n- acheter un GPU pour miner"
    : "(empty)\nCrime ideas:\n- scan the network\n- take a mission\n- buy a GPU to mine";
  fs["/etc/frank.conf"] = fr
    ? "# Configuration de Frank v0.1\nram=512MB\nsoul=present (de justesse)\nfans=1 (bruyant)\n# ne pas modifier"
    : "# Frank config v0.1\nram=512MB\nsoul=present (barely)\nfans=1 (loud)\n# do not edit";
  fs["/var/log/crimes.log"] = fr
    ? "(fichier vide. Étrangement vide. Suspicieusement vide.)"
    : "(empty file. Strangely empty. Suspiciously empty.)";
  g.flags.fs = fs;
}

// ── Skills (rise with use) ─────────────────────────────────────────────────

export type SkillId = "sql" | "social" | "zero";

export function skillLevel(g: Game, skill: SkillId): number {
  const s = (g.flags.skills as Record<string, number>) || {};
  return s[skill] || 0;
}

export function addSkillXp(g: Game, skill: SkillId, out: Line[]): void {
  const s = (g.flags.skills as Record<string, number>) || {};
  const cur = s[skill] || 0;
  if (cur >= 10) return;
  const next = cur + 1;
  s[skill] = next;
  g.flags.skills = s;
  const lang = langOf(g);
  const label = skill === "sql" ? t(lang, "skills.sql") : skill === "social" ? t(lang, "skills.social") : t(lang, "skills.zero");
  out.push(ok(t(lang, "skills.up", { skill: label, n: next, label })));
  logEvent(g, `${label} skill up: Lv.${next}`);
}

// ── Faction reputation ─────────────────────────────────────────────────────

export function factionRep(g: Game, branch: string): number {
  const r = (g.flags.factionRep as Record<string, number>) || {};
  return r[branch] || 0;
}

export function addFactionRep(g: Game, branch: string, n: number, out: Line[]): void {
  const r = (g.flags.factionRep as Record<string, number>) || {};
  r[branch] = (r[branch] || 0) + n;
  g.flags.factionRep = r;
  const lang = langOf(g);
  out.push(ok(t(lang, "faction.gain", { n, branch })));
  const rep = r[branch];
  if (rep >= 10 && (g.flags.factionPerk10 as boolean) !== true) {
    g.flags.factionPerk10 = true;
    out.push(dim(t(lang, "faction.discount")));
  }
  if (rep >= 20 && (g.flags.factionPerk20 as boolean) !== true) {
    g.flags.factionPerk20 = true;
    out.push(dim(t(lang, "faction.heatProt")));
    out.push(dim(t(lang, "faction.exclusive", { branch })));
  }
}

/** Jerry's loyalty discount (10%) once your faction trusts you — and he respects the drip. */
export function shopDiscount(g: Game): number {
  const branch = (g.flags.branch as string) || "";
  const base = branch && factionRep(g, branch) >= 10 ? 0.9 : 1;
  return base * styleDiscount(g) * trophyPerks(g).discount; // achievement perk discount
}

// ── Career record ──────────────────────────────────────────────────────────

export function careerOf(g: Game): Record<string, any> {
  return (g.flags.career as Record<string, any>) || {};
}

function bumpCareer(g: Game, patch: Record<string, any>) {
  g.flags.career = { ...careerOf(g), ...patch };
}

export function trackEarned(g: Game, amount: number) {
  const c = careerOf(g);
  c.moneyEarned = (c.moneyEarned || 0) + amount;
  g.flags.career = c;
  g.flags.dayEarn = ((g.flags.dayEarn as number) || 0) + amount;
}

// ── XP & levels (every action pays, levels give passive perks) ──────────────

export function xpOf(g: Game): number {
  return (g.flags.xp as number) || 0;
}

/** Level curve: Lv.1 = 0 XP, each level costs ~2× the XP of the last. Cap 20. */
export function levelOf(g: Game): number {
  return Math.min(20, Math.floor(Math.sqrt(xpOf(g) / 100)) + 1);
}

export function xpIntoLevel(g: Game): number {
  const lvl = levelOf(g);
  return xpOf(g) - Math.pow(lvl - 1, 2) * 100;
}

export function xpForNext(g: Game): number {
  const lvl = levelOf(g);
  if (lvl >= 20) return 0;
  return Math.pow(lvl, 2) * 100 - Math.pow(lvl - 1, 2) * 100;
}

/** Award XP; a level-up announces itself (with a cash perk) instead of the +N line. */
export function addXp(g: Game, amount: number, out: Line[]): void {
  if (amount <= 0) return;
  // achievement perks multiply XP — always positive, never a penalty
  g.flags.xp = xpOf(g) + Math.round(amount * trophyPerks(g).xp);
  if (maybeLevelUp(g, out)) return;
  const lang = langOf(g);
  out.push(dim(t(lang, "xp.gain", { n: Math.round(amount * trophyPerks(g).xp) })));
}

/** Push the level-up celebration if the recorded level is behind the real one. */
export function maybeLevelUp(g: Game, out: Line[]): boolean {
  const cur = levelOf(g);
  const rec = (g.flags.level as number) || 1;
  if (cur <= rec) return false;
  g.flags.level = cur;
  const bonus = cur * 5;
  g.money += bonus;
  const lang = langOf(g);
  out.push(title(t(lang, "xp.levelup", { n: cur })));
  out.push(ok(t(lang, "xp.bonus", { b: fmtMoney(bonus) })));
  logEvent(g, `Level up! Lv.${cur}`);
  if (!g.flags.aiReact) g.flags.aiReact = "level_up";
  return true;
}

/** Progress optional narrative arcs; big payoffs + permanent perks on completion. */
export function checkArcs(g: Game, out: Line[]): void {
  const lang = langOf(g);
  const states = (g.flags.arcs as Record<string, any>) || {};
  for (const def of ARCS) {
    const st = states[def.id] || { step: 0 };
    if (st.done) continue;
    if (!st.active) {
      if (!def.discover(g)) continue;
      st.active = true;
      states[def.id] = st;
      out.push(title(pick(lang, def.title)));
      for (const l of def.intro) out.push(info(pick(lang, l)));
      addNews(g, pick(lang, def.hook), pick(lang, def.blurb));
      logEvent(g, `Arc discovered: ${pick(lang, def.title)}`);
      if (!g.flags.aiReact) g.flags.aiReact = "arc_discovered";
      continue;
    }
    // process every step whose condition is already met (so a big action can
    // complete several — or all — steps in one pass)
    while (true) {
      const idx = st.step;
      const step = def.steps[idx];
      if (!step || !step.done(g)) break;
      st.step = idx + 1;
      states[def.id] = st;
      out.push(ok(`✔ ${pick(lang, def.title)}: ${pick(lang, step.desc)}`));
      logEvent(g, `Arc step: ${pick(lang, def.title)} — ${pick(lang, step.desc)}`);
      if (idx + 1 < def.steps.length) continue;
      // final step: apply the big payoff + permanent perk
      st.done = true;
      states[def.id] = st;
      if (def.perkFlag) g.flags[def.perkFlag] = true;
      out.push(title(t(lang, "arcs.finale", { title: pick(lang, def.title) })));
      for (const l of def.finale) out.push(info(pick(lang, l)));
      if (def.money) {
        g.money += def.money;
        trackEarned(g, def.money);
        out.push(money(t(lang, "arcs.rewardMoney", { m: fmtMoney(def.money) })));
      }
      if (def.rep) {
        g.rep += def.rep;
        out.push(ok(t(lang, "arcs.rewardRep", { r: def.rep })));
      }
      if (def.style) {
        g.style += def.style;
        out.push(ok(t(lang, "arcs.rewardStyle", { s: def.style })));
      }
      if (def.xp) addXp(g, def.xp, out);
      if (def.perkText) out.push(dim(pick(lang, def.perkText)));
      addNews(g, `${pick(lang, def.hook)} — DONE`, pick(lang, def.blurb));
      logEvent(g, `Arc complete: ${pick(lang, def.title)}`);
      if (!g.flags.aiReact) g.flags.aiReact = "arc_done";
      break;
    }
  }
  g.flags.arcs = states;
}

/** Unlock any achievements whose conditions are met; grants their XP. */
export function checkAchievements(g: Game, out: Line[]): void {
  const lang = langOf(g);
  const unlocked = (g.flags.achievements as string[]) || [];
  for (const a of ACHIEVEMENTS) {
    if (unlocked.includes(a.id) || !a.check(g)) continue;
    unlocked.push(a.id);
    g.flags.achievements = unlocked;
    g.flags.xp = xpOf(g) + a.xp;
    out.push(title(t(lang, "ach.unlock", { title: pick(lang, a.title) })));
    out.push(dim(pick(lang, a.desc)));
    if (!maybeLevelUp(g, out)) out.push(dim(t(lang, "xp.gain", { n: a.xp })));
    logEvent(g, `Achievement: ${pick(lang, a.title)}`);
    if (!g.flags.aiReact) g.flags.aiReact = "achievement";
  }
}

export function hackMinutes(g: Game, difficulty: number, skill?: string): number {
  const speed = cpuPower(g);
  const exploitBonus = g.exploits.length * 0.06 + (hasProgram(g, "rootkit") ? 0.12 : 0);
  const skillBonus = skill ? skillLevel(g, skill as SkillId) * 0.12 : 0;
  const lvl = Math.max(0, 1 - levelOf(g) * 0.02); // level perk: faster hacks
  return Math.max(5, Math.round(((difficulty * 45) / (speed + exploitBonus + skillBonus)) * lvl));
}

export interface HackTarget {
  name: string;
  difficulty: number;
  basePayout: number;
  heat: number;
  flavor: string;
  loot: "cash" | "info" | "mission";
  npcDrop?: string;
  skill?: SkillId;
  isMission?: boolean;
  needBotnet?: boolean;
}

/** The full list of hackable networks: world pool + mission targets. */
export function buildTargets(g: Game): HackTarget[] {
  const lang = langOf(g);
  const map = new Map<string, HackTarget>();
  for (const t of TARGET_POOL) map.set(t.name, { ...t, flavor: pick(lang, t.flavor) });
  for (const t of FUN_HOSTS) map.set(t.name, { ...t, flavor: pick(lang, t.flavor) });
  if (hasProgram(g, "wardialer")) {
    for (const t of TOR_HIDDEN) map.set(t.name, { ...t, flavor: pick(lang, t.flavor) });
  }
  // arc targets appear while their side story is active
  if (isArcActive(g, "vault")) {
    map.set("The Vault", {
      name: "The Vault",
      difficulty: 5,
      basePayout: 4000,
      heat: 20,
      flavor: pick(lang, { en: "The Vault. Nobody knows who owns it. Everybody wants it. The lock is a single file named 'donotopen.exe'.", fr: "La Voûte. Personne ne sait qui la possède. Tout le monde la veut. La serrure est un fichier nommé « nepasouvrir.exe »." }),
      loot: "cash",
      skill: "zero",
    });
  }
  if (isArcActive(g, "spectre")) {
    map.set("Spectre's Rig", {
      name: "Spectre's Rig",
      difficulty: 5,
      basePayout: 2500,
      heat: 14,
      flavor: pick(lang, { en: "The Spectre's battle station. It's a stolen gaming PC running a chatbot named 'greg'.", fr: "La tour de combat du Spectre. C'est un PC gamer volé qui fait tourner un chatbot nommé « greg »." }),
      loot: "cash",
      skill: "zero",
      needBotnet: true,
    });
  }
  for (const m of g.missions) {
    if (m.status !== "active") continue;
    const existing = map.get(m.target);
    map.set(m.target, {
      name: m.target,
      difficulty: m.difficulty,
      basePayout: Math.round(m.payout * 0.3),
      heat: m.heat,
      flavor: `[MISSION] ${missionTitle(lang, m.template)}`,
      loot: "mission",
      isMission: true,
      npcDrop: existing?.npcDrop,
    });
  }
  return [...map.values()];
}

export function findTarget(g: Game, name: string): HackTarget | undefined {
  const n = name.toLowerCase();
  return buildTargets(g).find((t) => t.name.toLowerCase() === n);
}

// ── Load / save ────────────────────────────────────────────────────────────

// bun:sqlite statements are NOT auto-finalized. Creating a fresh one per call
// (as db.query() does) leaks prepared statements across the many requests in a
// session, eventually OOMing SQLite. Cache every statement per Database.
const stmtCache = new WeakMap<Database, Map<string, ReturnType<Database["query"]>>>();

function stmt(db: Database, sql: string): ReturnType<Database["query"]> {
  let cache = stmtCache.get(db);
  if (!cache) {
    cache = new Map();
    stmtCache.set(db, cache);
  }
  let s = cache.get(sql);
  if (!s) {
    s = db.query(sql);
    cache.set(sql, s);
  }
  return s;
}

interface PlayerRow {
  name: string;
  money: number;
  rep: number;
  heat: number;
  style: number;
  day: number;
  minutes: number;
  cpu: number;
  gpu: number;
  ram: number;
  vpn: number;
  botnet: number;
  vps: number;
  rgb: number;
  chair: number;
  toaster: number;
  cam: number;
  exploits: string;
  titles: string;
  flags: string;
}

export function loadGame(db: Database): Game {
  const p = stmt(db, "SELECT * FROM player WHERE id = 1").get() as PlayerRow | null;
  if (!p) {
    const g = newGame(db);
    saveGame(db, g);
    return g;
  }
  const missions = stmt(db, "SELECT * FROM missions ORDER BY id").all() as unknown as MissionRow[];
  for (const m of missions) {
    // defensive: a save from a buggy build may have stored a JSON-encoded
    // string here; normalize back to a single-encoded JSON string.
    if (typeof m.steps !== "string") m.steps = JSON.stringify(m.steps ?? []);
    else {
      try {
        if (Array.isArray(JSON.parse(m.steps))) m.steps = JSON.stringify(JSON.parse(m.steps));
      } catch {
        m.steps = "[]";
      }
    }
  }
  const contacts = stmt(db, "SELECT * FROM contacts")
    .all()
    .map((r) => ({
      ...(r as object),
      fragment_texts: JSON.parse((r as { fragment_texts: string }).fragment_texts || "[]"),
    })) as ContactRow[];
  const news = stmt(db, "SELECT * FROM news ORDER BY id DESC LIMIT 60").all() as unknown as NewsRow[];
  news.reverse();
  const jobs = stmt(db, "SELECT * FROM jobs")
    .all()
    .map((r) => ({ ...(r as object), payload: JSON.parse((r as { payload: string }).payload || "{}") })) as JobRow[];
  const logs = stmt(db, "SELECT * FROM log ORDER BY id DESC LIMIT 400").all() as unknown as LogRow[];
  logs.reverse();
  const g: Game = {
    db,
    name: p.name,
    money: p.money,
    rep: p.rep,
    heat: p.heat,
    style: p.style,
    day: p.day,
    minutes: p.minutes,
    cpu: p.cpu,
    gpu: p.gpu,
    ram: p.ram,
    vpn: p.vpn,
    botnet: p.botnet,
    vps: p.vps ?? 0,
    rgb: p.rgb,
    chair: p.chair,
    toaster: p.toaster,
    cam: p.cam,
    exploits: JSON.parse(p.exploits || "[]"),
    titles: JSON.parse(p.titles || "[]"),
    flags: JSON.parse(p.flags || "{}"),
    missions,
    contacts,
    news,
    jobs,
    logs,
  };
  // older saves predate Frank's filesystem — seed it so `ls` works everywhere
  if (!g.flags.fs || !Object.keys(g.flags.fs as object).length) seedFs(g);
  // and the market prices (pre-market saves start at base prices)
  if (!g.flags.market) {
    g.flags.market = { tor: { sniffer: 1, proxychain: 1, miner2: 1, wardialer: 1, rootkit: 1 }, dossiers: {}, scandalDay: 0 };
  }
  return g;
}

export function newGame(db: Database): Game {
  const g: Game = {
    db,
    name: "",
    money: 15.0,
    rep: 0,
    heat: 0,
    style: 0,
    day: 1,
    minutes: 540, // 09:00
    cpu: 0,
    gpu: 0,
    ram: 0,
    vpn: 0,
    botnet: 0,
    vps: 0,
    rgb: 0,
    chair: 0,
    toaster: 0,
    cam: 0,
    exploits: [],
    titles: [],
    flags: {
      minerActive: true,
      puppyPrice: 0.02,
      puppyOwned: 0,
      introDone: false,
      nullsecContacted: false,
      nullsecMissions: false,
      vaultHinted: false,
      laylowUntil: 0,
      branch: "",
      pendingChoice: "",
      programs: [],
      theme: "green",
      fontsize: "md",
      anim: true,
      sound: true,
      sndvol: 0.5,
      ambient: false,
      lang: "en",
      ainame: "Noro-chan",
      aiurl: "http://127.0.0.1:3007",
      aimodel: "",
      aiprompt: "",
      seenHelp: false,
      skills: {},
      factionRep: {},
      career: {},
      xp: 0,
      level: 1,
      morality: 25,
      achievements: [],
      dayEarn: 0,
      lastEventDay: 0,
      powered: true,
      aiHistory: [],
      tutorial: {},
      firstHack: false,
      firstScan: false,
      firstMission: false,
      firstDelivery: false,
      tutorialDone: false,
      tutorialSkipped: false,
      identified: false,
      arcs: {},
      alignHistory: [],
      backdoors: [],
      crew: [],
      market: { tor: { sniffer: 1, proxychain: 1, miner2: 1, wardialer: 1, rootkit: 1 }, dossiers: {}, scandalDay: 0 },
      prestiges: 0,
      fs: {},
    },
    missions: [],
    contacts: [],
    news: [],
    jobs: [],
    logs: [],
  };
  seedFs(g);
  ensureOffers(g);
  return g;
}

// In-place upserts (never DELETE-all + re-INSERT). Rewriting whole tables on
// every command churns SQLite pages and WAL frames until the file balloons to
// hundreds of MB — which is exactly what made an earlier build's DB hit ~2GB.
// Everything runs inside one transaction so a failure can't leave partial state.
function deleteMissingIds(db: Database, table: string, ids: number[]) {
  if (ids.length === 0) {
    stmt(db, `DELETE FROM ${table}`).run();
    return;
  }
  const q = ids.map(() => "?").join(",");
  stmt(db, `DELETE FROM ${table} WHERE id NOT IN (${q})`).run(...ids);
}

function deleteMissingKeys(db: Database, table: string, keys: string[]) {
  if (keys.length === 0) {
    stmt(db, `DELETE FROM ${table}`).run();
    return;
  }
  const q = keys.map(() => "?").join(",");
  stmt(db, `DELETE FROM ${table} WHERE npc NOT IN (${q})`).run(...keys);
}

export function saveGame(db: Database, g: Game) {
  const tx = db.transaction(() => {
    stmt(
      db,
      `INSERT INTO player (id, name, money, rep, heat, style, day, minutes, cpu, gpu, ram, vpn, botnet, vps, rgb, chair, toaster, cam, exploits, titles, flags)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name=excluded.name, money=excluded.money, rep=excluded.rep, heat=excluded.heat, style=excluded.style,
         day=excluded.day, minutes=excluded.minutes, cpu=excluded.cpu, gpu=excluded.gpu, ram=excluded.ram,
         vpn=excluded.vpn, botnet=excluded.botnet, vps=excluded.vps, rgb=excluded.rgb, chair=excluded.chair,
         toaster=excluded.toaster, cam=excluded.cam, exploits=excluded.exploits, titles=excluded.titles, flags=excluded.flags`
    ).run(
      g.name,
      g.money,
      g.rep,
      g.heat,
      g.style,
      g.day,
      g.minutes,
      g.cpu,
      g.gpu,
      g.ram,
      g.vpn,
      g.botnet,
      g.vps,
      g.rgb,
      g.chair,
      g.toaster,
      g.cam,
      JSON.stringify(g.exploits),
      JSON.stringify(g.titles),
      JSON.stringify(g.flags)
    );
    // missions
    const insM = stmt(
      db,
      `INSERT INTO missions (id, template, status, offered_day, deadline_day, giver, target, difficulty, minutes, payout, rep, style, heat, flavor, steps)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         template=excluded.template, status=excluded.status, offered_day=excluded.offered_day,
         deadline_day=excluded.deadline_day, giver=excluded.giver, target=excluded.target,
         difficulty=excluded.difficulty, minutes=excluded.minutes, payout=excluded.payout,
         rep=excluded.rep, style=excluded.style, heat=excluded.heat, flavor=excluded.flavor,
         steps=excluded.steps`
    );
    for (const m of g.missions) {
      // steps is stored as a JSON *string*; never JSON.stringify it again or it
      // grows a layer of quotes/escapes on every save (this once ballooned the
      // DB to ~2GB and OOM'd the process).
      // Watchdog: a steps value this big can only be corruption from that bug
      // class — reset it instead of persisting garbage.
      if (m.steps.length > 4096) {
        console.error(`[saveGame] mission #${m.id} steps corrupted (${m.steps.length} chars) — resetting`);
        m.steps = "[]";
      }
      insM.run(m.id, m.template, m.status, m.offered_day, m.deadline_day, m.giver, m.target, m.difficulty, m.minutes, m.payout, m.rep, m.style, m.heat, m.flavor, m.steps);
    }
    deleteMissingIds(db, "missions", g.missions.map((m) => m.id));
    // contacts
    const insC = stmt(
      db,
      `INSERT INTO contacts (npc, discovered, fragments, fragment_texts, sold) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(npc) DO UPDATE SET
         discovered=excluded.discovered, fragments=excluded.fragments,
         fragment_texts=excluded.fragment_texts, sold=excluded.sold`
    );
    for (const c of g.contacts) {
      insC.run(c.npc, c.discovered, c.fragments, JSON.stringify(c.fragment_texts), c.sold);
    }
    deleteMissingKeys(db, "contacts", g.contacts.map((c) => c.npc));
    // news
    const insN = stmt(
      db,
      `INSERT INTO news (id, day, minutes, headline, body) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET day=excluded.day, minutes=excluded.minutes,
         headline=excluded.headline, body=excluded.body`
    );
    for (const n of g.news) {
      insN.run(n.id, n.day, n.minutes, n.headline, n.body);
    }
    deleteMissingIds(db, "news", g.news.map((n) => n.id));
    // jobs
    const insJ = stmt(
      db,
      `INSERT INTO jobs (id, kind, label, target, total, remaining, payload) VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET kind=excluded.kind, label=excluded.label, target=excluded.target,
         total=excluded.total, remaining=excluded.remaining, payload=excluded.payload`
    );
    for (const j of g.jobs) {
      insJ.run(j.id, j.kind, j.label, j.target, j.total, j.remaining, JSON.stringify(j.payload));
    }
    deleteMissingIds(db, "jobs", g.jobs.map((j) => j.id));
    // log
    const insL = stmt(
      db,
      `INSERT INTO log (id, day, minutes, text) VALUES (?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET day=excluded.day, minutes=excluded.minutes, text=excluded.text`
    );
    for (const entry of g.logs) {
      insL.run(entry.id, entry.day, entry.minutes, entry.text);
    }
    deleteMissingIds(db, "log", g.logs.map((entry) => entry.id));
  });
  tx();
  // Watchdog: a healthy save is a few dozen KB. If the file ever balloons
  // again (freelist pages, corrupted value, whatever), surface it AND
  // auto-compact so the DB can never stay big: VACUUM reclaims all free
  // pages, bringing the file back to its real size (a few KB).
  const pages = stmt(db, "PRAGMA page_count").get() as { page_count: number };
  if (pages.page_count > 1000) {
    const mb = Math.round((pages.page_count * 4096) / 1048576);
    console.error(`[saveGame] DB at ${pages.page_count} pages (~${mb}MB) — auto-compacting (VACUUM)`);
    try {
      db.exec("VACUUM;");
    } catch {
      /* not fatal */
    }
  }
}

// ── Event helpers ──────────────────────────────────────────────────────────

export function logEvent(g: Game, text: string) {
  const id = g.logs.length ? g.logs[g.logs.length - 1].id + 1 : 1;
  g.logs.push({ id, day: g.day, minutes: g.minutes, text });
  if (g.logs.length > 500) g.logs.shift();
}

export function addNews(g: Game, headline: string, body = "") {
  const id = g.news.length ? g.news[g.news.length - 1].id + 1 : 1;
  g.news.push({ id, day: g.day, minutes: g.minutes, headline, body });
  if (g.news.length > 60) g.news.shift();
}

export function addContact(g: Game, npcId: string): boolean {
  const existing = g.contacts.find((c) => c.npc === npcId);
  if (existing) {
    if (!existing.discovered) existing.discovered = 1;
    return false;
  }
  g.contacts.push({ npc: npcId, discovered: 1, fragments: 0, fragment_texts: [], sold: 0 });
  return true;
}

export function contactOf(g: Game, npcId: string): ContactRow | undefined {
  return g.contacts.find((c) => c.npc === npcId);
}

export function addJob(g: Game, kind: string, label: string, target: string, total: number, payload: Record<string, unknown> = {}) {
  const id = g.jobs.length ? g.jobs[g.jobs.length - 1].id + 1 : 1;
  g.jobs.push({ id, kind, label, target, total, remaining: total, payload });
}

/** Drop a dossier fragment for a random relevant NPC. Returns the npc id or null. */
export function tryDropFragment(g: Game, preferred?: string): string | null {
  const candidates = preferred
    ? [preferred]
    : NPCS.map((n) => n.id).filter((id) => {
        const c = contactOf(g, id);
        return !c || (c.fragments < 3 && !c.sold);
      });
  if (!preferred) {
    // shuffle
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }
  }
  if (candidates.length === 0) return null;
  const npcId = candidates[0];
  const npc = getNpc(npcId);
  if (!npc) return null;
  let c = contactOf(g, npcId);
  if (!c) {
    addContact(g, npcId);
    c = contactOf(g, npcId)!;
  }
  if (c.sold || c.fragments >= 3) return null;
  const secret = npc.secrets[c.fragments];
  c.fragments += 1;
  c.fragment_texts.push(pick(langOf(g), secret.text));
  return npcId;
}

// ── Tick: command-driven time ──────────────────────────────────────────────

export function tick(g: Game, minutes: number, out: Line[]) {
  if (minutes <= 0) return;
  const startDay = g.day;
  // mining income
  const lang = langOf(g);
  const crew = crewPerks(g);
  const rate = miningRate(g) + crew.mining;
  const earned = g.flags.minerActive !== false ? ((rate * minutes) / 60) * prestigeMult(g) : 0;
  g.money += earned;
  if (earned > 0.001) out.push(dim(`⛏  ${t(lang, "miner.rate", { r: fmtMoney(rate) })}: +${fmtMoney(earned)}`));
  // Gertie's daily dividend (arc perk): silent, like all passive income
  if (isArcDone(g, "gertie")) g.money += (10 * (minutes / 1440)) * prestigeMult(g);
  // The Blackbird's double agent (merle arc, 'turn' choice): intel pays daily
  if (isArcDone(g, "merle") && g.flags.merleChoice === "turn") g.money += (40 * (minutes / 1440)) * prestigeMult(g);
  // TOASTER.NET's toaster-botnet dividends
  if (crewOf(g).some((m) => m.id === "agi")) g.money += (15 * (minutes / 1440)) * prestigeMult(g);

  // advance clock
  g.minutes += minutes;
  while (g.minutes >= 1440) {
    g.minutes -= 1440;
    g.day += 1;
    // passive cooldown each day (faction perk cools it faster)
    const branch = (g.flags.branch as string) || "";
    const perk = branch && factionRep(g, branch) >= 20 ? 3 : 0;
    g.heat = Math.max(0, g.heat - (3 + perk));
    // fold yesterday's earnings into the career record
    const dayEarn = (g.flags.dayEarn as number) || 0;
    const c = careerOf(g);
    if (dayEarn > (c.bestEarn || 0)) {
      c.bestEarn = dayEarn;
      c.bestDay = g.day - 1;
      g.flags.career = c;
    }
    g.flags.dayEarn = 0;
    // crew salaries come out daily
    payCrew(g, out);
    // the darknet market re-prices daily
    walkMarket(g, out);
  }

  // random everyday-life events (bills, landlord, cops, neighbors)
  const lastEvent = (g.flags.lastEventDay as number) || 0;
  if (g.day > 2 && g.day > lastEvent && Math.random() < 0.35) {
    g.flags.lastEventDay = g.day;
    handleRandomEvent(g, out);
  }

  // lay-low expiry
  const laylowUntil = (g.flags.laylowUntil as number) || 0;
  if (laylowUntil > 0 && g.day > laylowUntil) {
    g.flags.laylowUntil = 0;
    out.push(ok(t(lang, "laylow.done")));
  }

  // puppycoin price walk every 6 in-game hours
  const puppyPrice = (g.flags.puppyPrice as number) || 0.02;
  const hoursElapsed = minutes / 60;
  const walks = Math.floor(hoursElapsed / 6);
  for (let i = 0; i < walks; i++) {
    const drift = 0.85 + Math.random() * 0.4; // 0.85..1.25
    g.flags.puppyPrice = Math.max(0.001, puppyPrice * drift);
  }

  // jobs
  for (const j of [...g.jobs]) {
    j.remaining -= minutes;
    if (j.remaining <= 0) {
      g.jobs = g.jobs.filter((x) => x.id !== j.id);
      completeJob(g, j, out);
    }
  }

  // mission deadlines
  for (const m of g.missions) {
    if (m.status === "active" && m.deadline_day && g.day > m.deadline_day) {
      const f = failMission(lang, m);
      m.status = "failed";
      g.rep = Math.max(0, g.rep + f.rep);
      out.push(f.line);
      logEvent(g, t(lang, "mis.failedLog", { title: missionTitle(lang, m.template) }));
    }
  }



  // filler news every ~12h
  const lastFillerDay = (g.flags.lastFillerDay as number) || 0;
  if (g.day > startDay || Math.random() < 0.25) {
    if (g.day > lastFillerDay + 1 || (g.day > lastFillerDay && Math.random() < 0.5)) {
      const f = NEWS_FILLERS[Math.floor(Math.random() * NEWS_FILLERS.length)];
      addNews(g, pick(lang, f.headline), pick(lang, f.body));
      g.flags.lastFillerDay = g.day;
    }
  }

  // heat event — only a fresh knock if the raid isn't already pending
  if (g.heat >= 80 && !g.flags.laylowUntil && !g.flags.raidPending) {
    handleHeatEvent(g, out);
  }

  // auto-refresh mission offers once per day (new templates unlock with rep)
  if (g.day > ((g.flags.lastOfferDay as number) || 0)) {
    const before = g.missions.filter((m) => m.status === "offered").length;
    ensureOffers(g);
    const after = g.missions.filter((m) => m.status === "offered").length;
    g.flags.lastOfferDay = g.day;
    if (after > before) out.push(dim(t(lang, "mis.offerNew")));
  }

  // story milestones
  checkMilestones(g, out);
}

/** Random everyday-life event: a bill, the landlord, a patrol car, or a neighbor. */
function handleRandomEvent(g: Game, out: Line[]) {
  const lang = langOf(g);
  const roll = Math.random();
  // neighbor favor: always welcome, small money, cools heat
  if (roll < 0.2) {
    const pay = 15 + Math.round(Math.random() * 25);
    g.money += pay;
    g.heat = Math.max(0, g.heat - 8);
    out.push(ok(t(lang, "event.neighbor", { m: fmtMoney(pay) })));
    logEvent(g, t(lang, "event.neighborLog"));
    return;
  }
  // electricity bill
  if (roll < 0.5 && g.money > 15) {
    const bill = 30 + Math.round(Math.random() * 70);
    g.money -= bill;
    out.push(warn(t(lang, "event.bill", { m: fmtMoney(bill) })));
    addNews(g, t(lang, "event.billNews"), t(lang, "event.billNewsB"));
    logEvent(g, t(lang, "event.billLog"));
    return;
  }
  // landlord
  if (roll < 0.75 && g.money > 25) {
    const rent = 40 + Math.round(Math.random() * 50);
    g.money -= rent;
    out.push(warn(t(lang, "event.landlord", { m: fmtMoney(rent) })));
    logEvent(g, t(lang, "event.landlordLog"));
    return;
  }
  // patrol car (heat spike) — only if not already in laylow
  if (g.heat < 75 && !g.flags.laylowUntil) {
    const h = 5 + Math.round(Math.random() * 10);
    g.heat += h;
    out.push(warn(t(lang, "event.cop", { h })));
    logEvent(g, t(lang, "event.copLog"));
    return;
  }
  // fallback: if nothing matched (rich but no heat), the neighbor's cousin needs help
  const pay = 10 + Math.round(Math.random() * 20);
  g.money += pay;
  out.push(ok(t(lang, "event.neighbor", { m: fmtMoney(pay) })));
  logEvent(g, t(lang, "event.neighborLog"));
}

function handleHeatEvent(g: Game, out: Line[]) {
  g.flags.aiReact = "heat_peak";
  const lang = langOf(g);
  // the raid is a friendly prompt — every option is positive or neutral,
  // nothing here can soft-lock the game or take permanent progress away
  g.flags.raidPending = true;
  out.push(warn(t(lang, "heat.knock")));
  out.push(dim(t(lang, "heat.raidChoices")));
  out.push(dim(`   → raid flee`));
  out.push(dim(`   → raid pay`));
  out.push(dim(`   → raid brave`));
  logEvent(g, t(lang, "heat.knockLog"));
}

/**
 * Resolve a heat raid. All outcomes are positive or neutral — the player
 * can never lose progress, only ever recover and get back to the fun.
 */
export function resolveRaid(g: Game, choice: "flee" | "pay" | "brave"): Line[] {
  const lang = langOf(g);
  const out: Line[] = [];
  g.flags.raidPending = false;
  if (!g.flags.aiReact) g.flags.aiReact = "heat_peak";
  const bribe = Math.max(50, Math.round(g.money * 0.15));

  if (choice === "flee") {
    // free escape: you lose nothing, heat drops a bit
    g.heat = Math.max(0, g.heat - 20);
    out.push(ok(t(lang, "heat.flee")));
    if (Math.random() < 0.3) out.push(dim(t(lang, "heat.fleeFlavor")));
    logEvent(g, t(lang, "heat.fleeLog"));
  } else if (choice === "pay") {
    const paid = Math.min(bribe, g.money);
    g.money -= paid;
    g.heat = Math.max(0, g.heat - 45);
    out.push(ok(t(lang, "heat.bribe", { m: fmtMoney(paid) })));
    logEvent(g, t(lang, "heat.paid", { m: fmtMoney(paid) }));
  } else {
    // brave: riskier flavor but always a win — rep, style, cool factor
    const rep = 1 + Math.floor(Math.random() * 2);
    g.rep += rep;
    g.style += 5;
    g.heat = Math.max(0, g.heat - 15);
    out.push(ok(t(lang, "heat.brave", { r: rep })));
    addNews(g, t(lang, "heat.braveNews"), t(lang, "heat.braveNewsB"));
    logEvent(g, t(lang, "heat.braveLog"));
  }
  // a raid can burn a known backdoor (recoverable — you can re-hack later)
  maybeBurnBackdoor(g, out);
  return out;
}

function checkMilestones(g: Game, out: Line[]) {
  const lang = langOf(g);
  const newTitle = titleForRep(lang, g.rep);
  if (!g.titles.includes(newTitle)) {
    g.titles.push(newTitle);
    out.push(title(`🏆 ${t(lang, "stats.title", { title: newTitle })}`));
  }
  // branching decision point
  if (g.rep >= 20 && !g.flags.branch && !g.flags.pendingChoice) {
    g.flags.pendingChoice = "main";
    out.push(info(t(lang, "branch.title")));
    out.push(info(t(lang, "branch.msg1")));
    out.push(info(t(lang, "branch.msg2")));
    out.push(info(t(lang, "branch.msg3")));
    out.push(info(t(lang, "branch.msg4")));
    out.push(info(t(lang, "branch.msg5")));
    out.push(dim(t(lang, "branch.hint")));
  }
  if (g.rep >= 10 && !g.flags.nullsecContacted) {
    g.flags.nullsecContacted = true;
    addContact(g, "pierre");
    addNews(g, t(lang, "mil.nullsecNews1"), t(lang, "mil.nullsecNews1b"));
    out.push(info(t(lang, "mil.nullsec1")));
    out.push(info(t(lang, "mil.nullsec2")));
    out.push(info(t(lang, "mil.nullsec2b")));
    out.push(info(t(lang, "mil.nullsec3")));
  }
  if (g.rep >= 30 && !g.flags.nullsecMissions) {
    g.flags.nullsecMissions = true;
    out.push(info(t(lang, "mil.nullsecMissions")));
    addNews(g, t(lang, "mil.nullsecNews2"), t(lang, "mil.nullsecNews2b"));
  }
  if (g.rep >= 50 && !g.flags.vaultHinted) {
    g.flags.vaultHinted = true;
    out.push(info(t(lang, "mil.vault")));
  }
}

/**
 * Resolve a successful hack: payout, career, skill XP, fragments, heat, XP,
 * mission step + AI reaction. Shared by background jobs and the interactive
 * hack command. Returns the money skimmed.
 */
export function resolveHack(
  g: Game,
  targetName: string,
  opts: { isMission?: boolean; missionId?: number; label?: string; out?: Line[]; heatFactor?: number } = {}
): number {
  const lang = langOf(g);
  const out = opts.out || [];
  const target = findTarget(g, targetName);
  const isMission = !!opts.isMission;
  const diff = target?.difficulty ?? 2;
  // mission step completion
  let missionDone = false;
  if (isMission && opts.missionId) {
    const m = g.missions.find((x) => x.id === opts.missionId);
    if (m && m.status === "active") {
      const steps = JSON.parse(m.steps) as string[];
      steps[0] = `✔ Hack ${m.target} — done`;
      m.steps = JSON.stringify(steps);
      missionDone = true;
    }
  }
  // cash + loot (Vault Key arc perk: +25% skim; prestige: +10%/run; backdoor: silent)
  const bd = backdoorBonus(g, targetName);
  const trophies = trophyPerks(g);
  const skim =
    (target?.basePayout ?? 30 * diff) *
    (0.7 + Math.random() * 0.6) *
    (isArcDone(g, "vault") ? 1.25 : 1) *
    prestigeMult(g) *
    styleMult(g) * // the drip pays for itself
    trophies.loot * // achievement perks
    comboMult(g) * // clean-streak bonus
    (bd.speed < 1 ? 0.8 : 1); // silent revisit pays a bit less (no new data)
  g.money += skim;
  trackEarned(g, skim);
  // career record + first-hack milestone (drives the tutorial chain)
  const c = careerOf(g);
  c.hacksDone = (c.hacksDone || 0) + 1;
  if (!g.flags.firstHack) g.flags.firstHack = true;
  const tc = (c.targetCounts as Record<string, number>) || {};
  tc[targetName] = (tc[targetName] || 0) + 1;
  c.targetCounts = tc;
  let fav = "";
  let favN = 0;
  for (const [k, v] of Object.entries(tc)) if (v > favN) {
    fav = k;
    favN = v;
  }
  c.favTarget = fav;
  g.flags.career = c;
  // skill XP: targets train their skill track
  if (target?.skill) {
    addSkillXp(g, target.skill, [] as Line[]);
  } else if (!isMission && g.exploits.length && Math.random() < 0.25) {
    const owned = g.exploits.filter((e) => e === "sql" || e === "social" || e === "zero");
    if (owned.length) addSkillXp(g, owned[Math.floor(Math.random() * owned.length)] as SkillId, [] as Line[]);
  }
  // dossier fragment drop (a whisperer on the crew helps)
  const dropChance = Math.min(0.9, (hasProgram(g, "sniffer") ? 0.5 : 0.25) + crewPerks(g).fragments);
  if (target?.loot === "info" || Math.random() < dropChance) {
    const npcId = tryDropFragment(g, target?.npcDrop);
    if (npcId) {
      const npc = getNpc(npcId)!;
      const c = contactOf(g, npcId)!;
      out.push(info(t(lang, "hack.fragment", { npc: npc.name, f: c.fragments })));
      logEvent(g, t(lang, "hack.fraglog", { npc: npc.name }));
    }
  }
  // heat gain (skills make you quieter, backdoors are silent; vector loudness folds in)
  const heatGain = Math.round(
    (target?.heat ?? 4) * heatMult(g) * (opts.heatFactor ?? 1) * (target?.skill ? Math.max(0.6, 1 - skillLevel(g, target.skill) * 0.04) : 1) * bd.heat * trophies.heat
  );
  g.heat += heatGain;
  updateCombo(g, heatGain);
  if (heatGain > 0) out.push(dim(t(lang, "hack.heat", { h: heatGain })));
  if (comboOf(g) >= 3) {
    out.push(dim(t(lang, "combo.up", { n: comboOf(g), m: comboMult(g).toFixed(2) })));
  }
  logEvent(g, t(lang, "hack.logHacked", { target: targetName }));
  if (!isMission && Math.random() < 0.15) {
    addNews(g, t(lang, "hack.breach", { target: targetName }), t(lang, "hack.breachBody"));
  }
  if (missionDone) {
    const m = g.missions.find((x) => x.id === opts.missionId)!;
    out.push(ok(t(lang, "hack.missionDone", { title: missionTitle(lang, m.template), id: m.id })));
  }
  addXp(g, Math.round((isMission ? 30 : 20) * trophies.xp), out);
  if (comboOf(g) >= 8 && !g.flags.aiReact) g.flags.aiReact = "combo";
  if (!g.flags.aiReact) g.flags.aiReact = isMission ? "mission_done" : "hack_done";
  // hacking a host can unlock a related mission (guaranteed, not lottery)
  unlockMissionsOnHack(g, targetName, out);
  return skim;
}

/** Record the host as hacked and offer any mission gated on it (needsHack). */
export function unlockMissionsOnHack(g: Game, targetName: string, out: Line[]): void {
  const hacked = (g.flags.hackedTargets as string[]) || [];
  if (!hacked.includes(targetName)) {
    hacked.push(targetName);
    g.flags.hackedTargets = hacked;
  }
  const present = new Set(g.missions.map((m) => m.template));
  const lang = langOf(g);
  for (const tmpl of MISSION_TEMPLATES) {
    if (!tmpl.needsHack || tmpl.needsHack !== targetName) continue;
    if (present.has(tmpl.id)) continue;
    // the hack itself is the qualification — repReq is just a display hint here
    if (g.missions.some((m) => m.template === tmpl.id)) continue;
    g.missions.push({
      id: g.missions.length + 1,
      template: tmpl.id,
      status: "offered",
      offered_day: 1,
      deadline_day: null,
      giver: tmpl.giver.en,
      target: tmpl.target,
      difficulty: tmpl.difficulty,
      minutes: tmpl.minutes,
      payout: tmpl.payout,
      rep: tmpl.rep,
      style: tmpl.style,
      heat: tmpl.heat,
      flavor: JSON.stringify(tmpl.blurb),
      steps: "[]",
      title: tmpl.title.en,
    });
    out.push(info(t(lang, "hack.unlockMission", { title: missionTitle(lang, tmpl.id), id: g.missions.length })));
  }
}

function completeJob(g: Game, j: JobRow, out: Line[]) {
  const lang = langOf(g);
  const target = findTarget(g, j.target);
  const isMission = j.kind === "hack" && !!j.payload.missionId;
  if (j.kind === "hack") {
    out.push(ok(t(lang, "hack.done", { label: j.label })));
    const diff = target?.difficulty ?? 2;
    // mission step completion
    let missionDone = false;
    if (isMission) {
      const m = g.missions.find((x) => x.id === (j.payload.missionId as number));
      if (m && m.status === "active") {
        const steps = JSON.parse(m.steps) as string[];
        steps[0] = `✔ Hack ${m.target} — done`;
        m.steps = JSON.stringify(steps);
        missionDone = true;
      }
    }
    // shared resolution: payout, career, skill XP, fragments, heat, XP, mission
    const skim = resolveHack(g, j.target, { isMission, missionId: typeof j.payload.missionId === "number" ? j.payload.missionId : undefined, out });
    out.push(money(t(lang, "hack.skimmed", { m: fmtMoney(skim), target: j.target })));
  } else {
    out.push(ok(t(lang, "hack.done", { label: j.label })));
  }
}

// ── Command dispatch ───────────────────────────────────────────────────────

export interface CmdResult {
  lines: Line[];
  minutes: number;
  clear?: boolean;
  reset?: boolean;
  slotSwitchTo?: number;
  screensaver?: boolean;
  baseXp?: number;
}

// Every command pays a little XP; the big moments pay extra in their handlers.
const XP_BY_CMD: Record<string, number> = {
  scan: 5, hack: 4, missions: 8, buy: 2, shop: 3, inv: 2, sell: 6, people: 3,
  news: 3, search: 4, miner: 3, coin: 4, tor: 6, stats: 2, career: 2, choose: 10,
  settings: 2, save: 1, whoami: 1, credits: 1, about: 1, help: 1, achievements: 2,
  slots: 1, slot: 1, poweroff: 1, reboot: 2, screensaver: 2, clear: 0,
};

export function dispatch(g: Game, raw: string): CmdResult {
  const trimmed = raw.trim();
  const [name, ...args] = trimmed.split(/\s+/);
  const lang = langOf(g);
  // Frank is off: only reboot (and help) work
  if (g.flags.powered === false && !["reboot", "help", "?", "raid"].includes(name.toLowerCase())) {
    return { lines: [err(t(lang, "power.blocked"))], minutes: 0 };
  }
  // ── Login: the first thing you type is your name (no password, ever) ──
  if (!isIdentified(g)) {
    const clean = sanitizeName(trimmed);
    if (!clean) {
      return { lines: [err(t(lang, "login.bad"))], minutes: 0 };
    }
    g.name = clean;
    g.flags.identified = true;
    const lines: Line[] = [
      ok(t(lang, "login.welcome", { name: clean })),
      dim(t(lang, "login.accepted", { name: clean })),
      blank,
      ...introLines(lang, true, clean),
    ];
    return { lines, minutes: 0 };
  }
  // counters for the AI sidekick's stuck-detection
  g.flags.cmdCount = ((g.flags.cmdCount as number) || 0) + 1;
  if (name.toLowerCase() === "help" || name.toLowerCase() === "?") {
    g.flags.helpCount = ((g.flags.helpCount as number) || 0) + 1;
  }
  const cmd = registry.get(name.toLowerCase());
  if (!cmd) {
    g.flags.unknownCount = ((g.flags.unknownCount as number) || 0) + 1;
    return {
      lines: [err(t(lang, "cmd.unknown", { name }))],
      minutes: 0,
    };
  }
  try {
    const res = cmd.run(g, args);
    if (res.baseXp === undefined) res.baseXp = XP_BY_CMD[name.toLowerCase()] ?? 1;
    return res;
  } catch (e) {
    return { lines: [err(t(lang, "cmd.error", { msg: (e as Error).message }))], minutes: 0 };
  }
}

/** After a command runs, advance time, process events, persist, snapshot. */
export async function resolve(g: Game, res: CmdResult): Promise<{ lines: Line[]; state: State; nudge?: { name: string; text: string } | null }> {
  if (res.reset) {
    // wipe the story but keep the player's preferences (language, theme, AI…)
    const keep = ["lang", "theme", "fontsize", "anim", "sound", "sndvol", "ambient", "ainame", "aiurl", "aimodel", "aiprompt", "wallpaper", "wallpaperUrl"];
    const prefs: Record<string, unknown> = {};
    for (const k of keep) if (g.flags[k] !== undefined) prefs[k] = g.flags[k];
    resetDb(g.db);
    const fresh = newGame(g.db);
    for (const [k, v] of Object.entries(prefs)) fresh.flags[k] = v;
    saveGame(g.db, fresh);
    return { lines: res.lines, state: snapshot(fresh), nudge: null };
  }
  // switching save slot: persist current game, swap DB file, load the other life
  if (res.slotSwitchTo) {
    saveGame(g.db, g);
    switchSlot(res.slotSwitchTo);
    const fresh = loadGame(getDb());
    return { lines: res.lines, state: snapshot(fresh), nudge: null };
  }
  const out: Line[] = [...res.lines];
  if (res.minutes > 0) {
    out.push(blank);
    tick(g, res.minutes, out);
  }
  // XP + arcs + trophies: every command pays a little, big moments pay a lot
  addXp(g, res.baseXp ?? 1, out);
  checkArcs(g, out);
  checkAchievements(g, out);
  checkStyleRank(g, out);
  const nudge = await maybeNudge(g, out);
  saveGame(g.db, g);
  return { lines: out, state: snapshot(g), nudge };
}

// ── State snapshot for the client panels ───────────────────────────────────

export interface State {
  name: string;
  money: number;
  rep: number;
  heat: number;
  style: number;
  styleTitle: string;
  styleRank: number;
  day: number;
  minutes: number;
  clock: string;
  title: string;
  jobs: { label: string; remaining: number; total: number }[];
  mining: { rate: number; active: boolean };
  puppy: { price: number; owned: number };
  missions: { id: number; title: string; status: string; deadline: number | null }[];
  inventory: string[];
  exploits: string[];
  contacts: { name: string; role: string; fragments: number; sold: boolean }[];
  news: { headline: string; body: string; when: string }[];
  nullsec: boolean;
  laylow: number;
  pendingChoice: string;
  raidPending: boolean;
  xp: number;
  level: number;
  morality: number;
  hat: string;
  achievements: string[];
  achTotal: number;
  combo: number;
  comboMult: number;
  trophies: { count: number; loot: number; xp: number; heat: number; discount: number; next: { n: number; label: string } | null };
  arcs: { id: string; title: string; status: string; step: number; total: number; steps: string[] }[];
  skills: { sql: number; social: number; zero: number };
  faction: { branch: string; rep: Record<string, number> };
  career: Record<string, any>;
  slot: number;
  powered: boolean;
  identified: boolean;
  tutorial: { step: number; total: number; done: boolean; skipped: boolean; firstScan: boolean; firstHack: boolean; firstMission: boolean; firstDelivery: boolean };
  backdoors: { target: string; day: number }[];
  crew: { id: string; hiredDay: number }[];
  prestige: number;
  market: { tor: Record<string, number>; dossiers: Record<string, number>; scandalDay: number };
  settings: { theme: string; fontsize: string; anim: boolean; sound: boolean; lang: string; wallpaper: string };
  flags: Record<string, unknown>;
}

export function snapshot(g: Game): State {
  const lang = langOf(g);
  return {
    name: g.name,
    money: g.money,
    rep: g.rep,
    heat: g.heat,
    style: g.style,
    styleTitle: styleTitle(lang, styleRank(g)),
    styleRank: styleRank(g),
    day: g.day,
    minutes: g.minutes,
    clock: fmtClock(g.day, g.minutes),
    title: titleForRep(lang, g.rep),
    jobs: g.jobs.map((j) => ({ label: j.label, remaining: j.remaining, total: j.total })),
    mining: { rate: miningRate(g), active: !!g.flags.minerActive },
    puppy: { price: g.flags.puppyPrice as number, owned: g.flags.puppyOwned as number },
    missions: g.missions.map((m) => ({
      id: m.id,
      title: missionTitle(lang, m.template),
      status: m.status,
      deadline: m.deadline_day,
      steps: m.status === "active" ? (JSON.parse(m.steps) as string[]) : undefined,
    })),
    inventory: [
      ...(g.cpu > 0 ? [`CPU: ${["Potato 2000", "Toaster X", "Hamster i5", "The Boring i9", "Quantum Potato"][g.cpu]}`] : []),
      ...(g.gpu > 0 ? [`GPU: ${["Onboard", "GTX 760 Ti 'Grandma'", "RTX 3090 'Space Heater'", "RTX 5090 'Fusion'", "Quantum Toaster"][g.gpu]}`] : []),
      ...(g.ram > 0 ? [`RAM: +${g.ram} parallel slot${g.ram > 1 ? "s" : ""}`] : []),
      ...(g.vpn > 0 ? [`VPN: ${["Free Proxy", "Le VPN", "NordVPN (works)"][g.vpn]}`] : []),
      ...(g.vps > 0 ? [`VPS: ${["Potato VPS", "Gamer VPS", "Offshore Darknet VPS"][g.vps - 1]}`] : []),
      ...(g.botnet > 0 ? [`Botnet: ${["Elderly Printers (starter)", "Elderly Printers (premium)"][g.botnet - 1]}`] : []),
      ...(g.rgb ? ["RGB Strip"] : []),
      ...(g.chair ? ["Gamer Chair"] : []),
      ...(g.toaster ? ["Crypto Toaster"] : []),
      ...(g.cam ? ["Security Camera (for the cat)"] : []),
    ],
    exploits: g.exploits.map((e) => e),
    contacts: g.contacts.map((c) => {
      const npc = getNpc(c.npc);
      return { id: c.npc, name: npc?.name ?? c.npc, role: npc ? pick(lang, npc.role) : "", employer: npc?.employer ?? "", fragments: c.fragments, sold: !!c.sold };
    }),
    news: g.news.slice(-12).map((n) => ({
      headline: n.headline,
      body: n.body,
      when: fmtClock(n.day, n.minutes),
    })),
    nullsec: !!g.flags.nullsecContacted,
    laylow: (g.flags.laylowUntil as number) || 0,
    pendingChoice: (g.flags.pendingChoice as string) || "",
    raidPending: !!g.flags.raidPending,
    xp: xpOf(g),
    level: levelOf(g),
    morality: moralityOf(g),
    hat: hatLabel(lang, hatBand(g)),
    achievements: (g.flags.achievements as string[]) || [],
    achTotal: ACHIEVEMENTS.length,
    combo: comboOf(g),
    comboMult: comboMult(g),
    trophies: (() => {
      const perks = trophyPerks(g);
      const next = nextTrophyTier(g);
      return {
        count: trophyCount(g),
        loot: perks.loot,
        xp: perks.xp,
        heat: perks.heat,
        discount: perks.discount,
        next: next ? { n: next.n, label: perkLabel(lang, next.perk) } : null,
      };
    })(),
    arcs: ARCS.filter((a) => {
      const st = arcState(g)[a.id];
      return st?.active || st?.done;
    }).map((a) => {
      const st = arcState(g)[a.id] || { step: 0 };
      return {
        id: a.id,
        title: pick(lang, a.title),
        status: st.done ? "done" : "active",
        step: st.step,
        total: a.steps.length,
        steps: a.steps.map((s, i) => `${i < st.step ? "✔" : i === st.step && !st.done ? "▸" : "○"} ${pick(lang, s.desc)}`),
      };
    }),
    skills: {
      sql: skillLevel(g, "sql"),
      social: skillLevel(g, "social"),
      zero: skillLevel(g, "zero"),
    },
    faction: {
      branch: (g.flags.branch as string) || "",
      rep: (g.flags.factionRep as Record<string, number>) || {},
    },
    career: careerOf(g),
    slot: currentSlot(),
    powered: g.flags.powered !== false,
    identified: isIdentified(g),
    // guided tutorial state — the client renders a skippable, relaunchable panel
    tutorial: {
      step: Math.min(5, (g.flags.tutorialStep as number) || 0),
      total: 5,
      done: g.flags.tutorialDone === true || (g.flags.tutorialStep as number || 0) >= 5,
      skipped: g.flags.tutorialSkipped === true,
      firstScan: g.flags.firstScan === true,
      firstHack: g.flags.firstHack === true,
      firstMission: g.flags.firstMission === true,
      firstDelivery: g.flags.firstDelivery === true,
    },
    backdoors: backdoorsOf(g),
    crew: crewOf(g),
    prestige: prestigeCount(g),
    market: marketOf(g),
    settings: {
      theme: (g.flags.theme as string) || "green",
      fontsize: (g.flags.fontsize as string) || "md",
      anim: g.flags.anim !== false && g.flags.anim !== "off",
      sound: g.flags.sound !== false && g.flags.sound !== "off",
      lang: (g.flags.lang as Lang) || "en",
      wallpaper: (g.flags.wallpaper as string) || "matrix",
    },
    flags: {
      ...g.flags,
      // expose the default AI persona (in the player's language) so the
      // settings panel can show it
      aiDefaultPrompt: defaultPrompt(langOf(g)),
    },
  };
}

export { blank, divider };
