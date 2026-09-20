import type { CoachAction, CoachResponse, CoachResponseExercise } from "./src/types";

/**
 * LINE Flex renderer for FitCoach.
 * Phase 5 adds a deterministic "เสร็จแล้ว" action so workout completion
 * can be written to Firebase before the success message is shown.
 */
export type LineMessagePayload =
  | { type: "text"; text: string }
  | { type: "flex"; altText: string; contents: LineFlexBubble };

interface LineFlexBubble {
  type: "bubble";
  size?: "nano" | "micro" | "kilo" | "mega" | "giga";
  header?: Record<string, unknown>;
  hero?: Record<string, unknown>;
  body: Record<string, unknown>;
  footer?: Record<string, unknown>;
}

const COLORS = {
  ink: "#111827",
  muted: "#6B7280",
  line: "#E5E7EB",
  surface: "#FFFFFF",
  soft: "#F8FAFC",
  green: "#16A34A",
  greenSoft: "#DCFCE7",
  amber: "#D97706",
  amberSoft: "#FEF3C7",
  blue: "#2563EB",
  blueSoft: "#DBEAFE",
  purple: "#7C3AED",
  purpleSoft: "#EDE9FE",
  red: "#DC2626",
  redSoft: "#FEE2E2",
};

function text(textValue: string, size = "sm", weight: "regular" | "bold" = "regular", color = COLORS.ink) {
  return {
    type: "text",
    text: String(textValue).slice(0, 2000),
    size,
    weight,
    color,
    wrap: true,
  };
}

function separator() {
  return { type: "separator", margin: "md", color: COLORS.line };
}

function pill(label: string, color = COLORS.soft, textColor = COLORS.muted) {
  return {
    type: "box",
    layout: "vertical",
    backgroundColor: color,
    cornerRadius: "lg",
    paddingAll: "sm",
    contents: [text(label, "xs", "bold", textColor)],
  };
}

function safeAction(action: CoachAction): Record<string, unknown> {
  return {
    type: "button",
    style: action.style === "secondary" ? "secondary" : "primary",
    color: action.style === "danger" ? COLORS.red : COLORS.ink,
    height: "sm",
    action: {
      type: "postback",
      label: action.label.slice(0, 20),
      data: `fitcoach_action=${encodeURIComponent(action.actionType)}&id=${encodeURIComponent(action.id)}`.slice(0, 300),
      displayText: action.label.slice(0, 300),
    },
  };
}

function completionAction(): CoachAction {
  // Reuses the existing "confirm" action type for backward compatibility.
  // The id is the deterministic command handled by line-webhook.ts.
  return {
    id: "complete_workout",
    label: "เสร็จแล้ว ✓",
    actionType: "confirm",
    style: "primary",
  };
}

function typeLabel(response: CoachResponse): { label: string; accent: string; soft: string } {
  switch (response.type) {
    case "workout":
      return { label: "WORKOUT", accent: COLORS.green, soft: COLORS.greenSoft };
    case "workout_reminder":
      return { label: "WORKOUT REMINDER", accent: COLORS.amber, soft: COLORS.amberSoft };
    case "adapted_plan":
      return { label: "ADAPTED PLAN", accent: COLORS.blue, soft: COLORS.blueSoft };
    case "nutrition":
    case "meal_recorded":
      return { label: "NUTRITION", accent: COLORS.amber, soft: COLORS.amberSoft };
    case "recovery":
      return { label: "RECOVERY", accent: COLORS.purple, soft: COLORS.purpleSoft };
    case "daily_summary":
      return { label: "DAILY SUMMARY", accent: COLORS.blue, soft: COLORS.blueSoft };
    case "new_program":
      return { label: "NEW PROGRAM", accent: COLORS.purple, soft: COLORS.purpleSoft };
    case "penalty_notice":
      return { label: "COACH NOTICE", accent: COLORS.red, soft: COLORS.redSoft };
    default:
      return { label: "FITCOACH", accent: COLORS.green, soft: COLORS.greenSoft };
  }
}

function exerciseRow(exercise: CoachResponseExercise, index: number) {
  const stats = [
    exercise.sets != null ? `${exercise.sets} เซ็ต` : "",
    exercise.reps ? `${exercise.reps} ครั้ง` : "",
    exercise.restSeconds != null ? `พัก ${exercise.restSeconds}s` : "",
  ].filter(Boolean);

  return {
    type: "box",
    layout: "horizontal",
    spacing: "md",
    paddingTop: index === 0 ? "none" : "md",
    contents: [
      {
        type: "box",
        layout: "vertical",
        flex: 0,
        width: "26px",
        height: "26px",
        cornerRadius: "md",
        backgroundColor: COLORS.greenSoft,
        justifyContent: "center",
        alignItems: "center",
        contents: [text(String(index + 1), "xs", "bold", COLORS.green)],
      },
      {
        type: "box",
        layout: "vertical",
        flex: 1,
        contents: [
          text(exercise.nameTh || exercise.name, "sm", "bold"),
          ...(exercise.nameTh ? [text(exercise.name, "xs", "regular", COLORS.muted)] : []),
          ...(stats.length
            ? [{ type: "box", layout: "horizontal", spacing: "sm", margin: "xs", contents: stats.map((item) => text(item, "xs", "bold", COLORS.muted)) }]
            : []),
          ...(exercise.note ? [text(exercise.note, "xs", "regular", COLORS.muted)] : []),
        ],
      },
    ],
  };
}

