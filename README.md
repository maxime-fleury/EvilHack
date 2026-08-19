# EVILHACK — Unemployment Simulator 🖥️💀

> You got fired for "excessive dedication to free snacks". Your severance package was a stapler and a 2008 laptop named **Frank**. You're bored. You're broke. You're about to become a (fake) hacker.

**EVILHACK** is a dark-comedy hacking idle game that lives in a fake OS desktop: a terminal, stats panels, a desktop shell with lock screen and boot sequence, and Noro-chan — your teasing AI companion (Nagatoro-style) who lives inside Frank and comments on everything you do.

Play it entirely in the terminal: scan networks, pick your hack vector, break in, sell dossiers, run missions with twists and betrayals, climb reputation, join (or betray) factions, and upgrade your potato into a crime machine.

---

## ✨ Features

- **A real OS shell** — lock screen with login panel (pick your handle, no password — Frank doesn't believe in them), boot animation, desktop icons, taskbar, windows, screensaver.
- **Interactive hacking** — recon a target, pick a vector (`brute` / `exploit` / `social`), handle live events mid-hack (firewall trips, nosy admins, honeypots), with real risk: failures spike heat and lock the target for a few hours.
- **45+ missions** with branching stories, twists and betrayals ("MAIS NON!"), plus 3 optional side arcs with permanent stat perks.
- **Progression systems** — XP & levels (perks per level), skill tracks (SQL / social / zero-day), reputation & titles (from *Retired DevOps* to *CEO of Unemployment*), 28 achievements (some hidden), career records.
- **Factions** — NullSec, the Syndicate, or going solo — each with exclusive missions, perks and reputation.
- **Economy** — shop upgrades (CPU/GPU/RAM/VPN/VPS/botnet), a fake darknet with programs (rootkits, sniffers, proxy chains…) and scams, PUPPYCOIN mining, passive income, a **fluctuating market** (program prices and hot dossiers re-roll daily).
- **Deep systems** — a network map (`net`), **backdoors** on hacked hosts (silent revisits, sold as access, burned by raids), **rival hackers** who snipe missions, a **crew** with daily salaries and passive perks, **Frank's filesystem** (`ls`/`cat`/`write`), an enriched **legend** screen with your alignment journey, and **prestige** (reset the grind for a permanent income boost).
- **JSON mods** — drop custom mission files in `mods/` and they're added to the pool at startup (see `mods/README.md`).
- **Heat & consequences** — cops, bribes, lay-low periods, random events (electricity bills, landlords, neighbors who "just need IT help").
- **Noro-chan** 🤖 — an optional AI sidekick (LM Studio, OpenAI-compatible endpoint) who *actually knows your game state*: money, gear, missions, recent activity. She teases you when you're stuck, celebrates your wins, mocks your losses, and remembers conversations across sessions. Fully editable persona prompt (per language).
- **Fully bilingual** 🇫🇷🇬🇧 — switch FR/EN in the settings; commands stay in English.
- **5 themes** — green, amber, blue, matrix, purple.
- **No build step for the client** — plain ES modules + Bootstrap + mark.js from CDN. SQLite for saves. Bun for the server.

---

## 🚀 Getting started

Requires [Bun](https://bun.sh).

```bash
bun install
bun run dev          # starts the server on http://localhost:3000
```

Open http://localhost:3000, click the lock screen, pick your hacker handle, and type `tutorial` to learn the ropes.

> **Optional:** to bring Noro-chan to life, run a local OpenAI-compatible server (e.g. [LM Studio](https://lmstudio.ai/) on `http://127.0.0.1:3007`). Without it, the game still works — she just stays scripted.

---

## 🎮 Core commands

| Command | What it does |
|---|---|
| `scan` | List nearby networks (difficulty, ETA, heat risk) |
| `hack <target>` | Recon a target, then pick a vector: `hack brute`, `hack exploit`, `hack social` — and handle live events with `hack push` / `cover` / `abort` |
| `missions` | Accept / deliver contracts with deadlines, twists and betrayals |
| `shop` / `buy <item>` | Upgrade your rig (CPU, GPU, RAM, VPN, VPS, botnet…) |
| `tor` | Browse the fake darknet: programs, scams, hidden services |
| `people` / `sell <npc>` | Dig up dirt on people, then sell their dossiers |
| `miner` / `coin` | Passive income: crypto mining & PUPPYCOIN gambling |
| `arcs` | Optional side storylines with permanent perks |
| `achievements` | Trophy collection (some hidden) |
| `stats` / `career` / `legend` | Your legend so far — hours, best day, alignment journey |
| `settings` | Theme, language, AI persona, server URL |
| `tutorial` | Replayable guided tutorial (8 chapters) |
| `save` / `slots` / `reset` | Save slots & fresh starts |
| `net` | The network map: your gear, your routes, what's in reach |
| `backdoor <target>` | Plant persistent access on hacked hosts (needs the rootkit) |
| `rivals` | The other hackers in town — the scoreboard |
| `crew` | Hire helpers: passive perks for a daily salary |
| `frank` | Check in with Frank. He has feelings about all of this. |
| `market` | Today's darknet prices: hot programs & scandal dossiers |
| `ls` / `cat` / `write` | Explore Frank's little filesystem |
| `prestige` | Reset the grind for a permanent +10% income boost |

Type `help` in-game for the full list. **Tab autocompletes** and Enter runs.

---

## 🗄️ Data & saves

- Saves live in **SQLite** at `data/evilhack.db` (auto-saved after every command).
- 3 save slots via `slots` / `slot <n>`.
- `reset` wipes the save but keeps your language & preferences.

## 🧱 Tech

- **Server:** Bun + TypeScript (`src/`)
- **Client:** plain JS ES modules, no build/bundle (`public/`)
- **Stack:** Bootstrap 5 (CDN), mark.js (CDN) for search highlighting, Google Fonts (JetBrains Mono)
- **DB:** `bun:sqlite`

## 🧑‍💻 Development

```bash
bunx tsc --noEmit     # typecheck
bun run dev           # dev server (watch mode)
```

---

## 📜 License

[MIT](LICENSE) © 2026 Maxime Fleury
