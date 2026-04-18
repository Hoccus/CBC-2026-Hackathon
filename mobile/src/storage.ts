import AsyncStorage from '@react-native-async-storage/async-storage';
import { Profile, MealEntry, DEFAULT_PROFILE } from './types';

const PROFILE_KEY = 'nutricoach_profile';
const LOG_KEY = 'nutricoach_log';

export async function getProfile(): Promise<Profile | null> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as Profile) : null;
  } catch {
    return null;
  }
}

export async function saveProfile(p: Profile): Promise<void> {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(p));
}

export async function getLog(): Promise<MealEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(LOG_KEY);
    return raw ? (JSON.parse(raw) as MealEntry[]) : [];
  } catch {
    return [];
  }
}

export async function addMeal(meal: MealEntry): Promise<void> {
  const log = await getLog();
  log.push(meal);
  await AsyncStorage.setItem(LOG_KEY, JSON.stringify(log));
}

export function todaysMeals(log: MealEntry[]): MealEntry[] {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return log.filter((m) => m.loggedAt >= start.getTime());
}

export { DEFAULT_PROFILE };
