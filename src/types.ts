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

export interface WorkoutDay {
  id: string;
  dayName: string;
  focus: string;
  estimatedDurationMinutes?: number;
  estimatedCalories?: number;
  isCompleted?: boolean;
  isRestDay?: boolean;
  exercises: Exercise[];
}

export type ExerciseItem = Exercise;

export interface WorkoutPlan {
  id: string;
  title?: string;
  titleTh?: string;
  name?: string;
  currentWeek?: number;
  totalWeeks?: number;
  dayName?: string;
  focusArea?: string;
  durationMinutes: number;
  intensity: string;
  split?: string;
  exercises: Exercise[];
  days?: WorkoutDay[];
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
  readinessScore?: number;
  sleepQualityScore?: number;
  rpeScore?: number;
  steps?: number;
  hrvMs?: number;
  sleepStart?: string;
  sleepEnd?: string;
  fatigueLevel?: " " | " " | " " | string;
  muscleSoreness?: " " | " " | " " | " " | string;
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
  currentLevel?: number;
  currentExp?: number;
  nextLevelExp?: number;
  totalWorkoutsCompleted?: number;
  totalCaloriesBurned?: number;
  rankTitle?: string;
  badges?: any[];
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
  pictureUrl?: string;
  userId?: string;
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


// ===== Coach Plan (โปรแกรมที่โค้ช AI สร้าง/ปรับ และใช้ทำเช็คลิสต์-ปฏิทิน) =====
export type PlanDayStatus = "planned" | "done" | "skipped" | "moved";

export interface PlanExercise {
  name: string;
  nameTh?: string;
  sets: number;
  reps: string;
  restSeconds?: number;
  suggestedWeight?: string;
  note?: string;
}

export interface PlanDay {
  date: string; // YYYY-MM-DD (เวลาไทย)
  title: string;
  focus?: string;
  isRestDay?: boolean;
  durationMinutes?: number;
  exercises: PlanExercise[];
  status: PlanDayStatus;
  coachNote?: string;
  completedAt?: string;
}

export interface PlanPhase {
  name: string;
  weeks: number;
  focus: string;
}

export interface CoachPlan {
  id: string;
  title: string;
  goal: string;
  startDate: string;
  endDate: string;
  phases: PlanPhase[];
  days: PlanDay[]; // ลงรายละเอียดเฉพาะช่วงที่ใกล้ถึง (rolling)
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutLog {
  id: string;
  date: string;
  completed: boolean;
  rpe?: number; // 1-10
  feeling?: string;
  notes?: string;
  exercises?: { name: string; weight?: string; reps?: string }[];
  createdAt: string;
}

// ข้อมูลที่โค้ชถามผ่านแชท (ซักประวัติ)
export interface CoachProfileExtra {
  occupation?: string;
  workEndTime?: string;
  preferredWorkoutTime?: string;
  notes?: string;
}
