import { aiStatus, getShop } from "./api.js";

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Panel labels — bilingual like the rest of the game.
const L = (lang) => ({
  fr: {
    title: "Titre", money: "Argent", style: "Style", rep: "Rép.", heat: "Chaleur", clock: "Horloge",
    trophies: "trophées — 'achievements' dans le terminal",
    laylow: "🚨 Planqué jusqu'au Jour ${d} — aucun crime.",
    mining: "Minage", active: "actif", stopped: "arrêté",
    runningJobs: "travaux en cours", hardware: "Matériel", software: "Logiciels", skills: "Compétences",
    career: "Carrière", hacks: "hacks", missions: "missions", earned: "gagné", fav: "cible préf",
    arcs: "ARCS — histoires parallèles", done: "FAIT ✓", activeArc: "ACTIF", step: "étape",
    active: "ACTIVES", available: "DISPONIBLES", history: "HISTORIQUE",
    deliver: "livrer ➤", accept: "accepter ➤",
    noMissions: "Aucune mission pour l'instant. Monte ta réputation !",
    noPeople: "Personne pour l'instant. Pirate des réseaux pour déterrer des secrets.",
    dossiers: "DOSSIERS", soldTo: "vendu à The Daily Leak", sellDossier: "vendre le dossier ➤",
    noNews: "Aucun titre pour l'instant. Le monde est étrangement calme.",
    noInv: "Frank est un stock. Frank est triste.", noSoft: "aucun logiciel",
    shopHint: "Améliore avec <b>buy</b> dans le terminal, ou visite le faux Tor pour des programmes : <b>tor</b>.",
    commands: "COMMANDES", helpTip: "Clique sur une commande pour la remplir dans le terminal. Tape <b>help &lt;cmd&gt;</b> pour les détails. Tab complète automatiquement.",
    sTheme: "Thème", sFont: "Taille de police", sAnim: "Animations", sSound: "Sons", sVolume: "Volume", sAmbient: "Bruit ambiant", sLang: "Langue", sWall: "Fond d'écran", wallUpload: "ou importe une image locale", saved: "✓ réglages enregistrés",
    wallReqRep: "Rép. {n} requis", wallReqHat: "Alignement Black Hat requis", wallReqDrip: "Drip rang 4+ ou Gold-Plated Frank requis", wallReqPrestige: "Prestige {n}+ requis", wallBig: "Image trop lourde (max 1,5 Mo) — le disque de Frank est déjà assez lent.",
    hat: "Alignement (0 white · 50 gray · 100 black)",
    aiName: "Nom de l'assistante IA", aiPrompt: "Prompt de l'assistante IA (éditable)", server: "Serveur (LM Studio)", urlPort: "URL + port — ex. http://127.0.0.1:3007",
    dangerZone: "Zone dangereuse", dangerText: "Efface cette sauvegarde et repars de zéro. Frank se souviendra. (Garde la langue et les préférences.)", resetSave: "☠ reset la sauvegarde", applySettings: "appliquer les réglages ➤", testConn: "tester la connexion ➤",
    statusOnline: (u) => `statut : EN LIGNE ✓ (${u})`, statusOffline: (u) => `statut : HORS LIGNE ✗ (${u})`, statusUnknown: "statut : inconnu", checking: "vérification…",
  },
  en: {
    title: "title", money: "money", style: "style", rep: "rep", heat: "heat", clock: "clock",
    trophies: "trophies — 'achievements' in the terminal",
    laylow: "🚨 Laying low until Day ${d} — no crime.",
    mining: "mining", active: "active", stopped: "stopped",
    runningJobs: "running jobs", hardware: "hardware", software: "software", skills: "skills",
    career: "career", hacks: "hacks", missions: "missions", earned: "earned", fav: "fav",
    arcs: "ARCS — optional stories", done: "DONE ✓", activeArc: "ACTIVE", step: "step",
    active: "ACTIVE", available: "AVAILABLE", history: "HISTORY",
    deliver: "deliver ➤", accept: "accept ➤",
    noMissions: "No missions right now. Raise your rep!",
    noPeople: "Nobody yet. Hack networks to dig up dirt on people.",
    dossiers: "DOSSIERS", soldTo: "sold to The Daily Leak", sellDossier: "sell dossier ➤",
    noNews: "No headlines yet. The world is suspiciously quiet.",
    noInv: "Frank is stock. Frank is sad.", noSoft: "no software",
    shopHint: "Upgrade with <b>buy</b> in the terminal, or visit the fake Tor for programs: <b>tor</b>.",
    commands: "COMMANDS", helpTip: "Click a command to fill the terminal. Type <b>help &lt;cmd&gt;</b> for details. Tab autocompletes.",
    sTheme: "theme", sFont: "font size", sAnim: "animations", sSound: "sound", sVolume: "volume", sAmbient: "ambient hum", sLang: "language", sWall: "wallpaper", wallUpload: "or import a local image", saved: "✓ settings saved",
    wallReqRep: "rep {n} required", wallReqHat: "Black Hat alignment required", wallReqDrip: "style rank 4+ or Gold-Plated Frank required", wallReqPrestige: "prestige {n}+ required", wallBig: "Image too heavy (max 1.5MB) — Frank's disk is slow enough already.",
    hat: "Alignment (0 white · 50 gray · 100 black)",
    aiName: "AI assistant name", aiPrompt: "AI assistant prompt (editable)", server: "server (LM Studio)", urlPort: "URL + port — e.g. http://127.0.0.1:3007",
    dangerZone: "danger zone", dangerText: "Wipe this save and start from zero. Frank will remember. (Keeps language & preferences.)", resetSave: "☠ reset save", applySettings: "apply settings ➤", testConn: "test connection ➤",
    statusOnline: (u) => `status: ONLINE ✓ (${u})`, statusOffline: (u) => `status: OFFLINE ✗ (${u})`, statusUnknown: "status: unknown", checking: "checking…",
  },
})[lang === "fr" ? "fr" : "en"];

