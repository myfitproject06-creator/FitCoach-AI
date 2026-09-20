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
  const isNutrition = response.type === "nutrition" || response.type === "meal_recorded" || d.calories != null;
  const meta = typeLabel(response);

  const stats: Record<string, unknown>[] = [];
  if (d.calories != null) stats.push(pill(`~${Math.round(d.calories)} kcal`, COLORS.amberSoft, COLORS.amber));
  if (d.proteinGrams != null) stats.push(pill(`P: ~${Math.round(d.proteinGrams)}g`, COLORS.redSoft, COLORS.red));
  if (d.carbsGrams != null) stats.push(pill(`C: ~${Math.round(d.carbsGrams)}g`, COLORS.blueSoft, COLORS.blue));
  if (d.fatGrams != null) stats.push(pill(`F: ~${Math.round(d.fatGrams)}g`, COLORS.amberSoft, COLORS.amber));
  if (d.sleepHours != null) stats.push(pill(`${d.sleepHours} ชม.`, COLORS.purpleSoft, COLORS.purple));
  if (d.recoveryScore != null) stats.push(pill(`Recovery ${d.recoveryScore}%`, COLORS.greenSoft, COLORS.green));

  const titleText = d.menu
    ? `${d.menu}${d.portion ? ` (${d.portion})` : ""}`
    : (d.titleTh || d.title || (isNutrition ? "ประมาณการสารอาหาร" : "ข้อมูลจากโค้ช"));

  const bodyContents: Record<string, unknown>[] = [
    text(meta.label, "xs", "bold", meta.accent),
    text(titleText, "lg", "bold"),
  ];

  if (d.summary) bodyContents.push(text(d.summary, "sm", "regular", COLORS.muted));
  if (stats.length) {
    bodyContents.push({ type: "box", layout: "horizontal", spacing: "sm", contents: stats.slice(0, 4) });
  }

  if (d.confidenceLevel) {
    const confLabel = d.confidenceLevel === "high" ? "ความมั่นใจ: สูง" : d.confidenceLevel === "low" ? "ความมั่นใจ: ประเมินคร่าวๆ" : "ความมั่นใจ: ปานกลาง";
    bodyContents.push(text(`ℹ️ ${confLabel}`, "xs", "regular", COLORS.muted));
  }

  // วันนี้สะสม / โควต้า
  if (d.todayTotalCalories != null || d.targetCalories != null || d.remainingCalories != null) {
    bodyContents.push(separator());
    const quotaLines: Record<string, unknown>[] = [
      text("📊 ภาพรวมโภชนาการวันนี้", "xs", "bold", COLORS.ink),
    ];
    if (d.todayTotalCalories != null && d.targetCalories != null) {
      quotaLines.push(text(`• กินแล้ว: ~${Math.round(d.todayTotalCalories)} / ${Math.round(d.targetCalories)} kcal`, "xs", "regular", COLORS.muted));
    } else if (d.todayTotalCalories != null) {
      quotaLines.push(text(`• กินแล้วสะสมวันนี้: ~${Math.round(d.todayTotalCalories)} kcal`, "xs", "regular", COLORS.muted));
    }
    if (d.remainingCalories != null) {
      if (d.remainingCalories >= 0) {
        quotaLines.push(text(`• เหลือโควต้าอีก: ~${Math.round(d.remainingCalories)} kcal`, "xs", "bold", COLORS.green));
      } else {
        quotaLines.push(text(`• เกินเป้าหมายวันนี้: +${Math.round(Math.abs(d.remainingCalories))} kcal`, "xs", "bold", COLORS.amber));
      }
    }
    bodyContents.push({
      type: "box",
      layout: "vertical",
      backgroundColor: COLORS.soft,
      cornerRadius: "md",
      paddingAll: "md",
      spacing: "xs",
      contents: quotaLines,
    });
  }

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

export function actionButton(options: {
  label: string;
  data: string;
  displayText?: string;
  style?: "primary" | "secondary" | "danger";
  color?: string;
  uri?: string;
}): Record<string, unknown> {
  if (options.uri) {
    return {
      type: "button",
      style: options.style === "primary" ? "primary" : "secondary",
      height: "sm",
      action: {
        type: "uri",
        label: options.label.slice(0, 20),
        uri: options.uri,
      },
    };
  }
  return {
    type: "button",
    style: options.style === "primary" ? "primary" : "secondary",
    color: options.color || (options.style === "secondary" ? undefined : COLORS.ink),
    height: "sm",
    action: {
      type: "postback",
      label: options.label.slice(0, 20),
      data: options.data.slice(0, 300),
      displayText: (options.displayText || options.label).slice(0, 300),
    },
  };
}

