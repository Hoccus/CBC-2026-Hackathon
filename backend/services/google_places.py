"""
Google Places API (New) wrapper.
Docs: https://developers.google.com/maps/documentation/places/web-service/nearby-search
"""
import os
import math
import requests
from typing import Optional
from models.places import PlaceResult, NearbyPlacesResponse


PLACES_BASE = "https://places.googleapis.com/v1/places"

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
    "types,location,nationalPhoneNumber,websiteUri,"
    "regularOpeningHours,photos,editorialSummary"
)


def _haversine_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6_371_000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def _api_key() -> str:
    key = os.getenv("GOOGLE_PLACES_API_KEY")
    if not key:
        raise ValueError("GOOGLE_PLACES_API_KEY not set")
    return key


def _parse_places(raw: list[dict], user_lat: float, user_lng: float) -> list[PlaceResult]:
    places = []
    for r in raw:
        loc = r.get("location", {})
        place_lat = loc.get("latitude", 0.0)
        place_lng = loc.get("longitude", 0.0)

        open_now = r.get("currentOpeningHours", {}).get("openNow")
        price_level = PRICE_LEVEL_MAP.get(r.get("priceLevel", ""))

        places.append(PlaceResult(
            place_id=r.get("id", ""),
            name=r.get("displayName", {}).get("text", ""),
            address=r.get("formattedAddress", ""),
            latitude=place_lat,
            longitude=place_lng,
            rating=r.get("rating"),
            price_level=price_level,
            open_now=open_now,
            types=r.get("types", []),
            distance_meters=round(_haversine_meters(user_lat, user_lng, place_lat, place_lng), 1),
        ))
    return places


def search_nearby_restaurants(
    latitude: float,
    longitude: float,
    radius: int = 1500,
    keyword: Optional[str] = None,
    open_now: bool = False,
    page_token: Optional[str] = None,
) -> NearbyPlacesResponse:
    key = _api_key()
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": SEARCH_FIELD_MASK,
    }

    if keyword:
        # Text search with location bias when a keyword is provided
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
        if page_token:
            body["pageToken"] = page_token
        resp = requests.post(f"{PLACES_BASE}:searchText", json=body, headers=headers, timeout=10)
    else:
        # Nearby search when no keyword
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
        if page_token:
            body["pageToken"] = page_token
        resp = requests.post(f"{PLACES_BASE}:searchNearby", json=body, headers=headers, timeout=10)

    if not resp.ok:
        try:
            err = resp.json().get("error", {})
            msg = err.get("message") or resp.text
        except Exception:
            msg = resp.text
        raise ValueError(f"Google Places API error ({resp.status_code}): {msg}")

    data = resp.json()

    if "error" in data:
        code = data["error"].get("status", "UNKNOWN")
        msg = data["error"].get("message", "")
        raise ValueError(f"Google Places API error: {code}. {msg}".strip(". "))

    places = _parse_places(data.get("places", []), latitude, longitude)

    if open_now:
        places = [p for p in places if p.open_now is True]

    places.sort(key=lambda p: p.distance_meters or 0)

    next_page_token = data.get("nextPageToken")
    return NearbyPlacesResponse(places=places, total=len(places), next_page_token=next_page_token)


def get_place_details(place_id: str) -> dict:
    """Fetch place details and return a normalised dict with 'name' and 'types' keys."""
    key = _api_key()
    headers = {
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": DETAIL_FIELD_MASK,
    }
    resp = requests.get(f"{PLACES_BASE}/{place_id}", headers=headers, timeout=10)
    resp.raise_for_status()
    data = resp.json()

    if "error" in data:
        code = data["error"].get("status", "UNKNOWN")
        msg = data["error"].get("message", "")
        raise ValueError(f"Google Places API error: {code}. {msg}".strip(". "))

    # Normalise to the shape the router expects
    return {
        "name": data.get("displayName", {}).get("text", ""),
        "types": data.get("types", []),
        "formatted_address": data.get("formattedAddress", ""),
        "rating": data.get("rating"),
        "phone": data.get("nationalPhoneNumber"),
        "website": data.get("websiteUri"),
    }


def get_place_details_full(place_id: str) -> dict:
    """Fetch full place details including photos and opening hours."""
    key = _api_key()
    headers = {
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": DETAIL_FIELD_MASK,
    }
    resp = requests.get(f"{PLACES_BASE}/{place_id}", headers=headers, timeout=10)
    resp.raise_for_status()
    data = resp.json()

    # Build photo URLs (limit to 5)
    photos = []
    for photo in data.get("photos", [])[:5]:
        photo_name = photo.get("name", "")
        if photo_name:
            photo_url = (
                f"https://places.googleapis.com/v1/{photo_name}/media"
                f"?maxHeightPx=400&maxWidthPx=600&key={key}"
            )
            attrs = photo.get("authorAttributions", [])
            attribution = attrs[0].get("displayName", "") if attrs else ""
            photos.append({
                "photo_url": photo_url,
                "width_px": photo.get("widthPx"),
                "height_px": photo.get("heightPx"),
                "attribution": attribution,
            })

    hours = data.get("regularOpeningHours", {})
    editorial = data.get("editorialSummary", {})

    return {
        "place_id": data.get("id", ""),
        "name": data.get("displayName", {}).get("text", ""),
        "formatted_address": data.get("formattedAddress", ""),
        "phone": data.get("nationalPhoneNumber"),
        "website": data.get("websiteUri"),
        "rating": data.get("rating"),
        "price_level": PRICE_LEVEL_MAP.get(data.get("priceLevel", "")),
        "editorial_summary": editorial.get("text") if isinstance(editorial, dict) else None,
        "opening_hours_text": hours.get("weekdayDescriptions", []),
        "photos": photos,
    }
