import React, { useState, useEffect } from "react";
import { Sparkles, CheckCircle2, Dumbbell, Utensils, Moon } from "lucide-react";
import confetti from "canvas-confetti";

interface PlanGenerationModalProps {
  goal: string;
  onFinish: () => void;
}

export const PlanGenerationModal: React.FC<PlanGenerationModalProps> = ({
  goal,
  onFinish,
}) => {
  const steps = [
    { title: "Analyzing your goal...", desc: `ประมวลผลเป้าหมาย: "${goal}"` },
    { title: "Planning your training...", desc: "ออกแบบตารางฝึก Upper/Lower และเลือกท่าฝึกเฉพาะบุคคล" },
    { title: "Balancing nutrition...", desc: "คำนวณแคลอรีและสารอาหารเป้าหมาย 2,300 kcal (โปรตีน 150g)" },
    { title: "Optimizing recovery...", desc: "กำหนดช่วงเวลาเข้านอน 7-9 ชม. และโมเมนตัมการฟื้นฟู" },
    { title: "Your plan is ready!", desc: "แผนของคุณถูกสร้างเรียบร้อยแล้ว พร้อมเริ่มใช้งานทันที" },
  ];

  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (currentStep < steps.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
      }, 900);
      return () => clearTimeout(timer);
    } else {
      try {
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }
      const finalTimer = setTimeout(() => {
        onFinish();
      }, 1200);
      return () => clearTimeout(finalTimer);
    }
  }, [currentStep]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-[2px] mx-auto shadow-lg shadow-emerald-500/20">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-emerald-400 animate-spin" />
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white tracking-tight">
            FitCoach AI กำลังสร้างแผนของคุณ
          </h3>
          <p className="text-xs text-slate-400">
            ปรับให้เข้ากับสรีระ ไลฟ์สไตล์ และเป้าหมายของคุณโดยเฉพาะ
          </p>
        </div>

        {/* Step progress list */}
        <div className="space-y-3 text-left">
          {steps.map((s, idx) => {
            const isDone = idx < currentStep;
            const isCurrent = idx === currentStep;
            return (
              <div
                key={idx}
                className={`p-3 rounded-xl border transition-all ${
                  isCurrent
                    ? "bg-slate-800/90 border-emerald-500/60 shadow-sm"
                    : isDone
                    ? "bg-slate-900/60 border-slate-800 text-slate-400"
                    : "opacity-30 border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : isCurrent ? (
                    <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
                  )}
                  <div>
                    <h5 className="text-xs font-bold text-slate-200">
                      {s.title}
                    </h5>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                      {s.desc}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
