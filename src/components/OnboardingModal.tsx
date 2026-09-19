import React, { useState } from "react";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Dumbbell,
  Clock,
  Heart,
} from "lucide-react";
import { UserProfile } from "../types";

interface OnboardingModalProps {
  initialProfile: UserProfile;
  onClose: () => void;
  onSaveProfileAndGenerate: (profile: UserProfile) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  initialProfile,
  onClose,
  onSaveProfileAndGenerate,
}) => {
  const [step, setStep] = useState(1);
  const totalSteps = 8;

  const [form, setForm] = useState<UserProfile>(initialProfile);
  const [analyzingGoal, setAnalyzingGoal] = useState(false);
  const [coachGoalBubble, setCoachGoalBubble] = useState<string>(
    "เข้าใจแล้วครับ! เราจะสร้างแผนเพื่อให้คุณมีรูปร่างที่กระชับ คล่องตัว และดูแข็งแรงเหมือนทอมฮอลแลนด์ โดยปรับให้เหมาะกับคุณโดยเฉพาะ"
  );

  const goalPresets = [
    {
      title: "หุ่นแบบทอม ฮอลแลนด์ (Lean Athletic)",
      text: "อยากได้หุ่นแบบทอม ฮอลแลนด์ครับ",
      coachReply: "เข้าใจแล้วครับ! เราจะสร้างแผนเพื่อให้คุณมีรูปร่างที่กระชับ คล่องตัว และดูแข็งแรงเหมือนทอมฮอลแลนด์ โดยปรับให้เหมาะกับคุณโดยเฉพาะ",
    },
    {
      title: "สร้างกล้ามเนื้อ & ความแข็งแรง (Hypertrophy)",
      text: "สร้างกล้ามเนื้อและเพิ่มความแข็งแรง",
      coachReply: "เป้าหมายชัดเจนครับ! เราจะเน้นโปรแกรมเวทเทรนนิ่งแบบ Progressive Overload และคุมโปรตีนให้เพียงพอเพื่อการเติบโตของกล้ามเนื้ออย่างมีคุณภาพครับ",
    },
    {
      title: "ลดไขมันกระชับสัดส่วน (Fat Loss & Tone)",
      text: "ลดไขมันส่วนเกิน รูปร่างกระชับ",
      coachReply: "ยอดเยี่ยมครับ! เราจะสร้าง Caloric Deficit ในระดับที่ปลอดภัย ควบคู่กับการเวทเทรนนิ่งเพื่อรักษามวลกล้ามเนื้อไม่ให้หย่อนคล้อยครับ",
    },
    {
      title: "ฟิตเนสองค์รวม & ความคล่องตัว (Mobility & Health)",
      text: "เพิ่มความคล่องตัวและสุขภาพองค์รวม",
      coachReply: "แผนที่สมดุลมากครับ เราจะรวมการฝึกความแข็งแรง คาร์ดิโอ และการยืดเหยียดข้อต่อเพื่อความคล่องตัวในชีวิตประจำวันครับ",
    },
  ];

  const handleSelectGoalPreset = (preset: typeof goalPresets[0]) => {
    setForm((prev) => ({ ...prev, goal: preset.text }));
    setCoachGoalBubble(preset.coachReply);
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep((prev) => prev + 1);
    } else {
      onSaveProfileAndGenerate(form);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep((prev) => prev - 1);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm">
              ประเมินและออกแบบแผน (ขั้นตอนที่ {step} / {totalSteps})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="w-full bg-slate-100 h-1.5">
          <div
            className="bg-emerald-500 h-full transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* STEP 1: GOAL */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                  ขั้นตอนที่ 1 · GOAL SETTING
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  เป้าหมายของคุณคืออะไร?
                </h3>
                <p className="text-xs text-slate-500">
                  บอกเป้าหมายของคุณได้เลย เราจะสร้างแผนที่เหมาะกับคุณที่สุด
                </p>
              </div>

              {/* Goal Input */}
              <div>
                <input
                  type="text"
                  value={form.goal}
                  onChange={(e) => {
                    const val = e.target.value;
                    let newDuration = form.targetDurationMonths;
                    if (val.includes("2 เดือน") || val.includes("2เดือน") || val.includes("8 สัปดาห์")) {
                      newDuration = 2;
                    } else if (val.includes("1 เดือน") || val.includes("1เดือน") || val.includes("4 สัปดาห์")) {
                      newDuration = 1;
                    } else if (val.includes("3 เดือน") || val.includes("3เดือน") || val.includes("12 สัปดาห์")) {
                      newDuration = 3;
                    } else if (val.includes("6 เดือน") || val.includes("6เดือน")) {
                      newDuration = 6;
                    }
                    setForm((prev) => ({ ...prev, goal: val, targetDurationMonths: newDuration }));
                    if (val.includes("ทอม")) {
                      setCoachGoalBubble(
                        `เข้าใจแล้วครับ! เราจะสร้างแผนปั้นหุ่นแบบทอม ฮอลแลนด์ โดยปรับให้เข้ากับระยะเวลา ${newDuration || 2} เดือนของคุณโดยเฉพาะครับ`
                      );
                    }
                  }}
                  placeholder="พิมพ์เป้าหมายของคุณ เช่น อยากได้หุ่นแบบทอม ฮอลแลนด์ มีเวลา 2 เดือน..."
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* Target Duration Selector */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>กรอบเวลาที่คุณต้องการเห็นผลลัพธ์:</span>
                  <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    {form.targetDurationMonths || 2} เดือน ({((form.targetDurationMonths || 2) * 4)} สัปดาห์)
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { months: 1, label: "1 เดือน", sub: "เร่งด่วน 4 วีค" },
                    { months: 2, label: "2 เดือน", sub: "เร่งรัด 8 วีค" },
                    { months: 3, label: "3 เดือน", sub: "มาตรฐาน 12 วีค" },
                    { months: 6, label: "6 เดือน", sub: "ยั่งยืน 24 วีค" },
                  ].map((dur) => {
                    const isSelected = (form.targetDurationMonths || 2) === dur.months;
                    return (
                      <button
                        key={dur.months}
                        type="button"
                        onClick={() => {
                          setForm((prev) => ({ ...prev, targetDurationMonths: dur.months }));
                          setCoachGoalBubble(
                            `ยอดเยี่ยมครับ! สำหรับเป้าหมายหุ่น Tom Holland ในกรอบเวลา ${dur.months} เดือน (${dur.months * 4} สัปดาห์) เราจะจัดแผนแบบเข้มข้นตรงตามเวลานี้ให้ทันทีครับ`
                          );
                        }}
                        className={`p-2 rounded-xl border text-center transition-all ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-50 text-emerald-950 font-bold shadow-xs ring-1 ring-emerald-500"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <div className="text-xs">{dur.label}</div>
                        <div className="text-[9px] text-slate-400 font-normal">{dur.sub}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Presets */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-slate-400">
                  หรือเลือกจากเป้าหมายยอดนิยม:
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {goalPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectGoalPreset(preset)}
                      className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                        form.goal === preset.text
                          ? "border-emerald-500 bg-emerald-50 text-emerald-950 shadow-xs"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {preset.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conversational Coach Feedback Bubble */}
              {coachGoalBubble && (
                <div className="p-3.5 bg-slate-900 text-white rounded-2xl flex items-start gap-3 shadow-sm border border-slate-800">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-white text-[10px] shrink-0 mt-0.5">
                    FC
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-0.5">
                      FitCoach AI
                    </span>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      "{coachGoalBubble}"
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: BODY INFO */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                  ขั้นตอนที่ 2 · ข้อมูลร่างกาย
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  ข้อมูลสรีระพื้นฐานของคุณ
                </h3>
                <p className="text-xs text-slate-500">
                  ใช้เพื่อคำนวณอัตราเผาผลาญพลังงาน (BMR/TDEE) และสัดส่วนที่เหมาะสม
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">ชื่อเรียก</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">เพศ</label>
                  <select
                    value={form.sex}
                    onChange={(e) => setForm({ ...form, sex: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                  >
                    <option value="Male">ชาย (Male)</option>
                    <option value="Female">หญิง (Female)</option>
                    <option value="Other">อื่นๆ</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">อายุ (ปี)</label>
                  <input
                    type="number"
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">ส่วนสูง (ซม.)</label>
                  <input
                    type="number"
                    value={form.height}
                    onChange={(e) => setForm({ ...form, height: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">น้ำหนักปัจจุบัน (กก.)</label>
                  <input
                    type="number"
                    value={form.weight}
                    onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">รอบเอว (ซม.)</label>
                  <input
                    type="number"
                    value={form.waistCm || 77}
                    onChange={(e) => setForm({ ...form, waistCm: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: EXPERIENCE */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                  ขั้นตอนที่ 3 · ประสบการณ์
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  ประสบการณ์การออกกำลังกายของคุณ
                </h3>
              </div>

              <div className="space-y-2">
                {[
                  {
                    level: "Beginner",
                    title: "เริ่มต้น (Beginner)",
                    desc: "เพิ่งเริ่มออกกำลังกาย หรือหยุดไปนานเกิน 1 ปี ยังไม่คุ้นเคยกับฟอร์มท่าฝึก",
                  },
                  {
                    level: "Intermediate",
                    title: "ปานกลาง (Intermediate)",
                    desc: "ออกกำลังกายสม่ำเสมอ 1-2 ปี คุ้นเคยกับเวทเทรนนิ่ง ต้องการแผนที่เป็นระบบขึ้น",
                  },
                  {
                    level: "Advanced",
                    title: "เชี่ยวชาญ (Advanced)",
                    desc: "ฝึกต่อเนื่องมากกว่า 3 ปี เข้าใจเทคนิคการยกและโภชนาการอย่างลึกซึ้ง",
                  },
                ].map((item) => (
                  <button
                    key={item.level}
                    onClick={() => setForm({ ...form, fitnessLevel: item.level as any })}
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all ${
                      form.fitnessLevel === item.level
                        ? "border-emerald-500 bg-emerald-50 shadow-xs"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <h5 className="text-xs font-bold text-slate-900">{item.title}</h5>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      {item.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: AVAILABILITY */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                  ขั้นตอนที่ 4 · เวลาและความพร้อม
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  คุณสะดวกฝึกกี่วันต่อสัปดาห์?
                </h3>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-2">
                  จำนวนวันต่อสัปดาห์:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[3, 4, 5, 6].map((days) => (
                    <button
                      key={days}
                      onClick={() => setForm({ ...form, daysPerWeek: days })}
                      className={`p-3 rounded-xl border text-center font-bold text-xs transition-all ${
                        form.daysPerWeek === days
                          ? "border-emerald-500 bg-emerald-50 text-emerald-950"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {days} วัน
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-2">
                  ระยะเวลาที่สะดวกต่อเซสชัน:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[30, 45, 60].map((dur) => (
                    <button
                      key={dur}
                      onClick={() => setForm({ ...form, durationMinutes: dur })}
                      className={`p-3 rounded-xl border text-center font-bold text-xs transition-all ${
                        form.durationMinutes === dur
                          ? "border-emerald-500 bg-emerald-50 text-emerald-950"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {dur} นาที
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-2">
                  ช่วงเวลาที่ต้องการฝึก:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(["เช้า", "บ่าย", "เย็น", "ค่ำ"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setForm({ ...form, preferredTime: t })}
                      className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all ${
                        form.preferredTime === t
                          ? "border-emerald-500 bg-emerald-50 text-emerald-950"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: EQUIPMENT */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                  ขั้นตอนที่ 5 · สถานที่และอุปกรณ์
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  คุณสะดวกฝึกที่ไหนและมีอุปกรณ์อะไรบ้าง?
                </h3>
              </div>

              <div className="space-y-2">
                {[
                  { id: "Gym", title: "ฟิตเนส / ยิมครบวงจร", desc: "มีบาร์เบลล์ ดัมเบลล์ เคเบิล และเครื่องแมชชีน" },
                  { id: "Home", title: "ที่บ้าน (มีดัมเบลล์ / บาร์ดึงข้อ)", desc: "มีอุปกรณ์ฟรีเวทพื้นฐาน ปรับน้ำหนักได้" },
                  { id: "Outdoor", title: "บอดี้เวท / สวนสาธารณะ", desc: "ใช้น้ำหนักตัว บาร์โหน และความคล่องตัว" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setForm({ ...form, environment: item.id as any })}
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all ${
                      form.environment === item.id
                        ? "border-emerald-500 bg-emerald-50 shadow-xs"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <h5 className="text-xs font-bold text-slate-900">{item.title}</h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 6: LIFESTYLE & SLEEP */}
          {step === 6 && (
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                  ขั้นตอนที่ 6 · ไลฟ์สไตล์และการนอน
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  กิจกรรมและการนอนหลับในแต่ละวัน
                </h3>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-2">
                  การเคลื่อนไหวในชีวิตประจำวัน:
                </label>
                <div className="space-y-2">
                  {[
                    { id: "Sedentary", title: "นั่งทำงานโต๊ะคอมทั้งวัน (เดินน้อยกว่า 4,000 ก้าว)" },
                    { id: "Light", title: "ขยับตัวบ้าง มีเดินไปมาในออฟฟิศ (4,000–7,000 ก้าว)" },
                    { id: "Moderate", title: "กระฉับกระเฉง เดินบ่อย (7,000–10,000 ก้าว)" },
                    { id: "Very Active", title: "ทำงานที่ต้องใช้แรงหรือเดินตลอดวัน (10,000+ ก้าว)" },
                  ].map((act) => (
                    <button
                      key={act.id}
                      onClick={() => setForm({ ...form, activityLevel: act.id as any })}
                      className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all ${
                        form.activityLevel === act.id
                          ? "border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {act.title}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-2">
                  ชั่วโมงการนอนโดยเฉลี่ยต่อคืน:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[6, 7, 7.5, 8.5].map((h) => (
                    <button
                      key={h}
                      onClick={() => setForm({ ...form, sleepHoursTypical: h })}
                      className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all ${
                        form.sleepHoursTypical === h
                          ? "border-emerald-500 bg-emerald-50 text-emerald-950"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {h} ชม.
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: NUTRITION */}
          {step === 7 && (
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                  ขั้นตอนที่ 7 · โภชนาการ
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  รูปแบบการรับประทานอาหาร
                </h3>
              </div>

              <div className="space-y-2">
                {[
                  { id: "ทั่วไป เน้นโปรตีนสูง", desc: "ทานอาหารทั่วไปได้หลากหลาย เน้นเพิ่มอกไก่ ไข่ ปลา และลดของทอด" },
                  { id: "คลีน / สุขภาพเข้มข้น", desc: "ทำอาหารทานเอง หรือสั่งอาหารสุขภาพเป็นหลัก คุมโซเดียมและน้ำตาล" },
                  { id: "กินตามสั่ง / สะดวกซื้อ", desc: "ทานนอกบ้านเป็นหลัก ต้องการคำแนะนำในการเลือกเมนูที่หาง่าย" },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => setForm({ ...form, dietStyle: item.id })}
                    className={`w-full p-3 rounded-xl border text-left text-xs transition-all ${
                      form.dietStyle === item.id
                        ? "border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="font-bold text-slate-900">{item.id}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 8: LIMITATIONS & SAFETY */}
          {step === 8 && (
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                  ขั้นตอนที่ 8 · ข้อจำกัดและความปลอดภัย
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  คุณมีอาการเจ็บหรือข้อจำกัดทางกายภาพไหม?
                </h3>
              </div>

              <textarea
                value={form.limitations.join(", ")}
                onChange={(e) =>
                  setForm({
                    ...form,
                    limitations: e.target.value.split(",").map((s) => s.trim()),
                  })
                }
                placeholder="เช่น เคยตึงหัวไหล่ขวา, ปวดหลังส่วนล่างเมื่อนั่งนาน (หากไม่มีให้เว้นว่างได้ครับ)"
                rows={2}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
              />

              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs text-amber-950">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <p className="leading-relaxed text-[11px] text-amber-900">
                  FitCoach AI ไม่ใช่แพทย์ และไม่สามารถวินิจฉัยโรคได้ หากมีอาการเจ็บขณะฝึก กรุณาหยุดพักและปรึกษาแพทย์ผู้เชี่ยวชาญครับ
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-white">
          {step > 1 ? (
            <button
              onClick={handleBack}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>ย้อนกลับ</span>
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={handleNext}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
          >
            <span>{step === totalSteps ? "สร้างแผนของฉันด้วย AI ✨" : "ถัดไป"}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
