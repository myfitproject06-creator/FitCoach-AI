import crypto from "crypto";
import type { Express, Request, Response } from "express";

const LINE_REPLY_URL = "https://api.line.me/v2/bot/message/reply";

function verifySignature(rawBody: Buffer | undefined, signature: string | undefined, secret: string) {
  if (!rawBody || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function replyToLine(token: string, replyToken: string, text: string, quickActions?: string[]) {
  const message: any = {
    type: "text",
    // LINE ไม่แสดง markdown จึงตัด ** ออก และจำกัด 5000 ตัวอักษร
    text: text.replace(/\*\*/g, "").slice(0, 5000),
  };
  if (quickActions?.length) {
    message.quickReply = {
      items: quickActions.slice(0, 13).map((label) => ({
        type: "action",
        action: { type: "message", label: label.slice(0, 20), text: label },
      })),
    };
  }
  const r = await fetch(LINE_REPLY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ replyToken, messages: [message] }),
  });
  if (!r.ok) console.error("LINE reply failed:", r.status, await r.text());
}

export function registerLineWebhook(app: Express, port: number) {
  app.post("/webhook", async (req: Request, res: Response) => {
    const secret = process.env.LINE_CHANNEL_SECRET;
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;

    if (!secret || !token) {
      console.error("Missing LINE_CHANNEL_SECRET or LINE_CHANNEL_ACCESS_TOKEN");
      return res.sendStatus(500);
    }
    if (!verifySignature((req as any).rawBody, req.get("x-line-signature"), secret)) {
      console.error("Invalid LINE signature");
      return res.sendStatus(401);
    }

    // ตอบ 200 ทันที (ปุ่ม Verify ใน LINE Console ส่ง events ว่างมา ต้องได้ 200)
    res.sendStatus(200);

    for (const event of req.body.events ?? []) {
      if (event.type === "follow") {
        await replyToLine(token, event.replyToken, "สวัสดีครับ! ผมคือ FitCoach AI โค้ชส่วนตัวของคุณ 💪 พิมพ์ได้เลย เช่น \"เริ่ม Workout\" หรือ \"กินข้าวมันไก่\"", ["เริ่ม Workout", "บันทึกอาหาร", "ดูแคลอรีวันนี้"]);
        continue;
      }
      if (event.type !== "message" || event.message?.type !== "text") continue;

      try {
        const r = await fetch(`http://127.0.0.1:${port}/api/ai/coach-chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: event.message.text }),
        });
        const data: any = await r.json();
        await replyToLine(token, event.replyToken, data.reply ?? "ขออภัยครับ ระบบขัดข้องชั่วคราว", data.quickActions);
      } catch (err) {
        console.error("Webhook handler error:", err);
        await replyToLine(token, event.replyToken, "ขออภัยครับ ระบบขัดข้องชั่วคราว ลองใหม่อีกครั้งนะครับ");
      }
    }
  });
}
