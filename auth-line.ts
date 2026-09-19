// auth-line.ts - LINE Login OAuth 2.1 & Session Authentication  
import { Router, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { updateLineProfile, getUserData } from "./db";

export interface SessionUser {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  loggedInAt: number;
}

export interface AuthenticatedRequest extends Request {
  user?: SessionUser;
}

export const authRouter = Router();

function getAuthConfig(req: Request) {
  const channelId = process.env.LINE_LOGIN_CHANNEL_ID || "";
  const channelSecret = process.env.LINE_LOGIN_CHANNEL_SECRET || "";
  const sessionSecret = process.env.SESSION_SECRET || "fitcoach_default_session_secret_change_in_production";
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

authRouter.get("/line", (req: Request, res: Response) => {
  const config = getAuthConfig(req);
  if (!config.channelId) {
    console.error("[LINE Auth] Missing LINE_LOGIN_CHANNEL_ID in Environment Variables");
    return res.status(500).send(`
      <div style="font-family: sans-serif; text-align: center; padding: 40px;">
        <h2 style="color: #e11d48;">Missing LINE_LOGIN_CHANNEL_ID</h2>
        <p>Please configure <code>LINE_LOGIN_CHANNEL_ID</code> and <code>LINE_LOGIN_CHANNEL_SECRET</code> in Environment Variables</p>
        <a href="/" style="display: inline-block; margin-top: 16px; padding: 8px 16px; background: #06C755; color: white; border-radius: 8px; text-decoration: none;">Back</a>
      </div>
    `);
  }

  const state = crypto.randomBytes(24).toString("hex");
  res.cookie("line_oauth_state", state, {
    httpOnly: true,
    secure: req.secure || process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 15 * 60 * 1000,
    signed: true,
  });

  const authUrl = new URL("https://access.line.me/oauth2/v2.1/authorize");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", config.channelId);
  authUrl.searchParams.set("redirect_uri", config.redirectUri);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("scope", "profile openid");
  authUrl.searchParams.set("bot_prompt", "normal");

  console.log(`[LINE Auth] Redirecting to LINE Login: redirect_uri=${config.redirectUri}`);
  return res.redirect(authUrl.toString());
});

authRouter.get("/line/callback", async (req: Request, res: Response) => {
  const config = getAuthConfig(req);
  const { code, state, error, error_description } = req.query;

  if (error) {
    console.warn("[LINE Auth] Error:", error, error_description);
    return res.redirect(`/?login_error=${encodeURIComponent(String(error_description || error))}`);
  }

  const storedState = req.signedCookies.line_oauth_state;
  res.clearCookie("line_oauth_state");

  if (!state || !storedState || state !== storedState) {
    console.error("[LINE Auth] State mismatch: state=", state, "stored=", storedState);
    return res.redirect("/?login_error=invalid_state");
  }

  if (!code || typeof code !== "string") {
    console.error("[LINE Auth] Missing authorization code");
    return res.redirect("/?login_error=missing_code");
  }

  try {
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
      console.error("[LINE Auth] Token error:", tokenResponse.status, errBody);
      return res.redirect(`/?login_error=token_exchange_failed`);
    }

    const tokenData = (await tokenResponse.json()) as {
      access_token: string;
      id_token?: string;
      token_type: string;
      expires_in: number;
    };

    const profileResponse = await fetch("https://api.line.me/v2/profile", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!profileResponse.ok) {
      const errBody = await profileResponse.text();
      console.error("[LINE Auth] Profile fetch error:", errBody);
      return res.redirect("/?login_error=profile_fetch_failed");
    }

    const profile = (await profileResponse.json()) as {
      userId: string;
      displayName: string;
      pictureUrl?: string;
      statusMessage?: string;
    };

    console.log(`[LINE Auth] Authenticated: ${profile.displayName} (${profile.userId})`);

    await updateLineProfile(profile.userId, {
      userId: profile.userId,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl,
      statusMessage: profile.statusMessage,
    });

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
      maxAge: 30 * 24 * 60 * 60 * 1000,
      signed: true,
    });

    return res.redirect("/?login=success");
  } catch (err) {
    console.error("[LINE Auth] Callback exception:", err);
    return res.redirect("/?login_error=server_error");
  }
});

export async function getMeHandler(req: Request, res: Response) {
  const rawSession = req.signedCookies.fitcoach_session;
  if (!rawSession) {
    return res.status(401).json({ authenticated: false, message: "Unauthorized" });
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
    console.warn("[Auth] Session cookie parse error:", err);
    res.clearCookie("fitcoach_session");
    return res.status(401).json({ authenticated: false, message: "Invalid session" });
  }
}

authRouter.post("/logout", (_req: Request, res: Response) => {
  res.clearCookie("fitcoach_session");
  return res.json({ success: true, message: "Logged out" });
});

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const rawSession = req.signedCookies.fitcoach_session;
  if (!rawSession) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const sessionUser: SessionUser = JSON.parse(rawSession);
    req.user = sessionUser;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid session" });
  }
}
