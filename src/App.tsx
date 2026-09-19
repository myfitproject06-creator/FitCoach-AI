import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { Navigation } from "./components/Navigation";
import { HomeView } from "./components/HomeView";
import { PlanView } from "./components/PlanView";
import { StatusView } from "./components/StatusView";
import { ProfileView } from "./components/ProfileView";
import { LandingView } from "./components/LandingView";
import { LoginView } from "./components/LoginView";

import { WorkoutModal } from "./components/WorkoutModal";
import { NutritionModal } from "./components/NutritionModal";
import { RecoveryModal } from "./components/RecoveryModal";
import { AdaptiveWorkoutModal } from "./components/AdaptiveWorkoutModal";
import { Plan3MonthsModal } from "./components/Plan3MonthsModal";
import { WeeklyReportModal } from "./components/WeeklyReportModal";
import { LineBotChatModal } from "./components/LineBotChatModal";
import { LineRichMenu } from "./components/LineRichMenu";
import { LineRichMenuStudioModal } from "./components/LineRichMenuStudioModal";
import { GoogleHealthModal } from "./components/GoogleHealthModal";
import { OnboardingModal } from "./components/OnboardingModal";

import { usePWAInstall } from "./hooks/usePWAInstall";
import {
  initialUserProfile,
  initialWorkoutPlan,
  initialNutritionData,
  initialRecoveryData,
  initialActivity,
  initialFitnessStatus,
  initialLineMessages,
  initialWorkoutDays,
} from "./data/mockData";
import {
  UserProfile,
  WorkoutPlan,
  NutritionData,
  RecoveryData,
  ActivityData,
  FitnessStatus,
  LineMessage,
  MealItem,
} from "./types";
import {
  isGoogleFitConnected,
  requestGoogleFitAccessToken,
  fetchGoogleFitHealthData,
  autoSyncGoogleFitIfConnected,
  disconnectGoogleFit,
  getLastGoogleFitSyncTime,
  GoogleHealthData,
} from "./services/googleFitService";

