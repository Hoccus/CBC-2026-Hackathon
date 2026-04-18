"use client";

import { api } from "@convex/_generated/api";
import OnboardingForm, { MacroOnboardingFormData } from "@/components/OnboardingForm";
import { DEFAULT_PROFILE, Profile } from "@/lib/persistence";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const RESTRICTIONS = [
  "Vegetarian", "Vegan", "Gluten-free", "Dairy-free",
  "Nut allergy", "Halal", "Kosher", "Low-carb", "Diabetic-friendly",
];

const ACTIVITY = [
  { value: "sedentary", label: "Sedentary", factor: 1.2, macroLevel: 1.2 },
  { value: "light", label: "Lightly active (1-3x/wk)", factor: 1.375, macroLevel: 1.375 },
  { value: "moderate", label: "Moderately active (3-5x/wk)", factor: 1.55, macroLevel: 1.55 },
  { value: "active", label: "Very active (6-7x/wk)", factor: 1.725, macroLevel: 1.725 },
  { value: "extra", label: "Extra active (physical job)", factor: 1.9, macroLevel: 1.9 },
];

type CalBrand = "google" | "outlook";
type CalState = "idle" | "syncing" | "connected";
type CalRisk = "low" | "med" | "high";

const CALENDAR_SCOPES: Record<CalBrand, string[]> = {
  google: ["https://www.googleapis.com/auth/calendar.readonly"],
  outlook: ["Calendars.Read", "offline_access"],
};

interface CalEvent {
  id: string;
  dayKey: string;
  dayLabel: string;
  time: string;
  duration: string;
  title: string;
  location: string;
  source: CalBrand;
  risk: CalRisk;
  hint: string;
}

interface CalendarConnection {
  provider: CalBrand;
  state: "idle" | "connected";
  title: string;
  account_email?: string | null;
}

interface ApiCalendarEvent {
  id: string;
  provider: CalBrand;
  title: string;
  location?: string | null;
  starts_at: string;
  ends_at: string;
  timezone?: string | null;
  is_all_day: boolean;
}

interface MacroResponse {
  current_macros: {
    consumed: {
      calories: number;
      protein_g: number;
      carbs_g: number;
      fat_g: number;
    };
    target: {
      calories: number;
      protein_g: number;
      carbs_g: number;
      fat_g: number;
    };
    remaining: {
      calories: number;
      protein_g: number;
      carbs_g: number;
      fat_g: number;
    };
  };
}

const EMPTY_CONNECTIONS: Record<CalBrand, CalendarConnection> = {
  google: { provider: "google", state: "idle", title: "Google Calendar", account_email: null },
  outlook: { provider: "outlook", state: "idle", title: "Outlook", account_email: null },
};

