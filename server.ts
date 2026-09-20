// server.ts - เซิร์ฟเวอร์ Express หลัก รองรับ LINE OAuth 2.1, LINE Webhook, User Data API และ Vite Middleware
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import { createServer as createViteServer } from "vite";
import { authRouter, getMeHandler, requireAuth, type AuthenticatedRequest } from "./auth-line";
import { googleFitRouter } from "./google-fit";
import { lineWebhookHandler } from "./line-webhook";
import { getUserData, saveUserData } from "./db";
import { generateCoachResponseStructured, type HistoryItem } from "./coach-ai";
import { registerLineRichMenuRoutes } from "./line-richmenu";
import { startReminderEngine, sendMorningBriefing, sendNightRecap } from "./reminder-engine";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // 1. Render / Reverse Proxy
  app.set("trust proxy", 1);

  // 2. rawBody สำหรับ LINE Webhook Signature
  app.use(
    express.json({
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    })
  );
  app.use(express.urlencoded({ extended: true }));

  // 3. Signed cookies สำหรับ LINE Session
  const sessionSecret =
    process.env.SESSION_SECRET ||
    "fitcoach_default_session_secret_change_in_production";
  app.use(cookieParser(sessionSecret));

  // ----------------------------------------------------
  // API Routes (ต้องอยู่ก่อน Vite Middleware เสมอ)
  // ----------------------------------------------------

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "FitCoach AI",
      timestamp: new Date().toISOString(),
    });
  });

  // LINE Login OAuth Routes
  app.use("/auth", authRouter);

  // Google Fit OAuth & Sync Routes
  app.use("/", googleFitRouter);

  // Session status
  app.get("/api/me", getMeHandler);

  // LINE Bot Webhook
  app.post("/webhook", lineWebhookHandler);

  // LINE Rich Menu admin routes (protected by ADMIN_KEY inside line-richmenu.ts)
  registerLineRichMenuRoutes(app);

  // ----------------------------------------------------
  // User Data
  // ----------------------------------------------------

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

  app.post(
    "/api/user/migrate",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const userId = req.user!.userId;
        const existing = await getUserData(userId);

        // ย้ายข้อมูล localStorage ขึ้น server เฉพาะกรณี server ยังไม่มี profile
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
        return res
          .status(500)
          .json({ success: false, error: "Migration failed" });
      }
    }
  );

  // Helper เพื่อดึง userId จาก signed session หรือ request
  const getSessionUserId = (req: any): string | null => {
    const rawSession = req.signedCookies?.fitcoach_session;
    if (rawSession) {
      try {
        const sessionUser = typeof rawSession === "string" ? JSON.parse(rawSession) : rawSession;
        if (sessionUser?.userId) return sessionUser.userId;
      } catch {}
    }
    if (req.user?.userId) return req.user.userId;
    return null;
  };

  // ----------------------------------------------------
  // Proactive LINE Coaching: Morning Briefing & Night Recap
  // ----------------------------------------------------

  app.post("/api/coach/send-morning-briefing", async (req, res) => {
    try {
      const userId = getSessionUserId(req) || req.body?.userId;
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: "ไม่พบบัญชี LINE ของคุณ กรุณาเข้าสู่ระบบผ่าน LINE ก่อนทดสอบส่งข้อความ",
        });
      }
      const result = await sendMorningBriefing(userId);
      return res.json({ success: result.ok, error: result.error });
    } catch (err: any) {
      console.error("[API] send-morning-briefing error:", err);
      return res.status(500).json({ success: false, error: err?.message || "ส่งข้อความไม่สำเร็จ" });
    }
  });

  app.post("/api/coach/send-night-recap", async (req, res) => {
    try {
      const userId = getSessionUserId(req) || req.body?.userId;
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: "ไม่พบบัญชี LINE ของคุณ กรุณาเข้าสู่ระบบผ่าน LINE ก่อนทดสอบส่งข้อความ",
        });
      }
      const result = await sendNightRecap(userId);
      return res.json({ success: result.ok, error: result.error });
    } catch (err: any) {
      console.error("[API] send-night-recap error:", err);
      return res.status(500).json({ success: false, error: err?.message || "ส่งข้อความไม่สำเร็จ" });
    }
  });

  // ----------------------------------------------------
  // Google Health / Smartwatch Data Sync
  // ----------------------------------------------------

  app.post("/api/health/sync", async (req, res) => {
    try {
      const userId = getSessionUserId(req) || req.body?.userId;
      const {
        steps,
        caloriesBurned,
        distanceKm,
        activeMinutes,
        sleepHours,
        sleepMinutes,
        sleepStart,
        sleepEnd,
        syncedAt,
      } = req.body || {};

      if (userId) {
        const existing = await getUserData(userId);
        const updatedActivity = {
          ...(existing?.activity || {}),
          currentSteps: Number(steps) || 0,
          caloriesExpended: Number(caloriesBurned) || 0,
          distanceKm: Number(distanceKm) || 0,
          activeMinutes: Number(activeMinutes) || 0,
          isFromGoogleHealth: true,
          lastSyncedAt: syncedAt || new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
        };

        const updatedRecovery = {
          ...(existing?.recovery || {}),
          ...(sleepHours != null ? { sleepHours: Number(sleepHours) } : {}),
          ...(sleepMinutes != null ? { sleepMinutes: Number(sleepMinutes) } : {}),
          ...(sleepStart ? { sleepStart } : {}),
          ...(sleepEnd ? { sleepEnd } : {}),
          isFromGoogleHealth: true,
          lastSyncedAt: syncedAt || new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
        };

        await saveUserData(userId, {
          activity: updatedActivity as any,
          recovery: updatedRecovery as any,
        });
      }

      return res.json({ success: true, message: "ซิงค์ข้อมูลสุขภาพเข้าระบบเรียบร้อยแล้ว" });
    } catch (err: any) {
      console.error("[Health Sync] Error:", err);
      return res.status(500).json({ success: false, error: err?.message || "ซิงค์ข้อมูลไม่สำเร็จ" });
    }
  });

  // ----------------------------------------------------
  // AI Coach Chat
  //
  // Phase 4:
  // - อ่าน Session Cookie แบบ signed โดยไม่บังคับ login
  // - ถ้ามี session -> ใช้ Firebase เป็น source of truth
  // - ส่ง coachPlan / workoutLogs / coachProfile เข้า Coach AI
  // - เปิดใช้งาน Coach Tools ด้วย userId จริง
  // - เก็บบทสนทนาล่าสุดกลับ Firebase
  //
  // Guest mode ยังทำงานได้เหมือนเดิม เพราะไม่มี session ก็ใช้
  // context ที่ frontend ส่งมาแทน
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
        } = req.body ?? {};

        if (!message || typeof message !== "string") {
          return res
            .status(400)
            .json({ error: "ต้องระบุข้อความ message" });
        }

        // IMPORTANT:
        // ไม่รับ userId จาก frontend เพื่อป้องกันการอ่าน/เขียนข้อมูลของ user อื่น
        // ใช้ userId จาก signed LINE session เท่านั้น
        const rawSession = req.signedCookies?.fitcoach_session;

        if (rawSession) {
          try {
            const sessionUser = JSON.parse(rawSession);

            if (
              sessionUser &&
              typeof sessionUser.userId === "string" &&
              sessionUser.userId.trim()
            ) {
              req.user = sessionUser;
            }
          } catch (err) {
            console.warn(
              "[AI Coach] fitcoach_session ไม่ถูกต้อง -> ใช้ guest context",
              err
            );
          }
        }

        const authenticatedUserId = req.user?.userId;

        // ------------------------------------------------
        // Authenticated user:
        // Firebase เป็น source of truth
        // Guest:
        // ใช้ context จาก frontend
        // ------------------------------------------------
        const userData = authenticatedUserId
          ? await getUserData(authenticatedUserId)
          : null;

        const effectiveProfile =
          userData?.profile || userProfile;
        const effectiveWorkout =
          userData?.workout || workoutPlan;
        const effectiveStatus =
          userData?.status || fitnessStatus;
        const effectiveNutrition =
          userData?.nutrition || nutritionData;
        const effectiveRecovery =
          userData?.recovery || recoveryData;

        // ------------------------------------------------
        // History
        // coach-ai.ts ต้องการ:
        // { sender: "user" | "bot" | "coach" | "system", text: string }
        //
        // Firebase messages ของ app ใช้ ChatMessage:
        // { sender, text, timestamp, coachResponse, ... }
        // จึงต้อง map ให้เป็น HistoryItem ก่อนส่ง Gemini
        // ------------------------------------------------

        const firebaseHistory: HistoryItem[] = Array.isArray(
          userData?.messages
        )
          ? userData.messages
              .slice(-20)
              .map((item: any) => ({
                sender:
                  item?.sender === "user"
                    ? "user"
                    : item?.sender === "system"
                      ? "system"
                      : "bot",
                text:
                  typeof item?.text === "string"
                    ? item.text
                    : typeof item?.content === "string"
                      ? item.content
                      : "",
              }))
              .filter((item) => item.text.trim().length > 0)
          : [];

        const requestHistory: HistoryItem[] = Array.isArray(history)
          ? history
              .slice(-20)
              .map((item: any) => ({
                sender:
                  item?.sender === "user"
                    ? "user"
                    : item?.sender === "system"
                      ? "system"
                      : "bot",
                text:
                  typeof item?.text === "string"
                    ? item.text
                    : typeof item?.content === "string"
                      ? item.content
                      : "",
              }))
              .filter((item) => item.text.trim().length > 0)
          : [];

        const combinedHistory =
          firebaseHistory.length > 0
            ? firebaseHistory
            : requestHistory;

        // ------------------------------------------------
        // Gemini + Coach Tools
        // ถ้ามี authenticatedUserId:
        // save_plan / upsert_plan_days / log_workout /
        // update_profile_info จะเขียนลง Firebase ได้จริง
        // ------------------------------------------------
        const coachResponse =
          await generateCoachResponseStructured(
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

        // ------------------------------------------------
        // เก็บบทสนทนาลง Firebase
        // ------------------------------------------------
        if (authenticatedUserId) {
          const currentMessages = Array.isArray(userData?.messages)
            ? userData.messages
            : [];

          const now = new Date().toISOString();

          const userMessageRecord = {
            id: `user-${Date.now()}`,
            sender: "user" as const,
            text: message,
            timestamp: now,
          };

          const botMessageRecord = {
            id: `bot-${Date.now()}`,
            sender: "bot" as const,
            text: coachResponse.message,
            timestamp: now,
            coachResponse,
          };

          const nextMessages = [
            ...currentMessages,
            userMessageRecord,
            botMessageRecord,
          ].slice(-100);

          await saveUserData(authenticatedUserId, {
            messages: nextMessages,
          });
        }

        return res.json({
          reply: coachResponse.message,
          coachResponse,
          timestamp: new Date().toISOString(),
          dataSource: authenticatedUserId ? "firebase" : "client",
          realCoachData: Boolean(authenticatedUserId),
          userIdConnected: Boolean(authenticatedUserId),
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

    console.log(
      "[Server] เปิดใช้งาน Vite Middleware (โหมด Development)"
    );
  } else {
    const distPath = path.join(process.cwd(), "dist");

    app.use(express.static(distPath));

    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });

    console.log(
      "[Server] เสิร์ฟ Production Build จากโฟลเดอร์ dist"
    );
  }

  // Start server
  app.listen(PORT, "0.0.0.0", () => {
    console.log(
      `🚀 FitCoach AI เซิร์ฟเวอร์พร้อมทำงานที่ http://0.0.0.0:${PORT}`
    );
  });

  // Phase 6 — Scheduled LINE Workout Reminder Engine
  // รันแยกจาก webhook เพื่อให้โค้ชส่งเตือนได้เองตามเวลาที่ผู้ใช้ตั้งไว้
  void startReminderEngine();
}

startServer().catch((err) => {
  console.error(
    "FATAL: เซิร์ฟเวอร์ไม่สามารถเริ่มต้นได้:",
    err
  );
});