function buildWorkoutBubble(response: CoachResponse): LineFlexBubble {
  const d = response.data || {};
  const meta = typeLabel(response);
  const exercises = d.exercises || [];
  const headerContents: Record<string, unknown>[] = [
    text(meta.label, "xs", "bold", meta.accent),
    text(d.titleTh || d.title || (response.type === "workout_reminder" ? "โปรแกรมวันนี้" : "Workout Plan"), "lg", "bold"),
  ];
  const metaItems = [d.durationMinutes != null ? `${d.durationMinutes} นาที` : "", d.intensity || "", d.focus || ""].filter(Boolean);
  const bodyContents: Record<string, unknown>[] = [
    { type: "box", layout: "horizontal", spacing: "sm", contents: metaItems.slice(0, 3).map((item) => pill(item, meta.soft, meta.accent)) },
  ];

  if (d.summary) bodyContents.push(text(d.summary, "sm", "regular", COLORS.muted));
  if (exercises.length) {
    bodyContents.push(separator());
    bodyContents.push(text("รายการฝึก", "sm", "bold"));
    bodyContents.push({ type: "box", layout: "vertical", margin: "sm", spacing: "sm", contents: exercises.slice(0, 8).map(exerciseRow) });
  }
  if (d.reason) bodyContents.push(separator(), text(`เหตุผล: ${d.reason}`, "xs", "regular", COLORS.muted));
  if (d.tags?.length) {
    bodyContents.push({ type: "box", layout: "horizontal", spacing: "sm", margin: "md", contents: d.tags.slice(0, 6).map((tag) => pill(`#${tag}`)) });
  }

  const actions = [...(response.actions || [])];
  if (!actions.some((a) => a.id === "complete_workout")) actions.push(completionAction());

  return {
    type: "bubble",
    size: "mega",
    header: { type: "box", layout: "vertical", backgroundColor: COLORS.surface, paddingAll: "lg", contents: headerContents },
    body: { type: "box", layout: "vertical", backgroundColor: COLORS.surface, paddingAll: "lg", spacing: "md", contents: bodyContents },
    footer: actions.length
      ? { type: "box", layout: "vertical", backgroundColor: COLORS.surface, paddingAll: "lg", spacing: "sm", contents: actions.slice(0, 3).map(safeAction) }
      : undefined,
  };
}

function buildDetailBubble(response: CoachResponse): LineFlexBubble {
  const d = response.data || {};
  const meta = typeLabel(response);
  const stats: Record<string, unknown>[] = [];
  if (d.calories != null) stats.push(pill(`${d.calories} kcal`, COLORS.amberSoft, COLORS.amber));
  if (d.proteinGrams != null) stats.push(pill(`${d.proteinGrams} g โปรตีน`, COLORS.redSoft, COLORS.red));
  if (d.sleepHours != null) stats.push(pill(`${d.sleepHours} ชม.`, COLORS.purpleSoft, COLORS.purple));
  if (d.recoveryScore != null) stats.push(pill(`Recovery ${d.recoveryScore}%`, COLORS.greenSoft, COLORS.green));
  const bodyContents: Record<string, unknown>[] = [
    text(meta.label, "xs", "bold", meta.accent),
    text(d.titleTh || d.title || "ข้อมูลจากโค้ช", "lg", "bold"),
  ];
  if (d.summary) bodyContents.push(text(d.summary, "sm", "regular", COLORS.muted));
  if (stats.length) bodyContents.push({ type: "box", layout: "horizontal", spacing: "sm", contents: stats.slice(0, 4) });
  if (d.reason) bodyContents.push(text(`เหตุผล: ${d.reason}`, "xs", "regular", COLORS.muted));
  if (d.reminderDate || d.reminderTime) {
    bodyContents.push({ type: "box", layout: "vertical", backgroundColor: COLORS.amberSoft, cornerRadius: "md", paddingAll: "md", margin: "sm", contents: [text(`🔔 ${d.reminderDate || "วันนี้"} ${d.reminderTime || ""}`.trim(), "sm", "bold", COLORS.amber)] });
  }
  return {
    type: "bubble",
    size: "mega",
    body: { type: "box", layout: "vertical", paddingAll: "lg", spacing: "md", backgroundColor: COLORS.surface, contents: bodyContents },
    footer: response.actions?.length
      ? { type: "box", layout: "vertical", paddingAll: "lg", spacing: "sm", contents: response.actions.slice(0, 3).map(safeAction) }
      : undefined,
  };
}

