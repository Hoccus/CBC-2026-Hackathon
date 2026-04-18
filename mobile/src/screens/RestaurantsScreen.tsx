import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import Slider from '@react-native-community/slider';
import { useFocusEffect } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { API_BASE } from '../config';
import { colors, radius, type as T } from '../theme';
import { getProfile } from '../storage';
import { Profile, ScoredRestaurant } from '../types';

interface NearbyPlace {
  place_id: string;
  name: string;
  address: string;
  rating: number | null;
  price_level: number | null;
  open_now: boolean | null;
  types: string[];
  distance_meters: number | null;
}

interface EnrichedResult extends ScoredRestaurant {
  place?: NearbyPlace;
}

type Status = 'idle' | 'locating' | 'fetching' | 'scoring' | 'done' | 'error';

const PRICE_SYMBOLS = ['Free', '$', '$$', '$$$', '$$$$'];
const METERS_PER_MILE = 1609.34;
const GENERIC_TYPES = new Set(['restaurant', 'food', 'point_of_interest', 'establishment', 'store']);

function metersToMiles(m: number) { return m / METERS_PER_MILE; }
function milesToMeters(mi: number) { return Math.round(mi * METERS_PER_MILE); }
function fmtMiles(mi: number) {
  if (mi === 1) return '1 mile';
  return mi % 1 === 0 ? `${mi} miles` : `${mi.toFixed(2)} miles`;
}
function formatDistance(m?: number | null) {
  if (m == null) return null;
  const mi = metersToMiles(m);
  return mi < 0.1 ? `${Math.round(m)} ft` : `${mi.toFixed(1)} mi`;
}

function cuisineFromTypes(types: string[]): string {
  return types.filter((t) => !GENERIC_TYPES.has(t)).join(', ');
}

async function geocodeAddress(query: string): Promise<{ lat: number; lon: number; display: string }> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
    { headers: { 'Accept-Language': 'en', 'User-Agent': 'NutriCoach/1.0' } }
  );
  if (!res.ok) throw new Error('Geocoding request failed');
  const data = await res.json();
  if (!data.length) throw new Error(`No results found for "${query}"`);
  return {
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon),
    display: data[0].display_name.split(',').slice(0, 2).join(',').trim(),
  };
}

function ScoreCircle({ score }: { score: number }) {
  const high = score >= 7;
  const mid = score >= 5 && score < 7;
  const bg = high ? colors.scoreHighBg : mid ? colors.scoreMidBg : colors.scoreLowBg;
  const fg = high ? colors.scoreHighFg : mid ? colors.scoreMidFg : colors.scoreLowFg;
  const border = high ? '#d1fae5' : mid ? '#fef08a' : '#fecaca';
  return (
    <View style={[styles.scoreCircle, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[styles.scoreText, { color: fg }]}>{score}</Text>
    </View>
  );
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <Text style={styles.stars}>
      {'★'.repeat(full)}{half ? '½' : ''}{'☆'.repeat(Math.max(0, empty))}
      <Text style={{ color: colors.muted }}>  {rating.toFixed(1)}</Text>
    </Text>
  );
}

