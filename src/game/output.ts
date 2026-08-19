/** Terminal output line. Client renders `t` as escaped text with class `c`. */
export type LineCls =
  | "plain"
  | "dim"
  | "ok"
  | "warn"
  | "err"
  | "info"
  | "money"
  | "title"
  | "ascii"
  | "divider"
  | "prompt";

export interface Line {
  t: string;
  c?: LineCls;
}

export function l(t: string, c: LineCls = "plain"): Line {
  return { t, c };
}

export const blank: Line = { t: "" };

export function divider(title?: string): Line {
  return { t: title ? `───── ${title} ─────` : "──────────────────────────────", c: "divider" };
}

/** ASCII art, printed in a bright color. */
export function ascii(text: string): Line {
  return { t: text, c: "ascii" };
}

export function ok(t: string): Line {
  return l(t, "ok");
}
export function warn(t: string): Line {
  return l(t, "warn");
}
export function err(t: string): Line {
  return l(t, "err");
}
export function info(t: string): Line {
  return l(t, "info");
}
export function money(t: string): Line {
  return l(t, "money");
}
export function title(t: string): Line {
  return l(t, "title");
}
export function dim(t: string): Line {
  return l(t, "dim");
}

export function fmtMoney(n: number): string {
  const v = Math.abs(n) >= 1000 ? n.toFixed(0) : n.toFixed(2);
  const [int, dec] = v.split(".");
  const withCommas = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const sign = n < 0 ? "-" : "";
  return `${sign}$${withCommas}${dec ? "." + dec : ""}`;
}

export function fmtClock(day: number, minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `Day ${day} · ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function timeCost(minutes: number): Line {
  if (minutes <= 0) return blank;
  return dim(`⏱  ${minutes} min elapsed`);
}
