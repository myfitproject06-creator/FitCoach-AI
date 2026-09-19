import React from "react";
import {
  Sparkles,
  Dumbbell,
  Utensils,
  Moon,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Activity,
  Award,
  Calendar,
  Smartphone,
  Flame,
  ArrowRight,
} from "lucide-react";

interface LandingViewProps {
  onStartOnboarding?: () => void;
  onStartApp?: () => void;
  onLoginClick?: () => void;
  onOpenLogin?: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onStartOnboarding,
  onStartApp,
  onLoginClick,
  onOpenLogin,
}) => {
  const handleStart = onStartOnboarding || onStartApp || (() => {});
  const handleLogin = onLoginClick || onOpenLogin;
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between selection:bg-emerald-500 selection:text-slate-950 font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black flex items-center justify-center text-sm shadow-md shadow-emerald-500/20">
              FC
            </div>
            <div>
              <span className="text-sm font-bold text-white tracking-tight">
                FitCoach AI
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold ml-1.5 px-1.5 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                PRO ACTIVE
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {handleLogin && (
              <button
                onClick={handleLogin}
                className="px-3.5 py-1.5 bg-[#06C755] hover:bg-[#05b34c] text-white rounded-full text-xs font-bold transition-all shadow-sm shadow-[#06C755]/20 flex items-center gap-1.5"
              >
                <span>เข้าสู่ระบบด้วย LINE</span>
              </button>
            )}
            <button
              onClick={handleStart}
              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-full text-xs transition-all shadow-md active:scale-95"
            >
              เริ่มต้นประเมินฟรี
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-4xl mx-auto px-4 py-10 sm:py-16 space-y-12">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ระบบเทรนเนอร์ส่วนตัว AI ผ่าน LINE + PWA แบบ Proactive</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            เปลี่ยนคุณเป็นคนใหม่ <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              มีโค้ชประกบคอยทวง คอยนำทาง 24 ชม.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl mx-auto">
            ออกแบบโปรแกรม 3 เดือนเจาะลึกเฉพาะคุณ จัดตารางเวทเทรนนิ่ง คำนวณอาหารตามงบ และส่งแจ้งเตือนผ่าน LINE ตรงเวลา พร้อมปรับตารางตามการนอนและก้าวเดินอัตโนมัติ
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleStart}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black rounded-2xl text-sm transition-all shadow-lg shadow-emerald-500/25 active:scale-95 flex items-center justify-center gap-2"
            >
              <span>เริ่มออกแบบโปรแกรมฟรี (ใช้เวลา 2 นาที)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            {onLoginClick && (
              <button
                onClick={onLoginClick}
                className="w-full sm:w-auto px-6 py-3.5 bg-[#06C755] hover:bg-[#05b34c] text-white font-bold rounded-2xl text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-[#06C755]/20"
              >
                <MessageSquare className="w-4 h-4" />
                <span>เข้าสู่ระบบด้วย LINE</span>
              </button>
            )}
          </div>
        </div>

        {/* Feature Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <Dumbbell className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">โปรแกรมฝึกซ้อม 3 เดือนแบบเจาะลึก</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              แบ่งเป็น 3 Phase ชัดเจน โฟกัสจุดเด่นตามสัดส่วน เช่น สร้างไหล่กว้าง เอวคอด (V-Taper) หรือเฟิร์มกระชับ พร้อมปรับตารางตามระดับความล้า
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-[#06C755]/20 text-[#06C755] flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">โค้ชเชิงรุกผ่าน LINE (Accountability)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              ถึงเวลานัดซ้อม 18:00 น. โค้ชทักเตือน ถ้าโดดซ้อมเกิน 3 ครั้งจะมีการปรับลงโทษด้วย Challenge ปลูกฝังวินัยที่ยั่งยืน
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">เชื่อมต่อ Google Fit & PWA 100%</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              ดึงสถิติก้าวเดิน แคลอรี่ และชั่วโมงนอนหลับแบบ Real-time นำมาคำนวณวงกลม EAT / TRAIN / RECOVER อัตโนมัติทุกวัน
            </p>
          </div>
        </div>

        {/* Real-time Demo Teaser */}
        <div className="bg-gradient-to-tr from-slate-900 via-slate-850 to-slate-900 border border-slate-700/60 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-left">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              พร้อมเปลี่ยนแปลงตัวเองวันนี้
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              สร้างหุ่นในฝัน โดยมีโค้ชคอยนำทางทุกก้าว
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg">
              ประเมินเพียง 2 นาที คุณจะได้รับมาสเตอร์แพลน 3 เดือน โภชนาการ และการเชื่อมต่อ LINE Trainer ทันที
            </p>
          </div>
          <button
            onClick={handleStart}
            className="w-full md:w-auto px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-sm transition-all shadow-lg shadow-emerald-500/20 whitespace-nowrap active:scale-95"
          >
            เริ่มประเมินฟรี
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>FitCoach AI • Smart Training & Nutrition Ecosystem</span>
          <span>รองรับ PWA ออฟไลน์ & LINE Official Account Integration</span>
        </div>
      </footer>
    </div>
  );
};
