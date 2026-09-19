import React from "react";
import {
  X,
  BarChart3,
  Sparkles,
  TrendingUp,
  Award,
  CheckCircle2,
  Calendar,
  Share2,
} from "lucide-react";
import { FitnessStatus, UserProfile } from "../types";

interface WeeklyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: FitnessStatus;
  profile: UserProfile;
}

export const WeeklyReportModal: React.FC<WeeklyReportModalProps> = ({
  isOpen,
  onClose,
  status,
  profile,
}) => {
  if (!isOpen) return null;

  // 5-Axis Radar metrics: Strength, Endurance, Nutrition, Sleep, Consistency (0-100)
  const radarData = [
    { label: "พละกำลัง (Strength)", value: 85, color: "#f97316" },
    { label: "ความอึด (Endurance)", value: 78, color: "#06b6d4" },
    { label: "โภชนาการ (Nutrition)", value: 90, color: "#10b981" },
    { label: "การนอนพักฟื้น (Sleep)", value: 82, color: "#6366f1" },
    { label: "วินัยความต่อเนื่อง (Discipline)", value: 95, color: "#eab308" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                รายงานประจำสัปดาห์ & เรดาร์สมรรถภาพ
              </h3>
              <p className="text-[11px] text-slate-400">
                FitCoach Weekly AI Performance Audit
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* AI Coach Summary Verdict */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>ผลประเมินโค้ช AI ประจำสัปดาห์: ยอดเยี่ยม (Grade A)</span>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">
              คุณ {profile.name} รักษาอัตราความต่อเนื่องได้ถึง 95% ซ้อมครบ 4 วันตามตาราง และทานโปรตีนเฉลี่ยถึงเป้าหมาย 148g/วัน ร่างกายเริ่มแสดงการลดไขมันรอบเอวลง 0.8 ซม.
            </p>
          </div>

          {/* Radar Capability Bars */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              สมดุล 5 มิติ (Physical & Habit Balance)
            </h4>
            <div className="space-y-2.5">
              {radarData.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>{item.label}</span>
                    <span className="font-bold">{item.value}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${item.value}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Highlights */}
          <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">
                ซ้อมสำเร็จ
              </span>
              <span className="text-sm font-extrabold text-slate-900">
                4 / 4 วัน
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">
                เผาผลาญ
              </span>
              <span className="text-sm font-extrabold text-orange-600">
                2,450 kcal
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">
                นอนเฉลี่ย
              </span>
              <span className="text-sm font-extrabold text-indigo-600">
                7.4 ชม.
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
