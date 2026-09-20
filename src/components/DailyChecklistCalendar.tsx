import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Dumbbell,
  Flame,
  TrendingUp,
  XCircle,
  Moon,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Edit3,
  Sparkles,
  Info,
  Check,
  X,
} from "lucide-react";
import type { CoachPlan, PlanDay, PlanDayStatus, CoachPlanStats } from "../types";

interface DailyChecklistCalendarProps {
  onSelectDayForWorkout?: (day: PlanDay) => void;
  onOpenLine?: () => void;
}

// Bangkok date helper: YYYY-MM-DD
function getBangkokToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
}

function formatDateThai(dateStr: string): {
  dayName: string;
  dayShort: string;
  dateNum: number;
  monthShort: string;
  fullDate: string;
} {
  const d = new Date(dateStr + "T00:00:00Z");
  const thaiDays = ["วันอาทิตย์", "วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์", "วันเสาร์"];
  const thaiDaysShort = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
  const thaiMonths = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
  ];

  const dayOfWeek = d.getUTCDay();
  const dateNum = d.getUTCDate();
  const monthNum = d.getUTCMonth();

  return {
    dayName: thaiDays[dayOfWeek] || "",
    dayShort: thaiDaysShort[dayOfWeek] || "",
    dateNum,
    monthShort: thaiMonths[monthNum] || "",
    fullDate: `${dateNum} ${thaiMonths[monthNum]}`,
  };
}

