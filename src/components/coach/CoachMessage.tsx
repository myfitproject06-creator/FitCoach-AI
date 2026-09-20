import React from "react";
import {
  Activity,
  Bell,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Dumbbell,
  Flame,
  HeartPulse,
  Moon,
  Play,
  RotateCcw,
  Salad,
  Sparkles,
  Target,
  Utensils,
} from "lucide-react";
import { CoachAction, CoachActionType, CoachResponse } from "../../types";

interface CoachMessageProps {
  response?: CoachResponse;
  fallbackText: string;
  timestamp?: string;
  onAction?: (action: CoachAction) => void;
}

const actionIcon = (actionType: CoachActionType) => {
  switch (actionType) {
    case "start_workout":
      return <Play className="w-3.5 h-3.5" />;
    case "snooze":
      return <Clock3 className="w-3.5 h-3.5" />;
    case "cannot_do":
      return <RotateCcw className="w-3.5 h-3.5" />;
    case "log_food":
      return <Utensils className="w-3.5 h-3.5" />;
    case "confirm":
      return <CheckCircle2 className="w-3.5 h-3.5" />;
    default:
      return <ChevronRight className="w-3.5 h-3.5" />;
  }
};

const actionClass = (style?: CoachAction["style"]) => {
  if (style === "danger") {
    return "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100";
  }
  if (style === "secondary") {
    return "bg-white text-slate-700 border-slate-200 hover:bg-slate-50";
  }
  return "bg-slate-900 text-white border-slate-900 hover:bg-slate-800";
};

const typeMeta = (type: CoachResponse["type"]) => {
  switch (type) {
    case "workout":
    case "workout_reminder":
    case "adapted_plan":
      return { icon: <Dumbbell className="w-4 h-4" />, label: "การฝึก" };
    case "nutrition":
    case "meal_recorded":
      return { icon: <Salad className="w-4 h-4" />, label: "โภชนาการ" };
    case "recovery":
      return { icon: <Moon className="w-4 h-4" />, label: "การฟื้นตัว" };
    case "daily_summary":
      return { icon: <Activity className="w-4 h-4" />, label: "สรุปวันนี้" };
    case "new_program":
      return { icon: <Target className="w-4 h-4" />, label: "โปรแกรมใหม่" };
    case "penalty_notice":
      return { icon: <Bell className="w-4 h-4" />, label: "แจ้งเตือน" };
    default:
      return { icon: <Sparkles className="w-4 h-4" />, label: "FitCoach" };
  }
};

function InfoPill({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
      {icon}
      {children}
    </span>
  );
}

