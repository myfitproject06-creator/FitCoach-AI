// auth-line.ts - จัดการระบบ LINE Login OAuth 2.1 และ Session Authentication ฝั่งเซิร์ฟเวอร์
import { Router, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { updateLineProfile, getUserData } from "./db";

export interface SessionUser {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  loggedInAt: number;
}

// ขยาย Request ให้มี user
export interface AuthenticatedRequest extends Request {
  user?: SessionUser;
}

export const authRouter = Router();

// ดึงค่าการตั้งค่าจาก Environment Variables
function getAuthConfig(req: Request) {
  const channelId = process.env.LINE_LOGIN_CHANNEL_ID || "";
  const channelSecret = process.env.LINE_LOGIN_CHANNEL_SECRET || "";
  const sessionSecret = process.env.SESSION_SECRET || "fitcoach_default_session_secret_change_in_production";
  
  // ตรวจสอบ Host และ Protocol เพื่อสร้าง Redirect URL ที่ถูกต้องบน Render หรือ Reverse Proxy
  const host = req.get("host") || "localhost:3000";
  const protocol = req.protocol === "https" || req.get("x-forwarded-proto") === "https" ? "https" : "http";
  const configuredAppUrl = process.env.APP_URL ? process.env.APP_URL.replace(/\/$/, "") : `${protocol}://${host}`;
  const redirectUri = `${configuredAppUrl}/auth/line/callback`;

  return {
    channelId,
    channelSecret,
    sessionSecret,
    appUrl: configuredAppUrl,
    redirectUri,
  };
}

/**
 * GET /auth/line
 * เริ่มต้นกระบวนการ LINE Login: สร้าง state สุ่มแล้ว redirect ไปหน้าอนุญาตสิทธิ์ของ LINE
 */
authRouter.get("/line", (req: Request, res: Response) => {
  const config = getAuthConfig(req);

  if (!config.channelId) {
    console.error("[LINE Auth] ไม่พบ LINE_LOGIN_CHANNEL_ID ในตัวแปรสภาพแวดล้อม (Environment Variables)");
    return res.status(500).send(`
      <div style="font-family: sans-serif; text-align: center; padding: 40px;">
        <h2 style="color: #e11d48;">⚠️ ยังไม่ได้ตั้งค่า LINE_LOGIN_CHANNEL_ID</h2>
        <p>กรุณาเพิ่ม <code>LINE_LOGIN_CHANNEL_ID</code> และ <code>LINE_LOGIN_CHANNEL_SECRET</code> ใน Environment Variables บน Render</p>
        <a href="/" style="display: inline-block; margin-top: 16px; padding: 8px 16px; background: #06C755; color: white; border-radius: 8px; text-decoration: none;">กลับสู่หน้าแรก</a>
      </div>
    `);
  }

  // สร้าง state สุ่มแบบปลอดภัย (Cryptographically Secure Random State)
  const state = crypto.randomBytes(24).toString("hex");

  // เก็บ state ใน signed cookie ป้องกัน CSRF Attack (อายุ 15 นาที)
  res.cookie("line_oauth_state", state, {
    httpOnly: true,
    secure: req.secure || process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 15 * 60 * 1000,
    signed: true,
  });

  // สร้าง LINE Authorization URL พร้อม scope 'profile openid' และ bot_prompt=normal
  const authUrl = new URL("https://access.line.me/oauth2/v2.1/authorize");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", config.channelId);
  authUrl.searchParams.set("redirect_uri", config.redirectUri);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("scope", "profile openid");
  authUrl.searchParams.set("bot_prompt", "normal"); // ชวนเพิ่มเพื่อน LINE Bot ควบคู่

  console.log(`[LINE Auth] กำลังนำทางไป LINE Login: redirect_uri=${config.redirectUri}`);
  return res.redirect(authUrl.toString());
});

/**
 * GET /auth/line/callback
 * รับ Callback จาก LINE: ตรวจสอบ state, แลก authorization_code เป็น token, ดึงข้อมูลโปรไฟล์ และสร้าง Session
 */
authRouter.get("/line/callback", async (req: Request, res: Response) => {
  const config = getAuthConfig(req);
  const { code, state, error, error_description } = req.query;

  // 1. ตรวจสอบกรณีผู้ใช้กดยกเลิกหรือปฏิเสธสิทธิ์
  if (error) {
    console.warn("[LINE Auth] ผู้ใช้ปฏิเสธหรือเกิดข้อผิดพลาดในการล็อกอิน:", error, error_description);
    return res.redirect(`/?login_error=${encodeURIComponent(String(error_description || error))}`);
  }

  // 2. ตรวจสอบ State เพื่อป้องกัน CSRF Attack
  const storedState = req.signedCookies.line_oauth_state;
  res.clearCookie("line_oauth_state"); // ล้าง state cookie ทันทีที่ใช้งาน

  if (!state || !storedState || state !== storedState) {
    console.error("[LINE Auth] State mismatch หรือหมดอายุ: state=", state, "stored=", storedState);
    return res.redirect("/?login_error=invalid_state");
  }

  if (!code || typeof code !== "string") {
    console.error("[LINE Auth] ไม่ได้รับ authorization code จาก LINE");
    return res.redirect("/?login_error=missing_code");
  }

  try {
    // 3. แลก authorization code เป็น access_token กับ LINE Token API
    const tokenResponse = await fetch("https://api.line.me/oauth2/v2.1/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: config.redirectUri,
        client_id: config.channelId,
        client_secret: config.channelSecret,
      }),
    });

    if (!tokenResponse.ok) {
      const errBody = await tokenResponse.text();
      console.error("[LINE Auth] การแลก Token ล้มเหลว:", tokenResponse.status, errBody);
      return res.redirect(`/?login_error=token_exchange_failed`);
    }

    const tokenData = (await tokenResponse.json()) as {
      access_token: string;
      id_token?: string;
      token_type: string;
      expires_in: number;
    };

    // 4. ดึงข้อมูลโปรไฟล์ผู้ใช้จาก LINE Profile API
    const profileResponse = await fetch("https://api.line.me/v2/profile", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!profileResponse.ok) {
      const errBody = await profileResponse.text();
      console.error("[LINE Auth] การดึงโปรไฟล์ LINE ล้มเหลว:", errBody);
      return res.redirect("/?login_error=profile_fetch_failed");
    }

    const profile = (await profileResponse.json()) as {
      userId: string;
      displayName: string;
      pictureUrl?: string;
      statusMessage?: string;
    };

    console.log(`[LINE Auth] เข้าสู่ระบบสำเร็จ: ${profile.displayName} (${profile.userId})`);

    // 5. บันทึก/อัปเดตข้อมูลผู้ใช้ลงในฐานข้อมูล
    await updateLineProfile(profile.userId, {
      userId: profile.userId,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl,
      statusMessage: profile.statusMessage,
    });

    // 6. สร้าง Session User และเซ็ตใน Signed Cookie (httpOnly, secure, sameSite=lax)
    const sessionUser: SessionUser = {
      userId: profile.userId,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl,
      loggedInAt: Date.now(),
    };

    res.cookie("fitcoach_session", JSON.stringify(sessionUser), {
      httpOnly: true,
      secure: req.secure || process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // เซสชันมีอายุ 30 วัน
      signed: true,
    });

    // นำทางกลับหน้าแรกพร้อมพารามิเตอร์แจ้งเตือนล็อกอินสำเร็จ
    return res.redirect("/?login=success");
  } catch (err) {
    console.error("[LINE Auth] เกิดข้อผิดพลาดร้ายแรงใน callback:", err);
    return res.redirect("/?login_error=server_error");
  }
});

