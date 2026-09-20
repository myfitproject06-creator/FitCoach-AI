// coach-plan.ts - เครื่องมือ (function calling) ที่ให้ AI โค้ชบันทึก/ปรับแผน และสรุปแผนเข้า prompt
import { Type } from "@google/genai";
import { getUserData, saveUserData } from "./db";
import type {
  CoachPlan,
  PlanDay,
  PlanExercise,
  PlanDayStatus,
  PlanPhase,
  WorkoutLog,
  CoachProfileExtra,
} from "./src/types";

// ---------- วันที่ (เวลาไทย) ----------
export function bangkokToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" }); // YYYY-MM-DD
}

function isValidDate(s: unknown): s is string {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

// ---------- Tool declarations (ส่งให้ Gemini) ----------
const exerciseSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "ชื่อท่า (อังกฤษ)" },
    nameTh: { type: Type.STRING, description: "ชื่อท่า (ไทย) ถ้ามี" },
    sets: { type: Type.INTEGER, description: "จำนวนเซ็ต" },
    reps: { type: Type.STRING, description: 'จำนวนครั้ง เช่น "8-12" หรือ "30 วินาที"' },
    restSeconds: { type: Type.INTEGER, description: "พักระหว่างเซ็ต (วินาที)" },
    suggestedWeight: { type: Type.STRING, description: 'น้ำหนักแนะนำ เช่น "20 กก." หรือ "น้ำหนักตัว"' },
    note: { type: Type.STRING, description: "คำแนะนำสั้นๆ" },
  },
  required: ["name", "sets", "reps"],
};

const daySchema = {
  type: Type.OBJECT,
  properties: {
    date: { type: Type.STRING, description: "วันที่รูปแบบ YYYY-MM-DD" },
    title: { type: Type.STRING, description: 'ชื่อเมนูวันนั้น เช่น "Push Day" หรือ "พักฟื้น"' },
    focus: { type: Type.STRING, description: "กล้ามเนื้อ/จุดเน้น" },
    isRestDay: { type: Type.BOOLEAN, description: "true ถ้าเป็นวันพัก" },
    durationMinutes: { type: Type.INTEGER, description: "เวลารวม (นาที)" },
    exercises: { type: Type.ARRAY, items: exerciseSchema, description: "ท่าซ้อม (วันพักให้เป็น [])" },
    coachNote: { type: Type.STRING, description: "หมายเหตุจากโค้ช เช่น เหตุผลที่ปรับ" },
  },
  required: ["date", "title", "exercises"],
};

