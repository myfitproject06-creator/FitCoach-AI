import React, { useState } from "react";
import {
  X,
  Sparkles,
  Calendar,
  CheckCircle2,
  Lock,
  ChevronRight,
  TrendingUp,
  Target,
  Zap,
} from "lucide-react";
import { UserProfile, WorkoutPlan } from "../types";

interface Plan3MonthsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  currentWorkout: WorkoutPlan;
}

export const Plan3MonthsModal: React.FC<Plan3MonthsModalProps> = ({
  isOpen,
  onClose,
  profile,
  currentWorkout,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<1 | 2 | 3>(1);

  if (!isOpen) return null;

  const months = [
    {
      month: 1,
      title: "เดือนที่ 1: ปูรากฐาน & ปรับสมดุลกล้ามเนื้อ (Foundational Phase)",
      focus: "Hypertrophy & Neuromuscular Adaptations",
      desc: "สร้างความคุ้นเคยกับฟอร์มการเคลื่อนไหว กระตุ้นกล้ามเนื้อมัดหลัก สะสมโวลุ่ม และสร้างวินัย",
      targets: [
        "ซ้อม 3-4 วัน/สัปดาห์ เน้นท่าพื้นฐาน (Compound Movements)",
        "กำหนดเวลานอน 7-8 ชม. เพื่อให้ระบบประสาทฟื้นตัวเต็มที่",
        "แคลอรี่เป้าหมาย: คุมให้โปรตีนถึง 1.6-2.0 กรัม/กก.",
      ],
      current: true,
      status: "กำลังดำเนินการ (สัปดาห์ที่ 3/12)",
    },
    {
      month: 2,
      title: "เดือนที่ 2: เพิ่มความเข้มข้น & สัดส่วน V-Taper (Overload Phase)",
      focus: "Progressive Overload & Deltoid/Lat Specialization",
      desc: "เพิ่มน้ำหนักหรือจำนวนเซ็ต เน้นกล้ามเนื้อหัวไหล่ข้างและปีกหลังเพื่อสร้างมิติหุ่น V-Taper เด่นชัด",
      targets: [
        "เพิ่มน้ำหนักในท่าหลัก 5-10% หรือใช้เทคนิค Rest-Pause",
        "เริ่มคุมคาร์ดิโอ Zone 2 เสริม 2 วัน/สัปดาห์ ละลายไขมันหน้าท้อง",
        "วัดสัดส่วนรอบเอวและรอบไหล่เพื่อประเมิน V-Taper Ratio",
      ],
      current: false,
      status: "ปลดล็อกเมื่อจบคอร์สเดือนที่ 1",
    },
    {
      month: 3,
      title: "เดือนที่ 3: กระชับสัดส่วน & ลีนรายละเอียด (Peak & Definition)",
      focus: "Caloric Deficit Tuning & Peak Conditioning",
      desc: "ดึงไขมันส่วนเกินออกพร้อมรักษามวลกล้ามเนื้อ เผยร่องกล้ามและเส้นเลือดที่ชัดเจนที่สุด",
      targets: [
        "ปรับแคลอรี่ลดลงเล็กน้อย 150-250 kcal/วันตามอัตราการเบิร์น",
        "เน้น Superset และ Metabolic Finishers ท้ายการซ้อม",
        "พร้อมประเมินภาพรวมความสำเร็จและถ่ายภาพ After",
      ],
      current: false,
      status: "รอปลดล็อกในเดือนที่ 3",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                แผนการฝึกภาพรวมล่วงหน้า 3 เดือน (12-Week Transformation)
              </h3>
              <p className="text-[11px] text-slate-400">
                วิเคราะห์และปรับให้เข้ากับเป้าหมาย "{profile.goal || "สร้างหุ่น V-Taper"}" ของคุณ
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

        {/* Month Selector Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2">
          {months.map((m) => (
            <button
              key={m.month}
              onClick={() => setSelectedMonth(m.month as any)}
              className={`py-2 px-3 sm:px-4 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 ${
                selectedMonth === m.month
                  ? "border-teal-500 bg-white text-teal-800 shadow-xs"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>เดือนที่ {m.month}</span>
              {m.current && (
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              )}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {(() => {
            const cur = months[selectedMonth - 1];
            return (
              <div className="space-y-4">
                <div className="bg-teal-50/60 border border-teal-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-teal-600" />
                      {cur.title}
                    </span>
                    <span className="text-[10px] bg-teal-600 text-white font-bold px-2 py-0.5 rounded-full">
                      {cur.status}
                    </span>
                  </div>
                  <p className="text-xs text-teal-800 font-medium">{cur.desc}</p>
                  <p className="text-[11px] text-teal-600 font-mono">
                    Focus: {cur.focus}
                  </p>
                </div>

                {/* Milestone Targets */}
                <div>
                  <h4 className="text-xs font-bold text-slate-800 mb-2">
                    หมุดหมายสำคัญที่ต้องพิชิตในเฟสนี้:
                  </h4>
                  <div className="space-y-2">
                    {cur.targets.map((tgt, i) => (
                      <div
                        key={i}
                        className="p-3 bg-white border border-slate-200 rounded-xl flex items-start gap-2.5 shadow-2xs"
                      >
                        <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                        <span className="text-xs text-slate-700 leading-relaxed">
                          {tgt}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Adaptive notice */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>
                    ระบบ AI จะคอยมอนิเตอร์คะแนนความล้า (RPE) และข้อมูล Google Fit ทุกสัปดาห์เพื่อปรับสเกลโดยอัตโนมัติ
                  </span>
                </div>
              </div>
            );
          })()}
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
