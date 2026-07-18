import { WorkoutDay, HspuLevel, MindsetReview } from "./types";

export const VIRTUES = ["Pray", "Workout", "Ate Healthy", "Daily Review", "Journal"];
export const VICES = ["THC", "ViceX", "Sloth", "Consumption", "Sugar"];

export const DEFAULT_WORKOUTS: WorkoutDay[] = [
  {
    dayName: "Monday",
    focusTitle: "Chest & Triceps",
    exercises: [
      { id: "mon_squat", name: "Machine Squat", sets: 5, reps: "10, 8, 8, 6, 4 Reps", defaultWeight: 135, weight: 135, completedSets: [false, false, false, false, false], supersetAfter: true },
      { id: "mon_calf_press", name: "Calf Press", sets: 5, reps: "12-14 Reps", defaultWeight: 100, weight: 100, completedSets: [false, false, false, false, false] },
      { id: "mon_bench_press", name: "Machine Bench Press", sets: 4, reps: "10, 8, 8, 6 Reps", defaultWeight: 135, weight: 135, completedSets: [false, false, false, false], supersetAfter: true },
      { id: "mon_tricep_ext1", name: "Tricep Extension", sets: 4, reps: "10, 8, 8, 6 Reps", defaultWeight: 40, weight: 40, completedSets: [false, false, false, false] },
      { id: "mon_incline_press", name: "Incline Barbell Press", sets: 3, reps: "8, 8, 6 Reps", defaultWeight: 115, weight: 115, completedSets: [false, false, false], supersetAfter: true },
      { id: "mon_bench_dip1", name: "Tricep Bench Dip", sets: 3, reps: "8 Reps", defaultWeight: 0, weight: 0, completedSets: [false, false, false] },
      { id: "mon_decline_press", name: "Decline Cable Press", sets: 3, reps: "8, 8, 6 Reps", defaultWeight: 50, weight: 50, completedSets: [false, false, false] },
      { id: "mon_db_fly", name: "Dumbbell Fly Machine", sets: 3, reps: "10 Reps", defaultWeight: 60, weight: 60, completedSets: [false, false, false], supersetAfter: true },
      { id: "mon_bench_dip2", name: "Tricep Bench Dip", sets: 3, reps: "8 Reps", defaultWeight: 0, weight: 0, completedSets: [false, false, false] },
      { id: "mon_db_pullover", name: "Dumbbell Pullover", sets: 3, reps: "8 Reps", defaultWeight: 45, weight: 45, completedSets: [false, false, false], supersetAfter: true },
      { id: "mon_tricep_ext2", name: "Tricep Extension", sets: 3, reps: "10, 8, 8 Reps", defaultWeight: 30, weight: 30, completedSets: [false, false, false] },
      { id: "mon_tricep_pulldown", name: "Tricep Pull Down", sets: 3, reps: "10 Reps", defaultWeight: 50, weight: 50, completedSets: [false, false, false] }
    ]
  },
  {
    dayName: "Tuesday",
    focusTitle: "Back & Biceps",
    exercises: [
      { id: "tue_leg_ext", name: "Leg Extension", sets: 3, reps: "12 Reps", defaultWeight: 80, weight: 80, completedSets: [false, false, false] },
      { id: "tue_deadlift", name: "Deadlift", sets: 5, reps: "10, 8, 8, 6, 4 Reps", defaultWeight: 135, weight: 135, completedSets: [false, false, false, false, false], supersetAfter: true },
      { id: "tue_upright_row", name: "Upright Row", sets: 2, reps: "10 Reps", defaultWeight: 50, weight: 50, completedSets: [false, false], supersetAfter: true },
      { id: "tue_db_sh_press", name: "Dumbbell Shoulder Press", sets: 3, reps: "10 Reps", defaultWeight: 30, weight: 30, completedSets: [false, false, false] },
      { id: "tue_chin_up", name: "Chin Up", sets: 3, reps: "8 Reps", defaultWeight: 0, weight: 0, completedSets: [false, false, false], supersetAfter: true },
      { id: "tue_cg_preacher", name: "Close Grip Preacher Curl", sets: 3, reps: "8, 8, 6 Reps", defaultWeight: 45, weight: 45, completedSets: [false, false, false] },
      { id: "tue_one_arm_row", name: "One Arm Dumbbell Row", sets: 3, reps: "8 Reps", defaultWeight: 40, weight: 40, completedSets: [false, false, false], supersetAfter: true },
      { id: "tue_military_press", name: "Military Press", sets: 3, reps: "10 Reps", defaultWeight: 75, weight: 75, completedSets: [false, false, false], supersetAfter: true },
      { id: "tue_std_bb_curl", name: "Standing Barbell Curl", sets: 3, reps: "8, 8, 6 Reps", defaultWeight: 65, weight: 65, completedSets: [false, false, false] },
      { id: "tue_seated_row", name: "Seated Row", sets: 2, reps: "8 Reps", defaultWeight: 90, weight: 90, completedSets: [false, false] },
      { id: "tue_cg_lat_pulldown", name: "Close Grip Lat Pull Down", sets: 3, reps: "10, 10, 8 Reps", defaultWeight: 100, weight: 100, completedSets: [false, false, false] },
      { id: "tue_incl_db_curl", name: "Incline Dumbbell Curl", sets: 2, reps: "12-14 Reps", defaultWeight: 25, weight: 25, completedSets: [false, false], supersetAfter: true },
      { id: "tue_db_lat_raise", name: "Dumbbell Lateral Raise", sets: 2, reps: "10 Reps", defaultWeight: 15, weight: 15, completedSets: [false, false], supersetAfter: true },
      { id: "tue_db_shrugs", name: "Dumbbell Shrugs", sets: 2, reps: "10 Reps", defaultWeight: 55, weight: 55, completedSets: [false, false] }
    ]
  },
  {
    dayName: "Wednesday",
    focusTitle: "Chest & Triceps",
    exercises: [
      { id: "wed_squat", name: "Machine Squat", sets: 5, reps: "10, 8, 8, 6, 4 Reps", defaultWeight: 135, weight: 135, completedSets: [false, false, false, false, false], supersetAfter: true },
      { id: "wed_calf_press", name: "Calf Press", sets: 5, reps: "12-14 Reps", defaultWeight: 100, weight: 100, completedSets: [false, false, false, false, false] },
      { id: "wed_bench_press", name: "Machine Bench Press", sets: 4, reps: "10, 8, 8, 6 Reps", defaultWeight: 135, weight: 135, completedSets: [false, false, false, false], supersetAfter: true },
      { id: "wed_tricep_ext1", name: "Tricep Extension", sets: 4, reps: "10, 8, 8, 6 Reps", defaultWeight: 40, weight: 40, completedSets: [false, false, false, false] },
      { id: "wed_incline_press", name: "Incline Barbell Press", sets: 3, reps: "8, 8, 6 Reps", defaultWeight: 115, weight: 115, completedSets: [false, false, false], supersetAfter: true },
      { id: "wed_bench_dip1", name: "Tricep Bench Dip", sets: 3, reps: "8 Reps", defaultWeight: 0, weight: 0, completedSets: [false, false, false] },
      { id: "wed_decline_press", name: "Decline Cable Press", sets: 3, reps: "8, 8, 6 Reps", defaultWeight: 50, weight: 50, completedSets: [false, false, false] },
      { id: "wed_db_fly", name: "Dumbbell Fly Machine", sets: 3, reps: "10 Reps", defaultWeight: 60, weight: 60, completedSets: [false, false, false], supersetAfter: true },
      { id: "wed_bench_dip2", name: "Tricep Bench Dip", sets: 3, reps: "8 Reps", defaultWeight: 0, weight: 0, completedSets: [false, false, false] },
      { id: "wed_db_pullover", name: "Dumbbell Pullover", sets: 3, reps: "8 Reps", defaultWeight: 45, weight: 45, completedSets: [false, false, false], supersetAfter: true },
      { id: "wed_tricep_ext2", name: "Tricep Extension", sets: 3, reps: "10, 8, 8 Reps", defaultWeight: 30, weight: 30, completedSets: [false, false, false] },
      { id: "wed_tricep_pulldown", name: "Tricep Pull Down", sets: 3, reps: "10 Reps", defaultWeight: 50, weight: 50, completedSets: [false, false, false] }
    ]
  },
  {
    dayName: "Thursday",
    focusTitle: "Back & Biceps",
    exercises: [
      { id: "thu_leg_ext", name: "Leg Extension", sets: 3, reps: "12 Reps", defaultWeight: 80, weight: 80, completedSets: [false, false, false] },
      { id: "thu_deadlift", name: "Deadlift", sets: 5, reps: "10, 8, 8, 6, 4 Reps", defaultWeight: 135, weight: 135, completedSets: [false, false, false, false, false], supersetAfter: true },
      { id: "thu_upright_row", name: "Upright Row", sets: 2, reps: "10 Reps", defaultWeight: 50, weight: 50, completedSets: [false, false], supersetAfter: true },
      { id: "thu_db_sh_press", name: "Dumbbell Shoulder Press", sets: 3, reps: "10 Reps", defaultWeight: 30, weight: 30, completedSets: [false, false, false] },
      { id: "thu_chin_up", name: "Chin Up", sets: 3, reps: "8 Reps", defaultWeight: 0, weight: 0, completedSets: [false, false, false], supersetAfter: true },
      { id: "thu_cg_preacher", name: "Close Grip Preacher Curl", sets: 3, reps: "8, 8, 6 Reps", defaultWeight: 45, weight: 45, completedSets: [false, false, false] },
      { id: "thu_one_arm_row", name: "One Arm Dumbbell Row", sets: 3, reps: "8 Reps", defaultWeight: 40, weight: 40, completedSets: [false, false, false], supersetAfter: true },
      { id: "thu_military_press", name: "Military Press", sets: 3, reps: "10 Reps", defaultWeight: 75, weight: 75, completedSets: [false, false, false], supersetAfter: true },
      { id: "thu_std_bb_curl", name: "Standing Barbell Curl", sets: 3, reps: "8, 8, 6 Reps", defaultWeight: 65, weight: 65, completedSets: [false, false, false] },
      { id: "thu_seated_row", name: "Seated Row", sets: 2, reps: "8 Reps", defaultWeight: 90, weight: 90, completedSets: [false, false] },
      { id: "thu_cg_lat_pulldown", name: "Close Grip Lat Pull Down", sets: 3, reps: "10, 10, 8 Reps", defaultWeight: 100, weight: 100, completedSets: [false, false, false] },
      { id: "thu_incl_db_curl", name: "Incline Dumbbell Curl", sets: 2, reps: "12-14 Reps", defaultWeight: 25, weight: 25, completedSets: [false, false], supersetAfter: true },
      { id: "thu_db_lat_raise", name: "Dumbbell Lateral Raise", sets: 2, reps: "10 Reps", defaultWeight: 15, weight: 15, completedSets: [false, false], supersetAfter: true },
      { id: "thu_db_shrugs", name: "Dumbbell Shrugs", sets: 2, reps: "10 Reps", defaultWeight: 55, weight: 55, completedSets: [false, false] }
    ]
  },
  {
    dayName: "Friday",
    focusTitle: "Chest & Triceps",
    exercises: [
      { id: "fri_squat", name: "Machine Squat", sets: 5, reps: "10, 8, 8, 6, 4 Reps", defaultWeight: 135, weight: 135, completedSets: [false, false, false, false, false], supersetAfter: true },
      { id: "fri_calf_press", name: "Calf Press", sets: 5, reps: "12-14 Reps", defaultWeight: 100, weight: 100, completedSets: [false, false, false, false, false] },
      { id: "fri_bench_press", name: "Machine Bench Press", sets: 4, reps: "10, 8, 8, 6 Reps", defaultWeight: 135, weight: 135, completedSets: [false, false, false, false], supersetAfter: true },
      { id: "fri_tricep_ext1", name: "Tricep Extension", sets: 4, reps: "10, 8, 8, 6 Reps", defaultWeight: 40, weight: 40, completedSets: [false, false, false, false] },
      { id: "fri_incline_press", name: "Incline Barbell Press", sets: 3, reps: "8, 8, 6 Reps", defaultWeight: 115, weight: 115, completedSets: [false, false, false], supersetAfter: true },
      { id: "fri_bench_dip1", name: "Tricep Bench Dip", sets: 3, reps: "8 Reps", defaultWeight: 0, weight: 0, completedSets: [false, false, false] },
      { id: "fri_decline_press", name: "Decline Cable Press", sets: 3, reps: "8, 8, 6 Reps", defaultWeight: 50, weight: 50, completedSets: [false, false, false] },
      { id: "fri_db_fly", name: "Dumbbell Fly Machine", sets: 3, reps: "10 Reps", defaultWeight: 60, weight: 60, completedSets: [false, false, false], supersetAfter: true },
      { id: "fri_bench_dip2", name: "Tricep Bench Dip", sets: 3, reps: "8 Reps", defaultWeight: 0, weight: 0, completedSets: [false, false, false] },
      { id: "fri_db_pullover", name: "Dumbbell Pullover", sets: 3, reps: "8 Reps", defaultWeight: 45, weight: 45, completedSets: [false, false, false], supersetAfter: true },
      { id: "fri_tricep_ext2", name: "Tricep Extension", sets: 3, reps: "10, 8, 8 Reps", defaultWeight: 30, weight: 30, completedSets: [false, false, false] },
      { id: "fri_tricep_pulldown", name: "Tricep Pull Down", sets: 3, reps: "10 Reps", defaultWeight: 50, weight: 50, completedSets: [false, false, false] }
    ]
  }
];

