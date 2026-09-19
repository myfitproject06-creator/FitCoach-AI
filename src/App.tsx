import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { Navigation, NavTab } from "./components/Navigation";
import { HomeView } from "./components/HomeView";
import { PlanView } from "./components/PlanView";
import { StatusRadarView } from "./components/StatusRadarView";
import { ProfileView, SessionUserInfo } from "./components/ProfileView";
import { LandingView } from "./components/LandingView";
import { LoginView } from "./components/LoginView";

// Modals
import { WorkoutModal } from "./components/WorkoutModal";
import { AdaptiveWorkoutModal } from "./components/AdaptiveWorkoutModal";
import { NutritionModal } from "./components/NutritionModal";
import { RecoveryModal } from "./components/RecoveryModal";
import { LineBotChatModal } from "./components/LineBotChatModal";
import { LineRichMenuStudioModal } from "./components/LineRichMenuStudioModal";
import { GoogleHealthModal } from "./components/GoogleHealthModal";
import { OnboardingModal } from "./components/OnboardingModal";
import { PlanGenerationModal } from "./components/PlanGenerationModal";
import { WeeklyReportModal } from "./components/WeeklyReportModal";
import { Plan3MonthsModal } from "./components/Plan3MonthsModal";

// Data & Types
import {
  initialProfile,
  initialTodayWorkout,
  initialNutrition,
  initialRecovery,
  initialActivity,
  initialFitnessStatus,
  initialAccountability,
} from "./data/mockData";
import {
  UserProfile,
  WorkoutPlan,
  NutritionData,
  RecoveryData,
  ActivityData,
  FitnessStatus,
  CoachAccountabilityState,
  ChatMessage,
  MealItem,
  WeeklyReport,
} from "./types";
import { GoogleHealthData, isGoogleFitAuthenticated } from "./services/googleFitService";

const DATA_VERSION = "fitcoach_v2_clean";

const STORAGE_KEYS = {
  VERSION: "fitcoach_data_version",
  PROFILE: "fitcoach_user_profile",
  WORKOUT: "fitcoach_current_workout",
  NUTRITION: "fitcoach_nutrition",
  RECOVERY: "fitcoach_recovery",
  ACTIVITY: "fitcoach_activity",
  STATUS: "fitcoach_status",
  ACCOUNTABILITY: "fitcoach_accountability",
  MESSAGES: "fitcoach_chat_messages",
};

