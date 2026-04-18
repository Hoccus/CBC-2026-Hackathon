import os

import httpx
from fastapi import HTTPException


PLACES_NEARBY_URL = "https://places.googleapis.com/v1/places:searchNearby"
GEOCODE_REVERSE_URL = "https://geocode.googleapis.com/v4/geocode/location"
PLACES_FIELD_MASK = ",".join(
    [
        "places.displayName",
        "places.formattedAddress",
        "places.googleMapsUri",
        "places.location",
        "places.primaryType",
        "places.types",
    ]
)


def _required_api_key() -> str:
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GOOGLE_MAPS_API_KEY not set")
    return api_key


async def search_nearby_restaurants(
    latitude: float,
    longitude: float,
    radius_m: float = 1200,
    max_results: int = 15,
) -> list[dict]:
    payload = {
        "includedTypes": ["restaurant"],
        "maxResultCount": max_results,
        "rankPreference": "DISTANCE",
        "locationRestriction": {
            "circle": {
                "center": {"latitude": latitude, "longitude": longitude},
                "radius": radius_m,
            }
        },
    }

    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.post(
            PLACES_NEARBY_URL,
            json=payload,
            headers={
                "Content-Type": "application/json",
                "X-Goog-Api-Key": _required_api_key(),
                "X-Goog-FieldMask": PLACES_FIELD_MASK,
            },
        )
        response.raise_for_status()
        data = response.json()

    return data.get("places", [])


async def reverse_geocode_label(latitude: float, longitude: float) -> str | None:
    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.get(
            GEOCODE_REVERSE_URL,
            params={
                "location.latitude": latitude,
                "location.longitude": longitude,
                "key": _required_api_key(),
            },
        )
        response.raise_for_status()
        data = response.json()

    results = data.get("results", [])
    if not results:
        return None

    first = results[0]
    formatted = first.get("formattedAddress")
    if formatted:
        return formatted
    return None
