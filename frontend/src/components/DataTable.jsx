import { useState } from "react";

const T = {
  ink: "#0f1117", muted: "#7c7f8e", border: "#e2e4ec", panel: "#f5f6fa",
  accent: "#2563eb",
  mono:  "'IBM Plex Mono', monospace",
  title: "'Syne', sans-serif",
};

export function DataTable({ title, rows, columns }) {
  const [open, setOpen] = useState(false);
  if (!rows || rows.length === 0) return null;

  const preview = rows.slice(0, 5);

  return (
    <div style={{ marginLeft: 32, marginTop: 4 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          background: "none", border: "none", cursor: "pointer", padding: 0,
          display: "flex", alignItems: "center", gap: 6,
          fontFamily: T.mono, fontSize: 10, color: T.muted,
          transition: "color 0.12s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = T.accent; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = T.muted; }}
      >
        <span style={{
          display: "inline-block", fontSize: 9, lineHeight: 1,
          transition: "transform 0.2s", transform: open ? "rotate(90deg)" : "rotate(0deg)",
        }}>▶</span>
        <span style={{ textDecoration: "underline", textUnderlineOffset: 2 }}>
          {open ? "Hide" : "Preview"} sample ({Math.min(rows.length, 5)} of {rows.length} rows)
        </span>
      </button>

      {open && (
        <div style={{
          marginTop: 8, overflowX: "auto", borderRadius: 10,
          border: `0.5px solid ${T.border}`,
          animation: "dt-fade 0.15s ease-out",
        }}>
          <table style={{ width: "100%", fontFamily: T.mono, fontSize: 11, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: T.panel, borderBottom: `0.5px solid ${T.border}` }}>
                {columns.map((c) => (
                  <th key={c.key} style={{
                    textAlign: "left", padding: "7px 10px",
                    color: T.muted, fontWeight: 500,
                    fontSize: 9, letterSpacing: "0.1em",
                    textTransform: "uppercase", whiteSpace: "nowrap",
                  }}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.map((row, i) => (
                <tr key={i} style={{ borderBottom: i < preview.length - 1 ? `0.5px solid ${T.border}` : "none" }}>
                  {columns.map((c) => (
                    <td key={c.key} style={{
                      padding: "6px 10px", color: T.ink,
                      maxWidth: 160, overflow: "hidden",
                      textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {c.render ? c.render(row[c.key], row) : (row[c.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > 5 && (
            <div style={{ padding: "5px 10px", borderTop: `0.5px solid ${T.border}`, background: T.panel }}>
              <span style={{ fontFamily: T.mono, fontSize: 9, color: T.muted }}>
                +{rows.length - 5} more rows not shown
              </span>
            </div>
          )}
        </div>
      )}
      <style>{`@keyframes dt-fade { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}