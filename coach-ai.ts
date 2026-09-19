// coach-ai.ts - เซอร์วิสวิเคราะห์และให้คำปรึกษาฟิตเนสอัจฉริยะด้วย Gemini API
import { GoogleGenAI } from "@google/genai";
import type { UserProfile, WorkoutPlan, FitnessStatus, NutritionData, RecoveryData } from "./src/types";

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (aiClient) return aiClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[Gemini AI] ไม่พบ GEMINI_API_KEY ในตัวแปรสภาพแวดล้อม (Environment Variables)");
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

/**
 * สร้างคำตอบโค้ชส่วนตัวแบบภาษาไทยที่เป็นมิตร ให้กำลังใจ และอ้างอิงข้อมูลจริงของผู้ใช้
 */
export async function generateCoachResponse(userMessage: string, context: CoachContext = {}): Promise<string> {
  const profile = context.userProfile;
  const workout = context.workoutPlan;
  const status = context.fitnessStatus;
  const nutrition = context.nutritionData;
  const recovery = context.recoveryData;

  const ai = getGeminiClient();

  if (ai) {
    try {
      const systemInstruction = `
คุณคือ "FitCoach AI" โค้ชฟิตเนสและโภชนาการส่วนตัวระดับพรีเมียม ประจำตัวของผู้ใช้
บุคลิก: อบอุ่น มีพลัง ให้กำลังใจ ยึดหลักวิทยาศาสตร์การกีฬาและการฟื้นตัว ตอบสั้นกระชับเข้าใจง่าย เป็นมิตร สุภาพ

ข้อมูลปัจจุบันของผู้ใช้:
- ชื่อ: ${profile?.name || "คุณผู้ใช้"}
- เพศ: ${profile?.sex || profile?.gender || "ไม่ระบุ"} | อายุ: ${profile?.age || "-"} ปี | น้ำหนัก: ${profile?.weightKg || profile?.weight || "-"} กก. | ส่วนสูง: ${profile?.heightCm || profile?.height || "-"} ซม.
- เป้าหมายหลัก: ${profile?.goal || profile?.primaryGoal || "สุขภาพดีและรูปร่างกระชับ"}
- ระดับความฟิต: ${profile?.fitnessLevel || "ปานกลาง"}
- สถานที่ซ้อม: ${profile?.preferredLocation || profile?.environment || "ฟิตเนส/บ้าน"}
- วันที่ซ้อมต่อสัปดาห์: ${profile?.daysPerWeek || 3} วัน/สัปดาห์
- โปรแกรมวันนี้: ${workout?.titleTh || workout?.title || "พักผ่อนหรือคาร์ดิโอเบาๆ"} (${workout?.durationMinutes || 45} นาที)
- แคลอรี่วันนี้: ${nutrition?.currentCalories || 0} / ${nutrition?.targetCalories || 2000} kcal (โปรตีน: ${nutrition?.currentProtein || 0}g)
- สถานะความพร้อม (Readiness): ${status?.condition || 80}% | ฟื้นตัว: ${recovery?.score || 85}% | Streak วินัย: ${status?.momentumDays || 1} วัน

คำแนะนำในการตอบ:
1. ตอบเป็นภาษาไทยด้วยน้ำเสียงกระตือรือร้น ให้กำลังใจ และชัดเจน
2. อ้างอิงข้อมูลของเขาอย่างชาญฉลาด ไม่ตอบแบบข้อความแข็งทื่อ
3. หากเขาถามเรื่องอาหาร แนะนำสัดส่วนโปรตีนหรือพลังงานตามเป้าหมาย
4. หากเขาเหนื่อยหรือนอนน้อย แนะนำให้ปรับโปรแกรมหรือเน้นการยืดเหยียด
5. ตอบความยาวประมาณ 2-4 ย่อหน้า ไม่ยาวจนเกินไป พร้อมคำลงท้ายที่สร้างแรงบันดาลใจ
      `.trim();

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [{ text: userMessage }],
          },
        ],
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      if (response.text && response.text.trim().length > 0) {
        return response.text.trim();
      }
    } catch (err) {
      console.error("[Gemini AI] เกิดข้อผิดพลาดในการสร้างคำตอบ:", err);
    }
  }

  // คำตอบสำรองแบบชาญฉลาดเมื่อไม่มี Gemini API Key หรือเรียกไม่สำเร็จ
  const userName = profile?.name ? `คุณ ${profile.name}` : "คุณ";
  const lower = userMessage.toLowerCase();

  if (lower.includes("เหนื่อย") || lower.includes("ล้า") || lower.includes("ปวด") || lower.includes("ไม่ไหว")) {
    return `สวัสดีครับ${userName} โค้ชรับทราบครับ! ร่างกายกำลังส่งสัญญาณว่าต้องการฟื้นตัว วันนี้โค้ชแนะนำให้ลดความหนักลง ยืดเหยียดเบาๆ หรือเปลี่ยนเป็น Active Recovery เดินเล่น 20 นาที แล้วเข้านอนให้เร็วขึ้นครับ ร่างกายที่พักผ่อนเพียงพอจะสร้างกล้ามเนื้อและเบิร์นไขมันได้ดีกว่าครับ 💪✨`;
  }

  if (lower.includes("กิน") || lower.includes("ข้าว") || lower.includes("อาหาร") || lower.includes("โปรตีน")) {
    return `สำหรับอาหารมื้อนี้ของ${userName} โค้ชแนะนำให้เน้นโปรตีนคุณภาพดี เช่น อกไก่ ปลา ไข่ต้ม หรือเต้าหู้ และทานคู่กับผักหลากสีและคาร์โบไฮเดรตเชิงซ้อน อย่าลืมดื่มน้ำให้เพียงพอ 2-3 ลิตรตลอดวันเพื่อเร่งการเผาผลาญนะครับ 🥗🍗`;
  }

  return `สวัสดีครับ${userName}! โค้ช FitCoach AI พร้อมลุยไปกับคุณครับ 🎯\n\nเป้าหมาย "${profile?.goal || "สร้างหุ่นและสุขภาพที่ยอดเยี่ยม"}" กำลังใกล้เข้ามาเรื่อยๆ มีข้อสงสัยเรื่องท่าฝึก ตารางออกกำลังกาย หรือโภชนาการ ถามโค้ชได้เลยนะครับ! 🔥`;
}
