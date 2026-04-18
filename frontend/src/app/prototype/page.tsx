"use client";

import React, { useEffect, useState } from "react";
import {
  DEFAULT_THEME,
  Theme,
  ThemeCtx,
} from "@/components/prototype/atoms";
import {
  CoachScreen,
  Dashboard,
  LogScreen,
  MoreScreen,
  PlanScreen,
} from "@/components/prototype/screens";
import {
  IOSStatusBar,
  LogSheet,
  TabBar,
  type TabId,
  TweaksPanel,
} from "@/components/prototype/shell";

const DEVICE_W = 402;
const DEVICE_H = 874;

export default function PrototypePage() {
  const [tab, setTab] = useState<TabId>("dashboard");
  const [coachOpen, setCoachOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [tweaksVisible, setTweaksVisible] = useState(false);
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("nc_theme");
      if (saved) setTheme({ ...DEFAULT_THEME, ...JSON.parse(saved) });
      const savedTab = localStorage.getItem("nc_tab") as TabId | null;
      if (savedTab) setTab(savedTab);
    } catch {}
  }, []);

  useEffect(() => { localStorage.setItem("nc_tab", tab); }, [tab]);
  useEffect(() => { localStorage.setItem("nc_theme", JSON.stringify(theme)); }, [theme]);

  useEffect(() => {
    const fit = () => {
      const sw = window.innerWidth - 40;
      const sh = window.innerHeight - 40;
      setScale(Math.min(sw / DEVICE_W, sh / DEVICE_H, 1));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  const openCoach = (t: "coach" | "plan") => {
    if (t === "coach") setCoachOpen(true);
    else setTab("plan");
  };

  let screen: React.ReactNode = null;
  if (tab === "dashboard") screen = <Dashboard onOpen={openCoach} />;
  else if (tab === "plan") screen = <PlanScreen />;
  else if (tab === "log") screen = <LogScreen />;
  else if (tab === "more") screen = <MoreScreen />;

  return (
    <ThemeCtx.Provider value={theme}>
      <style>{`
        body:has(.nc-prototype-root) { padding-top: 0 !important; overflow: hidden; background: #0a0a0a; }
        body:has(.nc-prototype-root) .nav { display: none !important; }
        .nc-prototype-root {
          position: fixed; inset: 0; width: 100vw; height: 100vh;
          background: #0a0a0a; color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Inter', -apple-system, sans-serif;
          overflow: hidden; z-index: 1;
        }
        .nc-prototype-root *::-webkit-scrollbar { width: 0; height: 0; }
        .nc-prototype-root button:active { opacity: 0.85; }
        .nc-tweaks-toggle {
          position: fixed; top: 16px; right: 16px; z-index: 150;
          background: rgba(255,255,255,0.08); color: #fff;
          border: 1px solid rgba(255,255,255,0.12); border-radius: 999px;
          padding: 6px 14px; font-size: 11px; font-weight: 700;
          letter-spacing: 0.12em; text-transform: uppercase; cursor: pointer;
          font-family: 'Inter', sans-serif;
        }
        .nc-tweaks-toggle:hover { background: rgba(255,255,255,0.14); }
      `}</style>
      <div className="nc-prototype-root">
        <div style={{ transform: `scale(${scale})`, transformOrigin: "center" }}>
          <div style={{
            width: DEVICE_W, height: DEVICE_H, borderRadius: 54, overflow: "hidden",
            position: "relative", background: "#0a0a0a",
            boxShadow: "0 40px 80px rgba(0,0,0,0.4), 0 0 0 12px #1a1a1a, 0 0 0 13px #2a2a2a",
            fontFamily: '"Inter", sans-serif',
          }}>
            <div style={{
              position: "absolute", top: 11, left: "50%", transform: "translateX(-50%)",
              width: 126, height: 37, borderRadius: 24, background: "#000", zIndex: 50,
            }} />
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 }}>
              <IOSStatusBar dark time="12:47" />
            </div>

            <div style={{
              position: "absolute", top: 50, left: 0, right: 0, bottom: 0,
              overflowY: "auto", overflowX: "hidden",
            }}>
              {screen}
            </div>

            {!coachOpen && <TabBar active={tab} onChange={setTab} onFab={() => setLogOpen(true)} />}
            {coachOpen && <CoachScreen onClose={() => setCoachOpen(false)} />}
            {logOpen && <LogSheet onClose={() => setLogOpen(false)} />}

            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 60,
              height: 24, display: "flex", justifyContent: "center", alignItems: "flex-end",
              paddingBottom: 8, pointerEvents: "none",
            }}>
              <div style={{ width: 139, height: 5, borderRadius: 100, background: "rgba(255,255,255,0.45)" }} />
            </div>
          </div>
        </div>

        <button
          onClick={() => setTweaksVisible((v) => !v)}
          className="nc-tweaks-toggle"
          aria-label="Toggle tweaks"
        >Tweaks</button>

        {tweaksVisible && <TweaksPanel theme={theme} setTheme={setTheme} onClose={() => setTweaksVisible(false)} />}
      </div>
    </ThemeCtx.Provider>
  );
}
