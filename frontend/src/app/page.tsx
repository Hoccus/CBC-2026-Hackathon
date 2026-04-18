"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface MealEntry {
  id: string;
  timestamp: number;
  description: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

interface Profile {
  name: string;
  goals: { calories: number; protein: number; carbs: number; fat: number };
}

const DEFAULT_GOALS = { calories: 2000, protein: 120, carbs: 200, fat: 67 };

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function MacroBar({ label, current, goal }: { label: string; current: number; goal: number }) {
  const pct = Math.min(100, goal > 0 ? Math.round((current / goal) * 100) : 0);
  const over = pct >= 100;
  return (
    <div className="macro-bar-row">
      <div className="macro-bar-header">
        <span className="text-sm" style={{ fontWeight: 500 }}>{label}</span>
        <span className="text-sm" style={{ color: over ? "#991b1b" : "var(--muted)" }}>
          {Math.round(current)} / {goal}{label === "Calories" ? " kcal" : "g"}
        </span>
      </div>
      <div className="macro-bar-track">
        <div className="macro-bar-fill" style={{ width: `${pct}%`, background: over ? "#ef4444" : "var(--text)" }} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [todayMeals, setTodayMeals] = useState<MealEntry[]>([]);

  useEffect(() => {
    try {
      const p = localStorage.getItem("nutricoach_profile");
      if (p) setProfile(JSON.parse(p));
      const log: MealEntry[] = JSON.parse(localStorage.getItem("nutricoach_log") || "[]");
      const start = new Date(); start.setHours(0, 0, 0, 0);
      setTodayMeals(log.filter((m) => m.timestamp >= start.getTime()));
    } catch {}
  }, []);

  const goals = profile?.goals ?? DEFAULT_GOALS;
  const totals = todayMeals.reduce(
    (acc, m) => ({ calories: acc.calories + m.calories, protein: acc.protein + m.protein_g, carbs: acc.carbs + m.carbs_g, fat: acc.fat + m.fat_g }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return (
    <main className="page">
      <div className="mb-6">
        <h1 className="h1">{greeting()}{profile?.name ? `, ${profile.name}` : ""}.</h1>
        <p className="text-muted mt-1">Your nutrition summary for today.</p>
      </div>

      {/* Macro Progress */}
      <div className="card mb-6">
        <div className="section-header">
          <span className="h3">Today&apos;s Progress</span>
          <span className="badge badge-gray">{todayMeals.length} meal{todayMeals.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="macro-bar-wrap">
          <MacroBar label="Calories" current={totals.calories} goal={goals.calories} />
          <MacroBar label="Protein" current={totals.protein} goal={goals.protein} />
          <MacroBar label="Carbs" current={totals.carbs} goal={goals.carbs} />
          <MacroBar label="Fat" current={totals.fat} goal={goals.fat} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="section-header">
        <span className="h3">Quick Actions</span>
      </div>
      <div className="grid-3 mb-6">
        {[
          { href: "/coach", label: "Coach", desc: "Ask what to eat right now" },
          { href: "/track", label: "Track Meal", desc: "Estimate macros from photo or text" },
          { href: "/restaurants", label: "Find Nearby", desc: "Score restaurants against your goals" },
        ].map((a) => (
          <Link key={a.href} href={a.href}>
            <div className="card card-hover" style={{ height: "100%" }}>
              <div className="h3" style={{ marginBottom: 4 }}>{a.label}</div>
              <p className="text-muted" style={{ fontSize: 12, lineHeight: 1.5 }}>{a.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Today's Meals */}
      <div className="section-header">
        <span className="h3">Today&apos;s Meals</span>
        <Link href="/track" className="text-sm" style={{ color: "var(--muted)" }}>+ Add</Link>
      </div>
      {todayMeals.length === 0 ? (
        <div className="card empty-state">
          <p style={{ fontSize: 13 }}>No meals logged yet.</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>Use <strong>Track Meal</strong> to log your first meal.</p>
        </div>
      ) : (
        <div className="flex-col gap-3">
          {[...todayMeals].reverse().map((m) => (
            <div key={m.id} className="card flex items-center gap-3" style={{ padding: "14px 16px" }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 500, fontSize: 13 }}>{m.description}</p>
                <p className="text-muted mt-1" style={{ fontSize: 12 }}>
                  {Math.round(m.calories)} kcal &middot; {Math.round(m.protein_g)}g P &middot; {Math.round(m.carbs_g)}g C &middot; {Math.round(m.fat_g)}g F
                </p>
              </div>
              <span style={{ fontSize: 12, color: "var(--light)" }}>
                {new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
