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
        confidenceLevel: { type: "string", enum: ["high", "medium", "low"] },
        remainingCalories: { type: "number" },
        todayTotalCalories: { type: "number" },
        targetCalories: { type: "number" },
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
   - **โค้ชไม่สั่งว่าต้องกินอะไร แค่ช่วยให้อยู่ในเป้า**: ผู้ใช้กินอะไรก็ได้ โค้ชช่วยประเมินและเทียบกับโควต้า
   - **การรับข้อมูล**: ผู้ใช้ส่งข้อความบอกอาหาร หรือส่งรูปภาพอาหาร
   - **ถามเพิ่มไม่เกิน 1 คำถาม**: หากข้อมูลไม่ชัด (เช่น "ก๋วยเตี๋ยว", "ข้าวมันไก่") ถามเพิ่มได้ไม่เกิน 1 คำถาม เช่น "แห้งหรือน้ำครับ", "ต้มหรือทอดครับ" หากผู้ใช้ไม่ตอบหรือตอบสั้น ให้ประมาณการแบบคนทั่วไปทันที ไม่ถามซ้ำซาก
   - **ทุกค่าเป็นการประมาณ**: ต้องมีคำว่า "ประมาณ" หรือ "~" และปัดตัวเลขกลมๆ ห้ามแสดงทศนิยมให้ดูแม่นเกินจริง (เช่น ประมาณ 450 kcal, โปรตีน ~32g, คาร์บ ~48g, ไขมัน ~14g)
   - **ประเมิน 4 ค่า + ระดับความมั่นใจ**: แคลอรี่ (kcal), โปรตีน (g), คาร์บ (g), ไขมัน (g) และ confidenceLevel: "high" (เมนูชัดเจนมาตรฐาน), "medium" (พอประมาณได้), "low" (รูปไม่ชัด/เมนูซับซ้อน)
   - **สรุปและเทียบกับเป้าหมายวันนี้**:
     • วันนี้กินไปแล้วกี่ kcal เทียบกับเป้าหมาย (ถ้ามี activePlan) และเหลือโควต้าอีกเท่าไหร่ หรือถ้าเกินเป้า ให้บอกว่าเกินเท่าไหร่
     • หากยังไม่มีโปรแกรม active ในระบบ ให้บอกยอดสะสมจริงโดยไม่เทียบเป้า และชวนสร้างโปรแกรม
   - **ถามยืนยันก่อนบันทึกทุกครั้ง**: เช่น "ต้องการให้โค้ชบันทึกมื้อนี้เลยไหมครับ"
   - **กฎเหล็กการบันทึก**:
     • **บันทึกลง DB ผ่าน log_meal เมื่อผู้ใช้กดยืนยัน หรือพิมพ์ 'บันทึก', 'ยืนยัน', 'ตกลง' แล้วเท่านั้น (ห้ามเรียก log_meal ทันทีตอนที่เพิ่งประเมินอาหารเด็ดขาด)**
     • เมื่อบันทึกแล้ว จะสรุปยอดสะสมวันนี้และโควต้าที่เหลือ
     • ผู้ใช้ขอแก้ตัวเลข (เช่น "ขอแก้เป็น 300 แคล", "ลดข้าวครึ่งจาน"): เรียก edit_meal
     • ผู้ใช้ขอลบมื้อ: เรียก delete_meal
     • ผู้ใช้ถามยอดวันนี้: เรียก get_today_totals
   - **ท่าทีและ Feedback**:
     • อยู่ในเป้า: ชมและให้กำลังใจอย่างจริงใจ
     • กินเกินเป้า: ให้กำลังใจ ไม่ตัดสิน ไม่ตำหนิ เสนอทางเลือกปรับ (เช่น มื้อถัดไปเน้นโปรตีนลดคาร์บ/ไขมัน, หรือเพิ่มการเดิน/กิจกรรมเบาๆ) ห้ามสั่งให้อดอาหารชดเชยเด็ดขาด!
     • กินต่ำกว่าเป้ามาก: เตือนผลเสียต่อการฟื้นตัวและกล้ามเนื้อ ชวนกินโปรตีนให้ถึงเป้า ห้ามสนับสนุนการอดอาหาร
