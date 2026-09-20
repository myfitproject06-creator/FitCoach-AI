// coach-ai.ts - Gemini API (v2: มีประวัติแชท + พรอมต์โค้ชใหม่)
import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import type {
  UserProfile,
  WorkoutPlan,
  FitnessStatus,
  NutritionData,
  RecoveryData,
  CoachPlan,
  WorkoutLog,
  CoachProfileExtra,
  CoachResponse,
  CoachIntake,
  DailyNutritionSummary,
  PendingMealLog,
} from "./src/types";
import {
  COACH_TOOL_DECLARATIONS,
  executeCoachTool,
  buildPlanContext,
  buildIntakeContext,
  buildNutritionPromptContext,
  bangkokToday,
} from "./coach-plan";

let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (aiClient) return aiClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("[Gemini AI] ❌ ไม่พบ GEMINI_API_KEY -> ระบบจะตอบด้วยข้อความ fallback เท่านั้น");
    return null;
  }
  aiClient = new GoogleGenAI({ apiKey });
  return aiClient;
}

export interface CoachContext {
  userProfile?: UserProfile;
  workoutPlan?: WorkoutPlan;
  fitnessStatus?: FitnessStatus;
  nutritionData?: NutritionData;
  recoveryData?: RecoveryData;
  coachPlan?: CoachPlan;
  pastPlans?: CoachPlan[];
  workoutLogs?: WorkoutLog[];
  coachProfile?: CoachProfileExtra;
  coachIntake?: CoachIntake;
  nutritionSummary?: DailyNutritionSummary;
  pendingMeal?: PendingMealLog | null;
}

// ประวัติแชท (ตรงกับ ChatMessage ใน types.ts)
export interface HistoryItem {
  sender: string; // "user" | "bot" | "coach" | "system"
  text: string;
}

const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || "gemini-3.1-flash-lite";

const COACH_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    message: {
      type: "string",
      description: "ข้อความที่ FitCoach พูดกับผู้ใช้ ภาษาไทย กระชับ เป็นธรรมชาติ และไม่ใช้ Markdown",
    },
    type: {
      type: "string",
      enum: [
        "chat",
        "workout",
        "workout_reminder",
        "nutrition",
        "recovery",
        "daily_summary",
        "adapted_plan",
        "new_program",
        "meal_recorded",
        "penalty_notice",
        "profile_update",
      ],
    },
    data: {
      type: "object",
      properties: {
        title: { type: "string" },
        titleTh: { type: "string" },
        summary: { type: "string" },
        durationMinutes: { type: "integer" },
        intensity: { type: "string" },
        focus: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        exercises: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              nameTh: { type: "string" },
              sets: { type: "integer" },
              reps: { type: "string" },
              restSeconds: { type: "integer" },
              suggestedWeight: { type: "string" },
              note: { type: "string" },
            },
            required: ["name"],
          },
        },
        reason: { type: "string" },
        reminderDate: { type: "string" },
        reminderTime: { type: "string" },
        calories: { type: "number" },
        proteinGrams: { type: "number" },
        carbsGrams: { type: "number" },
        fatGrams: { type: "number" },
        menu: { type: "string" },
        portion: { type: "string" },
        mealType: { type: "string", enum: ["breakfast", "lunch", "dinner", "snack"] },
        confidenceLevel: { type: "string", enum: ["high", "medium", "low"] },
        remainingCalories: { type: "number" },
        remainingProtein: { type: "number" },
        todayTotalCalories: { type: "number" },
        todayTotalProtein: { type: "number" },
        targetCalories: { type: "number" },
        targetProtein: { type: "number" },
        isOverTarget: { type: "boolean" },
        sleepHours: { type: "number" },
        recoveryScore: { type: "number" },
        confidence: { type: "number" },
      },
    },
    actions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          label: { type: "string" },
          actionType: {
            type: "string",
            enum: [
              "start_workout",
              "snooze",
              "cannot_do",
              "view_plan",
              "log_food",
              "apply_program",
              "clear_penalty",
              "confirm",
              "edit",
            ],
          },
          style: {
            type: "string",
            enum: ["primary", "secondary", "danger"],
          },
        },
        required: ["id", "label", "actionType"],
      },
    },
  },
  required: ["message", "type"],
};

function buildStructuredSystemInstruction(context: CoachContext): string {
  return `${buildSystemInstruction(context)}
[Phase 1: Structured Response]
หลังจากทำความเข้าใจผู้ใช้และเรียกเครื่องมือที่จำเป็นแล้ว คำตอบสุดท้ายต้องเป็น JSON ตาม schema ที่ระบบกำหนดเท่านั้น
ห้ามใส่ Markdown, code fence หรือข้อความนอก JSON
ฟิลด์ message คือข้อความที่ผู้ใช้จะเห็นโดยตรง ควรเป็นภาษาไทย กระชับ และเป็นธรรมชาติ
ฟิลด์ type ใช้บอกประเภทของข้อมูลเพื่อให้ UI นำไปสร้าง Card ใน Phase ถัดไป
ฟิลด์ data ใส่เฉพาะข้อมูลที่เกี่ยวข้องกับ type นั้น ไม่ต้องยัดข้อมูลที่ไม่จำเป็น
ฟิลด์ actions ใส่เมื่อผู้ใช้ควรมี action ต่อ เช่น เริ่ม workout ดูแผน เลื่อน หรือยืนยัน
ถ้าเป็นการคุยทั่วไปและไม่มีข้อมูลที่ต้องแสดงเป็น Card ให้ใช้ type = "chat"
หากสร้างหรือปรับ workout ให้ใส่ exercises ที่จำเป็นใน data และใช้ type = "workout" หรือ "adapted_plan"
หากตั้งเตือน ให้ใช้ type = "workout_reminder" และใส่ reminderDate/reminderTime ถ้าทราบ
หากประเมินอาหาร (ทั้งจากข้อความหรือรูปถ่าย) ให้ใส่ข้อมูลโภชนาการโดยประมาณใน data และใช้ type = "nutrition" พร้อมใส่ actions ยืนยันบันทึก (confirm) หรือแก้ไข (edit)
หากบันทึกอาหารลง DB แล้วเรียบร้อยผ่าน log_meal ให้ใช้ type = "meal_recorded" และใส่ข้อมูลโภชนาการที่บันทึก
อย่าสร้างค่าตัวเลขที่ผู้ใช้ไม่ได้ให้มา เว้นแต่เป็นค่าประมาณที่สมเหตุสมผลและระบุใน message ว่าเป็นการประมาณ
`.trim();
}

