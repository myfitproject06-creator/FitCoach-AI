// coach-plan.ts - เครื่องมือ (function calling) ที่ให้ AI โค้ชบันทึก/ปรับแผน และสรุปแผนเข้า prompt
import { Type } from "@google/genai";
import {
  getUserData,
  saveUserData,
  getCoachIntake,
  saveCoachIntake,
  syncIntakeWithProfile,
  getActiveCoachPlan,
  saveActiveCoachPlan,
  addFoodLogItem,
  editFoodLogItem,
  deleteFoodLogItem,
  getDailyNutritionSummary,
  getPendingMeal,
  inferMealType,
  bangkokTimeNow,
  updatePlanDayStatus,
} from "./db";
import type {
  CoachPlan,
  PlanDay,
  PlanExercise,
  PlanDayStatus,
  PlanPhase,
  PlanDayNutritionTarget,
  CoachPlanNutritionTarget,
  WorkoutLog,
  CoachProfileExtra,
  CoachIntake,
  CoachIntakeAnswers,
  UserProfile,
  DailyNutritionSummary,
  PendingMealLog,
  FoodLogItem,
} from "./src/types";

// ---------- วันที่ (เวลาไทย) ----------
export function bangkokToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" }); // YYYY-MM-DD
}

function isValidDate(s: unknown): s is string {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

// ---------- Tool declarations (ส่งให้ Gemini) ----------
const exerciseSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "ชื่อท่า (อังกฤษ)" },
    nameTh: { type: Type.STRING, description: "ชื่อท่า (ไทย) ถ้ามี" },
    sets: { type: Type.INTEGER, description: "จำนวนเซ็ต" },
    reps: { type: Type.STRING, description: 'จำนวนครั้ง เช่น "8-12" หรือ "30 วินาที"' },
    restSeconds: { type: Type.INTEGER, description: "พักระหว่างเซ็ต (วินาที)" },
    suggestedWeight: { type: Type.STRING, description: 'น้ำหนักแนะนำ เช่น "20 กก." หรือ "น้ำหนักตัว"' },
    note: { type: Type.STRING, description: "คำแนะนำสั้นๆ" },
  },
  required: ["name", "sets", "reps"],
};

const nutritionTargetSchema = {
  type: Type.OBJECT,
  properties: {
    calories: { type: Type.INTEGER, description: "เป้าหมายแคลอรี่ (kcal)" },
    protein: { type: Type.INTEGER, description: "เป้าหมายโปรตีน (g)" },
    carbs: { type: Type.INTEGER, description: "เป้าหมายคาร์โบไฮเดรต (g)" },
    fat: { type: Type.INTEGER, description: "เป้าหมายไขมัน (g)" },
  },
  required: ["calories", "protein", "carbs", "fat"],
};

const daySchema = {
  type: Type.OBJECT,
  properties: {
    date: { type: Type.STRING, description: "วันที่รูปแบบ YYYY-MM-DD" },
    type: { type: Type.STRING, description: '"workout" สำหรับวันซ้อม หรือ "rest" สำหรับวันพัก' },
    title: { type: Type.STRING, description: 'ชื่อวัน เช่น "Upper Body", "Full Body", "วันพักฟื้นและยืดเหยียด"' },
    focus: { type: Type.STRING, description: "กล้ามเนื้อหรือจุดเน้น" },
    isRestDay: { type: Type.BOOLEAN, description: "true ถ้าเป็นวันพัก" },
    durationMinutes: { type: Type.INTEGER, description: "เวลารวมโดยประมาณ (นาที)" },
    exercises: { type: Type.ARRAY, items: exerciseSchema, description: "ท่าซ้อม (วันพักให้เป็น [])" },
    nutritionTarget: nutritionTargetSchema,
    status: { type: Type.STRING, description: 'สถานะของวัน: "pending" (วันซ้อม) หรือ "rest" (วันพัก)' },
    coachNote: { type: Type.STRING, description: "คำแนะนำจากโค้ช (เช่น ท่าสำรอง คำแนะนำวันพัก ยืดเหยียด ดื่มน้ำ)" },
  },
  required: ["date", "title", "exercises"],
};

