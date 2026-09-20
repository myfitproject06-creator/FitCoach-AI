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
  coachPlan?: CoachPlan;
  workoutLogs?: WorkoutLog[];
  coachProfile?: CoachProfileExtra;
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
