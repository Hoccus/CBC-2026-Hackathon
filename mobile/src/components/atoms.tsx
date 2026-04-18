// Atoms — Display, ScoreBadge, MacroBar, Column, Card, ICONS map.
// Mirrors frontend/src/components/prototype/atoms.tsx for the dark prototype look.
import React from 'react';
import { Text, TextStyle, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, FONTS } from '../theme';

type IconName = keyof typeof Ionicons.glyphMap;

// Maps the prototype's named icons → Ionicons glyphs.
export const ICONS: Record<string, IconName> = {
  dashboard: 'grid-outline',
  dashboardActive: 'grid',
  log: 'restaurant-outline',
  logActive: 'restaurant',
  coach: 'chatbubbles-outline',
  coachActive: 'chatbubbles',
  plan: 'calendar-outline',
  planActive: 'calendar',
  more: 'ellipsis-horizontal-circle-outline',
  moreActive: 'ellipsis-horizontal-circle',
  restaurants: 'compass-outline',
  restaurantsActive: 'compass',
  search: 'search',
  barcode: 'barcode-outline',
  chevR: 'chevron-forward',
  chevL: 'chevron-back',
  camera: 'camera-outline',
  mic: 'mic-outline',
  send: 'send',
  pin: 'location-outline',
  clock: 'time-outline',
  plane: 'airplane',
  sparkle: 'sparkles',
  flame: 'flame',
  close: 'close',
  plus: 'add',
  calendar: 'calendar-outline',
  briefcase: 'briefcase-outline',
};

export function Display({
  children, size = 40, style, color = colors.text,
}: { children: React.ReactNode; size?: number; style?: TextStyle; color?: string }) {
  return (
    <Text
      allowFontScaling={false}
      style={[{
        fontFamily: FONTS.displayBold,
        fontSize: size,
        color,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
        lineHeight: size,
      }, style]}>
      {children}
    </Text>
  );
}

// Numeric label using condensed display font (for big macro numbers, time labels, etc.)
export function DisplayNum({
  children, size = 20, color = colors.text, style,
}: { children: React.ReactNode; size?: number; color?: string; style?: TextStyle }) {
  return (
    <Text
      allowFontScaling={false}
      style={[{ fontFamily: FONTS.displayBold, fontSize: size, color, letterSpacing: 0.2, lineHeight: size * 1.05 }, style]}>
      {children}
    </Text>
  );
}

export function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? colors.scoreGreat : score >= 60 ? colors.scoreOK : colors.scoreSkip;
  const label = score >= 80 ? 'GREAT' : score >= 60 ? 'OK' : 'SKIP';
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 6, paddingVertical: 3, paddingRight: 9,
      borderRadius: 999, borderWidth: 1, borderColor: color + '55',
      backgroundColor: 'rgba(255,255,255,0.06)', alignSelf: 'flex-start',
    }}>
      <View style={{
        width: 16, height: 16, borderRadius: 999, backgroundColor: color,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{ color: '#111', fontSize: 10, fontFamily: FONTS.bodyBold }}>{score}</Text>
      </View>
      <Text style={{ color, fontSize: 11, fontFamily: FONTS.bodyBold, letterSpacing: 0.7 }}>{label}</Text>
    </View>
  );
}

// Vertical macro column (used in Dashboard's weekly nutrition). pct in 0–100+.
export function Column({
  pct, color, dim, height = 44,
}: { pct: number; color: string; dim?: boolean; height?: number }) {
  const fill = dim ? 'rgba(255,255,255,0.08)' : color;
  return (
    <View style={{
      width: '100%', height, backgroundColor: 'rgba(255,255,255,0.04)',
      borderRadius: 3, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
      overflow: 'hidden', justifyContent: 'flex-end',
    }}>
      <View style={{ width: '100%', height: `${Math.min(100, pct)}%`, backgroundColor: fill, borderRadius: 2 }} />
      <View style={{
        position: 'absolute', top: 2, left: 2, right: 2, height: 2,
        backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 1,
      }} />
    </View>
  );
}

// Horizontal macro bar. pct 0–100+; >100 paints a tiny tick on the right edge.
export function MacroBar({ pct, color, height = 6 }: { pct: number; color: string; height?: number }) {
  return (
    <View style={{
      height, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden', position: 'relative',
    }}>
      <View style={{
        position: 'absolute', top: 0, bottom: 0, left: 0, width: `${Math.min(100, pct)}%`,
        backgroundColor: color, borderRadius: 99,
      }} />
      {pct > 100 && (
        <View style={{ position: 'absolute', right: 2, top: 0, bottom: 0, width: 2, backgroundColor: '#fff' }} />
      )}
    </View>
  );
}

export function Card({ children, style, accent }: { children: React.ReactNode; style?: ViewStyle; accent?: boolean }) {
  return (
    <View style={[{
      backgroundColor: colors.surface,
      borderWidth: 1, borderColor: accent ? colors.accent + '40' : colors.border,
      borderRadius: 16, padding: 14,
    }, style]}>
      {children}
    </View>
  );
}

export function SectionLabel({ children, color = colors.light, style }: { children: React.ReactNode; color?: string; style?: TextStyle }) {
  return (
    <Text style={[{
      fontFamily: FONTS.bodyBold, fontSize: 11, color, letterSpacing: 1.4, textTransform: 'uppercase',
    }, style]}>{children}</Text>
  );
}
