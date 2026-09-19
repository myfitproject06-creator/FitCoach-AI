import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Send,
  Sparkles,
  Dumbbell,
  Utensils,
  Moon,
  Footprints,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Smile,
  Zap,
} from "lucide-react";
import { LineMessage, UserProfile, WorkoutPlan, NutritionData, RecoveryData } from "../types";

interface LineBotChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: LineMessage[];
  onSendMessage: (text: string) => void;
  profile: UserProfile;
  workout: WorkoutPlan;
  nutrition: NutritionData;
  recovery: RecoveryData;
  onQuickAction?: (action: string) => void;
}

export const LineBotChatModal: React.FC<LineBotChatModalProps> = ({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  profile,
  workout,
  nutrition,
  recovery,
  onQuickAction,
}) => {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText("");
  };

  const quickButtons = [
    { label: "✅ รายงานการซ้อมวันนี้", action: "report_workout" },
    { label: "🍱 แคลอรี่ & โปรตีนวันนี้", action: "check_nutrition" },
    { label: "😴 อาการล้า / นอนน้อย ปรับตารางได้ไหม?", action: "report_fatigue" },
    { label: "🎯 สรุปโปรแกรม 3 เดือนของฉัน", action: "summary_3months" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg h-[92vh] max-h-[750px] rounded-3xl bg-[#7288a2] shadow-2xl border border-slate-700/50 overflow-hidden flex flex-col">
        {/* LINE Chat Header */}
        <div className="bg-[#2c3e50] text-white p-3.5 px-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-[#06C755] flex items-center justify-center font-bold text-white shadow-xs">
                FC
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#06C755] rounded-full border-2 border-[#2c3e50]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-white">FitCoach Official</h3>
                <span className="text-[10px] bg-[#06C755] text-white px-1.5 py-0.2 rounded font-semibold">
                  AI TRAINER
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                พร้อมประกบและตอบคำถาม 24 ชม.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* LINE Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#8ca0b8]">
          {messages.map((msg) => {
            const isUser = msg.sender === "user";
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-full bg-[#06C755] text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    FC
                  </div>
                )}
                <div className="max-w-[78%] flex flex-col">
                  {/* Message Bubble */}
                  <div
                    className={`p-3 rounded-2xl text-xs leading-relaxed shadow-sm relative ${
                      isUser
                        ? "bg-[#8de866] text-slate-900 rounded-tr-none"
                        : "bg-white text-slate-800 rounded-tl-none border border-black/5"
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                  </div>
                  {/* Timestamp */}
                  <span
                    className={`text-[9px] text-white/80 mt-1 px-1 ${
                      isUser ? "text-right" : "text-left"
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="bg-[#f2f4f7] border-t border-slate-200 p-2 overflow-x-auto flex gap-1.5 scrollbar-none">
          {quickButtons.map((btn, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                onSendMessage(btn.label);
                if (onQuickAction) onQuickAction(btn.action);
              }}
              className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-full text-[11px] whitespace-nowrap font-medium transition-colors shadow-2xs shrink-0 active:scale-95"
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <form
          onSubmit={handleSend}
          className="bg-white p-2.5 px-3 flex items-center gap-2 border-t border-slate-200"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="พิมพ์สอบถามโค้ช เช่น 'กินข้าวมันไก่ได้ไหม', 'ล้ามากปรับตาราง'..."
            className="flex-1 bg-slate-100 hover:bg-slate-200/70 focus:bg-white text-xs px-3 py-2 rounded-full border border-slate-200 focus:outline-none focus:border-[#06C755] text-slate-900 transition-colors"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="w-8 h-8 rounded-full bg-[#06C755] hover:bg-[#05b34c] disabled:opacity-40 text-white flex items-center justify-center transition-all shrink-0 active:scale-90"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
