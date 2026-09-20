import React from "react";
import {
  Dumbbell,
  Utensils,
  Moon,
  BarChart3,
  Sparkles,
  SlidersHorizontal,
  Brain,
} from "lucide-react";

interface LineRichMenuProps {
  onSelectAction: (actionKey: string) => void;
}

export const LineRichMenu: React.FC<LineRichMenuProps> = ({ onSelectAction }) => {
  // Standard LINE Rich Menu 6-tile grid layout (3 columns x 2 rows)
  // Designed adhering to official 2500 x 1686 px aspect ratio (approx 1.48:1)
  const menuTiles = [
    {
      id: "workout",
      title: "โปรแกรมฝึก",
      subtitle: "วันนี้ (TRAIN)",
      icon: Dumbbell,
      bg: "bg-[#1E293B] hover:bg-[#334155]",
      border: "border-[#334155]",
      iconColor: "text-orange-400",
    },
    {
      id: "nutrition",
      title: "โภชนาการ",
      subtitle: "แคลอรี่ (EAT)",
      icon: Utensils,
      bg: "bg-[#1E293B] hover:bg-[#334155]",
      border: "border-[#334155]",
      iconColor: "text-emerald-400",
    },
    {
      id: "trainer_memory",
      title: "ความจำโค้ช",
      subtitle: "จุดเจ็บ & โน้ต (MEMORY)",
      icon: Brain,
      bg: "bg-[#1E293B] hover:bg-[#334155]",
      border: "border-indigo-500/40",
      iconColor: "text-indigo-400",
    },
    {
      id: "recovery",
      title: "การฟื้นตัว",
      subtitle: "การนอน (RECOVER)",
      icon: Moon,
      bg: "bg-[#1E293B] hover:bg-[#334155]",
      border: "border-[#334155]",
      iconColor: "text-indigo-400",
    },
    {
      id: "status",
      title: "เรดาร์สถานะ",
      subtitle: "สมรรถภาพ & XP",
      icon: BarChart3,
      bg: "bg-[#1E293B] hover:bg-[#334155]",
      border: "border-[#334155]",
      iconColor: "text-teal-400",
    },
    {
      id: "adapt",
      title: "ปรับโปรแกรมด่วน",
      subtitle: "เวลาน้อย / อ่อนล้า",
      icon: SlidersHorizontal,
      bg: "bg-[#0F172A] hover:bg-[#1E293B]",
      border: "border-emerald-500/40",
      iconColor: "text-emerald-300",
    },
  ];

  return (
    <div className="bg-[#0B1120] border-t border-slate-700/80 p-2 shadow-2xl select-none">
      <div className="grid grid-cols-3 gap-1.5">
        {menuTiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <button
              key={tile.id}
              onClick={() => onSelectAction(tile.id)}
              className={`${tile.bg} ${tile.border} border rounded-xl p-2 flex flex-col items-center justify-center text-center transition-all active:scale-95 group focus:outline-none`}
            >
              <div className="p-1 rounded-lg bg-black/20 mb-1 group-hover:scale-110 transition-transform">
                <Icon className={`w-5 h-5 ${tile.iconColor}`} />
              </div>
              <span className="text-[11px] font-bold text-white tracking-tight line-clamp-1">
                {tile.title}
              </span>
              <span className="text-[9px] text-slate-400 line-clamp-1">
                {tile.subtitle}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
