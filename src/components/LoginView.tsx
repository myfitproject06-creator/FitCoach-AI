// src/components/LoginView.tsx - หน้าจอเลือกวิธีเข้าใช้งานสำหรับผู้ใช้ที่ยังไม่ได้ล็อกอิน
import React from "react";
import { Sparkles, Dumbbell, Utensils, Moon, MessageSquare, ArrowRight, ShieldCheck } from "lucide-react";

interface LoginViewProps {
  onEnterGuest?: () => void;
  loginError?: string | null;
  onClearError?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onEnterGuest, loginError, onClearError }) => {
  const handleLineLogin = () => {
    // นำทางไปสู่ Route เซิร์ฟเวอร์ /auth/line เพื่อเริ่ม LINE Login OAuth 2.1
    window.location.href = "/auth/line";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between relative overflow-hidden">
      {/* Background athletic hero image with dark overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80"
          alt="Athlete training"
          className="w-full h-full object-cover opacity-25 filter brightness-75 contrast-125"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/40" />
      </div>

      {/* Top Bar */}
      <div className="relative z-10 max-w-xl mx-auto w-full px-6 pt-8 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-slate-950 text-sm shadow-md shadow-emerald-500/20">
            FC
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-white block leading-tight">FitCoach AI</span>
            <span className="text-[10px] text-emerald-400 font-medium tracking-wide">Personal Trainer & LINE Bot</span>
          </div>
        </div>
        {onEnterGuest && (
          <button
            onClick={onEnterGuest}
            className="text-xs text-slate-300 hover:text-white bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-full font-medium transition-colors border border-white/10"
          >
            โหมดผู้เยี่ยมชม (Guest)
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 max-w-xl mx-auto w-full px-6 py-8 flex flex-col items-start justify-center space-y-6">
        {/* Error notification banner if redirected back with login_error */}
        {loginError && (
          <div className="w-full bg-rose-500/20 border border-rose-500/40 p-4 rounded-2xl text-xs text-rose-200 flex items-start justify-between gap-2">
            <div>
              <p className="font-bold text-rose-300">เข้าสู่ระบบไม่สำเร็จ</p>
              <p className="mt-0.5 text-rose-200/90">{loginError}</p>
            </div>
            {onClearError && (
              <button
                onClick={onClearError}
                className="text-rose-300 hover:text-white text-sm font-bold px-2 py-0.5"
              >
                ✕
              </button>
            )}
          </div>
        )}

        <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-3.5 py-1.5 rounded-full text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>ระบบเทรนเนอร์ส่วนบุคคลอัจฉริยะ</span>
        </div>

        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight tracking-tight">
            เข้าสู่ระบบ <br />
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              FitCoach AI
            </span>
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed max-w-md mt-2">
            เชื่อมต่อบัญชี LINE เพื่อรับโปรแกรมออกกำลังกาย โภชนาการ และพูดคุยกับโค้ช AI ส่วนตัวได้ตลอด 24 ชั่วโมง
          </p>
        </div>

        {/* Feature Pill Highlights */}
        <div className="grid grid-cols-2 gap-2.5 w-full">
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-2.5">
            <Dumbbell className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-medium text-slate-200">โปรแกรมฝึกส่วนบุคคล</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-2.5">
            <Utensils className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-medium text-slate-200">คำนวณสารอาหารเป้าหมาย</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-2.5">
            <Moon className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-medium text-slate-200">วิเคราะห์คะแนนฟื้นตัว</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-2.5">
            <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-medium text-slate-200">ถามตอบผ่าน LINE Bot</span>
          </div>
        </div>

        {/* Login Selection Actions */}
        <div className="w-full space-y-3 pt-2">
          {/* Main: LINE Login Button */}
          <button
            id="line-login-btn"
            onClick={handleLineLogin}
            className="w-full py-3.5 px-5 bg-[#06C755] hover:bg-[#05b34c] text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-3 shadow-lg shadow-[#06C755]/25 active:scale-[0.98] transition-all cursor-pointer"
          >
            {/* Official LINE icon shape */}
            <svg
              className="w-6 h-6 fill-current shrink-0"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.084.495.235l2.472 3.354V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
            </svg>
            <span className="tracking-wide">เข้าสู่ระบบด้วย LINE</span>
          </button>

          {/* Extensible: Other Login Options (โครงสร้างสำหรับเพิ่มตัวเลือกอื่นในอนาคต) */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-4 text-[11px] text-slate-500 font-medium uppercase tracking-wider">
              หรือเลือกวิธีอื่น
            </span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Google Login Placeholder (เร็วๆ นี้) */}
            <button
              disabled
              className="py-3 px-3.5 bg-slate-900 border border-slate-800 text-slate-400 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 opacity-70 cursor-not-allowed"
              title="จะเปิดให้บริการในเวอร์ชันถัดไป"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Google</span>
              <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded ml-auto">เร็วๆ นี้</span>
            </button>

            {/* Apple Login Placeholder (เร็วๆ นี้) */}
            <button
              disabled
              className="py-3 px-3.5 bg-slate-900 border border-slate-800 text-slate-400 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 opacity-70 cursor-not-allowed"
              title="จะเปิดให้บริการในเวอร์ชันถัดไป"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.38c.66-.82 1.11-1.96.99-3.1-.96.04-2.12.64-2.8 1.44-.6.69-1.12 1.83-1 2.97 1.08.08 2.15-.49 2.81-1.31" />
              </svg>
              <span>Apple</span>
              <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded ml-auto">เร็วๆ นี้</span>
            </button>
          </div>

          {/* Guest Evaluation option */}
          {onEnterGuest && (
            <button
              id="guest-enter-btn"
              onClick={onEnterGuest}
              className="w-full py-3 bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white font-medium rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>ทดลองใช้งานก่อน (โหมดผู้เยี่ยมชมชั่วคราว)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Security & Privacy note */}
        <div className="w-full flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-1">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>ข้อมูลฟิตเนสปลอดภัย ล็อกอินผ่าน LINE Official OAuth 2.1</span>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 max-w-xl mx-auto w-full px-6 pb-6 text-center text-[11px] text-slate-500">
        <p>FitCoach AI • Smart Adaptive Fitness & LINE Coaching Platform</p>
      </div>
    </div>
  );
};
