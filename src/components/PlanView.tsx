import React, { useState } from "react";
import {
  Calendar,
  Sparkles,
  Dumbbell,
  Clock,
  Flame,
  CheckCircle2,
  ChevronRight,
  SlidersHorizontal,
  Layers,
  Zap,
} from "lucide-react";
import { WorkoutPlan, WorkoutDay } from "../types";

interface PlanViewProps {
  workout: WorkoutPlan;
  onSelectDay: (dayId: string) => void;
  onOpenAdaptiveModal: () => void;
  onOpenPlan3Months: () => void;
}

export const PlanView: React.FC<PlanViewProps> = ({
  workout,
  onSelectDay,
  onOpenAdaptiveModal,
  onOpenPlan3Months,
}) => {
  const days = workout.days || [];
  const [selectedDayId, setSelectedDayId] = useState<string>(
    days[0]?.id || "day-1"
  );

  const currentDay =
    days.find((d) => d.id === selectedDayId) || days[0];

  return (
    <div className="space-y-4 pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-5 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
            <Sparkles className="w-3 h-3" />
            <span>AI PROGRESSIVE OVERLOAD PLAN</span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            {workout.name || workout.titleTh || workout.title || "โปรแกรมฝึก Hypertrophy V-Taper"}
          </h2>
          <p className="text-xs text-slate-300">
            สัปดาห์ที่ {workout.currentWeek || 2} จาก {workout.totalWeeks || 12} สัปดาห์ • แบ่งการซ้อมแบบสมดุล
          </p>

          <div className="pt-2 flex flex-wrap gap-2">
            <button
              onClick={onOpenPlan3Months}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center gap-1 shadow-sm active:scale-95"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>ดูแผนล่วงหน้า 3 เดือน</span>
            </button>
            <button
              onClick={onOpenAdaptiveModal}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs border border-slate-700 transition-colors flex items-center gap-1 active:scale-95"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
              <span>ขอปรับตารางด่วนตามสภาพร่างกาย</span>
            </button>
          </div>
        </div>
      </div>

      {/* Week Days Horizontal Scroll */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {days.map((d, index) => {
          const isSelected = d.id === selectedDayId;
          return (
            <button
              key={d.id}
              onClick={() => {
                setSelectedDayId(d.id);
                onSelectDay(d.id);
              }}
              className={`p-3 rounded-2xl border text-left min-w-[125px] flex-1 transition-all shrink-0 ${
                isSelected
                  ? "border-emerald-500 bg-emerald-50/70 shadow-sm"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  {d.dayName}
                </span>
                {d.isCompleted && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                )}
              </div>
              <p
                className={`text-xs font-bold truncate ${
                  isSelected ? "text-emerald-950" : "text-slate-800"
                }`}
              >
                {d.focus}
              </p>
              <span className="text-[10px] text-slate-500 mt-1 block">
                {d.isRestDay ? "วันพักผ่อน" : `${d.exercises.length} ท่าซ้อม`}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Day Exercise Details */}
      {currentDay && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                {currentDay.dayName}
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                {currentDay.focus}
              </h3>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {currentDay.estimatedDurationMinutes || 45} นาที
              </span>
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                {currentDay.estimatedCalories || 320} kcal
              </span>
            </div>
          </div>

          {currentDay.isRestDay ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
              <span className="text-3xl">🧘</span>
              <h4 className="text-sm font-bold text-slate-800">
                วันนี้คือวันพักผ่อนของกล้ามเนื้อ (Active Recovery)
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                กล้ามเนื้อเติบโตและซ่อมแซมตอนเราพักผ่อน แนะนำให้เดินเบาๆ ยืดเหยียด และนอนหลับให้เต็มอิ่ม 7-8 ชม.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentDay.exercises.map((ex, idx) => (
                <div
                  key={ex.id || idx}
                  className="p-3.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        {ex.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {ex.sets} เซ็ต × {ex.reps} ครั้ง • พัก {ex.restSeconds || 60} วิ
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded-full font-medium shrink-0">
                    {ex.targetMuscle || "กล้ามเนื้อมัดหลัก"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
