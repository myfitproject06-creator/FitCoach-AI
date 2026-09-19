import React, { useState } from "react";
import {
  MessageSquare,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  User,
  Activity,
  CheckCircle2,
  Lock,
} from "lucide-react";

interface LoginViewProps {
  onLoginSuccess: (user: {
    userId: string;
    displayName: string;
    pictureUrl?: string;
  }) => void;
  onContinueAsGuest: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  onContinueAsGuest,
}) => {
  const [displayName, setDisplayName] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  const handleLineOAuth = () => {
    // Direct browser redirect to backend LINE OAuth 2.1 initiation endpoint
    window.location.href = "/api/auth/line";
  };

  const handleFastDemoLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    setIsConnecting(true);
    setTimeout(() => {
      onLoginSuccess({
        userId: `U_demo_${Date.now().toString().slice(-6)}`,
        displayName: displayName.trim(),
        pictureUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(displayName.trim())}`,
      });
      setIsConnecting(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between selection:bg-[#06C755] selection:text-white font-sans p-4">
      {/* Brand Header */}
      <div className="max-w-md mx-auto w-full pt-8 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#06C755] to-emerald-400 text-slate-950 font-black flex items-center justify-center text-sm shadow-md shadow-[#06C755]/20">
            FC
          </div>
          <div>
            <span className="text-sm font-bold text-white tracking-tight">
              FitCoach AI
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold ml-1.5 px-1.5 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
              LINE ECOSYSTEM
            </span>
          </div>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md mx-auto w-full py-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#06C755]/10 border border-[#06C755]/30 text-emerald-300 text-xs font-semibold">
            <Lock className="w-3 h-3" />
            <span>เข้าสู่ระบบเพื่อเชื่อมต่อข้อมูลสุขภาพและแจ้งเตือน LINE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            เชื่อมต่อกับ FitCoach AI
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
            ให้โค้ชทักเตือนตามตาราง ประเมินความล้า และบันทึกข้อมูลแบบเรียลไทม์
          </p>
        </div>

        {/* Real LINE Login OAuth Button */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <button
            id="line-login-official-btn"
            onClick={handleLineOAuth}
            className="w-full py-3.5 px-4 bg-[#06C755] hover:bg-[#05b34c] text-white font-bold rounded-2xl text-sm transition-all shadow-lg shadow-[#06C755]/25 flex items-center justify-center gap-2.5 active:scale-98 cursor-pointer"
          >
            <MessageSquare className="w-5 h-5 fill-white" />
            <span>เข้าสู่ระบบด้วยบัญชี LINE (LINE Login)</span>
          </button>

          <div className="flex items-center gap-2 my-2">
            <div className="h-[1px] bg-slate-800 flex-1" />
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              หรือเข้าใช้งานทันทีแบบไม่ต้องรอ LINE
            </span>
            <div className="h-[1px] bg-slate-800 flex-1" />
          </div>

          {/* Quick Demo Form */}
          <form onSubmit={handleFastDemoLogin} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                ชื่อที่ต้องการให้โค้ชเรียก (Fast Demo)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="เช่น มาร์ค, แอน, โค้ชบอล..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#06C755] transition-colors"
                />
                <User className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={!displayName.trim() || isConnecting}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold rounded-xl text-xs transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <span>{isConnecting ? "กำลังเตรียมข้อมูล..." : "เข้าสู่ระบบเพื่อทดสอบ (Fast Demo)"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Guest Button */}
          <div className="pt-2 text-center">
            <button
              onClick={onContinueAsGuest}
              className="text-xs text-slate-400 hover:text-slate-200 underline underline-offset-4 transition-colors"
            >
              ข้ามและใช้งานแบบไม่ระบุตัวตน (Guest Mode)
            </button>
          </div>
        </div>

        {/* Benefits List */}
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4 space-y-2 text-xs text-slate-300">
          <div className="flex items-center gap-2 text-slate-400 font-semibold mb-1">
            <ShieldCheck className="w-4 h-4 text-[#06C755]" />
            <span>สิทธิประโยชน์เมื่อเชื่อมต่อ LINE</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>โค้ชทักเตือนซ้อมเวลา 18:00 น. ผ่าน LINE ส่วนตัว</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>ถ่ายรูปอาหารส่งเข้า LINE เพื่อคำนวณแคลอรี่ทันที</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>เข้าถึง LINE Rich Menu แบบ 6 ช่องเต็มฟังก์ชัน</span>
          </div>
        </div>
      </div>

      {/* Footer note */}
      <footer className="max-w-md mx-auto w-full pb-4 text-center text-[11px] text-slate-500">
        FitCoach AI • การเข้าสู่ระบบปลอดภัยด้วยมาตรฐาน OAuth 2.1
      </footer>
    </div>
  );
};
