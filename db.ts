// db.ts - Firebase Firestore / Local Storage  
import fs from "fs";
import path from "path";
import { initializeApp, cert, getApps, applicationDefault, ServiceAccount } from "firebase-admin/app";
import { getFirestore as initFirestore, Firestore } from "firebase-admin/firestore";
import type {
  UserProfile,
  WorkoutPlan,
  NutritionData,
  RecoveryData,
  ActivityData,
  FitnessStatus,
  CoachAccountabilityState,
  ChatMessage,
  CoachPlan,
  WorkoutLog,
  CoachProfileExtra,
  CoachIntake,
  CoachIntakeAnswers,
  FoodLogItem,
  DailyFoodLog,
  PendingMealLog,
  DailyNutritionSummary,
  MealItem,
} from "./src/types";

export interface LineUserProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

export interface UserData {
  userId: string;
  lineProfile?: LineUserProfile;
  profile?: UserProfile;
  workout?: WorkoutPlan;
  nutrition?: NutritionData;
  recovery?: RecoveryData;
  activity?: ActivityData;
  status?: FitnessStatus;
  accountability?: CoachAccountabilityState;
  messages?: ChatMessage[];
  coachPlan?: CoachPlan; // Active plan
  coachPlans?: CoachPlan[]; // ประวัติโปรแกรมทั้งหมด (active/completed/replaced)
  workoutLogs?: WorkoutLog[];
  coachProfile?: CoachProfileExtra;
  coachIntake?: CoachIntake;
  foodLogs?: Record<string, DailyFoodLog>;
  pendingMeal?: PendingMealLog | null;
  createdAt: string;
  updatedAt: string;
}

// In-memory cache & Local Mode
const inMemoryUsers: Map<string, UserData> = new Map();
const LOCAL_DB_DIR = path.join(process.cwd(), "data");
const LOCAL_DB_FILE = path.join(LOCAL_DB_DIR, "users-store.json");

function loadLocalDatabase(): void {
  try {
    if (!fs.existsSync(LOCAL_DB_DIR)) {
      fs.mkdirSync(LOCAL_DB_DIR, { recursive: true });
    }
    if (fs.existsSync(LOCAL_DB_FILE)) {
      const raw = fs.readFileSync(LOCAL_DB_FILE, "utf-8");
      const parsed: Record<string, UserData> = JSON.parse(raw);
      Object.entries(parsed).forEach(([uid, data]) => {
        inMemoryUsers.set(uid, data);
      });
      console.log(`[DB] Loaded Local Storage (${inMemoryUsers.size} users)`);
    }
  } catch (err) {
    console.warn("[DB] local-db warning:", err);
  }
}

function saveLocalDatabase(): void {
  try {
    if (!fs.existsSync(LOCAL_DB_DIR)) {
      fs.mkdirSync(LOCAL_DB_DIR, { recursive: true });
    }
    const obj: Record<string, UserData> = {};
    inMemoryUsers.forEach((v, k) => {
      obj[k] = v;
    });
    fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(obj, null, 2), "utf-8");
  } catch (err) {
    console.error("[DB] local-db error:", err);
  }
}

loadLocalDatabase();

let firestoreInstance: Firestore | null = null;
let firestoreChecked = false;

function getFirestore(): Firestore | null {
  if (firestoreChecked) return firestoreInstance;
  firestoreChecked = true;
  try {
    const apps = getApps();
    if (apps.length > 0) {
      firestoreInstance = initFirestore();
      console.log("[DB] Connected Firebase Firestore");
      return firestoreInstance;
    }
    const saEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (saEnv && saEnv.trim().length > 0) {
      let saJson: ServiceAccount;
      if (saEnv.trim().startsWith("{")) {
        saJson = JSON.parse(saEnv);
      } else {
        const decoded = Buffer.from(saEnv, "base64").toString("utf-8");
        saJson = JSON.parse(decoded);
      }
      initializeApp({
        credential: cert(saJson),
      });
      firestoreInstance = initFirestore();
      console.log("[DB] Connected Firebase Firestore with FIREBASE_SERVICE_ACCOUNT");
      return firestoreInstance;
    }
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      initializeApp({
        credential: applicationDefault(),
      });
      firestoreInstance = initFirestore();
      console.log("[DB] Connected Firebase Firestore with Google Application Default");
      return firestoreInstance;
    }
    console.log("[DB] Using Local JSON Storage");
  } catch (err) {
    console.warn("[DB] Firebase Firestore fallback to Local Storage:", err);
  }
  return null;
}

