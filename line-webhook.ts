// line-webhook.ts - Webhook LINE Bot  
import { Request, Response } from "express";
import crypto from "crypto";
import { getUserData } from "./db";
import { generateCoachResponse } from "./coach-ai";

interface LineEvent {
  type: string;
  replyToken?: string;
  source?: {
    userId?: string;
    type?: string;
  };
  message?: {
    type: string;
    id: string;
    text?: string;
  };
  timestamp?: number;
}

interface LineWebhookBody {
  destination?: string;
  events?: LineEvent[];
}

export function verifyLineSignature(rawBody: Buffer | string, signature: string, channelSecret: string): boolean {
  if (!channelSecret) {
    console.warn("[LINE Webhook] Missing LINE_CHANNEL_SECRET - bypass in Dev/Testing");
    return true;
  }
  if (!signature) return false;
  const expectedSignature = crypto
    .createHmac("SHA256", channelSecret)
    .update(typeof rawBody === "string" ? Buffer.from(rawBody, "utf-8") : rawBody)
    .digest("base64");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

async function replyLineMessage(replyToken: string, text: string, accessToken: string): Promise<boolean> {
  if (!accessToken) {
    console.warn("[LINE Webhook] Missing LINE_CHANNEL_ACCESS_TOKEN");
    return false;
  }
  try {
    const response = await fetch("https://api.line.me/v2/bot/message/reply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        replyToken,
        messages: [
          {
            type: "text",
            text,
          },
        ],
      }),
    });
    if (!response.ok) {
      const errText = await response.text();
      console.error("[LINE Webhook] Reply error:", response.status, errText);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[LINE Webhook] Error calling LINE Reply API:", err);
    return false;
  }
}

export async function lineWebhookHandler(req: Request, res: Response) {
  const channelSecret = process.env.LINE_CHANNEL_SECRET || "";
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN || "";
  const signature = req.get("x-line-signature") || "";

  const rawBody = (req as any).rawBody || JSON.stringify(req.body);
  if (channelSecret && !verifyLineSignature(rawBody, signature, channelSecret)) {
    console.error("[LINE Webhook] Signature verification failed!");
    return res.status(401).send("Invalid Signature");
  }

  const body = req.body as LineWebhookBody;
  const events = body?.events || [];
  console.log(`[LINE Webhook] Received ${events.length} event(s)`);

  res.status(200).send("OK");

  for (const event of events) {
    try {
      if (event.type === "message" && event.message?.type === "text" && event.replyToken) {
        const userId = event.source?.userId;
        const userText = event.message.text || "";
        if (!userId) {
          console.warn("[LINE Webhook] Missing userId in event.source");
          continue;
        }
        console.log(`[LINE Webhook] Message from userId=${userId}: "${userText}"`);

        const userData = await getUserData(userId);
        const hasProfile = Boolean(userData?.profile?.name && userData.profile.name.trim().length > 0);
        let replyText = "";
        if (!hasProfile) {
          const host = req.get("host") || "localhost:3000";
          const protocol = req.protocol === "https" || req.get("x-forwarded-proto") === "https" ? "https" : "http";
          const appUrl = (process.env.APP_URL || `${protocol}://${host}`).replace(/\/$/, "");
          replyText = `สวัสดีครับ ยินดีต้อนรับสู่ FitCoach AI!\n\nกรุณาเข้าสู่ระบบและประเมินร่างกายเพื่อสร้างแผนที่เหมาะสมกับคุณ:\n${appUrl}\n\nโค้ชพร้อมดูแลตลอด 24 ชม. ครับ!`;
        } else {
          replyText = await generateCoachResponse(userText, {
            userProfile: userData?.profile,
            workoutPlan: userData?.workout,
            fitnessStatus: userData?.status,
            nutritionData: userData?.nutrition,
            recoveryData: userData?.recovery,
          });
        }
        await replyLineMessage(event.replyToken, replyText, channelAccessToken);
      }
    } catch (err) {
      console.error("[LINE Webhook] Error processing event:", err);
    }
  }
}
