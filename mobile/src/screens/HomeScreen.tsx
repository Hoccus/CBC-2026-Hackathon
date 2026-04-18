import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp, useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useQuery } from 'convex/react';
import { colors, type, radius } from '../theme';
import { RootTabParamList } from '../navigation';
import { api } from '../convexApi';
import { DEFAULT_GOALS } from '../types';

type Nav = BottomTabNavigationProp<RootTabParamList>;

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function MacroBar({ label, current, goal }: { label: string; current: number; goal: number }) {
  const pct = Math.min(100, goal > 0 ? Math.round((current / goal) * 100) : 0);
  const over = pct >= 100;
  const unit = label === 'Calories' ? ' kcal' : 'g';
  return (
    <View style={styles.barRow}>
      <View style={styles.barHeader}>
        <Text style={[type.body, { fontWeight: '500' }]}>{label}</Text>
        <Text style={[type.small, { color: over ? colors.scoreLowFg : colors.muted }]}>
          {Math.round(current)} / {goal}{unit}
        </Text>
      </View>
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            { width: `${pct}%`, backgroundColor: over ? colors.danger : colors.text },
          ]}
        />
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const tabBarHeight = useBottomTabBarHeight();
  const profile = useQuery(api.profiles.getMine) ?? null;
  const meals = useQuery(api.meals.listMine) ?? [];
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todayMeals = meals.filter((meal: { loggedAt: number }) => meal.loggedAt >= startOfToday.getTime());

  const goals = profile?.goals ?? DEFAULT_GOALS;
  const totals = todayMeals.reduce(
    (acc: { calories: number; protein: number; carbs: number; fat: number }, m: { calories?: number; protein_g?: number; carbs_g?: number; fat_g?: number }) => ({
      calories: acc.calories + (m.calories ?? 0),
      protein: acc.protein + (m.protein_g ?? 0),
      carbs: acc.carbs + (m.carbs_g ?? 0),
      fat: acc.fat + (m.fat_g ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const actions: { route: keyof RootTabParamList; label: string; desc: string }[] = [
    { route: 'Coach', label: 'Coach', desc: 'Ask what to eat right now' },
    { route: 'Track', label: 'Track Meal', desc: 'Estimate macros from photo or text' },
    { route: 'Restaurants', label: 'Find Nearby', desc: 'Score restaurants against your goals' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.page, { paddingBottom: tabBarHeight + 24 }]}>
        <View style={{ marginBottom: 24 }}>
          <Text style={type.h1}>
            {greeting()}
            {profile?.name ? `, ${profile.name}` : ''}.
          </Text>
          <Text style={[type.muted, { marginTop: 4 }]}>Your nutrition summary for today.</Text>
        </View>

        <View style={[styles.card, { marginBottom: 24 }]}>
          <View style={styles.sectionHeader}>
            <Text style={type.h3}>Today&apos;s Progress</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {todayMeals.length} meal{todayMeals.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
          <View style={{ gap: 14 }}>
            <MacroBar label="Calories" current={totals.calories} goal={goals.calories} />
            <MacroBar label="Protein" current={totals.protein} goal={goals.protein} />
            <MacroBar label="Carbs" current={totals.carbs} goal={goals.carbs} />
            <MacroBar label="Fat" current={totals.fat} goal={goals.fat} />
          </View>
        </View>

        <Text style={[type.h3, { marginBottom: 12 }]}>Quick Actions</Text>
        <View style={{ gap: 10, marginBottom: 24 }}>
          {actions.map((a) => (
            <TouchableOpacity
              key={a.route}
              style={styles.card}
              activeOpacity={0.7}
              onPress={() => navigation.navigate(a.route as never)}
            >
              <Text style={type.h3}>{a.label}</Text>
              <Text style={[type.small, { marginTop: 4 }]}>{a.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={type.h3}>Today&apos;s Meals</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Track' as never)}>
            <Text style={[type.small, { color: colors.muted }]}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {todayMeals.length === 0 ? (
          <View style={[styles.card, styles.empty]}>
            <Text style={[type.body, { color: colors.light }]}>No meals logged yet.</Text>
            <Text style={[type.small, { color: colors.light, marginTop: 4 }]}>
              Use Track Meal to log your first meal.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {todayMeals.map((m: { id: string; description: string; calories?: number; protein_g?: number; carbs_g?: number; fat_g?: number; loggedAt: number }) => (
              <View key={m.id} style={[styles.card, styles.mealRow]}>
                <View style={{ flex: 1 }}>
                  <Text style={[type.body, { fontWeight: '500' }]}>{m.description}</Text>
                  <Text style={[type.small, { marginTop: 3 }]}>
                    {Math.round(m.calories ?? 0)} kcal · {Math.round(m.protein_g ?? 0)}g P ·{' '}
                    {Math.round(m.carbs_g ?? 0)}g C · {Math.round(m.fat_g ?? 0)}g F
                  </Text>
                </View>
                <Text style={[type.small, { color: colors.light }]}>
                  {new Date(m.loggedAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  page: { padding: 20, paddingTop: 24, paddingBottom: 80 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    backgroundColor: colors.primaryLt,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: { fontSize: 11, fontWeight: '500', color: colors.muted },
  barRow: { gap: 6 },
  barHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  barTrack: { height: 3, backgroundColor: colors.track, borderRadius: 99, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 99 },
  empty: { alignItems: 'center', paddingVertical: 36 },
  mealRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
