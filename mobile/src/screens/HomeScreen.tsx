import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { colors } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const TILES: { title: string; subtitle: string; route: keyof RootStackParamList }[] = [
  { title: 'Track Meal', subtitle: 'Snap a photo, get macros', route: 'Track' },
  { title: 'Ask Coach', subtitle: 'Real-time nutrition advice', route: 'Coach' },
  { title: 'Restaurants', subtitle: 'Best picks nearby', route: 'Restaurants' },
];

export default function HomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>NutriCoach</Text>
        <Text style={styles.subtitle}>Real-time nutrition on the go.</Text>

        <View style={styles.tiles}>
          {TILES.map((t) => (
            <TouchableOpacity
              key={t.route}
              style={styles.tile}
              onPress={() => navigation.navigate(t.route as never)}
              activeOpacity={0.7}
            >
              <Text style={styles.tileTitle}>{t.title}</Text>
              <Text style={styles.tileSubtitle}>{t.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 24, paddingTop: 40 },
  title: { color: colors.text, fontSize: 34, fontWeight: '700' },
  subtitle: { color: colors.muted, fontSize: 15, marginTop: 4, marginBottom: 32 },
  tiles: { gap: 14 },
  tile: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 20,
  },
  tileTitle: { color: colors.text, fontSize: 18, fontWeight: '600' },
  tileSubtitle: { color: colors.muted, fontSize: 14, marginTop: 4 },
});
