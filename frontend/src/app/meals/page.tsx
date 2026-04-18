"use client";

import { useState, useEffect } from "react";

interface MealEntry {
  id: string;
  description: string;
  location?: string;
  notes?: string;
}

export default function MealsPage() {
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/meals/")
      .then((r) => r.json())
      .then(setMeals)
      .catch(() => {});
  }, []);

  async function logMeal(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim() || saving) return;

    setSaving(true);
    try {
      const res = await fetch("/api/meals/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, location: location || undefined, notes: notes || undefined }),
      });
      if (!res.ok) throw new Error("Failed");
      const entry: MealEntry = await res.json();
      setMeals((prev) => [entry, ...prev]);
      setDescription("");
      setLocation("");
      setNotes("");
    } catch {
      alert("Failed to save meal.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={{ maxWidth: 600, margin: "40px auto", padding: "0 24px" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Meal Log</h1>

      <form
        onSubmit={logMeal}
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 20,
          marginBottom: 32,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What did you eat?"
          required
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14 }}
        />
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Where? (optional)"
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14 }}
        />
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optional)"
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14 }}
        />
        <button
          type="submit"
          disabled={saving}
          style={{
            padding: "10px",
            background: "#111827",
            color: "#fff",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          {saving ? "Saving..." : "Log Meal"}
        </button>
      </form>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {meals.length === 0 && (
          <p style={{ color: "#9ca3af", fontSize: 14 }}>No meals logged yet.</p>
        )}
        {meals.map((meal) => (
          <div
            key={meal.id}
            style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              padding: "14px 16px",
            }}
          >
            <p style={{ fontWeight: 600 }}>{meal.description}</p>
            {meal.location && (
              <p style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>{meal.location}</p>
            )}
            {meal.notes && (
              <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 2 }}>{meal.notes}</p>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