// ── Wallpapers ────────────────────────────────────────────────────────────
// Story-progressive: each one unlocks as your legend grows (rep, hat, drip,
// prestige). `custom` is always available.
export const WALLS = [
  { id: "matrix", en: "Matrix rain", fr: "Pluie Matrix", req: null },
  { id: "circuit", en: "Circuit board", fr: "Circuit imprimé", req: (s) => s.rep >= 10, reqL: (L_) => L_.wallReqRep.replace("{n}", 10) },
  { id: "deepnet", en: "Deepnet nodes", fr: "Nœuds du deepnet", req: (s) => s.rep >= 20 || (s.prestige || 0) >= 1, reqL: (L_) => `${L_.wallReqRep.replace("{n}", 20)} / ${L_.wallReqPrestige.replace("{n}", 1)}` },
  { id: "nightcity", en: "Night city", fr: "Ville de nuit", req: (s) => (s.morality ?? 25) >= 67 || (s.prestige || 0) >= 2, reqL: (L_) => `${L_.wallReqHat} / ${L_.wallReqPrestige.replace("{n}", 2)}` },
  { id: "gold", en: "Gold drip", fr: "Drip doré", req: (s) => ((s.flags?.bling) || []).includes("gold") || (s.styleRank || 0) >= 4, reqL: (L_) => L_.wallReqDrip },
  { id: "custom", en: "Custom — your own", fr: "Personnalisé — le tien", req: null },
];

export function unlockedWalls(s) {
  return WALLS.filter((w) => !w.req || w.req(s)).map((w) => w.id);
}

export function wallpaperList(state) {
  const L_ = L(state.flags?.lang);
  return WALLS.map((w) => ({
    id: w.id,
    label: state.flags?.lang === "fr" ? w.fr : w.en,
    locked: !!(w.req && !w.req(state)),
    reqLabel: w.req && !w.req(state) ? w.reqL(L_) : "",
  }));
}

function card(inner) {
  return `<div class="panel-card">${inner}</div>`;
}
function kv(k, v) {
  return `<div class="k">${esc(k)}</div><div class="v">${v}</div>`;
}
function money(n) {
  const v = Math.abs(n) >= 1000 ? n.toFixed(0) : n.toFixed(2);
  const [i, d] = v.split(".");
  const ic = i.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `$${ic}${d ? "." + d : ""}`;
}

