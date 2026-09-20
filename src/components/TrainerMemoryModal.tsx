import React, { useState } from "react";
import {
  X,
  Brain,
  ShieldAlert,
  Ban,
  Utensils,
  Target,
  Sparkles,
  Save,
  Check,
  Plus,
  Trash2,
} from "lucide-react";
import { UserProfile } from "../types";

interface TrainerMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSaveProfile: (updatedProfile: UserProfile) => void;
}

const COMMON_INJURIES = [
  "ปวดเข่า / เจ็บลูกสะบ้า",
  "ปวดหลังล่าง (Lower Back Pain)",
  "ตึงสะบัก / ไหล่ติด (Shoulder Impingement)",
  "เจ็บข้อมือ / ข้อต่อมือ",
  "ข้อเท้าพลิก / เอ็นร้อยหวาย",
  "คอตึง / ออฟฟิศซินโดรม",
];

const COMMON_AVOID_EXERCISES = [
  "Barbell Squat ลึก (Full Squat)",
  "Behind-the-neck Press",
  "Jumping / ท่ากระโดดลงน้ำหนัก",
  "Heavy Deadlift",
  "Dips ลึก",
  "Sit-up เต็มตัว",
];

const COMMON_DIET_RESTRICTIONS = [
  "แพ้อาหารทะเล / กุ้ง ปู",
  "แพ้นมวัว / แลคโตส (Lactose Intolerance)",
  "ไม่ทานเนื้อวัว",
  "ทานมังสวิรัติ / Plant-based",
  "แพ้ถั่วลิสง",
  "คุมโซเดียม / ไม่ทานเค็ม",
];

const COMMON_FOCUS_AREAS = [
  "ลดไขมันหน้าท้อง & เอว",
  "เพิ่มกล้ามอกและแขน",
  "ปั้นกล้ามก้นและสะโพก",
  "แก้อาการหลังค่อม / ไหล่ห่อ",
  "เสริมความอึดและหัวใจ (Cardio Endurance)",
];

