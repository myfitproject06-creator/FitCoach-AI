import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize Gemini client lazily/safely
let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

interface GenerateContentOptions {
  contents: string | any;
  config?: any;
  preferredModel?: string;
}

// Preferred and fallback models for text generation tasks
const MODELS_TO_TRY = [
  "gemini-3.8-flash",
  "gemini-2.5-flash",
  "gemini-flash-latest",
  "gemini-3.1-flash-lite",
];

// Track quota-exhausted models with cooldown timestamps (60 seconds)
const modelCooldowns = new Map<string, number>();

async function generateWithRetryAndFallback(options: GenerateContentOptions): Promise<string | null> {
  const ai = getAi();
  if (!ai) return null;

  const now = Date.now();
  const candidateModels = options.preferredModel
    ? [options.preferredModel, ...MODELS_TO_TRY.filter((m) => m !== options.preferredModel)]
    : MODELS_TO_TRY;

  // Filter out models that are currently in quota cooldown
  const availableModels = candidateModels.filter((m) => {
    const cooldownUntil = modelCooldowns.get(m);
    return !cooldownUntil || now > cooldownUntil;
  });

  const models = availableModels.length > 0 ? availableModels : candidateModels;

  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Call timed out after 5000ms")), 5000)
        );

        const response = await Promise.race([
          ai.models.generateContent({
            model,
            contents: options.contents,
            config: options.config,
          }),
          timeoutPromise,
        ]);

        if (response && response.text) {
          return response.text;
        }
      } catch (err: any) {
        const errMsg = err?.message || String(err || "");
        const status = err?.status || err?.code || (err?.error && err?.error?.code);

        const isQuotaError =
          status === 429 ||
          errMsg.includes("429") ||
          errMsg.includes("quota") ||
          errMsg.includes("exhausted");

        if (isQuotaError) {
          // Put this model in cooldown for 60 seconds and immediately try next model without retrying this one
          modelCooldowns.set(model, Date.now() + 60000);
          break;
        }

        const isTemporary =
          status === 503 ||
          status === "UNAVAILABLE" ||
          errMsg.includes("timed out") ||
          errMsg.includes("high demand") ||
          errMsg.includes("503") ||
          errMsg.includes("UNAVAILABLE");

        if (isTemporary && attempt === 0 && !errMsg.includes("timed out")) {
          // Wait 300ms before retrying the same model once
          await new Promise((resolve) => setTimeout(resolve, 300));
          continue;
        }

        break; // break to try next model in fallback list
      }
    }
  }

  return null;
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// 1. Analyze Goal & Generate Personalized Strategy
app.post("/api/ai/analyze-goal", async (req, res) => {
  const { goal, currentFitness, height, weight, gender, age } = req.body;
  
  try {
    const text = await generateWithRetryAndFallback({
      contents: `You are FitCoach, an expert, encouraging, friendly, and calm AI personal trainer.
A user provides their goal and stats:
- Goal: "${goal || "Build lean muscle"}"
- Stats: ${gender || "Male"}, ${age || 27} yrs, Height: ${height || 176} cm, Weight: ${weight || 68} kg, Level: ${currentFitness || "Intermediate"}

Respond strictly with a JSON object in this format:
{
  "coachResponse": "Short 2-3 sentences in natural Thai language acknowledging their goal, explaining how we will achieve it calmly and encouragingly",
  "calculatedCalories": 2300,
  "calculatedProtein": 150,
  "calculatedCarbs": 260,
  "calculatedFat": 65,
  "recommendedDaysPerWeek": 4,
  "primarySplit": "Upper / Lower Split",
  "focusAreas": ["Hypertrophy", "Agility", "Core Stability"],
  "sleepTargetHours": "7-9",
  "dailyStepTarget": 8000
}`,
      config: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    if (text) {
      const parsed = JSON.parse(text);
      if (parsed.coachResponse) {
        return res.json(parsed);
      }
    }
  } catch {
    // Proceed to robust rule-based fallback
  }

  // Graceful rule-based fallback
  const isLoseFat = goal?.toLowerCase().includes("fat") || goal?.includes("ลดไขมัน");
  const isMuscle = goal?.toLowerCase().includes("muscle") || goal?.includes("กล้าม");
  const isTomHolland = goal?.includes("ทอม ฮอลแลนด์") || goal?.toLowerCase().includes("tom holland");

  let coachMsg = "เข้าใจแล้วครับ! เราจะสร้างแผนที่เน้นสร้างความแข็งแรง กระชับรูปร่าง และพัฒนาความคล่องตัวโดยปรับให้เหมาะกับคุณโดยเฉพาะ";
  if (isTomHolland) {
    coachMsg = "เข้าใจแล้วครับ! เราจะสร้างแผนเพื่อให้คุณมีรูปร่างที่กระชับ คล่องตัว และดูแข็งแรงเหมือนทอม ฮอลแลนด์ โดยปรับระดับความเข้มข้นให้เหมาะกับคุณโดยเฉพาะ";
  } else if (isLoseFat && isMuscle) {
    coachMsg = "ยอดเยี่ยมครับ! การสร้างกล้ามเนื้อพร้อมลดไขมัน (Body Recomposition) ต้องการโภชนาการโปรตีนสูงและเวทเทรนนิ่งที่สม่ำเสมอ ผมได้จัดแผนนี้ให้คุณแล้วครับ";
  }

  return res.json({
    coachResponse: coachMsg,
    calculatedCalories: isLoseFat ? 2050 : 2300,
    calculatedProtein: 150,
    calculatedCarbs: 240,
    calculatedFat: 60,
    recommendedDaysPerWeek: 4,
    primarySplit: "Upper / Lower Body Split",
    focusAreas: ["Strength", "Hypertrophy", "Mobility"],
    sleepTargetHours: "7–9",
    dailyStepTarget: 8000,
  });
});

// 2. Natural Language Food Logging & Macro Estimation
app.post("/api/ai/estimate-food", async (req, res) => {
  const { foodDescription } = req.body;
  if (!foodDescription) {
    return res.status(400).json({ error: "Missing food description" });
  }

  try {
    const text = await generateWithRetryAndFallback({
      contents: `You are FitCoach AI nutrition assistant.
Estimate the nutrition for this Thai or international food: "${foodDescription}".
Respond strictly in JSON format:
{
  "name": "Clean short name of the food item in Thai (or English if entered in English)",
  "portion": "e.g. 1 จาน, 1 ถ้วย, or 200 กรัม",
  "calories": 620,
  "protein": 34,
  "carbs": 65,
  "fat": 22,
  "isEstimate": true,
  "tip": "Short friendly 1-sentence tip from trainer about this meal in Thai"
}`,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    });

    if (text) {
      const parsed = JSON.parse(text);
      if (parsed.calories) {
        return res.json(parsed);
      }
    }
  } catch {
    // Proceed to robust rule-based fallback
  }

  // Fallback estimates for common items
  let name = foodDescription;
  let calories = 550;
  let protein = 25;
  let carbs = 65;
  let fat = 18;
  let tip = "มื้ออาหารที่มีคุณค่าทางโภชนาการเหมาะสมกับช่วงการฝึกของคุณครับ";

  const lower = foodDescription.toLowerCase();
  if (lower.includes("ข้าวมันไก่")) {
    name = "ข้าวมันไก่ตอน (พร้อมน้ำซุป)";
    calories = 620;
    protein = 28;
    carbs = 72;
    fat = 24;
    tip = "ข้าวมันไก่มีโปรตีนดีจากเนื้อไก่ หากต้องการคุมไขมันสามารถเลือกเนื้ออกไม่เอาหนังได้ครับ";
  } else if (lower.includes("กะเพรา")) {
    name = "ข้าวกะเพราไก่ + ไข่ดาว";
    calories = 650;
    protein = 35;
    carbs = 68;
    fat = 26;
    tip = "โปรตีนสูงจากอกไก่และไข่ดาว เหมาะเป็นมื้อฟื้นฟูกล้ามเนื้อหลังฝึกครับ";
  } else if (lower.includes("สลัด") || lower.includes("อกไก่")) {
    name = "สลัดอกไก่ย่าง";
    calories = 380;
    protein = 38;
    carbs = 20;
    fat = 12;
    tip = "คลีนมากครับ ได้โปรตีนเน้นๆ และวิตามินจากผักสด";
  } else if (lower.includes("เวย์") || lower.includes("whey")) {
    name = "เวย์โปรตีน 1 สกู๊ป";
    calories = 140;
    protein = 25;
    carbs = 4;
    fat = 2;
    tip = "เสริมโปรตีนดูดซึมไว ช่วยกระตุ้นการสังเคราะห์โปรตีนในกล้ามเนื้อ";
  }

  return res.json({
    name,
    portion: "1 มื้อ / จาน",
    calories,
    protein,
    carbs,
    fat,
    isEstimate: true,
    tip,
  });
});

// 3. Adaptive Workout Adjustment
app.post("/api/ai/adapt-workout", async (req, res) => {
  const { reason, originalWorkout, sleepHours, fatigueLevel } = req.body;

  try {
    const text = await generateWithRetryAndFallback({
      contents: `You are FitCoach, a supportive, knowledgeable personal trainer.
The user was scheduled for workout: "${originalWorkout?.title || "Upper Body 52 min"}".
User reported state/reason: "${reason || "เหนื่อย นอนน้อย"}".
Sleep: ${sleepHours || "4"} hours, Fatigue: ${fatigueLevel || "High"}.

Adapt the workout to keep them safe, avoiding burnout while keeping momentum.
Respond strictly in JSON format:
{
  "adaptedTitle": "e.g. Light Upper Body + Mobility or Express Session",
  "adaptedDuration": 25,
  "coachMessage": "Encouraging, calm message in Thai explaining what was adjusted and why without guilt or shame",
  "intensity": "เบา - ปานกลาง",
  "exercises": [
    {
      "name": "Push-up on Incline / DB Floor Press",
      "sets": 3,
      "reps": "10-12",
      "weight": "ปานกลาง",
      "rest": "60 วิ",
      "notes": "เน้นฟอร์มการเคลื่อนไหว ไม่ฝืนความล้า"
    },
    {
      "name": "Lat Pulldown (Moderate)",
      "sets": 3,
      "reps": "12",
      "weight": "น้ำหนักเบาลง 20%",
      "rest": "60 วิ",
      "notes": "เคลื่อนไหวต่อเนื่องเพื่อกระตุ้นการไหลเวียนเลือด"
    },
    {
      "name": "Thoracic & Shoulder Mobility Flow",
      "sets": 2,
      "reps": "8 แต่ละข้าง",
      "weight": "Bodyweight",
      "rest": "45 วิ",
      "notes": "คลายกล้ามเนื้อสะบักและคอบ่า"
    }
  ]
}`,
      config: {
        responseMimeType: "application/json",
        temperature: 0.6,
      },
    });

    if (text) {
      const parsed = JSON.parse(text);
      if (parsed.adaptedTitle) {
        return res.json(parsed);
      }
    }
  } catch {
    // Proceed to robust rule-based fallback
  }

  // Fallback adapted plan
  return res.json({
    adaptedTitle: "Light Session + Active Mobility",
    adaptedDuration: 25,
    coachMessage: "วันนี้เราลดความหนักลงหน่อยนะครับ เพื่อให้ร่างกายได้ฟื้นตัวโดยไม่เสียความต่อเนื่อง ผมปรับเป็นโปรแกรม 25 นาที เน้นการเคลื่อนไหวและฟอร์มที่ดีครับ",
    intensity: "เบา - ฟื้นฟู",
    exercises: [
      {
        name: "Dumbbell Floor Press (Light)",
        sets: 3,
        reps: "10–12",
        weight: "14 kg",
        rest: "60 วิ",
        notes: "ลดแรงกดที่ไหล่และโฟกัสการหดเกร็งกล้ามเนื้อ",
      },
      {
        name: "Cable Row / Lat Pulldown",
        sets: 3,
        reps: "12",
        weight: "35 kg",
        rest: "60 วิ",
        notes: "ดึงแบบควบคุมจังหวะ ไม่กระชาก",
      },
      {
        name: "Shoulder & Upper Body Mobility",
        sets: 2,
        reps: "10 รอบ",
        weight: "Bodyweight",
        rest: "45 วิ",
        notes: "หมุนหัวไหล่ ยืดกล้ามเนื้อหน้าอกเพื่อลดความตึงล้า",
      },
    ],
  });
});

// 4. Conversational Chat & LINE Coach interaction
app.post("/api/ai/coach-chat", async (req, res) => {
  const { message, targetDurationMonths } = req.body;
  if (!message) return res.status(400).json({ error: "Missing message" });

  try {
    const text = await generateWithRetryAndFallback({
      contents: `You are FitCoach, an expert, certified, friendly, and motivating Thai personal trainer on LINE and in the FitCoach app.
Tone: Warm, respectful (uses 'ครับ', 'คุณ', 'ผม'), highly knowledgeable, and actionable.

User message: "${message}"
User target timeframe preference: ${targetDurationMonths ? `${targetDurationMonths} เดือน` : "ดูจากข้อความของผู้ใช้"}

CRITICAL INSTRUCTIONS ON TIMEFRAME / DURATION:
- Detect the timeframe requested by the user from their message:
  * If the user specifies "2 สัปดาห์" / "สองสัปดาห์" / "14 วัน" / "2 weeks":
    Tailor to a **2-Week Spider-Man Jumpstart & Depletion/Peak Blueprint (14 วัน)**. Explain honestly that 2 weeks is a short sprint for rapid bloat drop, activating V-taper tone, shedding water retention (2-3 kg), and jumpstarting habits, dividing into Week 1 (Metabolic Depletion & Posture Activation) and Week 2 (Carb Cycle & Peak Muscle Tone).
  * If the user specifies "1 เดือน" / "หนึ่งเดือน" / "4 สัปดาห์" / "1 month":
    Tailor to a **1-Month (4-Week Rapid Kickstarter Transformation Blueprint)**. Divided into 4 weeks of aggressive body recomp (Week 1-2: V-Taper Foundation & Upper Pump, Week 3-4: Caloric Deficit & Six-Pack Definition), totalDuration "1 เดือน (4 สัปดาห์)".
  * If the user specifies "2 เดือน" / "สองเดือน" / "8 สัปดาห์" / "2 months" OR complains "มีเวลาแค่ 2 เดือน แต่ทำไมจัดมา 3 เดือน" / "ขอแผน 2 เดือน":
    YOU MUST tailor the entire response and card to a **2-Month (8-Week Accelerated Transformation Blueprint)** with exactly 2 phases (Month 1: Accelerated Foundation & V-Taper, Month 2: Rapid Shred & Spider-Man Definition), totalDuration "2 เดือน (8 สัปดาห์)".
    Politely explain why 3 months was previously mentioned (standard 12-week baseline vs accelerated 8-week strategy) and how the 2-month plan intensifies protein (150-155g) and caloric control (2,050-2,150 kcal).
  * If the user specifies "3 เดือน" or general without duration, use 3 Months (12 weeks).

FORMATTING REQUIREMENTS:
- Provide a thorough, professional, inspiring personal trainer consultation!
- Format with clear Markdown sections (use emojis, bold headers, bullet points):
  • ⏳ **กรอบเวลาและ Roadmap การเปลี่ยนแปลง (Transformation Phases ตามระยะเวลาที่ผู้ใช้ขอ)**: อธิบายเป้าหมายแต่ละเดือน แคลอรีและโปรตีน
  • 📅 **ตารางการฝึกในแต่ละวัน (Daily Schedule: จันทร์ - อาทิตย์)**: แจกแจงว่าวันจันทร์ถึงวันอาทิตย์ทำอะไรบ้าง
  • 🥗 **ข้อมูลโภชนาการและการเตรียมอาหารในทุกๆ วัน (Daily Meal Prep Blueprint)**: ตัวเลขแคลอรีและโปรตีนเป้าหมาย พร้อมตัวอย่างอาหาร 4 มื้อจริงที่ต้องเตรียมในแต่ละวัน
  • 🛌 **การพักผ่อนและการฟื้นฟู (Recovery Protocol)**: ชั่วโมงการนอนหลับ 7.5-8.5 ชม., ช่วงเวลา Growth Hormone หลั่ง, การงดหน้าจอก่อนนอน และการยืดเหยียด
- MUST attach a "card" of type "new_program" containing both "workoutPlan" and "plan3Months" objects reflecting the exact requested duration!

Respond strictly in JSON format:
{
  "reply": "Detailed formatted Thai response with markdown and emojis",
  "card": {
    "type": "new_program",
    "title": "ชื่อโปรแกรม เช่น Tom Holland: Spider-Man Lean Athletic (แผน 3 เดือน)",
    "details": "รายละเอียดสั้นๆ เช่น แผน 3 เดือน ปั้นหุ่น V-Taper ไหล่ 3D หลังกว้าง และแกนกลางลำตัว 45 นาที",
    "duration": "3 เดือน (45 นาที/วัน)",
    "tags": ["TomHolland", "VTaper", "SpiderMan", "Plan3Months"],
    "plan3Months": {
      "goalName": "Tom Holland: Spider-Man Lean V-Taper (แผน 3 เดือน)",
      "totalDuration": "3 เดือน (12 สัปดาห์)",
      "phases": [
        {
          "month": 1,
          "title": "เดือนที่ 1: Foundation & Body Recomp",
          "focus": "สร้างฐาน V-Taper, ไหล่ 3D, ปรับระบบเผาผลาญ และเริ่มสลายไขมันส่วนเกิน",
          "calories": "2,200 kcal/วัน",
          "protein": "145g/วัน"
        },
        {
          "month": 2,
          "title": "เดือนที่ 2: Hypertrophy & Density",
          "focus": "เพิ่มความหนาแน่นกล้ามเนื้ออกบน ขยายปีกหลังรูปตัว V และพัฒนาความทนทาน",
          "calories": "2,250 kcal/วัน",
          "protein": "150g/วัน"
        },
        {
          "month": 3,
          "title": "เดือนที่ 3: Spider-Man Definition & Calisthenics",
          "focus": "รีดไขมันลงสู่ 10–12%, ตัดลาย Six-Pack และ V-Line ด้านข้างให้คมกริบ",
          "calories": "2,100 kcal/วัน",
          "protein": "150g/วัน"
        }
      ],
      "weeklySchedule": [
        { "day": "วันจันทร์", "activity": "Upper Body V-Taper (อกบน, ไหล่ 3D, หลังปีก)", "type": "workout" },
        { "day": "วันอังคาร", "activity": "Core & Spider-Man Calisthenics (ดึงข้อ, ท้อง, บอดี้เวท)", "type": "workout" },
        { "day": "วันพุธ", "activity": "Active Recovery & Zone 2 Fat Burn (เดินชัน 35 นาที)", "type": "cardio" },
        { "day": "วันพฤหัสบดี", "activity": "Lower Body & Explosive Legs (สควอท, ก้น, น่อง, คล่องตัว)", "type": "workout" },
        { "day": "วันศุกร์", "activity": "Upper Hypertrophy Pump & V-Line Abs (อก, ไหล่, ปีก, ท้อง)", "type": "workout" },
        { "day": "วันเสาร์", "activity": "Functional Mobility & 10,000 Steps (เดินผ่อนคลาย, ยืดเหยียด)", "type": "cardio" },
        { "day": "วันอาทิตย์", "activity": "Full Rest & Weekly Meal Prep (พักผ่อนเต็มที่ ชาร์จพลังงาน)", "type": "rest" }
      ],
      "dailyMeals": [
        { "meal": "มื้อเช้า", "time": "07:30 - 08:30", "menu": "ไข่ต้ม/ไข่คน 3 ฟอง + ขนมปังโฮลวีต 2 แผ่น + อะโวคาโดครึ่งลูก/กล้วยหอม + น้ำเปล่า 500ml", "protein": "26g", "calories": "480 kcal" },
        { "meal": "มื้อเที่ยง", "time": "12:00 - 13:00", "menu": "อกไก่ย่างสมุนไพร 180g + ข้าวกล้อง/ไรซ์เบอร์รี่ 1.5 ทัพพี + บรอกโคลี/ผักรวมนึ่ง", "protein": "45g", "calories": "580 kcal" },
        { "meal": "มื้อบ่าย (Pre-workout)", "time": "16:30", "menu": "เวย์โปรตีน 1 สกู๊ป หรือนมถั่วเหลืองโปรตีนสูง + กล้วยน้ำว้า 1-2 ลูก (พลังงานพร้อมซ้อม)", "protein": "27g", "calories": "260 kcal" },
        { "meal": "มื้อเย็น (Post-workout)", "time": "19:30 - 20:30", "menu": "ปลากะพงย่าง/สเต็กแซลมอน 180g + มันเทศนึ่ง 1 หัว + สลัดผักน้ำใสบัลซามิก", "protein": "42g", "calories": "540 kcal" }
      ],
      "recoveryRules": [
        "นอนหลับลึก 7.5 - 8.5 ชม. ต่อคืน (เข้านอนช่วง 22:30 - 23:00 น. เพื่อรับ Growth Hormone สูงสุด)",
        "งดใช้หน้าจอและมือถือ 30 นาทีก่อนนอน เพื่อคุณภาพการหลับแบบ Deep Sleep",
        "ดื่มน้ำสะอาดตลอดทั้งวันให้ได้ 2.5 - 3 ลิตร รักษาการสังเคราะห์โปรตีนและการไหลเวียนโลหิต",
        "ยืดเหยียดผ่อนคลายกล้ามเนื้อ (Foam Roll / Static Stretch) วันละ 10 นาทีก่อนนอน"
      ]
    },
    "workoutPlan": {
      "id": "program-tom-holland-3months",
      "title": "Tom Holland: Spider-Man Lean V-Taper (แผน 3 เดือน)",
      "titleTh": "โปรแกรมทอม ฮอลแลนด์ (Lean V-Taper & Core 3 เดือน)",
      "durationMinutes": 45,
      "intensity": "ปานกลาง",
      "split": "Upper Body & V-Taper",
      "exercises": [
        {
          "id": "ex-1",
          "name": "Incline Dumbbell Press",
          "nameTh": "ดัมเบลอินไคลน์เพรส (สร้างอกบนผึ่ง)",
          "sets": 4,
          "reps": "8-10",
          "suggestedWeight": "16-18 kg",
          "restSeconds": 75,
          "notes": "เปิดอก ล็อคสะบัก โฟกัสกล้ามเนื้ออกบนให้เต็มที่"
        },
        {
          "id": "ex-2",
          "name": "Wide-Grip Lat Pulldown / Pull-up",
          "nameTh": "ดึงข้อ / แลตพูลดาวน์กริปกว้าง",
          "sets": 4,
          "reps": "10-12",
          "suggestedWeight": "35-40 kg",
          "restSeconds": 75,
          "notes": "กางปีก ดึงศอกลงด้านข้างเพื่อสร้างสัดส่วนหลังรูปตัว V"
        },
        {
          "id": "ex-3",
          "name": "Dumbbell Lateral Raise",
          "nameTh": "ดัมเบลแลทเทอรัลเรส (ไหล่ข้าง 3D)",
          "sets": 4,
          "reps": "12-15",
          "suggestedWeight": "7-8 kg",
          "restSeconds": 60,
          "notes": "ยกขึ้นระดับเสมอไหล่ คอนโทรลจังหวะลงช้าๆ เพื่อไหล่กลมกลึง"
        },
        {
          "id": "ex-4",
          "name": "Spider-Man Plank & Hanging Knee Raise",
          "nameTh": "สไปเดอร์แมนแพลงก์ & ยกดักเข่า",
          "sets": 3,
          "reps": "15 ครั้ง",
          "suggestedWeight": "Bodyweight",
          "restSeconds": 45,
          "notes": "เกร็งแกนกลางลำตัว บิดเข่าแตะข้อศอก สร้างลายกล้ามท้องด้านข้าง"
        }
      ]
    }
  },
  "quickActions": ["นำแผน 3 เดือนไปใช้ในแอป 💪", "เริ่ม Workout ทันที", "ดูเมนูอาหารวันนี้"]
}`,
      config: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    if (text) {
      const parsed = JSON.parse(text);
      if (parsed.reply) {
        return res.json(parsed);
      }
    }
  } catch {
    // Proceed to robust rule-based fallback
  }

  // Context-aware fallback reply based on user intent
  const lower = String(message).toLowerCase();
  let reply = "ผมพร้อมดูแลและซัพพอร์ตคุณตลอดการฝึกครับ มีข้อสงสัยเรื่องท่าออกกำลังกาย อาหาร หรือต้องการปรับตารางฝึกวันนี้บอกผมได้เลยนะครับ!";
  let card: any = null;
  let quickActions = ["เริ่ม Workout", "เลื่อน 30 นาที", "บันทึกอาหาร"];

  const isTwoWeeks =
    lower.includes("2 สัปดาห์") ||
    lower.includes("สองสัปดาห์") ||
    lower.includes("2สัปดาห์") ||
    lower.includes("14 วัน") ||
    lower.includes("14วัน") ||
    lower.includes("2 weeks") ||
    lower.includes("สองอาทิตย์") ||
    lower.includes("2 อาทิตย์");

  const isOneMonth =
    targetDurationMonths === 1 ||
    lower.includes("1 เดือน") ||
    lower.includes("หนึ่งเดือน") ||
    lower.includes("1เดือน") ||
    lower.includes("4 สัปดาห์") ||
    lower.includes("4 weeks") ||
    lower.includes("1 month");

  const isTwoMonths =
    targetDurationMonths === 2 ||
    lower.includes("2 เดือน") ||
    lower.includes("สองเดือน") ||
    lower.includes("2เดือน") ||
    lower.includes("8 สัปดาห์") ||
    lower.includes("8 weeks") ||
    lower.includes("2 months") ||
    lower.includes("แค่ 2") ||
    lower.includes("เวลา 2") ||
    (lower.includes("ทำไม") && (lower.includes("3 เดือน") || lower.includes("สามเดือน") || lower.includes("3เดือน")));

  if (isTwoWeeks) {
    reply = `ถ้าคุณมีเวลา **แค่ 2 สัปดาห์ (14 วัน)** ผมขอพูดตามหลักวิทยาศาสตร์การกีฬาอย่างตรงไปตรงมาครับ:

⚡ **ใน 2 สัปดาห์ อะไรเกิดขึ้นได้จริงบ้าง?**
1. **ลดอาการบวมน้ำและไขมันส่วนเกินทันที (Rapid Water Retention & Bloat Drop)**: น้ำหนักจะลดลงได้ประมาณ 1.5 - 3 กก. ทันทีเมื่อตัดโซเดียมส่วนเกินและแป้งแปรรูป หน้าท้องจะแฟบแบนลงอย่างเห็นได้ชัด
2. **กล้ามเนื้อตึงกระชับและยกตัวขึ้น (Muscle Tone & Posture Activation)**: การเปิดหลังและบริหารหัวไหล่จะช่วยแก้ไหล่ห่อ อกผึ่งขึ้น ทำให้โครงสร้างตัวดูเป็นรูปตัว V ทันทีตั้งแต่สัปดาห์แรก
3. **ระบบเผาผลาญตื่นตัวสูงสุด (Metabolic Jumpstart)**: ปูพื้นฐานความฟิตและความแข็งแรง

🎯 **กลยุทธ์ "Spider-Man 14-Day Rapid Sprint"**:
• **สัปดาห์ที่ 1 (Day 1 - 7): Metabolic Flush & V-Taper Activation**
  - เน้นคาร์บเชิงซ้อนต่ำลงเล็กน้อย ดื่มน้ำวันละ 3.5 ลิตร เพื่อขับโซเดียมและของเหลวคั่งค้าง
  - ฝึก Upper V-Taper และ Bodyweight Calisthenics วันเว้นวัน
  - แคลอรี: ~1,950 kcal/วัน | โปรตีนสูง 155g/วัน เพื่อป้องกันกล้ามเนื้อสลาย
• **สัปดาห์ที่ 2 (Day 8 - 14): Peak Muscle Tone & Depletion-Refeed**
  - คาร์ดิโอ Incline Walk Zone 2 ทุกวัน 30 นาที รีดไขมันหน้าท้อง
  - โฟกัส Spider-Man Plank และ Hanging Knee Raise กระชับลายเส้น V-Line
  - แคลอรี: ~1,900 kcal/วัน | โปรตีน 160g/วัน

👇 ผมได้ปรับโปรแกรมเป็น **"Spider-Man Rapid Jumpstart (แผนเร่งด่วน 2 สัปดาห์)"** ให้พร้อมใช้งานแล้วครับ สามารถกดปุ่มนำไปใช้ได้ทันที!`;

    card = {
      type: "new_program",
      title: "Tom Holland: Spider-Man Rapid Sprint (แผนเร่งด่วน 2 สัปดาห์)",
      details: "แผนสปรินต์ 14 วัน รีดบวมน้ำ กระชับกล้ามเนื้ออก-ไหล่-หลัง และหน้าท้องแบนราบ",
      duration: "2 สัปดาห์ (14 วัน)",
      tags: ["TomHolland", "Sprint14Days", "RapidFatLoss", "Jumpstart"],
      plan3Months: {
        goalName: "Tom Holland: Spider-Man Rapid Sprint (แผนเร่งด่วน 2 สัปดาห์)",
        totalDuration: "2 สัปดาห์ (14 วัน)",
        totalMonths: 0.5,
        phases: [
          {
            month: 1,
            title: "สัปดาห์ที่ 1: Metabolic Flush & V-Taper Activation",
            focus: "ขับบวมน้ำ ลดโซเดียม กระตุ้นกล้ามเนื้ออกบนและไหล่ 3D ให้ตึงกระชับ",
            calories: "1,950 kcal/วัน",
            protein: "155g/วัน",
          },
          {
            month: 2,
            title: "สัปดาห์ที่ 2: Peak Definition & Core Tightening",
            focus: "กระชับหน้าท้อง ดึงลายเส้น V-Line และเดินชัน Zone 2 รีดไขมันหน้าท้อง",
            calories: "1,900 kcal/วัน",
            protein: "160g/วัน",
          },
        ],
        weeklySchedule: [
          { day: "วันจันทร์", activity: "Upper Body V-Taper (อกบน, ไหล่ 3D, หลังปีก)", type: "workout" },
          { day: "วันอังคาร", activity: "Spider-Man Core & Calisthenics (หน้าท้องและบอดี้เวท)", type: "workout" },
          { day: "วันพุธ", activity: "Zone 2 Incline Walk รีดไขมัน 35 นาที", type: "cardio" },
          { day: "วันพฤหัสบดี", activity: "Full Body Density & Explosive Legs", type: "workout" },
          { day: "วันศุกร์", activity: "Upper Pump & Six-Pack Definition", type: "workout" },
          { day: "วันเสาร์", activity: "Zone 2 Active Recovery & ยืดเหยียด 30 นาที", type: "cardio" },
          { day: "วันอาทิตย์", activity: "Full Rest & Recovery ชาร์จพลังงาน", type: "rest" },
        ],
        dailyMeals: [
          { meal: "มื้อเช้า", time: "07:30 - 08:30", menu: "ไข่ต้ม 3 ฟอง + ขนมปังโฮลวีต 1 แผ่น + น้ำเปล่า 500ml", protein: "25g", calories: "350 kcal" },
          { meal: "มื้อเที่ยง", time: "12:00 - 13:00", menu: "อกไก่ย่าง 200g + ข้าวกล้อง 1 ทัพพี + บรอกโคลีนึ่ง 1 ชามโต", protein: "48g", calories: "480 kcal" },
          { meal: "มื้อบ่าย", time: "16:30", menu: "เวย์โปรตีน 1 สกู๊ป + แอปเปิ้ลเขียว 1 ลูก", protein: "25g", calories: "180 kcal" },
          { meal: "มื้อเย็น", time: "19:30", menu: "สเต็กปลากะพง/แซลมอน 200g + สลัดผักน้ำใสบัลซามิก", protein: "45g", calories: "420 kcal" },
        ],
        recoveryRules: [
          "ดื่มน้ำสะอาดวันละ 3.2 - 3.5 ลิตร เพื่อขับโซเดียมและลดอาการบวมน้ำ",
          "ตัดน้ำตาลและอาหารแปรรูป 100% ตลอด 14 วันนี้",
          "นอนหลับ 8 ชั่วโมงเต็มเพื่อให้ฮอร์โมนเผาผลาญทำงานสมบูรณ์",
        ],
      },
      workoutPlan: {
        id: "plan-tom-holland-14d",
        title: "Spider-Man Rapid Sprint (14 วัน)",
        titleTh: "โปรแกรมสไปเดอร์แมนเร่งด่วน 14 วัน",
        durationMinutes: 40,
        intensity: "สูง",
        split: "Upper & Core Rapid Circuit",
        exercises: [
          { id: "sp-1", name: "Incline Dumbbell Press", nameTh: "ดัมเบลอินไคลน์เพรส (อกบน)", sets: 4, reps: "10-12", suggestedWeight: "14-16 kg", restSeconds: 60, notes: "บีบอกบนให้ตึงแน่น", category: "chest" },
          { id: "sp-2", name: "Wide-Grip Lat Pulldown", nameTh: "ดึงปีกหลัง V-Shape", sets: 4, reps: "12", suggestedWeight: "35 kg", restSeconds: 60, notes: "กางปีกให้กว้าง", category: "back" },
          { id: "sp-3", name: "Dumbbell Lateral Raise", nameTh: "ยกไหล่ข้าง 3D", sets: 4, reps: "15", suggestedWeight: "6-8 kg", restSeconds: 45, notes: "สร้างมิติไหล่กลมมน", category: "shoulders" },
          { id: "sp-4", name: "Spider-Man Plank", nameTh: "สไปเดอร์แมนแพลงก์", sets: 3, reps: "16 ครั้ง", suggestedWeight: "Bodyweight", restSeconds: 45, notes: "เข่าแตะศอก รีดเอวด้านข้าง", category: "core" },
        ],
      },
    };
    quickActions = ["นำแผน 2 สัปดาห์ไปใช้ในแอป 💪", "เริ่ม Workout ทันที", "ดูเมนูอาหารวันนี้"];
  } else if (isOneMonth) {
    reply = `ถ้าคุณมีเวลา **1 เดือน (4 สัปดาห์)** นี่คือระยะเวลาที่พอเหมาะอย่างยิ่งสำหรับ **"Rapid Kickstarter Transformation (แผนยกเครื่องสรีระเร่งด่วน 4 สัปดาห์)"** ครับ! 🚀

ใน 4 สัปดาห์ คุณสามารถ:
1. **ลดไขมันได้ 2–4 กิโลกรัมอย่างปลอดภัย** เมื่อคุม Caloric Deficit และทานโปรตีนเพียงพอ
2. **สร้างมิติ V-Taper เบื้องต้น**: หัวไหล่และปีกหลังจะเริ่มขยายขึ้น เอวจะกระชับลง ทำให้ดูมีทรงสามเหลี่ยมชัดเจนขึ้น
3. **เห็นร่องกล้ามท้อง (Abdominal Definition) ชัดเจนขึ้น**: โดยเฉพาะหน้าท้องส่วนบนและแนวเส้นข้างลำตัว

🎯 **กลยุทธ์การฝึก 4 สัปดาห์ (1 เดือน)**:
• **สัปดาห์ 1-2 (Foundation & Posture Recomp)**: วางโครงสร้างอกผึ่ง ไหล่กว้าง และปรับระบบเผาผลาญ พลังงาน ~2,100 kcal/วัน | โปรตีน 150g/วัน
• **สัปดาห์ 3-4 (Shred & Core Etching)**: ดันการเบิร์นไขมันด้วย Zone 2 และ Calisthenics รีดหน้าท้อง พลังงาน ~2,000 kcal/วัน | โปรตีน 155g/วัน

👇 ผมได้ปรับโปรแกรมเป็น **"Tom Holland: Spider-Man Lean V-Taper (แผน 1 เดือน)"** เรียบร้อยแล้วครับ!`;

    card = {
      type: "new_program",
      title: "Tom Holland: Spider-Man Lean V-Taper (แผน 1 เดือน)",
      details: "แผน 4 สัปดาห์ ปั้นไหล่ 3D หลังกว้างรูปตัว V และรีดไขมันกระชับหน้าท้องใน 1 เดือน",
      duration: "1 เดือน (4 สัปดาห์)",
      tags: ["TomHolland", "Plan1Month", "VTaper", "RapidTransformation"],
      plan3Months: {
        goalName: "Tom Holland: Spider-Man Lean V-Taper (แผน 1 เดือน)",
        totalDuration: "1 เดือน (4 สัปดาห์)",
        totalMonths: 1,
        phases: [
          {
            month: 1,
            title: "สัปดาห์ที่ 1-2: V-Taper Activation & Posture",
            focus: "สร้างมิติอกบนและไหล่ 3D ขยายปีกหลังรูปตัว V และปรับระบบเผาผลาญ",
            calories: "2,100 kcal/วัน",
            protein: "150g/วัน",
          },
          {
            month: 2,
            title: "สัปดาห์ที่ 3-4: Rapid Shred & Six-Pack Definition",
            focus: "รีดไขมันส่วนเกินด้วย Zone 2 ตัดลายหน้าท้องและเส้น V-Line ให้ชัดเจน",
            calories: "2,000 kcal/วัน",
            protein: "155g/วัน",
          },
        ],
        weeklySchedule: [
          { day: "วันจันทร์", activity: "Upper Body V-Taper (อกบน, ไหล่ 3D, หลังปีก)", type: "workout" },
          { day: "วันอังคาร", activity: "Core & Spider-Man Calisthenics (ดึงข้อ, ท้อง, บอดี้เวท)", type: "workout" },
          { day: "วันพุธ", activity: "Zone 2 Incline Walk รีดไขมัน 35 นาที", type: "cardio" },
          { day: "วันพฤหัสบดี", activity: "Lower Body & Explosive Power", type: "workout" },
          { day: "วันศุกร์", activity: "Upper Hypertrophy Pump & V-Line", type: "workout" },
          { day: "วันเสาร์", activity: "Functional Cardio & 10,000 Steps", type: "cardio" },
          { day: "วันอาทิตย์", activity: "Full Rest & Recovery ชาร์จพลังงาน 100%", type: "rest" },
        ],
        dailyMeals: [
          { meal: "มื้อเช้า", time: "07:30 - 08:30", menu: "ไข่ต้ม/ไข่คน 3 ฟอง + ขนมปังโฮลวีต 2 แผ่น + กล้วยหอม + น้ำเปล่า 500ml", protein: "28g", calories: "450 kcal" },
          { meal: "มื้อเที่ยง", time: "12:00 - 13:00", menu: "อกไก่ย่างสมุนไพร 200g + ข้าวกล้อง 1.5 ทัพพี + บรอกโคลีนึ่ง", protein: "48g", calories: "540 kcal" },
          { meal: "มื้อบ่าย", time: "16:30", menu: "เวย์โปรตีน 1 สกู๊ป + กล้วยน้ำว้า 1 ลูก", protein: "27g", calories: "220 kcal" },
          { meal: "มื้อเย็น", time: "19:30", menu: "สเต็กปลากะพง 200g + มันเทศนึ่ง 1 หัว + สลัดผักน้ำใส", protein: "45g", calories: "480 kcal" },
        ],
        recoveryRules: [
          "นอนหลับ 7.5 - 8.5 ชม. เพื่อให้ร่างกายหลั่ง Growth Hormone ซ่อมแซมกล้ามเนื้อ",
          "ดื่มน้ำวันละ 3 ลิตรเพื่อรักษาระดับการเผาผลาญ",
          "ยืดเหยียดผ่อนคลายกล้ามเนื้อวันละ 10 นาที",
        ],
      },
      workoutPlan: {
        id: "plan-tom-holland-1m",
        title: "Spider-Man Lean V-Taper (1 เดือน)",
        titleTh: "โปรแกรมสไปเดอร์แมน (แผน 1 เดือน 4 สัปดาห์)",
        durationMinutes: 45,
        intensity: "ปานกลาง-สูง",
        split: "Upper & V-Taper",
        exercises: [
          { id: "th-1", name: "Incline Dumbbell Bench Press", nameTh: "ดัมเบลอินไคลน์เพรส (อกบน)", sets: 4, reps: "8-10", suggestedWeight: "16 kg", restSeconds: 75, notes: "บีบอกบนที่จุดสูงสุด", category: "chest" },
          { id: "th-2", name: "Wide-Grip Lat Pulldown", nameTh: "ดึงข้อกริปกว้าง / แลตพูลดาวน์", sets: 4, reps: "10-12", suggestedWeight: "35 kg", restSeconds: 75, notes: "กางปีกกว้าง V-Shape", category: "back" },
          { id: "th-3", name: "Dumbbell Lateral Raise", nameTh: "ดัมเบลแลทเทอรัลเรส (ไหล่ 3D)", sets: 4, reps: "12-15", suggestedWeight: "7 kg", restSeconds: 60, notes: "สร้างมิติความกว้างลำตัว", category: "shoulders" },
          { id: "th-4", name: "Spider-Man Plank & Hanging Knee Raise", nameTh: "สไปเดอร์แมนแพลงก์ & ยกดักเข่า", sets: 3, reps: "15 ครั้ง", suggestedWeight: "Bodyweight", restSeconds: 45, notes: "รีดเอวและแกนกลางลำตัว", category: "core" },
        ],
      },
    };
    quickActions = ["นำแผน 1 เดือนไปใช้ในแอป 💪", "เริ่ม Workout ทันที", "ดูเมนูอาหารวันนี้"];
  } else if (isTwoMonths) {
    reply = `ขออภัยอย่างสูงด้วยครับคุณตัน! 🙏 ผมขออธิบายเหตุผลและปรับแผนให้ตรงกับเวลาจริงของคุณทันทีครับ:

สาเหตุที่ระบบครั้งแรกแสดงผล 3 เดือน (12 สัปดาห์) นั้น เกิดจาก **โมเดลค่าเริ่มต้นสากล (Baseline)** ของการ Recomposition สรีระแบบค่อยเป็นค่อยไปเพื่อความยั่งยืน แต่ **เมื่อคุณมีเวลาที่ชัดเจนและจำกัดเพียง 2 เดือน (8 สัปดาห์)** ระบบต้องเปลี่ยนเกียร์มาใช้ **"Accelerated 8-Week Transformation (แผนปั้นหุ่นสไปเดอร์แมนแบบเร่งรัด 8 สัปดาห์)"** ทันทีครับ! ⚡🕷️

เพื่อให้คุณเห็นผลลัพธ์หุ่น Tom Holland (อกผึ่ง ไหล่ 3D หลังกว้างรูปตัว V และลายซิกแพกคมชัด) ภายในกรอบเวลา 8 สัปดาห์ เราได้ปรับกลยุทธ์ 3 จุดสำคัญ:
1. **บีบอัดเป็น 2 เฟสหลักแบบเข้มข้น**: เฟส 1 (สัปดาห์ 1-4) เน้นเปิดแผ่นหลังและสร้างไหล่ 3D ให้รูปร่างเปลี่ยนชัดเจนในเดือนแรก และเฟส 2 (สัปดาห์ 5-8) รีดไขมันตัดลายกล้ามเนื้อและดึง Six-Pack ออกมาให้คมชัดที่สุด
2. **ปรับโภชนาการแบบ Caloric Deficit กระชับขึ้น**: ควบคุมพลังงานที่ ~2,050 - 2,150 kcal/วัน พร้อม **เพิ่มโปรตีนเป็น 150-155g/วัน** เพื่อป้องกันการสูญเสียกล้ามเนื้อในช่วงเร่งรัด
3. **ผสาน Calisthenics & Zone 2 Fat Burn**: เพิ่มอัตราการเผาผลาญไขมันสะสมในเวลาที่จำกัด

---

⏳ **1. แผน Roadmap การเปลี่ยนแปลง 2 เดือน (8-Week Accelerated Transformation Phases)**
• **เดือนที่ 1: Accelerated Foundation & V-Taper Activation (สัปดาห์ที่ 1 - 4)**
  - *เป้าหมาย*: สร้างโครงร่าง V-Taper เร่งด่วน เปิดกล้ามเนื้อปีกหลัง (Lats) ให้กว้าง ดันหัวไหล่ด้านข้าง (Lateral Delts) 3 มิติให้กลมมน เพื่อหลอกสายตาให้เอวดูคอดเล็กลงทันที พร้อมกระตุ้นระบบเผาผลาญสลายไขมันชั้นแรก
  - *โภชนาการ*: ~2,150 kcal/วัน (Caloric Deficit กระชับขึ้น) | โปรตีน 150 กรัม/วัน

• **เดือนที่ 2: Rapid Shred & Spider-Man Definition (สัปดาห์ที่ 5 - 8)**
  - *เป้าหมาย*: รีดเปอร์เซ็นต์ไขมันลงสู่ระดับ 10–12% เพื่อให้เห็นลายกล้ามท้อง Six-Pack และเส้น V-Line (Obliques) อย่างคมกริบ พร้อมเสริมความคล่องตัวและพละกำลังแบบบอดี้เวท ให้ได้ร่าง Spider-Man สมบูรณ์แบบภายในสัปดาห์ที่ 8
  - *โภชนาการ*: ~2,000 - 2,050 kcal/วัน | โปรตีน 155 กรัม/วัน (โปรตีนสูงเพื่อคงมวลกล้ามเนื้อ)

---

📅 **2. ตารางการฝึกในแต่ละวัน (Daily Schedule: จันทร์ - อาทิตย์)**
• **วันจันทร์ (Upper Body V-Taper - 45 นาที)**:
  - ท่าฝึก: Incline Dumbbell Press (อกบนผึ่ง), Wide-Grip Pull-Up/Lat Pulldown (หลังปีก V-Shape), Dumbbell Lateral Raise (ไหล่ 3D), Tricep Rope Pushdown
• **วันอังคาร (Core & Spider-Man Calisthenics - 40 นาที)**:
  - ท่าฝึก: Pull-ups (ดึงข้อ), Spider-Man Plank (ดึงเข่าแตะศอกสร้าง V-Line), Hanging Knee Raise (หน้าท้องล่าง), Push-ups
• **วันพุธ (Accelerated Zone 2 & Metabolic Conditioning - 35 นาที)**:
  - กิจกรรม: เดินเร็วบนลู่ชัน (Incline Walk) คุม Heart Rate Zone 2 เผาผลาญไขมันสะสม + โฟมโรลเลอร์และยืดเหยียด Mobility 10 นาที
• **วันพฤหัสบดี (Lower Body & Explosive Legs - 45 นาที)**:
  - ท่าฝึก: Goblet Squat, Romanian Deadlift (แฮมสตริงและก้น), Calf Raise (น่องกระชับ), Jump Lunges (พลังและความคล่องตัว)
• **วันศุกร์ (Upper Hypertrophy Pump & Definition - 45 นาที)**:
  - ท่าฝึก: Incline Chest Flye, Cable Lateral Raise, Face Pull (แก้ไหล่ห่อ ปรับบุคลิกอกผึ่ง), Russian Twist (V-Line ด้านข้าง)
• **วันเสาร์ (Functional Calisthenics & 10,000 Steps)**:
  - กิจกรรม: เดินกระตุ้นการเผาผลาญ 8,000–10,000 ก้าว หรือว่ายน้ำ/ปั่นจักรยานเบาๆ ยืดเหยียดกล้ามเนื้อ
• **วันอาทิตย์ (Full Rest & Muscle Recovery 100%)**:
  - กิจกรรม: พักผ่อน 100% ชาร์จพลังงาน เตรียมกล่องอาหารสำหรับสัปดาห์ถัดไป

---

🥗 **3. ข้อมูลโภชนาการและการเตรียมอาหารในทุกๆ วัน (Daily Meal Prep Blueprint สำหรับแผน 2 เดือน)**
*เป้าหมายเฉลี่ยรายวัน: ~2,050 - 2,150 kcal | โปรตีน 150–155g | คาร์โบไฮเดรตเชิงซ้อน 200–210g | ไขมันดี 50g*

• **มื้อเช้า (07:30 - 08:30 น.)** *(~460 kcal | โปรตีน 28g)*:
  - ไข่ต้มหรือไข่คน 3 ฟอง (ไข่เต็มฟอง 2 ฟอง + ไข่ขาว 1 ฟอง)
  - ขนมปังโฮลวีตปิ้ง 2 แผ่น ทาเนยถั่วธรรมชาติบางๆ หรือวางอะโวคาโด 1/4 ผล
  - กล้วยหอม 1 ลูก
  - น้ำเปล่าอุณหภูมิห้อง 500 ml

• **มื้อเที่ยง (12:00 - 13:00 น.)** *(~570 kcal | โปรตีน 48g)*:
  - อกไก่ย่างสมุนไพร หรือสันในไก่ 200 กรัม (หมักพริกไทยดำ เกลือชมพู ซีอิ๊วโซเดียมต่ำ)
  - ข้าวกล้อง หรือข้าวไรซ์เบอร์รี่ 1.5 ทัพพี (~150 กรัม)
  - บรอกโคลี, แครอท หรือฟักทองนึ่ง 1 ถ้วยใหญ่

• **มื้อบ่าย / Pre-Workout (16:30 น.)** *(~260 kcal | โปรตีน 27g)*:
  - เวย์โปรตีน 1 สกู๊ป (หรือนมถั่วเหลืองโปรตีนสูงสูตรไม่หวาน)
  - กล้วยน้ำว้า 1-2 ลูก (คาร์บย่อยเร็ว ให้พลังงานพร้อมยกเวท)

• **มื้อเย็น / Post-Workout (19:30 - 20:30 น.)** *(~520 kcal | โปรตีน 45g)*:
  - ปลากะพงย่าง หรือสเต็กแซลมอน 190 กรัม (หรืออกไก่ต้มฉีก)
  - มันเทศนึ่ง 1 หัวกลาง หรือข้าวกล้อง 1 ทัพพี
  - สลัดผักใบเขียวราดน้ำสลัดบัลซามิกหรือน้ำมันมะกอก 1 ช้อนชา

• **น้ำดื่มตลอดวัน**: ดื่มน้ำ 2.8 - 3 ลิตรต่อวัน จิบสม่ำเสมอเพื่อฟื้นฟูกล้ามเนื้อและกระตุ้นการเผาผลาญ

---

🛌 **4. การพักผ่อนและการฟื้นฟู (Recovery Protocol ในช่วงเร่งรัด)**
• **ชั่วโมงการนอน**: นอนหลับ 7.5 - 8.5 ชั่วโมงต่อคืน (เข้านอนช่วง 22:30 - 23:00 น. เพื่อให้ร่างกายได้รับ Growth Hormone สูงสุด)
• **งดแสงสีฟ้า**: ปิดหน้าจอโทรศัพท์อย่างน้อย 30 นาทีก่อนนอน เพื่อเข้าสู่ Deep Sleep รวดเร็ว
• **Stretching ประจำวัน**: ยืดเหยียดแนวสะบักและสะโพก 10 นาทีทุกคืน

👇 ผมได้ปรับการ์ดแผนการฝึกด้านล่างเป็น **"แผนเร่งรัด 2 เดือน (8 สัปดาห์)"** เรียบร้อยแล้วครับ คุณสามารถกดปุ่ม **"นำแผน 2 เดือนไปใช้ในแอป"** ได้ทันทีครับ!`;

    card = {
      type: "new_program",
      title: "Tom Holland: Spider-Man Lean V-Taper (แผนเร่งรัด 2 เดือน)",
      details: "แผนเร่งรัด 8 สัปดาห์ ปั้นหุ่น V-Taper ไหล่ 3D หลังกว้าง และ Six-Pack คมชัด รองรับกรอบเวลา 2 เดือน",
      duration: "2 เดือน (8 สัปดาห์)",
      tags: ["TomHolland", "Accelerated8Weeks", "VTaper", "Plan2Months", "SpiderMan"],
      plan3Months: {
        goalName: "Tom Holland: Spider-Man Lean V-Taper (แผนเร่งรัด 2 เดือน)",
        totalDuration: "2 เดือน (8 สัปดาห์)",
        totalMonths: 2,
        phases: [
          {
            month: 1,
            title: "เดือนที่ 1: Accelerated Foundation & V-Taper",
            focus: "สร้างฐาน V-Taper เร่งด่วน, ไหล่ 3D, ปรับระบบเผาผลาญ และเริ่มสลายไขมันชั้นแรก",
            calories: "2,150 kcal/วัน",
            protein: "150g/วัน",
          },
          {
            month: 2,
            title: "เดือนที่ 2: Rapid Shred & Spider-Man Definition",
            focus: "รีดไขมันลงสู่ 10–12%, ตัดลาย Six-Pack และ V-Line ด้านข้างให้คมกริบในสัปดาห์ที่ 8",
            calories: "2,050 kcal/วัน",
            protein: "155g/วัน",
          },
        ],
        weeklySchedule: [
          { day: "วันจันทร์", activity: "Upper Body V-Taper (อกบน, ไหล่ 3D, หลังปีก)", type: "workout" },
          { day: "วันอังคาร", activity: "Core & Spider-Man Calisthenics (ดึงข้อ, ท้อง, บอดี้เวท)", type: "workout" },
          { day: "วันพุธ", activity: "Accelerated Zone 2 & Metabolic HIIT (เดินชัน 35 นาที)", type: "cardio" },
          { day: "วันพฤหัสบดี", activity: "Lower Body & Explosive Legs (สควอท, ก้น, น่อง, คล่องตัว)", type: "workout" },
          { day: "วันศุกร์", activity: "Upper Hypertrophy Pump & Definition (อก, ไหล่, ปีก, ท้อง)", type: "workout" },
          { day: "วันเสาร์", activity: "Functional Calisthenics & 10,000 Steps (เดินกระตุ้นการเผาผลาญ)", type: "cardio" },
          { day: "วันอาทิตย์", activity: "Full Rest & Muscle Recovery (พักผ่อนเต็มที่ ชาร์จพลังงาน)", type: "rest" },
        ],
        dailyMeals: [
          { meal: "มื้อเช้า", time: "07:30 - 08:30", menu: "ไข่ต้ม/ไข่คน 3 ฟอง + ขนมปังโฮลวีต 2 แผ่น + อะโวคาโดครึ่งลูก/กล้วยหอม + น้ำเปล่า 500ml", protein: "28g", calories: "460 kcal" },
          { meal: "มื้อเที่ยง", time: "12:00 - 13:00", menu: "อกไก่ย่างสมุนไพร 200g + ข้าวกล้อง/ไรซ์เบอร์รี่ 1.5 ทัพพี + บรอกโคลี/ผักรวมนึ่ง", protein: "48g", calories: "570 kcal" },
          { meal: "มื้อบ่าย (Pre-workout)", time: "16:30", menu: "เวย์โปรตีน 1 สกู๊ป หรือนมถั่วเหลืองโปรตีนสูง + กล้วยน้ำว้า 1-2 ลูก (พลังงานพร้อมซ้อม)", protein: "27g", calories: "260 kcal" },
          { meal: "มื้อเย็น (Post-workout)", time: "19:30 - 20:30", menu: "ปลากะพงย่าง/สเต็กแซลมอน 190g + มันเทศนึ่ง 1 หัว + สลัดผักน้ำใสบัลซามิก", protein: "45g", calories: "520 kcal" },
        ],
        recoveryRules: [
          "นอนหลับลึก 7.5 - 8.5 ชม. ต่อคืน (เข้านอนช่วง 22:30 - 23:00 น. เพื่อรับ Growth Hormone สูงสุด)",
          "งดใช้หน้าจอและมือถือ 30 นาทีก่อนนอน เพื่อคุณภาพการหลับแบบ Deep Sleep",
          "ดื่มน้ำสะอาดตลอดทั้งวันให้ได้ 2.8 - 3 ลิตร รักษาการสังเคราะห์โปรตีนและการไหลเวียนโลหิต",
          "ยืดเหยียดผ่อนคลายกล้ามเนื้อ (Foam Roll / Static Stretch) วันละ 10 นาทีก่อนนอน",
        ],
      },
      workoutPlan: {
        id: "plan-tom-holland-vtaper-2m",
        title: "Tom Holland: Spider-Man Lean V-Taper (แผนเร่งรัด 2 เดือน)",
        titleTh: "โปรแกรมทอม ฮอลแลนด์ (แผนเร่งรัด 2 เดือน 8 สัปดาห์)",
        durationMinutes: 45,
        intensity: "ปานกลาง-สูง",
        split: "Upper Body & V-Taper",
        exercises: [
          {
            id: "th-1",
            name: "Incline Dumbbell Bench Press",
            nameTh: "ดัมเบลอินไคลน์เพรส (สร้างอกบนผึ่ง)",
            sets: 4,
            reps: "8-10",
            suggestedWeight: "16-18 kg",
            restSeconds: 75,
            notes: "ปรับเบาะ 30 องศา โฟกัสการบีบกล้ามเนื้ออกบนที่จุดสูงสุด",
            category: "chest",
          },
          {
            id: "th-2",
            name: "Wide-Grip Pull-Up / Lat Pulldown",
            nameTh: "ดึงข้อกริปกว้าง / แลตพูลดาวน์",
            sets: 4,
            reps: "10-12",
            suggestedWeight: "35-40 kg",
            restSeconds: 75,
            notes: "ดึงศอกลงหาเอว กางปีกกว้างเพื่อสัดส่วน V-Shape แบบสไปเดอร์แมน",
            category: "back",
          },
          {
            id: "th-3",
            name: "Dumbbell Lateral Raise",
            nameTh: "ดัมเบลแลทเทอรัลเรส (ไหล่ข้าง 3D)",
            sets: 4,
            reps: "12-15",
            suggestedWeight: "7-8 kg",
            restSeconds: 60,
            notes: "ยกเสมอหัวไหล่ โฟกัสหัวไหล่ด้านข้างเพื่อสร้างความกว้างของลำตัว",
            category: "shoulders",
          },
          {
            id: "th-4",
            name: "Spider-Man Plank & Hanging Knee Raise",
            nameTh: "สไปเดอร์แมนแพลงก์ & ยกดักเข่า",
            sets: 3,
            reps: "15 ครั้ง",
            suggestedWeight: "Bodyweight",
            restSeconds: 45,
            notes: "ดึงเข่าแตะข้อศอกด้านข้างสลับซ้ายขวา สร้างกล้ามท้องและ V-Line",
            category: "core",
          },
        ],
      },
    };
    quickActions = ["นำแผน 2 เดือนไปใช้ในแอป 💪", "เริ่ม Workout ทันที", "ดูเมนูอาหารวันนี้"];
  } else if (
    lower.includes("ทอม ฮอลแลนด์") ||
    lower.includes("tom holland") ||
    lower.includes("spider") ||
    lower.includes("สไปเดอร์") ||
    lower.includes("3 เดือน") ||
    lower.includes("สามเดือน") ||
    lower.includes("กี่เดือน") ||
    lower.includes("จัดโปรแกรม") ||
    lower.includes("ตารางฝึก") ||
    lower.includes("อยากมีหุ่น") ||
    lower.includes("อยากได้หุ่น") ||
    lower.includes("โภชนาการ") ||
    lower.includes("แต่ละวัน")
  ) {
    reply = `ยอดเยี่ยมมากครับคุณตัน! 🕷️💪 การสร้างหุ่นแบบ **ทอม ฮอลแลนด์ (Tom Holland)** ในบท Spider-Man นั้น หัวใจสำคัญคือสรีระแบบ **"Lean Athletic Physique"** (ลีน ปราดเปรียว ไหล่กว้าง V-Taper กล้ามท้องคมชัด) 

เพื่อให้เห็นผลลัพธ์ที่ชัดเจนและยั่งยืน **ต้องใช้เวลา 3 เดือน (12 สัปดาห์)** โดยผมได้วาง Blueprint ครอบคลุมทั้งแผน 3 เดือน, สิ่งที่ต้องทำในแต่ละวัน, การเตรียมอาหารโภชนาการ และการพักผ่อนไว้ให้ครบถ้วนดังนี้ครับ:

---

⏳ **1. แผน Roadmap การเปลี่ยนแปลง 3 เดือน (12-Week Transformation Phases)**
• **เดือนที่ 1: Foundation & Conditioning (ปรับสรีระ & สร้างฐาน V-Taper)**
  - *เป้าหมาย*: ปรับระบบเผาผลาญ สลายไขมันสะสม ลดอาการบวม วางโครงสร้างกล้ามเนื้อไหล่และหลังปีก (V-Taper) พร้อมเสริมความแข็งแรงของแกนกลางลำตัว
  - *โภชนาการ*: ~2,200 kcal/วัน (Slight Deficit ปลอดภัย) | โปรตีน 145 กรัม/วัน

• **เดือนที่ 2: Hypertrophy & Density (เพิ่มความหนาแน่นและมิติกล้ามเนื้อ)**
  - *เป้าหมาย*: ดันกล้ามอกบน (Upper Chest) ให้ผึ่งและไหล่ข้างกลมมน 3D ขยายปีกหลังให้เอวดูคอดชัดขึ้น เพิ่ม Progressive Overload
  - *โภชนาการ*: ~2,250 kcal/วัน | โปรตีน 150 กรัม/วัน

• **เดือนที่ 3: Spider-Man Definition & Calisthenics (รีดไขมันตัดลายกล้ามคมชัด)**
  - *เป้าหมาย*: รีดเปอร์เซ็นต์ไขมันลงสู่ระดับ 10–12% เพื่อให้เห็นลายกล้ามท้อง Six-Pack และ V-Line (Obliques) อย่างคมกริบ พร้อมเสริมความคล่องตัวและพละกำลังแบบบอดี้เวท
  - *โภชนาการ*: ~2,100 kcal/วัน | โปรตีน 150 กรัม/วัน

---

📅 **2. การเล่นในแต่ละวัน (Daily Schedule: จันทร์ - อาทิตย์)**
• **วันจันทร์ (Upper Body V-Taper - 45 นาที)**:
  - ท่าฝึก: Incline Dumbbell Press (อกบน), Wide-Grip Lat Pulldown (หลังปีก V-Shape), Dumbbell Lateral Raise (ไหล่ข้าง 3D), Tricep Rope Pushdown
• **วันอังคาร (Core & Spider-Man Calisthenics - 40 นาที)**:
  - ท่าฝึก: Pull-ups (ดึงข้อ), Spider-Man Plank (ดึงเข่าแตะศอก), Hanging Knee Raise (หน้าท้องล่าง), Push-ups
• **วันพุธ (Active Recovery & Zone 2 Fat Burn - 35 นาที)**:
  - กิจกรรม: เดินเร็วบนลู่ชัน (Incline Walk) คุม Heart Rate Zone 2 เผาผลาญไขมันบริสุทธิ์ + โฟมโรลเลอร์และยืดเหยียด Mobility 10 นาที
• **วันพฤหัสบดี (Lower Body & Explosive Legs - 45 นาที)**:
  - ท่าฝึก: Goblet Squat, Romanian Deadlift (แฮมสตริงและก้น), Calf Raise (น่องกระชับ), Jump Lunges (พลังและความคล่องตัว)
• **วันศุกร์ (Upper Hypertrophy Pump & V-Line Abs - 45 นาที)**:
  - ท่าฝึก: Incline Chest Flye, Cable Lateral Raise, Face Pull (แก้ไหล่ห่อ ปรับบุคลิก), Russian Twist (V-Line ด้านข้าง)
• **วันเสาร์ (Functional Movement & Mobility Flow)**:
  - กิจกรรม: เดินผ่อนคลายให้ครบ 8,000–10,000 ก้าว หรือว่ายน้ำ/ปั่นจักรยานเบาๆ ยืดเหยียดคลายกล้ามเนื้อ
• **วันอาทิตย์ (Full Rest & Weekly Meal Prep)**:
  - กิจกรรม: พักผ่อน 100% ชาร์จพลังงาน เตรียมกล่องอาหารสำหรับสัปดาห์ถัดไป

---

🥗 **3. ข้อมูลโภชนาการและการเตรียมอาหารในทุกๆ วัน (Daily Meal Prep Blueprint)**
*เป้าหมายเฉลี่ยรายวัน: ~2,200 kcal | โปรตีน 145–150g | คาร์โบไฮเดรตเชิงซ้อน 230g | ไขมันดี 55g*

• **มื้อเช้า (07:30 - 08:30 น.)** *(~480 kcal | โปรตีน 26g)*:
  - ไข่ต้มหรือไข่คน 3 ฟอง (ไข่เต็มฟอง 2 ฟอง + ไข่ขาว 1 ฟอง)
  - ขนมปังโฮลวีตปิ้ง 2 แผ่น ทาเนยถั่วธรรมชาติบางๆ หรือวางอะโวคาโด 1/4 ผล
  - กล้วยหอม 1 ลูก หรือผลไม้ตระกูลเบอร์รี่
  - น้ำเปล่าอุณหภูมิห้อง 500 ml

• **มื้อเที่ยง (12:00 - 13:00 น.)** *(~580 kcal | โปรตีน 45g)*:
  - อกไก่ย่างสมุนไพร หรือสันในไก่ 180 กรัม (หมักพริกไทยดำ เกลือชมพู ซีอิ๊วโซเดียมต่ำ)
  - ข้าวกล้อง หรือข้าวไรซ์เบอร์รี่ 1.5 ทัพพี (~150 กรัม)
  - บรอกโคลี, แครอท หรือฟักทองนึ่ง 1 ถ้วยใหญ่

• **มื้อบ่าย / Pre-Workout (16:30 น.)** *(~260 kcal | โปรตีน 27g)*:
  - เวย์โปรตีน 1 สกู๊ป (หรือนมถั่วเหลืองโปรตีนสูงสูตรไม่หวาน)
  - กล้วยน้ำว้า 1-2 ลูก (คาร์บย่อยเร็ว ให้พลังงานพร้อมยกเวท)

• **มื้อเย็น / Post-Workout (19:30 - 20:30 น.)** *(~540 kcal | โปรตีน 42g)*:
  - ปลากะพงย่าง หรือสเต็กแซลมอน 180 กรัม (หรืออกไก่ต้มฉีก)
  - มันเทศนึ่ง 1 หัวกลาง หรือข้าวกล้อง 1 ทัพพี
  - สลัดผักใบเขียวราดน้ำสลัดบัลซามิกหรือน้ำมันมะกอก 1 ช้อนชา

• **น้ำดื่มตลอดวัน**: จิบสม่ำเสมอให้ได้ 2.5 - 3 ลิตรต่อวัน เพื่อให้การสังเคราะห์โปรตีนและการทำงานของกล้ามเนื้อสมบูรณ์

---

🛌 **4. การพักผ่อนและการนอนหลับ (Recovery Protocol)**
• **ชั่วโมงการนอน**: นอนหลับ 7.5 - 8.5 ชั่วโมงต่อคืน (แนะนำเข้านอนช่วง 22:30 - 23:00 น. เพื่อให้ร่างกายได้รับ Growth Hormone สูงสุดช่วง 23:00 - 02:00 น.)
• **งดแสงสีฟ้า**: ปิดหน้าจอโทรศัพท์และคอมพิวเตอร์อย่างน้อย 30 นาทีก่อนนอน เพื่อคุณภาพการหลับลึก (Deep Sleep)
• **Stretching ก่อนนอน**: ยืดเหยียดแนวสะบักและสะโพก 5-10 นาที ช่วยลดอาการตึงเกร็งและหลับสบายขึ้น

👇 ผมได้บรรจุแผน **"Tom Holland 3-Month Transformation"** ลงในการ์ดแบบละเอียดด้านล่างแล้วครับ สามารถกดสลับดูแต่ละแท็บและกดปุ่มนำไปใช้ในแอปได้ทันทีครับ!`;

    card = {
      type: "new_program",
      title: "Tom Holland: Spider-Man Lean V-Taper (แผน 3 เดือน)",
      details: "แผน 12 สัปดาห์ ปั้นหุ่น V-Taper ไหล่ 3D หลังกว้าง แกนกลางลำตัว พร้อมโภชนาการและตารางรายวัน",
      duration: "3 เดือน (45 นาที/วัน)",
      tags: ["TomHolland", "SpiderMan", "VTaper", "Plan3Months", "AthleticCore"],
      plan3Months: {
        goalName: "Tom Holland: Spider-Man Lean V-Taper (แผน 3 เดือน)",
        totalDuration: "3 เดือน (12 สัปดาห์)",
        phases: [
          {
            month: 1,
            title: "เดือนที่ 1: Foundation & Body Recomp",
            focus: "สร้างฐาน V-Taper, ไหล่ 3D, ปรับระบบเผาผลาญ และเริ่มสลายไขมันส่วนเกิน",
            calories: "2,200 kcal/วัน",
            protein: "145g/วัน",
          },
          {
            month: 2,
            title: "เดือนที่ 2: Hypertrophy & Density",
            focus: "เพิ่มความหนาแน่นกล้ามเนื้ออกบน ขยายปีกหลังรูปตัว V และพัฒนาความทนทาน",
            calories: "2,250 kcal/วัน",
            protein: "150g/วัน",
          },
          {
            month: 3,
            title: "เดือนที่ 3: Spider-Man Definition & Calisthenics",
            focus: "รีดไขมันลงสู่ 10–12%, ตัดลาย Six-Pack และ V-Line ด้านข้างให้คมกริบ",
            calories: "2,100 kcal/วัน",
            protein: "150g/วัน",
          },
        ],
        weeklySchedule: [
          { day: "วันจันทร์", activity: "Upper Body V-Taper (อกบน, ไหล่ 3D, หลังปีก)", type: "workout" },
          { day: "วันอังคาร", activity: "Core & Spider-Man Calisthenics (ดึงข้อ, ท้อง, บอดี้เวท)", type: "workout" },
          { day: "วันพุธ", activity: "Active Recovery & Zone 2 Fat Burn (เดินชัน 35 นาที)", type: "cardio" },
          { day: "วันพฤหัสบดี", activity: "Lower Body & Explosive Legs (สควอท, ก้น, น่อง, คล่องตัว)", type: "workout" },
          { day: "วันศุกร์", activity: "Upper Hypertrophy Pump & V-Line Abs (อก, ไหล่, ปีก, ท้อง)", type: "workout" },
          { day: "วันเสาร์", activity: "Functional Mobility & 10,000 Steps (เดินผ่อนคลาย, ยืดเหยียด)", type: "cardio" },
          { day: "วันอาทิตย์", activity: "Full Rest & Weekly Meal Prep (พักผ่อนเต็มที่ ชาร์จพลังงาน)", type: "rest" },
        ],
        dailyMeals: [
          { meal: "มื้อเช้า", time: "07:30 - 08:30", menu: "ไข่ต้ม/ไข่คน 3 ฟอง + ขนมปังโฮลวีต 2 แผ่น + อะโวคาโดครึ่งลูก/กล้วยหอม + น้ำเปล่า 500ml", protein: "26g", calories: "480 kcal" },
          { meal: "มื้อเที่ยง", time: "12:00 - 13:00", menu: "อกไก่ย่างสมุนไพร 180g + ข้าวกล้อง/ไรซ์เบอร์รี่ 1.5 ทัพพี + บรอกโคลี/ผักรวมนึ่ง", protein: "45g", calories: "580 kcal" },
          { meal: "มื้อบ่าย (Pre-workout)", time: "16:30", menu: "เวย์โปรตีน 1 สกู๊ป หรือนมถั่วเหลืองโปรตีนสูง + กล้วยน้ำว้า 1-2 ลูก (พลังงานพร้อมซ้อม)", protein: "27g", calories: "260 kcal" },
          { meal: "มื้อเย็น (Post-workout)", time: "19:30 - 20:30", menu: "ปลากะพงย่าง/สเต็กแซลมอน 180g + มันเทศนึ่ง 1 หัว + สลัดผักน้ำใสบัลซามิก", protein: "42g", calories: "540 kcal" },
        ],
        recoveryRules: [
          "นอนหลับลึก 7.5 - 8.5 ชม. ต่อคืน (เข้านอนช่วง 22:30 - 23:00 น. เพื่อรับ Growth Hormone สูงสุด)",
          "งดใช้หน้าจอและมือถือ 30 นาทีก่อนนอน เพื่อคุณภาพการหลับแบบ Deep Sleep",
          "ดื่มน้ำสะอาดตลอดทั้งวันให้ได้ 2.5 - 3 ลิตร รักษาการสังเคราะห์โปรตีนและการไหลเวียนโลหิต",
          "ยืดเหยียดผ่อนคลายกล้ามเนื้อ (Foam Roll / Static Stretch) วันละ 10 นาทีก่อนนอน",
        ],
      },
      workoutPlan: {
        id: "plan-tom-holland-vtaper",
        title: "Tom Holland: Spider-Man Lean V-Taper (แผน 3 เดือน)",
        titleTh: "โปรแกรมทอม ฮอลแลนด์ (Lean V-Taper & Core 3 เดือน)",
        durationMinutes: 45,
        intensity: "ปานกลาง",
        split: "Upper Body & V-Taper",
        exercises: [
          {
            id: "th-1",
            name: "Incline Dumbbell Bench Press",
            nameTh: "ดัมเบลอินไคลน์เพรส (สร้างอกบนผึ่ง)",
            sets: 4,
            reps: "8-10",
            suggestedWeight: "16-18 kg",
            restSeconds: 75,
            notes: "ปรับเบาะ 30 องศา โฟกัสการบีบกล้ามเนื้ออกบนที่จุดสูงสุด",
            category: "chest",
          },
          {
            id: "th-2",
            name: "Wide-Grip Pull-Up / Lat Pulldown",
            nameTh: "ดึงข้อกริปกว้าง / แลตพูลดาวน์",
            sets: 4,
            reps: "10-12",
            suggestedWeight: "35-40 kg",
            restSeconds: 75,
            notes: "ดึงศอกลงหาเอว กางปีกกว้างเพื่อสัดส่วน V-Shape แบบสไปเดอร์แมน",
            category: "back",
          },
          {
            id: "th-3",
            name: "Dumbbell Lateral Raise",
            nameTh: "ดัมเบลแลทเทอรัลเรส (ไหล่ข้าง 3D)",
            sets: 4,
            reps: "12-15",
            suggestedWeight: "7-8 kg",
            restSeconds: 60,
            notes: "ยกเสมอหัวไหล่ โฟกัสหัวไหล่ด้านข้างเพื่อสร้างความกว้างของลำตัว",
            category: "shoulders",
          },
          {
            id: "th-4",
            name: "Spider-Man Plank & Hanging Knee Raise",
            nameTh: "สไปเดอร์แมนแพลงก์ & ยกดักเข่า",
            sets: 3,
            reps: "15 ครั้ง",
            suggestedWeight: "Bodyweight",
            restSeconds: 45,
            notes: "ดึงเข่าแตะข้อศอกด้านข้างสลับซ้ายขวา สร้างกล้ามท้องและ V-Line",
            category: "core",
          },
        ],
      },
    };
    quickActions = ["นำแผน 3 เดือนไปใช้ในแอป 💪", "เริ่ม Workout ทันที", "ดูเมนูอาหารวันนี้"];
  } else if (lower.includes("เริ่ม") || lower.includes("พร้อม") || lower.includes("ซ้อม")) {
    reply = "ยอดเยี่ยมเลยครับคุณตัน! 💪 วอร์มอัพหมุนข้อต่อและยืดเหยียดเบาๆ 3-5 นาที แล้วลุยเซ็ตแรกได้เลยครับ โฟกัสฟอร์มการเคลื่อนไหวเป็นหลักนะครับ ผมเป็นกำลังใจให้!";
    quickActions = ["เริ่ม Workout", "ดูทริคท่าฝึก", "เปิดเพลง"];
  } else if (lower.includes("เลื่อน") || lower.includes("30") || lower.includes("ยังไม่ว่าง") || lower.includes("สาย")) {
    reply = "รับทราบครับผม! ⏰ พักเคลียร์งานหรือเตรียมชุดกับขวดน้ำให้พร้อมก่อนได้เลยครับ อีก 30 นาทีผมจะส่งการแจ้งเตือนมาเตือนคุณตันอีกครั้งนะครับ สู้ๆ ครับ!";
    quickActions = ["เริ่ม Workout", "ปรับเวลาใหม่", "ดูตารางฝึก"];
  } else if (lower.includes("เหนื่อย") || lower.includes("ไม่ไหว") || lower.includes("ง่วง") || lower.includes("นอนน้อย") || lower.includes("เพลีย")) {
    reply = "การฟังเสียงร่างกายสำคัญที่สุดครับคุณตัน 🌿 หากล้าสะสมหรือนอนน้อย เราสามารถลดความหนักเป็น Light Session หรือเน้น Mobility ยืดเหยียดได้ครับ สุขภาพดีเริ่มต้นที่ความยั่งยืน ไม่ต้องกังวลเลยครับ";
    quickActions = ["ปรับตารางให้เบาลง", "พักวันนี้ 1 วัน", "ยืดกล้ามเนื้อ"];
  } else if (lower.includes("กิน") || lower.includes("ข้าว") || lower.includes("มื้อ") || lower.includes("กะเพรา") || lower.includes("ไก่") || lower.includes("แคล") || lower.includes("อาหาร")) {
    reply = "บันทึกข้อมูลโภชนาการให้เรียบร้อยแล้วครับ! 🥗 มื้อนี้มีโปรตีนช่วยซ่อมแซมกล้ามเนื้อได้ดี อย่าลืมจิบน้ำสม่ำเสมอระหว่างวันด้วยนะครับ";
    quickActions = ["บันทึกอาหารเพิ่ม", "ดูแคลอรีวันนี้", "เริ่ม Workout"];
  } else if (lower.includes("เจ็บ") || lower.includes("ปวด") || lower.includes("ตึง")) {
    reply = "หากมีอาการเจ็บแปลบหรือตึงผิดปกติ ขอให้หยุดพักท่านั้นทันทีนะครับ ความปลอดภัยต้องมาก่อนเสมอ ลองประคบเย็นหรือพักข้อต่อ หากไม่ดีขึ้นควรปรึกษาแพทย์หรือผู้เชี่ยวชาญครับ";
    quickActions = ["พักการฝึก", "ท่ายืดผ่อนคลาย", "ปรึกษาโค้ช"];
  }

  return res.json({ reply, card, quickActions });
});

// Start Server and mount Vite
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FitCoach AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