export const COACH_TOOL_DECLARATIONS = [
  {
    name: "save_plan",
    description:
      "บันทึกแผนใหม่ของผู้ใช้ (แทนที่แผนเดิม) เรียกหลังผู้ใช้ยืนยันข้อมูลซักประวัติแล้วเท่านั้น " +
      "ใส่ phases สำหรับแผนยาว และใส่ days เฉพาะช่วงที่ลงรายละเอียดจริง (แผนสั้นใส่ครบทุกวัน, แผนยาวใส่ 1-2 สัปดาห์แรก)",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "ชื่อแผน" },
        goal: { type: Type.STRING, description: "เป้าหมายของแผน" },
        startDate: { type: Type.STRING, description: "วันเริ่ม YYYY-MM-DD" },
        endDate: { type: Type.STRING, description: "วันสิ้นสุด YYYY-MM-DD" },
        phases: {
          type: Type.ARRAY,
          description: "เฟสของแผน (แผน 1 เดือนขึ้นไป)",
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              weeks: { type: Type.INTEGER },
              focus: { type: Type.STRING },
            },
            required: ["name", "weeks", "focus"],
          },
        },
        days: { type: Type.ARRAY, items: daySchema, description: "รายการวันที่ลงรายละเอียดแล้ว" },
      },
      required: ["title", "goal", "startDate", "endDate", "days"],
    },
  },
  {
    name: "upsert_plan_days",
    description:
      "เพิ่มหรือแก้ไขรายวันในแผนที่มีอยู่ (ใช้ตอนปรับแผนตามผู้ใช้ ย้ายวัน ลดความหนัก หรือลงรายละเอียดสัปดาห์ถัดไป) " +
      "วันที่ซ้ำกับของเดิมจะถูกแทนที่",
    parameters: {
      type: Type.OBJECT,
      properties: { days: { type: Type.ARRAY, items: daySchema } },
      required: ["days"],
    },
  },
  {
    name: "set_day_status",
    description: "เปลี่ยนสถานะของวันในแผน เช่น ผู้ใช้พลาด (skipped) หรือย้ายไปวันอื่น (moved)",
    parameters: {
      type: Type.OBJECT,
      properties: {
        date: { type: Type.STRING, description: "YYYY-MM-DD" },
        status: { type: Type.STRING, description: "planned | done | skipped | moved" },
        note: { type: Type.STRING, description: "เหตุผลสั้นๆ" },
      },
      required: ["date", "status"],
    },
  },
  {
    name: "log_workout",
    description: "บันทึกผลการซ้อมที่ผู้ใช้รายงาน (ทำครบไหม น้ำหนักที่ยก ความรู้สึก RPE) และติ๊กวันนั้นเป็น done ถ้าซ้อมเสร็จ",
    parameters: {
      type: Type.OBJECT,
      properties: {
        date: { type: Type.STRING, description: "YYYY-MM-DD (ไม่ใส่ = วันนี้)" },
        completed: { type: Type.BOOLEAN },
        rpe: { type: Type.INTEGER, description: "ความหนักที่รู้สึก 1-10" },
        feeling: { type: Type.STRING, description: "ความรู้สึกหลังซ้อม" },
        notes: { type: Type.STRING },
        exercises: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              weight: { type: Type.STRING },
              reps: { type: Type.STRING },
            },
            required: ["name"],
          },
        },
      },
      required: ["completed"],
    },
  },
  {
    name: "update_profile_info",
    description:
      "บันทึกข้อมูลที่ผู้ใช้เพิ่งบอกในแชทลงโปรไฟล์ถาวร (อาชีพ เวลาเลิกงาน เวลาที่ซ้อมได้ สถานที่ฝึก อุปกรณ์ จำนวนวัน/นาทีต่อครั้ง ข้อจำกัดร่างกาย) " +
      "เรียกทันทีเมื่อได้ข้อมูลใหม่ ใส่เฉพาะฟิลด์ที่ผู้ใช้บอกจริง",
    parameters: {
      type: Type.OBJECT,
      properties: {
        occupation: { type: Type.STRING, description: "อาชีพ/ลักษณะงาน" },
        workEndTime: { type: Type.STRING, description: "เวลาเลิกงาน HH:MM" },
        preferredWorkoutTime: { type: Type.STRING, description: "เวลาที่สะดวกซ้อม HH:MM" },
        environment: { type: Type.STRING, description: "Gym | Home | Outdoor | Mixed" },
        equipment: { type: Type.ARRAY, items: { type: Type.STRING }, description: "อุปกรณ์ที่มี" },
        daysPerWeek: { type: Type.INTEGER, description: "ซ้อมได้กี่วัน/สัปดาห์" },
        sessionMinutes: { type: Type.INTEGER, description: "ซ้อมได้ครั้งละกี่นาที" },
        limitations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "ข้อจำกัดร่างกาย/อาการบาดเจ็บ" },
      },
    },
  },
];

// ---------- Sanitize ----------
function clampInt(v: unknown, min: number, max: number, fallback: number): number {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function str(v: unknown, max = 300): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t ? t.slice(0, max) : undefined;
}

function sanitizeExercises(raw: unknown): PlanExercise[] {
  if (!Array.isArray(raw)) return [];
  const out: PlanExercise[] = [];
  for (const e of raw.slice(0, 20)) {
    const name = str(e?.name, 100);
    if (!name) continue;
    out.push({
      name,
      nameTh: str(e?.nameTh, 100),
      sets: clampInt(e?.sets, 1, 10, 3),
      reps: str(String(e?.reps ?? "10"), 30) || "10",
      restSeconds: clampInt(e?.restSeconds, 0, 600, 60),
      suggestedWeight: str(e?.suggestedWeight, 40),
      note: str(e?.note, 200),
    });
  }
  return out;
}

