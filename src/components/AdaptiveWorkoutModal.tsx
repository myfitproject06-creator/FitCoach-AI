import React, { useState } from "react";
import {
  X,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { WorkoutPlan } from "../types";

interface AdaptiveWorkoutModalProps {
  currentWorkout: WorkoutPlan;
  onClose: () => void;
  onApplyAdaptedWorkout: (adapted: Partial<WorkoutPlan>) => void;
}

export const AdaptiveWorkoutModal: React.FC<AdaptiveWorkoutModalProps> = ({
  currentWorkout,
  onClose,
  onApplyAdaptedWorkout,
}) => {
  const [selectedReason, setSelectedReason] = useState("เมื่อคืนผมนอน 4 ชั่วโมงและวันนี้เหนื่อยมาก");
  const [customText, setCustomText] = useState("");
  const [loading, setLoading] = useState(false);
  const [adaptedResult, setAdaptedResult] = useState<any | null>(null);

  const presets = [
    { label: "นอน 4 ชั่วโมง เหนื่อยมาก", text: "เมื่อคืนผมนอน 4 ชั่วโมงและวันนี้เหนื่อยมาก" },
    { label: "มีเวลาน้อย (20 นาที)", text: "วันนี้มีเวลาจำกัดแค่ 20 นาที ต้องรีบไปทำธุระ" },
    { label: "รู้สึกเจ็บ/ตึงหัวไหล่", text: "รู้สึกตึงและเจ็บหัวไหล่ข้างขวา ไม่สะดวกยกหนัก" },
    { label: "เมื่อยล้าสะสมจากเมื่อวาน", text: "กล้ามเนื้อยังเมื่อยล้าสะสม พลังงานต่ำ" },
  ];

  const handleAdapt = async () => {
    setLoading(true);
    const reasonToUse = customText.trim() || selectedReason;

    try {
      const res = await fetch("/api/ai/adapt-workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: reasonToUse,
          originalWorkout: currentWorkout,
          sleepHours: 4,
          fatigueLevel: "High",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAdaptedResult(data);
      } else {
        throw new Error("Failed to adapt");
      }
    } catch {
      // Offline / fallback response
      setAdaptedResult({
        adaptedTitle: "Light Upper Body + Mobility",
        adaptedDuration: 25,
        coachMessage:
          "วันนี้เราลดความหนักลงหน่อยนะครับ เพื่อให้ร่างกายได้ฟื้นตัวโดยไม่เสียความต่อเนื่อง ผมปรับจาก Upper Body 52 นาที เป็นโปรแกรมฟื้นฟู 25 นาทีครับ",
        intensity: "เบา - ฟื้นฟู",
        exercises: [
          {
            id: "adapt-1",
            name: "Dumbbell Floor Press (Light)",
            nameTh: "ดัมเบลล์ ฟลอร์เพรส",
            sets: 3,
            reps: "10-12 ครั้ง",
            suggestedWeight: "14 kg",
            restSeconds: 60,
            notes: "เน้นคุมการบีบกล้ามเนื้อ ลดแรงกดที่ไหล่",
          },
          {
            id: "adapt-2",
            name: "Cable Row (Light Tempo)",
            nameTh: "เคเบิ้ล โรว์",
            sets: 3,
            reps: "12 ครั้ง",
            suggestedWeight: "35 kg",
            restSeconds: 60,
            notes: "ดึงต่อเนื่อง กระตุ้นการไหลเวียนเลือด",
          },
          {
            id: "adapt-3",
            name: "Thoracic & Shoulder Mobility Flow",
            nameTh: "การยืดเหยียดสะบักและไหล่",
            sets: 2,
            reps: "8-10 รอบ",
            suggestedWeight: "Bodyweight",
            restSeconds: 45,
            notes: "คลายกล้ามเนื้อคอบ่าและเพิ่มความยืดหยุ่น",
          },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!adaptedResult) return;
    onApplyAdaptedWorkout({
      titleTh: adaptedResult.adaptedTitle || "Light Upper Body + Mobility",
      durationMinutes: adaptedResult.adaptedDuration || 25,
      intensity: (adaptedResult.intensity as any) || "เบา",
      isAdapted: true,
      adaptationReason: customText || selectedReason,
      coachNote: adaptedResult.coachMessage,
      exercises: adaptedResult.exercises || currentWorkout.exercises.slice(0, 3),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm">ระบบปรับแผนการฝึกอัจฉริยะ (Adaptive AI)</h3>
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
          {!adaptedResult ? (
            <>
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-1">
                  แจ้งสภาพร่างกายหรือข้อจำกัดวันนี้ให้ FitCoach ทราบ:
                </p>
                <p className="text-[11px] text-slate-500 mb-3">
                  โค้ชจะปรับความหนัก จำนวนเซ็ต หรือเลือกท่าฝึกที่ปลอดภัยให้ทันทีโดยที่คุณไม่ต้องฝืน
                </p>

                {/* Preset Chips */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                  {presets.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSelectedReason(item.text);
                        setCustomText(item.text);
                      }}
                      className={`p-2.5 rounded-xl border text-xs text-left font-medium transition-all ${
                        selectedReason === item.text
                          ? "border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Custom text area */}
                <textarea
                  value={customText}
                  onChange={(e) => {
                    setCustomText(e.target.value);
                    setSelectedReason(e.target.value);
                  }}
                  placeholder="หรือพิมพ์บอกโค้ชได้เลย เช่น วันนี้ปวดหัวไมเกรน อยากได้ท่ายืดเบาๆ..."
                  rows={2}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* Action Button */}
              <button
                onClick={handleAdapt}
                disabled={loading}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>กำลังวิเคราะห์และปรับแผนให้เหมาะสม...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>ให้ FitCoach คำนวณแผนใหม่</span>
                  </>
                )}
              </button>
            </>
          ) : (
            /* Adapted Result View */
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                  คำแนะนำจากเทรนเนอร์
                </span>
                <p className="text-xs text-emerald-950 font-medium leading-relaxed mt-1">
                  "{adaptedResult.coachMessage}"
                </p>
              </div>

              {/* Before vs After comparison */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 opacity-70">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">แผนเดิม</span>
                  <h5 className="font-bold text-slate-800 line-through mt-0.5">
                    {currentWorkout.titleTh}
                  </h5>
                  <p className="text-[11px] text-slate-500">52 นาที • 5 ท่าฝึก</p>
                  <p className="text-[10px] text-slate-400">ระดับปานกลาง-หนัก</p>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 border-2 border-emerald-400 shadow-sm">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> แผนที่ปรับใหม่
                  </span>
                  <h5 className="font-bold text-emerald-950 mt-0.5">
                    {adaptedResult.adaptedTitle}
                  </h5>
                  <p className="text-[11px] text-emerald-800 font-semibold">
                    {adaptedResult.adaptedDuration} นาที • 3 ท่าฝึก
                  </p>
                  <p className="text-[10px] text-emerald-700">เน้นฟื้นฟู & รักษาวินัย</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setAdaptedResult(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>ลองใหม่</span>
                </button>
                <button
                  id="confirm-adapt-workout-btn"
                  onClick={handleApply}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>ยืนยันและนำแผนนี้ไปใช้</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
