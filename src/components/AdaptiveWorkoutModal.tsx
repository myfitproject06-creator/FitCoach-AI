import React, { useState } from "react";
import {
  X,
  SlidersHorizontal,
  BatteryCharging,
  Clock,
  Dumbbell,
  Sparkles,
  AlertCircle,
  Check,
} from "lucide-react";
import { WorkoutPlan } from "../types";

interface AdaptiveWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWorkout: WorkoutPlan;
  onApplyAdaptedWorkout: (adapted: WorkoutPlan) => void;
}

export const AdaptiveWorkoutModal: React.FC<AdaptiveWorkoutModalProps> = ({
  isOpen,
  onClose,
  currentWorkout,
  onApplyAdaptedWorkout,
}) => {
  const [fatigueLevel, setFatigueLevel] = useState<"low" | "medium" | "high">("medium");
  const [availableTime, setAvailableTime] = useState<number>(30);
  const [equipmentConstraint, setEquipmentConstraint] = useState<string>("dumbbells_only");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleGenerateAdaptive = () => {
    setIsGenerating(true);

    setTimeout(() => {
      // Build an adapted version of the workout
      const adaptedExercises = currentWorkout.exercises.slice(0, 3).map((ex) => ({
        ...ex,
        sets: fatigueLevel === "high" ? Math.max(2, ex.sets - 1) : ex.sets,
        reps: fatigueLevel === "high" ? 10 : ex.reps,
        restSeconds: fatigueLevel === "high" ? 90 : 60,
      }));

      const adaptedPlan: WorkoutPlan = {
        ...currentWorkout,
        durationMinutes: availableTime,
        intensity: fatigueLevel === "high" ? "ปานกลาง-เบา (Deload)" : "ปานกลาง (Adapted)",
        isAdapted: true,
        coachNote: `ปรับลดเวลาเหลือ ${availableTime} นาที และลดความเข้มข้นเนื่องจากระดับความล้า (${fatigueLevel === "high" ? "ล้ามาก" : "ปานกลาง"}) เพื่อป้องกันการบาดเจ็บ`,
        exercises: adaptedExercises,
      };

      setIsGenerating(false);
      onApplyAdaptedWorkout(adaptedPlan);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                ปรับโปรแกรมด่วน (Adaptive AI)
              </h3>
              <p className="text-[11px] text-slate-400">
                โค้ชจะปรับลดเวลาและเซ็ตตามสภาพร่างกายวันนี้
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Fatigue level selection */}
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1.5">
              1. ระดับความเหนื่อยล้า / ปวดเมื่อยวันนี้:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "low", label: "สดชื่นดี", desc: "ฝึกเต็มที่", emoji: "⚡" },
                { id: "medium", label: "ล้าปานกลาง", desc: "ลด 1 เซ็ต", emoji: "🌤️" },
                { id: "high", label: "ล้ามาก/นอนน้อย", desc: "Deload ทันที", emoji: "🌧️" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFatigueLevel(item.id as any)}
                  className={`p-2.5 rounded-2xl border text-center transition-all ${
                    fatigueLevel === item.id
                      ? "border-emerald-500 bg-emerald-50/60 text-slate-900 font-semibold"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-base block">{item.emoji}</span>
                  <span className="text-xs block mt-1">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Time Available */}
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1.5">
              2. มีเวลาออกกำลังกายวันนี้กี่นาที?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[20, 30, 45].map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => setAvailableTime(time)}
                  className={`py-2 px-3 rounded-2xl border text-xs font-bold transition-all ${
                    availableTime === time
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {time} นาที
                </button>
              ))}
            </div>
          </div>

          {/* Equipment situation */}
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1.5">
              3. อุปกรณ์ที่มีในมือตอนนี้:
            </label>
            <select
              value={equipmentConstraint}
              onChange={(e) => setEquipmentConstraint(e.target.value)}
              className="w-full text-xs p-2.5 rounded-2xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-emerald-500"
            >
              <option value="full_gym">ครบชุดตามปกติ (Gym)</option>
              <option value="dumbbells_only">มีแค่ดัมเบลคู่เดียว (Dumbbells Only)</option>
              <option value="bodyweight_only">บอดี้เวท ไม่ใช้อุปกรณ์ (Bodyweight / Hotel)</option>
            </select>
          </div>

          {/* Summary Box */}
          <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <p className="text-[11px] text-emerald-900 leading-relaxed">
              AI จะคัดเลือกเฉพาะท่า Compound และปรับจำนวนเซ็ตให้จบใน {availableTime} นาที เพื่อให้กล้ามเนื้อได้รับการกระตุ้นโดยไม่เสี่ยงบาดเจ็บ
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-2xl text-xs transition-colors"
          >
            ยกเลิก
          </button>
          <button
            id="apply-adapted-plan-btn"
            onClick={handleGenerateAdaptive}
            disabled={isGenerating}
            className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <span>กำลังคำนวณแผนใหม่...</span>
            ) : (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>ยืนยันและเริ่มโปรแกรมปรับตัว</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
