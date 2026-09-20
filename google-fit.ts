// google-fit.ts - รองรับการเชื่อมต่อ Google Fit แบบ 1-Click ผ่าน OAuth 2.0 และ REST API
import { Router, Request, Response } from "express";
import crypto from "crypto";
import { requireAuth, AuthenticatedRequest } from "./auth-line";
import { getUserData, saveUserData } from "./db";

export const googleFitRouter = Router();

// ค่า Scopes สำหรับ Google Fitness REST API
const GOOGLE_FITNESS_SCOPES = [
  "https://www.googleapis.com/auth/fitness.activity.read",
  "https://www.googleapis.com/auth/fitness.body.read",
  "https://www.googleapis.com/auth/fitness.sleep.read",
  "openid",
  "email",
  "profile",
].join(" ");

function getGoogleConfig(req: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  
  const host = req.get("host") || "localhost:3000";
  const protocol = req.protocol === "https" || req.get("x-forwarded-proto") === "https" ? "https" : "http";
  const configuredAppUrl = process.env.APP_URL ? process.env.APP_URL.replace(/\/$/, "") : `${protocol}://${host}`;
  const redirectUri = `${configuredAppUrl}/auth/google/callback`;

  return {
    clientId,
    clientSecret,
    appUrl: configuredAppUrl,
    redirectUri,
  };
}

/**
 * 1-Click Entry: GET /auth/google
 * เมื่อกดปุ่ม "เชื่อมต่อ Google Fit" ปุ๊บ เซิร์ฟเวอร์จะสร้าง State และพาไปยังหน้าขออนุญาต Google ทันที
 */
googleFitRouter.get("/google", (req: Request, res: Response) => {
  const config = getGoogleConfig(req);

  if (!config.clientId) {
    return res.status(500).send(`
      <div style="font-family: sans-serif; text-align: center; padding: 40px; max-width: 480px; margin: 40px auto; background: #fff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
        <h2 style="color: #ea4335; margin-bottom: 8px;">⚠️ ยังไม่ได้ระบุ GOOGLE_CLIENT_ID</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          กรุณาเพิ่ม <code>GOOGLE_CLIENT_ID</code> และ <code>GOOGLE_CLIENT_SECRET</code> ใน Environment Variables บน Render
        </p>
        <a href="/" style="display: inline-block; margin-top: 16px; padding: 10px 20px; background: #0f172a; color: white; border-radius: 10px; text-decoration: none; font-size: 13px; font-weight: bold;">กลับสู่ FitCoach AI</a>
      </div>
    `);
  }

  const state = crypto.randomBytes(24).toString("hex");

  // เก็บ state ใน signed cookie 15 นาที
  res.cookie("google_oauth_state", state, {
    httpOnly: true,
    secure: req.protocol === "https" || req.get("x-forwarded-proto") === "https",
    sameSite: "lax",
    maxAge: 15 * 60 * 1000,
    signed: true,
  });

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", config.clientId);
  authUrl.searchParams.set("redirect_uri", config.redirectUri);
  authUrl.searchParams.set("scope", GOOGLE_FITNESS_SCOPES);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");

  return res.redirect(authUrl.toString());
});

/**
 * GET /auth/google/callback
 * Google ส่ง Auth Code กลับมา ทำการแลกเปลี่ยนเป็น Access Token และดึงข้อมูลก้าวเดิน/แคลอรีทันที
 */
