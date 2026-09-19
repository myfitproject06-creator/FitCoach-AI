import {
  UserProfile,
  WorkoutPlan,
  NutritionData,
  RecoveryData,
  ActivityData,
  FitnessStatus,
  WeeklyReportData,
  LineMessage,
  CoachAccountabilityState,
} from "../types";

export const initialProfile: UserProfile = {
  name: "",
  goal: "",
  customGoalText: "",
  primaryGoal: "",
  age: 0,
  sex: "",
  gender: "male",
  height: 0,
  heightCm: 0,
  weight: 0,
  weightKg: 0,
  waistCm: 0,
  fitnessLevel: "",
  experience: "",
  daysPerWeek: 0,
  durationMinutes: 0,
  preferredTime: "",
  preferredLocation: "",
  environment: "",
  equipment: [],
  activityLevel: "",
  sleepHoursTypical: 0,
  sleepQualityTypical: "",
  dietStyle: "",
  allergies: [],
  dislikedFoods: [],
  mealsPerDay: 0,
  limitations: [],
  targetDurationMonths: 0,
  lineConnected: false,
  lineNotificationTime: "18:00",
  hasInjuries: false,
  injuryDetails: "",
  sleepHoursGoal: 0,
  dailyWaterGoalLiters: 0,
};

export const initialTodayWorkout: WorkoutPlan = {
  id: "w-today",
  title: "",
  titleTh: "",
  durationMinutes: 0,
  intensity: "-",
  split: "",
  isCompleted: false,
  isAdapted: false,
  coachNote: "",
  exercises: [],
};

export const initialNutrition: NutritionData = {
  targetCalories: 0,
  currentCalories: 0,
  targetProtein: 0,
  currentProtein: 0,
  targetCarbs: 0,
  currentCarbs: 0,
  targetFat: 0,
  currentFat: 0,
  meals: [],
};

export const initialRecovery: RecoveryData = {
  sleepHours: 0,
  sleepMinutes: 0,
  targetSleepHours: "-",
  quality: "",
  score: 0,
  sleepStart: "",
  sleepEnd: "",
  fatigueLevel: "-",
  muscleSoreness: "-",
  restingHeartRate: 0,
  coachInsight: "",
  isFromGoogleHealth: false,
  lastSyncedAt: "",
  deepSleepPercent: 0,
};

export const initialActivity: ActivityData = {
  currentSteps: 0,
  targetSteps: 0,
  activeMinutes: 0,
  distanceKm: 0,
  caloriesExpended: 0,
  isFromGoogleHealth: false,
  lastSyncedAt: "",
};

export const initialFitnessStatus: FitnessStatus = {
  level: 1,
  xp: 0,
  nextLevelXp: 100,
  rank: "-",
  strength: 0,
  endurance: 0,
  mobility: 0,
  vitality: 0,
  recovery: 0,
  condition: 0,
  conditionLabel: "ยังไม่มีข้อมูล",
  trainingMomentum: 0,
  momentumDays: 0,
  programAdherence: 0,
  disciplineScore: 0,
  streakDays: 0,
};

export const initialWeeklyReport: WeeklyReportData = {
  dateRange: "",
  workoutsCompleted: 0,
  workoutsTarget: 0,
  nutritionAdherencePercent: 0,
  recoveryAverageScore: 0,
  strengthDeltaPercent: 0,
  weightDeltaKg: 0,
  consistencyPercent: 0,
  wins: [],
  improvements: [],
  coachSummary: "",
};

export const initialLineMessages: LineMessage[] = [];

export const initialAccountability: CoachAccountabilityState = {
  scheduledTime: "18:00",
  status: "on_track",
  strikes: 0,
  penaltyActive: false,
  lastReminderType: undefined,
  lastReminderText: "",
};

export const weeklyScheduleDays = [
  { day: "MON", label: "จันทร์", title: "", duration: "-", completed: false, isToday: false, type: "rest" as const },
  { day: "TUE", label: "อังคาร", title: "", duration: "-", completed: false, isToday: false, type: "rest" as const },
  { day: "WED", label: "พุธ", title: "", duration: "-", completed: false, isToday: false, type: "rest" as const },
  { day: "THU", label: "พฤหัส", title: "", duration: "-", completed: false, isToday: false, type: "rest" as const },
  { day: "FRI", label: "ศุกร์", title: "", duration: "-", completed: false, isToday: false, type: "rest" as const },
  { day: "SAT", label: "เสาร์", title: "", duration: "-", completed: false, isToday: false, type: "rest" as const },
  { day: "SUN", label: "อาทิตย์", title: "", duration: "-", completed: false, isToday: false, type: "rest" as const },
];
