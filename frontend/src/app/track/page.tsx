"use client";

import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";
import Image from "next/image";
import { useRef, useState } from "react";

interface MacroResult {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  description: string;
  health_notes: string;
}

function MacroCard({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="card" style={{ padding: "16px" }}>
      <div className="macro-stat-val">{Math.round(value)}</div>
      <div className="macro-stat-label" style={{ marginTop: 3 }}>{unit}</div>
      <div className="macro-stat-sub">{label}</div>
    </div>
  );
}

export default function TrackPage() {
  const addAnalyzedMeal = useMutation(api.meals.addAnalyzed);
  const [tab, setTab] = useState<"photo" | "text">("photo");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MacroResult | null>(null);
  const [added, setAdded] = useState(false);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setResult(null);
    setAdded(false);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith("image/")) handleFile(f);
  }

  async function analyze(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setResult(null);
    try {
      const form = new FormData();
      if (description.trim()) form.append("description", description);
      if (imageFile) form.append("image", imageFile);
      const res = await fetch("/api/track/analyze", { method: "POST", body: form });
      if (!res.ok) throw new Error();
      setResult(await res.json());
    } catch {
      alert("Failed to analyze meal. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function addToLog() {
    if (!result) return;
    await addAnalyzedMeal({
      description: result.description,
      calories: result.calories,
      protein_g: result.protein_g,
      carbs_g: result.carbs_g,
      fat_g: result.fat_g,
      notes: result.health_notes,
    });
    setAdded(true);
  }

  function reset() {
    setImageFile(null); setImagePreview(null);
    setDescription(""); setResult(null); setAdded(false);
  }

  return (
    <main className="page">
      <div className="mb-6">
        <h1 className="h1">Track a Meal</h1>
        <p className="text-muted mt-1">Upload a photo or describe your meal for an instant macro estimate.</p>
      </div>

      {!result ? (
        <form onSubmit={analyze}>
          <div className="flex gap-2 mb-4">
            {(["photo", "text"] as const).map((t) => (
              <button key={t} type="button"
                className={`btn ${tab === t ? "btn-primary" : "btn-secondary"} btn-sm`}
                onClick={() => { setTab(t); setResult(null); }}
              >
                {t === "photo" ? "Upload Photo" : "Describe Meal"}
              </button>
            ))}
          </div>

          {tab === "photo" && (
            <div
              className={`upload-zone mb-4${drag ? " drag-over" : ""}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={onDrop}
            >
              {imagePreview ? (
                <Image
                  src={imagePreview}
                  alt="preview"
                  width={320}
                  height={200}
                  unoptimized
                  style={{ maxHeight: 200, maxWidth: "100%", borderRadius: 4, objectFit: "contain" }}
                />
              ) : (
                <>
                  <p style={{ fontSize: 13, fontWeight: 500 }}>Drop an image or click to upload</p>
                  <p className="text-muted mt-1" style={{ fontSize: 12 }}>JPG, PNG, WEBP</p>
                </>
              )}
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </div>
          )}

          <div className="form-group mb-4">
            <label className="label-text">{tab === "photo" ? "Description (optional)" : "Describe your meal"}</label>
            <textarea
              className="textarea"
              placeholder={tab === "photo" ? "e.g. chicken stir-fry with rice" : "e.g. grilled salmon, roasted broccoli, half cup quinoa"}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required={tab === "text"}
            />
          </div>

          <button className="btn btn-primary btn-full" type="submit"
            disabled={loading || (tab === "photo" && !imageFile) || (tab === "text" && !description.trim())}
          >
            {loading ? <><span className="spinner" /> Analyzing...</> : "Analyze Meal"}
          </button>
        </form>
      ) : (
        <div>
          <div className="card mb-4" style={{ background: "#fafafa" }}>
            <p style={{ fontWeight: 600, fontSize: 13 }}>{result.description}</p>
            <p className="text-muted mt-2" style={{ fontSize: 13, lineHeight: 1.55 }}>{result.health_notes}</p>
          </div>

          <div className="grid-4 mb-6">
            <MacroCard label="Calories" value={result.calories} unit="kcal" />
            <MacroCard label="Protein" value={result.protein_g} unit="g" />
            <MacroCard label="Carbs" value={result.carbs_g} unit="g" />
            <MacroCard label="Fat" value={result.fat_g} unit="g" />
          </div>

          <div className="flex gap-3">
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={addToLog} disabled={added}>
              {added ? "Added to Log" : "Add to Today's Log"}
            </button>
            <button className="btn btn-secondary" onClick={reset}>Analyze Another</button>
          </div>
        </div>
      )}
    </main>
  );
}
