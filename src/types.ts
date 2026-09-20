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
  caloriesBurned?: number;
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
  injuries?: string[];
  avoidExercises?: string[];
  foodRestrictions?: string[];
  focusAreas?: string[];
  trainerNotes?: string;
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

export type CoachResponseType =
  | "chat"
  | "workout"
  | "workout_reminder"
  | "nutrition"
  | "recovery"
  | "daily_summary"
  | "adapted_plan"
  | "new_program"
  | "meal_recorded"
  | "penalty_notice"
  | "profile_update";

export type CoachActionType =
  | "start_workout"
  | "snooze"
  | "cannot_do"
  | "view_plan"
  | "log_food"
  | "apply_program"
  | "clear_penalty"
  | "confirm"
  | "edit";

export interface CoachAction {
  id: string;
  label: string;
  actionType: CoachActionType;
  style?: "primary" | "secondary" | "danger";
}

export interface CoachResponseExercise {
  name: string;
  nameTh?: string;
  sets?: number;
  reps?: string;
  restSeconds?: number;
  suggestedWeight?: string;
  note?: string;
}

export interface CoachResponseData {
  title?: string;
  titleTh?: string;
  summary?: string;
  durationMinutes?: number;
  intensity?: string;
  focus?: string;
  tags?: string[];
  exercises?: CoachResponseExercise[];
  reason?: string;
  reminderDate?: string;
  reminderTime?: string;
  calories?: number;
  proteinGrams?: number;
  carbsGrams?: number;
  fatGrams?: number;
  menu?: string;
  portion?: string;
  mealId?: string;
  mealType?: "breakfast" | "lunch" | "dinner" | "snack";
  source?: "text" | "photo";
  confidenceLevel?: "high" | "medium" | "low";
  remainingCalories?: number;
  todayTotalCalories?: number;
  targetCalories?: number;
  isOverTarget?: boolean;
  sleepHours?: number;
  recoveryScore?: number;
  confidence?: number;
}

/**
 * Canonical AI output for FitCoach Phase 1.
 * The AI returns this structure first; UI/LINE renderers consume it later.
 */
export interface CoachResponse {
  message: string;
  type: CoachResponseType;
  data?: CoachResponseData;
  actions?: CoachAction[];
}