googleFitRouter.get("/google/callback", async (req: Request, res: Response) => {
  const { code, state, error, error_description } = req.query;
  const config = getGoogleConfig(req);

  if (error) {
    console.error("[Google Fit Auth] ผู้ใช้ปฏิเสธหรือเกิดข้อผิดพลาด:", error, error_description);
    return res.redirect(`/?google_fit_error=${encodeURIComponent(String(error))}`);
  }

  const storedState = req.signedCookies?.google_oauth_state;
  res.clearCookie("google_oauth_state");

  if (!state || !storedState || state !== storedState) {
    console.error("[Google Fit Auth] State validation mismatch");
    return res.redirect("/?google_fit_error=invalid_state");
  }

  if (!code || typeof code !== "string") {
    return res.redirect("/?google_fit_error=missing_code");
  }

  try {
    // 1. แลกเปลี่ยน Authorization Code เป็น Tokens
    const tokenParams = new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code",
    });

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenParams.toString(),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("[Google Fit Auth] Token exchange failed:", errText);
      return res.redirect("/?google_fit_error=token_exchange_failed");
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;

    // 2. ดึงข้อมูล User info ของ Google
    let googleEmail = "";
    try {
      const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (userInfoRes.ok) {
        const userInfo = await userInfoRes.json();
        googleEmail = userInfo.email || "";
      }
    } catch (e) {
      console.warn("[Google Fit Auth] ไม่สามารถดึง email:", e);
    }

    // 3. ตรวจสอบว่าผู้ใช้ล็อกอิน LINE อยู่หรือไม่
    const rawSession = req.signedCookies?.fitcoach_session;
    let userId = "";
    if (rawSession) {
      try {
        const userObj = JSON.parse(rawSession);
        userId = userObj.userId;
      } catch {
        // ignore
      }
    }

    // 4. ดึงข้อมูลสุขภาพจาก Google Fitness API ของวันนี้ทันที
    const healthStats = await fetchGoogleFitnessDailyStats(accessToken);

    // เก็บ Token ไว้ใน Secure Cookie สำหรับการซิงค์ต่อเนื่อง
    const tokenPayload = {
      accessToken,
      refreshToken,
      email: googleEmail,
      connectedAt: Date.now(),
      expiresAt: Date.now() + (tokenData.expires_in || 3600) * 1000,
    };

    res.cookie("google_fit_token", JSON.stringify(tokenPayload), {
      httpOnly: true,
      secure: req.protocol === "https" || req.get("x-forwarded-proto") === "https",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 วัน
      signed: true,
    });

    // ถ้ามี userId ของ LINE ใน session ให้บันทึกข้อมูลเข้าฐานข้อมูลของผู้ใช้คนนั้นทันที
    if (userId) {
      const existing = await getUserData(userId);
      const updatedActivity = {
        ...(existing.activity || {}),
        currentSteps: healthStats.steps || existing.activity?.currentSteps || 0,
        distanceKm: healthStats.distanceKm || existing.activity?.distanceKm || 0,
        activeMinutes: healthStats.activeMinutes || existing.activity?.activeMinutes || 0,
        caloriesExpended: healthStats.calories || existing.activity?.caloriesExpended || 0,
        isFromGoogleHealth: true,
        lastSyncedAt: new Date().toISOString(),
      };

      const updatedRecovery = {
        ...(existing.recovery || {}),
        sleepHours: healthStats.sleepHours || existing.recovery?.sleepHours || 0,
        sleepMinutes: healthStats.sleepMinutes || existing.recovery?.sleepMinutes || 0,
        isFromGoogleHealth: true,
        lastSyncedAt: new Date().toISOString(),
      };

      await saveUserData(userId, {
        activity: updatedActivity,
        recovery: updatedRecovery,
      });
      console.log(`[Google Fit Sync] อัปเดตข้อมูลก้าวเดิน (${healthStats.steps} ก้าว) ลง DB สำเร็จสำหรับ userId=${userId}`);
    }

    return res.redirect("/?google_fit_connected=true");
  } catch (err) {
    console.error("[Google Fit Auth] Callback processing error:", err);
    return res.redirect("/?google_fit_error=unknown");
  }
});

/**
 * GET /api/googlefit/status
 * ตรวจสอบสถานะการเชื่อมต่อ Google Fit
 */
googleFitRouter.get("/api/googlefit/status", (req: Request, res: Response) => {
  const tokenCookie = req.signedCookies?.google_fit_token;
  if (!tokenCookie) {
    return res.json({ connected: false });
  }

  try {
    const data = JSON.parse(tokenCookie);
    const isValid = data.expiresAt > Date.now() || Boolean(data.refreshToken);
    return res.json({
      connected: isValid,
      email: data.email,
      connectedAt: data.connectedAt,
    });
  } catch {
    return res.json({ connected: false });
  }
});

/**
 * POST /api/googlefit/sync
 * ซิงค์ข้อมูลล่าสุดจาก Google Fit แบบ 1-Click
 */
googleFitRouter.post("/api/googlefit/sync", async (req: Request, res: Response) => {
  const tokenCookie = req.signedCookies?.google_fit_token;
  if (!tokenCookie) {
    return res.status(401).json({ success: false, error: "ยังไม่ได้เชื่อมต่อ Google Fit" });
  }

  try {
    const tokenObj = JSON.parse(tokenCookie);
    let accessToken = tokenObj.accessToken;

    // ตรวจสอบ Token หมดอายุ และ refresh ถ้ามี refresh_token
    if (tokenObj.expiresAt <= Date.now() && tokenObj.refreshToken) {
      const config = getGoogleConfig(req);
      const refreshParams = new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: tokenObj.refreshToken,
        grant_type: "refresh_token",
      });

      const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: refreshParams.toString(),
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        accessToken = refreshData.access_token;
        tokenObj.accessToken = accessToken;
        tokenObj.expiresAt = Date.now() + (refreshData.expires_in || 3600) * 1000;
        res.cookie("google_fit_token", JSON.stringify(tokenObj), {
          httpOnly: true,
          secure: req.protocol === "https" || req.get("x-forwarded-proto") === "https",
          sameSite: "lax",
          maxAge: 30 * 24 * 60 * 60 * 1000,
          signed: true,
        });
      }
    }

    const healthStats = await fetchGoogleFitnessDailyStats(accessToken);

    // ดึง session LINE เพื่อเซฟลงฐานข้อมูล
    const rawSession = req.signedCookies?.fitcoach_session;
    let userId = "";
    if (rawSession) {
      try {
        userId = JSON.parse(rawSession).userId;
      } catch {
        // ignore
      }
    }

    if (userId) {
      const existing = await getUserData(userId);
      const updatedActivity = {
        ...(existing.activity || {}),
        currentSteps: healthStats.steps || existing.activity?.currentSteps || 0,
        distanceKm: healthStats.distanceKm || existing.activity?.distanceKm || 0,
        activeMinutes: healthStats.activeMinutes || existing.activity?.activeMinutes || 0,
        caloriesExpended: healthStats.calories || existing.activity?.caloriesExpended || 0,
        isFromGoogleHealth: true,
        lastSyncedAt: new Date().toISOString(),
      };

      const updatedRecovery = {
        ...(existing.recovery || {}),
        sleepHours: healthStats.sleepHours || existing.recovery?.sleepHours || 0,
        sleepMinutes: healthStats.sleepMinutes || existing.recovery?.sleepMinutes || 0,
        isFromGoogleHealth: true,
        lastSyncedAt: new Date().toISOString(),
      };

      await saveUserData(userId, {
        activity: updatedActivity,
        recovery: updatedRecovery,
      });
    }

    return res.json({
      success: true,
      data: healthStats,
      syncedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[Google Fit Sync Error]:", err);
    return res.status(500).json({ success: false, error: err.message || "ซิงค์ข้อมูลล้มเหลว" });
  }
});