export function buildWorkoutReminderMessages(options: {
  title?: string;
  focus?: string;
  durationMinutes?: number;
  exerciseCount?: number;
  exercises?: Array<{ name: string; nameTh?: string; sets?: number | string; reps?: string | number }>;
  scheduledTime?: string;
  appUrl?: string;
  overdue?: boolean;
} = {}): LineMessagePayload[] {
  const title = options.title || "Workout วันนี้";
  const prefix = options.overdue ? "⚠️ เลยเวลาซ้อมแล้วครับ" : "🔔 ถึงเวลาออกกำลังกายแล้วครับ";
  const scheduleText = [
    options.scheduledTime ? `⏰ ${options.scheduledTime}` : "",
    options.durationMinutes != null ? `${options.durationMinutes} นาที` : "",
    options.focus || "",
    options.exerciseCount ? `${options.exerciseCount} ท่า` : "",
  ].filter(Boolean);

  const compactExercises = (options.exercises || []).slice(0, 4).map((e, idx) => ({
    type: "box",
    layout: "horizontal",
    spacing: "sm",
    contents: [
      text(`${idx + 1}.`, "xs", "bold", COLORS.green),
      text(`${e.nameTh || e.name}${e.sets && e.reps ? ` (${e.sets}x${e.reps})` : ""}`, "xs", "regular", COLORS.ink),
    ],
  }));

  const appUrl = options.appUrl || process.env.APP_URL || "";
  const calendarUri = appUrl ? `${appUrl.replace(/\/$/, "")}?tab=plan` : "";

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
        {
          type: "box",
          layout: "horizontal",
          contents: [
            text(options.overdue ? "⚠️ OVERDUE" : "🏋️ WORKOUT TIME", "xs", "bold", options.overdue ? COLORS.red : COLORS.green),
            ...(options.scheduledTime ? [text(options.scheduledTime, "xs", "bold", COLORS.muted)] : []),
          ],
        },
        text(title, "xl", "bold", COLORS.ink),
        ...(scheduleText.length
          ? [
              {
                type: "box",
                layout: "horizontal",
                spacing: "sm",
                contents: scheduleText.slice(0, 3).map((v) => pill(v, COLORS.greenSoft, COLORS.green)),
              },
            ]
          : []),
        ...(compactExercises.length
          ? [
              separator(),
              text("📋 ท่าซ้อมประจำวัน (ย่อ):", "xs", "bold", COLORS.muted),
              {
                type: "box",
                layout: "vertical",
                spacing: "xs",
                contents: compactExercises,
              },
            ]
          : []),
        separator(),
        text(
          options.overdue
            ? "ยังไม่ได้บันทึกผลการซ้อม เลือกรายงานผลให้โค้ชได้เลยครับ"
            : "พร้อมแล้วกดเริ่มซ้อม หรือรายงานผลให้โค้ชด้านล่างได้เลยครับ 💪",
          "sm",
          "regular",
          COLORS.muted
        ),
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      backgroundColor: COLORS.surface,
      paddingAll: "lg",
      spacing: "sm",
      contents: [
        actionButton({
          label: "เสร็จแล้ว 💪",
          data: "action=workout_done",
          displayText: "เสร็จแล้ว",
          style: "primary",
        }),
        actionButton({
          label: "เลื่อน ⏰",
          data: "action=workout_postpone",
          displayText: "เลื่อน",
          style: "secondary",
        }),
        actionButton({
          label: "วันนี้ไม่ไหว 🤍",
          data: "action=workout_cannot_do",
          displayText: "วันนี้ไม่ไหว",
          style: "secondary",
        }),
        calendarUri
          ? actionButton({
              label: "ดูปฏิทิน 📅",
              data: "action=view_calendar",
              uri: calendarUri,
              style: "secondary",
            })
          : actionButton({
              label: "ดูปฏิทิน 📅",
              data: "action=view_calendar",
              displayText: "ดูปฏิทิน",
              style: "secondary",
            }),
      ],
    },
  };

  return [
    { type: "text", text: `${prefix}\n🏋️ ${title}${options.scheduledTime ? ` (นัด: ${options.scheduledTime})` : ""}\nเลือกรายงานผลได้จากปุ่มด้านล่างครับ` },
    { type: "flex", altText: `${prefix}: ${title}`, contents: bubble },
  ];
}

