// ── Tiny WebAudio sound engine ─────────────────────────────────────────────
// Everything is synthesized (no audio files): short beeps, arpeggios, noise
// ticks and an optional ambient hum. Master volume is user-controllable.

let ctx = null;
let enabled = true;
let master = null;
let volume = 0.5;
let humNodes = null;

export function setSound(on) {
  enabled = !!on;
  if (!enabled) stopHum();
  else if (ambientOn) startHum();
}

export function setVolume(v) {
  volume = Math.max(0, Math.min(1, v));
  if (master) master.gain.value = volume;
}

function ac() {
  if (!enabled) return null;
  try {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = volume;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq, dur = 0.06, type = "square", vol = 0.03, delay = 0, slide = 0) {
  const c = ac();
  if (!c) return;
  try {
    const t0 = c.currentTime + delay;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  } catch { /* audio unavailable */ }
}

// short filtered noise burst (keyclicks, static)
function noiseBurst(dur = 0.015, vol = 0.015, delay = 0) {
  const c = ac();
  if (!c) return;
  try {
    const t0 = c.currentTime + delay;
    const len = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buf;
    const filter = c.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 1500;
    const gain = c.createGain();
    gain.gain.value = vol;
    src.connect(filter).connect(gain).connect(master);
    src.start(t0);
  } catch { /* audio unavailable */ }
}

// ── UI / typing ────────────────────────────────────────────────────────────
let lastKey = 0;
export const sKey = () => {
  const now = performance.now();
  if (now - lastKey < 28) return; // rate-limit so fast typing doesn't spam
  lastKey = now;
  noiseBurst(0.012, 0.02);
  tone(1400 + Math.random() * 500, 0.012, "square", 0.006);
};
export const sSubmit = () => { tone(520, 0.05, "square", 0.03); noiseBurst(0.03, 0.02); };
export const sOk = () => { tone(660, 0.05, "square", 0.025); tone(880, 0.06, "square", 0.025, 0.06); };
export const sErr = () => { tone(180, 0.14, "sawtooth", 0.035); tone(120, 0.16, "sawtooth", 0.03, 0.08); };
export const sChat = () => { tone(740, 0.05, "triangle", 0.02); tone(980, 0.07, "triangle", 0.02, 0.06); };

// ── System ─────────────────────────────────────────────────────────────────
export const sBoot = () => {
  // rising power-on sweep + soft click
  tone(120, 0.25, "sawtooth", 0.02, 0, 380);
  tone(520, 0.08, "square", 0.02, 0.22, 140);
  tone(780, 0.12, "triangle", 0.025, 0.3);
};
export const sPowerOff = () => {
  // descending power-down
  tone(420, 0.4, "sawtooth", 0.025, 0, -330);
  tone(60, 0.5, "sine", 0.03, 0.1, -25);
};
export const sShutdown = () => {
  // quick double-blink, then silence
  tone(880, 0.05, "square", 0.02);
  tone(220, 0.09, "square", 0.02, 0.09);
};
export const sScreensaver = () => {
  // dreamy ambient pad, quiet
  tone(220, 0.8, "sine", 0.012);
  tone(330, 0.8, "sine", 0.01, 0.1);
  tone(440, 0.9, "sine", 0.008, 0.2);
};
export const sCoin = () => {
  // cash register double-ding
  tone(1175, 0.07, "square", 0.022);
  tone(1568, 0.16, "square", 0.022, 0.07);
};
export const sLevelUp = () => {
  // rising arpeggio
  tone(523, 0.08, "square", 0.022);
  tone(659, 0.08, "square", 0.022, 0.07);
  tone(784, 0.08, "square", 0.022, 0.14);
  tone(1047, 0.18, "square", 0.028, 0.21);
};
export const sAchievement = () => {
  // little fanfare: C5 E5 G5 C6
  tone(523, 0.09, "triangle", 0.028);
  tone(659, 0.09, "triangle", 0.028, 0.09);
  tone(784, 0.09, "triangle", 0.028, 0.18);
  tone(1047, 0.22, "triangle", 0.034, 0.27);
};
export const sAlarm = () => {
  // police-ish two-tone warning
  tone(880, 0.16, "sawtooth", 0.03);
  tone(620, 0.16, "sawtooth", 0.03, 0.18);
  tone(880, 0.16, "sawtooth", 0.03, 0.36);
  tone(620, 0.2, "sawtooth", 0.03, 0.54);
};
export const sWarning = () => { tone(310, 0.12, "square", 0.022); tone(233, 0.14, "square", 0.022, 0.11); };
export const sMining = () => { tone(90, 0.03, "square", 0.008); tone(180, 0.03, "square", 0.006, 0.03); noiseBurst(0.02, 0.008); };
export const sMission = () => { tone(523, 0.07, "triangle", 0.025); tone(659, 0.07, "triangle", 0.025, 0.07); tone(784, 0.12, "triangle", 0.028, 0.14); };
export const sHackStart = () => { tone(300, 0.05, "sawtooth", 0.015); tone(450, 0.05, "sawtooth", 0.015, 0.05); noiseBurst(0.04, 0.012, 0.1); };
export const sHackDone = () => { tone(392, 0.06, "square", 0.02); tone(523, 0.06, "square", 0.02, 0.06); tone(659, 0.1, "square", 0.02, 0.12); };
export const sDanger = () => { tone(98, 0.5, "sine", 0.04, 0, -10); tone(98, 0.4, "sine", 0.03, 0.15); };

// ── Ambient hum (optional) ─────────────────────────────────────────────────
let ambientOn = false;
export function setAmbient(on) {
  ambientOn = !!on;
  if (ambientOn) startHum();
  else stopHum();
}
function startHum() {
  if (!enabled || humNodes || !ctx) { if (!ctx && enabled) ac(); }
  const c = ac();
  if (!c || humNodes) return;
  try {
    const len = c.sampleRate;
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.5;
    const src = c.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const filter = c.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 110;
    const gain = c.createGain();
    gain.gain.value = 0.012;
    src.connect(filter).connect(gain).connect(master);
    src.start();
    humNodes = { src, gain };
  } catch { /* audio unavailable */ }
}
function stopHum() {
  if (humNodes) {
    try { humNodes.src.stop(); } catch { /* already stopped */ }
    humNodes = null;
  }
}
