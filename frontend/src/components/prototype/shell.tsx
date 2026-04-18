"use client";

import React, { useState } from "react";
import { BODY_STACK, I, Theme, displayFontFor, useTheme } from "./atoms";

export function IOSStatusBar({ dark = false, time = "9:41" }: { dark?: boolean; time?: string }) {
  const c = dark ? "#fff" : "#000";
  return (
    <div style={{
      display: "flex", gap: 154, alignItems: "center", justifyContent: "center",
      padding: "21px 24px 19px", boxSizing: "border-box",
      position: "relative", zIndex: 20, width: "100%",
    }}>
      <div style={{ flex: 1, height: 22, display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 1.5 }}>
        <span style={{
          fontFamily: '-apple-system, "SF Pro", system-ui', fontWeight: 590,
          fontSize: 17, lineHeight: "22px", color: c,
        }}>{time}</span>
      </div>
      <div style={{ flex: 1, height: 22, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, paddingTop: 1, paddingRight: 1 }}>
        <svg width="19" height="12" viewBox="0 0 19 12">
          <rect x="0" y="7.5" width="3.2" height="4.5" rx="0.7" fill={c} />
          <rect x="4.8" y="5" width="3.2" height="7" rx="0.7" fill={c} />
          <rect x="9.6" y="2.5" width="3.2" height="9.5" rx="0.7" fill={c} />
          <rect x="14.4" y="0" width="3.2" height="12" rx="0.7" fill={c} />
        </svg>
        <svg width="17" height="12" viewBox="0 0 17 12">
          <path d="M8.5 3.2C10.8 3.2 12.9 4.1 14.4 5.6L15.5 4.5C13.7 2.7 11.2 1.5 8.5 1.5C5.8 1.5 3.3 2.7 1.5 4.5L2.6 5.6C4.1 4.1 6.2 3.2 8.5 3.2Z" fill={c} />
          <path d="M8.5 6.8C9.9 6.8 11.1 7.3 12 8.2L13.1 7.1C11.8 5.9 10.2 5.1 8.5 5.1C6.8 5.1 5.2 5.9 3.9 7.1L5 8.2C5.9 7.3 7.1 6.8 8.5 6.8Z" fill={c} />
          <circle cx="8.5" cy="10.5" r="1.5" fill={c} />
        </svg>
        <svg width="27" height="13" viewBox="0 0 27 13">
          <rect x="0.5" y="0.5" width="23" height="12" rx="3.5" stroke={c} strokeOpacity="0.35" fill="none" />
          <rect x="2" y="2" width="20" height="9" rx="2" fill={c} />
          <path d="M25 4.5V8.5C25.8 8.2 26.5 7.2 26.5 6.5C26.5 5.8 25.8 4.8 25 4.5Z" fill={c} fillOpacity="0.4" />
        </svg>
      </div>
    </div>
  );
}

export type TabId = "dashboard" | "log" | "plan" | "more";