export function buildRestDayReminderMessages(options: {
  userName?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  notes?: string;
  appUrl?: string;
} = {}): LineMessagePayload[] {
  const name = options.userName || "คุณ";
  const cal = options.calories || 1800;
  const pro = options.protein || 120;
  const carbs = options.carbs || 180;
  const fat = options.fat || 50;
  const appUrl = options.appUrl || process.env.APP_URL || "";
  const calendarUri = appUrl ? `${appUrl.replace(/\/$/, "")}?tab=plan` : "";

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
        text("🛌 REST & RECOVERY", "xs", "bold", COLORS.purple),
        text("วันนี้เป็นวันพักผ่อน", "xl", "bold", COLORS.ink),
        text("ให้กล้ามเนื้อได้ซ่อมแซมและฟื้นฟูเต็มที่ ไม่มีการซ้อมในวันนี้ครับ", "sm", "regular", COLORS.muted),
        separator(),
        text("🎯 เป้าหมายโภชนาการประจำวันพัก:", "sm", "bold", COLORS.ink),
        {
          type: "box",
          layout: "horizontal",
          spacing: "sm",
          contents: [
            pill(`🔥 ${cal.toLocaleString()} kcal`, COLORS.amberSoft, COLORS.amber),
            pill(`🥩 P: ${pro}g`, COLORS.greenSoft, COLORS.green),
            pill(`🍚 C: ${carbs}g`, COLORS.blueSoft, COLORS.blue),
            pill(`🥑 F: ${fat}g`, COLORS.purpleSoft, COLORS.purple),
          ],
        },
        separator(),
        text(
          options.notes || "ดื่มน้ำให้เพียงพอ เน้นเดินเบาๆ ยืดเหยียด และคุมอาหารให้ตรงเป้าหมายครับ พักผ่อนให้สบายใจเลยครับ 🌟",
          "xs",
          "regular",
          COLORS.muted
        ),
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      backgroundColor: COLORS.surface,
      paddingAll: "lg",
      spacing: "sm",
      contents: [
        calendarUri
          ? actionButton({
              label: "ดูปฏิทิน 📅",
              data: "action=view_calendar",
              uri: calendarUri,
              style: "secondary",
            })
          : actionButton({
              label: "ดูปฏิทิน 📅",
              data: "action=view_calendar",
              displayText: "ดูปฏิทิน",
              style: "secondary",
            }),
      ],
    },
  };

  return [
    { type: "text", text: `🛌 สวัสดีครับคุณ ${name} วันนี้เป็นวันพักผ่อน (Rest Day) ไม่มีซ้อมครับ\n\n🎯 เป้าโภชนาการวันนี้: ${cal} kcal | P: ${pro}g | C: ${carbs}g | F: ${fat}g\nพักผ่อนและเติมสารอาหารให้กล้ามเนื้อฟื้นตัวเต็มที่ครับ 🌟` },
    { type: "flex", altText: "🛌 วันนี้เป็นวันพักผ่อน (Rest Day)", contents: bubble },
  ];
}