export default function App() {
  // Session & LINE Authentication state
  const [sessionUser, setSessionUser] = useState<SessionUserInfo | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [isGuestMode, setIsGuestMode] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Navigation & Screen states
  const [showLanding, setShowLanding] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<NavTab>("home");

  // Core App State with localStorage caching
  const [profile, setProfile] = useState<UserProfile>(() => {
    const v = localStorage.getItem(STORAGE_KEYS.VERSION);
    if (v !== DATA_VERSION) return initialProfile;
    const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
    return saved ? JSON.parse(saved) : initialProfile;
  });

  const [workout, setWorkout] = useState<WorkoutPlan>(() => {
    const v = localStorage.getItem(STORAGE_KEYS.VERSION);
    if (v !== DATA_VERSION) return initialTodayWorkout;
    const saved = localStorage.getItem(STORAGE_KEYS.WORKOUT);
    return saved ? JSON.parse(saved) : initialTodayWorkout;
  });

  const [nutrition, setNutrition] = useState<NutritionData>(() => {
    const v = localStorage.getItem(STORAGE_KEYS.VERSION);
    if (v !== DATA_VERSION) return initialNutrition;
    const saved = localStorage.getItem(STORAGE_KEYS.NUTRITION);
    return saved ? JSON.parse(saved) : initialNutrition;
  });

  const [recovery, setRecovery] = useState<RecoveryData>(() => {
    const v = localStorage.getItem(STORAGE_KEYS.VERSION);
    if (v !== DATA_VERSION) return initialRecovery;
    const saved = localStorage.getItem(STORAGE_KEYS.RECOVERY);
    return saved ? JSON.parse(saved) : initialRecovery;
  });

  const [activity, setActivity] = useState<ActivityData>(() => {
    const v = localStorage.getItem(STORAGE_KEYS.VERSION);
    if (v !== DATA_VERSION) return initialActivity;
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVITY);
    return saved ? JSON.parse(saved) : initialActivity;
  });

  const [status, setStatus] = useState<FitnessStatus>(() => {
    const v = localStorage.getItem(STORAGE_KEYS.VERSION);
    if (v !== DATA_VERSION) return initialFitnessStatus;
    const saved = localStorage.getItem(STORAGE_KEYS.STATUS);
    return saved ? JSON.parse(saved) : initialFitnessStatus;
  });

  const [accountability, setAccountability] = useState<CoachAccountabilityState>(() => {
    const v = localStorage.getItem(STORAGE_KEYS.VERSION);
    if (v !== DATA_VERSION) return initialAccountability;
    const saved = localStorage.getItem(STORAGE_KEYS.ACCOUNTABILITY);
    return saved ? JSON.parse(saved) : initialAccountability;
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const v = localStorage.getItem(STORAGE_KEYS.VERSION);
    if (v !== DATA_VERSION) {
      return [
        {
          id: "msg-init-1",
          sender: "bot",
          text: "สวัสดีครับ! ผมคือ FitCoach AI โค้ชส่วนตัวของคุณ 🎯\n\nยินดีต้อนรับเข้าสู่ระบบฟิตเนสส่วนบุคคล สามารถเริ่มต้นด้วยการทำแบบสอบถามโปรไฟล์ หรือพิมพ์สอบถามผมได้ตลอดเวลาครับ!",
          timestamp: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
          quickReplies: ["ตั้งค่าโปรไฟล์", "แนะนำการออกกำลังกาย", "คำนวณแคลอรี่อาหาร"],
        },
      ];
    }
    const saved = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    if (saved) return JSON.parse(saved);
    return [
      {
        id: "msg-init-1",
        sender: "bot",
        text: "สวัสดีครับ! ผมคือ FitCoach AI โค้ชส่วนตัวของคุณ 🎯\n\nยินดีต้อนรับเข้าสู่ระบบฟิตเนสส่วนบุคคล สามารถเริ่มต้นด้วยการทำแบบสอบถามโปรไฟล์ หรือพิมพ์สอบถามผมได้ตลอดเวลาครับ!",
        timestamp: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
        quickReplies: ["ตั้งค่าโปรไฟล์", "แนะนำการออกกำลังกาย", "คำนวณแคลอรี่อาหาร"],
      },
    ];
  });

  // Modal open states
  const [isWorkoutOpen, setIsWorkoutOpen] = useState(false);
  const [isAdaptOpen, setIsAdaptOpen] = useState(false);
  const [isNutritionOpen, setIsNutritionOpen] = useState(false);
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const [isLineBotOpen, setIsLineBotOpen] = useState(false);
  const [isRichMenuStudioOpen, setIsRichMenuStudioOpen] = useState(false);
  const [isGoogleHealthOpen, setIsGoogleHealthOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isPlanGenOpen, setIsPlanGenOpen] = useState(false);
  const [isWeeklyReportOpen, setIsWeeklyReportOpen] = useState(false);
  const [isPlan3MonthsOpen, setIsPlan3MonthsOpen] = useState(false);

  // ตรวจสอบเซสชันและการเข้าสู่ระบบ และดึงข้อมูลผู้ใช้บนเซิร์ฟเวอร์
  useEffect(() => {
    // 1. จัดการพารามิเตอร์ URL จากการ Redirect กลับมาจาก LINE OAuth
    const urlParams = new URLSearchParams(window.location.search);
    const errParam = urlParams.get("login_error");
    const successParam = urlParams.get("login");

    if (errParam) {
      if (errParam === "invalid_state") {
        setLoginError("เซสชันการเข้าสู่ระบบหมดอายุ กรุณาลองใหม่อีกครั้ง");
      } else if (errParam === "token_exchange_failed") {
        setLoginError("ไม่สามารถแลกรับรหัสยืนยันจาก LINE ได้ กรุณาตรวจสอบ Channel Secret ใน Render");
      } else {
        setLoginError(`เกิดข้อผิดพลาดในการเชื่อมต่อ LINE: ${decodeURIComponent(errParam)}`);
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (successParam) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // 2. เรียก API /api/me เพื่อตรวจเซสชันฝั่งเซิร์ฟเวอร์
    const checkAuthStatus = async () => {
      try {
        const res = await fetch("/api/me");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setSessionUser(data.user);

            // ดึงข้อมูลฟิตเนสของผู้ใช้จากเซิร์ฟเวอร์
            try {
              const userRes = await fetch("/api/user/data");
              if (userRes.ok) {
                const userJson = await userRes.json();
                const serverData = userJson.data;

                if (serverData?.profile?.name) {
                  // มีข้อมูลบนเซิร์ฟเวอร์แล้ว ให้โหลดลง state
                  setProfile(serverData.profile);
                  if (serverData.workout) setWorkout(serverData.workout);
                  if (serverData.nutrition) setNutrition(serverData.nutrition);
                  if (serverData.recovery) setRecovery(serverData.recovery);
                  if (serverData.activity) setActivity(serverData.activity);
                  if (serverData.status) setStatus(serverData.status);
                  if (serverData.accountability) setAccountability(serverData.accountability);
                  if (serverData.messages) setMessages(serverData.messages);
                } else {
                  // หากเซิร์ฟเวอร์ยังไม่มีข้อมูล แต่ใน localStorage มีข้อมูลอยู่ (กรณีเคยทดลองใช้งาน) ให้ย้ายขึ้นเซิร์ฟเวอร์
                  const localProfileStr = localStorage.getItem(STORAGE_KEYS.PROFILE);
                  const parsedLocalProfile = localProfileStr ? JSON.parse(localProfileStr) : null;

                  if (parsedLocalProfile?.name) {
                    await fetch("/api/user/migrate", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        profile: parsedLocalProfile,
                        workout,
                        nutrition,
                        recovery,
                        activity,
                        status,
                        accountability,
                      }),
                    });
                  } else {
                    // ผู้ใช้ใหม่ที่ยังไม่มีโปรไฟล์ฟิตเนส ให้เข้า Onboarding ทันที
                    setIsOnboardingOpen(true);
                  }
                }
              }
            } catch (err) {
              console.warn("ไม่สามารถดึงข้อมูลผู้ใช้จากเซิร์ฟเวอร์ได้:", err);
            }
          }
        }
      } catch (err) {
        console.warn("ตรวจสอบ session ล้มเหลว:", err);
      } finally {
        setIsAuthChecking(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Sync states to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VERSION, DATA_VERSION);
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WORKOUT, JSON.stringify(workout));
  }, [workout]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NUTRITION, JSON.stringify(nutrition));
  }, [nutrition]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RECOVERY, JSON.stringify(recovery));
  }, [recovery]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(activity));
  }, [activity]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STATUS, JSON.stringify(status));
  }, [status]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTABILITY, JSON.stringify(accountability));
  }, [accountability]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
  }, [messages]);

  // ซิงค์ข้อมูลขึ้นเซิร์ฟเวอร์อัตโนมัติเมื่อผู้ใช้เข้าสู่ระบบด้วย LINE
  useEffect(() => {
    if (!sessionUser?.userId) return;
    const timer = setTimeout(() => {
      fetch("/api/user/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          workout,
          nutrition,
          recovery,
          activity,
          status,
          accountability,
          messages,
        }),
      }).catch((e) => console.warn("Auto-sync to server error:", e));
    }, 1200);

    return () => clearTimeout(timer);
  }, [sessionUser?.userId, profile, workout, nutrition, recovery, activity, status, accountability, messages]);

  // ฟังก์ชันออกจากระบบ LINE
  const handleLogout = async () => {
    try {
      await fetch("/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout error:", e);
    }
    setSessionUser(null);
    setIsGuestMode(false);
  };

  // Workout completion handler
  const handleCompleteWorkout = () => {
    const updatedWorkout: WorkoutPlan = {
      ...workout,
      isCompleted: true,
    };
    setWorkout(updatedWorkout);

    // Reward XP & Level check
    const xpBonus = 150;
    const newXp = status.xp + xpBonus;
    let newLevel = status.level;
    let newNextLevelXp = status.nextLevelXp;

    if (newXp >= status.nextLevelXp) {
      newLevel += 1;
      newNextLevelXp += 250;
    }

    const updatedStatus: FitnessStatus = {
      ...status,
      xp: newXp,
      level: newLevel,
      nextLevelXp: newNextLevelXp,
      strength: Math.min(100, status.strength + 2),
      trainingMomentum: Math.min(100, status.trainingMomentum + 5),
      momentumDays: status.momentumDays + 1,
      streakDays: (status.streakDays || status.momentumDays) + 1,
      programAdherence: Math.min(100, status.programAdherence + 2),
    };
    setStatus(updatedStatus);

    // Update Activity
    setActivity((prev) => ({
      ...prev,
      activeMinutes: prev.activeMinutes + workout.durationMinutes,
      caloriesExpended: (prev.caloriesExpended || 0) + 320,
    }));

    // Update accountability
    setAccountability((prev) => ({
      ...prev,
      status: "on_track",
      strikes: 0,
      penaltyActive: false,
      lastReminderType: "workout_time",
      lastReminderText: "พิชิตเซสชั่นการฝึกเรียบร้อย! 🎉",
    }));

    // Add Coach congratulation message in LINE Bot
    const userName = profile.name ? `คุณ ${profile.name}` : "คุณ";
    const congratsMsg: ChatMessage = {
      id: `bot-${Date.now()}`,
      sender: "bot",
      text: `ยอดเยี่ยมมากครับ ${userName}! 🏆 บันทึกการฝึก ${workout.titleTh || workout.title} สำเร็จเรียบร้อย\n\n✨ รับ +${xpBonus} XP (Level ${newLevel})\n🔥 เผาผลาญประมาณ 320 kcal\n💪 รักษาความต่อเนื่อง (Streak) ได้ ${updatedStatus.momentumDays} วันแล้วครับ อย่าลืมเติมสารอาหารและโปรตีนหลังฝึกนะครับ!`,
      timestamp: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
      quickReplies: ["บันทึกมื้อหลังซ้อม", "ดูสรุปผลความก้าวหน้า", "ขอบคุณครับโค้ช"],
    };
    setMessages((prev) => [...prev, congratsMsg]);
  };

  // Adaptive Workout handler
  const handleApplyAdaptedWorkout = (adaptedPlan: WorkoutPlan) => {
    setWorkout(adaptedPlan);
    setIsAdaptOpen(false);

    const adaptMsg: ChatMessage = {
      id: `bot-adapt-${Date.now()}`,
      sender: "bot",
      text: `โค้ชปรับโปรแกรมวันนี้เรียบร้อยแล้วครับ: **${adaptedPlan.titleTh || adaptedPlan.title}**\n\n📌 เหตุผล: ${adaptedPlan.adaptationReason || "ปรับตามระดับความพร้อมและสภาพร่างกาย"}\n⏱️ ระยะเวลา: ${adaptedPlan.durationMinutes} นาที\n⚡ ระดับความหนัก: ${adaptedPlan.intensity}\n\nเมื่อพร้อมแล้ว กดเริ่มซ้อมได้เลยครับ!`,
      timestamp: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
      quickReplies: ["เริ่มซ้อมโปรแกรมที่ปรับแล้ว", "ดูรายละเอียดท่า", "เปิดเมนูโค้ช"],
    };
    setMessages((prev) => [...prev, adaptMsg]);
  };

  // Nutrition meal add handler
  const handleAddMeal = (meal: MealItem) => {
    const updatedMeals = [meal, ...nutrition.meals];
    const newCalories = nutrition.currentCalories + meal.calories;
    const newProtein = nutrition.currentProtein + meal.protein;
    const newCarbs = nutrition.currentCarbs + meal.carbs;
    const newFat = nutrition.currentFat + meal.fat;

    setNutrition({
      ...nutrition,
      meals: updatedMeals,
      currentCalories: newCalories,
      currentProtein: newProtein,
      currentCarbs: newCarbs,
      currentFat: newFat,
    });

    const mealMsg: ChatMessage = {
      id: `bot-meal-${Date.now()}`,
      sender: "bot",
      text: `บันทึกอาหารแล้วครับ 🍽️ **${meal.name}**\n\n📊 พลังงาน: ${meal.calories} kcal\n🥩 โปรตีน: ${meal.protein}g | 🍞 คาร์บ: ${meal.carbs}g | 🥑 ไขมัน: ${meal.fat}g\n\nรวมวันนี้: ${newCalories} / ${nutrition.targetCalories} kcal (โปรตีน ${newProtein} / ${nutrition.targetProtein}g)`,
      timestamp: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
      quickReplies: ["บันทึกมื้อถัดไป", "ตรวจเช็คสารอาหารวันนี้", "เมนูแนะนำ"],
    };
    setMessages((prev) => [...prev, mealMsg]);
  };

  // Recovery update handler
  const handleUpdateRecovery = (sleepHours: number, sleepMinutes: number) => {
    const totalHours = sleepHours + sleepMinutes / 60;
    let score = Math.min(98, Math.round((totalHours / 8) * 85 + 10));
    let quality: "ยอดเยี่ยม" | "ดี" | "ปานกลาง" | "ต้องปรับปรุง" = "ดี";

    if (totalHours >= 7.5) quality = "ยอดเยี่ยม";
    else if (totalHours >= 6.5) quality = "ดี";
    else if (totalHours >= 5.5) quality = "ปานกลาง";
    else quality = "ต้องปรับปรุง";

    setRecovery((prev) => ({
      ...prev,
      sleepHours,
      sleepMinutes,
      score,
      quality,
      coachInsight: `บันทึกการนอน ${sleepHours} ชม. ${sleepMinutes} นาที ร่างกายฟื้นตัว ${score}%`,
    }));

    // Recalculate Condition score
    const newCondition = Math.min(99, Math.round(score * 0.7 + status.vitality * 0.3));
    setStatus((prev) => ({
      ...prev,
      condition: newCondition,
      recovery: score,
      conditionLabel: newCondition >= 80 ? "พร้อมซ้อมหนัก (Optimal)" : newCondition >= 65 ? "พร้อมระดับปานกลาง" : "แนะนำซ้อมเบาหรือฟื้นฟู",
    }));
  };

  // Google Health Sync Complete handler
  const handleSyncHealthComplete = (healthData: GoogleHealthData) => {
    setActivity((prev) => ({
      ...prev,
      currentSteps: healthData.steps,
      distanceKm: healthData.distanceKm,
      activeMinutes: healthData.activeMinutes,
      caloriesExpended: healthData.caloriesBurned,
      isFromGoogleHealth: true,
      lastSyncedAt: healthData.syncedAt,
    }));

    if (healthData.sleepHours > 0) {
      handleUpdateRecovery(healthData.sleepHours, healthData.sleepMinutes);
      setRecovery((prev) => ({
        ...prev,
        sleepStart: healthData.sleepStart,
        sleepEnd: healthData.sleepEnd,
        isFromGoogleHealth: true,
        lastSyncedAt: healthData.syncedAt,
      }));
    }

    const healthMsg: ChatMessage = {
      id: `bot-health-${Date.now()}`,
      sender: "bot",
      text: `ซิงค์ข้อมูลสุขภาพจาก Google Fit สำเร็จแล้วครับ ⌚\n\n🚶‍♂️ ก้าวเดิน: ${healthData.steps.toLocaleString()} ก้าว (${healthData.distanceKm} กม.)\n🔥 เผาผลาญ: ${healthData.caloriesBurned} kcal\n⏱️ เวลาเคลื่อนไหว: ${healthData.activeMinutes} นาที\n😴 การนอน: ${healthData.sleepHours} ชม. ${healthData.sleepMinutes} นาที`,
      timestamp: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
      quickReplies: ["ดูเรดาร์ประเมินร่างกาย", "เริ่มซ้อมตามแผนวันนี้", "ขอบคุณครับ"],
    };
    setMessages((prev) => [...prev, healthMsg]);
  };

  // Onboarding complete handler
  const handleOnboardingComplete = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    setIsOnboardingOpen(false);
    // Automatically trigger AI Plan Generation for the new profile
    setIsPlanGenOpen(true);
  };

  // Personalized Plan generated handler
  const handlePlanGenerated = (newPlan: WorkoutPlan) => {
    setWorkout(newPlan);
    setIsPlanGenOpen(false);
    setCurrentTab("plan");

    const newPlanMsg: ChatMessage = {
      id: `bot-plan-${Date.now()}`,
      sender: "bot",
      text: `สร้างโปรแกรมการฝึกใหม่เฉพาะบุคคลเสร็จสมบูรณ์แล้วครับ! 📋\n\n🏋️‍♂️ **${newPlan.titleTh || newPlan.title}**\n⏱️ ระยะเวลา: ${newPlan.durationMinutes} นาที | ความเข้มข้น: ${newPlan.intensity}\n🎯 ท่าฝึก: ${newPlan.exercises.length} ท่า (Compound & Isolation)\n\nระบบจัดตารางให้สอดคล้องกับเป้าหมาย ${profile.primaryGoal || profile.goal} ของคุณเรียบร้อยครับ!`,
      timestamp: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
      quickReplies: ["ดูโปรแกรมการฝึก", "เริ่มซ้อมเลย", "สอบถามท่าฝึก"],
    };
    setMessages((prev) => [...prev, newPlanMsg]);
  };

  // Coach Scenario triggers (e.g. 18:00 reminder, overdue, penalty, meal check-in)
  const handleTriggerCoachScenario = (scenario: "18_00" | "overdue" | "penalty" | "meal_prompt") => {
    if (scenario === "18_00") {
      setAccountability((prev) => ({
        ...prev,
        status: "workout_time",
        lastReminderType: "workout_time",
        lastReminderText: "ถึงเวลาออกกำลังกาย 18:00 น. แล้วครับ!",
      }));
      const reminderUserName = profile.name ? `คุณ ${profile.name}` : "คุณ";
      const msg: ChatMessage = {
        id: `bot-scen-${Date.now()}`,
        sender: "bot",
        text: `🔔 **แจ้งเตือนเวลา 18:00 น. : ได้เวลาฝึกแล้วครับ${reminderUserName}!**\n\nโปรแกรม: **${workout.titleTh || workout.title}** (${workout.durationMinutes} นาที)\n\nวางมือจากงาน ยืดเส้นสักครู่แล้วมาเริ่มกันครับ! พร้อมไหมครับ?`,
        timestamp: "18:00",
        quickReplies: ["พร้อมซ้อมเลย!", "ขอเลื่อน 30 นาที", "วันนี้เหนื่อย ขอโปรแกรมเบา"],
      };
      setMessages((prev) => [...prev, msg]);
      setIsLineBotOpen(true);
    } else if (scenario === "overdue") {
      setAccountability((prev) => ({
        ...prev,
        status: "overdue",
        strikes: 1,
        lastReminderType: "late_warning",
        lastReminderText: "เลยเวลาซ้อมมา 45 นาทีแล้วครับ",
      }));
      const msg: ChatMessage = {
        id: `bot-scen-${Date.now()}`,
        sender: "bot",
        text: `⚠️ **โค้ชติดตาม: เลยเวลาฝึกมา 45 นาทีแล้วครับ!**\n\nติดงานหรือมีธุระด่วนไหมครับ? ถ้าไม่มีเวลาเต็ม ให้ปรับเป็นโปรแกรมด่วน 20 นาที หรือถ้าเหนื่อยโค้ชปรับเป็นท่ายืดเส้นให้ได้ครับ อย่าปล่อยให้หลุดวันนี้นะครับ!`,
        timestamp: "18:45",
        quickReplies: ["เริ่มซ้อมด่วน 20 นาที", "ขอปรับเป็นยืดเส้นเบาๆ", "จำเป็นต้องพักวันนี้"],
      };
      setMessages((prev) => [...prev, msg]);
      setIsLineBotOpen(true);
    } else if (scenario === "penalty") {
      setAccountability((prev) => ({
        ...prev,
        status: "missed_penalty",
        strikes: 2,
        penaltyActive: true,
        penaltyTask: "Plank 60 วินาที + ดื่มน้ำ 500ml + ยืดเหยียด 5 นาที",
        lastReminderType: "penalty",
        lastReminderText: "มีบทลงโทษชดเชยเพื่อรักษาวินัย",
      }));
      const msg: ChatMessage = {
        id: `bot-scen-${Date.now()}`,
        sender: "bot",
        text: `🚨 **แจ้งเตือนวินัย: คุณข้ามเวลาซ้อมโดยไม่ได้แจ้งล่วงหน้า**\n\nเพื่อรักษาโมเมนตัมและไม่ให้ร่างกายสูญเสียความกระฉับกระเฉง โค้ชขอมอบภารกิจชดเชย (Penalty Task):\n\n👉 **Plank 60 วินาที + ดื่มน้ำ 500ml + ยืดกล้ามเนื้อ 5 นาที**\n\nทำเสร็จแล้วกดปุ่มปลดล็อคบทลงโทษด้านล่างได้เลยครับ`,
        timestamp: "20:00",
        quickReplies: ["ทำภารกิจชดเชยเสร็จแล้ว", "ขอโปรแกรมเบาก่อนนอน"],
      };
      setMessages((prev) => [...prev, msg]);
      setIsLineBotOpen(true);
    } else if (scenario === "meal_prompt") {
      const msg: ChatMessage = {
        id: `bot-scen-${Date.now()}`,
        sender: "bot",
        text: `🍲 **เช็คอินมื้ออาหารประจำวัน**\n\nวันนี้มื้อเที่ยงหรือมื้อเย็นทานอะไรไปบ้างครับ? ถ่ายรูปอาหารส่งมาให้โค้ช หรือพิมพ์ชื่อเมนูเพื่อคำนวณแคลอรีและโปรตีนได้เลยครับ!`,
        timestamp: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
        quickReplies: ["ข้าวอกไก่ย่าง", "ก๋วยเตี๋ยวเนื้อน้ำใส", "สลัดทูน่า", "ส่งรูปถ่ายอาหาร"],
      };
      setMessages((prev) => [...prev, msg]);
      setIsLineBotOpen(true);
    }
  };

  // Clear penalty
  const handleClearPenalty = () => {
    setAccountability((prev) => ({
      ...prev,
      status: "on_track",
      strikes: 0,
      penaltyActive: false,
      lastReminderText: "ปลดล็อคบทลงโทษเรียบร้อย รักษาวินัยได้ดีเยี่ยม!",
    }));
    const msg: ChatMessage = {
      id: `bot-penalty-cleared-${Date.now()}`,
      sender: "bot",
      text: `👏 ยอดเยี่ยมมากครับ! โค้ชปลดล็อคบทลงโทษให้แล้ว คุณแสดงให้เห็นถึงความรับผิดชอบและวินัยที่แท้จริง พรุ่งนี้ลุยต่อกันใหม่อย่างมั่นใจครับ!`,
      timestamp: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
      quickReplies: ["ดูโปรแกรมวันพรุ่งนี้", "ขอบคุณครับโค้ช"],
    };
    setMessages((prev) => [...prev, msg]);
  };

  // LINE Bot Send Message handler (Chat engine เชื่อมต่อกับ /api/ai/coach-chat)
  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch("/api/ai/coach-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          userProfile: profile,
          workoutPlan: workout,
          fitnessStatus: status,
          nutritionData: nutrition,
          recoveryData: recovery,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const botReply: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text: data.reply,
          timestamp: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
          quickReplies: ["เปิดหน้าต่างซ้อม", "คำนวณอาหารวันนี้", "ปรึกษาท่าฝึก"],
        };
        setMessages((prev) => [...prev, botReply]);
        return;
      }
    } catch (e) {
      console.warn("เรียก API Coach Chat ล้มเหลว สลับไปใช้กฎตอบกลับสำรอง:", e);
    }

    // Fallback เมื่อออฟไลน์หรือไม่มีการเชื่อมต่อเซิร์ฟเวอร์
    setTimeout(() => {
      let replyText = "";
      let replies: string[] = ["เปิดเมนูโค้ช", "ดูโปรแกรมวันนี้", "สอบถามท่าฝึก"];
      const lower = text.toLowerCase();

      if (lower.includes("พร้อม") || lower.includes("ซ้อม") || lower.includes("เริ่ม")) {
        replyText = `ยอดเยี่ยมครับ! ปิดแชทแล้วกดปุ่ม **'เริ่มออกกำลังกาย'** บนหน้าจอหลักได้เลย โค้ชเตรียมตัวจับเวลาพักและน้ำหนักฝึกไว้ให้แล้วครับ! 🏋️‍♂️`;
        replies = ["เปิดหน้าต่างซ้อม", "ขอวอร์มอัปก่อน"];
      } else if (lower.includes("เหนื่อย") || lower.includes("เพลีย") || lower.includes("ปรับ") || lower.includes("เบา")) {
        replyText = `เข้าใจเลยครับ การฟังเสียงร่างกายคือหัวใจของความก้าวหน้าระยะยาว โค้ชแนะนำให้กดปุ่ม **'ปรับโปรแกรมอัจฉริยะ (Adaptive)'** เพื่อลดเซ็ตหรือปรับเป็นท่ายืดเส้น Active Recovery ครับ`;
        replies = ["เปิดหน้าต่างปรับโปรแกรม", "พักเต็มวัน"];
      } else if (lower.includes("กิน") || lower.includes("อาหาร") || lower.includes("ข้าว") || lower.includes("โปรตีน")) {
        replyText = `เมนูที่น่าสนใจครับ! โค้ชประเมินเบื้องต้น: มีพลังงานประมาณ 450-550 kcal และโปรตีนประมาณ 25-35g ต้องการให้บันทึกลงในไดอารี่โภชนาการวันนี้เลยไหมครับ?`;
        replies = ["บันทึกลงระบบทันที", "แก้ไขข้อมูลสารอาหาร"];
      } else if (lower.includes("ขอบคุณ") || lower.includes("โอเค") || lower.includes("ครับ") || lower.includes("ค่ะ")) {
        replyText = `ยินดีเสมอครับ${profile.name ? `คุณ ${profile.name}` : ""}! โค้ชอยู่เคียงข้างคุณตลอด 24 ชั่วโมง มีอะไรปรึกษาได้ทุกเวลาครับ 🌟`;
      } else {
        replyText = `รับทราบครับ${profile.name ? `คุณ ${profile.name}` : ""}! โค้ชบันทึกข้อความของคุณไว้ในระบบแล้ว มีคำถามเกี่ยวกับโปรแกรมฝึก ท่าออกกำลังกาย หรือการกินอาหาร สอบถามโค้ชได้เลยนะครับ!`;
      }

      const botReply: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: replyText,
        timestamp: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
        quickReplies: replies,
      };
      setMessages((prev) => [...prev, botReply]);
    }, 600);
  };

  // LINE Bot Send Image handler
  const handleSendImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imgDataUrl = e.target?.result as string;
      const userImgMsg: ChatMessage = {
        id: `user-img-${Date.now()}`,
        sender: "user",
        text: `[ส่งรูปภาพ: ${file.name}]`,
        image: imgDataUrl,
        timestamp: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, userImgMsg]);

      // Simulate AI Vision recognition response
      setTimeout(() => {
        const aiVisionReply: ChatMessage = {
          id: `bot-vision-${Date.now()}`,
          sender: "bot",
          text: `📸 **AI ตรวจวิเคราะห์รูปภาพสำเร็จ!**\n\nตรวจพบ: อาหารจานหลัก (โปรตีนจากเนื้อสัตว์ + คาร์โบไฮเดรตเชิงซ้อน)\n🔥 พลังงานโดยประมาณ: **480 kcal**\n🥩 โปรตีน: **32 กรัม** | 🍞 คาร์บ: **45 กรัม** | 🥑 ไขมัน: **14 กรัม**\n\nคำแนะนำ: จานนี้สัดส่วนสารอาหารสมดุลดีมาก เหมาะเป็นอาหารฟื้นฟูหลังออกกำลังกายครับ!`,
          timestamp: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
          quickReplies: ["บันทึกลงในมื้ออาหารวันนี้", "ปรับแก้ตัวเลข", "ขอบคุณครับ"],
        };
        setMessages((prev) => [...prev, aiVisionReply]);
      }, 1000);
    };
    reader.readAsDataURL(file);
  };

  const sampleWeeklyReport: WeeklyReport = {
    weekRange: "9 มี.ค. - 15 มี.ค.",
    consistencyScore: 95,
    workoutsCompleted: 4,
    workoutsTarget: 4,
    xpGained: 680,
    totalCaloriesBurned: 2450,
    highlights: [
      "พิชิตโปรแกรมฝึกครบ 4 วันตามเป้าหมาย 100%",
      "Bench Press เพิ่มน้ำหนักฝึกเป็น 60 kg 8 reps สม่ำเสมอ",
      "รับประทานโปรตีนเฉลี่ยเกิน 140 กรัม/วัน ต่อเนื่อง 6 วัน",
      "การนอนหลับมีคุณภาพดีเยี่ยมเฉลี่ย 7.4 ชั่วโมง ร่างกายฟื้นตัวเร็ว",
    ],
    coachFeedback: "วินัยและความตั้งใจของคุณยอดเยี่ยมมาก สัปดาห์หน้าระบบจะแนะนำ Progressive Overload เพิ่มน้ำหนักฝึก 2.5kg ในท่า Compound หลัก ลุยต่อเลยครับ!",
  };

  // 1. กำลังตรวจสอบเซสชันกับเซิร์ฟเวอร์
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-slate-950 text-base shadow-lg shadow-emerald-500/30 animate-pulse">
          FC
        </div>
        <p className="mt-4 text-xs font-semibold text-slate-400 tracking-wider">กำลังตรวจสอบสถานะการเข้าสู่ระบบ...</p>
      </div>
    );
  }

  // 2. เมื่อเปิดแอปแล้วยังไม่ล็อกอิน ให้แสดงหน้าต้อนรับที่มีปุ่ม "เข้าสู่ระบบด้วย LINE" (สีเขียวของ LINE)
  if (!sessionUser && !isGuestMode) {
    return (
      <LoginView
        onEnterGuest={() => setIsGuestMode(true)}
        loginError={loginError}
        onClearError={() => setLoginError(null)}
      />
    );
  }

  // If user explicitly requests landing screen
  if (showLanding) {
    return (
      <LandingView
        onStart={() => {
          setShowLanding(false);
          setIsOnboardingOpen(true);
        }}
        onEnterDemo={() => {
          setShowLanding(false);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Header */}
      <Header
        profile={profile}
        status={status}
        sessionUser={sessionUser}
        onOpenLine={() => setIsLineBotOpen(true)}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        onOpenRichMenuStudio={() => setIsRichMenuStudioOpen(true)}
        onOpenGoogleHealth={() => setIsGoogleHealthOpen(true)}
        isGoogleHealthConnected={isGoogleFitAuthenticated() || activity.isFromGoogleHealth}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-xl w-full mx-auto px-4 pt-4 pb-20">
        {currentTab === "home" && (
          <HomeView
            workout={workout}
            nutrition={nutrition}
            recovery={recovery}
            activity={activity}
            status={status}
            profile={profile}
            accountability={accountability}
            onOpenPlan3Months={() => setIsPlan3MonthsOpen(true)}
            onOpenWorkout={() => setIsWorkoutOpen(true)}
            onOpenNutrition={() => setIsNutritionOpen(true)}
            onOpenRecovery={() => setIsRecoveryOpen(true)}
            onOpenAdapt={() => setIsAdaptOpen(true)}
            onOpenLine={() => setIsLineBotOpen(true)}
            onTriggerCoachScenario={handleTriggerCoachScenario}
            onClearPenalty={handleClearPenalty}
            onOpenRichMenuStudio={() => setIsRichMenuStudioOpen(true)}
            onOpenGoogleHealth={() => setIsGoogleHealthOpen(true)}
          />
        )}

        {currentTab === "plan" && (
          <PlanView
            workout={workout}
            onOpenPlan3Months={() => setIsPlan3MonthsOpen(true)}
            onOpenWorkout={() => setIsWorkoutOpen(true)}
            onOpenAdapt={() => setIsAdaptOpen(true)}
            onOpenLine={() => setIsLineBotOpen(true)}
          />
        )}

        {currentTab === "progress" && (
          <StatusRadarView
            status={status}
            profile={profile}
            onOpenWeeklyReport={() => setIsWeeklyReportOpen(true)}
          />
        )}

        {currentTab === "profile" && (
          <ProfileView
            profile={profile}
            status={status}
            sessionUser={sessionUser}
            onLogout={handleLogout}
            onOpenOnboarding={() => setIsOnboardingOpen(true)}
            onOpenLine={() => setIsLineBotOpen(true)}
          />
        )}
      </main>

      {/* Bottom Sticky Navigation */}
      <Navigation currentTab={currentTab} onChangeTab={setCurrentTab} />

      {/* ================= MODALS ================= */}

      {/* 1. Workout Session Modal */}
      <WorkoutModal
        isOpen={isWorkoutOpen}
        onClose={() => setIsWorkoutOpen(false)}
        workout={workout}
        onCompleteWorkout={handleCompleteWorkout}
        onOpenAdapt={() => {
          setIsWorkoutOpen(false);
          setIsAdaptOpen(true);
        }}
      />

      {/* 2. Adaptive Workout Modal */}
      <AdaptiveWorkoutModal
        isOpen={isAdaptOpen}
        onClose={() => setIsAdaptOpen(false)}
        currentWorkout={workout}
        onApplyAdaptedWorkout={handleApplyAdaptedWorkout}
      />

      {/* 3. Nutrition Modal */}
      <NutritionModal
        isOpen={isNutritionOpen}
        onClose={() => setIsNutritionOpen(false)}
        nutrition={nutrition}
        onAddMeal={handleAddMeal}
        onOpenLine={() => {
          setIsNutritionOpen(false);
          setIsLineBotOpen(true);
        }}
      />

      {/* 4. Recovery & Sleep Modal */}
      <RecoveryModal
        isOpen={isRecoveryOpen}
        onClose={() => setIsRecoveryOpen(false)}
        recovery={recovery}
        status={status}
        onUpdateSleep={handleUpdateRecovery}
      />

      {/* 5. LINE Bot Official Chat Modal */}
      <LineBotChatModal
        isOpen={isLineBotOpen}
        onClose={() => setIsLineBotOpen(false)}
        messages={messages}
        onSendMessage={handleSendMessage}
        onSendImage={handleSendImage}
        workout={workout}
        nutrition={nutrition}
        status={status}
        profile={profile}
        onOpenWorkout={() => {
          setIsLineBotOpen(false);
          setIsWorkoutOpen(true);
        }}
        onOpenNutrition={() => {
          setIsLineBotOpen(false);
          setIsNutritionOpen(true);
        }}
        onOpenRecovery={() => {
          setIsLineBotOpen(false);
          setIsRecoveryOpen(true);
        }}
        onOpenAdapt={() => {
          setIsLineBotOpen(false);
          setIsAdaptOpen(true);
        }}
        onOpenRichMenuStudio={() => {
          setIsLineBotOpen(false);
          setIsRichMenuStudioOpen(true);
        }}
      />

      {/* 6. LINE Rich Menu Studio Modal */}
      <LineRichMenuStudioModal
        isOpen={isRichMenuStudioOpen}
        onClose={() => setIsRichMenuStudioOpen(false)}
      />

      {/* 7. Google Fit / Health Modal */}
      <GoogleHealthModal
        isOpen={isGoogleHealthOpen}
        onClose={() => setIsGoogleHealthOpen(false)}
        onSyncComplete={handleSyncHealthComplete}
      />

      {/* 8. Onboarding Assessment Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        currentProfile={profile}
        onComplete={handleOnboardingComplete}
      />

      {/* 9. AI Plan Generation Progress Modal */}
      <PlanGenerationModal
        isOpen={isPlanGenOpen}
        onClose={() => setIsPlanGenOpen(false)}
        profile={profile}
        onPlanGenerated={handlePlanGenerated}
      />

      {/* 10. Weekly Summary Report Modal */}
      <WeeklyReportModal
        isOpen={isWeeklyReportOpen}
        onClose={() => setIsWeeklyReportOpen(false)}
        report={sampleWeeklyReport}
        status={status}
      />

      {/* 11. 3-Months Periodization Master Plan Modal */}
      <Plan3MonthsModal
        isOpen={isPlan3MonthsOpen}
        onClose={() => setIsPlan3MonthsOpen(false)}
        profile={profile}
      />
    </div>
  );
}
