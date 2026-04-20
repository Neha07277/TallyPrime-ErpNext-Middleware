import { StatusDot } from "./StatusDot";

const T = {
  ink: "#0f1117", muted: "#7c7f8e", border: "#e2e4ec", panel: "#f5f6fa",
  accent: "#2563eb", accentL: "#dbeafe", accentB: "#bfdbfe",
  green: "#16a34a", greenL: "#dcfce7", greenB: "#bbf7d0",
  amber: "#d97706", amberL: "#fffbeb", amberB: "#fde68a",
  red:   "#dc2626", redL:   "#fee2e2", redB:   "#fecaca",
  mono:  "'IBM Plex Mono', monospace",
  title: "'Syne', sans-serif",
};

const STATUS_LABEL = { ok: "PASS", warn: "WARN", fail: "FAIL", pending: "—", running: "…" };
const STATUS_STYLE = {
  ok:      { color: T.green, bg: T.greenL, border: T.greenB },
  warn:    { color: T.amber, bg: T.amberL, border: T.amberB },
  fail:    { color: T.red,   bg: T.redL,   border: T.redB   },
  pending: { color: T.muted, bg: T.panel,  border: T.border  },
  running: { color: T.accent,bg: T.accentL,border: T.accentB },
};

export function CheckRow({ icon, label, check, children }) {
  const status = check?.status ?? "pending";
  const s = STATUS_STYLE[status] || STATUS_STYLE.pending;

  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 8,
      padding: "14px 0", borderBottom: `0.5px solid ${T.border}`,
    }}
    className="check-row-last-no-border"
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 16, width: 22, textAlign: "center", flexShrink: 0, lineHeight: 1 }}>{icon}</span>
        <span style={{ fontFamily: T.title, fontSize: 13, fontWeight: 600, color: T.ink, flex: 1, letterSpacing: "-0.2px" }}>{label}</span>
        <span style={{
          fontFamily: T.mono, fontSize: 9, padding: "3px 7px", borderRadius: 6,
          border: `0.5px solid ${s.border}`, background: s.bg, color: s.color,
          fontWeight: 500, letterSpacing: "0.1em",
        }}>
          {STATUS_LABEL[status] || status.toUpperCase()}
        </span>
        <StatusDot status={status} />
      </div>

      {check?.count !== undefined && (
        <div style={{ marginLeft: 32, display: "flex", flexWrap: "wrap", gap: 5 }}>
          <Pill label="Total"  value={check.count}      color="blue" />
          {check.partyCount  !== undefined && <Pill label="Party"  value={check.partyCount}  color="green" />}
          {check.withGstin   !== undefined && <Pill label="GST"    value={check.withGstin}   color="amber" />}
          {check.withEmail   !== undefined && <Pill label="Email"  value={check.withEmail}   color="blue"  />}
          {check.totalAmount !== undefined && (
            <Pill label="Amount" value={"₹" + check.totalAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })} color="green" />
          )}
          {check.latencyMs !== undefined && <Pill label="Ping" value={`${check.latencyMs}ms`} color="blue" />}
        </div>
      )}

      {check?.byType && Object.keys(check.byType).length > 0 && (
        <div style={{ marginLeft: 32, display: "flex", flexWrap: "wrap", gap: 5 }}>
          {Object.entries(check.byType).map(([type, count]) => (
            <span key={type} style={{
              fontFamily: T.mono, fontSize: 10, background: T.panel,
              border: `0.5px solid ${T.border}`, borderRadius: 6,
              padding: "2px 7px", color: T.muted,
            }}>
              {type}: <span style={{ color: T.ink, fontWeight: 500 }}>{count}</span>
            </span>
          ))}
        </div>
      )}

      {check?.data?.length > 0 && check.data[0]?.name && (
        <div style={{ marginLeft: 32, display: "flex", flexWrap: "wrap", gap: 5 }}>
          {check.data.map((c) => (
            <span key={c.guid || c.name} style={{
              fontFamily: T.title, fontSize: 11, fontWeight: 600,
              background: T.accentL, border: `0.5px solid ${T.accentB}`,
              color: "#1d4ed8", borderRadius: 20, padding: "2px 9px", letterSpacing: "-0.1px",
            }}>
              {c.name}
            </span>
          ))}
        </div>
      )}

      {check?.error && (
        <p style={{
          marginLeft: 32, fontFamily: T.mono, fontSize: 11,
          color: T.red, background: "#fef2f2",
          border: `0.5px solid ${T.redB}`, borderRadius: 8,
          padding: "8px 12px", lineHeight: 1.6,
        }}>
          {check.error}
        </p>
      )}

      {children}
    </div>
  );
}

function Pill({ label, value, color }) {
  const map = {
    blue:  { color: "#1d4ed8", bg: "#dbeafe", border: "#bfdbfe" },
    green: { color: "#15803d", bg: "#dcfce7", border: "#bbf7d0" },
    amber: { color: "#b45309", bg: "#fef3c7", border: "#fde68a" },
  };
  const s = map[color] || map.blue;
  return (
    <span style={{
      fontFamily: T.mono, fontSize: 10,
      border: `0.5px solid ${s.border}`, borderRadius: 6,
      padding: "2px 7px", background: s.bg, color: s.color,
    }}>
      {label}: <span style={{ fontWeight: 500 }}>{value}</span>
    </span>
  );
}