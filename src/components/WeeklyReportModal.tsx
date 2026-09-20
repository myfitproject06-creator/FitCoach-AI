import React from "react";
import {
  X,
  Award,
  TrendingUp,
  Flame,
  Dumbbell,
  CheckCircle2,
  Calendar,
  Sparkles,
  Share2,
} from "lucide-react";
import { WeeklyReport, FitnessStatus } from "../types";

interface WeeklyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: WeeklyReport;
  status: FitnessStatus;
}

export const WeeklyReportModal: React.FC<WeeklyReportModalProps> = ({
  isOpen,
  onClose,
  report,
  status,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                สรุปผลรายสัปดาห์ (Weekly Report)
              </h3>
              <p className="text-[11px] text-slate-400">{report.weekRange}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {(!report.highlights || report.highlights.length === 0) && report.workoutsCompleted === 0 ? (
            <div className="text-center py-10 px-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
                <Award className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800">
                  ยังไม่มีข้อมูลสรุปผลรายสัปดาห์
                </h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  โค้ชจะเริ่มบันทึกและประมวลผลความสม่ำเสมอ แคลอรี่ที่เผาผลาญ และพัฒนาการของคุณ แล้วสรุปเป็นรายงานประจำสัปดาห์ให้ทุกวันอาทิตย์ครับ
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 max-w-xs mx-auto text-left space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>วิธีเริ่มต้นสะสมสถิติ:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-500 pl-1">
                  <li>พิชิตเซสชั่นการฝึกตามตาราง</li>
                  <li>บันทึกอาหารในแต่ละมื้อ</li>
                  <li>บันทึกการนอนหลับหรือซิงค์ Google Fit</li>
                </ul>
              </div>
            </div>
          ) : (
            <>
              {/* Consistency Hero Card */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-4 shadow-md flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-200 tracking-wider">
                    ความสม่ำเสมอในการฝึก
                  </span>
                  <h4 className="text-2xl font-black mt-0.5">
                    {report.consistencyScore}%
                  </h4>
                  <p className="text-xs text-emerald-100 mt-1">
                    ทำได้ {report.workoutsCompleted} จาก {report.workoutsTarget} ครั้งที่ตั้งไว้ • วินัยยอดเยี่ยม!
                  </p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] text-emerald-200 font-bold">XP ที่ได้</span>
                  <span className="text-sm font-black text-amber-300">
                    +{report.xpGained}
                  </span>
                </div>
              </div>

              {/* Stats Overview */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                    <Flame className="w-3.5 h-3.5 text-orange-500" />
                    <span>พลังงานที่เผาผลาญ</span>
                  </div>
                  <span className="text-lg font-black text-slate-900">
                    {report.totalCaloriesBurned.toLocaleString()} kcal
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                    <Dumbbell className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ความต่อเนื่อง (Streak)</span>
                  </div>
                  <span className="text-lg font-black text-slate-900">
                    {status.streakDays} วันติดต่อกัน
                  </span>
                </div>
              </div>

              {/* Highlights */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  ไฮไลท์ความสำเร็จสัปดาห์นี้
                </h5>
                <div className="space-y-2">
                  {report.highlights.map((hl, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs text-slate-800"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{hl}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Coach Advice */}
              <div className="bg-slate-900 text-slate-200 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>คำแนะนำจากโค้ชสำหรับสัปดาห์ถัดไป:</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  "{report.coachFeedback}"
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs transition-colors"
          >
            รับทราบและลุยต่อ
          </button>
        </div>
      </div>
    </div>
  );
};
