import fs from "fs";
import path from "path";

const LOGS_DIR   = path.resolve("./logs");
const MAX_DAYS   = 15;        // auto-delete logs older than 15 days
const MAX_MEMORY = 1000;      // cap in-memory entries per company bucket

// ── Ensure ./logs/ directory exists ──────────────────────────────────────────
fs.mkdirSync(LOGS_DIR, { recursive: true });

// ── Helpers ───────────────────────────────────────────────────────────────────

// "Rajlaxmi Solutions Pvt Ltd" → "rajlaxmi-solutions-pvt-ltd.log"
function companyToFilename(company) {
  if (!company) return "_global.log";
  return (
    company
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) +
    ".log"
  );
}

function logFilePath(company) {
  return path.join(LOGS_DIR, companyToFilename(company));
}

// ── Per-company in-memory cache  (Map<bucket, Entry[]>) ──────────────────────
const cache = new Map();

function loadBucket(bucket) {
  if (cache.has(bucket)) return cache.get(bucket);
  const file = logFilePath(bucket);
  let entries = [];
  try {
    if (fs.existsSync(file)) entries = JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch { entries = []; }
  cache.set(bucket, entries);
  return entries;
}

function saveBucket(bucket, entries) {
  try { fs.writeFileSync(logFilePath(bucket), JSON.stringify(entries, null, 2)); }
  catch { /* never crash over log writes */ }
}

function pruneEntries(entries) {
  const cutoff = Date.now() - MAX_DAYS * 24 * 60 * 60 * 1000;
  return entries.filter(e => new Date(e.ts).getTime() > cutoff);
}

// ── Core writer ───────────────────────────────────────────────────────────────
function addLog(level, message, meta = {}) {
  const company = meta?.company || null;

  const entry = {
    id:      Date.now() + Math.random(),
    ts:      new Date().toISOString(),
    level,
    message,
    meta,
    company,   // top-level for fast filtering
  };

  // Write to company-specific bucket
  const bucket = company || "_global";
  let rows = loadBucket(bucket);
  rows.unshift(entry);
  if (rows.length > MAX_MEMORY) rows.splice(MAX_MEMORY);
  rows = pruneEntries(rows);
  cache.set(bucket, rows);
  saveBucket(bucket, rows);

  // Also write to _global so admin can see everything in one place
  if (bucket !== "_global") {
    let global = loadBucket("_global");
    global.unshift(entry);
    if (global.length > MAX_MEMORY) global.splice(MAX_MEMORY);
    global = pruneEntries(global);
    cache.set("_global", global);
    saveBucket("_global", global);
  }

  // Console output
  const tag = level === "error" ? "✗" : level === "warn" ? "⚠" : level === "success" ? "✓" : "·";
  console.log(`[${entry.ts.slice(11, 19)}] ${tag} ${message}`, Object.keys(meta).length ? meta : "");

  return entry;
}

// ── Query ─────────────────────────────────────────────────────────────────────
/**
 * getLogs(options)
 *   company  — filter to one company (null = all)
 *   fromDate — "YYYY-MM-DD" inclusive
 *   toDate   — "YYYY-MM-DD" inclusive
 *   level    — "info"|"success"|"warn"|"error" (null = all)
 *   limit    — default 200
 */
function getLogs({ company = null, fromDate = null, toDate = null, level = null, limit = 200 } = {}) {
  // Legacy compat: if called as getLogs(100) (plain number), treat as limit
  if (typeof arguments[0] === "number") return getLogs({ limit: arguments[0] });

  const bucket = company || "_global";
  let entries = loadBucket(bucket);

  if (fromDate) {
    const from = new Date(fromDate).getTime();
    entries = entries.filter(e => new Date(e.ts).getTime() >= from);
  }
  if (toDate) {
    const to = new Date(toDate).getTime() + 86_400_000; // include full day
    entries = entries.filter(e => new Date(e.ts).getTime() < to);
  }
  if (level) {
    entries = entries.filter(e => e.level === level);
  }

  return entries.slice(0, limit);
}

/** List all companies that have log files (for admin/tenant selector) */
function listCompanies() {
  try {
    return fs.readdirSync(LOGS_DIR)
      .filter(f => f.endsWith(".log") && f !== "_global.log")
      .map(f => f.replace(/\.log$/, ""));
  } catch { return []; }
}

/** Prune expired entries from every log file */
function pruneAllLogs() {
  try {
    const files = fs.readdirSync(LOGS_DIR).filter(f => f.endsWith(".log"));
    for (const file of files) {
      const bucket = file.replace(/\.log$/, "");
      let entries = loadBucket(bucket);
      const before = entries.length;
      entries = pruneEntries(entries);
      if (entries.length !== before) {
        cache.set(bucket, entries);
        saveBucket(bucket, entries);
      }
    }
  } catch { /* silent */ }
}

// Prune on startup + every 6 hours
pruneAllLogs();
setInterval(pruneAllLogs, 6 * 60 * 60 * 1000);

// ── Human-friendly log helpers ────────────────────────────────────────────────
// Plain-English wrappers around addLog — no logic changes.
// Every helper accepts a `meta` object as the last argument so multi-tenant
// bucket routing (meta.company) keeps working exactly as before.
//
// Usage: logger.human.serverReady("http://localhost:4000", { company: "Rajlaxmi Solutions" })

const human = {

  // ── Startup messages ────────────────────────────────────────────────────────

  /** Tally Middleware server running on http://localhost:4000 */
  serverReady: (url, meta = {}) =>
    addLog("info",
      `The system is up and ready. You can start using it now. (${url})`,
      { type: "server_ready", url, ...meta }),

  /** Tally endpoint: http://localhost:9000 */
  tallyConnected: (url, meta = {}) =>
    addLog("info",
      `Tally is connected and reachable at ${url}.`,
      { type: "tally_connected", url, ...meta }),

  /** Auto-sync scheduled: "0 2 * * *" */
  autoSyncScheduled: (what, meta = {}) =>
    addLog("info",
      `Automatic data sync is set up. It will run on its own every night at 2:00 AM for: ${what}.`,
      { type: "auto_sync_scheduled", schedule: what, ...meta }),

  /** Run POST /api/middleware/check to validate all Tally data */
  checkReady: (meta = {}) =>
    addLog("info",
      `System is ready. You can now run a check to make sure all Tally data is correct.`,
      { type: "check_ready", ...meta }),

  // ── Sync lifecycle ──────────────────────────────────────────────────────────

  /** Full sync job started */
  syncStarted: (companyName, targetUrl, meta = {}) =>
    addLog("info",
      `Starting a full data update for "${companyName}". This will fetch the latest information from Tally and send it to ${targetUrl}.`,
      { type: "sync_started", ...meta }),

  /** Tally ping OK (20ms) */
  tallyReachable: (ms, meta = {}) =>
    addLog("info",
      `Tally responded quickly (in ${ms}ms). Connection is healthy.`,
      { type: "tally_ping", ms, ...meta }),

  /** Sync mode: INCREMENTAL — only new/changed records will be fetched */
  syncModeIncremental: (companyName, meta = {}) =>
    addLog("info",
      `Only new or changed records will be fetched for "${companyName}" — unchanged data will be skipped to save time.`,
      { type: "sync_mode", mode: "incremental", ...meta }),

  /** Nothing to sync — all masters unchanged, no new vouchers */
  nothingToSync: (meta = {}) =>
    addLog("info",
      `Everything is already up to date. There is nothing new to save right now.`,
      { type: "sync_empty", ...meta }),

  /** syncState saved */
  stateSaved: (companyName, meta = {}) =>
    addLog("info",
      `Progress has been saved for "${companyName}". The next sync will continue from where this one left off.`,
      { type: "state_saved", ...meta }),

  /** Sync done */
  syncDone: (companyName, dateFrom, dateTo, count, meta = {}) =>
    addLog("success",
      `Done! ${count} record${count === 1 ? "" : "s"} saved for "${companyName}" (${dateFrom} → ${dateTo}).`,
      { type: "sync_done", count, ...meta }),

  /** Sync failed */
  syncFailed: (companyName, reason, meta = {}) =>
    addLog("error",
      `Could not complete the data update for "${companyName}". Reason: ${reason}`,
      { type: "sync_failed", reason, ...meta }),

  // ── Per-master fetching (ledgers, stock, vouchers, etc.) ───────────────────

  /** Fetching ledgers from Tally */
  fetchingMaster: (masterName, meta = {}) =>
    addLog("info",
      `Reading ${masterName} from Tally…`,
      { type: "fetching_master", master: masterName, ...meta }),

  /** Fetched 68 ledgers */
  fetchedMaster: (masterName, count, meta = {}) =>
    addLog("success",
      `Found ${count} ${masterName} in Tally.`,
      { type: "fetched_master", master: masterName, count, ...meta }),

  /** Ledgers: 0 to sync, 68 unchanged (skipped) */
  masterSyncResult: (masterName, toSync, skipped, meta = {}) =>
    addLog("info",
      toSync === 0
        ? `${masterName}: All ${skipped} ${skipped === 1 ? "entry is" : "entries are"} already up to date. Nothing to change.`
        : `${masterName}: ${toSync} ${toSync === 1 ? "entry" : "entries"} will be updated, ${skipped} already up to date.`,
      { type: "master_sync_result", master: masterName, toSync, skipped, ...meta }),

  /** Vouchers skipped — window already covered */
  vouchersSkipped: (dateFrom, dateTo, meta = {}) =>
    addLog("info",
      `Vouchers from ${dateFrom} to ${dateTo} were already synced before. Skipping to avoid duplicates.`,
      { type: "vouchers_skipped", dateFrom, dateTo, ...meta }),

  // ── Individual record actions ───────────────────────────────────────────────

  itemAdded: (itemLabel, meta = {}) =>
    addLog("success", `Added: ${itemLabel}`, { type: "item_added", item: itemLabel, ...meta }),

  itemUpdated: (itemLabel, meta = {}) =>
    addLog("info", `Updated: ${itemLabel}`, { type: "item_updated", item: itemLabel, ...meta }),

  itemRemoved: (itemLabel, meta = {}) =>
    addLog("warn", `Removed: ${itemLabel}`, { type: "item_removed", item: itemLabel, ...meta }),

  itemSkipped: (itemLabel, reason, meta = {}) =>
    addLog("info", `Skipped "${itemLabel}" — ${reason}.`, { type: "item_skipped", item: itemLabel, reason, ...meta }),

  // ── Warnings / soft issues ──────────────────────────────────────────────────

  headsUp: (message, meta = {}) =>
    addLog("warn", `Heads up: ${message}`, { type: "heads_up", ...meta }),

  missingData: (itemLabel, fieldName, meta = {}) =>
    addLog("warn",
      `"${itemLabel}" is missing "${fieldName}". It was saved anyway but may be incomplete.`,
      { type: "missing_data", item: itemLabel, field: fieldName, ...meta }),

  // ── General progress ────────────────────────────────────────────────────────

  step: (stepName, meta = {}) =>
    addLog("info", `Now working on: ${stepName}`, { type: "step", step: stepName, ...meta }),

  stepDone: (stepName, meta = {}) =>
    addLog("success", `Finished: ${stepName}`, { type: "step_done", step: stepName, ...meta }),
};

// ── Public API ────────────────────────────────────────────────────────────────
export const logger = {
  info:    (msg, meta) => addLog("info",    msg, meta),
  warn:    (msg, meta) => addLog("warn",    msg, meta),
  error:   (msg, meta) => addLog("error",   msg, meta),
  success: (msg, meta) => addLog("success", msg, meta),

  summary: (companyName, dateFrom, dateTo, counts = {}) =>
    addLog("success", `Sync summary — ${companyName} (${dateFrom} → ${dateTo})`, {
      type: "sync_summary", company: companyName,
      date_from: dateFrom, date_to: dateTo,
      ...counts, synced_at: new Date().toISOString(),
    }),

  getLogs,
  listCompanies,
  pruneAllLogs,

  getSummaries: (company = null) =>
    getLogs({ company, limit: 500 }).filter(e => e.meta?.type === "sync_summary"),

  clear: (company = null) => {
    const bucket = company || "_global";
    cache.set(bucket, []);
    saveBucket(bucket, []);
  },

  // Plain-English helpers — see section above for full list
  human,
};