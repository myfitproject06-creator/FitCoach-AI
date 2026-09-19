import React, { useState } from "react";
import {
  X,
  Layers,
  Calendar,
  Utensils,
  Moon,
  Flame,
  Dumbbell,
  CheckCircle2,
  Clock,
  Droplets,
  Sparkles,
} from "lucide-react";
import { Plan3MonthsData, WorkoutPlan } from "../types";

interface Plan3MonthsModalProps {
  plan: Plan3MonthsData;
  workout: WorkoutPlan;
  onClose: () => void;
  onStartWorkout: () => void;
}

export const Plan3MonthsModal: React.FC<Plan3MonthsModalProps> = ({
  plan,
  workout,
  onClose,
  onStartWorkout,
}) => {
  const [activeTab, setActiveTab] = useState<"roadmap" | "daily" | "meals" | "recovery">("roadmap");

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl h-[92vh] sm:h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              {plan.totalDuration || `${plan.phases.length} เดือน`} Transformation Blueprint
            </div>
            <h3 className="text-base sm:text-lg font-bold">
              {plan.goalName || `แผนการเปลี่ยนแปลง ${plan.totalDuration || `${plan.phases.length} เดือน`}`}
            </h3>
            <p className="text-xs text-emerald-100/90 mt-0.5">
              ระยะเวลา {plan.totalDuration} • ดูแลโดย FitCoach AI
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-4 gap-1 p-2 bg-slate-100 border-b border-slate-200 text-xs font-semibold shrink-0">
          <button
            onClick={() => setActiveTab("roadmap")}
            className={`py-2 px-1 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "roadmap"
                ? "bg-white text-emerald-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Roadmap</span>
          </button>
          <button
            onClick={() => setActiveTab("daily")}
            className={`py-2 px-1 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "daily"
                ? "bg-white text-emerald-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>ตาราง 7 วัน</span>
          </button>
          <button
            onClick={() => setActiveTab("meals")}
            className={`py-2 px-1 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "meals"
                ? "bg-white text-emerald-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>อาหาร</span>
          </button>
          <button
            onClick={() => setActiveTab("recovery")}
            className={`py-2 px-1 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "recovery"
                ? "bg-white text-emerald-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>พักผ่อน</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* TAB 1: ROADMAP */}
          {activeTab === "roadmap" && (
            <div className="space-y-3.5 animate-in fade-in duration-200">
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3.5 text-xs text-emerald-900 space-y-1">
                <span className="font-bold flex items-center gap-1.5 text-emerald-800">
                  <Flame className="w-4 h-4 text-emerald-600" />
                  กลยุทธ์การฝึก {plan.totalDuration} ({plan.phases.length} เฟสต่อเนื่อง)
                </span>
                <p className="text-emerald-700 text-[11px] leading-relaxed">
                  แผนนี้เน้นการสร้างสรีระแบบ {plan.goalName || "Lean Athletic V-Taper"} ผ่าน {plan.phases.length} ช่วงการพัฒนาตามกรอบเวลา {plan.totalDuration} เพื่อให้ได้ผลลัพธ์ชัดเจนและรักษากล้ามเนื้อไว้ได้อย่างถาวร
                </p>
              </div>

              {plan.phases.map((phase) => (
                <div
                  key={phase.month}
                  className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-2 hover:border-emerald-200 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                        {phase.month}
                      </span>
                      {phase.title}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                      สัปดาห์ที่ {(phase.month - 1) * 4 + 1} - {phase.month * 4}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 pl-8 leading-relaxed">
                    {phase.focus}
                  </p>

                  <div className="flex flex-wrap gap-2 pl-8 pt-1">
                    <span className="text-[11px] bg-amber-50 text-amber-800 border border-amber-100 px-2 py-0.5 rounded-lg font-medium flex items-center gap-1">
                      🔥 แคลอรีเป้าหมาย: <strong className="font-bold">{phase.calories}</strong>
                    </span>
                    <span className="text-[11px] bg-blue-50 text-blue-800 border border-blue-100 px-2 py-0.5 rounded-lg font-medium flex items-center gap-1">
                      🥩 โปรตีน: <strong className="font-bold">{phase.protein}</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: DAILY SCHEDULE 7 วัน */}
          {activeTab === "daily" && (
            <div className="space-y-2.5 animate-in fade-in duration-200">
              <div className="text-xs text-slate-500 font-medium">
                ตารางประจำสัปดาห์สำหรับการจัดสรรเวลาในแต่ละวัน:
              </div>

              {plan.weeklySchedule.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-emerald-200 transition-colors"
                >
                  <div className="space-y-0.5 pr-2">
                    <div className="font-bold text-xs text-slate-900">
                      {item.day}
                    </div>
                    <div className="text-xs text-slate-600">
                      {item.activity}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 text-[10px] px-2.5 py-1 rounded-full font-bold border ${
                      item.type === "workout"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : item.type === "cardio"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    {item.type === "workout"
                      ? "เวทเทรนนิ่ง"
                      : item.type === "cardio"
                      ? "เบิร์นไขมัน"
                      : "พักฟื้น 100%"}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: DAILY MEALS ข้อมูลอาหารรายวัน */}
          {activeTab === "meals" && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 text-xs text-blue-900 flex items-start gap-2.5">
                <Droplets className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold">กฎการเตรียมอาหาร (Daily Meal Prep Blueprint):</span>
                  <p className="text-[11px] text-blue-800 leading-relaxed">
                    เป้าหมายรายวันเฉลี่ย 2,150–2,250 kcal • โปรตีน 145–150g • ดื่มน้ำสะอาด 2.5–3 ลิตรต่อวัน
                  </p>
                </div>
              </div>

              {plan.dailyMeals.map((meal, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      {meal.meal}
                      <span className="text-[10px] font-normal text-slate-400">
                        ({meal.time})
                      </span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full font-bold">
                        โปรตีน {meal.protein}
                      </span>
                      <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full font-bold">
                        {meal.calories}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pl-3.5">
                    {meal.menu}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: RECOVERY กฎการพักผ่อน */}
          {activeTab === "recovery" && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-3.5 text-xs text-indigo-900 space-y-1">
                <span className="font-bold flex items-center gap-1.5 text-indigo-800">
                  <Moon className="w-4 h-4 text-indigo-600" />
                  เสาหลักการฟื้นฟู (Muscle Recovery & Growth)
                </span>
                <p className="text-indigo-700 text-[11px] leading-relaxed">
                  กล้ามเนื้อเติบโตและไขมันถูกเผาผลาญในเวลาที่คุณนอนหลับ การปฏิบัติตามกฎ 4 ข้อนี้จะช่วยเพิ่มประสิทธิภาพได้มากกว่า 40%
                </p>
              </div>

              {plan.recoveryRules.map((rule, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs"
                >
                  <div className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
                    {idx + 1}
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed pt-0.5">
                    {rule}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors"
          >
            ปิดหน้าต่าง
          </button>
          <button
            onClick={() => {
              onClose();
              onStartWorkout();
            }}
            className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-[0.98]"
          >
            <Dumbbell className="w-4 h-4" />
            <span>เริ่มฝึกเซสชันวันนี้ 💪</span>
          </button>
        </div>
      </div>
    </div>
  );
};