function groupEvents(events: CalEvent[]) {
  const map = new Map<string, { key: string; label: string; items: CalEvent[] }>();
  for (const e of events) {
    if (!map.has(e.dayKey)) map.set(e.dayKey, { key: e.dayKey, label: e.dayLabel, items: [] });
    map.get(e.dayKey)!.items.push(e);
  }
  return Array.from(map.values())
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((g) => ({ ...g, items: g.items.sort((x, y) => x.time.localeCompare(y.time)) }));
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

function mapActivityLevel(activityLevel: number) {
  return (
    ACTIVITY.find((option) => option.macroLevel === activityLevel)?.value ?? "moderate"
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const storedProfile = useQuery(api.profiles.getMine);
  const saveProfile = useMutation(api.profiles.upsertMine);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [googleSyncing, setGoogleSyncing] = useState(false);
  const [outlookSyncing, setOutlookSyncing] = useState(false);
  const [connections, setConnections] = useState<Record<CalBrand, CalendarConnection>>(EMPTY_CONNECTIONS);
  const [calendarGroups, setCalendarGroups] = useState<Array<{ key: string; label: string; items: CalEvent[] }>>([]);
  const [calendarMessage, setCalendarMessage] = useState<string | null>(null);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);

  useEffect(() => {
    if (storedProfile) {
      setProfile(storedProfile);
    }
  }, [storedProfile]);

  useEffect(() => {
    if (!storedProfile) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const connected = params.get("calendar_connected");
    const error = params.get("calendar_error");
    if (connected === "google" || connected === "outlook") {
      setCalendarMessage(`${connected === "google" ? "Google Calendar" : "Outlook"} connected.`);
    } else if (error) {
      setCalendarMessage(`Calendar connection failed: ${error}`);
    }
    if (connected || error) {
      window.history.replaceState({}, "", "/profile");
    }
    void refreshCalendar();
  }, [storedProfile]);

  const googleState: CalState = googleSyncing
    ? "syncing"
    : connections.google.state === "connected"
      ? "connected"
      : "idle";
  const outlookState: CalState = outlookSyncing
    ? "syncing"
    : connections.outlook.state === "connected"
      ? "connected"
      : "idle";

  const totalEvents = calendarGroups.reduce((n, g) => n + g.items.length, 0);
  const highRisk = calendarGroups.reduce(
    (n, g) => n + g.items.filter((e) => e.risk === "high").length,
    0
  );
  const googleEventCount = useMemo(
    () => calendarGroups.flatMap((group) => group.items).filter((event) => event.source === "google").length,
    [calendarGroups]
  );
  const outlookEventCount = useMemo(
    () => calendarGroups.flatMap((group) => group.items).filter((event) => event.source === "outlook").length,
    [calendarGroups]
  );

  function update(field: string, value: unknown) {
    setProfile((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  function toggleRestriction(r: string) {
    setProfile((prev) => {
      const has = prev.restrictions.includes(r);
      return {
        ...prev,
        restrictions: has
          ? prev.restrictions.filter((x) => x !== r)
          : [...prev.restrictions, r],
      };
    });
    setSaved(false);
  }

  function autoCalc() {
    const goals = calcTDEE(profile);
    setProfile((prev) => ({ ...prev, goals }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    try {
      await saveProfile(profile);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function handleOnboardingSubmit(formData: MacroOnboardingFormData) {
    setSaving(true);
    setOnboardingError(null);
    try {
      const response = await fetch("/api/profile/calculate-macros", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to calculate macros.");
      }

      const data = (await response.json()) as MacroResponse;
      const nextProfile: Profile = {
        ...DEFAULT_PROFILE,
        age: formData.age,
        height: formData.height_cm,
        weight: formData.weight_kg,
        gender: formData.gender,
        activity: mapActivityLevel(formData.activity_level),
        goals: {
          calories: Math.round(data.current_macros.target.calories),
          protein: Math.round(data.current_macros.target.protein_g),
          carbs: Math.round(data.current_macros.target.carbs_g),
          fat: Math.round(data.current_macros.target.fat_g),
        },
      };

      localStorage.setItem("macroData", JSON.stringify(data.current_macros));
      await saveProfile(nextProfile);
      setProfile(nextProfile);
      router.push("/dashboard");
    } catch (error) {
      setOnboardingError(
        error instanceof Error
          ? error.message
          : "Failed to connect to the backend. Make sure the API is running.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function connectCalendar(brand: CalBrand) {
    const setter = brand === "google" ? setGoogleSyncing : setOutlookSyncing;
    setter(true);
    try {
      const provider = brand === "google" ? "google" : "microsoft";
      const response = await fetch("/api/auth/link-social", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          provider,
          callbackURL: `/profile?calendar_connected=${brand}`,
          scopes: CALENDAR_SCOPES[brand],
          disableRedirect: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to start calendar connection.");
      }

      const payload = (await response.json()) as {
        url?: string;
        error?: { message?: string };
      };

      if (payload.error?.message) {
        throw new Error(payload.error.message);
      }
      if (!payload.url) {
        throw new Error("Calendar connection URL was not returned.");
      }
      window.location.href = payload.url;
    } catch (error) {
      setCalendarMessage(
        error instanceof Error ? error.message : "Unable to start calendar connection.",
      );
      setter(false);
    }
  }

  async function disconnectCalendar(brand: CalBrand) {
    setCalendarMessage(
      `${brand === "google" ? "Google Calendar" : "Outlook"} access follows your sign-in. Reconnect with that provider to refresh access or sign out to remove it.`,
    );
    if (brand === "google") {
      setGoogleSyncing(false);
    } else {
      setOutlookSyncing(false);
    }
  }

  if (storedProfile === undefined) {
    return (
      <main className="page" style={{ display: "grid", placeItems: "center", minHeight: "calc(100vh - var(--nav-h))" }}>
        <p className="text-muted">Loading profile...</p>
      </main>
    );
  }

  if (storedProfile === null) {
    return (
      <>
        {onboardingError ? (
          <div className="page" style={{ paddingBottom: 0 }}>
            <div className="badge badge-red" style={{ display: "block", padding: "10px 12px", borderRadius: 10 }}>
              {onboardingError}
            </div>
          </div>
        ) : null}
        {saving ? (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4" />
              <p className="text-xl text-gray-700">Calculating your macros...</p>
            </div>
          </div>
        ) : (
          <OnboardingForm onSubmit={handleOnboardingSubmit} />
        )}
      </>
    );
  }

  return (
    <main className="page">
      <div className="mb-6">
        <h1 className="h1">Your Profile</h1>
        <p className="text-muted mt-1">Personalizes coach advice and macro goals.</p>
      </div>

      <div className="card mb-4">
        <div className="section-header">
          <h2 className="h3">Calendar Sync</h2>
          {totalEvents > 0 && (
            <span className="text-muted" style={{ fontSize: 12 }}>
              <span style={{ color: "var(--text)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                {totalEvents}
              </span>{" "}
              events · {highRisk} flagged
            </span>
          )}
        </div>
        <p className="text-muted mb-4" style={{ fontSize: 13 }}>
          Import your week so the coach times meals around flights, hits, and
          briefings. Sign in to the app first, then connect Google Calendar or Outlook only when you want schedule access.
        </p>
        {calendarMessage && (
          <p className="text-muted mb-4" style={{ fontSize: 13, color: "var(--text)" }}>
            {calendarMessage}
          </p>
        )}
        <div className="cal-sources">
          <CalendarSource
            brand="google"
            title="Google Calendar"
            account={connections.google.account_email || "Connect your Google account"}
            eventCount={googleEventCount}
            state={googleState}
            onConnect={() => connectCalendar("google")}
            onDisconnect={() => void disconnectCalendar("google")}
          />
          <CalendarSource
            brand="outlook"
            title="Outlook · Exchange"
            account={connections.outlook.account_email || "Connect your Microsoft account"}
            eventCount={outlookEventCount}
            state={outlookState}
            onConnect={() => connectCalendar("outlook")}
            onDisconnect={() => void disconnectCalendar("outlook")}
          />
        </div>

        {totalEvents > 0 && (
          <div className="cal-events">
            {calendarGroups.map((group, gi) => (
              <div className="cal-day" key={group.key}>
                <div className="cal-day-head">
                  <span className="cal-day-label">{group.label}</span>
                  <span className="cal-day-count">
                    {group.items.length} event{group.items.length === 1 ? "" : "s"}
                  </span>
                </div>
                {group.items.map((evt, i) => (
                  <EventRow key={evt.id} evt={evt} delay={(gi * 4 + i) * 60} />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

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

      <button className="btn btn-primary btn-full" onClick={save} disabled={saving}>
        {saving ? "Saving..." : saved ? "✓ Saved!" : "Save Profile"}
      </button>
    </main>
  );

  async function refreshCalendar() {
    try {
      const [connectionsRes, eventsRes] = await Promise.all([
        fetch("/api/calendar/connections"),
        fetch("/api/calendar/events?days=7"),
      ]);
      if (!connectionsRes.ok || !eventsRes.ok) {
        throw new Error("Failed to load calendar data");
      }

      const connectionPayload: { connections: CalendarConnection[] } = await connectionsRes.json();
      const eventPayload: { events: ApiCalendarEvent[] } = await eventsRes.json();

      const nextConnections = { ...EMPTY_CONNECTIONS };
      for (const connection of connectionPayload.connections) {
        nextConnections[connection.provider] = connection;
      }

      setConnections(nextConnections);
      setCalendarGroups(groupEvents(eventPayload.events.map(toCalEvent)));
      setProfile((prev) => ({
        ...prev,
        calendarConnections: {
          google: nextConnections.google.state === "connected",
          outlook: nextConnections.outlook.state === "connected",
        },
      }));
    } catch {
      setCalendarMessage("Unable to load calendar status right now.");
    } finally {
      setGoogleSyncing(false);
      setOutlookSyncing(false);
    }
  }
}

function toCalEvent(event: ApiCalendarEvent): CalEvent {
  const start = parseCalendarDate(event.starts_at, event.is_all_day);
  const end = parseCalendarDate(event.ends_at, event.is_all_day);
  const risk = inferRisk(start, event.is_all_day);
  return {
    id: event.id,
    dayKey: formatDayKey(start, event.starts_at),
    dayLabel: formatDayLabel(start, event.starts_at),
    time: event.is_all_day ? "All day" : formatTime(start),
    duration: event.is_all_day ? "Flexible" : formatDuration(start, end),
    title: event.title,
    location: event.location || "No location",
    source: event.provider,
    risk,
    hint: buildHint(event, risk),
  };
}

function formatDayKey(date: Date, fallback: string) {
  if (Number.isNaN(date.getTime())) {
    return fallback.slice(0, 10);
  }
  return date.toISOString().slice(0, 10);
}

function formatDayLabel(date: Date, fallback: string) {
  if (Number.isNaN(date.getTime())) {
    return fallback.slice(0, 10);
  }
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).replace(",", " ·");
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function parseCalendarDate(value: string, isAllDay: boolean) {
  if (isAllDay && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(value);
}

function formatDuration(start: Date, end: Date) {
  const minutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours && remainingMinutes) {
    return `${hours}h ${remainingMinutes}m`;
  }
  if (hours) {
    return `${hours}h`;
  }
  return `${remainingMinutes}m`;
}

function inferRisk(start: Date, isAllDay: boolean): CalRisk {
  if (isAllDay) {
    return "low";
  }
  const hour = start.getHours();
  if (hour < 7 || hour >= 21) {
    return "high";
  }
  if (hour < 10 || hour >= 18) {
    return "med";
  }
  return "low";
}

function buildHint(event: ApiCalendarEvent, risk: CalRisk) {
  if (event.is_all_day) {
    return "All-day block. Plan normal meals and avoid drifting into snack grazing.";
  }
  if (risk === "high") {
    return "Tight timing window. Grab protein early so you are not relying on convenience food later.";
  }
  if (risk === "med") {
    return "Moderate schedule pressure. Treat this as a deliberate snack or meal checkpoint.";
  }
  return "Regular meal window. Keep it simple and protein-forward.";
}

function CalendarSource({
  brand, title, account, eventCount, state, onConnect, onDisconnect,
}: {
  brand: CalBrand;
  title: string;
  account: string;
  eventCount: number;
  state: CalState;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  const syncing = state === "syncing";
  const connected = state === "connected";

  return (
    <button
      type="button"
      className="cal-src"
      data-state={state}
      data-brand={brand}
      onClick={connected ? onDisconnect : onConnect}
      disabled={syncing}
      aria-label={
        connected
          ? `Disconnect ${title}`
          : syncing
          ? `Syncing ${title}`
          : `Import from ${title}`
      }
    >
      <span className="cal-src-glyph">
        <BrandGlyph brand={brand} />
      </span>
      <span className="cal-src-body">
        <span className="cal-src-title">
          {connected ? title : `Import from ${title}`}
        </span>
        <span className="cal-src-sub">
          {syncing
            ? "Discovering events..."
            : connected
            ? `${account} · ${eventCount} events synced`
            : account}
        </span>
      </span>
      <span className="cal-src-cta">
        {syncing && <span className="spinner" />}
        {connected && <span>Connected</span>}
        {connected && <span aria-hidden>✓</span>}
        {state === "idle" && <span>Connect</span>}
        {state === "idle" && <span className="cal-src-arrow" aria-hidden>→</span>}
      </span>
      {syncing && <span className="cal-progress" aria-hidden />}
    </button>
  );
}

function BrandGlyph({ brand }: { brand: CalBrand }) {
  if (brand === "google") {
    return (
      <svg viewBox="0 0 32 32" width="32" height="32" aria-hidden>
        <rect x="1" y="1" width="30" height="30" rx="5" fill="#ffffff" stroke="#e8e8e8" />
        <rect x="1" y="1" width="30" height="4" rx="5" fill="#ea4335" />
        <rect x="1" y="27" width="30" height="4" rx="5" fill="#fbbc04" />
        <rect x="1" y="1" width="4" height="30" rx="5" fill="#4285f4" />
        <rect x="27" y="1" width="4" height="30" rx="5" fill="#34a853" />
        <text
          x="16" y="21" textAnchor="middle"
          fontFamily="-apple-system, Inter, sans-serif"
          fontSize="11" fontWeight="700" fill="#111"
        >18</text>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 32 32" width="32" height="32" aria-hidden>
      <rect x="1" y="1" width="30" height="30" rx="5" fill="#0f6cbd" />
      <path
        d="M8 11 L16 17 L24 11 L24 22 L8 22 Z"
        fill="none" stroke="#ffffff" strokeWidth="1.6" strokeLinejoin="round"
      />
      <circle cx="16" cy="14.6" r="2.2" fill="#ffffff" opacity="0.18" />
    </svg>
  );
}

function EventRow({ evt, delay }: { evt: CalEvent; delay: number }) {
  return (
    <div className="cal-evt" style={{ animationDelay: `${delay}ms` }}>
      <div className="cal-evt-time">
        <span className="cal-evt-time-hh">{evt.time}</span>
        <span className="cal-evt-time-dur">{evt.duration}</span>
      </div>
      <div className="cal-evt-main">
        <div className="cal-evt-title">{evt.title}</div>
        <div className="cal-evt-loc">{evt.location}</div>
        <div className="cal-evt-hint">
          <span className={`cal-evt-hint-dot risk-${evt.risk}`} />
          <span>{evt.hint}</span>
        </div>
      </div>
      <span className="cal-evt-tag" data-src={evt.source}>
        {evt.source === "google" ? "gCal" : "Outlook"}
      </span>
    </div>
  );
}
