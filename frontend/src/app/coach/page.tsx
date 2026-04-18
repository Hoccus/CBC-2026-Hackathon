"use client";

import { useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const CONTEXTS = ["at home", "on the road", "at a restaurant", "at the airport", "at a hotel"];

export default function CoachPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/coach/advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, context: context || undefined }),
      });

      if (!res.ok) throw new Error("Request failed");

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.advice },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 680, margin: "0 auto", padding: "24px", height: "100vh", display: "flex", flexDirection: "column" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Nutrition Coach</h1>

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 13, color: "#6b7280", marginRight: 8 }}>Where are you?</label>
        <select
          value={context}
          onChange={(e) => setContext(e.target.value)}
          style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14 }}
        >
          <option value="">Select context</option>
          {CONTEXTS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {messages.length === 0 && (
          <p style={{ color: "#9ca3af", fontSize: 14, margin: "auto" }}>
            Describe what&apos;s available to eat and get personalized advice.
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "80%",
              padding: "10px 14px",
              borderRadius: 12,
              background: msg.role === "user" ? "#111827" : "#f3f4f6",
              color: msg.role === "user" ? "#fff" : "#111827",
              fontSize: 14,
              lineHeight: 1.5,
              whiteSpace: "pre-wrap",
            }}
          >
            {msg.content}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: "flex-start", color: "#9ca3af", fontSize: 13 }}>
            Thinking...
          </div>
        )}
      </div>

      <form onSubmit={sendMessage} style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="What's in your fridge? What's on the menu?"
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #d1d5db",
            fontSize: 14,
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{
            padding: "10px 20px",
            background: "#111827",
            color: "#fff",
            borderRadius: 10,
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: 14,
            opacity: loading ? 0.6 : 1,
          }}
        >
          Send
        </button>
      </form>
    </main>
  );
}
