// reminder-engine.ts - Phase 6: Scheduled LINE workout reminders
// Uses Firebase as source of truth and sends deterministic LINE Push Messages.
import { getUserData, listUserData, saveUserData, type UserData } from "./db";
import { bangkokToday, executeCoachTool } from "./coach-plan";
import {
  buildWorkoutReminderMessages,
  buildMorningBriefingMessages,
  buildNightRecapMessages,
  type LineMessagePayload,
} from "./line-flex";

const DEFAULT_INTERVAL_MS = 60_000;
const DEFAULT_OVERDUE_MINUTES = 60;
const DEFAULT_SNOOZE_MINUTES = 30;

interface ReminderState {
  scheduledTime?: string;
  status?: string;
  strikes?: number;
  penaltyActive?: boolean;
  lastReminderType?: string;
  lastReminderText?: string;
  lastReminderKey?: string;
  lastReminderAt?: string;
  snoozeUntil?: string;
  overdueReminderKey?: string;
  lastMorningBriefingDate?: string;
  lastNightRecapDate?: string;
}

function lineToken(): string {
  return process.env.LINE_CHANNEL_ACCESS_TOKEN || "";
}

function nowBangkokParts(now = new Date()): { date: string; minutes: number; hhmm: string; hour: number; minute: number } {
  const date = now.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
  const time = now.toLocaleTimeString("en-GB", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const [h, m] = time.split(":").map(Number);
  return { date, minutes: h * 60 + m, hhmm: time, hour: h, minute: m };
}

function parseHHMM(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (!Number.isInteger(h) || !Number.isInteger(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

function reminderTimeForUser(user: UserData): string | undefined {
  const a = (user.accountability || {}) as ReminderState;
  const p = user.profile;
  const candidates = [
    a.scheduledTime,
    p?.lineNotificationTime,
    p?.preferredTime,
    user.coachProfile?.preferredWorkoutTime,
  ];
  return candidates.find((v) => parseHHMM(v) !== null);
}

function getState(user: UserData): ReminderState {
  return { ...((user.accountability || {}) as ReminderState) };
}

async function pushLineMessages(userId: string, messages: LineMessagePayload[]): Promise<boolean> {
  const token = lineToken();
  if (!token) {
    console.warn("[Reminder] LINE_CHANNEL_ACCESS_TOKEN is missing");
    return false;
  }
  try {
    const response = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ to: userId, messages: messages.slice(0, 5) }),
    });
    if (!response.ok) {
      console.error("[Reminder] LINE Push error:", response.status, await response.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Reminder] LINE Push exception:", err);
    return false;
  }
}

function workoutForToday(user: UserData) {
  const date = bangkokToday();
  const day = user.coachPlan?.days?.find((d) => d.date === date);
  const legacy = user.workout;
  if (day) return { date, day, title: day.title, focus: day.focus, durationMinutes: day.durationMinutes, exercises: day.exercises };
  if (legacy) {
    return {
      date,
      day: undefined,
      title: legacy.titleTh || legacy.title || legacy.name || "Workout วันนี้",
      focus: legacy.focusArea,
      durationMinutes: legacy.durationMinutes,
      exercises: legacy.exercises.map((e) => ({
        name: e.name,
        nameTh: e.nameTh,
        sets: e.sets,
        reps: String(e.reps),
        restSeconds: e.restSeconds,
        suggestedWeight: e.suggestedWeight,
        note: e.notes,
      })),
    };
  }
  return null;
}

function isAlreadyDone(user: UserData, date: string): boolean {
  const day = user.coachPlan?.days?.find((d) => d.date === date);
  if (day?.status === "done" || day?.status === "skipped") return true;
  return Boolean((user.workoutLogs || []).some((log) => log.date === date && log.completed));
}

async function sendReminder(user: UserData, mode: "on_time" | "overdue"): Promise<boolean> {
  const workout = workoutForToday(user);
  if (!workout || workout.day?.isRestDay || isAlreadyDone(user, workout.date)) return false;

  const state = getState(user);
  const key = `${workout.date}:${mode}`;
  if (mode === "on_time" && state.lastReminderKey === key) return false;
  if (mode === "overdue" && state.overdueReminderKey === key) return false;

  const sent = await pushLineMessages(
    user.userId,
    buildWorkoutReminderMessages({
      title: workout.title,
      focus: workout.focus,
      durationMinutes: workout.durationMinutes,
      exerciseCount: workout.exercises?.length || 0,
      overdue: mode === "overdue",
    }),
  );
  if (!sent) return false;

  const next: ReminderState = {
    ...state,
    scheduledTime: state.scheduledTime || reminderTimeForUser(user),
    status: mode === "overdue" ? "overdue" : "workout_time",
    lastReminderType: mode === "overdue" ? "late_warning" : "workout_time",
    lastReminderText: mode === "overdue" ? "เลยเวลาซ้อมแล้ว" : "ถึงเวลาออกกำลังกายแล้ว",
    lastReminderAt: new Date().toISOString(),
    ...(mode === "on_time" ? { lastReminderKey: key } : { overdueReminderKey: key }),
  };
  await saveUserData(user.userId, { accountability: next as any });
  console.log(`[Reminder] sent ${mode} -> userId=${user.userId} date=${workout.date}`);
  return true;
}

export async function sendMorningBriefing(userId: string): Promise<{ ok: boolean; error?: string }> {
  const user = await getUserData(userId);
  if (!user) return { ok: false, error: "ไม่พบข้อมูลผู้ใช้" };
  const workout = workoutForToday(user);
  const userName = user.profile?.name || "";
  const isRest = Boolean(workout?.day?.isRestDay);
  const workoutTitle = workout?.title || (isRest ? "พักผ่อน (Rest Day)" : "ตารางซ้อมประจำวัน");
  const workoutFocus = workout?.focus || "";
  const durationMinutes = workout?.durationMinutes || 45;
  const targetSteps = user.activity?.targetSteps || 8000;
  const targetCalories = user.nutrition?.targetCalories || 2000;

  const messages = buildMorningBriefingMessages({
    userName,
    workoutTitle,
    workoutFocus,
    durationMinutes,
    targetSteps,
    targetCalories,
    isRestDay: isRest,
    appUrl: process.env.APP_URL || "",
  });

  const sent = await pushLineMessages(userId, messages);
  if (!sent) return { ok: false, error: "ไม่สามารถส่งข้อความผ่าน LINE Push API ได้ (กรุณาตรวจสอบ Channel Access Token)" };

  const state = getState(user);
  const today = bangkokToday();
  await saveUserData(userId, {
    accountability: {
      ...state,
      lastMorningBriefingDate: today,
    } as any,
  });
  console.log(`[Reminder] Sent morning briefing to userId=${userId} date=${today}`);
  return { ok: true };
}

export async function sendNightRecap(userId: string): Promise<{ ok: boolean; error?: string }> {
  const user = await getUserData(userId);
  if (!user) return { ok: false, error: "ไม่พบข้อมูลผู้ใช้" };
  const date = bangkokToday();
  const userName = user.profile?.name || "";
  const targetCalories = user.nutrition?.targetCalories || 2000;
  const currentCalories = user.nutrition?.currentCalories || 0;
  const targetProtein = user.nutrition?.targetProtein || 140;
  const currentProtein = user.nutrition?.currentProtein || 0;
  const targetSteps = user.activity?.targetSteps || 8000;
  const currentSteps = user.activity?.currentSteps || 0;
  const workoutCompleted = isAlreadyDone(user, date);

  const messages = buildNightRecapMessages({
    userName,
    targetCalories,
    currentCalories,
    targetProtein,
    currentProtein,
    targetSteps,
    currentSteps,
    workoutCompleted,
    recommendedBedtime: "22:30 - 23:00 น.",
  });

  const sent = await pushLineMessages(userId, messages);
  if (!sent) return { ok: false, error: "ไม่สามารถส่งข้อความผ่าน LINE Push API ได้ (กรุณาตรวจสอบ Channel Access Token)" };

  const state = getState(user);
  await saveUserData(userId, {
    accountability: {
      ...state,
      lastNightRecapDate: date,
    } as any,
  });
  console.log(`[Reminder] Sent night recap to userId=${userId} date=${date}`);
  return { ok: true };
}

export async function runReminderTick(): Promise<{ scanned: number; sent: number }> {
  const users = await listUserData();
  const now = nowBangkokParts();
  const overdueMinutes = Number(process.env.COACH_REMINDER_OVERDUE_MINUTES || DEFAULT_OVERDUE_MINUTES);
  let sent = 0;

  for (const user of users) {
    try {
      const state = getState(user);

      // 1. เช็ค Morning Briefing ประจำวัน เวลา 08:00 น.
      if (now.hour === 8 && now.minute <= 15) {
        if (state.lastMorningBriefingDate !== now.date) {
          const res = await sendMorningBriefing(user.userId);
          if (res.ok) sent++;
        }
      }

      // 2. เช็ค Night Recap ประจำวัน เวลา 20:00 น.
      if (now.hour === 20 && now.minute <= 15) {
        if (state.lastNightRecapDate !== now.date) {
          const res = await sendNightRecap(user.userId);
          if (res.ok) sent++;
        }
      }

      // 3. เช็คตารางเตือนการออกกำลังกายตามกำหนดเวลาของผู้ใช้
      const workout = workoutForToday(user);
      if (!workout || workout.day?.isRestDay || isAlreadyDone(user, workout.date)) continue;

      const snoozeUntil = state.snoozeUntil ? new Date(state.snoozeUntil).getTime() : 0;
      if (snoozeUntil > Date.now()) continue;
      if (snoozeUntil > 0 && snoozeUntil <= Date.now()) {
        // The user explicitly snoozed this reminder. Fire once when the snooze window ends.
        await saveUserData(user.userId, {
          accountability: { ...state, snoozeUntil: "", lastReminderKey: "" } as any,
        });
        const refreshed = await getUserData(user.userId);
        if (refreshed && await sendReminder(refreshed, "on_time")) sent++;
        continue;
      }

      const scheduled = reminderTimeForUser(user);
      const scheduledMinutes = parseHHMM(scheduled);
      if (scheduledMinutes === null) continue;

      const delta = now.minutes - scheduledMinutes;
      if (delta >= 0 && delta <= 1) {
        if (await sendReminder(user, "on_time")) sent++;
      } else if (delta >= overdueMinutes) {
        if (await sendReminder(user, "overdue")) sent++;
      }
    } catch (err) {
      console.error(`[Reminder] userId=${user.userId} failed:`, err);
    }
  }

  return { scanned: users.length, sent };
}

export async function snoozeWorkoutReminder(userId: string, minutes = DEFAULT_SNOOZE_MINUTES): Promise<{ ok: boolean; until?: string; error?: string }> {
  const user = await getUserData(userId);
  if (!user) return { ok: false, error: "ไม่พบข้อมูลผู้ใช้" };
  const safeMinutes = Math.max(5, Math.min(180, Math.round(minutes)));
  const until = new Date(Date.now() + safeMinutes * 60_000).toISOString();
  const state = getState(user);
  await saveUserData(userId, {
    accountability: {
      ...state,
      status: "approaching",
      snoozeUntil: until,
      lastReminderType: "pre_workout",
      lastReminderText: `เลื่อนการเตือน ${safeMinutes} นาที`,
    } as any,
  });
  return { ok: true, until };
}

export async function skipTodayWorkout(userId: string): Promise<{ ok: boolean; error?: string }> {
  const user = await getUserData(userId);
  if (!user) return { ok: false, error: "ไม่พบข้อมูลผู้ใช้" };
  const date = bangkokToday();
  const day = user.coachPlan?.days?.find((d) => d.date === date);
  if (!day) return { ok: false, error: "วันนี้ไม่มีวันที่อยู่ในแผน" };

  const result = await executeCoachTool(userId, "set_day_status", {
    date,
    status: "skipped",
    note: "ผู้ใช้แจ้งว่าไม่สามารถฝึกวันนี้ได้",
  });
  if (!result.ok) return { ok: false, error: String(result.error || "ไม่สามารถอัปเดตสถานะได้") };

  const latest = await getUserData(userId);
  const state = getState(latest || user);
  await saveUserData(userId, {
    accountability: {
      ...state,
      status: "on_track",
      snoozeUntil: "",
      lastReminderType: "late_warning",
      lastReminderText: "ผู้ใช้แจ้งว่าไม่สามารถฝึกวันนี้ได้",
    } as any,
  });
  return { ok: true };
}

export async function startReminderEngine(): Promise<ReturnType<typeof setInterval>> {
  const interval = Math.max(30_000, Number(process.env.COACH_REMINDER_INTERVAL_MS || DEFAULT_INTERVAL_MS));
  console.log(`[Reminder] engine started: interval=${interval}ms`);
  setTimeout(() => {
    runReminderTick().catch((err) => console.error("[Reminder] initial tick failed:", err));
  }, 5_000);
  return setInterval(() => {
    runReminderTick().catch((err) => console.error("[Reminder] tick failed:", err));
  }, interval);
}
