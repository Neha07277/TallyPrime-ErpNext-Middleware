import { useLogs } from "../hooks/useLogs";

// ── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:       "#0a0c10",
  surface:  "#111318",
  card:     "#161b22",
  border:   "#21262d",
  borderL:  "#30363d",
  ink:      "#e6edf3",
  muted:    "#7d8590",
  dimmed:   "#484f58",
  accent:   "#2f81f7",
  accentL:  "#1f3d6e",
  green:    "#3fb950",
  greenL:   "#0d2c1a",
  amber:    "#d29922",
  amberL:   "#2d1f00",
  red:      "#f85149",
  redL:     "#2d0f0e",
  mono:     "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
  sans:     "'DM Sans', 'Plus Jakarta Sans', sans-serif",
};

const LEVEL = {
  info:    { color: C.muted,  bg: "transparent",        tag: "·", tagColor: C.dimmed },
  success: { color: C.green,  bg: C.greenL + "cc",      tag: "✓", tagColor: C.green  },
  warn:    { color: C.amber,  bg: C.amberL + "cc",      tag: "⚠", tagColor: C.amber  },
  error:   { color: C.red,    bg: C.redL   + "cc",      tag: "✗", tagColor: C.red    },
};

// Counts per level
function useCounts(logs) {
  return logs.reduce((acc, l) => {
    acc[l.level] = (acc[l.level] || 0) + 1;
    return acc;
  }, {});
}

