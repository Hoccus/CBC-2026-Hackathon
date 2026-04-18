"use client";

import { useEffect, useRef, useState } from "react";

interface Message { role: "user" | "assistant"; content: string; }
interface Profile { name: string; restrictions: string[]; goals: { calories: number; protein: number; carbs: number; fat: number }; }

const CONTEXTS = [
  { value: "", label: "Select situation..." },
  { value: "at home — have access to a full kitchen", label: "At home" },
  { value: "at the airport", label: "Airport" },
  { value: "on the road — gas stations and fast food only", label: "On the road" },
  { value: "at a hotel — maybe a minibar and room service", label: "Hotel" },
  { value: "at a restaurant — can order anything", label: "Restaurant" },
  { value: "at a convenience store", label: "Convenience store" },
];

export default function CoachPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const p = localStorage.getItem("nutricoach_profile");
      if (p) setProfile(JSON.parse(p));
    } catch {}
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;
    setMessages((prev) => [...prev, { role: "user", content: input }]);
    setInput("");
    setLoading(true);
    try {
      const profileCtx = profile
        ? `${profile.restrictions.length ? "Restrictions: " + profile.restrictions.join(", ") + ". " : ""}Goal: ${profile.goals.calories} kcal, ${profile.goals.protein}g protein.`
        : "";
      const res = await fetch("/api/coach/advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, context: context || undefined, profile_context: profileCtx || undefined }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.advice }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 700, margin: "0 auto", padding: "28px", height: "calc(100vh - var(--nav-h))", display: "flex", flexDirection: "column" }}>
      <div className="mb-4">
        <h1 className="h1">Coach</h1>
        {profile?.name && <p className="text-muted mt-1">{profile.name} · {profile.goals.calories} kcal goal</p>}
      </div>

      <div className="card mb-3" style={{ padding: "10px 14px" }}>
        <div className="flex items-center gap-3">
          <span className="label">Where are you?</span>
          <select className="select" style={{ maxWidth: 240 }} value={context} onChange={(e) => setContext(e.target.value)}>
            {CONTEXTS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      </div>

      <div className="chat-wrap mb-3">
        {messages.length === 0 && (
          <div className="empty-state" style={{ margin: "auto" }}>
            <p style={{ fontWeight: 600, fontSize: 13 }}>Ask your nutrition coach</p>
            <p className="text-muted mt-1" style={{ fontSize: 12 }}>
              &ldquo;What should I eat at the airport?&rdquo;<br />
              &ldquo;I have eggs, spinach, and cheese — what can I make?&rdquo;
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`chat-bubble chat-bubble-${msg.role === "user" ? "user" : "ai"}`}>
            {msg.content}
          </div>
        ))}
        {loading && (
          <div className="chat-bubble chat-bubble-ai flex items-center gap-2">
            <span className="spinner" />
            <span style={{ color: "var(--light)", fontSize: 12 }}>Thinking...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="flex gap-2">
        <input className="input" value={input} onChange={(e) => setInput(e.target.value)}
          placeholder="What's in your fridge? What's on the menu?" />
        <button className="btn btn-primary" type="submit" disabled={loading || !input.trim()}>Send</button>
      </form>
    </main>
  );
}
