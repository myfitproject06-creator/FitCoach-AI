import React, { useState } from "react";
import {
  X,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Dumbbell,
  Target,
  Calendar,
  Clock,
  HeartPulse,
  Flame,
  User,
} from "lucide-react";
import { UserProfile } from "../types";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: UserProfile;
  onSaveProfile: (profile: UserProfile) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  currentProfile,
  onSaveProfile,
}) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<UserProfile>({ ...currentProfile });

  if (!isOpen) return null;

  const handleChange = (field: keyof UserProfile, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < 4) setStep((s) => s + 1);
    else {
      onSaveProfile(formData);
      onClose();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                ประเมินร่างกาย & เป้าหมาย (FitCoach Setup)
              </h3>
              <p className="text-[11px] text-slate-400">
                ขั้นตอนที่ {step} จาก 4 เพื่อออกแบบโปรแกรมเฉพาะตัวคุณ
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

        {/* Stepper Indicator */}
        <div className="bg-slate-100 h-1.5 w-full">
          <div
            className="bg-emerald-500 h-full transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {step === 1 && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900">
                1. ข้อมูลพื้นฐาน & ร่างกาย
              </h4>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  ชื่อที่คุณต้องการให้โค้ชเรียก
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="เช่น บอล, แอน, เมย์"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    อายุ (ปี)
                  </label>
                  <input
                    type="number"
                    value={formData.age || ""}
                    onChange={(e) => handleChange("age", parseInt(e.target.value, 10) || 0)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    ส่วนสูง (ซม.)
                  </label>
                  <input
                    type="number"
                    value={formData.heightCm || formData.height || ""}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 0;
                      handleChange("heightCm", val);
                      handleChange("height", val);
                    }}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    น้ำหนัก (กก.)
                  </label>
                  <input
                    type="number"
                    value={formData.weightKg || formData.weight || ""}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 0;
                      handleChange("weightKg", val);
                      handleChange("weight", val);
                    }}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  เพศสรีระ
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "male", label: "ชาย" },
                    { id: "female", label: "หญิง" },
                  ].map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => {
                        handleChange("gender", g.id);
                        handleChange("sex", g.id);
                      }}
                      className={`py-2 rounded-xl text-xs font-semibold border ${
                        formData.gender === g.id
                          ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                          : "border-slate-200 bg-white text-slate-600"
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900">
                2. เป้าหมายหลักของคุณ
              </h4>
              <div className="space-y-2">
                {[
                  {
                    id: "vtaper",
                    title: "สร้างหุ่น V-Taper (ไหล่กว้าง เอวคอด)",
                    desc: "เน้นกล้ามไหล่ หลัง ปีก และลดรอบเอว เพิ่มความสมส่วน",
                  },
                  {
                    id: "fatloss",
                    title: "ลดไขมัน & กระชับสัดส่วน",
                    desc: "เบิร์นไขมันส่วนเกิน คุมแคลอรี่ รูปร่างเพรียวกระชับ",
                  },
                  {
                    id: "muscle",
                    title: "เพิ่มมวลกล้ามเนื้อ (Lean Bulk)",
                    desc: "เสริมสร้างกล้ามเนื้อทั่วร่าง เพิ่มพละกำลังความแข็งแกร่ง",
                  },
                  {
                    id: "health",
                    title: "สุขภาพดี & ฟิตร่างกายองค์รวม",
                    desc: "ลดความดัน เพิ่มความยืดหยุ่น หายใจคล่อง ไม่เหนื่อยง่าย",
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      handleChange("primaryGoal", item.id);
                      handleChange("goal", item.title);
                    }}
                    className={`w-full p-3 rounded-2xl border text-left transition-all ${
                      formData.primaryGoal === item.id
                        ? "border-emerald-500 bg-emerald-50/70 shadow-xs"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <p className="text-xs font-bold text-slate-900">{item.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900">
                3. เวลาและสถานที่ออกกำลังกาย
              </h4>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  จำนวนวันที่สะดวกฝึกต่อสัปดาห์
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[3, 4, 5, 6].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => handleChange("daysPerWeek", days)}
                      className={`py-2 rounded-xl text-xs font-bold border ${
                        formData.daysPerWeek === days
                          ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                          : "border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      {days} วัน
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  ระยะเวลาต่อครั้งที่สะดวก
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => handleChange("durationMinutes", mins)}
                      className={`py-2 rounded-xl text-xs font-bold border ${
                        formData.durationMinutes === mins
                          ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                          : "border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      {mins} นาที
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  สถานที่ฝึกเป็นหลัก
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "gym", label: "ฟิตเนส / ยิม (มีอุปกรณ์ครบ)" },
                    { id: "home", label: "ที่บ้าน (ดัมเบล / บอดี้เวท)" },
                  ].map((loc) => (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => {
                        handleChange("environment", loc.id);
                        handleChange("preferredLocation", loc.label);
                      }}
                      className={`p-2.5 rounded-xl text-xs font-medium border text-left ${
                        formData.environment === loc.id
                          ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                          : "border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      {loc.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900">
                4. การแจ้งเตือน & ข้อจำกัด
              </h4>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  เวลานัดซ้อมที่ให้โค้ชทักเตือนผ่าน LINE ประจำวัน
                </label>
                <input
                  type="time"
                  value={formData.lineNotificationTime || "18:00"}
                  onChange={(e) => handleChange("lineNotificationTime", e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  * โค้ชจะส่งข้อความล่วงหน้า 15 นาทีก่อนเวลาที่คุณเลือก
                </span>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  มีอาการบาดเจ็บหรือข้อห้ามหรือไม่?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleChange("hasInjuries", false)}
                    className={`py-2 rounded-xl text-xs font-semibold border ${
                      !formData.hasInjuries
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    ไม่มี (ร่างกายปกติ)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange("hasInjuries", true)}
                    className={`py-2 rounded-xl text-xs font-semibold border ${
                      formData.hasInjuries
                        ? "border-rose-500 bg-rose-50 text-rose-800"
                        : "border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    มีอาการบาดเจ็บ
                  </button>
                </div>
                {formData.hasInjuries && (
                  <input
                    type="text"
                    placeholder="เช่น ปวดหลังส่วนล่าง, เจ็บเข่าขวา"
                    value={formData.injuryDetails || ""}
                    onChange={(e) => handleChange("injuryDetails", e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 mt-2 focus:outline-none focus:border-emerald-500"
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>ย้อนกลับ</span>
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={handleNext}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-md active:scale-95"
          >
            <span>{step === 4 ? "สร้างโปรแกรมด้วย AI" : "ถัดไป"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
