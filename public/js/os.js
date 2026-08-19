// ── FRANK OS shell ─────────────────────────────────────────────────────────
// Lock screen → boot animation → desktop with draggable windows, taskbar and
// start menu. Pure vanilla JS; the game engine stays server-side.

// App titles are bilingual — the OS shell follows the game's language.
const APPS = [
  { id: "terminal", title: { en: "Terminal", fr: "Terminal" }, icon: ">_", closable: false },
  { id: "stats", title: { en: "Stats", fr: "Stats" }, icon: "📊" },
  { id: "missions", title: { en: "Missions", fr: "Missions" }, icon: "📋" },
  { id: "shop", title: { en: "Shop", fr: "Boutique" }, icon: "🛒" },
  { id: "inv", title: { en: "Gear", fr: "Matos" }, icon: "🖥" },
  { id: "people", title: { en: "People", fr: "Contacts" }, icon: "👤" },
  { id: "news", title: { en: "News", fr: "Infos" }, icon: "📰" },
  { id: "chat", title: { en: "Noro", fr: "Noro" }, icon: "💬" },
  { id: "help", title: { en: "Help", fr: "Aide" }, icon: "❓" },
  { id: "settings", title: { en: "Settings", fr: "Réglages" }, icon: "⚙" },
];

const $ = (id) => document.getElementById(id);
const els = {
  lock: $("lock-screen"),
  boot: $("boot-overlay"),
  bootStatus: $("boot-status"),
  bootFill: $("boot-fill"),
  login: $("login-panel"),
  loginInput: $("login-input"),
  loginError: $("login-error"),
  loginSubmit: $("login-submit"),
  loginRandom: $("login-random"),
  loginTitle: $("login-title"),
  loginSub: $("login-sub"),
  loginHint: $("login-hint"),
  desktop: $("desktop"),
  taskbar: $("taskbar"),
  taskbarApps: $("taskbar-apps"),
  taskbarClock: $("taskbar-clock"),
  lockClock: $("lock-clock"),
  lockDate: $("lock-date"),
  lockHint: $("lock-hint"),
  desktopIcons: $("desktop-icons"),
  startBtn: $("start-btn"),
  startMenu: $("start-menu"),
  windows: $("windows"),
};

let zTop = 100;
let onOpenAppHook = null;
let shellLang = "en";
const state = {}; // appId -> { open, minimized }
for (const a of APPS) state[a.id] = { open: a.id === "terminal", minimized: false };

function titleOf(a) { return (a.title && typeof a.title === "object" ? a.title[shellLang] || a.title.en : a.title) || a.id; }

// ── Clock (real time, like a locked PC) ────────────────────────────────────
function pad(n) { return String(n).padStart(2, "0"); }
function tickClock() {
  const d = new Date();
  const t = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  els.lockClock.textContent = t;
  els.taskbarClock.textContent = t;
  els.lockDate.textContent = d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}
setInterval(tickClock, 1000);
tickClock();

// ── Lock screen ────────────────────────────────────────────────────────────
export function setLocked(locked) {
  els.lock.classList.toggle("hidden", !locked);
  if (locked) els.desktop.classList.add("shell-locked");
  else els.desktop.classList.remove("shell-locked");
}

// ── Login panel (custom OS-like login: pick your handle) ───────────────────
const RANDOM_PSEUDOS = [
  "xX_ShadowByte_Xx", "0xN1ght", "CtrlAltElite", "KernelPanic", "sudoDave",
  "NullPointer", "gh0st_rider", "404NotFound", "rootkitQueen", "PingOfDeath",
  "Wardr1ver", "HexVibes", "DarkPhoton", "BashGhost", "TheL33tOne",
  "rm_rf_everything", "Polymorph", "NetWatcher", "BlueScreener", "ZeroCool2",
];

let loginSubmitCb = null;

/** Bilingual strings for the login panel (called by main.js with the player's language). */
export function setLoginTexts(t) {
  if (!t) return;
  if (els.loginTitle) els.loginTitle.textContent = t.title;
  if (els.loginSub) els.loginSub.textContent = t.sub;
  if (els.loginHint) els.loginHint.textContent = t.hint;
  if (els.loginInput) els.loginInput.placeholder = t.placeholder;
  if (els.loginSubmit) els.loginSubmit.textContent = t.submit;
  if (els.loginRandom) els.loginRandom.textContent = t.random;
  if (els.loginInput) els.loginInput.setAttribute("aria-label", t.placeholder);
  if (els.loginError && t.error) els.loginError.dataset.msg = t.error;
  // the lock screen hint + chat placeholder follow the same language
  if (els.lockHint) els.lockHint.textContent = t.lockHint || t.hint;
  const chatIn = document.getElementById("chat-input");
  if (chatIn) chatIn.placeholder = t.chatPh || "ask Noro-chan…";
}

let onLangPick = null;

