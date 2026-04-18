"use client";

import React, { createContext, useContext } from "react";

export type FontMode = "condensed" | "clean";

export interface Theme {
  accent: string;
  font: FontMode;
}

export const DEFAULT_THEME: Theme = { accent: "#E8A83B", font: "condensed" };

export const ThemeCtx = createContext<Theme>(DEFAULT_THEME);
export const useTheme = () => useContext(ThemeCtx);

export const BODY_STACK = '"Inter", -apple-system, "SF Pro Text", system-ui, sans-serif';
const DISPLAY_STACK_CONDENSED = '"Barlow Condensed", "Oswald", "Archivo Narrow", -apple-system, sans-serif';
const DISPLAY_STACK_CLEAN = '"Space Grotesk", "Inter", -apple-system, sans-serif';

export function displayFontFor(mode: FontMode) {
  return mode === "clean" ? DISPLAY_STACK_CLEAN : DISPLAY_STACK_CONDENSED;
}

type IconFn = (c?: string, s?: number) => React.ReactElement;

export const I: Record<string, IconFn> = {
  dashboard: (c = "currentColor", s = 22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7.5" height="7.5" rx="1.4" stroke={c} strokeWidth="1.7"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.4" stroke={c} strokeWidth="1.7"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.4" stroke={c} strokeWidth="1.7"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.4" stroke={c} strokeWidth="1.7"/></svg>
  ),
  log: (c = "currentColor", s = 22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 4c-1 2-4 3-4 7s2 6 4 6 4-2 4-6-3-5-4-7z" stroke={c} strokeWidth="1.7" strokeLinejoin="round"/><path d="M12 7v2" stroke={c} strokeWidth="1.7" strokeLinecap="round"/></svg>
  ),
  coach: (c = "currentColor", s = 22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="6" cy="12" r="2" fill={c}/><circle cx="12" cy="7" r="2" fill={c}/><circle cx="18" cy="12" r="2" fill={c}/><circle cx="12" cy="17" r="2" fill={c}/></svg>
  ),
  plan: (c = "currentColor", s = 22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3.5" y="5" width="17" height="15" rx="2" stroke={c} strokeWidth="1.7"/><path d="M3.5 9.5h17M8 3v4M16 3v4" stroke={c} strokeWidth="1.7" strokeLinecap="round"/></svg>
  ),
  more: (c = "currentColor", s = 22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.7"/><circle cx="8" cy="12" r="1.1" fill={c}/><circle cx="12" cy="12" r="1.1" fill={c}/><circle cx="16" cy="12" r="1.1" fill={c}/></svg>
  ),
  search: (c = "currentColor", s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="6.5" stroke={c} strokeWidth="1.8"/><path d="M16 16l4 4" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>
  ),
  barcode: (c = "currentColor", s = 20) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 6v12M7 6v12M10 6v12M14 6v12M17 6v12M20 6v12" stroke={c} strokeWidth="1.5" strokeLinecap="round"/></svg>
  ),
  chevR: (c = "currentColor", s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M9 5l7 7-7 7" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  chevL: (c = "currentColor", s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  camera: (c = "currentColor", s = 22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 8h3l1.5-2h7L17 8h3v11H4z" stroke={c} strokeWidth="1.7" strokeLinejoin="round"/><circle cx="12" cy="13.5" r="3.5" stroke={c} strokeWidth="1.7"/></svg>
  ),
  mic: (c = "currentColor", s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="9" y="3" width="6" height="12" rx="3" stroke={c} strokeWidth="1.8"/><path d="M5 11a7 7 0 0014 0M12 18v3" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>
  ),
  send: (c = "currentColor", s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 12l16-7-5 17-3-7-8-3z" stroke={c} strokeWidth="1.7" strokeLinejoin="round"/></svg>
  ),
  pin: (c = "currentColor", s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 21s-7-6.5-7-12a7 7 0 1114 0c0 5.5-7 12-7 12z" stroke={c} strokeWidth="1.7"/><circle cx="12" cy="9" r="2.3" stroke={c} strokeWidth="1.7"/></svg>
  ),
  clock: (c = "currentColor", s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.5" stroke={c} strokeWidth="1.7"/><path d="M12 7.5V12l3 2" stroke={c} strokeWidth="1.7" strokeLinecap="round"/></svg>
  ),
  plane: (c = "currentColor", s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M2 14l20-7-3 12-6-3-3 5-2-4-6-3z" fill={c}/></svg>
  ),
  sparkle: (c = "currentColor", s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" fill={c}/><path d="M19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" fill={c} opacity=".5"/></svg>
  ),
  flame: (c = "currentColor", s = 12) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 3c-1.5 3-5 5-5 10a5 5 0 0010 0c0-3-2-5-2-7 0 0-1 2-3 2s-2-3 0-5z" fill={c}/></svg>
  ),
  close: (c = "currentColor", s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 5l14 14M19 5L5 19" stroke={c} strokeWidth="2" strokeLinecap="round"/></svg>
  ),
  plus: (c = "currentColor", s = 22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke={c} strokeWidth="2" strokeLinecap="round"/></svg>
  ),
  calendar: (c = "currentColor", s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3.5" y="5" width="17" height="15" rx="2" stroke={c} strokeWidth="1.7"/><path d="M3.5 9.5h17" stroke={c} strokeWidth="1.7"/></svg>
  ),
  briefcase: (c = "currentColor", s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="7" width="18" height="13" rx="2" stroke={c} strokeWidth="1.7"/><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" stroke={c} strokeWidth="1.7"/></svg>
  ),
};

