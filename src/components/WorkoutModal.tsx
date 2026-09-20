import React, { useState } from "react";
import {
  X,
  Play,
  Pause,
  CheckCircle2,
  Clock,
  Flame,
  Dumbbell,
  Sparkles,
  Info,
  ChevronRight,
  ArrowRight,
  SlidersHorizontal,
} from "lucide-react";
import { WorkoutPlan, Exercise } from "../types";

interface WorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  workout: WorkoutPlan;
  onCompleteWorkout: () => void;
  onOpenAdapt: () => void;
}

export const WorkoutModal: React.FC<WorkoutModalProps> = ({
  isOpen,
  onClose,
  workout,
  onCompleteWorkout,
  onOpenAdapt,
}) => {
  const [activeExerciseIndex, setActiveExerciseIndex] = useState<number>(0);
  const [completedExercises, setCompletedExercises] = useState<Record<string, boolean>>({});
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(60);

  if (!isOpen) return null;

  const currentExercise: Exercise | undefined = workout.exercises[activeExerciseIndex] || workout.exercises[0];

  const handleToggleExercise = (id: string) => {
    setCompletedExercises((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleFinishAll = () => {
    onCompleteWorkout();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">
                WORKOUT SESSION
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                {workout.durationMinutes} นาที
              </span>
            </div>
            <h3 className="text-base font-bold text-white mt-0.5">
              {workout.titleTh || workout.title || "โปรแกรมออกกำลังกาย"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {currentExercise ? (
            <>
              {/* Active Exercise Focus Banner */}
              <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    ท่าฝึกปัจจุบัน ({activeExerciseIndex + 1}/{workout.exercises.length})
                  </span>
                  <span className="text-xs text-slate-300 font-semibold">
                    เป้าหมาย: {currentExercise.targetMuscle}
                  </span>
                </div>
                <h4 className="text-lg font-black text-white">
                  {currentExercise.name}
                </h4>
                <div className="flex items-center gap-4 text-xs text-slate-300 mt-2">
                  <div className="bg-white/10 px-2.5 py-1 rounded-lg">
                    จำนวนเซ็ต: <strong>{currentExercise.sets} เซ็ต</strong>
                  </div>
                  <div className="bg-white/10 px-2.5 py-1 rounded-lg">
                    จำนวนครั้ง: <strong>{currentExercise.reps} ครั้ง</strong>
                  </div>
                  <div className="bg-white/10 px-2.5 py-1 rounded-lg">
                    พัก: <strong>{currentExercise.restSeconds} วินาที</strong>
                  </div>
                </div>

                {/* Coach Tip */}
                {currentExercise.tips && (
                  <p className="text-[11px] text-emerald-300/90 mt-3 pt-2 border-t border-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>คำแนะนำ: {currentExercise.tips}</span>
                  </p>
                )}
              </div>

              {/* Quick Timer Utility */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span>ตัวจับเวลาพักเซ็ต: {timerSeconds} วินาที</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-xl transition-colors"
                  >
                    {isTimerRunning ? "หยุด" : "เริ่มจับเวลา"}
                  </button>
                  <button
                    onClick={() => setTimerSeconds(currentExercise.restSeconds || 60)}
                    className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium rounded-xl transition-colors"
                  >
                    รีเซ็ต
                  </button>
                </div>
              </div>

              {/* All Exercises List Checklist */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    รายการท่าฝึกทั้งหมด ({workout.exercises.length})
                  </h5>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenAdapt();
                    }}
                    className="text-[11px] text-emerald-700 font-semibold hover:underline flex items-center gap-1"
                  >
                    <SlidersHorizontal className="w-3 h-3" />
                    <span>ปรับความหนัก</span>
                  </button>
                </div>
                <div className="space-y-2">
                  {workout.exercises.map((ex, idx) => {
                    const isChecked = !!completedExercises[ex.id];
                    const isActive = activeExerciseIndex === idx;
                    return (
                      <div
                        key={ex.id}
                        onClick={() => setActiveExerciseIndex(idx)}
                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                          isActive
                            ? "bg-emerald-50/50 border-emerald-500 shadow-xs"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleExercise(ex.id);
                            }}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                              isChecked
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <div>
                            <h6 className={`text-xs font-bold ${isChecked ? "line-through text-slate-400" : "text-slate-800"}`}>
                              {idx + 1}. {ex.name}
                            </h6>
                            <span className="text-[11px] text-slate-500">
                              {ex.sets} เซ็ต × {ex.reps} ครั้ง • {ex.targetMuscle}
                            </span>
                          </div>
                        </div>
                        {isActive && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            กำลังทำ
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-10 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Dumbbell className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-700">ยังไม่มีรายการท่าฝึกในโปรแกรมวันนี้</h4>
              <p className="text-xs text-slate-500">
                คุณสามารถทำแบบประเมินโปรไฟล์ หรือออกแบบโปรแกรมร่วมกับโค้ช AI เพื่อเริ่มต้นตารางการฝึก
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-2xl text-xs transition-colors"
          >
            ปิด
          </button>
          <button
            id="finish-workout-btn"
            onClick={handleFinishAll}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>บันทึกว่าฝึกเสร็จแล้ว</span>
          </button>
        </div>
      </div>
    </div>
  );
};
