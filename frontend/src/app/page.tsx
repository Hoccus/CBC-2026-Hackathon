import Link from "next/link";

export default function Home() {
  return (
    <main style={{ maxWidth: 600, margin: "80px auto", padding: "0 24px" }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
        NutriCoach
      </h1>
      <p style={{ color: "#6b7280", marginBottom: 40 }}>
        Real-time nutrition advice for life on the go.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Link href="/coach">
          <div
            style={{
              padding: "24px",
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              cursor: "pointer",
            }}
          >
            <h2 style={{ marginBottom: 4 }}>Ask Your Coach</h2>
            <p style={{ color: "#6b7280", fontSize: 14 }}>
              Describe what&apos;s in your fridge or what&apos;s on the menu —
              get instant, practical advice.
            </p>
          </div>
        </Link>

        <Link href="/meals">
          <div
            style={{
              padding: "24px",
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              cursor: "pointer",
            }}
          >
            <h2 style={{ marginBottom: 4 }}>Meal Log</h2>
            <p style={{ color: "#6b7280", fontSize: 14 }}>
              Track what you&apos;ve eaten while traveling or at home.
            </p>
          </div>
        </Link>
      </div>
    </main>
  );
}