export function buildPostponeOptionsMessages(options: {
  appUrl?: string;
} = {}): LineMessagePayload[] {
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
        text("⏰ POSTPONE WORKOUT", "xs", "bold", COLORS.amber),
        text("สะดวกเลื่อนไปเวลาไหนครับ?", "lg", "bold", COLORS.ink),
        text("เลือกเวลาที่ต้องการให้โค้ชเตือนใหม่ในวันนี้ได้เลย หรือพิมพ์บอกเวลาได้ครับ (เช่น ขอเลื่อนไป 19:30 น.)", "sm", "regular", COLORS.muted),
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      backgroundColor: COLORS.surface,
      paddingAll: "lg",
      spacing: "sm",
      contents: [
        actionButton({
          label: "+1 ชั่วโมง ⏱️",
          data: "action=workout_snooze_mins&mins=60",
          displayText: "ขอเลื่อน 1 ชั่วโมง",
          style: "primary",
        }),
        actionButton({
          label: "+2 ชั่วโมง ⏱️",
          data: "action=workout_snooze_mins&mins=120",
          displayText: "ขอเลื่อน 2 ชั่วโมง",
          style: "secondary",
        }),
        actionButton({
          label: "ตอนเย็น 19:00 น. 🌇",
          data: "action=workout_snooze_time&time=19:00",
          displayText: "ขอเลื่อนเป็น 19:00 น.",
          style: "secondary",
        }),
        actionButton({
          label: "ตอนค่ำ 20:30 น. 🌙",
          data: "action=workout_snooze_time&time=20:30",
          displayText: "ขอเลื่อนเป็น 20:30 น.",
          style: "secondary",
        }),
      ],
    },
  };

  return [
    { type: "text", text: "สะดวกเลื่อนไปเวลาไหนของวันนี้ดีครับ? เลือกเวลาด้านล่างได้เลย หรือพิมพ์บอกเวลาที่สะดวกได้ครับ" },
    { type: "flex", altText: "⏰ เลื่อนเวลาซ้อมวันนี้", contents: bubble },
  ];
}

/**
 * สรุปสั้นๆ ทุกเช้าเวลา 08:00 น. ผ่าน LINE
 * เช่น "สวัสดีตอนเช้าครับคุณ สมชาย! วันนี้คุณมีตาราง Upper Body นะครับ เป้าหมายก้าวเดิน 8,000 ก้าว โค้ชพร้อมเสมอ!"
 */
export function buildMorningBriefingMessages(options: {
  userName?: string;
  workoutTitle?: string;
  workoutFocus?: string;
  targetSteps?: number;
  targetCalories?: number;
  durationMinutes?: number;
  isRestDay?: boolean;
  appUrl?: string;
} = {}): LineMessagePayload[] {
  const name = options.userName?.trim() || "คนเก่ง";
  const isRest = Boolean(options.isRestDay);
  const workoutTitle = options.workoutTitle || (isRest ? "พักผ่อน (Active Recovery / Rest Day)" : "Workout ประจำวัน");
  const targetSteps = options.targetSteps || 8000;
  const targetCalories = options.targetCalories || 2000;
  const duration = options.durationMinutes || 45;

  const introText = isRest
    ? `🌅 สวัสดีตอนเช้าครับคุณ ${name}! 🧘‍♂️\n\nวันนี้เป็นวันพักผ่อน (Rest Day) กล้ามเนื้อของคุณกำลังซ่อมแซมและเติบโต เน้นเดินเบาๆ ยืดเหยียด และทานโปรตีนให้เพียงพอครับ\n\n🎯 เป้าหมายก้าวเดินวันนี้: ${targetSteps.toLocaleString()} ก้าว\n🔥 เป้าหมายพลังงาน: ${targetCalories.toLocaleString()} kcal\n\nโค้ชพร้อมซัพพอร์ตตลอดวันครับ! 🌟`
    : `🌅 สวัสดีตอนเช้าครับคุณ ${name}! FitCoach AI พร้อมลุยกับคุณวันนี้แล้วครับ 🎯\n\nวันนี้คุณมีตาราง ${workoutTitle} นะครับ เป้าหมายก้าวเดิน ${targetSteps.toLocaleString()} ก้าว โค้ชพร้อมเสมอ! 💪`;

  const badges = [
    isRest ? "พักผ่อนฟื้นฟู" : options.workoutFocus || "Upper Body",
    `เป้า ${targetSteps.toLocaleString()} ก้าว`,
    `เป้า ${targetCalories.toLocaleString()} kcal`,
  ];

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
        {
          type: "box",
          layout: "horizontal",
          contents: [
            text("🌅 MORNING BRIEFING", "xs", "bold", COLORS.green),
            text("08:00 น.", "xs", "bold", COLORS.muted),
          ],
        },
        text("เริ่มต้นวันใหม่ด้วยพลัง! 🚀", "lg", "bold", COLORS.ink),
        text(workoutTitle, "xl", "bold", COLORS.green),
        {
          type: "box",
          layout: "horizontal",
          spacing: "sm",
          margin: "sm",
          contents: badges.slice(0, 3).map((b) => pill(b, COLORS.greenSoft, COLORS.green)),
        },
        separator(),
        text(
          isRest
            ? "วันพักผ่อนมีความสำคัญไม่แพ้วันฝึก ช่วยให้กล้ามเนื้อฟื้นฟูได้อย่างสมบูรณ์ เติมน้ำและทานอาหารที่มีประโยชน์นะครับ"
            : `ตารางฝึกใช้เวลาประมาณ ${duration} นาที โค้ชแนะนำเริ่มฝึกในช่วงเวลาที่คุณสะดวก ดื่มน้ำให้เพียงพอก่อนออกกำลังกายครับ`,
          "sm",
          "regular",
          COLORS.muted
        ),
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      backgroundColor: COLORS.surface,
      paddingAll: "lg",
      spacing: "sm",
      contents: [
        safeAction({ id: "start_workout", label: "เริ่มซ้อมเลย 💪", actionType: "start_workout", style: "primary" }),
        safeAction({ id: "view_plan", label: "ดูตารางซ้อมวันนี้ 📋", actionType: "view_plan", style: "secondary" }),
        safeAction({ id: "log_food", label: "บันทึกอาหารเช้า 🥗", actionType: "log_food", style: "secondary" }),
      ],
    },
  };

  return [
    { type: "text", text: introText },
    { type: "flex", altText: `🌅 Morning Briefing: วันนี้มีตาราง ${workoutTitle}`, contents: bubble },
  ];
}

