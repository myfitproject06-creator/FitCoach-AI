import React from "react";
import { MessageSquare, Flame, Sparkles, LayoutGrid, Activity } from "lucide-react";
import { FitnessStatus, UserProfile } from "../types";
import { PWAInstallButton } from "./PWAInstallButton";

interface HeaderProps {
  profile: UserProfile;
  status: FitnessStatus;
  sessionUser?: {
    userId?: string;
    displayName?: string;
    pictureUrl?: string;
  } | null;
  onOpenLine: () => void;
  onOpenOnboarding: () => void;
  onOpenRichMenuStudio?: () => void;
  onOpenGoogleHealth?: () => void;
  isGoogleHealthConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  status,
  sessionUser,
  onOpenLine,
  onOpenOnboarding,
  onOpenRichMenuStudio,
  onOpenGoogleHealth,
  isGoogleHealthConnected,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900 text-white shadow-md border-b border-slate-800">
      <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* User profile & greeting */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenOnboarding}
            title="แก้ไขโปรไฟล์ / แบบสอบถาม"
            className="relative group focus:outline-none"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 p-[2px] transition-transform group-hover:scale-105 flex items-center justify-center overflow-hidden">
              {sessionUser?.pictureUrl ? (
                <img
                  src={sessionUser.pictureUrl}
                  alt={sessionUser.displayName || profile.name}
                  className="w-full h-full rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : profile.name ? (
                <div className="w-full h-full rounded-full bg-slate-800 text-emerald-400 font-bold text-sm flex items-center justify-center">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
              ) : (
                <div className="w-full h-full rounded-full bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center">
                  FC
                </div>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
            </div>
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 font-medium">FitCoach AI</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded font-semibold border border-emerald-500/30">
                ACTIVE
              </span>
            </div>
            <h1 className="text-sm font-semibold text-slate-100 flex items-center gap-1">
              สวัสดี, {sessionUser?.displayName || profile.name || "คุณ"}
            </h1>
          </div>
        </div>

        {/* Right actions: Condition badge & LINE Coach button */}
        <div className="flex items-center gap-2">
          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* Condition Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-300 font-medium">Condition</span>
            <span className="text-emerald-400 font-bold">{status.condition}%</span>
          </div>

          {/* Google Health Sync Button */}
          {onOpenGoogleHealth && (
            <button
              onClick={onOpenGoogleHealth}
              title="ซิงค์ Google Health (Google Fit)"
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold px-2.5 py-1.5 rounded-full border border-slate-700 transition-all active:scale-95"
            >
              <Activity className={`w-3.5 h-3.5 ${isGoogleHealthConnected ? "text-teal-400" : "text-slate-400"}`} />
              <span className="hidden sm:inline">Google Fit</span>
              {isGoogleHealthConnected && (
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
              )}
            </button>
          )}

          {/* LINE Rich Menu Studio Button */}
          {onOpenRichMenuStudio && (
            <button
              onClick={onOpenRichMenuStudio}
              title="ออกแบบ LINE Rich Menu (2500x1686 px)"
              className="hidden sm:flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold px-2.5 py-1.5 rounded-full border border-slate-700 transition-all active:scale-95"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-[#06C755]" />
              <span>Rich Menu</span>
            </button>
          )}

          {/* LINE Bot Trainer Trigger */}
          <button
            id="open-line-bot-btn"
            onClick={onOpenLine}
            className="relative flex items-center gap-1.5 bg-[#06C755] hover:bg-[#05b34c] text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-all active:scale-95 shadow-sm shadow-[#06C755]/20"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>LINE Trainer</span>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-slate-900 animate-ping"></span>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-slate-900"></span>
          </button>
        </div>
      </div>
    </header>
  );
};