export function renderStats(state, actions) {
  const el = document.getElementById("panel-stats");
  const L_ = L(state.flags?.lang);
  const heatPct = Math.min(100, state.heat);
  const repPct = Math.min(100, state.rep);
  const heatColor = state.heat >= 60 ? "#ef4444" : state.heat >= 35 ? "#eab308" : "#22c55e";
  const xp = state.xp ?? state.flags?.xp ?? 0;
  const lvl = Math.min(20, state.level ?? Math.floor(Math.sqrt(xp / 100)) + 1);
  const into = xp - Math.pow(lvl - 1, 2) * 100;
  const span = Math.pow(lvl, 2) * 100 - Math.pow(lvl - 1, 2) * 100;
  const xpPct = lvl >= 20 ? 100 : Math.min(100, Math.round((into / span) * 100));
  const achGot = (state.achievements || []).length;
  const achTotal = state.achTotal ?? 25; // total from the server catalogue
  el.innerHTML =
    (state.pendingChoice
      ? `<div class="panel-card" style="border-color:var(--term-warn);background:#171105">
           <div class="k" style="color:var(--term-warn)">BRANCHING POINT</div>
           <div class="v" style="font-size:.72rem">${state.flags?.lang === "fr" ? "Trois factions te veulent. Choisis :" : "Three factions want you. Choose:"}</div>
           <div class="d-flex gap-2 mt-2">
             <button class="btn-term" data-cmd="choose a">a) NullSec</button>
             <button class="btn-term" data-cmd="choose b">b) Syndicate</button>
             <button class="btn-term" data-cmd="choose c">c) Solo</button>
           </div>
         </div>`
      : "") +
    card(kv(L_.title, `<span class="big-stat">${esc(state.title)}</span>`)) +
    `<div class="panel-card">
       <div class="row text-center">
         <div class="col-6"><div class="k">${L_.money}</div><div class="v big-stat" style="color:#fbbf24">${money(state.money)}</div></div>
         <div class="col-6"><div class="k">${L_.style}</div><div class="v big-stat" style="color:#c084fc">${state.style}</div><div class="v" style="font-size:.62rem;color:#c084fc">✦ ${esc(state.styleTitle || "No Drip")}</div></div>
         <div class="col-6 mt-2"><div class="k">${L_.rep}</div><div class="v">${state.rep} / 100</div>
           <div class="pbar"><div style="width:${repPct}%"></div></div></div>
         <div class="col-6 mt-2"><div class="k">${L_.heat}</div><div class="v" style="color:${heatColor}">${state.heat} / 100</div>
           <div class="pbar"><div style="width:${heatPct}%;background:${heatColor}"></div></div></div>
       </div>
     </div>` +
    card(kv(L_.hat, `<span style="color:${(state.morality ?? 25) >= 67 ? "#ef4444" : (state.morality ?? 25) <= 33 ? "#e0e7ff" : "#a1a1aa"}">${esc(state.hat || "gray")} · ${Math.round(state.morality ?? 25)}/100</span>`)) +
    card(kv(L_.clock, esc(state.clock))) +
    (() => {
      return `<div class="panel-card"><div class="k">Lv.${lvl} · ${xp} XP ${lvl < 20 ? `(${into}/${span})` : "(MAX)"}</div>` +
        `<div class="pbar"><div style="width:${xpPct}%"></div></div>` +
        `<div class="v" style="font-size:.72rem;color:var(--term-dim)">🏆 ${achGot}/${achTotal} ${L_.trophies}</div></div>`;
    })() +
    (state.laylow > 0 ? card(`<span style="color:#ef4444">${L_.laylow.replace("${d}", state.laylow)}</span>`) : "") +
    card(kv(L_.mining, `${state.mining.active ? "⛏ " + L_.active : L_.stopped} · ${money(state.mining.rate)}/hr`)) +
    card(kv("PUPPYCOIN", `${state.puppy.owned.toFixed(2)} coins @ ${money(state.puppy.price)} = ${money(state.puppy.owned * state.puppy.price)}`)) +
    (state.jobs.length
      ? `<div class="panel-card"><div class="k">${L_.runningJobs}</div>${state.jobs
          .map(
            (j) =>
              `<div class="v mt-1" style="font-size:.75rem">${esc(j.label)}<div class="pbar"><div style="width:${Math.round(((j.total - j.remaining) / j.total) * 100)}%"></div></div></div>`
          )
          .join("")}</div>`
      : "") +
    (state.inventory.length
      ? `<div class="panel-card"><div class="k">${L_.hardware}</div>${state.inventory.map((i) => `<div class="v" style="font-size:.78rem">▸ ${esc(i)}</div>`).join("")}</div>`
      : "") +
    (state.exploits.length
      ? `<div class="panel-card"><div class="k">${L_.software}</div>${state.exploits.map((e) => `<div class="v" style="font-size:.78rem">▸ ${esc(e)}</div>`).join("")}</div>`
      : "") +
    (state.skills && (state.skills.sql || state.skills.social || state.skills.zero)
      ? `<div class="panel-card"><div class="k">${L_.skills}</div>${["sql", "social", "zero"]
          .map((s) =>
            state.skills[s]
              ? `<div class="v" style="font-size:.75rem">${s} Lv.${state.skills[s]} <span style="color:var(--term-dim)">${state.skills[s] >= 10 ? "MAX" : "█".repeat(state.skills[s])}</span></div>`
              : ""
          )
          .join("")}</div>`
      : "") +
    (state.faction?.branch
      ? `<div class="panel-card"><div class="k">faction · ${esc(state.faction.branch)}</div>${Object.entries(state.faction.rep || {})
          .filter(([, v]) => v > 0)
          .map(([b, v]) => `<div class="v" style="font-size:.75rem">${esc(b)}: ${v}</div>`)
          .join("")}</div>`
      : "") +
    (state.career && (state.career.hacksDone || state.career.missionsDone)
      ? `<div class="panel-card"><div class="k">${L_.career}</div>` +
        `<div class="v" style="font-size:.75rem">${L_.hacks} ${state.career.hacksDone || 0} · ${L_.missions} ${state.career.missionsDone || 0}</div>` +
        `<div class="v" style="font-size:.75rem">${L_.earned} ${money(state.career.moneyEarned || 0)}</div>` +
        (state.career.favTarget ? `<div class="v" style="font-size:.75rem">${L_.fav}: ${esc(state.career.favTarget)}</div>` : "") +
        `</div>`
      : "");
}

