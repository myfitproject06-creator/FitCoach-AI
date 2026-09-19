import React from "react";
import {
  User,
  Settings,
  Shield,
  Bell,
  Activity,
  Heart,
  Share2,
  ExternalLink,
  Smartphone,
  LogOut,
  Edit3,
  Sparkles,
  RefreshCw,
  Footprints,
  Flame,
  CheckCircle2,
  Unlink,
} from "lucide-react";
import { UserProfile, FitnessStatus, ActivityData } from "../types";

interface ProfileViewProps {
  profile: UserProfile;
  status: FitnessStatus;
  activity?: ActivityData;
  isGoogleFitConnected?: boolean;
  onConnectGoogleFit?: () => void;
  onSyncGoogleFit?: () => void;
  onDisconnectGoogleFit?: () => void;
  isSyncingGoogleFit?: boolean;
  lastGoogleFitSyncTime?: string | null;
  onEditProfile: () => void;
  onOpenGoogleHealth: () => void;
  onOpenRichMenuStudio: () => void;
  onLogout?: () => void;
  isInstallable?: boolean;
  onInstallPWA?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  status,
  activity,
  isGoogleFitConnected = false,
  onConnectGoogleFit,
  onSyncGoogleFit,
  onDisconnectGoogleFit,
  isSyncingGoogleFit = false,
  lastGoogleFitSyncTime,
  onEditProfile,
  onOpenGoogleHealth,
  onOpenRichMenuStudio,
  onLogout,
  isInstallable,
  onInstallPWA,
}) => {
  return (
    <div className="space-y-4 pb-12">
      {/* Profile Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#06C755] to-emerald-400 p-0.5 shadow-md">
            {profile.pictureUrl ? (
              <img
                src={profile.pictureUrl}
                alt={profile.name}
                className="w-full h-full rounded-[14px] object-cover bg-slate-900"
              />
            ) : (
              <div className="w-full h-full rounded-[14px] bg-slate-900 flex items-center justify-center text-white text-xl font-bold">
                {profile.name.charAt(0) || "U"}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-bold text-slate-900">
                {profile.name}
              </h2>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full">
                PRO MEMBER
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              เป้าหมาย: {profile.goal || "สร้างหุ่น V-Taper"}
            </p>
            <p className="text-[10px] text-slate-400">
              ส่วนสูง: {profile.heightCm || profile.height || "-"} ซม. • น้ำหนัก: {profile.weightKg || profile.weight || "-"} กก.
            </p>
          </div>
        </div>

        <button
          onClick={onEditProfile}
          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
          title="แก้ไขข้อมูล"
        >
          <Edit3 className="w-4 h-4" />
        </button>
      </div>

      {/* Integration Settings */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            การเชื่อมต่อบริการ & อุปกรณ์สุขภาพ
          </h3>
          <span className="text-[10px] text-slate-400 font-medium">
            Health & Sync
          </span>
        </div>

        {/* Dedicated Google Fit Card */}
        <div className="rounded-2xl border border-slate-200/90 overflow-hidden bg-gradient-to-b from-slate-50 to-white p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200/50">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900">
                    Google Fit / Android Health
                  </h4>
                  {isGoogleFitConnected ? (
                    <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      เชื่อมต่อแล้ว
                    </span>
                  ) : (
                    <span className="text-[10px] bg-slate-200/70 text-slate-600 font-medium px-2 py-0.5 rounded-full">
                      ยังไม่เชื่อมต่อ
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  ระบบดึงจำนวนก้าวเดินและแคลอรีอัตโนมัติเข้าสู่ระบบ AI
                </p>
              </div>
            </div>
          </div>

          {/* Connected state details */}
          {isGoogleFitConnected ? (
            <div className="space-y-2.5 pt-1">
              <div className="grid grid-cols-2 gap-2 bg-slate-100/80 rounded-xl p-2.5 text-slate-700">
                <div className="flex items-center gap-2">
                  <Footprints className="w-4 h-4 text-teal-600" />
                  <div>
                    <p className="text-[10px] text-slate-500">ก้าวเดินวันนี้</p>
                    <p className="text-xs font-bold text-slate-900">
                      {(activity?.currentSteps ?? 0).toLocaleString()} ก้าว
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <div>
                    <p className="text-[10px] text-slate-500">แคลอรีเผาผลาญ</p>
                    <p className="text-xs font-bold text-slate-900">
                      {(activity?.caloriesExpended ?? 0).toLocaleString()} kcal
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 px-0.5">
                <span>
                  ซิงค์ล่าสุด: {lastGoogleFitSyncTime || activity?.lastSyncedAt || "เมื่อสักครู่"}
                </span>
                <button
                  type="button"
                  onClick={onOpenGoogleHealth}
                  className="text-blue-600 hover:text-blue-700 font-medium underline"
                >
                  ตั้งค่าขั้นสูง
                </button>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  id="profile-sync-google-fit-btn"
                  onClick={onSyncGoogleFit}
                  disabled={isSyncingGoogleFit}
                  className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-98 disabled:opacity-75"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingGoogleFit ? "animate-spin" : ""}`} />
                  <span>{isSyncingGoogleFit ? "กำลังดึงข้อมูลก้าว & แคลอรี..." : "ซิงค์ข้อมูลเดี๋ยวนี้ (Sync Now)"}</span>
                </button>

                {onDisconnectGoogleFit && (
                  <button
                    type="button"
                    onClick={onDisconnectGoogleFit}
                    className="p-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs transition-colors"
                    title="ตัดการเชื่อมต่อ Google Fit"
                  >
                    <Unlink className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2.5 pt-1">
              <p className="text-[11px] text-slate-600 leading-relaxed bg-blue-50/70 border border-blue-100 rounded-xl p-2.5">
                เชื่อมต่อบัญชี Google Fit เพื่อให้ FitCoach AI นำก้าวเดินและแคลอรีที่เผาผลาญจริง มาคำนวณโภชนาการและปรับลดความล้าอัตโนมัติ
              </p>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  id="profile-connect-google-fit-btn"
                  onClick={onConnectGoogleFit || onOpenGoogleHealth}
                  className="flex-1 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 active:scale-98"
                >
                  <Activity className="w-4 h-4 text-teal-400" />
                  <span>เชื่อมต่อ Google Fit ทันที</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenGoogleHealth}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-colors text-center"
                >
                  กรอก Client ID
                </button>
              </div>
            </div>
          )}
        </div>

        {/* LINE Rich Menu Studio */}
        <button
          onClick={onOpenRichMenuStudio}
          className="w-full p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-2xl flex items-center justify-between text-left transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#06C755]/10 text-[#06C755] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">
                LINE Rich Menu Design Studio
              </p>
              <p className="text-[11px] text-slate-500">
                ดูสเปก 2500x1686px และดาวน์โหลดภาพสำหรับ LINE OA
              </p>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
        </button>

        {/* PWA Install Button if available */}
        {isInstallable && (
          <button
            onClick={onInstallPWA}
            className="w-full p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-2xl flex items-center justify-between text-left transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-950">
                  ติดตั้งแอปลงบนหน้าจอมือถือ (Install PWA)
                </p>
                <p className="text-[11px] text-emerald-700">
                  เปิดใช้งานได้รวดเร็วแบบ Native App โดยไม่ต้องเปิดเบราว์เซอร์
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-xl shadow-2xs">
              ติดตั้ง
            </span>
          </button>
        )}
      </div>

      {/* Routine & Preferences */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          การตั้งค่าเวลา & การแจ้งเตือน
        </h3>

        <div className="flex items-center justify-between py-2 border-b border-slate-100 text-xs">
          <span className="text-slate-600">เวลาเตือนซ้อม LINE ประจำวัน</span>
          <span className="font-bold text-slate-900">{profile.lineNotificationTime || "18:00"} น.</span>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-slate-100 text-xs">
          <span className="text-slate-600">ความถี่การฝึกซ้อม</span>
          <span className="font-bold text-slate-900">{profile.daysPerWeek || 4} วัน / สัปดาห์</span>
        </div>

        <div className="flex items-center justify-between py-2 text-xs">
          <span className="text-slate-600">อุปกรณ์ & บรรยากาศ</span>
          <span className="font-bold text-slate-900">
            {profile.environment === "gym" ? "ยิม / ฟิตเนสครบวงจร" : "บ้าน / ดัมเบล"}
          </span>
        </div>
      </div>

      {/* Logout button */}
      {onLogout && (
        <div className="pt-2">
          <button
            onClick={onLogout}
            className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-2xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      )}
    </div>
  );
};
