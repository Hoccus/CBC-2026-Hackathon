"use client";

import { api } from "@convex/_generated/api";
import { Profile } from "@/lib/persistence";
import { useQuery } from "convex/react";
import { useState } from "react";

interface NearbyRestaurant {
  name: string;
  cuisine: string;
  amenity: string;
  address?: string;
  maps_url?: string;
}

interface ScoredRestaurant {
  name: string;
  health_score: number;
  suggested_order: string;
  reasoning: string;
  address?: string;
  maps_url?: string;
}

function ScoreCircle({ score }: { score: number }) {
  const cls = score >= 7 ? "score-high" : score >= 5 ? "score-mid" : "score-low";
  return <div className={`score-circle ${cls}`}>{score}</div>;
}

export default function RestaurantsPage() {
  const profile = useQuery(api.profiles.getMine) as Profile | null | undefined;
  const [status, setStatus] = useState<"idle" | "locating" | "fetching" | "scoring" | "done" | "error">("idle");
  const [results, setResults] = useState<ScoredRestaurant[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [locationName, setLocationName] = useState("");

  async function findRestaurants() {
    setStatus("locating");
    setResults([]);
    setErrorMsg("");

    let lat: number, lon: number;
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000 })
      );
      lat = pos.coords.latitude;
      lon = pos.coords.longitude;
    } catch {
      setStatus("error");
      setErrorMsg("Location access denied. Please enable location permissions and try again.");
      return;
    }

    setLocationName("your area");

    setStatus("fetching");

    let restaurants: NearbyRestaurant[] = [];
    try {
      const res = await fetch("/api/restaurants/nearby", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: lat,
          longitude: lon,
          radius_m: 1200,
          max_results: 15,
        }),
      });
      if (!res.ok) {
        throw new Error("Nearby search failed");
      }
      const data: { location_name?: string | null; restaurants: NearbyRestaurant[] } = await res.json();
      restaurants = data.restaurants;
      if (data.location_name) {
        setLocationName(data.location_name);
      }
    } catch {
      setStatus("error");
      setErrorMsg("Could not fetch nearby restaurants. Try again in a moment.");
      return;
    }

    if (restaurants.length === 0) {
      setStatus("error");
      setErrorMsg("No nearby restaurants found within 1.2 km.");
      return;
    }

    setStatus("scoring");

    try {
      const res = await fetch("/api/restaurants/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurants,
          dietary_restrictions: profile?.restrictions ?? [],
          calorie_goal: profile?.goals.calories ?? 2000,
          context: "traveling correspondent eating on the go",
        }),
      });
      if (!res.ok) throw new Error("Scoring failed");
      const data = await res.json();
      setResults(data.suggestions);
      setStatus("done");
    } catch {
      setStatus("error");
      setErrorMsg("Failed to score restaurants. Please try again.");
    }
  }

  return (
    <main className="page">
      <div className="mb-6">
        <h1 className="h1">Nearby Restaurants</h1>
        <p className="text-muted mt-1">Find the healthiest options within walking distance and score them for your goals.</p>
      </div>

      {profile?.restrictions?.length ? (
        <div className="flex gap-2 mb-4" style={{ flexWrap: "wrap" }}>
          {profile.restrictions.map((r) => <span key={r} className="badge badge-green">{r}</span>)}
        </div>
      ) : null}

      {status === "idle" || status === "error" ? (
        <div className="card text-center" style={{ padding: "48px 24px" }}>
          <p style={{ fontSize: 48, marginBottom: 12 }}>📍</p>
          <h2 className="h2 mb-4">Find what&apos;s nearby</h2>
          <p className="text-muted mb-6">We&apos;ll use your location to pull nearby restaurants within 1.2 km and rank them by how well they match your nutrition goals.</p>
          {status === "error" && (
            <div className="badge badge-red mb-4" style={{ display: "block", padding: "8px 12px", borderRadius: 8, marginBottom: 16 }}>{errorMsg}</div>
          )}
          <button className="btn btn-primary" style={{ padding: "12px 32px", fontSize: 15 }} onClick={findRestaurants}>
            Use My Location
          </button>
        </div>
      ) : status === "locating" || status === "fetching" || status === "scoring" ? (
        <div className="card text-center" style={{ padding: "48px 24px" }}>
          <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
          <p className="mt-4" style={{ fontWeight: 600 }}>
            {status === "locating" && "Getting your location..."}
            {status === "fetching" && "Finding nearby restaurants..."}
            {status === "scoring" && "Scoring restaurants for your goals..."}
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 mb-4">
            <p className="text-muted">Top picks near <strong>{locationName}</strong></p>
            <button className="btn btn-secondary btn-sm" onClick={findRestaurants}>Refresh</button>
          </div>
          <div className="flex-col gap-3">
            {results.map((r, i) => (
              <div key={i} className="card restaurant-item">
                <ScoreCircle score={r.health_score} />
                <div className="restaurant-info">
                  <p style={{ fontWeight: 700, fontSize: 16 }}>{r.name}</p>
                  {r.address && (
                    <p className="text-muted mt-1" style={{ fontSize: 13 }}>{r.address}</p>
                  )}
                  <p style={{ fontSize: 13, color: "var(--primary-dk)", fontWeight: 600, marginTop: 2 }}>
                    Suggested: {r.suggested_order}
                  </p>
                  <p className="text-muted mt-1" style={{ fontSize: 13 }}>{r.reasoning}</p>
                  {r.maps_url && (
                    <p className="mt-2" style={{ fontSize: 13 }}>
                      <a href={r.maps_url} target="_blank" rel="noreferrer">Open in Google Maps</a>
                    </p>
                  )}
                </div>
                <div style={{ flexShrink: 0 }}>
                  <span className="badge badge-gray">#{i + 1}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