export function buildLineFlexMessage(response: CoachResponse): LineMessagePayload {
  const bubble = ["workout", "workout_reminder", "adapted_plan"].includes(response.type)
    ? buildWorkoutBubble(response)
    : buildDetailBubble(response);
  const altText = `${response.data?.titleTh || response.data?.title || "FitCoach"}: ${response.message}`.replace(/\s+/g, " ").slice(0, 400);
  return { type: "flex", altText, contents: bubble };
}

export function buildWorkoutSuccessMessages(options: {
  title?: string;
  durationMinutes?: number;
  completedExercises?: number;
  rpe?: number;
  streakDays?: number;
} = {}): LineMessagePayload[] {
  const title = options.title || "Workout วันนี้";
  const stats = [
    options.durationMinutes != null ? `${options.durationMinutes} นาที` : "เสร็จตามที่บันทึก",
    options.completedExercises != null ? `${options.completedExercises} ท่า` : "บันทึกผลแล้ว",
    options.rpe != null ? `RPE ${options.rpe}` : "",
  ].filter(Boolean);

  const bubble: LineFlexBubble = {
    type: "bubble",
    size: "mega",
    body: {
      type: "box",
      layout: "vertical",
      backgroundColor: COLORS.surface,
      paddingAll: "xl",
      spacing: "md",
      contents: [
        text("✓ WORKOUT COMPLETE", "sm", "bold", COLORS.green),
        text("สำเร็จแล้ว! 💪", "xl", "bold"),
        text(title, "lg", "bold"),
        { type: "box", layout: "horizontal", spacing: "sm", margin: "sm", contents: stats.map((s) => pill(s, COLORS.greenSoft, COLORS.green)) },
        separator(),
        text("โค้ชบันทึกผลการฝึกไว้ในระบบแล้วครับ วันนี้ทำตามแผนได้อีกหนึ่งวัน 🔥", "sm", "regular", COLORS.muted),
        ...(options.streakDays != null
          ? [text(`🔥 Streak ${options.streakDays} วัน`, "sm", "bold", COLORS.amber)]
          : []),
      ],
    },
  };

  return [
    { type: "text", text: "✅ บันทึก Workout สำเร็จแล้วครับ! 💪" },
    { type: "flex", altText: `Workout สำเร็จแล้ว: ${title}`, contents: bubble },
  ];
}

export function buildWorkoutReminderMessages(options: {
  title?: string;
  focus?: string;
  durationMinutes?: number;
  exerciseCount?: number;
  overdue?: boolean;
} = {}): LineMessagePayload[] {
  const title = options.title || "Workout วันนี้";
  const prefix = options.overdue ? "⚠️ เลยเวลาซ้อมแล้วครับ" : "🔔 ถึงเวลาออกกำลังกายแล้วครับ";
  const scheduleText = [
    options.durationMinutes != null ? `${options.durationMinutes} นาที` : "",
    options.focus || "",
    options.exerciseCount ? `${options.exerciseCount} ท่า` : "",
  ].filter(Boolean);

  const button = (label: string, id: string, style: "primary" | "secondary" = "primary") =>
    safeAction({ id, label, actionType: id === "reminder_snooze" ? "snooze" : id === "reminder_cannot_do" ? "cannot_do" : "start_workout", style });

  const bubble: LineFlexBubble = {
    type: "bubble",
    size: "mega",
    body: {
      type: "box",
      layout: "vertical",
      backgroundColor: COLORS.surface,
      paddingAll: "xl",
      spacing: "md",
      contents: [
        text("เตือน", "sm", "bold", COLORS.amber),
        text(prefix, "lg", "bold"),
        text(title, "xl", "bold"),
        ...(scheduleText.length
          ? [{ type: "box", layout: "horizontal", spacing: "sm", contents: scheduleText.slice(0, 3).map((v) => pill(v, COLORS.amberSoft, COLORS.amber)) }]
          : []),
        separator(),
        text(options.overdue ? "ยังไม่ได้บันทึกว่าเสร็จครับ เลือกสิ่งที่ต้องการทำต่อได้เลย" : "พร้อมเริ่มแล้วครับ เลือกการทำงานได้เลย", "sm", "regular", COLORS.muted),
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      backgroundColor: COLORS.surface,
      paddingAll: "lg",
      spacing: "sm",
      contents: [
        button("เริ่มฝึก 💪", "reminder_start"),
        button("เลื่อน 30 นาที", "reminder_snooze", "secondary"),
        button("ทำไม่ได้วันนี้", "reminder_cannot_do", "secondary"),
      ],
    },
  };

  return [
    { type: "text", text: `${prefix}\n${title}${options.focus ? ` • ${options.focus}` : ""}` },
    { type: "flex", altText: `${prefix}: ${title}`, contents: bubble },
  ];
}

export function buildLineReplyMessages(response: CoachResponse): LineMessagePayload[] {
  if (response.type === "chat" && !response.actions?.length) return [{ type: "text", text: response.message.slice(0, 5000) }];
  const messages: LineMessagePayload[] = [];
  if (response.message.trim()) messages.push({ type: "text", text: response.message.slice(0, 5000) });
  messages.push(buildLineFlexMessage(response));
  return messages.slice(0, 5);
}
