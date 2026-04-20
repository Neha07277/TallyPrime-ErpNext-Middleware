import fs from "fs";
import path from "path";

const LOG_FILE = path.resolve("./logs/sync.log");
const MAX_DAYS = 90;          // keep 90 days of history
const MAX_IN_MEMORY = 1000;   // cap in-memory array

// ── Ensure ./logs/ directory exists ──────────────────────────────────────────
fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });

// ── Load existing logs from disk on startup (survives restarts) ──────────────
let logs = [];
try {
  if (fs.existsSync(LOG_FILE)) {
    logs = JSON.parse(fs.readFileSync(LOG_FILE, "utf-8"));
  }
} catch {
  logs = [];
}

function pruneOldLogs() {
  const cutoff = Date.now() - MAX_DAYS * 24 * 60 * 60 * 1000;
  logs = logs.filter(e => new Date(e.ts).getTime() > cutoff);
}

function saveToDisk() {
  try {
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
  } catch {
    // never crash the agent over a log write failure
  }
}

function addLog(level, message, meta = {}) {
  const entry = {
    id: Date.now() + Math.random(),
    ts: new Date().toISOString(),
    level,
    message,
    meta,
  };

  logs.unshift(entry);
  if (logs.length > MAX_IN_MEMORY) logs.splice(MAX_IN_MEMORY);

  pruneOldLogs();
  saveToDisk();

  const tag =
    level === "error"   ? "✗" :
    level === "warn"    ? "⚠" :
    level === "success" ? "✓" : "·";

  console.log(
    `[${entry.ts.slice(11, 19)}] ${tag} ${message}`,
    Object.keys(meta).length ? meta : ""
  );

  return entry;
}

export const logger = {
  info:    (msg, meta) => addLog("info",    msg, meta),
  warn:    (msg, meta) => addLog("warn",    msg, meta),
  error:   (msg, meta) => addLog("error",   msg, meta),
  success: (msg, meta) => addLog("success", msg, meta),

  // summary: a special structured entry so the UI can show "what was synced"
  summary: (companyName, dateFrom, dateTo, counts = {}) =>
    addLog("success", `Sync summary — ${companyName} (${dateFrom} → ${dateTo})`, {
      type: "sync_summary",
      company: companyName,
      date_from: dateFrom,
      date_to: dateTo,
      ...counts,
      synced_at: new Date().toISOString(),
    }),

  getLogs:     (limit = 200) => logs.slice(0, limit),
  getSummaries: ()           => logs.filter(e => e.meta?.type === "sync_summary"),
  clear:       ()            => { logs.splice(0); saveToDisk(); },
};