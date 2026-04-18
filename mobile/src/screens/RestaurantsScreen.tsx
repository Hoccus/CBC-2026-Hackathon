// Restaurants — real Google Places + score backend, dark NutriCoach styling.
import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { API_BASE } from '../config';
import { colors, FONTS } from '../theme';
import { getProfile } from '../storage';
import { Profile, ScoredRestaurant } from '../types';
import { Display, ICONS, ScoreBadge, SectionLabel } from '../components/atoms';

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
  const [status, setStatus] = useState<Status>('idle');
  const [results, setResults] = useState<EnrichedResult[]>([]);
  const [allPlaces, setAllPlaces] = useState<NearbyPlace[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [locationName, setLocationName] = useState('');
  const [keyword, setKeyword] = useState('');
  const [addressInput, setAddressInput] = useState('');
  const [radiusMiles, setRadiusMiles] = useState(1);

  useFocusEffect(useCallback(() => {
    (async () => setProfile(await getProfile()))();
  }, []));

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

  // 0-10 score → 0-100 for ScoreBadge
  const badgeScore = (s: number) => Math.round(s * 10);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <SectionLabel>Nearby</SectionLabel>
        <Display style={{ marginTop: 6 }}>Restaurants</Display>
        <Text style={styles.subtitle}>
          Find the healthiest options near you, scored for your goals.
        </Text>

        {profile?.restrictions?.length ? (
          <View style={styles.chipRow}>
            {profile.restrictions.map((r) => (
              <View key={r} style={styles.tagChip}><Text style={styles.tagChipText}>{r}</Text></View>
            ))}
          </View>
        ) : null}

        {/* Search panel */}
        <View style={styles.card}>
          <TouchableOpacity
            style={[styles.btnPrimary, busy && { opacity: 0.5 }]}
            onPress={useGPS} disabled={busy}
          >
            {busy && status === 'locating' && !addressInput ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ActivityIndicator color="#111" size="small" />
                <Text style={styles.btnPrimaryText}>Locating…</Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name={ICONS.pin} size={16} color="#111" />
                <Text style={styles.btnPrimaryText}>Use my current location</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="City, zip code, or address"
              placeholderTextColor={colors.mutedSoft}
              value={addressInput}
              onChangeText={setAddressInput}
              editable={!busy}
              returnKeyType="search"
              onSubmitEditing={() => !busy && submitAddress()}
            />
            <TouchableOpacity
              style={[styles.btnSecondary, (busy || !addressInput.trim()) && { opacity: 0.4 }]}
              onPress={submitAddress}
              disabled={busy || !addressInput.trim()}
            >
              {busy && status === 'locating' && addressInput
                ? <ActivityIndicator color={colors.text} size="small" />
                : <Text style={styles.btnSecondaryText}>Search</Text>}
            </TouchableOpacity>
          </View>

          <View style={styles.hr} />

          <View style={{ marginBottom: 14 }}>
            <Text style={styles.label}>Cuisine (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder='e.g. "sushi", "salad", "healthy", "mexican"'
              placeholderTextColor={colors.mutedSoft}
              value={keyword}
              onChangeText={setKeyword}
              editable={!busy}
            />
          </View>

          <View>
            <View style={styles.sliderHeader}>
              <Text style={styles.label}>Search radius</Text>
              <Text style={styles.radiusVal}>{fmtMiles(radiusMiles)}</Text>
            </View>
            <Slider
              minimumValue={0.25}
              maximumValue={10}
              step={0.25}
              value={radiusMiles}
              onValueChange={setRadiusMiles}
              minimumTrackTintColor={colors.accent}
              maximumTrackTintColor={colors.borderStrong}
              thumbTintColor={colors.accent}
              style={{ width: '100%', height: 32, marginTop: 2 }}
              disabled={busy}
            />
            <View style={styles.sliderTicks}>
              <Text style={styles.sliderTick}>¼ mile</Text>
              <Text style={styles.sliderTick}>10 miles</Text>
            </View>
          </View>
        </View>

        {busy && (
          <View style={[styles.card, { marginTop: 16, alignItems: 'center', paddingVertical: 36 }]}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={[styles.bodyText, { marginTop: 16, fontFamily: FONTS.bodySemi }]}>
              {status === 'locating' && 'Finding your location…'}
              {status === 'fetching' && 'Searching Google Places…'}
              {status === 'scoring'  && 'Scoring restaurants for your goals…'}
            </Text>
            {(status === 'fetching' || status === 'scoring') && allPlaces.length > 0 && (
              <Text style={[styles.muted, { marginTop: 6 }]}>{allPlaces.length} places found</Text>
            )}
          </View>
        )}

        {!busy && status === 'error' && (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Could not load restaurants</Text>
            <Text style={styles.errorBody}>{errorMsg}</Text>
          </View>
        )}

        {!busy && status === 'done' && (
          <>
            <Text style={[styles.muted, { marginTop: 14, marginBottom: 12 }]}>
              Top picks near <Text style={{ color: colors.text, fontFamily: FONTS.bodySemi }}>{locationName || 'you'}</Text>
              <Text style={{ color: colors.light }}>  ·  {allPlaces.length} found within {fmtMiles(radiusMiles)}</Text>
            </Text>
            <View style={{ gap: 10 }}>
              {results.map((r, i) => {
                const p = r.place;
                return (
                  <View key={`${r.name}-${i}`} style={styles.resultCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                      <ScoreBadge score={badgeScore(r.health_score)} />
                      <View style={{ flex: 1 }}>
                        <View style={styles.nameRow}>
                          <Text style={styles.nameText}>{r.name}</Text>
                          {p?.open_now === true && (
                            <View style={styles.openTag}><Text style={styles.openTagText}>Open</Text></View>
                          )}
                          {p?.open_now === false && (
                            <View style={styles.closedTag}><Text style={styles.closedTagText}>Closed</Text></View>
                          )}
                          {p?.price_level != null && (
                            <View style={styles.priceTag}>
                              <Text style={styles.priceTagText}>{PRICE_SYMBOLS[p.price_level]}</Text>
                            </View>
                          )}
                        </View>
                        {p && (p.rating != null || p.distance_meters != null || p.address) && (
                          <View style={styles.metaRow}>
                            {p.rating != null && <StarRating rating={p.rating} />}
                            {p.distance_meters != null && (
                              <Text style={styles.metaText}>{formatDistance(p.distance_meters)}</Text>
                            )}
                            {!!p.address && (
                              <Text style={[styles.metaText, { flexShrink: 1 }]} numberOfLines={1}>
                                {p.address}
                              </Text>
                            )}
                          </View>
                        )}
                        <Text style={styles.suggested}>Suggested: {r.suggested_order}</Text>
                        <Text style={[styles.muted, { marginTop: 4 }]}>{r.reasoning}</Text>
                      </View>
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
  page: { padding: 20, paddingBottom: 180 },

  subtitle: { marginTop: 6, fontSize: 13, color: colors.muted, fontFamily: FONTS.body, lineHeight: 19 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10, marginBottom: 4 },
  tagChip: { backgroundColor: colors.surfaceStrong, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  tagChipText: { color: colors.text, fontSize: 12, fontFamily: FONTS.bodyMed },

  card: {
    marginTop: 16, padding: 16, borderRadius: 16,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },

  btnPrimary:    { backgroundColor: colors.accent, paddingVertical: 12, borderRadius: 999, alignItems: 'center' },
  btnPrimaryText:{ color: '#111', fontSize: 14, fontFamily: FONTS.bodyBold },
  btnSecondary:  { backgroundColor: colors.surfaceStrong, borderWidth: 1, borderColor: colors.borderStrong, paddingHorizontal: 16, justifyContent: 'center', borderRadius: 12 },
  btnSecondaryText: { color: colors.text, fontSize: 13, fontFamily: FONTS.bodySemi },

  divider:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 14 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { fontSize: 12, color: colors.mutedSoft, fontFamily: FONTS.bodyMed },
  hr:          { height: 1, backgroundColor: colors.border, marginVertical: 14 },

  input: {
    borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 13, color: colors.text, backgroundColor: colors.surfaceStrong, fontFamily: FONTS.body,
  },
  label: { fontSize: 12, color: colors.muted, marginBottom: 6, fontFamily: FONTS.bodyMed },

  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  radiusVal:    { fontSize: 13, color: colors.text, fontFamily: FONTS.bodySemi },
  sliderTicks:  { flexDirection: 'row', justifyContent: 'space-between', marginTop: -2 },
  sliderTick:   { fontSize: 11, color: colors.light, fontFamily: FONTS.body },

  resultCard: {
    padding: 14, borderRadius: 14,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  nameRow:    { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 4 },
  nameText:   { fontSize: 15, fontFamily: FONTS.bodyBold, color: colors.text },
  metaRow:    { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginTop: 2 },
  metaText:   { fontSize: 12, color: colors.muted, fontFamily: FONTS.body },
  stars:      { fontSize: 12, color: '#F5C54B', letterSpacing: 1 },
  suggested:  { fontSize: 13, color: colors.text, fontFamily: FONTS.bodySemi, marginTop: 6 },

  openTag:        { backgroundColor: colors.scoreGreat + '22', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  openTagText:    { color: colors.scoreGreat, fontSize: 11, fontFamily: FONTS.bodySemi },
  closedTag:      { backgroundColor: colors.scoreSkip + '22', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  closedTagText:  { color: colors.scoreSkip, fontSize: 11, fontFamily: FONTS.bodySemi },
  priceTag:       { backgroundColor: colors.surfaceStrong, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  priceTagText:   { color: colors.muted, fontSize: 11, fontFamily: FONTS.bodySemi },

  errorCard:  { marginTop: 16, backgroundColor: colors.scoreSkip + '15', borderWidth: 1, borderColor: colors.scoreSkip + '40', padding: 16, borderRadius: 14 },
  errorTitle: { color: colors.scoreSkip, fontFamily: FONTS.bodyBold, fontSize: 13, marginBottom: 4 },
  errorBody:  { color: colors.scoreSkip, fontFamily: FONTS.body, fontSize: 13 },

  bodyText: { fontSize: 14, color: colors.text, fontFamily: FONTS.body },
  muted:    { fontSize: 13, color: colors.muted, fontFamily: FONTS.body },
});
