import React, { useState, useEffect } from "react";
import {
  X,
  Play,
  CheckCircle2,
  Clock,
  RotateCcw,
  Plus,
  Minus,
  Sparkles,
  ChevronRight,
  Info,
  Trophy,
  Flame,
} from "lucide-react";
import confetti from "canvas-confetti";
import { WorkoutPlan, Exercise } from "../types";

interface WorkoutModalProps {
  workout: WorkoutPlan;
  onClose: () => void;
  onCompleteWorkout: (data: { rpe: number; feeling: any; notes: string }) => void;
  onOpenAdapt: () => void;
}

export const WorkoutModal: React.FC<WorkoutModalProps> = ({
  workout,
  onClose,
  onCompleteWorkout,
  onOpenAdapt,
}) => {
  // Modes: "overview" | "active" | "feedback" | "completed_summary"
  const [mode, setMode] = useState<"overview" | "active" | "feedback" | "completed_summary">(
    workout.isCompleted ? "completed_summary" : "overview"
  );

  const [exercises, setExercises] = useState<Exercise[]>(workout.exercises);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);

  // Active workout states
  const [activeSetIndex, setActiveSetIndex] = useState(1);
  const [currentWeight, setCurrentWeight] = useState("60");
  const [currentReps, setCurrentReps] = useState("10");
  const [completedSets, setCompletedSets] = useState<Record<string, boolean[]>>({});

  // Rest Timer
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [isResting, setIsResting] = useState(false);

  // Post-workout feedback
  const [feeling, setFeeling] = useState<"easy" | "good" | "challenging" | "hard" | "pain">("good");
  const [rpe, setRpe] = useState(7);
  const [notes, setNotes] = useState("");

  const currentExercise = exercises[activeExerciseIndex] || exercises[0];

  // Initialize completed sets map
  useEffect(() => {
    const initialSets: Record<string, boolean[]> = {};
    exercises.forEach((ex) => {
      initialSets[ex.id] = new Array(ex.sets).fill(false);
    });
    setCompletedSets(initialSets);
  }, [exercises]);

  // Rest timer countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isResting && restTimer !== null && restTimer > 0) {
      timer = setInterval(() => {
        setRestTimer((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else if (restTimer === 0) {
      setIsResting(false);
    }
    return () => clearInterval(timer);
  }, [isResting, restTimer]);

  const handleStartWorkout = () => {
    setMode("active");
    setActiveExerciseIndex(0);
    setActiveSetIndex(1);
  };

  const handleCheckSet = (exId: string, setIdx: number) => {
    const updated = { ...completedSets };
    if (!updated[exId]) updated[exId] = [];
    updated[exId][setIdx] = !updated[exId][setIdx];
    setCompletedSets(updated);

    // If set is marked done, start rest timer
    if (updated[exId][setIdx]) {
      const restSec = currentExercise.restSeconds || 75;
      setRestTimer(restSec);
      setIsResting(true);
      if (setIdx + 1 < currentExercise.sets) {
        setActiveSetIndex(setIdx + 2);
      }
    }
  };

  const handleFinishWorkout = () => {
    setMode("feedback");
  };

  const handleSubmitFeedback = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
    onCompleteWorkout({ rpe, feeling, notes });
    setMode("completed_summary");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <h3 className="font-bold text-sm tracking-tight">
              {mode === "active"
                ? `กำลังฝึก: ท่าที่ ${activeExerciseIndex + 1}/${exercises.length}`
                : mode === "feedback"
                ? "ประเมินความรู้สึกหลังฝึก"
                : workout.titleTh}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* ================= MODE: OVERVIEW ================= */}
          {mode === "overview" && (
            <div className="space-y-4">
              {/* Header stats */}
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs">
                <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>{workout.durationMinutes} นาที</span>
                </div>
                <div className="flex items-center gap-1 text-slate-500">
                  <span>ความเข้มข้น:</span>
                  <span className="font-bold text-slate-800">{workout.intensity}</span>
                </div>
                <button
                  onClick={onOpenAdapt}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold underline underline-offset-2"
                >
                  ปรับตามความพร้อม
                </button>
              </div>

              {/* Coach Focus Note */}
              <div className="bg-emerald-50/70 border border-emerald-200/80 p-3 rounded-xl flex items-start gap-2.5 text-xs text-emerald-950">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  {workout.coachNote ||
                    "วันนี้เน้นควบคุมความเร็วการลง (Tempo 2-0-1) โฟกัสฟอร์มให้ถูกต้องเพื่อพัฒนารูปร่างให้ชัดเจนครับ"}
                </p>
              </div>

              {/* Exercise List */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  รายการท่าฝึก ({exercises.length} ท่า)
                </h4>
                {exercises.map((ex, idx) => (
                  <div
                    key={ex.id}
                    className="p-3 bg-white rounded-xl border border-slate-200 flex items-center gap-3 hover:border-slate-300 transition-colors"
                  >
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <img
                      src={ex.image || "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=200&q=80"}
                      alt={ex.name}
                      className="w-12 h-12 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-bold text-slate-800 truncate">
                        {ex.name}
                      </h5>
                      <p className="text-[11px] text-slate-500">
                        {ex.sets} เซ็ต × {ex.reps} • แนะนำ {ex.suggestedWeight}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                        พัก {ex.restSeconds} วิ • {ex.notes}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button
                  id="start-live-workout-btn"
                  onClick={handleStartWorkout}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>เริ่มฝึกเลย (โหมดจับเวลาและบันทึก)</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= MODE: ACTIVE WORKOUT ================= */}
          {mode === "active" && (
            <div className="space-y-4">
              {/* Exercise Navigation Tabs */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {exercises.map((ex, idx) => {
                  const isCurrent = idx === activeExerciseIndex;
                  const isDone = completedSets[ex.id]?.every(Boolean);
                  return (
                    <button
                      key={ex.id}
                      onClick={() => setActiveExerciseIndex(idx)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                        isCurrent
                          ? "bg-slate-900 text-white"
                          : isDone
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {idx + 1}. {ex.name.split(" ")[0]} {isDone && "✓"}
                    </button>
                  );
                })}
              </div>

              {/* Active Exercise Detail Card */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                      ท่าที่ {activeExerciseIndex + 1} จาก {exercises.length}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 mt-0.5">
                      {currentExercise.name}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {currentExercise.nameTh}
                    </p>
                  </div>
                  <img
                    src={currentExercise.image || "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=300&q=80"}
                    alt={currentExercise.name}
                    className="w-16 h-16 rounded-xl object-cover border border-slate-200"
                  />
                </div>

                <div className="mt-3 p-2.5 bg-white rounded-xl border border-slate-200/80 text-xs text-slate-600 flex items-start gap-2">
                  <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <p>{currentExercise.notes || "เกร็งกล้ามเนื้อเป้าหมาย คุมการเคลื่อนไหวให้ต่อเนื่อง"}</p>
                </div>
              </div>

              {/* Rest Timer Banner (if resting) */}
              {isResting && (
                <div className="bg-indigo-950 text-white p-3.5 rounded-2xl flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-400" />
                    <div>
                      <p className="text-[11px] text-indigo-300 font-medium">เวลาพักฟื้นกล้ามเนื้อ</p>
                      <p className="text-lg font-black text-white">{restTimer} วินาที</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setRestTimer((prev) => (prev ? prev + 15 : 15))}
                      className="px-2.5 py-1 bg-indigo-800 hover:bg-indigo-700 text-xs rounded-lg font-medium"
                    >
                      +15 วิ
                    </button>
                    <button
                      onClick={() => {
                        setIsResting(false);
                        setRestTimer(0);
                      }}
                      className="px-2.5 py-1 bg-white text-indigo-950 text-xs rounded-lg font-bold"
                    >
                      ข้าม
                    </button>
                  </div>
                </div>
              )}

              {/* Sets Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-2">
                  <span>เซ็ต</span>
                  <span>น้ำหนัก (กก.)</span>
                  <span>จำนวนครั้ง</span>
                  <span>เสร็จสิ้น</span>
                </div>

                {Array.from({ length: currentExercise.sets }).map((_, sIdx) => {
                  const isDone = completedSets[currentExercise.id]?.[sIdx] || false;
                  return (
                    <div
                      key={sIdx}
                      className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                        isDone
                          ? "bg-emerald-50/80 border-emerald-300"
                          : "bg-white border-slate-200"
                      }`}
                    >
                      <span className="text-xs font-bold text-slate-700 w-8 pl-1">
                        #{sIdx + 1}
                      </span>
                      <input
                        type="text"
                        defaultValue={currentExercise.suggestedWeight.replace(" kg", "")}
                        className="w-16 text-center text-xs font-semibold py-1 bg-slate-100 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                      <input
                        type="text"
                        defaultValue={currentExercise.reps.split("–")[0] || "10"}
                        className="w-16 text-center text-xs font-semibold py-1 bg-slate-100 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                      <button
                        onClick={() => handleCheckSet(currentExercise.id, sIdx)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                          isDone
                            ? "bg-emerald-600 text-white scale-105"
                            : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                        }`}
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Controls */}
              <div className="flex gap-2 pt-2">
                {activeExerciseIndex < exercises.length - 1 ? (
                  <button
                    onClick={() => setActiveExerciseIndex((prev) => prev + 1)}
                    className="flex-1 py-3 bg-slate-900 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow"
                  >
                    <span>ท่าถัดไป</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleFinishWorkout}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>เสร็จสิ้นการฝึก (บันทึกและประเมินผล)</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ================= MODE: FEEDBACK ================= */}
          {mode === "feedback" && (
            <div className="space-y-4 py-2">
              <div className="text-center">
                <span className="text-3xl">💪</span>
                <h4 className="text-base font-bold text-slate-900 mt-2">
                  ยอดเยี่ยมมากครับ! ออกกำลังกายเสร็จแล้ว
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  ความรู้สึกในการฝึกวันนี้เป็นอย่างไรบ้าง?
                </p>
              </div>

              {/* Feeling Options */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: "easy", label: "ง่าย สบายมาก", emoji: "🟢" },
                  { id: "good", label: "กำลังดี ตรงตามเป้า", emoji: "💪" },
                  { id: "challenging", label: "ท้าทาย หนักสะใจ", emoji: "🔥" },
                  { id: "hard", label: "เหนื่อยล้ามาก", emoji: "🥵" },
                  { id: "pain", label: "รู้สึกเจ็บ / ไม่สบาย", emoji: "⚠️" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setFeeling(item.id as any)}
                    className={`p-3 rounded-xl border text-xs font-semibold text-left flex flex-col gap-1 transition-all ${
                      feeling === item.id
                        ? "border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-lg">{item.emoji}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              {/* RPE Slider */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">ระดับความหนัก (RPE):</span>
                  <span className="font-bold text-slate-900 px-2 py-0.5 bg-white rounded border border-slate-200">
                    RPE {rpe} / 10
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={rpe}
                  onChange={(e) => setRpe(Number(e.target.value))}
                  className="w-full accent-slate-900"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>1 (เบาสุด)</span>
                  <span>7 (มาตรฐาน)</span>
                  <span>10 (หมดแรง)</span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">
                  บันทึกเพิ่มเติมถึงเทรนเนอร์ (ถ้ามี):
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="เช่น ท่า Bench Press ทำได้ครบ 10 ครั้งทุกเซ็ต ไม่เจ็บไหล่เลย..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                  rows={2}
                />
              </div>

              <button
                onClick={handleSubmitFeedback}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-all"
              >
                <span>ส่งข้อมูลให้โค้ชและบันทึกผล</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ================= MODE: COMPLETED SUMMARY ================= */}
          {mode === "completed_summary" && (
            <div className="space-y-4 py-2">
              <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-3xl text-center space-y-2">
                <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                  <Trophy className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-emerald-950">
                  ยินดีด้วยครับ! การฝึกวันนี้สำเร็จแล้ว 🎉
                </h4>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  คุณทำได้ครบ 5 ท่าฝึก • ใช้เวลา 48 นาที • ความเข้มข้น RPE {rpe}
                </p>
                <div className="inline-flex items-center gap-1.5 bg-white text-emerald-800 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>+85 XP • Momentum เพิ่มขึ้น!</span>
                </div>
              </div>

              {/* Coach message */}
              <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-1.5">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  คำแนะนำหลังฝึกจาก FitCoach
                </span>
                <p className="text-xs text-slate-200 leading-relaxed">
                  "ยอดเยี่ยมมากครับ การกระตุ้นเส้นใยกล้ามเนื้อวันนี้ทำได้ตามแผนอย่างสมบูรณ์แบบ แนะนำให้เติมโปรตีนประมาณ 30-40g ภายใน 1-2 ชั่วโมงนี้ และพรุ่งนี้ตามโปรแกรมจะเป็น <strong>Active Recovery</strong> เพื่อให้ร่างกายได้ซ่อมแซมครับ"
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl text-xs transition-colors"
              >
                ปิดหน้านี้
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
