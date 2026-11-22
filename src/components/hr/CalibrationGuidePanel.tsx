import React from 'react';
import { Database, Scale, Calculator, ShieldCheck, ArrowRight } from 'lucide-react';
import { EnrichedEmployee, ManagerStats, ReviewCycle } from '../../types/hrm';
import { TierBadge } from '../ui/Badges';
import { useLanguage } from '../../i18n/LanguageContext';

interface Props {
  cycle: ReviewCycle;
  employees: EnrichedEmployee[];
  managerStats: ManagerStats[];
}

export const CalibrationGuidePanel: React.FC<Props> = ({ cycle, employees, managerStats }) => {
  const { bi } = useLanguage();
  const strictMgr = managerStats.find((m) => m.biasLabel === 'Strict Grader') ?? managerStats[0];
  const lenientMgr = managerStats.find((m) => m.biasLabel === 'Lenient Grader') ?? managerStats[1];

  const nadia = employees.find((e) => e.id === 'EMP-01');
  const kanya = employees.find((e) => e.id === 'EMP-06');

  return (
    <section className="bg-[#212141] text-white rounded-3xl p-6 sm:p-7 shadow-card space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-block text-[11px] font-bold tracking-wide text-[#F4815F] bg-white/10 px-3 py-1 rounded-full">
              {bi('หลักการประเมินอย่างเป็นธรรม', 'Fair Review Methodology')}
            </span>
            <span className="inline-block text-[11px] font-bold tracking-wide text-emerald-300 bg-emerald-500/15 border border-emerald-400/25 px-3 py-1 rounded-full">
              {bi(
                'คำนวณอัตโนมัติแบบ Real-time • ไม่ต้องเทรน AI',
                'Auto Real-Time Math • No AI Training Required'
              )}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-white mt-2">
            {bi(
              'หลักการ Fair Calibration — คิดคะแนนยังไงให้เป็นธรรมข้ามแผนก',
              'How Fair Calibration Works — Ensuring Cross-Department Fairness'
            )}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
            {bi(
              'ระบบนี้ไม่ได้ใช้โมเดล AI แบบกล่องดำที่ต้องเทรนข้อมูล แต่ใช้สูตรสถิติ Z-Score Normalization ที่คำนวณอัตโนมัติทันทีที่หัวหน้ากรอกคะแนน เพื่อให้โปร่งใส อธิบายที่มาของตัวเลขให้พนักงานฟังได้ 100% โดย HR และคณะกรรมการยังคงทำ Manual Override พร้อมบันทึกเหตุผลเป็นด่านสุดท้ายได้เสมอ',
              'This engine uses transparent, deterministic Z-Score statistics — no black-box AI training required. Scores recalculate automatically in real time as managers submit ratings, while HR and calibration committees retain final Manual Override governance with a full Audit Trail.'
            )}
          </p>
        </div>
      </div>

      {/* 4 Signature empeo Brand-Colored Pillar Cards — Top-Aligned */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 items-stretch">
        {/* Card 1: empeo Coral-Orange */}
        <div className="rounded-2xl bg-[#EE5D36] p-4 text-white card-interactive flex flex-col justify-start gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold bg-white/20 px-2.5 py-0.5 rounded-full">
              {bi('ขั้นที่ 1', 'Step 1')}
            </span>
            <Database className="w-4 h-4 text-white/90" />
          </div>
          <div>
            <div className="text-sm font-extrabold">
              {bi('ข้อมูลที่ใช้ (Data Inputs)', 'Data Inputs')}
            </div>
            <ul className="text-[11px] text-white/95 space-y-1.5 mt-2 list-disc pl-4 leading-relaxed">
              <li>
                <strong>KPIs ({cycle.kpiWeight}%)</strong>{' '}
                {bi('ถ่วงน้ำหนัก (ปรับฐานอัตโนมัติถ้าไม่ครบ 100%)', 'weighted (auto-reweighted if ≠ 100%)')}
              </li>
              <li>
                <strong>{bi('สมรรถนะ', 'Competencies')} ({cycle.competencyWeight}%)</strong>{' '}
                {bi('ตามเกณฑ์ 1–5', 'on a 1–5 rubric')}
              </li>
              <li>
                {bi(
                  'ตัด Probation / Pending ออกไม่ให้ดึงค่าเฉลี่ยทีมเพี้ยน',
                  'Excludes Probation & Pending reviews from distorting team means'
                )}
              </li>
            </ul>
          </div>
        </div>

        {/* Card 2: empeo Royal Blue */}
        <div className="rounded-2xl bg-[#2E7CF6] p-4 text-white card-interactive flex flex-col justify-start gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold bg-white/20 px-2.5 py-0.5 rounded-full">
              {bi('ขั้นที่ 2', 'Step 2')}
            </span>
            <Scale className="w-4 h-4 text-white/90" />
          </div>
          <div>
            <div className="text-sm font-extrabold">
              {bi('ตรวจจับ Rater Bias', 'Detect Rater Bias')}
            </div>
            <p className="text-[11px] text-white/90 mt-1.5 leading-relaxed">
              {bi('หัวหน้าแต่ละคนให้คะแนนต่างมาตรฐานกัน:', 'Different managers grade on different baselines:')}
            </p>
            <div className="space-y-1.5 mt-2 text-[11px]">
              {strictMgr && (
                <div className="px-2.5 py-1.5 rounded-lg bg-white/15 flex items-center justify-between">
                  <span className="truncate">
                    {strictMgr.managerName} ({bi('สายเข้มงวด', 'Strict')})
                  </span>
                  <strong className="font-mono ml-2">{strictMgr.meanRaw?.toFixed(2)}</strong>
                </div>
              )}
              {lenientMgr && (
                <div className="px-2.5 py-1.5 rounded-lg bg-white/15 flex items-center justify-between">
                  <span className="truncate">
                    {lenientMgr.managerName} ({bi('สายให้สูง', 'Lenient')})
                  </span>
                  <strong className="font-mono ml-2">{lenientMgr.meanRaw?.toFixed(2)}</strong>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card 3: empeo Periwinkle Purple */}
        <div className="rounded-2xl bg-[#5B63F6] p-4 text-white card-interactive flex flex-col justify-start gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold bg-white/20 px-2.5 py-0.5 rounded-full">
              {bi('ขั้นที่ 3', 'Step 3')}
            </span>
            <Calculator className="w-4 h-4 text-white/90" />
          </div>
          <div>
            <div className="text-sm font-extrabold">
              {bi('สูตร Z-Score Calibration', 'Z-Score Calibration Formula')}
            </div>
            <div className="space-y-1 text-[11px] font-mono bg-black/20 p-2.5 rounded-xl mt-2 text-white">
              <div>Z = (Raw − Mean) / SD</div>
              <div className="text-amber-200 font-bold">Fair = 3.50 + (Z × 0.75)</div>
            </div>
            <p className="text-[11px] text-white/90 mt-2 leading-relaxed">
              {bi(
                'ปรับทุกทีมเข้าสู่ฐานกลาง 3.50 โดยรักษาลำดับความเก่งภายในทีมเดิม 100%',
                'Aligns every team to a 3.50 baseline while preserving 100% of within-team rank order.'
              )}
            </p>
          </div>
        </div>

        {/* Card 4: Clean White Contrast Card — Balanced & Top-Aligned */}
        <div className="rounded-2xl bg-white p-4 text-[#212141] card-interactive flex flex-col justify-start gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold bg-[#ECFDF5] text-[#15803D] px-2.5 py-0.5 rounded-full">
              {bi('ขั้นที่ 4', 'Step 4')}
            </span>
            <ShieldCheck className="w-4 h-4 text-[#15803D]" />
          </div>
          <div>
            <div className="text-sm font-extrabold">
              {bi('กำกับดูแลโดยคน (Governance)', 'Human Governance')}
            </div>
            <div className="grid grid-cols-3 gap-1 mt-2 text-center">
              <div className="rounded-lg bg-[#ECFDF5] px-1.5 py-1">
                <div className="text-[10px] font-bold text-[#15803D]">{bi('สูง', 'High')}</div>
                <div className="text-[10px] font-mono font-bold text-[#15803D]">≥ 4.00</div>
              </div>
              <div className="rounded-lg bg-[#EFF6FF] px-1.5 py-1">
                <div className="text-[10px] font-bold text-[#2563EB]">{bi('หลัก', 'Core')}</div>
                <div className="text-[10px] font-mono font-bold text-[#2563EB]">2.8–3.9</div>
              </div>
              <div className="rounded-lg bg-[#FFF1F2] px-1.5 py-1">
                <div className="text-[10px] font-bold text-[#E11D48]">{bi('ต่ำ', 'Low')}</div>
                <div className="text-[10px] font-mono font-bold text-[#E11D48]">&lt; 2.80</div>
              </div>
            </div>
            <p className="text-[11px] text-slate-600 mt-2.5 leading-relaxed">
              {bi(
                'HR และคณะกรรมการสามารถกด Calibrate เพื่อปรับ Manual Override พร้อมบันทึกเหตุผลลง Audit Trail และกำหนดแผน Promotion / PIP ได้ทุกเคส',
                'HR & Calibration panels can click Calibrate to apply a Manual Override with mandatory Audit Trail rationale and assign Promotion or PIP plans.'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Live Proof Comparison Row */}
      {nadia && kanya && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
          <div className="p-4 rounded-2xl bg-white/8 border border-white/15 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{nadia.name}</span>
                <TierBadge tier={nadia.tier} />
              </div>
              <div className="text-[11px] text-slate-300 mt-0.5">
                {bi(
                  `อันดับ 1 ทีม ${nadia.department} (หัวหน้าสายเข้มงวด)`,
                  `Top performer in ${nadia.department} (Strict Manager)`
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 rounded-lg bg-white/10 text-slate-200">
                Raw {nadia.rawCompositeScore?.toFixed(2)}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
              <span className="px-2.5 py-1 rounded-lg bg-[#16A34A]/25 text-emerald-300 font-bold">
                Fair {nadia.normalizedScore?.toFixed(2)} (+{nadia.zScore?.toFixed(2)}σ)
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/8 border border-white/15 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{kanya.name}</span>
                <TierBadge tier={kanya.tier} />
              </div>
              <div className="text-[11px] text-slate-300 mt-0.5">
                {bi(
                  `อันดับท้ายทีม ${kanya.department} (หัวหน้าสายให้คะแนนสูง)`,
                  `Bottom performer in ${kanya.department} (Lenient Manager)`
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 rounded-lg bg-white/10 text-slate-200">
                Raw {kanya.rawCompositeScore?.toFixed(2)}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-rose-400" />
              <span className="px-2.5 py-1 rounded-lg bg-[#E11D48]/25 text-rose-300 font-bold">
                Fair {kanya.normalizedScore?.toFixed(2)} ({kanya.zScore?.toFixed(2)}σ)
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
