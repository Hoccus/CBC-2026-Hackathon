export interface Goals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface CalendarConnections {
  google: boolean;
  outlook: boolean;
}

export interface Profile {
  name: string;
  age: number;
  weight: number;
  height: number;
  gender: string;
  activity: string;
  restrictions: string[];
  goals: Goals;
  calendarConnections: CalendarConnections;
}

export interface MealEntry {
  id: string;
  description: string;
  location?: string;
  notes?: string;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  loggedAt: number;
}

export interface CoachMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  context?: string;
  createdAt: number;
}

export const DEFAULT_GOALS: Goals = {
  calories: 2000,
  protein: 120,
  carbs: 200,
  fat: 67,
};

export const DEFAULT_PROFILE: Profile = {
  name: "",
  age: 0,
  weight: 0,
  height: 0,
  gender: "male",
  activity: "moderate",
  restrictions: [],
  goals: DEFAULT_GOALS,
  calendarConnections: { google: false, outlook: false },
};

export function buildProfileContext(profile: Profile | null) {
  if (!profile) {
    return undefined;
  }

  const parts: string[] = [];
  if (profile.restrictions.length) {
    parts.push(`Restrictions: ${profile.restrictions.join(", ")}.`);
  }
  parts.push(
    `Goal: ${profile.goals.calories} kcal, ${profile.goals.protein}g protein.`,
  );

  return parts.join(" ");
}

export function startOfToday() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start.getTime();
}
