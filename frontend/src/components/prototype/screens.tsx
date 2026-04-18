"use client";

import React, { useState } from "react";
import {
  BODY_STACK,
  Column,
  Display,
  I,
  MacroBar,
  ScoreBadge,
  displayFontFor,
  useTheme,
} from "./atoms";
import {
  COACH_THREAD,
  FOOD_OPTIONS,
  LOGGED,
  MACRO,
  SCHEDULE,
  USER,
  type CoachMessage,
} from "./data";

// ─── Dashboard ────────────────────────────────────────────────
export function Dashboard({ onOpen }: { onOpen: (t: "coach" | "plan") => void }) {
  const theme = useTheme();
  const g = USER.goals, t = USER.today;
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const todayIdx = 5;
  const weekData: Record<string, number[]> = {
    cal: [94, 102, 88, 97, 91, 65, 0],
    p: [88, 96, 82, 99, 92, 60, 0],
    f: [110, 85, 92, 130, 95, 72, 0],
    c: [70, 88, 65, 78, 82, 55, 0],
  };

  return (
    <div style={{ padding: "8px 20px 110px", fontFamily: BODY_STACK }}>
      <div style={{ marginBottom: 6 }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.45)",
          letterSpacing: "0.12em", marginBottom: 6,
        }}>SATURDAY, 18 APRIL · ATLANTA</div>
        <Display size={42}>Dashboard</Display>
      </div>

      {/* Travel context card */}
      <div style={{
        marginTop: 18, padding: "14px 16px", borderRadius: 18,
        background: `linear-gradient(180deg, ${theme.accent}18 0%, rgba(255,255,255,0.03) 100%)`,
        border: `1px solid ${theme.accent}40`,
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: theme.accent, color: "#111",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>{I.sparkle("#111", 20)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 2 }}>
            Lunch in 28 min · Centennial Park
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.4 }}>
            Grown is 4 min walk · fits your macros · protects dinner at ATL
          </div>
        </div>
        <button onClick={() => onOpen("coach")} style={{
          background: "#fff", border: "none", borderRadius: 999,
          padding: "7px 12px", fontSize: 12, fontWeight: 700, color: "#111",
          cursor: "pointer", fontFamily: BODY_STACK, flexShrink: 0,
        }}>Ask coach</button>
      </div>

      {/* Weekly nutrition */}
      <div style={{ marginTop: 22 }}>
        <Display size={22} style={{ textTransform: "none", letterSpacing: "-0.02em", fontWeight: 700 }}>
          Weekly Nutrition
        </Display>
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { key: "cal", color: MACRO.cal, val: t.cal, goal: g.cal, unit: "", icon: I.flame(MACRO.cal, 12) },
            { key: "p", color: MACRO.p, val: t.p, goal: g.p, unit: "P" },
            { key: "f", color: MACRO.f, val: t.f, goal: g.f, unit: "F" },
            { key: "c", color: MACRO.c, val: t.c, goal: g.c, unit: "C" },
          ].map((row) => (
            <div key={row.key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, display: "flex", gap: 4, alignItems: "flex-end" }}>
                {weekData[row.key].map((pct, i) => (
                  <div key={i} style={{
                    flex: 1, position: "relative",
                    outline: i === todayIdx ? "1.5px solid rgba(255,255,255,0.35)" : "none",
                    outlineOffset: 2, borderRadius: 3,
                  }}>
                    <Column pct={pct} color={row.color} dim={pct === 0} h={44} w="100%" />
                  </div>
                ))}
              </div>
              <div style={{ width: 74, textAlign: "right" }}>
                <div style={{
                  fontFamily: displayFontFor(theme.font),
                  fontSize: 20, fontWeight: 700, color: "#fff",
                  letterSpacing: "-0.01em",
                  display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 3,
                }}>
                  {row.val}{row.icon && <span style={{ display: "inline-flex" }}>{row.icon}</span>}
                  {row.unit && <span style={{ fontSize: 13, opacity: 0.7, marginLeft: 2 }}>{row.unit}</span>}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>of {row.goal}</div>
              </div>
            </div>
          ))}
          <div style={{
            display: "flex", justifyContent: "space-between",
            padding: "2px 0", fontSize: 11, color: "rgba(255,255,255,0.45)",
            fontWeight: 600, letterSpacing: "0.08em",
          }}>
            {days.map((d, i) => (
              <div key={i} style={{
                flex: 1, textAlign: "center",
                color: i === todayIdx ? "#fff" : "rgba(255,255,255,0.45)",
              }}>{d}</div>
            ))}
            <div style={{ width: 74 }} />
          </div>
        </div>
        <div style={{
          marginTop: 16, display: "flex",
          background: "rgba(255,255,255,0.06)", borderRadius: 999,
          padding: 3, width: "fit-content", marginLeft: "auto", marginRight: "auto",
        }}>
          <div style={{
            padding: "7px 18px", borderRadius: 999, background: "#fff",
            color: "#111", fontSize: 12, fontWeight: 700,
          }}>Consumed</div>
          <div style={{
            padding: "7px 18px", borderRadius: 999,
            color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600,
          }}>Remaining</div>
        </div>
      </div>

      {/* Next up */}
      <div style={{ marginTop: 28 }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "baseline",
          marginBottom: 10,
        }}>
          <Display size={22} style={{ textTransform: "none", letterSpacing: "-0.02em", fontWeight: 700 }}>
            Next up today
          </Display>
          <button onClick={() => onOpen("plan")} style={{
            background: "none", border: "none", color: "rgba(255,255,255,0.7)",
            fontSize: 12, fontWeight: 600, textDecoration: "underline",
            cursor: "pointer", fontFamily: BODY_STACK,
          }}>Full day</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {SCHEDULE.filter((s) => !s.done).slice(0, 4).map((s, i) => {
            const isMeal = s.kind === "meal";
            const isTravel = s.kind === "travel";
            return (
              <div key={i} onClick={() => isMeal && onOpen("coach")} style={{
                display: "flex", gap: 12, padding: "12px 14px",
                background: isMeal ? `${theme.accent}15` : "rgba(255,255,255,0.04)",
                border: isMeal ? `1px solid ${theme.accent}40` : "1px solid rgba(255,255,255,0.06)",
                borderRadius: 14, cursor: isMeal ? "pointer" : "default",
              }}>
                <div style={{ width: 46, flexShrink: 0 }}>
                  <div style={{
                    fontFamily: displayFontFor(theme.font), fontSize: 18, fontWeight: 700,
                    color: "#fff", letterSpacing: "-0.01em",
                  }}>{s.time}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)" }}>{s.end}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 6, marginBottom: 3,
                  }}>
                    {isMeal && <span style={{ fontSize: 10, fontWeight: 800, color: theme.accent, letterSpacing: "0.1em" }}>MEAL WINDOW</span>}
                    {isTravel && <span style={{ display: "inline-flex", color: "#6B8AFD" }}>{I.plane("#6B8AFD")}</span>}
                    {s.kind === "work" && <span style={{ display: "inline-flex", color: "rgba(255,255,255,0.5)" }}>{I.briefcase("rgba(255,255,255,0.5)")}</span>}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 2 }}>{s.title}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: 4 }}>
                    {I.pin("rgba(255,255,255,0.5)", 11)} {s.loc}
                  </div>
                </div>
                {isMeal && (
                  <div style={{ alignSelf: "center", color: theme.accent }}>
                    {I.chevR(theme.accent, 14)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Insights */}
      <div style={{ marginTop: 28 }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "baseline",
          marginBottom: 10,
        }}>
          <Display size={22} style={{ textTransform: "none", letterSpacing: "-0.02em", fontWeight: 700 }}>
            Insights
          </Display>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", textDecoration: "underline" }}>See all</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <InsightCard title="Expenditure" sub="Last 7 days" value="3034" unit="kcal" color={MACRO.p} trend="up" />
          <InsightCard title="Weight trend" sub="Last 7 days" value="176.6" unit="lbs" color="#B48EF5" trend="down" />
        </div>
      </div>
    </div>
  );
}

