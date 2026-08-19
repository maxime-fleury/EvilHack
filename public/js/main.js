import { cmd, getIntro, getHelp, getState, setSettingsApi } from "./api.js";
import * as term from "./terminal.js";
import { renderStats, renderMissions, renderInv, renderShop, renderPeople, renderNews, renderHelp, renderSettings, WALLS, unlockedWalls } from "./ui.js";
import { initChat, addMsg, setupChat, setChatTabState } from "./chat.js";
import { setupShell, setLocked, playBoot, showLogin, setLoginTexts, setShellLang, setLangPicker, wireLangPicker, openApp } from "./os.js";
import { wireTutorial, updateTutorial, showTutorial, isTutorialOpen } from "./tutorial.js";
import { setSound, setVolume, sBoot, sPowerOff, sShutdown, sScreensaver, sAchievement, sLevelUp, sAlarm, sWarning, sCoin, sHackStart, sHackDone, sMission, sDanger, sRaid, sBlackmail, sSale, sMining, setAmbient } from "./sound.js";

let state = null;
let helpCommands = [];
let booted = false; // has the OS boot animation played this session?

const $ = (id) => document.getElementById(id);

function applyTheme(theme) {
  document.body.className = document.body.className.replace(/theme-\w+/, "");
  document.body.classList.add(`theme-${theme || "green"}`);
}
function applyFont(size) {
  const out = $("terminal-output");
  out.style.fontSize = size === "lg" ? "1.1rem" : size === "sm" ? ".82rem" : ".95rem";
}

// ── Wallpaper ─────────────────────────────────────────────────────────────
const WALL_KEYS = WALLS.map((w) => "wall-" + w.id);

function applyWallpaper(s) {
  const wall = s.settings?.wallpaper || "matrix";
  document.body.classList.remove(...WALL_KEYS);
  document.body.classList.add("wall-" + wall);
  const url = String(s.flags?.wallpaperUrl || "").trim();
  const local = localStorage.getItem("evilhack_wall_data") || "";
  const img = url ? `url("${url.replace(/"/g, "%22")}")` : local ? `url("${local}")` : "none";
  document.body.style.setProperty("--wall-img", img);
  wallUnlockToast(s);
}

let wallToastTimer = null;
let wallSeen = new Set(JSON.parse(localStorage.getItem("evilhack_wall_seen") || "[]"));