// Generate default 4-week program if none exists
function generateDefaultPlan(todayStr: string): CoachPlan {
  const [y, m, d] = todayStr.split("-").map(Number);
  const now = new Date(Date.UTC(y, m - 1, d));

  // Align start to the Monday of the current week
  const dayOfWeek = (now.getUTCDay() + 6) % 7; // 0 = Mon
  const monday = new Date(now.getTime() - dayOfWeek * 86400000);

  const days: PlanDay[] = [];
  const workoutTemplates = [
    { title: "Upper Body Hypertrophy (อก/หลัง/แขน)", focus: "อก, หลัง, หัวไหล่, แขน", isRest: false, duration: 45 },
    { title: "Lower Body & Core (ขา/ก้น/แกนกลาง)", focus: "ต้นขา, ก้น, น่อง, ท้อง", isRest: false, duration: 50 },
    { title: "วันพักฟื้นตัว (Active Recovery & Walk)", focus: "พักผ่อน ยืดเหยียด เดินเบาๆ", isRest: true, duration: 20 },
    { title: "Push & Core Power (ดัน/หัวไหล่/ท้อง)", focus: "อกบน, ไหล่ข้าง, หน้าท้อง", isRest: false, duration: 45 },
    { title: "Pull & Posterior Chain (ดึง/หลังส่วนบน)", focus: "ปีก, หลังแขน, แฮมสตริง", isRest: false, duration: 45 },
    { title: "Metabolic HIIT & Mobility", focus: "คาร์ดิโอ สลายไขมัน ยืดกล้ามเนื้อ", isRest: false, duration: 35 },
    { title: "วันพักผ่อนเต็มวัน (Complete Rest)", focus: "นอนหลับให้พอ โภชนาการคลีน", isRest: true, duration: 0 },
  ];

  const totalWeeks = 4;
  for (let w = 0; w < totalWeeks; w++) {
    for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
      const dayDate = new Date(monday.getTime() + (w * 7 + dayIdx) * 86400000);
      const dateStr = dayDate.toISOString().slice(0, 10);
      const t = workoutTemplates[dayIdx];
      const isPast = dateStr < todayStr;
      const isToday = dateStr === todayStr;

      let status: PlanDayStatus = t.isRest ? "rest" : "pending";
      let markedBy: "user" | "coach" | undefined = undefined;
      let completedAt: string | undefined = undefined;

      // Sample progress for demonstration if in past
      if (isPast) {
        if (t.isRest) {
          status = "rest";
        } else {
          status = "done";
          markedBy = "coach";
          completedAt = "18:45 น.";
        }
      } else if (isToday) {
        status = t.isRest ? "rest" : "pending";
      }

      days.push({
        date: dateStr,
        type: t.isRest ? "rest" : "workout",
        title: t.isRest ? "วันพักฟื้นตัว" : t.title,
        focus: t.focus,
        isRestDay: t.isRest,
        durationMinutes: t.duration,
        status,
        markedBy,
        completedAt,
        exercises: t.isRest
          ? []
          : [
              { name: "Dumbbell Bench Press", nameTh: "ดัมเบลล์เบนช์เพรส", sets: 3, reps: "10-12", restSeconds: 60, note: "อก" },
              { name: "Lat Pulldown", nameTh: "ดึงหลังปีก", sets: 3, reps: "10-12", restSeconds: 60, note: "หลัง" },
              { name: "Dumbbell Shoulder Press", nameTh: "ไหล่ดัมเบลล์", sets: 3, reps: "12", restSeconds: 45, note: "ไหล่" },
            ],
      });
    }
  }

  const startDate = days[0].date;
  const endDate = days[days.length - 1].date;

  return {
    id: "default_starter_4weeks",
    title: "โปรแกรมเสริมกล้ามเนื้อและลดไขมัน 4 สัปดาห์ (AI Hypertrophy & Fat Loss)",
    goal: "เพิ่มกล้ามเนื้อ กระชับสัดส่วน และสร้างวินัยการซ้อมต่อเนื่อง",
    startDate,
    endDate,
    status: "active",
    durationWeeks: totalWeeks,
    daysPerWeek: 5,
    phases: [
      { name: "Phase 1: Foundation & Habit Building", weeks: 2, focus: "สร้างฟอร์มการเคลื่อนไหวที่ถูกต้องและเริ่มปรับโภชนาการ" },
      { name: "Phase 2: Progressive Overload", weeks: 2, focus: "เพิ่มความหนักและพัฒนาความทนทานของกล้ามเนื้อ" },
    ],
    days,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export const DailyChecklistCalendar: React.FC<DailyChecklistCalendarProps> = ({
  onSelectDayForWorkout,
  onOpenLine,
}) => {
  const todayStr = useMemo(() => getBangkokToday(), []);
  const [plan, setPlan] = useState<CoachPlan | null>(null);
  const [stats, setStats] = useState<CoachPlanStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);
  const [expandedWeeks, setExpandedWeeks] = useState<Record<number, boolean>>({});
  const [filterMode, setFilterMode] = useState<"all" | "this_week" | "workouts_only">("all");

  // Modal for editing day status
  const [editingDay, setEditingDay] = useState<PlanDay | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<PlanDayStatus>("done");
  const [userNote, setUserNote] = useState<string>("");
  const [postponedTime, setPostponedTime] = useState<string>("19:00");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Fetch active plan
  const loadActivePlan = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/coach-plan/active");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.plan && Array.isArray(data.plan.days) && data.plan.days.length > 0) {
          setPlan(data.plan);
          setStats(data.stats);
          return;
        }
      }
      // Fallback default 4-week plan
      const fallback = generateDefaultPlan(todayStr);
      setPlan(fallback);
      recalculateStatsLocally(fallback);
    } catch (err) {
      console.warn("Error loading coach plan:", err);
      const fallback = generateDefaultPlan(todayStr);
      setPlan(fallback);
      recalculateStatsLocally(fallback);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivePlan();
  }, [todayStr]);

  // Recalculate stats locally
  const recalculateStatsLocally = (currPlan: CoachPlan) => {
    const days = currPlan.days || [];
    const totalDays = days.length;
    const workoutDays = days.filter((d) => !d.isRestDay && d.type !== "rest");
    const totalWorkouts = workoutDays.length;
    const completedDays = days.filter((d) => d.status === "done").length;
    const remainingDays = Math.max(0, totalDays - days.filter((d) => d.status === "done" || (d.isRestDay && d.date <= todayStr)).length);

    // Calculate current week
    const todayIndex = days.findIndex((d) => d.date === todayStr);
    const currentDayIndex = todayIndex >= 0 ? todayIndex : 0;
    const currentWeekIdx = Math.floor(currentDayIndex / 7);
    const weekStart = currentWeekIdx * 7;
    const weekDays = days.slice(weekStart, weekStart + 7);
    const weekWorkouts = weekDays.filter((d) => !d.isRestDay && d.type !== "rest");
    const weekCompleted = weekWorkouts.filter((d) => d.status === "done").length;

    // Streak
    let streak = 0;
    const sortedPastDays = days
      .filter((d) => d.date <= todayStr)
      .sort((a, b) => b.date.localeCompare(a.date));

    for (const d of sortedPastDays) {
      if (d.status === "done" || d.status === "rest" || d.isRestDay) {
        if (d.status === "done") streak++;
      } else if (d.date < todayStr && d.status === "missed") {
        break;
      }
    }

    const pastWorkouts = days.filter((d) => !d.isRestDay && d.date <= todayStr);
    const pastDone = pastWorkouts.filter((d) => d.status === "done").length;
    const consistencyRate = pastWorkouts.length > 0 ? Math.round((pastDone / pastWorkouts.length) * 100) : 100;

    setStats({
      totalDays,
      totalWorkouts,
      completedDays,
      remainingDays,
      currentDayIndex,
      weekCompleted,
      weekTotalWorkouts: weekWorkouts.length,
      streakDays: streak,
      consistencyRate,
    });
  };

  // Group days by week (7 days per week)
  const weeks = useMemo(() => {
    if (!plan || !plan.days) return [];
    const result: { weekNumber: number; days: PlanDay[]; isCurrentWeek: boolean; completedCount: number; workoutCount: number }[] = [];
    const totalDays = plan.days.length;
    const numWeeks = Math.ceil(totalDays / 7);

    for (let w = 0; w < numWeeks; w++) {
      const slice = plan.days.slice(w * 7, (w + 1) * 7);
      const isCurrentWeek = slice.some((d) => d.date === todayStr);
      const workoutDays = slice.filter((d) => !d.isRestDay && d.type !== "rest");
      const completedCount = workoutDays.filter((d) => d.status === "done").length;

      result.push({
        weekNumber: w + 1,
        days: slice,
        isCurrentWeek,
        completedCount,
        workoutCount: workoutDays.length,
      });
    }

    return result;
  }, [plan, todayStr]);

  // Default expand all weeks or current week
  useEffect(() => {
    if (weeks.length > 0 && Object.keys(expandedWeeks).length === 0) {
      const init: Record<number, boolean> = {};
      weeks.forEach((w) => {
        // Expand all weeks by default for quick scanning
        init[w.weekNumber] = true;
      });
      setExpandedWeeks(init);
    }
  }, [weeks]);

  const toggleWeek = (weekNum: number) => {
    setExpandedWeeks((prev) => ({ ...prev, [weekNum]: !prev[weekNum] }));
  };

  // Open status editor
  const handleOpenEdit = (day: PlanDay) => {
    setEditingDay(day);
    setSelectedStatus(day.status || "done");
    setUserNote(day.userNote || "");
    setPostponedTime(day.postponedToTime || "19:00");
    setStatusMessage(null);
  };

  // Submit day status update
  const handleSaveStatus = async () => {
    if (!editingDay || !plan) return;
    setUpdating(true);
    setStatusMessage(null);

    const targetDate = editingDay.date;
    const finalNote = userNote.trim() || undefined;
    const finalPostponedTime = selectedStatus === "postponed" ? postponedTime : undefined;

    try {
      const res = await fetch("/api/coach-plan/day-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: targetDate,
          status: selectedStatus,
          userNote: finalNote,
          postponedToTime: finalPostponedTime,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.plan) {
          setPlan(json.plan);
          setStats(json.stats);
          setEditingDay(null);
          return;
        }
      }

      // Fallback local update
      const updatedDays = plan.days.map((d) => {
        if (d.date === targetDate) {
          return {
            ...d,
            status: selectedStatus,
            userNote: finalNote,
            postponedToTime: finalPostponedTime,
            markedBy: "user" as const,
            completedAt: selectedStatus === "done" ? new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) : d.completedAt,
          };
        }
        return d;
      });

      const updatedPlan: CoachPlan = {
        ...plan,
        days: updatedDays,
        updatedAt: new Date().toISOString(),
      };
      setPlan(updatedPlan);
      recalculateStatsLocally(updatedPlan);
      setEditingDay(null);
    } catch (err: any) {
      console.warn("Failed to update status on server:", err);
      // Fallback local update
      const updatedDays = plan.days.map((d) => {
        if (d.date === targetDate) {
          return {
            ...d,
            status: selectedStatus,
            userNote: finalNote,
            postponedToTime: finalPostponedTime,
            markedBy: "user" as const,
          };
        }
        return d;
      });
      const updatedPlan = { ...plan, days: updatedDays };
      setPlan(updatedPlan);
      recalculateStatsLocally(updatedPlan);
      setEditingDay(null);
    } finally {
      setUpdating(false);
    }
  };

  // Status visual badges mapping
  const renderStatusBadge = (day: PlanDay) => {
    const isToday = day.date === todayStr;

    switch (day.status) {
      case "done":
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>สำเร็จ</span>
            {day.completedAt && <span className="text-[10px] text-emerald-700 font-normal hidden sm:inline">({day.completedAt})</span>}
          </div>
        );
      case "postponed":
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>เลื่อน</span>
            {day.postponedToTime && (
              <span className="text-[10px] text-amber-700 font-semibold">{day.postponedToTime}</span>
            )}
          </div>
        );
      case "missed":
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold border border-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>พลาด</span>
            {day.userNote && (
              <span className="text-[10px] text-rose-700 max-w-[90px] truncate hidden sm:inline font-normal">
                ({day.userNote})
              </span>
            )}
          </div>
        );
      case "rest":
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200">
            <Moon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>วันพัก</span>
          </div>
        );
      case "pending":
      default:
        return (
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            isToday
              ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold"
              : "bg-slate-50 text-slate-400 border-slate-200"
          }`}>
            <span className={`w-2 h-2 rounded-full ${isToday ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
            <span>{isToday ? "รอซ้อมวันนี้" : "ยังมาไม่ถึง"}</span>
          </div>
        );
    }
  };

  if (loading && !plan) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <RefreshCw className="w-6 h-6 text-emerald-500 animate-spin mx-auto" />
        <p className="text-sm font-medium text-slate-600">กำลังโหลดปฏิทินตลอดโปรแกรม...</p>
      </div>
    );
  }

  const currentConsistency = stats?.consistencyRate ?? 100;
  const streak = stats?.streakDays ?? 0;
  const completed = stats?.completedDays ?? 0;
  const totalWorkouts = stats?.totalWorkouts ?? (plan?.days?.filter((d) => !d.isRestDay).length || 20);
  const totalDays = stats?.totalDays ?? (plan?.days?.length || 28);
  const durationWeeks = plan?.durationWeeks || Math.ceil(totalDays / 7) || 4;

  return (
    <div className="space-y-4">
      {/* 1. Overview Summary Dashboard */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-5 shadow-sm border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/60 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
                <CalendarIcon className="w-4 h-4" />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                DAILY CHECKLIST CALENDAR ({durationWeeks} สัปดาห์ • {totalDays} วัน)
              </span>
            </div>
            <h2 className="text-base font-bold text-white mt-1">
              {plan?.title || "โปรแกรมออกกำลังกายและเช็คลิสต์รายวัน"}
            </h2>
          </div>

          <button
            onClick={loadActivePlan}
            className="self-start sm:self-auto flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-full border border-slate-700 transition-colors"
            title="รีเฟรชข้อมูลล่าสุดจาก LINE และเซิร์ฟเวอร์"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>ซิงค์สถานะ</span>
          </button>
        </div>

        {/* 4 Essential Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
              ทำไปแล้ว
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-black text-white">{completed}</span>
              <span className="text-xs text-slate-400 font-semibold">/ {totalWorkouts} วัน</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-medium block mt-0.5">
              {totalWorkouts > 0 ? Math.round((completed / totalWorkouts) * 100) : 0}% ของเป้าหมาย
            </span>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
              ความสม่ำเสมอ
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-black text-emerald-400">{currentConsistency}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-1.5 mt-1.5 overflow-hidden">
              <div
                className="bg-emerald-400 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, currentConsistency))}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
              STREAK ปัจจุบัน
            </span>
            <div className="flex items-center gap-1 mt-1">
              <Flame className="w-5 h-5 text-amber-400" />
              <span className="text-xl font-black text-amber-400">{streak}</span>
              <span className="text-xs text-slate-400 font-semibold">วันติด</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">วินัยสม่ำเสมอ 🔥</span>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
              สถานะวันนี้
            </span>
            <div className="mt-1">
              {(() => {
                const todayDay = plan?.days?.find((d) => d.date === todayStr);
                if (!todayDay) return <span className="text-xs text-slate-400">ยังไม่มีแผน</span>;
                if (todayDay.status === "done") return <span className="text-sm font-bold text-emerald-400">✅ ซ้อมเสร็จแล้ว</span>;
                if (todayDay.status === "rest" || todayDay.isRestDay) return <span className="text-sm font-bold text-sky-400">💤 วันพักผ่อน</span>;
                if (todayDay.status === "postponed") return <span className="text-sm font-bold text-amber-400">⏰ เลื่อน {todayDay.postponedToTime || ""}</span>;
                return <span className="text-sm font-bold text-slate-200">⏳ รอดำเนินการ</span>;
              })()}
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">คลิกติ๊กในปฏิทินได้</span>
          </div>
        </div>

        {/* Informative Hint Banner */}
        <div className="flex items-center gap-2 p-2.5 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-xs text-emerald-200">
          <Info className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>ข้อมูลเดียวกันทั้ง LINE และเว็บ:</strong> โค้ชจะอัปเดตสถานะอัตโนมัติเมื่อรายงานใน LINE หรือกดที่การ์ดวันเพื่อเปลี่ยนสถานะย้อนหลังได้เลยครับ
          </span>
        </div>
      </div>

      {/* 2. Filter & Controls Bar */}
      <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-700 mr-1">มุมมอง:</span>
          <button
            onClick={() => setFilterMode("all")}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              filterMode === "all"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            ทั้งโปรแกรม ({weeks.length} สัปดาห์)
          </button>
          <button
            onClick={() => setFilterMode("this_week")}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              filterMode === "this_week"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            สัปดาห์นี้
          </button>
          <button
            onClick={() => setFilterMode("workouts_only")}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              filterMode === "workouts_only"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            เฉพาะวันซ้อม
          </button>
        </div>

        <span className="text-[11px] text-slate-400 font-medium">
          💡 แตะที่วันเพื่อเปลี่ยนสถานะ
        </span>
      </div>

      {/* 3. Weeks & Days List */}
      <div className="space-y-4">
        {weeks.map((week) => {
          if (filterMode === "this_week" && !week.isCurrentWeek) return null;

          const isExpanded = expandedWeeks[week.weekNumber] ?? true;
          const displayedDays = filterMode === "workouts_only"
            ? week.days.filter((d) => !d.isRestDay && d.type !== "rest")
            : week.days;

          return (
            <div
              key={week.weekNumber}
              className={`bg-white rounded-3xl shadow-sm border transition-all overflow-hidden ${
                week.isCurrentWeek
                  ? "border-emerald-300 ring-2 ring-emerald-500/10"
                  : "border-slate-200"
              }`}
            >
              {/* Week Header Accordion Bar */}
              <div
                onClick={() => toggleWeek(week.weekNumber)}
                className={`flex items-center justify-between p-4 cursor-pointer select-none transition-colors ${
                  week.isCurrentWeek ? "bg-emerald-50/50 hover:bg-emerald-50" : "bg-slate-50/70 hover:bg-slate-100/70"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center ${
                      week.isCurrentWeek
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    W{week.weekNumber}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">
                        สัปดาห์ที่ {week.weekNumber} (Week {week.weekNumber})
                      </h3>
                      {week.isCurrentWeek && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                          สัปดาห์ปัจจุบัน
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      ซ้อมสำเร็จ {week.completedCount} จาก {week.workoutCount} วัน
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-600">
                    {week.workoutCount > 0
                      ? `${Math.round((week.completedCount / week.workoutCount) * 100)}%`
                      : "พัก"}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Days Grid in Week */}
              {isExpanded && (
                <div className="p-3 divide-y divide-slate-100">
                  {displayedDays.map((day) => {
                    const dateInfo = formatDateThai(day.date);
                    const isToday = day.date === todayStr;

                    return (
                      <div
                        key={day.date}
                        onClick={() => handleOpenEdit(day)}
                        className={`py-3 px-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-all hover:bg-slate-50 group ${
                          isToday
                            ? "bg-emerald-50/70 border border-emerald-200 shadow-sm"
                            : ""
                        }`}
                      >
                        {/* Day Info */}
                        <div className="flex items-center gap-3">
                          {/* Date Bubble */}
                          <div
                            className={`w-11 h-11 rounded-2xl flex flex-col items-center justify-center shrink-0 border transition-all ${
                              isToday
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-400/30"
                                : day.status === "done"
                                ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                                : day.status === "rest" || day.isRestDay
                                ? "bg-slate-100 text-slate-500 border-slate-200"
                                : "bg-white text-slate-700 border-slate-200 group-hover:border-slate-300"
                            }`}
                          >
                            <span className="text-[9px] font-bold uppercase tracking-tight leading-none">
                              {dateInfo.dayShort}
                            </span>
                            <span className="text-sm font-black leading-tight mt-0.5">
                              {dateInfo.dateNum}
                            </span>
                          </div>

                          {/* Day Details */}
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-slate-900">
                                {dateInfo.dayName} ({dateInfo.fullDate})
                              </span>
                              {isToday && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white shadow-xs animate-pulse">
                                  วันนี้ (Today)
                                </span>
                              )}
                              {day.markedBy === "coach" && (
                                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  โค้ชติ๊กให้ 🤖
                                </span>
                              )}
                              {day.markedBy === "user" && day.status === "done" && (
                                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  คุณติ๊กเอง 👤
                                </span>
                              )}
                            </div>

                            <p className="text-xs font-semibold text-slate-700 mt-0.5 flex items-center gap-1.5">
                              {day.isRestDay || day.type === "rest" ? (
                                <span className="text-slate-500 flex items-center gap-1">
                                  <Moon className="w-3.5 h-3.5 text-slate-400" />
                                  วันพักผ่อน ฟื้นฟูกล้ามเนื้อ
                                </span>
                              ) : (
                                <span className="text-slate-800 flex items-center gap-1">
                                  <Dumbbell className="w-3.5 h-3.5 text-emerald-600" />
                                  {day.title}
                                </span>
                              )}
                            </p>

                            {/* User notes or reason if missed/postponed */}
                            {day.userNote && (
                              <p className="text-[11px] text-slate-500 mt-0.5 italic">
                                หมายเหตุ: "{day.userNote}"
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Status & Edit Indicator */}
                        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                          {renderStatusBadge(day)}

                          <button
                            type="button"
                            className="p-1.5 text-slate-400 group-hover:text-slate-700 rounded-lg hover:bg-white transition-colors"
                            title="แก้ไขสถานะ"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 4. Modal: Edit Status for a Day */}
      {editingDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  อัปเดตสถานะวันซ้อม
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  {formatDateThai(editingDay.date).dayName} ({formatDateThai(editingDay.date).fullDate})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingDay.isRestDay ? "วันพักผ่อน" : editingDay.title}
                </p>
              </div>
              <button
                onClick={() => setEditingDay(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 5 Status Options */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                เลือกสถานะของวันนี้:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Done */}
                <button
                  type="button"
                  onClick={() => setSelectedStatus("done")}
                  className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-all text-left ${
                    selectedStatus === "done"
                      ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-900"
                      : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  <CheckCircle2 className={`w-5 h-5 ${selectedStatus === "done" ? "text-emerald-600" : "text-slate-400"}`} />
                  <div>
                    <span className="text-xs font-bold block">สำเร็จ (Done)</span>
                    <span className="text-[10px] text-slate-500 block">ซ้อมเสร็จเรียบร้อย</span>
                  </div>
                </button>

                {/* Postponed */}
                <button
                  type="button"
                  onClick={() => setSelectedStatus("postponed")}
                  className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-all text-left ${
                    selectedStatus === "postponed"
                      ? "bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 text-amber-900"
                      : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  <Clock className={`w-5 h-5 ${selectedStatus === "postponed" ? "text-amber-600" : "text-slate-400"}`} />
                  <div>
                    <span className="text-xs font-bold block">เลื่อนเวลา</span>
                    <span className="text-[10px] text-slate-500 block">ซ้อมช้ากว่าเดิม</span>
                  </div>
                </button>

                {/* Missed */}
                <button
                  type="button"
                  onClick={() => setSelectedStatus("missed")}
                  className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-all text-left ${
                    selectedStatus === "missed"
                      ? "bg-rose-50 border-rose-500 ring-2 ring-rose-500/20 text-rose-900"
                      : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  <XCircle className={`w-5 h-5 ${selectedStatus === "missed" ? "text-rose-600" : "text-slate-400"}`} />
                  <div>
                    <span className="text-xs font-bold block">พลาด / ไม่ไหว</span>
                    <span className="text-[10px] text-slate-500 block">ไม่สะดวกในวันนี้</span>
                  </div>
                </button>

                {/* Rest */}
                <button
                  type="button"
                  onClick={() => setSelectedStatus("rest")}
                  className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-all text-left ${
                    selectedStatus === "rest"
                      ? "bg-sky-50 border-sky-500 ring-2 ring-sky-500/20 text-sky-900"
                      : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  <Moon className={`w-5 h-5 ${selectedStatus === "rest" ? "text-sky-600" : "text-slate-400"}`} />
                  <div>
                    <span className="text-xs font-bold block">วันพัก (Rest)</span>
                    <span className="text-[10px] text-slate-500 block">ฟื้นฟูร่างกาย</span>
                  </div>
                </button>
              </div>

              {/* Pending option */}
              <button
                type="button"
                onClick={() => setSelectedStatus("pending")}
                className={`w-full p-2.5 rounded-xl border text-center text-xs font-semibold transition-all ${
                  selectedStatus === "pending"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                รีเซ็ตเป็น "รอดำเนินการ / ยังมาไม่ถึง" (Pending)
              </button>
            </div>

            {/* If Postponed: select target time */}
            {selectedStatus === "postponed" && (
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
                <label className="text-xs font-bold text-amber-900 block">
                  ระบุเวลาใหม่ที่เลื่อนไปซ้อม:
                </label>
                <div className="flex gap-2">
                  {["18:00", "19:00", "20:00", "21:00"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setPostponedTime(`${t} น.`)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-colors ${
                        postponedTime.includes(t)
                          ? "bg-amber-600 text-white"
                          : "bg-white text-amber-900 border border-amber-300"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={postponedTime}
                  onChange={(e) => setPostponedTime(e.target.value)}
                  placeholder="เช่น 19:30 น."
                  className="w-full text-xs px-3 py-2 bg-white rounded-xl border border-amber-300 text-amber-900"
                />
              </div>
            )}

            {/* Note input for missed or personal remark */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                บันทึกเพิ่มเติม / เหตุผล (ถ้ามี):
              </label>
              <input
                type="text"
                value={userNote}
                onChange={(e) => setUserNote(e.target.value)}
                placeholder="เช่น ติดงานด่วน, รู้สึกเมื่อยล้ามาก, หรือซ้อมเสร็จสบายๆ"
                className="w-full text-xs px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setEditingDay(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={updating}
                onClick={handleSaveStatus}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-300 text-white rounded-2xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                {updating ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>บันทึกสถานะ</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
