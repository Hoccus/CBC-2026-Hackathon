"use client";

import { useEffect, useState } from "react";
import CircularProgress from "@/components/CircularProgress";

interface MacroEntry {
  id: string;
  timestamp: string;
  description: string;
  meal_type?: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  health_notes: string;
}

interface DailySummary {
  date: string;
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  total_fiber_g: number;
  meal_count: number;
  entries: MacroEntry[];
  progress_vs_targets?: {
    targets: { calories: number; protein_g: number; carbs_g: number; fat_g: number; fiber_g: number };
    consumed: { calories: number; protein_g: number; carbs_g: number; fat_g: number };
    remaining: { calories: number; protein_g: number; carbs_g: number; fat_g: number };
    percent_complete: { calories: number; protein_g: number };
  };
}

interface Profile {
  name: string;
  restrictions: string[];
  goals: { calories: number; protein: number; carbs: number; fat: number };
}

export default function MacrosPage() {
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const p = localStorage.getItem("nutricoach_profile");
      if (p) setProfile(JSON.parse(p));
    } catch {}
  }, []);

  useEffect(() => {
    fetchToday();
  }, []);

  async function fetchToday() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/macros/today");
      if (res.status === 404) {
        setSummary(null);
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch");
      setSummary(await res.json());
    } catch {
      setError("Could not load today's macros.");
    } finally {
      setLoading(false);
    }
  }

  async function resetDay() {
    try {
      await fetch("/api/macros/today", { method: "DELETE" });
      localStorage.setItem("nutricoach_log", JSON.stringify([]));
      setSummary(null);
      await fetchToday();
    } catch {}
  }

  const targets = summary?.progress_vs_targets?.targets ?? {
    calories: profile?.goals?.calories ?? 2000,
    protein_g: profile?.goals?.protein ?? 150,
    carbs_g: profile?.goals?.carbs ?? 250,
    fat_g: profile?.goals?.fat ?? 65,
  };

  const consumed = {
    calories: summary?.total_calories ?? 0,
    protein_g: summary?.total_protein_g ?? 0,
    carbs_g: summary?.total_carbs_g ?? 0,
    fat_g: summary?.total_fat_g ?? 0,
  };

  const remaining = {
    calories: Math.max(0, targets.calories - consumed.calories),
    protein_g: Math.max(0, targets.protein_g - consumed.protein_g),
    carbs_g: Math.max(0, targets.carbs_g - consumed.carbs_g),
    fat_g: Math.max(0, targets.fat_g - consumed.fat_g),
  };

  const pct = (c: number, t: number) => (t > 0 ? (c / t) * 100 : 0);

  const macros = [
    { label: "Calories", current: consumed.calories, target: targets.calories, unit: "kcal", color: "#f59e0b" },
    { label: "Protein", current: consumed.protein_g, target: targets.protein_g, unit: "g", color: "#ef4444" },
    { label: "Carbs", current: consumed.carbs_g, target: targets.carbs_g, unit: "g", color: "#3b82f6" },
    { label: "Fat", current: consumed.fat_g, target: targets.fat_g, unit: "g", color: "#8b5cf6" },
  ];

  return (
    <main className="page">
      <div className="mb-6">
        <h1 className="h1">Today&apos;s Macros</h1>
        <p className="text-muted mt-1">
          {profile?.name ? `${profile.name} — ` : ""}Track your daily nutrition progress.
        </p>
      </div>

      {loading ? (
        <div className="card text-center" style={{ padding: "40px 24px" }}>
          <span className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
          <p className="mt-4" style={{ fontWeight: 600 }}>Loading...</p>
        </div>
      ) : error ? (
        <div className="card" style={{ padding: "20px", borderColor: "#fecaca", background: "#fef2f2" }}>
          <p style={{ fontWeight: 600, color: "#991b1b" }}>{error}</p>
        </div>
      ) : (
        <>
          {/* Progress rings */}
          <div className="card mb-4" style={{ padding: "28px 20px" }}>
            <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 20 }}>Daily Progress</p>
            <div className="grid-4">
              {macros.map((m) => (
                <CircularProgress
                  key={m.label}
                  percentage={pct(m.current, m.target)}
                  color={m.color}
                  label={m.label}
                  current={m.current}
                  target={m.target}
                  unit={m.unit}
                />
              ))}
            </div>
          </div>

          {/* Remaining today */}
          <div className="card mb-4" style={{ padding: "20px" }}>
            <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 16 }}>Remaining Today</p>
            <div className="grid-4">
              {[
                { label: "Calories", value: remaining.calories, unit: "kcal", bg: "#fffbeb", color: "#b45309" },
                { label: "Protein", value: remaining.protein_g, unit: "g", bg: "#fef2f2", color: "#dc2626" },
                { label: "Carbs", value: remaining.carbs_g, unit: "g", bg: "#eff6ff", color: "#2563eb" },
                { label: "Fat", value: remaining.fat_g, unit: "g", bg: "#f5f3ff", color: "#7c3aed" },
              ].map((r) => (
                <div key={r.label} className="card" style={{ padding: "14px", background: r.bg, border: "none" }}>
                  <div className="text-muted" style={{ fontSize: 11, fontWeight: 600 }}>{r.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: r.color, marginTop: 4 }}>
                    {Math.round(r.value)}
                  </div>
                  <div style={{ fontSize: 11, color: r.color, opacity: 0.7 }}>{r.unit} left</div>
                </div>
              ))}
            </div>
          </div>

          {/* Meal log */}
          {summary && summary.entries.length > 0 && (
            <div className="card" style={{ padding: "20px" }}>
              <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 12 }}>
                Meals Logged ({summary.meal_count})
              </p>
              <div className="flex-col gap-2">
                {summary.entries.map((e) => (
                  <div
                    key={e.id}
                    className="card"
                    style={{ padding: "12px 14px", background: "#fafafa", border: "1px solid var(--border)" }}
                  >
                    <div className="flex items-center gap-2" style={{ flexWrap: "wrap" }}>
                      <p style={{ fontWeight: 600, fontSize: 13, flex: 1 }}>{e.description}</p>
                      {e.meal_type && <span className="badge badge-gray">{e.meal_type}</span>}
                    </div>
                    <div className="flex gap-3 mt-2" style={{ fontSize: 12 }}>
                      <span style={{ color: "#b45309" }}>{Math.round(e.calories)} kcal</span>
                      <span style={{ color: "#dc2626" }}>{Math.round(e.protein_g)}g P</span>
                      <span style={{ color: "#2563eb" }}>{Math.round(e.carbs_g)}g C</span>
                      <span style={{ color: "#7c3aed" }}>{Math.round(e.fat_g)}g F</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {(!summary || summary.entries.length === 0) && (
            <div className="card text-center" style={{ padding: "32px 20px" }}>
              <p style={{ fontWeight: 600, fontSize: 14 }}>No meals logged today</p>
              <p className="text-muted mt-2" style={{ fontSize: 13 }}>
                Go to <a href="/track" style={{ textDecoration: "underline", fontWeight: 500 }}>Track a Meal</a> to log your food.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-4">
            <a href="/track" className="btn btn-primary" style={{ flex: 1, textDecoration: "none", textAlign: "center", padding: "11px" }}>
              Log a Meal
            </a>
            <button
              className="btn btn-secondary"
              style={{ padding: "11px 20px" }}
              onClick={resetDay}
            >
              Reset Day
            </button>
          </div>
        </>
      )}
    </main>
  );
}
