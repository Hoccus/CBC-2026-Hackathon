// More — Maya Chen profile, travel-nutrition stats, settings list.
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, FONTS, MACRO } from '../theme';
import { Display, DisplayNum, ICONS, SectionLabel } from '../components/atoms';

const STATS = [
  { v: '78%',  l: 'On-target days', sub: 'last 30 days', c: MACRO.c },
  { v: '43',   l: 'Airport meals',  sub: 'this year',    c: MACRO.cal },
  { v: '12',   l: 'Cities',         sub: 'past 90 days', c: colors.accent },
  { v: '-4.1', l: 'lbs',            sub: 'since Jan',    c: '#B48EF5' },
];

const SETTINGS = [
  'Connect calendar',
  'Dietary restrictions',
  'Travel profile',
  'Goals & macros',
  'Notifications',
];

export default function MoreScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.page}>
        <SectionLabel>Maya Chen · NBC News</SectionLabel>
        <Display style={{ marginTop: 6 }}>More</Display>

        <View style={styles.profile}>
          <LinearGradient
            colors={[colors.accent, colors.accentDeep]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>MC</Text>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>Maya Chen</Text>
            <Text style={styles.profileRole}>National Correspondent · Atlanta bureau</Text>
            <Text style={styles.profileMeta}>182 days on the road this year</Text>
          </View>
        </View>

        <SectionLabel style={{ marginTop: 20, marginBottom: 10 }}>Travel nutrition</SectionLabel>
        <View style={styles.statGrid}>
          {STATS.map((s, i) => (
            <View key={i} style={styles.stat}>
              <DisplayNum size={32} color={s.c}>{s.v}</DisplayNum>
              <Text style={styles.statLabel}>{s.l}</Text>
              <Text style={styles.statSub}>{s.sub}</Text>
            </View>
          ))}
        </View>

        <SectionLabel style={{ marginTop: 20, marginBottom: 10 }}>Settings</SectionLabel>
        <View style={styles.settingsCard}>
          {SETTINGS.map((label, i) => (
            <TouchableOpacity
              key={label}
              style={[styles.settingsRow, i < SETTINGS.length - 1 && styles.settingsRowDivider]}
            >
              <Text style={styles.settingsText}>{label}</Text>
              <Ionicons name={ICONS.chevR} size={12} color={colors.faint} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  page: { padding: 20, paddingBottom: 160 },

  profile: {
    marginTop: 16, padding: 16, borderRadius: 16,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  avatar: { width: 52, height: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 20, fontFamily: FONTS.bodyBold },

  profileName: { fontSize: 16, fontFamily: FONTS.bodyBold, color: colors.text },
  profileRole: { fontSize: 12, color: colors.muted, fontFamily: FONTS.body, marginTop: 1 },
  profileMeta: { fontSize: 11, color: colors.light, fontFamily: FONTS.body, marginTop: 2 },

  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: {
    width: '48%', flexGrow: 1, padding: 14, borderRadius: 14,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  statLabel: { fontSize: 12, color: colors.text, fontFamily: FONTS.bodySemi, marginTop: 4 },
  statSub:   { fontSize: 11, color: colors.light, fontFamily: FONTS.body },

  settingsCard:        { backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  settingsRow:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  settingsRowDivider:  { borderBottomWidth: 1, borderBottomColor: colors.border },
  settingsText:        { flex: 1, fontSize: 14, color: colors.text, fontFamily: FONTS.bodyMed },
});