function WorkoutCard({ response }: { response: CoachResponse }) {
  const d = response.data;
  const exercises = d?.exercises || [];

  return (
    <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="bg-slate-900 px-4 py-3 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300">
              {d?.title || "Workout Plan"}
            </p>
            <h4 className="mt-0.5 text-sm font-bold">{d?.titleTh || d?.focus || "โปรแกรมวันนี้"}</h4>
          </div>
          <Dumbbell className="mt-0.5 h-5 w-5 text-emerald-300" />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {d?.durationMinutes != null && <InfoPill icon={<Clock3 className="h-3 w-3" />}>{d.durationMinutes} นาที</InfoPill>}
          {d?.intensity && <InfoPill>{d.intensity}</InfoPill>}
          {d?.focus && <InfoPill>{d.focus}</InfoPill>}
        </div>
      </div>

      {d?.summary && <p className="px-4 pt-3 text-[11px] leading-relaxed text-slate-600">{d.summary}</p>}

      {exercises.length > 0 && (
        <div className="divide-y divide-slate-100 px-4">
          {exercises.map((exercise, index) => (
            <div key={`${exercise.name || "exercise"}-${index}`} className="py-3">
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-[10px] font-bold text-emerald-700">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800">{exercise.nameTh || exercise.name}</p>
                  {exercise.nameTh && <p className="mt-0.5 text-[9px] text-slate-400">{exercise.name}</p>}
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {exercise.sets != null && <InfoPill>{exercise.sets} เซ็ต</InfoPill>}
                    {exercise.reps && <InfoPill>{exercise.reps} ครั้ง</InfoPill>}
                    {exercise.restSeconds != null && <InfoPill>{exercise.restSeconds}s พัก</InfoPill>}
                  </div>
                  {exercise.note && <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">{exercise.note}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {d?.tags && d.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-3">
          {d.tags.map((tag, tagIdx) => (
            <span key={`workout-tag-${tag || "tag"}-${tagIdx}`} className="text-[9px] text-slate-400">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function DetailCard({ response }: { response: CoachResponse }) {
  const d = response.data;
  const type = response.type;

  const icon = type === "nutrition" || type === "meal_recorded"
    ? <Salad className="h-5 w-5" />
    : type === "recovery"
      ? <HeartPulse className="h-5 w-5" />
      : type === "daily_summary"
        ? <Activity className="h-5 w-5" />
        : <Sparkles className="h-5 w-5" />;

  return (
    <div className="mt-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">{icon}</div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{typeMeta(type).label}</p>
          <h4 className="text-sm font-bold text-slate-800">{d?.titleTh || d?.title || "ข้อมูลจากโค้ช"}</h4>
        </div>
      </div>

      {d?.summary && <p className="mt-3 text-[11px] leading-relaxed text-slate-600">{d.summary}</p>}
      {d?.reason && <p className="mt-2 rounded-xl bg-slate-50 p-2.5 text-[10px] leading-relaxed text-slate-500">เหตุผล: {d.reason}</p>}

      <div className="mt-3 grid grid-cols-2 gap-2">
        {d?.calories != null && <div className="rounded-xl bg-orange-50 p-2.5"><p className="text-[9px] text-orange-500">พลังงาน</p><p className="text-sm font-bold text-slate-800">{d.calories} kcal</p></div>}
        {d?.proteinGrams != null && <div className="rounded-xl bg-rose-50 p-2.5"><p className="text-[9px] text-rose-500">โปรตีน</p><p className="text-sm font-bold text-slate-800">{d.proteinGrams} g</p></div>}
        {d?.sleepHours != null && <div className="rounded-xl bg-indigo-50 p-2.5"><p className="text-[9px] text-indigo-500">การนอน</p><p className="text-sm font-bold text-slate-800">{d.sleepHours} ชม.</p></div>}
        {d?.recoveryScore != null && <div className="rounded-xl bg-emerald-50 p-2.5"><p className="text-[9px] text-emerald-600">Recovery</p><p className="text-sm font-bold text-slate-800">{d.recoveryScore}%</p></div>}
      </div>

      {(d?.reminderDate || d?.reminderTime) && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-50 p-2.5 text-[10px] font-semibold text-amber-800">
          <CalendarClock className="h-4 w-4" />
          {d.reminderDate || "วันนี้"} {d.reminderTime || ""}
        </div>
      )}
    </div>
  );
}

export const CoachMessage: React.FC<CoachMessageProps> = ({
  response,
  fallbackText,
  timestamp,
  onAction,
}) => {
  if (!response) {
    return <p className="whitespace-pre-line">{fallbackText}</p>;
  }

  const meta = typeMeta(response.type);
  const showWorkout = ["workout", "workout_reminder", "adapted_plan"].includes(response.type);
  const showDetail = ["nutrition", "recovery", "daily_summary", "new_program", "meal_recorded", "penalty_notice"].includes(response.type);

  return (
    <>
      <p className="whitespace-pre-line">{response.message || fallbackText}</p>

      {showWorkout && <WorkoutCard response={response} />}
      {showDetail && <DetailCard response={response} />}

      {response.type === "chat" && response.data?.tags && response.data.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {response.data.tags.map((tag, tagIdx) => (
            <InfoPill key={`chat-tag-${tag || "tag"}-${tagIdx}`}>{tag}</InfoPill>
          ))}
        </div>
      )}

      {response.actions && response.actions.length > 0 && (
        <div className="mt-3 grid gap-2">
          {response.actions.map((action, actionIdx) => {
            const actionKey = action.id
              ? `action-${action.id}-${actionIdx}`
              : `action-${action.actionType || "btn"}-${action.label || ""}-${actionIdx}`;
            return (
              <button
                key={actionKey}
                type="button"
                onClick={() => onAction?.(action)}
                className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-[10px] font-bold transition-colors ${actionClass(action.style)}`}
              >
                {actionIcon(action.actionType)}
                {action.label}
              </button>
            );
          })}
        </div>
      )}

      {timestamp && (
        <span className="text-[9px] block text-right mt-1 text-slate-400">{timestamp}</span>
      )}
    </>
  );
};
