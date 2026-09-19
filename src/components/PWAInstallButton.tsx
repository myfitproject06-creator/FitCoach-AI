import React, { useState } from "react";
import { Download, Smartphone, X, Check } from "lucide-react";
import { usePWAInstall } from "../hooks/usePWAInstall";

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // ถ้าเปิดในโหมดติดตั้งแล้ว (Standalone) ไม่ต้องแสดงปุ่ม
  if (isInstalled) {
    return null;
  }

  // บน Chrome / Android / Desktop เมื่อมี Event beforeinstallprompt
  if (isInstallable) {
    return (
      <button
        onClick={install}
        title="ติดตั้ง FitCoach AI ลงหน้าจอมือถือของคุณ"
        className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold px-2.5 py-1.5 rounded-full shadow-md transition-all active:scale-95 cursor-pointer"
      >
        <Download className="w-3.5 h-3.5 animate-bounce" />
        <span className="hidden sm:inline">ติดตั้งแอป</span>
        <span className="sm:hidden">ติดตั้ง</span>
      </button>
    );
  }

  // บน iOS Safari (WebKit ไม่รองรับ beforeinstallprompt แต่สามารถแนะแนวทาง Add to Home Screen ได้)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          title="วิธีติดตั้ง FitCoach AI บน iPhone / iPad"
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-2.5 py-1.5 rounded-full border border-slate-700 transition-all active:scale-95 cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">เพิ่มลงหน้าจอโฮม</span>
          <span className="sm:hidden">ติดตั้ง</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-white space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <Smartphone className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-sm font-bold">ติดตั้งบน iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex items-start gap-2.5 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0 text-[11px]">
                    1
                  </span>
                  <p>
                    กดที่ปุ่ม <strong>แชร์ (Share)</strong>{" "}
                    <span className="inline-block px-1.5 py-0.5 bg-slate-700 rounded text-[10px] font-mono">⎋</span>{" "}
                    ที่แถบด้านล่างของ Safari
                  </p>
                </div>

                <div className="flex items-start gap-2.5 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0 text-[11px]">
                    2
                  </span>
                  <p>
                    เลื่อนลงมาแล้วเลือก{" "}
                    <strong className="text-emerald-300">"เพิ่มไปยังหน้าจอโฮม" (Add to Home Screen)</strong>
                  </p>
                </div>

                <div className="flex items-start gap-2.5 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0 text-[11px]">
                    3
                  </span>
                  <p>
                    กดปุ่ม <strong>"เพิ่ม" (Add)</strong> ที่มุมขวาบน จะได้ไอคอน FitCoach AI เปิดเต็มหน้าจอเหมือนแอปจริง
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-md cursor-pointer"
              >
                เข้าใจแล้ว
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