export interface ChatMessage {
  id: string;
  sender: "user" | "bot" | "coach" | "system";
  text: string;
  timestamp: string;
  image?: string;
  quickReplies?: string[];
  /** Structured coach payload used by the Phase 2 UI renderer. */
  coachResponse?: CoachResponse;
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
export type PlanDayStatus = "pending" | "done" | "missed" | "rest" | "planned" | "skipped" | "moved";

export interface PlanExercise {
  name: string;
  nameTh?: string;
  sets: number;
  reps: string;
  restSeconds?: number;
  suggestedWeight?: string;
  note?: string;
}

export interface PlanDayNutritionTarget {
  calories: number; // kcal
  protein: number;  // g
  carbs: number;    // g
  fat: number;      // g
}

export interface PlanDay {
  date: string; // YYYY-MM-DD (เวลาไทย)
  type?: "workout" | "rest";
  title: string;
  focus?: string;
  isRestDay?: boolean;
  durationMinutes?: number;
  exercises: PlanExercise[];
  nutritionTarget?: PlanDayNutritionTarget;
  status: PlanDayStatus; // "pending" (วันซ้อม) หรือ "rest" (วันพัก) หรือ "done" / "missed"
  coachNote?: string;
  completedAt?: string;
}

export interface PlanPhase {
  name: string;
  weeks: number;
  focus: string;
}

export type CoachPlanStatus = "active" | "completed" | "replaced";

export interface CoachPlanNutritionTarget {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  restDayCalories?: number;
  restDayProtein?: number;
  restDayCarbs?: number;
  restDayFat?: number;
  restDay?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface CoachPlan {
  id: string;
  title: string;
  goal: string;
  startDate: string;
  endDate: string;
  status: CoachPlanStatus; // "active" | "completed" | "replaced"
  durationWeeks?: number;
  daysPerWeek?: number;
  phases: PlanPhase[];
  dailyNutritionTarget?: CoachPlanNutritionTarget;
  days: PlanDay[]; // ตารางรายวันตลอดโปรแกรม
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

// ===== Coach Intake System (ระบบ Intake ก่อนสร้างโปรแกรม) =====
export interface CoachIntakeAnswers {
  // 1. เป้าหมาย (รายละเอียดที่ผู้ใช้ต้องการ เช่น ลดพุง 1 เดือน, เฟิร์มกระชับ)
  goalDetails?: string;
  // 2. อาชีพ / ลักษณะงาน (นั่งโต๊ะ ยืนทั้งวัน ใช้แรง)
  occupation?: string;
  // 3. เวลาเลิกงาน (เช่น 17:30, 18:00)
  workEndTime?: string;
  // 4. สถานที่ซ้อมหลัก: บ้าน / ยิม / สลับ
  workoutLocation?: string;
  // 5. อุปกรณ์ที่มี (ถ้าซ้อมที่บ้านหรือสลับ)
  equipment?: string[];
  // 6. เวลาว่างต่อวัน และเวลาที่สะดวกซ้อม (เช้า/เย็น/ดึก)
  availableTimePerDay?: string;
  preferredWorkoutTime?: string;
  // 7. จำนวนวันที่ซ้อมได้ต่อสัปดาห์
  daysPerWeek?: number;
  // 8. ระยะเวลาโปรแกรมที่ผู้ใช้ต้องการ (เช่น 1 สัปดาห์, 2 เดือน, 3-4 เดือน หรือโค้ชประเมินให้)
  programDuration?: string;
  // 9. ประสบการณ์ซ้อมที่ผ่านมา (มือใหม่ / เคยซ้อม / ซ้อมประจำ)
  experienceLevel?: string;
  // 10. อาการบาดเจ็บหรือข้อจำกัดของร่างกายที่ต้องระวัง (ผู้ใช้ข้ามได้)
  injuriesOrLimitations?: string;
  // 11. ข้อจำกัดเรื่องอาหาร (แพ้อาหาร ไม่กินอะไร ผู้ใช้ข้ามได้)
  dietaryRestrictions?: string;
}

export type IntakeQuestionKey =
  | "goalDetails"
  | "occupation"
  | "workEndTime"
  | "workoutLocation"
  | "equipment"
  | "availableTimePerDay"
  | "preferredWorkoutTime"
  | "daysPerWeek"
  | "programDuration"
  | "experienceLevel"
  | "injuriesOrLimitations"
  | "dietaryRestrictions";

export interface CoachIntake {
  status: "idle" | "in_progress" | "pending_confirmation" | "completed";
  intakeComplete: boolean;
  isUrgentPlan?: boolean;
  answers: CoachIntakeAnswers;
  answeredQuestions: string[];
  pendingQuestions: string[];
  summaryText?: string;
  confirmedAt?: string;
  updatedAt: string;
}

// ---------- Daily Nutrition & Food Logging ----------
export interface FoodLogItem {
  id: string;
  time: string; // "HH:MM" e.g. "12:30"
  date: string; // "YYYY-MM-DD"
  menu: string; // ชื่อเมนู
  portion?: string; // ปริมาณโดยประมาณ เช่น "1 จาน"
  calories: number; // kcal ปัดเลขกลมๆ
  protein: number; // g ปัดเลขกลมๆ
  carbs: number; // g ปัดเลขกลมๆ
  fat: number; // g ปัดเลขกลมๆ
  source: "text" | "photo";
  confidence: "high" | "medium" | "low";
  meal: "breakfast" | "lunch" | "dinner" | "snack";
  note?: string;
  createdAt: string;
}

export interface DailyFoodLog {
  date: string; // "YYYY-MM-DD"
  items: FoodLogItem[];
  photoAnalysisCount?: number;
}

export interface PendingMealLog {
  id: string;
  date: string;
  time: string;
  menu: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source: "text" | "photo";
  confidence: "high" | "medium" | "low";
  meal: "breakfast" | "lunch" | "dinner" | "snack";
  note?: string;
  createdAt: string;
}

export interface DailyNutritionSummary {
  date: string;
  hasActivePlan: boolean;
  todayTotal: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  target?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  remaining?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  remainingCalories?: number;
  remainingPercent?: number;
  isOver?: boolean;
  overCalories?: number;
  items: FoodLogItem[];
  pendingMeal?: PendingMealLog | null;
}

