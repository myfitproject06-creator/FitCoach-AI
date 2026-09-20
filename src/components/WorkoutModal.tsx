import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Clock,
  Flame,
  Dumbbell,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  SlidersHorizontal,
  Volume2,
  VolumeX,
  FastForward,
  Trophy,
  ArrowRight,
  List,
  Brain,
} from "lucide-react";
import confetti from "canvas-confetti";
import { WorkoutPlan, Exercise, UserProfile } from "../types";

interface WorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  workout: WorkoutPlan;
  onCompleteWorkout: () => void;
  onOpenAdapt: () => void;
  profile?: UserProfile;
}

const COACH_MOTIVATIONS = [
  "หายใจเข้าลึกๆ จิบน้ำเล็กน้อย เตรียมลุยเซ็ตต่อไป!",
  "โฟกัสที่กล้ามเนื้อเป้าหมาย คุมจังหวะลงช้าๆ 2-3 วินาที",
  "ยอดเยี่ยมมาก! รักษาฟอร์มให้แน่น อย่าแอ่นหลัง",
  "พักให้กล้ามเนื้อพร้อม เซ็ตถัดไปใส่เต็มที่เลยครับ!",
  "โค้ชคอยดูอยู่ ฟอร์มสวยมาก มุ่งมั่นไปให้สุด!",
];

// Helper to play short, gentle synthetic beeps
const playAudioBeep = (freq: number = 880, duration: number = 0.15) => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    // Ignore audio autoplay restrictions
  }
};