export async function getUserData(userId: string): Promise<UserData | null> {
  if (!userId) return null;
  const db = getFirestore();
  if (db) {
    try {
      const docSnap = await db.collection("users").doc(userId).get();
      if (docSnap.exists) {
        return docSnap.data() as UserData;
      }
      return null;
    } catch (err) {
      console.error(`[DB Firestore] Error getUserData userId=${userId}:`, err);
    }
  }
  return inMemoryUsers.get(userId) || null;
}

export async function saveUserData(userId: string, data: Partial<UserData>): Promise<UserData> {
  if (!userId) {
    throw new Error("Missing userId");
  }
  const existing = (await getUserData(userId)) || {
    userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const updated: UserData = {
    ...existing,
    ...data,
    userId,
    updatedAt: new Date().toISOString(),
  };
  const db = getFirestore();
  if (db) {
    try {
      await db.collection("users").doc(userId).set(updated, { merge: true });
      inMemoryUsers.set(userId, updated);
      saveLocalDatabase();
      return updated;
    } catch (err) {
      console.error(`[DB Firestore] Error saveUserData userId=${userId}:`, err);
    }
  }
  inMemoryUsers.set(userId, updated);
  saveLocalDatabase();
  return updated;
}

export async function listUserData(): Promise<UserData[]> {
  const db = getFirestore();
  if (db) {
    try {
      const snap = await db.collection("users").get();
      return snap.docs.map((doc) => doc.data() as UserData);
    } catch (err) {
      console.error("[DB Firestore] Error listUserData:", err);
    }
  }
  return [...inMemoryUsers.values()];
}

export async function updateLineProfile(userId: string, lineProfile: LineUserProfile): Promise<UserData> {
  const existing = await getUserData(userId);
  const dataToSave: Partial<UserData> = {
    lineProfile,
  };
  if (!existing?.profile?.name && lineProfile.displayName) {
    dataToSave.profile = {
      ...(existing?.profile || ({} as UserProfile)),
      name: lineProfile.displayName,
      goal: existing?.profile?.goal || "",
      age: existing?.profile?.age || 0,
      sex: existing?.profile?.sex || "Male",
      height: existing?.profile?.height || 0,
      weight: existing?.profile?.weight || 0,
      fitnessLevel: existing?.profile?.fitnessLevel || "",
      experience: existing?.profile?.experience || "",
      daysPerWeek: existing?.profile?.daysPerWeek || 0,
      durationMinutes: existing?.profile?.durationMinutes || 45,
      preferredTime: existing?.profile?.preferredTime || "18:00",
      lineConnected: true,
    };
  }
  return await saveUserData(userId, dataToSave);
}

export async function hasUserProfile(userId: string): Promise<boolean> {
  const user = await getUserData(userId);
  return Boolean(user && user.profile && user.profile.name && user.profile.name.trim().length > 0);
}

// ===== Coach Intake System Helpers =====

export const INTAKE_QUESTIONS_META = [
  { key: "goalDetails", label: "เป้าหมายละเอียด", required: true, order: 1 },
  { key: "occupation", label: "อาชีพ/ลักษณะงาน", required: true, order: 2 },
  { key: "workEndTime", label: "เวลาเลิกงาน", required: true, order: 3 },
  { key: "workoutLocation", label: "สถานที่ซ้อมหลัก", required: true, order: 4 },
  { key: "equipment", label: "อุปกรณ์ที่มี", required: true, order: 5 },
  { key: "timeSlot", label: "เวลาว่างต่อวัน & เวลาสะดวกซ้อม", required: true, order: 6 },
  { key: "daysPerWeek", label: "จำนวนวันที่ซ้อมได้ต่อสัปดาห์", required: true, order: 7 },
  { key: "programDuration", label: "ระยะเวลาโปรแกรมที่ต้องการ", required: false, order: 8 },
  { key: "experienceLevel", label: "ประสบการณ์ซ้อมที่ผ่านมา", required: false, order: 9 },
  { key: "injuriesOrLimitations", label: "อาการบาดเจ็บ/ข้อจำกัดร่างกาย", required: false, order: 10 },
  { key: "dietaryRestrictions", label: "ข้อจำกัดเรื่องอาหาร", required: false, order: 11 },
] as const;

export function isQuestionAnswered(
  key: string,
  answers: CoachIntakeAnswers
): boolean {
  switch (key) {
    case "goalDetails":
      return Boolean(answers.goalDetails && answers.goalDetails.trim().length > 0);
    case "occupation":
      return Boolean(answers.occupation && answers.occupation.trim().length > 0);
    case "workEndTime":
      return Boolean(answers.workEndTime && answers.workEndTime.trim().length > 0);
    case "workoutLocation":
      return Boolean(answers.workoutLocation && answers.workoutLocation.trim().length > 0);
    case "equipment": {
      const loc = (answers.workoutLocation || "").toLowerCase();
      // ถ้าซ้อมที่ยิม ถือว่ามีอุปกรณ์ยิมครบ ไม่จำเป็นต้องถามอุปกรณ์อีก
      if (loc.includes("gym") || loc.includes("ยิม")) return true;
      if (Array.isArray(answers.equipment) && answers.equipment.length > 0) return true;
      return false;
    }
    case "timeSlot":
    case "availableTimePerDay":
    case "preferredWorkoutTime":
      return Boolean(
        (answers.availableTimePerDay && answers.availableTimePerDay.trim().length > 0) ||
        (answers.preferredWorkoutTime && answers.preferredWorkoutTime.trim().length > 0)
      );
    case "daysPerWeek":
      return Boolean(answers.daysPerWeek && answers.daysPerWeek > 0);
    case "programDuration":
      return Boolean(answers.programDuration && answers.programDuration.trim().length > 0);
    case "experienceLevel":
      return Boolean(answers.experienceLevel && answers.experienceLevel.trim().length > 0);
    case "injuriesOrLimitations":
      return answers.injuriesOrLimitations !== undefined && answers.injuriesOrLimitations !== null;
    case "dietaryRestrictions":
      return answers.dietaryRestrictions !== undefined && answers.dietaryRestrictions !== null;
    default:
      return false;
  }
}

export function computeIntakeStatus(
  answers: CoachIntakeAnswers,
  isUrgentPlan = false
): {
  answeredQuestions: string[];
  pendingQuestions: string[];
  isRequiredComplete: boolean;
  isAllComplete: boolean;
} {
  const answeredQuestions: string[] = [];
  const pendingQuestions: string[] = [];

  for (const q of INTAKE_QUESTIONS_META) {
    if (isQuestionAnswered(q.key, answers)) {
      answeredQuestions.push(q.key);
    } else {
      pendingQuestions.push(q.key);
    }
  }

  if (isUrgentPlan) {
    // กรณีเร่งด่วน: ตรวจเฉพาะข้อ 6 (timeSlot) และข้อ 10 (injuriesOrLimitations)
    const hasTimeSlot = isQuestionAnswered("timeSlot", answers);
    const hasInjuries = isQuestionAnswered("injuriesOrLimitations", answers);
    const isRequiredComplete = hasTimeSlot && hasInjuries;
    return {
      answeredQuestions,
      pendingQuestions: pendingQuestions.filter((k) => k === "timeSlot" || k === "injuriesOrLimitations"),
      isRequiredComplete,
      isAllComplete: isRequiredComplete,
    };
  }

  // ข้อ 1-7 เป็น required
  const requiredKeys = ["goalDetails", "occupation", "workEndTime", "workoutLocation", "equipment", "timeSlot", "daysPerWeek"];
  const isRequiredComplete = requiredKeys.every((k) => answeredQuestions.includes(k));
  const isAllComplete = INTAKE_QUESTIONS_META.every((q) => answeredQuestions.includes(q.key));

  return {
    answeredQuestions,
    pendingQuestions,
    isRequiredComplete,
    isAllComplete,
  };
}

export function syncIntakeWithProfile(
  intake?: CoachIntake,
  profile?: UserProfile,
  extra?: CoachProfileExtra
): CoachIntake {
  const currentAnswers: CoachIntakeAnswers = { ...(intake?.answers || {}) };

  // 1. ดึงข้อมูลที่มีอยู่แล้วในระบบก่อน เพื่อไม่ถามซ้ำ
  if (!currentAnswers.goalDetails && profile?.goal) {
    currentAnswers.goalDetails = profile.goal;
  }
  if (!currentAnswers.occupation && extra?.occupation) {
    currentAnswers.occupation = extra.occupation;
  }
  if (!currentAnswers.workEndTime && extra?.workEndTime) {
    currentAnswers.workEndTime = extra.workEndTime;
  }
  if (!currentAnswers.workoutLocation && (profile?.environment || (profile as any)?.preferredLocation)) {
    currentAnswers.workoutLocation = profile?.environment || (profile as any)?.preferredLocation;
  }
  if ((!currentAnswers.equipment || currentAnswers.equipment.length === 0) && (profile?.equipment?.length ?? 0) > 0) {
    currentAnswers.equipment = profile?.equipment;
  }
  if (!currentAnswers.availableTimePerDay && profile?.durationMinutes) {
    currentAnswers.availableTimePerDay = `${profile.durationMinutes} นาที`;
  }
  if (!currentAnswers.preferredWorkoutTime && (profile?.preferredTime || extra?.preferredWorkoutTime)) {
    currentAnswers.preferredWorkoutTime = profile?.preferredTime || extra?.preferredWorkoutTime;
  }
  if (!currentAnswers.daysPerWeek && profile?.daysPerWeek) {
    currentAnswers.daysPerWeek = profile.daysPerWeek;
  }
  if (!currentAnswers.experienceLevel && (profile?.fitnessLevel || profile?.experience)) {
    currentAnswers.experienceLevel = profile?.fitnessLevel || profile?.experience;
  }
  if (currentAnswers.injuriesOrLimitations === undefined && (profile?.injuries?.length || profile?.hasInjuries || profile?.injuryDetails)) {
    const list = profile?.injuries || [];
    currentAnswers.injuriesOrLimitations = list.length > 0 ? list.join(", ") : (profile?.injuryDetails || "มีอาการบาดเจ็บที่ระบุไว้");
  }
  if (currentAnswers.dietaryRestrictions === undefined && (profile?.foodRestrictions?.length || (profile as any)?.allergies?.length)) {
    const food = profile?.foodRestrictions || (profile as any)?.allergies || [];
    currentAnswers.dietaryRestrictions = food.join(", ");
  }

  const { answeredQuestions, pendingQuestions, isRequiredComplete } = computeIntakeStatus(
    currentAnswers,
    Boolean(intake?.isUrgentPlan)
  );

  let status = intake?.status || "idle";
  if (intake?.intakeComplete) {
    status = "completed";
  } else if (status !== "pending_confirmation") {
    status = answeredQuestions.length > 0 ? "in_progress" : "idle";
  }

  return {
    status,
    intakeComplete: Boolean(intake?.intakeComplete),
    isUrgentPlan: Boolean(intake?.isUrgentPlan),
    answers: currentAnswers,
    answeredQuestions,
    pendingQuestions,
    summaryText: intake?.summaryText,
    confirmedAt: intake?.confirmedAt,
    updatedAt: intake?.updatedAt || new Date().toISOString(),
  };
}

export async function getCoachIntake(userId: string): Promise<CoachIntake> {
  const user = await getUserData(userId);
  return syncIntakeWithProfile(user?.coachIntake, user?.profile, user?.coachProfile);
}

export async function saveCoachIntake(
  userId: string,
  update: Partial<CoachIntake>
): Promise<CoachIntake> {
  const existing = await getCoachIntake(userId);
  const newAnswers: CoachIntakeAnswers = {
    ...existing.answers,
    ...(update.answers || {}),
  };

  const isUrgent = update.isUrgentPlan !== undefined ? update.isUrgentPlan : existing.isUrgentPlan;
  const { answeredQuestions, pendingQuestions, isRequiredComplete } = computeIntakeStatus(newAnswers, isUrgent);

  let newStatus: CoachIntake["status"] = update.status || existing.status;
  let intakeComplete = update.intakeComplete !== undefined ? update.intakeComplete : existing.intakeComplete;

  if (intakeComplete) {
    newStatus = "completed";
  } else if (newStatus === "pending_confirmation") {
    // waiting for confirmation
  } else if (isRequiredComplete) {
    newStatus = "pending_confirmation";
  } else if (answeredQuestions.length > 0) {
    newStatus = "in_progress";
  }

  const merged: CoachIntake = {
    ...existing,
    ...update,
    status: newStatus,
    intakeComplete,
    isUrgentPlan: isUrgent,
    answers: newAnswers,
    answeredQuestions,
    pendingQuestions,
    updatedAt: new Date().toISOString(),
  };

  if (intakeComplete && !merged.confirmedAt) {
    merged.confirmedAt = new Date().toISOString();
  }

  // ซิงค์กลับเข้า user.profile และ user.coachProfile ถาวร
  const profilePatch: Record<string, unknown> = {};
  const extraPatch: CoachProfileExtra = {};

  if (newAnswers.occupation) extraPatch.occupation = newAnswers.occupation;
  if (newAnswers.workEndTime) extraPatch.workEndTime = newAnswers.workEndTime;
  if (newAnswers.preferredWorkoutTime) extraPatch.preferredWorkoutTime = newAnswers.preferredWorkoutTime;

  if (newAnswers.workoutLocation) profilePatch.environment = newAnswers.workoutLocation;
  if (newAnswers.equipment) profilePatch.equipment = newAnswers.equipment;
  if (newAnswers.daysPerWeek) profilePatch.daysPerWeek = newAnswers.daysPerWeek;
  if (newAnswers.experienceLevel) {
    profilePatch.fitnessLevel = newAnswers.experienceLevel;
    profilePatch.experience = newAnswers.experienceLevel;
  }
  if (newAnswers.injuriesOrLimitations) {
    profilePatch.injuryDetails = newAnswers.injuriesOrLimitations;
  }

  await saveUserData(userId, {
    coachIntake: merged,
    ...(Object.keys(extraPatch).length > 0 ? { coachProfile: extraPatch } : {}),
    ...(Object.keys(profilePatch).length > 0 ? { profile: profilePatch as any } : {}),
  });

  return merged;
}

export async function getActiveCoachPlan(userId: string): Promise<CoachPlan | null> {
  const user = await getUserData(userId);
  if (!user?.coachPlan) return null;
  if (user.coachPlan.status && user.coachPlan.status !== "active") return null;
  return user.coachPlan;
}

export async function saveActiveCoachPlan(
  userId: string,
  newPlan: CoachPlan
): Promise<{ activePlan: CoachPlan; replacedPlan?: CoachPlan }> {
  const user = await getUserData(userId);
  const now = new Date().toISOString();
  const existingPlans: CoachPlan[] = Array.isArray(user?.coachPlans)
    ? [...user.coachPlans]
    : [];

  let replacedPlan: CoachPlan | undefined;
  if (user?.coachPlan && user.coachPlan.id !== newPlan.id && user.coachPlan.status !== "replaced") {
    replacedPlan = {
      ...user.coachPlan,
      status: "replaced",
      updatedAt: now,
    };
    const oldIdx = existingPlans.findIndex((p) => p.id === replacedPlan?.id);
    if (oldIdx >= 0) {
      existingPlans[oldIdx] = replacedPlan;
    } else {
      existingPlans.push(replacedPlan);
    }
  }

  const activePlan: CoachPlan = {
    ...newPlan,
    status: "active",
    updatedAt: now,
  };

  const currentIdx = existingPlans.findIndex((p) => p.id === activePlan.id);
  if (currentIdx >= 0) {
    existingPlans[currentIdx] = activePlan;
  } else {
    existingPlans.push(activePlan);
  }

  await saveUserData(userId, {
    coachPlan: activePlan,
    coachPlans: existingPlans,
  });

  return { activePlan, replacedPlan };
}

// ====================================================
// Daily Food Logging & Nutrition Tracking
// ====================================================

export function bangkokDateNow(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" }); // YYYY-MM-DD
}

export function bangkokTimeNow(): string {
  return new Date().toLocaleTimeString("en-GB", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }); // HH:MM
}