/**
 * POST /api/googlefit/disconnect
 * ยกเลิกการเชื่อมต่อ Google Fit
 */
googleFitRouter.post("/api/googlefit/disconnect", (req: Request, res: Response) => {
  res.clearCookie("google_fit_token");
  return res.json({ success: true, message: "ยกเลิกการเชื่อมต่อ Google Fit สำเร็จ" });
});

/**
 * ฟังก์ชันดึงสถิติรายวันจาก Google Fitness REST API
 */
async function fetchGoogleFitnessDailyStats(accessToken: string) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startTimeMillis = startOfDay.getTime();
  const endTimeMillis = now.getTime();

  let steps = 0;
  let distanceKm = 0;
  let calories = 0;
  let activeMinutes = 0;
  let sleepHours = 0;
  let sleepMinutes = 0;

  try {
    const aggBody = {
      aggregateBy: [
        { dataTypeName: "com.google.step_count.delta" },
        { dataTypeName: "com.google.distance.delta" },
        { dataTypeName: "com.google.calories.expended" },
        { dataTypeName: "com.google.active_minutes" },
      ],
      bucketByTime: { durationMillis: 86400000 },
      startTimeMillis,
      endTimeMillis,
    };

    const res = await fetch("https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(aggBody),
    });

    if (res.ok) {
      const data = await res.json();
      const bucket = data.bucket?.[0];
      if (bucket?.dataset) {
        for (const ds of bucket.dataset) {
          for (const point of ds.point || []) {
            const dsId = ds.dataSourceId || "";
            const val = point.value?.[0];
            if (!val) continue;

            if (dsId.includes("step_count")) {
              steps += val.intVal || 0;
            } else if (dsId.includes("distance")) {
              distanceKm += (val.fpVal || 0) / 1000;
            } else if (dsId.includes("calories")) {
              calories += Math.round(val.fpVal || 0);
            } else if (dsId.includes("active_minutes")) {
              activeMinutes += val.intVal || 0;
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn("[Google Fit] Aggregate API warning:", err);
  }

  // ดึงข้อมูลการนอนหลับ 48 ชม. ล่าสุด
  try {
    const twoDaysAgoIso = new Date(now.getTime() - 48 * 3600 * 1000).toISOString();
    const sleepUrl = `https://www.googleapis.com/fitness/v1/users/me/sessions?startTime=${encodeURIComponent(
      twoDaysAgoIso
    )}&endTime=${encodeURIComponent(now.toISOString())}&activityType=72`;

    const sleepRes = await fetch(sleepUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (sleepRes.ok) {
      const sleepData = await sleepRes.json();
      const sessions = sleepData.session || [];
      if (sessions.length > 0) {
        const latest = sessions[sessions.length - 1];
        const sStart = parseInt(latest.startTimeMillis, 10);
        const sEnd = parseInt(latest.endTimeMillis, 10);
        const durationMin = Math.round((sEnd - sStart) / (1000 * 60));
        if (durationMin > 0) {
          sleepHours = Math.floor(durationMin / 60);
          sleepMinutes = durationMin % 60;
        }
      }
    }
  } catch (err) {
    console.warn("[Google Fit] Sleep API warning:", err);
  }

  return {
    steps: Math.max(0, steps),
    distanceKm: parseFloat(distanceKm.toFixed(2)),
    calories: Math.max(0, calories),
    activeMinutes: Math.max(0, activeMinutes),
    sleepHours,
    sleepMinutes,
  };
}
