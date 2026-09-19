import React from "react";
import {
  User,
  ShieldCheck,
  MessageSquare,
  Bell,
  Sliders,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Info,
} from "lucide-react";
import { UserProfile, FitnessStatus } from "../types";

interface ProfileViewProps {
  profile: UserProfile;
  status: FitnessStatus;
  onOpenLine: () => void;
  onOpenOnboarding: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  status,
  onOpenLine,
  onOpenOnboarding,
}) => {
  return (
    <div className="space-y-4 pb-24">
      {/* Profile Header */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 p-[2px] shadow-md shrink-0">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"
            alt={profile.name}
            className="w-full h-full rounded-full object-cover"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 truncate">
              {profile.name}
            </h2>
            <span className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded-full font-bold">
              Level {status.level} · Rank {status.rank}
            </span>
          </div>
          <p className="text-xs text-emerald-700 font-medium truncate mt-0.5">
            {profile.goal}
          </p>
          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1.5">
            <span>{profile.age} ปี</span>
            <span>•</span>
            <span>{profile.height} ซม.</span>
            <span>•</span>
            <span>{profile.weight} กก.</span>
          </div>
        </div>
      </div>

      {/* LINE Connection Box */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#06C755] flex items-center justify-center text-white shadow-sm shadow-[#06C755]/30">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-bold text-slate-900">
                  LINE Personal Trainer
                </h3>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full">
                  เชื่อมต่อแล้ว
                </span>
              </div>
              <p className="text-[11px] text-slate-400">@fitcoach_ai (Official Account)</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          FitCoach จะส่งแจ้งเตือนก่อนเวลาซ้อม พูดคุยเช็กความพร้อม รับฟีดแบ็ก และปรับตารางให้คุณอัตโนมัติเหมือนคุยกับเทรนเนอร์ตัวจริง
        </p>

        <div className="flex items-center justify-between pt-1 text-xs">
          <span className="text-slate-500">เวลาแจ้งเตือนรายวัน:</span>
          <span className="font-bold text-slate-800">{profile.lineNotificationTime} น. (ก่อนเวลาซ้อม)</span>
        </div>

        <button
          id="simulate-line-notif-btn"
          onClick={onOpenLine}
          className="w-full py-2.5 bg-[#06C755] hover:bg-[#05b34c] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-98"
        >
          <Bell className="w-4 h-4" />
          <span>เปิดห้องแชทจำลอง LINE Trainer</span>
        </button>
      </div>

      {/* Training Preferences */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          ข้อมูลและค่ากำหนดการฝึก
        </h3>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500">เป้าหมายหลัก</span>
            <span className="font-semibold text-slate-800 text-right">{profile.goal}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500">จำนวนวันฝึกที่สะดวก</span>
            <span className="font-semibold text-slate-800">{profile.daysPerWeek} วัน / สัปดาห์</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500">ระยะเวลาต่อเซสชัน</span>
            <span className="font-semibold text-slate-800">{profile.durationMinutes} นาที</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500">สถานที่ & อุปกรณ์</span>
            <span className="font-semibold text-slate-800">{profile.environment} (ฟิตเนสครบวงจร)</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-slate-500">สไตล์การกิน</span>
            <span className="font-semibold text-slate-800">เน้นโปรตีนสูง คุมน้ำตาล</span>
          </div>
        </div>

        <button
          id="re-onboarding-btn"
          onClick={onOpenOnboarding}
          className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>ทำแบบประเมินและตั้งเป้าหมายใหม่</span>
        </button>
      </div>

      {/* Safety & Medical Disclaimer (Mandatory) */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 flex items-start gap-2.5 text-xs text-amber-950">
        <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold block text-amber-900 mb-0.5">
            ข้อจำกัดความรับผิดชอบทางการแพทย์และสุขภาพ (Safety Notice)
          </span>
          <p className="text-[11px] text-amber-900/90">
            FitCoach AI เป็นระบบช่วยเหลือวางแผนการออกกำลังกายและไลฟ์สไตล์ มิใช่แพทย์ และไม่สามารถวินิจฉัยหรือรักษาโรคได้ หากคุณมีอาการบาดเจ็บ รู้สึกเจ็บแปลบขณะฝึก หรือมีโรคประจำตัว กรุณาหยุดพักและปรึกษาแพทย์หรือผู้เชี่ยวชาญด้านสุขภาพทันที
          </p>
        </div>
      </div>
    </div>
  );
};