export const TrainerMemoryModal: React.FC<TrainerMemoryModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
}) => {
  const [injuries, setInjuries] = useState<string[]>(
    profile.injuries || (profile.injuryDetails ? [profile.injuryDetails] : [])
  );
  const [avoidExercises, setAvoidExercises] = useState<string[]>(
    profile.avoidExercises || []
  );
  const [foodRestrictions, setFoodRestrictions] = useState<string[]>(
    profile.foodRestrictions || profile.allergies || []
  );
  const [focusAreas, setFocusAreas] = useState<string[]>(
    profile.focusAreas || []
  );
  const [trainerNotes, setTrainerNotes] = useState<string>(
    profile.trainerNotes || ""
  );

  const [customInjuryInput, setCustomInjuryInput] = useState("");
  const [customAvoidInput, setCustomAvoidInput] = useState("");
  const [customFoodInput, setCustomFoodInput] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const toggleItem = (list: string[], setList: (items: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleAddCustomItem = (
    value: string,
    setValue: (v: string) => void,
    list: string[],
    setList: (items: string[]) => void
  ) => {
    const trimmed = value.trim();
    if (trimmed && !list.includes(trimmed)) {
      setList([...list, trimmed]);
      setValue("");
    }
  };

  const handleSave = () => {
    const updated: UserProfile = {
      ...profile,
      injuries,
      hasInjuries: injuries.length > 0,
      injuryDetails: injuries.join(", "),
      avoidExercises,
      foodRestrictions,
      allergies: foodRestrictions,
      focusAreas,
      trainerNotes: trainerNotes.trim(),
    };
    onSaveProfile(updated);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 font-bold">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">สมุดบันทึกความจำของโค้ช</h3>
                <span className="text-[10px] bg-indigo-500/30 text-indigo-300 border border-indigo-400/40 px-2 py-0.5 rounded-full font-bold">
                  TRAINER'S MEMORY
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                โค้ชจะจดจำจุดเจ็บ ข้อจำกัด และปรับแผนการสอนให้คุณโดยเฉพาะ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Section 1: จุดที่เคยบาดเจ็บหรือต้องระวัง */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-xs">
              <ShieldAlert className="w-4 h-4" />
              <span>อาการบาดเจ็บ / จุดที่ต้องระวัง (Injuries & Pain Points)</span>
            </div>
            <p className="text-[11px] text-slate-500">
              แตะเพื่อเลือกจุดที่เคยบาดเจ็บ เพื่อให้โค้ชหลีกเลี่ยงแรงกดทับบริเวณดังกล่าว
            </p>

            <div className="flex flex-wrap gap-1.5">
              {COMMON_INJURIES.map((item) => {
                const active = injuries.includes(item);
                return (
                  <button
                    key={item}
                    onClick={() => toggleItem(injuries, setInjuries, item)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                      active
                        ? "bg-rose-50 text-rose-700 border-rose-300 font-bold shadow-xs"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {active ? "✓ " : "+ "}
                    {item}
                  </button>
                );
              })}
            </div>

            {/* Custom input */}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={customInjuryInput}
                onChange={(e) => setCustomInjuryInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomItem(customInjuryInput, setCustomInjuryInput, injuries, setInjuries);
                  }
                }}
                placeholder="พิมพ์จุดเจ็บอื่นๆ แล้วกดเพิ่ม..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-rose-400"
              />
              <button
                onClick={() => handleAddCustomItem(customInjuryInput, setCustomInjuryInput, injuries, setInjuries)}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่ม</span>
              </button>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Section 2: ท่าที่ต้องหลีกเลี่ยง */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-amber-600 font-bold text-xs">
              <Ban className="w-4 h-4" />
              <span>ท่าออกกำลังกายที่ต้องการเลี่ยง (Avoid Exercises)</span>
            </div>
            <p className="text-[11px] text-slate-500">
              ท่าที่ไม่ถนัด หรือแพทย์สั่งห้าม โค้ชจะหาท่าสำรองที่ปลอดภัยกว่ามาให้แทน
            </p>

            <div className="flex flex-wrap gap-1.5">
              {COMMON_AVOID_EXERCISES.map((item) => {
                const active = avoidExercises.includes(item);
                return (
                  <button
                    key={item}
                    onClick={() => toggleItem(avoidExercises, setAvoidExercises, item)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                      active
                        ? "bg-amber-50 text-amber-700 border-amber-300 font-bold shadow-xs"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {active ? "✓ " : "+ "}
                    {item}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={customAvoidInput}
                onChange={(e) => setCustomAvoidInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomItem(customAvoidInput, setCustomAvoidInput, avoidExercises, setAvoidExercises);
                  }
                }}
                placeholder="พิมพ์ท่าที่ต้องการเลี่ยงอื่นๆ..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-400"
              />
              <button
                onClick={() => handleAddCustomItem(customAvoidInput, setCustomAvoidInput, avoidExercises, setAvoidExercises)}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่ม</span>
              </button>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Section 3: ข้อจำกัดอาหาร */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
              <Utensils className="w-4 h-4" />
              <span>ข้อจำกัดและอาหารที่แพ้ (Diet & Allergies)</span>
            </div>
            <p className="text-[11px] text-slate-500">
              โค้ชจะไม่แนะนำเมนูอาหารที่คุณแพ้หรือไม่ชอบเด็ดขาด
            </p>

            <div className="flex flex-wrap gap-1.5">
              {COMMON_DIET_RESTRICTIONS.map((item) => {
                const active = foodRestrictions.includes(item);
                return (
                  <button
                    key={item}
                    onClick={() => toggleItem(foodRestrictions, setFoodRestrictions, item)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                      active
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300 font-bold shadow-xs"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {active ? "✓ " : "+ "}
                    {item}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={customFoodInput}
                onChange={(e) => setCustomFoodInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomItem(customFoodInput, setCustomFoodInput, foodRestrictions, setFoodRestrictions);
                  }
                }}
                placeholder="พิมพ์อาหารที่แพ้หรือไม่ทาน..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-400"
              />
              <button
                onClick={() => handleAddCustomItem(customFoodInput, setCustomFoodInput, foodRestrictions, setFoodRestrictions)}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่ม</span>
              </button>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Section 4: จุดโฟกัสพิเศษ */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
              <Target className="w-4 h-4" />
              <span>จุดที่อยากเน้นเป็นพิเศษ (Focus Areas)</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_FOCUS_AREAS.map((item) => {
                const active = focusAreas.includes(item);
                return (
                  <button
                    key={item}
                    onClick={() => toggleItem(focusAreas, setFocusAreas, item)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                      active
                        ? "bg-indigo-50 text-indigo-700 border-indigo-300 font-bold shadow-xs"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {active ? "✓ " : "+ "}
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Section 5: บันทึกส่วนตัวของโค้ช (Freeform Trainer Notes) */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>โน้ตเฉพาะตัวที่อยากให้เทรนเนอร์จำไว้ (Trainer's Memory Notes)</span>
            </div>
            <p className="text-[11px] text-slate-500">
              เช่น "เลิกงาน 19:30 น., วันอังคารไม่สะดวกซ้อม, มีแผนไปงานแต่งเดือนหน้าอยากลีนหน้าท้อง"
            </p>
            <textarea
              rows={3}
              value={trainerNotes}
              onChange={(e) => setTrainerNotes(e.target.value)}
              placeholder="บันทึกข้อความถึงโค้ช..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 leading-relaxed resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-2xl text-xs transition-colors cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSave}
            disabled={isSaved}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            {isSaved ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
            <span>{isSaved ? "บันทึกความจำเรียบร้อยแล้ว!" : "บันทึกความจำของโค้ช"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
