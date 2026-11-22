import React from 'react';
import { ActionPlanType, CyclePhase, ReviewProgressStatus, TalentTier } from '../../types/hrm';
import { useLanguage } from '../../i18n/LanguageContext';

export const TIER_LABELS_TH: Record<TalentTier, string> = {
  'High Performer': 'ผลงานโดดเด่น (High)',
  'Core Performer': 'ผลงานมาตรฐาน (Core)',
  'Low Performer': 'ต้องพัฒนาเร่งด่วน (Low)',
  'Probation (Exempt)': 'ทดลองงาน (ยกเว้น)',
  'Pending Review': 'รอผลประเมิน',
};

export const TierBadge: React.FC<{ tier: TalentTier }> = ({ tier }) => {
  const { lang } = useLanguage();
  const styles: Record<TalentTier, string> = {
    'High Performer': 'bg-[#ECFDF5] text-[#15803D]',
    'Core Performer': 'bg-[#EFF6FF] text-[#2563EB]',
    'Low Performer': 'bg-[#FFF1F2] text-[#E11D48]',
    'Probation (Exempt)': 'bg-[#F3F4F6] text-[#6B7280]',
    'Pending Review': 'bg-[#FFFBEB] text-[#B45309]',
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${styles[tier]}`}
    >
      {lang === 'th' ? TIER_LABELS_TH[tier] : tier}
    </span>
  );
};

export const ReviewStatusBadge: React.FC<{
  status: ReviewProgressStatus;
  isOverdue?: boolean;
  hasGrace?: boolean;
}> = ({ status, isOverdue, hasGrace }) => {
  const { bi } = useLanguage();
  if (status === 'SUBMITTED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#ECFDF5] text-[#15803D]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
        {bi('ส่งประเมินแล้ว', 'Submitted')}
      </span>
    );
  }
  if (isOverdue) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFF1F2] text-[#E11D48]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48]" />
        {hasGrace
          ? bi('เลยกำหนด • เปิดผ่อนผัน', 'Overdue • Grace Active')
          : bi('เลยกำหนด • ถูกล็อก', 'Overdue • Locked')}
      </span>
    );
  }
  if (status === 'DRAFT') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFFBEB] text-[#B45309]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
        {bi('กำลังดำเนินการ', 'In Progress')}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F3F4F6] text-[#6B7280]">
      <span className="w-1.5 h-1.5 rounded-full bg-[#9CA3AF]" />
      {bi('ยังไม่เริ่ม', 'Not Started')}
    </span>
  );
};

export const ActionPlanBadge: React.FC<{ type?: ActionPlanType | null }> = ({ type }) => {
  const { bi } = useLanguage();
  if (!type || type === 'NONE') return null;
  const map: Record<Exclude<ActionPlanType, 'NONE'>, { th: string; en: string; cls: string }> = {
    PROMOTION: { th: 'เสนอเลื่อนตำแหน่ง', en: 'Promotion Track', cls: 'bg-[#EEF0FF] text-[#5B63F6]' },
    MERIT_BONUS: { th: 'โบนัสพิเศษ', en: 'Merit Bonus', cls: 'bg-[#ECFDF5] text-[#15803D]' },
    COACHING: { th: 'แผน Coaching', en: 'Coaching Plan', cls: 'bg-[#FFFBEB] text-[#B45309]' },
    PIP: { th: 'เข้าแผน PIP', en: 'PIP Required', cls: 'bg-[#FFF1F2] text-[#E11D48]' },
  };
  const item = map[type];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${item.cls}`}>
      {bi(item.th, item.en)}
    </span>
  );
};

export const PHASE_LABELS: Record<CyclePhase, string> = {
  GOAL_SETTING: 'Goal Setting',
  SELF_REVIEW: 'Self-Assessment',
  MANAGER_REVIEW: 'Manager Review',
  CALIBRATION: 'HR Calibration',
  PUBLISHED: 'Published',
};

export const PHASE_LABELS_TH: Record<CyclePhase, string> = {
  GOAL_SETTING: 'ตั้งเป้าหมาย',
  SELF_REVIEW: 'ประเมินตนเอง',
  MANAGER_REVIEW: 'หัวหน้าประเมิน',
  CALIBRATION: 'HR ปรับเทียบ',
  PUBLISHED: 'ประกาศผลแล้ว',
};

export const CyclePhaseStepper: React.FC<{ currentPhase: CyclePhase }> = ({ currentPhase }) => {
  const { lang } = useLanguage();
  const phases: CyclePhase[] = [
    'GOAL_SETTING',
    'SELF_REVIEW',
    'MANAGER_REVIEW',
    'CALIBRATION',
    'PUBLISHED',
  ];
  const currentIndex = phases.indexOf(currentPhase);

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      {phases.map((phase, idx) => {
        const done = idx < currentIndex;
        const active = idx === currentIndex;
        return (
          <React.Fragment key={phase}>
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                active
                  ? 'bg-[#EE5D36] text-white shadow-xs'
                  : done
                  ? 'bg-[#ECFDF5] text-[#15803D]'
                  : 'bg-[#F7F8FA] text-slate-400'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                  active
                    ? 'bg-white/25 text-white'
                    : done
                    ? 'bg-[#16A34A] text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {done ? '✓' : idx + 1}
              </span>
              {lang === 'th' ? PHASE_LABELS_TH[phase] : PHASE_LABELS[phase]}
            </div>
            {idx < phases.length - 1 && (
              <div className={`w-5 h-[2px] rounded-full shrink-0 ${done ? 'bg-[#86EFAC]' : 'bg-[#E8ECF2]'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
