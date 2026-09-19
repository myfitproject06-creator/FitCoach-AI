import crypto from "crypto";
import type { Express, Request, Response } from "express";

const LINE_REPLY_URL = "https://api.line.me/v2/bot/message/reply";
const LINE_PUSH_URL = "https://api.line.me/v2/bot/message/push";

function verifySignature(rawBody: Buffer | undefined, signature: string | undefined, secret: string) {
  if (!rawBody || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function buildQuickReply(quickActions?: string[]) {
  if (!quickActions?.length) return undefined;
  return {
    items: quickActions.slice(0, 13).map((label) => ({
      type: "action",
      action: {
        type: "message",
        label: label.slice(0, 20),
        text: label,
      },
    })),
  };
}

/**
 * Builds an authentic, green-themed LINE Flex Message Bubble for workout plans
 * Compatible with LINE Flex Message Simulator and Messaging API specs.
 */
export function buildWorkoutFlexBubble(card: any, appUrl: string) {
  if (!card) return null;

  const plan = card.workoutPlan || {};
  const rawTitle = card.title || plan.titleTh || plan.title || "โปรแกรมการฝึก FitCoach";
  const title = String(rawTitle).replace(/\*\*/g, "").slice(0, 40);

  const durationText = String(
    card.duration || (plan.durationMinutes ? `${plan.durationMinutes} นาที` : "20-45 นาที")
  ).replace(/\*\*/g, "").slice(0, 30);

  const detailsText = String(
    card.details || plan.coachNote || "โปรแกรมออกกำลังกายปรับแต่งโดย FitCoach AI"
  ).replace(/\*\*/g, "").slice(0, 100);

  const exercises = Array.isArray(plan.exercises) ? plan.exercises.slice(0, 6) : [];

  // Construct exercise list rows
  const exerciseComponents: any[] = [];

  if (exercises.length > 0) {
    exerciseComponents.push({
      type: "text",
      text: "ท่าฝึกประจำโปรแกรม:",
      size: "xs",
      color: "#64748B",
      weight: "bold",
      margin: "md",
    });

    exercises.forEach((ex: any, idx: number) => {
      const exName = String(ex.nameTh || ex.name || `ท่าที่ ${idx + 1}`).replace(/\*\*/g, "");
      const setsReps = `${ex.sets || 3} เซ็ต × ${ex.reps || "10-12 ครั้ง"}${
        ex.suggestedWeight ? ` • ${ex.suggestedWeight}` : ""
      }`;

      exerciseComponents.push({
        type: "box",
        layout: "horizontal",
        spacing: "sm",
        margin: "sm",
        alignItems: "center",
        contents: [
          {
            type: "box",
            layout: "vertical",
            width: "22px",
            contents: [
              {
                type: "text",
                text: `${idx + 1}.`,
                size: "xs",
                color: "#06C755",
                weight: "bold",
              },
            ],
          },
          {
            type: "box",
            layout: "vertical",
            flex: 1,
            contents: [
              {
                type: "text",
                text: exName,
                size: "sm",
                weight: "bold",
                color: "#1E293B",
                wrap: true,
              },
              {
                type: "text",
                text: setsReps,
                size: "xs",
                color: "#64748B",
              },
            ],
          },
        ],
      });
    });
  }

  // Format App URL for the primary button
  let safeAppUrl = (appUrl || "https://fitcoach-ai.onrender.com").trim();
  if (!safeAppUrl.startsWith("http://") && !safeAppUrl.startsWith("https://")) {
    safeAppUrl = `https://${safeAppUrl}`;
  }

  return {
    type: "bubble",
    size: "mega",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#06C755",
      paddingAll: "18px",
      contents: [
        {
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "text",
              text: "FITCOACH WORKOUT",
              color: "#ECFDF5",
              size: "xxs",
              weight: "bold",
              flex: 1,
            },
            {
              type: "text",
              text: durationText,
              color: "#FFFFFF",
              size: "xs",
              align: "end",
              weight: "bold",
            },
          ],
        },
        {
          type: "text",
          text: title,
          color: "#FFFFFF",
          weight: "bold",
          size: "lg",
          wrap: true,
          margin: "sm",
        },
      ],
    },
    body: {
      type: "box",
      layout: "vertical",
      paddingAll: "16px",
      contents: [
        {
          type: "text",
          text: detailsText,
          size: "xs",
          color: "#475569",
          wrap: true,
        },
        ...exerciseComponents,
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      paddingAll: "14px",
      contents: [
        {
          type: "button",
          style: "primary",
          color: "#06C755",
          height: "sm",
          action: {
            type: "uri",
            label: "เปิดใน FitCoach App",
            uri: safeAppUrl,
          },
        },
        {
          type: "button",
          style: "secondary",
          height: "sm",
          action: {
            type: "message",
            label: "เริ่มซ้อมเลย 💪",
            text: "เริ่มซ้อมโปรแกรมนี้เลยครับ",
          },
        },
      ],
    },
  };
}

/**
 * Maps postback data (e.g. action=workout_today) to a user query
 */
export function mapPostbackToText(data: string): string {
  if (!data) return "ขอตารางซ้อมวันนี้หน่อยครับ";

  // Try parsing JSON postback
  if (data.startsWith("{") && data.endsWith("}")) {
    try {
      const parsed = JSON.parse(data);
      if (parsed.text) return parsed.text;
      if (parsed.action) return mapActionKeyToText(parsed.action);
    } catch {}
  }

  // Parse URL search params e.g. action=workout_today
  if (data.includes("action=")) {
    try {
      const params = new URLSearchParams(data);
      const action = params.get("action");
      if (action) return mapActionKeyToText(action);
    } catch {}
  }

  return mapActionKeyToText(data);
}