export async function getDailyFoodLog(
  userId: string,
  date = bangkokDateNow()
): Promise<DailyFoodLog> {
  const user = await getUserData(userId);
  return user?.foodLogs?.[date] || { date, items: [], photoAnalysisCount: 0 };
}

export async function getDailyNutritionSummary(
  userId: string,
  date = bangkokDateNow()
): Promise<DailyNutritionSummary> {
  const user = await getUserData(userId);
  const log = user?.foodLogs?.[date] || { date, items: [], photoAnalysisCount: 0 };

  const items = log.items || [];
  const calories = items.reduce((acc, i) => acc + (Number(i.calories) || 0), 0);
  const protein = items.reduce((acc, i) => acc + (Number(i.protein) || 0), 0);
  const carbs = items.reduce((acc, i) => acc + (Number(i.carbs) || 0), 0);
  const fat = items.reduce((acc, i) => acc + (Number(i.fat) || 0), 0);

  const todayTotal = {
    calories: Math.round(calories),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat),
  };

  // Determine target from active plan
  let hasActivePlan = false;
  let target: { calories: number; protein: number; carbs: number; fat: number } | undefined;

  const activePlan = user?.coachPlan?.status === "active" ? user.coachPlan : null;

  if (activePlan) {
    hasActivePlan = true;
    const planDay = activePlan.days?.find((d) => d.date === date);
    const isRest = planDay?.status === "rest";

    const hasRestConfig = isRest && (activePlan.dailyNutritionTarget?.restDayCalories || activePlan.dailyNutritionTarget?.restDay);
    const restObj = activePlan.dailyNutritionTarget?.restDay;

    let cal = activePlan.dailyNutritionTarget?.calories || 0;
    let pro = activePlan.dailyNutritionTarget?.protein || 0;
    let carb = activePlan.dailyNutritionTarget?.carbs || 0;
    let fat = activePlan.dailyNutritionTarget?.fat || 0;

    if (hasRestConfig) {
      cal = activePlan.dailyNutritionTarget?.restDayCalories || restObj?.calories || cal;
      pro = activePlan.dailyNutritionTarget?.restDayProtein || restObj?.protein || pro;
      carb = activePlan.dailyNutritionTarget?.restDayCarbs || restObj?.carbs || carb;
      fat = activePlan.dailyNutritionTarget?.restDayFat || restObj?.fat || fat;
    }

    if (cal > 0) {
      target = {
        calories: Math.round(cal),
        protein: Math.round(pro),
        carbs: Math.round(carb),
        fat: Math.round(fat),
      };
    }
  }

  let remaining: { calories: number; protein: number; carbs: number; fat: number } | undefined;
  let remainingCalories: number | undefined;
  let remainingPercent: number | undefined;
  let isOver = false;
  let overCalories = 0;

  if (target) {
    const remCal = Math.max(0, target.calories - todayTotal.calories);
    remaining = {
      calories: remCal,
      protein: Math.max(0, target.protein - todayTotal.protein),
      carbs: Math.max(0, target.carbs - todayTotal.carbs),
      fat: Math.max(0, target.fat - todayTotal.fat),
    };
    remainingCalories = remCal;
    remainingPercent = target.calories > 0 ? Math.round((remCal / target.calories) * 100) : 0;
    isOver = todayTotal.calories > target.calories;
    overCalories = isOver ? todayTotal.calories - target.calories : 0;
  }

  return {
    date,
    hasActivePlan,
    todayTotal,
    target,
    remaining,
    remainingCalories,
    remainingPercent,
    isOver,
    overCalories,
    items,
    pendingMeal: user?.pendingMeal || null,
  };
}

