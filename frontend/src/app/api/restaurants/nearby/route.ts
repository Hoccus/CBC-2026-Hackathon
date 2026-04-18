import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface OverpassElement {
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

function inferCuisine(tags: Record<string, string>) {
  return tags.cuisine?.replace(/_/g, " ") || "";
}

function buildMapsUrl(lat: number, lon: number, label: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${label} ${lat},${lon}`,
  )}`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      latitude?: number;
      longitude?: number;
      radius_m?: number;
      max_results?: number;
    };

    if (typeof body.latitude !== "number" || typeof body.longitude !== "number") {
      return NextResponse.json(
        { detail: "Latitude and longitude are required." },
        { status: 400 },
      );
    }

    const radius = Math.max(200, Math.min(body.radius_m ?? 1200, 5000));
    const maxResults = Math.max(1, Math.min(body.max_results ?? 15, 20));

    const overpassQuery = `
[out:json][timeout:15];
(
  nwr(around:${radius},${body.latitude},${body.longitude})["amenity"="restaurant"];
  nwr(around:${radius},${body.latitude},${body.longitude})["amenity"="fast_food"];
  nwr(around:${radius},${body.latitude},${body.longitude})["amenity"="cafe"];
);
out center tags ${maxResults};
`;

    const [placesResponse, geocodeResponse] = await Promise.all([
      fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: { "content-type": "text/plain" },
        body: overpassQuery,
      }),
      fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${body.latitude}&lon=${body.longitude}`,
        {
          headers: {
            "user-agent": "NutriCoach/1.0",
          },
        },
      ),
    ]);

    if (!placesResponse.ok) {
      throw new Error("Nearby restaurant search failed");
    }

    const placesData = (await placesResponse.json()) as { elements?: OverpassElement[] };
    const geocodeData = geocodeResponse.ok
      ? ((await geocodeResponse.json()) as { display_name?: string })
      : null;

    const seen = new Set<string>();
    const restaurants = (placesData.elements ?? [])
      .map((element) => {
        const lat = element.lat ?? element.center?.lat;
        const lon = element.lon ?? element.center?.lon;
        const tags = element.tags ?? {};
        const name = tags.name?.trim();

        if (!name || lat == null || lon == null || seen.has(name)) {
          return null;
        }
        seen.add(name);

        return {
          name,
          cuisine: inferCuisine(tags),
          amenity: tags.amenity || "restaurant",
          address: [tags["addr:housenumber"], tags["addr:street"], tags["addr:city"]]
            .filter(Boolean)
            .join(" ")
            || undefined,
          maps_url: buildMapsUrl(lat, lon, name),
        };
      })
      .filter(Boolean)
      .slice(0, maxResults);

    return NextResponse.json({
      location_name: geocodeData?.display_name || null,
      restaurants,
    });
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Could not fetch nearby restaurants";
    return NextResponse.json({ detail }, { status: 500 });
  }
}
