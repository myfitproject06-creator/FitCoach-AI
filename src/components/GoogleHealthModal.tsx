import React, { useState, useEffect } from "react";
import {
  X,
  Activity,
  Footprints,
  Moon,
  Flame,
  Heart,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Zap,
} from "lucide-react";
import {
  GoogleHealthData,
  initGoogleFitAuth,
  requestGoogleFitAccessToken,
  fetchGoogleFitHealthData,
  isGoogleFitAuthenticated,
} from "../services/googleFitService";

interface GoogleHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
  recovery?: any;
  onSyncComplete?: (healthData: GoogleHealthData) => void;
  onSyncGoogleFit?: (healthData: GoogleHealthData) => void;
}

export const GoogleHealthModal: React.FC<GoogleHealthModalProps> = ({
  isOpen,
  onClose,
  recovery: _recovery,
  onSyncComplete,
  onSyncGoogleFit,
}) => {
  const [clientId, setClientId] = useState("");
  const [isConfigured, setIsConfigured] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [syncedData, setSyncedData] = useState<GoogleHealthData | null>(null);

  useEffect(() => {
    const envClientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || "";
    const storedClientId = localStorage.getItem("fitcoach_google_client_id") || "";
    const activeClientId = storedClientId || envClientId;
    if (activeClientId) {
      setClientId(activeClientId);
      setIsConfigured(true);
      initGoogleFitAuth(activeClientId);
    }
    setIsAuthenticated(isGoogleFitAuthenticated());
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveClientId = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId.trim()) return;
    localStorage.setItem("fitcoach_google_client_id", clientId.trim());
    initGoogleFitAuth(clientId.trim());
    setIsConfigured(true);
    setErrorMsg(null);
  };

  const handleConnectGoogleFit = async () => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      if (!isConfigured) {
        throw new Error("กรุณากรอก Google Client ID ให้ถูกต้อง");
      }
      await requestGoogleFitAccessToken();
      setIsAuthenticated(true);
      const data = await fetchGoogleFitHealthData();
      setSyncedData(data);
      if (onSyncComplete) onSyncComplete(data);
      if (onSyncGoogleFit) onSyncGoogleFit(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "การเชื่อมต่อ Google Fit ขัดข้อง");
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSync = async () => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const data = await fetchGoogleFitHealthData();
      setSyncedData(data);
      if (onSyncComplete) onSyncComplete(data);
      if (onSyncGoogleFit) onSyncGoogleFit(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "เกิดข้อผิดพลาดในการดึงข้อมูล");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseMockData = () => {
    const simulatedData: GoogleHealthData = {
      steps: 8450,
      targetSteps: 8000,
      caloriesBurned: 520,
      distanceKm: 5.9,
      activeMinutes: 48,
      heartRateAvg: 72,
      sleepHours: 7,
      sleepMinutes: 45,
      sleepStart: "23:15",
      sleepEnd: "07:00",
      syncedAt: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
    };
    setSyncedData(simulatedData);
    if (onSyncComplete) onSyncComplete(simulatedData);
    if (onSyncGoogleFit) onSyncGoogleFit(simulatedData);
    setIsAuthenticated(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden flex flex-col text-white max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-teal-500/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Google Health Connect (Google Fit)
                </h3>
                <span className="text-[10px] bg-teal-500/20 text-teal-300 font-bold px-2 py-0.5 rounded-full border border-teal-500/30">
                  REAL-TIME SYNC
                </span>
              </div>
              <p className="text-xs text-slate-400">
                ซิงค์ก้าวเดิน การนอนหลับ และแคลอรี่อัตโนมัติ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Status Indicator */}
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between ${
              isAuthenticated
                ? "bg-emerald-950/50 border-emerald-500/40 text-emerald-200"
                : "bg-slate-800/80 border-slate-700 text-slate-300"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-3 h-3 rounded-full ${
                  isAuthenticated ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
                }`}
              />
              <span className="text-xs font-semibold">
                {isAuthenticated
                  ? "เชื่อมต่อกับ Google Fit สำเร็จ (OAuth 2.0 Active)"
                  : "ยังไม่ได้เชื่อมต่อ Google Account"}
              </span>
            </div>
            {isAuthenticated && syncedData && (
              <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded-md font-mono text-emerald-300">
                ซิงค์ล่าสุด {syncedData.syncedAt}
              </span>
            )}
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Real Synced Data Snapshot if available */}
          {syncedData ? (
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 block">
                ข้อมูลสุขภาพล่าสุดที่ซิงค์มา:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                  <div className="flex items-center gap-1.5 text-teal-400 text-xs mb-1">
                    <Footprints className="w-3.5 h-3.5" />
                    <span>ก้าวเดิน</span>
                  </div>
                  <p className="text-base font-black text-white">
                    {syncedData.steps.toLocaleString()}
                  </p>
                  <span className="text-[10px] text-slate-400">
                    เป้าหมาย {(syncedData.targetSteps || 8000).toLocaleString()} ก้าว
                  </span>
                </div>
                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                  <div className="flex items-center gap-1.5 text-indigo-400 text-xs mb-1">
                    <Moon className="w-3.5 h-3.5" />
                    <span>การนอนหลับ</span>
                  </div>
                  <p className="text-base font-black text-white">
                    {syncedData.sleepHours} ชม. {syncedData.sleepMinutes} น.
                  </p>
                  <span className="text-[10px] text-slate-400">
                    {syncedData.sleepStart} - {syncedData.sleepEnd}
                  </span>
                </div>
                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                  <div className="flex items-center gap-1.5 text-orange-400 text-xs mb-1">
                    <Flame className="w-3.5 h-3.5" />
                    <span>เผาผลาญ</span>
                  </div>
                  <p className="text-base font-black text-white">
                    {syncedData.caloriesBurned} kcal
                  </p>
                  <span className="text-[10px] text-slate-400">
                    Active {syncedData.activeMinutes} นาที
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          {/* Configuration Form for Google Client ID */}
          <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">
                ตั้งค่า Google Cloud OAuth Client ID (Google Fit API):
              </span>
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-teal-400 hover:underline flex items-center gap-1"
              >
                <span>สร้าง Client ID</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <form onSubmit={handleSaveClientId} className="space-y-2">
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="เช่น 123456789-xxxx.apps.googleusercontent.com"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-teal-400"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  บันทึก Client ID
                </button>
                <button
                  type="button"
                  onClick={handleUseMockData}
                  className="px-3 py-1.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 rounded-xl text-xs font-semibold transition-colors border border-teal-500/30"
                >
                  ทดสอบดึงข้อมูลจำลอง (Demo Mode)
                </button>
              </div>
            </form>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              * ข้อมูลที่ซิงค์มาจะนำมาคำนวณวงกลม EAT / TRAIN / RECOVER และให้โค้ชปรับตารางอัตโนมัติ
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors"
          >
            ปิดหน้าต่าง
          </button>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <button
                onClick={handleManualSync}
                disabled={isLoading}
                className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5 active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                <span>{isLoading ? "กำลังซิงค์..." : "ซิงค์ข้อมูลเดี๋ยวนี้"}</span>
              </button>
            ) : (
              <button
                onClick={handleConnectGoogleFit}
                disabled={isLoading}
                className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5 active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{isLoading ? "กำลังเชื่อมต่อ..." : "เชื่อมต่อ Google Account"}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
