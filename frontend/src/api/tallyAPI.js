/**
 * tallyAPI.js
 * Frontend API client — proxies all calls through your Express backend (port 4000).
 * Place this at: src/api/tallyAPI.js
 */

const BASE = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

async function req(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json;
}

export const tallyAPI = {
  // ── System ─────────────────────────────────────────────────────────────────
  health:          ()               => req("/health"),
  ping:            ()               => req("/tally/ping"),
  logs:            (limit = 150)    => req(`/logs?limit=${limit}`),

  // ── Companies ──────────────────────────────────────────────────────────────
  companies:       ()               => req("/tally/companies"),

  // ── Accounting Masters ─────────────────────────────────────────────────────
  groups:          (company)        => req(`/tally/groups?company=${encodeURIComponent(company)}`),
  ledgers:         (company)        => req(`/tally/ledgers?company=${encodeURIComponent(company)}`),
  voucherTypes:    (company)        => req(`/tally/voucher-types?company=${encodeURIComponent(company)}`),
  costCategories:  (company)        => req(`/tally/cost-categories?company=${encodeURIComponent(company)}`),
  costCentres:     (company)        => req(`/tally/cost-centres?company=${encodeURIComponent(company)}`),
  currencies:      (company)        => req(`/tally/currencies?company=${encodeURIComponent(company)}`),
  budgets:         (company)        => req(`/tally/budgets?company=${encodeURIComponent(company)}`),

  // ── Inventory Masters ──────────────────────────────────────────────────────
  stockGroups:     (company)        => req(`/tally/stock-groups?company=${encodeURIComponent(company)}`),
  stock:           (company)        => req(`/tally/stock?company=${encodeURIComponent(company)}`),
  stockCategories: (company)        => req(`/tally/stock-categories?company=${encodeURIComponent(company)}`),
  units:           (company)        => req(`/tally/units?company=${encodeURIComponent(company)}`),
  godowns:         (company)        => req(`/tally/godowns?company=${encodeURIComponent(company)}`),

  // ── Transactions ───────────────────────────────────────────────────────────
  vouchers: (company, from, to) => {
    const params = new URLSearchParams({ company });
    if (from) params.set("from", from);
    if (to)   params.set("to",   to);
    return req(`/tally/vouchers?${params}`);
  },

  // ── Full Middleware Check ──────────────────────────────────────────────────
  middlewareCheck: (company, fromDate, toDate) =>
    req("/middleware/check", {
      method: "POST",
      body: JSON.stringify({ company, fromDate, toDate }),
    }),

  // ── ERPNext Connection ─────────────────────────────────────────────────────
  erpnextPing: () => req("/erpnext/ping"),

  // ── Background Job Status (used for tab-switch recovery) ──────────────────
  // Returns all currently running jobs so the UI can re-attach after navigation
  syncJobs:   ()      => req("/sync/jobs"),
  syncStatus: (jobId) => req(`/sync/status/${jobId}`),

  // ── Sync: individual ───────────────────────────────────────────────────────
  syncLedgers: (company, creds = {}) =>
    req("/sync/ledgers", {
      method: "POST",
      body: JSON.stringify({ company, ...creds }),
    }),

  syncSmartLedgers: (company, fromDate, toDate, creds = {}) =>
    req("/sync/smart-ledgers", {
      method: "POST",
      body: JSON.stringify({ company, fromDate, toDate, ...creds }),
    }),

  syncStock: (company, creds = {}) =>
    req("/sync/stock", {
      method: "POST",
      body: JSON.stringify({ company, ...creds }),
    }),

  syncVouchers: (company, fromDate, toDate, creds = {}) =>
    req("/sync/vouchers", {
      method: "POST",
      body: JSON.stringify({ company, fromDate, toDate, ...creds }),
    }),

  // ── Sync: new individual ──────────────────────────────────────────────────
  syncChartOfAccounts: (company, creds = {}) =>
    req("/sync/chart-of-accounts", { method: "POST", body: JSON.stringify({ company, ...creds }) }),
  syncTaxes: (company, creds = {}) =>
    req("/sync/taxes", { method: "POST", body: JSON.stringify({ company, ...creds }) }),
  syncGodowns: (company, creds = {}) =>
    req("/sync/godowns", { method: "POST", body: JSON.stringify({ company, ...creds }) }),
  syncOpeningBalances: (company, creds = {}) =>
    req("/sync/opening-balances", { method: "POST", body: JSON.stringify({ company, ...creds }) }),
  syncCostCentres: (company, creds = {}) =>
    req("/sync/cost-centres", { method: "POST", body: JSON.stringify({ company, ...creds }) }),
  syncInvoices: (company, fromDate, toDate, creds = {}) =>
    req("/sync/invoices", { method: "POST", body: JSON.stringify({ company, fromDate, toDate, ...creds }) }),

  // ── ERPNext Company Resolution ────────────────────────────────────────────
  resolveErpCompany: (tallyCompany) =>
    req("/erpnext/resolve-company", {
      method: "POST",
      body: JSON.stringify({ company: tallyCompany }),
    }),

  // ── Sync: full ─────────────────────────────────────────────────────────────
  // options shape: { syncChartOfAccounts, syncCostCentres, syncGodowns,
  //                 syncLedgers, syncStock, syncTaxes,
  //                 syncOpeningBalances, syncVouchers, syncInvoices }
  syncFull: (company, fromDate, toDate, options = {}) =>
    req("/sync/full", {
      method: "POST",
      body: JSON.stringify({ company, fromDate, toDate, ...options }),
    }),
};