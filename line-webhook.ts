// line-webhook.ts - จัดการ Webhook สำหรับ LINE Bot โค้ชส่วนตัว
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

/**
 * ตรวจสอบความถูกต้องของ LINE Webhook Signature ด้วย LINE_CHANNEL_SECRET
 */
export function verifyLineSignature(rawBody: Buffer | string, signature: string, channelSecret: string): boolean {
  if (!channelSecret) {
    console.warn("[LINE Webhook] ไม่ได้ตั้งค่า LINE_CHANNEL_SECRET - ข้ามการตรวจลายเซ็นสำหรับ Dev/Testing");
    return true;
  }
  if (!signature) return false;

  const expectedSignature = crypto
    .createHmac("SHA256", channelSecret)
    .update(typeof rawBody === "string" ? Buffer.from(rawBody, "utf-8") : rawBody)
    .digest("base64");

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

/**
 * ส่งข้อความตอบกลับผู้ใช้ผ่าน LINE Messaging API
 */
async function replyLineMessage(replyToken: string, text: string, accessToken: string): Promise<boolean> {
  if (!accessToken) {
    console.warn("[LINE Webhook] ไม่พบ LINE_CHANNEL_ACCESS_TOKEN - ไม่สามารถส่งข้อความกลับทาง LINE ได้");
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
      console.error("[LINE Webhook] ส่งข้อความตอบกลับล้มเหลว:", response.status, errText);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[LINE Webhook] เกิดข้อผิดพลาดในการเรียก LINE Reply API:", err);
    return false;
  }
}

/**
 * Handler สำหรับ Route /webhook (POST)
 */
export async function lineWebhookHandler(req: Request, res: Response) {
  const channelSecret = process.env.LINE_CHANNEL_SECRET || "";
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN || "";
  const signature = req.get("x-line-signature") || "";

  // 1. ตรวจสอบ Signature (ใช้ rawBody ที่บันทึกไว้ใน middleware)
  const rawBody = (req as any).rawBody || JSON.stringify(req.body);
  if (channelSecret && !verifyLineSignature(rawBody, signature, channelSecret)) {
    console.error("[LINE Webhook] Signature verification failed!");
    return res.status(401).send("Invalid Signature");
  }

  const body = req.body as LineWebhookBody;
  const events = body?.events || [];

  console.log(`[LINE Webhook] ได้รับ ${events.length} event(s)`);

  // ตอบกลับ 200 ทันทีตามข้อกำหนดของ LINE Webhook
  res.status(200).send("OK");

  // 2. ดำเนินการประมวลผล event แบบ Asynchronous
  for (const event of events) {
    try {
      if (event.type === "message" && event.message?.type === "text" && event.replyToken) {
        const userId = event.source?.userId;
        const userText = event.message.text || "";

        if (!userId) {
          console.warn("[LINE Webhook] ไม่พบ userId ใน event.source");
          continue;
        }

        console.log(`[LINE Webhook] ข้อความจาก userId=${userId}: "${userText}"`);

        // ดึงข้อมูลผู้ใช้จากฐานข้อมูลตาม LINE userId
        const userData = await getUserData(userId);
        const hasProfile = Boolean(userData?.profile?.name && userData.profile.name.trim().length > 0);

        let replyText = "";

        if (!hasProfile) {
          // หากยังไม่มีข้อมูลฟิตเนส ให้บอทตอบชวนเปิดแอปเพื่อตั้งค่าโปรไฟล์
          const host = req.get("host") || "localhost:3000";
          const protocol = req.protocol === "https" || req.get("x-forwarded-proto") === "https" ? "https" : "http";
          const appUrl = (process.env.APP_URL || `${protocol}://${host}`).replace(/\/$/, "");

          replyText = `สวัสดีครับ! โค้ช FitCoach AI ยินดีต้อนรับครับ 🏋️‍♂️✨\n\nดูเหมือนว่าคุณยังไม่ได้ตั้งค่าโปรไฟล์และเป้าหมายสุขภาพส่วนบุคคล\n\n👉 กรุณาเปิดลิงก์ด้านล่างเพื่อทำแบบประเมินและรับโปรแกรมฝึกเฉพาะตัวคุณทันที:\n${appUrl}\n\nเมื่อตั้งค่าเสร็จแล้ว สามารถกลับมาปรึกษาโค้ชเรื่องอาหารและการออกกำลังกายผ่าน LINE แชทนี้ได้ตลอด 24 ชม. เลยครับ! 🎯`;
        } else {
          // หากมีโปรไฟล์แล้ว ส่งข้อมูลให้ Coach AI วิเคราะห์และตอบอย่างแม่นยำ
          replyText = await generateCoachResponse(userText, {
            userProfile: userData?.profile,
            workoutPlan: userData?.workout,
            fitnessStatus: userData?.status,
            nutritionData: userData?.nutrition,
            recoveryData: userData?.recovery,
          });
        }

        // ส่งข้อความกลับหาผู้ใช้ใน LINE
        await replyLineMessage(event.replyToken, replyText, channelAccessToken);
      }
    } catch (err) {
      console.error("[LINE Webhook] เกิดข้อผิดพลาดในการประมวลผล event:", err);
    }
  }
}
