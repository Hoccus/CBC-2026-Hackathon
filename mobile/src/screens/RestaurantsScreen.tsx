import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useQuery } from 'convex/react';
import { API_BASE } from '../config';
import { colors, radius, type as T } from '../theme';
import { api } from '../convexApi';
import { ScoredRestaurant } from '../types';

interface OsmElement {
  tags?: { name?: string; cuisine?: string; amenity?: string };
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
}

type Status = 'idle' | 'locating' | 'fetching' | 'scoring' | 'done' | 'error';

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

export default function RestaurantsScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const [status, setStatus] = useState<Status>('idle');
  const [results, setResults] = useState<ScoredRestaurant[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [locationName, setLocationName] = useState('');
  const profile = useQuery(api.profiles.getMine) ?? null;

  async function findRestaurants() {
    setStatus('locating');
    setResults([]);
    setErrorMsg('');

    const perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) {
      setStatus('error');
      setErrorMsg('Location access denied. Enable permissions and try again.');
      return;
    }

    let lat: number, lon: number;
    try {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      lat = pos.coords.latitude;
      lon = pos.coords.longitude;
    } catch {
      setStatus('error');
      setErrorMsg('Could not read your location. Try again.');
      return;
    }

    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
        { headers: { 'User-Agent': 'NutriCoach/1.0' } }
      );
      const d = await r.json();
      setLocationName(d.address?.suburb || d.address?.city || d.address?.town || 'your area');
    } catch {}

    setStatus('fetching');

    let restaurants: { name: string; cuisine: string; amenity: string }[] = [];
    try {
      const query = `[out:json][timeout:20];(node(around:1200,${lat},${lon})[amenity~"^(restaurant|cafe|fast_food|pub)$"]["name"];way(around:1200,${lat},${lon})[amenity~"^(restaurant|cafe|fast_food|pub)$"]["name"];);out center body qt;`;
      const r = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
      const data = await r.json();
      restaurants = (data.elements as OsmElement[])
        .filter((el) => el.tags?.name)
        .map((el) => ({
          name: el.tags!.name!,
          cuisine: el.tags?.cuisine?.replace(/_/g, ' ') ?? '',
          amenity: el.tags?.amenity ?? 'restaurant',
        }))
        .filter((r, i, arr) => arr.findIndex((x) => x.name === r.name) === i)
        .slice(0, 20);
    } catch {
      setStatus('error');
      setErrorMsg('Could not fetch nearby restaurants. Try again in a moment.');
      return;
    }

    if (restaurants.length === 0) {
      setStatus('error');
      setErrorMsg('No named restaurants found within 1.2 km. Try a more urban area.');
      return;
    }

    setStatus('scoring');

    try {
      const res = await fetch(`${API_BASE}/api/restaurants/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurants,
          dietary_restrictions: profile?.restrictions ?? [],
          calorie_goal: profile?.goals.calories ?? 2000,
          context: 'traveling correspondent eating on the go',
        }),
      });
      if (!res.ok) throw new Error('Scoring failed');
      const data = await res.json();
      setResults(data.suggestions ?? []);
      setStatus('done');
    } catch {
      setStatus('error');
      setErrorMsg('Failed to score restaurants. Please try again.');
    }
  }

  const busy = status === 'locating' || status === 'fetching' || status === 'scoring';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.page, { paddingBottom: tabBarHeight + 24 }]}>
        <View style={{ marginBottom: 24 }}>
          <Text style={T.h1}>Nearby Restaurants</Text>
          <Text style={[T.muted, { marginTop: 4 }]}>
            Find the healthiest options within walking distance — scored for your goals.
          </Text>
        </View>

        {profile?.restrictions?.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            {profile.restrictions.map((r: string) => (
              <View key={r} style={styles.badgeGreen}>
                <Text style={styles.badgeGreenText}>{r}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {status === 'idle' || status === 'error' ? (
          <View style={[styles.card, { alignItems: 'center', paddingVertical: 40 }]}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>📍</Text>
            <Text style={[T.h2, { marginBottom: 8 }]}>Find what&apos;s nearby</Text>
            <Text style={[T.muted, { textAlign: 'center', marginBottom: 20 }]}>
              We&apos;ll use your location to find restaurants within 1.2 km and rank them by how
              well they match your nutrition goals.
            </Text>
            {status === 'error' && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}
            <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={findRestaurants}>
              <Text style={styles.btnPrimaryText}>Use My Location</Text>
            </TouchableOpacity>
          </View>
        ) : busy ? (
          <View style={[styles.card, { alignItems: 'center', paddingVertical: 48 }]}>
            <ActivityIndicator size="large" color={colors.text} />
            <Text style={[T.body, { fontWeight: '600', marginTop: 16 }]}>
              {status === 'locating' && 'Getting your location...'}
              {status === 'fetching' && 'Finding nearby restaurants...'}
              {status === 'scoring' && 'Scoring restaurants for your goals...'}
            </Text>
          </View>
        ) : (
          <>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <Text style={T.muted}>
                Top picks near <Text style={{ fontWeight: '600' }}>{locationName}</Text>
              </Text>
              <TouchableOpacity style={[styles.btn, styles.btnSecondary, styles.btnSm]} onPress={findRestaurants}>
                <Text style={styles.btnSecondaryText}>Refresh</Text>
              </TouchableOpacity>
            </View>
            <View style={{ gap: 10 }}>
              {results.map((r: ScoredRestaurant, i) => (
                <View key={`${r.name}-${i}`} style={[styles.card, styles.restaurantItem]}>
                  <ScoreCircle score={r.health_score} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>{r.name}</Text>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, marginTop: 2 }}>
                      Suggested: {r.suggested_order}
                    </Text>
                    <Text style={[T.muted, { marginTop: 4 }]}>{r.reasoning}</Text>
                  </View>
                  <View style={styles.badgeGray}>
                    <Text style={styles.badgeGrayText}>#{i + 1}</Text>
                  </View>
                </View>
              ))}
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
    paddingVertical: 10,
    borderRadius: radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSm: { paddingHorizontal: 10, paddingVertical: 6 },
  btnPrimary: { backgroundColor: colors.text, paddingHorizontal: 24, paddingVertical: 12 },
  btnPrimaryText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  btnSecondary: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  btnSecondaryText: { color: colors.text, fontWeight: '500', fontSize: 12 },
  restaurantItem: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  scoreCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: { fontSize: 13, fontWeight: '700' },
  badgeGreen: {
    backgroundColor: colors.badgeGreenBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeGreenText: { color: colors.badgeGreenFg, fontSize: 11, fontWeight: '500' },
  badgeGray: {
    backgroundColor: colors.primaryLt,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeGrayText: { color: colors.muted, fontSize: 11, fontWeight: '500' },
  errorBanner: {
    backgroundColor: colors.badgeRedBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 16,
    alignSelf: 'stretch',
  },
  errorText: { color: colors.badgeRedFg, fontSize: 12, textAlign: 'center' },
});
