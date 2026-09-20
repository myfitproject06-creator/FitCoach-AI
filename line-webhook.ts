// line-webhook.ts - Phase 5: LINE Coach Actions + Success + Rich Menu
import { Request, Response } from "express";
import crypto from "crypto";
import { getUserData, saveUserData } from "./db";
import type { ChatMessage, CoachActionType, CoachResponse } from "./src/types";
import { generateCoachResponseStructured } from "./coach-ai";
import { executeCoachTool, bangkokToday } from "./coach-plan";
import { snoozeWorkoutReminder, skipTodayWorkout } from "./reminder-engine";
import {
  buildLineReplyMessages,
  buildLineFlexMessage,
  buildWorkoutSuccessMessages,
  type LineMessagePayload,
} from "./line-flex";

interface LineEvent {
  type: string;
  replyToken?: string;
  source?: { userId?: string; type?: string };
  message?: { type: string; id: string; text?: string };
  postback?: { data?: string; params?: Record<string, string> };
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
  if (signature.length !== expectedSignature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

async function replyLineMessages(replyToken: string, messages: LineMessagePayload[], accessToken: string): Promise<boolean> {
  if (!accessToken) {
    console.warn("[LINE Webhook] Missing LINE_CHANNEL_ACCESS_TOKEN");
    return false;
  }
  try {
    const response = await fetch("https://api.line.me/v2/bot/message/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ replyToken, messages: messages.slice(0, 5) }),
    });
    if (!response.ok) {
      console.error("[LINE Webhook] Reply error:", response.status, await response.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("[LINE Webhook] Error calling LINE Reply API:", err);
    return false;
  }
}

function parseFitCoachPostback(data: string):
  | { kind: "coach"; actionType: CoachActionType; id?: string }
  | { kind: "menu"; action: string }
  | null {
  const params = new URLSearchParams(data);
  const fitcoachAction = params.get("fitcoach_action");
  if (fitcoachAction) {
    const allowed: CoachActionType[] = [
      "start_workout", "snooze", "cannot_do", "view_plan", "log_food",
      "apply_program", "clear_penalty", "confirm", "edit",
    ];
    if (!allowed.includes(fitcoachAction as CoachActionType)) return null;
    return { kind: "coach", actionType: fitcoachAction as CoachActionType, id: params.get("id") || undefined };
  }

  const menuAction = params.get("action");
  if (menuAction) return { kind: "menu", action: menuAction };
  return null;
}

function actionToCoachMessage(actionType: CoachActionType): string {
  switch (actionType) {
    case "start_workout": return "ผู้ใช้กดเริ่มออกกำลังกายครับ ช่วยเปิดโปรแกรมวันนี้และบอกขั้นตอนถัดไปให้ด้วย";
    case "snooze": return "ผู้ใช้ขอเลื่อนการออกกำลังกายออกไป ช่วยยืนยันการเลื่อนและแนะนำเวลาถัดไปให้ด้วย";
    case "cannot_do": return "วันนี้ผู้ใช้ทำโปรแกรมเดิมไม่ได้ ช่วยปรับโปรแกรมให้เหมาะกับสภาพร่างกายหรือเวลาที่มีตอนนี้";
    case "view_plan": return "ผู้ใช้ต้องการดูรายละเอียดโปรแกรมวันนี้ ช่วยสรุปโปรแกรมให้กระชับและอ่านง่าย";
    case "log_food": return "ผู้ใช้ต้องการบันทึกอาหาร ช่วยถามข้อมูลอาหารที่จำเป็นเพื่อบันทึกมื้ออาหาร";
    case "apply_program": return "ผู้ใช้ยืนยันต้องการใช้โปรแกรมนี้ ช่วยยืนยันการเลือกโปรแกรมและบอกขั้นตอนถัดไป";
    case "clear_penalty": return "ผู้ใช้ต้องการจัดการภารกิจที่ค้างอยู่ ช่วยสรุปสิ่งที่ต้องทำต่อให้ชัดเจน";
    case "confirm": return "ผู้ใช้ยืนยันการดำเนินการล่าสุด ช่วยยืนยันสิ่งที่ระบบควรทำต่อ";
    case "edit": return "ผู้ใช้ต้องการแก้ไขรายการล่าสุด ช่วยถามข้อมูลที่ต้องแก้ไข";
    default: return "ผู้ใช้กดปุ่มจาก FitCoach ช่วยดำเนินการต่ออย่างเหมาะสม";
  }
}

function menuActionToCoachMessage(action: string): string {
  switch (action) {
    case "workout_today": return "ขอโปรแกรมฝึกวันนี้จากแผนจริงของฉัน พร้อมรายละเอียดท่าฝึกด้วยครับ";
    case "log_food": return "ช่วยบันทึกอาหารวันนี้ให้หน่อยครับ เริ่มจากถามข้อมูลที่จำเป็นได้เลย";
    case "plan_3months": return "ช่วยสรุปแผนการฝึกระยะยาวของฉันจากข้อมูลจริงในระบบให้หน่อยครับ";
    case "discipline_check": return "ช่วยเช็คสถานะวินัย ตารางซ้อม และเวลานัดซ้อมของฉันตอนนี้ครับ";
    case "adaptive_workout": return "วันนี้ผมรู้สึกเหนื่อยมาก ช่วยปรับแผนการฝึกให้เบาลงตามข้อมูลจริงของผมครับ";
    case "weekly_report": return "ช่วยสรุปผลการออกกำลังกายของฉันในสัปดาห์นี้จากข้อมูลจริงครับ";
    default: return "ช่วยดูสถานะการฝึกของฉันตอนนี้และแนะนำสิ่งที่ควรทำต่อครับ";
  }
}

function fallbackActionResponse(actionType: CoachActionType): CoachResponse {
  const messages: Record<CoachActionType, string> = {
    start_workout: "เริ่มได้เลยครับ 💪 เปิดโปรแกรมวันนี้แล้วทำตามลำดับทีละท่าได้เลย",
    snooze: "รับทราบครับ ผมจะถือว่าคุณขอเลื่อนการฝึกไว้ก่อน",
    cannot_do: "ได้ครับ เดี๋ยวโค้ชช่วยปรับโปรแกรมให้เหมาะกับวันนี้",
    view_plan: "ได้ครับ เดี๋ยวผมสรุปโปรแกรมวันนี้ให้อีกครั้ง",
    log_food: "ได้ครับ บอกชื่ออาหารและปริมาณคร่าว ๆ ได้เลย เดี๋ยวผมช่วยบันทึกให้",
    apply_program: "ยืนยันโปรแกรมแล้วครับ",
    clear_penalty: "รับทราบครับ มาดูภารกิจที่ต้องจัดการต่อกัน",
    confirm: "ยืนยันเรียบร้อยครับ",
    edit: "ได้ครับ บอกส่วนที่ต้องการแก้ไขได้เลย",
  };
  return { message: messages[actionType], type: "chat" };
}

async function handleCompleteWorkout(
  event: LineEvent,
  userId: string,
  channelAccessToken: string,
): Promise<void> {
  if (!event.replyToken) return;

  const userData = await getUserData(userId);
  const date = bangkokToday();
  const day = userData?.coachPlan?.days?.find((d) => d.date === date);
  const workout = userData?.workout;

  const exercises = (day?.exercises || workout?.exercises || []).map((e) => ({
    name: e.nameTh || e.name,
    reps: String(e.reps ?? ""),
    weight: e.suggestedWeight,
  }));

  const result = await executeCoachTool(userId, "log_workout", {
    date,
    completed: true,
    exercises,
  });

  console.log("[Coach Action] complete_workout ->", JSON.stringify(result));

  if (!result.ok) {
    await replyLineMessages(event.replyToken, [{
      type: "text",
      text: `ยังบันทึก Workout ไม่สำเร็จครับ: ${String(result.error || "ไม่ทราบสาเหตุ")} `,
    }], channelAccessToken);
    return;
  }

  const title = day?.title || workout?.titleTh || workout?.title || "Workout วันนี้";
  const durationMinutes = day?.durationMinutes || workout?.durationMinutes;
  const streakDays = userData?.status?.streakDays ?? userData?.status?.momentumDays;

  const successMessages = buildWorkoutSuccessMessages({
    title,
    durationMinutes,
    completedExercises: exercises.length || undefined,
    streakDays,
  });

  const previous: ChatMessage[] = userData?.messages || [];
  const now = Date.now();
  const displayText = "กดเสร็จแล้ว — บันทึก Workout วันนี้";
  const updatedMessages: ChatMessage[] = [
    ...previous,
    { id: `u-${now}`, sender: "user" as const, text: displayText, timestamp: new Date(now).toISOString() },
    { id: `c-${now}`, sender: "coach" as const, text: "บันทึก Workout สำเร็จแล้วครับ!", timestamp: new Date().toISOString() },
  ].slice(-40);
  await saveUserData(userId, { messages: updatedMessages });

  await replyLineMessages(event.replyToken, successMessages, channelAccessToken);
}

async function handleReminderStart(event: LineEvent, userId: string, channelAccessToken: string): Promise<void> {
  if (!event.replyToken) return;
  const userData = await getUserData(userId);
  const date = bangkokToday();
  const day = userData?.coachPlan?.days?.find((d) => d.date === date);
  const workout = userData?.workout;

  if (!day && !workout) {
    await replyLineMessages(event.replyToken, [{
      type: "text",
      text: "วันนี้ยังไม่มี Workout ในแผนครับ ถ้าต้องการ ผมช่วยจัดโปรแกรมให้ใหม่ได้เลย 💪",
    }], channelAccessToken);
    return;
  }

  const exercises = (day?.exercises || workout?.exercises || []).map((e: any) => ({
    name: e.name || "Exercise",
    nameTh: e.nameTh,
    sets: Number(e.sets || 3),
    reps: String(e.reps ?? "10"),
    restSeconds: Number(e.restSeconds || 60),
    suggestedWeight: e.suggestedWeight,
    note: e.note || e.notes,
  }));

  const response: CoachResponse = {
    message: "เริ่มได้เลยครับ 💪 ทำตามลำดับทีละท่าได้เลย และกด “เสร็จแล้ว ✓” เมื่อฝึกเสร็จ",
    type: "workout",
    data: {
      title: day?.title || workout?.titleTh || workout?.title || workout?.name || "Workout วันนี้",
      titleTh: day?.title || workout?.titleTh,
      durationMinutes: day?.durationMinutes || workout?.durationMinutes,
      focus: day?.focus || workout?.focusArea,
      exercises,
    },
  };

  await replyLineMessages(event.replyToken, [
    { type: "text", text: response.message },
    buildLineFlexMessage(response),
  ], channelAccessToken);
}

async function handleReminderSnooze(event: LineEvent, userId: string, channelAccessToken: string): Promise<void> {
  if (!event.replyToken) return;
  const result = await snoozeWorkoutReminder(userId, 30);
  await replyLineMessages(event.replyToken, [{
    type: "text",
    text: result.ok
      ? "⏰ ได้ครับ เลื่อนการเตือนไป 30 นาทีแล้วครับ เดี๋ยวโค้ชเตือนอีกครั้ง 💪"
      : `ยังเลื่อนการเตือนไม่ได้ครับ: ${result.error || "ไม่ทราบสาเหตุ"}`,
  }], channelAccessToken);
}

async function handleReminderCannotDo(event: LineEvent, userId: string, channelAccessToken: string): Promise<void> {
  if (!event.replyToken) return;
  const result = await skipTodayWorkout(userId);
  await replyLineMessages(event.replyToken, [{
    type: "text",
    text: result.ok
      ? "รับทราบครับ วันนี้ผมบันทึกเป็น “ทำไม่ได้วันนี้” ไว้แล้วครับ 📝\n\nถ้าต้องการ ผมสามารถช่วยปรับแผนวันถัดไปให้เหมาะกับคุณได้ครับ"
      : `ยังอัปเดตแผนไม่ได้ครับ: ${result.error || "ไม่ทราบสาเหตุ"}`,
  }], channelAccessToken);
}

async function handlePostbackAction(event: LineEvent, userId: string, channelAccessToken: string): Promise<void> {
  if (!event.replyToken || !event.postback?.data) return;
  const parsed = parseFitCoachPostback(event.postback.data);
  if (!parsed) return;

  if (parsed.kind === "coach" && parsed.id === "complete_workout") {
    await handleCompleteWorkout(event, userId, channelAccessToken);
    return;
  }

  if (parsed.kind === "coach" && parsed.id === "reminder_start") {
    await handleReminderStart(event, userId, channelAccessToken);
    return;
  }

  if (parsed.kind === "coach" && parsed.id === "reminder_snooze") {
    await handleReminderSnooze(event, userId, channelAccessToken);
    return;
  }

  if (parsed.kind === "coach" && parsed.id === "reminder_cannot_do") {
    await handleReminderCannotDo(event, userId, channelAccessToken);
    return;
  }

  const userData = await getUserData(userId);
  const previous: ChatMessage[] = userData?.messages || [];
  let response: CoachResponse;

  try {
    const prompt = parsed.kind === "coach"
      ? actionToCoachMessage(parsed.actionType)
      : menuActionToCoachMessage(parsed.action);

    response = await generateCoachResponseStructured(
      prompt,
      {
        userProfile: userData?.profile,
        workoutPlan: userData?.workout,
        fitnessStatus: userData?.status,
        nutritionData: userData?.nutrition,
        recoveryData: userData?.recovery,
        coachPlan: userData?.coachPlan,
        workoutLogs: userData?.workoutLogs,
        coachProfile: userData?.coachProfile,
      },
      previous.slice(-20).map((m) => ({ sender: m.sender, text: m.text })),
      userId,
    );
  } catch (err) {
    console.error("[LINE Webhook] Postback AI error:", err);
    response = parsed.kind === "coach" ? fallbackActionResponse(parsed.actionType) : {
      message: "รับทราบครับ เดี๋ยวโค้ชช่วยดูข้อมูลให้ครับ 💪",
      type: "chat",
    };
  }

  const now = Date.now();
  const displayText = parsed.kind === "coach"
    ? `${parsed.actionType}${parsed.id ? `:${parsed.id}` : ""}`
    : `เมนู:${parsed.action}`;

  const updatedMessages: ChatMessage[] = [
    ...previous,
    { id: `u-${now}`, sender: "user" as const, text: displayText, timestamp: new Date(now).toISOString() },
    { id: `c-${now}`, sender: "coach" as const, text: response.message, timestamp: new Date().toISOString(), coachResponse: response },
  ].slice(-40);

  await saveUserData(userId, { messages: updatedMessages });
  await replyLineMessages(event.replyToken, buildLineReplyMessages(response), channelAccessToken);
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
      const userId = event.source?.userId;
      if (!userId) {
        console.warn("[LINE Webhook] Missing userId in event.source");
        continue;
      }

      if (event.type === "postback" && event.replyToken) {
        await handlePostbackAction(event, userId, channelAccessToken);
        continue;
      }

      if (event.type !== "message" || event.message?.type !== "text" || !event.replyToken) continue;

      const userText = event.message.text || "";
      console.log(`[LINE Webhook] Message from userId=${userId}: "${userText}"`);
      const userData = await getUserData(userId);
      const hasProfile = Boolean(userData?.profile?.name && userData.profile.name.trim().length > 0);

      if (!hasProfile) {
        const host = req.get("host") || "localhost:3000";
        const protocol = req.protocol === "https" || req.get("x-forwarded-proto") === "https" ? "https" : "http";
        const appUrl = (process.env.APP_URL || `${protocol}://${host}`).replace(/\/$/, "");
        await replyLineMessages(event.replyToken, [{
          type: "text",
          text: `สวัสดีครับ ยินดีต้อนรับสู่ FitCoach AI!\n\nกรุณาเข้าสู่ระบบและประเมินร่างกายเพื่อสร้างแผนที่เหมาะสมกับคุณ:\n${appUrl}\n\nโค้ชพร้อมดูแลตลอด 24 ชม. ครับ!`,
        }], channelAccessToken);
        continue;
      }

      const previous: ChatMessage[] = userData?.messages || [];
      const response = await generateCoachResponseStructured(
        userText,
        {
          userProfile: userData?.profile,
          workoutPlan: userData?.workout,
          fitnessStatus: userData?.status,
          nutritionData: userData?.nutrition,
          recoveryData: userData?.recovery,
          coachPlan: userData?.coachPlan,
          workoutLogs: userData?.workoutLogs,
          coachProfile: userData?.coachProfile,
        },
        previous.slice(-20).map((m) => ({ sender: m.sender, text: m.text })),
        userId,
      );

      const now = Date.now();
      const updatedMessages: ChatMessage[] = [
        ...previous,
        { id: `u-${now}`, sender: "user" as const, text: userText, timestamp: new Date(now).toISOString() },
        { id: `c-${now}`, sender: "coach" as const, text: response.message, timestamp: new Date().toISOString(), coachResponse: response },
      ].slice(-40);
      await saveUserData(userId, { messages: updatedMessages });

      await replyLineMessages(event.replyToken, buildLineReplyMessages(response), channelAccessToken);
    } catch (err) {
      console.error("[LINE Webhook] Error processing event:", err);
    }
  }
}
