import React, { useState } from "react";
import {
  X,
  Moon,
  Footprints,
  Heart,
  BatteryCharging,
  Sparkles,
  Zap,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { RecoveryData } from "../types";

interface RecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  recovery: RecoveryData;
  onUpdateRecovery: (updated: Partial<RecoveryData>) => void;
}

export const RecoveryModal: React.FC<RecoveryModalProps> = ({
  isOpen,
  onClose,
  recovery,
  onUpdateRecovery,
}) => {
  const currentReadiness = recovery.readinessScore ?? recovery.score ?? 85;
  const currentSleepScore = recovery.sleepQualityScore ?? recovery.score ?? 80;
  const [sleepHours, setSleepHours] = useState(recovery.sleepHours.toString());
  const [sleepScore, setSleepScore] = useState(currentSleepScore.toString());
  const [rpeScore, setRpeScore] = useState((recovery.rpeScore ?? 5).toString());
  const [steps, setSteps] = useState((recovery.steps ?? 7500).toString());
  const [hrv, setHrv] = useState((recovery.hrvMs ?? 65).toString());

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateRecovery({
      sleepHours: parseFloat(sleepHours) || 7,
      score: parseInt(sleepScore, 10) || 80,
      sleepQualityScore: parseInt(sleepScore, 10) || 80,
      rpeScore: parseInt(rpeScore, 10) || 5,
      steps: parseInt(steps, 10) || 8000,
      hrvMs: parseInt(hrv, 10) || 60,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">การฟื้นฟูร่างกาย & การนอน (RECOVER)</h3>
              <p className="text-[11px] text-slate-400">
                ดัชนีพร้อมซ้อม Readiness: {currentReadiness}/100
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
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Readiness Status banner */}
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex flex-col items-center justify-center font-black shrink-0 shadow-sm">
              <span className="text-xl leading-none">{currentReadiness}</span>
              <span className="text-[9px] font-medium tracking-tighter mt-0.5">READY</span>
            </div>
            <div>
              <span className="text-xs font-bold text-indigo-950 block">
                {currentReadiness >= 80
                  ? "สภาพร่างกายยอดเยี่ยม พร้อมซ้อมเต็มสูบ!"
                  : currentReadiness >= 60
                  ? "ความพร้อมปานกลาง ซ้อมได้ตามปกติแต่ควรฟังเสียงร่างกาย"
                  : "ร่างกายล้าสะสม แนะนำให้ลดโวลุ่มหรือยืดเหยียด"}
              </span>
              <p className="text-[11px] text-indigo-800/80 mt-1 leading-relaxed">
                คำนวณจากระยะเวลานอน {recovery.sleepHours} ชม. คุณภาพการหลับ {currentSleepScore}% และระดับความล้า
              </p>
            </div>
          </div>

          {/* Form to manual adjust or sync */}
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">
                ชั่วโมงการนอนหลับเมื่อคืน (ชม.)
              </label>
              <input
                type="number"
                step="0.1"
                value={sleepHours}
                onChange={(e) => setSleepHours(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  คะแนนคุณภาพการนอน (0-100)
                </label>
                <input
                  type="number"
                  value={sleepScore}
                  onChange={(e) => setSleepScore(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  ระดับความเหนื่อยล้าสะสม RPE (1-10)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={rpeScore}
                  onChange={(e) => setRpeScore(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  จำนวนก้าวเดินวันนี้ (ก้าว)
                </label>
                <input
                  type="number"
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  อัตราผันแปรหัวใจ HRV (ms)
                </label>
                <input
                  type="number"
                  value={hrv}
                  onChange={(e) => setHrv(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>บันทึกและคำนวณ Readiness ใหม่อัตโนมัติ</span>
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
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
