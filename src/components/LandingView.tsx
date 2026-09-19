import React from "react";
import { Sparkles, ArrowRight, ShieldCheck, Dumbbell, Utensils, Moon, MessageSquare } from "lucide-react";

interface LandingViewProps {
  onStart: () => void;
  onEnterDemo: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onStart, onEnterDemo }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between relative overflow-hidden">
      {/* Background athletic hero image with dark gradient overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80"
          alt="Athlete training"
          className="w-full h-full object-cover opacity-35 filter brightness-75 contrast-125"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/40" />
      </div>

      {/* Top Bar */}
      <div className="relative z-10 max-w-xl mx-auto w-full px-6 pt-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-slate-950 text-xs">
            FC
          </div>
          <span className="font-bold text-sm tracking-tight text-white">FitCoach AI</span>
        </div>
        <button
          onClick={onEnterDemo}
          className="text-xs text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 px-3.5 py-1.5 rounded-full font-medium transition-colors"
        >
          เข้าสู่แดชบอร์ด
        </button>
      </div>

      {/* Hero Core Content */}
      <div className="relative z-10 max-w-xl mx-auto w-full px-6 py-12 flex flex-col items-start justify-center space-y-5">
        <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-3 py-1 rounded-full text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Personal Trainer Platform</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight tracking-tight">
          Your Better Self <br />
          Is a Plan Away
        </h1>

        <p className="text-sm text-slate-300 leading-relaxed max-w-md">
          โค้ชฟิตเนส AI ส่วนตัวที่ออกแบบโปรแกรมออกกำลังกาย โภชนาการ และการนอนหลับ พร้อมติดตามคุณทุกวันผ่าน LINE อย่างใกล้ชิด
        </p>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-2 gap-2.5 w-full pt-2">
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-2.5">
            <Dumbbell className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-medium text-slate-200">โปรแกรมฝึกส่วนบุคคล</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-2.5">
            <Utensils className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-medium text-slate-200">คำนวณแคลอรี่และสารอาหาร</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-2.5">
            <Moon className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-medium text-slate-200">วิเคราะห์การฟื้นตัว</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-2.5">
            <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-medium text-slate-200">แจ้งเตือนผ่าน LINE</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-2.5 pt-4">
          <button
            id="start-onboarding-btn"
            onClick={onStart}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-98 transition-all"
          >
            <span>เริ่มต้นประเมินร่างกาย</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            id="open-dashboard-direct-btn"
            onClick={onEnterDemo}
            className="w-full py-3 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-2xl text-xs flex items-center justify-center transition-colors"
          >
            เข้าสู่แดชบอร์ดทันที
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="relative z-10 max-w-xl mx-auto w-full px-6 pb-6 text-center text-[11px] text-slate-500">
        <p>FitCoach AI • Simple, Clean, Modern, Personal Health Platform</p>
      </div>
    </div>
  );
};