export const WorkoutModal: React.FC<WorkoutModalProps> = ({
  isOpen,
  onClose,
  workout,
  onCompleteWorkout,
  onOpenAdapt,
  profile,
}) => {
  // Modes: 'overview' | 'live' | 'summary'
  const [viewMode, setViewMode] = useState<"overview" | "live" | "summary">("overview");

  // Exercise and set tracking
  const [activeExerciseIndex, setActiveExerciseIndex] = useState<number>(0);
  const [currentSet, setCurrentSet] = useState<number>(1);
  const [completedExercises, setCompletedExercises] = useState<Record<string, boolean>>({});
  
  // Set logs per exercise: { [exerciseId]: Array<{ set: number, weight: string, reps: string, done: boolean }> }
  const [exerciseSetLogs, setExerciseSetLogs] = useState<
    Record<string, Array<{ set: number; weight: string; reps: string; done: boolean }>>
  >({});

  // Weight & Reps inputs for the current set
  const [inputWeight, setInputWeight] = useState<string>("");
  const [inputReps, setInputReps] = useState<string>("");

  // Rest Timer state
  const [isResting, setIsResting] = useState<boolean>(false);
  const [restSecondsLeft, setRestSecondsLeft] = useState<number>(60);
  const [totalRestDuration, setTotalRestDuration] = useState<number>(60);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [motivationText, setMotivationText] = useState<string>(COACH_MOTIVATIONS[0]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const exercises = workout?.exercises || [];
  const currentExercise: Exercise | undefined = exercises[activeExerciseIndex] || exercises[0];

  // Initialize or synchronize default weight and reps when active exercise changes
  useEffect(() => {
    if (currentExercise) {
      const defaultWeight = currentExercise.actualWeight || currentExercise.suggestedWeight || "";
      const defaultReps = String(currentExercise.actualReps || currentExercise.reps || "10");
      setInputWeight(defaultWeight);
      setInputReps(defaultReps);

      // Pre-fill sets log if empty
      setExerciseSetLogs((prev) => {
        if (!prev[currentExercise.id]) {
          const totalSets = currentExercise.sets || 3;
          const initialSets = Array.from({ length: totalSets }, (_, i) => ({
            set: i + 1,
            weight: defaultWeight,
            reps: defaultReps,
            done: false,
          }));
          return { ...prev, [currentExercise.id]: initialSets };
        }
        return prev;
      });
    }
  }, [activeExerciseIndex, currentExercise]);

  // Countdown timer effect
  useEffect(() => {
    if (isResting && restSecondsLeft > 0) {
      timerRef.current = setTimeout(() => {
        setRestSecondsLeft((prev) => {
          if (prev <= 4 && prev > 1 && !isMuted) {
            playAudioBeep(600, 0.1);
          } else if (prev === 1 && !isMuted) {
            playAudioBeep(1000, 0.25);
          }
          return prev - 1;
        });
      }, 1000);
    } else if (isResting && restSecondsLeft === 0) {
      setIsResting(false);
      if (!isMuted) playAudioBeep(1200, 0.3);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isResting, restSecondsLeft, isMuted]);

  if (!isOpen) return null;

  // Toggle exercise checkbox in overview mode
  const handleToggleExercise = (id: string) => {
    setCompletedExercises((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Start Live PT Session
  const handleStartLive = (startIndex = 0) => {
    setActiveExerciseIndex(startIndex);
    setCurrentSet(1);
    setIsResting(false);
    setViewMode("live");
  };

  // Complete current set and trigger rest timer
  const handleCompleteSet = () => {
    if (!currentExercise) return;

    // Record set log
    setExerciseSetLogs((prev) => {
      const logs = prev[currentExercise.id] || [];
      const updated = logs.map((log) =>
        log.set === currentSet
          ? { ...log, weight: inputWeight, reps: inputReps, done: true }
          : log
      );
      return { ...prev, [currentExercise.id]: updated };
    });

    const totalSets = currentExercise.sets || 3;
    const isLastSetOfExercise = currentSet >= totalSets;

    if (isLastSetOfExercise) {
      // Mark current exercise as complete
      setCompletedExercises((prev) => ({
        ...prev,
        [currentExercise.id]: true,
      }));

      const isLastExerciseOverall = activeExerciseIndex >= exercises.length - 1;

      if (isLastExerciseOverall) {
        // Finished all exercises!
        triggerCelebration();
        setViewMode("summary");
        return;
      } else {
        // Move to next exercise after a slightly longer transition rest
        const rest = currentExercise.restSeconds || 60;
        setTotalRestDuration(rest);
        setRestSecondsLeft(rest);
        setIsResting(true);
        setMotivationText("จบครบทุกเซ็ตของท่านี้แล้ว! เยี่ยมมาก พักสักครู่แล้วไปลุยท่าถัดไป");
        setActiveExerciseIndex((prev) => prev + 1);
        setCurrentSet(1);
        return;
      }
    } else {
      // Next set of current exercise
      const rest = currentExercise.restSeconds || 60;
      setTotalRestDuration(rest);
      setRestSecondsLeft(rest);
      setIsResting(true);
      // Pick random motivation text
      const randomMotivation =
        COACH_MOTIVATIONS[Math.floor(Math.random() * COACH_MOTIVATIONS.length)];
      setMotivationText(randomMotivation);
      setCurrentSet((prev) => prev + 1);
    }
  };

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // ignore
    }
  };

  const handleFinishAll = () => {
    onCompleteWorkout();
    onClose();
    setViewMode("overview");
  };

  // Progress calculations
  const totalExercisesCount = exercises.length;
  const completedCount = Object.values(completedExercises).filter(Boolean).length;
  const progressPercent = totalExercisesCount > 0 ? Math.round((completedCount / totalExercisesCount) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 font-bold">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  {viewMode === "live" ? "🔴 LIVE PT SESSION" : "WORKOUT SESSION"}
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                  {workout.durationMinutes || 45} นาที
                </span>
              </div>
              <h3 className="text-sm font-bold text-white mt-0.5 truncate max-w-[240px] sm:max-w-xs">
                {workout.titleTh || workout.title || "โปรแกรมออกกำลังกาย"}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {viewMode === "live" && (
              <button
                onClick={() => setViewMode("overview")}
                className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 font-medium transition-colors"
                title="กลับไปหน้ารายการท่า"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">รายการ</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {/* ================= VIEW 1: LIVE PT MODE ================= */}
          {viewMode === "live" && currentExercise && (
            <div className="space-y-4">
              {/* Exercise Progress Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-slate-500 font-semibold">
                  <span>ท่าที่ {activeExerciseIndex + 1} จาก {exercises.length}</span>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {currentExercise.targetMuscle || "ทั่วร่างกาย"}
                </span>
              </div>

              {/* Live Exercise Card */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                      ท่าฝึกปัจจุบัน
                    </span>
                    <h4 className="text-xl font-black text-white mt-0.5">
                      {currentExercise.name}
                    </h4>
                    {currentExercise.nameTh && (
                      <p className="text-xs text-slate-400 mt-0.5">{currentExercise.nameTh}</p>
                    )}
                  </div>

                  {/* Set Badge */}
                  <div className="text-center bg-white/10 px-3 py-1.5 rounded-2xl border border-white/10 shrink-0">
                    <span className="text-[10px] text-slate-400 block font-medium uppercase">เซ็ต</span>
                    <span className="text-lg font-black text-emerald-400">
                      {currentSet} / {currentExercise.sets || 3}
                    </span>
                  </div>
                </div>

                {/* Target Specs */}
                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                  <div className="bg-white/5 rounded-2xl p-2 border border-white/10">
                    <span className="text-[10px] text-slate-400 block">เป้าหมาย</span>
                    <span className="text-xs font-bold text-white">{currentExercise.reps} ครั้ง</span>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-2 border border-white/10">
                    <span className="text-[10px] text-slate-400 block">น้ำหนักแนะนำ</span>
                    <span className="text-xs font-bold text-white">
                      {currentExercise.suggestedWeight || "Bodyweight"}
                    </span>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-2 border border-white/10">
                    <span className="text-[10px] text-slate-400 block">เวลาพัก</span>
                    <span className="text-xs font-bold text-white">{currentExercise.restSeconds || 60} วินาที</span>
                  </div>
                </div>

                {/* Coach Tips */}
                {currentExercise.tips && (
                  <div className="mt-3 pt-3 border-t border-white/10 flex items-start gap-2 text-xs text-emerald-300">
                    <Sparkles className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                    <span>คำแนะนำโค้ช: {currentExercise.tips}</span>
                  </div>
                )}

                {/* Trainer's Memory Alert (Injuries / Limitations) */}
                {(profile?.trainerNotes || (profile?.injuries && profile.injuries.length > 0)) && (
                  <div className="mt-2.5 p-2.5 rounded-2xl bg-indigo-950/60 border border-indigo-400/40 text-indigo-200 text-xs flex items-center gap-2">
                    <Brain className="w-4 h-4 text-indigo-300 shrink-0" />
                    <div className="leading-snug">
                      <span className="font-bold text-indigo-100">ความจำโค้ช: </span>
                      <span>
                        {profile?.trainerNotes ||
                          `จุดระวัง: ${profile?.injuries?.join(", ")}`}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* REST TIMER SECTION (Shown during rest interval) */}
              {isResting ? (
                <div className="bg-emerald-950/90 text-white rounded-3xl p-5 border border-emerald-500/40 text-center space-y-3 animate-in zoom-in-95 duration-200 shadow-xl">
                  <div className="flex items-center justify-between text-xs text-emerald-300 font-bold">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-emerald-400 animate-spin" />
                      <span>พักผ่อนกล้ามเนื้อ (REST TIMER)</span>
                    </div>
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="text-emerald-400 hover:text-white transition-colors"
                      title={isMuted ? "เปิดเสียง" : "ปิดเสียง"}
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Circular / Large Seconds display */}
                  <div className="py-2">
                    <div className="text-5xl font-black text-emerald-400 tracking-tight font-mono">
                      {restSecondsLeft}s
                    </div>
                    <p className="text-xs text-emerald-200/90 mt-1 max-w-xs mx-auto">
                      {motivationText}
                    </p>
                  </div>

                  {/* Rest Progress Bar */}
                  <div className="w-full bg-emerald-900/60 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-400 h-full transition-all duration-1000 ease-linear rounded-full"
                      style={{
                        width: `${Math.max(0, (restSecondsLeft / (totalRestDuration || 60)) * 100)}%`,
                      }}
                    />
                  </div>

                  {/* Timer Controls */}
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      onClick={() => setRestSecondsLeft((s) => s + 15)}
                      className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-emerald-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      +15 วินาที
                    </button>
                    <button
                      onClick={() => {
                        setIsResting(false);
                        setRestSecondsLeft(0);
                      }}
                      className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <FastForward className="w-3.5 h-3.5" />
                      <span>พร้อมแล้ว / ข้ามพัก</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* LIVE SET LOGGING INPUTS (When actively lifting) */
                <div className="bg-slate-50 rounded-3xl p-4 sm:p-5 border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      บันทึกการยกจริงใน เซ็ตที่ {currentSet}
                    </span>
                    <span className="text-xs text-slate-500">
                      เซ็ต {currentSet} จาก {currentExercise.sets || 3}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded-2xl border border-slate-200">
                      <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                        น้ำหนัก (กก. / lbs)
                      </label>
                      <input
                        type="text"
                        value={inputWeight}
                        onChange={(e) => setInputWeight(e.target.value)}
                        placeholder="เช่น 15, 20"
                        className="w-full text-lg font-black text-slate-800 focus:outline-none placeholder:text-slate-300"
                      />
                    </div>
                    <div className="bg-white p-3 rounded-2xl border border-slate-200">
                      <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                        จำนวนครั้ง (Reps)
                      </label>
                      <input
                        type="number"
                        value={inputReps}
                        onChange={(e) => setInputReps(e.target.value)}
                        placeholder="เช่น 10, 12"
                        className="w-full text-lg font-black text-slate-800 focus:outline-none placeholder:text-slate-300"
                      />
                    </div>
                  </div>

                  {/* Complete Set Button */}
                  <button
                    onClick={handleCompleteSet}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-black text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>
                      {currentSet >= (currentExercise.sets || 3)
                        ? "จบเซ็ตสุดท้าย & สลับท่าถัดไป"
                        : `ยกเซ็ตที่ ${currentSet} เสร็จแล้ว (เริ่มจับเวลาพัก)`}
                    </span>
                  </button>

                  {/* Quick Previous / Next Navigation */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      disabled={activeExerciseIndex === 0}
                      onClick={() => {
                        setActiveExerciseIndex((i) => Math.max(0, i - 1));
                        setCurrentSet(1);
                        setIsResting(false);
                      }}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800 disabled:opacity-30 flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>ท่าก่อนหน้า</span>
                    </button>
                    <button
                      disabled={activeExerciseIndex >= exercises.length - 1}
                      onClick={() => {
                        setActiveExerciseIndex((i) => Math.min(exercises.length - 1, i + 1));
                        setCurrentSet(1);
                        setIsResting(false);
                      }}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800 disabled:opacity-30 flex items-center gap-1 cursor-pointer"
                    >
                      <span>ข้ามไปท่าถัดไป</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= VIEW 2: OVERVIEW LIST MODE ================= */}
          {viewMode === "overview" && (
            <>
              {/* Start Live PT Banner */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-4 sm:p-5 text-white shadow-md flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-200">
                      NEW REAL-TIME COACHING
                    </span>
                  </div>
                  <h4 className="text-base font-black text-white mt-0.5">
                    โหมดเทรนเนอร์พาซ้อมแบบเรียลไทม์
                  </h4>
                  <p className="text-xs text-emerald-100 mt-0.5">
                    จับเวลาพักเซ็ตอัตโนมัติ บันทึกน้ำหนักจริง และโค้ชคอยกระตุ้นทีละเซ็ต
                  </p>
                </div>
                <button
                  id="start-live-pt-btn"
                  onClick={() => handleStartLive(0)}
                  className="px-4 py-3 bg-white hover:bg-emerald-50 text-emerald-800 font-black text-xs rounded-2xl shadow-lg transition-all shrink-0 flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Play className="w-4 h-4 fill-emerald-800" />
                  <span>เริ่มซ้อมทันที</span>
                </button>
              </div>

              {/* Progress Bar */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                  <span>ความคืบหน้าของวันนี้</span>
                  <span className="text-emerald-700 font-black">{progressPercent}% ({completedCount}/{totalExercisesCount} ท่า)</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
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
                    className="text-[11px] text-emerald-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3 h-3" />
                    <span>ปรับความหนัก</span>
                  </button>
                </div>
                <div className="space-y-2">
                  {workout.exercises.map((ex, idx) => {
                    const isChecked = !!completedExercises[ex.id];
                    return (
                      <div
                        key={ex.id}
                        className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                          isChecked
                            ? "bg-slate-50 border-slate-200 opacity-80"
                            : "bg-white border-slate-200 hover:border-emerald-300 shadow-xs"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleToggleExercise(ex.id)}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
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
                              {ex.sets} เซ็ต × {ex.reps} ครั้ง • {ex.targetMuscle || "ทั่วร่างกาย"}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleStartLive(idx)}
                          className="text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Play className="w-3 h-3 fill-emerald-700" />
                          <span>ซ้อมท่านี้</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* ================= VIEW 3: SUMMARY & CELEBRATION ================= */}
          {viewMode === "summary" && (
            <div className="text-center py-6 px-4 space-y-5 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <Trophy className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">
                  SESSION COMPLETED!
                </span>
                <h4 className="text-2xl font-black text-slate-900 mt-1">
                  ยินดีด้วย! คุณฝึกเสร็จสมบูรณ์แล้ว
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  การฝึกอย่างมีวินัยในวันนี้จะช่วยให้ร่างกายพัฒนาและเข้าใกล้เป้าหมายขึ้นอีกก้าว
                </p>
              </div>

              {/* Summary Stats Grid */}
              <div className="grid grid-cols-3 gap-2.5 max-w-sm mx-auto">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">ท่าฝึก</span>
                  <span className="text-base font-black text-slate-800">{totalExercisesCount} ท่า</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">เวลาฝึก</span>
                  <span className="text-base font-black text-emerald-700">{workout.durationMinutes || 45} นาที</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">เผาผลาญ</span>
                  <span className="text-base font-black text-amber-600">{workout.caloriesBurned || 320} kcal</span>
                </div>
              </div>

              {/* Coach Encouragement Quote */}
              <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 max-w-sm mx-auto text-left">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs mb-1">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>ข้อความจาก FitCoach AI</span>
                </div>
                <p className="text-xs text-emerald-900 leading-relaxed">
                  "ยอดเยี่ยมมากครับ! ร่างกายกำลังเริ่มกระบวนการซ่อมแซมและสร้างกล้ามเนื้อ อย่าลืมทานโปรตีนให้เพียงพอและพักผ่อนให้เต็มที่นะครับ"
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-2xl text-xs transition-colors cursor-pointer"
          >
            ปิด
          </button>

          {viewMode === "summary" ? (
            <button
              onClick={handleFinishAll}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>บันทึกผลการซ้อมเข้าสู่ระบบ</span>
            </button>
          ) : (
            <button
              id="finish-workout-btn"
              onClick={handleFinishAll}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>บันทึกว่าฝึกเสร็จแล้ว</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
