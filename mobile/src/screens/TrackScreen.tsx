import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput,
  Image, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { useMutation } from 'convex/react';
import { API_BASE } from '../config';
import { colors, radius, type as T } from '../theme';
import { api } from '../convexApi';
import { MacroResult } from '../types';

type Tab = 'photo' | 'text';

function MacroCard({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <View style={styles.macroCard}>
      <Text style={styles.macroVal}>{Math.round(value)}</Text>
      <Text style={styles.macroUnit}>{unit}</Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

export default function TrackScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const [tab, setTab] = useState<Tab>('photo');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [mime, setMime] = useState('image/jpeg');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MacroResult | null>(null);
  const [added, setAdded] = useState(false);
  const addAnalyzedMeal = useMutation(api.meals.addAnalyzed);

  async function pick(source: 'camera' | 'library') {
    const perm =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow access to continue.');
      return;
    }
    const res =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.7,
          });
    if (!res.canceled && res.assets[0]) {
      setImageUri(res.assets[0].uri);
      setMime(res.assets[0].mimeType ?? 'image/jpeg');
      setResult(null);
      setAdded(false);
    }
  }

  async function analyze() {
    if (loading) return;
    if (tab === 'photo' && !imageUri) {
      Alert.alert('No photo', 'Take or choose a photo first.');
      return;
    }
    if (tab === 'text' && !description.trim()) {
      Alert.alert('No description', 'Describe your meal first.');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const form = new FormData();
      if (imageUri && tab === 'photo') {
        const ext = mime.split('/')[1] ?? 'jpg';
        form.append('image', {
          uri: imageUri,
          name: `meal.${ext}`,
          type: mime,
        } as unknown as Blob);
      }
      if (description.trim()) form.append('description', description.trim());

      const res = await fetch(`${API_BASE}/api/track/analyze`, { method: 'POST', body: form });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setResult((await res.json()) as MacroResult);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      Alert.alert('Failed to analyze', message);
    } finally {
      setLoading(false);
    }
  }

  async function addToLog() {
    if (!result) return;
    await addAnalyzedMeal({
      description: result.description,
      calories: result.calories,
      protein_g: result.protein_g,
      carbs_g: result.carbs_g,
      fat_g: result.fat_g,
      notes: result.health_notes,
    });
    setAdded(true);
  }

  function reset() {
    setImageUri(null);
    setDescription('');
    setResult(null);
    setAdded(false);
  }

  const canAnalyze =
    (tab === 'photo' && !!imageUri) || (tab === 'text' && description.trim().length > 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.page, { paddingBottom: tabBarHeight + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ marginBottom: 24 }}>
          <Text style={T.h1}>Track a Meal</Text>
          <Text style={[T.muted, { marginTop: 4 }]}>
            Upload a photo or describe your meal for an instant macro estimate.
          </Text>
        </View>

        {!result ? (
          <>
            <SegmentedControl
              values={['Upload Photo', 'Describe Meal']}
              selectedIndex={tab === 'photo' ? 0 : 1}
              onChange={(e) => setTab(e.nativeEvent.selectedSegmentIndex === 0 ? 'photo' : 'text')}
              style={{ marginBottom: 16 }}
            />

            {tab === 'photo' && (
              <View style={styles.uploadZone}>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
                ) : (
                  <>
                    <Text style={[T.body, { fontWeight: '500', textAlign: 'center' }]}>
                      Take or choose a photo
                    </Text>
                    <Text style={[T.small, { textAlign: 'center', marginTop: 4 }]}>
                      JPG, PNG, WEBP
                    </Text>
                  </>
                )}
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
                  <TouchableOpacity
                    style={[styles.btn, styles.btnSecondary, { flex: 1 }]}
                    onPress={() => pick('camera')}
                  >
                    <Text style={styles.btnSecondaryText}>
                      {imageUri ? 'Retake' : 'Take Photo'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.btn, styles.btnSecondary, { flex: 1 }]}
                    onPress={() => pick('library')}
                  >
                    <Text style={styles.btnSecondaryText}>
                      {imageUri ? 'Choose Different' : 'Choose Photo'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={{ marginBottom: 16 }}>
              <Text style={styles.labelText}>
                {tab === 'photo' ? 'Description (optional)' : 'Describe your meal'}
              </Text>
              <TextInput
                style={styles.textarea}
                placeholder={
                  tab === 'photo'
                    ? 'e.g. chicken stir-fry with rice'
                    : 'e.g. grilled salmon, roasted broccoli, half cup quinoa'
                }
                placeholderTextColor={colors.light}
                multiline
                value={description}
                onChangeText={setDescription}
              />
            </View>

            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary, (!canAnalyze || loading) && { opacity: 0.35 }]}
              onPress={analyze}
              disabled={!canAnalyze || loading}
            >
              {loading ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator color="#fff" />
                  <Text style={styles.btnPrimaryText}>Analyzing...</Text>
                </View>
              ) : (
                <Text style={styles.btnPrimaryText}>Analyze Meal</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={[styles.card, { backgroundColor: colors.surfaceAlt, marginBottom: 16 }]}>
              <Text style={[T.body, { fontWeight: '600' }]}>{result.description}</Text>
              <Text style={[T.muted, { marginTop: 8, lineHeight: 20 }]}>{result.health_notes}</Text>
            </View>

            <View style={styles.macroGrid}>
              <MacroCard label="Calories" value={result.calories} unit="kcal" />
              <MacroCard label="Protein" value={result.protein_g} unit="g" />
              <MacroCard label="Carbs" value={result.carbs_g} unit="g" />
              <MacroCard label="Fat" value={result.fat_g} unit="g" />
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 24 }}>
              <TouchableOpacity
                style={[styles.btn, styles.btnPrimary, { flex: 1 }, added && { opacity: 0.6 }]}
                onPress={addToLog}
                disabled={added}
              >
                <Text style={styles.btnPrimaryText}>
                  {added ? 'Added to Log' : "Add to Today's Log"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={reset}>
                <Text style={styles.btnSecondaryText}>Analyze Another</Text>
              </TouchableOpacity>
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
  uploadZone: {
    borderWidth: 1, borderStyle: 'dashed', borderColor: '#d4d4d4',
    borderRadius: radius, padding: 20, backgroundColor: colors.surfaceAlt,
    marginBottom: 16, alignItems: 'center',
  },
  preview: { width: '100%', height: 220, borderRadius: 4 },
  labelText: { fontSize: 12, fontWeight: '500', color: colors.muted, marginBottom: 6 },
  textarea: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius, padding: 11, color: colors.text, minHeight: 80,
    fontSize: 13, textAlignVertical: 'top', lineHeight: 20,
  },
  btn: {
    paddingHorizontal: 14, paddingVertical: 11, borderRadius: radius,
    alignItems: 'center', justifyContent: 'center',
  },
  btnPrimary: { backgroundColor: colors.text },
  btnPrimaryText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  btnSecondary: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  btnSecondaryText: { color: colors.text, fontSize: 13, fontWeight: '500' },
  macroGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  macroCard: {
    flexBasis: '47%', flexGrow: 1, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius, padding: 14,
  },
  macroVal: { fontSize: 24, fontWeight: '700', letterSpacing: -1, color: colors.text },
  macroUnit: { fontSize: 11, fontWeight: '600', color: colors.light, letterSpacing: 0.6, marginTop: 2 },
  macroLabel: { fontSize: 12, color: colors.light, marginTop: 4 },
});
