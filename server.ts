// server.ts - Express, LINE OAuth 2.1, LINE Webhook, User Data API, Vite Middleware
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import { createServer as createViteServer } from "vite";
import { authRouter, getMeHandler, requireAuth, type AuthenticatedRequest } from "./auth-line";
import { googleFitRouter } from "./google-fit";
import { lineWebhookHandler } from "./line-webhook";
import { getUserData, saveUserData } from "./db";
import { generateCoachResponse } from "./coach-ai";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.set("trust proxy", 1);

  app.use(
    express.json({
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    })
  );
  app.use(express.urlencoded({ extended: true }));

  const sessionSecret = process.env.SESSION_SECRET || "fitcoach_default_session_secret_change_in_production";
  app.use(cookieParser(sessionSecret));

  // Route Health
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "FitCoach AI", timestamp: new Date().toISOString() });
  });

  // LINE Login OAuth Routes (/auth/line, /auth/line/callback, /auth/logout)
  app.use("/auth", authRouter);

  // Google Fit 1-Click OAuth & Sync Routes (/auth/google, /auth/google/callback, /api/googlefit/*)
  app.use("/", googleFitRouter);

  // Profile
  app.get("/api/me", getMeHandler);

  // LINE Bot Webhook
  app.post("/webhook", lineWebhookHandler);

  // User Data API
  app.get("/api/user/data", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;
      const data = await getUserData(userId);
      return res.json({ success: true, data });
    } catch (err) {
      console.error("[API] Error fetching user data:", err);
      return res.status(500).json({ success: false, error: "Failed to fetch user data" });
    }
  });

  app.post("/api/user/data", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;
      const payload = req.body;
      const updated = await saveUserData(userId, payload);
      return res.json({ success: true, data: updated });
    } catch (err) {
      console.error("[API] Error saving user data:", err);
      return res.status(500).json({ success: false, error: "Failed to save user data" });
    }
  });

  // LocalStorage Migration
  app.post("/api/user/migrate", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;
      const existing = await getUserData(userId);
      if (!existing?.profile?.name && req.body.profile) {
        console.log(`[API Migration] Migrating LocalStorage to Server for userId=${userId}`);
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
      console.error("[API Migration] Migration error:", err);
      return res.status(500).json({ success: false, error: "Migration failed" });
    }
  });

  // AI Coach Chat API
  app.post("/api/ai/coach-chat", async (req, res) => {
    try {
      const { message, userProfile, workoutPlan, fitnessStatus, nutritionData, recoveryData } = req.body;
      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Missing message" });
      }
      const reply = await generateCoachResponse(message, {
        userProfile,
        workoutPlan,
        fitnessStatus,
        nutritionData,
        recoveryData,
      });
      return res.json({ reply, timestamp: new Date().toISOString() });
    } catch (err) {
      console.error("[API] Coach Chat error:", err);
      return res.status(500).json({
        reply: "ขออภัยครับ ระบบกำลังประมวลผลข้อมูล กรุณาลองใหม่อีกครั้งนะครับ",
      });
    }
  });

  // Frontend Asset Handling (Vite / Static)
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("[Server] Mounted Vite Middleware (Development)");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("[Server] Serving Production Build from dist");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("FATAL: Server startup error:", err);
});