export const HSPU_LEVELS: HspuLevel[] = [
  {
    id: "h1",
    level: 1,
    name: "Foundation",
    weeks: "Weeks 1-3",
    description: "Basic shoulder/core/wrist strength",
    exercises: ["Pike Holds", "Incline Pushups", "Mini Wall Walks", "Hollow Holds"]
  },
  {
    id: "h2",
    level: 2,
    name: "Inversions & Power",
    weeks: "Weeks 4-6",
    description: "Partially inverted strength",
    exercises: ["Pike Pushups", "Wall Plank Holds", "Box Pike Pushups", "Hollow Rocks"]
  },
  {
    id: "h3",
    level: 3,
    name: "Assisted HSPUs",
    weeks: "Weeks 7-10",
    description: "Control in near-handstand",
    exercises: ["Wall Walks", "Negative HSPUs", "High Box Pike", "Kick-ups"]
  },
  {
    id: "h4",
    level: 4,
    name: "Full Handstand Pushup",
    weeks: "Weeks 11-14",
    description: "First wall-assisted HSPU",
    exercises: ["Partial Range HSPUs", "Full Negatives", "Wall HSPU Attempts", "Freestanding Practice"]
  }
];

export const MILESTONES = [1, 2, 3, 4, 5, 7, 10, 14, 21, 28];

export const INITIAL_MINDSET_REVIEW: MindsetReview = {
  morningAnswers: {
    excited: "",
    person: "",
    needsMe: "",
    stressor: "",
    handling: "",
    surprise: "",
    excellence: "",
    comfortZone: ""
  },
  eveningAnswers: {
    appreciated: "",
    handledWell: "",
    learned: "",
    madeBetter: "",
    connected: "",
    therapistSays: ""
  },
  scorecard: {
    clarity: "",
    productivity: "",
    energy: "",
    influence: "",
    necessity: "",
    courage: ""
  }
};
