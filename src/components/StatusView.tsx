import React from "react";
import {
  Award,
  TrendingUp,
  Flame,
  CheckCircle2,
  Calendar,
  Sparkles,
  BarChart3,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { FitnessStatus, UserProfile } from "../types";

interface StatusViewProps {
  status: FitnessStatus;
  profile: UserProfile;
  onOpenReportModal?: () => void;
}

export const StatusView: React.FC<StatusViewProps> = ({
  status,
  profile,
  onOpenReportModal,
}) => {
  const level = status.level || status.currentLevel || 4;
  const currentExp = status.xp || status.currentExp || 1450;
  const nextLevelExp = status.nextLevelXp || status.nextLevelExp || 2000;
  const streak = status.streakDays ?? status.momentumDays ?? 7;
  const rankTitle = status.rankTitle || (status.rank ? `Rank ${status.rank} Athlete` : "Iron Athlete");

  return (
    <div className="space-y-4 pb-12">
      {/* Level & Badge Card */}
      <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <span className="text-[10px] bg-white/20 backdrop-blur-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider text-white">
              FITNESS LEVEL {level}
            </span>
            <h2 className="text-xl font-extrabold text-white mt-1.5 tracking-tight">
              {rankTitle}
            </h2>
            <p className="text-xs text-white/90 mt-0.5">
              ต่อเนื่อง {streak} วันติดต่อกัน 🔥
            </p>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-3xl shadow-inner">
            🏆
          </div>
        </div>

        {/* Level XP Progress Bar */}
        <div className="relative z-10 mt-5 space-y-1.5">
          <div className="flex justify-between text-[11px] font-bold text-white/90">
            <span>XP สะสม: {currentExp} XP</span>
            <span>เป้าหมายถัดไป: {nextLevelExp} XP</span>
          </div>
          <div className="w-full bg-black/20 h-2.5 rounded-full overflow-hidden p-0.5">
            <div
              className="bg-white h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(
                  100,
                  (currentExp / nextLevelExp) * 100
                )}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* 4 Key Stat Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
            <Flame className="w-4 h-4 text-orange-500" />
            <span>เผาผลาญสะสม</span>
          </div>
          <p className="text-lg font-extrabold text-slate-900 mt-1">
            {(status.totalCaloriesBurned || 12450).toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-500">kcal รวมทั้งหมด</span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>จำนวนเซสชัน</span>
          </div>
          <p className="text-lg font-extrabold text-slate-900 mt-1">
            {status.totalWorkoutsCompleted || 18}
          </p>
          <span className="text-[10px] text-slate-500">ครั้งที่ซ้อมสำเร็จ</span>
        </div>
      </div>

      {/* Badges / Achievements Collection */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            เหรียญเกียรติยศ & ตราสัญลักษณ์ ({status.badges?.length || 4})
          </h3>
          <span className="text-[10px] text-emerald-600 font-bold">
            ปลดล็อกแล้ว 4 รายการ
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { title: "Day 1 Starter", icon: "🌱", unlocked: true },
            { title: "7-Day Streak", icon: "🔥", unlocked: true },
            { title: "V-Taper Beast", icon: "🔱", unlocked: true },
            { title: "Clean Eating", icon: "🥗", unlocked: true },
            { title: "100k Steps", icon: "👟", unlocked: false },
            { title: "Sleep Master", icon: "🌙", unlocked: false },
            { title: "Iron Will", icon: "🛡️", unlocked: false },
            { title: "3 Months Hero", icon: "👑", unlocked: false },
          ].map((b, i) => (
            <div
              key={i}
              className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center gap-1 ${
                b.unlocked
                  ? "bg-amber-50/50 border-amber-200/80 text-slate-900"
                  : "bg-slate-50 border-slate-100 text-slate-300 opacity-60"
              }`}
            >
              <span className="text-2xl">{b.icon}</span>
              <span className="text-[9px] font-bold truncate w-full">
                {b.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Performance Radar / Report card */}
      {onOpenReportModal && (
        <div className="bg-slate-900 rounded-3xl p-5 text-white shadow-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">
                รายงานสถิติสัปดาห์ & เรดาร์สมรรถภาพ
              </h4>
              <p className="text-[11px] text-slate-400">
                ประเมินความสมดุล 5 ด้าน: แรง, ความอดทน, อาหาร, หลับ, วินัย
              </p>
            </div>
          </div>
          <button
            onClick={onOpenReportModal}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-xs active:scale-95"
          >
            เปิดดู
          </button>
        </div>
      )}
    </div>
  );
};