export const COACH_TOOL_DECLARATIONS = [
  {
    name: "save_plan",
    description:
      "บันทึกโปรแกรมออกกำลังกายและโภชนาการใหม่ของผู้ใช้ลง DB (เรียกได้เมื่อ intakeComplete = true และผู้ใช้กดยืนยันสรุปโปรแกรมแล้วเท่านั้น) " +
      "ประกอบด้วยข้อมูลโปรแกรม: ชื่อ, เป้าหมาย, วันเริ่ม, วันสิ้นสุด, ระยะเวลา (สัปดาห์), จำนวนวันซ้อม/สัปดาห์, เฟส (ถ้าเกิน 4 สัปดาห์), เป้าโภชนาการรายวัน และตารางรายวันตลอดโปรแกรม",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "ชื่อโปรแกรม เช่น 'โปรแกรมลดไขมันและสร้างความฟิต 4 สัปดาห์'" },
        goal: { type: Type.STRING, description: "เป้าหมายของโปรแกรม" },
        startDate: { type: Type.STRING, description: "วันเริ่ม YYYY-MM-DD (ค่าเริ่มต้นคือวันพรุ่งนี้)" },
        endDate: { type: Type.STRING, description: "วันสิ้นสุด YYYY-MM-DD" },
        durationWeeks: { type: Type.INTEGER, description: "ระยะเวลาโปรแกรม (สัปดาห์)" },
        daysPerWeek: { type: Type.INTEGER, description: "จำนวนวันซ้อมต่อสัปดาห์ (ตรงกับที่ผู้ใช้ตอบ)" },
        phases: {
          type: Type.ARRAY,
          description: "เฟสของแผน (สำหรับโปรแกรมยาวเกิน 4 สัปดาห์ เช่น ปรับตัว / เพิ่มความหนัก / ทบทวน)",
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "ชื่อเฟส เช่น Phase 1: ปรับตัวและปูพื้นฐาน" },
              weeks: { type: Type.INTEGER, description: "จำนวนสัปดาห์ในเฟสนี้" },
              focus: { type: Type.STRING, description: "จุดเน้นของเฟส" },
            },
            required: ["name", "weeks", "focus"],
          },
        },
        dailyNutritionTarget: {
          type: Type.OBJECT,
          description: "เป้าหมายโภชนาการรายวัน (kcal, protein, carbs, fat)",
          properties: {
            calories: { type: Type.INTEGER, description: "แคลอรี่วันซ้อม (kcal)" },
            protein: { type: Type.INTEGER, description: "โปรตีน (g)" },
            carbs: { type: Type.INTEGER, description: "คาร์บ (g)" },
            fat: { type: Type.INTEGER, description: "ไขมัน (g)" },
            restDayCalories: { type: Type.INTEGER, description: "แคลอรี่วันพัก (kcal)" },
            restDayProtein: { type: Type.INTEGER, description: "โปรตีนวันพัก (g)" },
            restDayCarbs: { type: Type.INTEGER, description: "คาร์บวันพัก (g)" },
            restDayFat: { type: Type.INTEGER, description: "ไขมันวันพัก (g)" },
          },
          required: ["calories", "protein", "carbs", "fat"],
        },
        days: { type: Type.ARRAY, items: daySchema, description: "ตารางรายวันตลอดโปรแกรม (ระบุ workout หรือ rest ทุกวัน)" },
        confirmReplaceActivePlan: { type: Type.BOOLEAN, description: "true ถ้ายืนยันแทนที่โปรแกรม active เดิมที่มีอยู่" },
      },
      required: ["title", "goal", "startDate", "endDate", "days"],
    },
  },
  {
    name: "upsert_plan_days",
    description:
      "เพิ่มหรือแก้ไขรายวันในแผนที่มีอยู่ (ใช้ตอนปรับแผนตามผู้ใช้ ย้ายวัน ลดความหนัก หรือลงรายละเอียดสัปดาห์ถัดไป) " +
      "วันที่ซ้ำกับของเดิมจะถูกแทนที่",
    parameters: {
      type: Type.OBJECT,
      properties: { days: { type: Type.ARRAY, items: daySchema } },
      required: ["days"],
    },
  },
  {
    name: "set_day_status",
    description: "เปลี่ยนสถานะของวันในแผน: pending | done | missed | rest (หรือ planned | skipped | moved)",
    parameters: {
      type: Type.OBJECT,
      properties: {
        date: { type: Type.STRING, description: "YYYY-MM-DD" },
        status: { type: Type.STRING, description: "pending | done | missed | rest" },
        note: { type: Type.STRING, description: "เหตุผลสั้นๆ" },
      },
      required: ["date", "status"],
    },
  },
  {
    name: "log_workout",
    description: "บันทึกผลการซ้อมที่ผู้ใช้รายงาน (ทำครบไหม น้ำหนักที่ยก ความรู้สึก RPE) และติ๊กวันนั้นเป็น done ถ้าซ้อมเสร็จ",
    parameters: {
      type: Type.OBJECT,
      properties: {
        date: { type: Type.STRING, description: "YYYY-MM-DD (ไม่ใส่ = วันนี้)" },
        completed: { type: Type.BOOLEAN },
        rpe: { type: Type.INTEGER, description: "ความหนักที่รู้สึก 1-10" },
        feeling: { type: Type.STRING, description: "ความรู้สึกหลังซ้อม" },
        notes: { type: Type.STRING },
        exercises: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              weight: { type: Type.STRING },
              reps: { type: Type.STRING },
            },
            required: ["name"],
          },
        },
      },
      required: ["completed"],
    },
  },
  {
    name: "update_profile_info",
    description:
      "บันทึกข้อมูลที่ผู้ใช้เพิ่งบอกในแชทลงโปรไฟล์ถาวร (อาชีพ เวลาเลิกงาน เวลาที่ซ้อมได้ สถานที่ฝึก อุปกรณ์ จำนวนวัน/นาทีต่อครั้ง ข้อจำกัดร่างกาย) " +
      "เรียกทันทีเมื่อได้ข้อมูลใหม่ ใส่เฉพาะฟิลด์ที่ผู้ใช้บอกจริง",
    parameters: {
      type: Type.OBJECT,
      properties: {
        occupation: { type: Type.STRING, description: "อาชีพ/ลักษณะงาน" },
        workEndTime: { type: Type.STRING, description: "เวลาเลิกงาน HH:MM" },
        preferredWorkoutTime: { type: Type.STRING, description: "เวลาที่สะดวกซ้อม HH:MM" },
        environment: { type: Type.STRING, description: "Gym | Home | Outdoor | Mixed" },
        equipment: { type: Type.ARRAY, items: { type: Type.STRING }, description: "อุปกรณ์ที่มี" },
        daysPerWeek: { type: Type.INTEGER, description: "ซ้อมได้กี่วัน/สัปดาห์" },
        sessionMinutes: { type: Type.INTEGER, description: "ซ้อมได้ครั้งละกี่นาที" },
        limitations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "ข้อจำกัดร่างกาย/อาการบาดเจ็บ" },
      },
    },
  },
  {
    name: "update_coach_intake",
    description:
      "บันทึกข้อมูลการซักประวัติ (Intake Assessment) 11 ข้อของผู้ใช้ก่อนสร้างโปรแกรม " +
      "เรียกทันทีเมื่อผู้ใช้บอกข้อมูล ไม่ว่าจะตอบ 1 ข้อหรือรวบหลายข้อในข้อความเดียว " +
      "หรือเมื่อผู้ใช้ยืนยันสรุปข้อมูลครบถ้วนแล้ว (intakeComplete: true) " +
      "ห้ามสร้างโปรแกรมหรือเรียก save_plan ก่อนที่ intakeComplete จะเป็น true (ยกเว้นกรณีเร่งด่วนขอแผนวันนี้)",
    parameters: {
      type: Type.OBJECT,
      properties: {
        answers: {
          type: Type.OBJECT,
          description: "คำตอบจากการซักประวัติ 11 ข้อ (ใส่เฉพาะข้อที่ได้ข้อมูลมา)",
          properties: {
            goalDetails: { type: Type.STRING, description: "1. เป้าหมาย (รายละเอียดที่ผู้ใช้ต้องการ เช่น ลดพุง 1 เดือน, ปั้นกล้ามแขน)" },
            occupation: { type: Type.STRING, description: "2. อาชีพ / ลักษณะงาน (นั่งโต๊ะ, ยืนทั้งวัน, ใช้แรง)" },
            workEndTime: { type: Type.STRING, description: "3. เวลาเลิกงาน เช่น 17:30, 18:00" },
            workoutLocation: { type: Type.STRING, description: "4. สถานที่ซ้อมหลัก: บ้าน / ยิม / สลับ" },
            equipment: { type: Type.ARRAY, items: { type: Type.STRING }, description: "5. อุปกรณ์ที่มี (ถ้าซ้อมที่บ้านหรือสลับ)" },
            availableTimePerDay: { type: Type.STRING, description: "6. เวลาว่างต่อวัน เช่น 45 นาที, 1 ชม." },
            preferredWorkoutTime: { type: Type.STRING, description: "6. เวลาที่สะดวกซ้อม เช่น เช้า, 18:00, 20:00" },
            daysPerWeek: { type: Type.INTEGER, description: "7. จำนวนวันที่ซ้อมได้ต่อสัปดาห์ (1-7)" },
            programDuration: { type: Type.STRING, description: "8. ระยะเวลาโปรแกรมที่ต้องการ เช่น 1 สัปดาห์, 2 เดือน, โค้ชประเมินให้" },
            experienceLevel: { type: Type.STRING, description: "9. ประสบการณ์ซ้อม (มือใหม่ / เคยซ้อม / ซ้อมประจำ)" },
            injuriesOrLimitations: { type: Type.STRING, description: "10. อาการบาดเจ็บหรือข้อจำกัดร่างกาย (ระบุ 'ไม่มี' ได้)" },
            dietaryRestrictions: { type: Type.STRING, description: "11. ข้อจำกัดเรื่องอาหาร เช่น แพ้อาหาร, ไม่กินหมู (ระบุ 'ไม่มี' ได้)" },
          },
        },
        intakeComplete: { type: Type.BOOLEAN, description: "ตั้งเป็น true เมื่อผู้ใช้ตอบยืนยันข้อความสรุปแล้วเท่านั้น" },
        isUrgentPlan: { type: Type.BOOLEAN, description: "ตั้งเป็น true เฉพาะกรณีเร่งด่วนที่ขอแผนวันนี้" },
        summaryText: { type: Type.STRING, description: "ข้อความสรุปข้อมูล 11 ข้อที่โค้ชแจ้งให้ผู้ใช้ยืนยัน" },
      },
    },
  },
  {
    name: "log_meal",
    description:
      "บันทึกมื้ออาหารลง DB เมื่อผู้ใช้กดยืนยัน หรือพิมพ์ยืนยัน/ตกลง/บันทึกตามที่โค้ชสรุป " +
      "ห้ามเรียกฟังก์ชันนี้ทันทีตอนที่ผู้ใช้เพิ่งบอกเมนูหรือส่งรูปภาพเป็นครั้งแรก (ต้องประเมินและให้ผู้ใช้ยืนยันก่อนเสมอ)",
    parameters: {
      type: Type.OBJECT,
      properties: {
        menu: { type: Type.STRING, description: "ชื่อเมนูอาหาร เช่น 'ข้าวกะเพราไก่ไข่ดาว', 'ข้าวเหนียวหมูปิ้ง 3 ไม้'" },
        calories: { type: Type.INTEGER, description: "พลังงานโดยประมาณ (kcal, ปัดเป็นเลขกลมๆ ห้ามมีทศนิยม)" },
        protein: { type: Type.INTEGER, description: "โปรตีนโดยประมาณ (g, ปัดเป็นเลขกลมๆ ห้ามมีทศนิยม)" },
        carbs: { type: Type.INTEGER, description: "คาร์โบไฮเดรตโดยประมาณ (g, ปัดเป็นเลขกลมๆ ห้ามมีทศนิยม)" },
        fat: { type: Type.INTEGER, description: "ไขมันโดยประมาณ (g, ปัดเป็นเลขกลมๆ ห้ามมีทศนิยม)" },
        portion: { type: Type.STRING, description: "ปริมาณโดยประมาณ เช่น '1 จานปกติ', '1 ชามพิเศษ', '2 ฟอง'" },
        meal: { type: Type.STRING, description: "มื้ออาหาร: 'breakfast' | 'lunch' | 'dinner' | 'snack'" },
        source: { type: Type.STRING, description: "แหล่งที่มา: 'text' หรือ 'photo'" },
        confidence: { type: Type.STRING, description: "ระดับความมั่นใจ: 'high' | 'medium' | 'low'" },
        note: { type: Type.STRING, description: "หมายเหตุเพิ่มเติม เช่น ลดข้าวครึ่งจาน" },
      },
      required: ["menu", "calories", "protein", "carbs", "fat"],
    },
  },
  {
    name: "edit_meal",
    description:
      "แก้ไขข้อมูลมื้ออาหารที่บันทึกไปแล้ว เช่น ผู้ใช้บอก 'แก้มื้อล่าสุดเป็น 300 แคล', 'เปลี่ยนมื้อล่าสุดลดข้าวครึ่งจาน'",
    parameters: {
      type: Type.OBJECT,
      properties: {
        mealId: { type: Type.STRING, description: "ID ของมื้อที่ต้องการแก้ หรือระบุ 'latest' เพื่อแก้มื้อล่าสุด" },
        menu: { type: Type.STRING, description: "ชื่อเมนูใหม่" },
        calories: { type: Type.INTEGER, description: "แคลอรี่ใหม่ (kcal)" },
        protein: { type: Type.INTEGER, description: "โปรตีนใหม่ (g)" },
        carbs: { type: Type.INTEGER, description: "คาร์โบไฮเดรตใหม่ (g)" },
        fat: { type: Type.INTEGER, description: "ไขมันใหม่ (g)" },
        portion: { type: Type.STRING, description: "ปริมาณใหม่" },
        meal: { type: Type.STRING, description: "มื้ออาหาร" },
        note: { type: Type.STRING, description: "หมายเหตุ" },
      },
    },
  },
  {
    name: "delete_meal",
    description:
      "ลบมื้ออาหารออกจาก DB เช่น เมื่อผู้ใช้บอก 'ลบมื้อล่าสุด', 'ลบมื้อเช้า', 'ขอยกเลิกมื้อที่บันทึกไป'",
    parameters: {
      type: Type.OBJECT,
      properties: {
        mealId: { type: Type.STRING, description: "ID ของมื้อที่ต้องการลบ หรือระบุ 'latest' เพื่อลบมื้อล่าสุด" },
      },
    },
  },
  {
    name: "get_today_totals",
    description:
      "ดึงข้อมูลสรุปยอดสะสมโภชนาการวันนี้ (แคลอรี่, โปรตีน, คาร์บ, ไขมัน), รายการมื้อที่บันทึกแล้ว และเป้าหมายจากโปรแกรม active",
    parameters: {
      type: Type.OBJECT,
      properties: {
        date: { type: Type.STRING, description: "วันที่ YYYY-MM-DD (ค่าเริ่มต้นคือวันนี้)" },
      },
    },
  },
];