function InsightCard({ title, sub, value, unit, color, trend }: {
  title: string; sub: string; value: string; unit: string; color: string; trend: "up" | "down";
}) {
  const theme = useTheme();
  const pts = trend === "up"
    ? [28, 27, 26, 25, 23, 22, 20, 18]
    : [14, 16, 14, 18, 20, 22, 23, 26];
  const path = pts.map((y, i) => `${i === 0 ? "M" : "L"}${i * 14},${y}`).join(" ");
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 14, padding: 12,
    }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{title}</div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>{sub}</div>
      <svg width="100%" height="36" viewBox="0 0 100 36" preserveAspectRatio="none">
        <path d={path} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        {pts.map((y, i) => <circle key={i} cx={i * 14} cy={y} r="1.4" fill={color} />)}
      </svg>
      <div style={{ marginTop: 6, display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{ fontFamily: displayFontFor(theme.font), fontSize: 20, fontWeight: 700, color: "#fff" }}>{value}</span>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{unit}</span>
      </div>
    </div>
  );
}

// ─── Coach screen ─────────────────────────────────────────────
export function CoachScreen({ onClose }: { onClose: () => void }) {
  const theme = useTheme();
  const [input, setInput] = useState("");
  const [thread] = useState<CoachMessage[]>(COACH_THREAD);
  const remaining = {
    cal: USER.goals.cal - USER.today.cal,
    p: USER.goals.p - USER.today.p,
    f: USER.goals.f - USER.today.f,
    c: USER.goals.c - USER.today.c,
  };
  const lunchOpts = FOOD_OPTIONS[0].items;

  return (
    <div style={{
      position: "absolute", inset: 0, background: "#0a0a0a",
      display: "flex", flexDirection: "column", zIndex: 40,
      fontFamily: BODY_STACK,
    }}>
      {/* header */}
      <div style={{
        padding: "54px 16px 12px",
        display: "flex", alignItems: "center", gap: 10,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <button onClick={onClose} style={{
          width: 36, height: 36, borderRadius: 999,
          background: "rgba(255,255,255,0.08)", border: "none",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
        }}>{I.close("#fff", 16)}</button>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: displayFontFor(theme.font), fontSize: 22, fontWeight: 700,
            color: "#fff", letterSpacing: "0.01em", textTransform: "uppercase",
            lineHeight: 1,
          }}>Coach</div>
          <div style={{ fontSize: 11, color: theme.accent, marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: theme.accent, display: "inline-block" }} />
            Live · sees your calendar &amp; macros
          </div>
        </div>
        <div style={{
          padding: "5px 10px", borderRadius: 999,
          background: "rgba(255,255,255,0.06)", fontSize: 11, fontWeight: 600,
          color: "rgba(255,255,255,0.7)",
        }}>{remaining.cal} kcal left</div>
      </div>

      {/* messages */}
      <div style={{
        flex: 1, overflow: "auto", padding: "16px 16px 20px",
        display: "flex", flexDirection: "column", gap: 12,
      }}>
        {thread.map((m, i) => {
          if (m.role === "context") {
            return (
              <div key={i} style={{
                alignSelf: "center", maxWidth: "88%",
                padding: "9px 12px", borderRadius: 10,
                background: "rgba(255,255,255,0.04)",
                border: "1px dashed rgba(255,255,255,0.12)",
                fontSize: 11, color: "rgba(255,255,255,0.65)",
                display: "flex", gap: 6, alignItems: "flex-start",
              }}>
                {I.calendar("rgba(255,255,255,0.5)", 13)}
                <span>{m.text}</span>
              </div>
            );
          }
          if (m.role === "user") {
            return (
              <div key={i} style={{
                alignSelf: "flex-end", maxWidth: "82%",
                padding: "10px 14px", borderRadius: 18,
                background: "#fff", color: "#111",
                fontSize: 14, lineHeight: 1.45, fontWeight: 500,
              }}>{m.text}</div>
            );
          }
          return (
            <div key={i} style={{ alignSelf: "flex-start", maxWidth: "88%" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 6, marginBottom: 6,
                fontSize: 11, fontWeight: 700, color: theme.accent, letterSpacing: "0.08em",
              }}>
                <span style={{ display: "inline-flex" }}>{I.sparkle(theme.accent, 13)}</span>
                COACH
              </div>
              <div style={{
                padding: "12px 14px", borderRadius: 18,
                background: "rgba(255,255,255,0.06)", color: "#fff",
                fontSize: 14, lineHeight: 1.5, whiteSpace: "pre-wrap",
              }}>
                {m.text.split("**").map((seg, j) => j % 2 === 1
                  ? <strong key={j} style={{ color: theme.accent, fontWeight: 700 }}>{seg}</strong>
                  : <span key={j}>{seg}</span>
                )}
              </div>
              {m.suggestions && (
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                  {lunchOpts.slice(0, 2).map((opt, k) => (
                    <div key={k} style={{
                      padding: 12, borderRadius: 14,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      display: "flex", gap: 12, alignItems: "center",
                    }}>
                      <div style={{
                        width: 42, height: 42, borderRadius: 10,
                        background: `${(["cal", "p", "f", "c"] as const)[k] ? MACRO[(["cal", "p", "f", "c"] as const)[k]] : theme.accent}22`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 18,
                      }}>{k === 0 ? "\uD83E\uDD57" : "\uD83C\uDF57"}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          display: "flex", gap: 6, alignItems: "center", marginBottom: 2,
                        }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{opt.name}</span>
                          <ScoreBadge score={opt.score} />
                        </div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>
                          {opt.pick} · {opt.macros.cal} kcal · {opt.macros.p}g P · {opt.eta} away
                        </div>
                      </div>
                      <button style={{
                        background: "#fff", border: "none", borderRadius: 999,
                        padding: "6px 10px", fontSize: 11, fontWeight: 700, color: "#111",
                        cursor: "pointer", fontFamily: BODY_STACK,
                      }}>Log</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* quick prompts */}
      <div style={{
        padding: "0 16px 10px", display: "flex", gap: 8, overflow: "auto",
      }}>
        {[
          "What's near me?",
          "Skip lunch — is that ok?",
          "Airport dinner options",
          "Cut fat today",
        ].map((q, i) => (
          <button key={i} onClick={() => setInput(q)} style={{
            flexShrink: 0, background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.08)", color: "#fff",
            padding: "7px 12px", borderRadius: 999, fontSize: 12, fontWeight: 500,
            cursor: "pointer", fontFamily: BODY_STACK,
          }}>{q}</button>
        ))}
      </div>

      {/* composer */}
      <div style={{
        padding: "10px 14px 30px", borderTop: "1px solid rgba(255,255,255,0.06)",
        display: "flex", gap: 8, alignItems: "center", background: "#0a0a0a",
      }}>
        <div style={{
          flex: 1, background: "rgba(255,255,255,0.06)", borderRadius: 999,
          padding: "10px 14px", display: "flex", alignItems: "center", gap: 8,
          border: "1px solid rgba(255,255,255,0.08)",
        }}>
          <input
            value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about this moment…"
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              color: "#fff", fontSize: 14, fontFamily: BODY_STACK,
            }}
          />
          {I.mic("rgba(255,255,255,0.5)", 16)}
        </div>
        <button style={{
          width: 42, height: 42, borderRadius: 999, background: theme.accent,
          border: "none", display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: "#111",
        }}>{I.send("#111", 18)}</button>
      </div>
    </div>
  );
}

// ─── Plan screen ──────────────────────────────────────────────
export function PlanScreen() {
  const theme = useTheme();

  return (
    <div style={{ padding: "8px 20px 110px", fontFamily: BODY_STACK }}>
      <div>
        <div style={{
          fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.45)",
          letterSpacing: "0.12em", marginBottom: 6,
        }}>SAT 18 APR · ATL → DCA</div>
        <Display size={42}>Plan</Display>
        <div style={{
          marginTop: 6, fontSize: 13, color: "rgba(255,255,255,0.6)",
          lineHeight: 1.5, maxWidth: 320,
        }}>
          Your eating windows, routed around today&apos;s calendar.
        </div>
      </div>

      {/* Day summary */}
      <div style={{
        marginTop: 16, padding: 14, borderRadius: 16,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between", marginBottom: 8,
          fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600,
          letterSpacing: "0.08em",
        }}>
          <span>REMAINING TODAY</span>
          <span>{USER.goals.cal - USER.today.cal} / {USER.goals.cal} kcal</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {[
            { label: "Cal", key: "cal" as const, val: USER.goals.cal - USER.today.cal, color: MACRO.cal },
            { label: "P", key: "p" as const, val: USER.goals.p - USER.today.p, color: MACRO.p },
            { label: "F", key: "f" as const, val: USER.goals.f - USER.today.f, color: MACRO.f },
            { label: "C", key: "c" as const, val: USER.goals.c - USER.today.c, color: MACRO.c },
          ].map((m, i) => (
            <div key={i}>
              <div style={{
                fontFamily: displayFontFor(theme.font), fontSize: 18, fontWeight: 700, color: "#fff",
              }}>{m.val}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginBottom: 3, letterSpacing: "0.08em", fontWeight: 600 }}>{m.label.toUpperCase()}</div>
              <MacroBar pct={(USER.today[m.key] / USER.goals[m.key]) * 100} color={m.color} />
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div style={{ marginTop: 22, position: "relative" }}>
        <div style={{
          position: "absolute", left: 40, top: 6, bottom: 6,
          width: 1, background: "rgba(255,255,255,0.08)",
        }} />

        {SCHEDULE.map((s, i) => {
          const isMeal = s.kind === "meal";
          const isPast = s.done;
          const opts = isMeal ? FOOD_OPTIONS[s.time === "13:15" ? 0 : 1] : null;
          return (
            <div key={i} style={{
              display: "flex", gap: 14, marginBottom: isMeal ? 18 : 14,
              opacity: isPast ? 0.4 : 1,
            }}>
              <div style={{ width: 46, flexShrink: 0, paddingTop: 6 }}>
                <div style={{
                  fontFamily: displayFontFor(theme.font), fontSize: 15, fontWeight: 700,
                  color: "#fff",
                }}>{s.time}</div>
              </div>
              <div style={{ position: "relative", width: 0, flexShrink: 0 }}>
                <div style={{
                  position: "absolute", left: -5, top: 8,
                  width: 10, height: 10, borderRadius: 999,
                  background: isMeal ? theme.accent : isPast ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.5)",
                  border: "2px solid #0a0a0a",
                }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                {!isMeal || !opts ? (
                  <div style={{ paddingTop: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>
                      {s.title}
                      {s.kind === "travel" && <span style={{ color: "#6B8AFD", marginLeft: 6, display: "inline-flex", verticalAlign: "middle" }}>{I.plane("#6B8AFD")}</span>}
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 1 }}>
                      {s.loc} · until {s.end}
                    </div>
                  </div>
                ) : (
                  <div style={{
                    background: `${theme.accent}12`,
                    border: `1px solid ${theme.accent}40`,
                    borderRadius: 16, padding: 14,
                  }}>
                    <div style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      marginBottom: 4,
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: theme.accent, letterSpacing: "0.12em" }}>
                        {opts.where.split("·")[0].toUpperCase()}
                      </div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{s.time} – {s.end}</div>
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 10 }}>
                      {opts.whereSub}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {opts.items.slice(0, 3).map((opt, k) => (
                        <div key={k} style={{
                          display: "flex", gap: 10, alignItems: "center",
                          padding: "8px 10px", borderRadius: 10,
                          background: "rgba(255,255,255,0.03)",
                        }}>
                          <ScoreBadge score={opt.score} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>
                              {opt.name}
                              <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 400, fontSize: 11, marginLeft: 6 }}>
                                {opt.eta}
                              </span>
                            </div>
                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
                              {opt.pick} · {opt.macros.cal} kcal
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Log screen ───────────────────────────────────────────────
export function LogScreen() {
  const theme = useTheme();
  return (
    <div style={{ padding: "8px 20px 110px", fontFamily: BODY_STACK }}>
      <div>
        <div style={{
          fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.45)",
          letterSpacing: "0.12em", marginBottom: 6,
        }}>SATURDAY, 18 APRIL</div>
        <Display size={42}>Food log</Display>
      </div>

      <div style={{
        marginTop: 16, padding: "14px 16px", borderRadius: 16,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.06)",
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10,
      }}>
        {[
          { label: "Cal", val: USER.today.cal, color: MACRO.cal, icon: I.flame(MACRO.cal, 11) },
          { label: "P", val: USER.today.p, color: MACRO.p, icon: null },
          { label: "F", val: USER.today.f, color: MACRO.f, icon: null },
          { label: "C", val: USER.today.c, color: MACRO.c, icon: null },
        ].map((m, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={{
              fontFamily: displayFontFor(theme.font), fontSize: 20, fontWeight: 700, color: "#fff",
              display: "inline-flex", alignItems: "center", gap: 3,
            }}>{m.val}{m.icon}</div>
            <div style={{
              fontSize: 10, color: m.color, marginTop: 2, fontWeight: 700,
              letterSpacing: "0.08em",
            }}>{m.label.toUpperCase()}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 8 }}>
        {LOGGED.map((m, i) => (
          <div key={i} style={{
            display: "flex", gap: 12, padding: 12,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 14, alignItems: "center",
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: "rgba(255,255,255,0.06)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22,
            }}>{m.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", lineHeight: 1.3 }}>{m.name}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
                {m.time} · {m.loc}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 4, display: "flex", gap: 10 }}>
                <span>{m.macros.cal} kcal</span>
                <span style={{ color: MACRO.p }}>{m.macros.p}P</span>
                <span style={{ color: MACRO.f }}>{m.macros.f}F</span>
                <span style={{ color: MACRO.c }}>{m.macros.c}C</span>
              </div>
            </div>
            {m.src === "photo" && (
              <div style={{
                fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.5)",
                letterSpacing: "0.08em", alignSelf: "flex-start",
                padding: "3px 7px", borderRadius: 999,
                background: "rgba(255,255,255,0.06)",
              }}>📸 PHOTO</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── More screen ──────────────────────────────────────────────
export function MoreScreen() {
  const theme = useTheme();
  return (
    <div style={{ padding: "8px 20px 110px", fontFamily: BODY_STACK }}>
      <div>
        <div style={{
          fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.45)",
          letterSpacing: "0.12em", marginBottom: 6,
        }}>MAYA CHEN · NBC NEWS</div>
        <Display size={42}>More</Display>
      </div>

      <div style={{
        marginTop: 16, padding: 16, borderRadius: 16,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 999,
          background: `linear-gradient(135deg, ${theme.accent} 0%, #B8391A 100%)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, fontWeight: 800, color: "#fff",
        }}>MC</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>Maya Chen</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>National Correspondent · Atlanta bureau</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>182 days on the road this year</div>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.5)", marginBottom: 10 }}>TRAVEL NUTRITION</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { v: "78%", l: "On-target days", sub: "last 30 days", c: MACRO.c },
            { v: "43", l: "Airport meals", sub: "this year", c: "#6B8AFD" },
            { v: "12", l: "Cities", sub: "past 90 days", c: theme.accent },
            { v: "-4.1", l: "lbs", sub: "since Jan", c: "#B48EF5" },
          ].map((s, i) => (
            <div key={i} style={{
              padding: 14, borderRadius: 14,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <div style={{ fontFamily: displayFontFor(theme.font), fontSize: 32, fontWeight: 700, color: s.c, letterSpacing: "0.01em" }}>{s.v}</div>
              <div style={{ fontSize: 12, color: "#fff", fontWeight: 600 }}>{s.l}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.5)", marginBottom: 10 }}>SETTINGS</div>
        <div style={{
          background: "rgba(255,255,255,0.04)", borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden",
        }}>
          {["Connect calendar", "Dietary restrictions", "Travel profile", "Goals & macros", "Notifications"].map((label, i, arr) => (
            <div key={label} style={{
              display: "flex", alignItems: "center", padding: "14px 16px",
              borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
              fontSize: 14, color: "#fff", fontWeight: 500,
            }}>
              <span style={{ flex: 1 }}>{label}</span>
              {I.chevR("rgba(255,255,255,0.3)", 12)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
