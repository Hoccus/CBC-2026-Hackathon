import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Image, ActivityIndicator, Alert, SafeAreaView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { API_BASE } from '../config';
import { colors } from '../theme';

type Macro = {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  description: string;
  health_notes: string;
};

export default function TrackScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [mime, setMime] = useState<string>('image/jpeg');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Macro | null>(null);

  async function pickFromLibrary() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Photo library access is required.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!res.canceled && res.assets[0]) {
      setImageUri(res.assets[0].uri);
      setMime(res.assets[0].mimeType ?? 'image/jpeg');
      setResult(null);
    }
  }

  async function takePhoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Camera access is required.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!res.canceled && res.assets[0]) {
      setImageUri(res.assets[0].uri);
      setMime(res.assets[0].mimeType ?? 'image/jpeg');
      setResult(null);
    }
  }

  async function analyze() {
    if (!imageUri && !description.trim()) {
      Alert.alert('Missing input', 'Add a photo or description first.');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const form = new FormData();
      if (imageUri) {
        const ext = mime.split('/')[1] ?? 'jpg';
        form.append('image', {
          uri: imageUri,
          name: `meal.${ext}`,
          type: mime,
        } as unknown as Blob);
      }
      if (description.trim()) form.append('description', description.trim());

      const res = await fetch(`${API_BASE}/api/track/analyze`, {
        method: 'POST',
        body: form,
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }
      const data: Macro = await res.json();
      setResult(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      Alert.alert('Analysis failed', message);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setImageUri(null);
    setDescription('');
    setResult(null);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Track a Meal</Text>
        <Text style={styles.subtitle}>Snap or pick a photo. Add details if you want.</Text>

        {imageUri ? (
          <View style={styles.previewWrap}>
            <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
            <TouchableOpacity style={styles.previewClear} onPress={() => setImageUri(null)}>
              <Text style={{ color: colors.text }}>Clear</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.photoRow}>
            <TouchableOpacity style={styles.ghostBtn} onPress={takePhoto}>
              <Text style={styles.ghostBtnText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ghostBtn} onPress={pickFromLibrary}>
              <Text style={styles.ghostBtnText}>Choose Photo</Text>
            </TouchableOpacity>
          </View>
        )}

        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Optional: describe the meal or portion"
          placeholderTextColor={colors.muted}
          style={styles.input}
          multiline
        />

        <TouchableOpacity
          style={[styles.primaryBtn, loading && { opacity: 0.6 }]}
          onPress={analyze}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.accentText} />
          ) : (
            <Text style={styles.primaryBtnText}>Analyze</Text>
          )}
        </TouchableOpacity>

        {result && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>{result.description}</Text>
            <View style={styles.macroGrid}>
              <Macro label="Calories" value={`${Math.round(result.calories)}`} />
              <Macro label="Protein" value={`${Math.round(result.protein_g)}g`} />
              <Macro label="Carbs" value={`${Math.round(result.carbs_g)}g`} />
              <Macro label="Fat" value={`${Math.round(result.fat_g)}g`} />
            </View>
            <Text style={styles.resultNotes}>{result.health_notes}</Text>
            <TouchableOpacity style={styles.resetBtn} onPress={reset}>
              <Text style={styles.resetBtnText}>Track another</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Macro({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.macro}>
      <Text style={styles.macroValue}>{value}</Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 20, paddingBottom: 60 },
  title: { color: colors.text, fontSize: 26, fontWeight: '700', marginTop: 8 },
  subtitle: { color: colors.muted, fontSize: 14, marginTop: 4, marginBottom: 20 },
  photoRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  ghostBtn: {
    flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', backgroundColor: colors.card,
  },
  ghostBtnText: { color: colors.text, fontWeight: '600' },
  previewWrap: { position: 'relative', marginBottom: 16 },
  preview: { width: '100%', height: 260, borderRadius: 12, backgroundColor: colors.card },
  previewClear: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
  },
  input: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, padding: 14, color: colors.text, minHeight: 70, marginBottom: 16,
    fontSize: 15, textAlignVertical: 'top',
  },
  primaryBtn: {
    backgroundColor: colors.accent, paddingVertical: 16, borderRadius: 12, alignItems: 'center',
  },
  primaryBtnText: { color: colors.accentText, fontSize: 16, fontWeight: '700' },
  resultCard: {
    marginTop: 24, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 16, padding: 18,
  },
  resultTitle: { color: colors.text, fontSize: 18, fontWeight: '600', marginBottom: 14 },
  macroGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  macro: {
    flexGrow: 1, flexBasis: '45%', backgroundColor: colors.bg, borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  macroValue: { color: colors.accent, fontSize: 22, fontWeight: '700' },
  macroLabel: { color: colors.muted, fontSize: 12, marginTop: 2, textTransform: 'uppercase' },
  resultNotes: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  resetBtn: { marginTop: 16, alignSelf: 'flex-start' },
  resetBtnText: { color: colors.accent, fontWeight: '600' },
});