4. ปรับตามคนตรงหน้า: ถ้าผู้ใช้บอกว่าเหนื่อย ไม่มีเวลา เจ็บ หรือพลาดวัน ให้ปรับแผนทันที
   เช่น ลดปริมาณ สลับวัน เปลี่ยนเป็น recovery แล้วบอกชัดว่าปรับอะไร ห้ามตำหนิ
5. ติดตามต่อเนื่อง: ทุกครั้งที่พูดถึงแผน ให้จบด้วยสิ่งที่ผู้ใช้ต้องทำต่อ และนัดเช็กอินสั้นๆ
6. ความปลอดภัย: ถ้าผู้ใช้เล่าอาการเจ็บผิดปกติ เวียนหัว แน่นหน้าอก ให้แนะนำหยุดซ้อมและพบแพทย์ อย่าวินิจฉัยโรค
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

function isRetryableGeminiError(err: unknown): boolean {
  const e = err as any;
  const status = Number(e?.status ?? e?.code ?? e?.error?.code ?? 0);
  const message = String(
    e?.message ??
      e?.error?.message ??
      e?.error?.error?.message ??
      "",
  ).toLowerCase();

  return (
    [429, 500, 502, 503, 504].includes(status) ||
    message.includes("high demand") ||
    message.includes("temporarily unavailable") ||
    message.includes("unavailable") ||
    message.includes("overloaded") ||
    message.includes("rate limit") ||
    message.includes("resource exhausted")
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateContentWithReliability(
  ai: GoogleGenAI,
  request: any,
) {
  const maxAttempts = 3;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (attempt > 1) {
        const delay = 800 * 2 ** (attempt - 2);
        console.log(`[Gemini AI] Retry ${attempt}/${maxAttempts} after ${delay}ms`);
        await sleep(delay);
      }

      return await ai.models.generateContent(request);
    } catch (err) {
      lastError = err;

      if (!isRetryableGeminiError(err) || attempt === maxAttempts) {
        throw err;
      }

      console.warn(
        `[Gemini AI] Temporary error on attempt ${attempt}/${maxAttempts}:`,
        err,
      );
    }
  }

  throw lastError;
}

async function generateWithModelFallback(
  ai: GoogleGenAI,
  request: any,
) {
  try {
    return await generateContentWithReliability(ai, request);
  } catch (primaryError) {
    if (!isRetryableGeminiError(primaryError) || FALLBACK_MODEL === MODEL) {
      throw primaryError;
    }

    console.warn(
      `[Gemini AI] Primary model "${MODEL}" unavailable. Trying fallback model "${FALLBACK_MODEL}".`,
    );

    return await generateContentWithReliability(ai, {
      ...request,
      model: FALLBACK_MODEL,
    });
  }
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
            const { savePendingMeal, bangkokDateNow, bangkokTimeNow } = await import("./db");
            await savePendingMeal(userId, {
              id: `pending-${Date.now()}`,
              date: bangkokDateNow(),
              time: bangkokTimeNow(),
              menu: parsed.data.menu || "มื้ออาหาร",
              calories: Math.round(parsed.data.calories),
              protein: Math.round(parsed.data.proteinGrams || 0),
              carbs: Math.round(parsed.data.carbsGrams || 0),
              fat: Math.round(parsed.data.fatGrams || 0),
              portion: parsed.data.portion || "1 จาน/ชุด",
              meal: parsed.data.mealType || "lunch",
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
    console.error(
      "[Gemini AI] ❌ เรียก Gemini แบบ structured ไม่สำเร็จ:",
      err,
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
