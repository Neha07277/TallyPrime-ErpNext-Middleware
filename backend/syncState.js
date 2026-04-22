/**
 * syncState.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Manages persistent incremental sync state so every run only processes
 * new / changed data instead of re-syncing everything from scratch.
 *
 * State file location: <project_root>/data/sync_state.json
 *
 * Structure per company:
 * {
 *   "Rajlaxmi Solutions Pvt. Ltd.": {
 *     lastVoucherSyncDate : "2026-04-21",   // last toDate used for voucher sync
 *     lastMasterSyncAt    : "2026-04-21T...", // ISO timestamp of last master sync
 *     ledgerAlterIds      : { "Cash": "42", "Bank": "18", ... },
 *     stockAlterIds       : { "Item A": "7", ... },
 *     groupAlterIds       : { "Sundry Debtors": "3", ... },
 *   }
 * }
 *
 * OVERLAP_DAYS (3) — re-sync the last 3 days of vouchers on every run.
 * This catches any backdated entries or amendments made in Tally after
 * the previous sync without re-processing months of old data.
 */

import fs   from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { logger } from "./logs/logger.js";

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const STATE_DIR  = path.join(__dirname, "data");
const STATE_FILE = path.join(STATE_DIR, "sync_state.json");
const OVERLAP_DAYS = 3; // re-sync last N days to catch Tally backdated edits

// ── File helpers ──────────────────────────────────────────────────────────────

function ensureDir() {
  if (!fs.existsSync(STATE_DIR)) fs.mkdirSync(STATE_DIR, { recursive: true });
}

function loadState() {
  ensureDir();
  if (!fs.existsSync(STATE_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch {
    logger.warn("syncState: could not parse sync_state.json — starting fresh");
    return {};
  }
}

function saveState(state) {
  ensureDir();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * getCompanyState(company)
 * Returns the persisted state object for this company, or an empty default.
 */
export function getCompanyState(company) {
  const all = loadState();
  return all[company] || {
    lastVoucherSyncDate:  null,
    lastMasterSyncAt:     null,
    ledgerAlterIds:       {},
    stockAlterIds:        {},
    groupAlterIds:        {},
    costCentreAlterIds:   {},
    godownAlterIds:       {},
  };
}

/**
 * saveCompanyState(company, partial)
 * Merges `partial` into the stored state for this company.
 */
export function saveCompanyState(company, partial) {
  const all   = loadState();
  const prev  = all[company] || {};
  all[company] = Object.assign({}, prev, partial);
  // Deep-merge alterIds maps so individual keys don't get wiped
  if (partial.ledgerAlterIds) {
    all[company].ledgerAlterIds = Object.assign({}, prev.ledgerAlterIds || {}, partial.ledgerAlterIds);
  }
  if (partial.stockAlterIds) {
    all[company].stockAlterIds = Object.assign({}, prev.stockAlterIds || {}, partial.stockAlterIds);
  }
  if (partial.groupAlterIds) {
    all[company].groupAlterIds = Object.assign({}, prev.groupAlterIds || {}, partial.groupAlterIds);
  }
  if (partial.costCentreAlterIds) {
    all[company].costCentreAlterIds = Object.assign({}, prev.costCentreAlterIds || {}, partial.costCentreAlterIds);
  }
  if (partial.godownAlterIds) {
    all[company].godownAlterIds = Object.assign({}, prev.godownAlterIds || {}, partial.godownAlterIds);
  }
  saveState(all);
  logger.info(`syncState: saved state for "${company}"`, {
    lastVoucherSyncDate: all[company].lastVoucherSyncDate,
    lastMasterSyncAt:    all[company].lastMasterSyncAt,
  });
}

/**
 * resetCompanyState(company)
 * Clears all incremental state for a company — forces a full re-sync next run.
 */
export function resetCompanyState(company) {
  const all = loadState();
  delete all[company];
  saveState(all);
  logger.info(`syncState: reset state for "${company}" — next sync will be full`);
}

/**
 * getIncrementalVoucherDates(company, requestedFromDate, requestedToDate)
 *
 * Returns { fromDate, toDate, isIncremental } to use for the voucher fetch.
 *
 * Logic:
 *  - First ever sync           → use requestedFromDate / requestedToDate as-is
 *  - Subsequent syncs          → start from (lastVoucherSyncDate − OVERLAP_DAYS)
 *                                so backdated edits in Tally are caught
 *  - If user explicitly passed a fromDate earlier than our checkpoint
 *    (e.g. they want to re-sync a specific old range) → honour the user's date
 */
export function getIncrementalVoucherDates(company, requestedFromDate, requestedToDate) {
  const state = getCompanyState(company);
  const today = new Date().toISOString().slice(0, 10);
  const toDate = requestedToDate || today;

  if (!state.lastVoucherSyncDate) {
    // First sync — use whatever the user passed
    return { fromDate: requestedFromDate || toDate, toDate, isIncremental: false };
  }

  // Compute overlap start: lastSyncDate − OVERLAP_DAYS
  const lastDate  = new Date(state.lastVoucherSyncDate);
  lastDate.setDate(lastDate.getDate() - OVERLAP_DAYS);
  const checkpoint = lastDate.toISOString().slice(0, 10);

  // If user's requested fromDate is even earlier, use that (explicit backfill)
  const fromDate = requestedFromDate && requestedFromDate < checkpoint
    ? requestedFromDate
    : checkpoint;

  const isIncremental = fromDate > (requestedFromDate || "1900-01-01");

  logger.info(`syncState: incremental voucher window → ${fromDate} to ${toDate}` +
    ` (last sync was ${state.lastVoucherSyncDate}, overlap=${OVERLAP_DAYS}d)`);

  return { fromDate, toDate, isIncremental };
}

/**
 * filterChangedMasters(items, storedAlterIds, keyField = "name")
 *
 * Compares Tally items against the last-known alterIds map.
 * Returns { toSync: [...], unchanged: number }
 *
 * If an item has no alterId field (Tally doesn't always export it),
 * we fall back to always syncing it (safe default).
 *
 * `alterId` in Tally = ALTERID field — an integer that Tally increments
 * every time a master record is modified. If it hasn't changed since last
 * sync, the record is identical and we can skip it.
 */
export function filterChangedMasters(items, storedAlterIds, keyField = "name") {
  if (!storedAlterIds || Object.keys(storedAlterIds).length === 0) {
    // No previous run → sync everything
    return { toSync: items, unchanged: 0 };
  }

  const toSync    = [];
  let unchanged   = 0;

  for (const item of items) {
    const key     = item[keyField];
    const alterId = item.alterId != null ? String(item.alterId) : null;

    // If no alterId available, always sync (can't tell if changed)
    if (alterId === null) { toSync.push(item); continue; }

    // New record (not in previous state) → sync
    if (!(key in storedAlterIds)) { toSync.push(item); continue; }

    // Changed record (alterId differs) → sync
    if (storedAlterIds[key] !== alterId) { toSync.push(item); continue; }

    // Unchanged → skip
    unchanged++;
  }

  return { toSync, unchanged };
}

/**
 * buildAlterIdMap(items, keyField = "name")
 * Builds a { name → alterId } map from a list of Tally master objects.
 * Used to save the new state after a successful sync.
 */
export function buildAlterIdMap(items, keyField = "name") {
  const map = {};
  for (const item of items) {
    if (item[keyField] && item.alterId != null) {
      map[item[keyField]] = String(item.alterId);
    }
  }
  return map;
}