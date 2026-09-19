import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { registerLineWebhook } from "./line-webhook";
import { registerLineRichMenuRoutes } from "./line-richmenu";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "10mb", verify: (req: any, _res, buf) => { req.rawBody = buf; } }));
registerLineWebhook(app, PORT);
registerLineRichMenuRoutes(app);

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
          setTimeout(() => reject(new Error("Call timed out after 15000ms")), 15000)
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

// 4. Conversational Chat & LINE Coach interaction (Flexible AI Trainer & Accountability Engine)
app.post("/api/ai/coach-chat", async (req, res) => {
  const {
    message,
    targetDurationMonths,
    currentWorkout,
    currentNutrition,
    profile,
    accountabilityState,
    chatHistory,
  } = req.body;

  if (!message) return res.status(400).json({ error: "Missing message" });

  const userName = profile?.name || "คุณตัน";
  const userGoal = profile?.goal || "สร้างกล้ามเนื้อแบบ Lean Athletic";
  const scheduledTime = accountabilityState?.scheduledTime || "18:00";
  const currentCals = currentNutrition?.currentCalories || 0;
  const targetCals = currentNutrition?.targetCalories || 2200;
  const currentProt = currentNutrition?.currentProtein || 0;
  const targetProt = currentNutrition?.targetProtein || 150;

  try {
    const text = await generateWithRetryAndFallback({
      contents: `You are FitCoach AI, an authentic, certified, elite Thai personal trainer and accountability coach on LINE and in the FitCoach app.
Tone: Respectful, warm, energetic, and firm on discipline (uses 'ครับ', 'คุณ${userName}', 'ผม').
You are NOT a scripted bot. You have genuine human-like trainer intuition, flexibility, and strong commitment to keeping the user accountable.

USER PROFILE:
- Name: ${userName}
- Primary Goal: ${userGoal}
- Equipment: ${profile?.equipment?.join(", ") || "Dumbbells, Bodyweight"}
- Preferred Duration: ${profile?.durationMinutes || 45} นาที
- Experience: ${profile?.fitnessLevel || "Intermediate"}

CURRENT LIVE APP STATE:
- Scheduled Workout for Today: "${currentWorkout?.titleTh || currentWorkout?.title || "Upper Body"}" (${currentWorkout?.durationMinutes || 45} นาที, ${currentWorkout?.exercises?.length || 4} ท่า)
- Scheduled Workout Time: ${scheduledTime} น.
- Workout Completed Today: ${currentWorkout?.isCompleted ? "Yes (ซ้อมเสร็จแล้ว 🎉)" : "No (ยังไม่ได้ซ้อม)"}
- Accountability Status: ${accountabilityState?.status || "on_track"} (Strikes: ${accountabilityState?.strikes || 0}/3, Penalty Active: ${accountabilityState?.penaltyActive ? "Yes" : "No"})
- Today's Nutrition Progress: Calories: ${currentCals} / ${targetCals} kcal | Protein: ${currentProt} / ${targetProt}g
- Today's Logged Meals: ${currentNutrition?.meals?.length > 0 ? currentNutrition.meals.map((m: any) => `${m.name} (${m.calories} kcal, P:${m.protein}g)`).join(", ") : "ยังไม่ได้บันทึกอาหาร"}

RECENT CHAT CONTEXT:
${Array.isArray(chatHistory) ? chatHistory.slice(-4).map((h: any) => `${h.sender === "user" ? "User" : "Coach"}: ${h.text}`).join("\n") : ""}

LATEST USER MESSAGE: "${message}"

CORE CAPABILITIES & INSTRUCTIONS:

1. WORKOUT CREATION OR ADJUSTMENT REQUEST:
   - If user asks for any workout duration (e.g. 20 minutes, 15 minutes, 1 hour, etc.), equipment (e.g. 1 pair of dumbbells, bodyweight), or specific split/focus (e.g. 4 Upper Body exercises):
     * Tailor the plan EXACTLY to what they requested. If they asked for 20 minutes with 1 pair of dumbbells and 4 exercises for Upper body, produce exactly 4 dumbbell upper body exercises designed for a 20-minute session!
     * If they ask for 2 weeks, 1 month, 2 months, or 3 months, provide the full roadmap in "plan3Months".
     * In "reply", enthusiastically explain the session with clear form cues.
     * Attach "card":
       {
         "type": "new_program",
         "title": "...",
         "details": "...",
         "duration": "...",
         "tags": ["..."],
         "workoutPlan": {
           "id": "gen-${Date.now()}",
           "title": "...",
           "titleTh": "...",
           "durationMinutes": 20 (or requested duration),
           "intensity": "ปานกลาง",
           "split": "...",
           "coachNote": "...",
           "exercises": [
             {
               "id": "ex-1",
               "name": "...",
               "nameTh": "...",
               "sets": 3,
               "reps": "...",
               "suggestedWeight": "...",
               "restSeconds": 60,
               "notes": "...",
               "category": "chest" | "back" | "shoulders" | "arms" | "legs" | "core"
             }
           ]
         },
         "plan3Months": (if multi-week or multi-month)
       }

2. AUTOMATIC FOOD LOGGING:
   - If user says they ate or want to log food (e.g. "วันนี้กินกล้วยไปแล้ว 2 ลูก", "มื้อเที่ยงกินข้าวมันไก่", "กินเวย์โปรตีน 1 สกู๊ป", "กินสลัดอกไก่"):
     * Parse the food and quantity.
     * Accurately calculate/estimate calories, protein, carbs, and fat.
     * Set "recordedMeal":
       {
         "name": "...",
         "portion": "...",
         "calories": number,
         "protein": number,
         "carbs": number,
         "fat": number,
         "tip": "Short friendly tip from trainer about this meal in Thai"
       }
     * In "reply", confirm warmly that it has been automatically recorded into the app!

3. NUTRITION & CALORIE INQUIRIES:
   - If user asks "ดูแคลอรีวันนี้", "กินไปเท่าไหร่แล้ว", "โปรตีนขาดเท่าไหร่":
     * Use the ACTUAL numbers: ${currentCals} / ${targetCals} kcal, protein: ${currentProt} / ${targetProt}g!
     * Tell them how much is left and recommend specific meals to hit their goal.

4. COACH ACCOUNTABILITY, REMINDER & DISCIPLINE:
   - If user asks about their schedule or time: confirm today's scheduled time (${scheduledTime} น.).
   - If user is late, procrastinating, or asking to snooze/skip:
     * Be a true coach who guards their discipline. Do not let them slack off easily. Offer a 15-20 min Express session if busy.
     * If missed or penalized: enforce the penalty program ("วิดพื้น 25 ครั้ง / เบอร์พี 15 ครั้ง ชดเชย หรือเพิ่มคาร์ดิโอชดเชย 15 นาที").
     * Set "disciplineAction": "warn" | "penalty" | "praise" | null

OUTPUT STRICTLY AS JSON:
{
  "reply": "Markdown formatted Thai response with emojis and genuine trainer voice",
  "recordedMeal": null or { "name": "...", "portion": "...", "calories": 210, "protein": 2.6, "carbs": 54, "fat": 0.8, "tip": "..." },
  "card": null or { ... },
  "disciplineAction": null or "warn" | "penalty" | "praise",
  "quickActions": ["...", "..."]
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
  } catch (err) {
    console.error("Gemini coach-chat error:", err);
  }

  // ----------------------------------------------------
  // INTELLIGENT DYNAMIC FALLBACK (Handles all user intents)
  // ----------------------------------------------------
  const lower = String(message).toLowerCase();
  let reply = `ผมพร้อมดูแลและซัพพอร์ตคุณ${userName}ตลอดการฝึกครับ มีข้อสงสัยเรื่องท่าออกกำลังกาย อาหาร หรือต้องการปรับตารางฝึกวันนี้บอกผมได้เลยนะครับ!`;
  let card: any = null;
  let recordedMeal: any = null;
  let disciplineAction: "warn" | "penalty" | "praise" | null = null;
  let quickActions = ["เริ่ม Workout", "บันทึกอาหาร", "ดูแคลอรีวันนี้"];

  // 1. Food Logging Intent
  const isFoodLogging =
    lower.includes("กิน") ||
    lower.includes("มื้อ") ||
    lower.includes("กล้วย") ||
    lower.includes("ข้าวมันไก่") ||
    lower.includes("กะเพรา") ||
    lower.includes("อกไก่") ||
    lower.includes("เวย์") ||
    lower.includes("ไข่") ||
    lower.includes("สลัด") ||
    lower.includes("สเต็ก") ||
    lower.includes("บันทึกอาหาร");

  // Exclude simple inquiry like "ดูแคลอรี" from being treated as adding food
  const isCalorieInquiry =
    lower.includes("ดูแคล") ||
    lower.includes("แคลอรีวันนี้") ||
    lower.includes("แคลวันนี้") ||
    lower.includes("กินไปเท่าไหร่") ||
    lower.includes("กี่แคลแล้ว") ||
    lower.includes("โปรตีนถึงไหม");

  if (isCalorieInquiry) {
    const remainingCals = Math.max(0, targetCals - currentCals);
    const remainingProt = Math.max(0, targetProt - currentProt);
    reply = `📊 **สรุปโภชนาการของคุณ${userName}วันนี้ครับ:**
• **พลังงานสะสม**: **${currentCals.toLocaleString()} / ${targetCals.toLocaleString()} kcal** (เหลืออีก **${remainingCals.toLocaleString()} kcal**)
• **โปรตีนสะสม**: **${currentProt} / ${targetProt} g** (เหลืออีก **${remainingProt} g**)

${
  remainingCals > 600
    ? `💡 คุณยังมีโควตาพลังงานเหลือพอสำหรับมื้อเย็นคุณภาพ เช่น สเต็กอกไก่/ปลาแซลมอน + ข้าวกล้อง และไข่ต้ม เพื่อเติมโปรตีนให้ถึงเป้าหมาย ${targetProt}g ครับ!`
    : remainingCals > 0
    ? `💡 ใกล้ถึงเป้าหมายแคลอรีแล้วครับ แนะนำมื้อเบาๆ เช่น เวย์โปรตีน 1 สกู๊ป หรือกรีกโยเกิร์ต เพื่อเน้นโปรตีนโดยไม่เกินแคลอรีครับ!`
    : `🎉 แคลอรีวันนี้ครบตามเป้าหมายแล้วครับ คืนนี้ดื่มน้ำและพักผ่อนให้เพียงพอนะครับ!`
}`;
    quickActions = ["บันทึกอาหารเพิ่ม", "เริ่ม Workout ทันที", "คุยกับโค้ช"];
  } else if (isFoodLogging) {
    let mealName = "มื้ออาหาร";
    let portion = "1 ที่";
    let calories = 450;
    let protein = 25;
    let carbs = 50;
    let fat = 14;
    let tip = "มื้ออาหารที่มีประโยชน์และให้สารอาหารจำเป็นแก่ร่างกายครับ";

    if (lower.includes("กล้วย")) {
      const isTwo = lower.includes("2") || lower.includes("สอง");
      const count = isTwo ? 2 : 1;
      mealName = `กล้วยหอม (${count} ลูก)`;
      portion = `${count} ลูก (~${count * 120} กรัม)`;
      calories = count * 105;
      protein = Number((count * 1.3).toFixed(1));
      carbs = count * 27;
      fat = Number((count * 0.4).toFixed(1));
      tip = "กล้วยอุดมด้วยโพแทสเซียมและคาร์โบไฮเดรตดูดซึมไว เหมาะเป็นมื้อ Pre-workout เติมพลังก่อนซ้อม 30 นาทีครับ 🍌";
    } else if (lower.includes("ข้าวมันไก่")) {
      mealName = "ข้าวมันไก่ตอน (พร้อมน้ำซุป)";
      portion = "1 จานพิเศษ";
      calories = 620;
      protein = 28;
      carbs = 72;
      fat = 24;
      tip = "ได้โปรตีนดีจากเนื้อไก่ หากต้องการคุมไขมันในมื้อถัดไป สามารถลดของทอดได้ครับ";
    } else if (lower.includes("กะเพรา")) {
      mealName = "ข้าวกะเพราไก่ + ไข่ดาว";
      portion = "1 จาน";
      calories = 650;
      protein = 35;
      carbs = 68;
      fat = 26;
      tip = "โปรตีนสูงจากอกไก่และไข่ดาว ช่วยเสริมสร้างและฟื้นฟูกล้ามเนื้อได้ดีเยี่ยมครับ";
    } else if (lower.includes("อกไก่") || lower.includes("สลัด")) {
      mealName = "สลัดอกไก่ย่างสมุนไพร";
      portion = "1 ชาม (อกไก่ 180g)";
      calories = 380;
      protein = 42;
      carbs = 18;
      fat = 12;
      tip = "คลีนมากครับ ได้โปรตีนเน้นๆ และวิตามินกากใยจากผักสด";
    } else if (lower.includes("เวย์") || lower.includes("whey")) {
      mealName = "เวย์โปรตีนไอโซเลต";
      portion = "1 สกู๊ป (ผสมน้ำ 300ml)";
      calories = 140;
      protein = 26;
      carbs = 3;
      fat = 1.5;
      tip = "โปรตีนดูดซึมเร็ว ช่วยกระตุ้น Muscle Protein Synthesis ได้ทันใจครับ";
    } else if (lower.includes("ไข่")) {
      const isThree = lower.includes("3") || lower.includes("สาม");
      const count = isThree ? 3 : 2;
      mealName = `ไข่ต้ม (${count} ฟอง)`;
      portion = `${count} ฟอง`;
      calories = count * 75;
      protein = count * 6.5;
      carbs = count * 0.6;
      fat = count * 5;
      tip = "แหล่งโปรตีนคุณภาพสูง มีกรดอะมิโนจำเป็นครบถ้วนครับ";
    }

    recordedMeal = {
      name: mealName,
      portion,
      calories,
      protein,
      carbs,
      fat,
      tip,
    };

    reply = `✅ **บันทึกข้อมูลโภชนาการลงในแอปให้อัตโนมัติเรียบร้อยครับ!** 🥗\n\n• **เมนู**: **${mealName}** (${portion})\n• **สารอาหาร**: **${calories} kcal** | โปรตีน **${protein}g** | คาร์บ **${carbs}g** | ไขมัน **${fat}g**\n\n💡 *คำแนะนำจากโค้ช:* ${tip}\n\nระบบได้อัปเดตตัวเลขแคลอรีและโปรตีนในหน้าหลักของแอปเรียบร้อยแล้วครับ!`;
    quickActions = ["ดูแคลอรีวันนี้", "บันทึกอาหารเพิ่ม", "เริ่ม Workout"];
  }

  // 2. Workout Generation Intent
  const is20Minutes =
    lower.includes("20 นาที") ||
    lower.includes("20นาที") ||
    lower.includes("20 min") ||
    lower.includes("ดัมเบล 1 คู่") ||
    lower.includes("ดัมเบลคู่เดียว") ||
    lower.includes("มีแค่ดัมเบล") ||
    lower.includes("4 ท่า");

  const is1Hour =
    lower.includes("1 ชั่วโมง") ||
    lower.includes("1ชั่วโมง") ||
    lower.includes("60 นาที") ||
    lower.includes("60นาที") ||
    lower.includes("1 hour");

  const isTwoWeeks =
    lower.includes("2 สัปดาห์") ||
    lower.includes("สองสัปดาห์") ||
    lower.includes("14 วัน") ||
    lower.includes("2 weeks");

  const isOneMonth =
    targetDurationMonths === 1 ||
    lower.includes("1 เดือน") ||
    lower.includes("หนึ่งเดือน") ||
    lower.includes("4 สัปดาห์") ||
    lower.includes("1 month");

  const isTwoMonths =
    targetDurationMonths === 2 ||
    lower.includes("2 เดือน") ||
    lower.includes("สองเดือน") ||
    lower.includes("8 สัปดาห์") ||
    lower.includes("2 months");

  const isThreeMonths =
    targetDurationMonths === 3 ||
    lower.includes("3 เดือน") ||
    lower.includes("สามเดือน") ||
    lower.includes("12 สัปดาห์") ||
    lower.includes("tom holland") ||
    lower.includes("ทอม ฮอลแลนด์") ||
    lower.includes("spider");

  if (!isCalorieInquiry && !recordedMeal && is20Minutes) {
    reply = `จัดให้ทันทีครับคุณ${userName}! ⚡💪 สำหรับ **มีเวลา 20 นาที และอุปกรณ์มีแค่ดัมเบล 1 คู่** ผมออกแบบโปรแกรม **"Dumbbell Upper Express (20 นาที 4 ท่า)"** ที่เน้นกล้ามเนื้ออก ไหล่ หลัง และแขน โดยจัดแบบ Compound Set พักสั้น เพื่อกระตุ้นกล้ามเนื้อและอัตราการเต้นหัวใจให้เต็มประสิทธิภาพในเวลาจำกัด:

🎯 **ตารางฝึก 20 นาที (ดัมเบล 1 คู่ - 4 ท่า):**
1. **Dumbbell Floor Press (อกผึ่ง & แขนหลัง)**: 3 เซ็ต × 10–12 ครั้ง (พัก 45 วิ)
   - *ฟอร์ม*: นอนราบกับพื้น ดันดัมเบลขึ้นตรง บีบกล้ามเนื้อหน้าอก ไม่ล็อกข้อศอก
2. **Dumbbell Bent-Over Row (ปีกหลังรูปตัว V)**: 3 เซ็ต × 10–12 ครั้ง (พัก 45 วิ)
   - *ฟอร์ม*: พับสะโพก หลังตรง ดึงดัมเบลเข้าหาเอว บีบสะบักหลังเข้าหากัน
3. **Seated / Standing Dumbbell Shoulder Press (ไหล่ 3D)**: 3 เซ็ต × 10–12 ครั้ง (พัก 45 วิ)
   - *ฟอร์ม*: ดันดัมเบลขึ้นเหนือศีรษะ โฟกัสหัวไหล่ คอนโทรลจังหวะลงช้าๆ
4. **Dumbbell Hammer Curl to Lateral Raise (แขน & ไหล่ข้าง)**: 3 เซ็ต × 12 ครั้ง (พัก 45 วิ)
   - *ฟอร์ม*: ยกสลับสร้างลายแขนและมิติความกว้างของลำตัว

👇 ผมแนบการ์ดโปรแกรม **20 นาที** ด้านล่างให้แล้วครับ คุณสามารถกด **"นำโปรแกรม 20 นาทีนี้ไปใช้ในแอป"** เพื่อเริ่มซ้อมได้ทันที!`;

    card = {
      type: "new_program",
      title: "Dumbbell Upper Express (20 นาที 4 ท่า)",
      details: "โปรแกรม 20 นาที ดัมเบล 1 คู่ เน้นอก ไหล่ 3D ปีกหลัง และแขน คมชัดและกระชับเวลา",
      duration: "20 นาที (ดัมเบล 1 คู่)",
      tags: ["DumbbellOnly", "Express20Min", "UpperBody", "4Exercises"],
      workoutPlan: {
        id: `plan-db-express-20m-${Date.now()}`,
        title: "Dumbbell Upper Express (20 นาที)",
        titleTh: "ดัมเบล อัปเปอร์ บอดี้ เอ็กซ์เพรส (20 นาที 4 ท่า)",
        durationMinutes: 20,
        intensity: "ปานกลาง",
        split: "Upper Body Dumbbell Express",
        coachNote: "คุมเวลาพักไม่เกิน 45 วินาทีต่อเซ็ตเพื่อรักษาความต่อเนื่องและการเผาผลาญสูงสุดครับ",
        exercises: [
          {
            id: "db-ex-1",
            name: "Dumbbell Floor Press",
            nameTh: "ดัมเบล ฟลอร์เพรส (สร้างอกผึ่ง)",
            sets: 3,
            reps: "10-12 ครั้ง",
            suggestedWeight: "ดัมเบลคู่หลัก",
            restSeconds: 45,
            notes: "นอนราบบนพื้น ดันดัมเบลขึ้นตรง บีบหน้าอกที่จุดสูงสุด",
            category: "chest",
          },
          {
            id: "db-ex-2",
            name: "Dumbbell Bent-Over Row",
            nameTh: "ดัมเบล เบนต์โอเวอร์โรว์ (หลังปีก V-Shape)",
            sets: 3,
            reps: "10-12 ครั้ง",
            suggestedWeight: "ดัมเบลคู่หลัก",
            restSeconds: 45,
            notes: "พับสะโพก หลังตรง ดึงดัมเบลเข้าหาเอว บีบสะบัก",
            category: "back",
          },
          {
            id: "db-ex-3",
            name: "Dumbbell Shoulder Press",
            nameTh: "ดัมเบล โชว์เดอร์เพรส (ไหล่ 3D)",
            sets: 3,
            reps: "10-12 ครั้ง",
            suggestedWeight: "ดัมเบลคู่หลัก",
            restSeconds: 45,
            notes: "เกร็งแกนกลางลำตัว ดันขึ้นเหนือศีรษะ ควบคุมจังหวะลง",
            category: "shoulders",
          },
          {
            id: "db-ex-4",
            name: "Dumbbell Lateral Raise to Hammer Curl",
            nameTh: "ดัมเบล แลทเทอรัลเรส & แฮมเมอร์เคิร์ล",
            sets: 3,
            reps: "12 ครั้ง",
            suggestedWeight: "ดัมเบลคู่หลัก",
            restSeconds: 45,
            notes: "ยกเปิดไหล่ข้างสลับกับเคิร์ลหน้าแขน สร้างมิติความกว้าง",
            category: "arms",
          },
        ],
      },
    };
    quickActions = ["นำโปรแกรม 20 นาทีนี้ไปใช้ในแอป 💪", "เริ่ม Workout ทันที", "ดูท่าฝึก"];
  } else if (!isCalorieInquiry && !recordedMeal && is1Hour) {
    reply = `ยอดเยี่ยมมากครับคุณ${userName}! ⏱️💪 การมีเวลา **1 ชั่วโมงเต็ม (60 นาที)** ช่วยให้เราฝึกได้ครบทั้ง 3 มิติ: Warm-up & Mobility, Hypertrophy Volume, และ Core Conditioning อย่างสมบูรณ์แบบครับ!

🎯 **โครงสร้างการฝึก 60 นาที:**
• **Warm-up & Joint Mobility (8 นาที)**: หมุนไหล่ ยืดสะบัก และวิดพื้นเบาๆ
• **Main Hypertrophy Lift (35 นาที)**: เล่น 5 ท่าหลักเน้นความแข็งแรงและมวลกล้ามเนื้อ (Bench Press, Incline DB Press, Lat Pulldown, DB Shoulder Press, Lateral Raise)
• **Metabolic Finisher & Core (12 นาที)**: Spider-Man Plank และ Hanging Knee Raise
• **Cool-down & Stretch (5 นาที)**: ผ่อนคลายกล้ามเนื้อ

👇 ผมได้บรรจุโปรแกรม 60 นาทีลงในการ์ดด้านล่างแล้วครับ!`;

    card = {
      type: "new_program",
      title: "Full Upper Hypertrophy & Athletic Power (60 นาที)",
      details: "โปรแกรม 60 นาทีเต็ม ครบทั้งอก ไหล่ หลัง แขน และแกนกลางลำตัว",
      duration: "60 นาที",
      tags: ["FullSession", "60Min", "Hypertrophy", "UpperBody"],
      workoutPlan: {
        id: `plan-full-60m-${Date.now()}`,
        title: "Upper Body Complete (60 นาที)",
        titleTh: "อัปเปอร์ บอดี้ ฟูลเซสชัน (60 นาที)",
        durationMinutes: 60,
        intensity: "หนัก",
        split: "Upper Body Hypertrophy & Core",
        coachNote: "โฟกัสการลงน้ำหนักช้า 2-3 วินาที และดันขึ้นด้วยความมั่นใจครับ",
        exercises: [
          { id: "f-1", name: "Barbell / DB Bench Press", nameTh: "เบนช์เพรส", sets: 4, reps: "8-10", suggestedWeight: "หนักปานกลาง", restSeconds: 75, notes: "สร้างฐานหน้าอกหนา", category: "chest" },
          { id: "f-2", name: "Incline Dumbbell Press", nameTh: "อินไคลน์เพรส อกบน", sets: 4, reps: "10-12", suggestedWeight: "ดัมเบลคู่หลัก", restSeconds: 60, notes: "สร้างอกบนผึ่ง", category: "chest" },
          { id: "f-3", name: "Wide-Grip Lat Pulldown / Pull-up", nameTh: "ดึงข้อ / แลตพูลดาวน์", sets: 4, reps: "10-12", suggestedWeight: "ปานกลาง", restSeconds: 60, notes: "ขยายปีกหลัง V-Taper", category: "back" },
          { id: "f-4", name: "Seated Dumbbell Shoulder Press", nameTh: "โชว์เดอร์เพรส", sets: 3, reps: "10-12", suggestedWeight: "ดัมเบลคู่หลัก", restSeconds: 60, notes: "มิติหัวไหล่ 3D", category: "shoulders" },
          { id: "f-5", name: "Dumbbell Lateral Raise", nameTh: "แลทเทอรัลเรส", sets: 4, reps: "12-15", suggestedWeight: "น้ำหนักเบา-คุมฟอร์ม", restSeconds: 45, notes: "เปิดไหล่ข้างกว้าง", category: "shoulders" },
          { id: "f-6", name: "Spider-Man Plank & Knee Raise", nameTh: "สไปเดอร์แมนแพลงก์", sets: 3, reps: "15 ครั้ง", suggestedWeight: "Bodyweight", restSeconds: 45, notes: "ล็อกแกนกลางลำตัว", category: "core" },
        ],
      },
    };
    quickActions = ["นำโปรแกรม 60 นาทีนี้ไปใช้ในแอป 💪", "เริ่ม Workout ทันที", "ดูเมนูอาหารวันนี้"];
  } else if (!isCalorieInquiry && !recordedMeal && isTwoWeeks) {
    reply = `สำหรับกรอบเวลา **2 สัปดาห์ (14 วัน)** นี่คือแผน **Spider-Man 14-Day Rapid Sprint** ครับ! เน้นการลดอาการบวมน้ำ ดันกล้ามเนื้ออกและไหล่ให้ตึงแน่นทันที พร้อมเดินชัน Zone 2 รีดไขมันหน้าท้องครับ ⚡`;
    card = {
      type: "new_program",
      title: "Tom Holland: Spider-Man Rapid Sprint (แผนเร่งด่วน 2 สัปดาห์)",
      details: "แผนสปรินต์ 14 วัน รีดบวมน้ำ กระชับกล้ามเนื้ออก-ไหล่-หลัง และหน้าท้องแบนราบ",
      duration: "2 สัปดาห์ (14 วัน)",
      tags: ["Sprint14Days", "RapidFatLoss", "Jumpstart"],
      workoutPlan: {
        id: "plan-tom-holland-14d",
        title: "Spider-Man Rapid Sprint (14 วัน)",
        titleTh: "โปรแกรมสไปเดอร์แมนเร่งด่วน 14 วัน",
        durationMinutes: 40,
        intensity: "สูง",
        split: "Upper & Core Circuit",
        exercises: [
          { id: "sp-1", name: "Incline Dumbbell Press", nameTh: "ดัมเบลอินไคลน์เพรส (อกบน)", sets: 4, reps: "10-12", suggestedWeight: "14-16 kg", restSeconds: 60, notes: "บีบอกบนให้ตึงแน่น", category: "chest" },
          { id: "sp-2", name: "Wide-Grip Lat Pulldown", nameTh: "ดึงปีกหลัง V-Shape", sets: 4, reps: "12", suggestedWeight: "35 kg", restSeconds: 60, notes: "กางปีกให้กว้าง", category: "back" },
          { id: "sp-3", name: "Dumbbell Lateral Raise", nameTh: "ยกไหล่ข้าง 3D", sets: 4, reps: "15", suggestedWeight: "6-8 kg", restSeconds: 45, notes: "สร้างมิติไหล่กลมมน", category: "shoulders" },
          { id: "sp-4", name: "Spider-Man Plank", nameTh: "สไปเดอร์แมนแพลงก์", sets: 3, reps: "16 ครั้ง", suggestedWeight: "Bodyweight", restSeconds: 45, notes: "เข่าแตะศอก รีดเอวด้านข้าง", category: "core" },
        ],
      },
    };
    quickActions = ["นำแผน 2 สัปดาห์ไปใช้ในแอป 💪", "เริ่ม Workout ทันที", "ดูเมนูอาหารวันนี้"];
  } else if (!isCalorieInquiry && !recordedMeal && isOneMonth) {
    reply = `จัดแผน **1 เดือน (4 สัปดาห์)** ให้เรียบร้อยครับ! ปั้นไหล่ 3D ขยายปีกหลังรูปตัว V และเริ่มตัดลายกล้ามท้อง Six-Pack ใน 4 สัปดาห์ครับ 🚀`;
    card = {
      type: "new_program",
      title: "Tom Holland: Spider-Man Lean V-Taper (แผน 1 เดือน)",
      details: "แผน 4 สัปดาห์ ปั้นไหล่ 3D หลังกว้างรูปตัว V และรีดไขมันกระชับหน้าท้อง",
      duration: "1 เดือน (4 สัปดาห์)",
      tags: ["Plan1Month", "VTaper", "RapidTransformation"],
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
          { id: "th-4", name: "Spider-Man Plank & Knee Raise", nameTh: "สไปเดอร์แมนแพลงก์", sets: 3, reps: "15 ครั้ง", suggestedWeight: "Bodyweight", restSeconds: 45, notes: "รีดเอวและแกนกลางลำตัว", category: "core" },
        ],
      },
    };
    quickActions = ["นำแผน 1 เดือนไปใช้ในแอป 💪", "เริ่ม Workout ทันที", "ดูเมนูอาหารวันนี้"];
  } else if (!isCalorieInquiry && !recordedMeal && isTwoMonths) {
    reply = `จัดแผน **2 เดือน (8 สัปดาห์)** ให้เรียบร้อยครับ! แบ่งเป็น 2 เฟสเร่งรัด: เฟส 1 สร้างโครงสร้าง V-Taper และเฟส 2 รีดไขมันสู่ 10–12% คมชัดระดับ Spider-Man ครับ ⚡🕷️`;
    card = {
      type: "new_program",
      title: "Tom Holland: Spider-Man Lean V-Taper (แผนเร่งรัด 2 เดือน)",
      details: "แผนเร่งรัด 8 สัปดาห์ ปั้นหุ่น V-Taper ไหล่ 3D หลังกว้าง และ Six-Pack คมชัด",
      duration: "2 เดือน (8 สัปดาห์)",
      tags: ["Plan2Months", "Accelerated8Weeks", "VTaper"],
      workoutPlan: {
        id: "plan-tom-holland-vtaper-2m",
        title: "Tom Holland: Spider-Man Lean V-Taper (2 เดือน)",
        titleTh: "โปรแกรมทอม ฮอลแลนด์ (แผนเร่งรัด 2 เดือน 8 สัปดาห์)",
        durationMinutes: 45,
        intensity: "ปานกลาง-สูง",
        split: "Upper Body & V-Taper",
        exercises: [
          { id: "th-1", name: "Incline Dumbbell Bench Press", nameTh: "ดัมเบลอินไคลน์เพรส", sets: 4, reps: "8-10", suggestedWeight: "16-18 kg", restSeconds: 75, notes: "โฟกัสอกบน", category: "chest" },
          { id: "th-2", name: "Wide-Grip Pull-Up / Lat Pulldown", nameTh: "ดึงข้อ / แลตพูลดาวน์", sets: 4, reps: "10-12", suggestedWeight: "35-40 kg", restSeconds: 75, notes: "ปีกกว้าง V-Shape", category: "back" },
          { id: "th-3", name: "Dumbbell Lateral Raise", nameTh: "ดัมเบลแลทเทอรัลเรส", sets: 4, reps: "12-15", suggestedWeight: "7-8 kg", restSeconds: 60, notes: "ไหล่ข้าง 3D", category: "shoulders" },
          { id: "th-4", name: "Spider-Man Plank & Knee Raise", nameTh: "สไปเดอร์แมนแพลงก์", sets: 3, reps: "15 ครั้ง", suggestedWeight: "Bodyweight", restSeconds: 45, notes: "สร้างกล้ามท้องและ V-Line", category: "core" },
        ],
      },
    };
    quickActions = ["นำแผน 2 เดือนไปใช้ในแอป 💪", "เริ่ม Workout ทันที", "ดูเมนูอาหารวันนี้"];
  } else if (!isCalorieInquiry && !recordedMeal && isThreeMonths) {
    reply = `ยอดเยี่ยมมากครับคุณ${userName}! 🕷️ แผน **3 เดือน (12 สัปดาห์)** คือพิมพ์เขียวฉบับเต็มสำหรับการสร้างหุ่น **Tom Holland Lean Athletic V-Taper** อย่างยั่งยืนครับ! ทั้งการสร้างฐาน การเพิ่มความหนาแน่นกล้ามเนื้อ และการรีดไขมันตัดลาย Six-Pack คมกริบ พร้อมให้คุณนำไปใช้ในแอปแล้วครับ!`;
    card = {
      type: "new_program",
      title: "Tom Holland: Spider-Man Lean V-Taper (แผน 3 เดือน)",
      details: "แผน 12 สัปดาห์ ปั้นหุ่น V-Taper ไหล่ 3D หลังกว้าง แกนกลางลำตัว พร้อมโภชนาการและตารางรายวัน",
      duration: "3 เดือน (45 นาที/วัน)",
      tags: ["TomHolland", "SpiderMan", "VTaper", "Plan3Months"],
      workoutPlan: {
        id: "plan-tom-holland-vtaper",
        title: "Tom Holland: Spider-Man Lean V-Taper (แผน 3 เดือน)",
        titleTh: "โปรแกรมทอม ฮอลแลนด์ (Lean V-Taper & Core 3 เดือน)",
        durationMinutes: 45,
        intensity: "ปานกลาง",
        split: "Upper Body & V-Taper",
        exercises: [
          { id: "th-1", name: "Incline Dumbbell Bench Press", nameTh: "ดัมเบลอินไคลน์เพรส", sets: 4, reps: "8-10", suggestedWeight: "16-18 kg", restSeconds: 75, notes: "ปรับเบาะ 30 องศา โฟกัสอกบน", category: "chest" },
          { id: "th-2", name: "Wide-Grip Pull-Up / Lat Pulldown", nameTh: "ดึงข้อ / แลตพูลดาวน์", sets: 4, reps: "10-12", suggestedWeight: "35-40 kg", restSeconds: 75, notes: "กางปีกกว้าง V-Shape", category: "back" },
          { id: "th-3", name: "Dumbbell Lateral Raise", nameTh: "ดัมเบลแลทเทอรัลเรส (ไหล่ 3D)", sets: 4, reps: "12-15", suggestedWeight: "7-8 kg", restSeconds: 60, notes: "ไหล่ข้าง 3D กว้างสมส่วน", category: "shoulders" },
          { id: "th-4", name: "Spider-Man Plank & Knee Raise", nameTh: "สไปเดอร์แมนแพลงก์ & ยกดักเข่า", sets: 3, reps: "15 ครั้ง", suggestedWeight: "Bodyweight", restSeconds: 45, notes: "ดึงเข่าแตะศอก สร้าง V-Line", category: "core" },
        ],
      },
    };
    quickActions = ["นำแผน 3 เดือนไปใช้ในแอป 💪", "เริ่ม Workout ทันที", "ดูเมนูอาหารวันนี้"];
  } else if (lower.includes("กี่โมง") || lower.includes("เวลาซ้อม") || lower.includes("นัด") || lower.includes("เตือน")) {
    reply = `⏰ **เวลานัดซ้อมของคุณ${userName}วันนี้คือ ${scheduledTime} น. ครับ!**\n\nโปรแกรมวันนี้คือ **"${currentWorkout?.titleTh || "Upper Body"}"** (${currentWorkout?.durationMinutes || 45} นาที)\n\nผมจะคอยส่งข้อความแจ้งเตือนก่อนเวลา และถ้าเลยเวลาซ้อมแล้วยังไม่มากดซ้อม ผมจะคอยตามเพื่อรักษาวินัยของคุณนะครับ! พร้อมลุยไหมครับ?`;
    quickActions = ["เริ่ม Workout ทันที", "เลื่อน 30 นาที", "บันทึกอาหาร"];
  } else if (lower.includes("เลื่อน") || lower.includes("30") || lower.includes("ยังไม่ว่าง") || lower.includes("สาย")) {
    reply = `รับทราบครับคุณ${userName}! ⏰ ผมปรับเลื่อนเวลาให้ 30 นาทีครับ แต่ขอเน้นย้ำว่า **"เลื่อนได้ แต่ห้ามโดดซ้อมนะครับ!"** 👊 อีก 30 นาทีผมจะส่งข้อความแจ้งเตือนมาตามอีกครั้ง เตรียมชุดและน้ำดื่มไว้รอเลยครับ!`;
    disciplineAction = "warn";
    quickActions = ["เริ่ม Workout", "ปรับเป็น 20 นาทีแทน", "ดูตารางฝึก"];
  } else if (lower.includes("เหนื่อย") || lower.includes("ไม่ไหว") || lower.includes("ง่วง") || lower.includes("นอนน้อย") || lower.includes("เพลีย")) {
    reply = `ผมเข้าใจความล้าของคุณ${userName}ครับ 🌿 ในฐานะเทรนเนอร์ ผมแนะนำว่า **"อย่าเพิ่งยกเลิกทั้งเซสชัน"** เราสามารถปรับเป็น **Express 20 นาที** หรือเน้น Mobility คลายกล้ามเนื้อได้ครับ การมาซ้อมเบาๆ 15-20 นาที ยังดีกว่าการหยุดแล้วเสียโมเมนตัมวินัยไปครับ!`;
    quickActions = ["ปรับตารางเป็น 20 นาที", "พักวันนี้ 1 วัน", "ยืดเหยียด"];
  } else if (lower.includes("เริ่ม") || lower.includes("พร้อม") || lower.includes("ซ้อม")) {
    reply = `ยอดเยี่ยมมากครับคุณ${userName}! 💪 วินัยคือหัวใจสำคัญของหุ่นในฝัน วอร์มอัพหมุนข้อต่อ 3 นาที แล้วเริ่มเซ็ตแรกได้เลยครับ ผมคอยจับตาดูฟอร์มของคุณอยู่ครับ!`;
    disciplineAction = "praise";
    quickActions = ["เริ่ม Workout", "ดูทริคท่าฝึก", "บันทึกอาหาร"];
  } else if (lower.includes("ลงโทษ") || lower.includes("โดด") || lower.includes("ขาดซ้อม")) {
    reply = `🚨 **กฎระเบียบและบทลงโทษทางวินัยของ FitCoach:**\nหากถึงเวลานัดซ้อมแล้วคุณ${userName}ไม่เข้ามาออกกำลังกายตามโปรแกรม:\n1. **Strike 1-3**: ถูกบันทึกเตือนทางวินัยและหัก -50 XP\n2. **ภารกิจลงโทษชดเชย (Penalty Task)**: ต้องทำ Burpees 15 ครั้ง หรือ Push-ups 25 ครั้ง เพื่อปลดล็อคบทลงโทษและกู้คืนคะแนนวินัยครับ!\n\nเราสร้างระบบนี้ขึ้นมาเพื่อให้คุณไปถึงเป้าหมายได้จริง ไม่ล้มเลิกกลางคันครับ!`;
    quickActions = ["เริ่ม Workout ตอนนี้", "ส่งการบ้านชดเชย", "ดูแผนวันนี้"];
  }

  return res.json({
    reply,
    card,
    recordedMeal,
    disciplineAction,
    quickActions,
  });
});

// Start Server and mount Vite
async function startServer() {
  // เสิร์ฟ Service Worker จาก Root Path พร้อม Header สำหรับ PWA (no-cache และ Service-Worker-Allowed)
  app.get("/sw.js", (_req, res) => {
    res.setHeader("Content-Type", "application/javascript");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Service-Worker-Allowed", "/");
    const swPath = process.env.NODE_ENV !== "production"
      ? path.join(process.cwd(), "public", "sw.js")
      : path.join(process.cwd(), "dist", "sw.js");
    res.sendFile(swPath);
  });

  // เสิร์ฟ Web App Manifest พร้อม Header Content-Type ที่ถูกต้อง
  app.get(["/manifest.webmanifest", "/manifest.json"], (_req, res) => {
    res.setHeader("Content-Type", "application/manifest+json");
    const manifestPath = process.env.NODE_ENV !== "production"
      ? path.join(process.cwd(), "public", "manifest.webmanifest")
      : path.join(process.cwd(), "dist", "manifest.webmanifest");
    res.sendFile(manifestPath);
  });

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
