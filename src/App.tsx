import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Shield, 
  Calendar, 
  Dumbbell, 
  BookOpen, 
  Flame, 
  Sparkles, 
  Download, 
  Upload, 
  Check, 
  Plus, 
  Heart, 
  ChevronLeft, 
  ChevronRight, 
  Brain, 
  Clock, 
  Moon, 
  Compass, 
  Smile, 
  DollarSign, 
  Award, 
  Zap, 
  Settings, 
  X, 
  Info,
  BarChart2,
  ListTodo,
  Trash2,
  Lock,
  Sliders,
  Unlock,
  AlertTriangle,
  AlertOctagon
} from "lucide-react";
import { VIRTUES, VICES, DEFAULT_WORKOUTS, HSPU_LEVELS, MILESTONES, INITIAL_MINDSET_REVIEW } from "./data";
import { DailyLog, DayProgress, WorkoutDay, HspuLog, DayMindsetReviews, WholeLifeScores, Exercise, MindsetReview } from "./types";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from "firebase/auth";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "./firebase";

const getEstTodayString = (): string => {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    return formatter.format(new Date());
  } catch (e) {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
};

export default function App() {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState<"overview" | "workout" | "review" | "hspu" | "life" | "streaks" | "settings">("overview");
  
  // Initialize with current EST date
  const estToday = getEstTodayString();
  const [selectedDate, setSelectedDate] = useState<string>(estToday);
  const isLocked = selectedDate !== estToday;
  
  // Virtue / Vice logging per day - starts completely clean for Daily Review
  const [dayProgress, setDayProgress] = useState<DayProgress>(() => {
    const saved = localStorage.getItem("vt_day_progress");
    if (saved) return JSON.parse(saved);
    return {};
  });

  // Workout persistent weights
  const [exerciseWeights, setExerciseWeights] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem("vt_exercise_weights");
    if (saved) return JSON.parse(saved);
    
    // Extract defaults
    const defaults: Record<string, number> = {};
    DEFAULT_WORKOUTS.forEach(wd => {
      wd.exercises.forEach(ex => {
        defaults[ex.id] = ex.defaultWeight;
      });
    });
    return defaults;
  });

  // Editable workout schedule - starts from the default program, fully user-editable from here on
  const [customWorkouts, setCustomWorkouts] = useState<WorkoutDay[]>(() => {
    const saved = localStorage.getItem("vt_custom_workouts");
    if (saved) return JSON.parse(saved);
    return DEFAULT_WORKOUTS;
  });
  useEffect(() => {
    localStorage.setItem("vt_custom_workouts", JSON.stringify(customWorkouts));
  }, [customWorkouts]);

  // Which schedule day applies to a given date - chosen manually, not locked to the calendar weekday
  const [workoutDaySelections, setWorkoutDaySelections] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem("vt_workout_day_selections");
    if (saved) return JSON.parse(saved);
    return {};
  });
  useEffect(() => {
    localStorage.setItem("vt_workout_day_selections", JSON.stringify(workoutDaySelections));
  }, [workoutDaySelections]);

  // Workout completed sets history
  const [completedSetsHistory, setCompletedSetsHistory] = useState<Record<string, Record<string, boolean[]>>>(() => {
    const saved = localStorage.getItem("vt_completed_sets");
    if (saved) return JSON.parse(saved);
    return {};
  });

  // HSPU Progression logger - starts completely clean
  const [hspuLog, setHspuLog] = useState<HspuLog>(() => {
    const saved = localStorage.getItem("vt_hspu_log");
    if (saved) return JSON.parse(saved);
    return {
      totalSessions: 0,
      activeStreak: 0,
      completedMilestones: [],
      loggedDates: []
    };
  });

  // Mindset Daily Review
  const [mindsetReviews, setMindsetReviews] = useState<DayMindsetReviews>(() => {
    const saved = localStorage.getItem("vt_mindset_reviews");
    if (saved) return JSON.parse(saved);
    return {};
  });

  // Whole Life Scores - starts with no data
  const [wholeLifeScores, setWholeLifeScores] = useState<WholeLifeScores>(() => {
    const saved = localStorage.getItem("vt_whole_life");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          health: parsed.health !== undefined ? parsed.health : null,
          mentalEmotional: parsed.mentalEmotional !== undefined ? parsed.mentalEmotional : null,
          partnerSignificantOther: parsed.partnerSignificantOther !== undefined ? parsed.partnerSignificantOther : null,
          family: parsed.family !== undefined ? parsed.family : null,
          friends: parsed.friends !== undefined ? parsed.friends : null,
          mission: parsed.mission !== undefined ? parsed.mission : null,
          experiences: parsed.experiences !== undefined ? parsed.experiences : null,
          spirit: parsed.spirit !== undefined ? parsed.spirit : null,
          finances: parsed.finances !== undefined ? parsed.finances : null,
          learning: parsed.learning !== undefined ? parsed.learning : null
        };
      } catch (e) {
        // fallback
      }
    }
    return {
      health: null,
      mentalEmotional: null,
      partnerSignificantOther: null,
      family: null,
      friends: null,
      mission: null,
      experiences: null,
      spirit: null,
      finances: null,
      learning: null
    };
  });

  // Initial Streaks Setup state
  interface InitialStreaks {
    virtues: Record<string, number>;
    vices: Record<string, number>;
    setupCompleted: boolean;
    sobrietyDate?: string;
  }

  const [initialStreaks, setInitialStreaks] = useState<InitialStreaks>(() => {
    const saved = localStorage.getItem("vt_initial_streaks");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          virtues: parsed.virtues || {},
          vices: parsed.vices || {},
          setupCompleted: !!parsed.setupCompleted,
          sobrietyDate: parsed.sobrietyDate || ""
        };
      } catch (e) {
        // Fallback
      }
    }
    
    const virtuesDefault: Record<string, number> = {};
    VIRTUES.forEach(v => { virtuesDefault[v] = 0; });
    
    const vicesDefault: Record<string, number> = {};
    VICES.forEach(v => { vicesDefault[v] = 0; });
    
    return {
      virtues: virtuesDefault,
      vices: vicesDefault,
      setupCompleted: false,
      sobrietyDate: ""
    };
  });

  // Erase All Data custom popup states
  const [showEraseModal, setShowEraseModal] = useState<boolean>(false);
  const [eraseStep, setEraseStep] = useState<number>(1);
  const [eraseConfirmText, setEraseConfirmText] = useState<string>("");

  // Initial streaks setup confirmation states
  const [showLockConfirm, setShowLockConfirm] = useState<boolean>(false);
  const [showUnlockConfirm, setShowUnlockConfirm] = useState<boolean>(false);
  const [settingsSuccessMessage, setSettingsSuccessMessage] = useState<string>("");

  const [tempInitialVirtues, setTempInitialVirtues] = useState<Record<string, number>>(() => {
    const defaultObj: Record<string, number> = {};
    VIRTUES.forEach(v => {
      defaultObj[v] = 0;
    });
    return defaultObj;
  });

  const [tempInitialVices, setTempInitialVices] = useState<Record<string, number>>(() => {
    const defaultObj: Record<string, number> = {};
    VICES.forEach(v => {
      defaultObj[v] = 0;
    });
    return defaultObj;
  });

  useEffect(() => {
    const vObj: Record<string, number> = {};
    VIRTUES.forEach(v => {
      vObj[v] = initialStreaks.virtues[v] || 0;
    });
    setTempInitialVirtues(vObj);

    const viObj: Record<string, number> = {};
    VICES.forEach(v => {
      viObj[v] = initialStreaks.vices[v] || 0;
    });
    setTempInitialVices(viObj);
  }, [initialStreaks]);

  // Modals state
  const [showAdjustWeights, setShowAdjustWeights] = useState<boolean>(false);
  const [selectedExerciseForWeight, setSelectedExerciseForWeight] = useState<any | null>(null);
  const [singleWeightValue, setSingleWeightValue] = useState<string>("");
  const [tempWeights, setTempWeights] = useState<Record<string, string>>({});
  const [workoutDayIndex, setWorkoutDayIndex] = useState<number>(3); // Default to 3 (Thursday as in screenshot)

  // Current Calendar state (dynamic based on EST today)
  const [calendarYear, setCalendarYear] = useState<number>(() => {
    const estToday = getEstTodayString();
    return Number(estToday.split("-")[0]);
  });
  const [calendarMonth, setCalendarMonth] = useState<number>(() => {
    const estToday = getEstTodayString();
    return Number(estToday.split("-")[1]) - 1; // 0-indexed month
  });

  // --- PERSISTENCE EFFECT ---
  useEffect(() => {
    localStorage.setItem("vt_day_progress", JSON.stringify(dayProgress));
  }, [dayProgress]);

  useEffect(() => {
    localStorage.setItem("vt_exercise_weights", JSON.stringify(exerciseWeights));
  }, [exerciseWeights]);

  useEffect(() => {
    localStorage.setItem("vt_completed_sets", JSON.stringify(completedSetsHistory));
  }, [completedSetsHistory]);

  useEffect(() => {
    localStorage.setItem("vt_hspu_log", JSON.stringify(hspuLog));
  }, [hspuLog]);

  useEffect(() => {
    localStorage.setItem("vt_mindset_reviews", JSON.stringify(mindsetReviews));
  }, [mindsetReviews]);

  useEffect(() => {
    localStorage.setItem("vt_whole_life", JSON.stringify(wholeLifeScores));
  }, [wholeLifeScores]);

  useEffect(() => {
    localStorage.setItem("vt_initial_streaks", JSON.stringify(initialStreaks));
  }, [initialStreaks]);

  // --- CLOUD SYNC (Firebase) ---
  const [cloudUser, setCloudUser] = useState<User | null>(null);
  const [cloudAuthChecked, setCloudAuthChecked] = useState<boolean>(false);
  const [loginEmail, setLoginEmail] = useState<string>("");
  const [loginPassword, setLoginPassword] = useState<string>("");
  const [loginError, setLoginError] = useState<string>("");
  const [loginBusy, setLoginBusy] = useState<boolean>(false);
  const hasLoadedCloudRef = useRef<boolean>(false);
  const suppressPullUntilRef = useRef<number>(0);

  // Watch sign-in state
  useEffect(() => {
    if (!isFirebaseConfigured) { setCloudAuthChecked(true); return; }
    const unsub = onAuthStateChanged(auth, (u) => {
      setCloudUser(u);
      setCloudAuthChecked(true);
      hasLoadedCloudRef.current = false;
    });
    return () => unsub();
  }, []);

  // Pull: subscribe to this account's data doc and hydrate local state on every remote change.
  // Skips applying incoming data for a few seconds after we've just pushed a local change, so a
  // slightly-stale read can't stomp on an edit you just made (e.g. saving something in Settings).
  useEffect(() => {
    if (!isFirebaseConfigured || !cloudUser) return;
    const ref = doc(db, "users", cloudUser.uid, "appData", "state");
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists() && Date.now() >= suppressPullUntilRef.current) {
        const data = snap.data() as any;
        if (data.dayProgress) setDayProgress(data.dayProgress);
        if (data.exerciseWeights) setExerciseWeights(data.exerciseWeights);
        if (data.completedSetsHistory) setCompletedSetsHistory(data.completedSetsHistory);
        if (data.hspuLog) setHspuLog(data.hspuLog);
        if (data.mindsetReviews) setMindsetReviews(data.mindsetReviews);
        if (data.wholeLifeScores) setWholeLifeScores(data.wholeLifeScores);
        if (data.initialStreaks) setInitialStreaks(data.initialStreaks);
        if (data.customWorkouts) setCustomWorkouts(data.customWorkouts);
        if (data.workoutDaySelections) setWorkoutDaySelections(data.workoutDaySelections);
      }
      hasLoadedCloudRef.current = true;
    });
    return () => unsub();
  }, [cloudUser]);

  // Push: whenever local data changes (after the initial cloud load), write it back up, debounced
  useEffect(() => {
    if (!isFirebaseConfigured || !cloudUser || !hasLoadedCloudRef.current) return;
    const ref = doc(db, "users", cloudUser.uid, "appData", "state");
    // Hold off applying anything pulled from the cloud until well after this write lands.
    suppressPullUntilRef.current = Date.now() + 4000;
    const t = setTimeout(() => {
      setDoc(ref, {
        dayProgress, exerciseWeights, completedSetsHistory, hspuLog,
        mindsetReviews, wholeLifeScores, initialStreaks, customWorkouts, workoutDaySelections,
        updatedAt: new Date().toISOString()
      }).catch(() => {});
    }, 800);
    return () => clearTimeout(t);
  }, [cloudUser, dayProgress, exerciseWeights, completedSetsHistory, hspuLog, mindsetReviews, wholeLifeScores, initialStreaks, customWorkouts, workoutDaySelections]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginBusy(true);
    try {
      await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword);
    } catch (err: any) {
      setLoginError(err?.message?.replace("Firebase: ", "") || "Sign in failed.");
    } finally {
      setLoginBusy(false);
    }
  };

  const handleLogout = () => {
    signOut(auth).catch(() => {});
  };

  const selectedDayOfWeek = (() => {
    const d = new Date(selectedDate + "T12:00:00");
    return d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  })();

  const [viewedDayNum, setViewedDayNum] = useState<number | null>(null);
  const currentViewedDayNum = viewedDayNum !== null ? viewedDayNum : selectedDayOfWeek;

  useEffect(() => {
    setViewedDayNum(selectedDayOfWeek);
  }, [selectedDate, selectedDayOfWeek]);

  // Which workout applies to the selected date - manually chosen (not tied to weekday),
  // so it works with a rotating/irregular shift schedule. -1 means "Rest / not set".
  const currentWorkoutDayIndex = workoutDaySelections[selectedDate] ?? -1;

  const isWorkoutTabLocked = isLocked;

  // --- STREAK CALCULATION LOGIC ---
  
  // Virtue Streaks (consecutive days checked)
  const getVirtueStreak = (virtue: string): number => {
    let streak = 0;
    const estTodayStr = getEstTodayString();
    const today = new Date(estTodayStr + "T12:00:00");
    
    const loggedDates = Object.keys(dayProgress).sort();
    const earliestDateStr = loggedDates[0];
    
    // Trace backward
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const log = dayProgress[key];
      
      if (log && log.virtues.includes(virtue)) {
        streak++;
      } else {
        // If they missed it, check if they missed it today (then keep streak of yesterday if yesterday was done)
        if (i === 0) {
          continue; // Allow checking yesterday to see if current streak was active until yesterday
        }
        if (!earliestDateStr || key < earliestDateStr) {
          streak += (initialStreaks.virtues[virtue] || 0);
        }
        break;
      }
    }
    return streak;
  };

  // Vice Breaking Streaks (consecutive days avoided - i.e. did not do)
  const getViceStreak = (vice: string): number => {
    let streak = 0;
    const estTodayStr = getEstTodayString();
    const today = new Date(estTodayStr + "T12:00:00");
    
    const loggedDates = Object.keys(dayProgress).sort();
    const earliestDateStr = loggedDates[0];
    
    // Trace backward
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const log = dayProgress[key];
      
      // If we committed the vice, streak resets to 0.
      if (log && log.vices.includes(vice)) {
        break;
      } else {
        if (!log && (!earliestDateStr || key < earliestDateStr)) {
          streak += (initialStreaks.vices[vice] || 0);
          break;
        }
        streak++;
      }
    }
    return streak;
  };

  // Toggle virtue for active date - locked to current EST date
  const toggleVirtue = (virtue: string) => {
    if (selectedDate !== getEstTodayString()) return;
    setDayProgress(prev => {
      const current = prev[selectedDate] || { virtues: [], vices: [] };
      const virtues = current.virtues.includes(virtue)
        ? current.virtues.filter(v => v !== virtue)
        : [...current.virtues, virtue];
      return {
        ...prev,
        [selectedDate]: { ...current, virtues }
      };
    });
  };

  // Toggle vice for active date - locked to current EST date
  const toggleVice = (vice: string) => {
    if (selectedDate !== getEstTodayString()) return;
    setDayProgress(prev => {
      const current = prev[selectedDate] || { virtues: [], vices: [] };
      const vices = current.vices.includes(vice)
        ? current.vices.filter(v => v !== vice)
        : [...current.vices, vice];
      return {
        ...prev,
        [selectedDate]: { ...current, vices }
      };
    });
  };

  // --- ACTIONS ---
  
  // Adjust Weights Action
  // --- WORKOUT SCHEDULE EDITOR ACTIONS ---
  const updateWorkoutDayField = (dayIdx: number, field: "dayName" | "focusTitle", value: string) => {
    setCustomWorkouts(prev => prev.map((wd, i) => i === dayIdx ? { ...wd, [field]: value } : wd));
  };

  const updateExerciseField = (dayIdx: number, exIdx: number, field: keyof Exercise, value: string | number) => {
    setCustomWorkouts(prev => prev.map((wd, i) => {
      if (i !== dayIdx) return wd;
      const exercises = wd.exercises.map((ex, j) => {
        if (j !== exIdx) return ex;
        if (field === "sets") {
          const setsNum = Math.max(1, Number(value) || 1);
          return { ...ex, sets: setsNum, completedSets: Array(setsNum).fill(false) };
        }
        return { ...ex, [field]: value };
      });
      return { ...wd, exercises };
    }));
  };

  const addExerciseToDay = (dayIdx: number) => {
    setCustomWorkouts(prev => prev.map((wd, i) => {
      if (i !== dayIdx) return wd;
      const newEx: Exercise = {
        id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: "New Exercise",
        sets: 3,
        reps: "10 Reps",
        defaultWeight: 0,
        weight: 0,
        completedSets: [false, false, false]
      };
      return { ...wd, exercises: [...wd.exercises, newEx] };
    }));
  };

  const removeExerciseFromDay = (dayIdx: number, exIdx: number) => {
    setCustomWorkouts(prev => prev.map((wd, i) => {
      if (i !== dayIdx) return wd;
      return { ...wd, exercises: wd.exercises.filter((_, j) => j !== exIdx) };
    }));
  };

  const addWorkoutDay = () => {
    setCustomWorkouts(prev => [...prev, {
      dayName: `Day ${prev.length + 1}`,
      focusTitle: "New Focus",
      exercises: []
    }]);
  };

  const removeWorkoutDay = (dayIdx: number) => {
    setCustomWorkouts(prev => prev.filter((_, i) => i !== dayIdx));
    // Clear any date selections pointing at the removed day or reindex ones after it
    setWorkoutDaySelections(prev => {
      const updated: Record<string, number> = {};
      Object.entries(prev).forEach(([date, idx]) => {
        if (idx === dayIdx) return; // drop selection for the deleted day
        updated[date] = idx > dayIdx ? idx - 1 : idx;
      });
      return updated;
    });
  };

  const openAdjustWeightsModal = (dayIndex: number) => {
    const currentExercises = customWorkouts[dayIndex].exercises;
    const initialTemp: Record<string, string> = {};
    currentExercises.forEach(ex => {
      initialTemp[ex.id] = String(exerciseWeights[ex.id] ?? ex.defaultWeight);
    });
    setTempWeights(initialTemp);
    setWorkoutDayIndex(dayIndex);
    setShowAdjustWeights(true);
  };

  const saveWeights = () => {
    setExerciseWeights(prev => {
      const updated = { ...prev };
      Object.keys(tempWeights).forEach(id => {
        const val = parseFloat(tempWeights[id]);
        updated[id] = isNaN(val) ? 0 : val;
      });
      return updated;
    });
    setShowAdjustWeights(false);
  };

  const openSingleWeightModal = (ex: any) => {
    if (selectedDate !== getEstTodayString()) return;
    setSelectedExerciseForWeight(ex);
    setSingleWeightValue(String(exerciseWeights[ex.id] ?? ex.defaultWeight));
  };

  const saveSingleWeight = () => {
    if (selectedDate !== getEstTodayString()) return;
    if (selectedExerciseForWeight) {
      const val = parseFloat(singleWeightValue);
      setExerciseWeights(prev => ({
        ...prev,
        [selectedExerciseForWeight.id]: isNaN(val) ? 0 : val
      }));
      setSelectedExerciseForWeight(null);
    }
  };

  // Workout Set Toggle
  const toggleWorkoutSet = (exerciseId: string, setIndex: number) => {
    if (selectedDate !== getEstTodayString()) return;
    setCompletedSetsHistory(prev => {
      const dayLogs = prev[selectedDate] || {};
      const exSetsCount = DEFAULT_WORKOUTS.flatMap(w => w.exercises).find(e => e.id === exerciseId)?.sets || 3;
      const currentSets = dayLogs[exerciseId] || Array(exSetsCount).fill(false);
      const updatedSets = [...currentSets];
      updatedSets[setIndex] = !updatedSets[setIndex];
      
      return {
        ...prev,
        [selectedDate]: {
          ...dayLogs,
          [exerciseId]: updatedSets
        }
      };
    });
  };

  // Get current session sets state
  const getCompletedSets = (exerciseId: string, totalSets: number): boolean[] => {
    const dayLogs = completedSetsHistory[selectedDate] || {};
    return dayLogs[exerciseId] || Array(totalSets).fill(false);
  };

  // Mindset Save Handler
  const handleMindsetChange = (
    type: "morning" | "evening" | "scorecard",
    field: string,
    value: string
  ) => {
    if (selectedDate !== getEstTodayString()) return;
    setMindsetReviews(prev => {
      const todayReview = prev[selectedDate] || JSON.parse(JSON.stringify(INITIAL_MINDSET_REVIEW));
      if (type === "morning") {
        const currentVal = todayReview.morningAnswers[field];
        todayReview.morningAnswers[field] = currentVal === value ? "" : value;
      } else if (type === "evening") {
        const currentVal = todayReview.eveningAnswers[field];
        todayReview.eveningAnswers[field] = currentVal === value ? "" : value;
      } else if (type === "scorecard") {
        const currentVal = todayReview.scorecard[field];
        todayReview.scorecard[field] = currentVal === value ? "" : value;
      }
      return {
        ...prev,
        [selectedDate]: todayReview
      };
    });
  };

  const currentMindsetReview = mindsetReviews[selectedDate] || INITIAL_MINDSET_REVIEW;

  // Dynamic header stats
  const overallVirtueStreak = (() => {
    let streak = 0;
    const estTodayStr = getEstTodayString();
    const today = new Date(estTodayStr + "T12:00:00");
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const log = dayProgress[key];
      if (log && log.virtues.length > 0) {
        streak++;
      } else {
        if (i === 0) continue;
        break;
      }
    }
    return streak;
  })();

  const sobrietyBreakdown = (() => {
    if (!initialStreaks?.sobrietyDate) return null;
    try {
      const start = new Date(initialStreaks.sobrietyDate + "T00:00:00");
      const estTodayStr = getEstTodayString();
      const today = new Date(estTodayStr + "T00:00:00");
      if (isNaN(start.getTime()) || today < start) return null;

      let years = today.getFullYear() - start.getFullYear();
      let months = today.getMonth() - start.getMonth();
      let days = today.getDate() - start.getDate();
      if (days < 0) {
        months -= 1;
        const prevMonthLastDay = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
        days += prevMonthLastDay;
      }
      if (months < 0) {
        years -= 1;
        months += 12;
      }
      const totalDays = Math.max(0, Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      return { years, months, days, totalDays };
    } catch (e) {
      return null;
    }
  })();

  const overallViceFreeStreak = (() => {
    let streak = 0;
    const estTodayStr = getEstTodayString();
    const today = new Date(estTodayStr + "T12:00:00");
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const log = dayProgress[key];
      if (log && log.vices && log.vices.length > 0) {
        break;
      } else {
        streak++;
      }
    }
    return streak;
  })();

  // Log HSPU Routine Progress
  const logHspuSession = (focusName: string) => {
    const todayStr = selectedDate;
    if (todayStr !== getEstTodayString()) return;
    if (hspuLog.loggedDates.includes(todayStr)) {
      alert("You have already logged a handstand pushup session for today!");
      return;
    }

    setHspuLog(prev => {
      const updatedDates = [todayStr, ...prev.loggedDates];
      const total = prev.totalSessions + 1;
      
      // Calculate milestones completed
      const milestonesDone = MILESTONES.filter(m => total >= m);
      
      return {
        ...prev,
        totalSessions: total,
        activeStreak: prev.activeStreak + 1,
        completedMilestones: milestonesDone,
        loggedDates: updatedDates
      };
    });
  };

  // Export User Data as JSON
  const exportData = () => {
    try {
      const payload = {
        exportedAt: new Date().toISOString(),
        dayProgress,
        exerciseWeights,
        completedSetsHistory,
        hspuLog,
        mindsetReviews,
        wholeLifeScores,
        initialStreaks
      };
      const dataStr = JSON.stringify(payload, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const exportFileDefaultName = `Virtue_Tracker_Backup_${selectedDate}.json`;

      const linkElement = document.createElement('a');
      linkElement.href = url;
      linkElement.download = exportFileDefaultName;
      document.body.appendChild(linkElement);
      linkElement.click();
      document.body.removeChild(linkElement);

      // Release the object URL after the download has had a chance to start.
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      alert("Export failed: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  // Import User Data
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const fileReader = new FileReader();
    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.dayProgress) setDayProgress(parsed.dayProgress);
        if (parsed.exerciseWeights) setExerciseWeights(parsed.exerciseWeights);
        if (parsed.completedSetsHistory) setCompletedSetsHistory(parsed.completedSetsHistory);
        if (parsed.hspuLog) setHspuLog(parsed.hspuLog);
        if (parsed.mindsetReviews) setMindsetReviews(parsed.mindsetReviews);
        if (parsed.wholeLifeScores) setWholeLifeScores(parsed.wholeLifeScores);
        if (parsed.initialStreaks) setInitialStreaks(parsed.initialStreaks);
        alert("Backup imported successfully!");
      } catch (err) {
        alert("Invalid backup file format.");
      } finally {
        // Reset so selecting the same file again still fires onChange.
        e.target.value = "";
      }
    };
    fileReader.onerror = () => {
      alert("Couldn't read that file. Please try again.");
      e.target.value = "";
    };
    fileReader.readAsText(file, "UTF-8");
  };

  // Clear all data for Daily Review and reset everything
  const executeEraseAllData = () => {
    setDayProgress({});
    setCompletedSetsHistory({});
    setHspuLog({
      totalSessions: 0,
      activeStreak: 0,
      completedMilestones: [],
      loggedDates: []
    });
    setMindsetReviews({});
    setWholeLifeScores({
      health: 5,
      mentalEmotional: 5,
      partnerSignificantOther: 5,
      family: 5,
      friends: 5,
      mission: 5,
      experiences: 5,
      spirit: 5,
      finances: 5,
      learning: 5
    });
    
    const virtuesDefault: Record<string, number> = {};
    VIRTUES.forEach(v => { virtuesDefault[v] = 0; });
    const vicesDefault: Record<string, number> = {};
    VICES.forEach(v => { vicesDefault[v] = 0; });
    
    setInitialStreaks({
      virtues: virtuesDefault,
      vices: vicesDefault,
      setupCompleted: false
    });

    localStorage.clear();
    setShowEraseModal(false);
    setEraseStep(1);
    setEraseConfirmText("");
    alert("All application data has been completely erased.");
  };

  // --- CALENDAR RENDERING ---
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfWeek = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(calendarYear, calendarMonth);
    const firstDay = getFirstDayOfWeek(calendarYear, calendarMonth);
    const days = [];

    // Empty spaces for previous month's alignment
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-14 md:h-20" />);
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const isSelected = dateKey === selectedDate;
      const progress = dayProgress[dateKey];
      
      const isPrior = dateKey < estToday;
      const isFuture = dateKey > estToday;

      // Default neutral colors
      let dayBg = "bg-slate-900/40 hover:bg-slate-850/40 border-slate-800/80";
      let dayTextColor = "text-slate-400";
      
      // Determine if any data is entered for this day
      const hasHabits = progress && (progress.virtues.length > 0 || progress.vices.length > 0);
      const dayWorkout = completedSetsHistory?.[dateKey];
      const hasWorkout = !!dayWorkout && Object.values(dayWorkout).some((sets: any) => Array.isArray(sets) && sets.some(s => s));
      const hasMindset = mindsetReviews && mindsetReviews[dateKey] && (mindsetReviews[dateKey].morningNote || mindsetReviews[dateKey].eveningNote || mindsetReviews[dateKey].generalNote);
      const hasHspu = hspuLog && hspuLog.loggedDates && hspuLog.loggedDates.includes(dateKey);
      
      const hasDataEntered = !!(hasHabits || hasWorkout || hasMindset || hasHspu);

      if (initialStreaks.setupCompleted) {
        if (hasHabits) {
          const virtuesCount = progress.virtues.length;
          const vicesCount = progress.vices.length;
          
          if (virtuesCount > vicesCount) {
            dayBg = "bg-emerald-500 text-white shadow-md shadow-emerald-500/25 border-emerald-500/20";
            dayTextColor = "text-white font-bold";
          } else {
            dayBg = "bg-rose-500 text-white shadow-md shadow-rose-500/25 border-rose-500/20";
            dayTextColor = "text-white font-bold";
          }
        }
      }

      days.push(
        <button
          key={`day-${day}`}
          onClick={() => {
            if (!isFuture) {
              setSelectedDate(dateKey);
            }
          }}
          disabled={isFuture}
          id={`calendar-day-${day}`}
          className={`h-14 md:h-20 rounded-xl border flex flex-col justify-between p-2 transition-all duration-200 relative ${dayBg} ${
            isSelected ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-[#0d1527] scale-[1.03]" : ""
          } ${isFuture ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
        >
          <span className={`text-sm md:text-base font-semibold ${dayTextColor}`}>
            {day}
          </span>
          {progress && (
            <div className="flex gap-1 justify-end w-full">
              {progress.virtues.length > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              )}
              {progress.vices.length > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              )}
            </div>
          )}
        </button>
      );
    }

    return days;
  };

  const getMonthName = (monthIdx: number) => {
    return [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ][monthIdx];
  };

  const handlePrevMonth = () => {
    setCalendarMonth(prev => {
      if (prev === 0) {
        setCalendarYear(y => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    setCalendarMonth(prev => {
      if (prev === 11) {
        setCalendarYear(y => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  // Show a lightweight sign-in screen when Firebase is configured and no one's signed in yet.
  // Skipped entirely (falls straight through to the app on local storage only) until you add real
  // Firebase config values, so this never blocks you from using the app.
  if (isFirebaseConfigured && cloudAuthChecked && !cloudUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans">
        <form onSubmit={handleLogin} className="w-full max-w-sm bg-slate-900/60 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-lg font-bold font-display text-white">Virtue Tracker</h1>
          </div>
          <p className="text-xs text-slate-400">Sign in with the account you created in Firebase to sync across your devices.</p>
          <div className="space-y-3">
            <input
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="Email"
              autoCapitalize="none"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
              required
            />
            <input
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
              required
            />
          </div>
          {loginError && (
            <p className="text-xs text-red-400 bg-red-950/30 border border-red-500/20 rounded-lg px-3 py-2">{loginError}</p>
          )}
          <button
            type="submit"
            disabled={loginBusy}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition disabled:opacity-50"
          >
            {loginBusy ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative overflow-x-hidden pb-12 selection:bg-emerald-500/30 selection:text-white">
      {/* --- HEADER --- */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40 px-4 py-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white uppercase">
                Virtue Tracker
              </h1>
              <p className="text-[10px] text-slate-400 font-semibold tracking-wider">Perfect your habits, command your mind</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-end gap-6">
            {/* Real Streaks from Mockup Style */}
            <div className="flex gap-6">
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-widest">Virtue Streak</span>
                <span className="text-xl font-mono text-emerald-400 font-bold">
                  {String(overallVirtueStreak).padStart(2, "0")} DAYS
                </span>
              </div>
            </div>

            <div className="w-[1px] h-10 bg-slate-800 hidden lg:block"></div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Cloud Sync Status */}
              {isFirebaseConfigured && cloudUser && (
                <button
                  onClick={handleLogout}
                  title={`Signed in as ${cloudUser.email}. Tap to sign out.`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/20 hover:bg-emerald-950/40 text-xs text-emerald-400 border border-emerald-500/20 transition"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Synced
                </button>
              )}
              {/* Export / Import */}
              <button 
                onClick={exportData}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-xs text-slate-200 border border-slate-700 hover:border-slate-600 transition"
                title="Backup Data"
              >
                <Download className="w-3.5 h-3.5" />
                Export Backup
              </button>
              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-xs text-slate-200 border border-slate-700 hover:border-slate-600 cursor-pointer transition">
                <Upload className="w-3.5 h-3.5" />
                Import Backup
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleImportJson} 
                  className="hidden" 
                />
              </label>
              <div className="px-3 py-1.5 rounded-lg bg-slate-900 text-xs border border-slate-800 font-mono text-slate-300">
                {selectedDate}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* --- RECOVERY COUNTER BANNER --- */}
      {sobrietyBreakdown && (
        <div className="bg-gradient-to-r from-emerald-950/40 via-emerald-900/20 to-emerald-950/40 border-b border-emerald-500/20 px-4 py-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-center">
            <div className="flex items-center gap-2 text-emerald-400">
              <Shield className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest">Sober Since {new Date(initialStreaks.sobrietyDate + "T12:00:00").toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div className="flex items-baseline gap-4 sm:gap-6">
              <div className="text-center">
                <span className="text-2xl sm:text-3xl font-extrabold text-white font-display">{sobrietyBreakdown.years}</span>
                <span className="text-xs text-emerald-300 font-bold uppercase ml-1">{sobrietyBreakdown.years === 1 ? "Year" : "Years"}</span>
              </div>
              <div className="text-center">
                <span className="text-2xl sm:text-3xl font-extrabold text-white font-display">{sobrietyBreakdown.months}</span>
                <span className="text-xs text-emerald-300 font-bold uppercase ml-1">{sobrietyBreakdown.months === 1 ? "Month" : "Months"}</span>
              </div>
              <div className="text-center">
                <span className="text-2xl sm:text-3xl font-extrabold text-white font-display">{sobrietyBreakdown.days}</span>
                <span className="text-xs text-emerald-300 font-bold uppercase ml-1">{sobrietyBreakdown.days === 1 ? "Day" : "Days"}</span>
              </div>
            </div>
            <span className="text-[11px] text-emerald-500/70 font-mono">({sobrietyBreakdown.totalDays.toLocaleString()} days total)</span>
          </div>
        </div>
      )}

      {/* --- SUB-BAR (ACTIVE TAB NAVIGATION) --- */}
      <div className="bg-slate-900/40 py-3 border-b border-slate-800 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-2 justify-center sm:justify-start">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition duration-200 flex items-center gap-2 border ${
              activeTab === "overview" 
                ? "bg-slate-800 border-slate-700 text-white shadow-md shadow-slate-950/20" 
                : "bg-slate-900/30 border-slate-800/80 hover:border-slate-750 text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
            }`}
          >
            <Calendar className="w-4 h-4 text-emerald-400" />
            Daily Overview
          </button>
          
          <button
            onClick={() => setActiveTab("workout")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition duration-200 flex items-center gap-2 border ${
              activeTab === "workout" 
                ? "bg-slate-800 border-slate-700 text-white shadow-md shadow-slate-950/20" 
                : "bg-slate-900/30 border-slate-800/80 hover:border-slate-750 text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
            }`}
          >
            <Dumbbell className="w-4 h-4 text-emerald-400" />
            10-Week Mass
          </button>

          <button
            onClick={() => setActiveTab("review")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition duration-200 flex items-center gap-2 border ${
              activeTab === "review" 
                ? "bg-slate-800 border-slate-700 text-white shadow-md shadow-slate-950/20" 
                : "bg-slate-900/30 border-slate-800/80 hover:border-slate-750 text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
            }`}
          >
            <BookOpen className="w-4 h-4 text-blue-400" />
            Daily Review
          </button>

          <button
            onClick={() => setActiveTab("hspu")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition duration-200 flex items-center gap-2 border ${
              activeTab === "hspu" 
                ? "bg-slate-800 border-slate-700 text-white shadow-md shadow-slate-950/20" 
                : "bg-slate-900/30 border-slate-800/80 hover:border-slate-750 text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
            }`}
          >
            <Zap className="w-4 h-4 text-purple-400" />
            HSPU Journey
          </button>

          <button
            onClick={() => setActiveTab("life")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition duration-200 flex items-center gap-2 border ${
              activeTab === "life" 
                ? "bg-slate-800 border-slate-700 text-white shadow-md shadow-slate-950/20" 
                : "bg-slate-900/30 border-slate-800/80 hover:border-slate-750 text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
            }`}
          >
            <Heart className="w-4 h-4 text-cyan-400" />
            Life Assessment
          </button>

          <button
            onClick={() => setActiveTab("streaks")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition duration-200 flex items-center gap-2 border ${
              activeTab === "streaks" 
                ? "bg-slate-800 border-slate-700 text-white shadow-md shadow-slate-950/20" 
                : "bg-slate-900/30 border-slate-800/80 hover:border-slate-750 text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
            }`}
          >
            <Flame className="w-4 h-4 text-rose-400" />
            Streaks & Milestones
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition duration-200 flex items-center gap-2 border ${
              activeTab === "settings" 
                ? "bg-slate-800 border-slate-700 text-white shadow-md shadow-slate-950/20" 
                : "bg-slate-900/30 border-slate-800/80 hover:border-slate-750 text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
            }`}
          >
            <Settings className="w-4 h-4 text-slate-400" />
            Settings
          </button>
        </div>
      </div>

      {/* --- MAIN PAGE CONTAINER --- */}
      <main className="max-w-7xl mx-auto px-4 py-6 w-full flex-grow">
        
        {isLocked && (
          <div className="mb-6 p-4 rounded-xl bg-purple-950/20 border border-purple-500/20 text-purple-300 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeIn">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              <span>
                <strong>🔒 READ-ONLY HISTORICAL VIEW</strong>: You are viewing a date other than today. Editing is disabled. Select the current EST date (<strong>{estToday}</strong>) to log your progress.
              </span>
            </div>
            <button
              onClick={() => {
                setSelectedDate(estToday);
                const [estY, estM] = estToday.split("-").map(Number);
                setCalendarYear(estY);
                setCalendarMonth(estM - 1);
              }}
              className="px-3 py-1 rounded bg-purple-500/20 hover:bg-purple-500/30 text-[10px] font-bold font-mono text-purple-300 uppercase transition border border-purple-500/30 whitespace-nowrap cursor-pointer"
            >
              Go to Today
            </button>
          </div>
        )}
        
        {/* --- ROUTE/TAB CONTENT CONTROLLER --- */}
        <AnimatePresence mode="wait">
          
          {/* TAB 1: DAILY OVERVIEW (CALENDAR) */}
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Calendar Grid Box */}
              <div className="bg-slate-900/40 rounded-2xl border border-slate-800 p-6 shadow-xl">
                {/* Header navigation */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg md:text-xl font-display font-bold text-white flex items-center gap-2">
                    Monthly Overview ({getMonthName(calendarMonth)} {calendarYear})
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={handlePrevMonth}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleNextMonth}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Days of Week Row */}
                <div className="grid grid-cols-7 gap-2 text-center font-mono text-xs text-slate-400 font-semibold mb-3">
                  <div>S</div>
                  <div>M</div>
                  <div>T</div>
                  <div>W</div>
                  <div>T</div>
                  <div>F</div>
                  <div>S</div>
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-2 md:gap-3">
                  {renderCalendarDays()}
                </div>
              </div>

              {/* Toggles Panel for Selected Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* VIRTUES PANEL */}
                <div className={`bg-slate-900/40 rounded-2xl border border-slate-800 p-6 shadow-xl transition-all duration-200 ${isLocked ? "pointer-events-none opacity-60" : ""}`}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-emerald-500/15 p-2 rounded-xl text-emerald-400">
                      <Check className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold font-display text-white">Virtues</h3>
                  </div>

                  <p className="text-xs text-slate-400 mb-4">
                    Complete these each day to grow positive streaks.
                  </p>

                  <div className="grid grid-cols-1 gap-3">
                    {VIRTUES.map(virtue => {
                      const active = dayProgress[selectedDate]?.virtues.includes(virtue);
                      return (
                        <button
                          key={virtue}
                          onClick={() => toggleVirtue(virtue)}
                          className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                            active 
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-medium" 
                              : "bg-slate-800/50 border-slate-800 hover:border-emerald-500/30 text-slate-400 hover:text-slate-300 cursor-pointer"
                          }`}
                        >
                          <span className="text-sm">{virtue}</span>
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                            active ? "bg-emerald-500 border-emerald-400 text-white" : "border-slate-600"
                          }`}>
                            {active && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* VICES PANEL */}
                <div className={`bg-slate-900/40 rounded-2xl border border-slate-800 p-6 shadow-xl transition-all duration-200 ${isLocked ? "pointer-events-none opacity-60" : ""}`}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-red-500/15 p-2 rounded-xl text-red-400">
                      <X className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold font-display text-white">Vices</h3>
                  </div>

                  <p className="text-xs text-slate-400 mb-4">
                    Commitment resets your breaking streaks to 0 today.
                  </p>

                  <div className="grid grid-cols-1 gap-3">
                    {VICES.map(vice => {
                      const active = dayProgress[selectedDate]?.vices.includes(vice);
                      return (
                        <button
                          key={vice}
                          onClick={() => toggleVice(vice)}
                          className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                            active 
                              ? "bg-rose-500/10 border-rose-500/30 text-rose-400 font-medium" 
                              : "bg-slate-800/50 border-slate-800 hover:border-rose-500/30 text-slate-400"
                          }`}
                        >
                          <span className="text-sm">{vice}</span>
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                            active ? "bg-red-500 border-red-400 text-white" : "border-slate-600"
                          }`}>
                            {active && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* TAB 2: 5 DAY SUPERSET WORKOUT */}
          {activeTab === "workout" && (
            <motion.div
              key="workout"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Workout Day Picker - choose which schedule day applies today, independent of the calendar weekday */}
              <div className="flex flex-col items-center gap-2 max-w-2xl mx-auto">
                <div className="flex flex-wrap justify-center gap-1.5 p-1 bg-slate-950/60 rounded-2xl border border-slate-800/80 w-full">
                  {customWorkouts.map((wd, idx) => {
                    const isSelected = currentWorkoutDayIndex === idx;
                    return (
                      <button
                        key={idx}
                        onClick={() => !isLocked && setWorkoutDaySelections(prev => ({ ...prev, [selectedDate]: idx }))}
                        disabled={isLocked}
                        title={wd.focusTitle}
                        className={`flex-1 min-w-[76px] py-2.5 px-2 text-center rounded-xl font-medium text-xs transition-all ${
                          isSelected
                            ? "bg-emerald-600 text-white shadow-lg font-bold"
                            : "bg-slate-900/40 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-slate-800/60"
                        } ${isLocked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        {wd.dayName || `Day ${idx + 1}`}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => !isLocked && setWorkoutDaySelections(prev => ({ ...prev, [selectedDate]: -1 }))}
                    disabled={isLocked}
                    className={`flex-1 min-w-[76px] py-2.5 px-2 text-center rounded-xl font-medium text-xs transition-all ${
                      currentWorkoutDayIndex === -1
                        ? "bg-slate-700 text-white shadow-lg font-bold"
                        : "bg-slate-900/40 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-slate-800/60"
                    } ${isLocked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    Rest
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1 uppercase tracking-wider text-center">
                  {isLocked ? (
                    <>
                      <Lock className="w-3 h-3 text-slate-500" /> Viewing {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: 'long', month: 'short', day: 'numeric' })} (read-only)
                    </>
                  ) : (
                    <>Pick today's workout — edit the schedule itself from Settings</>
                  )}
                </p>
              </div>

              {currentWorkoutDayIndex === -1 ? (
                <div className="bg-slate-900/40 rounded-2xl border border-slate-800 p-8 shadow-xl relative overflow-hidden transition-all duration-200">
                  <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500" />
                  <div className="flex flex-col items-center text-center max-w-lg mx-auto py-6 space-y-6">
                    <div className="bg-emerald-500/15 p-4 rounded-full text-emerald-400">
                      <Compass className="w-10 h-10 animate-pulse" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest font-mono">
                        WEEKEND REST DAY
                      </span>
                      <h2 className="text-2xl md:text-3xl font-display font-bold text-white mt-2">
                        Recover & Grow
                      </h2>
                      <p className="text-sm text-slate-400 mt-2">
                        Rest is just as critical as training for optimal protein synthesis and muscular hypertrophy. Focus on active recovery and fueling your body.
                      </p>
                    </div>

                    <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 text-left pt-4">
                      <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/60 space-y-1.5">
                        <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
                          💧 Hydrate & Fuel
                        </h4>
                        <p className="text-xs text-slate-300">
                          Prioritize clean nutrition, protein intake, and hydration to rebuild muscle fibers.
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/60 space-y-1.5">
                        <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
                          🚶‍♂️ Active Recovery
                        </h4>
                        <p className="text-xs text-slate-300">
                          Incorporate light walking, outdoor activity, or targeted mobility and stretching routines.
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/60 space-y-1.5">
                        <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
                          🧘 Sleep & Mindset
                        </h4>
                        <p className="text-xs text-slate-300">
                          Ensure 8+ hours of quality sleep to optimize natural hormone release and central nervous system recovery.
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/60 space-y-1.5">
                        <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
                          📈 Weekly Review
                        </h4>
                        <p className="text-xs text-slate-300">
                          Head over to the Streaks or Overview tab to reflect on your progression and logs.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Workout Details Card */
                <div className={`bg-slate-900/40 rounded-2xl border border-slate-800 p-6 shadow-xl relative overflow-hidden transition-all duration-200 ${isWorkoutTabLocked ? "pointer-events-none opacity-60" : ""}`}>
                  <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500" />
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest font-mono">
                        {customWorkouts[currentWorkoutDayIndex].dayName}
                      </span>
                      <h2 className="text-xl md:text-2xl font-display font-bold text-white mt-1">
                        {customWorkouts[currentWorkoutDayIndex].focusTitle}
                      </h2>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold font-mono bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 uppercase">
                        IN PROGRESS
                      </span>
                      <button
                        onClick={() => openAdjustWeightsModal(currentWorkoutDayIndex)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5 text-xs font-medium"
                      >
                        <Settings className="w-4 h-4 text-emerald-400" />
                        Adjust Weights
                      </button>
                    </div>
                  </div>

                  {/* Exercises Cards */}
                  <div className="space-y-5">
                    {(() => {
                      const exercises = customWorkouts[currentWorkoutDayIndex].exercises;
                      const grouped: Array<
                        | { type: "single"; exercise: typeof exercises[0] }
                        | { type: "superset"; exercises: typeof exercises }
                      > = [];

                      let currentSuperset: typeof exercises = [];

                      for (let i = 0; i < exercises.length; i++) {
                        const ex = exercises[i];
                        if (ex.supersetAfter) {
                          currentSuperset.push(ex);
                        } else {
                          if (currentSuperset.length > 0) {
                            currentSuperset.push(ex);
                            grouped.push({ type: "superset", exercises: currentSuperset });
                            currentSuperset = [];
                          } else {
                            grouped.push({ type: "single", exercise: ex });
                          }
                        }
                      }
                      if (currentSuperset.length > 0) {
                        grouped.push({ type: "superset", exercises: currentSuperset });
                      }

                      return grouped.map((group, gIdx) => {
                        if (group.type === "single") {
                          const ex = group.exercise;
                          const weight = exerciseWeights[ex.id] ?? ex.defaultWeight;
                          const completedSets = getCompletedSets(ex.id, ex.sets);
                          
                          return (
                            <div key={ex.id} className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-slate-700/60 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="space-y-2">
                                <h3 className="text-base md:text-lg font-semibold text-white">
                                  {ex.name}
                                </h3>
                                <div className="flex gap-2">
                                  <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-xs text-slate-300 border border-slate-700/50">
                                    {ex.sets} Sets
                                  </span>
                                  <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-xs text-slate-300 border border-slate-700/50">
                                    {ex.reps}
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-col sm:items-end gap-3">
                                <button
                                  onClick={() => openSingleWeightModal(ex)}
                                  title="Click to adjust weight"
                                  className="text-emerald-400 hover:text-emerald-300 font-mono text-sm font-bold flex items-center gap-1 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-xl border border-emerald-500/20 hover:border-emerald-500/30 transition-all cursor-pointer shadow-sm"
                                >
                                  {weight} <span className="text-xs text-slate-500">lbs</span>
                                </button>

                                <div className="flex gap-2">
                                  {Array.from({ length: ex.sets }).map((_, sIdx) => {
                                    const isDone = completedSets[sIdx];
                                    return (
                                      <button
                                        key={sIdx}
                                        onClick={() => toggleWorkoutSet(ex.id, sIdx)}
                                        className={`px-4 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                                          isDone 
                                            ? "bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-900/10" 
                                            : "bg-slate-800/40 border-slate-700 hover:border-slate-600 text-slate-300"
                                        }`}
                                      >
                                        {isDone ? (
                                          <span className="flex items-center gap-1">
                                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                                            Set {sIdx + 1}
                                          </span>
                                        ) : (
                                          `Set ${sIdx + 1}`
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        } else {
                          const firstEx = group.exercises[0];
                          return (
                            <div key={`group-${firstEx.id}`} className="p-5 rounded-3xl bg-purple-950/10 border border-purple-500/30 shadow-md shadow-purple-950/10 space-y-4">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-purple-400 tracking-widest font-mono flex items-center gap-1.5 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20 uppercase">
                                  ⚡ SUPERSET ({group.exercises.length} EXERCISES)
                                </span>
                              </div>
                              <div className="space-y-3">
                                {group.exercises.map((ex, exIdx) => {
                                  const weight = exerciseWeights[ex.id] ?? ex.defaultWeight;
                                  const completedSets = getCompletedSets(ex.id, ex.sets);
                                  
                                  return (
                                    <div key={ex.id} className="relative">
                                      <div className="p-4 rounded-2xl bg-slate-950/30 border border-slate-800/50 hover:border-purple-500/30 hover:bg-slate-950/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="space-y-2">
                                          <h4 className="text-base font-semibold text-white">
                                            {ex.name}
                                          </h4>
                                          <div className="flex gap-2">
                                            <span className="px-2 py-0.5 rounded-lg bg-slate-850/60 text-xs text-slate-300 border border-slate-700/30">
                                              {ex.sets} Sets
                                            </span>
                                            <span className="px-2 py-0.5 rounded-lg bg-slate-850/60 text-xs text-slate-300 border border-slate-700/30">
                                              {ex.reps}
                                            </span>
                                          </div>
                                        </div>

                                        <div className="flex flex-col sm:items-end gap-3">
                                          <button
                                            onClick={() => openSingleWeightModal(ex)}
                                            title="Click to adjust weight"
                                            className="text-emerald-400 hover:text-emerald-300 font-mono text-sm font-bold flex items-center gap-1 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-xl border border-emerald-500/20 hover:border-emerald-500/30 transition-all cursor-pointer shadow-sm"
                                          >
                                            {weight} <span className="text-xs text-slate-500">lbs</span>
                                          </button>

                                          <div className="flex gap-2">
                                            {Array.from({ length: ex.sets }).map((_, sIdx) => {
                                              const isDone = completedSets[sIdx];
                                              return (
                                                <button
                                                  key={sIdx}
                                                  onClick={() => toggleWorkoutSet(ex.id, sIdx)}
                                                  className={`px-4 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                                                    isDone 
                                                      ? "bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-900/10" 
                                                      : "bg-slate-800/40 border-slate-700 hover:border-slate-600 text-slate-300"
                                                  }`}
                                                >
                                                  {isDone ? (
                                                    <span className="flex items-center gap-1">
                                                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                                                      Set {sIdx + 1}
                                                    </span>
                                                  ) : (
                                                    `Set ${sIdx + 1}`
                                                  )}
                                                </button>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {exIdx < group.exercises.length - 1 && (
                                        <div className="flex justify-center my-1.5">
                                          <div className="h-6 w-[2px] bg-purple-500/20 border-l border-dashed border-purple-500/30" />
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        }
                      });
                    })()}
                  </div>

                  {/* Mark Workout Complete */}
                  {currentWorkoutDayIndex !== -1 && (
                    <button
                      onClick={() => toggleVirtue("Workout")}
                      disabled={isLocked}
                      className={`mt-6 w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                        dayProgress[selectedDate]?.virtues.includes("Workout")
                          ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20"
                          : "bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 hover:border-emerald-500/40"
                      } ${isLocked ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      {dayProgress[selectedDate]?.virtues.includes("Workout") ? (
                        <>
                          <Check className="w-5 h-5 stroke-[3]" />
                          Workout Complete
                        </>
                      ) : (
                        <>
                          <Dumbbell className="w-5 h-5" />
                          Mark Workout Complete
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 3: DAILY REVIEW */}
          {activeTab === "review" && (
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* Morning Mindset Panel */}
              <div className={`bg-slate-900/40 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6 transition-all duration-200 ${isLocked ? "pointer-events-none opacity-60" : ""}`}>
                <div className="flex items-center gap-2 mb-2 border-b border-slate-800 pb-3">
                  <Clock className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-bold font-display text-white">Morning Mindset</h3>
                </div>

                {/* Q1 */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-300">1. One thing I can get excited about today is...</p>
                  <div className="grid grid-cols-2 gap-2">
                    {["Working Out", "Self Help", "New Adventure", "Fun Activity"].map(opt => (
                      <button
                        key={opt}
                        onClick={() => handleMindsetChange("morning", "excited", opt)}
                        className={`py-2 px-3 rounded-lg text-xs font-medium text-left border transition ${
                          currentMindsetReview.morningAnswers.excited === opt
                            ? "bg-amber-950/20 border-amber-500 text-amber-300"
                            : "bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-400"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Q2 */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-300">2. If one word could describe the kind of person I want to be...</p>
                  <div className="grid grid-cols-2 gap-2">
                    {["Focused", "Present", "Patient", "Resilient"].map(opt => (
                      <button
                        key={opt}
                        onClick={() => handleMindsetChange("morning", "person", opt)}
                        className={`py-2 px-3 rounded-lg text-xs font-medium text-left border transition ${
                          currentMindsetReview.morningAnswers.person === opt
                            ? "bg-amber-950/20 border-amber-500 text-amber-300"
                            : "bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-400"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Q3 */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-300">3. Someone who needs me on my A-game today is...</p>
                  <div className="grid grid-cols-2 gap-2">
                    {["Family", "Friend", "Myself", "Work Person"].map(opt => (
                      <button
                        key={opt}
                        onClick={() => handleMindsetChange("morning", "needsMe", opt)}
                        className={`py-2 px-3 rounded-lg text-xs font-medium text-center border transition ${
                          currentMindsetReview.morningAnswers.needsMe === opt
                            ? "bg-amber-950/20 border-amber-500 text-amber-300"
                            : "bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-400"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Q4 */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-300">4. A situation that might stress me out...</p>
                  <div className="grid grid-cols-3 gap-2">
                    {["Deadline", "Conflict", "Challenging Conversation"].map(opt => (
                      <button
                        key={opt}
                        onClick={() => handleMindsetChange("morning", "stressor", opt)}
                        className={`py-2 px-3 rounded-lg text-xs font-medium text-center border transition ${
                          currentMindsetReview.morningAnswers.stressor === opt
                            ? "bg-amber-950/20 border-amber-500 text-amber-300"
                            : "bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-400"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Q5 */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-300">5. ...and the way my best self would deal with that is...</p>
                  <div className="grid grid-cols-3 gap-2">
                    {["CBT Journal", "Patience", "Talk to someone"].map(opt => (
                      <button
                        key={opt}
                        onClick={() => handleMindsetChange("morning", "handling", opt)}
                        className={`py-2 px-3 rounded-lg text-xs font-medium text-center border transition ${
                          currentMindsetReview.morningAnswers.handling === opt
                            ? "bg-amber-950/20 border-amber-500 text-amber-300"
                            : "bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-400"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Q6 */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-300">6. Someone I could surprise with a note, gift, or sign of appreciation...</p>
                  <div className="grid grid-cols-3 gap-2">
                    {["Friend", "Myself", "Family"].map(opt => (
                      <button
                        key={opt}
                        onClick={() => handleMindsetChange("morning", "surprise", opt)}
                        className={`py-2 px-3 rounded-lg text-xs font-medium text-center border transition ${
                          currentMindsetReview.morningAnswers.surprise === opt
                            ? "bg-amber-950/20 border-amber-500 text-amber-300"
                            : "bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-400"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Q7 */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-300">7. One action I could take today to demonstrate excellence...</p>
                  <div className="grid grid-cols-2 gap-2">
                    {["Deep Work Session", "Create Something", "Physical Challenge", "Learn Something New"].map(opt => (
                      <button
                        key={opt}
                        onClick={() => handleMindsetChange("morning", "excellence", opt)}
                        className={`py-2 px-3 rounded-lg text-xs font-medium text-left border transition ${
                          currentMindsetReview.morningAnswers.excellence === opt
                            ? "bg-amber-950/20 border-amber-500 text-amber-300"
                            : "bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-400"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Q8 */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-300">8. One thing I could do today that is a little outside of my comfort zone is to...</p>
                  <div className="grid grid-cols-2 gap-2">
                    {["Set a Boundary", "Go somewhere new", "Test a Boundary", "One Travel Idea"].map(opt => (
                      <button
                        key={opt}
                        onClick={() => handleMindsetChange("morning", "comfortZone", opt)}
                        className={`py-2 px-3 rounded-lg text-xs font-medium text-left border transition ${
                          currentMindsetReview.morningAnswers.comfortZone === opt
                            ? "bg-amber-950/20 border-amber-500 text-amber-300"
                            : "bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-400"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Evening Journal & Habits Panel */}
              <div className="space-y-6">
                
                {/* Evening Journal Card */}
                <div className={`bg-slate-900/40 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6 transition-all duration-200 ${isLocked ? "pointer-events-none opacity-60" : ""}`}>
                  <div className="flex items-center gap-2 mb-2 border-b border-slate-800 pb-3">
                    <Moon className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-lg font-bold font-display text-white">Evening Journal</h3>
                  </div>

                  {/* Q1 */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-slate-300">1. A moment that I really appreciated today was...</p>
                    <div className="grid grid-cols-2 gap-2">
                      {["Peace", "Family Progress", "CBT Progress", "Great Day at Work"].map(opt => (
                        <button
                          key={opt}
                          onClick={() => handleMindsetChange("evening", "appreciated", opt)}
                          className={`py-2 px-3 rounded-lg text-xs font-medium text-left border transition ${
                            currentMindsetReview.eveningAnswers.appreciated === opt
                              ? "bg-indigo-950/20 border-indigo-500 text-indigo-300"
                              : "bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-400"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Q2 */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-slate-300">2. A situation or task I handled well today was...</p>
                    <div className="grid grid-cols-2 gap-2">
                      {["Difficult Conversation", "Financial Progress", "Kept Patient", "CBT Progress."].map(opt => (
                        <button
                          key={opt}
                          onClick={() => handleMindsetChange("evening", "handledWell", opt)}
                          className={`py-2 px-3 rounded-lg text-xs font-medium text-left border transition ${
                            currentMindsetReview.eveningAnswers.handledWell === opt
                              ? "bg-indigo-950/20 border-indigo-500 text-indigo-300"
                              : "bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-400"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Q3 */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-slate-300">3. Something I realized or learned today was...</p>
                    <div className="grid grid-cols-2 gap-2">
                      {["CBT theory", "About others", "New Skill", "God Signs"].map(opt => (
                        <button
                          key={opt}
                          onClick={() => handleMindsetChange("evening", "learned", opt)}
                          className={`py-2 px-3 rounded-lg text-xs font-medium text-left border transition ${
                            currentMindsetReview.eveningAnswers.learned === opt
                              ? "bg-indigo-950/20 border-indigo-500 text-indigo-300"
                              : "bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-400"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Q4 */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-slate-300">4. I could have made today even better if I...</p>
                    <div className="grid grid-cols-2 gap-2">
                      {["Kept my Patience Better", "Better Communication", "Completed My Daily Tasks", "Let Jesus Guide"].map(opt => (
                        <button
                          key={opt}
                          onClick={() => handleMindsetChange("evening", "madeBetter", opt)}
                          className={`py-2 px-3 rounded-lg text-xs font-medium text-left border transition ${
                            currentMindsetReview.eveningAnswers.madeBetter === opt
                              ? "bg-indigo-950/20 border-indigo-500 text-indigo-300"
                              : "bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-400"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Q5 */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-slate-300">5. Something that could have helped me feel more connected...</p>
                    <div className="grid grid-cols-2 gap-2">
                      {["Better Listening", "CBT Progress", "Life To God", "Reached out to someone"].map(opt => (
                        <button
                          key={opt}
                          onClick={() => handleMindsetChange("evening", "connected", opt)}
                          className={`py-2 px-3 rounded-lg text-xs font-medium text-left border transition ${
                            currentMindsetReview.eveningAnswers.connected === opt
                              ? "bg-indigo-950/20 border-indigo-500 text-indigo-300"
                              : "bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-400"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Q6 */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-slate-300">6. If I was my CBT Therapist, I would say...</p>
                    <div className="grid grid-cols-2 gap-2">
                      {["Keep Up the Great Work!", "You Can Re-write ANY Mental Pattern", "Be Patient"].map(opt => (
                        <button
                          key={opt}
                          onClick={() => handleMindsetChange("evening", "therapistSays", opt)}
                          className={`py-2 px-3 rounded-lg text-xs font-medium text-left border transition ${
                            currentMindsetReview.eveningAnswers.therapistSays === opt
                              ? "bg-indigo-950/20 border-indigo-500 text-indigo-300"
                              : "bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-400"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Daily Habits Scorecard Card */}
                <div className={`bg-slate-900/40 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4 transition-all duration-200 ${isLocked ? "pointer-events-none opacity-60" : ""}`}>
                  <div className="flex items-center gap-2 mb-2 border-b border-slate-800 pb-3">
                    <Compass className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-lg font-bold font-display text-white">Daily Habits Scorecard</h3>
                  </div>

                  {["Clarity", "Productivity", "Energy", "Influence", "Necessity", "Courage"].map(habit => {
                    const habitField = habit.toLowerCase() as keyof typeof currentMindsetReview.scorecard;
                    const value = currentMindsetReview.scorecard[habitField];
                    return (
                      <div key={habit} className="space-y-2">
                        <label className="text-xs uppercase font-bold tracking-wider text-slate-400 font-mono">
                          {habit}
                        </label>
                        <div className="flex gap-1.5 bg-slate-950/40 p-1 rounded-xl border border-slate-800">
                          {["Low", "Fair", "Avg", "High", "Peak"].map(lvl => (
                            <button
                              key={lvl}
                              onClick={() => handleMindsetChange("scorecard", habitField as string, lvl)}
                              className={`flex-1 py-2 text-center rounded-lg text-xs font-medium transition ${
                                value === lvl
                                  ? "bg-emerald-600 text-white shadow"
                                  : "text-slate-400 hover:text-white"
                              }`}
                            >
                              {lvl}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>

              {/* Mark Daily Review Complete */}
              <button
                onClick={() => toggleVirtue("Daily Review")}
                disabled={isLocked}
                className={`lg:col-span-2 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                  dayProgress[selectedDate]?.virtues.includes("Daily Review")
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20"
                    : "bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 hover:border-emerald-500/40"
                } ${isLocked ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                {dayProgress[selectedDate]?.virtues.includes("Daily Review") ? (
                  <>
                    <Check className="w-5 h-5 stroke-[3]" />
                    Daily Review Complete
                  </>
                ) : (
                  <>
                    <BookOpen className="w-5 h-5" />
                    Mark Daily Review Complete
                  </>
                )}
              </button>
            </motion.div>
          )}

          {/* TAB 4: HSPU JOURNEY */}
          {activeTab === "hspu" && (
            <motion.div
              key="hspu"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Journey Stats Dashboard */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center flex flex-col justify-center shadow-lg">
                  <span className="text-xs font-bold tracking-widest text-slate-400 uppercase font-mono">
                    Total Sessions
                  </span>
                  <p className="text-3xl md:text-4xl font-display font-extrabold text-white mt-2">
                    {hspuLog.totalSessions}
                  </p>
                  <span className="text-xs text-slate-500 mt-1">Sessions completed</span>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-900/50 to-purple-900/30 border border-indigo-500/30 text-center flex flex-col justify-center shadow-lg relative overflow-hidden">
                  <div className="absolute top-2 right-2 opacity-10">
                    <Flame className="w-20 h-20 text-indigo-400" />
                  </div>
                  <span className="text-xs font-bold tracking-widest text-indigo-300 uppercase font-mono flex items-center justify-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-indigo-400" /> ACTIVE STREAK
                  </span>
                  <p className="text-3xl md:text-4xl font-display font-extrabold text-indigo-200 mt-2">
                    {hspuLog.activeStreak}
                  </p>
                  <span className="text-xs text-indigo-400 mt-1">Consecutive sessions (flexible)</span>
                </div>

                <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center flex flex-col justify-center shadow-lg">
                  <span className="text-xs font-bold tracking-widest text-slate-400 uppercase font-mono">
                    Current Level
                  </span>
                  <p className="text-3xl font-display font-extrabold text-white mt-2">
                    Level 1
                  </p>
                  <span className="text-xs text-slate-500 mt-1">Foundation Phase</span>
                </div>
              </div>

              {/* Milestones Horizontal List */}
              <div className="bg-slate-900/40 rounded-2xl border border-slate-800 p-6 shadow-xl">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 font-mono mb-4 flex items-center gap-2">
                  <Award className="w-4 h-4 text-yellow-500" /> Milestones
                </h3>
                <div className="flex flex-wrap gap-3">
                  {MILESTONES.map(milestone => {
                    const isEarned = hspuLog.totalSessions >= milestone;
                    return (
                      <div
                        key={milestone}
                        className={`w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-xs font-bold font-mono border transition ${
                          isEarned
                            ? "bg-yellow-500/10 border-yellow-500 text-yellow-400 shadow-lg shadow-yellow-950/10"
                            : "bg-slate-900 border-slate-800 text-slate-600"
                        }`}
                        title={`${milestone} Sessions milestone`}
                      >
                        {milestone}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Log Today's Session Block */}
              <div className={`bg-slate-900/40 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4 transition-all duration-200 ${isLocked ? "pointer-events-none opacity-60" : ""}`}>
                <h3 className="text-base font-bold text-white font-display">Log Today's Session</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { title: "Monday Focus", desc: "Strength (Pressing + Core)" },
                    { title: "Wednesday Focus", desc: "Inversion + Skill" },
                    { title: "Friday Focus", desc: "Strength + Negatives" }
                  ].map(item => (
                    <button
                      key={item.title}
                      onClick={() => logHspuSession(item.title)}
                      className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 text-left transition space-y-1 hover:bg-slate-800/20 group"
                    >
                      <h4 className="text-sm font-bold text-white group-hover:text-purple-400 transition">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {item.desc}
                      </p>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 text-center italic">
                  Note: You can only log one session per day. Each session contributes to your total sessions count.
                </p>
              </div>

              {/* 4-Level Progression Grid */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold font-display text-white">4-Level Progression Plan</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {HSPU_LEVELS.map(lvl => (
                    <div
                      key={lvl.id}
                      className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col justify-between space-y-4 relative overflow-hidden"
                    >
                      {lvl.level === 1 && (
                        <div className="absolute top-4 right-4 bg-purple-600 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded-full font-mono">
                          CURRENT
                        </div>
                      )}
                      <div className="space-y-2">
                        <span className="text-2xl font-black font-mono text-slate-700/80 block">
                          0{lvl.level}
                        </span>
                        <h4 className="text-lg font-bold text-white font-display">
                          {lvl.name}
                        </h4>
                        <span className="text-xs text-purple-400 font-semibold font-mono block">
                          {lvl.weeks}
                        </span>
                        <p className="text-xs text-slate-400">
                          {lvl.description}
                        </p>
                      </div>

                      <ul className="space-y-1.5 border-t border-slate-800/80 pt-3">
                        {lvl.exercises.map(ex => (
                          <li key={ex} className="text-xs text-slate-300 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                            {ex}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 5: WHOLE LIFE ASSESSMENT */}
          {activeTab === "life" && (
            <motion.div
              key="life"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Slider assessment screen */}
              <div className={`bg-slate-900/40 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-8 transition-all duration-200 ${isLocked ? "pointer-events-none opacity-60" : ""}`}>
                <div>
                  <h2 className="text-xl font-display font-bold text-white">Whole Life Assessment</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Score each category from 1 (Low Agreement) to 10 (I'm Awesome). Based on the last 30 days of your life.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  
                  {/* Category sliders */}
                  <div className="space-y-4">
                    {[
                      { key: "health", label: "Health" },
                      { key: "mentalEmotional", label: "Mental/Emotional" },
                      { key: "partnerSignificantOther", label: "Partner/Significant Other" },
                      { key: "family", label: "Family" },
                      { key: "friends", label: "Friends" },
                      { key: "mission", label: "Mission" },
                      { key: "experiences", label: "Experiences" },
                      { key: "spirit", label: "Spirit" },
                      { key: "finances", label: "Finances" },
                      { key: "learning", label: "Learning" }
                    ].map(item => {
                      const scoreKey = item.key as keyof WholeLifeScores;
                      const score = wholeLifeScores[scoreKey];
                      return (
                        <div key={item.key} className="space-y-2">
                          <div className="flex justify-between items-center text-sm">
                            <span className="font-semibold text-slate-200">{item.label}</span>
                            <span className="font-mono text-cyan-400 font-bold">{score !== null ? `${score} / 10` : "— / 10"}</span>
                          </div>
                          
                          <div className="flex gap-1 bg-slate-950/40 p-1 rounded-xl border border-slate-800">
                            {Array.from({ length: 10 }).map((_, idx) => {
                              const value = idx + 1;
                              const isSelected = score === value;
                              return (
                                <button
                                  key={value}
                                  onClick={() => {
                                    if (selectedDate !== getEstTodayString()) return;
                                    setWholeLifeScores(prev => ({
                                      ...prev,
                                      [scoreKey]: prev[scoreKey] === value ? null : value
                                    }));
                                  }}
                                  className={`flex-1 py-1 rounded-lg text-xs font-bold font-mono transition-all ${
                                    isSelected
                                      ? "bg-cyan-600 text-white shadow"
                                      : "text-slate-500 hover:text-slate-300"
                                  }`}
                                >
                                  {value}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Reactive Graphic Map */}
                  <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 flex flex-col items-center justify-center space-y-6">
                    <h3 className="text-sm font-semibold font-mono tracking-wider uppercase text-slate-400">Balance Matrix Graphic</h3>
                    
                    <div className="relative w-64 h-64 flex items-center justify-center">
                      <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                        {/* Background guide rings */}
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                        <circle cx="50" cy="50" r="30" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                        <circle cx="50" cy="50" r="15" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                        
                        {/* Radar Polygon drawing */}
                        {(() => {
                          const keys: (keyof WholeLifeScores)[] = [
                            "health", "mentalEmotional", "partnerSignificantOther", "family", "friends",
                            "mission", "experiences", "spirit", "finances", "learning"
                          ];
                          const points = keys.map((key, index) => {
                            const angle = (index * (2 * Math.PI)) / keys.length;
                            const scoreValue = wholeLifeScores[key];
                            const r = ((scoreValue ?? 0) / 10) * 45;
                            const x = 50 + r * Math.cos(angle);
                            const y = 50 + r * Math.sin(angle);
                            return `${x},${y}`;
                          }).join(" ");

                          return (
                            <polygon
                              points={points}
                              fill="rgba(6, 182, 212, 0.15)"
                              stroke="#06b6d4"
                              strokeWidth="1.5"
                            />
                          );
                        })()}
                        
                        {/* Radial center axes */}
                        {Array.from({ length: 10 }).map((_, idx) => {
                          const angle = (idx * (2 * Math.PI)) / 10;
                          const x2 = 50 + 45 * Math.cos(angle);
                          const y2 = 50 + 45 * Math.sin(angle);
                          return (
                            <line
                              key={idx}
                              x1="50"
                              y1="50"
                              x2={x2}
                              y2={y2}
                              stroke="#1e293b"
                              strokeWidth="0.5"
                            />
                          );
                        })}
                      </svg>
                      
                      {/* Central Metrics Overload */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">Average</span>
                        <span className="text-2xl font-bold font-mono text-cyan-400">
                          {(() => {
                            const scores = Object.values(wholeLifeScores).filter((val): val is number => val !== null);
                            if (scores.length === 0) return "—";
                            const sum = scores.reduce((a, b) => a + b, 0);
                            return (sum / scores.length).toFixed(1);
                          })()}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-center text-slate-400 leading-relaxed max-w-sm">
                      The polygon is your soul map. Balance is key — high spikes with deep dips reflect stress and over-extension. Command all fields.
                    </p>
                  </div>

                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 6: STREAKS & MILESTONES */}
          {activeTab === "streaks" && (
            <motion.div
              key="streaks"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* VIRTUE STREAKS */}
              <div className="bg-slate-900/40 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
                <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" /> Virtue Streaks
                </h2>
                
                <div className="space-y-4">
                  {VIRTUES.map(virtue => {
                    const streak = getVirtueStreak(virtue);
                    return (
                      <div key={virtue} className="p-5 rounded-2xl bg-slate-900/30 border border-slate-800/80 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono">
                            {virtue}
                          </h3>
                          <span className="text-sm font-bold font-mono text-amber-400">
                            {streak} <span className="text-xs text-slate-500 font-normal">days</span>
                          </span>
                        </div>

                        {/* Milestones circles */}
                        <div className="flex flex-wrap gap-2">
                          {MILESTONES.map(m => {
                            const active = streak >= m;
                            return (
                              <div
                                key={m}
                                className={`w-8 h-8 rounded-full border text-[10px] font-bold font-mono flex items-center justify-center transition-all ${
                                  active
                                    ? "bg-amber-500/10 border-amber-500 text-amber-400 shadow shadow-amber-950/10"
                                    : "bg-slate-950/40 border-slate-800/80 text-slate-600"
                                }`}
                                title={`Goal of ${m} days`}
                              >
                                {m}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* VICE BREAKING STREAKS */}
              <div className="bg-slate-900/40 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
                <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500 animate-pulse" /> Vice Breaking Streaks
                </h2>

                <div className="space-y-4">
                  {VICES.map(vice => {
                    const streak = getViceStreak(vice);
                    return (
                      <div key={vice} className="p-5 rounded-2xl bg-slate-900/30 border border-slate-800/80 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono">
                            {vice}
                          </h3>
                          <span className="text-sm font-bold font-mono text-orange-400">
                            {streak} <span className="text-xs text-slate-500 font-normal">days</span>
                          </span>
                        </div>

                        {/* Milestones circles */}
                        <div className="flex flex-wrap gap-2">
                          {MILESTONES.map(m => {
                            const active = streak >= m;
                            return (
                              <div
                                key={m}
                                className={`w-8 h-8 rounded-full border text-[10px] font-bold font-mono flex items-center justify-center transition-all ${
                                  active
                                    ? "bg-orange-500/10 border-orange-500 text-orange-400 shadow shadow-orange-950/10"
                                    : "bg-slate-950/40 border-slate-800/80 text-slate-600"
                                }`}
                                title={`Avoidance goal of ${m} days`}
                              >
                                {m}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </motion.div>
          )}

          {/* TAB 7: SETTINGS */}
          {activeTab === "settings" && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* SUCCESS / FEEDBACK NOTIFICATION BANNER */}
              {settingsSuccessMessage && (
                <div className="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-2xl flex items-center justify-between text-emerald-300 text-sm shadow-lg animate-fadeIn">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <span>{settingsSuccessMessage}</span>
                  </div>
                  <button 
                    onClick={() => setSettingsSuccessMessage("")}
                    className="text-emerald-500 hover:text-emerald-300 text-xs font-bold uppercase tracking-wider font-mono px-2.5 py-1 hover:bg-emerald-500/10 rounded-lg transition cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* WORKOUT SCHEDULE EDITOR */}
              <div className="bg-slate-900/40 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-500 to-teal-500" />

                <div className="border-b border-slate-800 pb-4">
                  <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
                    <Dumbbell className="w-5 h-5 text-emerald-400" /> Workout Schedule Editor
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                    Edit your workout days and exercises to match your actual schedule. Changes apply immediately — pick which day applies to today from the Workout tab.
                  </p>
                </div>

                <div className="space-y-5">
                  {customWorkouts.map((wd, dayIdx) => (
                    <div key={dayIdx} className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/60 space-y-4">
                      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                        <input
                          value={wd.dayName}
                          onChange={(e) => updateWorkoutDayField(dayIdx, "dayName", e.target.value)}
                          placeholder="Day name"
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-semibold focus:outline-none focus:border-emerald-500"
                        />
                        <input
                          value={wd.focusTitle}
                          onChange={(e) => updateWorkoutDayField(dayIdx, "focusTitle", e.target.value)}
                          placeholder="Focus (e.g. Chest & Triceps)"
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          onClick={() => removeWorkoutDay(dayIdx)}
                          className="p-2 rounded-lg bg-red-950/30 hover:bg-red-950/50 text-red-400 border border-red-500/20 transition self-start sm:self-auto"
                          title="Delete this day"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-2">
                        {wd.exercises.map((ex, exIdx) => (
                          <div key={ex.id} className="grid grid-cols-12 gap-2 items-center">
                            <input
                              value={ex.name}
                              onChange={(e) => updateExerciseField(dayIdx, exIdx, "name", e.target.value)}
                              placeholder="Exercise name"
                              className="col-span-5 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                            />
                            <input
                              type="number"
                              min={1}
                              value={ex.sets}
                              onChange={(e) => updateExerciseField(dayIdx, exIdx, "sets", e.target.value)}
                              title="Number of sets"
                              className="col-span-2 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white text-center focus:outline-none focus:border-emerald-500"
                            />
                            <input
                              value={ex.reps}
                              onChange={(e) => updateExerciseField(dayIdx, exIdx, "reps", e.target.value)}
                              placeholder="Reps (e.g. 10, 8, 8)"
                              className="col-span-3 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                            />
                            <input
                              type="number"
                              value={ex.defaultWeight}
                              onChange={(e) => updateExerciseField(dayIdx, exIdx, "defaultWeight", Number(e.target.value))}
                              title="Default weight (lbs)"
                              className="col-span-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-emerald-400 text-center focus:outline-none focus:border-emerald-500"
                            />
                            <button
                              onClick={() => removeExerciseFromDay(dayIdx, exIdx)}
                              className="col-span-1 p-1.5 rounded-lg bg-slate-900 hover:bg-red-950/40 text-slate-500 hover:text-red-400 border border-slate-700 hover:border-red-500/30 transition flex items-center justify-center"
                              title="Remove exercise"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => addExerciseToDay(dayIdx)}
                        className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 bg-emerald-500/5 hover:bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 transition"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Exercise
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={addWorkoutDay}
                  className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 hover:border-emerald-500/40 text-sm font-semibold flex items-center justify-center gap-2 transition"
                >
                  <Plus className="w-4 h-4" /> Add Workout Day
                </button>
              </div>

              {/* SOBRIETY DATE - simple, always-editable, saves immediately */}
              <div className="bg-slate-900/40 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-3 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-500 to-teal-500" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
                      <Shield className="w-5 h-5 text-emerald-400" /> Sobriety Date
                    </h2>
                    <p className="text-xs text-slate-400 max-w-2xl">
                      Powers the counter at the top of the app. Saves instantly — change it anytime.
                    </p>
                  </div>
                  <input
                    type="date"
                    value={initialStreaks.sobrietyDate || ""}
                    onChange={e => setInitialStreaks(prev => ({ ...prev, sobrietyDate: e.target.value }))}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 text-center font-mono cursor-pointer"
                  />
                </div>
              </div>

              {/* INITIAL STREAKS SETUP */}
              <div className="bg-slate-900/40 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-500 to-indigo-500" />
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
                      <Sliders className="w-5 h-5 text-blue-400" /> Initial Streaks Setup
                    </h2>
                    <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                      Set up your existing streaks from before you started tracking with this application. This is a one-time setup and will be permanently locked once submitted.
                    </p>
                  </div>

                  {initialStreaks.setupCompleted ? (
                    <button
                      onClick={() => {
                        setShowUnlockConfirm(true);
                        setShowLockConfirm(false);
                      }}
                      className="px-3 py-1 rounded-full text-[10px] font-bold font-mono bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 hover:border-emerald-500/40 uppercase flex items-center gap-1.5 self-start cursor-pointer transition duration-200"
                    >
                      <Lock className="w-3 h-3" /> Locked & Active
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setShowLockConfirm(true);
                        setShowUnlockConfirm(false);
                      }}
                      className="px-3 py-1 rounded-full text-[10px] font-bold font-mono bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 hover:text-yellow-300 border border-yellow-500/20 hover:border-yellow-500/40 uppercase flex items-center gap-1.5 self-start animate-pulse cursor-pointer transition duration-200"
                    >
                      <Unlock className="w-3 h-3" /> Open Setup
                    </button>
                  )}
                </div>

                {/* CUSTOM INLINE UNLOCK CONFIRMATION */}
                {showUnlockConfirm && (
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-yellow-500/30 text-yellow-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
                    <div className="flex items-start gap-2.5">
                      <Unlock className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0 animate-bounce" />
                      <div>
                        <strong className="text-white font-medium block">Unlock Initial Streaks?</strong>
                        This will unlock the editing of your starting counts so you can make updates.
                      </div>
                    </div>
                    <div className="flex gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => setShowUnlockConfirm(false)}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-300 font-medium transition cursor-pointer text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          setInitialStreaks(prev => ({
                            ...prev,
                            setupCompleted: false
                          }));
                          setShowUnlockConfirm(false);
                          setSettingsSuccessMessage("Initial streaks setup unlocked. You can now edit values.");
                          setTimeout(() => setSettingsSuccessMessage(""), 5000);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-yellow-650 hover:bg-yellow-600 text-white font-bold transition cursor-pointer text-xs shadow-md shadow-yellow-900/20"
                      >
                        Confirm Unlock
                      </button>
                    </div>
                  </div>
                )}

                {initialStreaks.setupCompleted && (
                  <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/10 text-emerald-300 text-xs flex items-start gap-3">
                    <Lock className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong className="text-white font-medium block mb-0.5">Initial Streaks Locked</strong>
                      These starting counts have been securely integrated into your active streak calculations. To change these values, you can unlock them above.
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* VIRTUES INITIAL DAYS */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider font-mono border-b border-slate-800/40 pb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" /> Virtues Starting Days
                    </h3>
                    
                    <div className="space-y-3">
                      {VIRTUES.map(v => (
                        <div key={v} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/60 focus-within:border-slate-700/60 transition">
                          <span className="text-xs font-bold text-slate-300 uppercase tracking-wide font-mono">
                            {v}
                          </span>
                          <div className="flex items-center gap-2 max-w-[120px]">
                            <input
                              type="number"
                              min="0"
                              disabled={initialStreaks.setupCompleted}
                              value={initialStreaks.setupCompleted ? (initialStreaks.virtues[v] ?? 0) : (tempInitialVirtues[v] ?? 0)}
                              onChange={e => {
                                const val = Math.max(0, parseInt(e.target.value) || 0);
                                setTempInitialVirtues(prev => ({ ...prev, [v]: val }));
                              }}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 text-center font-mono disabled:opacity-70 disabled:border-slate-850"
                            />
                            <span className="text-[10px] font-bold text-slate-500 font-mono uppercase">Days</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* VICES INITIAL DAYS */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider font-mono border-b border-slate-800/40 pb-2 flex items-center gap-2">
                      <Flame className="w-4 h-4 text-orange-400" /> Vices Avoided Days
                    </h3>
                    
                    <div className="space-y-3">
                      {VICES.map(v => (
                        <div key={v} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/60 focus-within:border-slate-700/60 transition">
                          <span className="text-xs font-bold text-slate-300 uppercase tracking-wide font-mono">
                            {v}
                          </span>
                          <div className="flex items-center gap-2 max-w-[120px]">
                            <input
                              type="number"
                              min="0"
                              disabled={initialStreaks.setupCompleted}
                              value={initialStreaks.setupCompleted ? (initialStreaks.vices[v] ?? 0) : (tempInitialVices[v] ?? 0)}
                              onChange={e => {
                                const val = Math.max(0, parseInt(e.target.value) || 0);
                                setTempInitialVices(prev => ({ ...prev, [v]: val }));
                              }}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 text-center font-mono disabled:opacity-70 disabled:border-slate-850"
                            />
                            <span className="text-[10px] font-bold text-slate-500 font-mono uppercase">Days</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {!initialStreaks.setupCompleted && (
                  <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-950/20 -mx-6 -mb-6 p-6">
                    {showLockConfirm ? (
                      <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-950/20 border border-blue-500/20 p-4 rounded-xl animate-fadeIn">
                        <div className="flex items-start gap-2.5">
                          <Lock className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0 animate-pulse" />
                          <div>
                            <strong className="text-white font-medium block text-xs animate-pulse">Lock Initial Streaks?</strong>
                            <span className="text-[11px] text-blue-300">Are you sure you want to save and lock these initial starting streaks?</span>
                          </div>
                        </div>
                        <div className="flex gap-2 self-end sm:self-auto">
                          <button
                            onClick={() => setShowLockConfirm(false)}
                            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-300 font-medium transition cursor-pointer text-xs"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              setInitialStreaks(prev => ({
                                ...prev,
                                virtues: tempInitialVirtues,
                                vices: tempInitialVices,
                                setupCompleted: true
                              }));
                              setShowLockConfirm(false);
                              setSettingsSuccessMessage("Initial streaks setup locked and active!");
                              setTimeout(() => setSettingsSuccessMessage(""), 5000);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition cursor-pointer text-xs shadow-md shadow-blue-900/20"
                          >
                            Confirm Save & Lock
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-amber-400/85 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                          Warning: These values will be permanently locked after saving.
                        </p>
                        <button
                          onClick={() => {
                            setShowLockConfirm(true);
                            setShowUnlockConfirm(false);
                          }}
                          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white transition-all shadow-lg shadow-blue-900/15 flex items-center gap-2 self-stretch sm:self-auto cursor-pointer"
                        >
                          <Lock className="w-4 h-4" /> Save & Lock Initial Streaks
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* DANGER ZONE / ERASE DATA */}
              <div className="bg-slate-950/20 rounded-2xl border border-red-950/30 p-6 shadow-xl space-y-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-red-600/60" />
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="space-y-1">
                    <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
                      <AlertOctagon className="w-5 h-5 text-red-500" /> Danger Zone
                    </h2>
                    <p className="text-xs text-slate-400 max-w-xl">
                      Permanently wipe all application state, including custom exercise weights, daily logs, scores, and initial streaks setup. This action is completely irreversible.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setEraseStep(1);
                      setEraseConfirmText("");
                      setShowEraseModal(true);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 hover:border-red-500 transition-all font-semibold text-sm flex items-center justify-center gap-2 whitespace-nowrap self-stretch sm:self-auto cursor-pointer shadow"
                  >
                    <Trash2 className="w-4 h-4" /> Erase All Application Data
                  </button>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

      </main>

      {/* --- SINGLE EXERCISE WEIGHT MODAL --- */}
      <AnimatePresence>
        {selectedExerciseForWeight && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
              
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-slate-800/60 flex items-center justify-between bg-slate-950/20">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <Dumbbell className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-display text-white">Adjust Weight</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 max-w-[240px] truncate">{selectedExerciseForWeight.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedExerciseForWeight(null)}
                  className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                <div className="space-y-2 p-5 rounded-2xl bg-slate-950/40 border border-slate-800/80">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Current Target</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-800 text-slate-300">
                      {selectedExerciseForWeight.sets} Sets × {selectedExerciseForWeight.reps}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={singleWeightValue}
                      onChange={e => setSingleWeightValue(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-lg text-white font-bold font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-center"
                      placeholder="0"
                      autoFocus
                    />
                    <span className="text-sm font-bold text-slate-400 font-mono">LBS</span>
                  </div>
                </div>

                {/* Quick adjustments */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Quick Modifiers</span>
                  <div className="grid grid-cols-4 gap-2">
                    {[-10, -5, 5, 10].map(amt => (
                      <button
                        key={amt}
                        onClick={() => {
                          const currentVal = parseFloat(singleWeightValue) || 0;
                          setSingleWeightValue(String(Math.max(0, currentVal + amt)));
                        }}
                        className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 font-mono font-bold text-xs transition cursor-pointer"
                      >
                        {amt > 0 ? `+${amt}` : amt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-800/60 bg-slate-950/20 flex gap-3">
                <button
                  onClick={() => setSelectedExerciseForWeight(null)}
                  className="flex-grow py-3 rounded-xl border border-slate-800 hover:bg-slate-850 text-slate-300 text-sm font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={saveSingleWeight}
                  className="flex-grow py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20 cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  Save Weight
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- ADJUST WEIGHTS MODAL --- */}
      <AnimatePresence>
        {showAdjustWeights && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/20">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-lg font-bold font-display text-white">Adjust Weights</h3>
                </div>
                <button
                  onClick={() => setShowAdjustWeights(false)}
                  className="p-1 rounded-full hover:bg-slate-800 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                <p className="text-xs text-slate-400 italic">
                  Update the persistent weights for exercises in today's routine.
                </p>

                {customWorkouts[workoutDayIndex].exercises.map(ex => (
                  <div key={ex.id} className="space-y-1.5 p-4 rounded-xl bg-slate-900/30 border border-slate-800/60">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                      {ex.name}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={tempWeights[ex.id] ?? ""}
                        onChange={e => setTempWeights(prev => ({ ...prev, [ex.id]: e.target.value }))}
                        className="flex-1 bg-slate-950 border border-slate-800/80 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                      />
                      <span className="text-xs text-slate-500 font-mono font-bold uppercase">LBS</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-800/80 bg-slate-950/20 flex gap-3">
                <button
                  onClick={() => setShowAdjustWeights(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800/40 text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={saveWeights}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold text-white transition flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- ERASE ALL DATA CUSTOM MODAL --- */}
      <AnimatePresence>
        {showEraseModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-red-500/30 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative"
            >
              <div className="absolute top-0 left-0 w-full h-[3px] bg-red-600" />
              
              {eraseStep === 1 ? (
                /* STEP 1: WARNING SCREEN */
                <div>
                  <div className="p-6 border-b border-slate-800/60 bg-slate-950/20 flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500">
                      <AlertOctagon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold font-display text-white">Erase All Data?</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">Step 1 of 2: Confirm Intent</p>
                    </div>
                  </div>

                  <div className="p-6 space-y-4 text-sm text-slate-300">
                    <p>
                      You are about to completely wipe all stored progress and settings within this application.
                    </p>
                    <div className="p-4 rounded-xl bg-red-950/15 border border-red-500/15 space-y-2">
                      <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider font-mono">
                        The following will be deleted:
                      </h4>
                      <ul className="list-disc list-inside text-xs text-slate-400 space-y-1">
                        <li>Entire habits logging history (Virtues & Vices)</li>
                        <li>HSPU progress tracker and completed sessions</li>
                        <li>Mindset reviews & Daily stoic logs</li>
                        <li>Whole Life scores and 10-week workout configurations</li>
                        <li>Initial streak counts and setups</li>
                      </ul>
                    </div>
                  </div>

                  <div className="p-6 border-t border-slate-800/60 bg-slate-950/20 flex gap-3">
                    <button
                      onClick={() => setShowEraseModal(false)}
                      className="flex-1 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-850 text-slate-300 text-xs font-semibold transition cursor-pointer"
                    >
                      Keep My Data
                    </button>
                    <button
                      onClick={() => setEraseStep(2)}
                      className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-550 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-red-950/20"
                    >
                      I Understand, Proceed
                    </button>
                  </div>
                </div>
              ) : (
                /* STEP 2: TYPED CONFIRMATION */
                <div>
                  <div className="p-6 border-b border-slate-800/60 bg-slate-950/20 flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 animate-pulse">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold font-display text-white">Final Confirmation</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">Step 2 of 2: Verification Required</p>
                    </div>
                  </div>

                  <div className="p-6 space-y-4 text-sm text-slate-300">
                    <p className="text-xs text-slate-400">
                      This action is final. Once you submit, your local storage cache will be cleared immediately and cannot be recovered.
                    </p>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                        Type <span className="text-red-400 font-bold font-mono">ERASE</span> below to confirm:
                      </label>
                      <input
                        type="text"
                        value={eraseConfirmText}
                        onChange={e => setEraseConfirmText(e.target.value)}
                        placeholder="ERASE"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500 font-mono text-center tracking-widest placeholder:tracking-normal font-bold"
                      />
                    </div>
                  </div>

                  <div className="p-6 border-t border-slate-800/60 bg-slate-950/20 flex gap-3">
                    <button
                      onClick={() => {
                        setShowEraseModal(false);
                        setEraseStep(1);
                        setEraseConfirmText("");
                      }}
                      className="flex-1 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-850 text-slate-300 text-xs font-semibold transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={executeEraseAllData}
                      disabled={eraseConfirmText !== "ERASE"}
                      className="flex-1 py-2.5 rounded-xl bg-red-650 hover:bg-red-600 disabled:bg-slate-800 border disabled:border-slate-800 border-red-500/20 text-white disabled:text-slate-500 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed shadow-lg"
                    >
                      <Trash2 className="w-4 h-4" /> Erase All Data
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- BOTTOM STATUS FOOTER --- */}
      <footer className="h-10 bg-slate-900 px-4 md:px-8 flex items-center justify-between border-t border-slate-800 text-[10px] font-bold text-slate-500 tracking-widest uppercase mt-auto sticky bottom-0 z-30">
        <div className="flex gap-6">
          <span>Session: Active</span>
          <span>Cloud: Synced</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> System Ready
        </div>
      </footer>

    </div>
  );
}
