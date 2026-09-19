// coach-ai.ts - Gemini API
import { GoogleGenAI } from "@google/genai";
import type { UserProfile, WorkoutPlan, FitnessStatus, NutritionData, RecoveryData } from "./src/types";

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (aiClient) return aiClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[Gemini AI] Missing GEMINI_API_KEY in Environment Variables");
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
คุณคือ "FitCoach AI" โค้ชฟิตเนสส่วนตัวและผู้เชี่ยวชาญด้านเวทเทรนนิ่ง โภชนาการ และการฟื้นฟูร่างกายระดับมืออาชีพ
ข้อมูลผู้ใช้:
- ชื่อ: ${profile?.name || "เพื่อนรัก"}
- เพศ: ${profile?.sex || profile?.gender || "ไม่ระบุ"} | อายุ: ${profile?.age || "-"} ปี
- น้ำหนัก: ${profile?.weightKg || profile?.weight || "-"} กก. | ส่วนสูง: ${profile?.heightCm || profile?.height || "-"} ซม.
- เป้าหมายหลัก: ${profile?.goal || profile?.primaryGoal || "สุขภาพดีและรูปร่างเฟิร์ม"}
- ระดับ: ${profile?.fitnessLevel || "ทั่วไป"}
- สถานที่ออกกำลังกาย: ${profile?.preferredLocation || profile?.environment || "ฟิตเนส"}
- จำนวนวันฝึก: ${profile?.daysPerWeek || 3} วัน/สัปดาห์
- ตารางวันนี้: ${workout?.titleTh || workout?.title || "พักผ่อน"} (${workout?.durationMinutes || 45} นาที)
- โภชนาการวันนี้: ${nutrition?.currentCalories || 0} / ${nutrition?.targetCalories || 2000} kcal (โปรตีน: ${nutrition?.currentProtein || 0}g)
- ความพร้อม (Readiness): ${status?.condition || 80}% | ฟื้นฟู: ${recovery?.score || 85}% | Streak ต่อเนื่อง: ${status?.momentumDays || 1} วัน

ตอบด้วยน้ำเสียงอบอุ่น เป็นกันเอง ให้กำลังใจ ชัดเจน และมีหลักการวิทยาศาสตร์การกีฬาเสมอ ความยาวประมาณ 2-4 ประโยคกระชับ เหมาะกับ LINE Chat
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
      console.error("[Gemini AI] Error:", err);
    }
  }

  // Fallback if no Gemini API Key
  const userName = profile?.name ? `คุณ ${profile.name}` : "";
  const lower = userMessage.toLowerCase();
  if (lower.includes("เหนื่อย") || lower.includes("ล้า") || lower.includes("เจ็บ") || lower.includes("พัก")) {
    return `สวัสดีครับ ${userName} วันนี้หากรู้สึกเมื่อยล้า แนะนำทำ Active Recovery หรือยืดเหยียดเบาๆ 20 นาที แล้วดื่มน้ำพักผ่อนให้เต็มที่นะครับ โค้ชพร้อมปรับตารางให้เสมอครับ`;
  }
  if (lower.includes("กิน") || lower.includes("อาหาร") || lower.includes("ข้าว") || lower.includes("เมนู")) {
    return `แนะนำเน้นโปรตีนคุณภาพดี เช่น อกไก่ ปลา ไข่ หรือเต้าหู้ ควบคู่กับคาร์บเชิงซ้อนอย่างข้าวกล้อง เพื่อเสริมสร้างกล้ามเนื้อและให้พลังงานคงที่ครับ`;
  }
  return `สวัสดีครับ ${userName}! FitCoach AI ยินดีให้คำปรึกษาเสมอ วันนี้ลุยตามเป้าหมาย "${profile?.goal || "รูปร่างที่ดี"}" ไปด้วยกันนะครับ มีอะไรสอบถามโค้ชได้เลย!`;
}
