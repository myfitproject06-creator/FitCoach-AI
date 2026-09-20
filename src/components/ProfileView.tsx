import React, { useState } from "react";
import {
  User,
  Settings,
  Shield,
  Smartphone,
  Flame,
  Award,
  Bell,
  ChevronRight,
  LogOut,
  Sparkles,
  Heart,
  RefreshCw,
  Sun,
  Moon,
  Send,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { UserProfile, FitnessStatus } from "../types";

export interface SessionUserInfo {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}

interface ProfileViewProps {
  profile: UserProfile;
  status: FitnessStatus;
  sessionUser?: SessionUserInfo | null;
  onOpenOnboarding: () => void;
  onOpenLine: () => void;
  onOpenGoogleHealth?: () => void;
  onLogout?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  status,
  sessionUser,
  onOpenOnboarding,
  onOpenLine,
  onOpenGoogleHealth,
  onLogout,
}) => {
  const [sendingBriefing, setSendingBriefing] = useState(false);
  const [sendingRecap, setSendingRecap] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleTestMorningBriefing = async () => {
    setSendingBriefing(true);
    setFeedbackMsg(null);
    try {
      const res = await fetch("/api/coach/send-morning-briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: sessionUser?.userId }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMsg({ type: "success", text: "ส่ง Morning Briefing (08:00 น.) เข้า LINE เรียบร้อยแล้ว! ตรวจสอบใน LINE ได้เลยครับ" });
      } else {
        setFeedbackMsg({ type: "error", text: data.error || "ไม่สามารถส่งข้อความได้ กรุณาเชื่อมต่อ LINE ก่อน" });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ" });
    } finally {
      setSendingBriefing(false);
    }
  };

  const handleTestNightRecap = async () => {
    setSendingRecap(true);
    setFeedbackMsg(null);
    try {
      const res = await fetch("/api/coach/send-night-recap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: sessionUser?.userId }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMsg({ type: "success", text: "ส่ง Night Recap (20:00 น.) เข้า LINE เรียบร้อยแล้ว! ตรวจสอบใน LINE ได้เลยครับ" });
      } else {
        setFeedbackMsg({ type: "error", text: data.error || "ไม่สามารถส่งข้อความได้ กรุณาเชื่อมต่อ LINE ก่อน" });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ" });
    } finally {
      setSendingRecap(false);
    }
  };
  return (
    <div className="space-y-4 pb-24">
      {/* Profile Card Header */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 p-[3px] shadow-md flex items-center justify-center shrink-0 overflow-hidden">
            {sessionUser?.pictureUrl ? (
              <img
                src={sessionUser.pictureUrl}
                alt={sessionUser.displayName || profile.name}
                className="w-full h-full rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : profile.name ? (
              <div className="w-full h-full rounded-full bg-slate-900 text-emerald-400 font-bold text-xl flex items-center justify-center">
                {profile.name.charAt(0).toUpperCase()}
              </div>
            ) : (
              <div className="w-full h-full rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                <User className="w-8 h-8" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-slate-900 truncate">
                {sessionUser?.displayName || profile.name || "ผู้ใช้งานใหม่"}
              </h2>
              {sessionUser?.userId && (
                <span className="text-[10px] bg-[#06C755]/15 text-[#05a346] font-bold px-2 py-0.5 rounded-full border border-[#06C755]/30">
                  LINE เชื่อมต่อแล้ว
                </span>
              )}
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                Rank {status.rank || "Bronze"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              เป้าหมาย: <span className="font-semibold text-slate-800">{profile.primaryGoal || "ยังไม่ได้กำหนด"}</span>
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1.5">
              <span>น้ำหนัก {((profile.weightKg ?? profile.weight) || 0) > 0 ? `${profile.weightKg ?? profile.weight} กก.` : "-"}</span>
              <span>•</span>
              <span>ส่วนสูง {((profile.heightCm ?? profile.height) || 0) > 0 ? `${profile.heightCm ?? profile.height} ซม.` : "-"}</span>
              <span>•</span>
              <span>อายุ {(profile.age || 0) > 0 ? `${profile.age} ปี` : "-"}</span>
            </div>
          </div>
        </div>

        {/* Retake assessment / edit profile */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {profile.name ? "ต้องการปรับเป้าหมาย หรือข้อมูลร่างกาย?" : "เริ่มต้นสร้างโปรไฟล์ของคุณ"}
          </span>
          <button
            id="retake-onboarding-btn"
            onClick={onOpenOnboarding}
            className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-full border border-emerald-200 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{profile.name ? "ทำแบบสอบถามใหม่" : "ตั้งค่าโปรไฟล์"}</span>
          </button>
        </div>
      </div>

      {/* Fitness Profile Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase">ระดับฟิตเนส</span>
          <p className="text-xs font-bold text-slate-800 mt-0.5">{profile.fitnessLevel || "-"}</p>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase">สถานที่ฝึก</span>
          <p className="text-xs font-bold text-slate-800 mt-0.5">{profile.preferredLocation || "-"}</p>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase">เวลาซ้อมที่ชอบ</span>
          <p className="text-xs font-bold text-slate-800 mt-0.5">{profile.preferredTime || "-"}</p>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase">เวลาต่อสัปดาห์</span>
          <p className="text-xs font-bold text-slate-800 mt-0.5">
            {profile.daysPerWeek > 0 ? `${profile.daysPerWeek} วัน/สัปดาห์` : "-"}
          </p>
        </div>
      </div>

      {/* Integrations & Channels Card */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
          CHANNELS & INTEGRATIONS
        </span>

        {/* LINE Official Account Integration */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#06C755] flex items-center justify-center text-white font-bold text-xs">
              LINE
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-bold text-slate-900">LINE Official Account</h4>
                <span className="text-[10px] bg-[#06C755]/10 text-[#06C755] font-bold px-1.5 py-0.2 rounded border border-[#06C755]/30">
                  เชื่อมต่อแล้ว
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                รับการแจ้งเตือน สรุปอาหาร และคำแนะนำทุกวัน
              </p>
            </div>
          </div>
          <button
            onClick={onOpenLine}
            className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 underline underline-offset-2"
          >
            เปิดแชท
          </button>
        </div>

        {/* Wearable Sync */}
        <div
          onClick={onOpenGoogleHealth}
          className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-white font-bold text-xs">
              <Smartphone className="w-4 h-4 text-teal-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-bold text-slate-900">Apple Health / Google Fit / Smartwatch</h4>
                <span className="text-[10px] bg-teal-50 text-teal-700 border border-teal-200 font-bold px-1.5 py-0.2 rounded">
                  ซิงค์ข้อมูล
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                ซิงค์ก้าวเดิน แคลอรี่ และชั่วโมงการนอนหลับจริง
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* LINE Proactive Coaching (Morning Briefing & Night Recap) */}
      <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-900 rounded-3xl p-5 shadow-sm border border-emerald-500/30 text-white space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 font-bold">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                PROACTIVE COACHING (LINE AUTOMATION)
              </h3>
              <p className="text-[11px] text-slate-300">
                ระบบโค้ชแจ้งเตือนเชิงรุกอัตโนมัติผ่าน LINE Official Account
              </p>
            </div>
          </div>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
            ACTIVE 24/7
          </span>
        </div>

        {feedbackMsg && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              feedbackMsg.type === "success"
                ? "bg-emerald-900/60 border border-emerald-500/50 text-emerald-200"
                : "bg-rose-950/60 border border-rose-500/50 text-rose-200"
            }`}
          >
            {feedbackMsg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Morning Briefing Card */}
          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/80 space-y-2 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                  <Sun className="w-4 h-4" />
                  <span>Morning Briefing</span>
                </div>
                <span className="text-[10px] bg-amber-400/10 text-amber-300 font-mono px-2 py-0.5 rounded-md border border-amber-400/20">
                  08:00 น.
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                ส่งสรุปตารางซ้อมประจำวัน (เช่น Upper Body), เป้าหมายก้าวเดิน 8,000 ก้าว และพลังใจเริ่มต้นวัน
              </p>
            </div>

            <button
              onClick={handleTestMorningBriefing}
              disabled={sendingBriefing}
              className="w-full mt-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
            >
              <Send className={`w-3.5 h-3.5 ${sendingBriefing ? "animate-pulse" : ""}`} />
              <span>{sendingBriefing ? "กำลังส่งเข้า LINE..." : "ทดสอบส่ง Morning Briefing (08:00)"}</span>
            </button>
          </div>

          {/* Night Recap Card */}
          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/80 space-y-2 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-purple-400 font-bold text-xs">
                  <Moon className="w-4 h-4" />
                  <span>Night Recap</span>
                </div>
                <span className="text-[10px] bg-purple-400/10 text-purple-300 font-mono px-2 py-0.5 rounded-md border border-purple-400/20">
                  20:00 น.
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                สรุปภาพรวมร่างกายวันนี้: ขาดแคลอรี่หรือโปรตีนเท่าไหร่, สถานะก้าวเดิน, และแนะนำเวลาเข้านอน
              </p>
            </div>

            <button
              onClick={handleTestNightRecap}
              disabled={sendingRecap}
              className="w-full mt-2 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
            >
              <Send className={`w-3.5 h-3.5 ${sendingRecap ? "animate-pulse" : ""}`} />
              <span>{sendingRecap ? "กำลังส่งเข้า LINE..." : "ทดสอบส่ง Night Recap (20:00)"}</span>
            </button>
          </div>
        </div>

        <p className="text-[10px] text-slate-400 leading-relaxed">
          * ระบบจะตรวจสอบเวลาและส่งข้อความ Flex Card อัตโนมัติทุกวันให้สมาชิกทุกคนที่เชื่อมต่อบัญชี LINE ไว้
        </p>
      </div>

      {/* App Preferences */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
          PREFERENCES
        </span>
        <div className="flex items-center justify-between py-2 border-b border-slate-100">
          <span className="text-xs font-semibold text-slate-800">แจ้งเตือนก่อนเวลาฝึก 30 นาที</span>
          <input type="checkbox" defaultChecked className="toggle-checkbox accent-emerald-600 rounded" />
        </div>
        <div className="flex items-center justify-between py-2 border-b border-slate-100">
          <span className="text-xs font-semibold text-slate-800">สรุปคะแนนฟิตเนสประจำวัน (21:00 น.)</span>
          <input type="checkbox" defaultChecked className="toggle-checkbox accent-emerald-600 rounded" />
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="text-xs font-semibold text-slate-800">โหมดถนอมสายตา (Dark Mode Theme)</span>
          <input type="checkbox" className="toggle-checkbox accent-emerald-600 rounded" />
        </div>
      </div>

      {/* Session Management Section */}
      {sessionUser?.userId && onLogout && (
        <div className="bg-slate-50 rounded-3xl p-5 border border-slate-200 space-y-2">
          <div className="flex items-center gap-2 text-slate-700">
            <LogOut className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold uppercase tracking-wider">
              บัญชี LINE ที่เชื่อมต่อ
            </span>
          </div>
          <p className="text-xs text-slate-600">
            คุณกำลังเข้าสู่ระบบในชื่อ <span className="font-semibold text-slate-800">{sessionUser.displayName}</span> ข้อมูลฟิตเนสจะถูกบันทึกเชื่อมโยงกับบัญชี LINE ของคุณ
          </p>
          <button
            id="line-logout-btn"
            onClick={onLogout}
            className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-2xl text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-2 mt-2 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-500" />
            <span>ออกจากระบบ LINE (Sign Out)</span>
          </button>
        </div>
      )}

      {/* Reset Data Section */}
      <div className="bg-rose-50/70 rounded-3xl p-5 border border-rose-200 space-y-2">
        <div className="flex items-center gap-2 text-rose-700">
          <LogOut className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">
            จัดการข้อมูลระบบ
          </span>
        </div>
        <p className="text-xs text-slate-600">
          ล้างข้อมูลส่วนตัว บันทึกการฝึก และการตั้งค่าทั้งหมด เพื่อเริ่มต้นใช้งานใหม่ตั้งแต่ต้น
        </p>
        <button
          id="reset-all-data-btn"
          onClick={() => {
            if (window.confirm("คุณต้องการล้างข้อมูลทั้งหมดและเริ่มใหม่ใช่หรือไม่? ข้อมูลทั้งหมดที่บันทึกไว้จะถูกรีเซ็ต")) {
              localStorage.clear();
              window.location.reload();
            }
          }}
          className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-2 mt-2 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>รีเซ็ตข้อมูลทั้งหมด (Reset All Data)</span>
        </button>
      </div>
    </div>
  );
};
