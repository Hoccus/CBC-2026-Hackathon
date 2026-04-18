// Mirrors frontend/src/app/globals.css :root variables
export const colors = {
  bg: '#ffffff',
  surface: '#ffffff',
  surfaceAlt: '#fafafa',
  border: '#e8e8e8',
  borderStrong: '#d0d0d0',
  text: '#111111',
  muted: '#737373',
  light: '#a3a3a3',
  primaryLt: '#f5f5f5',
  track: '#f0f0f0',

  scoreHighBg: '#f0fdf4',
  scoreHighFg: '#166534',
  scoreMidBg: '#fefce8',
  scoreMidFg: '#854d0e',
  scoreLowBg: '#fef2f2',
  scoreLowFg: '#991b1b',

  danger: '#ef4444',
  badgeGreenBg: '#f0fdf4',
  badgeGreenFg: '#166534',
  badgeRedBg: '#fef2f2',
  badgeRedFg: '#991b1b',
};

export const radius = 6;

export const type = {
  h1: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.8 },
  h2: { fontSize: 16, fontWeight: '600' as const, letterSpacing: -0.3 },
  h3: { fontSize: 13, fontWeight: '600' as const },
  label: { fontSize: 11, fontWeight: '600' as const, color: colors.light, letterSpacing: 0.7 },
  body: { fontSize: 13, color: colors.text },
  muted: { fontSize: 13, color: colors.muted },
  small: { fontSize: 12, color: colors.muted },
};