/**
 * Sync user.nutrition object so web components (e.g. NutritionModal) display the updated totals
 */
function syncUserNutritionState(
  user: UserData,
  date: string,
  summary: DailyNutritionSummary
): void {
  const today = bangkokDateNow();
  if (date !== today) return;

  const existingNutrition = user.nutrition || {
    targetCalories: 2000,
    currentCalories: 0,
    targetProtein: 120,
    currentProtein: 0,
    targetCarbs: 250,
    currentCarbs: 0,
    targetFat: 60,
    currentFat: 0,
    meals: [],
  };

  const mappedMeals: MealItem[] = summary.items.map((item) => ({
    id: item.id,
    name: item.menu,
    portion: item.portion,
    calories: item.calories,
    protein: item.protein,
    carbs: item.carbs,
    fat: item.fat,
    time: item.time,
    isEstimate: true,
    type: item.meal,
    source: item.source,
    confidence: item.confidence,
    note: item.note,
  }));

  user.nutrition = {
    ...existingNutrition,
    targetCalories: summary.target?.calories ?? existingNutrition.targetCalories,
    targetProtein: summary.target?.protein ?? existingNutrition.targetProtein,
    targetCarbs: summary.target?.carbs ?? existingNutrition.targetCarbs,
    targetFat: summary.target?.fat ?? existingNutrition.targetFat,
    currentCalories: summary.todayTotal.calories,
    currentProtein: summary.todayTotal.protein,
    currentCarbs: summary.todayTotal.carbs,
    currentFat: summary.todayTotal.fat,
    meals: mappedMeals,
  };
}

