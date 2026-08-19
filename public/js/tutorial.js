// ── Guided tutorial overlay ────────────────────────────────────────────────
// Shows once after the player identifies (forced, but skippable). The panel
// follows the scripted Noro-chan chain (server-side tutorialStep / first* flags)
// and can be re-opened any time from Settings or `tutorial start`.

const $ = (id) => document.getElementById(id);

// Bilingual strings — the panel follows the game language.
const TUT = {
  fr: {
    title: "TUTORIEL",
    step: (n, t) => `${n}/${t}`,
    text: [
      "Bienvenue sur ton nouveau job, {name}~ Tu as 15 $, une rancune et un ordinateur nommé Frank. Tape <b>scan</b> pour voir ce qui traîne dehors. Frank te fait confiance. Moi… je surveille~",
      "Des cibles ! Choisis-en une et tape <b>hack &lt;cible&gt;</b> — puis un vecteur : brute, exploit ou social. Si quelque chose se déclenche : <b>hack push</b>, <b>cover</b> ou <b>abort</b>.",
      "Bien joué~ maintenant le vrai argent : tape <b>missions</b> et accepte-en une avec <b>missions accept &lt;id&gt;</b>.",
      "Hacke la cible de ta mission, puis livre avec <b>missions deliver &lt;id&gt;</b>. Les échéances sont réelles, Dave~ surtout réelles.",
      "Et voilà, t'es un (faux) hacker~ scan, hack, livre, améliore, recommence. Ouvre l'onglet Boutique ou tape <b>shop</b> pour améliorer ton setup.",
    ],
    run: "➤ fais-le",
    skip: "passer le tuto",
    closeTitle: "fermer",
    done: "✓ tuto terminé — tape tutorial pour le guide complet",
  },
  en: {
    title: "TUTORIAL",
    step: (n, t) => `${n}/${t}`,
    text: [
      "Welcome to your new gig, {name}~ You have $15, a grudge, and a laptop named Frank. Type <b>scan</b> to see what's out there. Frank trusts you. Me… I'm watching~",
      "Targets! Pick one and type <b>hack &lt;target&gt;</b> — then a vector: brute, exploit or social. If something trips: <b>hack push</b>, <b>cover</b> or <b>abort</b>.",
      "Nice~ now the real money: type <b>missions</b> and accept one with <b>missions accept &lt;id&gt;</b>.",
      "Hack your mission's target, then deliver with <b>missions deliver &lt;id&gt;</b>. Deadlines are real, Dave~ mostly real.",
      "And that's it, you're a (fake) hacker~ scan, hack, deliver, upgrade, repeat. Open the Shop tab or type <b>shop</b> to upgrade your rig.",
    ],
    run: "➤ do it",
    skip: "skip tutorial",
    closeTitle: "close",
    done: "✓ tutorial done — type tutorial for the full guide",
  },
};

let onRun = null; // callback (cmd) => void, wired by main.js
let stepShown = -1; // last step rendered (avoid re-triggering on every state push)

export function wireTutorial(runCb) {
  onRun = runCb;
  $("tuto-close").addEventListener("click", () => hideTutorial());
  $("tuto-skip").addEventListener("click", () => {
    if (onRun) onRun("tutorial skip");
    hideTutorial();
  });
  $("tuto-run").addEventListener("click", () => {
    if (onRun) onRun(runCmdForStep(currentStep()));
  });
}

export function showTutorial() {
  const p = $("tutorial-panel");
  if (p) p.classList.remove("hidden");
  stepShown = -1; // force a re-render
}

export function hideTutorial() {
  const p = $("tutorial-panel");
  if (p) p.classList.add("hidden");
}

export function isTutorialOpen() {
  const p = $("tutorial-panel");
  return p && !p.classList.contains("hidden");
}

// 0 = scan, 1 = hack, 2 = missions, 3 = deliver, 4 = done
function currentStep() {
  const t = (window.__tutorialState) || { step: 0 };
  const s = Math.min(t.total || 5, Math.max(0, Math.round(t.step || 0)));
  // clamp: if the server says done, show the last step
  return t.done ? 4 : s;
}

function runCmdForStep(step) {
  return step === 0 ? "scan" : step === 1 ? "scan" : step === 2 ? "missions" : step === 3 ? "missions" : "";
}

/** Called by main.js on every state push — updates the panel if open. */
export function updateTutorial(state) {
  if (!state || !state.tutorial) return;
  window.__tutorialState = state.tutorial;
  const lang = state.flags?.lang === "fr" ? "fr" : "en";
  const L = TUT[lang];
  const t = state.tutorial;
  const step = t.done ? 4 : Math.min(4, Math.max(0, Math.round(t.step || 0)));
  const isOpen = isTutorialOpen();

  $("tuto-title").textContent = L.title;
  $("tuto-step").textContent = L.step(step + 1, 5);
  $("tuto-fill").style.width = `${((step + 1) / 5) * 100}%`;
  const name = state.name || "Dave";
  $("tuto-text").innerHTML = L.text[step].replace(/\{name\}/g, name);
  const runBtn = $("tuto-run");
  runBtn.style.display = step >= 4 ? "none" : "";
  runBtn.textContent = step >= 4 ? L.done : L.run;
  const skipBtn = $("tuto-skip");
  skipBtn.style.display = step >= 4 ? "none" : "";
  skipBtn.textContent = L.skip;
  $("tuto-close").title = L.closeTitle;

  // auto-open the panel once, right after the player identifies, unless done
  if (!t.done && !isOpen && state.identified === true && !t.skipped && stepShown === -1) {
    showTutorial();
  }
  stepShown = step;
}
