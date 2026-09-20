// server.ts - เซิร์ฟเวอร์ Express หลัก รองรับ LINE OAuth 2.1, LINE Webhook,
// User Data API, Vite Middleware และ Phase 4 Real Coach Data Integration
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

  // 1. ตั้งค่า trust proxy สำหรับ Render และ Reverse Proxy
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
  const sessionSecret =
    process.env.SESSION_SECRET ||
    "fitcoach_default_session_secret_change_in_production";
  app.use(cookieParser(sessionSecret));

  // ----------------------------------------------------
  // API Routes (ต้องอยู่ก่อน Vite Middleware เสมอ)
  // ----------------------------------------------------

  // Route ตรวจสอบสถานะเซิร์ฟเวอร์
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "FitCoach AI",
      timestamp: new Date().toISOString(),
    });
  });

  // LINE Login OAuth Routes
  app.use("/auth", authRouter);

  // Google Fit 1-Click OAuth & Sync Routes
  app.use("/", googleFitRouter);

  // ข้อมูลผู้ใช้ที่กำลังล็อกอินอยู่
  app.get("/api/me", getMeHandler);

  // LINE Bot Webhook (ห้ามเปลี่ยนชื่อ route เด็ดขาด)
  app.post("/webhook", lineWebhookHandler);

  // ดึงข้อมูลฟิตเนสของผู้ใช้ที่ล็อกอินอยู่
  app.get(
    "/api/user/data",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const userId = req.user!.userId;
        const data = await getUserData(userId);
        return res.json({ success: true, data });
      } catch (err) {
        console.error("[API] ดึงข้อมูลผู้ใช้ล้มเหลว:", err);
        return res
          .status(500)
          .json({ success: false, error: "ไม่สามารถดึงข้อมูลได้" });
      }
    }
  );

  // บันทึกหรืออัปเดตข้อมูลฟิตเนสของผู้ใช้
  app.post(
    "/api/user/data",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const userId = req.user!.userId;
        const payload = req.body;
        const updated = await saveUserData(userId, payload);
        return res.json({ success: true, data: updated });
      } catch (err) {
        console.error("[API] บันทึกข้อมูลผู้ใช้ล้มเหลว:", err);
        return res
          .status(500)
          .json({ success: false, error: "ไม่สามารถบันทึกข้อมูลได้" });
      }
    }
  );

  // ถ่ายโอนข้อมูลจาก localStorage ขึ้นสู่ฐานข้อมูลตอนล็อกอินครั้งแรก
  app.post(
    "/api/user/migrate",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const userId = req.user!.userId;
        const existing = await getUserData(userId);

        if (!existing?.profile?.name && req.body.profile) {
          console.log(
            `[API Migration] กำลังย้ายข้อมูล LocalStorage ขึ้น Server สำหรับ userId=${userId}`
          );

          const migrated = await saveUserData(userId, {
            profile: req.body.profile,
            workout: req.body.workout,
            nutrition: req.body.nutrition,
            recovery: req.body.recovery,
            activity: req.body.activity,
            status: req.body.status,
            accountability: req.body.accountability,
            messages: req.body.messages,
          });

          return res.json({
            success: true,
            migrated: true,
            data: migrated,
          });
        }

        return res.json({
          success: true,
          migrated: false,
          data: existing,
        });
      } catch (err) {
        console.error("[API Migration] การย้ายข้อมูลล้มเหลว:", err);
        return res.status(500).json({
          success: false,
          error: "Migration failed",
        });
      }
    }
  );

  // ----------------------------------------------------
  // Phase 4 — REAL COACH DATA INTEGRATION
  // ----------------------------------------------------
  //
  // Web Chat จะใช้ข้อมูลจริงจาก Firebase เมื่อผู้ใช้ Login:
  // profile / workout / nutrition / recovery / activity / status /
  // accountability / coachPlan / workoutLogs / coachProfile / messages
  //
  // และส่ง userId เข้า Coach Engine เพื่อเปิดใช้งาน Coach Tools
  // เช่น save_plan, upsert_plan_days, log_workout, update_profile_info
  //
  // Guest mode ยังรองรับการส่ง context มาจาก frontend เหมือนเดิม
  // ----------------------------------------------------
  app.post(
    "/api/ai/coach-chat",
    async (req: AuthenticatedRequest, res) => {
      try {
        const {
          message,
          userProfile,
          workoutPlan,
          fitnessStatus,
          nutritionData,
          recoveryData,
          history,
        } = req.body || {};

        if (!message || typeof message !== "string") {
          return res.status(400).json({
            error: "ต้องระบุข้อความ message",
          });
        }

        // ถ้ามี session ให้ใช้ Firebase เป็น source of truth
        // ไม่ใช้ข้อมูลเก่าจาก browser เป็นหลัก
        let userData: Awaited<ReturnType<typeof getUserData>> = null;
        let authenticatedUserId: string | undefined;

        try {
          if (req.user?.userId) {
            authenticatedUserId = req.user.userId;
            userData = await getUserData(authenticatedUserId);
          }
        } catch (dbError) {
          console.warn(
            "[API] ไม่สามารถโหลด Real Coach Data จาก Firebase:",
            dbError
          );
        }

        const effectiveProfile = userData?.profile || userProfile;
        const effectiveWorkout = userData?.workout || workoutPlan;
        const effectiveStatus = userData?.status || fitnessStatus;
        const effectiveNutrition = userData?.nutrition || nutritionData;
        const effectiveRecovery = userData?.recovery || recoveryData;

        // ใช้ประวัติจาก Firebase ก่อน ถ้ามี
        // แล้วเติม history ที่ frontend ส่งมาเพื่อรองรับ guest/ข้อมูลล่าสุด
        const storedHistory = Array.isArray(userData?.messages)
          ? userData!.messages
              .filter((m: any) => m && typeof m.text === "string")
              .slice(-20)
              .map((m: any) => ({
                sender: m.sender,
                text: m.text,
              }))
          : [];

        const requestHistory = Array.isArray(history)
          ? history
              .filter((m: any) => m && typeof m.text === "string")
              .slice(-20)
              .map((m: any) => ({
                sender: m.sender,
                text: m.text,
              }))
          : [];

        const combinedHistory =
          storedHistory.length > 0 ? storedHistory : requestHistory;

        const coachResponse = await generateCoachResponseStructured(
          message,
          {
            userProfile: effectiveProfile,
            workoutPlan: effectiveWorkout,
            fitnessStatus: effectiveStatus,
            nutritionData: effectiveNutrition,
            recoveryData: effectiveRecovery,
            coachPlan: userData?.coachPlan,
            workoutLogs: userData?.workoutLogs,
            coachProfile: userData?.coachProfile,
          },
          combinedHistory,
          authenticatedUserId
        );

        // เก็บข้อความล่าสุดลง Firebase ทันทีสำหรับผู้ใช้ที่ Login
        // เพื่อให้ Coach รอบถัดไปมี memory ต่อเนื่องแม้เปิดอุปกรณ์ใหม่
        if (authenticatedUserId) {
          try {
            const now = new Date().toLocaleTimeString("th-TH", {
              hour: "2-digit",
              minute: "2-digit",
            });

            const existingMessages = Array.isArray(userData?.messages)
              ? userData!.messages
              : [];

            const userMessageRecord = {
              id: `user-${Date.now()}`,
              sender: "user" as const,
              text: message,
              timestamp: now,
            };

            const coachMessageRecord = {
              id: `bot-${Date.now() + 1}`,
              sender: "bot" as const,
              text: coachResponse.message,
              timestamp: now,
              coachResponse,
            };

            await saveUserData(authenticatedUserId, {
              messages: [
                ...existingMessages,
                userMessageRecord,
                coachMessageRecord,
              ].slice(-100),
            });
          } catch (saveError) {
            // ไม่ให้การเก็บ chat history ทำให้คำตอบจาก Coach ล้มเหลว
            console.warn(
              "[API] บันทึก Coach conversation ล้มเหลว:",
              saveError
            );
          }
        }

        return res.json({
          reply: coachResponse.message,
          coachResponse,
          timestamp: new Date().toISOString(),
          dataSource: authenticatedUserId ? "firebase" : "frontend",
          realCoachData: Boolean(userData),
        });
      } catch (err) {
        console.error("[API] Coach Chat ล้มเหลว:", err);
        return res.status(500).json({
          reply:
            "ขออภัยครับ โค้ชกำลังประมวลผลข้อมูลอยู่ รบกวนลองส่งข้อความใหม่อีกครั้งนะครับ! 💪",
        });
      }
    }
  );

  // ----------------------------------------------------
  // Frontend Asset Handling (Vite / Static)
  // ----------------------------------------------------
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });

    app.use(vite.middlewares);
    console.log("[Server] เปิดใช้งาน Vite Middleware (โหมด Development)");
  } else {
    const distPath = path.join(process.cwd(), "dist");

    app.use(express.static(distPath));

    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });

    console.log("[Server] เสิร์ฟ Production Build จากโฟลเดอร์ dist");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(
      `🚀 FitCoach AI เซิร์ฟเวอร์พร้อมทำงานที่ http://0.0.0.0:${PORT}`
    );
  });
}

startServer().catch((err) => {
  console.error("FATAL: เซิร์ฟเวอร์ไม่สามารถเริ่มต้นได้:", err);
});
