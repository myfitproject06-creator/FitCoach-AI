import React, { useState } from "react";
import { Header } from "./components/Header";
import { Navigation, NavTab } from "./components/Navigation";
import { HomeView } from "./components/HomeView";
import { PlanView } from "./components/PlanView";
import { StatusRadarView } from "./components/StatusRadarView";
import { ProfileView } from "./components/ProfileView";
import { WorkoutModal } from "./components/WorkoutModal";
import { AdaptiveWorkoutModal } from "./components/AdaptiveWorkoutModal";
import { NutritionModal } from "./components/NutritionModal";
import { RecoveryModal } from "./components/RecoveryModal";
import { LineBotChatModal } from "./components/LineBotChatModal";
import { OnboardingModal } from "./components/OnboardingModal";
import { PlanGenerationModal } from "./components/PlanGenerationModal";
import { WeeklyReportModal } from "./components/WeeklyReportModal";
import { Plan3MonthsModal } from "./components/Plan3MonthsModal";
import { LandingView } from "./components/LandingView";
import { LineRichMenuStudioModal } from "./components/LineRichMenuStudioModal";

import {
  initialProfile,
  initialTodayWorkout,
  initialNutrition,
  initialRecovery,
  initialActivity,
  initialFitnessStatus,
  initialWeeklyReport,
  initialLineMessages,
  initialAccountability,
} from "./data/mockData";
import { MealItem, RecoveryData, UserProfile, WorkoutPlan, Plan3MonthsData, CoachAccountabilityState } from "./types";