/**
 * สรุปตอนค่ำเวลา 20:00 น.
 * ประเมินว่าวันนี้ขาดแคลอรี่หรือโปรตีนเท่าไหร่ และควรนอนกี่โมง
 */
export function buildNightRecapMessages(options: {
  userName?: string;
  targetCalories?: number;
  currentCalories?: number;
  targetProtein?: number;
  currentProtein?: number;
  targetSteps?: number;
  currentSteps?: number;
  workoutCompleted?: boolean;
  targetSleepHours?: string;
  recommendedBedtime?: string;
} = {}): LineMessagePayload[] {
  const name = options.userName?.trim() || "คุณ";
  const targetCal = options.targetCalories || 2000;
  const currentCal = options.currentCalories || 0;
  const calDiff = targetCal - currentCal;

  const targetPro = options.targetProtein || 140;
  const currentPro = options.currentProtein || 0;
  const proDiff = targetPro - currentPro;

  const targetSteps = options.targetSteps || 8000;
  const currentSteps = options.currentSteps || 0;
  const workoutDone = Boolean(options.workoutCompleted);
  const bedtime = options.recommendedBedtime || "22:30 - 23:00 น.";

  // สรุปสถานะแคลอรี่
  let calSummary = "";
  if (calDiff > 250) {
    calSummary = `🔥 แคลอรี่: วันนี้ขาดอีกประมาณ ${calDiff.toLocaleString()} kcal (${currentCal.toLocaleString()}/${targetCal.toLocaleString()} kcal) แนะนำเติมคาร์บเชิงซ้อนหรือโปรตีนเบาๆ ก่อนนอน`;
  } else if (calDiff < -250) {
    calSummary = `🔥 แคลอรี่: วันนี้ทานเกินเป้าไป ${Math.abs(calDiff).toLocaleString()} kcal (${currentCal.toLocaleString()}/${targetCal.toLocaleString()} kcal) วันพรุ่งนี้เน้นก้าวเดินเพิ่มขึ้นได้ครับ`;
  } else {
    calSummary = `🔥 แคลอรี่: ได้ ${currentCal.toLocaleString()}/${targetCal.toLocaleString()} kcal ตรงตามเป้าหมาย ยอดเยี่ยมมากครับ! 🎯`;
  }

  // สรุปสถานะโปรตีน
  let proSummary = "";
  if (proDiff > 20) {
    proSummary = `🥩 โปรตีน: ยังขาดอีก ${proDiff}g (${currentPro}/${targetPro}g) แนะนำเสริมไข่ต้ม นมถั่วเหลือง หรือเวย์โปรตีนก่อนนอนเพื่อซ่อมแซมกล้ามเนื้อ`;
  } else {
    proSummary = `🥩 โปรตีน: บรรลุเป้าหมาย (${currentPro}/${targetPro}g) กล้ามเนื้อพร้อมเติบโตและซ่อมแซมเต็มที่! 💪`;
  }

  // สรุปการออกกำลังกาย & ก้าวเดิน
  const workoutSummary = workoutDone
    ? `✅ การฝึกซ้อม: ทำสำเร็จตามแผนเรียบร้อยแล้ว 🔥`
    : `⚠️ การฝึกซ้อม: วันนี้ยังไม่ได้บันทึกเสร็จ หากเหนื่อยล้า พักผ่อนให้เต็มที่แล้วลุยต่อวันพรุ่งนี้ครับ`;

  const stepsSummary = `🚶‍♂️ ก้าวเดิน: ${currentSteps.toLocaleString()} / ${targetSteps.toLocaleString()} ก้าว (${Math.round((currentSteps / Math.max(1, targetSteps)) * 100)}%)`;

  const sleepAdvice = `😴 การพักผ่อน: แนะนำเข้านอนเวลา ${bedtime} เพื่อให้ได้การนอนหลับที่มีคุณภาพ ร่างกายจะหลั่ง Growth Hormone ซ่อมแซมกล้ามเนื้อและลดความเครียดสะสมครับ`;

  const fullText = [
    `🌙 สรุปผลประจำวัน FitCoach Night Recap (20:00 น.)`,
    `สวัสดีครับคุณ ${name} สรุปภาพรวมร่างกายของคุณวันนี้:`,
    ``,
    calSummary,
    proSummary,
    stepsSummary,
    workoutSummary,
    ``,
    sleepAdvice,
  ].join("\n");

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
        {
          type: "box",
          layout: "horizontal",
          contents: [
            text("🌙 NIGHT RECAP", "xs", "bold", COLORS.purple),
            text("20:00 น.", "xs", "bold", COLORS.muted),
          ],
        },
        text("สรุปผลสุขภาพประจำวัน 📊", "lg", "bold", COLORS.ink),
        {
          type: "box",
          layout: "horizontal",
          spacing: "sm",
          margin: "sm",
          contents: [
            pill(calDiff > 200 ? `ขาด ${calDiff} kcal` : calDiff < -200 ? `เกิน ${Math.abs(calDiff)} kcal` : "แคลอรี่พอดี", calDiff > 200 ? COLORS.amberSoft : COLORS.greenSoft, calDiff > 200 ? COLORS.amber : COLORS.green),
            pill(proDiff > 15 ? `ขาดโปรตีน ${proDiff}g` : "โปรตีนครบ", proDiff > 15 ? COLORS.redSoft : COLORS.greenSoft, proDiff > 15 ? COLORS.red : COLORS.green),
            pill(workoutDone ? "ซ้อมสำเร็จ ✓" : "ยังไม่เสร็จ", workoutDone ? COLORS.greenSoft : COLORS.soft, workoutDone ? COLORS.green : COLORS.muted),
          ],
        },
        separator(),
        {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [
            text(`• โภชนาการ: ${calSummary.replace("🔥 แคลอรี่: ", "")}`, "xs", "regular", COLORS.ink),
            text(`• โปรตีน: ${proSummary.replace("🥩 โปรตีน: ", "")}`, "xs", "regular", COLORS.ink),
            text(`• ก้าวเดิน: ${currentSteps.toLocaleString()} / ${targetSteps.toLocaleString()} ก้าว`, "xs", "regular", COLORS.muted),
            text(`• นอนหลับ: แนะนำเข้านอน ${bedtime}`, "xs", "bold", COLORS.purple),
          ],
        },
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      backgroundColor: COLORS.surface,
      paddingAll: "lg",
      spacing: "sm",
      contents: [
        safeAction({ id: "log_food", label: "บันทึกอาหารเพิ่มเติม 🥗", actionType: "log_food", style: "primary" }),
        safeAction({ id: "view_plan", label: "ดูภาพรวมวันนี้ 📱", actionType: "view_plan", style: "secondary" }),
      ],
    },
  };

  return [
    { type: "text", text: fullText },
    { type: "flex", altText: `🌙 Night Recap 20:00 น. — สรุปแคลอรี่ โปรตีน และคำแนะนำการนอน`, contents: bubble },
  ];
}

export function buildLineReplyMessages(response: CoachResponse): LineMessagePayload[] {
  if (response.type === "chat" && !response.actions?.length) return [{ type: "text", text: response.message.slice(0, 5000) }];
  const messages: LineMessagePayload[] = [];
  if (response.message.trim()) messages.push({ type: "text", text: response.message.slice(0, 5000) });
  messages.push(buildLineFlexMessage(response));
  return messages.slice(0, 5);
}
