// ── Noro-chan mascot ───────────────────────────────────────────────────────
// She "pops out" of the screen: a small chibi sprite bottom-right with a
// speech bubble. Contextual lines on big moments, idle teasing otherwise.
// Clicking her opens the chat panel.

const mascot = document.getElementById("noro-mascot");
const body = document.getElementById("noro-body");
const bubble = document.getElementById("noro-bubble");

const LINES = {
  fr: {
    idle: [
      "ohh~ tu bosses ou tu fais semblant ?",
      "Frank ronronne. Moi j'observe~",
      "t'as vu les infos ? Non ? T'as rien vu du tout~",
      "je compte tes fautes de frappe. c'est mon hobby.",
      "un hack de plus et tu pourras t'acheter un vrai snack.",
      "tu me parles pas beaucoup, Dave~ ça fait mal.",
      "l'écran est fait pour être regardé. je te regarde~",
    ],
    level: "Lv.{n} ! Tu grandis si vite~ (moi je grandis pas, je suis un programme.)",
    arc: "ohh~ une HISTOIRE. j'adore les histoires. raconte-moi tout~",
    heat: "la chaleur monte, Dave~ tu veux un ventilateur ? moi j'aime bien te voir stresser.",
    combo: "🔥 ×{n} ! continue, je note tout. tout.",
    mission: "contrat livré~ t'es presque un employé modèle. du crime.",
    gift: "un cadeau ? pour QUI ? DÉTAILS. TOUT DE SUITE.",
    raid: "des gens frappent à la porte~ ouvre ou pas. moi je me cache sous Frank.",
    money: "ohh~ de l'ARGENT. tu vas tout dépenser en RGB, je le sens.",
  },
  en: {
    idle: [
      "ohh~ are you working or pretending?",
      "Frank is humming. I'm watching~",
      "seen the news? No? You've seen nothing~",
      "I'm counting your typos. It's my hobby.",
      "one more hack and you can buy a real snack.",
      "you don't talk to me much, Dave~ that hurts.",
      "screens are made to be watched. I'm watching you~",
    ],
    level: "Lv.{n}! Growing so fast~ (I don't grow. I'm a program.)",
    arc: "ohh~ a STORY. I love stories. Tell me everything~",
    heat: "heat's rising, Dave~ want a fan? I like watching you stress.",
    combo: "🔥 ×{n}! keep going, I'm writing everything down. everything.",
    mission: "contract delivered~ you're almost a model employee. of crime.",
    gift: "a gift? for WHO? DETAILS. NOW.",
    raid: "someone's knocking~ open or don't. I'm hiding under Frank.",
    money: "ohh~ MONEY. you're gonna blow it all on RGB, I can feel it.",
  },
};

let openChat = null;
let lang = "fr";
let lastLine = "";
let lastSeen = { level: 0, heatBand: -1, combo: 1, money: -1, arc: "", mission: -1 };
let shownAt = 0;
let idleTimer = null;

export function setupMascot(openChatFn) {
  openChat = openChatFn || (() => {});
  body.addEventListener("click", (e) => {
    e.stopPropagation();
    openChat();
  });
}

function say(text, hold = 4200) {
  if (!text || text === lastLine) return;
  lastLine = text;
  bubble.textContent = text;
  bubble.classList.remove("show");
  // reflow to restart the animation
  void bubble.offsetWidth;
  bubble.classList.add("show");
  shownAt = performance.now();
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => bubble.classList.remove("show"), hold);
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Called on every state push — reacts to big moments, then falls back to idle teasing. */
export function mascotReact(s) {
  if (!s || s.identified === false || s.powered === false) {
    mascot.classList.add("hidden");
    return;
  }
  mascot.classList.remove("hidden");
  lang = s.flags?.lang === "fr" ? "fr" : "en";
  const L = LINES[lang];
  const now = performance.now();

  // priority moments — one per state push, so they don't pile up
  const lvl = s.level || 1;
  if (lvl > lastSeen.level) {
    lastSeen.level = lvl;
    say(L.level.replace("{n}", lvl), 5000);
    return;
  }
  const heatBand = Math.round(s.heat || 0) >= 60 ? 1 : 0;
  if (heatBand && heatBand !== lastSeen.heatBand) {
    lastSeen.heatBand = heatBand;
    say(L.heat, 5000);
    return;
  }
  const combo = s.combo || 1;
  if (combo >= 3 && combo !== lastSeen.combo) {
    lastSeen.combo = combo;
    say(L.combo.replace("{n}", combo), 4200);
    return;
  }
  const missionCount = (s.career && s.career.missionsDone) || 0;
  if (missionCount > lastSeen.mission && missionCount > 0) {
    lastSeen.mission = missionCount;
    say(L.mission, 4200);
    return;
  }
  const arc = (s.arcs || []).filter((a) => a.status === "active").map((a) => a.id).join(",");
  if (arc && arc !== lastSeen.arc) {
    lastSeen.arc = arc;
    say(L.arc, 4200);
    return;
  }
  const money = Math.round(s.money || 0);
  if (money > lastSeen.money + 500) {
    lastSeen.money = money;
    say(L.money, 3800);
    return;
  }

  // idle teasing — every ~40s when nothing big is happening
  if (now - shownAt > 40000 && !bubble.classList.contains("show")) {
    say(pick(L.idle), 3800);
  }
}

/** Reset the one-shot trackers (used on fresh login / reset). */
export function resetMascot(s) {
  lastSeen = { level: s?.level || 1, heatBand: Math.round(s?.heat || 0) >= 60 ? 1 : 0, combo: s?.combo || 1, money: Math.round(s?.money || 0), arc: "", mission: (s?.career && s.career.missionsDone) || 0 };
}
