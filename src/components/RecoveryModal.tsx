import React, { useState } from "react";
import {
  X,
  Moon,
  BatteryCharging,
  Sparkles,
  Heart,
  TrendingUp,
  Info,
} from "lucide-react";
import { RecoveryData, FitnessStatus } from "../types";

interface RecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  recovery: RecoveryData;
  status: FitnessStatus;
  onUpdateSleep: (hours: number, minutes: number) => void;
}

export const RecoveryModal: React.FC<RecoveryModalProps> = ({
  isOpen,
  onClose,
  recovery,
  status,
  onUpdateSleep,
}) => {
  const [hours, setHours] = useState<number>(recovery.sleepHours);
  const [minutes, setMinutes] = useState<number>(recovery.sleepMinutes);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdateSleep(Number(hours), Number(minutes));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-indigo-950 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                การนอนและการฟื้นตัว (RECOVER)
              </h3>
              <p className="text-[11px] text-indigo-300">
                สภาพร่างกายปัจจุบัน: Condition {status.condition}%
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-indigo-900 text-indigo-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Recovery Score Card */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                คะแนนการฟื้นฟูของร่างกาย
              </span>
              <h4 className="text-xl font-black text-white mt-0.5">
                {status.recovery} / 100
              </h4>
              <p className="text-[11px] text-slate-300 mt-0.5">
                {recovery.quality ? `${recovery.quality} (หลับลึก ${recovery.deepSleepPercent}%)` : "ยังไม่มีข้อมูลบันทึกการนอน"}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full border-4 border-indigo-500 flex items-center justify-center font-black text-sm text-indigo-400">
              {status.recovery}%
            </div>
          </div>

          {/* Quick Sleep Edit Form */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
            <label className="text-xs font-bold text-slate-800 block">
              บันทึกเวลาการนอนเมื่อคืน:
            </label>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <span className="text-[10px] text-slate-500 block mb-1">ชั่วโมง</span>
                <input
                  type="number"
                  min={0}
                  max={16}
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  className="w-full text-sm font-bold p-2 rounded-xl border border-slate-300 bg-white text-center"
                />
              </div>
              <div className="flex-1">
                <span className="text-[10px] text-slate-500 block mb-1">นาที</span>
                <input
                  type="number"
                  min={0}
                  max={59}
                  step={5}
                  value={minutes}
                  onChange={(e) => setMinutes(Number(e.target.value))}
                  className="w-full text-sm font-bold p-2 rounded-xl border border-slate-300 bg-white text-center"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-400">
              เป้าหมายที่แนะนำ: 7-8 ชั่วโมงต่อคืน เพื่อให้กล้ามเนื้อซ่อมแซมได้เต็มที่
            </p>
          </div>

          {/* Coach Sleep Advice */}
          <div className="bg-indigo-50 p-3 rounded-2xl border border-indigo-100 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
            <p className="text-[11px] text-indigo-900 leading-relaxed">
              {hours > 0 ? (
                <span>
                  "บันทึกเวลานอน <strong>{hours} ชม. {minutes} นาที</strong> {hours >= 7 ? "ถือว่าเพียงพอ ร่างกายซ่อมแซมเส้นใยกล้ามเนื้อได้ดี พร้อมสำหรับการฝึกครับ" : "ควรหาเวลาพักผ่อนเพิ่ม เพื่อให้ร่างกายฟื้นตัวได้เต็มที่ครับ"}"
                </span>
              ) : (
                <span>
                  "บันทึกเวลาการนอนหลับของคุณ เพื่อให้โค้ช AI ประเมินความพร้อมของร่างกายและปรับความหนักของโปรแกรมให้เหมาะสมครับ"
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-2xl text-xs transition-colors"
          >
            ยกเลิก
          </button>
          <button
            id="save-sleep-btn"
            onClick={handleSave}
            className="flex-1 py-2.5 bg-indigo-900 hover:bg-indigo-800 text-white font-bold rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-2"
          >
            บันทึกการนอนหลับ
          </button>
        </div>
      </div>
    </div>
  );
};
