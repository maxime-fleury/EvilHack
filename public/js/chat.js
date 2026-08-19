import { chatSend } from "./api.js";
import { sChat } from "./sound.js";

const logEl = document.getElementById("chat-log");
const inputEl = document.getElementById("chat-input");
const sendBtn = document.getElementById("chat-send");
const badge = document.querySelector(".chat-badge");

let aiName = "Noro-chan";
let unread = 0;
let lastTab = "stats";
let greeted = false;

function setAiName(name) {
  if (name) aiName = name;
}

function scroll() {
  logEl.scrollTop = logEl.scrollHeight;
}

let youLabel = "you";

export function addMsg(who, text, quiet = false) {
  const div = document.createElement("div");
  div.className = `msg ${who === "user" ? "user" : "ai"}`;
  div.innerHTML = `<span class="who">${who === "user" ? esc(youLabel) : esc(aiName)}</span>${esc(text)}`;
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
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

let typingEl = null;
function showTyping() {
  if (!typingEl) {
    typingEl = document.createElement("div");
    typingEl.className = "chat-typing";
    typingEl.textContent = `${aiName} is typing…`;
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

async function send(text) {
  const msg = text.trim();
  if (!msg) return;
  addMsg("user", msg);
  inputEl.value = "";
  showTyping();
  try {
    const data = await chatSend(msg);
    hideTyping();
    const reply = data.reply || data.fallback || "…";
    addMsg("ai", reply);
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

export function setupChat(state) {
  const name = state.flags?.ainame || "Noro-chan";
  setAiName(name);
  const fr = state.flags?.lang === "fr";
  youLabel = fr ? "vous" : "you";
  // restore the conversation history so the panel matches what Noro-chan
  // actually remembers (the server persists it across sessions)
  const history = state.flags?.aiHistory || [];
  if (history.length && !logEl.children.length) {
    for (const h of history) {
      const role = h.role === "user" ? "user" : "ai";
      addMsg(role, h.content || "", true);
    }
  }
  if (!greeted) {
    greeted = true;
    if (!history.length) {
      const pname = state.name || "Dave";
      const greet = fr
        ? `Yo~ Je suis ${name}. T'es ${pname}, non ? Le type viré pour les snacks ? Hé. Écris quelque chose. Je vais pas être sympa.`
        : `Yo~ I'm ${name}. You're ${pname}, right? The guy who got fired over snacks? Heh. Type something. I'm not gonna be nice about it.`;
      addMsg("ai", greet, true);
    }
  }
}
