import React, { useState } from "react";
import {
  X,
  Utensils,
  Plus,
  Trash2,
  Sparkles,
  Camera,
  Check,
  ChevronRight,
  PieChart,
} from "lucide-react";
import { NutritionData, MealItem } from "../types";

interface NutritionModalProps {
  isOpen: boolean;
  onClose: () => void;
  nutrition: NutritionData;
  onAddMeal: (meal: MealItem) => void;
}

export const NutritionModal: React.FC<NutritionModalProps> = ({
  isOpen,
  onClose,
  nutrition,
  onAddMeal,
}) => {
  const [mealName, setMealName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [mealType, setMealType] = useState<MealItem["type"]>("lunch");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealName.trim() || !calories) return;

    const newMeal: MealItem = {
      id: `meal-${Date.now()}`,
      name: mealName.trim(),
      type: mealType,
      calories: parseInt(calories, 10) || 0,
      protein: parseInt(protein, 10) || 0,
      carbs: parseInt(carbs, 10) || 0,
      fat: parseInt(fat, 10) || 0,
      time: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
    };

    onAddMeal(newMeal);
    setMealName("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
  };

  const quickMeals = [
    { name: "อกไก่ย่าง 200g + ข้าวกล้อง", cal: 420, p: 48, c: 45, f: 5, type: "lunch" as const },
    { name: "เวย์โปรตีน 1 สกู๊ป + กล้วยหอม", cal: 240, p: 26, c: 30, f: 2, type: "snack" as const },
    { name: "ไข่ต้ม 3 ฟอง + ขนมปังโฮลวีต", cal: 310, p: 22, c: 24, f: 14, type: "breakfast" as const },
    { name: "สลัดทูน่าในน้ำแร่", cal: 220, p: 32, c: 6, f: 4, type: "dinner" as const },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Utensils className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">บันทึกอาหาร & สารอาหาร (EAT)</h3>
              <p className="text-[11px] text-slate-400">
                เป้าหมายวันนี้: {nutrition.targetCalories > 0 ? `${nutrition.targetCalories.toLocaleString()} kcal` : "- kcal"}
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

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Daily Macros Visual Cards */}
          <div className="grid grid-cols-4 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <div className="text-center">
              <span className="text-[10px] text-slate-400 font-semibold block">แคลอรี่</span>
              <span className="text-sm font-bold text-slate-900">{nutrition.currentCalories}</span>
              <span className="text-[9px] text-slate-500 block">/ {nutrition.targetCalories > 0 ? nutrition.targetCalories : "-"}</span>
            </div>
            <div className="text-center">
              <span className="text-[10px] text-emerald-600 font-semibold block">โปรตีน</span>
              <span className="text-sm font-bold text-emerald-600">{nutrition.currentProtein}g</span>
              <span className="text-[9px] text-slate-500 block">/ {nutrition.targetProtein > 0 ? `${nutrition.targetProtein}g` : "-"}</span>
            </div>
            <div className="text-center">
              <span className="text-[10px] text-amber-600 font-semibold block">คาร์บ</span>
              <span className="text-sm font-bold text-amber-600">{nutrition.currentCarbs}g</span>
              <span className="text-[9px] text-slate-500 block">/ {nutrition.targetCarbs > 0 ? `${nutrition.targetCarbs}g` : "-"}</span>
            </div>
            <div className="text-center">
              <span className="text-[10px] text-rose-500 font-semibold block">ไขมัน</span>
              <span className="text-sm font-bold text-rose-500">{nutrition.currentFat}g</span>
              <span className="text-[9px] text-slate-500 block">/ {nutrition.targetFat > 0 ? `${nutrition.targetFat}g` : "-"}</span>
            </div>
          </div>

          {/* Quick Add presets */}
          <div>
            <span className="text-xs font-bold text-slate-800 block mb-2">
              เมนูด่วนยอดนิยม (แตะเพื่อเพิ่มทันที)
            </span>
            <div className="grid grid-cols-2 gap-2">
              {quickMeals.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    onAddMeal({
                      id: `meal-${Date.now()}-${idx}`,
                      name: item.name,
                      calories: item.cal,
                      protein: item.p,
                      carbs: item.c,
                      fat: item.f,
                      type: item.type,
                      time: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
                    });
                  }}
                  className="p-2.5 bg-white border border-slate-200 hover:border-emerald-500 rounded-xl text-left transition-all hover:bg-emerald-50/30 group"
                >
                  <p className="text-xs font-semibold text-slate-800 group-hover:text-emerald-700 truncate">
                    {item.name}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {item.cal} kcal • P: {item.p}g • C: {item.c}g
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Add custom meal form */}
          <form onSubmit={handleSubmit} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-3">
            <span className="text-xs font-bold text-slate-800 block">
              หรือระบุอาหารที่รับประทานเอง
            </span>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="text-[10px] text-slate-500 font-medium block mb-1">
                  ชื่อเมนู / อาหาร
                </label>
                <input
                  type="text"
                  placeholder="เช่น ข้าวผัดกะเพราไข่ดาว"
                  value={mealName}
                  onChange={(e) => setMealName(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-medium block mb-1">
                  มื้ออาหาร
                </label>
                <select
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value as any)}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-emerald-500"
                >
                  <option value="breakfast">เช้า</option>
                  <option value="lunch">กลางวัน</option>
                  <option value="dinner">เย็น</option>
                  <option value="snack">ว่าง</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 font-medium block mb-1">
                  แคลอรี่ (kcal)
                </label>
                <input
                  type="number"
                  placeholder="เช่น 550"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-medium block mb-1">
                  โปรตีน (g)
                </label>
                <input
                  type="number"
                  placeholder="เช่น 30"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-medium block mb-1">
                  คาร์บ (g)
                </label>
                <input
                  type="number"
                  placeholder="เช่น 60"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-medium block mb-1">
                  ไขมัน (g)
                </label>
                <input
                  type="number"
                  placeholder="เช่น 15"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!mealName.trim() || !calories}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มรายการอาหาร</span>
            </button>
          </form>

          {/* Meals logged list */}
          <div>
            <span className="text-xs font-bold text-slate-800 block mb-2">
              มื้อที่บันทึกแล้ววันนี้ ({nutrition.meals.length} รายการ)
            </span>
            {nutrition.meals.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                ยังไม่มีรายการอาหารที่บันทึก
              </p>
            ) : (
              <div className="space-y-2">
                {nutrition.meals.map((m) => (
                  <div
                    key={m.id}
                    className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800">{m.name}</span>
                        <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                          {m.type === "breakfast"
                            ? "มื้อเช้า"
                            : m.type === "lunch"
                            ? "กลางวัน"
                            : m.type === "dinner"
                            ? "มื้อเย็น"
                            : "ของว่าง"}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {m.calories} kcal • P: {m.protein}g • C: {m.carbs}g • F: {m.fat}g • {m.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors"
          >
            เรียบร้อย
          </button>
        </div>
      </div>
    </div>
  );
};
