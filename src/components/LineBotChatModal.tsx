import React, { useState, useRef, useEffect } from "react";
import Markdown from "react-markdown";
import {
  X,
  Send,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  ChevronLeft,
  SlidersHorizontal,
  Calendar,
  Utensils,
  Moon,
  Flame,
  Dumbbell,
  Layers,
} from "lucide-react";
import { LineMessage, WorkoutPlan, Plan3MonthsData } from "../types";

interface LineBotChatModalProps {
  messages: LineMessage[];
  workout: WorkoutPlan;
  onClose: () => void;
  onSendMessage: (text: string) => void;
  onStartWorkout: () => void;
  onSnoozeWorkout: () => void;
  onOpenAdapt: () => void;
  onApplyProgram?: (plan: WorkoutPlan, goalTitle?: string, plan3Months?: Plan3MonthsData) => void;
}

export const LineBotChatModal: React.FC<LineBotChatModalProps> = ({
  messages,
  workout,
  onClose,
  onSendMessage,
  onStartWorkout,
  onSnoozeWorkout,
  onOpenAdapt,
  onApplyProgram,
}) => {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [activePlanTab, setActivePlanTab] = useState<"roadmap" | "daily" | "meals" | "recovery">("roadmap");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = () => {
    if (!inputText.trim() || loading) return;
    const text = inputText;
    setInputText("");
    onSendMessage(text);
  };

  const lastMessage = messages[messages.length - 1];
  const quickReplies =
    lastMessage?.quickReplies && lastMessage.quickReplies.length > 0
      ? lastMessage.quickReplies.map((label) => ({
          label,
          action: () => {
            if (
              (label.includes("นำโปรแกรม") || label.includes("นำแผน")) &&
              lastMessage.card?.workoutPlan &&
              onApplyProgram
            ) {
              onApplyProgram(
                lastMessage.card.workoutPlan,
                lastMessage.card.title,
                lastMessage.card.plan3Months
              );
            } else if (label.includes("เริ่ม Workout") || label === "เริ่มเลย 💪") {
              onStartWorkout();
            } else if (label.includes("เลื่อน 30 นาที")) {
              onSnoozeWorkout();
            } else if (label.includes("เหนื่อย") || label.includes("ไม่ไหว") || label.includes("ปรับตาราง")) {
              onOpenAdapt();
            } else {
              onSendMessage(label);
            }
          },
        }))
      : [
          {
            label: "จัดแผน 3 เดือนหุ่น Tom Holland 🕷️",
            action: () =>
              onSendMessage(
                "เป้าหมายของผมคือหุ่นแบบ Tom Holland อยากรู้ว่าต้องใช้เวลากี่เดือน และแต่ละวันต้องทำอะไรบ้าง รวมไปถึงข้อมูลโภชนาการต่างๆ ที่ต้องเตรียมในทุกๆ วัน และการพักผ่อน สมมุติว่าจัดออกมาเป็นแผน 3 เดือนครับ"
              ),
          },
          { label: "เริ่มเลย 💪", action: () => onStartWorkout() },
          { label: "เลื่อน 30 นาที ⏰", action: () => onSnoozeWorkout() },
          { label: "วันนี้เหนื่อยมาก 😴", action: () => onOpenAdapt() },
        ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-[#8C9DAE] w-full max-w-md rounded-t-3xl sm:rounded-3xl h-[94vh] sm:h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300">
        {/* LINE Chat Header */}
        <div className="p-3 bg-[#243447] text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded-full transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>

            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-white text-xs border border-white/20">
                FC
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#06C755] rounded-full border border-white flex items-center justify-center text-[7px] text-white font-bold">
                ✓
              </span>
            </div>

            <div>
              <div className="flex items-center gap-1">
                <h3 className="text-xs font-bold tracking-tight">FitCoach AI</h3>
                <span className="text-[9px] bg-[#06C755] text-white px-1 rounded font-semibold">
                  Official
                </span>
              </div>
              <p className="text-[10px] text-slate-300">เทรนเนอร์ส่วนตัวออนไลน์ • ตอบกลับทันที</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* LINE Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#849EB5]">
          <div className="text-center my-2">
            <span className="text-[10px] bg-black/20 text-white px-2.5 py-0.5 rounded-full font-medium">
              วันนี้ 18 มิ.ย.
            </span>
          </div>

          {messages.map((msg) => {
            const isCoach = msg.sender === "coach";
            return (
              <div
                key={msg.id}
                className={`flex gap-2 ${isCoach ? "justify-start" : "justify-end"}`}
              >
                {isCoach && (
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 self-start shadow-xs">
                    FC
                  </div>
                )}

                <div className="max-w-[78%] space-y-2">
                  {/* Chat bubble text */}
                  <div
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                      isCoach
                        ? "bg-white text-slate-800 rounded-tl-xs border border-slate-100/90"
                        : "bg-[#06C755] text-white rounded-tr-xs font-medium whitespace-pre-line"
                    }`}
                  >
                    {isCoach ? (
                      <div className="space-y-2 [&_h1]:text-sm [&_h1]:font-bold [&_h2]:text-xs [&_h2]:font-bold [&_h3]:text-xs [&_h3]:font-bold [&_ul]:list-disc [&_ul]:pl-4 [&_li]:my-1 [&_strong]:text-slate-900 [&_hr]:my-2 [&_hr]:border-slate-100">
                        <Markdown>{msg.text}</Markdown>
                      </div>
                    ) : (
                      msg.text
                    )}
                  </div>

                  {/* Rich Card (Workout Reminder or 3-Month Plan / New Program) if attached */}
                  {msg.card && (
                    <div className="bg-white rounded-2xl p-3.5 shadow-md border border-slate-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                            msg.card.type === "new_program"
                              ? "text-emerald-600"
                              : "text-orange-600"
                          }`}
                        >
                          {msg.card.type === "new_program" ? (
                            <>
                              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                              {msg.card.plan3Months?.totalDuration
                                ? `${msg.card.plan3Months.totalDuration.toUpperCase()} PLAN`
                                : "TRANSFORMATION PLAN"}
                            </>
                          ) : (
                            "WORKOUT REMINDER"
                          )}
                        </span>
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
                          {msg.card.duration || "3 เดือน"}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          {msg.card.title}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {msg.card.details}
                        </p>
                      </div>

                      {/* Tag badges */}
                      {msg.card.tags && (
                        <div className="flex flex-wrap gap-1">
                          {msg.card.tags.map((t, idx) => (
                            <span
                              key={idx}
                              className="text-[9px] px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-100"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Interactive 3-Month Plan Tabs if plan3Months exists */}
                      {msg.card.plan3Months && (
                        <div className="space-y-2 pt-1 border-t border-slate-100">
                          {/* Tabs header */}
                          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100/80 rounded-xl text-[10px] font-semibold">
                            <button
                              type="button"
                              onClick={() => setActivePlanTab("roadmap")}
                              className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
                                activePlanTab === "roadmap"
                                  ? "bg-white text-emerald-700 shadow-xs"
                                  : "text-slate-600 hover:text-slate-900"
                              }`}
                            >
                              <Layers className="w-3 h-3" />
                              <span>Roadmap</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setActivePlanTab("daily")}
                              className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
                                activePlanTab === "daily"
                                  ? "bg-white text-emerald-700 shadow-xs"
                                  : "text-slate-600 hover:text-slate-900"
                              }`}
                            >
                              <Calendar className="w-3 h-3" />
                              <span>7 วัน</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setActivePlanTab("meals")}
                              className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
                                activePlanTab === "meals"
                                  ? "bg-white text-emerald-700 shadow-xs"
                                  : "text-slate-600 hover:text-slate-900"
                              }`}
                            >
                              <Utensils className="w-3 h-3" />
                              <span>อาหาร</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setActivePlanTab("recovery")}
                              className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
                                activePlanTab === "recovery"
                                  ? "bg-white text-emerald-700 shadow-xs"
                                  : "text-slate-600 hover:text-slate-900"
                              }`}
                            >
                              <Moon className="w-3 h-3" />
                              <span>พักผ่อน</span>
                            </button>
                          </div>

                          {/* Tab: Roadmap 3 เดือน */}
                          {activePlanTab === "roadmap" && (
                            <div className="space-y-2 animate-in fade-in duration-200">
                              {msg.card.plan3Months.phases.map((phase) => (
                                <div
                                  key={phase.month}
                                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                                      <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-bold">
                                        {phase.month}
                                      </span>
                                      {phase.title}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-600 pl-5.5">
                                    {phase.focus}
                                  </p>
                                  <div className="flex gap-2 pl-5.5 pt-0.5">
                                    <span className="text-[9px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                                      🔥 {phase.calories}
                                    </span>
                                    <span className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                                      🥩 โปรตีน {phase.protein}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Tab: Daily Schedule 7 วัน */}
                          {activePlanTab === "daily" && (
                            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 animate-in fade-in duration-200">
                              {msg.card.plan3Months.weeklySchedule.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-[10px]"
                                >
                                  <div className="min-w-0 pr-1.5">
                                    <div className="font-bold text-slate-800">
                                      {item.day}
                                    </div>
                                    <div className="text-slate-600 truncate text-[9px]">
                                      {item.activity}
                                    </div>
                                  </div>
                                  <span
                                    className={`shrink-0 text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                                      item.type === "workout"
                                        ? "bg-emerald-100 text-emerald-700"
                                        : item.type === "cardio"
                                        ? "bg-amber-100 text-amber-700"
                                        : "bg-slate-200 text-slate-600"
                                    }`}
                                  >
                                    {item.type === "workout"
                                      ? "เวทเทรนนิ่ง"
                                      : item.type === "cardio"
                                      ? "เบิร์นไขมัน"
                                      : "พักผ่อน"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Tab: Daily Meals ข้อมูลอาหารรายวัน */}
                          {activePlanTab === "meals" && (
                            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 animate-in fade-in duration-200">
                              {msg.card.plan3Months.dailyMeals.map((meal, idx) => (
                                <div
                                  key={idx}
                                  className="p-2 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-[10px]"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-slate-800">
                                      {meal.meal}{" "}
                                      <span className="font-normal text-slate-400 text-[9px]">
                                        ({meal.time})
                                      </span>
                                    </span>
                                    <div className="flex gap-1">
                                      <span className="text-[8px] bg-blue-50 text-blue-700 px-1 py-0.2 rounded font-semibold">
                                        โปรตีน {meal.protein}
                                      </span>
                                      <span className="text-[8px] bg-amber-50 text-amber-700 px-1 py-0.2 rounded font-semibold">
                                        {meal.calories}
                                      </span>
                                    </div>
                                  </div>
                                  <p className="text-[9px] text-slate-600">
                                    {meal.menu}
                                  </p>
                                </div>
                              ))}
                              <div className="p-1.5 bg-blue-50/70 border border-blue-100 rounded-lg text-[9px] text-blue-800 flex items-center gap-1.5">
                                <span className="font-bold">💧 น้ำดื่ม:</span> 2.5 - 3 ลิตรต่อวัน จิบสม่ำเสมอเพื่อฟื้นฟูกล้ามเนื้อ
                              </div>
                            </div>
                          )}

                          {/* Tab: Recovery การพักผ่อน */}
                          {activePlanTab === "recovery" && (
                            <div className="space-y-1.5 animate-in fade-in duration-200">
                              {msg.card.plan3Months.recoveryRules.map((rule, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-start gap-2 p-2 rounded-xl bg-indigo-50/60 border border-indigo-100 text-[10px] text-indigo-900"
                                >
                                  <Moon className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                                  <span>{rule}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Exercises preview if attached in workoutPlan */}
                      {msg.card.workoutPlan?.exercises && msg.card.workoutPlan.exercises.length > 0 && (
                        <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 space-y-1.5">
                          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                            <span>ท่าฝึกเซสชันนี้ ({msg.card.workoutPlan.exercises.length} ท่า):</span>
                            <span className="text-[9px] text-emerald-700 font-bold">
                              {msg.card.workoutPlan.split}
                            </span>
                          </div>
                          {msg.card.workoutPlan.exercises.map((ex, i) => (
                            <div
                              key={ex.id || i}
                              className="flex items-center justify-between py-1 border-b border-slate-100 last:border-b-0 text-[11px]"
                            >
                              <div className="font-medium text-slate-800 flex items-center gap-1.5 min-w-0 pr-1">
                                <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[9px] font-bold shrink-0">
                                  {i + 1}
                                </span>
                                <span className="truncate">{ex.nameTh || ex.name}</span>
                              </div>
                              <span className="text-slate-500 font-semibold text-[10px] shrink-0">
                                {ex.sets} เซ็ต x {ex.reps}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Interactive Buttons */}
                      <div className="space-y-1.5 pt-1">
                        {msg.card.type === "new_program" && msg.card.workoutPlan ? (
                          <button
                            onClick={() => {
                              if (msg.card?.workoutPlan && onApplyProgram) {
                                onApplyProgram(
                                  msg.card.workoutPlan,
                                  msg.card.title,
                                  msg.card.plan3Months
                                );
                              } else {
                                onStartWorkout();
                              }
                            }}
                            className="w-full py-2.5 bg-[#06C755] hover:bg-[#05b34c] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-[0.98]"
                          >
                            <span>
                              {msg.card.plan3Months
                                ? `🎯 นำแผน ${msg.card.plan3Months.totalDuration || "นี้"} ไปใช้ในแอป & เริ่มฝึกทันที 💪`
                                : "🎯 นำโปรแกรมไปใช้ในแอป & เริ่มฝึกทันที 💪"}
                            </span>
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={onStartWorkout}
                              className="w-full py-2 bg-[#06C755] hover:bg-[#05b34c] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                            >
                              <span>เริ่มออกกำลังกายเลย 💪</span>
                            </button>
                            <div className="flex gap-1.5">
                              <button
                                onClick={onSnoozeWorkout}
                                className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-semibold transition-colors"
                              >
                                เลื่อน 30 นาที ⏰
                              </button>
                              <button
                                onClick={onOpenAdapt}
                                className="flex-1 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-[11px] font-semibold transition-colors"
                              >
                                วันนี้ไม่ไหว 😴
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  <span
                    className={`text-[9px] text-slate-600 block ${
                      isCoach ? "text-left" : "text-right"
                    }`}
                  >
                    {msg.timestamp} น. {isCoach ? "" : "อ่านแล้ว"}
                  </span>
                </div>
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Reply Pills */}
        <div className="p-2 bg-[#F6F7F9] border-t border-slate-200 flex gap-1.5 overflow-x-auto scrollbar-none">
          {quickReplies.map((qr, idx) => (
            <button
              key={idx}
              onClick={qr.action}
              className="text-[11px] bg-white hover:bg-[#06C755] hover:text-white text-slate-700 px-3 py-1 rounded-full font-medium shadow-xs border border-slate-200 whitespace-nowrap transition-colors"
            >
              {qr.label}
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <div className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="พิมพ์คุยกับ FitCoach..."
            className="flex-1 text-xs px-3.5 py-2.5 rounded-full bg-slate-100 focus:bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#06C755]"
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="w-9 h-9 rounded-full bg-[#06C755] hover:bg-[#05b34c] text-white flex items-center justify-center transition-all disabled:opacity-40 active:scale-95 shrink-0"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
