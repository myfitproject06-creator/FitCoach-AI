import React, { useState } from "react";
import {
  Calendar,
  Clock,
  Dumbbell,
  CheckCircle2,
  ChevronRight,
  Flame,
  Utensils,
  Moon,
  Sparkles,
} from "lucide-react";
import { UserProfile, WorkoutPlan, NutritionData, RecoveryData, Plan3MonthsData } from "../types";
import { weeklyScheduleDays } from "../data/mockData";

interface PlanViewProps {
  profile: UserProfile;
  workout: WorkoutPlan;
  nutrition: NutritionData;
  recovery: RecoveryData;
  activePlan3Months?: Plan3MonthsData | null;
  onOpenPlanModal?: () => void;
  onSelectTodayWorkout: () => void;
  onOpenAdapt: () => void;
}

export const PlanView: React.FC<PlanViewProps> = ({
  profile,
  workout,
  nutrition,
  recovery,
  activePlan3Months,
  onOpenPlanModal,
  onSelectTodayWorkout,
  onOpenAdapt,
}) => {
  const [selectedDay, setSelectedDay] = useState("WED");

  // Dynamic roadmap duration label
  const durationLabel = activePlan3Months?.totalDuration || "12 สัปดาห์ (3 เดือน)";
  const planTitle = activePlan3Months?.goalName || profile.goal;
  const phaseCount = activePlan3Months?.phases.length || 3;

  return (
    <div className="space-y-4 pb-24">
      {/* Personalized Roadmap Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-md border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            PERSONALIZED TRANSFORMATION ROADMAP
          </span>
          <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-medium">
            {durationLabel}
          </span>
        </div>

        <div>
          <h2 className="text-base font-bold text-white">
            {planTitle}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {activePlan3Months?.phases?.[0]?.title || "เฟสปัจจุบัน: Hypertrophy & Power (สร้างมวลกล้ามเนื้อและรูปร่างสมส่วน)"}
          </p>
        </div>

        {/* Progress line */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>ความคืบหน้าเฟส (1 จาก {phaseCount} เฟส)</span>
            <span className="text-emerald-400 font-semibold">{Math.round(100 / phaseCount)}%</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.round(100 / phaseCount)}%` }}
            />
          </div>
        </div>

        {activePlan3Months && onOpenPlanModal && (
          <div className="pt-2 border-t border-slate-800 flex justify-end">
            <button
              onClick={onOpenPlanModal}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
            >
              <span>ดูรายละเอียด Roadmap ฉบับเต็ม</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Weekly Schedule Days (Mon - Sun) */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-700" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              ตารางการฝึกสัปดาห์นี้
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">4 วันฝึก / 3 วันพัก</span>
        </div>

        {/* Days Horizontal selector */}
        <div className="grid grid-cols-7 gap-1">
          {weeklyScheduleDays.map((d) => {
            const isSelected = selectedDay === d.day;
            return (
              <button
                key={d.day}
                onClick={() => setSelectedDay(d.day)}
                className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center transition-all ${
                  isSelected
                    ? "bg-slate-900 text-white shadow-sm scale-105"
                    : d.isToday
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span className="text-[10px] font-semibold">{d.label}</span>
                <span className="text-xs font-black mt-0.5">
                  {d.completed ? "✓" : d.isToday ? "วันนี้" : "—"}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Day Details Card */}
        {(() => {
          const dayInfo = weeklyScheduleDays.find((d) => d.day === selectedDay);
          return (
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 mt-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">
                    {dayInfo?.label} · {dayInfo?.type === "train" ? "วันฝึกกล้ามเนื้อ" : "วันฟื้นฟู"}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                    {dayInfo?.title}
                  </h4>
                  <p className="text-xs text-slate-500">{dayInfo?.duration}</p>
                </div>

                {dayInfo?.isToday ? (
                  <button
                    onClick={onSelectTodayWorkout}
                    className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm"
                  >
                    ดูท่าฝึกวันนี้
                  </button>
                ) : dayInfo?.completed ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-100/70 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" /> ฝึกสำเร็จแล้ว
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 font-medium">ตามกำหนดการ</span>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Nutrition & Recovery Blueprint Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Nutrition Blueprint */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-emerald-600">
            <Utensils className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">
              เป้าหมายโภชนาการ
            </h4>
          </div>
          <p className="text-base font-black text-slate-900">
            {nutrition.targetCalories.toLocaleString()} kcal / วัน
          </p>
          <div className="text-xs text-slate-600 space-y-1 pt-1">
            <div className="flex justify-between">
              <span>โปรตีน:</span>
              <span className="font-semibold text-slate-900">{nutrition.targetProtein}g</span>
            </div>
            <div className="flex justify-between">
              <span>คาร์โบไฮเดรต:</span>
              <span className="font-semibold text-slate-900">{nutrition.targetCarbs}g</span>
            </div>
            <div className="flex justify-between">
              <span>ไขมันดี:</span>
              <span className="font-semibold text-slate-900">{nutrition.targetFat}g</span>
            </div>
          </div>
        </div>

        {/* Recovery Blueprint */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-indigo-600">
            <Moon className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">
              เป้าหมายการฟื้นตัว
            </h4>
          </div>
          <p className="text-base font-black text-slate-900">
            {recovery.targetSleepHours}
          </p>
          <div className="text-xs text-slate-600 space-y-1 pt-1">
            <div className="flex justify-between">
              <span>เวลาเข้านอนเป้าหมาย:</span>
              <span className="font-semibold text-slate-900">22:45 น.</span>
            </div>
            <div className="flex justify-between">
              <span>คุณภาพการนอนเป้าหมาย:</span>
              <span className="font-semibold text-emerald-600">คุณภาพดี</span>
            </div>
            <div className="flex justify-between">
              <span>การฟื้นฟูกล้ามเนื้อ:</span>
              <span className="font-semibold text-slate-900">Active Recovery</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
