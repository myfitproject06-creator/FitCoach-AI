import React from "react";
import { Home, Calendar, Award, User, Sparkles } from "lucide-react";

interface NavigationProps {
  currentTab: "today" | "plan" | "status" | "profile";
  onTabChange: (tab: "today" | "plan" | "status" | "profile") => void;
  onOpenPlan3Months?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onTabChange,
  onOpenPlan3Months,
}) => {
  const tabs = [
    { id: "today" as const, label: "วันนี้", icon: Home },
    { id: "plan" as const, label: "ตารางซ้อม", icon: Calendar },
    { id: "status" as const, label: "สเตตัส", icon: Award },
    { id: "profile" as const, label: "โปรไฟล์", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200">
      <div className="max-w-xl mx-auto px-4 flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`nav-btn-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center w-14 h-full relative transition-all active:scale-95 ${
                isActive
                  ? "text-emerald-600 font-semibold"
                  : "text-slate-400 hover:text-slate-600 font-normal"
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? "scale-110" : ""}`} />
                {isActive && (
                  <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