function sanitizeDays(raw: unknown): PlanDay[] {
  if (!Array.isArray(raw)) return [];
  const byDate = new Map<string, PlanDay>();
  for (const d of raw.slice(0, 90)) {
    if (!isValidDate(d?.date)) continue;
    const isRest = Boolean(d?.isRestDay);
    byDate.set(d.date, {
      date: d.date,
      title: str(d?.title, 80) || (isRest ? "วันพัก" : "ซ้อม"),
      focus: str(d?.focus, 80),
      isRestDay: isRest || undefined,
      durationMinutes: d?.durationMinutes ? clampInt(d.durationMinutes, 5, 240, 45) : undefined,
      exercises: isRest ? [] : sanitizeExercises(d?.exercises),
      status: "planned",
      coachNote: str(d?.coachNote, 300),
    });
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function sanitizePhases(raw: unknown): PlanPhase[] {
  if (!Array.isArray(raw)) return [];
  const out: PlanPhase[] = [];
  for (const p of raw.slice(0, 12)) {
    const name = str(p?.name, 60);
    if (!name) continue;
    out.push({ name, weeks: clampInt(p?.weeks, 1, 52, 1), focus: str(p?.focus, 150) || "" });
  }
  return out;
}

// ---------- Executors ----------
type ToolResult = Record<string, unknown>;

export async function executeCoachTool(
  userId: string,
  name: string,
  args: Record<string, unknown>
): Promise<ToolResult> {
  const user = await getUserData(userId);
  const now = new Date().toISOString();

  switch (name) {
    case "save_plan": {
      const days = sanitizeDays(args.days);
      if (days.length === 0) return { ok: false, error: "ต้องมี days อย่างน้อย 1 วัน และ date ต้องเป็น YYYY-MM-DD" };
      if (!isValidDate(args.startDate) || !isValidDate(args.endDate)) {
        return { ok: false, error: "startDate/endDate ต้องเป็น YYYY-MM-DD" };
      }
      if ((args.endDate as string) < (args.startDate as string)) {
        return { ok: false, error: "endDate ต้องไม่ก่อน startDate" };
      }
      const plan: CoachPlan = {
        id: `plan-${Date.now()}`,
        title: str(args.title, 100) || "โปรแกรมออกกำลังกาย",
        goal: str(args.goal, 200) || "",
        startDate: args.startDate as string,
        endDate: args.endDate as string,
        phases: sanitizePhases(args.phases),
        days,
        createdAt: now,
        updatedAt: now,
      };
      await saveUserData(userId, { coachPlan: plan });
      return { ok: true, savedDays: days.length, startDate: plan.startDate, endDate: plan.endDate };
    }

    case "upsert_plan_days": {
      const plan = user?.coachPlan;
      if (!plan) return { ok: false, error: "ยังไม่มีแผน ให้เรียก save_plan ก่อน" };
      const incoming = sanitizeDays(args.days);
      if (incoming.length === 0) return { ok: false, error: "ไม่มีวันที่ถูกต้องใน days" };
      const map = new Map(plan.days.map((d) => [d.date, d] as const));
      for (const d of incoming) map.set(d.date, d);
      const days = [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
      const endDate = days[days.length - 1].date > plan.endDate ? days[days.length - 1].date : plan.endDate;
      await saveUserData(userId, { coachPlan: { ...plan, days, endDate, updatedAt: now } });
      return { ok: true, upserted: incoming.length };
    }

    case "set_day_status": {
      const plan = user?.coachPlan;
      if (!plan) return { ok: false, error: "ยังไม่มีแผน" };
      if (!isValidDate(args.date)) return { ok: false, error: "date ต้องเป็น YYYY-MM-DD" };
      const status = args.status as PlanDayStatus;
      if (!["planned", "done", "skipped", "moved"].includes(status)) {
        return { ok: false, error: "status ต้องเป็น planned | done | skipped | moved" };
      }
      const idx = plan.days.findIndex((d) => d.date === args.date);
      if (idx < 0) return { ok: false, error: `ไม่พบวันที่ ${args.date} ในแผน` };
      const days = plan.days.slice();
      days[idx] = {
        ...days[idx],
        status,
        coachNote: str(args.note, 300) || days[idx].coachNote,
        completedAt: status === "done" ? now : undefined,
      };
      await saveUserData(userId, { coachPlan: { ...plan, days, updatedAt: now } });
      return { ok: true };
    }

    case "log_workout": {
      const date = isValidDate(args.date) ? (args.date as string) : bangkokToday();
      const completed = Boolean(args.completed);
      const exercises = Array.isArray(args.exercises)
        ? (args.exercises as any[])
            .slice(0, 20)
            .map((e) => ({ name: str(e?.name, 100) || "", weight: str(e?.weight, 30), reps: str(e?.reps, 30) }))
            .filter((e) => e.name)
        : undefined;
      const log: WorkoutLog = {
        id: `log-${Date.now()}`,
        date,
        completed,
        rpe: args.rpe ? clampInt(args.rpe, 1, 10, 5) : undefined,
        feeling: str(args.feeling, 100),
        notes: str(args.notes, 300),
        exercises,
        createdAt: now,
      };
      const logs = [...(user?.workoutLogs || []), log].slice(-100);
      const patch: Record<string, unknown> = { workoutLogs: logs };
      const plan = user?.coachPlan;
      if (plan && completed) {
        const idx = plan.days.findIndex((d) => d.date === date);
        if (idx >= 0) {
          const days = plan.days.slice();
          days[idx] = { ...days[idx], status: "done", completedAt: now };
          patch.coachPlan = { ...plan, days, updatedAt: now };
        }
      }
      await saveUserData(userId, patch);
      return { ok: true, date, markedDone: Boolean(patch.coachPlan) };
    }

    case "update_profile_info": {
      const extra: CoachProfileExtra = { ...(user?.coachProfile || {}) };
      const occupation = str(args.occupation, 100);
      const workEndTime = str(args.workEndTime, 10);
      const preferredWorkoutTime = str(args.preferredWorkoutTime, 10);
      if (occupation) extra.occupation = occupation;
      if (workEndTime) extra.workEndTime = workEndTime;
      if (preferredWorkoutTime) extra.preferredWorkoutTime = preferredWorkoutTime;

      const patch: Record<string, unknown> = { coachProfile: extra };
      if (user?.profile) {
        const p = { ...user.profile } as Record<string, unknown>;
        if (["Gym", "Home", "Outdoor", "Mixed"].includes(args.environment as string)) p.environment = args.environment;
        if (Array.isArray(args.equipment)) p.equipment = (args.equipment as unknown[]).map((x) => str(x, 60)).filter(Boolean);
        if (Array.isArray(args.limitations)) p.limitations = (args.limitations as unknown[]).map((x) => str(x, 100)).filter(Boolean);
        if (args.daysPerWeek) p.daysPerWeek = clampInt(args.daysPerWeek, 1, 7, 3);
        if (args.sessionMinutes) p.durationMinutes = clampInt(args.sessionMinutes, 10, 240, 45);
        if (preferredWorkoutTime) p.preferredTime = preferredWorkoutTime;
        patch.profile = p;
      }
      await saveUserData(userId, patch);
      return { ok: true };
    }

    default:
      return { ok: false, error: `ไม่รู้จักเครื่องมือ ${name}` };
  }
}

// ---------- สรุปแผนเข้า prompt ----------
const STATUS_TH: Record<PlanDayStatus, string> = {
  planned: "ยังไม่ซ้อม",
  done: "ซ้อมแล้ว",
  skipped: "พลาด",
  moved: "ย้ายวันแล้ว",
};

function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function buildPlanContext(
  plan: CoachPlan | undefined,
  logs: WorkoutLog[] | undefined,
  extra: CoachProfileExtra | undefined,
  today: string
): string {
  const lines: string[] = [];

  if (extra && (extra.occupation || extra.workEndTime || extra.preferredWorkoutTime)) {
    lines.push(
      `- ข้อมูลเพิ่มจากการซักประวัติ: อาชีพ ${extra.occupation || "-"} | เลิกงาน ${extra.workEndTime || "-"} | เวลาที่ซ้อมได้ ${extra.preferredWorkoutTime || "-"}`
    );
  }

  if (!plan) {
    lines.push("- ยังไม่มีแผนที่บันทึกไว้ในระบบ");
  } else {
    lines.push(`- แผนที่ใช้อยู่: "${plan.title}" เป้าหมาย: ${plan.goal} (${plan.startDate} ถึง ${plan.endDate})`);
    if (plan.phases.length) {
      lines.push(`- เฟส: ${plan.phases.map((p) => `${p.name} ${p.weeks} สัปดาห์ (${p.focus})`).join(" -> ")}`);
    }
    const from = addDays(today, -3);
    const to = addDays(today, 7);
    const near = plan.days.filter((d) => d.date >= from && d.date <= to);
    if (near.length) {
      lines.push("- รายวันใกล้ๆ นี้ (วันนี้ = " + today + "):");
      for (const d of near) {
        const ex = d.exercises.slice(0, 6).map((e) => `${e.nameTh || e.name} ${e.sets}x${e.reps}`).join(", ");
        lines.push(`  • ${d.date} [${STATUS_TH[d.status]}] ${d.title}${ex ? ": " + ex : ""}`);
      }
    }
    const lastDetail = plan.days.length ? plan.days[plan.days.length - 1].date : plan.startDate;
    if (lastDetail < plan.endDate) {
      lines.push(`- รายละเอียดรายวันลงไว้ถึง ${lastDetail} เท่านั้น ที่เหลือยังไม่ได้ลงรายละเอียด (ให้ลงเพิ่มด้วย upsert_plan_days เมื่อใกล้ถึง)`);
    }
  }

  const recent = (logs || []).slice(-5);
  if (recent.length) {
    lines.push("- ผลซ้อมล่าสุด:");
    for (const l of recent) {
      const ex = (l.exercises || []).slice(0, 4).map((e) => `${e.name} ${e.weight || ""} ${e.reps || ""}`.trim()).join(", ");
      lines.push(`  • ${l.date} ${l.completed ? "ทำครบ" : "ไม่ครบ"}${l.rpe ? ` RPE ${l.rpe}` : ""}${l.feeling ? ` รู้สึก${l.feeling}` : ""}${ex ? " | " + ex : ""}`);
    }
  }
  return lines.join("\n");
}
