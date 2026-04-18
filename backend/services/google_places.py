"""
Google Places API helpers.
Supports the newer richer /places router from main, plus the older nearby
restaurant flow used by /restaurants/nearby.
"""
import math
import os
from typing import Optional

import httpx
import requests

from models.places import NearbyPlacesResponse, PlaceResult

PLACES_BASE = "https://places.googleapis.com/v1/places"
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

PRICE_LEVEL_MAP = {
    "PRICE_LEVEL_FREE": 0,
    "PRICE_LEVEL_INEXPENSIVE": 1,
    "PRICE_LEVEL_MODERATE": 2,
    "PRICE_LEVEL_EXPENSIVE": 3,
    "PRICE_LEVEL_VERY_EXPENSIVE": 4,
}

SEARCH_FIELD_MASK = (
    "places.id,places.displayName,places.location,places.rating,"
    "places.priceLevel,places.currentOpeningHours,places.types,places.formattedAddress"
)

DETAIL_FIELD_MASK = (
    "id,displayName,formattedAddress,rating,priceLevel,"
    "types,location,nationalPhoneNumber,websiteUri,regularOpeningHours"
)


def _haversine_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius = 6_371_000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return 2 * radius * math.asin(math.sqrt(a))


def _api_key() -> str:
    key = os.getenv("GOOGLE_PLACES_API_KEY") or os.getenv("GOOGLE_MAPS_API_KEY")
    if not key:
        raise ValueError("GOOGLE_PLACES_API_KEY not set")
    return key


def _parse_places(raw: list[dict], user_lat: float, user_lng: float) -> list[PlaceResult]:
    places = []
    for entry in raw:
        loc = entry.get("location", {})
        place_lat = loc.get("latitude", 0.0)
        place_lng = loc.get("longitude", 0.0)

        open_now = entry.get("currentOpeningHours", {}).get("openNow")
        price_level = PRICE_LEVEL_MAP.get(entry.get("priceLevel", ""))

        places.append(
            PlaceResult(
                place_id=entry.get("id", ""),
                name=entry.get("displayName", {}).get("text", ""),
                address=entry.get("formattedAddress", ""),
                latitude=place_lat,
                longitude=place_lng,
                rating=entry.get("rating"),
                price_level=price_level,
                open_now=open_now,
                types=entry.get("types", []),
                distance_meters=round(_haversine_meters(user_lat, user_lng, place_lat, place_lng), 1),
            )
        )
    return places


def search_nearby_restaurants(
    latitude: float,
    longitude: float,
    radius: int = 1500,
    keyword: Optional[str] = None,
    open_now: bool = False,
) -> NearbyPlacesResponse:
    key = _api_key()
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": SEARCH_FIELD_MASK,
    }

    if keyword:
        body = {
            "textQuery": keyword,
            "includedType": "restaurant",
            "maxResultCount": 20,
            "locationBias": {
                "circle": {
                    "center": {"latitude": latitude, "longitude": longitude},
                    "radius": float(radius),
                }
            },
        }
        response = requests.post(f"{PLACES_BASE}:searchText", json=body, headers=headers, timeout=10)
    else:
        body = {
            "includedTypes": ["restaurant"],
            "maxResultCount": 20,
            "locationRestriction": {
                "circle": {
                    "center": {"latitude": latitude, "longitude": longitude},
                    "radius": float(radius),
                }
            },
        }
        response = requests.post(f"{PLACES_BASE}:searchNearby", json=body, headers=headers, timeout=10)

    if not response.ok:
        try:
            err = response.json().get("error", {})
            message = err.get("message") or response.text
        except Exception:
            message = response.text
        raise ValueError(f"Google Places API error ({response.status_code}): {message}")

    data = response.json()

    if "error" in data:
        code = data["error"].get("status", "UNKNOWN")
        message = data["error"].get("message", "")
        raise ValueError(f"Google Places API error: {code}. {message}".strip(". "))

    places = _parse_places(data.get("places", []), latitude, longitude)

    if open_now:
        places = [p for p in places if p.open_now is True]

    places.sort(key=lambda place: place.distance_meters or 0)
    return NearbyPlacesResponse(places=places, total=len(places))


def get_place_details(place_id: str) -> dict:
    key = _api_key()
    headers = {
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": DETAIL_FIELD_MASK,
    }
    response = requests.get(f"{PLACES_BASE}/{place_id}", headers=headers, timeout=10)
    response.raise_for_status()
    data = response.json()

    if "error" in data:
        code = data["error"].get("status", "UNKNOWN")
        message = data["error"].get("message", "")
        raise ValueError(f"Google Places API error: {code}. {message}".strip(". "))

    return {
        "name": data.get("displayName", {}).get("text", ""),
        "types": data.get("types", []),
        "formatted_address": data.get("formattedAddress", ""),
        "rating": data.get("rating"),
        "phone": data.get("nationalPhoneNumber"),
        "website": data.get("websiteUri"),
    }


async def search_nearby_restaurants_legacy(
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
                "X-Goog-Api-Key": _api_key(),
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
                "key": _api_key(),
            },
        )
        response.raise_for_status()
        data = response.json()

    results = data.get("results", [])
    if not results:
        return None

    formatted = results[0].get("formattedAddress")
    return formatted or None
