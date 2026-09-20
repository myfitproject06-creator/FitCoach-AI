// server.ts - เซิร์ฟเวอร์ Express หลัก รองรับ LINE OAuth 2.1, LINE Webhook, User Data API และ Vite Middleware
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import { createServer as createViteServer } from "vite";
import { authRouter, getMeHandler, requireAuth, type AuthenticatedRequest } from "./auth-line";
import { googleFitRouter } from "./google-fit";
import { lineWebhookHandler } from "./line-webhook";
import { getUserData, saveUserData } from "./db";
import { generateCoachResponseStructured } from "./coach-ai";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // 1. ตั้งค่า trust proxy สำหรับรันบน Render และ Reverse Proxy
  app.set("trust proxy", 1);

  // 2. Middleware บันทึก rawBody สำหรับตรวจสอบ LINE Webhook Signature
  app.use(
    express.json({
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    })
  );
  app.use(express.urlencoded({ extended: true }));

  // 3. Cookie Parser พร้อมเซ็น Cookie ด้วย SESSION_SECRET
  const sessionSecret = process.env.SESSION_SECRET || "fitcoach_default_session_secret_change_in_production";
  app.use(cookieParser(sessionSecret));

  // ----------------------------------------------------
  // API Routes (ต้องอยู่ก่อน Vite Middleware เสมอ)
  // ----------------------------------------------------

  // Route ตรวจสอบสถานะเซิร์ฟเวอร์
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "FitCoach AI", timestamp: new Date().toISOString() });
  });

  // LINE Login OAuth Routes (/auth/line, /auth/line/callback, /auth/logout)
  app.use("/auth", authRouter);

  // Google Fit 1-Click OAuth & Sync Routes (/auth/google, /auth/google/callback, /api/googlefit/*)
  app.use("/", googleFitRouter);

  // ข้อมูลผู้ใช้ที่กำลังล็อกอินอยู่
  app.get("/api/me", getMeHandler);

  // LINE Bot Webhook (ห้ามเปลี่ยนชื่อ route เด็ดขาด)
  app.post("/webhook", lineWebhookHandler);

  // ดึงข้อมูลฟิตเนสของผู้ใช้ที่ล็อกอินอยู่ (ต้องผ่าน session ก่อนเสมอ)
  app.get("/api/user/data", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;
      const data = await getUserData(userId);
      return res.json({ success: true, data });
    } catch (err) {
      console.error("[API] ดึงข้อมูลผู้ใช้ล้มเหลว:", err);
      return res.status(500).json({ success: false, error: "ไม่สามารถดึงข้อมูลได้" });
    }
  });

  // บันทึกหรืออัปเดตข้อมูลฟิตเนสของผู้ใช้ (โปรไฟล์, ตารางฝึก, โภชนาการ, ฯลฯ)
  app.post("/api/user/data", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;
      const payload = req.body;
      const updated = await saveUserData(userId, payload);
      return res.json({ success: true, data: updated });
    } catch (err) {
      console.error("[API] บันทึกข้อมูลผู้ใช้ล้มเหลว:", err);
      return res.status(500).json({ success: false, error: "ไม่สามารถบันทึกข้อมูลได้" });
    }
  });

  // ถ่ายโอนข้อมูลจาก localStorage ขึ้นสู่ฐานข้อมูลเซิร์ฟเวอร์ตอนล็อกอินครั้งแรก
  app.post("/api/user/migrate", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;
      const existing = await getUserData(userId);

      // ถ่ายโอนเฉพาะกรณีที่บนเซิร์ฟเวอร์ยังไม่มีข้อมูลโปรไฟล์
      if (!existing?.profile?.name && req.body.profile) {
        console.log(`[API Migration] กำลังย้ายข้อมูล LocalStorage ขึ้น Server สำหรับ userId=${userId}`);
        const migrated = await saveUserData(userId, {
          profile: req.body.profile,
          workout: req.body.workout,
          nutrition: req.body.nutrition,
          recovery: req.body.recovery,
          activity: req.body.activity,
          status: req.body.status,
          accountability: req.body.accountability,
        });
        return res.json({ success: true, migrated: true, data: migrated });
      }

      return res.json({ success: true, migrated: false, data: existing });
    } catch (err) {
      console.error("[API Migration] การย้ายข้อมูลล้มเหลว:", err);
      return res.status(500).json({ success: false, error: "Migration failed" });
    }
  });

  // AI Coach Chat API (เชื่อมต่อกับ Gemini API)
  app.post("/api/ai/coach-chat", async (req, res) => {
    try {
      const { message, userProfile, workoutPlan, fitnessStatus, nutritionData, recoveryData } = req.body;
      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "ต้องระบุข้อความ message" });
      }

      const coachResponse = await generateCoachResponseStructured(message, {
        userProfile,
        workoutPlan,
        fitnessStatus,
        nutritionData,
        recoveryData,
      });

      // Keep `reply` for backward compatibility while Phase 2 consumers
      // can render the structured response as cards.
      return res.json({
        reply: coachResponse.message,
        coachResponse,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error("[API] Coach Chat ล้มเหลว:", err);
      return res.status(500).json({
        reply: "ขออภัยครับ โค้ชกำลังประมวลผลข้อมูลอยู่ รบกวนลองส่งข้อความใหม่อีกครั้งนะครับ! 💪",
      });
    }
  });

  // ----------------------------------------------------
  // Frontend Asset Handling (Vite / Static)
  // ----------------------------------------------------
  if (process.env.NODE_ENV !== "production") {
    // Development Mode: เชื่อมต่อ Vite Middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("[Server] เปิดใช้งาน Vite Middleware (โหมด Development)");
  } else {
    // Production Mode: เสิร์ฟ Static Files จากโฟลเดอร์ dist
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("[Server] เสิร์ฟ Production Build จากโฟลเดอร์ dist");
  }

  // เริ่มต้นรับการเชื่อมต่อ
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 FitCoach AI เซิร์ฟเวอร์พร้อมทำงานที่ http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("FATAL: เซิร์ฟเวอร์ไม่สามารถเริ่มต้นได้:", err);
});
