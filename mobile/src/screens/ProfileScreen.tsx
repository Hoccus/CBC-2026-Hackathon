import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Modal, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { colors, radius, type as T } from '../theme';
import { getProfile, saveProfile } from '../storage';
import { DEFAULT_PROFILE, Profile } from '../types';

const RESTRICTIONS = [
  'Vegetarian', 'Vegan', 'Gluten-free', 'Dairy-free',
  'Nut allergy', 'Halal', 'Kosher', 'Low-carb', 'Diabetic-friendly',
];

const ACTIVITY = [
  { value: 'sedentary' as const, label: 'Sedentary', factor: 1.2 },
  { value: 'light' as const, label: 'Lightly active (1-3×/wk)', factor: 1.375 },
  { value: 'moderate' as const, label: 'Moderately active (3-5×/wk)', factor: 1.55 },
  { value: 'active' as const, label: 'Very active (6-7×/wk)', factor: 1.725 },
  { value: 'extra' as const, label: 'Extra active (physical job)', factor: 1.9 },
];

const GENDERS = [
  { value: 'male' as const, label: 'Male' },
  { value: 'female' as const, label: 'Female' },
  { value: 'other' as const, label: 'Other' },
];

function calcTDEE(p: Profile) {
  if (!p.weight || !p.height || !p.age) return DEFAULT_PROFILE.goals;
  const bmr =
    p.gender === 'male'
      ? 10 * p.weight + 6.25 * p.height - 5 * p.age + 5
      : 10 * p.weight + 6.25 * p.height - 5 * p.age - 161;
  const factor = ACTIVITY.find((a) => a.value === p.activity)?.factor ?? 1.55;
  const calories = Math.round(bmr * factor);
  return {
    calories,
    protein: Math.round((calories * 0.3) / 4),
    carbs: Math.round((calories * 0.4) / 4),
    fat: Math.round((calories * 0.3) / 9),
  };
}