export function renderMissions(state, actions) {
  const el = document.getElementById("panel-missions");
  const L_ = L(state.flags?.lang);
  const offered = state.missions.filter((m) => m.status === "offered");
  const active = state.missions.filter((m) => m.status === "active");
  const done = state.missions.filter((m) => m.status === "done" || m.status === "failed");
  let html = "";
  if (state.arcs?.length) {
    html += `<h6>${L_.arcs}</h6>` + state.arcs
      .map(
        (a) =>
          card(
            `<div class="v" style="color:#c084fc">${esc(a.title)} <span class="k">· ${a.status === "done" ? L_.done : L_.activeArc}</span></div>` +
              (a.steps.length
                ? `<div class="v mt-1" style="font-size:.7rem;color:var(--term-dim)">${a.steps.map((s) => "▸ " + esc(s)).join("<br/>")}</div>`
                : "") +
              (a.status === "active" ? `<div class="k mt-1">${L_.step} ${a.step} / ${a.total}</div>` : "")
          )
      )
      .join("");
  }
  if (active.length) {
    html += `<h6>${L_.active}</h6>${active
      .map(
        (m) =>
          card(
            `<div class="v" style="color:#c084fc">#${m.id} · ${esc(m.title)}</div>` +
              (m.deadline ? `<div class="k mt-1">deadline · day ${m.deadline}</div>` : "") +
              (m.steps?.length ? `<div class="v mt-1" style="font-size:.7rem;color:var(--term-dim)">${m.steps.map((s) => "▸ " + esc(s)).join("<br/>")}</div>` : "") +
              `<button class="btn-term mt-2" data-cmd="missions deliver ${m.id}">${L_.deliver}</button>`
          )
      )
      .join("")}`;
  }
  if (offered.length) {
    html += `<h6>${L_.available}</h6>${offered
      .map(
        (m) =>
          card(
            `<div class="v">#${m.id} · ${esc(m.title)}</div>` +
              `<button class="btn-term mt-2" data-cmd="missions accept ${m.id}">${L_.accept}</button>`
          )
      )
      .join("")}`;
  }
  if (!active.length && !offered.length) html += `<div class="panel-card"><div class="v" style="color:var(--term-dim)">${L_.noMissions}</div></div>`;
  if (done.length) {
    html += `<h6>${L_.history} (${done.length})</h6>${done
      .slice(-8)
      .reverse()
      .map((m) => `<div class="v" style="font-size:.72rem;color:var(--term-dim)">#${m.id} ${esc(m.title)} — ${m.status}</div>`)
      .join("")}`;
  }
  el.innerHTML = html;
  bindButtons(el, actions);
}

let shopFetchId = 0;

export async function renderShop(state, actions) {
  const el = document.getElementById("panel-shop");
  const id = ++shopFetchId;
  let data;
  try {
    data = await getShop();
  } catch {
    return;
  }
  if (id !== shopFetchId) return; // stale — a newer fetch is in flight
  const items = data.shop || [];
  const lang = state.flags?.lang || "en";
  const groupLabel = (slot) =>
    ({
      cpu: lang === "fr" ? "CPU (vitesse de hack)" : "CPU (hack speed)",
      gpu: lang === "fr" ? "GPU (minage)" : "GPU (mining)",
      ram: lang === "fr" ? "RAM (hacks parallèles)" : "RAM (parallel hacks)",
      vpn: lang === "fr" ? "VPN (réduction de chaleur)" : "VPN (heat reduction)",
      vps: "VPS",
      botnet: "Botnet",
      exploit: lang === "fr" ? "Logiciels" : "Software",
      misc: lang === "fr" ? "Style de vie" : "Lifestyle",
    })[slot];
  const order = ["cpu", "gpu", "ram", "vpn", "vps", "botnet", "exploit", "misc"];
  let html = "";
  for (const slot of order) {
    const group = items.filter((i) => i.slot === slot);
    if (!group.length) continue;
    html += `<h6>${esc(groupLabel(slot))}</h6>`;
    html += group
      .map((i) => {
        const btn = i.owned
          ? `<div class="k mt-1" style="color:#22c55e">✓ owned</div>`
          : !i.repOk
            ? `<button class="btn-term mt-2" disabled style="opacity:.45" title="rep ${i.requiresRep} required">rep ${i.requiresRep} ➤</button>`
            : `<button class="btn-term mt-2" data-cmd="buy ${i.id}" ${i.canAfford ? "" : "disabled"} style="${i.canAfford ? "" : "opacity:.45"}">${i.canAfford ? "buy ➤" : "need " + money(i.price)}</button>`;
        return card(
          `<div class="v">${esc(i.name)} <span class="k" style="color:#fbbf24">${money(i.price)}</span></div>` +
            `<div class="v mt-1" style="font-size:.7rem;color:var(--term-dim)">${esc(i.desc)}</div>` +
            (i.effect ? `<div class="v mt-1" style="font-size:.7rem;color:#22c55e">→ ${esc(i.effect)}</div>` : "") +
            btn
        );
      })
      .join("");
  }
  el.innerHTML = html;
  bindButtons(el, actions);
}

export function renderInv(state) {
  const el = document.getElementById("panel-inv");
  const L_ = L(state.flags?.lang);
  const items = state.inventory.length
    ? state.inventory.map((i) => `<div class="v">▸ ${esc(i)}</div>`).join("")
    : `<div class="v" style="color:var(--term-dim)">${L_.noInv}</div>`;
  const sw = state.exploits.length
    ? state.exploits.map((e) => `<div class="v">▸ ${esc(e)}</div>`).join("")
    : `<div class="v" style="color:var(--term-dim)">${L_.noSoft}</div>`;
  el.innerHTML = card(kv(L_.hardware, items)) + card(kv(L_.software, sw)) +
    `<div class="panel-card"><div class="k">shop</div><div class="v mt-1">${L_.shopHint}</div></div>`;
}

export function renderPeople(state, actions) {
  const el = document.getElementById("panel-people");
  const L_ = L(state.flags?.lang);
  if (!state.contacts.length) {
    el.innerHTML = `<div class="panel-card"><div class="v" style="color:var(--term-dim)">${L_.noPeople}</div></div>`;
    return;
  }
  el.innerHTML =
    `<h6>${L_.dossiers}</h6>` +
    state.contacts
      .map((c) => {
        const frag = "●".repeat(c.fragments) + "○".repeat(Math.max(0, 3 - c.fragments));
        const btn =
          c.sold
            ? `<div class="k mt-1" style="color:#22c55e">${L_.soldTo}</div>`
            : c.fragments >= 3
              ? `<button class="btn-term mt-2" data-cmd="sell ${c.id}">${L_.sellDossier}</button>`
              : `<div class="k mt-1">${frag} — hack ${esc(c.employer || "their employer")}</div>`;
        return card(`<div class="v">${esc(c.name)} <span class="k">· ${esc(c.role)}</span></div><div class="v" style="font-size:.75rem">${frag}</div>${btn}`);
      })
      .join("");
  bindButtons(el, actions);
}

export function renderNews(state) {
  const el = document.getElementById("panel-news");
  const L_ = L(state.flags?.lang);
  if (!state.news.length) {
    el.innerHTML = `<div class="panel-card"><div class="v" style="color:var(--term-dim)">${L_.noNews}</div></div>`;
    return;
  }
  el.innerHTML =
    `<h6>THE DAILY LEAK</h6>` +
    state.news
      .slice()
      .reverse()
      .map((n) => `<div class="news-item"><div class="when">${esc(n.when)}</div><div class="head">${esc(n.headline)}</div>${n.body ? `<div class="body">${esc(n.body)}</div>` : ""}</div>`)
      .join("");
}

export function renderHelp(commands, actions, state) {
  const el = document.getElementById("panel-help");
  const L_ = L(state?.flags?.lang);
  el.innerHTML =
    `<h6>${L_.commands}</h6>` +
    commands.map((c) => `<div class="cmd-row" data-cmd="${esc(c.name)}"><span class="u">${esc(c.usage)}</span><span class="h">${esc(c.help)}</span></div>`).join("") +
    `<div class="panel-card mt-2"><div class="v" style="font-size:.72rem;color:var(--term-dim)">${L_.helpTip}</div></div>`;
  bindButtons(el, actions);
}

export function renderSettings(state, actions) {
  const el = document.getElementById("panel-settings");
  const s = state.settings;
  const L_ = L(state.flags?.lang);
  const onOff = (v) => (v ? "on" : "off");

  // auto-save rebuilds this panel on every change — never nuke what the
  // player is typing. Keep the live values + caret of the text fields, and
  // restore them (and focus) after the re-render.
  const keep = {};
  const focusEl = document.activeElement;
  const focusId = focusEl?.id || "";
  const focusPos = focusEl && typeof focusEl.selectionStart === "number" ? focusEl.selectionStart : -1;
  for (const id of ["set-ainame", "set-aiprompt", "set-aiurl", "set-wallurl"]) {
    const n = el.querySelector("#" + id);
    if (n) keep[id] = n.value;
  }
  // read the live panel values — used by auto-save AND the manual button
  const collect = () => ({
    theme: el.querySelector("#set-theme").value,
    fontsize: el.querySelector("#set-font").value,
    anim: el.querySelector("#set-anim").value,
    sound: el.querySelector("#set-sound").value,
    sndvol: (Number(el.querySelector("#set-vol").value) || 50) / 100,
    ambient: el.querySelector("#set-amb").value === "on",
    lang: el.querySelector("#set-lang").value,
    wallpaper: el.querySelector("#set-wall").value,
    wallpaperUrl: el.querySelector("#set-wallurl")?.value.trim() || "",
    ainame: el.querySelector("#set-ainame").value,
    aiprompt: el.querySelector("#set-aiprompt").value,
    aiurl: el.querySelector("#set-aiurl").value.trim() || "http://127.0.0.1:3007",
  });
  const notify = () => window.dispatchEvent(new CustomEvent("game-toast", { detail: L_.saved }));

  el.innerHTML =
    `<div class="setting-row"><label for="set-theme">${L_.sTheme}</label><select id="set-theme" class="form-select form-select-sm" style="width:auto">${["green", "amber", "blue", "matrix", "purple"]
      .map((t) => `<option value="${t}" ${s.theme === t ? "selected" : ""}>${t}</option>`)
      .join("")}</select></div>` +
    `<div class="setting-row"><label for="set-font">${L_.sFont}</label><select id="set-font" class="form-select form-select-sm" style="width:auto">${["sm", "md", "lg"]
      .map((t) => `<option value="${t}" ${s.fontsize === t ? "selected" : ""}>${t}</option>`)
      .join("")}</select></div>` +
    `<div class="setting-row"><label for="set-anim">${L_.sAnim}</label><select id="set-anim" class="form-select form-select-sm" style="width:auto">${["on", "off"]
      .map((t) => `<option value="${t}" ${onOff(s.anim) === t ? "selected" : ""}>${t}</option>`)
      .join("")}</select></div>` +
    `<div class="setting-row"><label for="set-sound">${L_.sSound}</label><select id="set-sound" class="form-select form-select-sm" style="width:auto">${["on", "off"]
      .map((t) => `<option value="${t}" ${onOff(s.sound) === t ? "selected" : ""}>${t}</option>`)
      .join("")}</select></div>` +
    `<div class="setting-row"><label for="set-vol">${L_.sVolume}</label><input id="set-vol" type="range" min="0" max="100" value="${Math.round((Number(state.flags.sndvol) || 0.5) * 100)}" class="form-range" style="width:120px" /></div>` +
    `<div class="setting-row"><label for="set-amb">${L_.sAmbient}</label><select id="set-amb" class="form-select form-select-sm" style="width:auto">${["off", "on"]
      .map((t) => `<option value="${t}" ${onOff(state.flags.ambient) === t ? "selected" : ""}>${t}</option>`)
      .join("")}</select></div>` +
    `<div class="setting-row"><label for="set-lang">${L_.sLang}</label><select id="set-lang" class="form-select form-select-sm" style="width:auto">${["en", "fr"]
      .map((t) => `<option value="${t}" ${(state.flags.lang || "en") === t ? "selected" : ""}>${t}</option>`)
      .join("")}</select></div>` +
    (() => {
      const walls = wallpaperList(state);
      const cur = s.wallpaper || "matrix";
      return `<div class="setting-row"><label for="set-wall">${L_.sWall}</label><select id="set-wall" class="form-select form-select-sm" style="width:auto">${walls
        .map((w) => `<option value="${w.id}" ${cur === w.id ? "selected" : ""} ${w.locked ? "disabled" : ""} title="${esc(w.reqLabel)}">${esc(w.label)}${w.locked ? " 🔒" : ""}</option>`)
        .join("")}</select></div>` +
        `<div class="setting-row wall-custom-row" style="${cur === "custom" ? "" : "display:none"}"><div class="k">URL</div><input id="set-wallurl" class="form-control form-control-sm mt-1" value="${esc(state.flags.wallpaperUrl || "")}" placeholder="https://…" /></div>` +
        `<div class="setting-row wall-custom-row" style="${cur === "custom" ? "" : "display:none"}"><label>${L_.wallUpload}</label><input type="file" id="set-wallfile" accept="image/*" class="form-control form-control-sm" style="width:190px" /></div>`;
    })() +
    `<div class="panel-card mt-2"><div class="k">${L_.aiName}</div><input id="set-ainame" class="form-control form-control-sm mt-1" value="${esc(state.flags.ainame || "Noro-chan")}" /></div>` +
    `<div class="panel-card"><div class="k">${L_.aiPrompt}</div><textarea id="set-aiprompt" class="form-control form-control-sm mt-1 ai-prompt">${esc(
      state.flags.aiprompt || state.flags.aiDefaultPrompt || ""
    )}</textarea>` +
    `<div class="v mt-1" style="font-size:.68rem;color:var(--term-dim)">${state.flags.aiprompt ? "" : state.flags?.lang === "fr" ? "Prompt par défaut — modifie-le pour changer la personnalité de l'IA." : "Default prompt — edit it to change the AI's personality."}</div></div>` +
    `<div class="panel-card"><div class="k">${L_.server}</div><div class="v mt-1" style="font-size:.72rem">${L_.urlPort}</div><input id="set-aiurl" class="form-control form-control-sm mt-1" value="${esc(state.flags.aiurl || "http://127.0.0.1:3007")}" placeholder="http://127.0.0.1:3007" /><div class="v mt-1" style="font-size:.72rem" id="ai-status">${L_.statusUnknown}</div><button class="btn-term mt-2" id="test-ai">${L_.testConn}</button></div>` +
    `<div class="panel-card danger-zone"><div class="k">${L_.dangerZone}</div><div class="v mt-1" style="font-size:.75rem">${L_.dangerText}</div><button class="btn-term btn-danger mt-2" id="reset-game">${L_.resetSave}</button></div>` +
    `<button class="btn-term mt-2" id="save-settings">${L_.applySettings}</button>`;
  // restore what was being typed (and where the caret was)
  for (const [id, v] of Object.entries(keep)) {
    const n = el.querySelector("#" + id);
    if (n) n.value = v;
  }
  const back = focusId ? el.querySelector("#" + focusId) : null;
  if (back && back.type !== "file" && !["BUTTON"].includes(back.tagName)) {
    back.focus();
    if (focusPos >= 0 && typeof back.setSelectionRange === "function") back.setSelectionRange(focusPos, focusPos);
  }

  // ── auto-save on click/change — no more "apply" needed ──
  const save = () => { actions.setSettings(collect()); notify(); };
  el.querySelectorAll("select, input, textarea").forEach((n) => {
    if (n.type === "file") return; // the upload handler does its own thing
    n.addEventListener("change", save); // selects + text fields (on blur)
  });
  // text fields also save on Enter (single-line) / Ctrl+Enter (textarea)
  el.querySelectorAll("input[type=text], input:not([type]), textarea").forEach((n) => {
    if (n.type === "file") return;
    n.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && (n.tagName === "TEXTAREA" ? e.ctrlKey || e.metaKey : true)) {
        e.preventDefault();
        n.blur(); // fires 'change' → save
      }
    });
  });
  const wallSel = el.querySelector("#set-wall");
  const toggleWallRows = () => {
    const show = wallSel.value === "custom";
    el.querySelectorAll(".wall-custom-row").forEach((r) => (r.style.display = show ? "" : "none"));
  };
  wallSel.addEventListener("change", toggleWallRows);
  const wallFile = el.querySelector("#set-wallfile");
  if (wallFile) wallFile.addEventListener("change", () => {
    const f = wallFile.files?.[0];
    if (!f) return;
    if (f.size > 1.5 * 1024 * 1024) {
      alert(L_.wallBig);
      wallFile.value = "";
      return;
    }
    const rd = new FileReader();
    rd.onload = () => {
      actions.setSettings({ wallpaper: "custom" });
      actions.applyLocalWall(String(rd.result));
    };
    rd.readAsDataURL(f);
  });
  const statusEl = el.querySelector("#ai-status");
  el.querySelector("#test-ai").addEventListener("click", async () => {
    statusEl.textContent = L_.checking;
    const url = el.querySelector("#set-aiurl").value.trim() || "http://127.0.0.1:3007";
    try {
      const d = await aiStatus(url);
      statusEl.textContent = d.online ? L_.statusOnline(url) : L_.statusOffline(url);
    } catch {
      statusEl.textContent = L_.statusOffline(url);
    }
  });
  el.querySelector("#save-settings").addEventListener("click", () => save());
  el.querySelector("#reset-game").addEventListener("click", () => {
    if (confirm(state.flags?.lang === "fr" ? "Réinitialiser la sauvegarde ? Tout sera effacé. Frank se souviendra." : "Reset the save? Everything will be wiped. Frank will remember.")) {
      actions.runCommand("reset");
    }
  });
}


function bindButtons(root, actions) {
  root.querySelectorAll("[data-cmd]").forEach((b) => {
    b.addEventListener("click", () => actions.runCommand(b.dataset.cmd));
  });
}
