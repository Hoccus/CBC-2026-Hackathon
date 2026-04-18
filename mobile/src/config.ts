// Backend URL. Override via .env with EXPO_PUBLIC_API_URL=http://<lan-ip>:8000
// When running in Expo Go on a physical device, 'localhost' points to the
// phone itself — you MUST use your computer's LAN IP address.
export const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';
export const SITE_URL = process.env.EXPO_PUBLIC_SITE_URL ?? 'http://localhost:3000';
export const CONVEX_URL = process.env.EXPO_PUBLIC_CONVEX_URL ?? '';