export default function App() {
  // Navigation & View Mode
  const [viewMode, setViewMode] = useState<"app" | "landing" | "login">("app");
  const [currentTab, setCurrentTab] = useState<"today" | "plan" | "status" | "profile">("today");

  // Core Application States (with localStorage sync)
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem("fitcoach_profile");
    return saved ? JSON.parse(saved) : initialUserProfile;
  });

  const [workout, setWorkout] = useState<WorkoutPlan>(() => {
    const saved = localStorage.getItem("fitcoach_workout");
    return saved ? JSON.parse(saved) : initialWorkoutPlan;
  });

  const [nutrition, setNutrition] = useState<NutritionData>(() => {
    const saved = localStorage.getItem("fitcoach_nutrition");
    return saved ? JSON.parse(saved) : initialNutritionData;
  });

  const [recovery, setRecovery] = useState<RecoveryData>(() => {
    const saved = localStorage.getItem("fitcoach_recovery");
    return saved ? JSON.parse(saved) : initialRecoveryData;
  });

  const [activity, setActivity] = useState<ActivityData>(() => {
    const saved = localStorage.getItem("fitcoach_activity");
    return saved ? JSON.parse(saved) : initialActivity;
  });

  const [status, setStatus] = useState<FitnessStatus>(() => {
    const saved = localStorage.getItem("fitcoach_status");
    return saved ? JSON.parse(saved) : initialFitnessStatus;
  });

  const [lineMessages, setLineMessages] = useState<LineMessage[]>(() => {
    const saved = localStorage.getItem("fitcoach_line_messages");
    return saved ? JSON.parse(saved) : initialLineMessages;
  });

  // Google Fit & Health Integration State
  const [isGoogleFitConnectedState, setIsGoogleFitConnectedState] = useState<boolean>(() => {
    return isGoogleFitConnected();
  });
  const [isSyncingGoogleFit, setIsSyncingGoogleFit] = useState<boolean>(false);
  const [lastGoogleFitSyncTime, setLastGoogleFitSyncTime] = useState<string | null>(() => {
    return getLastGoogleFitSyncTime();
  });

  // Modal States
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [isNutritionModalOpen, setIsNutritionModalOpen] = useState(false);
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
  const [isAdaptiveModalOpen, setIsAdaptiveModalOpen] = useState(false);
  const [isPlan3MonthsOpen, setIsPlan3MonthsOpen] = useState(false);
  const [isWeeklyReportOpen, setIsWeeklyReportOpen] = useState(false);
  const [isLineChatOpen, setIsLineChatOpen] = useState(false);
  const [isGoogleHealthOpen, setIsGoogleHealthOpen] = useState(false);
  const [isRichMenuStudioOpen, setIsRichMenuStudioOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [showRichMenuDrawer, setShowRichMenuDrawer] = useState(false);

  // PWA Support Hook
  const { isInstallable, install } = usePWAInstall();

  // Save to localStorage on state changes
  useEffect(() => {
    localStorage.setItem("fitcoach_profile", JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem("fitcoach_workout", JSON.stringify(workout));
  }, [workout]);

  useEffect(() => {
    localStorage.setItem("fitcoach_nutrition", JSON.stringify(nutrition));
  }, [nutrition]);

  useEffect(() => {
    localStorage.setItem("fitcoach_recovery", JSON.stringify(recovery));
  }, [recovery]);

  useEffect(() => {
    localStorage.setItem("fitcoach_activity", JSON.stringify(activity));
  }, [activity]);

  useEffect(() => {
    localStorage.setItem("fitcoach_status", JSON.stringify(status));
  }, [status]);

  useEffect(() => {
    localStorage.setItem("fitcoach_line_messages", JSON.stringify(lineMessages));
  }, [lineMessages]);

  // Google Fit Data Sync Handlers
  const handleApplyGoogleHealthData = (healthData: GoogleHealthData, notifyCoach = true) => {
    const activeCalories = healthData.caloriesBurned || Math.round(healthData.steps * 0.042);
    setActivity((prev) => ({
      ...prev,
      currentSteps: healthData.steps,
      caloriesExpended: activeCalories,
      distanceKm: healthData.distanceKm,
      activeMinutes: healthData.activeMinutes,
      isFromGoogleHealth: true,
      lastSyncedAt: healthData.syncedAt,
    }));

    setRecovery((prev) => ({
      ...prev,
      steps: healthData.steps,
      sleepHours: healthData.sleepHours || prev.sleepHours,
      sleepMinutes: healthData.sleepMinutes || prev.sleepMinutes,
      sleepStart: healthData.sleepStart || prev.sleepStart,
      sleepEnd: healthData.sleepEnd || prev.sleepEnd,
      restingHeartRate: healthData.heartRateAvg || prev.restingHeartRate,
      hrvMs: healthData.hrv || prev.hrvMs,
      isFromGoogleHealth: true,
      lastSyncedAt: healthData.syncedAt,
    }));

    setLastGoogleFitSyncTime(healthData.syncedAt);
    setIsGoogleFitConnectedState(true);

    if (notifyCoach) {
      const timeStr = new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
      setLineMessages((prev) => [
        ...prev,
        {
          id: `gfit-sync-${Date.now()}`,
          sender: "coach",
          text: `👟 ดึงข้อมูล Google Fit สำเร็จ!\n• ก้าวเดินวันนี้: ${healthData.steps.toLocaleString()} ก้าว\n• เผาผลาญแอคทีฟ: ${activeCalories} kcal\n• ระยะทาง: ${healthData.distanceKm} กม.\n\nโค้ชอัปเดตสถิติลงในแดชบอร์ดและโปรไฟล์ของคุณ ${profile.name} เรียบร้อยแล้วครับ! 📈🔥`,
          timestamp: timeStr,
        },
      ]);
    }
  };

  const handleConnectGoogleFit = async () => {
    setIsSyncingGoogleFit(true);
    try {
      await requestGoogleFitAccessToken();
      const data = await fetchGoogleFitHealthData();
      handleApplyGoogleHealthData(data, true);
    } catch (err: any) {
      console.warn("Google Fit OAuth flow or modal opened:", err);
      setIsGoogleHealthOpen(true);
    } finally {
      setIsSyncingGoogleFit(false);
      setIsGoogleFitConnectedState(isGoogleFitConnected());
    }
  };

  const handleSyncGoogleFit = async () => {
    setIsSyncingGoogleFit(true);
    try {
      const data = await fetchGoogleFitHealthData();
      handleApplyGoogleHealthData(data, true);
    } catch (err: any) {
      console.error("Google Fit sync error:", err);
      setIsGoogleHealthOpen(true);
    } finally {
      setIsSyncingGoogleFit(false);
      setIsGoogleFitConnectedState(isGoogleFitConnected());
    }
  };

  const handleDisconnectGoogleFit = () => {
    disconnectGoogleFit();
    setIsGoogleFitConnectedState(false);
    setLastGoogleFitSyncTime(null);
    setActivity((prev) => ({
      ...prev,
      isFromGoogleHealth: false,
    }));
    setRecovery((prev) => ({
      ...prev,
      isFromGoogleHealth: false,
    }));
  };

  // Automatic Background Sync on Mount & Tab Visibility
  useEffect(() => {
    const triggerAutoSync = async () => {
      if (isGoogleFitConnected()) {
        try {
          const data = await autoSyncGoogleFitIfConnected();
          if (data) {
            handleApplyGoogleHealthData(data, false);
          }
        } catch (e) {
          console.warn("Auto-sync background check:", e);
        }
      }
    };

    triggerAutoSync();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isGoogleFitConnected()) {
        triggerAutoSync();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Handle URL Query Params (e.g. from LIFF redirect ?view=workout)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get("view");
    if (view === "workout") setIsWorkoutModalOpen(true);
    else if (view === "nutrition") setIsNutritionModalOpen(true);
    else if (view === "recovery") setIsRecoveryModalOpen(true);
    else if (view === "plan3months") setIsPlan3MonthsOpen(true);
    else if (view === "adapt") setIsAdaptiveModalOpen(true);
    else if (view === "report") setIsWeeklyReportOpen(true);
    else if (view === "chat") setIsLineChatOpen(true);
  }, []);

  // Handlers
  const handleCompleteWorkout = () => {
    // Award 150 XP and increment workout count
    setStatus((prev) => {
      const currentExp = prev.xp || prev.currentExp || 0;
      const nextExp = currentExp + 150;
      let level = prev.level || prev.currentLevel || 1;
      let nextLevelExp = prev.nextLevelXp || prev.nextLevelExp || 2000;
      if (nextExp >= nextLevelExp) {
        level += 1;
        nextLevelExp += 1000;
      }
      return {
        ...prev,
        xp: nextExp,
        currentExp: nextExp,
        level,
        currentLevel: level,
        nextLevelXp: nextLevelExp,
        nextLevelExp,
        streakDays: (prev.streakDays || 0) + 1,
        totalWorkoutsCompleted: (prev.totalWorkoutsCompleted || 0) + 1,
        totalCaloriesBurned: (prev.totalCaloriesBurned || 0) + (workout.days?.[0]?.estimatedCalories || 320),
      };
    });

    // Mark current day completed
    setWorkout((prev) => {
      const updatedDays = [...(prev.days || [])];
      if (updatedDays[0]) updatedDays[0] = { ...updatedDays[0], isCompleted: true };
      return { ...prev, isCompleted: true, days: updatedDays };
    });

    // Add celebration message to LINE chat
    const timeStr = new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
    setLineMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        sender: "coach",
        text: `🎉 ยอดเยี่ยมมากครับคุณ ${profile.name}! ซ้อมจบเซสชันวันนี้เรียบร้อยแล้ว โค้ชบันทึก +150 XP ให้แล้วครับ อย่าลืมทานโปรตีนให้ถึงเป้าหมายและยืดกล้ามเนื้อนะครับ! 💪`,
        timestamp: timeStr,
      },
    ]);
  };

  const handleAddMeal = (meal: MealItem) => {
    setNutrition((prev) => {
      const updatedMeals = [meal, ...prev.meals];
      const newCalories = prev.currentCalories + meal.calories;
      const newProtein = prev.currentProtein + meal.protein;
      const newCarbs = prev.currentCarbs + meal.carbs;
      const newFat = prev.currentFat + meal.fat;
      return {
        ...prev,
        currentCalories: newCalories,
        currentProtein: newProtein,
        currentCarbs: newCarbs,
        currentFat: newFat,
        meals: updatedMeals,
      };
    });

    // Award small XP for tracking
    setStatus((prev) => {
      const currentExp = prev.xp || prev.currentExp || 0;
      return {
        ...prev,
        xp: currentExp + 30,
        currentExp: currentExp + 30,
      };
    });
  };

  const handleUpdateRecovery = (updated: Partial<RecoveryData>) => {
    setRecovery((prev) => {
      const next = { ...prev, ...updated };
      // Recalculate readiness score
      const sleepBonus = ((next.sleepHours || 7) / 8) * 40;
      const qualityBonus = ((next.sleepQualityScore || next.score || 80) / 100) * 40;
      const fatigueDeduction = ((next.rpeScore || 5) / 10) * 20;
      const newScore = Math.min(100, Math.max(20, Math.round(sleepBonus + qualityBonus - fatigueDeduction + 10)));
      return { ...next, score: newScore, readinessScore: newScore };
    });
  };

  const handleSendMessageToLineBot = async (text: string) => {
    const timeStr = new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
    const userMsg: LineMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      timestamp: timeStr,
    };
    setLineMessages((prev) => [...prev, userMsg]);

    // Request AI response from server or fallback
    try {
      const res = await fetch("/api/coach/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          userProfile: profile,
          workout,
          nutrition,
          recovery,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const replyText = data.reply || "โค้ชได้รับข้อมูลแล้วครับ ฟอร์มและเป้าหมายของคุณพัฒนาขึ้นเรื่อยๆ เลย!";
        setLineMessages((prev) => [
          ...prev,
          {
            id: `coach-${Date.now()}`,
            sender: "coach",
            text: replyText,
            timestamp: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
        return;
      }
    } catch (e) {
      // serverless or offline fallback
    }

    // Smart fallback AI reply in client mode
    setTimeout(() => {
      let reply = `รับทราบครับคุณ ${profile.name}! โค้ชประเมินจากตารางวันนี้ให้แล้วครับ`;
      const lower = text.toLowerCase();
      const currentReadiness = recovery.readinessScore ?? recovery.score ?? 85;
      const days = workout.days || [];

      if (lower.includes("กิน") || lower.includes("ข้าว") || lower.includes("แคล") || lower.includes("อาหาร")) {
        reply = `สำหรับโภชนาการวันนี้ คุณ ${profile.name} ทานไปแล้ว ${nutrition.currentCalories} kcal (โปรตีน ${nutrition.currentProtein}g จากเป้า ${nutrition.targetProtein}g)\n\nคำแนะนำ: มื้อถัดไปเน้นโปรตีนไขมันต่ำ เช่น อกไก่ หรือไข่ต้ม เพื่อรักษามวลกล้ามเนื้อและหุ่น V-Taper ครับ! 🍗🥗`;
      } else if (lower.includes("ล้า") || lower.includes("นอน") || lower.includes("เหนื่อย") || lower.includes("ปรับ")) {
        reply = `เข้าใจเลยครับ! ความพร้อมซ้อมวันนี้ (Readiness) อยู่ที่ ${currentReadiness}/100\n\nถ้าล้ามาก โค้ชแนะนำลดจำนวนเซ็ตลง 1 เซ็ตต่อท่า หรือเปลี่ยนเป็นฝึกแบบ Tempo ช้าๆ ไม่ต้องฝืนยกหนักจนเสียฟอร์มนะครับ การฟื้นตัวสำคัญเท่ากับการซ้อมครับ! 🌙💤`;
      } else if (lower.includes("ซ้อม") || lower.includes("ตาราง") || lower.includes("ออกกำลัง")) {
        reply = `ตารางวันนี้คือ "${days[0]?.focus || "V-Taper Chest & Back"}" รวม ${days[0]?.exercises.length || 4} ท่าซ้อม ใช้เวลาราว 45 นาที\n\nเตรียมพร้อมขวดน้ำ แล้วกดปุ่ม "เริ่มซ้อมตอนนี้" ในแอปได้เลยครับ! 🏋️‍♂️🔥`;
      } else if (lower.includes("3 เดือน") || lower.includes("แผน")) {
        reply = `แผน Transformation 3 เดือนของคุณ ${profile.name}:\n• เดือนที่ 1: Hypertrophy ปูฐานกล้ามเนื้อมัดหลัก\n• เดือนที่ 2: Overload & V-Taper ดึงกล้ามไหล่ข้างและปีกหลัง\n• เดือนที่ 3: Caloric Deficit & Peak ลีนรีดไขมันหน้าท้อง\n\nสู้ไปด้วยกันนะครับ มีผลลัพธ์ที่ยอดเยี่ยมแน่นอน! 🎯`;
      }

      setLineMessages((prev) => [
        ...prev,
        {
          id: `coach-${Date.now()}`,
          sender: "coach",
          text: reply,
          timestamp: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }, 600);
  };

  const handleApplyAdaptiveWorkout = (newPlan: WorkoutPlan) => {
    setWorkout(newPlan);
    const timeStr = new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
    setLineMessages((prev) => [
      ...prev,
      {
        id: `coach-${Date.now()}`,
        sender: "coach",
        text: `⚡ โค้ชได้ปรับตารางซ้อมให้เหมาะสมกับสภาพร่างกายปัจจุบันของคุณ ${profile.name} เรียบร้อยแล้วครับ! ลดความเสี่ยงการบาดเจ็บและยังคงกระตุ้นกล้ามเนื้อได้อย่างมีประสิทธิภาพครับ`,
        timestamp: timeStr,
      },
    ]);
  };

  // Render Alternate Views (Landing / Login)
  if (viewMode === "landing") {
    return (
      <LandingView
        onStartOnboarding={() => setViewMode("app")}
        onLoginClick={() => setViewMode("login")}
      />
    );
  }

  if (viewMode === "login") {
    return (
      <LoginView
        onLoginSuccess={(u) => {
          setProfile((prev) => ({
            ...prev,
            userId: u.userId,
            name: u.displayName,
            pictureUrl: u.pictureUrl || prev.pictureUrl,
          }));
          setViewMode("app");
        }}
        onContinueAsGuest={() => setViewMode("app")}
      />
    );
  }

  // Active Main App View
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col justify-between font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Header */}
      <Header
        profile={profile}
        onOpenChat={() => setIsLineChatOpen(true)}
        onOpenGoogleHealth={() => setIsGoogleHealthOpen(true)}
        onOpenRichMenuStudio={() => setIsRichMenuStudioOpen(true)}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        onToggleRichMenuDrawer={() => setShowRichMenuDrawer((prev) => !prev)}
        isInstallable={isInstallable}
        onInstallPWA={install}
      />

      {/* Main Scrollable Content */}
      <main className="flex-1 max-w-xl mx-auto w-full px-4 pt-4 pb-24">
        {currentTab === "today" && (
          <HomeView
            profile={profile}
            workout={workout}
            nutrition={nutrition}
            recovery={recovery}
            activity={activity}
            status={status}
            isGoogleFitConnected={isGoogleFitConnectedState}
            onConnectGoogleFit={handleConnectGoogleFit}
            onSyncGoogleFit={handleSyncGoogleFit}
            isSyncingGoogleFit={isSyncingGoogleFit}
            lastGoogleFitSyncTime={lastGoogleFitSyncTime}
            onOpenWorkout={() => setIsWorkoutModalOpen(true)}
            onOpenNutrition={() => setIsNutritionModalOpen(true)}
            onOpenRecovery={() => setIsRecoveryModalOpen(true)}
            onOpenAdapt={() => setIsAdaptiveModalOpen(true)}
            onOpenPlan3Months={() => setIsPlan3MonthsOpen(true)}
            onOpenLine={() => setIsLineChatOpen(true)}
            onOpenGoogleHealth={() => setIsGoogleHealthOpen(true)}
            onOpenRichMenuStudio={() => setIsRichMenuStudioOpen(true)}
          />
        )}

        {currentTab === "plan" && (
          <PlanView
            workout={workout}
            onSelectDay={(dayId) => {
              // open workout modal for that day
              setIsWorkoutModalOpen(true);
            }}
            onOpenAdaptiveModal={() => setIsAdaptiveModalOpen(true)}
            onOpenPlan3Months={() => setIsPlan3MonthsOpen(true)}
          />
        )}

        {currentTab === "status" && (
          <StatusView
            status={status}
            profile={profile}
            onOpenReportModal={() => setIsWeeklyReportOpen(true)}
          />
        )}

        {currentTab === "profile" && (
          <ProfileView
            profile={profile}
            status={status}
            activity={activity}
            isGoogleFitConnected={isGoogleFitConnectedState}
            onConnectGoogleFit={handleConnectGoogleFit}
            onSyncGoogleFit={handleSyncGoogleFit}
            onDisconnectGoogleFit={handleDisconnectGoogleFit}
            isSyncingGoogleFit={isSyncingGoogleFit}
            lastGoogleFitSyncTime={lastGoogleFitSyncTime}
            onEditProfile={() => setIsOnboardingOpen(true)}
            onOpenGoogleHealth={() => setIsGoogleHealthOpen(true)}
            onOpenRichMenuStudio={() => setIsRichMenuStudioOpen(true)}
            onLogout={() => setViewMode("landing")}
            isInstallable={isInstallable}
            onInstallPWA={install}
          />
        )}
      </main>

      {/* Slide-Up LINE Rich Menu Drawer (Simulating LINE OA Rich Menu spec) */}
      {showRichMenuDrawer && (
        <div className="fixed bottom-16 left-0 right-0 z-40 max-w-xl mx-auto animate-in slide-in-from-bottom duration-200">
          <LineRichMenu
            onOpenWorkout={() => {
              setIsWorkoutModalOpen(true);
              setShowRichMenuDrawer(false);
            }}
            onOpenNutrition={() => {
              setIsNutritionModalOpen(true);
              setShowRichMenuDrawer(false);
            }}
            onOpenRecovery={() => {
              setIsRecoveryModalOpen(true);
              setShowRichMenuDrawer(false);
            }}
            onOpenPlan3Months={() => {
              setIsPlan3MonthsOpen(true);
              setShowRichMenuDrawer(false);
            }}
            onOpenAdaptWorkout={() => {
              setIsAdaptiveModalOpen(true);
              setShowRichMenuDrawer(false);
            }}
            onOpenWeeklyReport={() => {
              setIsWeeklyReportOpen(true);
              setShowRichMenuDrawer(false);
            }}
            onOpenLineChat={() => {
              setIsLineChatOpen(true);
              setShowRichMenuDrawer(false);
            }}
            onOpenGoogleHealth={() => {
              setIsGoogleHealthOpen(true);
              setShowRichMenuDrawer(false);
            }}
          />
        </div>
      )}

      {/* Fixed Bottom Navigation */}
      <Navigation
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenPlan3Months={() => setIsPlan3MonthsOpen(true)}
      />

      {/* Modals Collection */}
      <WorkoutModal
        isOpen={isWorkoutModalOpen}
        onClose={() => setIsWorkoutModalOpen(false)}
        day={workout.days?.[0] || initialWorkoutPlan.days?.[0] || initialWorkoutDays[0]}
        onCompleteWorkout={handleCompleteWorkout}
      />

      <NutritionModal
        isOpen={isNutritionModalOpen}
        onClose={() => setIsNutritionModalOpen(false)}
        nutrition={nutrition}
        onAddMeal={handleAddMeal}
      />

      <RecoveryModal
        isOpen={isRecoveryModalOpen}
        onClose={() => setIsRecoveryModalOpen(false)}
        recovery={recovery}
        onUpdateRecovery={handleUpdateRecovery}
      />

      <AdaptiveWorkoutModal
        isOpen={isAdaptiveModalOpen}
        onClose={() => setIsAdaptiveModalOpen(false)}
        currentWorkout={workout}
        onApplyAdaptedWorkout={handleApplyAdaptiveWorkout}
      />

      <Plan3MonthsModal
        isOpen={isPlan3MonthsOpen}
        onClose={() => setIsPlan3MonthsOpen(false)}
        profile={profile}
        currentWorkout={workout}
      />

      <WeeklyReportModal
        isOpen={isWeeklyReportOpen}
        onClose={() => setIsWeeklyReportOpen(false)}
        status={status}
        profile={profile}
      />

      <LineBotChatModal
        isOpen={isLineChatOpen}
        onClose={() => setIsLineChatOpen(false)}
        messages={lineMessages}
        onSendMessage={handleSendMessageToLineBot}
        profile={profile}
        workout={workout}
        nutrition={nutrition}
        recovery={recovery}
      />

      <LineRichMenuStudioModal
        isOpen={isRichMenuStudioOpen}
        onClose={() => setIsRichMenuStudioOpen(false)}
      />

      <GoogleHealthModal
        isOpen={isGoogleHealthOpen}
        onClose={() => {
          setIsGoogleHealthOpen(false);
          setIsGoogleFitConnectedState(isGoogleFitConnected());
          setLastGoogleFitSyncTime(getLastGoogleFitSyncTime());
        }}
        onSyncComplete={(data) => {
          handleApplyGoogleHealthData(data, true);
        }}
        onSyncGoogleFit={(data) => {
          handleApplyGoogleHealthData(data, true);
        }}
      />

      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        currentProfile={profile}
        onSaveProfile={(updated) => {
          setProfile(updated);
        }}
      />
    </div>
  );
}
