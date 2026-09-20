import React, { useState } from "react";
import {
  X,
  Utensils,
  Plus,
  CheckCircle2,
  Sparkles,
  Camera,
  MessageSquare,
  Flame,
} from "lucide-react";
import { NutritionData, MealItem } from "../types";

interface NutritionModalProps {
  isOpen: boolean;
  onClose: () => void;
  nutrition: NutritionData;
  onAddMeal: (meal: MealItem) => void;
  onOpenLine: () => void;
}

export const NutritionModal: React.FC<NutritionModalProps> = ({
  isOpen,
  onClose,
  nutrition,
  onAddMeal,
  onOpenLine,
}) => {
  const [mealName, setMealName] = useState("");
  const [calories, setCalories] = useState<number>(450);
  const [protein, setProtein] = useState<number>(35);
  const [carbs, setCarbs] = useState<number>(45);
  const [fat, setFat] = useState<number>(12);
  const [mealType, setMealType] = useState<"breakfast" | "lunch" | "dinner" | "snack">("lunch");
  const [showAddForm, setShowAddForm] = useState(false);

  if (!isOpen) return null;

  const handleCreateMeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealName.trim()) return;

    const newMeal: MealItem = {
      id: "meal-" + Date.now(),
      name: mealName,
      calories: Number(calories),
      protein: Number(protein),
      carbs: Number(carbs),
      fat: Number(fat),
      time: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
      type: mealType,
    };

    onAddMeal(newMeal);
    setMealName("");
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-emerald-950 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Utensils className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                บันทึกและวิเคราะห์โภชนาการ (EAT)
              </h3>
              <p className="text-[11px] text-emerald-300">
                เป้าหมายพลังงาน {nutrition.targetCalories.toLocaleString()} kcal/วัน
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-emerald-900 text-emerald-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Calorie & Macros Ring / Progress */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700">
                พลังงานที่ได้รับวันนี้:
              </span>
              <span className="text-sm font-black text-slate-900">
                {nutrition.currentCalories.toLocaleString()} / {nutrition.targetCalories.toLocaleString()} kcal
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden mb-3">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${nutrition.targetCalories > 0 ? Math.min(100, (nutrition.currentCalories / nutrition.targetCalories) * 100) : 0}%`,
                }}
              />
            </div>
            {/* Macros Bar */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
              <div className="bg-white p-2 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-medium">โปรตีน</span>
                <span className="font-bold text-emerald-600">
                  {nutrition.currentProtein} / {nutrition.targetProtein > 0 ? `${nutrition.targetProtein}g` : "-"}
                </span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-medium">คาร์โบไฮเดรต</span>
                <span className="font-bold text-amber-600">
                  {nutrition.currentCarbs} / {nutrition.targetCarbs > 0 ? `${nutrition.targetCarbs}g` : "-"}
                </span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-medium">ไขมัน</span>
                <span className="font-bold text-rose-500">
                  {nutrition.currentFat} / {nutrition.targetFat > 0 ? `${nutrition.targetFat}g` : "-"}
                </span>
              </div>
            </div>
          </div>

          {/* LINE Photo Food Logging Banner */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-3.5 rounded-2xl border border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#06C755] text-white flex items-center justify-center shrink-0">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-slate-900">
                  ถ่ายรูปอาหารส่งเข้า LINE
                </h5>
                <p className="text-[11px] text-slate-600">
                  AI ช่วยคำนวณแคลอรี่และแยกสารอาหารให้อัตโนมัติ
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenLine();
              }}
              className="px-3 py-1.5 bg-[#06C755] hover:bg-[#05b34c] text-white rounded-xl text-xs font-bold transition-colors shadow-xs shrink-0"
            >
              เปิดแชท LINE
            </button>
          </div>

          {/* Meals of the day */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                มื้ออาหารที่บันทึกแล้ว ({nutrition.meals.length})
              </h5>
              <button
                id="toggle-add-meal-form-btn"
                onClick={() => setShowAddForm(!showAddForm)}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddForm ? "ปิดฟอร์ม" : "เพิ่มมื้ออาหาร"}</span>
              </button>
            </div>

            {/* Quick Add Form */}
            {showAddForm && (
              <form onSubmit={handleCreateMeal} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3 mb-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    ชื่อเมนูอาหาร:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น ข้าวกะเพราอกไก่ไข่ดาว"
                    value={mealName}
                    onChange={(e) => setMealName(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block">แคลอรี่ (kcal)</label>
                    <input
                      type="number"
                      value={calories}
                      onChange={(e) => setCalories(Number(e.target.value))}
                      className="w-full text-xs p-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">โปรตีน (g)</label>
                    <input
                      type="number"
                      value={protein}
                      onChange={(e) => setProtein(Number(e.target.value))}
                      className="w-full text-xs p-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">คาร์บ (g)</label>
                    <input
                      type="number"
                      value={carbs}
                      onChange={(e) => setCarbs(Number(e.target.value))}
                      className="w-full text-xs p-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">ไขมัน (g)</label>
                    <input
                      type="number"
                      value={fat}
                      onChange={(e) => setFat(Number(e.target.value))}
                      className="w-full text-xs p-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors"
                >
                  บันทึกมื้ออาหารนี้
                </button>
              </form>
            )}

            {/* Meals List */}
            {nutrition.meals.length === 0 ? (
              <div className="text-center py-6 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-1.5">
                <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Utensils className="w-4 h-4" />
                </div>
                <p className="text-xs font-bold text-slate-700">ยังไม่มีรายการอาหารที่บันทึกวันนี้</p>
                <p className="text-[11px] text-slate-400">
                  กดปุ่ม "เพิ่มมื้ออาหาร" ด้านบน หรือถ่ายภาพส่งในแชท LINE เพื่อให้ AI บันทึกให้อัตโนมัติ
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {nutrition.meals.map((meal) => (
                  <div
                    key={meal.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                        {meal.type === "breakfast" ? "เช้า" : meal.type === "lunch" ? "กลางวัน" : meal.type === "dinner" ? "เย็น" : "ว่าง"}
                      </div>
                      <div>
                        <h6 className="text-xs font-bold text-slate-800">{meal.name}</h6>
                        <p className="text-[11px] text-slate-500">
                          P: {meal.protein}g • C: {meal.carbs}g • F: {meal.fat}g
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-slate-900 block">
                        {meal.calories} kcal
                      </span>
                      <span className="text-[10px] text-slate-400">{meal.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
