"use client";

import { useEffect, useState } from "react";

const RESTRICTIONS = [
  "Vegetarian", "Vegan", "Gluten-free", "Dairy-free",
  "Nut allergy", "Halal", "Kosher", "Low-carb", "Diabetic-friendly",
];

const ACTIVITY = [
  { value: "sedentary", label: "Sedentary", factor: 1.2 },
  { value: "light", label: "Lightly active (1-3×/wk)", factor: 1.375 },
  { value: "moderate", label: "Moderately active (3-5×/wk)", factor: 1.55 },
  { value: "active", label: "Very active (6-7×/wk)", factor: 1.725 },
  { value: "extra", label: "Extra active (physical job)", factor: 1.9 },
];

interface Profile {
  name: string;
  age: number;
  weight: number;
  height: number;
  gender: string;
  activity: string;
  restrictions: string[];
  goals: { calories: number; protein: number; carbs: number; fat: number };
}

function calcTDEE(profile: Profile): { calories: number; protein: number; carbs: number; fat: number } {
  const { weight, height, age, gender, activity } = profile;
  if (!weight || !height || !age) return { calories: 2000, protein: 120, carbs: 200, fat: 67 };
  const bmr =
    gender === "male"
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161;
  const factor = ACTIVITY.find((a) => a.value === activity)?.factor ?? 1.55;
  const calories = Math.round(bmr * factor);
  return {
    calories,
    protein: Math.round((calories * 0.3) / 4),
    carbs: Math.round((calories * 0.4) / 4),
    fat: Math.round((calories * 0.3) / 9),
  };
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>({
    name: "", age: 0, weight: 0, height: 0,
    gender: "male", activity: "moderate", restrictions: [],
    goals: { calories: 2000, protein: 120, carbs: 200, fat: 67 },
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const p = localStorage.getItem("nutricoach_profile");
      if (p) setProfile(JSON.parse(p));
    } catch {}
  }, []);

  function update(field: string, value: unknown) {
    setProfile((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  function toggleRestriction(r: string) {
    setProfile((prev) => {
      const has = prev.restrictions.includes(r);
      return { ...prev, restrictions: has ? prev.restrictions.filter((x) => x !== r) : [...prev.restrictions, r] };
    });
    setSaved(false);
  }

  function autoCalc() {
    const goals = calcTDEE(profile);
    setProfile((prev) => ({ ...prev, goals }));
    setSaved(false);
  }

  function save() {
    localStorage.setItem("nutricoach_profile", JSON.stringify(profile));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <main className="page">
      <div className="mb-6">
        <h1 className="h1">Your Profile</h1>
        <p className="text-muted mt-1">Personalizes coach advice and macro goals.</p>
      </div>

      {/* Personal Info */}
      <div className="card mb-4">
        <h2 className="h3 mb-4">About You</h2>
        <div className="form-section">
          <div className="form-group">
            <label className="label-text">Name</label>
            <input className="input" placeholder="Your first name" value={profile.name} onChange={(e) => update("name", e.target.value)} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="label-text">Age</label>
              <input className="input" type="number" min="10" max="100" placeholder="Age" value={profile.age || ""} onChange={(e) => update("age", Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label className="label-text">Gender</label>
              <select className="select" value={profile.gender} onChange={(e) => update("gender", e.target.value)}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="label-text">Weight (kg)</label>
              <input className="input" type="number" min="30" max="250" placeholder="e.g. 75" value={profile.weight || ""} onChange={(e) => update("weight", Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label className="label-text">Height (cm)</label>
              <input className="input" type="number" min="100" max="250" placeholder="e.g. 175" value={profile.height || ""} onChange={(e) => update("height", Number(e.target.value))} />
            </div>
          </div>
          <div className="form-group">
            <label className="label-text">Activity Level</label>
            <select className="select" value={profile.activity} onChange={(e) => update("activity", e.target.value)}>
              {ACTIVITY.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Dietary Restrictions */}
      <div className="card mb-4">
        <h2 className="h3 mb-4">Dietary Restrictions</h2>
        <div className="check-grid">
          {RESTRICTIONS.map((r) => (
            <label key={r} className="check-item">
              <input type="checkbox" checked={profile.restrictions.includes(r)} onChange={() => toggleRestriction(r)} />
              {r}
            </label>
          ))}
        </div>
      </div>

      {/* Nutrition Goals */}
      <div className="card mb-6">
        <div className="section-header">
          <h2 className="h3">Daily Nutrition Goals</h2>
          <button className="btn btn-secondary btn-sm" onClick={autoCalc}>Auto-calculate</button>
        </div>
        <p className="text-muted mb-4" style={{ fontSize: 13 }}>Auto-calculate uses your age, weight, height, and activity level (Mifflin-St Jeor).</p>
        <div className="grid-4">
          {(["calories", "protein", "carbs", "fat"] as const).map((key) => (
            <div className="form-group" key={key}>
              <label className="label-text" style={{ textTransform: "capitalize" }}>
                {key}{key !== "calories" ? " (g)" : " (kcal)"}
              </label>
              <input
                className="input"
                type="number"
                min="0"
                value={profile.goals[key] || ""}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, goals: { ...p.goals, [key]: Number(e.target.value) } }))
                }
              />
            </div>
          ))}
        </div>
      </div>

      <button className="btn btn-primary btn-full" onClick={save}>
        {saved ? "✓ Saved!" : "Save Profile"}
      </button>
    </main>
  );
}
