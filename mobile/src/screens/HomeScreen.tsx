// Dashboard — travel context banner, weekly nutrition, next up, insights.
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors, FONTS, MACRO } from '../theme';
import { SCHEDULE, USER } from '../data';
import { Column, Display, DisplayNum, ICONS, SectionLabel } from '../components/atoms';
import { RootStackParamList } from '../navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const todayIdx = 5;
const weekData: Record<'cal' | 'p' | 'f' | 'c', number[]> = {
  cal: [94, 102, 88, 97, 91, 65, 0],
  p:   [88, 96, 82, 99, 92, 60, 0],
  f:   [110, 85, 92, 130, 95, 72, 0],
  c:   [70, 88, 65, 78, 82, 55, 0],
};

export default function HomeScreen() {
  const nav = useNavigation<Nav>();
  const g = USER.goals;
  const t = USER.today;

  const macros = [
    { key: 'cal' as const, color: MACRO.cal, val: t.cal, goal: g.cal, suffix: '', flame: true },
    { key: 'p'   as const, color: MACRO.p,   val: t.p,   goal: g.p,   suffix: 'P' },
    { key: 'f'   as const, color: MACRO.f,   val: t.f,   goal: g.f,   suffix: 'F' },
    { key: 'c'   as const, color: MACRO.c,   val: t.c,   goal: g.c,   suffix: 'C' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.page}>
        <SectionLabel>Saturday, 18 April · Atlanta</SectionLabel>
        <Display style={{ marginTop: 6 }}>Dashboard</Display>

        <LinearGradient
          colors={[colors.accent + '24', 'rgba(255,255,255,0.03)']}
          style={styles.banner}
        >
          <View style={styles.bannerIcon}>
            <Ionicons name="sparkles" size={20} color="#111" />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.bannerTitle}>Lunch in 28 min · Centennial Park</Text>
            <Text style={styles.bannerSub}>Grown is 4 min walk · fits your macros · protects dinner at ATL</Text>
          </View>
          <TouchableOpacity onPress={() => nav.navigate('Coach')} style={styles.bannerCta}>
            <Text style={styles.bannerCtaText}>Ask coach</Text>
          </TouchableOpacity>
        </LinearGradient>

        <Text style={styles.h2}>Weekly Nutrition</Text>
        <View style={{ marginTop: 12, gap: 10 }}>
          {macros.map((row) => (
            <View key={row.key} style={styles.weekRow}>
              <View style={{ flex: 1, flexDirection: 'row', gap: 4, alignItems: 'flex-end', height: 44 }}>
                {weekData[row.key].map((pct, i) => (
                  <View key={i} style={[{ flex: 1 }, i === todayIdx && styles.todayCol]}>
                    <Column pct={pct} color={row.color} dim={pct === 0} height={44} />
                  </View>
                ))}
              </View>
              <View style={{ width: 78, alignItems: 'flex-end' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <DisplayNum size={20}>{row.val}</DisplayNum>
                  {row.flame && <Ionicons name="flame" size={14} color={row.color} />}
                  {row.suffix ? <Text style={{ color: colors.muted, fontSize: 13, fontFamily: FONTS.body }}>  {row.suffix}</Text> : null}
                </View>
                <Text style={styles.weekGoal}>of {row.goal}</Text>
              </View>
            </View>
          ))}
          <View style={styles.dayLabels}>
            {days.map((d, i) => (
              <Text key={i} style={[styles.dayLabel, i === todayIdx && { color: colors.text }]}>{d}</Text>
            ))}
            <View style={{ width: 78 }} />
          </View>
        </View>
        <View style={styles.toggleWrap}>
          <View style={styles.toggle}>
            <View style={[styles.toggleSeg, styles.toggleSegActive]}>
              <Text style={styles.toggleTextActive}>Consumed</Text>
            </View>
            <View style={styles.toggleSeg}>
              <Text style={styles.toggleText}>Remaining</Text>
            </View>
          </View>
        </View>

        <View style={styles.h2Row}>
          <Text style={styles.h2NoMargin}>Next up today</Text>
          <TouchableOpacity onPress={() => nav.navigate('Plan')}>
            <Text style={styles.linkSmall}>Full day</Text>
          </TouchableOpacity>
        </View>
        <View style={{ gap: 8 }}>
          {SCHEDULE.filter((s) => !s.done).slice(0, 4).map((s, i) => {
            const isMeal = s.kind === 'meal';
            const isTravel = s.kind === 'travel';
            const isWork = s.kind === 'work';
            return (
              <TouchableOpacity
                key={i}
                disabled={!isMeal}
                onPress={() => isMeal && nav.navigate('Coach')}
                style={[styles.scheduleItem, isMeal && styles.scheduleItemMeal]}
              >
                <View style={{ width: 46 }}>
                  <DisplayNum size={18}>{s.time}</DisplayNum>
                  <Text style={styles.timeEnd}>{s.end}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    {isMeal && <Text style={styles.mealKicker}>MEAL WINDOW</Text>}
                    {isTravel && <Ionicons name={ICONS.plane} size={12} color={MACRO.cal} />}
                    {isWork && <Ionicons name={ICONS.briefcase} size={12} color={colors.mutedSoft} />}
                  </View>
                  <Text style={styles.scheduleTitle}>{s.title}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}>
                    <Ionicons name={ICONS.pin} size={11} color={colors.mutedSoft} />
                    <Text style={styles.scheduleLoc}>{s.loc}</Text>
                  </View>
                </View>
                {isMeal && <Ionicons name={ICONS.chevR} size={14} color={colors.accent} />}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.h2Row}>
          <Text style={styles.h2NoMargin}>Insights</Text>
          <Text style={styles.linkSmall}>See all</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <InsightCard title="Expenditure" sub="Last 7 days" value="3034" unit="kcal" color={MACRO.p} trend="up" />
          <InsightCard title="Weight trend" sub="Last 7 days" value="176.6" unit="lbs" color="#B48EF5" trend="down" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InsightCard({ title, sub, value, unit, color, trend }: {
  title: string; sub: string; value: string; unit: string; color: string; trend: 'up' | 'down';
}) {
  const pts = trend === 'up'
    ? [28, 27, 26, 25, 23, 22, 20, 18]
    : [14, 16, 14, 18, 20, 22, 23, 26];
  const path = pts.map((y, i) => `${i === 0 ? 'M' : 'L'}${i * 14},${y}`).join(' ');
  return (
    <View style={styles.insight}>
      <Text style={styles.insightTitle}>{title}</Text>
      <Text style={styles.insightSub}>{sub}</Text>
      <Svg width="100%" height={36} viewBox="0 0 100 36" preserveAspectRatio="none">
        <Path d={path} stroke={color} strokeWidth={1.5} fill="none" strokeLinecap="round" />
        {pts.map((y, i) => <Circle key={i} cx={i * 14} cy={y} r={1.4} fill={color} />)}
      </Svg>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 6 }}>
        <DisplayNum size={20}>{value}</DisplayNum>
        <Text style={{ fontSize: 11, color: colors.muted, fontFamily: FONTS.body }}>{unit}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  page: { padding: 20, paddingBottom: 160 },

  banner: {
    marginTop: 18, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: colors.accent + '40',
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  bannerIcon: {
    width: 38, height: 38, borderRadius: 10, backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  bannerTitle:   { fontSize: 13, fontFamily: FONTS.bodySemi, color: colors.text },
  bannerSub:     { fontSize: 12, color: colors.muted, fontFamily: FONTS.body, marginTop: 2 },
  bannerCta:     { backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  bannerCtaText: { color: '#111', fontFamily: FONTS.bodyBold, fontSize: 12 },

  h2:         { fontFamily: FONTS.bodyBold, fontSize: 22, color: colors.text, letterSpacing: -0.4, marginTop: 22 },
  h2NoMargin: { fontFamily: FONTS.bodyBold, fontSize: 22, color: colors.text, letterSpacing: -0.4 },
  h2Row:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 22, marginBottom: 10 },
  linkSmall:  { color: colors.muted, fontSize: 12, fontFamily: FONTS.bodySemi, textDecorationLine: 'underline' },

  weekRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  todayCol: { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)', borderRadius: 4, padding: 0 },
  weekGoal: { fontSize: 11, color: colors.light, marginTop: 2, fontFamily: FONTS.body },

  dayLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  dayLabel:  { flex: 1, textAlign: 'center', fontSize: 11, color: colors.light, fontFamily: FONTS.bodySemi, letterSpacing: 0.7 },

  toggleWrap:       { alignItems: 'center', marginTop: 14 },
  toggle:           { flexDirection: 'row', backgroundColor: colors.surfaceStrong, borderRadius: 999, padding: 3 },
  toggleSeg:        { paddingHorizontal: 18, paddingVertical: 7, borderRadius: 999 },
  toggleSegActive:  { backgroundColor: '#fff' },
  toggleText:       { color: colors.muted, fontSize: 12, fontFamily: FONTS.bodySemi },
  toggleTextActive: { color: '#111', fontSize: 12, fontFamily: FONTS.bodyBold },

  scheduleItem: {
    flexDirection: 'row', gap: 12, padding: 14, borderRadius: 14,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center',
  },
  scheduleItemMeal: { backgroundColor: colors.accent + '15', borderColor: colors.accent + '40' },
  timeEnd:          { fontSize: 10, color: colors.light, fontFamily: FONTS.body, marginTop: 2 },
  mealKicker:       { fontSize: 10, color: colors.accent, fontFamily: FONTS.bodyBold, letterSpacing: 1 },
  scheduleTitle:    { fontSize: 14, fontFamily: FONTS.bodySemi, color: colors.text, marginBottom: 2 },
  scheduleLoc:      { fontSize: 11, color: colors.mutedSoft, fontFamily: FONTS.body },

  insight:      { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 12 },
  insightTitle: { fontSize: 14, fontFamily: FONTS.bodyBold, color: colors.text },
  insightSub:   { fontSize: 11, color: colors.muted, marginBottom: 6, fontFamily: FONTS.body },
});