/** Highlight the active language on the lock screen + login panel pickers. */
export function setLangPicker(lang) {
  const want = lang === "fr" ? "fr" : "en";
  document.querySelectorAll(".lang-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.lang === want);
  });
}

/** Wire the EN/FR buttons (lock screen + login panel). Called once at boot. */
export function wireLangPicker(cb) {
  onLangPick = cb;
  document.querySelectorAll(".lang-btn").forEach((b) => {
    b.addEventListener("click", () => {
      setLangPicker(b.dataset.lang);
      if (onLangPick) onLangPick(b.dataset.lang);
    });
  });
}

/** Switch the whole OS shell (window titles, icons, boot, start menu) language. */
export function setShellLang(lang) {
  shellLang = lang === "fr" ? "fr" : "en";
  renderDesktopIcons();
  renderStartMenu();
  renderTaskbar();
  // window titlebars: <span class="win-ico">📊</span> Stats → translated label
  for (const a of APPS) {
    const el = winEl(a.id);
    if (!el) continue;
    const label = el.querySelector(".win-title .win-label");
    if (label) label.textContent = titleOf(a);
  }
}

/** Open the login panel; onSubmit(handle) fires when the player logs in. */
export function showLogin(onSubmit) {
  loginSubmitCb = onSubmit;
  els.login.classList.remove("hidden");
  if (els.loginError) els.loginError.style.display = "none";
  if (els.loginInput) {
    els.loginInput.value = "";
    setTimeout(() => els.loginInput.focus(), 30);
  }
}

export function hideLogin() {
  els.login.classList.add("hidden");
}

export function isLoginOpen() {
  return !els.login.classList.contains("hidden");
}

function submitLogin() {
  const raw = (els.loginInput.value || "").trim();
  if (!raw) {
    if (els.loginError) {
      els.loginError.textContent = els.loginError.dataset.msg || "Frank needs a name.";
      els.loginError.style.display = "block";
    }
    els.loginInput.focus();
    return;
  }
  hideLogin();
  if (loginSubmitCb) loginSubmitCb(raw.slice(0, 16));
}

function initLogin() {
  els.loginSubmit.addEventListener("click", submitLogin);
  els.loginInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submitLogin();
    }
  });
  els.loginRandom.addEventListener("click", () => {
    const pick = RANDOM_PSEUDOS[Math.floor(Math.random() * RANDOM_PSEUDOS.length)];
    els.loginInput.value = pick;
    els.loginInput.focus();
  });
  // lock screen click opens the login panel (main.js decides what happens next)
}

// ── Boot animation ─────────────────────────────────────────────────────────
const BOOT_STEPS = {
  en: [
    "loading kernel modules…",
    "mounting /dev/frank…",
    "starting snack-protocol.service…",
    "starting noro-chan.service…",
    "checking for crimes… none found (yet)",
    "welcome back, ",
  ],
  fr: [
    "chargement des modules du noyau…",
    "montage de /dev/frank…",
    "démarrage de snack-protocol.service…",
    "démarrage de noro-chan.service…",
    "vérification des crimes… aucun trouvé (pour l'instant)",
    "bon retour, ",
  ],
};

export function playBoot(name, onDone) {
  const steps = BOOT_STEPS[shellLang] || BOOT_STEPS.en;
  els.boot.classList.remove("hidden");
  els.bootFill.style.width = "0%";
  const total = 250; // the boot is a flash — never make the player wait
  const t0 = performance.now();
  const stepDur = total / steps.length;
  let step = 0;
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    clearInterval(iv);
    clearTimeout(fallback);
    els.boot.classList.add("hidden");
    onDone && onDone();
  };
  const iv = setInterval(() => {
    const elapsed = performance.now() - t0;
    const pct = Math.min(100, (elapsed / total) * 100);
    els.bootFill.style.width = `${pct}%`;
    const idx = Math.min(steps.length - 1, Math.floor(elapsed / stepDur));
    if (idx !== step) {
      step = idx;
      els.bootStatus.textContent = steps[step] + (step === steps.length - 1 ? name : "");
    }
    if (elapsed >= total) finish();
  }, 30);
  // hard fallback: the overlay can never stay visible longer than 600ms, no
  // matter what (a stuck interval or an exception must not block the game)
  const fallback = setTimeout(finish, 600);
}

// ── Window manager ─────────────────────────────────────────────────────────
function winEl(id) { return $(`win-${id}`); }

function renderTaskbar() {
  const open = APPS.filter((a) => state[a.id].open);
  els.taskbarApps.innerHTML = open
    .map((a) => `<button class="task-app ${state[a.id].minimized ? "" : "active"}" data-app="${a.id}" title="${titleOf(a)}">${a.icon} <span class="task-label">${titleOf(a)}</span></button>`)
    .join("");
  els.taskbarApps.querySelectorAll(".task-app").forEach((b) =>
    b.addEventListener("click", () => {
      const id = b.dataset.app;
      if (state[id].minimized) restoreApp(id);
      else minimizeApp(id);
    })
  );
}

