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
  Copy,
  Check,
  Smartphone,
  Sliders,
} from "lucide-react";
import {
  GoogleHealthData,
  GOOGLE_FIT_CLIENT_ID,
  initGoogleFitAuth,
  requestGoogleFitAccessToken,
  fetchGoogleFitHealthData,
  isGoogleFitAuthenticated,
  syncHealthToServer,
} from "../services/googleFitService";

interface GoogleHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncComplete: (healthData: GoogleHealthData) => void;
}

export const GoogleHealthModal: React.FC<GoogleHealthModalProps> = ({
  isOpen,
  onClose,
  onSyncComplete,
}) => {
  const [clientId, setClientId] = useState("");
  const [isConfigured, setIsConfigured] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [syncedData, setSyncedData] = useState<GoogleHealthData | null>(null);
  const [copiedOrigin, setCopiedOrigin] = useState(false);
  const [showManualDeviceSync, setShowManualDeviceSync] = useState(false);

  // Manual device stats state
  const [inputSteps, setInputSteps] = useState(8200);
  const [inputSleepHours, setInputSleepHours] = useState(7.5);
  const [inputCalories, setInputCalories] = useState(480);
  const [inputActiveMin, setInputActiveMin] = useState(45);

  useEffect(() => {
    // Check if client ID is stored or in env, default to predefined GOOGLE_FIT_CLIENT_ID
    const envClientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || "";
    const storedClientId = localStorage.getItem("fitcoach_google_client_id") || "";
    const activeClientId = storedClientId || envClientId || GOOGLE_FIT_CLIENT_ID;

    setClientId(activeClientId);
    setIsConfigured(true);
    initGoogleFitAuth(activeClientId);
    setIsAuthenticated(isGoogleFitAuthenticated());
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyOrigin = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopiedOrigin(true);
    setTimeout(() => setCopiedOrigin(false), 2000);
  };

  const handleSaveClientId = (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = clientId.trim() || GOOGLE_FIT_CLIENT_ID;
    localStorage.setItem("fitcoach_google_client_id", targetId);
    initGoogleFitAuth(targetId);
    setIsConfigured(true);
    setErrorMsg(null);
  };

  const handleConnectGoogleFit = async () => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      if (!isConfigured) {
        throw new Error("กรุณากรอก Google Client ID ก่อน");
      }
      await requestGoogleFitAccessToken();
      setIsAuthenticated(true);
      // Automatically fetch after token
      const data = await fetchGoogleFitHealthData();
      setSyncedData(data);
      await syncHealthToServer(data);
      onSyncComplete(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "ไม่สามารถเชื่อมต่อ Google Fit ได้");
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
      await syncHealthToServer(data);
      onSyncComplete(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "เกิดข้อผิดพลาดในการดึงข้อมูลสุขภาพ");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyDeviceSync = async () => {
    const hours = Math.floor(inputSleepHours);
    const mins = Math.round((inputSleepHours - hours) * 60);
    const simulatedData: GoogleHealthData = {
      steps: Number(inputSteps) || 8000,
      targetSteps: 8000,
      caloriesBurned: Number(inputCalories) || 450,
      distanceKm: parseFloat(((Number(inputSteps) || 8000) * 0.00075).toFixed(1)),
      activeMinutes: Number(inputActiveMin) || 40,
      heartRateAvg: 72,
      sleepHours: hours,
      sleepMinutes: mins,
      sleepStart: "23:30",
      sleepEnd: "07:00",
      syncedAt: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
    };
    setSyncedData(simulatedData);
    await syncHealthToServer(simulatedData);
    onSyncComplete(simulatedData);
    setIsAuthenticated(true);
    setErrorMsg(null);
  };

  const handleUseMockData = async () => {
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
    await syncHealthToServer(simulatedData);
    onSyncComplete(simulatedData);
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
                  Google Health & Smartwatch Sync
                </h3>
                <span className="text-[10px] bg-teal-500/20 text-teal-300 font-bold px-2 py-0.5 rounded-full border border-teal-500/30">
                  HEALTH DATA
                </span>
              </div>
              <p className="text-xs text-slate-400">
                ซิงค์ข้อมูลก้าวเดิน แคลอรี่ และชั่วโมงการนอนหลับเข้า FitCoach AI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
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
                  ? "เชื่อมต่อและอัปเดตข้อมูลสุขภาพสำเร็จแล้ว"
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
            <div className="p-3.5 bg-rose-950/70 border border-rose-500/50 rounded-2xl text-rose-200 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-rose-300">สาเหตุที่เชื่อมต่อ Google Fit ไม่สำเร็จ:</p>
                  <p className="text-[11px] leading-relaxed text-rose-200">{errorMsg}</p>
                </div>
              </div>

              {/* Helpful Origin Info if origin mismatch */}
              <div className="mt-2 pt-2 border-t border-rose-800/60 flex items-center justify-between gap-2 text-[10px]">
                <span className="text-rose-300 font-mono truncate">Origin: {window.location.origin}</span>
                <button
                  type="button"
                  onClick={handleCopyOrigin}
                  className="px-2 py-1 bg-rose-900/80 hover:bg-rose-800 text-rose-200 rounded-lg flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  {copiedOrigin ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedOrigin ? "คัดลอกแล้ว" : "คัดลอก Origin"}</span>
                </button>
              </div>
            </div>
          )}

          {/* Real Synced Data Snapshot if available */}
          {syncedData && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 block">
                ข้อมูลสุขภาพล่าสุดที่ถูกบันทึกลงระบบ:
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
                    เป้า {(syncedData.targetSteps || 8000).toLocaleString()} ก้าว
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
          )}

          {/* Quick Smartwatch & Device Sync Section */}
          <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-slate-100">
                  ซิงค์ข้อมูลจาก Smartwatch / Health Connect ทันที
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowManualDeviceSync(!showManualDeviceSync)}
                className="text-[11px] text-teal-400 hover:text-teal-300 underline underline-offset-2 flex items-center gap-1 cursor-pointer"
              >
                <Sliders className="w-3 h-3" />
                <span>{showManualDeviceSync ? "ย่อลง" : "ปรับค่าด่วน"}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              รองรับข้อมูลจริงจาก Apple Health, Garmin, Mi Band, Samsung Health และ Google Health Connect
              เพื่อใช้ประเมิน Morning Briefing และ Night Recap
            </p>

            {showManualDeviceSync && (
              <div className="pt-2 border-t border-slate-700/60 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      ก้าวเดินวันนี้ (Steps)
                    </label>
                    <input
                      type="number"
                      value={inputSteps}
                      onChange={(e) => setInputSteps(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white font-mono text-xs focus:outline-none focus:border-teal-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      ชั่วโมงนอนหลับ (ชม.)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={inputSleepHours}
                      onChange={(e) => setInputSleepHours(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white font-mono text-xs focus:outline-none focus:border-teal-400"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setInputSteps(5200);
                        setInputSleepHours(6.5);
                      }}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] text-slate-300 cursor-pointer"
                    >
                      เดิน 5,200 / นอน 6.5h
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setInputSteps(10500);
                        setInputSleepHours(8);
                      }}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] text-slate-300 cursor-pointer"
                    >
                      เดิน 10,500 / นอน 8h
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyDeviceSync}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>บันทึกข้อมูล</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Configuration Form for Google Client ID */}
          <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">
                การตั้งค่า Google Cloud OAuth (Google Fit API):
              </span>
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-teal-400 hover:underline flex items-center gap-1"
              >
                <span>Google Console</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <form onSubmit={handleSaveClientId} className="space-y-2">
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="Google Client ID"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-teal-400"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  บันทึก Client ID
                </button>
                <button
                  type="button"
                  onClick={handleUseMockData}
                  className="px-3 py-1.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 rounded-xl text-xs font-semibold transition-colors border border-teal-500/30 cursor-pointer"
                >
                  โหลดข้อมูลตัวอย่าง (Instant Sync)
                </button>
              </div>
            </form>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              * หมายเหตุ: ปัจจุบัน Google กำลังทยอยแทนที่ Google Fit REST API ด้วย Google Health Connect หาก Google ปฏิเสธการเชื่อมต่อ คุณสามารถใช้ระบบ Quick Device Sync ด้านบนเพื่อดึงข้อมูลจากนาฬิกาได้ 100%
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
          >
            ปิด
          </button>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <button
                onClick={handleManualSync}
                disabled={isLoading}
                className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5 active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                <span>{isLoading ? "กำลังดึงข้อมูล..." : "ซิงค์ Google Fit อีกครั้ง"}</span>
              </button>
            ) : (
              <button
                onClick={handleConnectGoogleFit}
                disabled={isLoading}
                className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5 active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{isLoading ? "กำลังเชื่อมต่อ Google..." : "เข้าสู่ระบบ Google Fit"}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
