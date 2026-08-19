import { complete } from "./api.js";
import { sKey, sSubmit, sOk, sErr } from "./sound.js";

const output = document.getElementById("terminal-output");
const input = document.getElementById("terminal-input");
const suggestionEl = document.getElementById("terminal-suggestion");
const promptEl = document.getElementById("terminal-prompt");

// The machine's hostname — Frank is the laptop's name (the story), gh0stbox is
// what you call it on the network now that it's a crime machine.
const HOST = "gh0stbox";

const history = [];
let histIdx = -1;
let settings = { anim: true, sound: true, theme: "green", fontsize: "md" };
let lastHighlight = null;
let busy = false;
let identified = true;

export function setSettings(s) {
  settings = { ...settings, ...s };
}

export function focusInput() {
  input.focus();
}

export function appendLine(line) {
  const div = document.createElement("div");
  div.className = `line c-${line.c || "plain"}`;
  div.textContent = line.t;
  if (settings.anim) div.classList.add("anim-in");
  output.appendChild(div);
  scrollBottom();
}

export function appendLines(lines) {
  if (!lines || !lines.length) return;
  // fast path: big dumps render without per-line animation
  if (lines.length > 60) {
    const frag = document.createDocumentFragment();
    for (const l of lines) {
      const div = document.createElement("div");
      div.className = `line c-${l.c || "plain"}`;
      div.textContent = l.t;
      frag.appendChild(div);
    }
    output.appendChild(frag);
    scrollBottom();
    return;
  }
  for (const l of lines) appendLine(l);
}

export function clearOutput() {
  output.innerHTML = "";
  clearHighlight();
}

export function clearHighlight() {
  if (lastHighlight) { try { lastHighlight.unmark(); } catch {} lastHighlight = null; }
}

export function highlight(term) {
  clearHighlight();
  if (!term || !window.Mark) return;
  try {
    lastHighlight = new Mark(output);
    lastHighlight.mark(term, { separateWordSearch: false });
  } catch { /* noop */ }
}

export function chatLine(speaker, text) {
  const div = document.createElement("div");
  div.className = `line c-chat`;
  div.textContent = `💬 ${speaker}: ${text}`;
  output.appendChild(div);
  scrollBottom();
}

function scrollBottom() {
  output.scrollTop = output.scrollHeight;
}

export function setPrompt(name, clock, isIdentified = true) {
  identified = isIdentified;
  const user = String(name || "dave").toLowerCase();
  promptEl.textContent = isIdentified ? `${user}@${HOST}:~$` : "login:";
  const titleEl = document.querySelector(".term-title");
  if (titleEl) {
    titleEl.textContent = isIdentified
      ? `${user}@${HOST}: ~ — EVILHACK`
      : `${HOST}@login: ~ — EVILHACK`;
  }
  document.title = `EVILHACK — ${clock}`;
}

export function setStatus(txt) {
  document.getElementById("term-status").textContent = txt;
}

function setSuggestion(text) {
  suggestionEl.textContent = text;
}

let sugTimer = null;
function scheduleSuggestion() {
  clearTimeout(sugTimer);
  sugTimer = setTimeout(refreshSuggestion, 90);
}

async function refreshSuggestion() {
  const val = input.value;
  if (!val || !identified) { setSuggestion(""); return; }
  try {
    const data = await complete(val);
    const list = data.completions || [];
    const first = list[0];
    if (first && first.toLowerCase() !== val.toLowerCase()) {
      setSuggestion(first.slice(val.length));
    } else {
      setSuggestion("");
    }
  } catch { setSuggestion(""); }
}

// Track how many completions are available for cycling on repeated Tab.
let completionList = [];

function applyCompletion(text) {
  input.value = text;
  input.setSelectionRange(text.length, text.length);
  setSuggestion("");
  sKey();
}

/** Tab: fill the current word with the first (or next) completion. */
async function doTab() {
  const val = input.value;
  if (!val) return;
  try {
    const data = await complete(val);
    const list = data.completions || [];
    if (!list.length) { completionList = []; setSuggestion(""); return; }
    completionList = list;
    if (list.length === 1) {
      // single match — fill it fully, then auto-submit (it's a complete command)
      applyCompletion(list[0]);
      submitFilled();
    } else {
      // multiple matches — cycle, then keep the suggestion visible
      const common = longestCommonPrefix(list);
      const idx = list.indexOf(input.value);
      const next = list[(idx + 1) % list.length];
      const pick = common.length > input.value.length && idx === -1 ? common : next;
      applyCompletion(pick);
      if (idx !== -1 && idx === list.length - 1) {
        // wrapped around a complete option — enter runs it
        setStatus(list.join("  "));
      } else {
        setSuggestion(list.filter((c) => c !== pick).join("  "));
      }
    }
  } catch { /* noop */ }
}