export default function RestaurantsScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const [status, setStatus] = useState<Status>('idle');
  const [results, setResults] = useState<EnrichedResult[]>([]);
  const [allPlaces, setAllPlaces] = useState<NearbyPlace[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [locationName, setLocationName] = useState('');
  const [keyword, setKeyword] = useState('');
  const [addressInput, setAddressInput] = useState('');
  const [radiusMiles, setRadiusMiles] = useState(1);

  useFocusEffect(
    useCallback(() => {
      (async () => setProfile(await getProfile()))();
    }, [])
  );

  async function searchWithCoords(lat: number, lon: number, locName?: string) {
    setStatus('fetching');
    setResults([]);
    setAllPlaces([]);

    let places: NearbyPlace[] = [];
    try {
      const res = await fetch(`${API_BASE}/api/places/nearby`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: lat,
          longitude: lon,
          radius: milesToMeters(radiusMiles),
          keyword: keyword.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }
      const data = await res.json();
      places = (data.places ?? []).slice(0, 20);
      setAllPlaces(places);

      if (!locName && places[0]?.address) {
        setLocationName(places[0].address.split(',').slice(-2).join(',').trim());
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setStatus('error');
      setErrorMsg(msg.includes('GOOGLE_PLACES_API_KEY')
        ? 'Backend is missing GOOGLE_PLACES_API_KEY. Set it in backend/.env and restart.'
        : `Could not fetch nearby restaurants: ${msg}`);
      return;
    }

    if (places.length === 0) {
      setStatus('error');
      setErrorMsg(`No restaurants found within ${fmtMiles(radiusMiles)}. Try a larger radius or different keyword.`);
      return;
    }

    setStatus('scoring');

    try {
      const restaurants = places.map((p) => ({
        name: p.name,
        cuisine: cuisineFromTypes(p.types),
        amenity: 'restaurant',
      }));

      const res = await fetch(`${API_BASE}/api/restaurants/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurants,
          dietary_restrictions: profile?.restrictions ?? [],
          calorie_goal: profile?.goals?.calories ?? 2000,
          context: 'traveling correspondent eating on the go',
        }),
      });
      if (!res.ok) throw new Error('Scoring failed');
      const scored = await res.json();

      const placeMap = new Map(places.map((p) => [p.name.toLowerCase(), p]));
      setResults((scored.suggestions as ScoredRestaurant[]).map((s) => ({
        ...s,
        place: placeMap.get(s.name.toLowerCase()),
      })));
      setStatus('done');
    } catch {
      setStatus('error');
      setErrorMsg('Failed to score restaurants. Please try again.');
    }
  }

  async function useGPS() {
    setStatus('locating');
    setErrorMsg('');
    setLocationName('');

    const perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) {
      setStatus('error');
      setErrorMsg('Location access denied. Enable permissions or enter an address below.');
      return;
    }
    try {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      await searchWithCoords(pos.coords.latitude, pos.coords.longitude);
    } catch {
      setStatus('error');
      setErrorMsg('Could not read your location. Try again or enter an address below.');
    }
  }

  async function submitAddress() {
    if (!addressInput.trim()) return;
    setStatus('locating');
    setErrorMsg('');
    setLocationName('');
    try {
      const geo = await geocodeAddress(addressInput.trim());
      setLocationName(geo.display);
      await searchWithCoords(geo.lat, geo.lon, geo.display);
    } catch (e) {
      setStatus('error');
      setErrorMsg(e instanceof Error ? e.message : 'Could not find that address.');
    }
  }

  const busy = status === 'locating' || status === 'fetching' || status === 'scoring';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.page, { paddingBottom: tabBarHeight + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ marginBottom: 20 }}>
          <Text style={T.h1}>Nearby Restaurants</Text>
          <Text style={[T.muted, { marginTop: 4 }]}>
            Find the healthiest options near you, scored for your goals.
          </Text>
        </View>

        {profile?.restrictions?.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            {profile.restrictions.map((r) => (
              <View key={r} style={styles.badgeGreen}>
                <Text style={styles.badgeGreenText}>{r}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Search panel */}
        <View style={[styles.card, { marginBottom: 16 }]}>
          {/* GPS button — primary action */}
          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary, busy && { opacity: 0.5 }]}
            onPress={useGPS}
            disabled={busy}
          >
            {busy && status === 'locating' && !addressInput ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.btnPrimaryText}>Locating…</Text>
              </View>
            ) : (
              <Text style={styles.btnPrimaryText}>📍  Use my current location</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Address input */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="City, zip code, or address"
              placeholderTextColor={colors.light}
              value={addressInput}
              onChangeText={setAddressInput}
              editable={!busy}
              returnKeyType="search"
              onSubmitEditing={() => !busy && submitAddress()}
            />
            <TouchableOpacity
              style={[styles.btn, styles.btnSecondary, (busy || !addressInput.trim()) && { opacity: 0.4 }]}
              onPress={submitAddress}
              disabled={busy || !addressInput.trim()}
            >
              {busy && status === 'locating' && addressInput ? (
                <ActivityIndicator color={colors.text} size="small" />
              ) : (
                <Text style={styles.btnSecondaryText}>Search</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.hr} />

          {/* Cuisine keyword */}
          <View style={{ marginBottom: 14 }}>
            <Text style={styles.labelText}>Cuisine (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder='e.g. "sushi", "salad", "healthy", "mexican"'
              placeholderTextColor={colors.light}
              value={keyword}
              onChangeText={setKeyword}
              editable={!busy}
            />
          </View>

          {/* Radius slider */}
          <View>
            <View style={styles.sliderHeader}>
              <Text style={styles.labelText}>Search radius</Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>
                {fmtMiles(radiusMiles)}
              </Text>
            </View>
            <Slider
              minimumValue={0.25}
              maximumValue={10}
              step={0.25}
              value={radiusMiles}
              onValueChange={setRadiusMiles}
              minimumTrackTintColor={colors.text}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.text}
              style={{ width: '100%', height: 32, marginTop: 2 }}
              disabled={busy}
            />
            <View style={styles.sliderTicks}>
              <Text style={styles.sliderTick}>¼ mile</Text>
              <Text style={styles.sliderTick}>10 miles</Text>
            </View>
          </View>
        </View>

        {/* Loading */}
        {busy && (
          <View style={[styles.card, { alignItems: 'center', paddingVertical: 40 }]}>
            <ActivityIndicator size="large" color={colors.text} />
            <Text style={[T.body, { fontWeight: '600', marginTop: 16 }]}>
              {status === 'locating' && 'Finding your location…'}
              {status === 'fetching' && 'Searching Google Places…'}
              {status === 'scoring' && 'Scoring restaurants for your goals…'}
            </Text>
            {(status === 'fetching' || status === 'scoring') && allPlaces.length > 0 && (
              <Text style={[T.muted, { marginTop: 6 }]}>{allPlaces.length} places found</Text>
            )}
          </View>
        )}

        {/* Error */}
        {!busy && status === 'error' && (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Could not load restaurants</Text>
            <Text style={styles.errorBody}>{errorMsg}</Text>
          </View>
        )}

        {/* Results */}
        {!busy && status === 'done' && (
          <>
            <View style={{ marginBottom: 12 }}>
              <Text style={T.muted}>
                Top picks near <Text style={{ fontWeight: '600', color: colors.text }}>{locationName || 'you'}</Text>
                <Text style={{ color: colors.light }}>  ·  {allPlaces.length} found within {fmtMiles(radiusMiles)}</Text>
              </Text>
            </View>
            <View style={{ gap: 10 }}>
              {results.map((r, i) => {
                const p = r.place;
                return (
                  <View key={`${r.name}-${i}`} style={[styles.card, styles.restaurantItem]}>
                    <ScoreCircle score={r.health_score} />
                    <View style={{ flex: 1 }}>
                      <View style={styles.nameRow}>
                        <Text style={styles.nameText}>{r.name}</Text>
                        {p?.open_now === true && (
                          <View style={styles.badgeGreen}><Text style={styles.badgeGreenText}>Open</Text></View>
                        )}
                        {p?.open_now === false && (
                          <View style={styles.badgeRed}><Text style={styles.badgeRedText}>Closed</Text></View>
                        )}
                        {p?.price_level != null && (
                          <View style={styles.badgeGray}>
                            <Text style={styles.badgeGrayText}>{PRICE_SYMBOLS[p.price_level]}</Text>
                          </View>
                        )}
                      </View>

                      {p && (p.rating != null || p.distance_meters != null || p.address) && (
                        <View style={styles.metaRow}>
                          {p.rating != null && <StarRating rating={p.rating} />}
                          {p.distance_meters != null && (
                            <Text style={[T.muted, { fontSize: 12 }]}>{formatDistance(p.distance_meters)}</Text>
                          )}
                          {!!p.address && (
                            <Text style={[T.muted, { fontSize: 12, flexShrink: 1 }]} numberOfLines={1}>
                              {p.address}
                            </Text>
                          )}
                        </View>
                      )}

                      <Text style={styles.suggested}>Suggested: {r.suggested_order}</Text>
                      <Text style={[T.muted, { marginTop: 4, fontSize: 13 }]}>{r.reasoning}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  page: { padding: 20, paddingBottom: 80 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius,
    padding: 16,
  },

  btn: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: { backgroundColor: colors.text },
  btnPrimaryText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  btnSecondary: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  btnSecondaryText: { color: colors.text, fontWeight: '500', fontSize: 13 },

  dividerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 14,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { fontSize: 12, color: colors.light, fontWeight: '500' },
  hr: { height: 1, backgroundColor: colors.border, marginVertical: 14 },

  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius,
    paddingHorizontal: 11,
    paddingVertical: 9,
    fontSize: 13,
    color: colors.text,
    backgroundColor: colors.bg,
  },
  labelText: { fontSize: 12, fontWeight: '500', color: colors.muted, marginBottom: 6 },

  sliderHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  sliderTicks: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -2 },
  sliderTick: { fontSize: 11, color: colors.light },

  restaurantItem: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  nameRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  nameText: { fontSize: 15, fontWeight: '700', color: colors.text },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginTop: 4 },
  stars: { fontSize: 12, color: '#ca8a04', letterSpacing: 1 },
  suggested: { fontSize: 13, color: colors.text, fontWeight: '600', marginTop: 6 },

  scoreCircle: {
    width: 36, height: 36, borderRadius: 18, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  scoreText: { fontSize: 13, fontWeight: '700' },

  badgeGreen: {
    backgroundColor: colors.badgeGreenBg,
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4,
  },
  badgeGreenText: { color: colors.badgeGreenFg, fontSize: 11, fontWeight: '500' },
  badgeRed: {
    backgroundColor: colors.badgeRedBg,
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4,
  },
  badgeRedText: { color: colors.badgeRedFg, fontSize: 11, fontWeight: '500' },
  badgeGray: {
    backgroundColor: colors.primaryLt,
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4,
  },
  badgeGrayText: { color: colors.muted, fontSize: 11, fontWeight: '500' },

  errorCard: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: radius,
    padding: 16,
  },
  errorTitle: { fontWeight: '600', color: '#991b1b', marginBottom: 4, fontSize: 13 },
  errorBody: { fontSize: 13, color: '#b91c1c' },
});
