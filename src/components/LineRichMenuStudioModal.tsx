import React, { useRef, useState } from "react";
import {
  X,
  Download,
  Copy,
  Check,
  LayoutGrid,
  FileCode,
  Sparkles,
  ExternalLink,
} from "lucide-react";

interface LineRichMenuStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  liffUrl?: string;
}

export const LineRichMenuStudioModal: React.FC<LineRichMenuStudioModalProps> = ({
  isOpen,
  onClose,
  liffUrl = "https://liff.line.me/YOUR_LIFF_ID",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "json">("preview");

  if (!isOpen) return null;

  const handleDownloadImage = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 2500;
    canvas.height = 1686;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw Background
    const bgGrad = ctx.createLinearGradient(0, 0, 2500, 1686);
    bgGrad.addColorStop(0, "#090d16");
    bgGrad.addColorStop(0.5, "#0f172a");
    bgGrad.addColorStop(1, "#022c22");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 2500, 1686);

    // Tiles (2 rows, 3 cols)
    const tileW = 2500 / 3;
    const tileH = 1686 / 2;

    const tiles = [
      { id: "A", title: "ตารางซ้อมวันนี้", sub: "TODAY WORKOUT", icon: "🏋️", color: "#f97316" },
      { id: "B", title: "อาหาร & แคลอรี่", sub: "NUTRITION & MACROS", icon: "🥗", color: "#10b981" },
      { id: "C", title: "การฟื้นฟู & หลับ", sub: "SLEEP & RECOVERY", icon: "🌙", color: "#6366f1" },
      { id: "D", title: "แผนฝึก 3 เดือน", sub: "TRANSFORMATION PLAN", icon: "🎯", color: "#14b8a6" },
      { id: "E", title: "ปรับตารางด่วน AI", sub: "ADAPTIVE WORKOUT", icon: "⚡", color: "#06b6d4" },
      { id: "F", title: "รายงานความก้าวหน้า", sub: "WEEKLY REPORT & RADAR", icon: "📊", color: "#f59e0b" },
    ];

    tiles.forEach((t, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = col * tileW;
      const y = row * tileH;

      // Tile background border
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 4;
      ctx.strokeRect(x + 20, y + 20, tileW - 40, tileH - 40);

      // Card Background
      ctx.fillStyle = "rgba(15, 23, 42, 0.6)";
      ctx.fillRect(x + 20, y + 20, tileW - 40, tileH - 40);

      // Accent color strip at top of card
      ctx.fillStyle = t.color;
      ctx.fillRect(x + 20, y + 20, tileW - 40, 16);

      // Icon Emoji
      ctx.font = "140px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(t.icon, x + tileW / 2, y + tileH / 2 - 100);

      // Title (Thai)
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 80px 'Kanit', 'Noto Sans Thai', sans-serif";
      ctx.fillText(t.title, x + tileW / 2, y + tileH / 2 + 80);

      // Subtitle (English)
      ctx.fillStyle = t.color;
      ctx.font = "bold 42px sans-serif";
      ctx.fillText(t.sub, x + tileW / 2, y + tileH / 2 + 190);
    });

    // Branding in Center Top/Bottom bar
    ctx.fillStyle = "#06C755";
    ctx.font = "bold 46px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("FitCoach AI • Powered by LINE & Gemini", 2500 - 80, 1686 - 50);

    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = "fitcoach-richmenu-2500x1686.png";
    link.href = dataUrl;
    link.click();
  };

  const lineRichMenuJson = {
    size: {
      width: 2500,
      height: 1686,
    },
    selected: true,
    name: "FitCoach_AI_Master_Menu",
    chatBarText: "เมนูหลัก FitCoach",
    areas: [
      {
        bounds: { x: 0, y: 0, width: 833, height: 843 },
        action: { type: "uri", uri: `${liffUrl}?view=workout` },
      },
      {
        bounds: { x: 833, y: 0, width: 834, height: 843 },
        action: { type: "uri", uri: `${liffUrl}?view=nutrition` },
      },
      {
        bounds: { x: 1667, y: 0, width: 833, height: 843 },
        action: { type: "uri", uri: `${liffUrl}?view=recovery` },
      },
      {
        bounds: { x: 0, y: 843, width: 833, height: 843 },
        action: { type: "uri", uri: `${liffUrl}?view=plan3months` },
      },
      {
        bounds: { x: 833, y: 843, width: 834, height: 843 },
        action: { type: "uri", uri: `${liffUrl}?view=adapt` },
      },
      {
        bounds: { x: 1667, y: 843, width: 833, height: 843 },
        action: { type: "uri", uri: `${liffUrl}?view=report` },
      },
    ],
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(lineRichMenuJson, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#06C755] flex items-center justify-center font-bold text-white shadow-xs">
              <LayoutGrid className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                LINE Rich Menu Design Studio (2500 x 1686 px)
              </h3>
              <p className="text-[11px] text-slate-400">
                สเปกทางการของ LINE Official Account พร้อมดาวน์โหลดภาพและคัดลอก JSON Bounds
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-4 pt-2 gap-4">
          <button
            onClick={() => setActiveTab("preview")}
            className={`pb-2.5 text-xs font-bold transition-colors border-b-2 ${
              activeTab === "preview"
                ? "border-[#06C755] text-[#06C755]"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            ภาพตัวอย่าง (Rich Menu 6 ช่อง)
          </button>
          <button
            onClick={() => setActiveTab("json")}
            className={`pb-2.5 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === "json"
                ? "border-[#06C755] text-[#06C755]"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>LINE Messaging API JSON Spec</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-white">
          {activeTab === "preview" ? (
            <div className="space-y-4">
              {/* Visual Grid Mockup (Ratio 2500:1686 ~ 1.48:1) */}
              <div className="w-full aspect-[2500/1686] bg-slate-950 rounded-2xl border-2 border-slate-700 overflow-hidden grid grid-cols-3 grid-rows-2 p-2 gap-2 shadow-inner">
                {[
                  { title: "ตารางซ้อมวันนี้", sub: "TODAY WORKOUT", emoji: "🏋️", col: "text-orange-400" },
                  { title: "อาหาร & แคลอรี่", sub: "NUTRITION & MACROS", emoji: "🥗", col: "text-emerald-400" },
                  { title: "การฟื้นฟู & หลับ", sub: "SLEEP & RECOVERY", emoji: "🌙", col: "text-indigo-400" },
                  { title: "แผนฝึก 3 เดือน", sub: "TRANSFORMATION PLAN", emoji: "🎯", col: "text-teal-400" },
                  { title: "ปรับตารางด่วน AI", sub: "ADAPTIVE WORKOUT", emoji: "⚡", col: "text-cyan-400" },
                  { title: "รายงานความก้าวหน้า", sub: "WEEKLY REPORT & RADAR", emoji: "📊", col: "text-amber-400" },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-900/90 border border-slate-800 rounded-xl p-2 sm:p-3 flex flex-col items-center justify-center text-center gap-1 hover:border-slate-700 transition-colors"
                  >
                    <span className="text-2xl sm:text-4xl">{item.emoji}</span>
                    <span className="text-[11px] sm:text-xs font-bold text-white">
                      {item.title}
                    </span>
                    <span className={`text-[8px] sm:text-[10px] font-mono uppercase ${item.col}`}>
                      {item.sub}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/80">
                <div className="text-xs text-slate-300">
                  <p className="font-semibold text-white">
                    ขนาดภาพมาตรฐาน: 2500 x 1686 px (PNG)
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    สามารถกดดาวน์โหลดแล้วนำไปอัปโหลดบน LINE Official Account Manager ได้ทันที
                  </p>
                </div>
                <button
                  onClick={handleDownloadImage}
                  className="px-4 py-2 bg-[#06C755] hover:bg-[#05b34c] text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5 shrink-0 active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ดาวน์โหลดภาพ PNG (2500x1686)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  JSON สำหรับสร้าง Rich Menu ผ่าน LINE Messaging API:
                </span>
                <button
                  onClick={handleCopyJson}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? "คัดลอกแล้ว" : "คัดลอก JSON"}</span>
                </button>
              </div>
              <pre className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-[360px] leading-relaxed">
                {JSON.stringify(lineRichMenuJson, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <a
            href="https://manager.line.biz"
            target="_blank"
            rel="noreferrer"
            className="text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>ไปที่ LINE Official Account Manager</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
