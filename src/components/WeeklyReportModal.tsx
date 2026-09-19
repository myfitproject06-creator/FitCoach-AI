import React from "react";
import {
  X,
  FileText,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Sparkles,
  Trophy,
} from "lucide-react";
import { WeeklyReportData, UserProfile } from "../types";

interface WeeklyReportModalProps {
  report: WeeklyReportData;
  profile: UserProfile;
  onClose: () => void;
}

export const WeeklyReportModal: React.FC<WeeklyReportModalProps> = ({
  report,
  profile,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <div>
              <h3 className="font-bold text-sm">รายงานสรุปประจำสัปดาห์</h3>
              <p className="text-[10px] text-slate-400">{report.dateRange}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 text-slate-800">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] text-slate-400 font-medium block">ฝึกสำเร็จ</span>
              <p className="text-base font-black text-slate-900 mt-0.5">
                {report.workoutsCompleted}/{report.workoutsTarget} วัน
              </p>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] text-slate-400 font-medium block">กล้ามเนื้อ</span>
              <p className="text-base font-black text-emerald-600 mt-0.5">
                +{report.strengthDeltaPercent}%
              </p>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] text-slate-400 font-medium block">น้ำหนักตัว</span>
              <p className="text-base font-black text-slate-900 mt-0.5">
                +{report.weightDeltaKg} kg
              </p>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] text-slate-400 font-medium block">ความสม่ำเสมอ</span>
              <p className="text-base font-black text-indigo-600 mt-0.5">
                {report.consistencyPercent}%
              </p>
            </div>
          </div>

          {/* AI Coach Summary */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-1.5">
            <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>ความเห็นจาก FitCoach ประจำสัปดาห์</span>
            </div>
            <p className="text-xs text-emerald-950 leading-relaxed font-medium">
              "{report.coachSummary}"
            </p>
          </div>

          {/* Wins (สิ่งที่ทำได้ดี) */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5" /> สิ่งที่ทำได้ยอดเยี่ยมในสัปดาห์นี้
            </h4>
            <div className="space-y-1.5">
              {report.wins.map((win, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-start gap-2 text-xs text-slate-800"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{win}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Improvements (สิ่งที่ควรปรับปรุง) */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> จุดที่แนะนำให้ปรับปรุงในสัปดาห์ถัดไป
            </h4>
            <div className="space-y-1.5">
              {report.improvements.map((imp, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-amber-50/50 rounded-xl border border-amber-100 flex items-start gap-2 text-xs text-slate-800"
                >
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full shrink-0 mt-1.5" />
                  <span>{imp}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition-all shadow"
          >
            ปิดรายงาน
          </button>
        </div>
      </div>
    </div>
  );
};
