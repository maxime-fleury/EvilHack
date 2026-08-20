// Contextual command chips under the terminal — one click runs the command.
// The server snapshot drives the context (pending hack, raid, missions ready
// to deliver), with a bread-and-butter fallback so there's always something.

const chipsEl = document.getElementById("terminal-chips");
let onRun = null;

export function setupChips(fn) {
  onRun = fn;
  chipsEl.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-cmd]");
    if (!b) return;
    if (onRun) onRun(b.dataset.cmd);
  });
}

export function renderChips(s) {
  // easy mode only — "normal mode" hides the chips (settings → easy mode)
  if (!s || s.identified === false || s.powered === false || s.settings?.chips === false) {
    chipsEl.innerHTML = "";
    return;
  }
  const items = compute(s);
  chipsEl.innerHTML = items
    .map((c) => `<button type="button" class="chip" data-cmd="${esc(c.cmd)}" title="${esc(c.cmd)}">${esc(c.label)}</button>`)
    .join("");
}

function esc(v) {
  return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function compute(s) {
  const chips = [];

  // ── mid-hack: the exact next step ───────────────────────────────────────
  const ph = s.pendingHack;
  if (ph) {
    if (ph.event) {
      // an event tripped mid-hack — push / cover / abort
      return [
        { label: "push", cmd: "hack push" },
        { label: "cover", cmd: "hack cover" },
        { label: "abort", cmd: "hack abort" },
      ];
    }
    return [
      { label: `brute ${ph.target}`, cmd: `hack brute ${ph.target}` },
      { label: `exploit ${ph.target}`, cmd: `hack exploit ${ph.target}` },
      { label: `social ${ph.target}`, cmd: `hack social ${ph.target}` },
    ];
  }

  // ── cops at the door ─────────────────────────────────────────────────────
  if (s.raidPending) {
    return [
      { label: "flee", cmd: "raid flee" },
      { label: "pay", cmd: "raid pay" },
      { label: "brave", cmd: "raid brave" },
    ];
  }

  // ── mission already hacked → deliver it ──────────────────────────────────
  const active = (s.missions || []).filter((m) => m.status === "active");
  const ready = active.filter((m) => Array.isArray(m.steps) && String(m.steps[0]).startsWith("✔"));
  for (const m of ready.slice(0, 2)) chips.push({ label: `deliver #${m.id}`, cmd: `missions deliver ${m.id}` });

  // ── bread & butter: always safe ──────────────────────────────────────────
  if (s.mining && !s.mining.active) chips.push({ label: "miner start", cmd: "miner start" });
  chips.push({ label: "scan", cmd: "scan" });
  if (active.length) chips.push({ label: "missions", cmd: "missions" });
  chips.push({ label: "net", cmd: "net" }, { label: "shop", cmd: "shop" }, { label: "help", cmd: "help" });

  const seen = new Set();
  return chips.filter((c) => (seen.has(c.cmd) ? false : (seen.add(c.cmd), true)));
}
