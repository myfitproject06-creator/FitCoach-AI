import React from "react";
import {
  Dumbbell,
  Utensils,
  Moon,
  Footprints,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Clock,
  Flame,
  ArrowRight,
  SlidersHorizontal,
  AlertTriangle,
  Shield,
  Bell,
  Zap,
} from "lucide-react";
import {
  WorkoutPlan,
  NutritionData,
  RecoveryData,
  ActivityData,
  FitnessStatus,
  UserProfile,
  Plan3MonthsData,
  CoachAccountabilityState,
} from "../types";

interface HomeViewProps {
  workout: WorkoutPlan;
  nutrition: NutritionData;
  recovery: RecoveryData;
  activity: ActivityData;
  status: FitnessStatus;
  profile: UserProfile;
  activePlan3Months?: Plan3MonthsData | null;
  accountability?: CoachAccountabilityState;
  onOpenPlan3Months?: () => void;
  onOpenWorkout: () => void;
  onOpenNutrition: () => void;
  onOpenRecovery: () => void;
  onOpenAdapt: () => void;
  onOpenLine: () => void;
  onTriggerCoachScenario?: (scenario: "18_00" | "overdue" | "penalty" | "meal_prompt") => void;
  onClearPenalty?: () => void;
  onOpenRichMenuStudio?: () => void;
  onOpenGoogleHealth?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  workout,
  nutrition,
  recovery,
  activity,
  status,
  profile,
  activePlan3Months,
  accountability,
  onOpenPlan3Months,
  onOpenWorkout,
  onOpenNutrition,
  onOpenRecovery,
  onOpenAdapt,
  onOpenLine,
  onTriggerCoachScenario,
  onClearPenalty,
  onOpenRichMenuStudio,
  onOpenGoogleHealth,
}) => {
  // Calculate completed daily tasks
  const tasks = [
    { id: "recovery", label: "บันทึกการนอน", done: true },
    { id: "workout", label: "ฝึก Upper Body", done: workout.isCompleted || false },
    { id: "nutrition", label: "โภชนาการ", done: nutrition.currentCalories >= 1500 },
    { id: "activity", label: "กิจกรรม 8,000 ก้าว", done: activity.currentSteps >= activity.targetSteps },
  ];
  const completedCount = tasks.filter((t) => t.done).length;

  return (
    <div className="space-y-4 pb-24">
      {/* Date & Greeting Banner */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400">
            วันพุธที่ 18 มิถุนายน 2568
          </p>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">
            นี่คือแผนของคุณวันนี้
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-[10px] text-slate-400 font-medium">ความพร้อมวันนี้</p>
            <p className="text-xs font-bold text-emerald-600">
              Condition {status.condition}% · ดี
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs border border-emerald-200">
            {status.condition}%
          </div>
        </div>
      </div>

      {/* Transformation Plan Banner if active */}
      {activePlan3Months && (
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white rounded-2xl p-4 shadow-lg border border-emerald-500/30 space-y-2.5 relative overflow-hidden animate-in fade-in duration-300">
          <div className="absolute right-0 top-0 translate-x-6 -translate-y-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-xs font-bold border border-emerald-500/30">
                🕷️
              </span>
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                ACTIVE TRANSFORMATION PLAN ({activePlan3Months.totalDuration})
              </span>
            </div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-semibold border border-emerald-500/30">
              {activePlan3Months.totalDuration}
            </span>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white">
              {activePlan3Months.goalName}
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              แผนการฝึกแบบ V-Taper, ตารางรายวัน 7 วัน, ข้อมูลโภชนาการ และเสาหลักการพักผ่อน
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-800">
            <div className="text-[10px] text-slate-400">
              <span className="text-emerald-400 font-semibold">{activePlan3Months.phases.length} เฟสหลัก</span> • {activePlan3Months.dailyMeals.length} มื้ออาหารต่อวัน
            </div>
            <button
              onClick={onOpenPlan3Months}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 active:scale-95"
            >
              <span>ดูแผนฉบับเต็ม ({activePlan3Months.totalDuration})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Coach Accountability & Proactive Tracking Card */}
      <div
        className={`rounded-2xl p-4 shadow-md border transition-all ${
          accountability?.penaltyActive
            ? "bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 border-rose-500/50 text-white"
            : accountability?.status === "overdue"
            ? "bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border-amber-500/50 text-white"
            : "bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 border-emerald-500/30 text-white"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                accountability?.penaltyActive
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                  : accountability?.status === "overdue"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
              }`}
            >
              {accountability?.penaltyActive ? "🚨" : accountability?.status === "overdue" ? "⚠️" : "🛡️"}
            </span>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 block">
                FITCOACH DISCIPLINE & ACCOUNTABILITY
              </span>
              <h3 className="text-xs font-bold text-white">
                {accountability?.penaltyActive
                  ? `บทลงโทษทางวินัย (Strike ${accountability?.strikes || 3}/3)`
                  : accountability?.status === "overdue"
                  ? "เลยเวลานัดซ้อมแล้ว! โค้ชกำลังติดตาม"
                  : `มีนัดซ้อมเวลา ${accountability?.scheduledTime || "18:00"} น. (ตรงเวลา)`}
              </h3>
            </div>
          </div>

          <span
            className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
              accountability?.penaltyActive
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                : accountability?.status === "overdue"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse"
                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
            }`}
          >
            {accountability?.penaltyActive
              ? "Penalty Active"
              : accountability?.status === "overdue"
              ? "Overdue Alert"
              : "On Schedule"}
          </span>
        </div>

        {/* Message / context */}
        <p className="text-xs text-slate-200 mt-2 leading-relaxed">
          {accountability?.penaltyActive ? (
            <span>
              🚨 คุณขาดการเข้าซ้อมตามโปรแกรมที่กำหนด! โค้ชออกบทลงโทษชดเชย:{" "}
              <strong className="text-rose-300">
                {accountability.penaltyTask || "Burpees 15 ครั้ง หรือ Push-ups 25 ครั้ง"}
              </strong>
            </span>
          ) : accountability?.status === "overdue" ? (
            <span>
              ⏰ เลยเวลา 18:00 น. มาแล้ว โค้ชจะส่งข้อความเตือนคุณเรื่อยๆ จนกว่าจะเริ่มซ้อม
              หรือลงโทษหากขาดซ้อมครับ!
            </span>
          ) : (
            <span>
              วันนี้มีซ้อม <strong>{workout.titleTh || workout.title}</strong> ตอน 18:00 น.
              และส่งเมนูอาหารมาให้โค้ชคำนวณบันทึกในแอปได้ตลอดวันครับ
            </span>
          )}
        </p>

        {/* Actions & Scenario Simulation Bar */}
        <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {accountability?.penaltyActive && onClearPenalty ? (
              <button
                onClick={onClearPenalty}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-[11px] font-bold transition-all shadow-xs flex items-center gap-1"
              >
                <span>ส่งการบ้านชดเชย</span>
              </button>
            ) : (
              <button
                onClick={onOpenWorkout}
                className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-[11px] font-bold transition-all shadow-xs flex items-center gap-1"
              >
                <Dumbbell className="w-3 h-3" />
                <span>เริ่มซ้อมทันที</span>
              </button>
            )}

            <button
              onClick={onOpenLine}
              className="px-2.5 py-1 bg-[#06C755] hover:bg-[#05b34c] text-white rounded-xl text-[11px] font-bold transition-colors flex items-center gap-1 shadow-xs"
            >
              <span>เปิด LINE แชท</span>
              <ArrowRight className="w-3 h-3 text-white" />
            </button>

            {onOpenRichMenuStudio && (
              <button
                onClick={onOpenRichMenuStudio}
                className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-emerald-300 hover:text-white rounded-xl text-[11px] font-semibold transition-colors flex items-center gap-1 border border-white/10"
                title="เปิดเครื่องมือออกแบบและดาวน์โหลด LINE Rich Menu (2500x1686)"
              >
                <span>🎨 Rich Menu</span>
              </button>
            )}

            {onOpenGoogleHealth && (
              <button
                onClick={onOpenGoogleHealth}
                className="px-2.5 py-1 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 hover:text-white rounded-xl text-[11px] font-semibold transition-colors flex items-center gap-1 border border-teal-500/30"
                title="ซิงค์ข้อมูลก้าวเดิน & การนอนจาก Google Health (Google Fit)"
              >
                <span>❤️ Google Health</span>
              </button>
            )}
          </div>

          {/* Interactive Proactive Coach Scenario Triggers */}
          {onTriggerCoachScenario && (
            <div className="flex items-center gap-1 overflow-x-auto text-[10px]">
              <span className="text-slate-400 mr-0.5 text-[9px]">จำลองสถานการณ์:</span>
              <button
                onClick={() => onTriggerCoachScenario("18_00")}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-lg border border-slate-700 transition-colors whitespace-nowrap"
                title="จำลองถึงเวลานัดซ้อม 18:00 น."
              >
                🕒 18:00 น.
              </button>
              <button
                onClick={() => onTriggerCoachScenario("overdue")}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg border border-slate-700 transition-colors whitespace-nowrap"
                title="จำลองเลยเวลาซ้อม โค้ชตามจิก"
              >
                ⚠️ ตามซ้อม
              </button>
              <button
                onClick={() => onTriggerCoachScenario("penalty")}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-rose-300 rounded-lg border border-slate-700 transition-colors whitespace-nowrap"
                title="จำลองโดดซ้อม เริ่มบทลงโทษ"
              >
                🚨 สั่งลงโทษ
              </button>
              <button
                onClick={() => onTriggerCoachScenario("meal_prompt")}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-lg border border-slate-700 transition-colors whitespace-nowrap"
                title="โค้ชทวงถามเมนูอาหารประจำวัน"
              >
                🥗 ทวงอาหาร
              </button>
            </div>
          )}
        </div>
      </div>

      {/* AI Coach Daily Guidance Box */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-4 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                คำแนะนำจากเทรนเนอร์วันนี้
              </span>
              <button
                id="coach-line-checkin-btn"
                onClick={onOpenLine}
                className="text-[11px] text-slate-300 hover:text-white underline underline-offset-2 flex items-center gap-0.5"
              >
                คุยกับโค้ช <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed mt-1">
              {workout.isAdapted ? (
                <span>
                  ⚡ <strong>ผมปรับแผนวันนี้ให้แล้ว:</strong> {workout.coachNote || "ลดความหนักลงเพื่อให้ร่างกายได้ฟื้นฟูโดยยังคงความต่อเนื่องครับ"}
                </span>
              ) : (
                <span>
                  "วันนี้เป็น <strong>Upper Body</strong> เน้นกล้ามเนื้ออก ไหล่ และหลัง คุมจังหวะผ่อนน้ำหนักให้ช้า 2 วินาที หากรู้สึกเหนื่อยหรือมีเวลาน้อย บอกผมเพื่อปรับแผนได้เสมอนะครับ"
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Quick button to adapt today's plan */}
        <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            รู้สึกไม่พร้อม / มีเวลาจำกัด?
          </span>
          <button
            id="adapt-workout-btn"
            onClick={onOpenAdapt}
            className="flex items-center gap-1 text-[11px] font-semibold text-emerald-300 hover:text-emerald-200 bg-emerald-950/60 hover:bg-emerald-900/60 px-2.5 py-1 rounded-full border border-emerald-500/30 transition-colors"
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>ปรับแผนวันนี้</span>
          </button>
        </div>
      </div>

      {/* Daily Progress summary indicator */}
      <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
            {completedCount}/{tasks.length}
          </div>
          <span className="text-xs font-semibold text-slate-700">
            ความคืบหน้าประจำวัน ({completedCount} จาก {tasks.length} เสร็จแล้ว)
          </span>
        </div>
        <div className="flex gap-1.5">
          {tasks.map((t) => (
            <div
              key={t.id}
              title={t.label}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                t.done ? "bg-emerald-500 ring-2 ring-emerald-200" : "bg-slate-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* 1. TRAIN CARD (Primary & Prominent) */}
      <div
        id="card-train"
        className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 hover:border-slate-300 transition-all overflow-hidden relative"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <Dumbbell className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600">
                TRAIN · การฝึก
              </span>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                {workout.titleTh}
                {workout.isAdapted && (
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-1.5 py-0.5 rounded-full">
                    ปรับเบาลง
                  </span>
                )}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {workout.durationMinutes} นาที
            </span>
            <span className="w-1 h-1 bg-slate-300 rounded-full" />
            <span>ระดับ{workout.intensity}</span>
          </div>
        </div>

        {/* Workout Preview thumbnail & details */}
        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 mb-3">
          <img
            src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=300&q=80"
            alt="Workout preview"
            className="w-14 h-14 rounded-lg object-cover shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 truncate">
              {workout.exercises[0]?.name || "Bench Press"} และอีก {workout.exercises.length - 1} ท่า
            </p>
            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
              เป้าหมาย: สร้างกล้ามเนื้ออก หัวไหล่ และหลัง
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] bg-slate-200/80 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                {workout.exercises.length} ท่าฝึก
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-medium">
                {workout.isCompleted ? "ฝึกเสร็จแล้ว 🎉" : "พร้อมฝึก"}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          id="start-workout-main-btn"
          onClick={onOpenWorkout}
          className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm ${
            workout.isCompleted
              ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
              : "bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.99]"
          }`}
        >
          {workout.isCompleted ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>ดูสรุปผลการฝึก</span>
            </>
          ) : (
            <>
              <span>เริ่มออกกำลังกาย</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* 2. NUTRITION CARD */}
      <div
        id="card-nutrition"
        onClick={onOpenNutrition}
        className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 hover:border-slate-300 transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Utensils className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                EAT · โภชนาการ
              </span>
              <h3 className="text-sm font-bold text-slate-900">
                {nutrition.currentCalories.toLocaleString()} / {nutrition.targetCalories.toLocaleString()} kcal
              </h3>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden my-2">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, (nutrition.currentCalories / nutrition.targetCalories) * 100)}%`,
            }}
          />
        </div>

        {/* Macros summary */}
        <div className="flex items-center justify-between text-xs pt-1 text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>โปรตีน: <strong>{nutrition.currentProtein} / {nutrition.targetProtein}g</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>คาร์บ: <strong>{nutrition.currentCarbs} / {nutrition.targetCarbs}g</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span>ไขมัน: <strong>{nutrition.currentFat} / {nutrition.targetFat}g</strong></span>
          </div>
        </div>
      </div>

      {/* 3. RECOVERY CARD & 4. ACTIVITY CARD (Grid 2 columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Recovery Card */}
        <div
          id="card-recovery"
          onClick={onOpenRecovery}
          className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Moon className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1">
              {recovery.isFromGoogleHealth && (
                <span className="text-[9px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded-md">
                  ✓ Google Fit
                </span>
              )}
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                {recovery.quality}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
              RECOVER · การนอน
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <h4 className="text-base font-bold text-slate-900 mt-0.5">
            {recovery.sleepHours} ชม. {recovery.sleepMinutes} นาที
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            เป้าหมาย: {recovery.targetSleepHours} {recovery.sleepStart && `(${recovery.sleepStart} - ${recovery.sleepEnd})`}
          </p>
        </div>

        {/* Activity Card */}
        <div
          id="card-activity"
          onClick={onOpenGoogleHealth}
          className={`bg-white rounded-2xl p-4 shadow-sm border border-slate-200 hover:border-slate-300 transition-all ${
            onOpenGoogleHealth ? "cursor-pointer group" : ""
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Footprints className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1">
              {activity.isFromGoogleHealth && (
                <span className="text-[9px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded-md">
                  ✓ Google Fit
                </span>
              )}
              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                {Math.round((activity.currentSteps / activity.targetSteps) * 100)}%
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-600">
              ACTIVITY · ก้าวเดิน
            </span>
            {onOpenGoogleHealth && (
              <span className="text-[10px] text-teal-600 font-semibold group-hover:underline flex items-center gap-0.5">
                ซิงค์ข้อมูล →
              </span>
            )}
          </div>
          <h4 className="text-base font-bold text-slate-900 mt-0.5">
            {activity.currentSteps.toLocaleString()} ก้าว
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            เป้าหมาย: {activity.targetSteps.toLocaleString()} ก้าว ({activity.distanceKm} กม.)
          </p>
        </div>
      </div>
    </div>
  );
};
