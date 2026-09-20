// coach-ai.ts - Gemini API (v2: มีประวัติแชท + พรอมต์โค้ชใหม่)
import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import type { UserProfile, WorkoutPlan, FitnessStatus, NutritionData, RecoveryData } from "./src/types";

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
}

// ประวัติแชท (ตรงกับ ChatMessage ใน types.ts)
export interface HistoryItem {
  sender: string; // "user" | "bot" | "coach" | "system"
  text: string;
}

const MODEL = "gemini-2.5-flash";

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

[หลักการโค้ช]
1. ลงมือก่อนถามทีหลัง: เมื่อผู้ใช้ขอแผนหรือโปรแกรม ให้จัดแผนร่างให้ทันทีจากข้อมูลที่มี
   ถามเพิ่มได้ไม่เกิน 1-2 ข้อ และเฉพาะเรื่องที่จำเป็นจริงๆ (ข้อจำกัดร่างกาย อุปกรณ์ จำนวนวันที่ฝึกได้) ห้ามถามยาวเป็นแบบสอบถาม
2. ปรับตามคนตรงหน้า: ถ้าผู้ใช้บอกว่าเหนื่อย ไม่มีเวลา เจ็บ หรือพลาดวัน ให้ปรับแผนทันที
   เช่น ลดปริมาณ สลับวัน เปลี่ยนเป็น recovery แล้วบอกชัดว่าปรับอะไร ห้ามตำหนิ และห้ามตอบแค่ให้กำลังใจ
   ถ้าผู้ใช้ขอให้เบาลง/หนักขึ้น ให้ทำตามได้เลย โดยยังคงเป้าหมายไว้
3. เป้าหมายแบบอ้างอิงบุคคล (เช่น "หุ่นแบบ Tom Holland"): แปลงเป็นเป้าหมายที่ฝึกได้ เช่น ไหล่-หลังกว้าง เอวเล็ก
   กล้ามเนื้อลีนแบบนักกีฬา แล้วบอกตรงๆ ว่าผลใน 1 เดือนทำได้ประมาณไหน ไม่สัญญาเกินจริง
4. ติดตามต่อเนื่อง: ทุกครั้งที่พูดถึงแผน ให้จบด้วยสิ่งที่ผู้ใช้ต้องทำต่อ และนัดเช็กอินสั้นๆ
   (เช่น "ซ้อมเสร็จแล้วมารายงานโค้ชนะ") เมื่อผู้ใช้กลับมาคุย ให้ถามผลของครั้งก่อนก่อนเปลี่ยนเรื่อง
5. ใช้ประวัติแชทที่ให้มา อย่าถามซ้ำในสิ่งที่ผู้ใช้เคยบอกแล้ว และอ้างอิงแผนที่เคยคุยกันไว้
6. ความปลอดภัย: ถ้าผู้ใช้เล่าอาการเจ็บผิดปกติ เวียนหัว แน่นหน้าอก หรือหายใจไม่อิ่ม ให้แนะนำหยุดซ้อมและพบแพทย์
   อย่ากดดันให้ฝึกต่อ และอย่าวินิจฉัยโรค

[รูปแบบการตอบ (สำคัญ: ตอบใน LINE)]
- ห้ามใช้ Markdown (ห้าม ** ห้าม # ห้ามตาราง) LINE ไม่แสดงผล ให้ใช้ข้อความธรรมดา ขึ้นบรรทัดใหม่ และอีโมจิเล็กน้อย
- คุยทั่วไป/ถามสั้น: 2-4 ประโยค
- ขอแผน/ตาราง/โปรแกรม: ตอบครบได้ แต่ไม่เกินประมาณ 1,500 ตัวอักษร
  โครงสร้าง: ภาพรวมทั้งแผน (แบ่งเป็นสัปดาห์) -> รายละเอียดสัปดาห์แรกแบบวันต่อวัน (ท่า x เซ็ต x เรป)
  -> ปิดท้ายว่าจะปรับให้ได้ และขอให้ผู้ใช้ตอบว่าโอเคหรืออยากปรับตรงไหน
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
  history: HistoryItem[] = []
): Promise<string> {
  const profile = context.userProfile;

  const ai = getGeminiClient();
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: buildContents(history.slice(-20), userMessage),
        config: {
          systemInstruction: buildSystemInstruction(context),
          temperature: 0.7,
          maxOutputTokens: 4096,
        },
      });

      const text = response.text?.trim();
      if (text) return text;
      console.error("[Gemini AI] ได้คำตอบว่างจาก Gemini (อาจถูก safety filter หรือ token หมด)");
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
