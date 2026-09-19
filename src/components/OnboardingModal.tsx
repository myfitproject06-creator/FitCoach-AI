import React, { useState } from "react";
import {
  X,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Target,
  Dumbbell,
  Activity,
  Heart,
  Clock,
  Shield,
  Zap,
} from "lucide-react";
import { UserProfile, OnboardingForm } from "../types";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: UserProfile;
  onComplete: (updatedProfile: UserProfile) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  currentProfile,
  onComplete,
}) => {
  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState<OnboardingForm>({
    name: currentProfile.name,
    gender: (currentProfile.gender as any) || (currentProfile.sex?.toLowerCase() === "female" ? "female" : "male"),
    age: currentProfile.age,
    heightCm: currentProfile.heightCm || currentProfile.height || 175,
    weightKg: currentProfile.weightKg || currentProfile.weight || 70,
    primaryGoal: currentProfile.primaryGoal || currentProfile.goal || "สร้างกล้ามเนื้อและลดไขมัน",
    fitnessLevel: currentProfile.fitnessLevel,
    daysPerWeek: currentProfile.daysPerWeek,
    preferredLocation: currentProfile.preferredLocation || currentProfile.environment || "Gym",
    preferredTime: currentProfile.preferredTime,
    hasInjuries: false,
    injuryDetails: "",
    sleepHoursGoal: 8,
    dailyWaterGoalLiters: 2.5,
  });

  if (!isOpen) return null;

  const totalSteps = 4;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      const updated: UserProfile = {
        ...currentProfile,
        ...formData,
      };
      onComplete(updated);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
              FC
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                แบบประเมินและตั้งค่าโปรไฟล์ AI
              </h3>
              <p className="text-[11px] text-slate-400">
                ขั้นตอนที่ {step} จาก {totalSteps}
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

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-1.5">
          <div
            className="bg-emerald-500 h-full transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        {/* Modal Form Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* STEP 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  ข้อมูลพื้นฐานของคุณ
                </h4>
                <p className="text-xs text-slate-500">
                  ใช้เพื่อคำนวณอัตราการเผาผลาญ (BMR/TDEE) และสัดส่วนที่เหมาะสม
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  ชื่อเล่น หรือชื่อที่ต้องการให้โค้ชเรียก:
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="เช่น บาส, พลอย, ต้น"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    เพศ:
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="male">ชาย</option>
                    <option value="female">หญิง</option>
                    <option value="other">อื่นๆ</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    อายุ (ปี):
                  </label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    ส่วนสูง (ซม.):
                  </label>
                  <input
                    type="number"
                    value={formData.heightCm}
                    onChange={(e) => setFormData({ ...formData, heightCm: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    น้ำหนักปัจจุบัน (กก.):
                  </label>
                  <input
                    type="number"
                    value={formData.weightKg}
                    onChange={(e) => setFormData({ ...formData, weightKg: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Goals */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  เป้าหมายหลักในการฝึก
                </h4>
                <p className="text-xs text-slate-500">
                  โค้ชจะจัดสัดส่วนแคลอรี่และประเภทการฝึกให้ตรงเป้าหมายนี้
                </p>
              </div>

              <div className="space-y-2">
                {[
                  {
                    id: "สร้างกล้ามเนื้อและรูปร่าง (Hypertrophy)",
                    title: "สร้างกล้ามเนื้อและรูปร่าง (Hypertrophy)",
                    desc: "เพิ่มมวลกล้ามเนื้อ แน่นกระชับ สัดส่วนชัดเจน",
                    emoji: "💪",
                  },
                  {
                    id: "ลดไขมัน กระชับสัดส่วน (Fat Loss)",
                    title: "ลดไขมัน กระชับสัดส่วน (Fat Loss)",
                    desc: "ลดพุง รูปร่างเพรียวขึ้น พร้อมรักษากล้ามเนื้อ",
                    emoji: "🔥",
                  },
                  {
                    id: "เพิ่มความแข็งแรงและความทนทาน (Strength & Stamina)",
                    title: "เพิ่มความแข็งแรงและความทนทาน (Strength)",
                    desc: "ยกได้หนักขึ้น ไม่เหนื่อยง่าย สดชื่นตลอดวัน",
                    emoji: "⚡",
                  },
                  {
                    id: "สุขภาพองค์รวมและการฟื้นฟู (General Health & Longevity)",
                    title: "สุขภาพและการมีชีวิตชีวา (General Health)",
                    desc: "นอนหลับสนิท เคลื่อนไหวคล่องตัว ลดอาการออฟฟิศซินโดรม",
                    emoji: "🧘",
                  },
                ].map((g) => (
                  <div
                    key={g.id}
                    onClick={() => setFormData({ ...formData, primaryGoal: g.id })}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      formData.primaryGoal === g.id
                        ? "border-emerald-500 bg-emerald-50/60 shadow-xs"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{g.emoji}</span>
                      <div>
                        <h5 className="text-xs font-bold text-slate-900">{g.title}</h5>
                        <p className="text-[11px] text-slate-500">{g.desc}</p>
                      </div>
                    </div>
                    {formData.primaryGoal === g.id && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Experience & Routine */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  ประสบการณ์และตารางชีวิต
                </h4>
                <p className="text-xs text-slate-500">
                  เพื่อให้โปรแกรมเข้ากับกิจวัตรประจำวันของคุณอย่างสมดุล
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  ระดับประสบการณ์ฟิตเนส:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["มือใหม่ (Beginner)", "ปานกลาง (Intermediate)", "ชำนาญ (Advanced)"].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setFormData({ ...formData, fitnessLevel: lvl })}
                      className={`p-2 rounded-xl border text-xs font-semibold transition-all ${
                        formData.fitnessLevel === lvl
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      {lvl.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  สถานที่ออกกำลังกายที่สะดวก:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["ฟิตเนส (Gym)", "ที่บ้าน (Home)", "คอนโด (Condo Gym)"].map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setFormData({ ...formData, preferredLocation: loc })}
                      className={`p-2 rounded-xl border text-xs font-semibold transition-all ${
                        formData.preferredLocation === loc
                          ? "border-emerald-600 bg-emerald-50 text-emerald-900 font-bold"
                          : "border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  ช่วงเวลาที่สะดวกออกกำลังกาย:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["เช้า (06:00 - 08:30)", "เย็น (17:30 - 20:00)", "ค่ำ (20:00 เป็นต้นไป)"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFormData({ ...formData, preferredTime: t })}
                      className={`p-2 rounded-xl border text-xs font-semibold transition-all ${
                        formData.preferredTime === t
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      {t.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  จำนวนวันที่ต้องการฝึกต่อสัปดาห์: ({formData.daysPerWeek} วัน)
                </label>
                <input
                  type="range"
                  min={2}
                  max={6}
                  value={formData.daysPerWeek}
                  onChange={(e) => setFormData({ ...formData, daysPerWeek: Number(e.target.value) })}
                  className="w-full accent-emerald-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>2 วัน (เบาๆ)</span>
                  <span>4 วัน (แนะนำ)</span>
                  <span>6 วัน (เข้มข้น)</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Safety & Review */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  ความปลอดภัยและสุขภาพ
                </h4>
                <p className="text-xs text-slate-500">
                  แจ้งข้อจำกัดทางกายภาพเพื่อหลีกเลี่ยงท่าที่เสี่ยงบาดเจ็บ
                </p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    มีอาการบาดเจ็บ หรือเจ็บข้อต่อหรือไม่?
                  </span>
                  <input
                    type="checkbox"
                    checked={formData.hasInjuries}
                    onChange={(e) => setFormData({ ...formData, hasInjuries: e.target.checked })}
                    className="accent-emerald-600 w-4 h-4 rounded"
                  />
                </div>
                {formData.hasInjuries && (
                  <input
                    type="text"
                    placeholder="เช่น เจ็บเข่าขวา, ปวดหลังส่วนล่าง"
                    value={formData.injuryDetails}
                    onChange={(e) => setFormData({ ...formData, injuryDetails: e.target.value })}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white"
                  />
                )}
              </div>

              {/* Ready to generate AI blueprint */}
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-sm">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h5 className="text-sm font-bold text-emerald-950">
                  พร้อมสร้างแผนส่วนตัวของคุณแล้ว!
                </h5>
                <p className="text-xs text-emerald-800 leading-relaxed max-w-xs mx-auto">
                  ระบบ AI จะนำข้อมูลสัดส่วน {formData.weightKg} กก. / {formData.heightCm} ซม. และเป้าหมายไปคำนวณโปรแกรมฝึกและโภชนาการแบบแม่นยำ
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={handleBack}
              className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-2xl text-xs transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>ย้อนกลับ</span>
            </button>
          ) : (
            <div />
          )}

          <button
            id="onboarding-next-btn"
            onClick={handleNext}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs transition-all shadow-md flex items-center gap-1.5"
          >
            <span>{step === totalSteps ? "ยืนยันและสร้างโปรแกรม" : "ถัดไป"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
