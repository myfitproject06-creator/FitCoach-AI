import React, { useState } from "react";
import {
  X,
  LayoutGrid,
  Download,
  Copy,
  Check,
  Sparkles,
  Smartphone,
  Info,
  ExternalLink,
  Layers,
  Palette,
} from "lucide-react";

interface LineRichMenuStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LineRichMenuStudioModal: React.FC<LineRichMenuStudioModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedJson, setCopiedJson] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<"dark" | "emerald" | "clean">("dark");

  if (!isOpen) return null;

  // Official LINE Rich Menu Spec: 2500 x 1686 px (Standard Large), 6 grid zones
  const richMenuSpecJson = {
    size: {
      width: 2500,
      height: 1686,
    },
    selected: true,
    name: "FitCoach AI Official Rich Menu",
    chatBarText: "เมนูโค้ชฟิตเนส AI",
    areas: [
      {
        bounds: { x: 0, y: 0, width: 833, height: 843 },
        action: { type: "message", text: "ขอเริ่มดูโปรแกรมออกกำลังกายวันนี้" },
      },
      {
        bounds: { x: 833, y: 0, width: 834, height: 843 },
        action: { type: "message", text: "ขอเปิดบันทึกโภชนาการและแคลอรี่" },
      },
      {
        bounds: { x: 1667, y: 0, width: 833, height: 843 },
        action: { type: "message", text: "ขอดูรายงานการนอนหลับและการฟื้นตัว" },
      },
      {
        bounds: { x: 0, y: 843, width: 833, height: 843 },
        action: { type: "message", text: "ขอดูระดับเรดาร์สมรรถภาพของผมตอนนี้" },
      },
      {
        bounds: { x: 833, y: 843, width: 834, height: 843 },
        action: { type: "message", text: "โค้ช มีคำแนะนำสำหรับวันนี้ไหม?" },
      },
      {
        bounds: { x: 1667, y: 843, width: 833, height: 843 },
        action: { type: "message", text: "วันนี้รู้สึกเพลีย อยากขอปรับโปรแกรมด่วนครับ" },
      },
    ],
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(richMenuSpecJson, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[90vh] rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden flex flex-col text-white">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#06C755] text-white flex items-center justify-center font-bold shadow-md shadow-[#06C755]/20">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  LINE Rich Menu Designer Studio
                </h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  2500 × 1686 PX
                </span>
              </div>
              <p className="text-xs text-slate-400">
                มาตรฐานขนาดและพิกัด Tap Area ตามข้อกำหนด LINE Official Account
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Studio Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Visual Canvas (2500 x 1686 scaled preview) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-emerald-400" />
                พรีวิวดีไซน์ Rich Menu (6 กริดมาตรฐาน)
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 text-[11px]">ธีม:</span>
                <button
                  onClick={() => setSelectedTheme("dark")}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                    selectedTheme === "dark"
                      ? "bg-slate-700 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  Dark Slate
                </button>
                <button
                  onClick={() => setSelectedTheme("emerald")}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                    selectedTheme === "emerald"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  Fit Emerald
                </button>
              </div>
            </div>

            {/* Simulated 2500 x 1686 Canvas Preview */}
            <div className="w-full aspect-[2500/1686] bg-slate-950 rounded-2xl border-2 border-dashed border-slate-700 p-2 relative overflow-hidden shadow-inner flex flex-col justify-between">
              {/* Grid tiles */}
              <div className="grid grid-cols-3 grid-rows-2 gap-1.5 h-full">
                {/* Tile 1 */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center text-center relative group hover:border-orange-500/50 transition-all">
                  <span className="absolute top-1.5 left-2 text-[9px] font-mono text-slate-500">
                    A: 0,0 (833×843)
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center text-sm font-black mb-1">
                    🏋️
                  </div>
                  <span className="text-xs font-bold text-white">โปรแกรมฝึก</span>
                  <span className="text-[10px] text-slate-400">วันนี้ (TRAIN)</span>
                </div>

                {/* Tile 2 */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center text-center relative group hover:border-emerald-500/50 transition-all">
                  <span className="absolute top-1.5 left-2 text-[9px] font-mono text-slate-500">
                    B: 833,0 (834×843)
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-black mb-1">
                    🥗
                  </div>
                  <span className="text-xs font-bold text-white">โภชนาการ</span>
                  <span className="text-[10px] text-slate-400">แคลอรี่ (EAT)</span>
                </div>

                {/* Tile 3 */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center text-center relative group hover:border-indigo-500/50 transition-all">
                  <span className="absolute top-1.5 left-2 text-[9px] font-mono text-slate-500">
                    C: 1667,0 (833×843)
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-sm font-black mb-1">
                    🌙
                  </div>
                  <span className="text-xs font-bold text-white">การฟื้นตัว</span>
                  <span className="text-[10px] text-slate-400">การนอน (RECOVER)</span>
                </div>

                {/* Tile 4 */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center text-center relative group hover:border-teal-500/50 transition-all">
                  <span className="absolute top-1.5 left-2 text-[9px] font-mono text-slate-500">
                    D: 0,843 (833×843)
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center text-sm font-black mb-1">
                    📊
                  </div>
                  <span className="text-xs font-bold text-white">เรดาร์สถานะ</span>
                  <span className="text-[10px] text-slate-400">สมรรถภาพ & XP</span>
                </div>

                {/* Tile 5 */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center text-center relative group hover:border-yellow-500/50 transition-all">
                  <span className="absolute top-1.5 left-2 text-[9px] font-mono text-slate-500">
                    E: 833,843 (834×843)
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-yellow-500/20 text-yellow-400 flex items-center justify-center text-sm font-black mb-1">
                    ✨
                  </div>
                  <span className="text-xs font-bold text-white">คำแนะนำโค้ช</span>
                  <span className="text-[10px] text-slate-400">คำแนะนำประจำวัน</span>
                </div>

                {/* Tile 6 */}
                <div className="bg-slate-900 border border-emerald-500/40 rounded-xl p-3 flex flex-col items-center justify-center text-center relative group hover:border-emerald-400 transition-all">
                  <span className="absolute top-1.5 left-2 text-[9px] font-mono text-slate-500">
                    F: 1667,843 (833×843)
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-sm font-black mb-1">
                    ⚡
                  </div>
                  <span className="text-xs font-bold text-emerald-300">ปรับแผนด่วน</span>
                  <span className="text-[10px] text-slate-400">เวลาน้อย / อ่อนล้า</span>
                </div>
              </div>
            </div>
          </div>

          {/* Official Specifications & Documentation */}
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-2 text-xs">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <Info className="w-4 h-4 text-emerald-400" />
              ข้อกำหนดภาพ Rich Menu ของ LINE Official Account:
            </h4>
            <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed">
              <li><strong>ขนาดภาพ:</strong> 2500 × 1686 พิกเซล (Large Standard Template)</li>
              <li><strong>รูปแบบไฟล์ที่รองรับ:</strong> JPEG หรือ PNG (ขนาดไม่เกิน 1 MB)</li>
              <li><strong>โครงสร้าง:</strong> 6 ช่องตารางเท่ากัน (Zone A ถึง F) ช่องละ 833 × 843 px</li>
              <li><strong>ข้อความบนแถบเมนูด้านล่าง (Chat bar text):</strong> เมนูโค้ชฟิตเนส AI</li>
            </ul>
          </div>

          {/* JSON Action Configuration for LINE Official Account Manager / Bot API */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">
                Rich Menu JSON Configuration (สำหรับ LINE Messaging API / OA Manager)
              </span>
              <button
                onClick={handleCopyJson}
                className="flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedJson ? "คัดลอกแล้ว!" : "คัดลอก JSON"}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-40">
              {JSON.stringify(richMenuSpecJson, null, 2)}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            พร้อมนำไปอัปโหลดบน <strong>LINE Official Account Manager</strong>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-md cursor-pointer"
          >
            ปิดสตูดิโอ
          </button>
        </div>
      </div>
    </div>
  );
};
