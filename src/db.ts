import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

// ── Save slots ─────────────────────────────────────────────────────────────
// Three lives, three SQLite files. Slot 1 keeps the original data/evilhack.db
// so pre-slots saves stay exactly where they were.

const BASE_PATH = process.env.EVILHACK_DB ?? "data/evilhack.db";

function pathForSlot(n: number): string {
  if (n === 1) return BASE_PATH;
  return BASE_PATH.replace(/\.db$/i, `-${n}.db`);
}

let db: Database | null = null;
let current = 1;

export function currentSlot(): number {
  return current;
}

export function getDb(): Database {
  if (db) return db;
  const p = pathForSlot(current);
  mkdirSync(dirname(p), { recursive: true });
  db = new Database(p);
  // Default journal mode (rollback journal, not WAL). WAL mode turned out to be
  // a liability here: bun:sqlite's auto-checkpoint never fired in practice, so
  // the -wal file grew without bound (500MB+ in stress tests) which made every
  // read OOM and ballooned the DB to ~2GB of mostly-free pages. The rollback
  // journal is created per-transaction and removed after commit — it cannot
  // accumulate. Our saveGame writes everything inside one short transaction,
  // so this stays crash-safe.
  migrate(db);
  maintain(db);
  return db;
}

/**
 * Keep the DB file small on startup: VACUUM reclaims freelist bloat from older
 * builds that rewrote whole tables every save. For a normal ~100KB save this
 * is effectively instant.
 */
function maintain(d: Database) {
  try {
    d.exec("VACUUM;");
  } catch {
    /* not fatal */
  }
}

function migrate(d: Database) {
  d.exec(`
    CREATE TABLE IF NOT EXISTS player (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      name TEXT NOT NULL,
      money REAL NOT NULL DEFAULT 0,
      rep REAL NOT NULL DEFAULT 0,
      heat REAL NOT NULL DEFAULT 0,
      style REAL NOT NULL DEFAULT 0,
      day INTEGER NOT NULL DEFAULT 1,
      minutes INTEGER NOT NULL DEFAULT 540,
      cpu INTEGER NOT NULL DEFAULT 0,
      gpu INTEGER NOT NULL DEFAULT 0,
      ram INTEGER NOT NULL DEFAULT 0,
      vpn INTEGER NOT NULL DEFAULT 0,
      botnet INTEGER NOT NULL DEFAULT 0,
      vps INTEGER NOT NULL DEFAULT 0,
      rgb INTEGER NOT NULL DEFAULT 0,
      chair INTEGER NOT NULL DEFAULT 0,
      toaster INTEGER NOT NULL DEFAULT 0,
      cam INTEGER NOT NULL DEFAULT 0,
      exploits TEXT NOT NULL DEFAULT '[]',
      titles TEXT NOT NULL DEFAULT '[]',
      flags TEXT NOT NULL DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS missions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'offered',
      offered_day INTEGER NOT NULL,
      deadline_day INTEGER,
      giver TEXT NOT NULL,
      target TEXT NOT NULL,
      difficulty INTEGER NOT NULL,
      minutes INTEGER NOT NULL,
      payout REAL NOT NULL,
      rep REAL NOT NULL,
      style REAL NOT NULL,
      heat REAL NOT NULL,
      flavor TEXT NOT NULL,
      steps TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS contacts (
      npc TEXT PRIMARY KEY,
      discovered INTEGER NOT NULL DEFAULT 0,
      fragments INTEGER NOT NULL DEFAULT 0,
      fragment_texts TEXT NOT NULL DEFAULT '[]',
      sold INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      day INTEGER NOT NULL,
      minutes INTEGER NOT NULL,
      headline TEXT NOT NULL,
      body TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kind TEXT NOT NULL,
      label TEXT NOT NULL,
      target TEXT NOT NULL,
      total INTEGER NOT NULL,
      remaining INTEGER NOT NULL,
      payload TEXT NOT NULL DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      day INTEGER NOT NULL,
      minutes INTEGER NOT NULL,
      text TEXT NOT NULL
    );
  `);
  // migrations for existing databases
  try {
    d.exec("ALTER TABLE player ADD COLUMN vps INTEGER NOT NULL DEFAULT 0");
  } catch {
    /* column already exists */
  }
  try {
    d.exec("ALTER TABLE news ADD COLUMN tag TEXT NOT NULL DEFAULT ''");
  } catch {
    /* column already exists */
  }
}

/** Close the current DB and open another slot's file. Returns its slot number. */
export function switchSlot(n: number): number {
  const slot = Math.min(3, Math.max(1, Math.round(n)));
  if (db) {
    try {
      db.close();
    } catch {
      /* ignore */
    }
    db = null;
  }
  current = slot;
  getDb(); // open + migrate the new slot
  return slot;
}

/** Read another slot's summary without switching (safe peek, read-only). */
export function peekSlot(n: number): { name: string; day: number; money: number; rep: number; exists: boolean } | null {
  const p = pathForSlot(n);
  try {
    const d = new Database(p, { readonly: true });
    try {
      const row = d.query("SELECT name, day, money, rep FROM player WHERE id = 1").get() as { name: string; day: number; money: number; rep: number } | null;
      if (!row) return { name: "", day: 1, money: 0, rep: 0, exists: false };
      return { ...row, exists: true };
    } finally {
      d.close();
    }
  } catch {
    return { name: "", day: 1, money: 0, rep: 0, exists: false };
  }
}

/** Wipe everything and start a fresh save. */
export function resetDb(d: Database) {
  d.exec(`
    DELETE FROM player;
    DELETE FROM missions;
    DELETE FROM contacts;
    DELETE FROM news;
    DELETE FROM jobs;
    DELETE FROM log;
    DELETE FROM sqlite_sequence WHERE name IN ('missions','news','jobs','log');
  `);
}
