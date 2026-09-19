import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Download,
  Copy,
  Check,
  Palette,
  LayoutGrid,
  Code,
  Sparkles,
  ExternalLink,
  Dumbbell,
  Utensils,
  Calendar,
  ShieldCheck,
  SlidersHorizontal,
  BarChart3,
  Smartphone,
  Eye,
  FileJson,
  Layers,
  Send,
  Key,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { CoachAccountabilityState } from "../types";

interface LineRichMenuStudioModalProps {
  onClose: () => void;
  accountability?: CoachAccountabilityState;
  onApplyToChat?: () => void;
}

type MenuTheme = "athletic_dark" | "line_emerald" | "cyber_navy";
type MenuLayout = "large_6" | "compact_3";

interface TileConfig {
  id: string;
  titleTh: string;
  titleEn: string;
  desc: string;
  badge: string;
  actionText: string;
  iconType: "dumbbell" | "utensils" | "calendar" | "shield" | "sliders" | "chart";
}

const DEFAULT_TILES_6: TileConfig[] = [
  {
    id: "tile_a",
    titleTh: "ตารางซ้อมวันนี้",
    titleEn: "TODAY'S WORKOUT",
    desc: "นัดหมาย 18:00 น. • เริ่มซ้อมทันที",
    badge: "18:00 น.",
    actionText: "ขอตารางซ้อมวันนี้หน่อยครับ พร้อมลุยแล้ว",
    iconType: "dumbbell",
  },
  {
    id: "tile_b",
    titleTh: "บันทึกมื้ออาหาร",
    titleEn: "AUTO-NUTRITION",
    desc: "คำนวณแคล/โปรตีน บันทึกลงแอปทันที",
    badge: "AI Calc",
    actionText: "กินข้าวมันไก่ตอน 1 จาน กับกล้วยหอม 1 ลูก คำนวณแคลอรีและบันทึกลงแอปให้หน่อยครับ",
    iconType: "utensils",
  },
  {
    id: "tile_c",
    titleTh: "แผน 3 เดือน",
    titleEn: "3-MONTH PROGRAM",
    desc: "Tom Holland / V-Taper / Hypertrophy",
    badge: "Custom",
    actionText: "จัดแผน 3 เดือนหุ่น Tom Holland ให้หน่อยครับ อยากรู้ตารางซ้อมและอาหาร",
    iconType: "calendar",
  },
  {
    id: "tile_d",
    titleTh: "เช็คชื่อ & วินัย",
    titleEn: "DISCIPLINE & STREAKS",
    desc: "ติดตามเวลาซ้อม • ปลดล็อคบทลงโทษ",
    badge: "Discipline",
    actionText: "เช็คสถานะวินัยและการนัดหมายซ้อมของวันนี้หน่อยครับ",
    iconType: "shield",
  },
  {
    id: "tile_e",
    titleTh: "ปรับแผนเมื่อล้า",
    titleEn: "ADAPTIVE WORKOUT",
    desc: "ลดความหนัก RPE / ฟื้นฟูกล้ามเนื้อ",
    badge: "Smart Adapt",
    actionText: "วันนี้รู้สึกเหนื่อยและตึงกล้ามเนื้อมาก ช่วยปรับแผนการฝึกให้เบาลงหน่อยครับ",
    iconType: "sliders",
  },
  {
    id: "tile_f",
    titleTh: "สรุปผล & สถิติ",
    titleEn: "WEEKLY REPORT & XP",
    desc: "วิเคราะห์แคลอรี • โมเมนตัม • เลเวล",
    badge: "XP Stats",
    actionText: "สรุปผลการออกกำลังกายและพัฒนาการของสัปดาห์นี้ให้หน่อยครับ",
    iconType: "chart",
  },
];