export function TabBar({ active, onChange, onFab }: {
  active: TabId;
  onChange: (t: TabId) => void;
  onFab: () => void;
}) {
  const tabs: Array<{ id: TabId | "fab"; label?: string; icon?: (c?: string, s?: number) => React.ReactElement }> = [
    { id: "dashboard", label: "Dashboard", icon: I.dashboard },
    { id: "log", label: "Food Log", icon: I.log },
    { id: "fab" },
    { id: "plan", label: "Plan", icon: I.plan },
    { id: "more", label: "More", icon: I.more },
  ];
  return (
    <div style={{
      position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 30,
      paddingBottom: 30, paddingTop: 6,
      background: "linear-gradient(180deg, rgba(10,10,10,0) 0%, #0a0a0a 35%)",
    }}>
      <div style={{ padding: "0 16px 10px" }}>
        <div style={{
          height: 44, borderRadius: 999, background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.08)",
          display: "flex", alignItems: "center", padding: "0 14px", gap: 8,
        }}>
          {I.search("rgba(255,255,255,0.5)", 16)}
          <input placeholder="Search for a food" style={{
            flex: 1, background: "transparent", border: "none", outline: "none",
            color: "#fff", fontSize: 14, fontFamily: BODY_STACK,
          }} />
          {I.barcode("rgba(255,255,255,0.5)", 18)}
        </div>
      </div>

      <div style={{
        display: "flex", justifyContent: "space-around", alignItems: "center",
        padding: "0 8px", position: "relative",
      }}>
        {tabs.map((t) => {
          if (t.id === "fab") {
            return (
              <button key="fab" onClick={onFab} style={{
                width: 54, height: 54, borderRadius: 999,
                background: "#fff", color: "#111", border: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", marginTop: -12,
                boxShadow: "0 6px 20px rgba(255,255,255,0.12), 0 2px 6px rgba(0,0,0,0.4)",
              }}>{I.plus("#111", 26)}</button>
            );
          }
          const isActive = active === t.id;
          return (
            <button key={t.id} onClick={() => onChange(t.id as TabId)} style={{
              background: "none", border: "none", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              padding: "6px 8px", color: isActive ? "#fff" : "rgba(255,255,255,0.5)",
              minWidth: 60,
            }}>
              {t.icon!(isActive ? "#fff" : "rgba(255,255,255,0.5)", 22)}
              <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500, fontFamily: BODY_STACK }}>
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function LogSheet({ onClose }: { onClose: () => void }) {
  const theme = useTheme();
  const [stage, setStage] = useState<"menu" | "photo">("menu");

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 50,
      display: "flex", alignItems: "flex-end",
      background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "#121212", width: "100%",
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: "10px 20px 40px", fontFamily: BODY_STACK,
      }}>
        <div style={{
          width: 40, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)",
          margin: "2px auto 16px",
        }} />

        {stage === "menu" && (
          <>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              marginBottom: 14,
            }}>
              <div style={{
                fontFamily: displayFontFor(theme.font), fontSize: 22, fontWeight: 700,
                color: "#fff", letterSpacing: "0.01em", textTransform: "uppercase",
              }}>Log a meal</div>
              <button onClick={onClose} style={{
                background: "rgba(255,255,255,0.08)", border: "none",
                width: 30, height: 30, borderRadius: 999, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{I.close("#fff", 14)}</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              <OptBlock onClick={() => setStage("photo")} icon="📸" title="Photo + describe" sub="AI estimates macros" accent={theme.accent} />
              <OptBlock icon="🎙️" title="Tell coach" sub="Voice or text" />
              <OptBlock icon="🔍" title="Search" sub="Restaurant + brands" />
              <OptBlock icon="⚡" title="Quick add" sub="Just macros" />
            </div>

            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.45)", letterSpacing: "0.1em", marginBottom: 8 }}>
              RECENT · ON THE ROAD
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { icon: "☕", name: "Cold brew + protein bar", loc: "Starbucks, CNN Center", cal: 280 },
                { icon: "🥪", name: "Turkey wrap", loc: "Bureau kitchen", cal: 620 },
                { icon: "🥗", name: "Cat Cora — Salmon plate", loc: "ATL Concourse B", cal: 640 },
              ].map((r, i) => (
                <div key={i} style={{
                  display: "flex", gap: 10, padding: "10px 12px",
                  background: "rgba(255,255,255,0.04)", borderRadius: 12,
                  alignItems: "center",
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, fontSize: 16,
                    background: "rgba(255,255,255,0.06)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>{r.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: "#fff", fontWeight: 600 }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{r.loc}</div>
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{r.cal} kcal</div>
                </div>
              ))}
            </div>
          </>
        )}

        {stage === "photo" && (
          <>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14,
            }}>
              <button onClick={() => setStage("menu")} style={{
                background: "rgba(255,255,255,0.08)", border: "none",
                width: 30, height: 30, borderRadius: 999, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{I.chevL("#fff", 14)}</button>
              <div style={{
                fontFamily: displayFontFor(theme.font), fontSize: 18, fontWeight: 700, color: "#fff",
                letterSpacing: "0.01em", textTransform: "uppercase",
              }}>Photo estimate</div>
              <div style={{ width: 30 }} />
            </div>

            <div style={{
              borderRadius: 16, overflow: "hidden", position: "relative",
              aspectRatio: "4/3",
              background: "linear-gradient(135deg, #3a2a1a 0%, #5a3820 50%, #2a1a10 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 80,
            }}>
              🥗
              <div style={{
                position: "absolute", top: 10, left: 10,
                padding: "4px 9px", borderRadius: 999,
                background: "rgba(0,0,0,0.6)", color: "#fff",
                fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                display: "flex", alignItems: "center", gap: 4,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: theme.accent }} />
                ANALYZING
              </div>
            </div>

            <div style={{
              marginTop: 14, padding: 14, borderRadius: 14,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Harvest chicken bowl</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Grown · estimated from photo</div>
                </div>
                <div style={{
                  padding: "3px 8px", borderRadius: 999,
                  background: "#55C08C22", color: "#55C08C",
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                }}>HIGH CONFIDENCE</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                {[
                  { val: "580", label: "kcal", c: "#6B8AFD" },
                  { val: "42g", label: "P", c: "#E25D2C" },
                  { val: "18g", label: "F", c: "#F5C54B" },
                  { val: "58g", label: "C", c: "#55C08C" },
                ].map((m, i) => (
                  <div key={i}>
                    <div style={{ fontFamily: displayFontFor(theme.font), fontSize: 22, fontWeight: 700, color: "#fff" }}>{m.val}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: m.c, letterSpacing: "0.08em" }}>{m.label.toUpperCase()}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button style={{
                flex: 1, background: "rgba(255,255,255,0.08)", border: "none",
                color: "#fff", padding: "12px", borderRadius: 12,
                fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: BODY_STACK,
              }}>Adjust</button>
              <button style={{
                flex: 2, background: "#fff", border: "none",
                color: "#111", padding: "12px", borderRadius: 12,
                fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: BODY_STACK,
              }}>Log at 13:20 · Centennial Park</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function OptBlock({ icon, title, sub, onClick, accent }: {
  icon: string; title: string; sub: string; onClick?: () => void; accent?: string;
}) {
  return (
    <button onClick={onClick} style={{
      background: accent ? `${accent}15` : "rgba(255,255,255,0.04)",
      border: accent ? `1px solid ${accent}50` : "1px solid rgba(255,255,255,0.06)",
      borderRadius: 14, padding: 14, textAlign: "left", cursor: "pointer",
      fontFamily: BODY_STACK, color: "#fff",
    }}>
      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 13, fontWeight: 700 }}>{title}</div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>{sub}</div>
    </button>
  );
}

export function TweaksPanel({ theme, setTheme, onClose }: {
  theme: Theme; setTheme: (t: Theme) => void; onClose: () => void;
}) {
  const accents = [
    { name: "Wire Orange", val: "#E25D2C" },
    { name: "Broadcast Red", val: "#E33B3B" },
    { name: "Beltway Green", val: "#4FA87A" },
    { name: "Press Blue", val: "#3F7BE3" },
    { name: "Prime Amber", val: "#E8A83B" },
  ];
  return (
    <div style={{
      position: "fixed", bottom: 16, right: 16, zIndex: 200,
      width: 240, background: "#1a1a1a", borderRadius: 14,
      border: "1px solid rgba(255,255,255,0.1)",
      padding: 14, fontFamily: BODY_STACK, color: "#fff",
      boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 10,
      }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em" }}>TWEAKS</div>
        <button onClick={onClose} style={{
          background: "none", border: "none", color: "rgba(255,255,255,0.6)",
          cursor: "pointer", padding: 0,
        }}>{I.close("rgba(255,255,255,0.6)", 14)}</button>
      </div>

      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginBottom: 6, fontWeight: 600 }}>ACCENT</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        {accents.map((a) => (
          <button key={a.val} onClick={() => setTheme({ ...theme, accent: a.val })}
            title={a.name}
            style={{
              width: 28, height: 28, borderRadius: 999, background: a.val,
              border: theme.accent === a.val ? "2px solid #fff" : "2px solid rgba(255,255,255,0.1)",
              cursor: "pointer", padding: 0,
            }}
          />
        ))}
      </div>

      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginBottom: 6, fontWeight: 600 }}>DISPLAY TYPE</div>
      <div style={{ display: "flex", gap: 6 }}>
        {(["condensed", "clean"] as const).map((f) => (
          <button key={f} onClick={() => setTheme({ ...theme, font: f })} style={{
            flex: 1, padding: "8px", borderRadius: 10,
            background: theme.font === f ? "#fff" : "rgba(255,255,255,0.06)",
            color: theme.font === f ? "#111" : "#fff",
            border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700,
            fontFamily: f === "condensed" ? '"Barlow Condensed", sans-serif' : '"Space Grotesk", sans-serif',
            textTransform: f === "condensed" ? "uppercase" : "none",
            letterSpacing: f === "condensed" ? "0.05em" : 0,
          }}>{f === "condensed" ? "Condensed" : "Clean"}</button>
        ))}
      </div>
    </div>
  );
}
