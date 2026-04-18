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

interface PlacePhoto {
  photo_url: string;
  width_px?: number;
  height_px?: number;
  attribution?: string;
}

interface PlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  phone?: string;
  website?: string;
  rating?: number;
  price_level?: number;
  editorial_summary?: string;
  opening_hours_text: string[];
  photos: PlacePhoto[];
}

interface MacroEstimate {
  name: string;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
  sugar_g?: number;
  saturated_fat_g?: number;
  sodium_mg?: number;
  cholesterol_mg?: number;
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

function RestaurantDetailModal({
  enriched,
  onClose,
}: {
  enriched: EnrichedResult;
  onClose: () => void;
}) {
  const [details, setDetails] = useState<PlaceDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [photoIndex, setPhotoIndex] = useState(0);
  const [macros, setMacros] = useState<MacroEstimate | null>(null);
  const [addedToLog, setAddedToLog] = useState(false);

  useEffect(() => {
    if (!enriched.place?.place_id) {
      setLoading(false);
      setError("No place ID available");
      return;
    }
    fetch(`/api/places/${enriched.place.place_id}/details`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch details");
        return res.json();
      })
      .then(setDetails)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [enriched.place?.place_id]);

  useEffect(() => {
    if (!enriched.suggested_order) return;
    fetch(`/api/places/menu-item/macros?query=${encodeURIComponent(enriched.suggested_order)}`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => { if (data) setMacros(data); })
      .catch(() => {});
  }, [enriched.suggested_order]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handler);
    };
  }, [onClose]);

  const photoCount = details?.photos?.length ?? 0;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        {/* Photos */}
        {details?.photos?.length ? (
          <>
            <div className="photo-carousel">
              <img src={details.photos[photoIndex].photo_url} alt={`${details.name} photo ${photoIndex + 1}`} />
              {photoCount > 1 && (
                <>
                  <button className="photo-nav photo-nav-left" onClick={() => setPhotoIndex((photoIndex - 1 + photoCount) % photoCount)}>‹</button>
                  <button className="photo-nav photo-nav-right" onClick={() => setPhotoIndex((photoIndex + 1) % photoCount)}>›</button>
                </>
              )}
            </div>
            {photoCount > 1 && (
              <div className="photo-dots">
                {details.photos.map((_, i) => (
                  <button key={i} className={`photo-dot${i === photoIndex ? " photo-dot-active" : ""}`} onClick={() => setPhotoIndex(i)} />
                ))}
              </div>
            )}
          </>
        ) : !loading ? (
          <div style={{ height: 100, background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "1px solid var(--border)" }}>
            <span className="text-muted">No photos available</span>
          </div>
        ) : null}

        <div style={{ padding: "16px 20px 20px" }}>
          {loading ? (
            <div className="text-center" style={{ padding: "32px 0" }}>
              <span className="spinner" style={{ width: 24, height: 24, borderWidth: 2 }} />
              <p className="text-muted mt-3">Loading details...</p>
            </div>
          ) : error ? (
            <p style={{ color: "#991b1b", fontSize: 13 }}>{error}</p>
          ) : details ? (
            <>
              {/* Header */}
              <div className="flex items-center gap-2 mb-4" style={{ flexWrap: "wrap" }}>
                <ScoreCircle score={enriched.health_score} />
                <div>
                  <p style={{ fontWeight: 700, fontSize: 16 }}>{details.name}</p>
                  {details.rating != null && <StarRating rating={details.rating} />}
                </div>
              </div>

              {/* Suggested order */}
              <p style={{ fontSize: 13, color: "var(--primary-dk)", fontWeight: 600, marginBottom: 8 }}>
                Suggested: {enriched.suggested_order}
              </p>

              {/* Macros */}
              {macros ? (() => {
                const dv = {
                  calories: 2000, protein: 50, carbs: 275, fat: 78,
                  fiber: 28, sugar: 50, satFat: 20, sodium: 2300, cholesterol: 300,
                };
                const pct = (val: number | undefined, ref: number) =>
                  val != null ? Math.round((val / ref) * 100) : null;

                return (
                  <div className="card mb-4" style={{ padding: "14px", background: "#f9fafb" }}>
                    {/* Primary macros */}
                    <div className="grid-4" style={{ textAlign: "center", gap: 6 }}>
                      {macros.calories != null && (
                        <div className="macro-stat">
                          <span className="macro-stat-val" style={{ fontSize: 18 }}>{Math.round(macros.calories)}</span>
                          <span className="macro-stat-label">Cal</span>
                          <span style={{ fontSize: 11, color: "var(--light)" }}>{pct(macros.calories, dv.calories)}% DV</span>
                        </div>
                      )}
                      {macros.protein_g != null && (
                        <div className="macro-stat">
                          <span className="macro-stat-val" style={{ fontSize: 18 }}>{Math.round(macros.protein_g)}g</span>
                          <span className="macro-stat-label">Protein</span>
                          <span style={{ fontSize: 11, color: "var(--light)" }}>{pct(macros.protein_g, dv.protein)}% DV</span>
                        </div>
                      )}
                      {macros.carbs_g != null && (
                        <div className="macro-stat">
                          <span className="macro-stat-val" style={{ fontSize: 18 }}>{Math.round(macros.carbs_g)}g</span>
                          <span className="macro-stat-label">Carbs</span>
                          <span style={{ fontSize: 11, color: "var(--light)" }}>{pct(macros.carbs_g, dv.carbs)}% DV</span>
                        </div>
                      )}
                      {macros.fat_g != null && (
                        <div className="macro-stat">
                          <span className="macro-stat-val" style={{ fontSize: 18 }}>{Math.round(macros.fat_g)}g</span>
                          <span className="macro-stat-label">Fat</span>
                          <span style={{ fontSize: 11, color: "var(--light)" }}>{pct(macros.fat_g, dv.fat)}% DV</span>
                        </div>
                      )}
                    </div>

                    {/* Nutrient profile */}
                    {(macros.fiber_g != null || macros.sugar_g != null || macros.saturated_fat_g != null || macros.sodium_mg != null || macros.cholesterol_mg != null) && (
                      <>
                        <div style={{ height: 1, background: "var(--border)", margin: "12px 0" }} />
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 20px", fontSize: 12 }}>
                          {macros.fiber_g != null && (
                            <div className="flex" style={{ justifyContent: "space-between" }}>
                              <span style={{ color: "var(--muted)" }}>Fiber</span>
                              <span><span style={{ fontWeight: 600 }}>{Math.round(macros.fiber_g)}g</span> <span style={{ color: "var(--light)" }}>{pct(macros.fiber_g, dv.fiber)}%</span></span>
                            </div>
                          )}
                          {macros.sugar_g != null && (
                            <div className="flex" style={{ justifyContent: "space-between" }}>
                              <span style={{ color: "var(--muted)" }}>Sugar</span>
                              <span><span style={{ fontWeight: 600 }}>{Math.round(macros.sugar_g)}g</span> <span style={{ color: "var(--light)" }}>{pct(macros.sugar_g, dv.sugar)}%</span></span>
                            </div>
                          )}
                          {macros.saturated_fat_g != null && (
                            <div className="flex" style={{ justifyContent: "space-between" }}>
                              <span style={{ color: "var(--muted)" }}>Sat. Fat</span>
                              <span><span style={{ fontWeight: 600 }}>{Math.round(macros.saturated_fat_g)}g</span> <span style={{ color: "var(--light)" }}>{pct(macros.saturated_fat_g, dv.satFat)}%</span></span>
                            </div>
                          )}
                          {macros.sodium_mg != null && (
                            <div className="flex" style={{ justifyContent: "space-between" }}>
                              <span style={{ color: "var(--muted)" }}>Sodium</span>
                              <span><span style={{ fontWeight: 600 }}>{Math.round(macros.sodium_mg)}mg</span> <span style={{ color: "var(--light)" }}>{pct(macros.sodium_mg, dv.sodium)}%</span></span>
                            </div>
                          )}
                          {macros.cholesterol_mg != null && (
                            <div className="flex" style={{ justifyContent: "space-between" }}>
                              <span style={{ color: "var(--muted)" }}>Cholesterol</span>
                              <span><span style={{ fontWeight: 600 }}>{Math.round(macros.cholesterol_mg)}mg</span> <span style={{ color: "var(--light)" }}>{pct(macros.cholesterol_mg, dv.cholesterol)}%</span></span>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    <p className="text-muted mt-3" style={{ fontSize: 11, fontStyle: "italic" }}>
                      Estimated from similar restaurant menu items
                    </p>

                    <button
                      className={`btn ${addedToLog ? "btn-secondary" : "btn-primary"} btn-full mt-3`}
                      style={{ fontSize: 13, padding: "8px" }}
                      disabled={addedToLog}
                      onClick={async () => {
                        try {
                          await fetch("/api/macros/log-direct", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              description: `${enriched.suggested_order} (${enriched.name})`,
                              calories: macros.calories ?? 0,
                              protein_g: macros.protein_g ?? 0,
                              carbs_g: macros.carbs_g ?? 0,
                              fat_g: macros.fat_g ?? 0,
                            }),
                          });
                          const entry = {
                            id: crypto.randomUUID(),
                            timestamp: Date.now(),
                            description: `${enriched.suggested_order} (${enriched.name})`,
                            calories: macros.calories ?? 0,
                            protein_g: macros.protein_g ?? 0,
                            carbs_g: macros.carbs_g ?? 0,
                            fat_g: macros.fat_g ?? 0,
                          };
                          const log = JSON.parse(localStorage.getItem("nutricoach_log") || "[]");
                          log.push(entry);
                          localStorage.setItem("nutricoach_log", JSON.stringify(log));
                          setAddedToLog(true);
                        } catch {}
                      }}
                    >
                      {addedToLog ? "Added to Daily Total" : "Add to Daily Macros"}
                    </button>
                  </div>
                );
              })() : (
                <div className="card mb-4" style={{ padding: "14px", background: "#f9fafb", textAlign: "center" }}>
                  <span className="spinner" style={{ width: 14, height: 14, borderWidth: 1.5 }} />
                  <span className="text-muted" style={{ marginLeft: 8, fontSize: 12 }}>Loading nutrition data...</span>
                </div>
              )}

              {/* Detail rows */}
              <div style={{ marginBottom: 16 }}>
                <div className="detail-row">
                  <span className="detail-icon">@</span>
                  <span className="detail-value">{details.formatted_address}</span>
                </div>

                {details.phone && (
                  <div className="detail-row">
                    <span className="detail-icon">T</span>
                    <a href={`tel:${details.phone}`} className="detail-link">{details.phone}</a>
                  </div>
                )}

                {details.website && (
                  <div className="detail-row">
                    <span className="detail-icon">W</span>
                    <a href={details.website} target="_blank" rel="noopener noreferrer" className="detail-link">
                      {(() => { try { return new URL(details.website).hostname; } catch { return details.website; } })()}
                    </a>
                  </div>
                )}

                {details.opening_hours_text.length > 0 && (
                  <div className="detail-row" style={{ flexDirection: "column", gap: 4 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)" }}>Hours</p>
                    {details.opening_hours_text.map((line, i) => (
                      <p key={i} style={{ fontSize: 12, color: "var(--muted)" }}>{line}</p>
                    ))}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                {details.website && (
                  <a href={details.website} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ flex: 1, textDecoration: "none", textAlign: "center" }}>
                    View Menu / Website
                  </a>
                )}
                <a
                  href={`https://www.google.com/maps/place/?q=place_id:${details.place_id}`}
                  target="_blank" rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ flex: 1, textDecoration: "none", textAlign: "center" }}
                >
                  Directions
                </a>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
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
  const [selectedRestaurant, setSelectedRestaurant] = useState<EnrichedResult | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [searchCoords, setSearchCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    try {
      const p = localStorage.getItem("nutricoach_profile");
      if (p) setProfile(JSON.parse(p));
    } catch {}
  }, []);

  async function scorePlaces(places: PlaceResult[]): Promise<EnrichedResult[]> {
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
    return (scored.suggestions as ScoredRestaurant[]).map((s) => ({
      ...s,
      place: placeMap.get(s.name.toLowerCase()),
    }));
  }

  async function searchWithCoords(lat: number, lon: number) {
    setStatus("fetching");
    setResults([]);
    setAllPlaces([]);
    setNextPageToken(null);
    setSearchCoords({ lat, lon });

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
      setNextPageToken(data.next_page_token ?? null);

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
      const enriched = await scorePlaces(places);
      setResults(enriched);
      setStatus("done");
    } catch {
      setStatus("error");
      setErrorMsg("Failed to score restaurants. Please try again.");
    }
  }

  async function loadMore() {
    if (!nextPageToken || !searchCoords) return;
    setLoadingMore(true);

    try {
      const params = new URLSearchParams({
        latitude: searchCoords.lat.toString(),
        longitude: searchCoords.lon.toString(),
        radius: milesToMeters(radiusMiles).toString(),
        page_token: nextPageToken,
      });
      if (keyword.trim()) params.set("keyword", keyword.trim());

      const res = await fetch(`/api/places/nearby?${params}`);
      if (!res.ok) throw new Error("Failed to fetch more restaurants");
      const data = await res.json();
      const newPlaces = data.places as PlaceResult[];
      setAllPlaces((prev) => [...prev, ...newPlaces]);
      setNextPageToken(data.next_page_token ?? null);

      if (newPlaces.length > 0) {
        const enriched = await scorePlaces(newPlaces);
        setResults((prev) => [...prev, ...enriched]);
      }
    } catch {
      // Silently fail — user can try again
    } finally {
      setLoadingMore(false);
    }
  }

  async function locateWithGPS() {
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

  async function searchAddress() {
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
          onClick={locateWithGPS}
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
            onKeyDown={(e) => e.key === "Enter" && !busy && searchAddress()}
            disabled={busy}
          />
          <button
            className="btn btn-secondary"
            onClick={searchAddress}
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

        {/* Radius dropdown */}
        <div className="form-group">
          <label className="label-text">Search radius</label>
          <select
            className="select"
            value={radiusMiles}
            onChange={(e) => setRadiusMiles(Number(e.target.value))}
            disabled={busy}
          >
            <option value={0.5}>0.5 miles</option>
            <option value={1}>1 mile</option>
            <option value={2}>2 miles</option>
            <option value={5}>5 miles</option>
            <option value={10}>10 miles</option>
          </select>
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
                <div key={i} className="card restaurant-item card-hover" onClick={() => setSelectedRestaurant(r)}>
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

          {nextPageToken && (
            <div className="text-center mt-4">
              <button
                className="btn btn-secondary"
                style={{ padding: "10px 32px", fontSize: 14 }}
                onClick={loadMore}
                disabled={loadingMore}
              >
                {loadingMore
                  ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Loading more…</>
                  : "Show More Restaurants"}
              </button>
            </div>
          )}
        </>
      )}
      {selectedRestaurant && (
        <RestaurantDetailModal
          enriched={selectedRestaurant}
          onClose={() => setSelectedRestaurant(null)}
        />
      )}
    </main>
  );
}
