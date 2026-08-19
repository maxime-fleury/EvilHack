let ctx = null;
let enabled = true;

export function setSound(on) {
  enabled = !!on;
}

function beep(freq, dur = 0.06, type = "square", vol = 0.03) {
  if (!enabled) return;
  try {
    ctx ||= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  } catch { /* audio unavailable */ }
}

export const sKey = () => beep(900, 0.02, "square", 0.015);
export const sSubmit = () => beep(520, 0.05, "square", 0.03);
export const sOk = () => { beep(660, 0.05); beep(880, 0.06); };
export const sErr = () => beep(180, 0.12, "sawtooth", 0.04);
export const sChat = () => { beep(740, 0.05, "triangle"); beep(980, 0.07, "triangle"); };