export function Display({ children, size = 40, style = {} }: { children: React.ReactNode; size?: number; style?: React.CSSProperties }) {
  const { font } = useTheme();
  const isCondensed = font === "condensed";
  return (
    <span style={{
      fontFamily: displayFontFor(font),
      fontWeight: isCondensed ? 700 : 600,
      fontSize: size,
      lineHeight: 0.95,
      letterSpacing: isCondensed ? "0.01em" : "-0.025em",
      textTransform: isCondensed ? "uppercase" : "none",
      color: "#fff",
      ...style,
    }}>{children}</span>
  );
}

export function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? "#55C08C" : score >= 60 ? "#F5C54B" : "#E25D2C";
  const label = score >= 80 ? "GREAT" : score >= 60 ? "OK" : "SKIP";
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "3px 9px 3px 6px", borderRadius: 999,
      background: "rgba(255,255,255,0.06)",
      border: `1px solid ${color}55`,
      fontFamily: BODY_STACK, fontSize: 11, fontWeight: 700,
      color, letterSpacing: "0.06em",
    }}>
      <span style={{
        width: 16, height: 16, borderRadius: 999, background: color,
        color: "#111", fontSize: 10, fontWeight: 800,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
      }}>{score}</span>
      {label}
    </div>
  );
}

export function Column({ pct, color, dim, w = 14, h = 52 }: { pct: number; color: string; dim?: boolean; w?: number | string; h?: number }) {
  const fill = dim ? "rgba(255,255,255,0.08)" : color;
  return (
    <div style={{
      width: w, height: h, background: "rgba(255,255,255,0.04)",
      borderRadius: 3, position: "relative", overflow: "hidden",
      border: "1px solid rgba(255,255,255,0.06)",
    }}>
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0,
        height: `${Math.min(100, pct)}%`, background: fill, borderRadius: 2,
      }} />
      <div style={{
        position: "absolute", top: 2, left: 2, right: 2, height: 2,
        background: "rgba(255,255,255,0.12)", borderRadius: 1,
      }} />
    </div>
  );
}

export function MacroBar({ pct, color, height = 6 }: { pct: number; color: string; height?: number }) {
  return (
    <div style={{
      height, background: "rgba(255,255,255,0.08)", borderRadius: 99,
      position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", inset: 0, width: `${Math.min(100, pct)}%`,
        background: color, borderRadius: 99,
      }} />
      {pct > 100 && (
        <div style={{
          position: "absolute", right: 2, top: 0, bottom: 0, width: 2,
          background: "#fff", borderRadius: 1,
        }} />
      )}
    </div>
  );
}
