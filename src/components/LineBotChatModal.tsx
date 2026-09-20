import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Send,
  Camera,
  Image as ImageIcon,
  Sparkles,
  Dumbbell,
  Utensils,
  Moon,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Brain,
  CheckCircle2,
} from "lucide-react";
import {
  ChatMessage,
  WorkoutPlan,
  NutritionData,
  FitnessStatus,
  UserProfile,
} from "../types";
import { LineRichMenu } from "./LineRichMenu";
import { CoachMessage } from "./coach/CoachMessage";
import { CoachAction } from "../types";

interface LineBotChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onSendImage?: (file: File) => void;
  workout: WorkoutPlan;
  nutrition: NutritionData;
  status: FitnessStatus;
  profile: UserProfile;
  onOpenWorkout: () => void;
  onOpenNutrition: () => void;
  onOpenRecovery: () => void;
  onOpenAdapt: () => void;
  onOpenTrainerMemory?: () => void;
  onOpenRichMenuStudio?: () => void;
}

export const LineBotChatModal: React.FC<LineBotChatModalProps> = ({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  onSendImage,
  workout,
  nutrition,
  status,
  profile,
  onOpenWorkout,
  onOpenNutrition,
  onOpenRecovery,
  onOpenAdapt,
  onOpenTrainerMemory,
  onOpenRichMenuStudio,
}) => {
  const [inputText, setInputText] = useState("");
  const [isRichMenuOpen, setIsRichMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  // Find the latest bot message with quick replies, or provide smart context-aware suggestions
  const latestBotMsg = [...messages].reverse().find(
    (m) => m.sender === "bot" && m.quickReplies && m.quickReplies.length > 0
  );

  const activeQuickReplies =
    latestBotMsg?.quickReplies && latestBotMsg.quickReplies.length > 0
      ? latestBotMsg.quickReplies
      : [
          "🏋️‍♂️ เริ่มซ้อม Live PT",
          "🧠 สมุดความจำโค้ช",
          "🥗 บันทึกมื้ออาหาร",
          "⏱️ ปรับโปรแกรมด่วน",
          "💤 ดูการนอนหลับ",
        ];

  const handleQuickReplyClick = (reply: string) => {
    if (
      (reply.includes("ความจำ") || reply.includes("สมุด") || reply.includes("บาดเจ็บ") || reply.includes("ข้อจำกัด")) &&
      onOpenTrainerMemory
    ) {
      onSendMessage(reply);
      setTimeout(() => {
        onOpenTrainerMemory();
      }, 250);
      return;
    }
    if (reply.includes("Live PT") || reply.includes("เริ่มซ้อม")) {
      onSendMessage(reply);
      setTimeout(() => {
        onOpenWorkout();
      }, 250);
      return;
    }
    if (reply.includes("ปรับโปรแกรม") || reply.includes("เวลาน้อย")) {
      onSendMessage(reply);
      setTimeout(() => {
        onOpenAdapt();
      }, 250);
      return;
    }
    onSendMessage(reply);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onSendImage) {
      onSendImage(e.target.files[0]);
    }
  };

  const handleCoachAction = (action: CoachAction) => {
    switch (action.actionType) {
      case "start_workout":
      case "view_plan":
      case "apply_program":
        onOpenWorkout();
        break;
      case "log_food":
        onOpenNutrition();
        break;
      case "cannot_do":
        onOpenAdapt();
        break;
      case "snooze":
        onSendMessage("ขอเลื่อนการออกกำลังกายออกไปก่อนครับ");
        break;
      case "clear_penalty":
        onSendMessage("ผมทำภารกิจชดเชยเรียบร้อยแล้วครับ");
        break;
      case "confirm":
        onSendMessage("ยืนยันครับ");
        break;
      case "edit":
        onSendMessage("ขอแก้ไขข้อมูลนี้ครับ");
        break;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md h-[95vh] sm:h-[650px] rounded-3xl bg-[#849EB9] shadow-2xl border border-slate-700 overflow-hidden flex flex-col">
        {/* LINE Chat Header */}
        <div className="bg-[#243447] text-white px-4 py-3 flex items-center justify-between shadow-xs z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-emerald-500 p-0.5 overflow-hidden ring-2 ring-[#06C755]/50">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                  alt="Coach Avatar"
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#06C755] rounded-full border-2 border-[#243447]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-white">FitCoach AI</h3>
                <span className="text-[10px] bg-[#06C755] text-white px-1.5 py-0.2 rounded font-semibold flex items-center gap-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  OFFICIAL
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                {profile.trainerNotes || (profile.injuries && profile.injuries.length > 0)
                  ? "🧠 จดจำจุดระวังและข้อจำกัดของคุณแล้ว"
                  : "โค้ชส่วนตัว • โภชนาการและการออกกำลังกาย"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onOpenTrainerMemory && (
              <button
                id="line-header-trainer-memory-btn"
                onClick={onOpenTrainerMemory}
                title="สมุดบันทึกความจำของโค้ช (Trainer's Memory)"
                className="w-8 h-8 rounded-full bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-indigo-400/30"
              >
                <Brain className="w-4 h-4" />
              </button>
            )}
            {onOpenRichMenuStudio && (
              <button
                onClick={onOpenRichMenuStudio}
                title="แก้ไข Rich Menu ใน Studio"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-emerald-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-[#7289A0]/20 scroll-smooth">
          {/* Chat start greeting */}
          <div className="text-center my-2">
            <span className="text-[10px] bg-black/20 text-white px-3 py-1 rounded-full">
              {new Intl.DateTimeFormat("th-TH", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              }).format(new Date())}
            </span>
          </div>

          {messages.map((msg) => {
            const isUser = msg.sender === "user";
            return (
              <div
                key={msg.id}
                className={`flex gap-2 items-end ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mb-1 shadow-xs">
                    AI
                  </div>
                )}
                <div
                  className={`max-w-[78%] rounded-2xl p-3 text-xs leading-relaxed shadow-xs ${
                    isUser
                      ? "bg-[#06C755] text-white rounded-br-xs"
                      : "bg-white text-slate-800 rounded-bl-xs"
                  }`}
                >
                  {/* Attached photo preview if any */}
                  {msg.image && (
                    <img
                      src={msg.image}
                      alt="Attached"
                      className="rounded-xl mb-2 max-h-48 w-full object-cover"
                    />
                  )}
                  {isUser ? (
                    <>
                      <p className="whitespace-pre-line">{msg.text}</p>
                      <span className="text-[9px] block text-right mt-1 text-emerald-100">
                        {msg.timestamp}
                      </span>
                    </>
                  ) : (
                    <CoachMessage
                      response={msg.coachResponse}
                      fallbackText={msg.text}
                      timestamp={msg.timestamp}
                      onAction={handleCoachAction}
                    />
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Floating Quick Replies Bar (ข้อความสำเร็จรูปที่ลอยอยู่ด้านล่าง แบบ LINE แท้) */}
        {activeQuickReplies && activeQuickReplies.length > 0 && (
          <div className="bg-gradient-to-t from-slate-900/50 via-slate-900/20 to-transparent pt-1.5 pb-1 px-3 shrink-0">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 scroll-smooth">
              <span className="text-[10px] font-bold text-white/90 whitespace-nowrap shrink-0 flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3 text-[#06C755]" />
                <span>คำตอบด่วน:</span>
              </span>
              {activeQuickReplies.map((reply, idx) => (
                <button
                  key={`${reply}-${idx}`}
                  onClick={() => handleQuickReplyClick(reply)}
                  className="bg-white hover:bg-emerald-50 text-slate-800 hover:text-[#06C755] border border-[#06C755]/40 hover:border-[#06C755] px-3.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap shadow-md transition-all active:scale-95 cursor-pointer shrink-0 flex items-center gap-1"
                >
                  <span>{reply}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar */}
        <form
          onSubmit={handleSend}
          className="bg-white p-2.5 flex items-center gap-2 border-t border-slate-200 shrink-0"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="ส่งรูปอาหารหรืออุปกรณ์"
            className="p-2 text-slate-500 hover:text-[#06C755] hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <Camera className="w-5 h-5" />
          </button>

          <input
            type="text"
            placeholder="พิมพ์ข้อความคุยกับโค้ช..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-slate-100 text-slate-800 text-xs py-2 px-3 rounded-full focus:outline-none focus:ring-2 focus:ring-[#06C755]"
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2 bg-[#06C755] hover:bg-[#05b34c] disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full transition-colors shadow-xs cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {/* Realistic LINE Rich Menu Component (When opened) */}
        {isRichMenuOpen && (
          <div className="shrink-0 animate-in slide-in-from-bottom-2 duration-200">
            <LineRichMenu
              onSelectAction={(actionKey) => {
                if (actionKey === "workout") {
                  onSendMessage("ขอเริ่มดูโปรแกรมออกกำลังกายวันนี้");
                  onOpenWorkout();
                } else if (actionKey === "nutrition") {
                  onSendMessage("ขอเปิดบันทึกโภชนาการและแคลอรี่");
                  onOpenNutrition();
                } else if (actionKey === "trainer_memory") {
                  onSendMessage("ขอดูสมุดบันทึกความจำของโค้ชและข้อจำกัดร่างกาย");
                  if (onOpenTrainerMemory) {
                    onOpenTrainerMemory();
                  }
                } else if (actionKey === "recovery") {
                  onSendMessage("ขอดูรายงานการนอนหลับและการฟื้นตัว");
                  onOpenRecovery();
                } else if (actionKey === "status") {
                  onSendMessage("ขอดูระดับเรดาร์สมรรถภาพของผมตอนนี้");
                } else if (actionKey === "adapt") {
                  onSendMessage("วันนี้รู้สึกเพลีย อยากขอปรับโปรแกรมด่วนครับ");
                  onOpenAdapt();
                }
              }}
            />
          </div>
        )}

        {/* Real LINE Rich Menu Toggle Bar (At bottom of Chat) */}
        <div className="bg-[#1E293B] px-3 py-1 flex items-center justify-center text-[11px] text-slate-300 border-t border-slate-800 select-none shrink-0">
          <button
            id="line-rich-menu-toggle-btn"
            onClick={() => setIsRichMenuOpen(!isRichMenuOpen)}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-[#06C755] font-bold py-1 px-4 rounded-full transition-colors cursor-pointer"
          >
            {isRichMenuOpen ? (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-[#06C755]" />
                <span>ซ่อนเมนู (Close Menu)</span>
              </>
            ) : (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-[#06C755]" />
                <span>เมนู (Rich Menu)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
