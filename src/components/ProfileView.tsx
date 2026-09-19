import React from "react";
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
  onLogout?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  status,
  sessionUser,
  onOpenOnboarding,
  onOpenLine,
  onLogout,
}) => {
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
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-white font-bold text-xs">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-bold text-slate-900">Apple Health / Google Fit</h4>
                <span className="text-[10px] bg-slate-200 text-slate-600 font-bold px-1.5 py-0.2 rounded">
                  ซิงค์อัตโนมัติ
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                ดึงข้อมูลก้าวเดินและชั่วโมงการนอนหลับ
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>
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
