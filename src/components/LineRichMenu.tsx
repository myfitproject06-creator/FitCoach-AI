import React from "react";
import {
  Dumbbell,
  Utensils,
  Moon,
  Footprints,
  Sparkles,
  BarChart3,
  SlidersHorizontal,
  FileText,
  MessageSquare,
} from "lucide-react";

interface LineRichMenuProps {
  onOpenWorkout: () => void;
  onOpenNutrition: () => void;
  onOpenRecovery: () => void;
  onOpenPlan3Months?: () => void;
  onOpenWeeklyReport?: () => void;
  onOpenAdaptWorkout?: () => void;
  onOpenLineChat?: () => void;
  onOpenGoogleHealth?: () => void;
}

export const LineRichMenu: React.FC<LineRichMenuProps> = ({
  onOpenWorkout,
  onOpenNutrition,
  onOpenRecovery,
  onOpenPlan3Months,
  onOpenWeeklyReport,
  onOpenAdaptWorkout,
  onOpenLineChat,
  onOpenGoogleHealth,
}) => {
  return (
    <div className="w-full bg-slate-900 border-t border-slate-800 shadow-2xl overflow-hidden rounded-t-3xl select-none">
      {/* Rich Menu Header Banner */}
      <div className="bg-slate-950 px-4 py-2 flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#06C755] animate-pulse" />
          <span className="text-[11px] font-bold text-slate-300">
            LINE RICH MENU (2500 x 1686 px Standard Spec)
          </span>
        </div>
        <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
          6-GRID INTERACTIVE
        </span>
      </div>

      {/* 6-Grid Tile Matrix (2 rows x 3 cols) */}
      <div className="grid grid-cols-3 grid-rows-2 gap-[1px] bg-slate-800 p-[1px]">
        {/* Button A: Today Workout */}
        <button
          id="richmenu-train"
          onClick={onOpenWorkout}
          className="bg-gradient-to-b from-slate-900 to-slate-950 hover:from-orange-950/40 hover:to-slate-900 text-white p-3.5 flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 group text-center"
        >
          <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
            <Dumbbell className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-100 group-hover:text-orange-400">
            ตารางซ้อมวันนี้
          </span>
          <span className="text-[9px] text-slate-400 leading-tight">
            Today Workout
          </span>
        </button>

        {/* Button B: Nutrition & Macros */}
        <button
          id="richmenu-eat"
          onClick={onOpenNutrition}
          className="bg-gradient-to-b from-slate-900 to-slate-950 hover:from-emerald-950/40 hover:to-slate-900 text-white p-3.5 flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 group text-center"
        >
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
            <Utensils className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-100 group-hover:text-emerald-400">
            อาหาร & แคลอรี่
          </span>
          <span className="text-[9px] text-slate-400 leading-tight">
            Nutrition & Macro
          </span>
        </button>

        {/* Button C: Recovery & Sleep */}
        <button
          id="richmenu-recover"
          onClick={onOpenRecovery}
          className="bg-gradient-to-b from-slate-900 to-slate-950 hover:from-indigo-950/40 hover:to-slate-900 text-white p-3.5 flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 group text-center"
        >
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
            <Moon className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-100 group-hover:text-indigo-400">
            การฟื้นฟู & หลับ
          </span>
          <span className="text-[9px] text-slate-400 leading-tight">
            Sleep & Recovery
          </span>
        </button>

        {/* Button D: 3-Months Master Plan */}
        <button
          id="richmenu-3months"
          onClick={onOpenPlan3Months || onOpenWorkout}
          className="bg-gradient-to-b from-slate-900 to-slate-950 hover:from-teal-950/40 hover:to-slate-900 text-white p-3.5 flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 group text-center"
        >
          <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-100 group-hover:text-teal-400">
            แผนล่วงหน้า 3 เดือน
          </span>
          <span className="text-[9px] text-slate-400 leading-tight">
            3-Months Masterplan
          </span>
        </button>

        {/* Button E: Adaptive AI Adjust */}
        <button
          id="richmenu-adapt"
          onClick={onOpenAdaptWorkout || onOpenWorkout}
          className="bg-gradient-to-b from-slate-900 to-slate-950 hover:from-cyan-950/40 hover:to-slate-900 text-white p-3.5 flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 group text-center"
        >
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-100 group-hover:text-cyan-400">
            ปรับตารางด่วน AI
          </span>
          <span className="text-[9px] text-slate-400 leading-tight">
            Adaptive Workout
          </span>
        </button>

        {/* Button F: Weekly Report & Radar */}
        <button
          id="richmenu-report"
          onClick={onOpenWeeklyReport || onOpenWorkout}
          className="bg-gradient-to-b from-slate-900 to-slate-950 hover:from-amber-950/40 hover:to-slate-900 text-white p-3.5 flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 group text-center"
        >
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
            <BarChart3 className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-100 group-hover:text-amber-400">
            รายงานความก้าวหน้า
          </span>
          <span className="text-[9px] text-slate-400 leading-tight">
            Weekly Report & Radar
          </span>
        </button>
      </div>
    </div>
  );
};
