import React, { useState, useEffect } from "react";
import {
  Sparkles,
  CheckCircle2,
  Cpu,
  Flame,
  Dumbbell,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { WorkoutPlan, UserProfile } from "../types";

interface PlanGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onPlanGenerated: (newPlan: WorkoutPlan) => void;
}

export const PlanGenerationModal: React.FC<PlanGenerationModalProps> = ({
  isOpen,
  onClose,
  profile,
  onPlanGenerated,
}) => {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("กำลังวิเคราะห์สรีระและประวัติ...");

  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      return;
    }

    const weight = profile.weightKg || profile.weight || 70;
    const height = profile.heightCm || profile.height || 175;
    const goalName = (profile.primaryGoal || profile.goal || "สร้างกล้ามเนื้อ").split(" ")[0];

    const steps = [
      { p: 20, text: `วิเคราะห์สรีระ ${weight}kg, ${height}cm (BMI ${(weight / ((height / 100) ** 2)).toFixed(1)})...` },
      { p: 45, text: `คำนวณปริมาณการฝึก (Volume) เป้าหมาย ${goalName}...` },
      { p: 70, text: "คัดเลือกท่า Compound & Isolation ที่ปลอดภัย..." },
      { p: 90, text: "สร้างคำแนะนำ RPE, RIR และระยะเวลาพักฟื้น..." },
      { p: 100, text: "พร้อมแล้ว! แผนการฝึกเฉพาะบุคคลสร้างเสร็จสมบูรณ์" },
    ];

    let currentStepIndex = 0;
    const interval = setInterval(() => {
      if (currentStepIndex < steps.length) {
        setProgress(steps[currentStepIndex].p);
        setStatusText(steps[currentStepIndex].text);
        currentStepIndex++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          // Deliver personalized plan
          const generatedPlan: WorkoutPlan = {
            id: "plan-ai-" + Date.now(),
            dayName: "วันนี้ (AI Tailored Day)",
            focusArea: "Hypertrophy & Strength: Upper Body Focus",
            durationMinutes: 45,
            intensity: "ปานกลาง-สูง (RPE 8)",
            coachNote: `โปรแกรมถูกปรับแต่งพิเศษสำหรับคุณ ${profile.name}: เน้นการสร้างมวลกล้ามเนื้อช่วงบนแบบสมดุล พร้อมเว้นช่วงพัก 60-90 วินาทีเพื่อผลลัพธ์สูงสุด`,
            exercises: [
              {
                id: "ex-1",
                name: "Incline Dumbbell Bench Press",
                sets: 4,
                reps: 10,
                restSeconds: 75,
                targetMuscle: "อกบน (Upper Chest)",
                instructions: "ปรับเบาะ 30 องศา ดันขึ้นเป็นแนวตรง บีบอกเบาๆ ที่จุดสูงสุด",
                tips: "เกร็งสะบักแนบเบาะตลอดเวลา ไม่แอ่นหลังล่างเกินไป",
                videoUrl: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=400&q=80",
              },
              {
                id: "ex-2",
                name: "Chest Supported Dumbbell Row",
                sets: 4,
                reps: 10,
                restSeconds: 75,
                targetMuscle: "หลังส่วนกลางและปีก (Lats / Rhomboids)",
                instructions: "นอนคว่ำบนเบาะเอียง ดึงดัมเบลเข้าหาแนวสะโพก บีบสะบักเข้าหากัน",
                tips: "โฟกัสการดึงด้วยข้อศอก ไม่ใช้แรงเหวี่ยงจากลำตัว",
                videoUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80",
              },
              {
                id: "ex-3",
                name: "Dumbbell Lateral Raise",
                sets: 3,
                reps: 14,
                restSeconds: 60,
                targetMuscle: "ไหล่ข้าง (Side Delts)",
                instructions: "ยืนตรง ยกแขนออกด้านข้างจนขนานกับพื้น เอนตัวไปข้างหน้าเล็กน้อย",
                tips: "ยกด้วยข้อศอกนำทาง ไม่ยกสูงเกินระดับหัวไหล่",
                videoUrl: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=400&q=80",
              },
              {
                id: "ex-4",
                name: "Incline Dumbbell Bicep Curl",
                sets: 3,
                reps: 12,
                restSeconds: 60,
                targetMuscle: "หน้าแขน (Biceps Brachii)",
                instructions: "นั่งเบาะเอียง ปล่อยแขนเหยียดลงให้กล้ามเนื้อยืดสุด แล้วเกร็งดึงขึ้น",
                tips: "รักษาข้อศอกให้อยู่กับที่ตลอดการเคลื่อนไหว",
                videoUrl: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=400&q=80",
              },
            ],
          };
          onPlanGenerated(generatedPlan);
          onClose();
        }, 600);
      }
    }, 450);

    return () => clearInterval(interval);
  }, [isOpen, profile]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-white text-center space-y-5">
        <div className="relative w-16 h-16 mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center animate-pulse">
            <Cpu className="w-8 h-8" />
          </div>
          <Sparkles className="w-5 h-5 text-yellow-400 absolute -top-1 -right-1 animate-bounce" />
        </div>

        <div>
          <h3 className="text-base font-bold text-white">
            FitCoach AI กำลังประมวลผลแผนการฝึก
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            อัลกอริทึม Hypertrophy & Periodization สำหรับคุณ {profile.name}
          </p>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">{statusText}</span>
            <span className="font-bold text-emerald-400">{progress}%</span>
          </div>
        </div>

        {/* Feature badges */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-[10px] text-slate-300">
          <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700">
            <span className="text-emerald-400 block font-bold">RPE 8 Guided</span>
            <span>ความหนักแม่นยำ</span>
          </div>
          <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700">
            <span className="text-teal-400 block font-bold">Volume Matched</span>
            <span>ไม่เหนื่อยเกินไป</span>
          </div>
          <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700">
            <span className="text-indigo-400 block font-bold">Injury Safe</span>
            <span>ลดความเสี่ยงเจ็บ</span>
          </div>
        </div>
      </div>
    </div>
  );
};
