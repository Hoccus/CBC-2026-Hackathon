"use client";

import { useEffect, useState } from "react";

interface PlaceResult {
  place_id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  rating?: number;
  price_level?: number;
  open_now?: boolean;
  types: string[];
  distance_meters?: number;
}

interface ScoredRestaurant {
  name: string;
  health_score: number;
  suggested_order: string;
  reasoning: string;
}

interface EnrichedResult extends ScoredRestaurant {
  place?: PlaceResult;
}

interface Profile {
  restrictions: string[];
  goals: { calories: number };
}

const PRICE_SYMBOLS = ["Free", "$", "$$", "$$$", "$$$$"];
const METERS_PER_MILE = 1609.34;

function metersToMiles(m: number) { return m / METERS_PER_MILE; }
function milesToMeters(mi: number) { return Math.round(mi * METERS_PER_MILE); }
function fmtMiles(mi: number) { return mi === 1 ? "1 mile" : `${mi % 1 === 0 ? mi : mi.toFixed(2)} miles`; }

function formatDistance(m?: number) {
  if (m == null) return null;
  const mi = metersToMiles(m);
  return mi < 0.1 ? `${Math.round(m)} ft` : `${mi.toFixed(1)} mi`;
}

function ScoreCircle({ score }: { score: number }) {
  const cls = score >= 7 ? "score-high" : score >= 5 ? "score-mid" : "score-low";
  return <div className={`score-circle ${cls}`}>{score}</div>;
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span style={{ fontSize: 12, color: "#ca8a04", letterSpacing: 1 }}>
      {"★".repeat(full)}{half ? "½" : ""}{"☆".repeat(5 - full - (half ? 1 : 0))}
      <span style={{ color: "var(--muted)", marginLeft: 4 }}>{rating.toFixed(1)}</span>
    </span>
  );
}

async function geocodeAddress(query: string): Promise<{ lat: number; lon: number; display: string }> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
    { headers: { "Accept-Language": "en" } }
  );
  if (!res.ok) throw new Error("Geocoding request failed");
  const data = await res.json();
  if (!data.length) throw new Error(`No results found for "${query}"`);
  return {
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon),
    display: data[0].display_name.split(",").slice(0, 2).join(",").trim(),
  };
}

