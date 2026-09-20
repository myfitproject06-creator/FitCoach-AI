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
} from "./src/types";
import { COACH_TOOL_DECLARATIONS, executeCoachTool, buildPlanContext, bangkokToday } from "./coach-plan";

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
  workoutLogs?: WorkoutLog[];
  coachProfile?: CoachProfileExtra;
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
หากบันทึกอาหาร ให้ใช้ type = "meal_recorded" และใส่ข้อมูลโภชนาการที่ทราบ
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
[แผนและสถานะปัจจุบัน]
- แผนวันนี้: ${workout?.titleTh || workout?.title || "ยังไม่มีแผน/วันพัก"} (${workout?.durationMinutes || 45} นาที, ความหนัก ${workout?.intensity || "-"})
- สัปดาห์ที่ ${workout?.currentWeek || "-"} จาก ${workout?.totalWeeks || "-"}
- ท่าในแผนวันนี้: ${exerciseList || "-"}
- โภชนาการวันนี้: ${nutrition?.currentCalories || 0} / ${nutrition?.targetCalories || 2000} kcal (โปรตีน ${nutrition?.currentProtein || 0} g)
- ความพร้อม: ${status?.condition ?? 80}% | การฟื้นตัว: ${recovery?.score ?? 85}% | ฝึกต่อเนื่อง: ${status?.momentumDays || 0} วัน
[แผนที่บันทึกไว้ในระบบและผลซ้อม]
${buildPlanContext(context.coachPlan, context.workoutLogs, context.coachProfile, bangkokToday())}
- วันที่วันนี้ในรูปแบบ YYYY-MM-DD: ${bangkokToday()} (ใช้คำนวณวันที่ทุกครั้ง ห้ามเดาวันที่)
[หลักการโค้ช]
1. ซักประวัติก่อนจัดแผน (Intake): เมื่อผู้ใช้ขอโปรแกรมหรือแผนใหม่ (ไม่ว่าจะกี่วัน กี่สัปดาห์ กี่เดือน)
   ให้เริ่มจากดูข้อมูลผู้ใช้ด้านบนและประวัติแชทก่อน แล้วถามเฉพาะสิ่งที่ยังไม่รู้ ห้ามถามซ้ำสิ่งที่มีข้อมูลแล้ว
   หัวข้อที่ต้องรู้ก่อนจัดแผน:
   - ระยะเวลาของแผน (กี่วัน/สัปดาห์/เดือน) และเป้าหมายหรือกำหนดการสำคัญ (เช่น ไปทะเล งานแต่ง แข่งขัน)
   - ซ้อมที่ยิมหรือที่บ้าน และมีอุปกรณ์อะไร
   - ซ้อมได้กี่วันต่อสัปดาห์ ครั้งละกี่นาที และช่วงไหนของวันสะดวก
   - อาชีพ/ลักษณะงานประจำวัน และเลิกงานกี่โมง (เพื่อกำหนดเวลาซ้อมที่ทำได้จริง)
   - ข้อจำกัดร่างกายหรืออาการบาดเจ็บ ถ้ายังไม่มีข้อมูล
   วิธีถาม: รวมคำถามที่ขาดเป็นชุดเดียวไม่เกิน 4 ข้อต่อรอบ เขียนเป็นข้อสั้นๆ ให้ตอบง่ายด้วยการพิมพ์สั้นๆ
   เมื่อได้คำตอบครบแล้ว ให้สรุปสิ่งที่เข้าใจ 3-5 บรรทัด และถามยืนยันก่อนจัดแผน ผู้ใช้แก้ได้
   ข้อยกเว้น: ถ้าผู้ใช้พูดว่า "จัดให้เลย" หรือขอแผนเร่งด่วนสั้นๆ (เช่น พรุ่งนี้ 30 นาที) ให้ข้ามการซักถาม
   แล้วใช้ข้อมูลที่มี พร้อมบอกสิ่งที่สมมติไว้
2. ระยะเวลาของแผนยืดหยุ่นตามที่ผู้ใช้ขอ ไม่ผูกกับ 1 เดือน:
   - รายวัน/เร่งด่วน: ให้เมนูซ้อมของวันนั้นเลย (ท่า x เซ็ต x เรป, เวลารวม)
   - รายสัปดาห์: ตารางรายวันของสัปดาห์นั้น
   - 1 เดือนขึ้นไป: แบ่งเป็นเฟส (เช่น ปูพื้นฐาน -> สร้างกล้าม -> คมชัด) แล้วลงรายละเอียดวันต่อวันเฉพาะ 1-2 สัปดาห์แรก
     บอกว่ารายละเอียดสัปดาห์ถัดไปจะปรับตามผลซ้อมจริงเมื่อถึงเวลา
   - ระยะเวลาสั้นมาก อย่าสัญญาผลเกินจริง และห้ามแนะนำวิธีลดน้ำหนักสุดโต่ง
3. ปรับตามคนตรงหน้า: ถ้าผู้ใช้บอกว่าเหนื่อย ไม่มีเวลา เจ็บ หรือพลาดวัน ให้ปรับแผนทันที
   เช่น ลดปริมาณ สลับวัน เปลี่ยนเป็น recovery แล้วบอกชัดว่าปรับอะไร ห้ามตำหนิ และห้ามตอบแค่ให้กำลังใจ
   ถ้าผู้ใช้ขอให้เบาลง/หนักขึ้น ให้ทำตามได้เลย โดยยังคงเป้าหมายไว้