export function LiveLogs() {
  const logs   = useLogs(true, 2000);   // ← unchanged
  const counts = useCounts(logs);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, fontFamily: C.sans }}>
      <style>{`
        @keyframes ll-pulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:.35; transform:scale(.8); }
        }
        @keyframes ll-row-in {
          from { opacity:0; transform:translateX(-6px); }
          to   { opacity:1; transform:translateX(0); }
        }
        @keyframes ll-badge-pop {
          0%   { transform:scale(.88); opacity:0; }
          100% { transform:scale(1);   opacity:1; }
        }
        .ll-row { animation: ll-row-in .18s ease; }
        .ll-row:hover { background: rgba(255,255,255,.035) !important; }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:3, height:20, background:`linear-gradient(180deg,${C.accent},${C.green})`, borderRadius:2 }}/>
          <div>
            <h2 style={{ fontFamily:C.sans, fontWeight:700, fontSize:15, color:C.ink, letterSpacing:"-0.4px", margin:0 }}>
              Live Logs
            </h2>
            <p style={{ fontFamily:C.mono, fontSize:9, color:C.muted, margin:0, letterSpacing:"0.08em" }}>
              middleware output stream
            </p>
          </div>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {/* Level counters */}
          {[
            { key:"error",   color:C.red,   bg:C.redL   },
            { key:"warn",    color:C.amber, bg:C.amberL },
            { key:"success", color:C.green, bg:C.greenL },
          ].map(({ key, color, bg }) => counts[key] > 0 && (
            <span key={key} style={{
              fontFamily:C.mono, fontSize:9, fontWeight:600,
              color, background:bg, border:`1px solid ${color}44`,
              padding:"3px 8px", borderRadius:20,
              animation:"ll-badge-pop .2s ease",
            }}>
              {counts[key]}
            </span>
          ))}

          {/* Total count */}
          <span style={{ fontFamily:C.mono, fontSize:10, color:C.dimmed }}>
            {logs.length} entries
          </span>

          {/* Live pill */}
          <span style={{
            display:"flex", alignItems:"center", gap:5,
            fontFamily:C.mono, fontSize:9, fontWeight:600,
            color:C.accent, background:C.accentL,
            border:`1px solid ${C.accent}55`,
            padding:"4px 10px", borderRadius:20,
            letterSpacing:"0.12em", textTransform:"uppercase",
          }}>
            <span style={{
              width:6, height:6, borderRadius:"50%",
              background:C.accent,
              animation:"ll-pulse 1.4s ease-in-out infinite",
              display:"inline-block",
            }}/>
            Live
          </span>
        </div>
      </div>

      {/* ── Terminal window ─────────────────────────────────────────────────── */}
      <div style={{
        background:C.card,
        border:`1px solid ${C.border}`,
        borderRadius:14,
        overflow:"hidden",
        boxShadow:"0 0 0 1px #ffffff08, 0 8px 32px #00000060",
      }}>
        {/* Title bar */}
        <div style={{
          background:C.surface,
          borderBottom:`1px solid ${C.border}`,
          padding:"10px 16px",
          display:"flex", alignItems:"center", gap:0,
        }}>
          {/* Traffic lights */}
          <div style={{ display:"flex", gap:6, marginRight:14 }}>
            {[C.red, C.amber, C.green].map((c) => (
              <span key={c} style={{
                width:10, height:10, borderRadius:"50%",
                background:c, opacity:0.6,
                display:"inline-block",
                boxShadow:`0 0 6px ${c}66`,
              }}/>
            ))}
          </div>
          <span style={{ fontFamily:C.mono, fontSize:9, color:C.dimmed, letterSpacing:"0.12em", textTransform:"uppercase", flex:1, textAlign:"center" }}>
            middleware.log
          </span>
          {/* Right-side encoding note */}
          <span style={{ fontFamily:C.mono, fontSize:9, color:C.dimmed }}>UTF-8</span>
        </div>

        {/* Gutter + log rows */}
        <div style={{
          height:480, overflowY:"auto",
          padding:"6px 0",
          display:"flex", flexDirection:"column", gap:0,
          background:C.bg,
          // Custom scrollbar
          scrollbarWidth:"thin",
          scrollbarColor:`${C.borderL} transparent`,
        }}>
          {logs.length === 0 ? (
            <div style={{
              display:"flex", flexDirection:"column",
              alignItems:"center", justifyContent:"center",
              height:"100%", gap:14,
            }}>
              <div style={{
                width:48, height:48, borderRadius:12,
                background:C.surface, border:`1px solid ${C.border}`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:22,
              }}>📋</div>
              <div style={{ textAlign:"center" }}>
                <p style={{ fontFamily:C.mono, fontSize:11, color:C.muted, margin:0 }}>
                  No logs yet
                </p>
                <p style={{ fontFamily:C.mono, fontSize:10, color:C.dimmed, margin:"4px 0 0" }}>
                  Run a middleware check to see output
                </p>
              </div>
            </div>
          ) : (
            logs.map((log, idx) => {
              const lvl = LEVEL[log.level] || LEVEL.info;
              return (
                <div
                  key={log.id}
                  className="ll-row"
                  style={{
                    display:"flex", alignItems:"flex-start", gap:0,
                    padding:"3px 0",
                    background: lvl.bg,
                    borderLeft: log.level !== "info"
                      ? `2px solid ${lvl.color}66`
                      : "2px solid transparent",
                    transition:"background 0.1s",
                  }}
                >
                  {/* Line number gutter */}
                  <span style={{
                    fontFamily:C.mono, fontSize:10,
                    color:C.dimmed, flexShrink:0,
                    width:38, textAlign:"right",
                    paddingRight:12, paddingTop:1,
                    userSelect:"none",
                    letterSpacing:0,
                    fontVariantNumeric:"tabular-nums",
                  }}>
                    {String(idx + 1).padStart(3, " ")}
                  </span>

                  {/* Timestamp */}
                  <span style={{
                    fontFamily:C.mono, fontSize:10,
                    color:C.dimmed, flexShrink:0,
                    paddingRight:10, paddingTop:1,
                    fontVariantNumeric:"tabular-nums",
                    minWidth:62,
                  }}>
                    {new Date(log.ts).toLocaleTimeString("en-IN", { hour12:false })}
                  </span>

                  {/* Level tag */}
                  <span style={{
                    fontFamily:C.mono, fontSize:11,
                    fontWeight:700, color:lvl.tagColor,
                    flexShrink:0, width:14,
                    paddingRight:10, paddingTop:1,
                  }}>
                    {lvl.tag}
                  </span>

                  {/* Message */}
                  <span style={{
                    fontFamily:C.mono, fontSize:11,
                    color: log.level === "info" ? C.ink : lvl.color,
                    flex:1, lineHeight:1.65,
                    wordBreak:"break-all",
                    paddingRight:16,
                    opacity: log.level === "info" ? 0.75 : 1,
                  }}>
                    {log.message}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Status bar */}
        <div style={{
          background:C.surface,
          borderTop:`1px solid ${C.border}`,
          padding:"5px 16px",
          display:"flex", alignItems:"center", justifyContent:"space-between",
        }}>
          <div style={{ display:"flex", gap:16 }}>
            {[
              { key:"error",   label:"Errors",   color:C.red   },
              { key:"warn",    label:"Warnings", color:C.amber },
              { key:"success", label:"OK",       color:C.green },
            ].map(({ key, label, color }) => (
              <span key={key} style={{ fontFamily:C.mono, fontSize:9, color: counts[key] > 0 ? color : C.dimmed }}>
                {label}: {counts[key] || 0}
              </span>
            ))}
          </div>
          <span style={{ fontFamily:C.mono, fontSize:9, color:C.dimmed }}>
            {logs.length} lines total
          </span>
        </div>
      </div>
    </div>
  );
}