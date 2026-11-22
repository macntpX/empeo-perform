import React, { useEffect, useMemo, useState } from 'react';
import {
  Home,
  Target,
  FileEdit,
  Award,
  CheckCircle2,
  Lock,
  Plus,
  Save,
  Send,
  MessageSquare,
  Scale,
  Info,
} from 'lucide-react';
import { useHRM } from '../../context/HRMContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { AppShell, NavItem } from '../layout/AppShell';
import { CyclePhaseStepper, ReviewStatusBadge, TierBadge } from '../ui/Badges';
import { ScoreSelector } from '../ui/ScoreSelector';
import { CompetencyScore, Goal } from '../../types/hrm';
import { RATING_RUBRIC } from '../../data/seedData';

export const EmployeeWorkspace: React.FC = () => {
  const {
    currentUser,
    state,
    enrichedEmployees,
    updateGoal,
    addGoal,
    saveSelfAssessment,
    submitAcknowledgment,
    notify,
  } = useHRM();
  const { bi } = useLanguage();

  const [activeTab, setActiveTab] = useState<string>('overview');

  const me = useMemo(
    () => enrichedEmployees.find((e) => e.id === currentUser?.employeeId) ?? null,
    [enrichedEmployees, currentUser?.employeeId]
  );

  // Self-assessment form state
  const [selfGoals, setSelfGoals] = useState<Goal[]>([]);
  const [selfComps, setSelfComps] = useState<CompetencyScore[]>([]);
  const [selfSummary, setSelfSummary] = useState('');

  // Propose Goal state
  const [showPropose, setShowPropose] = useState(false);
  const [propTitle, setPropTitle] = useState('');
  const [propDesc, setPropDesc] = useState('');
  const [propWeight, setPropWeight] = useState(20);

  // Appeal / Discussion comment
  const [showDispute, setShowDispute] = useState(false);
  const [disputeComment, setDisputeComment] = useState('');

  useEffect(() => {
    if (me) {
      setSelfGoals(me.goals.map((g) => ({ ...g })));
      setSelfComps(me.competencies.map((c) => ({ ...c })));
      setSelfSummary(me.selfSummary);
    }
  }, [me?.id, me?.goals.length]);

  if (!me) {
    return (
      <div className="p-10 text-center text-sm text-slate-500">
        Employee profile not found for this account.
      </div>
    );
  }

  const isPublished = state.cycle.phase === 'PUBLISHED';
  const isProbation = me.employmentStatus === 'PROBATION';

  const navItems: NavItem[] = [
    { id: 'overview', label: bi('หน้าหลักของฉัน', 'My Overview'), icon: <Home className="w-4 h-4" /> },
    { id: 'goals', label: bi('เป้าหมายและความคืบหน้า', 'My Goals & Progress'), icon: <Target className="w-4 h-4" /> },
    {
      id: 'self',
      label: bi('ประเมินตนเอง', 'Self-Assessment'),
      icon: <FileEdit className="w-4 h-4" />,
      badge: !isProbation && me.selfReviewStatus !== 'SUBMITTED' ? bi('รอทำ', 'Due') : undefined,
    },
    {
      id: 'results',
      label: bi('ผลประเมินของฉัน', 'My Results'),
      icon: <Award className="w-4 h-4" />,
      badge:
        isPublished && !isProbation && me.acknowledgment.status === 'PENDING'
          ? bi('ใหม่', 'New')
          : undefined,
    },
  ];

  const pageMeta: Record<string, { title: string; subtitle: string }> = {
    overview: {
      title: bi(`สวัสดี, ${me.name}`, `Welcome, ${me.name}`),
      subtitle: `${me.role} • ${me.department} • ${bi('หัวหน้างาน', 'Manager')}: ${me.managerName}`,
    },
    goals: {
      title: bi('เป้าหมายและ OKR ประจำปีของฉัน', 'My Annual Goals & OKRs'),
      subtitle: bi(
        'ติดตาม KPI อัปเดตความคืบหน้า และเสนอเป้าหมายใหม่ให้หัวหน้าอนุมัติ',
        'Track your KPIs, update completion progress, and propose new goals for alignment.'
      ),
    },
    self: {
      title: bi('แบบประเมินตนเองประจำปี', 'Annual Self-Assessment'),
      subtitle: bi(
        'สรุปผลงานเด่นและให้คะแนนตนเองในแต่ละ KPI และ Core Competency',
        'Reflect on your achievements and rate your KPIs and Core Competencies.'
      ),
    },
    results: {
      title: bi('รายงานผลประเมินอย่างเป็นทางการ', 'Official Performance Results'),
      subtitle: bi(
        'ดูผลคะแนนหลังปรับเทียบ ข้อเสนอแนะจากหัวหน้า และกดรับทราบผลประเมิน',
        'View your published calibrated rating, manager feedback, and sign off.'
      ),
    },
  };

  const avgGoalProgress =
    me.goals.length > 0
      ? Math.round(me.goals.reduce((s, g) => s + g.progress, 0) / me.goals.length)
      : 0;

  const handleSaveSelf = (submit: boolean) => {
    const preparedGoals = selfGoals.map((g) => ({
      ...g,
      selfScore: submit && g.selfScore === null ? 3.5 : g.selfScore,
    }));
    const preparedComps = selfComps.map((c) => ({
      ...c,
      selfScore: submit && c.selfScore === null ? 3.5 : c.selfScore,
    }));
    saveSelfAssessment(
      me.id,
      {
        goals: preparedGoals,
        competencies: preparedComps,
        selfSummary,
      },
      submit
    );
  };

  const handleProposeGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!propTitle.trim()) return;
    addGoal(me.id, {
      title: propTitle,
      description: propDesc || 'Proposed by employee for alignment.',
      weight: Number(propWeight),
      status: 'PROPOSED',
    });
    setPropTitle('');
    setPropDesc('');
    setShowPropose(false);
  };

  return (
    <AppShell
      navItems={navItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      pageTitle={pageMeta[activeTab].title}
      pageSubtitle={pageMeta[activeTab].subtitle}
    >
      {/* ==================== TAB 1: MY OVERVIEW ==================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {isProbation && (
            <div className="p-5 rounded-2xl bg-sky-50 border border-sky-200 flex items-start gap-3 text-sky-900">
              <Info className="w-5 h-5 shrink-0 mt-0.5 text-sky-600" />
              <div className="text-xs leading-relaxed">
                <div className="font-bold text-sm">90-Day Probation & Onboarding Track</div>
                <p className="mt-1">
                  Welcome to the team! Because you joined on <strong>{me.joinDate}</strong>, you are
                  exempt from the annual performance ranking pool. Focus on your onboarding goals
                  under <strong>My Goals & Progress</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Cycle Status */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-extrabold text-slate-900">{state.cycle.name}</div>
              <span className="text-xs text-slate-500">
                Cycle Deadline: <strong className="text-slate-800">{state.cycle.deadline}</strong>
              </span>
            </div>
            <CyclePhaseStepper currentPhase={state.cycle.phase} />
          </div>

          {/* 3 Personal Checklist Cards — Clean empeo Style */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-[#E8ECF2] shadow-card card-interactive flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#EE5D36]">Step 1 • Goals</span>
                  <span className="text-xs font-mono font-bold text-[#212141]">
                    {avgGoalProgress}%
                  </span>
                </div>
                <div className="text-base font-extrabold text-[#212141] mt-1.5">
                  Track Your Annual Goals
                </div>
                <div className="w-full bg-[#F1F5F9] h-2 rounded-full mt-2.5 overflow-hidden">
                  <div
                    className="bg-[#EE5D36] h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${avgGoalProgress}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {me.goals.length} active goal(s) • Total Weight: {me.totalGoalWeight}%
                </p>
              </div>
              <button
                onClick={() => setActiveTab('goals')}
                className="mt-4 w-full py-2.5 rounded-full bg-[#EE5D36] hover:bg-[#D94D28] text-white text-xs font-bold transition"
              >
                Update Goal Progress →
              </button>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E8ECF2] shadow-card card-interactive flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#5B63F6]">
                    Step 2 • Self-Review
                  </span>
                  {isProbation ? (
                    <TierBadge tier="Probation (Exempt)" />
                  ) : (
                    <ReviewStatusBadge status={me.selfReviewStatus} />
                  )}
                </div>
                <div className="text-base font-extrabold text-[#212141] mt-1.5">
                  Submit Self-Assessment
                </div>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  {isProbation
                    ? 'Not required during your 90-day probation period.'
                    : me.selfReviewStatus === 'SUBMITTED'
                    ? `Completed! Your Self Composite is ${me.selfCompositeScore?.toFixed(2) ?? '—'} / 5.0`
                    : 'Rate your KPIs & competencies so your manager sees your perspective.'}
                </p>
              </div>
              {!isProbation && (
                <button
                  onClick={() => setActiveTab('self')}
                  className={`mt-4 w-full py-2.5 rounded-full text-xs font-bold transition ${
                    me.selfReviewStatus === 'SUBMITTED'
                      ? 'bg-[#F7F8FA] hover:bg-[#EEF0FF] text-[#212141] border border-[#E8ECF2]'
                      : 'bg-[#5B63F6] hover:bg-[#4F46E5] text-white'
                  }`}
                >
                  {me.selfReviewStatus === 'SUBMITTED'
                    ? 'View / Edit Self-Assessment →'
                    : 'Complete Self-Assessment →'}
                </button>
              )}
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E8ECF2] shadow-card card-interactive flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#15803D]">
                    Step 3 • Official Result
                  </span>
                  {isPublished && !isProbation ? (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#15803D]">
                      ✓ Ready
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#F3F4F6] text-slate-500">
                      Calibration
                    </span>
                  )}
                </div>
                <div className="text-base font-extrabold text-[#212141] mt-1.5">
                  View Score &amp; Sign Off
                </div>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  {isPublished && !isProbation
                    ? `Official Score: ${me.finalScore?.toFixed(2) ?? '—'} / 5.0 (${me.tier})`
                    : 'Scores unlock once HR completes cross-department fairness calibration.'}
                </p>
              </div>
              <button
                onClick={() => setActiveTab('results')}
                className={`mt-4 w-full py-2.5 rounded-full text-xs font-bold transition ${
                  isPublished && !isProbation
                    ? 'bg-[#16A34A] hover:bg-[#15803D] text-white'
                    : 'bg-[#F7F8FA] hover:bg-slate-100 text-[#212141] border border-[#E8ECF2]'
                }`}
              >
                View Performance Report →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: MY GOALS & PROGRESS ==================== */}
      {activeTab === 'goals' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              Total Assigned Weight:{' '}
              <strong
                className={me.totalGoalWeight === 100 ? 'text-emerald-600' : 'text-amber-600'}
              >
                {me.totalGoalWeight}%
              </strong>
              {me.totalGoalWeight !== 100 &&
                ' (Ask your manager to rebalance weights to 100%)'}
            </div>
            {!isPublished && (
              <button
                onClick={() => setShowPropose((s) => !s)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                Propose New Goal
              </button>
            )}
          </div>

          {showPropose && (
            <form
              onSubmit={handleProposeGoal}
              className="bg-white p-5 rounded-2xl border border-orange-200 shadow-sm space-y-3"
            >
              <div className="text-sm font-bold text-slate-900">
                Propose a Goal for Manager Approval
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Goal Title
                  </label>
                  <input
                    type="text"
                    required
                    value={propTitle}
                    onChange={(e) => setPropTitle(e.target.value)}
                    placeholder="e.g., Improve onboarding documentation coverage"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Weight (%)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={propWeight}
                    onChange={(e) => setPropWeight(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description / Measurable Outcome
                </label>
                <input
                  type="text"
                  value={propDesc}
                  onChange={(e) => setPropDesc(e.target.value)}
                  placeholder="How will success be measured?"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPropose(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
                >
                  Submit Proposal
                </button>
              </div>
            </form>
          )}

          <div className="space-y-4">
            {me.goals.map((g) => (
              <div
                key={g.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-extrabold text-slate-900">{g.title}</h3>
                      {g.status === 'PROPOSED' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                          Pending Manager Approval
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{g.description}</p>
                  </div>
                  <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                    Weight: {g.weight}%
                  </span>
                </div>

                {/* Live Progress Slider */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Completion Progress</span>
                    <span className="font-mono font-extrabold text-orange-600">{g.progress}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    disabled={isPublished}
                    value={g.progress}
                    onChange={(e) => {
                      updateGoal(me.id, g.id, { progress: Number(e.target.value) });
                    }}
                    onMouseUp={() => notify('Goal progress updated.')}
                    className="w-full accent-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Progress Check-In Note / Evidence
                  </label>
                  <input
                    type="text"
                    disabled={isPublished}
                    value={g.employeeComment}
                    onChange={(e) =>
                      updateGoal(me.id, g.id, { employeeComment: e.target.value })
                    }
                    placeholder="Add metrics, links, or milestones achieved..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== TAB 3: SELF-ASSESSMENT ==================== */}
      {activeTab === 'self' && (
        <div className="max-w-3xl space-y-6">
          {isProbation ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
              <TierBadge tier="Probation (Exempt)" />
              <div className="text-base font-bold text-slate-900 pt-2">
                Annual Self-Assessment Not Required
              </div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Employees on probation complete a 90-day check-in with their manager instead of the
                annual rating cycle.
              </p>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    Self-Rating & Reflection
                  </h2>
                  <p className="text-xs text-slate-500">
                    Rate yourself honestly from 1.0 (Unsatisfactory) to 5.0 (Exceptional).
                  </p>
                </div>
                <ReviewStatusBadge status={me.selfReviewStatus} />
              </div>

              {/* Compact Rubric Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-center">
                {RATING_RUBRIC.slice()
                  .reverse()
                  .map((r) => (
                    <div
                      key={r.score}
                      className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[10px]"
                    >
                      <div className="font-extrabold text-slate-800">{r.score}</div>
                      <div className="text-slate-500 truncate">{r.label.split('— ')[1]}</div>
                    </div>
                  ))}
              </div>

              {/* KPI Self Ratings */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  1. KPIs & Goals
                </h3>
                {selfGoals.map((g, idx) => (
                  <div
                    key={g.id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
                  >
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{g.title}</span>
                      <span className="text-xs font-bold bg-white border border-slate-300 px-2 py-0.5 rounded-md shrink-0">
                        {g.weight}% weight
                      </span>
                    </div>
                    <ScoreSelector
                      label="Your Self-Score:"
                      value={g.selfScore}
                      disabled={isPublished}
                      accent="indigo"
                      onChange={(val) => {
                        setSelfGoals((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, selfScore: val } : item))
                        );
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Competency Self Ratings */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  2. Core Competencies
                </h3>
                {selfComps.map((c, idx) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5"
                  >
                    <div>
                      <div className="text-sm font-bold text-slate-900">{c.name}</div>
                      <div className="text-xs text-slate-500">{c.description}</div>
                    </div>
                    <ScoreSelector
                      label="Your Self-Score:"
                      value={c.selfScore}
                      disabled={isPublished}
                      accent="indigo"
                      onChange={(val) => {
                        setSelfComps((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, selfScore: val } : item))
                        );
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Overall Reflection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  3. Overall Achievements & Support Needed
                </label>
                <textarea
                  rows={3}
                  disabled={isPublished}
                  value={selfSummary}
                  onChange={(e) => setSelfSummary(e.target.value)}
                  placeholder="Summarize your biggest wins, challenges overcome, and career goals..."
                  className="w-full text-xs border border-slate-300 rounded-xl p-3 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {!isPublished && (
                <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleSaveSelf(false)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 bg-white hover:bg-slate-50 text-slate-700"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveSelf(true)}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Submit Self-Assessment
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 4: OFFICIAL RESULTS ==================== */}
      {activeTab === 'results' && (
        <div className="max-w-3xl space-y-6">
          {isProbation ? (
            <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center space-y-2">
              <TierBadge tier="Probation (Exempt)" />
              <h2 className="text-base font-bold text-slate-900 pt-2">
                No Annual Rating — Probation Track
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Your 90-day probation review will be conducted separately with {me.managerName}.
              </p>
            </div>
          ) : !isPublished ? (
            <div className="bg-white p-10 rounded-2xl border border-slate-200 shadow-sm text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Results Are Currently in HR Calibration
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                To ensure every department is evaluated on a fair and consistent standard, HR
                calibrates all manager ratings before releasing official scores. You will be
                notified as soon as HR publishes <strong>{state.cycle.name}</strong>.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              {/* Official Score Banner */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                    Official Published Result • {state.cycle.name}
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900 mt-1">{me.name}</h2>
                  <p className="text-xs text-slate-500">
                    {me.role} • Evaluated by {me.managerName}
                  </p>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 px-5 py-3 rounded-2xl text-right">
                  <div className="text-[10px] font-bold uppercase text-emerald-700">
                    Final Calibrated Rating
                  </div>
                  <div className="text-3xl font-extrabold text-emerald-800 font-mono">
                    {me.finalScore !== null ? me.finalScore.toFixed(2) : '—'}{' '}
                    <span className="text-sm font-normal text-emerald-600">/ 5.0</span>
                  </div>
                  <div className="mt-1">
                    <TierBadge tier={me.tier} />
                  </div>
                </div>
              </div>

              {/* Fairness Calibration Transparency Note */}
              {(me.scoreSource === 'NORMALIZED' || me.scoreSource === 'OVERRIDE') && (
                <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 flex items-start gap-3 text-xs text-indigo-950">
                  <Scale className="w-4 h-4 shrink-0 mt-0.5 text-indigo-600" />
                  <div>
                    <div className="font-bold">Company-Wide Fairness Calibration Applied</div>
                    <p className="mt-0.5 opacity-90 leading-relaxed">
                      Your raw manager composite score was{' '}
                      <strong>{me.rawCompositeScore?.toFixed(2)}</strong>. To ensure fair
                      comparison across departments with different grading styles, your official
                      score was calibrated to <strong>{me.finalScore?.toFixed(2)}</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* Goal Breakdown */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  KPI Breakdown
                </h3>
                {me.goals.map((g) => (
                  <div
                    key={g.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="text-sm font-bold text-slate-900">{g.title}</div>
                      <div className="text-xs text-slate-500">Weight: {g.weight}%</div>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono shrink-0">
                      <div>
                        <span className="text-slate-400">Self: </span>
                        <strong>{g.selfScore?.toFixed(1) ?? '—'}</strong>
                      </div>
                      <div className="text-emerald-700">
                        <span>Manager: </span>
                        <strong>{g.managerScore?.toFixed(1) ?? '—'}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Manager Written Feedback */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-200/80">
                  <div className="text-xs font-bold text-emerald-900 mb-1">Key Strengths</div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {me.managerStrengths || 'No written strengths provided.'}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-amber-50/40 border border-amber-200/80">
                  <div className="text-xs font-bold text-amber-900 mb-1">
                    Development & Growth Areas
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {me.managerDevelopment || 'No development notes provided.'}
                  </p>
                </div>
              </div>

              {/* Sign-off / Acknowledge Section */}
              <div className="pt-4 border-t border-slate-200">
                {me.acknowledgment.status === 'ACKNOWLEDGED' ? (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs font-bold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    You acknowledged and signed off on this review on {me.acknowledgment.updatedAt}.
                  </div>
                ) : me.acknowledgment.status === 'DISPUTED' ? (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                    <div className="font-bold">
                      1-on-1 Follow-Up Requested ({me.acknowledgment.updatedAt})
                    </div>
                    {me.acknowledgment.comment && (
                      <p className="mt-1 italic">&ldquo;{me.acknowledgment.comment}&rdquo;</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="text-xs text-slate-600">
                        Please review your evaluation and acknowledge receipt, or request a 1-on-1
                        clarification meeting.
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowDispute((s) => !s)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Request 1-on-1 Discussion
                        </button>
                        <button
                          onClick={() => submitAcknowledgment(me.id, 'ACKNOWLEDGED')}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Acknowledge & Sign Off
                        </button>
                      </div>
                    </div>

                    {showDispute && (
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                        <label className="block text-xs font-bold text-slate-700">
                          Topics you would like to discuss with your manager / HR:
                        </label>
                        <textarea
                          rows={2}
                          value={disputeComment}
                          onChange={(e) => setDisputeComment(e.target.value)}
                          placeholder="Share specific KPIs or questions you want to align on..."
                          className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white"
                        />
                        <div className="flex justify-end">
                          <button
                            onClick={() => {
                              submitAcknowledgment(me.id, 'DISPUTED', disputeComment);
                              setShowDispute(false);
                            }}
                            className="px-4 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold"
                          >
                            Send Follow-Up Request
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
};

