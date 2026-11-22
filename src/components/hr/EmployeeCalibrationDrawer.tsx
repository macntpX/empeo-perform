import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Scale, AlertTriangle, CheckCircle2, Sparkles, ShieldAlert } from 'lucide-react';
import { ActionPlanType, EnrichedEmployee } from '../../types/hrm';
import { useHRM } from '../../context/HRMContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { ActionPlanBadge, ReviewStatusBadge, TierBadge } from '../ui/Badges';

interface Props {
  employee: EnrichedEmployee | null;
  onClose: () => void;
}

export const EmployeeCalibrationDrawer: React.FC<Props> = ({ employee, onClose }) => {
  const { setCalibrationOverride, clearCalibrationOverride, setActionPlan, state } = useHRM();
  const { bi } = useLanguage();

  const [overrideScore, setOverrideScore] = useState<string>('');
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [overrideError, setOverrideError] = useState<string | null>(null);

  const [planType, setPlanType] = useState<ActionPlanType>('NONE');
  const [planNote, setPlanNote] = useState<string>('');

  useEffect(() => {
    if (employee) {
      setOverrideScore(
        employee.calibrationOverride
          ? String(employee.calibrationOverride.score)
          : employee.finalScore !== null
          ? String(employee.finalScore)
          : ''
      );
      setOverrideReason(employee.calibrationOverride?.reason ?? '');
      setOverrideError(null);
      setPlanType(employee.actionPlan?.type ?? 'NONE');
      setPlanNote(employee.actionPlan?.note ?? '');
    }
  }, [employee]);

  if (!employee) return null;

  const handleSaveOverride = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(overrideScore);
    if (Number.isNaN(num) || num < 1 || num > 5) {
      setOverrideError(bi('คะแนนต้องอยู่ระหว่าง 1.00 ถึง 5.00', 'Score must be between 1.00 and 5.00.'));
      return;
    }
    if (overrideReason.trim().length < 8) {
      setOverrideError(
        bi(
          'กรุณาระบุเหตุผลการปรับคะแนนอย่างน้อย 8 ตัวอักษรเพื่อบันทึกใน Audit Log',
          'Please enter a clear justification (at least 8 characters) for the audit log.'
        )
      );
      return;
    }
    setOverrideError(null);
    setCalibrationOverride(employee.id, num, overrideReason);
  };

  const handleSaveActionPlan = (e: React.FormEvent) => {
    e.preventDefault();
    setActionPlan(employee.id, planType, planNote);
  };

  return createPortal(
    <div className="fixed inset-0 z-[90] flex justify-end">
      <div className="fixed inset-0 bg-[#212141]/45 backdrop-blur-[1px]" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-drawer-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg font-extrabold text-slate-900">{employee.name}</h2>
              <TierBadge tier={employee.tier} />
              <ActionPlanBadge type={employee.actionPlan?.type} />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {employee.employeeCode} • {employee.role} • {employee.department} •{' '}
              {bi('หัวหน้า', 'Manager')}:{' '}
              <strong className="text-slate-700">{employee.managerName}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Data Health Warnings */}
          {employee.issues.length > 0 && (
            <div className="space-y-2">
              {employee.issues.map((issue, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                    issue.severity === 'error'
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : issue.severity === 'warning'
                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">{issue.label}</div>
                    <div className="opacity-90 mt-0.5">{issue.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Score Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[11px] font-semibold text-slate-500">
                {bi('ประเมินตัวเอง', 'Self Composite')}
              </div>
              <div className="text-xl font-extrabold text-slate-800 mt-0.5 font-mono">
                {employee.selfCompositeScore !== null ? employee.selfCompositeScore.toFixed(2) : '—'}
              </div>
              <div className="mt-1">
                <ReviewStatusBadge status={employee.selfReviewStatus} />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[11px] font-semibold text-slate-500">
                {bi('คะแนนดิบหัวหน้า', 'Raw Manager')}
              </div>
              <div className="text-xl font-extrabold text-slate-800 mt-0.5 font-mono">
                {employee.rawCompositeScore !== null ? employee.rawCompositeScore.toFixed(2) : '—'}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                KPI {employee.kpiRawScore?.toFixed(2) ?? '—'} • Comp {employee.competencyRawScore?.toFixed(2) ?? '—'}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200">
              <div className="text-[11px] font-semibold text-indigo-700">
                {bi('คะแนนปรับเทียบ Z-Score', 'Z-Score Normalized')}
              </div>
              <div className="text-xl font-extrabold text-indigo-800 mt-0.5 font-mono">
                {employee.normalizedScore !== null ? employee.normalizedScore.toFixed(2) : '—'}
              </div>
              <div className="text-[10px] text-indigo-600 mt-1">
                {employee.zScore !== null
                  ? `${employee.zScore >= 0 ? '+' : ''}${employee.zScore.toFixed(2)}σ ${bi('ในทีม', 'within team')}`
                  : 'N/A'}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
              <div className="text-[11px] font-semibold text-emerald-700">
                {bi('คะแนนทางการสุทธิ', 'Final Official')}
              </div>
              <div className="text-xl font-extrabold text-emerald-800 mt-0.5 font-mono">
                {employee.finalScore !== null ? employee.finalScore.toFixed(2) : '—'}
              </div>
              <div className="text-[10px] font-semibold text-emerald-700 mt-1">
                {bi('แหล่งคะแนน', 'Source')}: {employee.scoreSource}
              </div>
            </div>
          </div>

          {/* Goals & Competencies Breakdown */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {bi(`เป้าหมาย / KPIs (น้ำหนัก ${state.cycle.kpiWeight}%)`, `KPIs / Goals (${state.cycle.kpiWeight}% weight)`)}
                </h3>
                <span
                  className={`text-xs font-bold ${
                    employee.totalGoalWeight === 100 ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                >
                  {bi('น้ำหนักรวม', 'Total Weight')}: {employee.totalGoalWeight}%
                </span>
              </div>
              <div className="space-y-2">
                {employee.goals.map((g) => (
                  <div
                    key={g.id}
                    className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900">{g.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {bi('น้ำหนัก', 'Weight')}: {g.weight}% • {bi('ความคืบหน้า', 'Progress')}: {g.progress}%
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-xs font-mono">
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400">{bi('ตัวเอง', 'Self')}</div>
                        <div className="font-bold text-slate-600">
                          {g.selfScore !== null ? g.selfScore.toFixed(1) : '—'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400">{bi('หัวหน้า', 'Mgr')}</div>
                        <div className="font-bold text-orange-600">
                          {g.managerScore !== null ? g.managerScore.toFixed(1) : '—'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                {bi(
                  `สมรรถนะหลัก (น้ำหนัก ${state.cycle.competencyWeight}%)`,
                  `Core Competencies (${state.cycle.competencyWeight}% weight)`
                )}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {employee.competencies.map((c) => (
                  <div key={c.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/70">
                    <div className="text-xs font-bold text-slate-800">{c.name}</div>
                    <div className="flex items-center justify-between mt-2 text-xs font-mono">
                      <span className="text-slate-500">
                        {bi('ตัวเอง', 'Self')}: <strong>{c.selfScore?.toFixed(1) ?? '—'}</strong>
                      </span>
                      <span className="text-orange-600">
                        {bi('หัวหน้า', 'Mgr')}: <strong>{c.managerScore?.toFixed(1) ?? '—'}</strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Qualitative Feedback */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs font-bold text-slate-700 mb-1">
                  {bi('จุดเด่น (จากหัวหน้า)', 'Manager — Strengths')}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {employee.managerStrengths || bi('ยังไม่มีบันทึกจุดเด่น', 'No strengths recorded yet.')}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs font-bold text-slate-700 mb-1">
                  {bi('แนวทางพัฒนา (จากหัวหน้า)', 'Manager — Development Areas')}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {employee.managerDevelopment || bi('ยังไม่มีบันทึกแนวทางพัฒนา', 'No development notes recorded yet.')}
                </p>
              </div>
            </div>
          </div>

          {/* HR Calibration Committee Override */}
          {employee.employmentStatus === 'ELIGIBLE' && (
            <form
              onSubmit={handleSaveOverride}
              className="p-4 rounded-2xl border border-indigo-200 bg-indigo-50/40 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-indigo-950">
                  <Scale className="w-4 h-4 text-indigo-600" />
                  {bi('ปรับคะแนนโดยคณะกรรมการ (HR Override)', 'HR Calibration Committee Override')}
                </div>
                {employee.calibrationOverride && (
                  <button
                    type="button"
                    onClick={() => clearCalibrationOverride(employee.id)}
                    className="text-xs font-semibold text-rose-600 hover:underline"
                  >
                    {bi('ล้างค่า Override', 'Clear Override')}
                  </button>
                )}
              </div>
              <p className="text-xs text-indigo-800/80">
                {bi(
                  'ใช้เมื่อคณะกรรมการเห็นพ้องให้ปรับคะแนนสุทธิแตกต่างจากสูตรอัตโนมัติ ทุกการปรับต้องระบุเหตุผลและจะถูกบันทึกลง Audit Trail ถาวร',
                  'Use when the calibration committee agrees on a final score different from the automated formula. Every adjustment requires a reason and is permanently logged.'
                )}
              </p>

              {overrideError && (
                <div className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-lg">
                  {overrideError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {bi('คะแนนสุทธิ (1.0–5.0)', 'Final Score (1.0–5.0)')}
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="1"
                    max="5"
                    value={overrideScore}
                    onChange={(e) => setOverrideScore(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono font-bold border border-slate-300 rounded-xl bg-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {bi('เหตุผลประกอบการปรับ (จำเป็น)', 'Committee Justification (Required)')}
                  </label>
                  <input
                    type="text"
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder={bi(
                      'เช่น ปรับเพิ่มหลังทบทวนผลงานข้ามทีม...',
                      'e.g., Adjusted after cross-squad architecture review...'
                    )}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                {employee.calibrationOverride ? (
                  <span className="text-[11px] text-indigo-700">
                    {bi('ปรับล่าสุดโดย', 'Last adjusted by')} {employee.calibrationOverride.updatedBy}{' '}
                    {bi('เมื่อ', 'on')} {employee.calibrationOverride.updatedAt}
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-500">
                    {bi('ยังไม่มีการปรับ Manual Override', 'No manual override applied.')}
                  </span>
                )}
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition"
                >
                  {bi('บันทึกคะแนนปรับเทียบ', 'Save Calibrated Score')}
                </button>
              </div>
            </form>
          )}

          {/* Talent Outcome / Action Plan */}
          {employee.employmentStatus === 'ELIGIBLE' && (
            <form
              onSubmit={handleSaveActionPlan}
              className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3"
            >
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                {employee.tier === 'Low Performer' ? (
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                ) : (
                  <Sparkles className="w-4 h-4 text-orange-500" />
                )}
                {bi('แผนการตัดสินใจและพัฒนาบุคลากร', 'Talent Decision & Action Plan')}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {bi('แนวทางดำเนินการ', 'Outcome Track')}
                  </label>
                  <select
                    value={planType}
                    onChange={(e) => setPlanType(e.target.value as ActionPlanType)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="NONE">{bi('ไม่มีแผนพิเศษ', 'No Special Action')}</option>
                    <option value="PROMOTION">{bi('เสนอเลื่อนตำแหน่ง (Promotion)', 'Promotion Track')}</option>
                    <option value="MERIT_BONUS">{bi('พิจารณาโบนัส / รักษาคนเก่ง', 'Merit Bonus / Retention')}</option>
                    <option value="COACHING">{bi('เข้าแผนโค้ชชิ่ง (Coaching)', 'Structured Coaching')}</option>
                    <option value="PIP">{bi('แผนพัฒนาเร่งด่วน (PIP)', 'Performance Improvement Plan (PIP)')}</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {bi('บันทึกเพิ่มเติมจาก HR / ผู้บริหาร', 'HR / Leadership Action Note')}
                  </label>
                  <input
                    type="text"
                    value={planNote}
                    onChange={(e) => setPlanNote(e.target.value)}
                    placeholder={bi(
                      'ระบุขั้นตอนถัดไป กรอบเวลา หรือหมายเหตุผลตอบแทน...',
                      'Next steps, timeline, or compensation note...'
                    )}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {bi('บันทึกแผนดำเนินการ', 'Save Action Plan')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

