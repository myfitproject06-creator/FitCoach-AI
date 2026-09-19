import React, { useState } from "react";
import {
  X,
  Calendar,
  Layers,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Target,
  CheckCircle2,
  Clock,
  Dumbbell,
  Shield,
  Zap,
} from "lucide-react";
import { UserProfile } from "../types";

interface Plan3MonthsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
}

export const Plan3MonthsModal: React.FC<Plan3MonthsModalProps> = ({
  isOpen,
  onClose,
  profile,
}) => {
  const [activeMonth, setActiveMonth] = useState<1 | 2 | 3>(1);

  if (!isOpen) return null;

  const phases = [
    {
      month: 1,
      name: "เดือนที่ 1: Foundation & Neuromuscular Adaptation",
      subtitle: "สร้างฐานกำลัง ปรับฟอร์มท่า และความเคยชินระบบประสาท",
      badge: "เดือนปัจจุบัน (กำลังดำเนินการ)",
      badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      description: "เน้นท่าฝึกหลัก (Compound Movements) เพื่อให้ระบบประสาทสั่งการกล้ามเนื้อได้เต็มประสิทธิภาพ ปรับสมดุลข้อต่อ และสร้างวินัยความสม่ำเสมอ",
      targetRPE: "RPE 6 - 7.5 (เหลือแรง 2-3 ครั้ง)",
      weeklyFrequency: `${profile.daysPerWeek} วัน/สัปดาห์ (Upper / Lower / Full Body)`,
      cardio: "Zone 2 Cardio 30 นาที 2 ครั้ง/สัปดาห์ เพื่อเพิ่ม Mitochondrial Density",
      milestones: [
        "ฟอร์มท่าสควอช และเพรสถูกต้อง 100% ไม่ปวดหลังส่วนล่าง",
        "น้ำหนักตัวและรอบเอวเริ่มกระชับขึ้น 1-2 ซม.",
        "ระบบการนอนเข้าที่ เฉลี่ย 7.5 ชั่วโมงขึ้นไป",
      ],
      sampleWeeklySplit: [
        { day: "Day 1", workout: "Upper Body Hypertrophy (Chest/Back/Arms)", sets: "14 sets" },
        { day: "Day 2", workout: "Lower Body Foundation (Quads/Glutes/Core)", sets: "12 sets" },
        { day: "Day 3", workout: "Active Recovery & Mobility Flow", sets: "20 min" },
        { day: "Day 4", workout: "Upper Body Power & Pull Focus", sets: "14 sets" },
        { day: "Day 5", workout: "Lower Body & Posterior Chain (Hamstrings/Calves)", sets: "12 sets" },
        { day: "Day 6-7", workout: "Rest & Outdoor Low-intensity Activity", sets: "Rest" },
      ],
    },
    {
      month: 2,
      name: "เดือนที่ 2: Hypertrophy & Volume Progressive Overload",
      subtitle: "เพิ่มปริมาณเซ็ต โฟกัสการฉีกขาดของเส้นใยเพื่อสร้างขนาด",
      badge: "ระยะถัดไป (เดือนหน้า)",
      badgeColor: "bg-teal-500/20 text-teal-300 border-teal-500/30",
      description: "เพิ่ม Training Volume ต่อกลุ่มกล้ามเนื้อเป็น 14-18 เซ็ตต่อสัปดาห์ เพิ่ม Time Under Tension (TUT) เพื่อกระตุ้นการเจริญเติบโตของกล้ามเนื้ออย่างชัดเจน",
      targetRPE: "RPE 7.5 - 8.5 (เข้มข้นขึ้น ใกล้เคียงจุดล้า)",
      weeklyFrequency: `${profile.daysPerWeek} วัน/สัปดาห์ (Push / Pull / Legs Split)`,
      cardio: "HIIT สลับ Zone 2 อย่างละ 1 เซสชั่น เพื่อเร่งการเผาผลาญไขมันสะสม",
      milestones: [
        "เพิ่มน้ำหนักดัมเบลและบาร์เบลขึ้น 5-10% จากเดือนแรก",
        "มวลกล้ามเนื้อลายชัดเจนขึ้น เส้นเลือดเริ่มปรากฏ (Vascularity)",
        "ความจุปอดและหัวใจ (VO2 Max) ดีขึ้น ไม่เหนื่อยง่าย",
      ],
      sampleWeeklySplit: [
        { day: "Day 1", workout: "Push Day (Chest, Shoulders, Triceps)", sets: "16 sets" },
        { day: "Day 2", workout: "Pull Day (Back, Lats, Biceps, Rear Delts)", sets: "16 sets" },
        { day: "Day 3", workout: "Legs & Core Volume (Squat, Lunge, Planks)", sets: "15 sets" },
        { day: "Day 4", workout: "Rest / Light Stretch", sets: "Rest" },
        { day: "Day 5", workout: "Upper Body Density & Drop-sets", sets: "15 sets" },
        { day: "Day 6", workout: "Lower Body Power & HIIT Finisher", sets: "14 sets" },
        { day: "Day 7", workout: "Full Sleep & Recovery Day", sets: "Rest" },
      ],
    },
    {
      month: 3,
      name: "เดือนที่ 3: Peak Conditioning & Body Recomposition",
      subtitle: "คงมวลกล้ามเนื้อ รีดไขมันส่วนเกิน รูปร่างคมชัดที่สุด",
      badge: "ระยะเป้าหมายสูงสุด (เดือนที่ 3)",
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      description: "ผสมผสานความหนักระดับสูงสุดและการคุมอาหารแบบ Carb Cycling รักษากล้ามเนื้อพร้อมรีดไขมันใต้ผิวหนัง เพื่อให้เห็นลายกล้ามเนื้อชัดเจนที่สุด",
      targetRPE: "RPE 8.5 - 9.5 พร้อม Deload Week ในสัปดาห์สุดท้าย",
      weeklyFrequency: `${profile.daysPerWeek} วัน/สัปดาห์ (Specialized Aesthetic Split)`,
      cardio: "Fast-paced Incline Walk 30 นาที 3 ครั้ง/สัปดาห์",
      milestones: [
        "เปอร์เซ็นต์ไขมันในร่างกายลดลงตามเป้าหมาย (ประมาณ 2-4%)",
        "สัดส่วน V-Shape ชัดเจน หน้าท้องกระชับ แข็งแรงขึ้นอย่างเห็นได้ชัด",
        "สร้าง Habit สุขภาพถาวร พร้อมส่งต่อไปยังปีถัดไป",
      ],
      sampleWeeklySplit: [
        { day: "Day 1", workout: "Chest & Back Antagonist Supersets", sets: "16 sets" },
        { day: "Day 2", workout: "Legs Shred & Glute Hypertrophy", sets: "14 sets" },
        { day: "Day 3", workout: "Shoulders & Arms Aesthetic Focus", sets: "15 sets" },
        { day: "Day 4", workout: "Cardio & Core Endurance Conditioning", sets: "35 min" },
        { day: "Day 5", workout: "Full Body Heavy Compound Strength", sets: "12 sets" },
        { day: "Day 6", workout: "Active Longevity Yoga / Mobility", sets: "30 min" },
        { day: "Day 7", workout: "Final Assessment & Photo Check-in", sets: "Check-in" },
      ],
    },
  ];

  const currentPhase = phases[activeMonth - 1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[92vh] rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden flex flex-col text-white">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-emerald-500/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  แผนแม่บทฟิตเนส 3 เดือน (Periodization Blueprint)
                </h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  MACROCYCLE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                วางแผนตามหลักวิทยาศาสตร์การกีฬา 12 สัปดาห์เพื่อผลลัพธ์ยั่งยืนสำหรับคุณ {profile.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Phase Navigation Tabs */}
        <div className="bg-slate-950/80 px-4 py-2 border-b border-slate-800 flex gap-2">
          {phases.map((p) => (
            <button
              key={p.month}
              onClick={() => setActiveMonth(p.month as any)}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeMonth === p.month
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                  : "bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <span>เดือนที่ {p.month}</span>
              <span className="text-[10px] opacity-75 hidden sm:inline">
                ({p.month === 1 ? "ปรับตัว" : p.month === 2 ? "สร้างกล้าม" : "คมชัด"})
              </span>
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Active Month Header */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${currentPhase.badgeColor}`}>
                {currentPhase.badge}
              </span>
              <span className="text-xs text-slate-400 font-mono">สัปดาห์ที่ {(activeMonth - 1) * 4 + 1} - {activeMonth * 4}</span>
            </div>
            <h4 className="text-base font-bold text-white pt-1">
              {currentPhase.name}
            </h4>
            <p className="text-xs text-emerald-300 font-medium">
              {currentPhase.subtitle}
            </p>
            <p className="text-xs text-slate-300 leading-relaxed pt-1">
              {currentPhase.description}
            </p>
          </div>

          {/* Key Parameters Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="bg-slate-800/70 p-3 rounded-2xl border border-slate-700/80">
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                ระดับความหนักเป้าหมาย
              </span>
              <span className="text-xs font-bold text-emerald-400 mt-1 block">
                {currentPhase.targetRPE}
              </span>
            </div>

            <div className="bg-slate-800/70 p-3 rounded-2xl border border-slate-700/80">
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                ความถี่และการแบ่งกลุ่ม
              </span>
              <span className="text-xs font-bold text-teal-300 mt-1 block">
                {currentPhase.weeklyFrequency}
              </span>
            </div>

            <div className="bg-slate-800/70 p-3 rounded-2xl border border-slate-700/80">
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                กลยุทธ์คาร์ดิโอ (Cardio)
              </span>
              <span className="text-xs font-bold text-amber-300 mt-1 block">
                {currentPhase.cardio}
              </span>
            </div>
          </div>

          {/* Sample Weekly Schedule Matrix */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-300 block flex items-center gap-1.5">
              <Dumbbell className="w-3.5 h-3.5 text-emerald-400" />
              โครงสร้างตารางฝึกตัวอย่างประจำสัปดาห์ (Weekly Matrix):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {currentPhase.sampleWeeklySplit.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/70 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold bg-slate-700 text-slate-200 px-1.5 py-0.5 rounded">
                      {item.day}
                    </span>
                    <span className="text-xs text-slate-200 font-medium">
                      {item.workout}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 shrink-0 ml-2">
                    {item.sets}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Milestones for this Month */}
          <div className="space-y-2 bg-emerald-950/30 p-3.5 rounded-2xl border border-emerald-500/30">
            <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-xs">
              <Target className="w-4 h-4" />
              <span>เป้าหมายความสำเร็จของเดือนที่ {activeMonth} (Milestones):</span>
            </div>
            <div className="space-y-1.5">
              {currentPhase.milestones.map((ms, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{ms}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            แผนจะถูกอัปเดตอัตโนมัติทุกสัปดาห์ตามผลประเมินจริงของคุณ
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-md cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