// ---------- Sanitize ----------
function clampInt(v: unknown, min: number, max: number, fallback: number): number {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function str(v: unknown, max = 300): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t ? t.slice(0, max) : undefined;
}

function sanitizeExercises(raw: unknown): PlanExercise[] {
  if (!Array.isArray(raw)) return [];
  const out: PlanExercise[] = [];
  for (const e of raw.slice(0, 20)) {
    const name = str(e?.name, 100);
    if (!name) continue;
    out.push({
      name,
      nameTh: str(e?.nameTh, 100),
      sets: clampInt(e?.sets, 1, 10, 3),
      reps: str(String(e?.reps ?? "10"), 30) || "10",
      restSeconds: clampInt(e?.restSeconds, 0, 600, 60),
      suggestedWeight: str(e?.suggestedWeight, 40),
      note: str(e?.note, 200),
    });
  }
  return out;
}

function sanitizeNutritionTarget(raw: unknown): CoachPlanNutritionTarget | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const obj = raw as Record<string, unknown>;
  const calories = clampInt(obj.calories, 1000, 5000, 2000);
  const protein = clampInt(obj.protein, 30, 400, 120);
  const carbs = clampInt(obj.carbs, 20, 600, 200);
  const fat = clampInt(obj.fat, 10, 200, 50);
  return {
    calories,
    protein,
    carbs,
    fat,
    restDayCalories: obj.restDayCalories ? clampInt(obj.restDayCalories, 1000, 5000, calories) : undefined,
    restDayProtein: obj.restDayProtein ? clampInt(obj.restDayProtein, 30, 400, protein) : undefined,
    restDayCarbs: obj.restDayCarbs ? clampInt(obj.restDayCarbs, 20, 600, carbs) : undefined,
    restDayFat: obj.restDayFat ? clampInt(obj.restDayFat, 10, 200, fat) : undefined,
  };
}