/**
 * GET /api/me
 * คืนข้อมูลผู้ใช้ที่ล็อกอินอยู่จาก Session Cookie หรือ 401 หากไม่ได้ล็อกอิน
 */
export async function getMeHandler(req: Request, res: Response) {
  const rawSession = req.signedCookies.fitcoach_session;
  if (!rawSession) {
    return res.status(401).json({ authenticated: false, message: "ไม่ได้เข้าสู่ระบบ" });
  }

  try {
    const sessionUser: SessionUser = JSON.parse(rawSession);
    const userData = await getUserData(sessionUser.userId);

    return res.json({
      authenticated: true,
      user: {
        userId: sessionUser.userId,
        displayName: sessionUser.displayName,
        pictureUrl: sessionUser.pictureUrl || "",
        hasProfile: Boolean(userData?.profile?.name && userData.profile.name.trim().length > 0),
      },
    });
  } catch (err) {
    console.warn("[Auth] Session cookie ไม่ถูกต้อง:", err);
    res.clearCookie("fitcoach_session");
    return res.status(401).json({ authenticated: false, message: "เซสชันไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่" });
  }
}

/**
 * POST /auth/logout
 * ล้าง Session Cookie เพื่อออกจากระบบ
 */
authRouter.post("/logout", (_req: Request, res: Response) => {
  res.clearCookie("fitcoach_session");
  return res.json({ success: true, message: "ออกจากระบบเรียบร้อยแล้ว" });
});

/**
 * Middleware สำหรับตรวจสอบสิทธิ์การเข้าถึง API ที่ต้องล็อกอินก่อนเสมอ
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const rawSession = req.signedCookies.fitcoach_session;
  if (!rawSession) {
    return res.status(401).json({ error: "ต้องเข้าสู่ระบบก่อนใช้งานส่วนนี้ (Unauthorized)" });
  }

  try {
    const sessionUser: SessionUser = JSON.parse(rawSession);
    req.user = sessionUser;
    next();
  } catch (err) {
    return res.status(401).json({ error: "เซสชันไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่" });
  }
}