export default function ProfileScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [saved, setSaved] = useState(false);
  const [picker, setPicker] = useState<'gender' | 'activity' | null>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const p = await getProfile();
        if (p) setProfile(p);
      })();
    }, [])
  );

  function update<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((p) => ({ ...p, [key]: value }));
    setSaved(false);
  }

  function updateGoal(key: keyof Profile['goals'], value: number) {
    setProfile((p) => ({ ...p, goals: { ...p.goals, [key]: value } }));
    setSaved(false);
  }

  function toggleRestriction(r: string) {
    setProfile((p) => {
      const has = p.restrictions.includes(r);
      return {
        ...p,
        restrictions: has ? p.restrictions.filter((x) => x !== r) : [...p.restrictions, r],
      };
    });
    setSaved(false);
  }

  async function onSave() {
    await saveProfile(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function autoCalc() {
    const goals = calcTDEE(profile);
    setProfile((p) => ({ ...p, goals }));
    setSaved(false);
  }

  const activityLabel =
    ACTIVITY.find((a) => a.value === profile.activity)?.label ?? 'Moderately active';
  const genderLabel = GENDERS.find((g) => g.value === profile.gender)?.label ?? 'Male';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.page, { paddingBottom: tabBarHeight + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ marginBottom: 24 }}>
          <Text style={T.h1}>Your Profile</Text>
          <Text style={[T.muted, { marginTop: 4 }]}>
            Personalizes coach advice and macro goals.
          </Text>
        </View>

        {/* About */}
        <View style={[styles.card, { marginBottom: 16 }]}>
          <Text style={[T.h3, { marginBottom: 14 }]}>About You</Text>
          <View style={{ gap: 14 }}>
            <Field label="Name">
              <TextInput
                style={styles.input}
                placeholder="Your first name"
                placeholderTextColor={colors.light}
                value={profile.name}
                onChangeText={(v) => update('name', v)}
              />
            </Field>
            <View style={styles.row}>
              <Field label="Age" style={{ flex: 1 }}>
                <TextInput
                  style={styles.input}
                  placeholder="Age"
                  placeholderTextColor={colors.light}
                  keyboardType="number-pad"
                  value={profile.age ? String(profile.age) : ''}
                  onChangeText={(v) => update('age', Number(v) || 0)}
                />
              </Field>
              <Field label="Gender" style={{ flex: 1 }}>
                <TouchableOpacity style={styles.select} onPress={() => setPicker('gender')}>
                  <Text style={{ fontSize: 13, color: colors.text }}>{genderLabel}</Text>
                  <Text style={{ fontSize: 11, color: colors.light }}>▼</Text>
                </TouchableOpacity>
              </Field>
            </View>
            <View style={styles.row}>
              <Field label="Weight (kg)" style={{ flex: 1 }}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 75"
                  placeholderTextColor={colors.light}
                  keyboardType="decimal-pad"
                  value={profile.weight ? String(profile.weight) : ''}
                  onChangeText={(v) => update('weight', Number(v) || 0)}
                />
              </Field>
              <Field label="Height (cm)" style={{ flex: 1 }}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 175"
                  placeholderTextColor={colors.light}
                  keyboardType="decimal-pad"
                  value={profile.height ? String(profile.height) : ''}
                  onChangeText={(v) => update('height', Number(v) || 0)}
                />
              </Field>
            </View>
            <Field label="Activity Level">
              <TouchableOpacity style={styles.select} onPress={() => setPicker('activity')}>
                <Text style={{ fontSize: 13, color: colors.text }}>{activityLabel}</Text>
                <Text style={{ fontSize: 11, color: colors.light }}>▼</Text>
              </TouchableOpacity>
            </Field>
          </View>
        </View>

        {/* Restrictions */}
        <View style={[styles.card, { marginBottom: 16 }]}>
          <Text style={[T.h3, { marginBottom: 14 }]}>Dietary Restrictions</Text>
          <View style={styles.checkGrid}>
            {RESTRICTIONS.map((r) => {
              const on = profile.restrictions.includes(r);
              return (
                <TouchableOpacity
                  key={r}
                  style={[styles.check, on && styles.checkOn]}
                  onPress={() => toggleRestriction(r)}
                >
                  <View style={[styles.checkBox, on && styles.checkBoxOn]}>
                    {on && <Text style={{ color: '#fff', fontSize: 10 }}>✓</Text>}
                  </View>
                  <Text style={{ fontSize: 13, color: colors.text }}>{r}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Goals */}
        <View style={[styles.card, { marginBottom: 24 }]}>
          <View style={styles.sectionHeader}>
            <Text style={T.h3}>Daily Nutrition Goals</Text>
            <TouchableOpacity style={[styles.btn, styles.btnSecondary, styles.btnSm]} onPress={autoCalc}>
              <Text style={styles.btnSecondaryText}>Auto-calculate</Text>
            </TouchableOpacity>
          </View>
          <Text style={[T.small, { marginBottom: 14 }]}>
            Uses your age, weight, height, and activity level (Mifflin-St Jeor).
          </Text>
          <View style={styles.goalsGrid}>
            {(['calories', 'protein', 'carbs', 'fat'] as const).map((k) => (
              <Field
                key={k}
                label={`${k[0].toUpperCase() + k.slice(1)}${k === 'calories' ? ' (kcal)' : ' (g)'}`}
                style={{ flexBasis: '47%', flexGrow: 1 }}
              >
                <TextInput
                  style={styles.input}
                  keyboardType="number-pad"
                  value={profile.goals[k] ? String(profile.goals[k]) : ''}
                  onChangeText={(v) => updateGoal(k, Number(v) || 0)}
                />
              </Field>
            ))}
          </View>
        </View>

        <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={onSave}>
          <Text style={styles.btnPrimaryText}>{saved ? '✓ Saved!' : 'Save Profile'}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Picker modal */}
      <Modal transparent visible={!!picker} animationType="fade" onRequestClose={() => setPicker(null)}>
        <Pressable style={styles.modalBg} onPress={() => setPicker(null)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>
              {picker === 'gender' ? 'Gender' : 'Activity Level'}
            </Text>
            {(picker === 'gender' ? GENDERS : ACTIVITY).map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={styles.modalItem}
                onPress={() => {
                  if (picker === 'gender') update('gender', opt.value as Profile['gender']);
                  if (picker === 'activity') update('activity', opt.value as Profile['activity']);
                  setPicker(null);
                }}
              >
                <Text style={{ fontSize: 14, color: colors.text }}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function Field({
  label,
  children,
  style,
}: {
  label: string;
  children: React.ReactNode;
  style?: object;
}) {
  return (
    <View style={[{ gap: 4 }, style]}>
      <Text style={styles.labelText}>{label}</Text>
      {children}
    </View>
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
  row: { flexDirection: 'row', gap: 12 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  labelText: { fontSize: 12, fontWeight: '500', color: colors.muted },
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
  select: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius,
    paddingHorizontal: 11,
    paddingVertical: 11,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
  checkGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  check: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius,
    flexBasis: '47%',
    flexGrow: 1,
  },
  checkOn: { borderColor: colors.text, backgroundColor: colors.primaryLt },
  checkBox: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxOn: { backgroundColor: colors.text, borderColor: colors.text },
  goalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  btn: { paddingVertical: 12, borderRadius: radius, alignItems: 'center', justifyContent: 'center' },
  btnSm: { paddingVertical: 6, paddingHorizontal: 10 },
  btnPrimary: { backgroundColor: colors.text },
  btnPrimaryText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  btnSecondary: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  btnSecondaryText: { color: colors.text, fontSize: 12, fontWeight: '500' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.bg,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  modalTitle: { fontSize: 11, fontWeight: '600', color: colors.light, letterSpacing: 0.7, marginBottom: 12 },
  modalItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
});
