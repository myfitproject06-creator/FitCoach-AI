import React from "react";
import { Home, Calendar, BarChart3, User } from "lucide-react";

export type NavTab = "home" | "plan" | "progress" | "profile";

interface NavigationProps {
  currentTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentTab, onChangeTab }) => {
  const tabs = [
    { id: "home" as NavTab, label: "หน้าแรก", icon: Home },
    { id: "plan" as NavTab, label: "แผน", icon: Calendar },
    { id: "progress" as NavTab, label: "สถิติ", icon: BarChart3 },
    { id: "profile" as NavTab, label: "โปรไฟล์", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg">
      <div className="max-w-xl mx-auto px-4 py-2 flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => onChangeTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative ${
                isActive
                  ? "text-slate-900 font-semibold"
                  : "text-slate-400 hover:text-slate-600 font-normal"
              }`}
            >
              <div
                className={`p-1 rounded-lg transition-transform ${
                  isActive ? "scale-110 text-emerald-600" : ""
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.3 : 1.8} />
              </div>
              <span className="text-[11px] tracking-tight">{tab.label}</span>
              {isActive && (
                <span className="absolute -bottom-1 w-5 h-1 bg-emerald-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
