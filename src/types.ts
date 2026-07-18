export interface DailyLog {
  virtues: string[]; // List of completed virtues, e.g. ["Pray", "Workout"]
  vices: string[]; // List of committed vices, e.g. ["THC"]
}

export interface DayProgress {
  [dateKey: string]: DailyLog; // e.g. "2026-07-09": { virtues: [...], vices: [...] }
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  defaultWeight: number; // in LBS
  weight: number; // currently set weight
  completedSets: boolean[]; // array matching sets count, e.g. [false, false, false]
  supersetAfter?: boolean; // if true, display a gold "SUPERSET" label after it
}

export interface WorkoutDay {
  dayName: string; // Monday, Tuesday, etc.
  focusTitle: string; // "Cycle Repeat (Upper Focus): Triceps / Shoulders / Back"
  exercises: Exercise[];
}

export interface HspuLevel {
  id: string;
  level: number;
  name: string;
  weeks: string;
  description: string;
  exercises: string[];
}

export interface HspuLog {
  totalSessions: number;
  activeStreak: number;
  completedMilestones: number[]; // e.g. [1, 2, 3]
  loggedDates: string[]; // e.g. ["2026-07-09"]
}

export interface MindsetReview {
  morningAnswers: {
    excited: string;
    person: string;
    needsMe: string;
    stressor: string;
    handling: string;
    surprise: string;
    excellence: string;
    comfortZone: string;
  };
  eveningAnswers: {
    appreciated: string;
    handledWell: string;
    learned: string;
    madeBetter: string;
    connected: string;
    therapistSays: string;
  };
  scorecard: {
    clarity: string;
    productivity: string;
    energy: string;
    influence: string;
    necessity: string;
    courage: string;
  };
}

export interface DayMindsetReviews {
  [dateKey: string]: MindsetReview;
}

export interface WholeLifeScores {
  health: number | null;
  mentalEmotional: number | null;
  partnerSignificantOther: number | null;
  family: number | null;
  friends: number | null;
  mission: number | null;
  experiences: number | null;
  spirit: number | null;
  finances: number | null;
  learning: number | null;
}
