// Plan — calendar-aware meal windows with ranked food options.
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { colors, FONTS, MACRO } from '../theme';
import { FOOD_OPTIONS, SCHEDULE, USER } from '../data';
import { Display, DisplayNum, ICONS, MacroBar, ScoreBadge, SectionLabel } from '../components/atoms';

export default function PlanScreen() {
  const nav = useNavigation();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
            <Ionicons name={ICONS.chevL} size={18} color="#fff" />
          </TouchableOpacity>
          <View style={{ width: 36 }} />
        </View>

        <SectionLabel>Sat 18 Apr · ATL → DCA</SectionLabel>
        <Display style={{ marginTop: 6 }}>Plan</Display>
        <Text style={styles.subtitle}>Your eating windows, routed around today's calendar.</Text>

        {/* Day summary */}
        <View style={styles.summary}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryHeaderL}>REMAINING TODAY</Text>
            <Text style={styles.summaryHeaderR}>
              {USER.goals.cal - USER.today.cal} / {USER.goals.cal} kcal
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {([
              { label: 'Cal', key: 'cal' as const, color: MACRO.cal },
              { label: 'P',   key: 'p'   as const, color: MACRO.p   },
              { label: 'F',   key: 'f'   as const, color: MACRO.f   },
              { label: 'C',   key: 'c'   as const, color: MACRO.c   },
            ]).map((m) => (
              <View key={m.key} style={{ flex: 1 }}>
                <DisplayNum size={18}>{USER.goals[m.key] - USER.today[m.key]}</DisplayNum>
                <Text style={[styles.summaryLabel, { color: colors.muted }]}>{m.label.toUpperCase()}</Text>
                <MacroBar pct={(USER.today[m.key] / USER.goals[m.key]) * 100} color={m.color} />
              </View>
            ))}
          </View>
        </View>

        {/* Timeline */}
        <View style={{ marginTop: 22, position: 'relative' }}>
          <View style={styles.spine} />
          {SCHEDULE.map((s, i) => {
            const isMeal = s.kind === 'meal';
            const isPast = s.done;
            const opts = isMeal ? FOOD_OPTIONS[s.time === '13:15' ? 0 : 1] : null;
            return (
              <View key={i} style={[
                { flexDirection: 'row', gap: 14, marginBottom: isMeal ? 18 : 14 },
                isPast && { opacity: 0.4 },
              ]}>
                <View style={{ width: 46, paddingTop: 6 }}>
                  <DisplayNum size={15}>{s.time}</DisplayNum>
                </View>
                <View style={{ width: 0, position: 'relative' }}>
                  <View style={[styles.dot, {
                    backgroundColor: isMeal ? colors.accent : isPast ? colors.faint : colors.mutedSoft,
                  }]} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  {!isMeal || !opts ? (
                    <View style={{ paddingTop: 4 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.eventTitle}>{s.title}</Text>
                        {s.kind === 'travel' && <Ionicons name={ICONS.plane} size={14} color={MACRO.cal} />}
                      </View>
                      <Text style={styles.eventLoc}>{s.loc} · until {s.end}</Text>
                    </View>
                  ) : (
                    <View style={styles.mealCard}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <Text style={styles.mealKicker}>{opts.where.split('·')[0].trim().toUpperCase()}</Text>
                        <Text style={styles.mealTime}>{s.time} – {s.end}</Text>
                      </View>
                      <Text style={styles.mealSub}>{opts.whereSub}</Text>
                      <View style={{ gap: 6 }}>
                        {opts.items.slice(0, 3).map((opt, k) => (
                          <View key={k} style={styles.optRow}>
                            <ScoreBadge score={opt.score} />
                            <View style={{ flex: 1, minWidth: 0 }}>
                              <Text numberOfLines={1} style={styles.optName}>
                                {opt.name}
                                <Text style={styles.optEta}>  {opt.eta}</Text>
                              </Text>
                              <Text style={styles.optPick} numberOfLines={1}>
                                {opt.pick} · {opt.macros.cal} kcal
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  page: { padding: 20, paddingBottom: 160 },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  backBtn: {
    width: 36, height: 36, borderRadius: 999,
    backgroundColor: colors.surfaceStrong,
    alignItems: 'center', justifyContent: 'center',
  },

  subtitle: { marginTop: 6, fontSize: 13, color: colors.muted, fontFamily: FONTS.body, lineHeight: 19, maxWidth: 320 },

  summary:        { marginTop: 16, padding: 14, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  summaryHeader:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryHeaderL: { fontSize: 11, color: colors.muted, fontFamily: FONTS.bodySemi, letterSpacing: 0.9 },
  summaryHeaderR: { fontSize: 11, color: colors.muted, fontFamily: FONTS.bodySemi, letterSpacing: 0.9 },
  summaryLabel:   { fontSize: 10, marginBottom: 3, letterSpacing: 0.8, fontFamily: FONTS.bodySemi },

  spine: { position: 'absolute', left: 51, top: 6, bottom: 6, width: 1, backgroundColor: 'rgba(255,255,255,0.08)' },

  dot: {
    position: 'absolute', left: -5, top: 8,
    width: 10, height: 10, borderRadius: 999,
    borderWidth: 2, borderColor: colors.bg,
  },

  eventTitle: { fontSize: 13, fontFamily: FONTS.bodySemi, color: colors.text },
  eventLoc:   { fontSize: 11, color: colors.light, fontFamily: FONTS.body, marginTop: 1 },

  mealCard:   { backgroundColor: colors.accent + '12', borderWidth: 1, borderColor: colors.accent + '40', borderRadius: 16, padding: 14 },
  mealKicker: { fontSize: 10, color: colors.accent, fontFamily: FONTS.bodyBold, letterSpacing: 1.2 },
  mealTime:   { fontSize: 11, color: colors.muted, fontFamily: FONTS.body },
  mealSub:    { fontSize: 12, color: colors.muted, fontFamily: FONTS.body, marginVertical: 4, marginBottom: 10 },

  optRow:    { flexDirection: 'row', gap: 10, alignItems: 'center', padding: 10, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.03)' },
  optName:   { fontSize: 13, fontFamily: FONTS.bodySemi, color: colors.text },
  optEta:    { color: colors.faint, fontSize: 11, fontFamily: FONTS.body },
  optPick:   { fontSize: 11, color: colors.muted, fontFamily: FONTS.body },
});
