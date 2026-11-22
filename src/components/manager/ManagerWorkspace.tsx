import React, { useEffect, useMemo, useState } from 'react';
import {
  Users,
  ClipboardCheck,
  Target,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  BookOpen,
  Save,
  Send,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { useHRM } from '../../context/HRMContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { AppShell, NavItem } from '../layout/AppShell';
import { ReviewStatusBadge, TierBadge } from '../ui/Badges';
import { ScoreSelector, getRubricShortLabel } from '../ui/ScoreSelector';
import { isCyclePastDeadline, isManagerLockedForCycle } from '../../engine/fairnessEngine';
import { CompetencyScore, EnrichedEmployee, Goal } from '../../types/hrm';
import { RATING_RUBRIC } from '../../data/seedData';

export const ManagerWorkspace: React.FC = () => {
  const {
    currentUser,
    state,
    enrichedEmployees,
    managerStats,
    saveManagerEvaluation,
    addGoal,
    updateGoal,
    deleteGoal,
  } = useHRM();
  const { bi } = useLanguage();

  const [activeTab, setActiveTab] = useState<string>('overview');
  const [showRubric, setShowRubric] = useState(false);

  const managerId = currentUser?.managerId ?? '';
  const myTeam = useMemo(
    () => enrichedEmployees.filter((e) => e.managerId === managerId),
    [enrichedEmployees, managerId]
  );
  const myStats = useMemo(
    () => managerStats.find((m) => m.managerId === managerId),
    [managerStats, managerId]
  );

  const needsActionTeam = useMemo(
    () =>
      myTeam.filter(
        (e) => e.employmentStatus === 'ELIGIBLE' && e.managerReviewStatus !== 'SUBMITTED'
      ),
    [myTeam]
  );
  const completedTeam = useMemo(
    () =>
      myTeam.filter(
        (e) => e.employmentStatus === 'ELIGIBLE' && e.managerReviewStatus === 'SUBMITTED'
      ),
    [myTeam]
  );
  const exemptTeam = useMemo(
    () => myTeam.filter((e) => e.employmentStatus === 'PROBATION'),
    [myTeam]
  );

  const eligibleTeam = myTeam.filter((e) => e.employmentStatus === 'ELIGIBLE');
  const pendingCount = needsActionTeam.length;

  const isLocked = isManagerLockedForCycle(state.cycle, managerId);
  const pastDeadline = isCyclePastDeadline(state.cycle.deadline);
  const hasGrace = state.cycle.gracePeriodManagerIds.includes(managerId);

  // Default to first person needing action!
  const [evalEmpId, setEvalEmpId] = useState<string>(
    needsActionTeam[0]?.id ?? eligibleTeam[0]?.id ?? myTeam[0]?.id ?? ''
  );
  const activeEvalEmp = useMemo(
    () => myTeam.find((e) => e.id === evalEmpId) ?? myTeam[0] ?? null,
    [myTeam, evalEmpId]
  );

  const [draftGoals, setDraftGoals] = useState<Goal[]>([]);
  const [draftComps, setDraftComps] = useState<CompetencyScore[]>([]);
  const [draftPotential, setDraftPotential] = useState<1 | 2 | 3>(2);
  const [draftStrengths, setDraftStrengths] = useState('');
  const [draftDev, setDraftDev] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (activeEvalEmp) {
      setDraftGoals(activeEvalEmp.goals.map((g) => ({ ...g })));
      setDraftComps(activeEvalEmp.competencies.map((c) => ({ ...c })));
      setDraftPotential(activeEvalEmp.potential);
      setDraftStrengths(activeEvalEmp.managerStrengths);
      setDraftDev(activeEvalEmp.managerDevelopment);
      setHasUnsavedChanges(false);
    }
  }, [activeEvalEmp?.id, activeEvalEmp?.goals.length]);

  // Add Goal Form state
  const [goalEmpId, setGoalEmpId] = useState<string>(myTeam[0]?.id ?? '');
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDesc, setNewGoalDesc] = useState('');
  const [newGoalWeight, setNewGoalWeight] = useState(20);

  const navItems: NavItem[] = [
    {
      id: 'overview',
      label: bi('ภาพรวมทีมของฉัน', 'My Team Overview'),
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'evaluate',
      label: bi('ประเมินลูกทีม', 'Team Evaluations'),
      icon: <ClipboardCheck className="w-4 h-4" />,
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    {
      id: 'goals',
      label: bi('เป้าหมายและ OKR ทีม', 'Team Goals & OKRs'),
      icon: <Target className="w-4 h-4" />,
    },
  ];

  const pageMeta: Record<string, { title: string; subtitle: string }> = {
    overview: {
      title: bi(`ภาพรวมทีม ${currentUser?.department}`, `${currentUser?.department} Team Overview`),
      subtitle: bi(
        'ตรวจสอบลูกทีมที่รอการประเมิน ความสมบูรณ์ของน้ำหนัก KPI และความคืบหน้าทีม',
        'See who needs your review first, check goal weight health, and monitor team progress.'
      ),
    },
    evaluate: {
      title: bi('ประเมินผลงานลูกทีม', 'Conduct Team Evaluations'),
      subtitle: bi(
        'เลือกรายชื่อลูกทีมด้านซ้าย ให้คะแนน KPI & Competency ตามเกณฑ์ 1–5 แล้วกดบันทึกหรือส่งผล',
        'Pick a team member on the left, score KPIs & Competencies with the 1–5 rubric, then Save or Submit.'
      ),
    },
    goals: {
      title: bi('จัดการเป้าหมายและน้ำหนัก KPI ทีม', 'Team Goals & Weight Management'),
      subtitle: bi(
        'มอบหมาย KPI อนุมัติเป้าหมายที่พนักงานเสนอ และปรับน้ำหนักให้ครบ 100%',
        'Assign KPIs, approve employee-proposed goals, and ensure weights total 100%.'
      ),
    },
  };

  const previewScore = useMemo(() => {
    const scoredG = draftGoals.filter((g) => g.managerScore !== null);
    const scoredC = draftComps.filter((c) => c.managerScore !== null);
    let kpiAvg: number | null = null;
    if (scoredG.length > 0) {
      const wSum = scoredG.reduce((s, g) => s + Number(g.weight || 0), 0);
      kpiAvg =
        wSum > 0
          ? scoredG.reduce((s, g) => s + (g.managerScore as number) * g.weight, 0) / wSum
          : scoredG.reduce((s, g) => s + (g.managerScore as number), 0) / scoredG.length;
    }
    const compAvg =
      scoredC.length > 0
        ? scoredC.reduce((s, c) => s + (c.managerScore as number), 0) / scoredC.length
        : null;

    if (kpiAvg !== null && compAvg !== null) {
      return (
        kpiAvg * (state.cycle.kpiWeight / 100) + compAvg * (state.cycle.competencyWeight / 100)
      );
    }
    return kpiAvg ?? compAvg;
  }, [draftGoals, draftComps, state.cycle.kpiWeight, state.cycle.competencyWeight]);

  const handleSaveEval = (submit: boolean) => {
    if (!activeEvalEmp) return;
    const preparedGoals = draftGoals.map((g) => ({
      ...g,
      managerScore: submit && g.managerScore === null ? 3.0 : g.managerScore,
    }));
    const preparedComps = draftComps.map((c) => ({
      ...c,
      managerScore: submit && c.managerScore === null ? 3.0 : c.managerScore,
    }));
    saveManagerEvaluation(
      activeEvalEmp.id,
      {
        goals: preparedGoals,
        competencies: preparedComps,
        potential: draftPotential,
        managerStrengths: draftStrengths,
        managerDevelopment: draftDev,
      },
      submit
    );
    setHasUnsavedChanges(false);
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalEmpId || !newGoalTitle.trim()) return;
    addGoal(goalEmpId, {
      title: newGoalTitle,
      description: newGoalDesc || 'Assigned by manager for FY 2026 review cycle.',
      weight: Number(newGoalWeight),
      status: 'APPROVED',
    });
    setNewGoalTitle('');
    setNewGoalDesc('');
  };

  const openEvaluationFor = (empId: string) => {
    setEvalEmpId(empId);
    setActiveTab('evaluate');
  };

  const renderPersonButton = (emp: EnrichedEmployee, _accent: 'amber' | 'emerald' | 'slate') => {
    const selected = activeEvalEmp?.id === emp.id;

    return (
      <button
        key={emp.id}
        onClick={() => setEvalEmpId(emp.id)}
        className={`w-full p-3.5 rounded-2xl border text-left transition ${
          selected
            ? 'bg-[#FFF3EF] border-[#EE5D36] shadow-xs'
            : 'bg-white border-[#E8ECF2] hover:border-[#FFD6CA]'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="font-bold text-sm text-[#212141] truncate">{emp.name}</div>
          <span
            className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
              selected ? 'bg-[#EE5D36] text-white' : 'bg-[#F7F8FA] text-[#212141]'
            }`}
          >
            {emp.rawCompositeScore !== null ? emp.rawCompositeScore.toFixed(2) : '—'}
          </span>
        </div>
        <div className="text-xs text-slate-500 truncate mt-0.5">{emp.role}</div>
        <div className="mt-2 flex items-center justify-between gap-2">
          {emp.employmentStatus === 'PROBATION' ? (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#F3F4F6] text-slate-500">
              Probation Exempt
            </span>
          ) : (
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                emp.managerReviewStatus === 'SUBMITTED'
                  ? 'bg-[#ECFDF5] text-[#15803D]'
                  : 'bg-[#FFFBEB] text-[#B45309]'
              }`}
            >
              {emp.managerReviewStatus === 'SUBMITTED'
                ? '✓ Submitted'
                : emp.managerReviewStatus === 'DRAFT'
                ? 'Draft — Needs Submit'
                : 'Not Started'}
            </span>
          )}
          {emp.selfManagerGap !== null && Math.abs(emp.selfManagerGap) >= 1.0 && (
            <span className="text-[11px] font-semibold text-[#B45309]">⚠ Gap</span>
          )}
        </div>
      </button>
    );
  };

  return (
    <AppShell
      navItems={navItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      pageTitle={pageMeta[activeTab].title}
      pageSubtitle={pageMeta[activeTab].subtitle}
      headerActions={
        <button
          onClick={() => setShowRubric((s) => !s)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700"
        >
          <BookOpen className="w-3.5 h-3.5 text-orange-500" />
          {showRubric ? 'Hide Rubric' : 'Rating Rubric Guide'}
        </button>
      }
    >
      {/* Collapsible Rating Rubric Banner */}
      {showRubric && (
        <div className="mb-6 bg-white p-5 rounded-2xl border-2 border-orange-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900">
              Standardized 5-Point Rating Rubric (Use Consistently Across Your Team)
            </h3>
            <button
              onClick={() => setShowRubric(false)}
              className="text-xs font-bold text-slate-400 hover:text-slate-700"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
            {RATING_RUBRIC.map((r) => (
              <div key={r.score} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs font-extrabold text-slate-900">{r.label}</div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{r.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deadline / Lock Status Banner */}
      {isLocked ? (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border-2 border-rose-200 flex items-start gap-3 text-rose-900">
          <Lock className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
          <div className="text-xs leading-relaxed">
            <div className="font-extrabold text-sm">Evaluation Editing is Locked</div>
            {state.cycle.phase === 'PUBLISHED' ? (
              <p>
                This review cycle has been published to employees. Contact HR Admin if a post-publish
                correction is required.
              </p>
            ) : (
              <p>
                The manager submission deadline (<strong>{state.cycle.deadline}</strong>) has passed.
                Sign in as HR Admin (<code>hr@empeo.co</code>) to grant a Grace Period unlock.
              </p>
            )}
          </div>
        </div>
      ) : pastDeadline && hasGrace ? (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-300 flex items-start gap-3 text-amber-950">
          <Unlock className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
          <div className="text-xs leading-relaxed">
            <div className="font-extrabold text-sm">HR Grace Period Active</div>
            <p>
              The standard deadline ({state.cycle.deadline}) passed, but HR has unlocked your team
              evaluations temporarily. Please finalize and submit any pending reviews promptly.
            </p>
          </div>
        </div>
      ) : null}

      {/* ==================== TAB 1: TEAM OVERVIEW ==================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Primary Focus Action Card — Clean empeo Style */}
          {pendingCount > 0 && !isLocked ? (
            <div className="bg-[#212141] text-white p-5 rounded-2xl shadow-card flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EE5D36] flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-[#F4815F]">Next Action</div>
                  <div className="text-base font-extrabold">
                    {pendingCount} Direct Report{pendingCount > 1 ? 's' : ''} Waiting for Your
                    Evaluation
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Pending: {needsActionTeam.map((e) => e.name).join(', ')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => openEvaluationFor(needsActionTeam[0].id)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#EE5D36] hover:bg-[#D94D28] text-white text-xs font-bold shadow-xs transition"
              >
                Evaluate {needsActionTeam[0].name}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : pendingCount === 0 ? (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center gap-3 text-emerald-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-xs">
                <strong className="text-sm">All Team Evaluations Submitted!</strong> Your team&apos;s
                scores are synced with HR for organization-wide calibration.
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-xs font-semibold text-slate-500">Direct Reports</div>
              <div className="text-3xl font-extrabold text-slate-900 mt-1">{myTeam.length}</div>
              <div className="text-[11px] text-slate-400 mt-1">
                {eligibleTeam.length} Eligible • {exemptTeam.length} Probation
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-xs font-semibold text-slate-500">Evaluations Submitted</div>
              <div className="text-3xl font-extrabold text-emerald-600 mt-1">
                {completedTeam.length}/{eligibleTeam.length}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {pendingCount > 0 ? `${pendingCount} review(s) still pending` : 'All reviews complete!'}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-xs font-semibold text-slate-500">Your Team Raw Average</div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-slate-900 font-mono">
                  {myStats?.meanRaw !== null && myStats?.meanRaw !== undefined
                    ? myStats.meanRaw.toFixed(2)
                    : '—'}
                </span>
                {myStats && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {myStats.biasLabel}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                HR calibrates team averages across departments for fairness.
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-900">My Direct Reports</h2>
              <span className="text-xs text-slate-500">Sorted by action priority</span>
            </div>
            <div className="divide-y divide-slate-100">
              {[...needsActionTeam, ...completedTeam, ...exemptTeam].map((emp) => {
                const needsAction =
                  emp.employmentStatus === 'ELIGIBLE' && emp.managerReviewStatus !== 'SUBMITTED';
                return (
                  <div
                    key={emp.id}
                    className={`px-5 py-4 flex flex-wrap items-center justify-between gap-4 border-l-4 transition hover:bg-slate-50/70 ${
                      needsAction
                        ? 'border-l-amber-500 bg-amber-50/20'
                        : emp.employmentStatus === 'PROBATION'
                        ? 'border-l-slate-300'
                        : 'border-l-emerald-500'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-sm font-extrabold text-slate-900">{emp.name}</span>
                        <span className="text-xs text-slate-500">{emp.role}</span>
                        {emp.employmentStatus === 'PROBATION' ? (
                          <TierBadge tier="Probation (Exempt)" />
                        ) : (
                          <ReviewStatusBadge
                            status={emp.managerReviewStatus}
                            isOverdue={emp.isOverdue}
                            hasGrace={hasGrace}
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                        <span>
                          Self-Review:{' '}
                          <strong className="text-slate-700">
                            {emp.selfReviewStatus === 'SUBMITTED'
                              ? `Submitted (${emp.selfCompositeScore?.toFixed(2) ?? '—'})`
                              : 'Not Submitted'}
                          </strong>
                        </span>
                        <span>•</span>
                        <span>
                          Your Raw Score:{' '}
                          <strong className="text-slate-900 font-mono">
                            {emp.rawCompositeScore !== null ? emp.rawCompositeScore.toFixed(2) : '—'}
                          </strong>
                        </span>
                        {emp.totalGoalWeight !== 100 && emp.employmentStatus === 'ELIGIBLE' && (
                          <span className="text-amber-600 font-bold">
                            ⚠ Goal weights = {emp.totalGoalWeight}%
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setGoalEmpId(emp.id);
                          setActiveTab('goals');
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-100 text-slate-700"
                      >
                        Goals ({emp.goals.length})
                      </button>
                      {emp.employmentStatus === 'ELIGIBLE' && (
                        <button
                          onClick={() => openEvaluationFor(emp.id)}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                            needsAction
                              ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm'
                              : 'bg-slate-900 hover:bg-slate-800 text-white'
                          }`}
                        >
                          {needsAction ? 'Evaluate Now →' : 'View / Edit'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: CONDUCT EVALUATIONS ==================== */}
      {activeTab === 'evaluate' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Grouped Team Selector */}
          <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-24">
            {needsActionTeam.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700">
                    Needs Your Review ({needsActionTeam.length})
                  </span>
                </div>
                {needsActionTeam.map((emp) => renderPersonButton(emp, 'amber'))}
              </div>
            )}

            {completedTeam.length > 0 && (
              <div className="space-y-2">
                <div className="px-1 text-[11px] font-extrabold uppercase tracking-wider text-emerald-700">
                  Completed ({completedTeam.length})
                </div>
                {completedTeam.map((emp) => renderPersonButton(emp, 'emerald'))}
              </div>
            )}

            {exemptTeam.length > 0 && (
              <div className="space-y-2">
                <div className="px-1 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  Probation / Exempt ({exemptTeam.length})
                </div>
                {exemptTeam.map((emp) => renderPersonButton(emp, 'slate'))}
              </div>
            )}
          </div>

          {/* Right Structured Evaluation Form — Smooth Person Switch */}
          <div key={activeEvalEmp?.id ?? 'none'} className="lg:col-span-8 animate-page-enter">
            {!activeEvalEmp ? (
              <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center text-sm text-slate-500">
                Select a direct report on the left to begin evaluating.
              </div>
            ) : activeEvalEmp.employmentStatus === 'PROBATION' ? (
              <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center space-y-2 shadow-sm">
                <div className="text-lg font-extrabold text-slate-900">{activeEvalEmp.name}</div>
                <TierBadge tier="Probation (Exempt)" />
                <p className="text-xs text-slate-500 max-w-md mx-auto pt-2 leading-relaxed">
                  Joined on <strong>{activeEvalEmp.joinDate}</strong>. Employees in their 90-day
                  probation period are exempt from the annual rating pool. Track their onboarding
                  milestones under <strong>Team Goals & OKRs</strong>.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Header Summary Card */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="text-xl font-extrabold text-slate-900">
                        {activeEvalEmp.name}
                      </h2>
                      <ReviewStatusBadge
                        status={activeEvalEmp.managerReviewStatus}
                        isOverdue={activeEvalEmp.isOverdue}
                        hasGrace={hasGrace}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {activeEvalEmp.role} • Self-Assessment:{' '}
                      <strong className="text-slate-800">
                        {activeEvalEmp.selfReviewStatus === 'SUBMITTED'
                          ? `Submitted (${activeEvalEmp.selfCompositeScore?.toFixed(2) ?? '—'})`
                          : 'Missing (You can still evaluate)'}
                      </strong>
                    </p>
                  </div>

                  <div className="bg-slate-900 text-white px-4 py-2.5 rounded-xl text-right">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Live Composite Score
                    </div>
                    <div className="text-2xl font-extrabold font-mono text-orange-400">
                      {previewScore !== null ? previewScore.toFixed(2) : '—'}{' '}
                      <span className="text-xs font-normal text-slate-400">/ 5.0</span>
                    </div>
                    <div className="text-[10px] text-slate-300">
                      {getRubricShortLabel(previewScore).text}
                    </div>
                  </div>
                </div>

                {/* Alignment Gap Alert */}
                {activeEvalEmp.selfCompositeScore !== null &&
                  previewScore !== null &&
                  Math.abs(activeEvalEmp.selfCompositeScore - previewScore) >= 1.0 && (
                    <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 flex items-start gap-3 text-xs text-amber-950">
                      <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
                      <div>
                        <div className="font-extrabold text-sm">
                          Large Self vs. Manager Gap Detected (
                          {Math.abs(activeEvalEmp.selfCompositeScore - previewScore).toFixed(2)}{' '}
                          pts)
                        </div>
                        <p className="mt-0.5">
                          Employee rated themselves{' '}
                          <strong>{activeEvalEmp.selfCompositeScore.toFixed(2)}</strong> vs. your{' '}
                          <strong>{previewScore.toFixed(2)}</strong>. Include concrete examples in
                          Development Areas to prepare for your 1-on-1 review conversation.
                        </p>
                      </div>
                    </div>
                  )}

                {/* Step 1: KPIs */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-extrabold flex items-center justify-center">
                        1
                      </span>
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900">
                          Rate KPIs & Annual Goals
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Counts for {state.cycle.kpiWeight}% of total raw score
                        </p>
                      </div>
                    </div>
                    {activeEvalEmp.totalGoalWeight !== 100 && (
                      <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                        ⚠ Weights = {activeEvalEmp.totalGoalWeight}%
                      </span>
                    )}
                  </div>

                  <div className="space-y-4">
                    {draftGoals.map((g, idx) => (
                      <div
                        key={g.id}
                        className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-extrabold text-slate-900">{g.title}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{g.description}</div>
                          </div>
                          <span className="text-xs font-extrabold bg-white border border-slate-300 px-2.5 py-1 rounded-lg shrink-0">
                            Weight: {g.weight}%
                          </span>
                        </div>

                        <div className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200">
                          <div className="flex flex-wrap items-center gap-3">
                            <span>
                              Progress: <strong className="text-slate-900">{g.progress}%</strong>
                            </span>
                            <span>•</span>
                            <span>
                              Employee Self-Rating:{' '}
                              <strong className="text-indigo-700 font-mono">
                                {g.selfScore !== null ? g.selfScore.toFixed(1) : 'Not rated'}
                              </strong>
                            </span>
                          </div>
                          {g.employeeComment && (
                            <div className="mt-1.5 italic text-slate-600 border-l-2 border-indigo-200 pl-2.5">
                              &ldquo;{g.employeeComment}&rdquo;
                            </div>
                          )}
                        </div>

                        <ScoreSelector
                          label="Manager Rating:"
                          value={g.managerScore}
                          disabled={isLocked}
                          accent="orange"
                          onChange={(val) => {
                            setDraftGoals((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, managerScore: val } : item
                              )
                            );
                            setHasUnsavedChanges(true);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step 2: Core Competencies */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                  <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                    <span className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-extrabold flex items-center justify-center">
                      2
                    </span>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">
                        Rate Core Competencies
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Counts for {state.cycle.competencyWeight}% of total raw score
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {draftComps.map((c, idx) => (
                      <div
                        key={c.id}
                        className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <div className="text-sm font-bold text-slate-900">{c.name}</div>
                            <div className="text-xs text-slate-500">{c.description}</div>
                          </div>
                          <span className="text-xs font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-bold shrink-0">
                            Self: {c.selfScore !== null ? c.selfScore.toFixed(1) : '—'}
                          </span>
                        </div>

                        <ScoreSelector
                          label="Manager Rating:"
                          value={c.managerScore}
                          disabled={isLocked}
                          accent="orange"
                          onChange={(val) => {
                            setDraftComps((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, managerScore: val } : item
                              )
                            );
                            setHasUnsavedChanges(true);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step 3 & 4: Potential & Feedback */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
                  <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                    <span className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-extrabold flex items-center justify-center">
                      3
                    </span>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">
                        Leadership Potential & Written Feedback
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Used for HR 9-Box Talent Calibration and employee 1-on-1 feedback
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      { val: 1 as const, label: 'Low Potential', desc: 'Focus on mastering current role' },
                      { val: 2 as const, label: 'Moderate Potential', desc: 'Growing impact in role' },
                      { val: 3 as const, label: 'High Potential', desc: 'Ready for next level / lead' },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        type="button"
                        disabled={isLocked}
                        onClick={() => {
                          setDraftPotential(opt.val);
                          setHasUnsavedChanges(true);
                        }}
                        className={`p-3.5 rounded-xl border-2 text-left transition ${
                          draftPotential === opt.val
                            ? 'bg-indigo-50 border-indigo-600 text-indigo-950'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-xs font-extrabold">{opt.label}</div>
                        <div className="text-[11px] opacity-75 mt-0.5">{opt.desc}</div>
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                        Key Strengths
                      </label>
                      <textarea
                        rows={3}
                        disabled={isLocked}
                        value={draftStrengths}
                        onChange={(e) => {
                          setDraftStrengths(e.target.value);
                          setHasUnsavedChanges(true);
                        }}
                        placeholder="Highlight concrete wins and behaviors..."
                        className="w-full text-xs border border-slate-300 rounded-xl p-3 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                        Development Areas & Next Steps
                      </label>
                      <textarea
                        rows={3}
                        disabled={isLocked}
                        value={draftDev}
                        onChange={(e) => {
                          setDraftDev(e.target.value);
                          setHasUnsavedChanges(true);
                        }}
                        placeholder="Specific coaching or growth areas for next year..."
                        className="w-full text-xs border border-slate-300 rounded-xl p-3 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Sticky Bottom Action Bar — Clean White empeo Bar */}
                <div className="sticky bottom-4 z-10 bg-white px-5 py-3.5 rounded-2xl shadow-card-hover border border-[#E8ECF2] flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs">
                    {hasUnsavedChanges ? (
                      <span className="text-[#B45309] font-semibold">
                        ● Unsaved changes — click Save Draft or Submit
                      </span>
                    ) : (
                      <span className="text-[#15803D] font-semibold">
                        ✓ Saved to database
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      disabled={isLocked}
                      onClick={() => handleSaveEval(false)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-white hover:bg-[#F7F8FA] border border-[#E8ECF2] text-[#212141] disabled:opacity-40"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save Draft
                    </button>
                    <button
                      type="button"
                      disabled={isLocked}
                      onClick={() => handleSaveEval(true)}
                      className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold bg-[#EE5D36] hover:bg-[#D94D28] text-white shadow-xs disabled:opacity-40"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Submit Final Evaluation
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 3: TEAM GOALS & OKRs ==================== */}
      {activeTab === 'goals' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-4">
            {myTeam.map((emp) => (
              <div
                key={emp.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">{emp.name}</h3>
                    <div className="text-xs text-slate-500">{emp.role}</div>
                  </div>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                      emp.totalGoalWeight === 100
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    Total Weight: {emp.totalGoalWeight}%
                    {emp.totalGoalWeight !== 100 && ' (Target: 100%)'}
                  </span>
                </div>

                <div className="space-y-2">
                  {emp.goals.map((g) => (
                    <div
                      key={g.id}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{g.title}</span>
                          {g.status === 'PROPOSED' && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
                              Proposed by Employee
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Progress: {g.progress}% • {g.description}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {g.status === 'PROPOSED' && (
                          <button
                            onClick={() => updateGoal(emp.id, g.id, { status: 'APPROVED' })}
                            className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                          >
                            Approve
                          </button>
                        )}
                        <input
                          type="number"
                          min="5"
                          max="100"
                          disabled={isLocked}
                          value={g.weight}
                          onChange={(e) =>
                            updateGoal(emp.id, g.id, { weight: Number(e.target.value) })
                          }
                          className="w-16 px-2 py-1 text-xs font-mono font-bold border border-slate-300 rounded-lg bg-white text-right"
                        />
                        <span className="text-xs text-slate-400">%</span>
                        <button
                          disabled={isLocked}
                          onClick={() => deleteGoal(emp.id, g.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-40"
                          title="Delete goal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Assign New Goal Card */}
          <div className="lg:col-span-4">
            <form
              onSubmit={handleAddGoal}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 sticky top-24"
            >
              <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                <Plus className="w-4 h-4 text-orange-500" />
                Assign New Goal / OKR
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Team Member
                </label>
                <select
                  value={goalEmpId}
                  onChange={(e) => setGoalEmpId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 rounded-xl bg-white"
                >
                  {myTeam.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} (Current: {e.totalGoalWeight}%)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Goal Title
                </label>
                <input
                  type="text"
                  required
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  placeholder="e.g., Launch Q4 Customer Portal"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Success Criteria / Description
                </label>
                <textarea
                  rows={2}
                  value={newGoalDesc}
                  onChange={(e) => setNewGoalDesc(e.target.value)}
                  placeholder="Measurable target or deliverable..."
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
                  value={newGoalWeight}
                  onChange={(e) => setNewGoalWeight(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl"
                />
              </div>
              <button
                type="submit"
                disabled={isLocked}
                className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-extrabold transition disabled:opacity-50"
              >
                + Assign Goal & Save to DB
              </button>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
};
