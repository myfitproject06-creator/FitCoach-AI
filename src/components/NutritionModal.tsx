import React, { useState } from "react";
import {
  X,
  Plus,
  Sparkles,
  Utensils,
  Clock,
  Trash2,
  CheckCircle2,
  Info,
} from "lucide-react";
import { NutritionData, MealItem } from "../types";

interface NutritionModalProps {
  nutrition: NutritionData;
  onClose: () => void;
  onAddMeal: (meal: MealItem) => void;
  onRemoveMeal: (mealId: string) => void;
}

export const NutritionModal: React.FC<NutritionModalProps> = ({
  nutrition,
  onClose,
  onAddMeal,
  onRemoveMeal,
}) => {
  const [foodText, setFoodText] = useState("");
  const [loading, setLoading] = useState(false);
  const [recentTip, setRecentTip] = useState<string | null>(null);

  const quickFoods = [
    "ข้าวกะเพราอกไก่ + ไข่ดาว",
    "ข้าวมันไก่ตอน (ไม่เอาหนัง)",
    "สลัดอกไก่ย่าง",
    "เวย์โปรตีน 1 สกู๊ป",
    "ก๋วยเตี๋ยวไก่ฉีกน้ำใส",
  ];

  const handleEstimateAndAdd = async (textToAdd?: string) => {
    const input = textToAdd || foodText;
    if (!input.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/ai/estimate-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foodDescription: input }),
      });

      if (res.ok) {
        const data = await res.json();
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(
          now.getMinutes()
        ).padStart(2, "0")}`;

        const newMeal: MealItem = {
          id: `m-${Date.now()}`,
          name: data.name || input,
          portion: data.portion || "1 จาน",
          calories: Number(data.calories) || 550,
          protein: Number(data.protein) || 28,
          carbs: Number(data.carbs) || 60,
          fat: Number(data.fat) || 18,
          time: timeStr,
          isEstimate: true,
          tip: data.tip,
        };

        onAddMeal(newMeal);
        setRecentTip(data.tip || "บันทึกข้อมูลโภชนาการเรียบร้อยครับ");
        setFoodText("");
      }
    } catch {
      // Fallback meal item
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes()
      ).padStart(2, "0")}`;
      const newMeal: MealItem = {
        id: `m-${Date.now()}`,
        name: input,
        portion: "1 จาน",
        calories: 550,
        protein: 30,
        carbs: 65,
        fat: 18,
        time: timeStr,
        isEstimate: true,
        tip: "มื้ออาหารช่วยฟื้นฟูกล้ามเนื้อและให้พลังงานคงที่ครับ",
      };
      onAddMeal(newMeal);
      setFoodText("");
    } finally {
      setLoading(false);
    }
  };

  const remainingKcal = Math.max(0, nutrition.targetCalories - nutrition.currentCalories);
  const kcalPercent = Math.min(100, Math.round((nutrition.currentCalories / nutrition.targetCalories) * 100));

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Utensils className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm">โภชนาการวันนี้ (Nutrition & Macros)</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* Calorie Progress Ring / Summary */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#E2E8F0"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#10B981"
                  strokeWidth="8"
                  strokeDasharray={`${kcalPercent * 2.51} 251`}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-base font-black text-slate-900">
                  {nutrition.currentCalories.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">
                  kcal
                </span>
              </div>
            </div>

            <div className="flex-1 w-full space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">เป้าหมายรายวัน:</span>
                <span className="font-bold text-slate-800">
                  {nutrition.targetCalories.toLocaleString()} kcal
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">พลังงานคงเหลือ:</span>
                <span className="font-bold text-emerald-600">
                  {remainingKcal.toLocaleString()} kcal
                </span>
              </div>

              {/* Macro Bars */}
              <div className="space-y-1.5 pt-1">
                {/* Protein */}
                <div>
                  <div className="flex justify-between text-[11px] text-slate-600 font-medium mb-0.5">
                    <span>โปรตีน (Protein)</span>
                    <span><strong>{nutrition.currentProtein}</strong> / {nutrition.targetProtein}g</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${Math.min(100, (nutrition.currentProtein / nutrition.targetProtein) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Carbs */}
                <div>
                  <div className="flex justify-between text-[11px] text-slate-600 font-medium mb-0.5">
                    <span>คาร์โบไฮเดรต (Carbs)</span>
                    <span><strong>{nutrition.currentCarbs}</strong> / {nutrition.targetCarbs}g</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full"
                      style={{ width: `${Math.min(100, (nutrition.currentCarbs / nutrition.targetCarbs) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Fat */}
                <div>
                  <div className="flex justify-between text-[11px] text-slate-600 font-medium mb-0.5">
                    <span>ไขมัน (Fat)</span>
                    <span><strong>{nutrition.currentFat}</strong> / {nutrition.targetFat}g</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-rose-400 h-full rounded-full"
                      style={{ width: `${Math.min(100, (nutrition.currentFat / nutrition.targetFat) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Food Logger (Natural Language) */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                บันทึกอาหารด้วยภาษาธรรมชาติ (AI Estimator)
              </span>
              <span className="text-[10px] text-slate-400">คำนวณสารอาหารทันที</span>
            </div>

            <div className="flex gap-2">
              <input
                id="food-input-text"
                type="text"
                value={foodText}
                onChange={(e) => setFoodText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleEstimateAndAdd()}
                placeholder="เช่น ข้าวมันไก่ตอน 1 จาน หรือ สลัดอกไก่..."
                className="flex-1 text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <button
                id="add-food-btn"
                onClick={() => handleEstimateAndAdd()}
                disabled={loading || !foodText.trim()}
                className="px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1 shrink-0"
              >
                {loading ? "กำลังคำนวณ..." : "บันทึก"}
              </button>
            </div>

            {/* Quick Food Presets */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {quickFoods.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleEstimateAndAdd(q)}
                  className="text-[10px] px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-600 rounded-full font-medium whitespace-nowrap transition-colors border border-slate-200/80"
                >
                  + {q}
                </button>
              ))}
            </div>

            {recentTip && (
              <div className="p-2.5 bg-emerald-50 text-emerald-900 rounded-xl text-xs flex items-start gap-2 border border-emerald-200/70">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <p className="leading-snug">{recentTip}</p>
              </div>
            )}
          </div>

          {/* Meals Logged List */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              มื้ออาหารที่บันทึกแล้ววันนี้ ({nutrition.meals.length} รายการ)
            </h4>

            {nutrition.meals.map((meal) => (
              <div
                key={meal.id}
                className="p-3 bg-white rounded-xl border border-slate-200 flex items-start justify-between gap-3 shadow-xs"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{meal.name}</span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                      <Clock className="w-3 h-3" /> {meal.time}
                    </span>
                    {meal.isEstimate && (
                      <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                        ประมาณการ AI
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="font-semibold text-slate-700">{meal.calories} kcal</span>
                    <span>โปรตีน: {meal.protein}g</span>
                    <span>คาร์บ: {meal.carbs}g</span>
                    <span>ไขมัน: {meal.fat}g</span>
                  </div>
                  {meal.tip && (
                    <p className="text-[10px] text-slate-400 mt-1 italic">
                      "{meal.tip}"
                    </p>
                  )}
                </div>

                <button
                  onClick={() => onRemoveMeal(meal.id)}
                  className="text-slate-300 hover:text-rose-500 p-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