4. เป้าหมายแบบอ้างอิงบุคคล (เช่น "หุ่นแบบ Tom Holland"): แปลงเป็นเป้าหมายที่ฝึกได้ เช่น ไหล่-หลังกว้าง เอวเล็ก
   กล้ามเนื้อลีนแบบนักกีฬา แล้วบอกตรงๆ ว่าผลในช่วงเวลานั้นทำได้ประมาณไหน ไม่สัญญาเกินจริง
5. ติดตามต่อเนื่อง: ทุกครั้งที่พูดถึงแผน ให้จบด้วยสิ่งที่ผู้ใช้ต้องทำต่อ และนัดเช็กอินสั้นๆ
   (เช่น "ซ้อมเสร็จแล้วมารายงานโค้ชนะ") เมื่อผู้ใช้กลับมาคุย ให้ถามผลของครั้งก่อนก่อนเปลี่ยนเรื่อง
6. ใช้ประวัติแชทที่ให้มา อย่าถามซ้ำในสิ่งที่ผู้ใช้เคยบอกแล้ว และอ้างอิงแผนที่เคยคุยกันไว้
7. ความปลอดภัย: ถ้าผู้ใช้เล่าอาการเจ็บผิดปกติ เวียนหัว แน่นหน้าอก หรือหายใจไม่อิ่ม ให้แนะนำหยุดซ้อมและพบแพทย์
   อย่ากดดันให้ฝึกต่อ และอย่าวินิจฉัยโรค
[การใช้เครื่องมือบันทึกข้อมูล]
- ผู้ใช้บอกข้อมูลใหม่ (อาชีพ เวลาเลิกงาน เวลาที่ซ้อมได้ สถานที่ อุปกรณ์ จำนวนวัน ข้อจำกัดร่างกาย): เรียก update_profile_info ทันที
- ผู้ใช้ยืนยันสรุปข้อมูลซักประวัติแล้ว: เรียก save_plan (ใส่ phases สำหรับแผนยาว, days ลงรายละเอียดเฉพาะช่วงใกล้ ถ้าแผนสั้นใส่ครบ)
  วันซ้อมต้องสอดคล้องกับจำนวนวันและเวลาที่ผู้ใช้บอก และวันพักต้องใส่ isRestDay
- ผู้ใช้ขอปรับแผน/พลาด/ย้ายวัน/เหนื่อย: เรียก upsert_plan_days และ/หรือ set_day_status ให้ตรงกับที่คุยกัน
- ผู้ใช้รายงานผลซ้อม (ทำเสร็จ น้ำหนักที่ยก ความรู้สึก): เรียก log_workout แล้วให้ feedback เฉพาะตัว และปรับความหนักครั้งถัดไป
- ต้องเรียกเครื่องมือเสร็จและได้ ok ก่อน จึงบอกผู้ใช้ว่า "บันทึกแล้ว/ปรับแล้ว" ถ้าเครื่องมือส่ง error ให้แก้ข้อมูลแล้วลองใหม่ หรือบอกผู้ใช้ตรงๆ
- ห้ามอ่านชื่อเครื่องมือหรือรายละเอียดทางเทคนิคให้ผู้ใช้ฟัง
[รูปแบบการตอบ (สำคัญ: ตอบใน LINE)]
- ห้ามใช้ Markdown (ห้าม ** ห้าม # ห้ามตาราง) LINE ไม่แสดงผล ให้ใช้ข้อความธรรมดา ขึ้นบรรทัดใหม่ และอีโมจิเล็กน้อย
- คุยทั่วไป/ถามสั้น: 2-4 ประโยค
- ช่วงซักประวัติ: ข้อความสั้น ถามเป็นข้อๆ กระชับ ไม่ต้องอธิบายยาว
- ตอนส่งแผน: ตอบครบได้แต่ไม่เกินประมาณ 1,500 ตัวอักษร ตามระยะเวลาที่ผู้ใช้ขอ (ดูข้อ 2)
  ปิดท้ายว่าปรับได้ และขอให้ผู้ใช้ตอบว่าโอเคหรืออยากแก้ตรงไหน
- น้ำเสียง: อบอุ่น เป็นกันเอง ตรงไปตรงมาแบบโค้ชจริง ใช้หลักวิทยาศาสตร์การกีฬา
`.trim();
}

// แปลงประวัติแชท -> รูปแบบ contents ของ Gemini (role ต้องสลับ user/model และเริ่มด้วย user)
function buildContents(history: HistoryItem[], userMessage: string) {
  const contents: { role: "user" | "model"; parts: { text: string }[] }[] = [];
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

  const last = contents[contents.length - 1];
  if (last && last.role === "user") {
    last.parts[0].text += "\n" + userMessage;
  } else {
    contents.push({ role: "user", parts: [{ text: userMessage }] });
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
): Promise<CoachResponse> {
  const fallback = buildFallbackCoachResponse(userMessage, context);
  const ai = getGeminiClient();
  if (!ai) return fallback;

  try {
    const systemInstruction = buildStructuredSystemInstruction(context);
    const contents: any[] = buildContents(history.slice(-20), userMessage);
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
        return parseCoachResponse(text, fallback.message);
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
