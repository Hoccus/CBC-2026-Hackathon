// Fake data for the NutriCoach mobile prototype — Maya Chen, NBC national correspondent.

export const USER = {
  name: "Maya",
  role: "NBC National Correspondent",
  base: "Atlanta, GA",
  goals: { cal: 2200, p: 165, f: 73, c: 220 },
  today: { cal: 1420, p: 98, f: 52, c: 142 },
};

export type ScheduleKind = "personal" | "work" | "meal" | "travel";

export interface ScheduleItem {
  time: string;
  end: string;
  title: string;
  loc: string;
  kind: ScheduleKind;
  done?: boolean;
  now?: boolean;
  suggested?: boolean;
}

export const SCHEDULE: ScheduleItem[] = [
  { time: "06:40", end: "07:30", title: "Hotel gym + shower", loc: "Hilton Atlanta", kind: "personal", done: true },
  { time: "08:00", end: "09:15", title: "Live hit — CNN Center plaza", loc: "CNN Center, downtown", kind: "work", done: true },
  { time: "09:30", end: "10:30", title: "Production meeting", loc: "NBC bureau, Midtown", kind: "work", done: true },
  { time: "11:00", end: "12:45", title: "Interview prep + B-roll", loc: "Centennial Park", kind: "work", done: false, now: true },
  { time: "13:15", end: "14:00", title: "Lunch window", loc: "nearby", kind: "meal", done: false, suggested: true },
  { time: "14:30", end: "16:00", title: "Sit-down interview — Mayor\u2019s office", loc: "City Hall", kind: "work", done: false },
  { time: "17:00", end: "18:30", title: "Edit + file package", loc: "NBC bureau", kind: "work", done: false },
  { time: "19:15", end: "19:30", title: "Uber to ATL", loc: "Hartsfield-Jackson", kind: "travel", done: false },
  { time: "20:05", end: "20:30", title: "Dinner window", loc: "Concourse B", kind: "meal", done: false, suggested: true },
  { time: "21:35", end: "23:55", title: "DL 2204 ATL\u2192DCA", loc: "Gate B18", kind: "travel", done: false },
];

export interface FoodItem {
  name: string;
  type: string;
  score: number;
  eta: string;
  why: string;
  fit: "great" | "good" | "skip";
  macros: { cal: number; p: number; f: number; c: number };
  pick: string;
}

export interface FoodWindow {
  where: string;
  whereSub: string;
  items: FoodItem[];
}

export const FOOD_OPTIONS: FoodWindow[] = [
  {
    where: "Lunch window · 13:15",
    whereSub: "4 min walk from Centennial Park",
    items: [
      { name: "Grown", type: "Fast-casual bowls", score: 92, eta: "4 min", why: "Protein bowl hits 42g P, ~580 kcal — protects your dinner budget", fit: "great", macros: { cal: 580, p: 42, f: 18, c: 58 }, pick: "Harvest Chicken Bowl" },
      { name: "Chick-fil-A", type: "Fast food", score: 74, eta: "2 min", why: "Grilled nuggets + market salad works — skip the waffle fries today", fit: "good", macros: { cal: 520, p: 38, f: 14, c: 52 }, pick: "Grilled nuggets + market salad" },
      { name: "The Varsity", type: "Atlanta diner", score: 38, eta: "6 min", why: "Iconic but fried — would blow your fat budget before dinner", fit: "skip", macros: { cal: 1240, p: 32, f: 68, c: 118 }, pick: "Chili dog combo" },
    ],
  },
  {
    where: "Dinner window · 20:05 · ATL concourse B",
    whereSub: "after security, before gate B18",
    items: [
      { name: "Cat Cora\u2019s Kitchen", type: "Mediterranean", score: 88, eta: "B2", why: "Grilled salmon + greek salad closes your protein gap cleanly", fit: "great", macros: { cal: 640, p: 48, f: 28, c: 42 }, pick: "Grilled salmon plate" },
      { name: "One Flew South", type: "Southern + sushi", score: 81, eta: "E18 (tram)", why: "Best food in ATL but 20 min detour — only if you have buffer", fit: "good", macros: { cal: 720, p: 44, f: 32, c: 48 }, pick: "Shrimp & grits, half portion" },
      { name: "Chick-fil-A", type: "Fast food", score: 62, eta: "B14", why: "Closest. Grilled sandwich keeps the day under budget", fit: "good", macros: { cal: 440, p: 37, f: 12, c: 41 }, pick: "Grilled chicken sandwich" },
      { name: "Piece of Cake", type: "Bakery", score: 22, eta: "B2", why: "Late-night sugar bomb — you\u2019ll regret it on the red-eye", fit: "skip", macros: { cal: 780, p: 6, f: 38, c: 106 }, pick: "Red velvet slice" },
    ],
  },
];

export interface LoggedMeal {
  time: string;
  name: string;
  loc: string;
  icon: string;
  macros: { cal: number; p: number; f: number; c: number };
  src: "photo" | "quick";
}

export const LOGGED: LoggedMeal[] = [
  { time: "07:10", name: "Hotel breakfast — eggs, oatmeal, berries", loc: "Hilton Atlanta", icon: "\uD83E\uDD63", macros: { cal: 520, p: 34, f: 18, c: 58 }, src: "photo" },
  { time: "10:15", name: "Cold brew + protein bar", loc: "Starbucks, CNN Center", icon: "\u2615", macros: { cal: 280, p: 22, f: 9, c: 28 }, src: "quick" },
  { time: "12:45", name: "Turkey wrap + apple", loc: "Bureau kitchen", icon: "\uD83E\uDD6A", macros: { cal: 620, p: 42, f: 25, c: 56 }, src: "photo" },
];

export interface CoachMessage {
  role: "context" | "user" | "coach";
  text: string;
  suggestions?: string[];
}

export const COACH_THREAD: CoachMessage[] = [
  {
    role: "context",
    text: "Based on your calendar: lunch window in 28 min near Centennial Park. You have ~780 kcal, 67g P left before dinner.",
  },
  {
    role: "user",
    text: "I'm filming B-roll at Centennial Park until 12:45. What should I grab that won't wreck dinner at the airport tonight?",
  },
  {
    role: "coach",
    text: "You've got a 9pm flight — that dinner at the concourse will likely be heavier, so we want to bank protein now and keep fat modest.\n\n**Pick Grown, 4 min walk.** Their Harvest Chicken Bowl lands ~580 kcal / 42g P / 18g F. That leaves you ~420 kcal and 58g P for a clean dinner at Cat Cora's (salmon plate) at ATL.\n\nIf Grown's line is out the door: Chick-fil-A grilled nuggets + market salad. Skip the waffle fries today.",
    suggestions: ["Grown · Harvest Chicken Bowl", "Chick-fil-A · Grilled nuggets"],
  },
];

export const MACRO = {
  cal: "#6B8AFD",
  p: "#E25D2C",
  f: "#F5C54B",
  c: "#55C08C",
} as const;