export async function addFoodLogItem(
  userId: string,
  itemInput: Omit<FoodLogItem, "id" | "createdAt" | "date"> & { date?: string }
): Promise<{ item: FoodLogItem; summary: DailyNutritionSummary }> {
  const user = (await getUserData(userId)) || {
    userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const date = itemInput.date || bangkokDateNow();
  const time = itemInput.time || bangkokTimeNow();

  const newItem: FoodLogItem = {
    id: `meal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    time,
    date,
    menu: itemInput.menu,
    portion: itemInput.portion,
    calories: Math.round(Number(itemInput.calories) || 0),
    protein: Math.round(Number(itemInput.protein) || 0),
    carbs: Math.round(Number(itemInput.carbs) || 0),
    fat: Math.round(Number(itemInput.fat) || 0),
    source: itemInput.source || "text",
    confidence: itemInput.confidence || "high",
    meal: itemInput.meal || "lunch",
    note: itemInput.note,
    createdAt: new Date().toISOString(),
  };

  const foodLogs = { ...(user.foodLogs || {}) };
  const currentDaily = foodLogs[date] || { date, items: [], photoAnalysisCount: 0 };
  const updatedItems = [...currentDaily.items, newItem];

  foodLogs[date] = {
    ...currentDaily,
    items: updatedItems,
  };

  user.foodLogs = foodLogs;
  user.pendingMeal = null; // Clear pending meal once committed

  const summary = await getDailyNutritionSummary(userId, date);
  // Re-sync with the updated items
  summary.items = updatedItems;
  summary.todayTotal = {
    calories: updatedItems.reduce((s, i) => s + i.calories, 0),
    protein: updatedItems.reduce((s, i) => s + i.protein, 0),
    carbs: updatedItems.reduce((s, i) => s + i.carbs, 0),
    fat: updatedItems.reduce((s, i) => s + i.fat, 0),
  };
  if (summary.target) {
    summary.remaining = {
      calories: Math.max(0, summary.target.calories - summary.todayTotal.calories),
      protein: Math.max(0, summary.target.protein - summary.todayTotal.protein),
      carbs: Math.max(0, summary.target.carbs - summary.todayTotal.carbs),
      fat: Math.max(0, summary.target.fat - summary.todayTotal.fat),
    };
    summary.isOver = summary.todayTotal.calories > summary.target.calories;
    summary.overCalories = summary.isOver ? summary.todayTotal.calories - summary.target.calories : 0;
  }

  syncUserNutritionState(user, date, summary);

  await saveUserData(userId, {
    foodLogs: user.foodLogs,
    pendingMeal: null,
    nutrition: user.nutrition,
  });

  return { item: newItem, summary };
}

export async function editFoodLogItem(
  userId: string,
  itemId?: string,
  updates: Partial<FoodLogItem> = {},
  date = bangkokDateNow()
): Promise<{ updatedItem: FoodLogItem | null; summary: DailyNutritionSummary }> {
  const user = await getUserData(userId);
  if (!user) {
    return { updatedItem: null, summary: await getDailyNutritionSummary(userId, date) };
  }

  const foodLogs = { ...(user.foodLogs || {}) };
  const currentDaily = foodLogs[date] || { date, items: [], photoAnalysisCount: 0 };
  const items = [...currentDaily.items];

  if (items.length === 0) {
    return { updatedItem: null, summary: await getDailyNutritionSummary(userId, date) };
  }

  let targetIndex = -1;
  if (!itemId || itemId === "latest") {
    targetIndex = items.length - 1;
  } else {
    targetIndex = items.findIndex((i) => i.id === itemId);
  }

  if (targetIndex < 0) {
    return { updatedItem: null, summary: await getDailyNutritionSummary(userId, date) };
  }

  const existing = items[targetIndex];
  const updated: FoodLogItem = {
    ...existing,
    ...updates,
    calories: updates.calories !== undefined ? Math.round(Number(updates.calories) || 0) : existing.calories,
    protein: updates.protein !== undefined ? Math.round(Number(updates.protein) || 0) : existing.protein,
    carbs: updates.carbs !== undefined ? Math.round(Number(updates.carbs) || 0) : existing.carbs,
    fat: updates.fat !== undefined ? Math.round(Number(updates.fat) || 0) : existing.fat,
  };

  items[targetIndex] = updated;
  foodLogs[date] = { ...currentDaily, items };
  user.foodLogs = foodLogs;

  const summary = await getDailyNutritionSummary(userId, date);
  summary.items = items;
  summary.todayTotal = {
    calories: items.reduce((s, i) => s + i.calories, 0),
    protein: items.reduce((s, i) => s + i.protein, 0),
    carbs: items.reduce((s, i) => s + i.carbs, 0),
    fat: items.reduce((s, i) => s + i.fat, 0),
  };
  if (summary.target) {
    summary.remaining = {
      calories: Math.max(0, summary.target.calories - summary.todayTotal.calories),
      protein: Math.max(0, summary.target.protein - summary.todayTotal.protein),
      carbs: Math.max(0, summary.target.carbs - summary.todayTotal.carbs),
      fat: Math.max(0, summary.target.fat - summary.todayTotal.fat),
    };
    summary.isOver = summary.todayTotal.calories > summary.target.calories;
    summary.overCalories = summary.isOver ? summary.todayTotal.calories - summary.target.calories : 0;
  }

  syncUserNutritionState(user, date, summary);

  await saveUserData(userId, {
    foodLogs: user.foodLogs,
    nutrition: user.nutrition,
  });

  return { updatedItem: updated, summary };
}

export async function deleteFoodLogItem(
  userId: string,
  itemId?: string,
  date = bangkokDateNow()
): Promise<{ deletedItem: FoodLogItem | null; summary: DailyNutritionSummary }> {
  const user = await getUserData(userId);
  if (!user) {
    return { deletedItem: null, summary: await getDailyNutritionSummary(userId, date) };
  }

  const foodLogs = { ...(user.foodLogs || {}) };
  const currentDaily = foodLogs[date] || { date, items: [], photoAnalysisCount: 0 };
  const items = [...currentDaily.items];

  if (items.length === 0) {
    return { deletedItem: null, summary: await getDailyNutritionSummary(userId, date) };
  }

  let deletedItem: FoodLogItem | null = null;
  if (!itemId || itemId === "latest") {
    deletedItem = items.pop() || null;
  } else {
    const idx = items.findIndex((i) => i.id === itemId);
    if (idx >= 0) {
      deletedItem = items.splice(idx, 1)[0] || null;
    }
  }

  if (!deletedItem) {
    return { deletedItem: null, summary: await getDailyNutritionSummary(userId, date) };
  }

  foodLogs[date] = { ...currentDaily, items };
  user.foodLogs = foodLogs;

  const summary = await getDailyNutritionSummary(userId, date);
  summary.items = items;
  summary.todayTotal = {
    calories: items.reduce((s, i) => s + i.calories, 0),
    protein: items.reduce((s, i) => s + i.protein, 0),
    carbs: items.reduce((s, i) => s + i.carbs, 0),
    fat: items.reduce((s, i) => s + i.fat, 0),
  };
  if (summary.target) {
    summary.remaining = {
      calories: Math.max(0, summary.target.calories - summary.todayTotal.calories),
      protein: Math.max(0, summary.target.protein - summary.todayTotal.protein),
      carbs: Math.max(0, summary.target.carbs - summary.todayTotal.carbs),
      fat: Math.max(0, summary.target.fat - summary.todayTotal.fat),
    };
    summary.isOver = summary.todayTotal.calories > summary.target.calories;
    summary.overCalories = summary.isOver ? summary.todayTotal.calories - summary.target.calories : 0;
  }

  syncUserNutritionState(user, date, summary);

  await saveUserData(userId, {
    foodLogs: user.foodLogs,
    nutrition: user.nutrition,
  });

  return { deletedItem, summary };
}

export async function savePendingMeal(
  userId: string,
  pending: PendingMealLog | null
): Promise<void> {
  await saveUserData(userId, { pendingMeal: pending });
}

export async function getPendingMeal(userId: string): Promise<PendingMealLog | null> {
  const user = await getUserData(userId);
  return user?.pendingMeal || null;
}

export async function checkAndIncrementDailyPhotoCount(
  userId: string,
  limit = 15,
  date = bangkokDateNow()
): Promise<{ allowed: boolean; currentCount: number; limit: number }> {
  const user = (await getUserData(userId)) || {
    userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const foodLogs = { ...(user.foodLogs || {}) };
  const currentDaily = foodLogs[date] || { date, items: [], photoAnalysisCount: 0 };
  const count = Number(currentDaily.photoAnalysisCount) || 0;

  if (count >= limit) {
    return { allowed: false, currentCount: count, limit };
  }

  const updatedDaily = {
    ...currentDaily,
    photoAnalysisCount: count + 1,
  };
  foodLogs[date] = updatedDaily;

  await saveUserData(userId, { foodLogs });
  return { allowed: true, currentCount: count + 1, limit };
}


