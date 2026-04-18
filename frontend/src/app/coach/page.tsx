"use client";

import { api } from "@convex/_generated/api";
import { buildProfileContext, CoachMessage, Profile } from "@/lib/persistence";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";

const CONTEXTS = [
  { value: "", label: "Select situation..." },
  { value: "at home — have access to a full kitchen", label: "At home" },
  { value: "at the airport", label: "Airport" },
  { value: "on the road — gas stations and fast food only", label: "On the road" },
  { value: "at a hotel — maybe a minibar and room service", label: "Hotel" },
  { value: "at a restaurant — can order anything", label: "Restaurant" },
  { value: "at a convenience store", label: "Convenience store" },
];

const EMPTY_MESSAGES: CoachMessage[] = [];

export default function CoachPage() {
  const profile = useQuery(api.profiles.getMine) as Profile | null | undefined;
  const persistedMessages = useQuery(api.coach.listMine) as CoachMessage[] | undefined;
  const messages = persistedMessages ?? EMPTY_MESSAGES;
  const addMessage = useMutation(api.coach.addMessage);
  const clearMessages = useMutation(api.coach.clearMine);
  const [input, setInput] = useState("");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const prompt = input.trim();
    setInput("");
    setLoading(true);
    try {
      const profileCtx = buildProfileContext(profile ?? null);
      await addMessage({
        role: "user",
        content: prompt,
        context: context || undefined,
      });
      const res = await fetch("/api/coach/advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompt,
          context: context || undefined,
          profile_context: profileCtx || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      await addMessage({
        role: "assistant",
        content: data.advice,
        context: context || undefined,
      });
    } catch {
      await addMessage({
        role: "assistant",
        content: "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function clearConversation() {
    if (loading) {
      return;
    }
    await clearMessages({});
  }

  return (
    <main style={{ maxWidth: 700, margin: "0 auto", padding: "28px", height: "calc(100vh - var(--nav-h))", display: "flex", flexDirection: "column" }}>
      <div className="mb-4" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
        <div>
          <h1 className="h1">Coach</h1>
          {profile?.name && <p className="text-muted mt-1">{profile.name} · {profile.goals.calories} kcal goal</p>}
        </div>
        <button className="btn btn-secondary btn-sm" type="button" onClick={clearConversation} disabled={messages.length === 0 || loading}>
          Clear Chat
        </button>
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
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-bubble chat-bubble-${msg.role === "user" ? "user" : "ai"}`}>
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