function mapActionKeyToText(action: string): string {
  switch (action) {
    case "workout_today":
    case "today_workout":
      return "ขอตารางซ้อมวันนี้หน่อยครับ อยากเริ่มซ้อมแล้ว";
    case "log_food":
      return "บันทึกอาหารวันนี้ให้หน่อยครับ";
    case "plan_3months":
      return "จัดแผน 3 เดือนหุ่น Tom Holland ให้หน่อยครับ อยากรู้ตารางซ้อมและอาหาร";
    case "discipline_check":
    case "check_in":
      return "เช็คสถานะวินัยและการนัดหมายซ้อมของวันนี้หน่อยครับ";
    case "adapt_plan":
      return "วันนี้รู้สึกเหนื่อยมาก ช่วยปรับแผนการฝึกให้เบาลงหน่อยครับ";
    case "weekly_report":
      return "สรุปผลการออกกำลังกายสัปดาห์นี้";
    default:
      return action;
  }
}

/**
 * Sends response to LINE with automatic Flex Message handling and plain text fallback
 */
async function replyToLine(
  token: string,
  replyToken: string,
  text: string,
  card: any,
  quickActions?: string[],
  userId?: string
) {
  // Strip markdown ** and limit text length
  const cleanText = (text || "").replace(/\*\*/g, "").slice(0, 5000);
  const textMessage: any = {
    type: "text",
    text: cleanText || "ผมพร้อมดูแลการออกกำลังกายของคุณครับ!",
  };

  const appUrl = process.env.APP_URL || "https://fitcoach-ai.onrender.com";
  let flexBubble: any = null;

  if (card) {
    try {
      flexBubble = buildWorkoutFlexBubble(card, appUrl);
    } catch (err) {
      console.error("Error constructing workout Flex Bubble:", err);
    }
  }

  // Primary attempt: text + flex card if available
  const messagesToSend: any[] = [];

  if (flexBubble) {
    // If we have a flex card, attach text first, then flex card
    if (cleanText) {
      messagesToSend.push(textMessage);
    }

    const flexTitle = String(card.title || card.workoutPlan?.titleTh || "แผนการฝึก FitCoach")
      .replace(/\*\*/g, "")
      .slice(0, 30);

    const flexMsg: any = {
      type: "flex",
      altText: `🏋️ ${flexTitle}`,
      contents: flexBubble,
    };

    // Attach quick reply to the last message
    if (quickActions?.length) {
      flexMsg.quickReply = buildQuickReply(quickActions);
    }

    messagesToSend.push(flexMsg);
  } else {
    // No flex card, send text with quick replies
    if (quickActions?.length) {
      textMessage.quickReply = buildQuickReply(quickActions);
    }
    messagesToSend.push(textMessage);
  }

  try {
    const res = await fetch(LINE_REPLY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ replyToken, messages: messagesToSend }),
    });

    if (res.ok) {
      return;
    }

    const errBody = await res.text();
    console.error("LINE reply API error status:", res.status, errBody);

    // Fallback requirement: If Flex Message failed, fallback to plain text only
    if (flexBubble) {
      console.warn("Attempting text-only fallback reply due to Flex Message error...");
      if (quickActions?.length) {
        textMessage.quickReply = buildQuickReply(quickActions);
      }

      // If push to user is possible (since replyToken might be consumed on bad requests)
      if (userId) {
        await fetch(LINE_PUSH_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ to: userId, messages: [textMessage] }),
        });
      }
    }
  } catch (err) {
    console.error("Failed to send LINE reply:", err);
  }
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

    // Acknowledge LINE platform immediately with 200 OK
    res.sendStatus(200);

    for (const event of req.body.events ?? []) {
      const replyToken = event.replyToken;
      const userId = event.source?.userId;

      // Handle Follow Event
      if (event.type === "follow") {
        await replyToLine(
          token,
          replyToken,
          "สวัสดีครับ! ผมคือ FitCoach AI โค้ชส่วนตัวของคุณ 💪\n\nสามารถเลือกเมนูด้านล่าง หรือพิมพ์บอกผมได้ทันที เช่น \"ขอตารางซ้อมวันนี้\" หรือ \"กินข้าวมันไก่ไป 1 จาน\" ครับ!",
          null,
          ["เริ่ม Workout", "บันทึกอาหาร", "ดูแคลอรีวันนี้"],
          userId
        );
        continue;
      }

      // Determine user input from message or postback event
      let userText = "";

      if (event.type === "message" && event.message?.type === "text") {
        userText = event.message.text;
      } else if (event.type === "postback") {
        const postbackData = event.postback?.data || "";
        userText = mapPostbackToText(postbackData);
        console.log(`Received LINE postback [${postbackData}] -> resolved to prompt: "${userText}"`);
      } else {
        continue;
      }

      try {
        const r = await fetch(`http://127.0.0.1:${port}/api/ai/coach-chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userText,
            source: "line",
            lineUserId: userId,
          }),
        });

        const data: any = await r.json();

        await replyToLine(
          token,
          replyToken,
          data.reply ?? "ขออภัยครับ ระบบขัดข้องชั่วคราว",
          data.card ?? null,
          data.quickActions,
          userId
        );
      } catch (err) {
        console.error("Webhook message handling error:", err);
        await replyToLine(
          token,
          replyToken,
          "ขออภัยครับ ระบบขัดข้องชั่วคราว ลองใหม่อีกครั้งนะครับ",
          null,
          ["เริ่ม Workout", "บันทึกอาหาร", "ดูแคลอรีวันนี้"],
          userId
        );
      }
    }
  });
}
