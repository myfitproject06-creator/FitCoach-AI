import React from "react";
import {
  Trophy,
  Flame,
  CheckCircle2,
  Activity,
  FileText,
  Info,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { FitnessStatus, UserProfile } from "../types";

interface StatusRadarViewProps {
  status: FitnessStatus;
  profile: UserProfile;
  onOpenWeeklyReport: () => void;
}

export const StatusRadarView: React.FC<StatusRadarViewProps> = ({
  status,
  profile,
  onOpenWeeklyReport,
}) => {
  // Radar chart math for 5 points (STR, END, MOB, VIT, REC)
  // Center (100, 100), Radius = 70
  const center = 100;
  const maxR = 70;
  const numAxes = 5;

  const labels = [
    { key: "STR", name: "ความแข็งแรง", val: status.strength },
    { key: "END", name: "ความอึด", val: status.endurance },
    { key: "MOB", name: "ความคล่องตัว", val: status.mobility },
    { key: "VIT", name: "พลังชีวิต", val: status.vitality },
    { key: "REC", name: "การฟื้นตัว", val: status.recovery },
  ];

  // Calculate polygon coordinates
  const getCoordinates = (value: number, index: number, maxVal = 100) => {
    const angle = (Math.PI * 2 * index) / numAxes - Math.PI / 2;
    const r = (value / maxVal) * maxR;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  const pointsString = labels
    .map((item, idx) => {
      const { x, y } = getCoordinates(item.val, idx);
      return `${x},${y}`;
    })
    .join(" ");

  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  return (
    <div className="space-y-4 pb-24">
      {/* Level & Rank Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-md border border-slate-800 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                PERSONAL FITNESS STATUS
              </span>
              <span className="w-1 h-1 bg-slate-600 rounded-full" />
              <span className="text-[11px] text-slate-400">{profile.name}</span>
            </div>
            <h2 className="text-xl font-black text-white mt-0.5 tracking-tight flex items-center gap-2">
              Level {status.level}
              <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                Rank {status.rank}
              </span>
            </h2>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-[2px] shadow-lg">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex flex-col items-center justify-center">
              <span className="text-[10px] text-slate-400 font-bold">RANK</span>
              <span className="text-lg font-black text-emerald-400 leading-none">
                {status.rank}
              </span>
            </div>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800">
          <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-medium">
            <span>สะสมประสบการณ์ (XP):</span>
            <span className="text-slate-200">
              <strong>{status.xp.toLocaleString()}</strong> / {status.nextLevelXp.toLocaleString()} XP
            </span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-700"
              style={{ width: `${(status.xp / status.nextLevelXp) * 100}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            *Level สะท้อนประสบการณ์และวินัยระยะยาว (ไม่มีวันลดลง)
          </p>
        </div>
      </div>

      {/* Modern SVG Radar Chart Card */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              5-DIMENSION ATTRIBUTES
            </span>
            <h3 className="text-sm font-bold text-slate-900">
              สมรรถภาพร่างกาย 5 มิติ
            </h3>
          </div>
          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
            ภาพรวมสมดุล
          </span>
        </div>

        {/* SVG Pentagon */}
        <div className="relative w-full max-w-[260px] mx-auto aspect-square my-2">
          <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
            {/* Background Grid Pentagons */}
            {gridLevels.map((lvl, gIdx) => {
              const gridPoints = labels
                .map((_, idx) => {
                  const { x, y } = getCoordinates(lvl * 100, idx);
                  return `${x},${y}`;
                })
                .join(" ");
              return (
                <polygon
                  key={gIdx}
                  points={gridPoints}
                  fill={gIdx === 3 ? "#F8FAFC" : "transparent"}
                  stroke="#E2E8F0"
                  strokeWidth="1"
                />
              );
            })}

            {/* Axis Lines */}
            {labels.map((_, idx) => {
              const { x, y } = getCoordinates(100, idx);
              return (
                <line
                  key={idx}
                  x1={center}
                  y1={center}
                  x2={x}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
              );
            })}

            {/* User Data Polygon */}
            <polygon
              points={pointsString}
              fill="rgba(16, 185, 129, 0.22)"
              stroke="#10B981"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />

            {/* Data Dots & Label Annotations */}
            {labels.map((item, idx) => {
              const { x, y } = getCoordinates(item.val, idx);
              const labelPos = getCoordinates(120, idx);
              return (
                <g key={idx}>
                  <circle cx={x} cy={y} r="3.5" fill="#10B981" stroke="#FFFFFF" strokeWidth="1.5" />
                  <text
                    x={labelPos.x}
                    y={labelPos.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-[9px] font-bold fill-slate-600"
                  >
                    {item.key} ({item.val})
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Labels legend grid */}
        <div className="grid grid-cols-5 gap-1 pt-3 border-t border-slate-100 text-center">
          {labels.map((item) => (
            <div key={item.key} className="p-1">
              <span className="text-[10px] text-slate-400 block font-medium">{item.name}</span>
              <span className="text-xs font-bold text-slate-800">{item.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3 Metric Cards (Momentum, Adherence, Condition) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Momentum */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-1.5 text-orange-600 mb-1">
            <Flame className="w-4 h-4 fill-orange-500" />
            <span className="text-[11px] font-bold uppercase">ความต่อเนื่อง</span>
          </div>
          <p className="text-lg font-black text-slate-900">
            {status.momentumDays} วัน
          </p>
          <p className="text-[10px] text-slate-400">
            โมเมนตัม {status.trainingMomentum}%
          </p>
        </div>

        {/* Adherence */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-1.5 text-emerald-600 mb-1">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase">ทำตามแผน</span>
          </div>
          <p className="text-lg font-black text-slate-900">
            {status.programAdherence}%
          </p>
          <p className="text-[10px] text-slate-400">
            ความสม่ำเสมอสัปดาห์นี้
          </p>
        </div>

        {/* Condition */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-1.5 text-indigo-600 mb-1">
            <Activity className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase">สภาพร่างกาย</span>
          </div>
          <p className="text-lg font-black text-slate-900">
            {status.condition}%
          </p>
          <p className="text-[10px] text-slate-400">
            {status.conditionLabel}
          </p>
        </div>
      </div>

      {/* Weekly Report Trigger Card */}
      <div
        id="open-weekly-report-btn"
        onClick={onOpenWeeklyReport}
        className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 rounded-3xl shadow-sm cursor-pointer hover:shadow-md transition-all flex items-center justify-between group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
              WEEKLY REVIEW
            </span>
            <h4 className="text-sm font-bold text-white">
              รายงานสรุปประจำสัปดาห์ (9 - 15 มิ.ย.)
            </h4>
            <p className="text-[11px] text-slate-300">
              วิเคราะห์ความก้าวหน้า จุดเด่น และสิ่งที่ควรปรับปรุง
            </p>
          </div>
        </div>

        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:translate-x-1 transition-transform">
          <ArrowUpRight className="w-4 h-4 text-white" />
        </div>
      </div>
    </div>
  );
};
