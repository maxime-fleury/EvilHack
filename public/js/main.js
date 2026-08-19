import { cmd, getIntro, getHelp, getState, setSettingsApi } from "./api.js";
import * as term from "./terminal.js";
import { renderStats, renderMissions, renderInv, renderShop, renderPeople, renderNews, renderHelp, renderSettings } from "./ui.js";
import { initChat, addMsg, setupChat, setChatTabState } from "./chat.js";
import { setupShell, setLocked, playBoot, showLogin, setLoginTexts, setShellLang } from "./os.js";
import { setSound } from "./sound.js";

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

function updateNavbar(s) {
  $("stat-clock").textContent = s.clock;
  $("stat-money").textContent = "$" + fmt(s.money);
  $("stat-rep").textContent = "rep " + Math.round(s.rep);
  $("stat-heat").textContent = "heat " + Math.round(s.heat);
  $("stat-heat").style.color = s.heat >= 60 ? "#ef4444" : s.heat >= 35 ? "#eab308" : "";
  $("stat-style").textContent = "style " + s.style;
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

function applyState(s) {
  state = s;
  term.setSettings(s.settings);
  setSound(s.settings.sound);
  applyTheme(s.settings.theme);
  applyFont(s.settings.fontsize);
  updateNavbar(s);
  updatePanels();
  setLoginTexts(LOGIN_TXT[s.flags?.lang === "fr" ? "fr" : "en"]);
  setShellLang(s.flags?.lang === "fr" ? "fr" : "en");
  setLocked(s.identified === false);
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
    if (data.screensaver) showScreensaver();
    // the moment the player logs in: play the OS boot, then reveal the desktop
    if (state && state.identified === false && data.state?.identified === true && !booted) {
      booted = true;
      playBoot(data.state.name, () => { term.focusInput(); });
    }
    if (data.state) applyState(data.state);
    if (data.nudge) addMsg("ai", data.nudge.text, true);
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

async function boot() {
  // fetch the state first so the boot lines render in the right language
  // (they appear behind the lock screen anyway — no visual delay)
  const [intro, help, st] = await Promise.all([getIntro(), getHelp(), getState()]);
  const lang = st.state?.flags?.lang;
  term.bootLines(lang).forEach((l) => term.appendLine(l));
  term.onSubmit(runCommand);
  initChat();

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

boot();
