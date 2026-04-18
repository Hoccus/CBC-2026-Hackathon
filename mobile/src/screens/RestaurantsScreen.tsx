import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, SafeAreaView,
} from 'react-native';
import { API_BASE } from '../config';
import { colors } from '../theme';

type Scored = { name: string; health_score: number; suggested_order: string; reasoning: string };

export default function RestaurantsScreen() {
  const [raw, setRaw] = useState('Sweetgreen, salads\nDig Inn, american\nShake Shack, burgers\nMcDonalds, fast food\nChipotle, mexican');
  const [context, setContext] = useState('quick lunch between flights');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Scored[]>([]);

  async function score() {
    const restaurants = raw
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name, cuisine] = line.split(',').map((s) => s.trim());
        return { name, cuisine: cuisine ?? '' };
      });

    if (restaurants.length === 0) {
      Alert.alert('No restaurants', 'Enter at least one.');
      return;
    }

    setLoading(true);
    setResults([]);
    try {
      const res = await fetch(`${API_BASE}/api/restaurants/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurants, context }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResults(data.suggestions ?? []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      Alert.alert('Failed', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Nearby Picks</Text>
        <Text style={styles.subtitle}>Enter one restaurant per line: Name, cuisine</Text>

        <TextInput
          value={raw}
          onChangeText={setRaw}
          placeholder="Sweetgreen, salads"
          placeholderTextColor={colors.muted}
          style={[styles.input, { minHeight: 120 }]}
          multiline
        />
        <TextInput
          value={context}
          onChangeText={setContext}
          placeholder="Context (e.g. quick lunch between flights)"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />

        <TouchableOpacity
          style={[styles.primaryBtn, loading && { opacity: 0.6 }]}
          onPress={score}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.accentText} />
          ) : (
            <Text style={styles.primaryBtnText}>Score Options</Text>
          )}
        </TouchableOpacity>

        <View style={{ marginTop: 16, gap: 12 }}>
          {results.map((r, i) => (
            <View key={`${r.name}-${i}`} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{r.name}</Text>
                <View style={styles.scorePill}>
                  <Text style={styles.scoreText}>{r.health_score}/10</Text>
                </View>
              </View>
              <Text style={styles.order}>{r.suggested_order}</Text>
              <Text style={styles.reasoning}>{r.reasoning}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 20, paddingBottom: 60 },
  title: { color: colors.text, fontSize: 26, fontWeight: '700', marginTop: 8 },
  subtitle: { color: colors.muted, fontSize: 14, marginTop: 4, marginBottom: 20 },
  input: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, padding: 14, color: colors.text, marginBottom: 12, fontSize: 15,
    textAlignVertical: 'top',
  },
  primaryBtn: {
    backgroundColor: colors.accent, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 4,
  },
  primaryBtnText: { color: colors.accentText, fontSize: 16, fontWeight: '700' },
  card: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 14, padding: 16,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: '600', flex: 1 },
  scorePill: { backgroundColor: colors.accent, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  scoreText: { color: colors.accentText, fontWeight: '700', fontSize: 13 },
  order: { color: colors.text, fontSize: 15, marginBottom: 4 },
  reasoning: { color: colors.muted, fontSize: 13, lineHeight: 18 },
});
