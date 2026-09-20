export interface Exercise {
  id: string;
  name: string;
  nameTh?: string;
  sets: number;
  reps: string | number;
  suggestedWeight?: string;
  actualWeight?: string;
  actualReps?: string;
  restSeconds: number;
  completed?: boolean;
  notes?: string;
  image?: string;
  category?: "chest" | "back" | "shoulders" | "arms" | "legs" | "core" | "mobility" | string;
  instructions?: string;
  tips?: string;
  videoUrl?: string;
  targetMuscle?: string;
}

export interface WorkoutPlan {
  id: string;
  title?: string;
  titleTh?: string;
  dayName?: string;
  focusArea?: string;
  durationMinutes: number;
  intensity: string;
  split?: string;
  exercises: Exercise[];
  isCompleted?: boolean;
  isAdapted?: boolean;
  adaptationReason?: string;
  coachNote?: string;
  rpe?: number;
  feeling?: "easy" | "good" | "challenging" | "hard" | "pain";
}

export interface MealItem {
  id: string;
  name: string;
  portion?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  time: string;
  isEstimate?: boolean;
  tip?: string;
  type?: "breakfast" | "lunch" | "dinner" | "snack";
}

export interface NutritionData {
  targetCalories: number;
  currentCalories: number;
  targetProtein: number;
  currentProtein: number;
  targetCarbs: number;
  currentCarbs: number;
  targetFat: number;
  currentFat: number;
  meals: MealItem[];
}

export interface RecoveryData {
  sleepHours: number;
  sleepMinutes: number;
  targetSleepHours?: string;
  quality: string;
  score?: number;
  sleepStart?: string;
  sleepEnd?: string;
  fatigueLevel?: "ต่ำ" | "ปานกลาง" | "สูง" | string;
  muscleSoreness?: "ไม่มี" | "เล็กน้อย" | "ปานกลาง" | "ระบมมาก" | string;
  restingHeartRate?: number;
  coachInsight?: string;
  isFromGoogleHealth?: boolean;
  lastSyncedAt?: string;
  deepSleepPercent?: number;
}

export interface ActivityData {
  currentSteps: number;
  targetSteps: number;
  activeMinutes: number;
  distanceKm: number;
  caloriesExpended?: number;
  isFromGoogleHealth?: boolean;
  lastSyncedAt?: string;
}

export interface FitnessStatus {
  level: number;
  xp: number;
  nextLevelXp: number;
  rank: "S" | "A" | "B" | "C" | "D" | string;
  strength: number;    // STR
  endurance: number;   // END
  mobility: number;    // MOB
  vitality: number;    // VIT
  recovery: number;    // REC
  condition: number;   // 76% (Readiness)
  conditionLabel: string;
  trainingMomentum: number; // 88%
  momentumDays: number;     // 8 days streak
  programAdherence: number; // 93%
  disciplineScore?: number; // 0 - 100%
  streakDays?: number;
}

export interface UserProfile {
  name: string;
  goal: string;
  customGoalText?: string;
  primaryGoal?: string;
  age: number;
  sex: "Male" | "Female" | "Other" | string;
  gender?: "male" | "female" | "other" | string;
  height: number;
  heightCm?: number;
  weight: number;
  weightKg?: number;
  waistCm?: number;
  fitnessLevel: string;
  experience: string;
  daysPerWeek: number;
  durationMinutes: number;
  preferredTime: string;
  preferredLocation?: string;
  environment?: "Gym" | "Home" | "Outdoor" | "Mixed" | string;
  equipment?: string[];
  activityLevel?: "Sedentary" | "Light" | "Moderate" | "Very Active" | string;
  sleepHoursTypical?: number;
  sleepQualityTypical?: string;
  dietStyle?: string;
  allergies?: string[];
  dislikedFoods?: string[];
  mealsPerDay?: number;
  limitations?: string[];
  targetDurationMonths?: number;
  lineConnected?: boolean;
  lineNotificationTime?: string;
  hasInjuries?: boolean;
  injuryDetails?: string;
  sleepHoursGoal?: number;
  dailyWaterGoalLiters?: number;
}

export interface Plan3MonthsData {
  goalName: string;
  totalDuration: string;
  totalMonths?: number;
  phases: Array<{
    month: number;
    title: string;
    focus: string;
    calories: string;
    protein: string;
  }>;
  weeklySchedule: Array<{
    day: string;
    activity: string;
    type: "workout" | "cardio" | "rest";
  }>;
  dailyMeals: Array<{
    meal: string;
    time: string;
    menu: string;
    protein: string;
    calories: string;
  }>;
  recoveryRules: string[];
}

export interface CoachAccountabilityState {
  scheduledTime: string; // e.g. "18:00"
  status: "on_track" | "approaching" | "workout_time" | "overdue" | "missed_penalty";
  strikes: number; // 0-3
  penaltyActive: boolean;
  penaltyTask?: string;
  lastReminderType?: "morning" | "pre_workout" | "workout_time" | "late_warning" | "penalty" | "meal_checkin";
  lastReminderText?: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "bot" | "coach" | "system";
  text: string;
  timestamp: string;
  image?: string;
  quickReplies?: string[];
}

export interface LineMessage {
  id: string;
  sender: "coach" | "user";
  text: string;
  timestamp: string;
  recordedMeal?: MealItem;
  card?: {
    type: "workout_reminder" | "daily_summary" | "adapted_plan" | "nutrition_prompt" | "new_program" | "meal_recorded" | "penalty_notice";
    title: string;
    details: string;
    duration?: string;
    tags?: string[];
    workoutPlan?: WorkoutPlan;
    plan3Months?: Plan3MonthsData;
    penaltyTask?: string;
    actions?: Array<{
      id: string;
      label: string;
      actionType: "start_workout" | "snooze" | "cannot_do" | "view_plan" | "log_food" | "apply_program" | "clear_penalty";
      style?: "primary" | "secondary" | "danger";
    }>;
  };
  quickReplies?: string[];
}

export interface WeeklyReportData {
  dateRange: string;
  workoutsCompleted: number;
  workoutsTarget: number;
  nutritionAdherencePercent: number;
  recoveryAverageScore: number;
  strengthDeltaPercent: number;
  weightDeltaKg: number;
  consistencyPercent: number;
  wins: string[];
  improvements: string[];
  coachSummary: string;
}

export interface WeeklyReport {
  weekRange: string;
  consistencyScore: number;
  workoutsCompleted: number;
  workoutsTarget: number;
  xpGained: number;
  totalCaloriesBurned: number;
  highlights: string[];
  coachFeedback: string;
}

export interface OnboardingForm {
  name: string;
  gender: "male" | "female" | "other";
  age: number;
  heightCm: number;
  weightKg: number;
  primaryGoal: string;
  fitnessLevel: string;
  daysPerWeek: number;
  preferredLocation: string;
  preferredTime: string;
  hasInjuries: boolean;
  injuryDetails: string;
  sleepHoursGoal: number;
  dailyWaterGoalLiters: number;
}

export interface GoogleHealthSyncState {
  isConnected: boolean;
  lastSyncTime?: string;
  isSyncing: boolean;
  userEmail?: string;
  error?: string | null;
  scopesGranted?: string[];
  rawSteps?: number;
  rawDistanceKm?: number;
  rawActiveMinutes?: number;
  rawCaloriesExpended?: number;
  rawSleepHours?: number;
  rawSleepMinutes?: number;
  rawSleepStart?: string;
  rawSleepEnd?: string;
}
