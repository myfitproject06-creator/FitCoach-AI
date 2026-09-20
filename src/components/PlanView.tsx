import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Dumbbell,
  ChevronRight,
  Flame,
  ArrowRight,
  Sparkles,
  SlidersHorizontal,
  Target,
  ListTodo,
} from "lucide-react";
import { WorkoutPlan, Plan3MonthsData } from "../types";
import { DailyChecklistCalendar } from "./DailyChecklistCalendar";

interface PlanViewProps {
  workout: WorkoutPlan;
  activePlan3Months?: Plan3MonthsData | null;
  onOpenPlan3Months?: () => void;
  onOpenWorkout: () => void;
  onOpenAdapt: () => void;
  onOpenLine: () => void;
}

export const PlanView: React.FC<PlanViewProps> = ({
  workout,
  activePlan3Months,
  onOpenPlan3Months,
  onOpenWorkout,
  onOpenAdapt,
  onOpenLine,
}) => {
  const [viewMode, setViewMode] = useState<"calendar" | "weekly">("calendar");
  const now = new Date();
  const currentDayOfWeek = (now.getDay() + 6) % 7; // 0 = Mon, 6 = Sun
  const [selectedDay, setSelectedDay] = useState<number>(currentDayOfWeek);

  // Compute 7 days of the current week (Mon -> Sun)
  const monday = new Date(now);
  monday.setDate(now.getDate() - currentDayOfWeek);

  const dayNames = ["จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส.", "อา."];
  const fullDayNames = ["วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์", "วันเสาร์", "วันอาทิตย์"];
  const monthNames = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

  const weekSchedule = dayNames.map((d, i) => {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + i);
    const isToday = i === currentDayOfWeek;
    return {
      day: d,
      fullName: fullDayNames[i],
      date: dayDate.getDate().toString(),
      month: monthNames[dayDate.getMonth()],
      isToday,
      isRest: i === 3 || i === 6,
      name: isToday ? (workout.titleTh || workout.title || "การฝึกประจำวัน") : (i === 3 || i === 6 ? "พักผ่อน / ฟื้นตัว" : "โปรแกรมการฝึก"),
      completed: isToday ? (workout.isCompleted || false) : false,
    };
  });

  return (
    <div className="space-y-4 pb-24">
      {/* Top Navigation Switcher: Calendar vs Weekly */}
      <div className="bg-slate-200/80 p-1 rounded-2xl flex gap-1 border border-slate-200 shadow-xs">
        <button
          onClick={() => setViewMode("calendar")}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            viewMode === "calendar"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <CalendarIcon className={`w-4 h-4 ${viewMode === "calendar" ? "text-emerald-600" : "text-slate-400"}`} />
          <span>ปฏิทินเช็คลิสต์ตลอดโปรแกรม</span>
        </button>

        <button
          onClick={() => setViewMode("weekly")}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            viewMode === "weekly"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Dumbbell className={`w-4 h-4 ${viewMode === "weekly" ? "text-emerald-600" : "text-slate-400"}`} />
          <span>ตารางฝึกประจำสัปดาห์</span>
        </button>
      </div>

      {viewMode === "calendar" ? (
        <DailyChecklistCalendar
          onSelectDayForWorkout={() => setViewMode("weekly")}
          onOpenLine={onOpenLine}
        />
      ) : (
        <>
          {/* Header */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  WEEKLY TRAINING SCHEDULE
                </span>
                <h2 className="text-lg font-bold text-slate-900">
                  ตารางฝึกประจำสัปดาห์
                </h2>
              </div>
              <button
                onClick={onOpenAdapt}
                className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-full border border-emerald-200 transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>ปรับแผนด่วน</span>
              </button>
            </div>

        {/* Horizontal 7-Day Selector Bar */}
        <div className="grid grid-cols-7 gap-1.5">
          {weekSchedule.map((item, idx) => {
            const isSelected = selectedDay === idx;
            return (
              <button
                key={idx}
                onClick={() => setSelectedDay(idx)}
                className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all ${
                  isSelected
                    ? "bg-slate-900 text-white shadow-md"
                    : item.isToday
                    ? "bg-emerald-50 text-slate-800 border border-emerald-300"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span className={`text-[10px] ${isSelected ? "text-slate-300" : "text-slate-400"}`}>
                  {item.day}
                </span>
                <span className="text-sm font-bold my-0.5">{item.date}</span>
                {item.completed ? (
                  <CheckCircle2 className={`w-3.5 h-3.5 ${isSelected ? "text-emerald-400" : "text-emerald-600"}`} />
                ) : item.isRest ? (
                  <span className="text-[9px] text-slate-400">พัก</span>
                ) : (
                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-emerald-400" : "bg-slate-300"}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3 Months Transformation Plan Card */}
      {activePlan3Months ? (
        <div className="bg-gradient-to-br from-emerald-900 via-slate-900 to-teal-950 text-white rounded-3xl p-5 shadow-lg border border-emerald-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-500/20 text-emerald-300 rounded-xl">
                <Target className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                TRANSFORMATION BLUEPRINT ({activePlan3Months.totalDuration})
              </span>
            </div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
              {activePlan3Months.totalDuration}
            </span>
          </div>

          <div>
            <h3 className="text-base font-black text-white">
              {activePlan3Months.goalName}
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              แผนฝึกจัดหนักพร้อมโภชนาการคลีน ควบคุมสารอาหารรายมื้อและคาร์ดิโอ
            </p>
          </div>

          {/* Phases summary */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800">
            {activePlan3Months.phases.map((ph) => (
              <div
                key={ph.month}
                className="bg-slate-800/80 p-2.5 rounded-2xl border border-slate-700/60 flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] text-emerald-400 font-bold block">
                    {ph.title}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-200 line-clamp-1 mt-0.5">
                    {ph.focus}
                  </span>
                </div>
                <span className="text-[9px] text-slate-400 mt-1 block">
                  เดือนที่ {ph.month} ({ph.calories})
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={onOpenPlan3Months}
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-98 cursor-pointer"
          >
            <span>เปิดดูแผนและตารางอาหารละเอียด ({activePlan3Months.totalDuration})</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-5 shadow-sm border border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-500/20 text-emerald-300 rounded-xl">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              AI TRANSFORMATION PLAN
            </span>
          </div>
          <div>
            <h3 className="text-base font-bold text-white">ยังไม่มีแผนระยะยาว</h3>
            <p className="text-xs text-slate-300 mt-1">
              ให้โค้ช AI ออกแบบโปรแกรมฝึก 3 เดือนและแผนโภชนาการที่ตรงกับรูปร่างเป้าหมายของคุณ
            </p>
          </div>
          <button
            onClick={onOpenAdapt}
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-98 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>สร้างหรือปรับแผนการฝึกส่วนบุคคล</span>
          </button>
        </div>
      )}

      {/* Selected Day Workout Details */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600">
              {weekSchedule[selectedDay]?.fullName} {weekSchedule[selectedDay]?.date} {weekSchedule[selectedDay]?.month} {weekSchedule[selectedDay]?.isToday ? "(วันนี้)" : ""}
            </span>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              {workout.titleTh || workout.title || "โปรแกรมออกกำลังกาย"}
              {workout.isAdapted && (
                <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full">
                  ปรับโปรแกรมแล้ว
                </span>
              )}
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded-full">
            {workout.durationMinutes > 0 ? `${workout.durationMinutes} นาที • ` : ""}{workout.exercises.length} ท่า
          </span>
        </div>

        {/* Exercises List */}
        {workout.exercises.length === 0 ? (
          <div className="text-center py-8 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Dumbbell className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">ยังไม่มีรายการท่าฝึกสำหรับวันนี้</p>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              กดปุ่มปรับแผนด่วน หรือให้โค้ช AI ช่วยสร้างโปรแกรมที่เหมาะสมกับเป้าหมายของคุณ
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {workout.exercises.map((ex, i) => (
              <div
                key={ex.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-white font-bold text-xs text-slate-500 flex items-center justify-center border border-slate-200 shrink-0">
                    {i + 1}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{ex.name}</h4>
                    <p className="text-[11px] text-slate-500">
                      {ex.sets} เซ็ต × {ex.reps} ครั้ง • พัก {ex.restSeconds} วิ.
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-700 block">
                    {ex.targetMuscle}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-medium">
                    {ex.completed ? "สำเร็จแล้ว" : "รอดำเนินการ"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2 flex gap-2">
          <button
            onClick={workout.exercises.length > 0 ? onOpenWorkout : onOpenAdapt}
            className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <Dumbbell className="w-4 h-4" />
            <span>{workout.exercises.length > 0 ? "เริ่มฝึกตามตารางนี้" : "ตั้งค่าหรือปรับแผนการฝึก"}</span>
          </button>
          <button
            onClick={onOpenLine}
            className="px-4 py-3 bg-[#06C755] hover:bg-[#05b34c] text-white rounded-2xl text-xs font-bold transition-colors shadow-sm flex items-center justify-center"
            title="สอบถามโค้ชผ่าน LINE"
          >
            <span>LINE Coach</span>
          </button>
        </div>
      </div>
        </>
      )}
    </div>
  );
};