function showWallToast(msg) {
  const el = document.getElementById("wall-toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("show");
  if (wallToastTimer) clearTimeout(wallToastTimer);
  wallToastTimer = setTimeout(() => el.classList.remove("show"), 3500);
}

// story-progressive unlock toast — fires once per wallpaper, stored locally
function wallUnlockToast(s) {
  const now = unlockedWalls(s).filter((id) => id !== "custom");
  const fresh = now.filter((id) => !wallSeen.has(id));
  if (!fresh.length) return;
  fresh.forEach((id) => wallSeen.add(id));
  localStorage.setItem("evilhack_wall_seen", JSON.stringify([...wallSeen]));
  const w = WALLS.find((x) => x.id === fresh[fresh.length - 1]);
  if (!w) return;
  const fr = s.flags?.lang === "fr";
  showWallToast(fr ? `🔓 Nouveau fond d'écran débloqué : ${w.fr}` : `🔓 New wallpaper unlocked: ${w.en}`);
}

function updateNavbar(s) {
  $("stat-clock").textContent = s.clock;
  $("stat-money").textContent = "$" + fmt(s.money);
  $("stat-rep").textContent = "rep " + Math.round(s.rep);
  $("stat-heat").textContent = "heat " + Math.round(s.heat);
  $("stat-heat").style.color = s.heat >= 60 ? "#ef4444" : s.heat >= 35 ? "#eab308" : "";
  // clean-streak combo — a pure bonus, never a punishment
  const combo = s.combo || 1;
  const comboEl = $("stat-combo");
  if (comboEl) {
    const fr = s.flags?.lang === "fr";
    comboEl.textContent = `🔥 ×${combo}`;
    comboEl.title = combo >= 3 ? (fr ? `Combo ×${combo} — butin ×${(s.comboMult || 1).toFixed(2)}` : `Streak ×${combo} — loot ×${(s.comboMult || 1).toFixed(2)}`) : (fr ? "Enchaîne des hacks propres pour un bonus" : "Chain clean hacks for a bonus");
    comboEl.style.display = combo >= 2 ? "" : "none";
    comboEl.style.color = combo >= 10 ? "#f59e0b" : combo >= 3 ? "#a3e635" : "";
  }
  $("stat-style").textContent = "✦ " + (s.styleTitle || "No Drip") + " " + s.style;
  $("stat-style").title = "style rank " + (s.styleRank ?? 0);
  const hatEl = $("stat-hat");
  if (hatEl) {
    const m = Math.round(s.morality ?? 25);
    hatEl.textContent = `⚖ ${s.hat || "gray"} ${m}`;
    hatEl.style.color = m >= 67 ? "#ef4444" : m <= 33 ? "#e0e7ff" : "#a1a1aa";
  }
  $("stat-title").textContent = s.title;
  const slotEl = $("stat-slot");
  if (slotEl) slotEl.textContent = "slot " + (s.slot || 1);
  term.setPrompt(s.name, s.clock, s.identified !== false);
  document.body.classList.toggle("powered-off", s.powered === false);
}

function fmt(n) {
  const v = Math.abs(n) >= 1000 ? n.toFixed(0) : n.toFixed(2);
  const [i, d] = v.split(".");
  return i.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (d ? "." + d : "");
}

function updatePanels() {
  if (!state) return;
  const actions = {
    runCommand: (c) => { term.focusInput(); const inp = $("terminal-input"); inp.value = c; runCommand(c); },
    setSettings: (cfg) => {
      // direct API call — works even at the lock screen, unlike a terminal
      // command which the server would swallow as a login name
      setSettingsApi(cfg).then((d) => { if (d.state) applyState(d.state); });
    },
    applyLocalWall: (dataUrl) => {
      try {
        localStorage.setItem("evilhack_wall_data", dataUrl);
        if (state) {
          // apply instantly (the server flag syncs via setSettings)
          document.body.classList.remove(...WALL_KEYS);
          document.body.classList.add("wall-custom");
          document.body.style.setProperty("--wall-img", `url("${dataUrl}")`);
        }
      } catch {
        alert(state?.flags?.lang === "fr" ? "Image trop lourde pour le stockage local." : "Image too large for local storage.");
      }
    },
  };
  renderStats(state, actions);
  renderMissions(state, actions);
  renderShop(state, actions);
  renderInv(state);
  renderPeople(state, actions);
  renderNews(state);
  renderHelp(helpCommands, actions, state);
  renderSettings(state, actions);
  setupChat(state);
}

// Login panel strings — bilingual, set from the player's language preference
const LOGIN_TXT = {
  en: {
    title: "User session",
    sub: "No password. Frank doesn't believe in them. Pick your handle:",
    placeholder: "handle",
    submit: "log in ➤",
    random: "🎲 surprise",
    hint: "A hacker alias, not your real name. …Or whatever you want.",
    error: "Frank needs a name. Any name.",
    lockHint: "Click to log in — no password. Frank doesn't believe in them.",
    chatPh: "ask Noro-chan…",
  },
  fr: {
    title: "Session utilisateur",
    sub: "Pas de mot de passe. Frank n'y croit pas. Choisis ton pseudo :",
    placeholder: "pseudo",
    submit: "se connecter ➤",
    random: "🎲 surprise",
    hint: "Un pseudo de hacker, pas ton vrai nom. …Enfin, comme tu veux.",
    error: "Frank a besoin d'un nom. N'importe lequel.",
    lockHint: "Cliquez pour vous connecter — pas de mot de passe. Frank n'y croit pas.",
    chatPh: "demande à Noro-chan…",
  },
};

// track what we've already made sound for, so events fire once
const playedAch = new Set();
let playedLevel = 0;
let lastHeatBand = -1;
let lastMiningSound = 0;

function applyState(s) {
  state = s;
  term.setSettings(s.settings);
  setSound(s.settings.sound);
  setVolume((() => { const v = Number(s.flags?.sndvol); return Number.isFinite(v) ? v : 0.5; })());
  setAmbient(s.flags?.ambient === true);
  applyTheme(s.settings.theme);
  applyFont(s.settings.fontsize);
  applyWallpaper(s);
  updateNavbar(s);
  updatePanels();
  updateTutorial(s);
  setLoginTexts(LOGIN_TXT[s.flags?.lang === "fr" ? "fr" : "en"]);
  setShellLang(s.flags?.lang === "fr" ? "fr" : "en");
  setLangPicker(s.flags?.lang);
  setLocked(s.identified === false);
  soundEvents(s);
}

// fire one-shot sounds when the state changes in meaningful ways
function soundEvents(s) {
  if (!state) return;
  // new achievements
  const ach = s.achievements || [];
  const fresh = ach.filter((a) => !playedAch.has(a));
  if (fresh.length) {
    fresh.forEach((a) => playedAch.add(a));
    sAchievement();
  }
  // level up
  const lvl = s.level || 1;
  if (lvl > playedLevel) {
    playedLevel = lvl;
    sLevelUp();
  }
  // heat danger band (crossing 60 / 80)
  const heat = Math.round(s.heat || 0);
  const band = heat >= 80 ? 2 : heat >= 60 ? 1 : 0;
  if (band > lastHeatBand && band > 0) {
    if (band === 2) sDanger(); else sAlarm();
  }
  lastHeatBand = band;
  // mining tick sound (throttled — once per ~2s)
  const now = performance.now();
  if (s.flags?.minerActive === true && now - lastMiningSound > 2000) {
    lastMiningSound = now;
    sMining();
  }
}

async function runCommand(val) {
  try {
    const data = await cmd(val);
    if (data.clear) term.clearOutput();
    if (data.lines && data.lines.length) {
      term.appendLines(data.lines);
      const m = /^search\s+(\S.*)$/i.exec(val.trim());
      if (m) term.highlight(m[1].replace(/["']/g, ""));
      else term.clearHighlight();
    }
    if (data.reset) term.clearOutput();
    if (data.screensaver) { showScreensaver(); sScreensaver(); }
    // the moment the player logs in: play the OS boot, then reveal the desktop
    if (state && state.identified === false && data.state?.identified === true && !booted) {
      booted = true;
      sBoot();
      playBoot(data.state.name, () => { term.focusInput(); });
    }
    // action sounds driven by the response lines (no extra server round-trips)
    const raw = (data.lines || []).map((l) => l.t || "").join("\n");
    const low = raw.toLowerCase();
    if (/^hack\b/.test(val.trim()) && data.state?.flags?.pendingHack) sHackStart();
    if (/récupérés|skimmed/.test(low) && /hack|pirat/i.test(low)) sHackDone();
    if (/mission.*(livr|termin|paid)|terminée et|deliver/.test(low)) sMission();
    if (low.includes("puppycoin") && (low.includes("acheté") || low.includes("bought"))) sCoin();
    if (low.includes("🔥") || low.includes("🚨") || /heat.*(crit|dang|max)/i.test(low)) sWarning();
    if (low.includes("frappe à la porte") || low.includes("knock") || /^raid\b/.test(val.trim())) sRaid();
    if (low.includes("l'enveloppe est lourde") || /envelope is heavy/i.test(low)) sBlackmail();
    if (low.includes("juteux") || /juicy/i.test(low)) sSale();
    if (data.state) applyState(data.state);
    // "tutorial start" re-opens the guided overlay (skip closes it via the button)
    if (/^tutorial\s+(start|replay)/.test(val.trim())) {
      showTutorial();
    }
    if (data.nudge) {
      addMsg("ai", data.nudge.text, true, { suggestions: data.nudge.suggestions || [] });
      // Noro-chan ran a command for you — execute it and let her comment
      if (data.nudge.autoRun) runCommand(data.nudge.autoRun);
    }
    term.finishSubmit();
    term.notifyResult(!data.lines?.some((l) => l.c === "err"));
  } catch (e) {
    term.appendLines([{ t: "Lost connection to the server. Frank is concerned.", c: "err" }]);
    term.finishSubmit();
    term.notifyResult(false);
  }
}

let saverTimer = null;
function showScreensaver() {
  const overlay = $("screensaver-overlay");
  if (!overlay) return;
  overlay.classList.add("active");
  if (saverTimer) clearTimeout(saverTimer);
  saverTimer = setTimeout(() => overlay.classList.remove("active"), 8000);
}

// power events: the terminal drives these from the powered-off state
function watchPower() {
  setInterval(() => {
    if (!state) return;
    const off = state.powered === false;
    const was = document.body.classList.contains("powered-off");
    if (off && !was) sPowerOff();
    if (!off && was) sShutdown();
    document.body.classList.toggle("powered-off", off);
  }, 800);
}

async function boot() {
  // fetch the state first so the boot lines render in the right language
  // (they appear behind the lock screen anyway — no visual delay)
  const [intro, help, st] = await Promise.all([getIntro(), getHelp(), getState()]);
  const lang = st.state?.flags?.lang;
  term.bootLines(lang).forEach((l) => term.appendLine(l));
  term.onSubmit(runCommand);
  initChat();
  wireTutorial((c) => runCommand(c));

  // the player picks their handle in the login panel, which sends the name as
  // the first "command" — the server treats it as identification (no password)
  function submitName(name) {
    setLocked(false);
    term.focusInput();
    runCommand(name);
  }

  setupShell({
    onLockClick: () => showLogin(submitName),
    onOpenApp: (id) => setChatTabState(id),
  });

  // EN/FR picker on the lock screen + login panel: persists via /api/settings
  // (works before identification), then applyState re-renders everything.
  wireLangPicker((lang) => {
    setSettingsApi({ lang }).then((d) => {
      if (d.state) applyState(d.state);
    });
  });

  helpCommands = help.commands || [];
  applyState(st.state);

  if (st.state?.identified === true) {
    // returning session — straight to the desktop with the intro already shown
    term.appendLines(intro.lines || []);
    booted = true;
  } else {
    // lock screen — keep the terminal clean (boot lines only); the full intro
    // plays after the player picks their handle in the login panel.
    term.clearOutput();
    term.bootLines(lang).forEach((l) => term.appendLine(l));
  }

  term.focusInput();
}

// generic toast channel — the settings panel uses it to confirm auto-saves
window.addEventListener("game-toast", (e) => showWallToast(e.detail));

// ── Noro-chan's command chips ─────────────────────────────────────────────
// clicking a suggested command fills the terminal (player presses Enter to run)
window.addEventListener("cmd-chip", (e) => {
  const inp = $("terminal-input");
  if (!inp) return;
  // bring the terminal forward so the player sees the command land in it
  openApp("terminal");
  term.focusInput();
  inp.value = String(e.detail || "");
  inp.dispatchEvent(new Event("input", { bubbles: true }));
});
// Noro-chan ran a command herself (from chat) — execute it with a comment
window.addEventListener("cmd-run", (e) => {
  const c = String(e.detail || "").trim();
  if (!c) return;
  const fr = state?.flags?.lang === "fr";
  addMsg("ai", fr ? `Allez~ je m'en occupe pour toi : ${c}` : `Fine~ I'll handle this one: ${c}`, true);
  runCommand(c);
});

watchPower();
boot();