function sanitizeDays(raw: unknown, defaultNutrition?: CoachPlanNutritionTarget): PlanDay[] {
  if (!Array.isArray(raw)) return [];
  const byDate = new Map<string, PlanDay>();
  for (const d of raw.slice(0, 180)) {
    if (!isValidDate(d?.date)) continue;
    const typeStr = str(d?.type, 20);
    const isRest = Boolean(d?.isRestDay) || typeStr === "rest";
    const type: "workout" | "rest" = isRest ? "rest" : "workout";

    // Status: default to "rest" for rest day, "pending" for workout day
    let status: PlanDayStatus = isRest ? "rest" : "pending";
    if (d?.status && ["pending", "done", "missed", "rest", "planned", "skipped", "moved"].includes(d.status)) {
      status = d.status as PlanDayStatus;
    }

    let nutritionTarget: PlanDayNutritionTarget | undefined;
    if (d?.nutritionTarget && typeof d.nutritionTarget === "object") {
      nutritionTarget = {
        calories: clampInt(d.nutritionTarget.calories, 800, 5000, isRest ? (defaultNutrition?.restDayCalories || defaultNutrition?.calories || 1800) : (defaultNutrition?.calories || 2000)),
        protein: clampInt(d.nutritionTarget.protein, 20, 400, isRest ? (defaultNutrition?.restDayProtein || defaultNutrition?.protein || 120) : (defaultNutrition?.protein || 120)),
        carbs: clampInt(d.nutritionTarget.carbs, 20, 600, isRest ? (defaultNutrition?.restDayCarbs || defaultNutrition?.carbs || 180) : (defaultNutrition?.carbs || 200)),
        fat: clampInt(d.nutritionTarget.fat, 10, 200, isRest ? (defaultNutrition?.restDayFat || defaultNutrition?.fat || 50) : (defaultNutrition?.fat || 50)),
      };
    } else if (defaultNutrition) {
      nutritionTarget = {
        calories: isRest ? (defaultNutrition.restDayCalories || defaultNutrition.calories) : defaultNutrition.calories,
        protein: isRest ? (defaultNutrition.restDayProtein || defaultNutrition.protein) : defaultNutrition.protein,
        carbs: isRest ? (defaultNutrition.restDayCarbs || defaultNutrition.carbs) : defaultNutrition.carbs,
        fat: isRest ? (defaultNutrition.restDayFat || defaultNutrition.fat) : defaultNutrition.fat,
      };
    }

    byDate.set(d.date, {
      date: d.date,
      type,
      title: str(d?.title, 80) || (isRest ? "วันพักฟื้นและยืดเหยียด" : "ซ้อม"),
      focus: str(d?.focus, 80),
      isRestDay: isRest,
      durationMinutes: isRest ? undefined : (d?.durationMinutes ? clampInt(d.durationMinutes, 5, 240, 45) : 45),
      exercises: isRest ? [] : sanitizeExercises(d?.exercises),
      nutritionTarget,
      status,
      coachNote: str(d?.coachNote, 300),
    });
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function sanitizePhases(raw: unknown): PlanPhase[] {
  if (!Array.isArray(raw)) return [];
  const out: PlanPhase[] = [];
  for (const p of raw.slice(0, 12)) {
    const name = str(p?.name, 60);
    if (!name) continue;
    out.push({ name, weeks: clampInt(p?.weeks, 1, 52, 1), focus: str(p?.focus, 150) || "" });
  }
  return out;
}

// ---------- คำนวณโภชนาการอ้างอิงตามหลักวิทยาศาสตร์ ----------
export interface CalculatedNutritionSummary {
  bmr: number;
  tdee: number;
  targetCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  restDayCalories: number;
  restDayProteinGrams: number;
  restDayCarbsGrams: number;
  restDayFatGrams: number;
  goalType: "fat_loss" | "muscle_gain" | "maintenance";
  safetyNotes: string[];
}

export function calculateEstimatedNutrition(
  profile?: UserProfile,
  intakeAnswers?: CoachIntakeAnswers
): CalculatedNutritionSummary {
  const weight = Number(profile?.weight ?? 65);
  const height = Number(profile?.height ?? 170);
  const age = Number(profile?.age ?? 28);
  const gender = (profile?.gender || "male").toLowerCase();
  const isFemale = gender.includes("female") || gender.includes("หญิง") || gender === "f";

  // Mifflin-St Jeor
  const bmr = Math.round(
    isFemale
      ? 10 * weight + 6.25 * height - 5 * age - 161
      : 10 * weight + 6.25 * height - 5 * age + 5
  );

  const days = intakeAnswers?.daysPerWeek || profile?.daysPerWeek || 3;
  const occ = (intakeAnswers?.occupation || "").toLowerCase();
  let activityFactor = 1.375; // default light
  if (occ.includes("นั่ง") || occ.includes("โต๊ะ") || occ.includes("desk") || occ.includes("office")) {
    activityFactor = days <= 2 ? 1.2 : 1.3;
  } else if (occ.includes("แรง") || occ.includes("หนัก") || occ.includes("กรรมกร")) {
    activityFactor = 1.6;
  } else if (days >= 4) {
    activityFactor = 1.45;
  }

  const tdee = Math.round(bmr * activityFactor);

  const goalText = (
    (intakeAnswers?.goalDetails || "") + " " + (profile?.goal || "")
  ).toLowerCase();

  let goalType: "fat_loss" | "muscle_gain" | "maintenance" = "maintenance";
  let targetCalories = tdee;
  const safetyNotes: string[] = [];

  if (
    goalText.includes("ลด") ||
    goalText.includes("พุง") ||
    goalText.includes("ไขมัน") ||
    goalText.includes("ลีน") ||
    goalText.includes("lean") ||
    goalText.includes("fat loss")
  ) {
    goalType = "fat_loss";
    targetCalories = tdee - 450;
    // Safety floor
    const minSafe = isFemale ? 1200 : 1500;
    if (targetCalories < minSafe) {
      targetCalories = minSafe;
      safetyNotes.push(`กำหนดเพดานแคลอรี่ขั้นต่ำเพื่อความปลอดภัยไม่ต่ำกว่า ${minSafe} kcal/วัน`);
    }
  } else if (
    goalText.includes("เพิ่ม") ||
    goalText.includes("กล้าม") ||
    goalText.includes("bulk") ||
    goalText.includes("muscle")
  ) {
    goalType = "muscle_gain";
    targetCalories = tdee + 250;
  }

  // Protein: ~1.8g per kg bodyweight
  const proteinGrams = Math.round(Math.min(Math.max(weight * 1.8, 60), 220));
  // Fat: ~25% of calories / 9
  const fatGrams = Math.round(Math.min(Math.max((targetCalories * 0.25) / 9, 35), 100));
  // Carbs: remainder
  const carbsCalories = Math.max(0, targetCalories - proteinGrams * 4 - fatGrams * 9);
  const carbsGrams = Math.round(carbsCalories / 4);

  // Rest day: ~100 kcal lower (reduced mostly from carbs)
  const restDayCalories = Math.max(isFemale ? 1200 : 1400, targetCalories - 100);
  const restDayProteinGrams = proteinGrams;
  const restDayFatGrams = fatGrams;
  const restDayCarbsGrams = Math.round(Math.max(0, restDayCalories - restDayProteinGrams * 4 - restDayFatGrams * 9) / 4);

  return {
    bmr,
    tdee,
    targetCalories,
    proteinGrams,
    carbsGrams,
    fatGrams,
    restDayCalories,
    restDayProteinGrams,
    restDayCarbsGrams,
    restDayFatGrams,
    goalType,
    safetyNotes,
  };
}

// ---------- Executors ----------
type ToolResult = Record<string, unknown>;

export async function executeCoachTool(
  userId: string,
  name: string,
  args: Record<string, unknown>
): Promise<ToolResult> {
  const user = await getUserData(userId);
  const now = new Date().toISOString();

  switch (name) {
    case "save_plan": {
      const intake = await getCoachIntake(userId);
      if (!intake.intakeComplete && !intake.isUrgentPlan) {
        return {
          ok: false,
          error: "ยังไม่สามารถสร้างหรือบันทึกโปรแกรมได้ เนื่องจากต้องซักประวัติครบถ้วนและผู้ใช้ยืนยันก่อน (intakeComplete ต้องเป็น true)",
        };
      }
      const defaultNutrition = sanitizeNutritionTarget(args.dailyNutritionTarget);
      const days = sanitizeDays(args.days, defaultNutrition);
      if (days.length === 0) return { ok: false, error: "ต้องมี days อย่างน้อย 1 วัน และ date ต้องเป็น YYYY-MM-DD" };
      if (!isValidDate(args.startDate) || !isValidDate(args.endDate)) {
        return { ok: false, error: "startDate/endDate ต้องเป็น YYYY-MM-DD" };
      }
      if ((args.endDate as string) < (args.startDate as string)) {
        return { ok: false, error: "endDate ต้องไม่ก่อน startDate" };
      }

      const durationWeeks = clampInt(
        args.durationWeeks,
        1,
        52,
        Math.max(1, Math.round((new Date(args.endDate as string).getTime() - new Date(args.startDate as string).getTime()) / (7 * 86400000)))
      );
      const daysPerWeek = clampInt(args.daysPerWeek, 1, 7, intake.answers.daysPerWeek || 3);

      const plan: CoachPlan = {
        id: `plan-${Date.now()}`,
        title: str(args.title, 100) || "โปรแกรมออกกำลังกายและโภชนาการ",
        goal: str(args.goal, 200) || intake.answers.goalDetails || "",
        startDate: args.startDate as string,
        endDate: args.endDate as string,
        status: "active",
        durationWeeks,
        daysPerWeek,
        phases: sanitizePhases(args.phases),
        dailyNutritionTarget: defaultNutrition,
        days,
        createdAt: now,
        updatedAt: now,
      };

      const result = await saveActiveCoachPlan(userId, plan);

      return {
        ok: true,
        planId: plan.id,
        title: plan.title,
        savedDays: days.length,
        startDate: plan.startDate,
        endDate: plan.endDate,
        status: plan.status,
        replacedPreviousPlan: result.replacedPlan ? result.replacedPlan.title : null,
      };
    }

    case "upsert_plan_days": {
      const plan = await getActiveCoachPlan(userId);
      if (!plan) return { ok: false, error: "ยังไม่มีแผน ให้เรียก save_plan ก่อน" };
      const incoming = sanitizeDays(args.days, plan.dailyNutritionTarget);
      if (incoming.length === 0) return { ok: false, error: "ไม่มีวันที่ถูกต้องใน days" };
      const map = new Map(plan.days.map((d) => [d.date, d] as const));
      for (const d of incoming) map.set(d.date, d);
      const days = [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
      const endDate = days[days.length - 1].date > plan.endDate ? days[days.length - 1].date : plan.endDate;
      await saveUserData(userId, { coachPlan: { ...plan, days, endDate, updatedAt: now } });
      return { ok: true, upserted: incoming.length };
    }

    case "set_day_status": {
      if (!isValidDate(args.date)) return { ok: false, error: "date ต้องเป็น YYYY-MM-DD" };
      const status = args.status as PlanDayStatus;
      if (!["pending", "done", "missed", "rest", "postponed", "planned", "skipped", "moved"].includes(status)) {
        return { ok: false, error: "status ต้องเป็น pending | done | missed | rest | postponed (หรือ planned | skipped | moved)" };
      }
      const today = bangkokToday();
      if ((args.date as string) > today) {
        return { ok: false, error: "ไม่สามารถบันทึกหรือเปลี่ยนสถานะของวันในอนาคตได้ครับ" };
      }
      const result = await updatePlanDayStatus(userId, args.date as string, status, {
        markedBy: (args.markedBy as "user" | "coach") || "coach",
        coachNote: str(args.note, 300),
        userNote: str(args.userNote, 300),
        postponedToTime: str(args.postponedToTime, 20),
      });
      return result;
    }

    case "log_workout": {
      const date = isValidDate(args.date) ? (args.date as string) : bangkokToday();
      const completed = Boolean(args.completed);
      const exercises = Array.isArray(args.exercises)
        ? (args.exercises as any[])
            .slice(0, 20)
            .map((e) => ({ name: str(e?.name, 100) || "", weight: str(e?.weight, 30), reps: str(e?.reps, 30) }))
            .filter((e) => e.name)
        : undefined;
      const log: WorkoutLog = {
        id: `log-${Date.now()}`,
        date,
        completed,
        rpe: args.rpe ? clampInt(args.rpe, 1, 10, 5) : undefined,
        feeling: str(args.feeling, 100),
        notes: str(args.notes, 300),
        exercises,
        createdAt: now,
      };
      const logs = [...(user?.workoutLogs || []), log].slice(-100);
      await saveUserData(userId, { workoutLogs: logs });

      let planUpdateResult = null;
      if (completed) {
        planUpdateResult = await updatePlanDayStatus(userId, date, "done", {
          markedBy: "coach",
          userNote: str(args.notes, 300),
        });
      }
      return {
        ok: true,
        date,
        markedDone: Boolean(planUpdateResult?.ok),
        alreadyDone: planUpdateResult?.alreadyDone,
        stats: planUpdateResult?.stats,
      };
    }

    case "update_profile_info": {
      const extra: CoachProfileExtra = { ...(user?.coachProfile || {}) };
      const occupation = str(args.occupation, 100);
      const workEndTime = str(args.workEndTime, 10);
      const preferredWorkoutTime = str(args.preferredWorkoutTime, 10);
      if (occupation) extra.occupation = occupation;
      if (workEndTime) extra.workEndTime = workEndTime;
      if (preferredWorkoutTime) extra.preferredWorkoutTime = preferredWorkoutTime;

      const patch: Record<string, unknown> = { coachProfile: extra };
      if (user?.profile) {
        const p = { ...user.profile } as Record<string, unknown>;
        if (["Gym", "Home", "Outdoor", "Mixed"].includes(args.environment as string)) p.environment = args.environment;
        if (Array.isArray(args.equipment)) p.equipment = (args.equipment as unknown[]).map((x) => str(x, 60)).filter(Boolean);
        if (Array.isArray(args.limitations)) p.limitations = (args.limitations as unknown[]).map((x) => str(x, 100)).filter(Boolean);
        if (args.daysPerWeek) p.daysPerWeek = clampInt(args.daysPerWeek, 1, 7, 3);
        if (args.sessionMinutes) p.durationMinutes = clampInt(args.sessionMinutes, 10, 240, 45);
        if (preferredWorkoutTime) p.preferredTime = preferredWorkoutTime;
        patch.profile = p;
      }
      await saveUserData(userId, patch);
      return { ok: true };
    }

    case "update_coach_intake": {
      const rawAnswers = (args.answers as Record<string, unknown>) || {};
      const answers: CoachIntakeAnswers = {};

      if (rawAnswers.goalDetails) answers.goalDetails = str(rawAnswers.goalDetails, 200);
      if (rawAnswers.occupation) answers.occupation = str(rawAnswers.occupation, 100);
      if (rawAnswers.workEndTime) answers.workEndTime = str(rawAnswers.workEndTime, 20);
      if (rawAnswers.workoutLocation) answers.workoutLocation = str(rawAnswers.workoutLocation, 50);
      if (Array.isArray(rawAnswers.equipment)) {
        answers.equipment = rawAnswers.equipment.map((e) => str(e, 50)).filter(Boolean) as string[];
      }
      if (rawAnswers.availableTimePerDay) answers.availableTimePerDay = str(rawAnswers.availableTimePerDay, 50);
      if (rawAnswers.preferredWorkoutTime) answers.preferredWorkoutTime = str(rawAnswers.preferredWorkoutTime, 50);
      if (rawAnswers.daysPerWeek) answers.daysPerWeek = clampInt(rawAnswers.daysPerWeek, 1, 7, 3);
      if (rawAnswers.programDuration) answers.programDuration = str(rawAnswers.programDuration, 100);
      if (rawAnswers.experienceLevel) answers.experienceLevel = str(rawAnswers.experienceLevel, 100);
      if (rawAnswers.injuriesOrLimitations !== undefined) {
        answers.injuriesOrLimitations = str(rawAnswers.injuriesOrLimitations, 200) || "ไม่มี";
      }
      if (rawAnswers.dietaryRestrictions !== undefined) {
        answers.dietaryRestrictions = str(rawAnswers.dietaryRestrictions, 200) || "ไม่มี";
      }

      const updated = await saveCoachIntake(userId, {
        answers,
        intakeComplete: args.intakeComplete !== undefined ? Boolean(args.intakeComplete) : undefined,
        isUrgentPlan: args.isUrgentPlan !== undefined ? Boolean(args.isUrgentPlan) : undefined,
        summaryText: str(args.summaryText, 1000),
      });

      return {
        ok: true,
        intakeComplete: updated.intakeComplete,
        status: updated.status,
        answeredQuestions: updated.answeredQuestions,
        pendingQuestions: updated.pendingQuestions,
        isReadyForConfirmation: updated.status === "pending_confirmation",
      };
    }

    case "log_meal": {
      const pending = await getPendingMeal(userId);
      const menu = str(args.menu, 150) || pending?.menu || "มื้ออาหาร";
      const calories = args.calories !== undefined
        ? clampInt(args.calories, 0, 10000, 0)
        : (pending?.calories ?? 0);
      const protein = args.protein !== undefined
        ? clampInt(args.protein, 0, 1000, 0)
        : (pending?.protein ?? 0);
      const carbs = args.carbs !== undefined
        ? clampInt(args.carbs, 0, 2000, 0)
        : (pending?.carbs ?? 0);
      const fat = args.fat !== undefined
        ? clampInt(args.fat, 0, 1000, 0)
        : (pending?.fat ?? 0);
      const portion = str(args.portion, 100) || pending?.portion || "1 จาน";
      const time = bangkokTimeNow();
      const meal = (["breakfast", "lunch", "dinner", "snack"].includes(args.meal as string)
        ? args.meal
        : (pending?.meal || inferMealType(time))) as "breakfast" | "lunch" | "dinner" | "snack";
      const source = (args.source === "photo" || pending?.source === "photo") ? "photo" : "text";
      const confidence = (["high", "medium", "low"].includes(args.confidence as string)
        ? args.confidence
        : (pending?.confidence || "medium")) as "high" | "medium" | "low";
      const note = str(args.note, 200) || pending?.note;

      const result = await addFoodLogItem(userId, {
        menu,
        calories,
        protein,
        carbs,
        fat,
        portion,
        meal,
        source,
        confidence,
        note,
        time,
      });

      return {
        ok: true,
        message: `บันทึกมื้อ '${menu}' เรียบร้อยแล้ว`,
        item: result.item,
        todaySummary: result.summary,
      };
    }

    case "edit_meal": {
      const mealId = str(args.mealId, 80) || "latest";
      const updates: any = {};
      if (args.menu) updates.menu = str(args.menu, 150);
      if (args.calories !== undefined) updates.calories = clampInt(args.calories, 0, 10000, 0);
      if (args.protein !== undefined) updates.protein = clampInt(args.protein, 0, 1000, 0);
      if (args.carbs !== undefined) updates.carbs = clampInt(args.carbs, 0, 2000, 0);
      if (args.fat !== undefined) updates.fat = clampInt(args.fat, 0, 1000, 0);
      if (args.portion) updates.portion = str(args.portion, 100);
      if (args.meal) updates.meal = args.meal;
      if (args.note) updates.note = str(args.note, 200);

      const result = await editFoodLogItem(userId, mealId, updates);
      return {
        ok: Boolean(result.updatedItem),
        message: result.updatedItem ? "แก้ไขมื้ออาหารสำเร็จ" : "ไม่พบมื้ออาหารที่ระบุ",
        updatedItem: result.updatedItem,
        todaySummary: result.summary,
      };
    }

    case "delete_meal": {
      const mealId = str(args.mealId, 80) || "latest";
      const result = await deleteFoodLogItem(userId, mealId);
      return {
        ok: Boolean(result.deletedItem),
        message: result.deletedItem
          ? `ลบมื้อ '${result.deletedItem.menu}' เรียบร้อยแล้ว`
          : "ไม่พบมื้ออาหารที่ระบุ",
        deletedItem: result.deletedItem,
        todaySummary: result.summary,
      };
    }

    case "get_today_totals": {
      const date = isValidDate(args.date) ? (args.date as string) : bangkokToday();
      const summary = await getDailyNutritionSummary(userId, date);
      return {
        ok: true,
        summary,
      };
    }

    default:
      return { ok: false, error: `ไม่รู้จักเครื่องมือ ${name}` };
  }
}

export function buildNutritionPromptContext(
  summary?: DailyNutritionSummary,
  pending?: PendingMealLog | null
): string {
  if (!summary) return "- วันนี้ยังไม่มีข้อมูลการบันทึกอาหาร";
  const lines: string[] = [];
  const { todayTotal, target, remaining, isOver, overCalories, hasActivePlan, items } = summary;

  if (hasActivePlan && target) {
    const calStatus = isOver
      ? `กินเกินเป้า ${overCalories} kcal`
      : `เหลือ ${remaining?.calories ?? 0} kcal`;
    lines.push(
      `- สถานะโภชนาการวันนี้ (${summary.date}): กินแล้ว ${todayTotal.calories} / ${target.calories} kcal (${calStatus}) | โปรตีน ${todayTotal.protein} / ${target.protein}g | คาร์บ ${todayTotal.carbs} / ${target.carbs}g | ไขมัน ${todayTotal.fat} / ${target.fat}g`
    );
  } else {
    lines.push(
      `- สถานะโภชนาการวันนี้ (${summary.date}): กินแล้ว ${todayTotal.calories} kcal | โปรตีน ${todayTotal.protein}g | คาร์บ ${todayTotal.carbs}g | ไขมัน ${todayTotal.fat}g (หมายเหตุ: ผู้ใช้ยังไม่มีโปรแกรม Active อย่ามโนเป้าหมาย ให้แสดงยอดสะสมจริง และชวนผู้ใช้สร้างโปรแกรมเมื่อพร้อม)`
    );
  }

  if (items && items.length > 0) {
    lines.push(`- รายการอาหารที่บันทึกแล้ววันนี้ (${items.length} รายการ):`);
    items.forEach((it, idx) => {
      lines.push(
        `  ${idx + 1}. [${it.time}] ${it.menu} (${it.portion || "1 จาน"}): ~${it.calories} kcal, P:${it.protein}g, C:${it.carbs}g, F:${it.fat}g [ID: ${it.id}]`
      );
    });
  } else {
    lines.push("- วันนี้ยังไม่ได้บันทึกรายการอาหารใดๆ");
  }

  if (pending) {
    lines.push(
      `- [มื้อที่รอยืนยัน]: เมนู "${pending.menu}" (${pending.portion || "1 จาน"}), ประมาณ ${pending.calories} kcal (P:${pending.protein}g, C:${pending.carbs}g, F:${pending.fat}g) [ความมั่นใจ: ${pending.confidence}]`
    );
  }

  return lines.join("\n");
}

// ---------- สรุปแผนเข้า prompt ----------
const STATUS_TH: Record<PlanDayStatus, string> = {
  pending: "รอซ้อม",
  done: "ซ้อมแล้ว",
  missed: "พลาด",
  rest: "วันพัก",
  planned: "รอซ้อม",
  skipped: "พลาด",
  moved: "ย้ายวันแล้ว",
  postponed: "ขอเลื่อน",
};

function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function buildPlanContext(
  plan: CoachPlan | undefined,
  logs: WorkoutLog[] | undefined,
  extra: CoachProfileExtra | undefined,
  today: string,
  pastPlans?: CoachPlan[]
): string {
  const lines: string[] = [];

  if (extra && (extra.occupation || extra.workEndTime || extra.preferredWorkoutTime)) {
    lines.push(
      `- ข้อมูลเพิ่มจากการซักประวัติ: อาชีพ ${extra.occupation || "-"} | เลิกงาน ${extra.workEndTime || "-"} | เวลาที่ซ้อมได้ ${extra.preferredWorkoutTime || "-"}`
    );
  }

  if (!plan) {
    lines.push("- ปัจจุบันยังไม่มีโปรแกรมที่ active ในระบบ (สามารถสร้างโปรแกรมใหม่ได้เมื่อ intakeComplete = true)");
  } else {
    lines.push(`- โปรแกรมที่ Active ในปัจจุบัน: "${plan.title}" (ID: ${plan.id}, สถานะ: ${plan.status || "active"})`);
    lines.push(`  • เป้าหมาย: ${plan.goal}`);
    lines.push(`  • ระยะเวลา: ${plan.startDate} ถึง ${plan.endDate} (${plan.durationWeeks || "?"} สัปดาห์, ซ้อม ${plan.daysPerWeek || "?"} วัน/สัปดาห์)`);

    if (today < plan.startDate) {
      lines.push(`  • ตำแหน่งปัจจุบัน: ยังไม่ถึงวันเริ่มโปรแกรม (จะเริ่มวันที่ ${plan.startDate})`);
    } else if (today > plan.endDate) {
      lines.push(`  • ตำแหน่งปัจจุบัน: โปรแกรมสิ้นสุดแล้วเมื่อวันที่ ${plan.endDate}`);
    } else {
      const startMs = new Date(plan.startDate).getTime();
      const todayMs = new Date(today).getTime();
      const endMs = new Date(plan.endDate).getTime();
      const currentDayNumber = Math.floor((todayMs - startMs) / 86400000) + 1;
      const totalDays = Math.floor((endMs - startMs) / 86400000) + 1;
      const currentWeek = Math.floor((currentDayNumber - 1) / 7) + 1;
      const totalWeeks = Math.ceil(totalDays / 7);
      lines.push(`  • ตำแหน่งปัจจุบันของวันนี้ (${today}): วันที่ ${currentDayNumber}/${totalDays} ของโปรแกรม (สัปดาห์ที่ ${currentWeek}/${totalWeeks})`);
    }

    if (plan.phases && plan.phases.length > 0) {
      lines.push(`  • เฟส: ${plan.phases.map((p) => `${p.name} ${p.weeks} สัปดาห์ (${p.focus})`).join(" -> ")}`);
    }

    if (plan.dailyNutritionTarget) {
      const nt = plan.dailyNutritionTarget;
      lines.push(`  • เป้าโภชนาการประจำโปรแกรม: วันซ้อม ${nt.calories} kcal (P: ${nt.protein}g / C: ${nt.carbs}g / F: ${nt.fat}g)${nt.restDayCalories ? ` | วันพัก ${nt.restDayCalories} kcal (P: ${nt.restDayProtein || nt.protein}g / C: ${nt.restDayCarbs || nt.carbs}g / F: ${nt.restDayFat || nt.fat}g)` : ""}`);
    }

    // Schedule for today
    const todayDay = plan.days.find((d) => d.date === today);
    if (todayDay) {
      const isRest = todayDay.type === "rest" || todayDay.isRestDay;
      const exList = todayDay.exercises.map((e) => `${e.nameTh || e.name} (${e.sets}x${e.reps}${e.suggestedWeight ? " @" + e.suggestedWeight : ""})`).join(", ");
      lines.push(`  • [ตารางของวันนี้ ${today}]: ${isRest ? "🛌 วันพักฟื้น (rest)" : "🏋️ วันซ้อม (workout)"} - ${todayDay.title} [สถานะ: ${todayDay.status}]`);
      if (!isRest && exList) lines.push(`    ท่าซ้อมวันนี้: ${exList}`);
      if (todayDay.coachNote) lines.push(`    คำแนะนำโค้ชวันนี้: ${todayDay.coachNote}`);
      if (todayDay.nutritionTarget) {
        lines.push(`    เป้าโภชนาการวันนี้: ${todayDay.nutritionTarget.calories} kcal (P: ${todayDay.nutritionTarget.protein}g / C: ${todayDay.nutritionTarget.carbs}g / F: ${todayDay.nutritionTarget.fat}g)`);
      }
    }

    // 1. Current Week Status Breakdown (จันทร์ ถึง อาทิตย์ ของสัปดาห์ปัจจุบัน)
    const todayObj = new Date(today + "T00:00:00Z");
    const dayOfWeek = todayObj.getUTCDay(); // 0 is Sun, 1 is Mon
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const mondayObj = new Date(todayObj);
    mondayObj.setUTCDate(todayObj.getUTCDate() + diffToMonday);

    const weekDates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(mondayObj);
      d.setUTCDate(mondayObj.getUTCDate() + i);
      weekDates.push(d.toISOString().slice(0, 10));
    }

    const thaiDays = ["จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส.", "อา."];
    lines.push(`- [ภาพรวมสถานะสัปดาห์นี้ (${weekDates[0]} ถึง ${weekDates[6]})]:`);
    let weekWorkouts = 0;
    let weekDone = 0;
    for (let i = 0; i < 7; i++) {
      const dt = weekDates[i];
      const d = plan.days.find((item) => item.date === dt);
      const isT = dt === today;
      if (d) {
        const isRest = d.type === "rest" || d.isRestDay;
        if (!isRest) weekWorkouts++;
        if (d.status === "done") weekDone++;
        const markedStr = d.markedBy ? ` (บันทึกโดย: ${d.markedBy === "coach" ? "โค้ช" : "ผู้ใช้"})` : "";
        const timeStr = d.completedAt ? ` [เสร็จ: ${d.completedAt}]` : "";
        const noteStr = d.userNote ? ` โน้ต: "${d.userNote}"` : "";
        lines.push(`  • ${thaiDays[i]} ${dt}${isT ? " (วันนี้)" : ""}: [${d.status.toUpperCase()}] ${isRest ? "🛌 วันพักฟื้น" : "🏋️ " + d.title}${markedStr}${timeStr}${noteStr}`);
      } else {
        lines.push(`  • ${thaiDays[i]} ${dt}${isT ? " (วันนี้)" : ""}: ไม่มีตาราง`);
      }
    }
    lines.push(`  สรุปสัปดาห์นี้: ซ้อมเสร็จแล้ว ${weekDone}/${weekWorkouts} ครั้ง`);

    // 2. Yesterday pending workout check
    const yesterday = addDays(today, -1);
    const yDay = plan.days.find((d) => d.date === yesterday);
    if (yDay && yDay.status === "pending" && !yDay.isRestDay && yDay.type !== "rest") {
      lines.push(
        `⚠️ [เตือนสำคัญ]: เมื่อวาน (${yesterday}) มีโปรแกรมซ้อม "${yDay.title}" แต่สถานะยังเป็น pending และผู้ใช้ยังไม่ได้รายงานผล! ให้โค้ชถามอย่างอบอุ่นและสนับสนุนในข้อความนี้ เช่น "เมื่อวานเป็นอย่างไรบ้างครับ ได้ซ้อมไหม?" แล้วรอฟังคำตอบเพื่อบันทึกสถานะผ่าน set_day_status (done/missed/rest) ห้ามติ๊ก missed เองโดยไม่ถามผู้ใช้ก่อนเด็ดขาด!`
      );
    }

    // 3. Consecutive missed workouts check
    let consecutiveMissed = 0;
    const sortedPastDays = plan.days
      .filter((d) => d.date < today && !d.isRestDay && d.type !== "rest")
      .sort((a, b) => b.date.localeCompare(a.date));

    for (const d of sortedPastDays) {
      if (d.status === "missed") {
        consecutiveMissed++;
      } else {
        break;
      }
    }

    if (consecutiveMissed >= 2) {
      lines.push(
        `⚠️ [เตือนสำคัญ]: ผู้ใช้พลาดการซ้อมติดต่อกัน ${consecutiveMissed} วัน! ให้โค้ชพูดคุยด้วยความเข้าอกเข้าใจ ไม่ตัดสิน ไม่ทำให้รู้สึกผิด และเสนอทบทวนปรับตารางโปรแกรมให้เหมาะกับภารกิจชีวิตจริง (เช่น เสนอลดวันซ้อม หรือลดเวลาต่อครั้ง) โดยต้องอธิบายเหตุผลและรอความยินยอม/การยืนยันจากผู้ใช้ก่อนแก้โปรแกรมเสมอ!`
      );
    }

    const from = addDays(today, -2);
    const to = addDays(today, 5);
    const near = plan.days.filter((d) => d.date >= from && d.date <= to);
    if (near.length) {
      lines.push("- ตารางวันใกล้ๆ นี้ (ย้อนหลัง 2 วัน ถึงล่วงหน้า 5 วัน):");
      for (const d of near) {
        const isRest = d.type === "rest" || d.isRestDay;
        const ex = isRest ? "" : d.exercises.slice(0, 4).map((e) => `${e.nameTh || e.name} ${e.sets}x${e.reps}`).join(", ");
        lines.push(`  • ${d.date} [${STATUS_TH[d.status] || d.status}] ${isRest ? "🛌 วันพัก" : "🏋️ " + d.title}${ex ? ": " + ex : ""}`);
      }
    }
  }

  if (pastPlans && pastPlans.length > 0) {
    const replaced = pastPlans.filter((p) => p.status === "replaced");
    if (replaced.length > 0) {
      lines.push(`- มีโปรแกรมเดิมในประวัติที่ถูกแทนที่ (replaced): ${replaced.length} โปรแกรม (${replaced.map((p) => `"${p.title}"`).join(", ")})`);
    }
  }

  const recent = (logs || []).slice(-5);
  if (recent.length) {
    lines.push("- ผลซ้อมล่าสุด:");
    for (const l of recent) {
      const ex = (l.exercises || []).slice(0, 4).map((e) => `${e.name} ${e.weight || ""} ${e.reps || ""}`.trim()).join(", ");
      lines.push(`  • ${l.date} ${l.completed ? "ทำครบ" : "ไม่ครบ"}${l.rpe ? ` RPE ${l.rpe}` : ""}${l.feeling ? ` รู้สึก${l.feeling}` : ""}${ex ? " | " + ex : ""}`);
    }
  }
  return lines.join("\n");
}

// ---------- สรุปสถานะการซักประวัติ (Intake) เข้า prompt ----------
export function buildIntakeContext(
  intake: CoachIntake | undefined,
  profile: UserProfile | undefined,
  extra: CoachProfileExtra | undefined
): string {
  const synced = syncIntakeWithProfile(intake, profile, extra);
  const a = synced.answers;
  const estNutrition = calculateEstimatedNutrition(profile, a);

  const lines: string[] = [
    `=== ระบบซักประวัติก่อนสร้างโปรแกรม (INTAKE ASSESSMENT STATUS) ===`,
    `- สถานะ Intake: ${
      synced.intakeComplete
        ? "✅ เสร็จสมบูรณ์แล้ว (intakeComplete = true) พร้อมเข้าสู่ขั้นตอนสร้างโปรแกรมการฝึกและโภชนาการ (4 ขั้นตอน)"
        : synced.status === "pending_confirmation"
        ? "⏳ ข้อมูล 1-7 ครบแล้ว อยู่ในขั้นตอนสรุปให้ผู้ใช้ยืนยัน 1 ข้อความ ('โค้ชเข้าใจว่า... ถูกไหมครับ')"
        : "📝 กำลังซักประวัติ (in_progress) ต้องถามข้อมูลให้ครบก่อน"
    }`,
  ];

  if (synced.isUrgentPlan) {
    lines.push(`- [โหมดเร่งด่วน]: ผู้ใช้ขอแผนวันนี้ ถามเฉพาะข้อ 6 (เวลาที่มี) และข้อ 10 (อาการเจ็บ/ข้อจำกัด) แล้วให้แผนสั้นได้เลย`);
  }

  const q1 = a.goalDetails ? `✅ ตอบแล้ว: "${a.goalDetails}"` : `❌ ยังไม่ได้ตอบ`;
  const q2 = a.occupation ? `✅ ตอบแล้ว: "${a.occupation}"` : `❌ ยังไม่ได้ตอบ`;
  const q3 = a.workEndTime ? `✅ ตอบแล้ว: "${a.workEndTime}"` : `❌ ยังไม่ได้ตอบ`;
  const q4 = a.workoutLocation ? `✅ ตอบแล้ว: "${a.workoutLocation}"` : `❌ ยังไม่ได้ตอบ`;
  const q5 = (a.workoutLocation && (a.workoutLocation.includes("gym") || a.workoutLocation.includes("ยิม")))
    ? `✅ ตอบแล้ว: ยิม (มีอุปกรณ์พร้อม)`
    : (a.equipment && a.equipment.length > 0)
    ? `✅ ตอบแล้ว: ${a.equipment.join(", ")}`
    : `❌ ยังไม่ได้ตอบ`;
  const q6 = (a.availableTimePerDay || a.preferredWorkoutTime)
    ? `✅ ตอบแล้ว: ว่าง ${a.availableTimePerDay || "-"} สะดวก ${a.preferredWorkoutTime || "-"}`
    : `❌ ยังไม่ได้ตอบ`;
  const q7 = a.daysPerWeek ? `✅ ตอบแล้ว: ${a.daysPerWeek} วัน/สัปดาห์` : `❌ ยังไม่ได้ตอบ`;
  const q8 = a.programDuration ? `✅ ตอบแล้ว: "${a.programDuration}"` : `⚪ ยังไม่ระบุ (ถ้าไม่ระบุ ให้โค้ชแจ้งว่าจะประเมินให้ตามความเหมาะสม)`;
  const q9 = a.experienceLevel ? `✅ ตอบแล้ว: "${a.experienceLevel}"` : `⚪ ยังไม่ระบุ (ค่าเริ่มต้น: '${profile?.fitnessLevel || "มือใหม่ / ระดับทั่วไป"}')`;
  const q10 = a.injuriesOrLimitations !== undefined ? `✅ ตอบแล้ว: "${a.injuriesOrLimitations}"` : `⚪ ยังไม่ระบุ (ถามแบบเลือกตอบได้ ข้ามได้ ค่าเริ่มต้น: 'ไม่มี')`;
  const q11 = a.dietaryRestrictions !== undefined ? `✅ ตอบแล้ว: "${a.dietaryRestrictions}"` : `⚪ ยังไม่ระบุ (ถามแบบข้ามได้ ค่าเริ่มต้น: 'ไม่มี')`;

  lines.push(`- รายละเอียด 11 ข้อ:`);
  lines.push(`  ข้อ 1. เป้าหมายละเอียด: ${q1}`);
  lines.push(`  ข้อ 2. อาชีพ/ลักษณะงาน: ${q2}`);
  lines.push(`  ข้อ 3. เวลาเลิกงาน: ${q3}`);
  lines.push(`  ข้อ 4. สถานที่ซ้อมหลัก: ${q4}`);
  lines.push(`  ข้อ 5. อุปกรณ์ที่มี: ${q5}`);
  lines.push(`  ข้อ 6. เวลาว่างต่อวัน & เวลาที่สะดวกซ้อม: ${q6}`);
  lines.push(`  ข้อ 7. จำนวนวันที่ซ้อมได้ต่อสัปดาห์: ${q7}`);
  lines.push(`  ข้อ 8. ระยะเวลาโปรแกรมที่ต้องการ: ${q8}`);
  lines.push(`  ข้อ 9. ประสบการณ์ซ้อมที่ผ่านมา: ${q9}`);
  lines.push(`  ข้อ 10. อาการบาดเจ็บ/ข้อจำกัดร่างกาย: ${q10}`);
  lines.push(`  ข้อ 11. ข้อจำกัดเรื่องอาหาร: ${q11}`);

  lines.push(`- ข้อที่ยังรอคำตอบ: ${synced.pendingQuestions.length > 0 ? synced.pendingQuestions.join(", ") : "ไม่มี (ครบแล้ว)"}`);

  lines.push(`\n[ค่าอ้างอิงโภชนาการคำนวณตามวิทยาศาสตร์ (BMR: ${estNutrition.bmr} kcal, TDEE: ${estNutrition.tdee} kcal)]:`);
  lines.push(`- เป้าหมายวันซ้อม: ${estNutrition.targetCalories} kcal (โปรตีน ${estNutrition.proteinGrams}g, คาร์บ ${estNutrition.carbsGrams}g, ไขมัน ${estNutrition.fatGrams}g)`);
  lines.push(`- เป้าหมายวันพัก: ${estNutrition.restDayCalories} kcal (โปรตีน ${estNutrition.restDayProteinGrams}g, คาร์บ ${estNutrition.restDayCarbsGrams}g, ไขมัน ${estNutrition.restDayFatGrams}g)`);
  if (estNutrition.safetyNotes.length) {
    lines.push(`- ข้อควรระวังความปลอดภัย: ${estNutrition.safetyNotes.join(", ")}`);
  }

  lines.push(`\n**คำสั่งปฏิบัติการสำหรับโค้ช AI ในการสร้างโปรแกรม (เมื่อ intakeComplete = true)**:`);
  lines.push(`1. **ขั้นที่ 1: ประเมินก่อนสร้าง**:`);
  lines.push(`   - ประเมินความเป็นไปได้เทียบกับเวลา ถ้าเป้าหมายไม่สมจริง (เช่น "อยากหุ่นแบบ Tom Holland ใน 1 เดือน" หรือ "ลด 10 โลใน 1 เดือน") ให้บอกตรงๆ อย่างสุภาพ ไม่สัญญาเกินจริง เสนอระยะเวลาที่สมจริงและเป้าหมายเฟสแรกแทน`);
  lines.push(`   - ถ้าโปรแกรมยาวเกิน 4 สัปดาห์ ให้แบ่งเป็นเฟส (เช่น ปรับตัว / เพิ่มความหนัก / ทบทวน) และบอกว่าจะทบทวนตอนสิ้นแต่ละเฟส`);
  lines.push(`2. **ขั้นที่ 2: ตารางซ้อม**:`);
  lines.push(`   - สร้างตารางรายวันตลอดทั้งโปรแกรม เริ่มตั้งแต่วันถัดไป`);
  lines.push(`   - กำหนดวันซ้อมและวันพักให้ตรงกับ daysPerWeek (${a.daysPerWeek || 3} วัน/สัปดาห์)`);
  lines.push(`   - วันซ้อมระบุ: ชื่อวัน, ท่า, เซ็ต x เรป, เวลาพัก, ระยะเวลารวม โดยคำนึงถึงสถานที่ อุปกรณ์ เวลาว่าง และหลีกเลี่ยงจุดเจ็บเด็ดขาด ค่อยๆ เพิ่มความหนัก`);
  lines.push(`   - วันพักระบุคำแนะนำสั้นๆ (เดินเบาๆ ยืดเหยียด) และย้ำว่ายังคุมอาหาร`);
  lines.push(`3. **ขั้นที่ 3: เป้าหมายโภชนาการรายวัน**:`);
  lines.push(`   - โค้ชไม่กำหนดเมนู กำหนดเฉพาะเป้าหมายต่อวัน: แคลอรี่ (kcal), โปรตีน (g), คาร์บ (g), ไขมัน (g)`);
  lines.push(`   - คำนวณจากค่าอ้างอิงด้านบน ห้ามต่ำกว่าเพดานปลอดภัย (หญิง >= 1200, ชาย >= 1500 kcal/วัน) และอัตราลดน้ำหนักปลอดภัยไม่เกิน 0.5-1 กก./สัปดาห์`);
  lines.push(`   - คำนึงถึงข้อจำกัดอาหาร (dietaryRestrictions) ในคำแนะนำ`);
  lines.push(`4. **ขั้นที่ 4: ยืนยันก่อนบันทึก**:`);
  lines.push(`   - สรุปโปรแกรมให้ผู้ใช้ดูใน LINE เป็นข้อความสั้นๆ อ่านง่ายบนมือถือ: เป้าหมาย, ระยะเวลา, จำนวนวันซ้อม, ตัวอย่างสัปดาห์แรก, เป้าแคลอรี่และแมโครต่อวัน`);
  lines.push(`   - ถามว่าต้องการปรับอะไรไหม ถ้าผู้ใช้ขอปรับ (เช่น เบาลง, ซ้อมน้อยลง 1 วัน) ให้ปรับแล้วอธิบายสิ่งที่เปลี่ยนและเหตุผล`);
  lines.push(`   - **บันทึกลง DB ผ่าน save_plan เมื่อผู้ใช้ยืนยันแล้วเท่านั้น (ห้ามเรียก save_plan ก่อนผู้ใช้ยืนยัน)**`);
  lines.push(`   - ถ้ามีโปรแกรม active อยู่แล้ว ให้ถามยืนยันแทนที่โปรแกรมเดิมก่อน (โปรแกรมเดิมจะเปลี่ยนเป็น replaced โดยไม่ถูกลบ)`);

  return lines.join("\n");
}
