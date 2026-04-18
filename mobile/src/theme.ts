// Dark NutriCoach theme — mirrors frontend/src/components/prototype/atoms.tsx
import { Platform } from 'react-native';

export const colors = {
  bg: '#0a0a0a',
  surface: 'rgba(255,255,255,0.04)',
  surfaceStrong: 'rgba(255,255,255,0.06)',
  border: 'rgba(255,255,255,0.06)',
  borderStrong: 'rgba(255,255,255,0.08)',
  text: '#ffffff',
  textDim: 'rgba(255,255,255,0.85)',
  muted: 'rgba(255,255,255,0.6)',
  mutedSoft: 'rgba(255,255,255,0.5)',
  light: 'rgba(255,255,255,0.45)',
  faint: 'rgba(255,255,255,0.3)',
  scrim: 'rgba(0,0,0,0.5)',

  // Tab bar / pill backgrounds
  tabSurface: 'rgba(20,20,20,0.92)',
  tabBorder: 'rgba(255,255,255,0.08)',

  // Accent (themed) — Prime Amber
  accent: '#E8A83B',
  accentDeep: '#B8391A',

  // Macro palette (stable, not themed)
  macroCal: '#6B8AFD',
  macroP:   '#E25D2C',
  macroF:   '#F5C54B',
  macroC:   '#55C08C',

  // Score buckets
  scoreGreat: '#55C08C',
  scoreOK:    '#F5C54B',
  scoreSkip:  '#E25D2C',

  // Legacy aliases kept so unported code still compiles
  primaryLt: 'rgba(255,255,255,0.06)',
  badgeGreenBg: 'rgba(85,192,140,0.16)',
  badgeGreenFg: '#55C08C',
  badgeRedBg: 'rgba(226,93,44,0.16)',
  badgeRedFg: '#E25D2C',
  scoreHighBg: 'rgba(85,192,140,0.16)',
  scoreHighFg: '#55C08C',
  scoreMidBg: 'rgba(245,197,75,0.16)',
  scoreMidFg: '#F5C54B',
  scoreLowBg: 'rgba(226,93,44,0.16)',
  scoreLowFg: '#E25D2C',
  surfaceAlt: 'rgba(255,255,255,0.06)',
};

export const radius = 14;

export const MACRO = {
  cal: colors.macroCal,
  p:   colors.macroP,
  f:   colors.macroF,
  c:   colors.macroC,
};

// Font families. iOS will substitute system narrow/condensed if Barlow isn't loaded yet,
// but App.tsx blocks render until @expo-google-fonts loads them.
export const FONTS = {
  // Body (Inter)
  body:        'Inter_400Regular',
  bodyMed:     'Inter_500Medium',
  bodySemi:    'Inter_600SemiBold',
  bodyBold:    'Inter_700Bold',

  // Display — condensed (default)
  displayMed:  'BarlowCondensed_500Medium',
  displaySemi: 'BarlowCondensed_600SemiBold',
  displayBold: 'BarlowCondensed_700Bold',
  displayXBold:'BarlowCondensed_800ExtraBold',

  // Display — clean alt (not currently exposed via UI but available)
  cleanReg:    'SpaceGrotesk_400Regular',
  cleanMed:    'SpaceGrotesk_500Medium',
  cleanSemi:   'SpaceGrotesk_600SemiBold',
  cleanBold:   'SpaceGrotesk_700Bold',

  // Mono-ish numerals when display font isn't appropriate
  systemMono:  Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' })!,
};

// Common typography presets
export const type = {
  h1: { fontFamily: FONTS.displayBold, fontSize: 42, color: colors.text, letterSpacing: 0.4, textTransform: 'uppercase' as const, lineHeight: 42 },
  h2: { fontFamily: FONTS.bodyBold,    fontSize: 22, color: colors.text, letterSpacing: -0.4 },
  h3: { fontFamily: FONTS.bodySemi,    fontSize: 14, color: colors.text },
  label: { fontFamily: FONTS.bodyBold, fontSize: 11, color: colors.light, letterSpacing: 1.3, textTransform: 'uppercase' as const },
  body:  { fontFamily: FONTS.body,     fontSize: 14, color: colors.text },
  muted: { fontFamily: FONTS.body,     fontSize: 13, color: colors.muted },
  small: { fontFamily: FONTS.body,     fontSize: 12, color: colors.muted },
  micro: { fontFamily: FONTS.body,     fontSize: 11, color: colors.light },
};
