import React, { useState, useEffect } from "react";
import {
  X,
  Dumbbell,
  Clock,
  Flame,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  Play,
  RotateCcw,
  Zap,
  Check,
} from "lucide-react";
import confetti from "canvas-confetti";
import { WorkoutDay, ExerciseItem } from "../types";

interface WorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  day: WorkoutDay;
  onCompleteWorkout: () => void;
}

export const WorkoutModal: React.FC<WorkoutModalProps> = ({
  isOpen,
  onClose,
  day,
  onCompleteWorkout,
}) => {
  const [completedExercises, setCompletedExercises] = useState<Record<string, boolean>>({});
  const [activeExerciseIndex, setActiveExerciseIndex] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [restSecondsLeft, setRestSecondsLeft] = useState(60);

  useEffect(() => {
    let timer: any = null;
    if (isTimerRunning && restSecondsLeft > 0) {
      timer = setInterval(() => {
        setRestSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (restSecondsLeft === 0 && isTimerRunning) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, restSecondsLeft]);

  if (!isOpen) return null;

  const toggleExerciseDone = (id: string, restDuration = 60) => {
    const isNowDone = !completedExercises[id];
    setCompletedExercises((prev) => ({ ...prev, [id]: isNowDone }));

    if (isNowDone) {
      setRestSecondsLeft(restDuration);
      setIsTimerRunning(true);
    }
  };

  const handleFinishAll = () => {
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // ignore
    }
    onCompleteWorkout();
    onClose();
  };

  const allCompleted =
    day.exercises.length > 0 &&
    day.exercises.every((ex) => completedExercises[ex.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <Dumbbell className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-orange-400 font-bold uppercase tracking-wider block">
                {day.dayName}
              </span>
              <h3 className="text-sm font-bold text-white leading-tight">
                {day.focus}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Rest Timer Banner */}
        {isTimerRunning && (
          <div className="bg-orange-500 text-white px-4 py-2 flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-2 text-xs font-bold">
              <Clock className="w-4 h-4" />
              <span>เวลาพักฟื้นกล้ามเนื้อ (Rest Timer):</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-black">{restSecondsLeft}s</span>
              <button
                onClick={() => setIsTimerRunning(false)}
                className="text-[10px] bg-black/20 hover:bg-black/30 px-2 py-0.5 rounded-full"
              >
                ข้าม
              </button>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
          <div className="flex items-center justify-between text-xs text-slate-600 pb-1">
            <span>
              ความคืบหน้า:{" "}
              {Object.values(completedExercises).filter(Boolean).length} / {day.exercises.length} ท่า
            </span>
            <span className="font-semibold text-orange-600">
              {day.estimatedDurationMinutes || 45} นาที • ~{day.estimatedCalories || 300} kcal
            </span>
          </div>

          <div className="space-y-2.5">
            {day.exercises.map((ex, idx) => {
              const isDone = !!completedExercises[ex.id];
              return (
                <div
                  key={ex.id || idx}
                  onClick={() => toggleExerciseDone(ex.id, ex.restSeconds || 60)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between select-none ${
                    isDone
                      ? "bg-emerald-50/70 border-emerald-300"
                      : "bg-white hover:bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
                        isDone
                          ? "bg-emerald-500 text-white"
                          : "border border-slate-300 text-slate-400"
                      }`}
                    >
                      {isDone ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                    </div>
                    <div>
                      <h4
                        className={`text-xs font-bold ${
                          isDone ? "text-emerald-950 line-through opacity-80" : "text-slate-900"
                        }`}
                      >
                        {ex.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {ex.sets} เซ็ต × {ex.reps} ครั้ง • พัก {ex.restSeconds || 60} วิ
                      </p>
                      {ex.notes && (
                        <p className="text-[10px] text-slate-400 mt-0.5 italic">
                          💡 {ex.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium shrink-0 ml-2">
                    {ex.targetMuscle}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
          >
            ปิด
          </button>
          <button
            onClick={handleFinishAll}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>จบการซ้อมวันนี้ (+150 XP)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
