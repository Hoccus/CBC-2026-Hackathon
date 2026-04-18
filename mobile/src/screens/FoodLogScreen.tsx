// Food log — totals strip + logged entries.
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { colors, FONTS, MACRO } from '../theme';
import { LOGGED, USER } from '../data';
import { Display, DisplayNum, SectionLabel } from '../components/atoms';

export default function FoodLogScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.page}>
        <SectionLabel>Saturday, 18 April</SectionLabel>
        <Display style={{ marginTop: 6 }}>Food log</Display>

        <View style={styles.totals}>
          {([
            { label: 'Cal', val: USER.today.cal, color: MACRO.cal, flame: true },
            { label: 'P',   val: USER.today.p,   color: MACRO.p },
            { label: 'F',   val: USER.today.f,   color: MACRO.f },
            { label: 'C',   val: USER.today.c,   color: MACRO.c },
          ]).map((m) => (
            <View key={m.label} style={{ flex: 1, alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <DisplayNum size={20}>{m.val}</DisplayNum>
                {m.flame && <Ionicons name="flame" size={12} color={m.color} />}
              </View>
              <Text style={[styles.totalLabel, { color: m.color }]}>{m.label.toUpperCase()}</Text>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 18, gap: 8 }}>
          {LOGGED.map((m, i) => (
            <View key={i} style={styles.entry}>
              <View style={styles.entryIcon}>
                <Text style={{ fontSize: 22 }}>{m.icon}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.entryName} numberOfLines={2}>{m.name}</Text>
                <Text style={styles.entryMeta}>{m.time} · {m.loc}</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                  <Text style={[styles.macro, { color: colors.muted }]}>{m.macros.cal} kcal</Text>
                  <Text style={[styles.macro, { color: MACRO.p }]}>{m.macros.p}P</Text>
                  <Text style={[styles.macro, { color: MACRO.f }]}>{m.macros.f}F</Text>
                  <Text style={[styles.macro, { color: MACRO.c }]}>{m.macros.c}C</Text>
                </View>
              </View>
              {m.src === 'photo' && (
                <View style={styles.photoTag}>
                  <Text style={styles.photoTagText}>📸 PHOTO</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  page: { padding: 20, paddingBottom: 160 },

  totals: {
    marginTop: 16, padding: 14, borderRadius: 16,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    flexDirection: 'row', gap: 10,
  },
  totalLabel: { fontSize: 10, marginTop: 2, letterSpacing: 0.8, fontFamily: FONTS.bodyBold },

  entry: {
    flexDirection: 'row', gap: 12, padding: 12, borderRadius: 14,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center',
  },
  entryIcon: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: colors.surfaceStrong,
    alignItems: 'center', justifyContent: 'center',
  },
  entryName: { fontSize: 13, fontFamily: FONTS.bodySemi, color: colors.text },
  entryMeta: { fontSize: 11, color: colors.mutedSoft, fontFamily: FONTS.body, marginTop: 2 },
  macro:     { fontSize: 11, fontFamily: FONTS.body },

  photoTag:     { backgroundColor: colors.surfaceStrong, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999, alignSelf: 'flex-start' },
  photoTagText: { fontSize: 9, color: colors.mutedSoft, fontFamily: FONTS.bodyBold, letterSpacing: 0.7 },
});