export function App() {
  // Navigation & View states
  const [showLanding, setShowLanding] = useState(false);
  const [currentTab, setCurrentTab] = useState<NavTab>("home");

  // Core App State
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [workout, setWorkout] = useState<WorkoutPlan>(initialTodayWorkout);
  const [nutrition, setNutrition] = useState(initialNutrition);
  const [recovery, setRecovery] = useState<RecoveryData>(initialRecovery);
  const [activity, setActivity] = useState(initialActivity);
  const [status, setStatus] = useState(initialFitnessStatus);
  const [weeklyReport, setWeeklyReport] = useState(initialWeeklyReport);
  const [lineMessages, setLineMessages] = useState(initialLineMessages);
  const [activePlan3Months, setActivePlan3Months] = useState<Plan3MonthsData | null>(null);
  const [accountability, setAccountability] = useState<CoachAccountabilityState>(() => {
    try {
      const saved = localStorage.getItem("fitcoach_accountability");
      return saved ? JSON.parse(saved) : initialAccountability;
    } catch {
      return initialAccountability;
    }
  });

  // Modal Dialog states
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [isAdaptiveModalOpen, setIsAdaptiveModalOpen] = useState(false);
  const [isNutritionModalOpen, setIsNutritionModalOpen] = useState(false);
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
  const [isLineModalOpen, setIsLineModalOpen] = useState(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [isPlanGenerating, setIsPlanGenerating] = useState(false);
  const [isWeeklyReportOpen, setIsWeeklyReportOpen] = useState(false);
  const [isPlan3MonthsModalOpen, setIsPlan3MonthsModalOpen] = useState(false);
  const [isRichMenuStudioOpen, setIsRichMenuStudioOpen] = useState(false);

  // Handlers
  const handleCompleteWorkout = (data: { rpe: number; feeling: any; notes: string }) => {
    setWorkout((prev) => ({
      ...prev,
      isCompleted: true,
      rpe: data.rpe,
      feeling: data.feeling,
    }));

    // Update XP and Momentum
    setStatus((prev) => {
      const newXp = prev.xp + 85;
      const leveledUp = newXp >= prev.nextLevelXp;
      return {
        ...prev,
        xp: leveledUp ? newXp - prev.nextLevelXp : newXp,
        level: leveledUp ? prev.level + 1 : prev.level,
        trainingMomentum: Math.min(100, prev.trainingMomentum + 2),
        programAdherence: Math.min(100, prev.programAdherence + 1),
      };
    });

    // Notify on LINE Chat
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;
    setLineMessages((prev) => [
      ...prev,
      {
        id: `line-${Date.now()}`,
        sender: "coach",
        text: `ยอดเยี่ยมมากครับคุณตัน! 🎉 การฝึก Upper Body วันนี้เสร็จสิ้นแล้ว (RPE ${data.rpe}) ผมบันทึกเข้าระบบเรียบร้อย ได้รับ +85 XP อย่าลืมเติมโปรตีนหลังฝึกนะครับ! 💪`,
        timestamp: timeStr,
      },
    ]);
  };

  const handleApplyAdaptedWorkout = (adapted: Partial<WorkoutPlan>) => {
    setWorkout((prev) => ({
      ...prev,
      ...adapted,
    }));

    // Post to LINE
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;
    setLineMessages((prev) => [
      ...prev,
      {
        id: `line-${Date.now()}`,
        sender: "coach",
        text: `รับทราบครับ! ผมได้ปรับโปรแกรมการฝึกวันนี้เป็น "${adapted.titleTh || "Light Session"}" (${adapted.durationMinutes || 25} นาที) ให้เรียบร้อยครับ เพื่อให้ร่างกายได้ฟื้นฟูโดยไม่เสียโมเมนตัมครับ 🌿`,
        timestamp: timeStr,
      },
    ]);
  };

  const handleAddMeal = (newMeal: MealItem) => {
    setNutrition((prev) => ({
      ...prev,
      currentCalories: prev.currentCalories + newMeal.calories,
      currentProtein: prev.currentProtein + newMeal.protein,
      currentCarbs: prev.currentCarbs + newMeal.carbs,
      currentFat: prev.currentFat + newMeal.fat,
      meals: [newMeal, ...prev.meals],
    }));

    // Append to LINE message
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;
    setLineMessages((prev) => [
      ...prev,
      {
        id: `line-${Date.now()}`,
        sender: "coach",
        text: `บันทึกมื้ออาหาร "${newMeal.name}" (${newMeal.calories} kcal, โปรตีน ${newMeal.protein}g) แล้วครับ! 🥗\n${newMeal.tip ? `\n💡 ทริคจากโค้ช: ${newMeal.tip}` : ""}`,
        timestamp: timeStr,
      },
    ]);
  };

  const handleRemoveMeal = (mealId: string) => {
    const mealToRemove = nutrition.meals.find((m) => m.id === mealId);
    if (!mealToRemove) return;
    setNutrition((prev) => ({
      ...prev,
      currentCalories: Math.max(0, prev.currentCalories - mealToRemove.calories),
      currentProtein: Math.max(0, prev.currentProtein - mealToRemove.protein),
      currentCarbs: Math.max(0, prev.currentCarbs - mealToRemove.carbs),
      currentFat: Math.max(0, prev.currentFat - mealToRemove.fat),
      meals: prev.meals.filter((m) => m.id !== mealId),
    }));
  };

  const handleUpdateRecovery = (updated: Partial<RecoveryData>) => {
    setRecovery((prev) => ({
      ...prev,
      ...updated,
    }));
  };

  const handleSendLineMessage = async (userText: string) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;

    const userMsg = {
      id: `u-${Date.now()}`,
      sender: "user" as const,
      text: userText,
      timestamp: timeStr,
    };

    setLineMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch("/api/ai/coach-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          targetDurationMonths: profile.targetDurationMonths,
          chatHistory: lineMessages.slice(-8),
          currentWorkout: workout,
          currentNutrition: nutrition,
          profile: profile,
          accountabilityState: accountability,
        }),
      });
      if (res.ok) {
        const data = await res.json();

        // 1. Auto-log meal if coach detected food
        if (data.recordedMeal) {
          handleAddMeal(data.recordedMeal);
        }

        // 2. Handle discipline action
        if (data.disciplineAction === "warn") {
          setAccountability((prev) => {
            const updated: CoachAccountabilityState = {
              ...prev,
              strikes: Math.min(3, prev.strikes + 1),
              status: "overdue",
              lastReminderType: "late_warning",
            };
            try {
              localStorage.setItem("fitcoach_accountability", JSON.stringify(updated));
            } catch {}
            return updated;
          });
        } else if (data.disciplineAction === "penalty") {
          setAccountability((prev) => {
            const updated: CoachAccountabilityState = {
              ...prev,
              strikes: 3,
              penaltyActive: true,
              status: "missed_penalty",
              penaltyTask:
                data.card?.penaltyTask ||
                "Burpees 15 ครั้ง หรือ Push-ups 25 ครั้ง เพื่อปลดล็อคบทลงโทษ",
              lastReminderType: "penalty",
            };
            try {
              localStorage.setItem("fitcoach_accountability", JSON.stringify(updated));
            } catch {}
            return updated;
          });
        } else if (data.disciplineAction === "praise") {
          setAccountability((prev) => {
            const updated: CoachAccountabilityState = {
              ...prev,
              strikes: 0,
              penaltyActive: false,
              status: "on_track",
            };
            try {
              localStorage.setItem("fitcoach_accountability", JSON.stringify(updated));
            } catch {}
            return updated;
          });
        }

        const replyMsg = {
          id: `c-${Date.now()}`,
          sender: "coach" as const,
          text: data.reply || "รับทราบครับ! ผมคอยดูแลและปรับแผนให้คุณอยู่เสมอครับ",
          timestamp: timeStr,
          recordedMeal: data.recordedMeal || undefined,
          card: data.card || undefined,
          quickReplies: data.quickActions || undefined,
        };
        setLineMessages((prev) => [...prev, replyMsg]);
      }
    } catch {
      // Fallback response
      setLineMessages((prev) => [
        ...prev,
        {
          id: `c-${Date.now()}`,
          sender: "coach",
          text: "เข้าใจแล้วครับ! ผมพร้อมดูแล ให้คำแนะนำ และปรับแผนการฝึกให้เข้ากับคุณเสมอครับ มีอะไรสอบถามได้ตลอดนะครับ",
          timestamp: timeStr,
        },
      ]);
    }
  };

  const handleClearPenalty = () => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;

    setAccountability((prev) => {
      const updated: CoachAccountabilityState = {
        ...prev,
        penaltyActive: false,
        strikes: 0,
        status: "on_track",
      };
      try {
        localStorage.setItem("fitcoach_accountability", JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setStatus((prev) => ({
      ...prev,
      xp: prev.xp + 50,
      disciplineScore: Math.min(100, (prev.disciplineScore || 85) + 15),
    }));

    setLineMessages((prev) => [
      ...prev,
      {
        id: `u-${Date.now()}`,
        sender: "user",
        text: "ส่งการบ้านชดเชยแล้วครับ! ทำภารกิจเสร็จสิ้นเรียบร้อย 💪",
        timestamp: timeStr,
      },
      {
        id: `c-${Date.now()}`,
        sender: "coach",
        text: "สุดยอดมากครับคุณตัน! 👏 ผมบันทึกการส่งการบ้านและปลดล็อคบทลงโทษให้เรียบร้อยแล้ว ได้รับ +50 XP และกู้คืนคะแนนวินัยเต็มที่ พรุ่งนี้มารักษาตารางซ้อมให้ตรงเวลา 18:00 น. กันต่อนะครับ!",
        timestamp: timeStr,
        quickReplies: ["เริ่ม Workout วันนี้", "บันทึกอาหาร", "ดูแผนการฝึก"],
      },
    ]);
  };

  const handleTriggerCoachScenario = (
    scenario: "18_00" | "overdue" | "penalty" | "meal_prompt"
  ) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;

    if (scenario === "18_00") {
      setAccountability((prev) => {
        const updated: CoachAccountabilityState = {
          ...prev,
          status: "workout_time",
          scheduledTime: "18:00",
          lastReminderType: "workout_time",
        };
        try {
          localStorage.setItem("fitcoach_accountability", JSON.stringify(updated));
        } catch {}
        return updated;
      });

      setLineMessages((prev) => [
        ...prev,
        {
          id: `c-scen-${Date.now()}`,
          sender: "coach",
          text: `⏰ ถึงเวลา 18:00 น. แล้วครับคุณ${profile.name || "ตัน"}! วันนี้เรามีนัดซ้อม "${workout.titleTh || workout.title}" (${workout.durationMinutes} นาที) พร้อมลุยหรือยังครับ? เตรียมชุด เตรียมน้ำดื่มให้พร้อม แล้วกดเริ่มซ้อมได้เลยครับ 💪`,
          timestamp: timeStr,
          card: {
            type: "workout_reminder",
            title: workout.titleTh || workout.title,
            details: `${workout.exercises.length} ท่าฝึก • ${workout.durationMinutes} นาที • ความหนัก${workout.intensity}`,
            duration: `${workout.durationMinutes} นาที`,
            tags: ["UpperBody", "ตามตาราง 18:00", "เป้าหมายหุ่นนักกีฬา"],
            workoutPlan: workout,
          },
          quickReplies: ["เริ่มเลย 💪", "เลื่อน 30 นาที ⏰", "วันนี้เหนื่อยมาก 😴"],
        },
      ]);
    } else if (scenario === "overdue") {
      setAccountability((prev) => {
        const updated: CoachAccountabilityState = {
          ...prev,
          status: "overdue",
          strikes: Math.max(1, prev.strikes + 1),
          lastReminderType: "late_warning",
        };
        try {
          localStorage.setItem("fitcoach_accountability", JSON.stringify(updated));
        } catch {}
        return updated;
      });

      setLineMessages((prev) => [
        ...prev,
        {
          id: `c-scen-${Date.now()}`,
          sender: "coach",
          text: `⚠️ คุณ${profile.name || "ตัน"}ครับ! ตอนนี้ 18:45 น. แล้ว เลยเวลานัดซ้อมมา 45 นาทีแล้วนะครับ โค้ชยังไม่เห็นคุณกดเริ่มซ้อมเลย! ถ้าติดงานด่วนแจ้งโค้ชได้ แต่ถ้ายังไหว รีบมากดซ้อม 20-30 นาที ดีกว่าปล่อยหลุดนะครับ วินัยคือหัวใจสำคัญครับ!`,
          timestamp: timeStr,
          quickReplies: ["เริ่มซ้อมเดี๋ยวนี้ 💪", "ขอเลื่อน 30 นาที ⏰", "วันนี้ไม่ไหว ปรับแผน"],
        },
      ]);
    } else if (scenario === "penalty") {
      setAccountability((prev) => {
        const updated: CoachAccountabilityState = {
          ...prev,
          status: "missed_penalty",
          strikes: 3,
          penaltyActive: true,
          penaltyTask: "Burpees 15 ครั้ง หรือ Push-ups 25 ครั้ง เพื่อปลดล็อคบทลงโทษ",
          lastReminderType: "penalty",
        };
        try {
          localStorage.setItem("fitcoach_accountability", JSON.stringify(updated));
        } catch {}
        return updated;
      });

      setLineMessages((prev) => [
        ...prev,
        {
          id: `c-scen-${Date.now()}`,
          sender: "coach",
          text: `🚨 คุณ${profile.name || "ตัน"}ครับ วันนี้เลยเวลามามากแล้วและคุณขาดการเข้าซ้อมตามโปรแกรม! ตามระเบียบ FitCoach ได้ทำการบันทึก Strike 3/3 และสั่งเริ่ม **มาตรการลงโทษทางวินัย** เพื่อดึงโมเมนตัมกลับมาครับ!`,
          timestamp: timeStr,
          card: {
            type: "penalty_notice",
            title: "บทลงโทษเนื่องจากขาดซ้อม (Missed Workout Penalty)",
            details: "คุณไม่ได้เข้าซ้อมตามเวลาที่นัดหมาย (18:00 น.) จึงถูกหักแต้มวินัย และต้องทำภารกิจชดเชยเพื่อปลดล็อค",
            penaltyTask: "Burpees 15 ครั้ง หรือ Push-ups 25 ครั้ง เพื่อปลดล็อคบทลงโทษ",
          },
          quickReplies: ["ส่งการบ้านชดเชย", "ขออภัยโค้ชครับ เดี๋ยวซ้อมเลย", "ปรับแผนการฝึก"],
        },
      ]);
    } else if (scenario === "meal_prompt") {
      setAccountability((prev) => {
        const updated: CoachAccountabilityState = {
          ...prev,
          lastReminderType: "meal_checkin",
        };
        try {
          localStorage.setItem("fitcoach_accountability", JSON.stringify(updated));
        } catch {}
        return updated;
      });

      setLineMessages((prev) => [
        ...prev,
        {
          id: `c-scen-${Date.now()}`,
          sender: "coach",
          text: `🥗 คุณ${profile.name || "ตัน"}ครับ วันนี้กินอะไรไปบ้างแล้ว ส่งเมนูอาหารมาให้โค้ชดูหน่อยครับ! เช่น 'กินกล้วยหอม 2 ลูก', 'กินข้าวมันไก่ตอน 1 จาน' เดี๋ยวโค้ชคำนวณแคลอรีและโปรตีน แล้วบันทึกลงแอปให้อัตโนมัติทันทีครับ!`,
          timestamp: timeStr,
          quickReplies: [
            "กินกล้วยหอม 2 ลูก 🍌",
            "กินข้าวกะเพราไก่ + ไข่ดาว 🍳",
            "กินข้าวมันไก่ตอน 1 จาน 🍗",
            "ดูแคลอรีสะสมวันนี้ 📊",
          ],
        },
      ]);
    }

    setIsLineModalOpen(true);
  };

  const handleApplyProgramFromChat = (
    newPlan: WorkoutPlan,
    goalTitle?: string,
    plan3Months?: Plan3MonthsData
  ) => {
    setWorkout(newPlan);
    if (plan3Months) {
      setActivePlan3Months(plan3Months);
    }
    if (goalTitle) {
      setProfile((prev) => ({
        ...prev,
        customGoalText: goalTitle,
        goal: goalTitle,
      }));
    }

    // Coach schedules training at 18:00 and begins proactive tracking
    setAccountability((prev) => {
      const updated: CoachAccountabilityState = {
        ...prev,
        scheduledTime: "18:00",
        status: "on_track",
        strikes: 0,
        penaltyActive: false,
        lastReminderType: "pre_workout",
        lastReminderText: "นัดซ้อมเวลา 18:00 น. วันนี้เรียบร้อยครับ โค้ชจะคอยติดตามตลอดวัน",
      };
      try {
        localStorage.setItem("fitcoach_accountability", JSON.stringify(updated));
      } catch {}
      return updated;
    });

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;

    const durationLabel = plan3Months?.totalDuration || (plan3Months?.totalMonths ? `${plan3Months.totalMonths} เดือน` : `${newPlan.durationMinutes} นาที`);
    setLineMessages((prev) => [
      ...prev,
      {
        id: `c-applied-${Date.now()}`,
        sender: "coach",
        text: `🎯 ผมได้บันทึกแผน ${durationLabel} "${newPlan.titleTh || newPlan.title}" ลงในหน้าหลักของแอปเรียบร้อยแล้วครับ!\n\n🕒 **ตารางการติดตาม:** ผมนัดเวลาซ้อมของคุณวันนี้ไว้ที่ **18:00 น.** หากถึงเวลาแล้วยังไม่มากดซ้อมผมจะคอยส่งข้อความเตือน และส่งเมนูอาหารมาให้ผมบันทึกอัตโนมัติได้ตลอดวันนะครับ 💪`,
        timestamp: timeStr,
        quickReplies: ["เริ่ม Workout ตอนนี้", "ส่งเมนูอาหารให้โค้ช", "ดูตารางซ้อม 18:00"],
      },
    ]);

    setIsLineModalOpen(false);
    setIsWorkoutModalOpen(true);
  };

  const handleSnoozeWorkout = () => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;

    setLineMessages((prev) => [
      ...prev,
      {
        id: `u-${Date.now()}`,
        sender: "user",
        text: "ขอเลื่อนไปอีก 30 นาทีครับ",
        timestamp: timeStr,
      },
      {
        id: `c-${Date.now()}`,
        sender: "coach",
        text: "รับทราบครับคุณตัน! ⏰ เดี๋ยวผมจะส่งการแจ้งเตือนเตือนความจำอีกครั้งใน 30 นาทีนะครับ เตรียมขวดน้ำและชุดให้พร้อมนะครับ",
        timestamp: timeStr,
      },
    ]);
  };

  const handleSaveProfileAndGenerate = (newProfile: UserProfile) => {
    setProfile(newProfile);
    setIsOnboardingModalOpen(false);
    setIsPlanGenerating(true);
  };

  const handleFinishPlanGeneration = () => {
    setIsPlanGenerating(false);
    setCurrentTab("home");
  };

  // If user explicitly toggled landing
  if (showLanding) {
    return (
      <LandingView
        onStart={() => {
          setShowLanding(false);
          setIsOnboardingModalOpen(true);
        }}
        onEnterDemo={() => {
          setShowLanding(false);
          setCurrentTab("home");
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans antialiased selection:bg-emerald-500 selection:text-white">
      {/* App Header */}
      <Header
        profile={profile}
        status={status}
        onOpenLine={() => setIsLineModalOpen(true)}
        onOpenOnboarding={() => setIsOnboardingModalOpen(true)}
        onOpenRichMenuStudio={() => setIsRichMenuStudioOpen(true)}
      />

      {/* Main Container */}
      <main className="max-w-xl mx-auto px-4 pt-4 pb-20">
        {currentTab === "home" && (
          <HomeView
            workout={workout}
            nutrition={nutrition}
            recovery={recovery}
            activity={activity}
            status={status}
            profile={profile}
            activePlan3Months={activePlan3Months}
            accountability={accountability}
            onOpenPlan3Months={() => setIsPlan3MonthsModalOpen(true)}
            onOpenWorkout={() => setIsWorkoutModalOpen(true)}
            onOpenNutrition={() => setIsNutritionModalOpen(true)}
            onOpenRecovery={() => setIsRecoveryModalOpen(true)}
            onOpenAdapt={() => setIsAdaptiveModalOpen(true)}
            onOpenLine={() => setIsLineModalOpen(true)}
            onOpenRichMenuStudio={() => setIsRichMenuStudioOpen(true)}
            onTriggerCoachScenario={handleTriggerCoachScenario}
            onClearPenalty={handleClearPenalty}
          />
        )}

        {currentTab === "plan" && (
          <PlanView
            profile={profile}
            workout={workout}
            nutrition={nutrition}
            recovery={recovery}
            activePlan3Months={activePlan3Months}
            onOpenPlanModal={() => setIsPlan3MonthsModalOpen(true)}
            onSelectTodayWorkout={() => setIsWorkoutModalOpen(true)}
            onOpenAdapt={() => setIsAdaptiveModalOpen(true)}
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
            onOpenLine={() => setIsLineModalOpen(true)}
            onOpenOnboarding={() => setIsOnboardingModalOpen(true)}
          />
        )}
      </main>

      {/* Bottom Floating/Docked Navigation */}
      <Navigation currentTab={currentTab} onChangeTab={setCurrentTab} />

      {/* ================= MODALS ================= */}

      {/* 1. Workout Modal */}
      {isWorkoutModalOpen && (
        <WorkoutModal
          workout={workout}
          onClose={() => setIsWorkoutModalOpen(false)}
          onCompleteWorkout={handleCompleteWorkout}
          onOpenAdapt={() => {
            setIsWorkoutModalOpen(false);
            setIsAdaptiveModalOpen(true);
          }}
        />
      )}

      {/* 2. Adaptive Workout Modal */}
      {isAdaptiveModalOpen && (
        <AdaptiveWorkoutModal
          currentWorkout={workout}
          onClose={() => setIsAdaptiveModalOpen(false)}
          onApplyAdaptedWorkout={handleApplyAdaptedWorkout}
        />
      )}

      {/* 3. Nutrition Modal */}
      {isNutritionModalOpen && (
        <NutritionModal
          nutrition={nutrition}
          onClose={() => setIsNutritionModalOpen(false)}
          onAddMeal={handleAddMeal}
          onRemoveMeal={handleRemoveMeal}
        />
      )}

      {/* 4. Recovery Modal */}
      {isRecoveryModalOpen && (
        <RecoveryModal
          recovery={recovery}
          onClose={() => setIsRecoveryModalOpen(false)}
          onUpdateRecovery={handleUpdateRecovery}
        />
      )}

      {/* 5. LINE Bot Chat Simulator Modal */}
      {isLineModalOpen && (
        <LineBotChatModal
          messages={lineMessages}
          workout={workout}
          accountability={accountability}
          currentCalories={nutrition.currentCalories}
          calorieTarget={nutrition.targetCalories}
          disciplineScore={status.disciplineScore || 93}
          onClearPenalty={handleClearPenalty}
          onClose={() => setIsLineModalOpen(false)}
          onSendMessage={handleSendLineMessage}
          onStartWorkout={() => {
            setIsLineModalOpen(false);
            setIsWorkoutModalOpen(true);
          }}
          onSnoozeWorkout={handleSnoozeWorkout}
          onOpenAdapt={() => {
            setIsLineModalOpen(false);
            setIsAdaptiveModalOpen(true);
          }}
          onApplyProgram={handleApplyProgramFromChat}
          onOpenPlan3Months={() => {
            setIsLineModalOpen(false);
            setIsPlan3MonthsModalOpen(true);
          }}
          onOpenNutrition={() => {
            setIsLineModalOpen(false);
            setIsNutritionModalOpen(true);
          }}
          onOpenWeeklyReport={() => {
            setIsLineModalOpen(false);
            setIsWeeklyReportOpen(true);
          }}
        />
      )}

      {/* LINE Rich Menu Standalone Studio Modal */}
      {isRichMenuStudioOpen && (
        <LineRichMenuStudioModal
          onClose={() => setIsRichMenuStudioOpen(false)}
          accountability={accountability}
        />
      )}

      {/* 6. Onboarding Modal */}
      {isOnboardingModalOpen && (
        <OnboardingModal
          initialProfile={profile}
          onClose={() => setIsOnboardingModalOpen(false)}
          onSaveProfileAndGenerate={handleSaveProfileAndGenerate}
        />
      )}

      {/* 7. Plan Generation Animation Modal */}
      {isPlanGenerating && (
        <PlanGenerationModal
          goal={profile.goal}
          onFinish={handleFinishPlanGeneration}
        />
      )}

      {/* 8. Weekly Report Modal */}
      {isWeeklyReportOpen && (
        <WeeklyReportModal
          report={weeklyReport}
          profile={profile}
          onClose={() => setIsWeeklyReportOpen(false)}
        />
      )}

      {/* 9. 3-Month Transformation Plan Modal */}
      {isPlan3MonthsModalOpen && activePlan3Months && (
        <Plan3MonthsModal
          plan={activePlan3Months}
          workout={workout}
          onClose={() => setIsPlan3MonthsModalOpen(false)}
          onStartWorkout={() => {
            setIsPlan3MonthsModalOpen(false);
            setIsWorkoutModalOpen(true);
          }}
        />
      )}
    </div>
  );
}

export default App;
