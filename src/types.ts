export interface Exercise {
  id: string;
  name: string;
  nameTh?: string;
  sets: number;
  reps: string;
  suggestedWeight: string;
  actualWeight?: string;
  actualReps?: string;
  restSeconds: number;
  completed?: boolean;
  notes?: string;
  image?: string;
  category?: "chest" | "back" | "shoulders" | "arms" | "legs" | "core" | "mobility";
}

export interface WorkoutPlan {
  id: string;
  title: string;
  titleTh: string;
  durationMinutes: number;
  intensity: "เบา" | "ปานกลาง" | "หนัก" | "ฟื้นฟู";
  split: string;
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
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  time: string;
  isEstimate?: boolean;
  tip?: string;
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
  targetSleepHours: string;
  quality: "ยอดเยี่ยม" | "ดี" | "ปานกลาง" | "ต้องปรับปรุง";
  score: number; // 0 - 100
  sleepStart: string;
  sleepEnd: string;
  fatigueLevel: "ต่ำ" | "ปานกลาง" | "สูง";
  muscleSoreness: "ไม่มี" | "เล็กน้อย" | "ปานกลาง" | "มาก";
  restingHeartRate: number;
  coachInsight: string;
}

export interface ActivityData {
  currentSteps: number;
  targetSteps: number;
  activeMinutes: number;
  distanceKm: number;
}

export interface FitnessStatus {
  level: number;
  xp: number;
  nextLevelXp: number;
  rank: "S" | "A" | "B" | "C" | "D";
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
}

export interface UserProfile {
  name: string;
  goal: string;
  customGoalText?: string;
  age: number;
  sex: "Male" | "Female" | "Other";
  height: number;
  weight: number;
  waistCm?: number;
  fitnessLevel: "Beginner" | "Intermediate" | "Advanced";
  experience: string;
  daysPerWeek: number;
  durationMinutes: number;
  preferredTime: "เช้า" | "บ่าย" | "เย็น" | "ค่ำ";
  environment: "Gym" | "Home" | "Outdoor" | "Mixed";
  equipment: string[];
  activityLevel: "Sedentary" | "Light" | "Moderate" | "Very Active";
  sleepHoursTypical: number;
  sleepQualityTypical: string;
  dietStyle: string;
  allergies: string[];
  dislikedFoods: string[];
  mealsPerDay: number;
  limitations: string[];
  targetDurationMonths?: number;
  lineConnected: boolean;
  lineNotificationTime: string;
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
