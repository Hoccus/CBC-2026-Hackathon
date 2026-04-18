export interface Profile {
  name: string;
  age: number;
  weight: number;
  height: number;
  gender: 'male' | 'female' | 'other';
  activity: 'sedentary' | 'light' | 'moderate' | 'active' | 'extra';
  restrictions: string[];
  goals: { calories: number; protein: number; carbs: number; fat: number };
  calendarConnections: { google: boolean; outlook: boolean };
}

export interface MealEntry {
  id: string;
  loggedAt: number;
  description: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface MacroResult {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  description: string;
  health_notes: string;
}

export interface ScoredRestaurant {
  name: string;
  health_score: number;
  suggested_order: string;
  reasoning: string;
}

export const DEFAULT_PROFILE: Profile = {
  name: '',
  age: 0,
  weight: 0,
  height: 0,
  gender: 'male',
  activity: 'moderate',
  restrictions: [],
  goals: { calories: 2000, protein: 120, carbs: 200, fat: 67 },
  calendarConnections: { google: false, outlook: false },
};

export const DEFAULT_GOALS = DEFAULT_PROFILE.goals;
