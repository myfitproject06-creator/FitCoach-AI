import React, { useState } from "react";
import {
  X,
  Moon,
  Sparkles,
  Heart,
  BatteryCharging,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { RecoveryData } from "../types";

interface RecoveryModalProps {
  recovery: RecoveryData;
  onClose: () => void;
  onUpdateRecovery: (updated: Partial<RecoveryData>) => void;
  onOpenGoogleHealth?: () => void;
}

export const RecoveryModal: React.FC<RecoveryModalProps> = ({
  recovery,
  onClose,
  onUpdateRecovery,
  onOpenGoogleHealth,
}) => {
  const [hours, setHours] = useState(recovery.sleepHours);
  const [minutes, setMinutes] = useState(recovery.sleepMinutes);
  const [fatigue, setFatigue] = useState(recovery.fatigueLevel);
  const [soreness, setSoreness] = useState(recovery.muscleSoreness);

  const handleSave = () => {
    onUpdateRecovery({
      sleepHours: hours,
      sleepMinutes: minutes,
      fatigueLevel: fatigue,
      muscleSoreness: soreness,
      score: Math.min(100, Math.round(hours * 10 + (fatigue === "ต่ำ" ? 20 : 10))),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-sm">การนอนและการฟื้นตัว (Recovery & Sleep)</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* Google Health Sync Quick Banner */}
          {onOpenGoogleHealth && (
            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-teal-600 text-white flex items-center justify-center text-[10px] font-bold">
                  G
                </span>
                <div>
                  <span className="font-bold text-teal-950 block">
                    {recovery.isFromGoogleHealth
                      ? "ซิงค์จาก Google Health แล้ว"
                      : "ต้องการดึงข้อมูลการนอนจริง?"}
                  </span>
                  <span className="text-[11px] text-teal-700">
                    {recovery.isFromGoogleHealth
                      ? `ดึงจาก Google Fit/สมาร์ทวอทช์ (${recovery.lastSyncedAt || "วันนี้"})`
                      : "ดึงเวลานอนและหลับลึกจากนาฬิกาของคุณอัตโนมัติ"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenGoogleHealth();
                }}
                className="px-2.5 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-[11px] font-bold transition-colors whitespace-nowrap shadow-xs"
              >
                {recovery.isFromGoogleHealth ? "ซิงค์ใหม่" : "ซิงค์ Google Fit"}
              </button>
            </div>
          )}

          {/* Sleep Arc Card */}
          <div className="bg-gradient-to-b from-indigo-950 to-slate-900 text-white rounded-3xl p-5 text-center relative overflow-hidden">
            <div className="relative w-40 h-24 mx-auto overflow-hidden">
              <svg className="w-40 h-40 transform -rotate-180" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#312E81"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray="125 125"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#818CF8"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${(recovery.score / 100) * 125} 125`}
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
                <span className="text-2xl font-black text-white">
                  {hours} ชม. {minutes} น.
                </span>
                <span className="text-[10px] text-indigo-200 uppercase font-semibold">
                  เวลานอนหลับ
                </span>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-center gap-2">
              <span className="text-xs bg-indigo-500/20 text-indigo-300 font-semibold px-2.5 py-0.5 rounded-full border border-indigo-400/30">
                คะแนนฟื้นตัว {recovery.score}/100 · {recovery.quality}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-indigo-900/60 text-xs">
              <div className="text-center">
                <span className="text-[10px] text-indigo-300">เข้านอน</span>
                <p className="font-bold text-slate-100">{recovery.sleepStart} น.</p>
              </div>
              <div className="text-center">
                <span className="text-[10px] text-indigo-300">ตื่นนอน</span>
                <p className="font-bold text-slate-100">{recovery.sleepEnd} น.</p>
              </div>
            </div>
          </div>

          {/* Coach Insight */}
          <div className="bg-indigo-50 border border-indigo-200/80 rounded-2xl p-4 flex items-start gap-2.5 text-xs text-indigo-950">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block mb-0.5 text-indigo-900">
                คำแนะนำจากเทรนเนอร์ (Trainer Insight)
              </span>
              <p className="leading-relaxed text-indigo-900/90">{recovery.coachInsight}</p>
            </div>
          </div>

          {/* Biomarkers / Metrics */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
              <BatteryCharging className="w-4 h-4 text-slate-500 mx-auto mb-1" />
              <span className="text-[10px] text-slate-400 font-medium">ความเหนื่อยล้า</span>
              <p className="text-xs font-bold text-slate-800">{fatigue}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
              <Activity className="w-4 h-4 text-slate-500 mx-auto mb-1" />
              <span className="text-[10px] text-slate-400 font-medium">ความตึงเมื่อย</span>
              <p className="text-xs font-bold text-slate-800">{soreness}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
              <Heart className="w-4 h-4 text-rose-500 mx-auto mb-1" />
              <span className="text-[10px] text-slate-400 font-medium">ชีพจรขณะพัก</span>
              <p className="text-xs font-bold text-slate-800">{recovery.restingHeartRate} bpm</p>
            </div>
          </div>

          {/* Interactive Log / Adjust Sleep */}
          <div className="space-y-3 bg-white p-3.5 rounded-2xl border border-slate-200">
            <span className="text-xs font-bold text-slate-800 block">
              บันทึก / อัปเดตข้อมูลการพักผ่อนวันนี้:
            </span>

            <div>
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span>จำนวนชั่วโมงนอน:</span>
                <span className="font-bold text-slate-900">{hours} ชั่วโมง {minutes} นาที</span>
              </div>
              <input
                type="range"
                min="4"
                max="11"
                step="0.5"
                value={hours + minutes / 60}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  const h = Math.floor(val);
                  const m = (val - h) >= 0.5 ? 30 : 0;
                  setHours(h);
                  setMinutes(m);
                }}
                className="w-full accent-indigo-600"
              />
            </div>

            {/* Fatigue Select */}
            <div>
              <span className="text-xs text-slate-600 block mb-1">ระดับความเหนื่อยล้า:</span>
              <div className="flex gap-2">
                {(["ต่ำ", "ปานกลาง", "สูง"] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setFatigue(lvl)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      fatigue === lvl
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Soreness Select */}
            <div>
              <span className="text-xs text-slate-600 block mb-1">ความปวดเมื่อยกล้ามเนื้อ:</span>
              <div className="flex gap-2">
                {(["ไม่มี", "เล็กน้อย", "ปานกลาง", "มาก"] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setSoreness(lvl)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      soreness === lvl
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSave}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow"
            >
              บันทึกข้อมูลการนอน
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