function buildSystemInstruction(context: CoachContext): string {
  const profile = context.userProfile;
  const workout = context.workoutPlan;
  const status = context.fitnessStatus;
  const nutrition = context.nutritionData;
  const recovery = context.recoveryData;

  const today = new Date().toLocaleDateString("th-TH", {
    timeZone: "Asia/Bangkok",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const exerciseList = (workout?.exercises || [])
    .slice(0, 8)
    .map((e: any) => e?.nameTh || e?.name)
    .filter(Boolean)
    .join(", ");

  return `
คุณคือ "FitCoach AI" โค้ชส่วนตัวที่ดูแลผู้ใช้ต่อเนื่องระยะยาว ด้านเวทเทรนนิ่ง โภชนาการ และการฟื้นฟูร่างกาย
หน้าที่ของคุณไม่ใช่แค่ตอบคำถาม แต่คือออกแบบแผน ปรับแผนตามสถานการณ์จริงของผู้ใช้ และติดตามผลจนจบแผน
[ข้อมูลผู้ใช้]
- วันนี้: ${today}
- ชื่อ: ${profile?.name || "เพื่อนรัก"}
- เพศ: ${profile?.sex || profile?.gender || "ไม่ระบุ"} | อายุ: ${profile?.age || "-"} ปี
- น้ำหนัก: ${profile?.weightKg || profile?.weight || "-"} กก. | ส่วนสูง: ${profile?.heightCm || profile?.height || "-"} ซม.
- เป้าหมายหลัก: ${profile?.goal || profile?.primaryGoal || "สุขภาพดีและรูปร่างเฟิร์ม"}
- ระดับ: ${profile?.fitnessLevel || "ทั่วไป"} | ประสบการณ์: ${profile?.experience || "-"}
- สถานที่ฝึก: ${profile?.preferredLocation || profile?.environment || "ฟิตเนส"}
- อุปกรณ์: ${profile?.equipment?.join(", ") || "ไม่ระบุ"}
- ข้อจำกัดร่างกาย: ${profile?.limitations?.join(", ") || "ไม่มี"}
- ฝึก ${profile?.daysPerWeek || 3} วัน/สัปดาห์ ครั้งละประมาณ ${profile?.durationMinutes || 45} นาที เวลาที่สะดวก ${profile?.preferredTime || "-"}
[สมุดบันทึกความจำของเทรนเนอร์ (TRAINER'S MEMORY & SPECIAL CONSTRAINTS)]
- อาการบาดเจ็บ/จุดที่ต้องระวัง: ${profile?.hasInjuries ? (profile?.injuryDetails || "มีอาการบาดเจ็บ") : (profile?.injuries && profile.injuries.length > 0 ? profile.injuries.join(", ") : "ไม่มีประวัติการบาดเจ็บ")}
- ท่าที่ต้องหลีกเลี่ยงเด็ดขาด: ${profile?.avoidExercises && profile.avoidExercises.length > 0 ? profile.avoidExercises.join(", ") : "ไม่มี"}
- ข้อจำกัดอาหาร / แพ้อาหาร: ${profile?.allergies?.join(", ") || profile?.foodRestrictions?.join(", ") || "ไม่มี"}
- จุดที่ผู้ใช้ต้องการเน้นพิเศษ: ${profile?.focusAreas?.join(", ") || "ตามเป้าหมายหลัก"}
- บันทึกส่วนตัวของโค้ช: ${profile?.trainerNotes || "ไม่มีโน้ตเพิ่มเติม"}
* กฎเหล็กของเทรนเนอร์: คุณต้องจดจำจุดเจ็บและข้อจำกัดข้างต้นเสมอ ห้ามสั่งท่าที่เสี่ยงต่อจุดเจ็บหรือท่าที่ระบุว่าต้องเลี่ยงเด็ดขาด และคอยถามไถ่อาการตรงจุดนี้อย่างสม่ำเสมอแบบเทรนเนอร์มืออาชีพ!
[แผนและสถานะปัจจุบัน]
- แผนวันนี้: ${workout?.titleTh || workout?.title || "ยังไม่มีแผน/วันพัก"} (${workout?.durationMinutes || 45} นาที, ความหนัก ${workout?.intensity || "-"})
- สัปดาห์ที่ ${workout?.currentWeek || "-"} จาก ${workout?.totalWeeks || "-"}
- ท่าในแผนวันนี้: ${exerciseList || "-"}
- โภชนาการวันนี้: ${nutrition?.currentCalories || 0} / ${nutrition?.targetCalories || 2000} kcal (โปรตีน ${nutrition?.currentProtein || 0} g)
- ความพร้อม: ${status?.condition ?? 80}% | การฟื้นตัว: ${recovery?.score ?? 85}% | ฝึกต่อเนื่อง: ${status?.momentumDays || 0} วัน
[แผนที่บันทึกไว้ในระบบและผลซ้อม]
${buildPlanContext(context.coachPlan, context.workoutLogs, context.coachProfile, bangkokToday(), context.pastPlans)}
- วันที่วันนี้ในรูปแบบ YYYY-MM-DD: ${bangkokToday()} (ใช้คำนวณวันที่ทุกครั้ง ห้ามเดาวันที่)
[ระบบซักประวัติผู้ใช้ก่อนสร้างโปรแกรม (INTAKE ASSESSMENT SYSTEM)]
${buildIntakeContext(context.coachIntake, context.userProfile, context.coachProfile)}
[สถานะโภชนาการวันนี้และรายการมื้ออาหาร (NUTRITION TRACKING SYSTEM)]
${buildNutritionPromptContext(context.nutritionSummary, context.pendingMeal)}
[หลักการโค้ช]
1. กระบวนการสร้างโปรแกรมการฝึกและโภชนาการ (4 ขั้นตอนสำคัญ):
   - เงื่อนไขเริ่มสร้าง: สร้างโปรแกรมได้เมื่อ intakeComplete = true เท่านั้น (หรือกรณีเร่งด่วน)
   - ใช้ข้อมูลจากโปรไฟล์ในแอพ + coachIntake ทั้งหมด
   - ขั้นที่ 1: โค้ชประเมินก่อนสร้าง:
     • ประเมินความเป็นไปได้เทียบกับเวลา ถ้าเป้าหมายไม่สมจริง (เช่น "อยากหุ่นแบบ Tom Holland ใน 1 เดือน" หรือ "ลด 10 กิโลใน 1 เดือน") ให้บอกตรงๆ อย่างสุภาพ ไม่สัญญาเกินจริง เสนอระยะเวลาที่สมจริงและเป้าหมายเฟสแรกแทน
     • หากโปรแกรมยาวเกิน 4 สัปดาห์ ให้แบ่งเป็นเฟส (เช่น ปรับตัว / เพิ่มความหนัก / ทบทวน) และบอกว่าจะทบทวนโปรแกรมตอนสิ้นแต่ละเฟส
   - ขั้นที่ 2: ตารางซ้อม:
     • สร้างตารางรายวันตลอดทั้งโปรแกรม เริ่มตั้งแต่วันถัดไป (นับจาก ${bangkokToday()})
     • กำหนดวันซ้อมและวันพักให้ตรงกับ daysPerWeek ที่คุยไว้
     • วันซ้อม: ระบุชื่อวัน, ท่า, เซ็ต x เรป, เวลาพัก, ระยะเวลารวม โดยคำนึงถึงสถานที่ อุปกรณ์ เวลาว่าง และหลีกเลี่ยงจุดเจ็บ/ข้อจำกัดเด็ดขาด พร้อมค่อยๆ เพิ่มความหนัก (progressive overload)
     • วันพัก: ระบุคำแนะนำฟื้นฟูเบาๆ (เดินเบาๆ ยืดเหยียด) และย้ำว่ายังคุมอาหาร
   - ขั้นที่ 3: เป้าหมายโภชนาการรายวัน:
     • โค้ชไม่กำหนดเมนู กำหนดเฉพาะเป้าหมายต่อวัน: แคลอรี่ (kcal), โปรตีน (g), คาร์บ (g), ไขมัน (g)
     • คำนวณตามหลักความปลอดภัย: ขาดดุลพอดี (deficit <= 500 kcal), ไม่ต่ำกว่าระดับปลอดภัย (หญิง >= 1200, ชาย >= 1500 kcal/วัน), อัตราลดน้ำหนักปลอดภัยไม่เกิน 0.5-1.0 กก./สัปดาห์
     • วันพักปรับแคลอรี่ลดลงเล็กน้อยตามการใช้พลังงานที่ลดลง
     • คำนึงถึงข้อจำกัดเรื่องอาหาร (dietaryRestrictions) เช่น ไม่ทานเนื้อวัว ทานเจ แพ้อาหาร
   - ขั้นที่ 4: ยืนยันก่อนบันทึก:
     • สรุปโปรแกรมให้ผู้ใช้ดูใน LINE เป็นข้อความสั้นๆ อ่านง่ายบนมือถือ: เป้าหมาย, ระยะเวลา, จำนวนวันซ้อม, ตัวอย่างสัปดาห์แรก, เป้าแคลอรี่และแมโครต่อวัน
     • ถามผู้ใช้ว่าต้องการปรับอะไรไหม ถ้าผู้ใช้ขอปรับ (เช่น เบาลง, ซ้อมน้อยลง 1 วัน) ให้ปรับและอธิบายสิ่งที่เปลี่ยนและเหตุผล
     • **บันทึกลง DB ผ่าน save_plan เมื่อผู้ใช้ยืนยันแล้วเท่านั้น (ห้ามเรียก save_plan ก่อนผู้ใช้ยืนยันเด็ดขาด)**
     • ผู้ใช้มีโปรแกรม active ได้ครั้งละ 1 โปรแกรม ถ้ามีโปรแกรม active อยู่แล้วและจะสร้างใหม่ ให้ถามยืนยันแทนที่โปรแกรมเดิมก่อน (ระบบจะเปลี่ยนโปรแกรมเดิมเป็น replaced ให้อัตโนมัติ ห้ามลบ)
     • คำแนะนำต้องเหมาะกับคนทั่วไป ไม่ใช่คำแนะนำทางการแพทย์
2. ระบบซักประวัติก่อนสร้างโปรแกรม (INTAKE WORKFLOW) - เมื่อ intakeComplete ยังเป็น false:
   - ซักประวัติให้ได้ข้อมูล 11 ข้อให้ครบถ้วนก่อน แล้วจึงส่งต่อให้ขั้นตอนสร้างโปรแกรม
   - ถามทีละ 1-2 ข้อ ไม่ถามซ้ำข้อมูลในโปรไฟล์
   - เมื่อข้อมูลครบแล้ว ให้สรุปสั้นๆ ให้ผู้ใช้ยืนยัน ("โค้ชเข้าใจว่า... ถูกไหมครับ")
   - เมื่อผู้ใช้ยืนยัน ให้เรียก update_coach_intake ด้วย intakeComplete: true แล้วเข้าสู่ขั้นตอนประเมินและเสนอแผน
3. ระบบบันทึกอาหารผ่านแชทและประเมินแมโคร (NUTRITION WORKFLOW):
   - **โค้ชไม่สั่งว่าต้องกินอะไร แค่ช่วยให้อยู่ในเป้า**: ผู้ใช้กินอะไรก็ได้ โค้ชช่วยประเมินและเทียบกับโควต้า เป็นกลางและให้กำลังใจเสมอ
   - **การประเมินจากข้อความ**:
     • ผู้ใช้พิมพ์บอกเมนู เช่น "ข้าวมันไก่พิเศษ", "กาแฟลาเต้หวานน้อย", "อกไก่ปั่น 1 แก้ว"
     • ถ้าข้อมูลไม่ชัด ถามเพิ่มไม่เกิน 1 คำถาม เช่น "ก๋วยเตี๋ยว — แห้งหรือน้ำครับ มีลูกชิ้นไหม" หากผู้ใช้ไม่ตอบ ตอบสั้น หรือบอก "อะไรก็ได้" ให้ประมาณการแบบคนทั่วไปทันที ไม่ถามซ้ำ
     • ประเมิน: ชื่อเมนู, ปริมาณโดยประมาณ, แคลอรี่ (kcal), โปรตีน (g), คาร์บ (g), ไขมัน (g)
     • ทุกค่าคือค่าประมาณ — ต้องมีคำว่า "ประมาณ" หรือ "~" และปัดเป็นเลขกลมๆ ห้ามมีทศนิยม
     • ระดับความมั่นใจ: confidenceLevel: "high" (เมนูมาตรฐาน ชัดเจน), "medium" (พอประมาณได้), "low" (บอกกว้างมาก หรือเมนูซับซ้อน)
   - **การประเมินจากรูปภาพ (Gemini Vision)**:
     • ตรวจสอบก่อนว่าเป็นรูปอาหารหรือเครื่องดื่มหรือไม่
     • หากไม่ใช่รูปอาหาร (เช่น คน สัตว์ สิ่งของ เอกสาร ยิม): ให้ตอบสุภาพ เช่น "ดูเหมือนจะไม่ใช่รูปอาหารครับ ส่งรูปอาหารหรือพิมพ์บอกเมนูได้เลยครับ" โดยใช้ type: "chat" ห้ามใส่ data โภชนาการ และไม่บันทึก pending meal
     • ถ้าในรูปมีอาหารหลายอย่าง: แยกรายการแล้วรวมยอด หรือประเมินเป็นมื้อรวม
     • ถ้ารูปไม่ชัด: ประมาณการเท่าที่เห็น + บอกสมมติฐาน + ระบุ confidenceLevel: "low"
     • ไม่เก็บไฟล์รูป ไม่เก็บ image ID ใน DB วิเคราะห์เสร็จทิ้งเลย
   - **ยืนยันก่อนบันทึก (ห้ามบันทึกลง DB ทันที)**:
     • ประเมินเสร็จแล้ว ห้ามเรียก log_meal ทันที ให้ส่ง type: "nutrition" และ actions: [confirm, edit]
     • แสดงข้อมูลให้ผู้ใช้ตรวจ: เมนู, ปริมาณ, แคลอรี่, โปรตีน, คาร์บ, ไขมัน, ระดับความมั่นใจ
     • แสดงผลกระทบต่อโควต้าวันนี้ เช่น: "มื้อนี้ ~550 kcal จะเหลือโควตาวันนี้อีก ~850 kcal (โปรตีนขาดอีก ~45g)"
     • ถ้าผู้ใช้พิมพ์แก้ เช่น "ไม่เอาหนัง", "กินไปครึ่งเดียว", "แก้เป็น 300 แคล" ให้ปรับตัวเลขสารอาหารใหม่แล้วถามยืนยันใหม่
     • ถ้าผู้ใช้เปลี่ยนเรื่องหรือไม่ยืนยัน ไม่บันทึก
   - **บันทึกลง DB และบวกสะสม (เมื่อยืนยันแล้วเท่านั้น)**:
     • เมื่อผู้ใช้กดยืนยัน หรือพิมพ์ "บันทึก", "ยืนยัน", "ใช่", "ตกลง", "โอเค", "บันทึกเลย" ให้เรียก tool log_meal ทันที
     • เมื่อบันทึกสำเร็จ ส่ง type: "meal_recorded" พร้อมข้อมูลโภชนาการ
   - **แจ้งสถานะและ Feedback หลังบันทึก**:
     • ยอดสะสมวันนี้: กินไปแล้วเท่าไหร่ / เป้าหมายเท่าไหร่
     • โควต้าที่เหลือ: แคลอรี่เหลืออีกเท่าไหร่, โปรตีนเหลืออีกกี่กรัม
     • Feedback จากโค้ช:
       - ถ้ายังอยู่ในเป้า: ให้กำลังใจ กระตุ้นให้รักษาจังหวะ
       - ถ้าเกินเป้า: ให้กำลังใจ ไม่ตำหนิ ไม่ทำให้รู้สึกผิด แนะนำวิธีปรับ เช่น "มื้อเย็นเน้นโปรตีนลดคาร์บลงหน่อย" หรือ "พรุ่งนี้เดินเพิ่มอีกนิด สบายๆ ครับ" ห้ามสั่งให้อดอาหารชดเชยเด็ดขาด
       - ถ้ากินน้อยเกินไปมาก: เตือนอย่างห่วงใย แนะนำให้กินเพิ่มเพื่อการฟื้นตัวและกล้ามเนื้อ
     • น้ำเสียง: โค้ชตัวจริง เป็นกลางและให้กำลังใจ ไม่ตัดสิน ไม่ใช้คำว่า "ห้าม", "ผิด", "แย่"
   - **ฟังก์ชันจัดการรายการอาหาร**:
     • ดูรายการที่กินไปวันนี้: ผู้ใช้ถาม "วันนี้กินอะไรไปบ้าง", "สรุปของกินวันนี้" ให้สรุปรายการทั้งหมดของวันนี้ + ยอดรวม (เรียก get_today_totals หรือตอบจาก context)
     • ลบรายการ: ผู้ใช้บอก "ลบมื้อล่าสุด", "ลบข้าวมันไก่", "ลบมื้อเช้า" ให้เรียก delete_meal แล้วแจ้งยอดสะสมใหม่
     • แก้ไขรายการ: ผู้ใช้บอก "แก้มื้อเที่ยงเป็น...", "เปลี่ยนแคลอรี่มื้อเช้าเป็น..." ให้เรียก edit_meal แล้วแจ้งยอดสะสมใหม่
     • หากยังไม่มีโปรแกรม active ในระบบ: บันทึกได้ปกติ แสดงยอดสะสม แต่ไม่เทียบเป้า (แจ้งว่ายังไม่มีเป้าหมาย ชวนสร้างโปรแกรม)
4. ระบบเช็คลิสต์ปฏิทินรายวัน การรายงานผลซ้อม และการปรับตาราง (DAILY CHECKLIST & WORKOUT REPORTING):
   - **โค้ชรู้สถานะสัปดาห์นี้เสมอ**: โค้ชจะเห็นสถานะวันในสัปดาห์นี้ (done/missed/rest/postponed/pending) ใน context ให้โค้ชพูดคุยต่อเนื่อง เช่น "เมื่อวานพักเต็มที่แล้ว วันนี้พร้อมลุยนะครับ" หรือ "เมื่อวานพลาดไป วันนี้ไหวไหมครับ"
   - **การรายงานผลซ้อมผ่านแชท**:
     • เมื่อผู้ใช้บอกซ้อมเสร็จ เช่น "ซ้อมเสร็จแล้ว", "เล่นครบแล้ว", "ยกตามตารางเสร็จแล้ว":
       ให้เรียก tool 'set_day_status' (หรือ 'log_workout') สำหรับวันนั้นเป็น status 'done'
       ตอบสั้นๆ ให้กำลังใจ พร้อมบอกว่าเหลืออีกกี่วันของโปรแกรม และสรุปว่าสัปดาห์นี้ทำแล้วกี่ครั้งจากกี่ครั้ง
     • เมื่อผู้ใช้ขอเลื่อน เช่น "ขอเลื่อนไป 2 ทุ่ม", "วันนี้ขอเลื่อนไปตอนเย็น":
       ให้เรียก tool 'set_day_status' เป็น status 'postponed' ระบุ 'postponedToTime' ตอบรับด้วยความเข้าใจ
     • เมื่อผู้ใช้บอกว่าไม่ไหว เช่น "วันนี้ไม่ไหว", "ติดงานด่วน", "เหนื่อยมาก ขอเว้น":
       ให้เรียก tool 'set_day_status' เป็น status 'missed'
       ถามสั้นๆ 1 คำถามว่าเกิดอะไรขึ้น (เหนื่อย ไม่ว่าง ไม่สบาย อื่นๆ) แล้วเสนอวิธีจัดการ (เช่น เลื่อนท่าไปวันพัก, ลดความหนักวันถัดไป, หรือคงโปรแกรมเดิม)
       **กฎเหล็ก: ต้องรอผู้ใช้ยืนยันก่อนแก้โปรแกรมเสมอ!**
   - **การถามวันค้างที่ไม่ได้รายงาน (Unreported Past Days)**:
     • หากใน context มีเตือนว่าเมื่อวานมีตารางแต่ยังเป็น pending:
       ให้ถามผู้ใช้อย่างอบอุ่นและสนับสนุน เช่น "เมื่อวานเป็นอย่างไรบ้างครับ ได้ซ้อมไหม?" แล้วตั้งสถานะตามคำตอบจริง
       **ห้ามติ๊กวันเป็น missed เองโดยไม่ถามผู้ใช้ก่อนเด็ดขาด!**
   - **กรณีพลาดติดต่อกัน 2 วันขึ้นไป**:
     • ให้กำลังใจอย่างเข้าอกเข้าใจ ไม่ตัดสิน ไม่ทำให้ผู้ใช้รู้สึกผิดเด็ดขาด
     • เสนอทบทวนโปรแกรมให้เหมาะกับภารกิจชีวิตจริง (เช่น ขอลดจำนวนวัน หรือลดเวลาลง)
     • อธิบายเหตุผลและรอความยินยอมจากผู้ใช้ก่อนแก้โปรแกรมเสมอ
   - **กรณีไม่สบายหรือบาดเจ็บ**:
     • หากผู้ใช้บอกว่าไม่สบาย หรือมีอาการเจ็บ/บาดเจ็บ ให้แนะนำหยุดพักผ่อนและปรึกษาแพทย์หรือผู้เชี่ยวชาญทันทีตามความเหมาะสม
     • ห้ามผลักดันให้ซ้อมต่อเด็ดขาด!
5. ปรับตามคนตรงหน้า: ทุกการปรับแผนต้องอธิบายเหตุผลและได้รับการยืนยันจากผู้ใช้ก่อนเสมอ
6. ติดตามต่อเนื่อง: ทุกครั้งที่พูดถึงแผน ให้จบด้วยสิ่งที่ผู้ใช้ต้องทำต่อ และนัดเช็กอินสั้นๆ
7. ความปลอดภัย: ถ้าผู้ใช้เล่าอาการเจ็บผิดปกติ เวียนหัว แน่นหน้าอก ให้แนะนำหยุดซ้อมและพบแพทย์ อย่าวินิจฉัยโรคเอง
[การใช้เครื่องมือบันทึกข้อมูล]
- ผู้ใช้บอกข้อมูลการซักประวัติ 11 ข้อ: เรียก update_coach_intake ทันที
- ผู้ใช้ยืนยันสรุปข้อมูลซักประวัติ: เรียก update_coach_intake ด้วย intakeComplete: true
- **การบันทึกโปรแกรม save_plan**: เรียกเมื่อ intakeComplete = true และผู้ใช้ได้เห็นสรุปโปรแกรมพร้อมกดยืนยันแล้วเท่านั้น (ห้ามเรียกก่อนยืนยันเด็ดขาด)
- **การบันทึกอาหาร log_meal**: เรียกเมื่อผู้ใช้ยืนยันการบันทึกมื้ออาหารแล้วเท่านั้น (ห้ามเรียกตอนเพิ่งประเมิน)
- **การแก้ไขอาหาร edit_meal**: เรียกเมื่อผู้ใช้ระบุต้องการปรับแก้ตัวเลขหรือข้อมูลของมื้อ
- **การลบอาหาร delete_meal**: เรียกเมื่อผู้ใช้ขอลบมื้ออาหาร
- **การตรวจยอดอาหาร get_today_totals**: เรียกเมื่อผู้ใช้สอบถามสรุปอาหารหรือโควต้าของวันนี้
- ผู้ใช้ขอปรับแผน/พลาด/ย้ายวัน/เหนื่อย: เรียก upsert_plan_days และ/หรือ set_day_status ให้ตรงกับที่คุยกัน
- ผู้ใช้รายงานผลซ้อม (ทำเสร็จ น้ำหนักที่ยก ความรู้สึก): เรียก log_workout แล้วให้ feedback เฉพาะตัว
- ต้องเรียกเครื่องมือเสร็จและได้ ok ก่อน จึงบอกผู้ใช้ว่า "บันทึกแล้ว/ปรับแล้ว" ถ้าเครื่องมือส่ง error ให้แก้ข้อมูลแล้วลองใหม่
- ห้ามอ่านชื่อเครื่องมือหรือรายละเอียดทางเทคนิคให้ผู้ใช้ฟัง
[รูปแบบการตอบ (สำคัญ: ตอบใน LINE)]
- ห้ามใช้ Markdown (ห้าม ** ห้าม # ห้ามตาราง) LINE ไม่แสดงผล ให้ใช้ข้อความธรรมดา ขึ้นบรรทัดใหม่ และอีโมจิเล็กน้อย
- คุยทั่วไป/ถามสั้น: 2-4 ประโยค
- ช่วงซักประวัติ: ข้อความสั้น ถามเป็นข้อๆ กระชับ
- ตอนส่งสรุปแผนก่อนบันทึก: จัดรูปแบบให้อ่านง่ายบนมือถือ แบ่งเป็นบรรทัดสั้นๆ มีหัวข้อชัดเจน ไม่ยาวเกินไป
- น้ำเสียง: อบอุ่น เป็นกันเอง ตรงไปตรงมาแบบโค้ชจริง ใช้หลักวิทยาศาสตร์การกีฬา
`.trim();
}

// แปลงประวัติแชท -> รูปแบบ contents ของ Gemini (role ต้องสลับ user/model และเริ่มด้วย user)
function buildContents(
  history: HistoryItem[],
  userMessage: string,
  imagePart?: { inlineData: { data: string; mimeType: string } }
) {
  const contents: { role: "user" | "model"; parts: any[] }[] = [];
  for (const m of history) {
    const text = (m?.text || "").trim();
    if (!text || m.sender === "system") continue;
    const role: "user" | "model" = m.sender === "user" ? "user" : "model";
    const clipped = text.length > 1500 ? text.slice(0, 1500) + "…" : text;
    const last = contents[contents.length - 1];
    if (last && last.role === role) {
      last.parts[0].text += "\n" + clipped;
    } else {
      contents.push({ role, parts: [{ text: clipped }] });
    }
  }
  while (contents.length > 0 && contents[0].role === "model") contents.shift();

  const userParts: any[] = [];
  if (imagePart) {
    userParts.push(imagePart);
  }
  const promptText = userMessage || (imagePart ? "ช่วยประเมินสารอาหารจากรูปนี้ให้หน่อยครับ" : "");
  if (promptText) {
    userParts.push({ text: promptText });
  }

  const last = contents[contents.length - 1];
  if (last && last.role === "user" && !imagePart) {
    last.parts[0].text += "\n" + userMessage;
  } else {
    contents.push({ role: "user", parts: userParts });
  }
  return contents;
}

function parseCoachResponse(text: string, fallbackMessage: string): CoachResponse {
  const raw = (text || "").trim();
  if (raw) {
    try {
      const cleaned = raw
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      const parsed = JSON.parse(cleaned) as Partial<CoachResponse>;
      if (
        typeof parsed.message === "string" &&
        typeof parsed.type === "string"
      ) {
        return {
          message: parsed.message.trim() || fallbackMessage,
          type: parsed.type as CoachResponse["type"],
          data: parsed.data,
          actions: parsed.actions,
        };
      }
    } catch (err) {
      console.error("[Gemini AI] Structured response parse failed:", err);
    }
  }

  return {
    message: raw || fallbackMessage,
    type: "chat",
  };
}

function buildFallbackCoachResponse(userMessage: string, context: CoachContext): CoachResponse {
  const userName = context.userProfile?.name ? `คุณ ${context.userProfile.name}` : "";
  const lower = userMessage.toLowerCase();

  if (
    lower.includes("เหนื่อย") ||
    lower.includes("ล้า") ||
    lower.includes("เจ็บ") ||
    lower.includes("พัก")
  ) {
    return {
      message: `สวัสดีครับ ${userName} วันนี้หากรู้สึกเมื่อยล้า แนะนำทำ Active Recovery หรือยืดเหยียดเบาๆ 20 นาที แล้วดื่มน้ำพักผ่อนให้เต็มที่นะครับ โค้ชพร้อมปรับตารางให้เสมอครับ`,
      type: "recovery",
      data: { durationMinutes: 20 },
      actions: [
        {
          id: "adapt-recovery",
          label: "ปรับโปรแกรมวันนี้",
          actionType: "cannot_do",
          style: "primary",
        },
      ],
    };
  }

  if (
    lower.includes("กิน") ||
    lower.includes("อาหาร") ||
    lower.includes("ข้าว") ||
    lower.includes("เมนู")
  ) {
    return {
      message: `แนะนำเน้นโปรตีนคุณภาพดี เช่น อกไก่ ปลา ไข่ หรือเต้าหู้ ควบคู่กับคาร์บเชิงซ้อนอย่างข้าวกล้อง เพื่อเสริมสร้างกล้ามเนื้อและให้พลังงานคงที่ครับ`,
      type: "nutrition",
    };
  }

  // สำคัญสำหรับ Phase 3:
  // ถ้า Gemini ล่มชั่วคราว ควรยังส่ง structured response ได้
  // เพื่อให้ LINE renderer สามารถทำงานต่อได้ ไม่ใช่ส่งข้อความ error อย่างเดียว
  if (
    lower.includes("โปรแกรมฝึกวันนี้") ||
    lower.includes("ฝึกวันนี้") ||
    lower.includes("ออกกำลังกายวันนี้") ||
    lower.includes("ตารางวันนี้")
  ) {
    const workout = context.workoutPlan;
    if (workout?.exercises?.length) {
      return {
        message: `วันนี้มีโปรแกรม ${workout.titleTh || workout.title || "Workout"} ให้ลุยได้เลยครับ`,
        type: "workout",
        data: {
          title: workout.title,
          titleTh: workout.titleTh,
          durationMinutes: workout.durationMinutes,
          intensity: workout.intensity,
          exercises: workout.exercises.slice(0, 8).map((e: any) => ({
            name: e?.name,
            nameTh: e?.nameTh,
            sets: e?.sets,
            reps: e?.reps,
            restSeconds: e?.restSeconds,
            suggestedWeight: e?.suggestedWeight,
            note: e?.note,
          })),
        },
        actions: [
          {
            id: "start-workout",
            label: "เริ่ม Workout",
            actionType: "start_workout",
            style: "primary",
          },
          {
            id: "view-plan",
            label: "ดูแผน",
            actionType: "view_plan",
            style: "secondary",
          },
        ],
      };
    }

    return {
      message: "ตอนนี้ยังไม่มีโปรแกรมฝึกที่บันทึกไว้ครับ บอกโค้ชได้เลยว่าอยากฝึกเป้าหมายอะไร แล้วโค้ชช่วยจัดโปรแกรมให้ครับ",
      type: "workout",
      data: {
        titleTh: "ยังไม่มีโปรแกรมวันนี้",
        summary: "ยังไม่มีแผนฝึกที่บันทึกไว้ในระบบ",
      },
      actions: [
        {
          id: "create-program",
          label: "สร้างโปรแกรม",
          actionType: "apply_program",
          style: "primary",
        },
      ],
    };
  }

  return {
    message: `ขออภัยครับ ตอนนี้โค้ชตอบแบบละเอียดไม่ได้ชั่วคราว ลองส่งข้อความอีกครั้งในอีกสักครู่นะครับ`,
    type: "chat",
  };
}

function getErrorMessage(err: unknown): string {
  const e = err as any;
  return (
    e?.message ||
    e?.error?.message ||
    e?.error?.error?.message ||
    (typeof err === "string" ? err : "Unknown error")
  );
}

function getErrorStatus(err: unknown): number {
  const e = err as any;
  return Number(e?.status ?? e?.code ?? e?.error?.code ?? 0);
}

function isHighDemandError(err: unknown): boolean {
  const status = getErrorStatus(err);
  const msg = getErrorMessage(err).toLowerCase();
  return (
    status === 503 ||
    msg.includes("high demand") ||
    msg.includes("overloaded") ||
    msg.includes("spikes in demand") ||
    msg.includes("unavailable")
  );
}

function isRetryableGeminiError(err: unknown): boolean {
  const status = getErrorStatus(err);
  const message = getErrorMessage(err).toLowerCase();

  return (
    [429, 500, 502, 503, 504].includes(status) ||
    isHighDemandError(err) ||
    message.includes("temporarily unavailable") ||
    message.includes("rate limit") ||
    message.includes("resource exhausted") ||
    message.includes("fetch failed") ||
    message.includes("econnreset") ||
    message.includes("timeout")
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateWithModelFallback(
  ai: GoogleGenAI,
  baseRequest: any,
) {
  const candidateModels = Array.from(
    new Set([MODEL, FALLBACK_MODEL, "gemini-flash-latest"].filter(Boolean))
  );

  let lastError: unknown = null;

  for (let mIdx = 0; mIdx < candidateModels.length; mIdx++) {
    const currentModel = candidateModels[mIdx];
    const isLastModel = mIdx === candidateModels.length - 1;
    const request = { ...baseRequest, model: currentModel };
    const maxAttempts = 2;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        if (attempt > 1) {
          const delay = 600;
          await sleep(delay);
        }

        return await ai.models.generateContent(request);
      } catch (err) {
        lastError = err;
        const msg = getErrorMessage(err);

        // When a model is experiencing high demand (503), switch immediately to the next candidate model
        if (isHighDemandError(err) && !isLastModel) {
          console.log(
            `[Gemini AI] Model "${currentModel}" is experiencing high demand (503). Switching to alternate model "${candidateModels[mIdx + 1]}" immediately.`
          );
          break; // break retry loop to switch model immediately
        }

        if (!isRetryableGeminiError(err) || attempt === maxAttempts) {
          if (!isRetryableGeminiError(err) && !msg.includes("not found") && !msg.includes("not supported")) {
            throw err;
          }
          break; // try next candidate model
        }

        console.log(
          `[Gemini AI] Temporary retry on model "${currentModel}" (attempt ${attempt}/${maxAttempts}): ${msg}`
        );
      }
    }
  }

  throw lastError;
}

/**
 * Phase 1 API: Gemini -> canonical structured FitCoach response.
 * Tool calling is preserved. Structured JSON is requested only on the final
 * response round, after any required coach tools have completed.
 *
 * Reliability:
 * - retries temporary Gemini 429/5xx errors
 * - falls back from GEMINI_MODEL to GEMINI_FALLBACK_MODEL
 * - keeps the existing structured response contract
 */
export async function generateCoachResponseStructured(
  userMessage: string,
  context: CoachContext = {},
  history: HistoryItem[] = [],
  userId?: string,
  imagePart?: { inlineData: { data: string; mimeType: string } },
): Promise<CoachResponse> {
  const fallback = buildFallbackCoachResponse(userMessage, context);
  const ai = getGeminiClient();
  if (!ai) return fallback;

  try {
    const systemInstruction = buildStructuredSystemInstruction(context);
    const contents: any[] = buildContents(history.slice(-20), userMessage, imagePart);
    const tools = userId
      ? [{ functionDeclarations: COACH_TOOL_DECLARATIONS as any }]
      : undefined;

    for (let round = 0; round < 5; round++) {
      // When there is no userId, there is no tool-calling phase, so request
      // structured JSON immediately. With a userId, allow up to 4 tool rounds
      // first and then force the canonical JSON response on the final round.
      const isFinalRound = !userId || round >= 4;

      const response = await generateWithModelFallback(ai, {
        model: MODEL,
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
          maxOutputTokens: 4096,
          tools: isFinalRound ? undefined : tools,
          ...(isFinalRound
            ? {
                responseMimeType: "application/json",
                responseSchema: COACH_RESPONSE_SCHEMA,
              }
            : {}),
        },
      });

      const calls = response.functionCalls;

      if (userId && calls && calls.length > 0) {
        const modelContent = response.candidates?.[0]?.content;
        if (modelContent) contents.push(modelContent);

        const parts: any[] = [];

        for (const call of calls) {
          let result: Record<string, unknown>;

          try {
            result = await executeCoachTool(
              userId,
              call.name || "",
              (call.args || {}) as Record<string, unknown>,
            );
          } catch (err) {
            console.error(`[Coach Tool] ${call.name} error:`, err);
            result = { ok: false, error: "บันทึกไม่สำเร็จ" };
          }

          console.log(
            `[Coach Tool] ${call.name} ->`,
            JSON.stringify(result),
          );

          parts.push({
            functionResponse: {
              name: call.name,
              response: result,
            },
          });
        }

        contents.push({ role: "user", parts });
        continue;
      }

      const text = response.text?.trim();

      if (text) {
        const parsed = parseCoachResponse(text, fallback.message);

        // ถ้าเป็นการประเมินโภชนาการ (และยังไม่ได้บันทึก) ให้ใส่ action สำหรับยืนยันหรือแก้ไข
        if (parsed.type === "nutrition" && parsed.data?.calories != null && userId) {
          if (!parsed.actions || parsed.actions.length === 0) {
            parsed.actions = [
              {
                id: "confirm_meal",
                label: "ยืนยันบันทึกมื้อนี้",
                actionType: "confirm",
                style: "primary",
              },
              {
                id: "edit_meal",
                label: "ปรับแก้ตัวเลข",
                actionType: "edit",
                style: "secondary",
              },
            ];
          }

          try {
            const { savePendingMeal, bangkokDateNow, bangkokTimeNow, inferMealType } = await import("./db");
            const nowTime = bangkokTimeNow();
            await savePendingMeal(userId, {
              id: `pending-${Date.now()}`,
              date: bangkokDateNow(),
              time: nowTime,
              menu: parsed.data.menu || "มื้ออาหาร",
              calories: Math.round(parsed.data.calories),
              protein: Math.round(parsed.data.proteinGrams || 0),
              carbs: Math.round(parsed.data.carbsGrams || 0),
              fat: Math.round(parsed.data.fatGrams || 0),
              portion: parsed.data.portion || "1 จาน/ชุด",
              meal: parsed.data.mealType || inferMealType(nowTime),
              source: imagePart ? "photo" : "text",
              confidence: parsed.data.confidenceLevel || "medium",
              createdAt: new Date().toISOString(),
            });
          } catch (err) {
            console.error("[Coach AI] Error saving pending meal:", err);
          }
        }

        return parsed;
      }

      console.error(
        "[Gemini AI] ได้คำตอบว่างจาก Gemini (อาจถูก safety filter หรือ token หมด)",
      );
      break;
    }
  } catch (err) {
    const errMsg = getErrorMessage(err);
    console.log(
      `[Gemini AI] Notice: AI model temporarily unavailable (${errMsg}). Serving graceful rule-based coach response.`,
    );
  }

  return fallback;
}

/**
 * Backward-compatible Phase 1 wrapper.
 * Existing LINE/Web callers can keep expecting a string until Phase 2 adds
 * dedicated renderers. New code should consume generateCoachResponseStructured().
 */
export async function generateCoachResponse(
  userMessage: string,
  context: CoachContext = {},
  history: HistoryItem[] = [],
  userId?: string,
): Promise<string> {
  const response = await generateCoachResponseStructured(
    userMessage,
    context,
    history,
    userId,
  );

  return response.message;
}
