// db.ts - จัดการฐานข้อมูลผู้ใช้ รองรับ Firebase Firestore พร้อมระบบ Local Storage สำรอง
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
  createdAt: string;
  updatedAt: string;
}

// In-memory cache สำหรับ Local Mode
const inMemoryUsers: Map<string, UserData> = new Map();
const LOCAL_DB_DIR = path.join(process.cwd(), "data");
const LOCAL_DB_FILE = path.join(LOCAL_DB_DIR, "users-store.json");

// โหลดข้อมูลจากไฟล์ JSON สำรองเมื่อเริ่มต้นระบบ
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
      console.log(`[DB] โหลดข้อมูลผู้ใช้จากไฟล์ Local Storage สำเร็จ (${inMemoryUsers.size} รายการ)`);
    }
  } catch (err) {
    console.warn("[DB] ไม่สามารถอ่านไฟล์สำรอง local-db ได้:", err);
  }
}

// บันทึกข้อมูลลงไฟล์ JSON สำรอง
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
    console.error("[DB] บันทึกไฟล์สำรอง local-db ล้มเหลว:", err);
  }
}

// เริ่มต้นโหลดไฟล์สำรอง
loadLocalDatabase();

// ตรวจสอบและเชื่อมต่อ Firebase Admin Firestore แบบ Lazy
let firestoreInstance: Firestore | null = null;
let firestoreChecked = false;

function getFirestore(): Firestore | null {
  if (firestoreChecked) return firestoreInstance;
  firestoreChecked = true;

  try {
    const apps = getApps();
    if (apps.length > 0) {
      firestoreInstance = initFirestore();
      console.log("[DB] เชื่อมต่อ Firebase Firestore สำเร็จ (App เดิม)");
      return firestoreInstance;
    }

    // 1. ตรวจสอบตัวแปร FIREBASE_SERVICE_ACCOUNT (JSON string หรือ Base64)
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
      console.log("[DB] เชื่อมต่อ Firebase Firestore สำเร็จด้วย FIREBASE_SERVICE_ACCOUNT");
      return firestoreInstance;
    }

    // 2. ตรวจสอบ GOOGLE_APPLICATION_CREDENTIALS หรือ Cloud Default
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      initializeApp({
        credential: applicationDefault(),
      });
      firestoreInstance = initFirestore();
      console.log("[DB] เชื่อมต่อ Firebase Firestore สำเร็จด้วย Google Application Default");
      return firestoreInstance;
    }

    console.log("[DB] ไม่พบ FIREBASE_SERVICE_ACCOUNT ระบบจะจัดเก็บข้อมูลผู้ใช้แบบ Local JSON Storage อัตโนมัติ");
  } catch (err) {
    console.warn("[DB] ไม่สามารถเปิดใช้งาน Firebase Firestore ได้ สลับไปใช้ Local Storage:", err);
  }

  return null;
}

/**
 * ดึงข้อมูลผู้ใช้ตาม LINE userId
 */
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
      console.error(`[DB Firestore] เกิดข้อผิดพลาดในการดึงข้อมูล userId=${userId}:`, err);
    }
  }

  // ใช้ Local Storage สำรอง
  return inMemoryUsers.get(userId) || null;
}

/**
 * บันทึกหรืออัปเดตข้อมูลผู้ใช้ตาม LINE userId
 */
export async function saveUserData(userId: string, data: Partial<UserData>): Promise<UserData> {
  if (!userId) {
    throw new Error("ต้องระบุ userId ในการบันทึกข้อมูล");
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
      // บันทึกลง local cache คู่ขนานด้วย
      inMemoryUsers.set(userId, updated);
      saveLocalDatabase();
      return updated;
    } catch (err) {
      console.error(`[DB Firestore] ไม่สามารถบันทึกข้อมูล userId=${userId}:`, err);
    }
  }

  // บันทึกลง Local Memory & File
  inMemoryUsers.set(userId, updated);
  saveLocalDatabase();
  return updated;
}

/**
 * อัปเดตข้อมูลโปรไฟล์ LINE เมื่อล็อกอิน
 */
export async function updateLineProfile(userId: string, lineProfile: LineUserProfile): Promise<UserData> {
  const existing = await getUserData(userId);
  const dataToSave: Partial<UserData> = {
    lineProfile,
  };

  // ถ้ายังไม่มีชื่อในโปรไฟล์ฟิตเนส ให้นำ displayName จาก LINE มาเป็นค่าเริ่มต้น
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

/**
 * ตรวจสอบว่าผู้ใช้มีโปรไฟล์ฟิตเนสพร้อมใช้งานหรือยัง
 */
export async function hasUserProfile(userId: string): Promise<boolean> {
  const user = await getUserData(userId);
  return Boolean(user && user.profile && user.profile.name && user.profile.name.trim().length > 0);
}
