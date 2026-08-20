import { chatSend } from "./api.js";
import { sChat } from "./sound.js";

const logEl = document.getElementById("chat-log");
const inputEl = document.getElementById("chat-input");
const sendBtn = document.getElementById("chat-send");
const personasEl = document.getElementById("chat-personas");
const badge = document.querySelector(".chat-badge");

let state = null;
let aiName = "Noro-chan";
let currentPersona = "noro";
let unread = 0;
let lastTab = "stats";
const greeted = new Set(); // personas greeted this session

function setAiName(name) {
  if (name) aiName = name;
}

function scroll() {
  logEl.scrollTop = logEl.scrollHeight;
}

let youLabel = "you";

let chipTitle = (x) => x;
export function setChipTitle(fn) {
  chipTitle = fn || ((x) => x);
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function addMsg(who, text, quiet = false, opts = {}) {
  const div = document.createElement("div");
  div.className = `msg ${who === "user" ? "user" : "ai"}`;
  const speaker = who === "user" ? youLabel : personaName(currentPersona);
  div.innerHTML = `<span class="who">${esc(speaker)}</span>${esc(text)}`;
  const chips = opts.suggestions || [];
  if (chips.length) {
    const row = document.createElement("div");
    row.className = "cmd-chips";
    chips.forEach((c) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "cmd-chip";
      b.textContent = c;
      b.title = chipTitle(c);
      b.addEventListener("click", () => window.dispatchEvent(new CustomEvent("cmd-chip", { detail: c })));
      row.appendChild(b);
    });
    div.appendChild(row);
  }
  logEl.appendChild(div);
  scroll();
  if (!quiet) {
    sChat();
    if (!isChatTabActive()) {
      unread++;
      if (badge) {
        badge.textContent = unread;
        badge.classList.remove("d-none");
      }
    }
  }
  return div;
}

function personaName(id) {
  if (!id || id === "noro") return aiName;
  const list = personaList();
  const p = list.find((x) => x.id === id);
  return p ? p.name : id;
}

let typingEl = null;
function showTyping() {
  if (!typingEl) {
    typingEl = document.createElement("div");
    typingEl.className = "chat-typing";
    typingEl.textContent = `${personaName(currentPersona)} is typing…`;
    logEl.appendChild(typingEl);
  }
  scroll();
}
function hideTyping() {
  if (typingEl) { typingEl.remove(); typingEl = null; }
}

export function setChatTabState(tab) {
  lastTab = tab;
  if (tab === "chat") {
    unread = 0;
    if (badge) badge.classList.add("d-none");
  }
}
function isChatTabActive() {
  return lastTab === "chat";
}

// ── Persona picker ─────────────────────────────────────────────────────────
// Noro-chan + every contact whose dossier you've started + Mira once the
// romance arc is discovered. Each persona has its own LLM system prompt and
// its own persistent history.

function personaList() {
  const list = [{ id: "noro", name: state?.flags?.ainame || "Noro-chan" }];
  if (state?.contacts?.length) {
    for (const c of state.contacts) {
      list.push({ id: c.id, name: c.name });
    }
  }
  if ((state?.arcs || []).some((a) => a.id === "mira")) {
    if (!list.some((x) => x.id === "mira")) list.push({ id: "mira", name: "Mira" });
  }
  return list;
}

function historyFor(id) {
  if (!id || id === "noro") return state?.flags?.aiHistory || [];
  return state?.flags?.contactHistory?.[id] || [];
}

function renderPersonas() {
  if (!personasEl) return;
  const list = personaList();
  personasEl.innerHTML = list
    .map((p) => `<button type="button" class="chat-persona ${p.id === currentPersona ? "active" : ""}" data-persona="${esc(p.id)}">${esc(p.name)}</button>`)
    .join("");
  personasEl.querySelectorAll(".chat-persona").forEach((b) => {
    b.addEventListener("click", () => switchPersona(b.dataset.persona));
  });
}

function switchPersona(id) {
  if (id === currentPersona) return;
  currentPersona = id;
  renderPersonas();
  logEl.innerHTML = "";
  const h = historyFor(id);
  for (const m of h) addMsg(m.role === "user" ? "user" : "ai", m.content || "", true);
  if (!h.length) greeting(id);
  inputEl.placeholder = `${state?.flags?.lang === "fr" ? "écris à" : "message"} ${personaName(id)}…`;
}

function greeting(id) {
  if (greeted.has(id)) return;
  greeted.add(id);
  const fr = state?.flags?.lang === "fr";
  if (id === "noro") return; // Noro-chan greets via setupChat below
  const p = personaList().find((x) => x.id === id);
  if (!p) return;
  if (id === "mira") {
    addMsg("ai", fr
      ? "Hé. C'est Mira, du 3B. Ton routeur clignote plus que les miens. C'est un compliment. (T'es dev, non ? Tu repars de zéro aussi, hein ?)"
      : "Hey. It's Mira, from 3B. Your router blinks more than mine. That's a compliment. (You're a dev, right? Starting over too, huh?)", true);
    return;
  }
  addMsg("ai", fr
    ? `Hé. C'est ${p.name}. Donc… tu as fouillé mes affaires. Charmant. Qu'est-ce que tu me veux, exactement ?`
    : `Hey. It's ${p.name}. So… you went through my stuff. Charming. What exactly do you want from me?`, true);
}

async function send(text) {
  const msg = text.trim();
  if (!msg) return;
  addMsg("user", msg);
  inputEl.value = "";
  showTyping();
  try {
    const data = await chatSend(msg, currentPersona);
    hideTyping();
    const reply = data.reply || data.fallback || "…";
    addMsg("ai", reply, false, { suggestions: data.suggestions || [] });
    // Noro-chan occasionally runs a safe command herself (only for Noro-chan)
    if (data.autoRun && currentPersona === "noro") window.dispatchEvent(new CustomEvent("cmd-run", { detail: data.autoRun }));
  } catch {
    hideTyping();
    addMsg("ai", "Hmm? My connection to the AI got cut… try again~");
  }
}

export function initChat() {
  sendBtn.addEventListener("click", () => send(inputEl.value));
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); send(inputEl.value); }
  });
}

export function setupChat(s) {
  state = s;
  const name = s.flags?.ainame || "Noro-chan";
  setAiName(name);
  const fr = s.flags?.lang === "fr";
  youLabel = fr ? "vous" : "you";
  renderPersonas();
  // restore the current persona's conversation history so the panel matches
  // what the persona actually remembers (the server persists it)
  const h = historyFor(currentPersona);
  if (h.length && !logEl.children.length) {
    for (const m of h) addMsg(m.role === "user" ? "user" : "ai", m.content || "", true);
  }
  if (!greeted.has(currentPersona)) {
    greeted.add(currentPersona);
    if (currentPersona === "noro") {
      const pname = s.name || "Dave";
      const greet = fr
        ? `Yo~ Je suis ${name}. T'es ${pname}, non ? Le type viré pour les snacks ? Hé. Écris quelque chose. Je vais pas être sympa.`
        : `Yo~ I'm ${name}. You're ${pname}, right? The guy who got fired over snacks? Heh. Type something. I'm not gonna be nice about it.`;
      if (!h.length) addMsg("ai", greet, true);
    } else if (!h.length) {
      greeting(currentPersona);
    }
  }
  inputEl.placeholder = `${fr ? "écris à" : "message"} ${personaName(currentPersona)}…`;
}
