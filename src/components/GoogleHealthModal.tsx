import React, { useState } from "react";
import {
  X,
  Footprints,
  Moon,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Link2,
  Unlink,
  Sparkles,
  ShieldCheck,
  Smartphone,
  Watch,
  Activity as ActivityIcon,
} from "lucide-react";
import {
  isGoogleFitConnected,
  requestGoogleFitAuth,
  syncAllGoogleFitData,
  disconnectGoogleFit,
  getLastGoogleFitSyncTime,
} from "../services/googleFitService";
import { ActivityData, RecoveryData, WorkoutPlan } from "../types";

interface GoogleHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: ActivityData;
  recovery: RecoveryData;
  workout: WorkoutPlan;
  onUpdateActivity: (updated: Partial<ActivityData>) => void;
  onUpdateRecovery: (updated: Partial<RecoveryData>) => void;
  onAdaptWorkoutForSleep?: (hours: number, minutes: number) => void;
}

export const GoogleHealthModal: React.FC<GoogleHealthModalProps> = ({
  isOpen,
  onClose,
  activity,
  recovery,
  workout,
  onUpdateActivity,
  onUpdateRecovery,
  onAdaptWorkoutForSleep,
}) => {
  const [isConnected, setIsConnected] = useState<boolean>(isGoogleFitConnected());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(getLastGoogleFitSyncTime());

  if (!isOpen) return null;

  const handleConnectAndSync = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // 1. Authenticate with Google Identity Services
      const token = await requestGoogleFitAuth();
      setIsConnected(true);

      // 2. Query Google Fit API for Steps & Sleep
      const result = await syncAllGoogleFitData(token);

      // 3. Update React App State
      onUpdateActivity({
        currentSteps: result.stepsData.steps,
        distanceKm: result.stepsData.distanceKm,
        activeMinutes: result.stepsData.activeMinutes,
        caloriesExpended: result.stepsData.caloriesExpended,
        isFromGoogleHealth: true,
        lastSyncedAt: result.syncedAt,
      });

      onUpdateRecovery({
        sleepHours: result.sleepData.sleepHours,
        sleepMinutes: result.sleepData.sleepMinutes,
        sleepStart: result.sleepData.sleepStart,
        sleepEnd: result.sleepData.sleepEnd,
        score: result.sleepData.score,
        quality: result.sleepData.quality,
        coachInsight: result.sleepData.coachInsight,
        isFromGoogleHealth: true,
        lastSyncedAt: result.syncedAt,
      });

      setLastSync(result.syncedAt);
      setSuccessMsg(
        `ซิงค์ข้อมูลสำเร็จ! ดึงก้าวเดิน ${result.stepsData.steps.toLocaleString()} ก้าว และการนอน ${result.sleepData.sleepHours} ชม. ${result.sleepData.sleepMinutes} นาที เข้าสู่ FitCoach แล้ว`
      );

      // 4. Auto adapt if user didn't sleep enough
      if (result.sleepData.shouldAdaptWorkout && onAdaptWorkoutForSleep) {
        onAdaptWorkoutForSleep(
          result.sleepData.sleepHours,
          result.sleepData.sleepMinutes
        );
      }
    } catch (err: any) {
      console.error("Google Fit Error:", err);
      setError(
        err?.message ||
          "ไม่สามารถเชื่อมต่อ Google Fit ได้ กรุณาลองใหม่อีกครั้ง หรือตรวจสอบการอนุญาตป๊อปอัปในเบราว์เซอร์"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    if (!isConnected) {
      handleConnectAndSync();
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const result = await syncAllGoogleFitData();

      onUpdateActivity({
        currentSteps: result.stepsData.steps,
        distanceKm: result.stepsData.distanceKm,
        activeMinutes: result.stepsData.activeMinutes,
        caloriesExpended: result.stepsData.caloriesExpended,
        isFromGoogleHealth: true,
        lastSyncedAt: result.syncedAt,
      });

      onUpdateRecovery({
        sleepHours: result.sleepData.sleepHours,
        sleepMinutes: result.sleepData.sleepMinutes,
        sleepStart: result.sleepData.sleepStart,
        sleepEnd: result.sleepData.sleepEnd,
        score: result.sleepData.score,
        quality: result.sleepData.quality,
        coachInsight: result.sleepData.coachInsight,
        isFromGoogleHealth: true,
        lastSyncedAt: result.syncedAt,
      });

      setLastSync(result.syncedAt);
      setSuccessMsg("อัปเดตข้อมูลล่าสุดจาก Google Health เรียบร้อยแล้ว!");

      if (result.sleepData.shouldAdaptWorkout && onAdaptWorkoutForSleep) {
        onAdaptWorkoutForSleep(
          result.sleepData.sleepHours,
          result.sleepData.sleepMinutes
        );
      }
    } catch (err: any) {
      setError(err?.message || "ไม่สามารถดึงข้อมูลล่าสุดได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    disconnectGoogleFit();
    setIsConnected(false);
    setSuccessMsg("ยกเลิกการเชื่อมต่อกับ Google Health เรียบร้อยแล้ว");
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Demo simulator for immediate preview if user doesn't have active sync yet
  const handleSimulateHealthySync = () => {
    const simulatedSteps = Math.floor(Math.random() * 3000) + 7200; // 7,200 - 10,200 steps
    const simulatedHours = 7;
    const simulatedMinutes = 35;
    const nowTime = new Date().toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    });

    onUpdateActivity({
      currentSteps: simulatedSteps,
      distanceKm: parseFloat(((simulatedSteps * 0.75) / 1000).toFixed(2)),
      activeMinutes: Math.round(simulatedSteps / 110),
      caloriesExpended: Math.round(simulatedSteps * 0.04),
      isFromGoogleHealth: true,
      lastSyncedAt: nowTime,
    });

    onUpdateRecovery({
      sleepHours: simulatedHours,
      sleepMinutes: simulatedMinutes,
      sleepStart: "23:25",
      sleepEnd: "07:00",
      score: 88,
      quality: "ยอดเยี่ยม",
      coachInsight:
        "ข้อมูลจาก Google Fit: การนอนหลับ 7 ชม. 35 นาที (Deep Sleep 1 ชม. 40 นาที) ร่างกายฟื้นตัวได้ 88% พร้อมสำหรับโปรแกรมเวทวันนี้เต็มที่ครับ!",
      isFromGoogleHealth: true,
      lastSyncedAt: nowTime,
    });

    setLastSync(nowTime);
    setSuccessMsg("จำลองผลการซิงค์ข้อมูล Google Health จำลอง (7,850 ก้าว & นอน 7 ชม. 35 นาที) สำเร็จ!");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center">
              <ActivityIcon className="w-4 h-4 text-teal-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm text-white">Google Health & Fit Sync</h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded-full border border-emerald-500/30">
                  Official OAuth
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                ซิงค์ก้าวเดินจริง (Activity) และการนอนหลับจริง (Recovery)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* Status Banner */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              isConnected
                ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                : "bg-slate-50 border-slate-200 text-slate-800"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    isConnected
                      ? "bg-emerald-500 text-white shadow-xs"
                      : "bg-slate-300 text-slate-600"
                  }`}
                >
                  {isConnected ? <CheckCircle2 className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
                </span>
                <div>
                  <h4 className="text-xs font-bold">
                    {isConnected
                      ? "เชื่อมต่อ Google Fit สำเร็จแล้ว"
                      : "ยังไม่ได้เชื่อมต่อ Google Fit"}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {isConnected
                      ? `ซิงค์ล่าสุด: ${lastSync || "เพิ่งเชื่อมต่อ"} · รองรับ Wear OS & Health Connect`
                      : "เชื่อมต่อเพื่อนำข้อมูลก้าวเดินและการนอนจริงจากสมาร์ทโฟน/นาฬิกามาใช้อัตโนมัติ"}
                  </p>
                </div>
              </div>

              {isConnected && (
                <button
                  onClick={handleDisconnect}
                  title="ยกเลิกการเชื่อมต่อ"
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                >
                  <Unlink className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Scopes Badge */}
            <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex flex-wrap gap-1.5 text-[10px]">
              <span className="bg-white px-2 py-0.5 rounded-md font-medium text-slate-600 border border-slate-200 flex items-center gap-1">
                <Footprints className="w-3 h-3 text-teal-600" />
                <span>fitness.activity.read (ก้าวเดิน/ระยะทาง)</span>
              </span>
              <span className="bg-white px-2 py-0.5 rounded-md font-medium text-slate-600 border border-slate-200 flex items-center gap-1">
                <Moon className="w-3 h-3 text-indigo-600" />
                <span>fitness.sleep.read (การนอน/ฟื้นตัว)</span>
              </span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">เกิดข้อผิดพลาดในการเชื่อมต่อ</p>
                <p className="text-[11px] text-rose-700 mt-0.5 leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="font-semibold leading-relaxed">{successMsg}</p>
            </div>
          )}

          {/* Primary Action Button */}
          <div className="space-y-2">
            {!isConnected ? (
              <button
                onClick={handleConnectAndSync}
                disabled={isLoading}
                className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
                    <span>กำลังเปิดหน้าล็อกอิน Google...</span>
                  </>
                ) : (
                  <>
                    <img
                      src="https://www.gstatic.com/images/branding/product/1x/gfit_512dp.png"
                      alt="Google Fit"
                      className="w-4 h-4 object-contain"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                    <span>เชื่อมต่อ Google Health & ซิงค์ข้อมูล</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleManualRefresh}
                disabled={isLoading}
                className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                <span>{isLoading ? "กำลังดึงข้อมูลล่าสุดจาก Google Fit..." : "ดึงข้อมูลล่าสุดตอนนี้ (Sync Now)"}</span>
              </button>
            )}

            {/* Quick Demo Simulator Button for testing */}
            <button
              onClick={handleSimulateHealthySync}
              className="w-full py-2 px-3 text-[11px] font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>ทดลองกดดูข้อมูลจำลองจริง (Demo Sync Preview)</span>
            </button>
          </div>

          {/* Real-time Synced Data Metrics Cards */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span>ข้อมูลสุขภาพปัจจุบันในระบบ</span>
              {activity.isFromGoogleHealth && (
                <span className="text-[10px] text-teal-600 font-semibold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                  ✓ Verified by Google Health
                </span>
              )}
            </h4>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Activity Metric */}
              <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider">
                    ACTIVITY · ก้าวเดิน
                  </span>
                  <div className="w-6 h-6 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                    <Footprints className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-lg font-black text-slate-900">
                  {activity.currentSteps.toLocaleString()} <span className="text-xs font-normal text-slate-500">ก้าว</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1 flex flex-col gap-0.5">
                  <span>ระยะทาง: <strong>{activity.distanceKm} กม.</strong></span>
                  <span>เวลาเคลื่อนไหว: <strong>{activity.activeMinutes} นาที</strong></span>
                </div>
              </div>

              {/* Recovery Metric */}
              <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                    RECOVER · การนอน
                  </span>
                  <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Moon className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-lg font-black text-slate-900">
                  {recovery.sleepHours} ชม. {recovery.sleepMinutes} น.
                </div>
                <div className="text-[11px] text-slate-500 mt-1 flex flex-col gap-0.5">
                  <span>ช่วงเวลา: <strong>{recovery.sleepStart || "23:30"} - {recovery.sleepEnd || "07:00"}</strong></span>
                  <span>ความพร้อม: <strong className="text-indigo-600">{recovery.score}/100 ({recovery.quality})</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Coach Smart Adaptation Feature Card */}
          <div className="p-3.5 bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-900 text-white rounded-2xl border border-indigo-500/30">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4 text-indigo-300" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-indigo-200">
                  AI Adaptive Coach ทำงานร่วมกับ Google Health
                </h5>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  เมื่อระบบดึงข้อมูลการนอนจาก Google Fit แล้วพบว่าคุณ **นอนน้อยกว่า 6 ชั่วโมง** โค้ช AI จะปรับลดความหนัก (RPE) ของโปรแกรมเวทในวันนั้นลงอัตโนมัติ เพื่อป้องกันการบาดเจ็บและอาการ Overtraining
                </p>
                {workout.isAdapted && (
                  <div className="mt-2 text-[10px] bg-amber-400/20 border border-amber-400/40 text-amber-200 px-2 py-1 rounded-lg">
                    ⚡ ปัจจุบันโปรแกรมวันนี้ถูกปรับให้เบาลงเรียบร้อยแล้ว
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Supported Devices Info */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-slate-400" />
              <Watch className="w-4 h-4 text-slate-400" />
              <span>รองรับ Android, Pixel Watch, Samsung Galaxy, Wear OS & Health Connect</span>
            </div>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
        </div>
      </div>
    </div>
  );
};
