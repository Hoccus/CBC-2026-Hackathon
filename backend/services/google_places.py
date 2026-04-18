"""
Google Places API wrapper for nearby restaurant search.
Docs: https://developers.google.com/maps/documentation/places/web-service
"""
import os
import math
import requests
from typing import Optional
from models.places import PlaceResult, NearbyPlacesResponse


PLACES_BASE = "https://maps.googleapis.com/maps/api/place"


def _haversine_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Straight-line distance in meters between two lat/lng points."""
    R = 6_371_000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def search_nearby_restaurants(
    latitude: float,
    longitude: float,
    radius: int = 1500,
    keyword: Optional[str] = None,
    open_now: bool = False,
) -> NearbyPlacesResponse:
    api_key = os.getenv("GOOGLE_PLACES_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_PLACES_API_KEY not set")

    params = {
        "location": f"{latitude},{longitude}",
        "radius": radius,
        "type": "restaurant",
        "key": api_key,
    }
    if keyword:
        params["keyword"] = keyword
    if open_now:
        params["opennow"] = "true"

    resp = requests.get(f"{PLACES_BASE}/nearbysearch/json", params=params, timeout=10)
    resp.raise_for_status()
    data = resp.json()

    places: list[PlaceResult] = []
    for r in data.get("results", []):
        loc = r.get("geometry", {}).get("location", {})
        place_lat = loc.get("lat", 0.0)
        place_lng = loc.get("lng", 0.0)

        hours = r.get("opening_hours", {})
        places.append(
            PlaceResult(
                place_id=r["place_id"],
                name=r.get("name", ""),
                address=r.get("vicinity", ""),
                latitude=place_lat,
                longitude=place_lng,
                rating=r.get("rating"),
                price_level=r.get("price_level"),
                open_now=hours.get("open_now"),
                types=r.get("types", []),
                distance_meters=round(
                    _haversine_meters(latitude, longitude, place_lat, place_lng), 1
                ),
            )
        )

    places.sort(key=lambda p: p.distance_meters or 0)
    return NearbyPlacesResponse(places=places, total=len(places))


def get_place_details(place_id: str) -> dict:
    """Fetch full place details including phone, website, and opening hours."""
    api_key = os.getenv("GOOGLE_PLACES_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_PLACES_API_KEY not set")

    params = {
        "place_id": place_id,
        "fields": "name,formatted_address,formatted_phone_number,website,opening_hours,rating,price_level,types,geometry",
        "key": api_key,
    }
    resp = requests.get(f"{PLACES_BASE}/details/json", params=params, timeout=10)
    resp.raise_for_status()
    return resp.json().get("result", {})
