import React, { useState } from "react";
import {
  Dumbbell,
  Utensils,
  Calendar,
  ShieldCheck,
  SlidersHorizontal,
  BarChart3,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Palette,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { CoachAccountabilityState } from "../types";

export interface RichMenuItem {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  badgeType?: "green" | "amber" | "rose" | "blue";
  icon: React.ReactNode;
  actionText: string;
  bgColor?: string;
}

interface LineRichMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  onSelectAction: (text: string, directAction?: () => void) => void;
  accountability?: CoachAccountabilityState;
  todayWorkoutTitle?: string;
  currentCalories?: number;
  calorieTarget?: number;
  disciplineScore?: number;
  onOpenStudio?: () => void;
  onStartWorkout?: () => void;
  onOpenAdapt?: () => void;
  onOpenPlan3Months?: () => void;
  onOpenWeeklyReport?: () => void;
  onOpenNutrition?: () => void;
}

export const LineRichMenu: React.FC<LineRichMenuProps> = ({
  isOpen,
  onToggle,
  onSelectAction,
  accountability,
  todayWorkoutTitle = "Upper Body Hypertrophy",
  currentCalories = 1450,
  calorieTarget = 2200,
  disciplineScore = 93,
  onOpenStudio,
  onStartWorkout,
  onOpenAdapt,
  onOpenPlan3Months,
  onOpenWeeklyReport,
  onOpenNutrition,
}) => {
  const [activeTab, setActiveTab] = useState<"workout" | "discipline">("workout");

  // Determine badge for accountability
  const strikeCount = accountability?.strikes ?? 0;
  const isPenalty = accountability?.penaltyActive;
  const isOverdue = accountability?.status === "overdue";

  const tiles = [
    {
      id: "workout_today",
      title: "ตารางซ้อมวันนี้",
      subtitle: todayWorkoutTitle,
      badge: accountability?.scheduledTime ? `นัด ${accountability.scheduledTime} น.` : "18:00 น.",
      badgeType: isPenalty ? "rose" : isOverdue ? "amber" : "green",
      icon: <Dumbbell className="w-5 h-5 text-emerald-400" />,
      actionText: "ขอตารางซ้อมวันนี้หน่อยครับ อยากเริ่มซ้อมแล้ว",
      directAction: onStartWorkout,
    },
    {
      id: "log_food",
      title: "บันทึกอาหาร",
      subtitle: `${currentCalories} / ${calorieTarget} kcal`,
      badge: "AI Auto-Calc",
      badgeType: "blue",
      icon: <Utensils className="w-5 h-5 text-amber-400" />,
      actionText: "กินข้าวมันไก่ตอน 1 จาน กับกล้วยหอม 1 ลูก คำนวณแคลอรีและบันทึกลงแอปให้หน่อยครับ",
      directAction: onOpenNutrition,
    },
    {
      id: "plan_3months",
      title: "แผน 3 เดือน",
      subtitle: "Tom Holland / V-Taper",
      badge: "Transformation",
      badgeType: "blue",
      icon: <Calendar className="w-5 h-5 text-sky-400" />,
      actionText: "จัดแผน 3 เดือนหุ่น Tom Holland ให้หน่อยครับ อยากรู้ตารางซ้อมและอาหาร",
      directAction: onOpenPlan3Months,
    },
    {
      id: "discipline_check",
      title: "เช็คชื่อ & วินัย",
      subtitle: isPenalty ? "🚨 โดนทำโทษ!" : `Strike ${strikeCount}/3 • วินัย ${disciplineScore}%`,
      badge: isPenalty ? "Penalty" : strikeCount > 0 ? `Strike ${strikeCount}` : "ตรงเวลา",
      badgeType: isPenalty ? "rose" : strikeCount > 0 ? "amber" : "green",
      icon: isPenalty ? (
        <AlertTriangle className="w-5 h-5 text-rose-400 animate-bounce" />
      ) : (
        <ShieldCheck className="w-5 h-5 text-teal-400" />
      ),
      actionText: isPenalty
        ? "ส่งการบ้านชดเชยแล้วครับ ทำภารกิจเรียบร้อย ปลดล็อคบทลงโทษให้หน่อยครับ"
        : "เช็คสถานะวินัยและการนัดหมายซ้อมของวันนี้หน่อยครับ",
    },
    {
      id: "adapt_plan",
      title: "ปรับแผนเมื่อล้า",
      subtitle: "ลดความหนัก / พักกล้ามเนื้อ",
      badge: "Smart Adapt",
      badgeType: "amber",
      icon: <SlidersHorizontal className="w-5 h-5 text-purple-400" />,
      actionText: "วันนี้รู้สึกเหนื่อยและตึงกล้ามเนื้อมาก ช่วยปรับแผนการฝึกให้เบาลงหน่อยครับ",
      directAction: onOpenAdapt,
    },
    {
      id: "weekly_report",
      title: "สรุปผล & สถิติ",
      subtitle: "สถิติสัปดาห์ & XP",
      badge: "Level 4",
      badgeType: "green",
      icon: <BarChart3 className="w-5 h-5 text-cyan-400" />,
      actionText: "สรุปผลการออกกำลังกายและพัฒนาการของสัปดาห์นี้ให้หน่อยครับ",
      directAction: onOpenWeeklyReport,
    },
  ];

  return (
    <div className="w-full select-none transition-all duration-300">
      {/* Authentic LINE Rich Menu Toggle Bar */}
      <div className="bg-[#1e293b] text-slate-200 border-t border-slate-700/80 px-3 py-1.5 flex items-center justify-between shadow-inner">
        <button
          onClick={onToggle}
          className="flex items-center gap-1.5 text-xs font-semibold hover:text-white transition-colors"
        >
          {isOpen ? (
            <ChevronDown className="w-3.5 h-3.5 text-[#06C755]" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5 text-[#06C755]" />
          )}
          <span className="flex items-center gap-1">
            <span>{isOpen ? "ซ่อนเมนู FitCoach" : "▲ เมนูหลัก FitCoach (Rich Menu)"}</span>
            <span className="text-[10px] bg-[#06C755]/20 text-[#06C755] font-bold px-1.5 py-0.2 rounded-sm border border-[#06C755]/30">
              OFFICIAL
            </span>
          </span>
        </button>

        <div className="flex items-center gap-2">
          {onOpenStudio && (
            <button
              onClick={onOpenStudio}
              title="เปิดเครื่องมือออกแบบ LINE Rich Menu สเปก 2500x1686 px"
              className="text-[10px] flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 px-2 py-0.5 rounded-full border border-slate-700 transition-colors"
            >
              <Palette className="w-3 h-3" />
              <span>ออกแบบ Rich Menu</span>
            </button>
          )}

          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>นัด 18:00</span>
          </div>
        </div>
      </div>

      {/* Expanded LINE Rich Menu Grid (Authentic 2x3 Grid Layout) */}
      {isOpen && (
        <div className="bg-[#0f172a] p-2 border-t border-slate-800 animate-in slide-in-from-bottom-2 duration-200">
          {/* Sub Navigation Bar for Dual Mode Tabs */}
          <div className="flex items-center justify-between mb-1.5 px-1">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab("workout")}
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md transition-all ${
                  activeTab === "workout"
                    ? "bg-[#06C755] text-white shadow-xs"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                🏋️‍♂️ เมนูออกกำลังกาย
              </button>
              <button
                onClick={() => setActiveTab("discipline")}
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md transition-all ${
                  activeTab === "discipline"
                    ? "bg-[#06C755] text-white shadow-xs"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                🛡️ เมนูอาหาร & วินัย
              </button>
            </div>

            <span className="text-[9px] text-slate-400">
              แตะปุ่มเพื่อสั่งงาน AI อัตโนมัติ
            </span>
          </div>

          {/* 6 Grid Authentic LINE Rich Menu Tiles */}
          <div className="grid grid-cols-3 gap-1.5">
            {tiles.map((tile) => {
              // Highlight priority based on active tab
              const isPriority =
                activeTab === "workout"
                  ? tile.id === "workout_today" || tile.id === "plan_3months" || tile.id === "adapt_plan"
                  : tile.id === "log_food" || tile.id === "discipline_check" || tile.id === "weekly_report";

              return (
                <button
                  key={tile.id}
                  onClick={() => onSelectAction(tile.actionText, tile.directAction)}
                  className={`relative flex flex-col items-center justify-center p-2.5 rounded-xl text-center transition-all duration-150 active:scale-95 group overflow-hidden border ${
                    tile.id === "discipline_check" && isPenalty
                      ? "bg-rose-950/70 border-rose-500/60 hover:bg-rose-900/80"
                      : isPriority
                      ? "bg-slate-850/90 hover:bg-slate-800 border-slate-700/80 shadow-xs"
                      : "bg-slate-900/80 hover:bg-slate-800/80 border-slate-800 opacity-90 hover:opacity-100"
                  }`}
                  style={{ minHeight: "82px" }}
                >
                  {/* Subtle hover gradient light */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                  {/* Badge */}
                  {tile.badge && (
                    <span
                      className={`absolute top-1 right-1 text-[8px] font-bold px-1.5 py-0.2 rounded-full border leading-tight ${
                        tile.badgeType === "rose"
                          ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                          : tile.badgeType === "amber"
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          : tile.badgeType === "blue"
                          ? "bg-sky-500/20 text-sky-300 border-sky-500/40"
                          : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      }`}
                    >
                      {tile.badge}
                    </span>
                  )}

                  {/* Icon */}
                  <div className="p-1.5 rounded-lg bg-slate-800/80 group-hover:scale-110 transition-transform mb-1 shadow-inner">
                    {tile.icon}
                  </div>

                  {/* Title */}
                  <span className="text-[11px] font-bold text-white leading-tight truncate w-full">
                    {tile.title}
                  </span>

                  {/* Subtitle */}
                  <span className="text-[9px] text-slate-400 leading-tight truncate w-full mt-0.5 group-hover:text-slate-300">
                    {tile.subtitle}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Bottom LINE Rich Menu Brand Bar */}
          <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[9px] text-slate-400 px-1">
            <div className="flex items-center gap-1 text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-[#06C755]" />
              <span>FitCoach OA • LINE Official Rich Menu v2.4</span>
            </div>
            {onOpenStudio && (
              <button
                onClick={onOpenStudio}
                className="text-[#06C755] hover:underline font-medium cursor-pointer"
              >
                ดาวน์โหลดภาพ 2500x1686 & JSON API →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