// The handler set by onSubmit — lets doTab / Enter auto-run filled commands.
let submitHandler = null;
let pendingSubmit = null; // a completed command waiting for the terminal to be free
function submitFilled() {
  const val = input.value.trim();
  if (!val || !submitHandler) return;
  // only auto-run when the completed value is a full command (no partial word)
  if (!completionList.length || !completionList.includes(val)) return;
  if (busy) {
    // a previous command is still running — run this one as soon as it's done
    pendingSubmit = val;
    return;
  }
  doSubmit(val);
}
function doSubmit(val) {
  history.push(val);
  histIdx = history.length;
  input.value = "";
  setSuggestion("");
  sSubmit();
  busy = true;
  setStatus("running…");
  submitHandler(val);
}

function longestCommonPrefix(arr) {
  if (!arr.length) return "";
  let p = arr[0];
  for (let i = 1; i < arr.length; i++) {
    let j = 0;
    while (j < p.length && j < arr[i].length && p[j] === arr[i][j]) j++;
    p = p.slice(0, j);
    if (!p) break;
  }
  return p;
}

export function onSubmit(handler) {
  submitHandler = handler;
  input.addEventListener("keydown", (e) => {
    if (e.ctrlKey && (e.key === "l" || e.key === "L")) {
      e.preventDefault();
      handler("clear");
    } else if (e.key === "Enter") {
      e.preventDefault();
      const val = input.value.trim();
      if (!val || busy) return;
      doSubmit(val);
    } else if (e.key === "Tab") {
      e.preventDefault();
      doTab();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (histIdx > 0) {
        histIdx--;
        input.value = history[histIdx];
        input.setSelectionRange(input.value.length, input.value.length);
        setSuggestion("");
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (histIdx < history.length - 1) {
        histIdx++;
        input.value = history[histIdx];
      } else {
        histIdx = history.length;
        input.value = "";
      }
      input.setSelectionRange(input.value.length, input.value.length);
      setSuggestion("");
    } else if (e.key.length === 1 || e.key === "Backspace") {
      sKey();
      scheduleSuggestion();
    }
  });

  input.addEventListener("keyup", (e) => {
    if (e.key !== "Enter" && e.key !== "Tab" && e.key !== "ArrowUp" && e.key !== "ArrowDown") {
      scheduleSuggestion();
    }
  });

  // Clicking the terminal window (or the empty desktop) focuses the input —
  // but NEVER steal focus from other panels: the login panel, the chat, or any
  // other OS window (their selects/dropdowns/buttons would lose the click).
  document.addEventListener("click", (e) => {
    if (e.target.closest("#login-panel")) return;
    if (e.target.closest("#terminal")) { input.focus(); return; }
    // a different OS window (stats, settings, chat…) or the chat — hands off
    if (e.target.closest(".os-window")) return;
    const chatInput = document.getElementById("chat-input");
    if (chatInput && chatInput.contains(document.activeElement)) return;
    if (document.activeElement !== input) input.focus();
  });
}

export function finishSubmit() {
  busy = false;
  setStatus("");
  // run any command that was completed with Tab while the terminal was busy
  if (pendingSubmit) {
    const val = pendingSubmit;
    pendingSubmit = null;
    doSubmit(val);
  }
  focusInput();
}

export function notifyResult(okResult) {
  if (okResult) sOk(); else sErr();
}

export function bootLines(lang) {
  const fr = lang === "fr";
  return [
    { t: fr ? "Démarrage de Frank (HP Pavilion 2008)…" : "Booting Frank (2008 HP Pavilion)…", c: "dim" },
    { t: "BIOS: Frank Industries — version 6.66", c: "dim" },
    { t: fr ? "Vérif RAM : 512 Mo … c'est déjà ça" : "RAM check: 512MB … it's something", c: "dim" },
    { t: fr ? "Chargement de EVILHACK.SYS ██████████████ 100%" : "Loading EVILHACK.SYS ██████████████ 100%", c: "ok" },
  ];
}