function focusApp(id) {
  const el = winEl(id);
  zTop += 1;
  el.style.zIndex = zTop;
  els.windows.querySelectorAll(".os-window").forEach((w) => w.classList.remove("active"));
  el.classList.add("active");
}

export function openApp(id) {
  const app = APPS.find((a) => a.id === id);
  if (!app) return;
  state[id].open = true;
  state[id].minimized = false;
  const el = winEl(id);
  el.classList.add("open");
  el.classList.remove("minimized");
  focusApp(id);
  renderTaskbar();
  if (onOpenAppHook) onOpenAppHook(id);
}

export function closeApp(id) {
  if (id === "terminal") return;
  state[id].open = false;
  winEl(id).classList.remove("open");
  renderTaskbar();
}

function minimizeApp(id) {
  if (!state[id].open) return;
  state[id].minimized = true;
  winEl(id).classList.add("minimized");
  renderTaskbar();
}

function restoreApp(id) {
  state[id].minimized = false;
  winEl(id).classList.remove("minimized");
  focusApp(id);
  renderTaskbar();
}

// ── Desktop icons + start menu ─────────────────────────────────────────────
function openFromClick(id) {
  openApp(id);
  els.startMenu.hidden = true;
}

function renderDesktopIcons() {
  els.desktopIcons.innerHTML = APPS.map(
    (a) => `<div class="desk-icon" data-app="${a.id}" tabindex="0"><div class="desk-ico">${a.icon}</div><div class="desk-label">${titleOf(a)}</div></div>`
  ).join("");
  els.desktopIcons.querySelectorAll(".desk-icon").forEach((ic) => {
    const open = () => { openFromClick(ic.dataset.app); };
    ic.addEventListener("dblclick", open);
    ic.addEventListener("keydown", (e) => { if (e.key === "Enter") open(); });
    ic.addEventListener("click", () => {
      els.desktopIcons.querySelectorAll(".desk-icon").forEach((x) => x.classList.remove("sel"));
      ic.classList.add("sel");
    });
  });
}

function renderStartMenu() {
  els.startMenu.innerHTML = `<div class="start-head">FRANK<span class="brand-dot">OS</span> — ${shellLang === "fr" ? "démarrage" : "start"}</div>` +
    APPS.map((a) => `<button class="start-item" data-app="${a.id}">${a.icon} ${titleOf(a)}</button>`).join("");
  els.startMenu.querySelectorAll(".start-item").forEach((b) =>
    b.addEventListener("click", () => openFromClick(b.dataset.app))
  );
}

// ── Dragging ───────────────────────────────────────────────────────────────
function enableDrag(el) {
  const bar = el.querySelector(".win-titlebar");
  let sx = 0, sy = 0, ox = 0, oy = 0, dragging = false;
  bar.addEventListener("mousedown", (e) => {
    if (e.target.closest(".win-btn")) return;
    dragging = true;
    sx = e.clientX; sy = e.clientY;
    const r = el.getBoundingClientRect();
    ox = r.left; oy = r.top;
    el.style.left = `${r.left}px`;
    el.style.top = `${r.top}px`;
    el.style.margin = "0";
    focusApp(el.dataset.app);
    e.preventDefault();
  });
  document.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    el.style.left = `${Math.max(0, ox + dx)}px`;
    el.style.top = `${Math.max(0, oy + dy)}px`;
  });
  document.addEventListener("mouseup", () => { dragging = false; });
}

// ── Init ───────────────────────────────────────────────────────────────────
export function setupShell({ onLockClick, onOpenApp }) {
  onOpenAppHook = onOpenApp || null;
  // safety: the boot overlay must never be visible outside the boot flash
  // (a stale/cached index.html could otherwise leave it covering the screen)
  els.boot.classList.add("hidden");
  initLogin();
  renderDesktopIcons();
  renderStartMenu();
  renderTaskbar();
  APPS.forEach((a) => enableDrag(winEl(a.id)));

  els.windows.querySelectorAll(".os-window").forEach((w) => {
    w.addEventListener("mousedown", () => focusApp(w.dataset.app));
    w.querySelector(".win-min")?.addEventListener("click", () => minimizeApp(w.dataset.app));
    w.querySelector(".win-close")?.addEventListener("click", () => closeApp(w.dataset.app));
  });

  els.lock.addEventListener("click", () => {
    if (onLockClick) onLockClick();
  });

  els.startBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    els.startMenu.hidden = !els.startMenu.hidden;
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest("#start-menu") && !e.target.closest("#start-btn")) {
      els.startMenu.hidden = true;
    }
  });

  // open terminal by default (it's already .open in the markup)
  focusApp("terminal");
}

export { APPS };
