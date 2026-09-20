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

const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";

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

export async function generateCoachResponse(
  userMessage: string,
  context: CoachContext = {},
  history: HistoryItem[] = [],
  userId?: string // ใส่เมื่อต้องการให้โค้ชบันทึก/ปรับแผนได้ (LINE); ไม่ใส่ = ตอบอย่างเดียว
): Promise<string> {
  const profile = context.userProfile;

  const ai = getGeminiClient();
  if (ai) {
    try {
      const systemInstruction = buildSystemInstruction(context);
      const contents: any[] = buildContents(history.slice(-20), userMessage);
      const tools = userId ? [{ functionDeclarations: COACH_TOOL_DECLARATIONS as any }] : undefined;

      for (let round = 0; round < 5; round++) {
        const response = await ai.models.generateContent({
          model: MODEL,
          contents,
          config: {
            systemInstruction,
            temperature: 0.7,
            maxOutputTokens: 4096,
            // รอบสุดท้ายปิดเครื่องมือ เพื่อบังคับให้ตอบเป็นข้อความ
            tools: round < 4 ? tools : undefined,
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
              result = await executeCoachTool(userId, call.name || "", (call.args || {}) as Record<string, unknown>);
            } catch (err) {
              console.error(`[Coach Tool] ${call.name} error:`, err);
              result = { ok: false, error: "บันทึกไม่สำเร็จ" };
            }
            console.log(`[Coach Tool] ${call.name} ->`, JSON.stringify(result));
            parts.push({ functionResponse: { name: call.name, response: result } });
          }
          contents.push({ role: "user", parts });
          continue;
        }

        const text = response.text?.trim();
        if (text) return text;
        console.error("[Gemini AI] ได้คำตอบว่างจาก Gemini (อาจถูก safety filter หรือ token หมด)");
        break;
      }
    } catch (err) {
      console.error("[Gemini AI] ❌ เรียก Gemini ไม่สำเร็จ:", err);
    }
  }

  // Fallback (ใช้เมื่อไม่มี API key หรือ Gemini error)
  const userName = profile?.name ? `คุณ ${profile.name}` : "";
  const lower = userMessage.toLowerCase();
  if (lower.includes("เหนื่อย") || lower.includes("ล้า") || lower.includes("เจ็บ") || lower.includes("พัก")) {
    return `สวัสดีครับ ${userName} วันนี้หากรู้สึกเมื่อยล้า แนะนำทำ Active Recovery หรือยืดเหยียดเบาๆ 20 นาที แล้วดื่มน้ำพักผ่อนให้เต็มที่นะครับ โค้ชพร้อมปรับตารางให้เสมอครับ`;
  }
  if (lower.includes("กิน") || lower.includes("อาหาร") || lower.includes("ข้าว") || lower.includes("เมนู")) {
    return `แนะนำเน้นโปรตีนคุณภาพดี เช่น อกไก่ ปลา ไข่ หรือเต้าหู้ ควบคู่กับคาร์บเชิงซ้อนอย่างข้าวกล้อง เพื่อเสริมสร้างกล้ามเนื้อและให้พลังงานคงที่ครับ`;
  }
  return `ขออภัยครับ ตอนนี้โค้ชตอบแบบละเอียดไม่ได้ชั่วคราว ลองส่งข้อความอีกครั้งในอีกสักครู่นะครับ`;
}
