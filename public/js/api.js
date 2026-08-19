export async function api(path, opts = {}) {
  const res = await fetch(path, {
    headers: { "content-type": "application/json" },
    ...opts,
  });
  let data = {};
  try { data = await res.json(); } catch { /* non-JSON */ }
  if (!res.ok && !data.lines) {
    data.lines = [{ t: `Server error (${res.status})`, c: "err" }];
  }
  return data;
}

export const cmd = (c) => api("/api/cmd", { method: "POST", body: JSON.stringify({ cmd: c }) });
export const complete = (line) => api("/api/complete", { method: "POST", body: JSON.stringify({ line }) });
export const getState = () => api("/api/state");
export const getIntro = () => api("/api/intro");
export const getHelp = () => api("/api/help");
export const getShop = () => api("/api/shop");
export const chatSend = (message) => api("/api/chat", { method: "POST", body: JSON.stringify({ message }) });
export const aiStatus = () => api("/api/ai-status");
export const setSettingsApi = (settings) => api("/api/settings", { method: "POST", body: JSON.stringify({ settings }) });