export const LineRichMenuStudioModal: React.FC<LineRichMenuStudioModalProps> = ({
  onClose,
  accountability,
}) => {
  const [theme, setTheme] = useState<MenuTheme>("athletic_dark");
  const [layout, setLayout] = useState<MenuLayout>("large_6");
  const [activeTab, setActiveTab] = useState<"preview" | "json" | "deploy" | "guide">("preview");
  const [copiedJson, setCopiedJson] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null);

  // Admin deployment states
  const [adminKey, setAdminKey] = useState<string>(() => {
    try {
      return localStorage.getItem("fitcoach_admin_key") || "";
    } catch {
      return "";
    }
  });
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState<{
    success: boolean;
    message: string;
    richMenuId?: string;
  } | null>(null);
  const [menuStatus, setMenuStatus] = useState<any>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Map each tile to postback or message action
  const getActionForTile = (tileId: string, fallbackText: string) => {
    switch (tileId) {
      case "tile_a":
        return {
          type: "postback",
          data: "action=workout_today",
          displayText: "ขอตารางซ้อมวันนี้หน่อยครับ",
        };
      case "tile_b":
        return {
          type: "postback",
          data: "action=log_food",
          displayText: "บันทึกอาหารวันนี้ให้หน่อยครับ",
        };
      case "tile_c":
        return {
          type: "postback",
          data: "action=plan_3months",
          displayText: "จัดแผน 3 เดือนหุ่น Tom Holland ให้หน่อยครับ",
        };
      case "tile_d":
        return {
          type: "postback",
          data: "action=discipline_check",
          displayText: "เช็คสถานะวินัยและเวลานัดซ้อม",
        };
      case "tile_e":
        return {
          type: "message",
          text: "วันนี้รู้สึกเหนื่อยมาก ช่วยปรับแผนการฝึกให้เบาลงหน่อยครับ",
        };
      case "tile_f":
        return {
          type: "postback",
          data: "action=weekly_report",
          displayText: "สรุปผลการออกกำลังกายสัปดาห์นี้",
        };
      default:
        return {
          type: "message",
          text: fallbackText,
        };
    }
  };

  // Generate LINE Messaging API JSON Specification
  const generateLineJson = () => {
    const isLarge = layout === "large_6";
    const width = 2500;
    const height = isLarge ? 1686 : 843;

    let areas = [];
    if (isLarge) {
      // 6 grids (2 rows x 3 columns)
      const colWidth = Math.floor(width / 3); // ~833
      const rowHeight = Math.floor(height / 2); // 843
      areas = DEFAULT_TILES_6.map((tile, idx) => {
        const col = idx % 3;
        const row = Math.floor(idx / 3);
        return {
          bounds: {
            x: col * colWidth,
            y: row * rowHeight,
            width: col === 2 ? width - colWidth * 2 : colWidth,
            height: rowHeight,
          },
          action: getActionForTile(tile.id, tile.actionText),
        };
      });
    } else {
      // 3 grids (1 row x 3 columns)
      const colWidth = Math.floor(width / 3);
      areas = DEFAULT_TILES_6.slice(0, 3).map((tile, idx) => {
        return {
          bounds: {
            x: idx * colWidth,
            y: 0,
            width: idx === 2 ? width - colWidth * 2 : colWidth,
            height: height,
          },
          action: getActionForTile(tile.id, tile.actionText),
        };
      });
    }

    return {
      size: {
        width,
        height,
      },
      selected: true,
      name: `FitCoach_RichMenu_${theme.toUpperCase()}_V2`,
      chatBarText: "▲ เมนูหลัก FitCoach AI",
      areas,
    };
  };

  const checkLineStatus = async () => {
    if (!adminKey) return;
    setStatusLoading(true);
    try {
      const res = await fetch(`/api/admin/rich-menu/status?key=${encodeURIComponent(adminKey)}`);
      const data = await res.json();
      setMenuStatus(data);
    } catch (err: any) {
      console.error("Status check failed:", err);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleDeployToLine = async () => {
    if (!adminKey.trim()) {
      setDeployResult({
        success: false,
        message: "กรุณาระบุ ADMIN_KEY ให้ตรงกับที่ตั้งค่าไว้ใน Environment Variables บน Render ครับ",
      });
      return;
    }

    try {
      localStorage.setItem("fitcoach_admin_key", adminKey.trim());
    } catch {}

    setIsDeploying(true);
    setDeployResult(null);

    try {
      const canvas = canvasRef.current;
      const imageBase64 = canvas ? canvas.toDataURL("image/png") : undefined;

      const res = await fetch("/api/admin/rich-menu/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey.trim(),
        },
        body: JSON.stringify({
          imageBase64,
          config: generateLineJson(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setDeployResult({
          success: true,
          message: data.message || "ติดตั้ง Rich Menu ไปยัง LINE OA สำเร็จ!",
          richMenuId: data.richMenuId,
        });
        checkLineStatus();
      } else {
        setDeployResult({
          success: false,
          message: data.error || data.details || "เกิดข้อผิดพลาดในการเชื่อมต่อ LINE Messaging API",
        });
      }
    } catch (err: any) {
      setDeployResult({
        success: false,
        message: err.message || "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้",
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const lineJsonString = JSON.stringify(generateLineJson(), null, 2);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(lineJsonString);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  // Draw High-Res 2500 x 1686 Graphic onto Canvas for direct PNG Export
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const isLarge = layout === "large_6";
    const width = 2500;
    const height = isLarge ? 1686 : 843;

    canvas.width = width;
    canvas.height = height;

    // Theme Color Sets
    let bgMain = "#0B1120";
    let bgTile = "#151F32";
    let bgTileHover = "#1E293B";
    let borderTile = "#334155";
    let textPrimary = "#FFFFFF";
    let textSecondary = "#94A3B8";
    let accent = "#10B981"; // Emerald
    let accentAlt = "#06C755"; // LINE Green

    if (theme === "line_emerald") {
      bgMain = "#044E26";
      bgTile = "#056834";
      bgTileHover = "#07783D";
      borderTile = "#0B8C49";
      accent = "#55EF8A";
      accentAlt = "#FFFFFF";
    } else if (theme === "cyber_navy") {
      bgMain = "#030712";
      bgTile = "#0F172A";
      bgTileHover = "#1E293B";
      borderTile = "#38BDF8";
      accent = "#38BDF8"; // Cyan
      accentAlt = "#F59E0B"; // Amber
    }

    // Fill background
    ctx.fillStyle = bgMain;
    ctx.fillRect(0, 0, width, height);

    const cols = 3;
    const rows = isLarge ? 2 : 1;
    const tileW = width / cols;
    const tileH = height / rows;

    const tiles = isLarge ? DEFAULT_TILES_6 : DEFAULT_TILES_6.slice(0, 3);

    tiles.forEach((tile, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = col * tileW;
      const y = row * tileH;

      // Draw Tile Background with gradient
      const grad = ctx.createLinearGradient(x, y, x + tileW, y + tileH);
      grad.addColorStop(0, bgTile);
      grad.addColorStop(1, bgTileHover);
      ctx.fillStyle = grad;
      ctx.fillRect(x + 10, y + 10, tileW - 20, tileH - 20);

      // Draw Rounded border
      ctx.strokeStyle = borderTile;
      ctx.lineWidth = 6;
      ctx.strokeRect(x + 10, y + 10, tileW - 20, tileH - 20);

      // Accent top line for athletic feel
      ctx.fillStyle = index === 0 ? "#10B981" : index === 3 ? "#F43F5E" : accent;
      ctx.fillRect(x + 10, y + 10, tileW - 20, 16);

      // Badge top right
      const badgeText = tile.badge;
      ctx.font = "bold 44px sans-serif";
      const badgeMetrics = ctx.measureText(badgeText);
      const badgeW = badgeMetrics.width + 40;
      const badgeH = 70;
      const badgeX = x + tileW - badgeW - 40;
      const badgeY = y + 45;

      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
      ctx.strokeStyle = accent;
      ctx.lineWidth = 3;
      ctx.strokeRect(badgeX, badgeY, badgeW, badgeH);

      ctx.fillStyle = accentAlt;
      ctx.fillText(badgeText, badgeX + 20, badgeY + 50);

      // Draw Icon symbol container
      const iconCenterX = x + 150;
      const iconCenterY = y + tileH / 2 - 20;

      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.beginPath();
      ctx.arc(iconCenterX, iconCenterY, 80, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 4;
      ctx.stroke();

      // Simple icon glyphs on canvas
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 80px sans-serif";
      const iconChar =
        tile.iconType === "dumbbell"
          ? "🏋️"
          : tile.iconType === "utensils"
          ? "🥗"
          : tile.iconType === "calendar"
          ? "🗓️"
          : tile.iconType === "shield"
          ? "🛡️"
          : tile.iconType === "sliders"
          ? "⚡"
          : "📊";
      ctx.fillText(iconChar, iconCenterX - 45, iconCenterY + 28);

      // Text information
      const textX = x + 270;
      const textStartY = y + tileH / 2 - 60;

      // English category eyebrow
      ctx.fillStyle = accent;
      ctx.font = "bold 34px sans-serif";
      ctx.fillText(tile.titleEn, textX, textStartY);

      // Thai Main Title
      ctx.fillStyle = textPrimary;
      ctx.font = "bold 64px sans-serif";
      ctx.fillText(tile.titleTh, textX, textStartY + 75);

      // Thai Description
      ctx.fillStyle = textSecondary;
      ctx.font = "40px sans-serif";
      ctx.fillText(tile.desc, textX, textStartY + 135);
    });

    // Outer framing watermarks & LINE OA badge
    ctx.fillStyle = "rgba(6, 199, 85, 0.9)";
    ctx.fillRect(width - 480, height - 60, 460, 50);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 28px sans-serif";
    ctx.fillText("FITCOACH OFFICIAL RICH MENU", width - 460, height - 25);
  };

  useEffect(() => {
    drawCanvas();
  }, [theme, layout]);

  // Download High-Res 2500x1686 PNG file
  const handleDownloadImage = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) {
        setIsGenerating(false);
        return;
      }
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `FitCoach_Line_RichMenu_${layout}_${theme}_2500x${
        layout === "large_6" ? "1686" : "843"
      }.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setIsGenerating(false);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#06C755] to-emerald-400 p-0.5 flex items-center justify-center text-white shadow-md">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  LINE Rich Menu Design Studio
                </h2>
                <span className="text-[10px] bg-[#06C755]/20 text-[#06C755] border border-[#06C755]/40 px-2 py-0.5 rounded-full font-bold">
                  2500 × 1686 px Standard
                </span>
              </div>
              <p className="text-xs text-slate-400">
                ออกแบบเมนูริช LINE OA • พรีวิวแอคชัน • ดาวน์โหลดภาพความละเอียดสูง & คัดลอก JSON API
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation & Toolbar */}
        <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {/* Main Tabs */}
          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              onClick={() => setActiveTab("preview")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "preview"
                  ? "bg-[#06C755] text-white shadow-xs"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>พรีวิวเมนู 6 ช่อง</span>
            </button>
            <button
              onClick={() => setActiveTab("json")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "json"
                  ? "bg-[#06C755] text-white shadow-xs"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <FileJson className="w-3.5 h-3.5" />
              <span>LINE Messaging API JSON</span>
            </button>
            <button
              onClick={() => setActiveTab("deploy")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "deploy"
                  ? "bg-[#06C755] text-white shadow-xs"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>🚀 ติดตั้งไปยัง LINE Bot</span>
            </button>
            <button
              onClick={() => setActiveTab("guide")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "guide"
                  ? "bg-[#06C755] text-white shadow-xs"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>คู่มือนำไปใช้ใน LINE OA</span>
            </button>
          </div>

          {/* Controls: Theme & Layout */}
          <div className="flex items-center gap-2">
            {/* Theme Picker */}
            <div className="flex items-center gap-1 bg-slate-800/60 px-2 py-1 rounded-xl border border-slate-700 text-xs">
              <Palette className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as MenuTheme)}
                className="bg-transparent text-white text-xs font-medium focus:outline-none cursor-pointer"
              >
                <option value="athletic_dark" className="bg-slate-900 text-white">
                  Athletic Pro Dark
                </option>
                <option value="line_emerald" className="bg-slate-900 text-white">
                  LINE Official Emerald
                </option>
                <option value="cyber_navy" className="bg-slate-900 text-white">
                  Cyberpunk Cyan
                </option>
              </select>
            </div>

            {/* Layout Picker */}
            <div className="flex items-center gap-1 bg-slate-800/60 px-2 py-1 rounded-xl border border-slate-700 text-xs">
              <select
                value={layout}
                onChange={(e) => setLayout(e.target.value as MenuLayout)}
                className="bg-transparent text-white text-xs font-medium focus:outline-none cursor-pointer"
              >
                <option value="large_6" className="bg-slate-900 text-white">
                  ใหญ่ (2500x1686 px • 6 ช่อง)
                </option>
                <option value="compact_3" className="bg-slate-900 text-white">
                  กะทัดรัด (2500x843 px • 3 ช่อง)
                </option>
              </select>
            </div>

            {/* Download PNG Button */}
            <button
              onClick={handleDownloadImage}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isGenerating ? "กำลังสร้างภาพ..." : "ดาวน์โหลดภาพ PNG"}</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === "preview" && (
            <div className="space-y-4">
              {/* Visual Preview Container */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-inner flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-2 px-1 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-[#06C755]" />
                    <span>
                      สเกลพรีวิวอัตราส่วนมาตรฐาน LINE OA (
                      {layout === "large_6" ? "2,500 × 1,686 px" : "2,500 × 843 px"})
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-semibold">
                    คลิกช่องเพื่อดู Action Text ของบอท
                  </span>
                </div>

                {/* Offscreen Canvas for Export */}
                <canvas ref={canvasRef} className="hidden" />

                {/* Interactive Simulated Preview Grid */}
                <div
                  className={`w-full max-w-3xl rounded-2xl overflow-hidden border-2 shadow-2xl transition-all ${
                    theme === "line_emerald"
                      ? "bg-[#044E26] border-[#0B8C49]"
                      : theme === "cyber_navy"
                      ? "bg-[#030712] border-sky-500/40"
                      : "bg-[#0B1120] border-slate-700"
                  }`}
                >
                  <div
                    className={`grid ${
                      layout === "large_6" ? "grid-cols-3 grid-rows-2" : "grid-cols-3"
                    } gap-2 p-2`}
                  >
                    {(layout === "large_6" ? DEFAULT_TILES_6 : DEFAULT_TILES_6.slice(0, 3)).map(
                      (tile, idx) => {
                        const isSelected = selectedTileIndex === idx;
                        return (
                          <div
                            key={tile.id}
                            onClick={() => setSelectedTileIndex(idx)}
                            className={`relative rounded-xl p-3 sm:p-4 border transition-all cursor-pointer flex flex-col justify-between group overflow-hidden ${
                              isSelected
                                ? "ring-2 ring-[#06C755] bg-slate-800/90 border-[#06C755] shadow-lg scale-[1.01]"
                                : theme === "line_emerald"
                                ? "bg-[#056834] border-[#0B8C49]/60 hover:bg-[#07783D]"
                                : theme === "cyber_navy"
                                ? "bg-[#0F172A] border-sky-900/60 hover:bg-slate-800"
                                : "bg-[#151F32] border-slate-700/70 hover:bg-slate-800/80"
                            }`}
                            style={{ minHeight: layout === "large_6" ? "140px" : "130px" }}
                          >
                            {/* Top decorative accent bar */}
                            <div
                              className={`absolute top-0 left-0 right-0 h-1.5 ${
                                idx === 0
                                  ? "bg-emerald-400"
                                  : idx === 3
                                  ? "bg-rose-500"
                                  : "bg-[#06C755]"
                              }`}
                            />

                            {/* Header row: Eyebrow + Badge */}
                            <div className="flex items-center justify-between gap-1 mt-1">
                              <span
                                className={`text-[10px] font-extrabold tracking-wider ${
                                  theme === "cyber_navy" ? "text-sky-400" : "text-emerald-400"
                                }`}
                              >
                                {tile.titleEn}
                              </span>
                              <span className="text-[10px] bg-black/40 text-slate-200 px-2 py-0.5 rounded-full border border-white/10 font-bold whitespace-nowrap">
                                {tile.badge}
                              </span>
                            </div>

                            {/* Middle: Icon + Title */}
                            <div className="my-2 flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-black/30 border border-white/10 flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform">
                                {tile.iconType === "dumbbell" && "🏋️"}
                                {tile.iconType === "utensils" && "🥗"}
                                {tile.iconType === "calendar" && "🗓️"}
                                {tile.iconType === "shield" && "🛡️"}
                                {tile.iconType === "sliders" && "⚡"}
                                {tile.iconType === "chart" && "📊"}
                              </div>
                              <div className="truncate">
                                <h4 className="text-sm sm:text-base font-bold text-white truncate">
                                  {tile.titleTh}
                                </h4>
                                <p className="text-[11px] text-slate-300 truncate">
                                  {tile.desc}
                                </p>
                              </div>
                            </div>

                            {/* Bottom: Action Trigger Indicator */}
                            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
                              <span className="truncate max-w-[80%] text-slate-400">
                                💬 "{tile.actionText.slice(0, 32)}..."
                              </span>
                              <span className="text-[#06C755] font-bold group-hover:underline">
                                Action →
                              </span>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>

                {/* Simulated Chat Bar (The Bottom Bar in LINE) */}
                <div className="w-full max-w-3xl bg-[#1E293B] border-t border-slate-700 p-2.5 flex items-center justify-between rounded-b-xl text-xs text-slate-300 mt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[#06C755] font-bold">▲</span>
                    <span className="font-semibold text-white">เมนูหลัก FitCoach AI</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    แถบเมนูแชทมาตรฐาน (Chat Bar)
                  </span>
                </div>
              </div>

              {/* Selected Tile Inspector */}
              {selectedTileIndex !== null && (
                <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span>📌 รายละเอียด Action: {DEFAULT_TILES_6[selectedTileIndex].titleTh}</span>
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      พิกัด Area #{selectedTileIndex + 1}
                    </span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block mb-1">ข้อความที่จะส่งหา AI เมื่อผู้ใช้แตะ:</span>
                      <p className="font-semibold text-white">
                        "{DEFAULT_TILES_6[selectedTileIndex].actionText}"
                      </p>
                    </div>
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block mb-1">ผลลัพธ์ของระบบอัตโนมัติ:</span>
                      <p className="text-slate-200">
                        {selectedTileIndex === 0 && "ส่งการ์ดตารางซ้อม 18:00 น. และปุ่มเริ่ม Workout"}
                        {selectedTileIndex === 1 && "คำนวณสารอาหารและบันทึกลง Nutrition ของแอปโดยอัตโนมัติ"}
                        {selectedTileIndex === 2 && "สร้างโปรแกรม 3 เดือน (Tom Holland / Hypertrophy)"}
                        {selectedTileIndex === 3 && "เช็คเวลาซ้อม, สถานะ Strike และภารกิจปลดล็อคบทลงโทษ"}
                        {selectedTileIndex === 4 && "ลดความหนัก RPE เมื่อกล้ามเนื้อล้าหรือไม่มีเวลา"}
                        {selectedTileIndex === 5 && "แสดงรายงานคะแนนสัปดาห์, XP และพัฒนาการ"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* JSON Tab */}
          {activeTab === "json" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white">
                    LINE Messaging API - Rich Menu JSON Specification
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    นำ JSON นี้ไปสร้าง Rich Menu ผ่าน LINE Developers Console, Postman หรือ cURL
                  </p>
                </div>
                <button
                  onClick={handleCopyJson}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#06C755] hover:bg-[#05b34c] text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  {copiedJson ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedJson ? "คัดลอกสำเร็จ!" : "คัดลอก JSON โค้ด"}</span>
                </button>
              </div>

              <div className="relative">
                <pre className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-[11px] text-emerald-300 font-mono overflow-x-auto max-h-[380px]">
                  {lineJsonString}
                </pre>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 text-xs text-slate-300 space-y-1">
                <span className="font-bold text-white block">💡 คำสั่ง cURL สำหรับสร้างผ่าน API:</span>
                <code className="block bg-slate-950 p-2 rounded-lg text-[10px] text-slate-400 overflow-x-auto font-mono">
                  curl -v -X POST https://api.line.me/v2/bot/richmenu -H "Authorization: Bearer &lt;YOUR_CHANNEL_ACCESS_TOKEN&gt;" -H "Content-Type: application/json" -d '@richmenu.json'
                </code>
              </div>
            </div>
          )}

          {/* Direct Deploy to LINE Bot Tab */}
          {activeTab === "deploy" && (
            <div className="space-y-4 text-xs text-slate-200">
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#06C755] text-white flex items-center justify-center text-xs font-bold">
                        🚀
                      </span>
                      <span>ติดตั้ง Rich Menu ไปยัง LINE Bot โดยอัตโนมัติ (1-Click Deploy)</span>
                    </h3>
                    <p className="text-slate-400 mt-1 text-xs">
                      ระบบจะสร้างโครงสร้างริชเมนู 6 ช่อง, อัปโหลดภาพ 2500x1686 px ที่คุณเลือก, และตั้งเป็นเมนูหลักเริ่มต้น (Default) บน LINE ให้ทันที
                    </p>
                  </div>
                  <button
                    onClick={checkLineStatus}
                    disabled={statusLoading}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${statusLoading ? "animate-spin" : ""}`} />
                    <span>เช็คสถานะบอท</span>
                  </button>
                </div>

                {/* Status Box */}
                {menuStatus && (
                  <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-700/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">สถานะ Default Rich Menu ปัจจุบัน:</span>
                      <span className="font-mono text-emerald-400 font-bold">
                        {menuStatus.defaultMenuId || "ยังไม่ได้ตั้งค่า"}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      จำนวน Rich Menu ทั้งหมดในระบบ: {menuStatus.menus?.length || 0} รายการ
                    </div>
                  </div>
                )}

                {/* Admin Key Input */}
                <div className="space-y-1.5 pt-2 border-t border-slate-700/80">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    <span>ADMIN_KEY (กุญแจผู้ดูแลระบบ):</span>
                  </label>
                  <p className="text-[11px] text-slate-400">
                    ต้องตรงกับค่า <code>ADMIN_KEY</code> ที่คุณตั้งไว้ใน Environment Variables บน Render
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      value={adminKey}
                      onChange={(e) => setAdminKey(e.target.value)}
                      placeholder="ใส่ ADMIN_KEY เช่น my-fitcoach-secret-admin"
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#06C755]"
                    />
                    <button
                      onClick={handleDeployToLine}
                      disabled={isDeploying}
                      className="flex items-center gap-2 px-5 py-2 bg-[#06C755] hover:bg-[#05b34c] disabled:bg-slate-700 text-white font-bold rounded-xl text-xs transition-all shadow-lg active:scale-95 cursor-pointer shrink-0"
                    >
                      {isDeploying ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>กำลังติดตั้ง...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>ติดตั้งไปยัง LINE ทันที</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Results notification */}
                {deployResult && (
                  <div
                    className={`p-3.5 rounded-xl border flex items-start gap-2.5 animate-in fade-in duration-200 ${
                      deployResult.success
                        ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-200"
                        : "bg-rose-950/60 border-rose-500/50 text-rose-200"
                    }`}
                  >
                    {deployResult.success ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1 text-xs">
                      <strong className="block font-bold">
                        {deployResult.success ? "สำเร็จ!" : "ไม่สามารถติดตั้งได้"}
                      </strong>
                      <p>{deployResult.message}</p>
                      {deployResult.richMenuId && (
                        <div className="font-mono text-[11px] text-emerald-300">
                          Rich Menu ID: {deployResult.richMenuId}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* cURL Alternative */}
              <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-4 space-y-2">
                <span className="font-bold text-slate-300 block">💡 หรือสั่งงานผ่าน cURL / Terminal:</span>
                <code className="block bg-slate-950 p-2.5 rounded-xl text-[11px] text-emerald-400 overflow-x-auto font-mono">
                  curl -X POST {typeof window !== "undefined" ? window.location.origin : "https://your-domain.onrender.com"}/api/admin/rich-menu/setup \<br />
                  &nbsp;&nbsp;-H "x-admin-key: YOUR_ADMIN_KEY" \<br />
                  &nbsp;&nbsp;-H "Content-Type: application/json"
                </code>
              </div>
            </div>
          )}

          {/* Guide Tab */}
          {activeTab === "guide" && (
            <div className="space-y-4 text-xs text-slate-200">
              <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#06C755] text-white flex items-center justify-center text-xs font-bold">
                    ✓
                  </span>
                  <span>วิธีนำภาพและเมนูไปติดตั้งใน LINE Official Account (ทำตามได้ใน 3 นาที)</span>
                </h3>

                <div className="space-y-3 pl-8">
                  <div className="space-y-1">
                    <strong className="text-white block">
                      ขั้นตอนที่ 1: ดาวน์โหลดภาพ Rich Menu จากหน้านี้
                    </strong>
                    <p className="text-slate-400">
                      กดปุ่ม <strong>"ดาวน์โหลดภาพ PNG"</strong> ด้านบน ระบบจะสร้างไฟล์ภาพความละเอียดสูงขนาด{" "}
                      <strong>2,500 × 1,686 พิกเซล</strong> ที่ผ่านมาตรฐานของ LINE OA ทันที
                    </p>
                  </div>

                  <div className="space-y-1">
                    <strong className="text-white block">
                      ขั้นตอนที่ 2: เข้าสู่ LINE Official Account Manager
                    </strong>
                    <p className="text-slate-400">
                      เปิดเว็บไซต์{" "}
                      <a
                        href="https://manager.line.biz"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#06C755] underline inline-flex items-center gap-1"
                      >
                        manager.line.biz <ExternalLink className="w-3 h-3" />
                      </a>{" "}
                      เลือกบัญชีบอทของคุณ &gt; ไปที่เมนูด้านซ้าย <strong>"ริชเมนู" (Rich Menus)</strong>
                    </p>
                  </div>

                  <div className="space-y-1">
                    <strong className="text-white block">
                      ขั้นตอนที่ 3: กด "สร้างริชเมนู" (Create New)
                    </strong>
                    <p className="text-slate-400">
                      • กำหนดชื่อเมนู: เช่น <code>FitCoach_RichMenu_V1</code>
                      <br />
                      • ข้อความแถบเมนู: เช่น <code>▲ เมนูหลัก FitCoach AI</code>
                      <br />• เลือกเทมเพลต: เลือกแบบ <strong>ใหญ่ (6 ช่อง / 2 แถว 3 คอลัมน์)</strong>
                    </p>
                  </div>

                  <div className="space-y-1">
                    <strong className="text-white block">
                      ขั้นตอนที่ 4: อัปโหลดรูปภาพและกำหนดการกระทำ (Actions)
                    </strong>
                    <p className="text-slate-400">
                      อัปโหลดไฟล์ภาพที่ดาวน์โหลดมา แล้วเลือก Action เป็น <strong>"ข้อความ" (Text)</strong> ตามสเปก:
                    </p>
                    <ul className="list-disc pl-5 space-y-0.5 text-slate-300 font-mono text-[11px]">
                      <li>ช่อง A: "ขอตารางซ้อมวันนี้หน่อยครับ"</li>
                      <li>ช่อง B: "กินข้าวมันไก่ตอน 1 จาน คำนวณแคลอรีและบันทึกลงแอป"</li>
                      <li>ช่อง C: "จัดแผน 3 เดือนหุ่น Tom Holland ให้หน่อยครับ"</li>
                      <li>ช่อง D: "เช็คสถานะวินัยและการนัดหมายซ้อม"</li>
                      <li>ช่อง E: "วันนี้รู้สึกเหนื่อยมาก ช่วยปรับแผนการฝึก"</li>
                      <li>ช่อง F: "สรุปผลการออกกำลังกายสัปดาห์นี้"</li>
                    </ul>
                  </div>

                  <div className="space-y-1">
                    <strong className="text-white block">ขั้นตอนที่ 5: บันทึกและเผยแพร่</strong>
                    <p className="text-slate-400">
                      กดบันทึก เมนูริชจะไปแสดงที่หน้าจอแชท LINE ของผู้ใช้งานทุกคนทันที!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#06C755]" />
            <span>พร้อมใช้งานทั้งบน LINE Chat Mockup ในแอป และ LINE Official Account จริง</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              ปิดหน้าต่าง
            </button>
            <button
              onClick={handleDownloadImage}
              className="px-4 py-1.5 bg-[#06C755] hover:bg-[#05b34c] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ดาวน์โหลดภาพ (2500x1686)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
