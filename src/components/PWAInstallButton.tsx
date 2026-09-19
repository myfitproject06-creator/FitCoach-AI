import React from "react";
import { Download, Smartphone } from "lucide-react";
import { usePWAInstall } from "../hooks/usePWAInstall";

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, install } = usePWAInstall();

  if (!isInstallable) return null;

  return (
    <button
      onClick={() => {
        install();
      }}
      title="ติดตั้งแอป FitCoach ลงบนหน้าจอหลัก"
      className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-2.5 py-1.5 rounded-full shadow-xs transition-all active:scale-95 animate-pulse"
    >
      <Smartphone className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">ติดตั้งแอป</span>
    </button>
  );
};
