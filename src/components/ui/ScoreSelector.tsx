import React from 'react';
import { Language, useLanguage } from '../../i18n/LanguageContext';

interface ScoreSelectorProps {
  value: number | null;
  onChange: (val: number) => void;
  disabled?: boolean;
  accent?: 'orange' | 'indigo';
  label?: string;
}

export function getRubricShortLabel(
  score: number | null,
  lang: Language = 'en'
): { text: string; color: string } {
  const isTh = lang === 'th';
  if (score === null) {
    return { text: isTh ? 'ยังไม่ประเมิน' : 'Not rated', color: 'text-slate-500 bg-[#F3F4F6]' };
  }
  if (score >= 4.5) {
    return { text: isTh ? 'ยอดเยี่ยม' : 'Exceptional', color: 'text-[#15803D] bg-[#ECFDF5]' };
  }
  if (score >= 3.8) {
    return {
      text: isTh ? 'เกินความคาดหมาย' : 'Exceeds Expectations',
      color: 'text-[#15803D] bg-[#ECFDF5]',
    };
  }
  if (score >= 2.8) {
    return {
      text: isTh ? 'ตามเกณฑ์' : 'Meets Expectations',
      color: 'text-[#2563EB] bg-[#EFF6FF]',
    };
  }
  if (score >= 1.8) {
    return {
      text: isTh ? 'ต้องปรับปรุง' : 'Needs Improvement',
      color: 'text-[#B45309] bg-[#FFFBEB]',
    };
  }
  return { text: isTh ? 'ต่ำกว่าเกณฑ์' : 'Unsatisfactory', color: 'text-[#E11D48] bg-[#FFF1F2]' };
}

export const ScoreSelector: React.FC<ScoreSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  accent = 'orange',
  label,
}) => {
  const { lang, bi } = useLanguage();
  const displayLabel = label ?? bi('คะแนนประเมิน', 'Rating');
  const activeVal = value ?? 3.0;
  const rubric = getRubricShortLabel(value, lang);
  const activeBtnCls =
    accent === 'orange'
      ? 'bg-[#EE5D36] text-white border-[#EE5D36]'
      : 'bg-[#5B63F6] text-white border-[#5B63F6]';
  const sliderAccent = accent === 'orange' ? 'accent-[#EE5D36]' : 'accent-[#5B63F6]';
  const scoreTextCls = accent === 'orange' ? 'text-[#EE5D36]' : 'text-[#5B63F6]';

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#212141]">{displayLabel}</span>
          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${rubric.color}`}>
            {rubric.text}
          </span>
        </div>

        {/* Clean 1-5 Pill Selector */}
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => {
            const isSelected = value !== null && Math.round(value) === n;
            return (
              <button
                key={n}
                type="button"
                disabled={disabled}
                onClick={() => onChange(n)}
                className={`w-7 h-7 rounded-full text-xs font-bold border transition disabled:opacity-40 ${
                  isSelected
                    ? activeBtnCls
                    : 'bg-white text-slate-600 border-[#E8ECF2] hover:border-[#EE5D36] hover:text-[#EE5D36]'
                }`}
              >
                {n}
              </button>
            );
          })}
          <span className={`font-mono font-extrabold text-sm w-10 text-right ${scoreTextCls}`}>
            {value !== null ? value.toFixed(1) : '—'}
          </span>
        </div>
      </div>

      <input
        type="range"
        min="1"
        max="5"
        step="0.1"
        disabled={disabled}
        value={activeVal}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full h-1.5 rounded-lg cursor-pointer ${sliderAccent} disabled:opacity-40`}
      />
    </div>
  );
};