export default function RestaurantsPage() {
  const [status, setStatus] = useState<"idle" | "locating" | "fetching" | "scoring" | "done" | "error">("idle");
  const [results, setResults] = useState<EnrichedResult[]>([]);
  const [allPlaces, setAllPlaces] = useState<PlaceResult[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [locationName, setLocationName] = useState("");
  const [keyword, setKeyword] = useState("");
  const [addressInput, setAddressInput] = useState("");
  const [radiusMiles, setRadiusMiles] = useState(1);

  useEffect(() => {
    try {
      const p = localStorage.getItem("nutricoach_profile");
      if (p) setProfile(JSON.parse(p));
    } catch {}
  }, []);

  async function searchWithCoords(lat: number, lon: number) {
    setStatus("fetching");
    setResults([]);
    setAllPlaces([]);

    let places: PlaceResult[] = [];
    try {
      const params = new URLSearchParams({
        latitude: lat.toString(),
        longitude: lon.toString(),
        radius: milesToMeters(radiusMiles).toString(),
      });
      if (keyword.trim()) params.set("keyword", keyword.trim());

      const res = await fetch(`/api/places/nearby?${params}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }
      const data = await res.json();
      places = (data.places as PlaceResult[]).slice(0, 20);
      setAllPlaces(places);

      if (!locationName && places[0]?.address) {
        setLocationName(places[0].address.split(",").slice(-2).join(",").trim());
      }
    } catch (e: unknown) {
      setStatus("error");
      setErrorMsg(`Could not fetch nearby restaurants: ${e instanceof Error ? e.message : e}`);
      return;
    }

    if (places.length === 0) {
      setStatus("error");
      setErrorMsg(`No restaurants found within ${fmtMiles(radiusMiles)}. Try a larger radius or different keyword.`);
      return;
    }

    setStatus("scoring");

    try {
      const restaurants = places.map((p) => ({
        name: p.name,
        cuisine: p.types.filter((t) => !["food", "point_of_interest", "establishment", "restaurant"].includes(t)).join(", "),
        amenity: "restaurant",
      }));

      const res = await fetch("/api/restaurants/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurants,
          dietary_restrictions: profile?.restrictions ?? [],
          calorie_goal: profile?.goals?.calories ?? 2000,
          context: "traveling correspondent eating on the go",
        }),
      });
      if (!res.ok) throw new Error("Scoring failed");
      const scored = await res.json();

      const placeMap = new Map(places.map((p) => [p.name.toLowerCase(), p]));
      setResults((scored.suggestions as ScoredRestaurant[]).map((s) => ({
        ...s,
        place: placeMap.get(s.name.toLowerCase()),
      })));
      setStatus("done");
    } catch {
      setStatus("error");
      setErrorMsg("Failed to score restaurants. Please try again.");
    }
  }

  async function useGPS() {
    setStatus("locating");
    setErrorMsg("");
    setLocationName("");
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000 })
      );
      await searchWithCoords(pos.coords.latitude, pos.coords.longitude);
    } catch {
      setStatus("error");
      setErrorMsg("Location access denied. Enable location permissions in your browser, or enter an address below.");
    }
  }

  async function useAddress() {
    if (!addressInput.trim()) return;
    setStatus("locating");
    setErrorMsg("");
    setLocationName("");
    try {
      const geo = await geocodeAddress(addressInput.trim());
      setLocationName(geo.display);
      await searchWithCoords(geo.lat, geo.lon);
    } catch (e: unknown) {
      setStatus("error");
      setErrorMsg(e instanceof Error ? e.message : "Could not find that address.");
    }
  }

  const busy = status === "locating" || status === "fetching" || status === "scoring";

  return (
    <main className="page">
      <div className="mb-6">
        <h1 className="h1">Nearby Restaurants</h1>
        <p className="text-muted mt-1">Find the healthiest options near you, scored for your goals.</p>
      </div>

      {profile?.restrictions?.length ? (
        <div className="flex gap-2 mb-4" style={{ flexWrap: "wrap" }}>
          {profile.restrictions.map((r) => <span key={r} className="badge badge-green">{r}</span>)}
        </div>
      ) : null}

      {/* Search panel */}
      <div className="card mb-4" style={{ padding: "20px" }}>

        {/* GPS button — primary action */}
        <button
          className="btn btn-primary btn-full"
          style={{ padding: "11px", fontSize: 14 }}
          onClick={useGPS}
          disabled={busy}
        >
          {busy && status === "locating" && !addressInput
            ? <><span className="spinner" style={{ borderColor: "#ffffff55", borderTopColor: "#fff" }} /> Locating…</>
            : <>📍 Use my current location</>}
        </button>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "14px 0" }}>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span style={{ fontSize: 12, color: "var(--light)", fontWeight: 500 }}>or</span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        {/* Address input */}
        <div className="flex gap-2">
          <input
            className="input"
            placeholder="City, zip code, or address"
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !busy && useAddress()}
            disabled={busy}
          />
          <button
            className="btn btn-secondary"
            onClick={useAddress}
            disabled={busy || !addressInput.trim()}
            style={{ whiteSpace: "nowrap" }}
          >
            {busy && status === "locating" && addressInput ? <span className="spinner" /> : "Search"}
          </button>
        </div>

        <div style={{ height: 1, background: "var(--border)", margin: "14px 0" }} />

        {/* Cuisine keyword */}
        <div className="form-group" style={{ marginBottom: 14 }}>
          <label className="label-text">Cuisine (optional)</label>
          <input
            className="input"
            placeholder='e.g. "sushi", "salad", "healthy", "mexican"'
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            disabled={busy}
          />
        </div>

        {/* Radius slider */}
        <div className="form-group">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label className="label-text">Search radius</label>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{fmtMiles(radiusMiles)}</span>
          </div>
          <input
            type="range"
            min={0.25}
            max={10}
            step={0.25}
            value={radiusMiles}
            onChange={(e) => setRadiusMiles(Number(e.target.value))}
            style={{ width: "100%", accentColor: "var(--text)", cursor: "pointer", marginTop: 6 }}
          />
          <div className="flex" style={{ justifyContent: "space-between" }}>
            <span className="text-muted" style={{ fontSize: 11 }}>¼ mile</span>
            <span className="text-muted" style={{ fontSize: 11 }}>10 miles</span>
          </div>
        </div>
      </div>

      {/* Loading */}
      {busy && (
        <div className="card text-center" style={{ padding: "40px 24px" }}>
          <span className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
          <p className="mt-4" style={{ fontWeight: 600 }}>
            {status === "locating" && "Finding your location…"}
            {status === "fetching" && "Searching Google Places…"}
            {status === "scoring" && "Scoring restaurants for your goals…"}
          </p>
          {(status === "fetching" || status === "scoring") && allPlaces.length > 0 && (
            <p className="text-muted mt-2">{allPlaces.length} places found</p>
          )}
        </div>
      )}

      {/* Error */}
      {!busy && status === "error" && (
        <div className="card" style={{ padding: "20px", borderColor: "#fecaca", background: "#fef2f2" }}>
          <p style={{ fontWeight: 600, color: "#991b1b", marginBottom: 4 }}>Could not load restaurants</p>
          <p style={{ fontSize: 13, color: "#b91c1c" }}>{errorMsg}</p>
        </div>
      )}

      {/* Results */}
      {!busy && status === "done" && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <p className="text-muted">
              Top picks near <strong>{locationName}</strong>
              <span style={{ marginLeft: 6, color: "var(--light)" }}>· {allPlaces.length} found within {fmtMiles(radiusMiles)}</span>
            </p>
          </div>

          <div className="flex-col gap-3">
            {results.map((r, i) => {
              const p = r.place;
              return (
                <div key={i} className="card restaurant-item card-hover">
                  <ScoreCircle score={r.health_score} />
                  <div className="restaurant-info">
                    <div className="flex items-center gap-2" style={{ flexWrap: "wrap" }}>
                      <p style={{ fontWeight: 700, fontSize: 15 }}>{r.name}</p>
                      {p?.open_now === true  && <span className="badge badge-green">Open</span>}
                      {p?.open_now === false && <span className="badge badge-red">Closed</span>}
                      {p?.price_level != null && (
                        <span className="badge badge-gray">{PRICE_SYMBOLS[p.price_level]}</span>
                      )}
                    </div>

                    {p && (
                      <div className="flex items-center gap-3 mt-1" style={{ flexWrap: "wrap" }}>
                        {p.rating != null && <StarRating rating={p.rating} />}
                        {p.distance_meters != null && (
                          <span className="text-muted">{formatDistance(p.distance_meters)}</span>
                        )}
                        {p.address && (
                          <span className="text-muted" style={{ fontSize: 12 }}>{p.address}</span>
                        )}
                      </div>
                    )}

                    <p style={{ fontSize: 13, color: "var(--primary-dk)", fontWeight: 600, marginTop: 6 }}>
                      Suggested: {r.suggested_order}
                    </p>
                    <p className="text-muted mt-1" style={{ fontSize: 13 }}>{r.reasoning}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}
