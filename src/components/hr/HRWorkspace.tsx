import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  LayoutDashboard,
  Scale,
  Grid3X3,
  Settings2,
  Users,
  History,
  Download,
  BellRing,
  Unlock,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Plus,
  Send,
  SlidersHorizontal,
  Trash2,
  ArrowRight,
  Pencil,
  KeyRound,
} from 'lucide-react';
import { useHRM } from '../../context/HRMContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { AppShell, NavItem } from '../layout/AppShell';
import {
  ActionPlanBadge,
  CyclePhaseStepper,
  PHASE_LABELS,
  ReviewStatusBadge,
  TierBadge,
} from '../ui/Badges';
import {
  CompetencyTemplate,
  CyclePhase,
  EmploymentStatus,
  EnrichedEmployee,
  ManagerProfile,
} from '../../types/hrm';
import { RATING_RUBRIC } from '../../data/seedData';
import { EmployeeCalibrationDrawer } from './EmployeeCalibrationDrawer';
import { CalibrationGuidePanel } from './CalibrationGuidePanel';

export const HRWorkspace: React.FC = () => {
  const {
    state,
    enrichedEmployees,
    managerStats,
    orgMeanRaw,
    orgMeanFinal,
    toggleNormalization,
    grantGracePeriod,
    revokeGracePeriod,
    sendReminder,
    publishCycle,
    reopenCalibration,
    updateCycle,
    addCompetencyTemplate,
    updateCompetencyTemplate,
    deleteCompetencyTemplate,
    addManager,
    updateManager,
    deleteManager,
    addEmployee,
    updateEmployeeRecord,
    deleteEmployee,
    exportCalibrationCSV,
  } = useHRM();
  const { bi } = useLanguage();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);

  // Filters for Calibration Table
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [tierFilter, setTierFilter] = useState('ALL');

  // Cycle Policy Form
  const [cycleName, setCycleName] = useState(state.cycle.name);
  const [cycleDeadline, setCycleDeadline] = useState(state.cycle.deadline);
  const [cyclePhase, setCyclePhase] = useState<CyclePhase>(state.cycle.phase);
  const [kpiWeight, setKpiWeight] = useState(state.cycle.kpiWeight);

  // Add Employee Modal
  const [showAddEmp, setShowAddEmp] = useState(false);
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpPassword, setNewEmpPassword] = useState('password123');
  const [newEmpRole, setNewEmpRole] = useState('');
  const [newEmpMgrId, setNewEmpMgrId] = useState(state.managers[0]?.id ?? '');
  const [newEmpStatus, setNewEmpStatus] = useState<EmploymentStatus>('ELIGIBLE');
  const [newEmpJoinDate, setNewEmpJoinDate] = useState(new Date().toISOString().slice(0, 10));

  // Add / Edit Manager Modal
  const [showMgrModal, setShowMgrModal] = useState(false);
  const [editingMgrId, setEditingMgrId] = useState<string | null>(null);
  const [mgrName, setMgrName] = useState('');
  const [mgrEmail, setMgrEmail] = useState('');
  const [mgrTitle, setMgrTitle] = useState('');
  const [mgrDept, setMgrDept] = useState('');
  const [mgrPassword, setMgrPassword] = useState('password123');

  // Add / Edit Evaluation Criterion (Core Competency) Modal
  const [showCompModal, setShowCompModal] = useState(false);
  const [editingCompId, setEditingCompId] = useState<string | null>(null);
  const [compName, setCompName] = useState('');
  const [compDesc, setCompDesc] = useState('');

  // Publish confirmation modal
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);

  const selectedEmployee: EnrichedEmployee | null = useMemo(
    () => enrichedEmployees.find((e) => e.id === selectedEmpId) ?? null,
    [enrichedEmployees, selectedEmpId]
  );

  const eligibleEmployees = useMemo(
    () => enrichedEmployees.filter((e) => e.employmentStatus === 'ELIGIBLE'),
    [enrichedEmployees]
  );
  const submittedCount = eligibleEmployees.filter(
    (e) => e.managerReviewStatus === 'SUBMITTED'
  ).length;
  const overdueEmployees = eligibleEmployees.filter((e) => e.isOverdue);
  const issueEmployees = eligibleEmployees.filter((e) =>
    e.issues.some((i) => i.code !== 'PROBATION')
  );

  const highCount = eligibleEmployees.filter((e) => e.tier === 'High Performer').length;
  const coreCount = eligibleEmployees.filter((e) => e.tier === 'Core Performer').length;
  const lowCount = eligibleEmployees.filter((e) => e.tier === 'Low Performer').length;
  const probationCount = enrichedEmployees.filter(
    (e) => e.employmentStatus === 'PROBATION'
  ).length;

  const departments = useMemo(
    () => [...new Set(enrichedEmployees.map((e) => e.department))],
    [enrichedEmployees]
  );

  const filteredCalibration = useMemo(() => {
    return enrichedEmployees.filter((e) => {
      if (deptFilter !== 'ALL' && e.department !== deptFilter) return false;
      if (tierFilter !== 'ALL' && e.tier !== tierFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          e.name.toLowerCase().includes(q) ||
          e.role.toLowerCase().includes(q) ||
          e.managerName.toLowerCase().includes(q) ||
          e.employeeCode.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [enrichedEmployees, deptFilter, tierFilter, searchQuery]);

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: bi('ภาพรวม HR', 'Executive Dashboard'),
      icon: <LayoutDashboard className="w-4 h-4" />,
      badge: overdueEmployees.length > 0 ? overdueEmployees.length : undefined,
    },
    {
      id: 'calibration',
      label: bi('ปรับเทียบคะแนน (Fairness)', 'Calibration & Fairness'),
      icon: <Scale className="w-4 h-4" />,
    },
    {
      id: 'ninebox',
      label: bi('ตาราง 9-Box Talent', '9-Box Talent Matrix'),
      icon: <Grid3X3 className="w-4 h-4" />,
    },
    {
      id: 'cycles',
      label: bi('รอบประเมินและนโยบาย', 'Cycle & Policies'),
      icon: <Settings2 className="w-4 h-4" />,
    },
    {
      id: 'directory',
      label: bi('รายชื่อพนักงาน', 'Employees & Org'),
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'audit',
      label: bi('ประวัติการแก้ไข (Audit)', 'Audit Trail'),
      icon: <History className="w-4 h-4" />,
    },
  ];

  const pageMeta: Record<string, { title: string; subtitle: string }> = {
    dashboard: {
      title: bi('ภาพรวมการประเมินผลงานองค์กร', 'HR Performance Overview'),
      subtitle: bi(
        'ติดตามความคืบหน้า จัดการเคสส่งล่าช้า และดูสัดส่วนกลุ่มผลงานทั้งองค์กร',
        'Monitor review completion, resolve late submissions, and track organizational talent distribution.'
      ),
    },
    calibration: {
      title: bi('ปรับเทียบความยุติธรรม (Calibration)', 'Fairness & Calibration Workbench'),
      subtitle: bi(
        'ตรวจจับความต่างของเกณฑ์หัวหน้าแต่ละแผนก และปรับเทียบคะแนนด้วย Z-Score อย่างเป็นธรรม',
        'Detect strict vs. lenient manager grading bias and calibrate scores fairly across departments.'
      ),
    },
    ninebox: {
      title: bi('ตารางประเมินศักยภาพ 9-Box Talent', '9-Box Talent Matrix'),
      subtitle: bi(
        'จัดกลุ่มผลงานเทียบกับศักยภาพเพื่อวางแผนเลื่อนตำแหน่ง โบนัส และแผนพัฒนา',
        'Plot calibrated Performance against Leadership Potential to surface stars and coaching priorities.'
      ),
    },
    cycles: {
      title: bi('ตั้งค่ารอบประเมินและนโยบาย', 'Review Cycle & Policy Setup'),
      subtitle: bi(
        'กำหนดระยะเวลา สัดส่วน KPI/Competency เปิดสิทธิ์ผ่อนผัน และประกาศผลประเมิน',
        'Manage review phases, scoring weights, deadlines, grace periods, and result publication.'
      ),
    },
    directory: {
      title: bi('รายชื่อพนักงานและสิทธิ์การประเมิน', 'Employee Directory & Eligibility'),
      subtitle: bi(
        'เพิ่ม-ลบ-แก้ไขข้อมูลพนักงาน ตั้งค่ายกเว้น Probation และเปลี่ยนสายบังคับบัญชา',
        'Manage employee roster, probation exemptions, and manager reporting lines.'
      ),
    },
    audit: {
      title: bi('ประวัติการปรับเทียบและตรวจสอบ (Audit Trail)', 'Calibration & Governance Audit Trail'),
      subtitle: bi(
        'บันทึกทุกการปรับคะแนน Override การเปิด Grace Period และการประกาศผลแบบตรวจสอบย้อนหลังได้',
        'Immutable log of every score override, grace period, reminder, and cycle state change.'
      ),
    },
  };

  const handleSaveCyclePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    const safeKpi = Math.min(100, Math.max(0, Number(kpiWeight)));
    updateCycle({
      name: cycleName.trim() || state.cycle.name,
      deadline: cycleDeadline,
      phase: cyclePhase,
      kpiWeight: safeKpi,
      competencyWeight: 100 - safeKpi,
    });
  };

  const openAddCompModal = () => {
    setEditingCompId(null);
    setCompName('');
    setCompDesc('');
    setShowCompModal(true);
  };

  const openEditCompModal = (comp: CompetencyTemplate) => {
    setEditingCompId(comp.id);
    setCompName(comp.name);
    setCompDesc(comp.description);
    setShowCompModal(true);
  };

  const handleSaveComp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!compName.trim()) return;
    if (editingCompId) {
      updateCompetencyTemplate(editingCompId, { name: compName, description: compDesc });
    } else {
      addCompetencyTemplate({ name: compName, description: compDesc });
    }
    setShowCompModal(false);
  };

  const openAddManagerModal = () => {
    setEditingMgrId(null);
    setMgrName('');
    setMgrEmail('');
    setMgrTitle('');
    setMgrDept('');
    setMgrPassword('password123');
    setShowMgrModal(true);
  };

  const openEditManagerModal = (mgr: ManagerProfile) => {
    setEditingMgrId(mgr.id);
    setMgrName(mgr.name);
    setMgrEmail(mgr.email);
    setMgrTitle(mgr.title);
    setMgrDept(mgr.department);
    setMgrPassword(mgr.password || 'password123');
    setShowMgrModal(true);
  };

  const handleSaveManager = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mgrName.trim() || !mgrEmail.trim() || !mgrTitle.trim() || !mgrDept.trim()) return;
    if (editingMgrId) {
      updateManager(editingMgrId, {
        name: mgrName,
        email: mgrEmail,
        title: mgrTitle,
        department: mgrDept,
        password: mgrPassword,
      });
    } else {
      addManager({
        name: mgrName,
        email: mgrEmail,
        title: mgrTitle,
        department: mgrDept,
        password: mgrPassword,
      });
    }
    setShowMgrModal(false);
  };

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpName.trim() || !newEmpEmail.trim() || !newEmpRole.trim()) return;
    const mgr = state.managers.find((m) => m.id === newEmpMgrId) ?? state.managers[0];
    if (!mgr) return;
    addEmployee({
      name: newEmpName.trim(),
      email: newEmpEmail.trim(),
      password: newEmpPassword.trim() || 'password123',
      role: newEmpRole.trim(),
      department: mgr.department,
      managerId: mgr.id,
      managerName: mgr.name,
      joinDate: newEmpJoinDate,
      employmentStatus: newEmpStatus,
    });
    setShowAddEmp(false);
    setNewEmpName('');
    setNewEmpEmail('');
    setNewEmpPassword('password123');
    setNewEmpRole('');
  };

  const headerActions = (
    <>
      <button
        onClick={exportCalibrationCSV}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#E8ECF2] bg-white hover:bg-[#F7F8FA] text-xs font-bold text-[#212141] transition"
      >
        <Download className="w-3.5 h-3.5" />
        {bi('ส่งออก CSV', 'Export CSV')}
      </button>
      {state.cycle.phase === 'PUBLISHED' ? (
        <button
          onClick={reopenCalibration}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#212141] hover:bg-[#2E2E54] text-white text-xs font-bold transition"
        >
          <Unlock className="w-3.5 h-3.5" />
          {bi('เปิดปรับเทียบใหม่', 'Reopen Calibration')}
        </button>
      ) : (
        <button
          onClick={() => setShowPublishConfirm(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#EE5D36] hover:bg-[#D94D28] text-white text-xs font-bold transition shadow-xs"
        >
          <Send className="w-3.5 h-3.5" />
          {bi('ประกาศผลประเมิน', 'Publish Results')}
        </button>
      )}
    </>
  );

  return (
    <AppShell
      navItems={navItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      pageTitle={pageMeta[activeTab].title}
      pageSubtitle={pageMeta[activeTab].subtitle}
      headerActions={headerActions}
    >
      {/* ==================== TAB 1: EXECUTIVE DASHBOARD ==================== */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Clean 3-Step HR Workflow Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-[#E8ECF2] shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400">Step 1 • Readiness</span>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    overdueEmployees.length > 0
                      ? 'bg-[#FFF1F2] text-[#E11D48]'
                      : 'bg-[#ECFDF5] text-[#15803D]'
                  }`}
                >
                  {overdueEmployees.length > 0 ? `${overdueEmployees.length} Overdue` : 'Ready'}
                </span>
              </div>
              <div className="text-sm font-bold text-[#212141] mt-2">
                Resolve Late Reviews &amp; Weights
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Send reminders or grant grace periods below before finalizing calibration.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('calibration')}
              className="p-5 rounded-2xl bg-white border border-[#E8ECF2] hover:border-[#EE5D36] shadow-card card-interactive text-left group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#5B63F6]">Step 2 • Calibration</span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#EE5D36] group-hover:translate-x-0.5 transition" />
              </div>
              <div className="text-sm font-bold text-[#212141] mt-2">
                Calibrate Bias &amp; Talent Tiers
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Compare manager scales, review Z-scores, and assign Promotion or PIP tracks.
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                state.cycle.phase === 'PUBLISHED'
                  ? setActiveTab('audit')
                  : setShowPublishConfirm(true)
              }
              className="p-5 rounded-2xl bg-white border border-[#E8ECF2] hover:border-[#EE5D36] shadow-card card-interactive text-left group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#EE5D36]">Step 3 • Release</span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#EE5D36] group-hover:translate-x-0.5 transition" />
              </div>
              <div className="text-sm font-bold text-[#212141] mt-2">
                {state.cycle.phase === 'PUBLISHED'
                  ? 'Results Published'
                  : 'Publish Official Results'}
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {state.cycle.phase === 'PUBLISHED'
                  ? 'Scores are live for employees. Click to review Audit Trail.'
                  : 'Lock scores and release results to the Employee Portal.'}
              </p>
            </button>
          </div>

          {/* Cycle Progress Stepper */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Active Review Lifecycle
                </div>
                <div className="text-base font-extrabold text-slate-900 mt-0.5">
                  {state.cycle.name} ({state.cycle.period})
                </div>
              </div>
              <div className="text-xs text-slate-500">
                Weight Split:{' '}
                <strong className="text-slate-800">
                  {state.cycle.kpiWeight}% KPI / {state.cycle.competencyWeight}% Competency
                </strong>{' '}
                • Deadline: <strong className="text-slate-800">{state.cycle.deadline}</strong>
              </div>
            </div>
            <CyclePhaseStepper currentPhase={state.cycle.phase} />
          </div>

          {/* 4 KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-xs font-semibold text-slate-500">Review Completion</div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-slate-900">
                  {submittedCount}/{eligibleEmployees.length}
                </span>
                <span className="text-xs font-bold text-emerald-600">
                  ({Math.round((submittedCount / (eligibleEmployees.length || 1)) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{
                    width: `${Math.round((submittedCount / (eligibleEmployees.length || 1)) * 100)}%`,
                  }}
                />
              </div>
              <div className="text-[11px] text-slate-400 mt-2">
                +{probationCount} Probation hire(s) exempt
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-xs font-semibold text-slate-500">Overdue Manager Reviews</div>
              <div className="flex items-baseline gap-2 mt-2">
                <span
                  className={`text-3xl font-extrabold ${
                    overdueEmployees.length > 0 ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {overdueEmployees.length}
                </span>
                <span className="text-xs text-slate-500">past {state.cycle.deadline}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-3">
                {overdueEmployees.length > 0
                  ? 'Send reminders or grant targeted grace periods below.'
                  : 'All eligible manager evaluations submitted on time.'}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-xs font-semibold text-slate-500">Calibration Status</div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-indigo-700 font-mono">
                  {orgMeanFinal !== null ? orgMeanFinal.toFixed(2) : '—'}
                </span>
                <span className="text-xs text-slate-500">org calibrated avg</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-3">
                {state.cycle.normalizationEnabled
                  ? 'Z-Score Fairness Calibration is ACTIVE.'
                  : 'Showing Raw Unadjusted Manager Scores.'}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-xs font-semibold text-slate-500">Surfaced Talent Tiers</div>
              <div className="flex items-center gap-4 mt-2.5">
                <div>
                  <div className="text-2xl font-extrabold text-emerald-600">{highCount}</div>
                  <div className="text-[11px] text-slate-500">High</div>
                </div>
                <div className="h-7 w-px bg-slate-200" />
                <div>
                  <div className="text-2xl font-extrabold text-sky-600">{coreCount}</div>
                  <div className="text-[11px] text-slate-500">Core</div>
                </div>
                <div className="h-7 w-px bg-slate-200" />
                <div>
                  <div className="text-2xl font-extrabold text-rose-600">{lowCount}</div>
                  <div className="text-[11px] text-slate-500">Low</div>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('ninebox')}
                className="text-[11px] font-bold text-orange-600 hover:underline mt-2.5 inline-block"
              >
                Open 9-Box Talent Matrix →
              </button>
            </div>
          </div>

          {/* Action Required Queue (Messy Reality Handler) */}
          <div className="bg-white rounded-2xl border border-[#FFD6CA] shadow-card overflow-hidden">
            <div className="px-5 py-4 bg-[#FFF3EF] border-b border-[#FFD6CA] flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-[#212141] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#EE5D36]" />
                  Action Required — Data Health &amp; Deadline Exceptions
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Real-world cycle exceptions automatically detected by empeo so HR can intervene
                  before publishing.
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#EE5D36] text-white">
                {issueEmployees.length} items
              </span>
            </div>

            {issueEmployees.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                All review data is clean and ready for publication!
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {issueEmployees.map((emp) => {
                  const hasGrace = state.cycle.gracePeriodManagerIds.includes(emp.managerId);
                  return (
                    <div
                      key={emp.id}
                      className="px-5 py-4 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-50/70 transition"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-slate-900">{emp.name}</span>
                          <span className="text-xs text-slate-500">
                            ({emp.department} • Mgr: {emp.managerName})
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {emp.issues.map((iss, idx) => (
                            <span
                              key={idx}
                              title={iss.detail}
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                                iss.severity === 'error'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {iss.label}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {emp.isOverdue && (
                          <>
                            <button
                              onClick={() => sendReminder(emp.managerId, emp.managerName)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-100 text-slate-700"
                            >
                              <BellRing className="w-3.5 h-3.5 text-amber-500" />
                              Remind {emp.managerName.split(' ')[0]}
                            </button>
                            {!hasGrace ? (
                              <button
                                onClick={() => grantGracePeriod(emp.managerId, emp.managerName)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white"
                              >
                                <Unlock className="w-3.5 h-3.5" />
                                Grant Grace Period
                              </button>
                            ) : (
                              <button
                                onClick={() => revokeGracePeriod(emp.managerId, emp.managerName)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
                              >
                                <Lock className="w-3.5 h-3.5" />
                                Close Grace
                              </button>
                            )}
                          </>
                        )}
                        <button
                          onClick={() => setSelectedEmpId(emp.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white"
                        >
                          Inspect
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 2: CALIBRATION & FAIRNESS ==================== */}
      {activeTab === 'calibration' && (
        <div className="space-y-6">
          {/* Interactive Calibration Methodology & Formula Guide */}
          <CalibrationGuidePanel
            cycle={state.cycle}
            employees={enrichedEmployees}
            managerStats={managerStats}
          />

          {/* Fairness Control Card — Clean empeo Style */}
          <div className="bg-white p-5 rounded-2xl border border-[#E8ECF2] shadow-card flex flex-wrap items-center justify-between gap-4">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-[#EE5D36] text-xs font-bold">
                <Scale className="w-4 h-4" /> Cross-Department Fairness Calibration
              </div>
              <h2 className="text-base font-extrabold text-[#212141] mt-1">
                Z-Score Grading Bias Normalization
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Aligns each manager&apos;s rating scale to a shared company benchmark (Mean 3.50, SD
                0.75) so strict and lenient managers don&apos;t distort employee outcomes.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-[#F7F8FA] border border-[#E8ECF2] px-4 py-3 rounded-2xl">
              <div className="text-right">
                <div className="text-xs font-bold text-[#212141]">
                  {state.cycle.normalizationEnabled ? 'Calibration Active' : 'Raw Scores Only'}
                </div>
                <div className="text-[11px] text-slate-500">
                  {state.cycle.normalizationEnabled ? 'Fair Z-Score enabled' : 'Unadjusted ratings'}
                </div>
              </div>
              <button
                onClick={toggleNormalization}
                role="switch"
                aria-checked={state.cycle.normalizationEnabled}
                className={`w-12 h-6 rounded-full p-1 transition ${
                  state.cycle.normalizationEnabled ? 'bg-[#EE5D36]' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
                    state.cycle.normalizationEnabled ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Manager Bias Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {managerStats.map((ms) => {
              const rawPct = ms.meanRaw ? (ms.meanRaw / 5) * 100 : 0;
              const calPct = ms.meanNormalized ? (ms.meanNormalized / 5) * 100 : 0;
              const badgeCls =
                ms.biasLabel === 'Strict Grader'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : ms.biasLabel === 'Lenient Grader'
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200';

              return (
                <div
                  key={ms.managerId}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-semibold text-slate-500">{ms.department}</div>
                      <div className="text-sm font-extrabold text-slate-900">{ms.managerName}</div>
                    </div>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${badgeCls}`}>
                      {ms.biasLabel}
                    </span>
                  </div>

                  {/* Visual Comparison Bars */}
                  <div className="space-y-2 pt-1">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500">Raw Team Avg</span>
                        <span className="font-mono font-bold text-slate-800">
                          {ms.meanRaw !== null ? ms.meanRaw.toFixed(2) : '—'}
                          {orgMeanRaw !== null && ms.meanRaw !== null && (
                            <span className="text-[10px] text-slate-400 ml-1">
                              ({ms.biasDelta >= 0 ? '+' : ''}
                              {ms.biasDelta.toFixed(2)} vs org)
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-slate-400 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${rawPct}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#5B63F6] font-semibold">Calibrated Avg</span>
                        <span className="font-mono font-bold text-[#5B63F6]">
                          {ms.meanNormalized !== null ? ms.meanNormalized.toFixed(2) : '—'}
                        </span>
                      </div>
                      <div className="h-2 bg-[#EEF0FF] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#5B63F6] rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${calPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100">
                    <span>
                      Submitted: {ms.submittedCount}/{ms.eligibleCount}
                    </span>
                    <span>SD: {ms.stdDev !== null ? ms.stdDev.toFixed(2) : '—'}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search employee, role, code, or manager..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2 bg-white"
              >
                <option value="ALL">All Departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2 bg-white"
              >
                <option value="ALL">All Talent Tiers</option>
                <option value="High Performer">High Performer</option>
                <option value="Core Performer">Core Performer</option>
                <option value="Low Performer">Low Performer</option>
                <option value="Pending Review">Pending Review</option>
                <option value="Probation (Exempt)">Probation (Exempt)</option>
              </select>
            </div>
          </div>

          {/* Consolidated Calibration Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-4">Employee</th>
                    <th className="py-3.5 px-4">Dept / Manager</th>
                    <th className="py-3.5 px-4">Status & Health</th>
                    <th className="py-3.5 px-4">Self → Raw Mgr</th>
                    <th className="py-3.5 px-4">Final Score</th>
                    <th className="py-3.5 px-4">Surfaced Tier & Plan</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredCalibration.map((emp) => {
                    const hasGrace = state.cycle.gracePeriodManagerIds.includes(emp.managerId);
                    const tierChanged =
                      emp.employmentStatus === 'ELIGIBLE' &&
                      emp.rawCompositeScore !== null &&
                      emp.tier !== emp.rawTier;

                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{emp.name}</div>
                          <div className="text-xs text-slate-500">
                            {emp.role} • {emp.employeeCode}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-xs font-bold text-slate-800">{emp.department}</div>
                          <div className="text-xs text-slate-500">{emp.managerName}</div>
                        </td>
                        <td className="py-3.5 px-4 space-y-1">
                          {emp.employmentStatus === 'PROBATION' ? (
                            <TierBadge tier="Probation (Exempt)" />
                          ) : (
                            <ReviewStatusBadge
                              status={emp.managerReviewStatus}
                              isOverdue={emp.isOverdue}
                              hasGrace={hasGrace}
                            />
                          )}
                          {emp.issues
                            .filter((i) => i.code === 'WEIGHT_MISMATCH' || i.code === 'SCORE_GAP')
                            .map((iss, i) => (
                              <div key={i} className="text-[11px] font-semibold text-amber-600">
                                ⚠ {iss.label}
                              </div>
                            ))}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs">
                          {emp.rawCompositeScore !== null ? (
                            <div>
                              <span className="text-slate-400">
                                {emp.selfCompositeScore?.toFixed(2) ?? '—'}
                              </span>{' '}
                              →{' '}
                              <strong className="text-slate-900">
                                {emp.rawCompositeScore.toFixed(2)}
                              </strong>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          {emp.finalScore !== null ? (
                            <div>
                              <span className="font-extrabold text-indigo-700 text-sm">
                                {emp.finalScore.toFixed(2)}
                              </span>
                              {emp.scoreSource === 'OVERRIDE' ? (
                                <span className="ml-1.5 text-[10px] font-sans font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
                                  Override
                                </span>
                              ) : emp.scoreSource === 'NORMALIZED' && emp.zScore !== null ? (
                                <span className="ml-1 text-[11px] text-slate-400">
                                  ({emp.zScore >= 0 ? '+' : ''}
                                  {emp.zScore.toFixed(1)}σ)
                                </span>
                              ) : (
                                <span className="ml-1 text-[10px] font-sans text-slate-400">
                                  (Raw)
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col items-start gap-1">
                            <TierBadge tier={emp.tier} />
                            {tierChanged && (
                              <span className="text-[10px] font-semibold text-indigo-600">
                                Calibrated from {emp.rawTier}
                              </span>
                            )}
                            <ActionPlanBadge type={emp.actionPlan?.type} />
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedEmpId(emp.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 transition"
                          >
                            Calibrate
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 3: 9-BOX TALENT MATRIX ==================== */}
      {activeTab === 'ninebox' && (
        <div className="space-y-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Performance × Potential Calibration Grid
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Click any employee card to inspect scores, adjust calibration, or assign a Promotion
                / PIP action plan.
              </p>
            </div>
            <div className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200">
              Active Axis:{' '}
              {state.cycle.normalizationEnabled
                ? 'Calibrated Z-Score Performance'
                : 'Raw Manager Performance'}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  pot: 3,
                  tier: 'Low Performer',
                  title: 'Enigma / Rough Diamond',
                  hint: 'High Potential • Low Performance',
                  bg: 'bg-amber-50/70 border-amber-200',
                },
                {
                  pot: 3,
                  tier: 'Core Performer',
                  title: 'High Potential',
                  hint: 'High Potential • Core Performance',
                  bg: 'bg-emerald-50/60 border-emerald-200',
                },
                {
                  pot: 3,
                  tier: 'High Performer',
                  title: 'Future Star (Top Talent)',
                  hint: 'High Potential • High Performance',
                  bg: 'bg-emerald-100/80 border-emerald-300',
                },
                {
                  pot: 2,
                  tier: 'Low Performer',
                  title: 'Inconsistent Performer',
                  hint: 'Moderate Potential • Low Performance',
                  bg: 'bg-rose-50/60 border-rose-200',
                },
                {
                  pot: 2,
                  tier: 'Core Performer',
                  title: 'Core Backbone',
                  hint: 'Moderate Potential • Core Performance',
                  bg: 'bg-sky-50/60 border-sky-200',
                },
                {
                  pot: 2,
                  tier: 'High Performer',
                  title: 'High Impact Specialist',
                  hint: 'Moderate Potential • High Performance',
                  bg: 'bg-emerald-50/80 border-emerald-200',
                },
                {
                  pot: 1,
                  tier: 'Low Performer',
                  title: 'Underperformer (Action / PIP)',
                  hint: 'Low Potential • Low Performance',
                  bg: 'bg-rose-100/80 border-rose-300',
                },
                {
                  pot: 1,
                  tier: 'Core Performer',
                  title: 'Effective Contributor',
                  hint: 'Low Potential • Core Performance',
                  bg: 'bg-slate-50 border-slate-200',
                },
                {
                  pot: 1,
                  tier: 'High Performer',
                  title: 'Trusted Master',
                  hint: 'Low Potential • High Performance',
                  bg: 'bg-sky-50 border-sky-200',
                },
              ].map((cell, idx) => {
                const occupants = eligibleEmployees.filter(
                  (e) => e.potential === cell.pot && e.tier === cell.tier
                );
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border ${cell.bg} min-h-[155px] flex flex-col justify-between`}
                  >
                    <div>
                      <div className="text-xs font-extrabold text-slate-800">{cell.title}</div>
                      <div className="text-[10px] font-semibold text-slate-500">{cell.hint}</div>
                    </div>
                    <div className="mt-3 space-y-2">
                      {occupants.length === 0 ? (
                        <div className="text-[11px] text-slate-400 italic py-2">No employees</div>
                      ) : (
                        occupants.map((emp) => (
                          <button
                            key={emp.id}
                            onClick={() => setSelectedEmpId(emp.id)}
                            className="w-full bg-white hover:border-orange-400 px-3 py-2 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between text-left transition"
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 truncate">
                                {emp.name}
                              </div>
                              <div className="text-[10px] text-slate-500 truncate">
                                {emp.department}
                              </div>
                            </div>
                            <span className="font-mono text-xs font-extrabold text-indigo-700 ml-2">
                              {emp.finalScore?.toFixed(2)}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 4: CYCLE & POLICIES ==================== */}
      {activeTab === 'cycles' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cycle Configuration Form */}
          <form
            onSubmit={handleSaveCyclePolicy}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4"
          >
            <h2 className="text-base font-bold text-slate-900">Cycle Configuration & Weights</h2>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Cycle Name</label>
              <input
                type="text"
                value={cycleName}
                onChange={(e) => setCycleName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Phase
                </label>
                <select
                  value={cyclePhase}
                  onChange={(e) => setCyclePhase(e.target.value as CyclePhase)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white"
                >
                  {(Object.keys(PHASE_LABELS) as CyclePhase[]).map((p) => (
                    <option key={p} value={p}>
                      {PHASE_LABELS[p]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Manager Submission Deadline
                </label>
                <input
                  type="date"
                  value={cycleDeadline}
                  onChange={(e) => setCycleDeadline(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>KPI / OKR Weight: {kpiWeight}%</span>
                <span>Core Competency Weight: {100 - kpiWeight}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={kpiWeight}
                onChange={(e) => setKpiWeight(Number(e.target.value))}
                className="w-full accent-orange-500"
              />
              <p className="text-[11px] text-slate-500">
                Changing this split immediately recalculates composite scores across all employees.
              </p>
            </div>

            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"
            >
              {bi('บันทึกนโยบายรอบประเมิน', 'Save Cycle Policy')}
            </button>
          </form>

          {/* Evaluation Criteria / Core Competencies Builder (with Phase Guardrail) */}
          <div className="bg-white p-6 rounded-2xl border border-[#E8ECF2] shadow-card space-y-4 lg:col-span-2">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-base font-extrabold text-[#212141]">
                  {bi(
                    'หัวข้อและคำถามประเมินสมรรถนะ (Core Competencies)',
                    'Evaluation Criteria & Core Competencies'
                  )}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {bi(
                    `มีทั้งหมด ${state.competencyTemplates.length} หัวข้อ (คิดเป็น ${state.cycle.competencyWeight}% ของคะแนนรวม) — การเพิ่ม แก้ไข หรือลบจะซิงก์ไปยังแบบประเมินของพนักงานและหัวหน้าทุกคนอัตโนมัติ`,
                    `${state.competencyTemplates.length} active criteria (${state.cycle.competencyWeight}% of composite score) — changes sync automatically across all Self-Review & Manager forms.`
                  )}
                </p>
              </div>
              <button
                type="button"
                disabled={state.cycle.phase === 'PUBLISHED'}
                onClick={openAddCompModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#EE5D36] hover:bg-[#DC4E28] text-white text-xs font-bold transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                {bi('เพิ่มหัวข้อประเมิน', 'Add Criterion')}
              </button>
            </div>

            {/* Phase Guardrail Banner */}
            {state.cycle.phase === 'PUBLISHED' ? (
              <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700 flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                <span>
                  {bi(
                    'ล็อกการแก้ไขหัวข้อประเมินเนื่องจากประกาศผลแล้ว หากต้องการปรับแก้ต้องกด "Reopen Calibration" ก่อน',
                    'Evaluation criteria are locked because results are published. Reopen Calibration to make changes.'
                  )}
                </span>
              </div>
            ) : state.cycle.phase === 'GOAL_SETTING' ? (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {bi(
                    'รอบประเมินอยู่ในช่วงตั้งเป้าหมาย (Goal Setting) — HR สามารถเพิ่ม แก้ไข หรือลบหัวข้อประเมินได้อย่างอิสระ',
                    'Cycle is in Goal Setting — HR can freely customize evaluation criteria before reviews begin.'
                  )}
                </span>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  {bi(
                    'คำเตือน Fairness Guardrail: ขณะนี้มีผู้ประเมินเริ่มส่งคะแนนแล้ว การเพิ่มหรือลบหัวข้อกลางรอบจะคำนวณคะแนนใหม่ทั้งหมดและบันทึกประวัติลง Audit Trail',
                    'Fairness Guardrail Warning: Reviews are already underway. Adding or removing criteria mid-cycle recalculates composite scores and is permanently logged in the Audit Trail.'
                  )}
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {state.competencyTemplates.map((comp, idx) => (
                <div
                  key={comp.id}
                  className="p-4 rounded-xl border border-[#E8ECF2] bg-[#FAFBFD] flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#EEF0FF] text-[#5B63F6]">
                        #{idx + 1}
                      </span>
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          disabled={state.cycle.phase === 'PUBLISHED'}
                          onClick={() => openEditCompModal(comp)}
                          className="p-1 rounded-lg text-slate-500 hover:text-[#2E7CF6] hover:bg-blue-50 transition disabled:opacity-30"
                          title={bi('แก้ไขหัวข้อ', 'Edit criterion')}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={
                            state.cycle.phase === 'PUBLISHED' ||
                            state.competencyTemplates.length <= 1
                          }
                          onClick={() => {
                            if (
                              window.confirm(
                                bi(
                                  `ยืนยันการลบหัวข้อ "${comp.name}" ออกจากแบบประเมินของพนักงานทุกคน?`,
                                  `Remove "${comp.name}" from all employee evaluation forms?`
                                )
                              )
                            ) {
                              deleteCompetencyTemplate(comp.id);
                            }
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition disabled:opacity-30"
                          title={bi('ลบหัวข้อ', 'Delete criterion')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="text-sm font-bold text-[#212141] mt-2">{comp.name}</div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {comp.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Manager Grace Periods & Rating Rubric */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h2 className="text-base font-bold text-slate-900">Manager Grace Period Access</h2>
              <p className="text-xs text-slate-500">
                When the submission deadline has passed, managers are locked automatically. Grant a
                targeted grace period to let a specific late manager finish without reopening the
                whole company.
              </p>
              <div className="divide-y divide-slate-100">
                {managerStats.map((ms) => {
                  const hasGrace = state.cycle.gracePeriodManagerIds.includes(ms.managerId);
                  return (
                    <div
                      key={ms.managerId}
                      className="py-3 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="text-sm font-bold text-slate-900">{ms.managerName}</div>
                        <div className="text-xs text-slate-500">
                          {ms.department} • Submitted {ms.submittedCount}/{ms.eligibleCount}
                        </div>
                      </div>
                      {hasGrace ? (
                        <button
                          onClick={() => revokeGracePeriod(ms.managerId, ms.managerName)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-100 text-amber-800 hover:bg-amber-200"
                        >
                          Grace Active (Revoke)
                        </button>
                      ) : (
                        <button
                          onClick={() => grantGracePeriod(ms.managerId, ms.managerName)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 hover:bg-orange-500 hover:text-white transition"
                        >
                          Grant Grace Period
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h2 className="text-base font-bold text-slate-900">
                Company-Wide 5-Point Rating Rubric
              </h2>
              <div className="space-y-2">
                {RATING_RUBRIC.map((r) => (
                  <div key={r.score} className="text-xs flex items-start gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-slate-900 text-white font-bold flex items-center justify-center shrink-0">
                      {r.score}
                    </span>
                    <div>
                      <div className="font-bold text-slate-800">{r.label}</div>
                      <div className="text-slate-500">{r.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 5: EMPLOYEE & MANAGER DIRECTORY ==================== */}
      {activeTab === 'directory' && (
        <div className="space-y-6">
          {/* People Managers Directory (Add / Edit / Delete + Instant Login) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-sm font-extrabold text-[#212141]">
                  {bi('รายชื่อหัวหน้างาน (People Managers)', 'People Managers Directory')}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {bi(
                    `มีหัวหน้างานทั้งหมด ${state.managers.length} คน — สามารถเพิ่ม แก้ไข หรือลบได้ และใช้ Email + Password เข้าสู่ระบบได้ทันที`,
                    `${state.managers.length} active manager(s) — add, edit, or remove managers. Every manager account can sign in immediately.`
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={openAddManagerModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#212141] hover:bg-[#2d2d57] text-white text-xs font-bold transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                {bi('เพิ่มหัวหน้างาน', 'Add Manager')}
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-[#E8ECF2] shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F7F8FA] border-b border-[#E8ECF2] text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-4">{bi('หัวหน้างาน', 'Manager')}</th>
                      <th className="py-3 px-4">{bi('แผนก', 'Department')}</th>
                      <th className="py-3 px-4">{bi('บัญชีเข้าสู่ระบบ', 'Login Email')}</th>
                      <th className="py-3 px-4 text-center">{bi('ลูกทีม', 'Direct Reports')}</th>
                      <th className="py-3 px-4 text-right">{bi('จัดการ', 'Actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {state.managers.map((mgr) => {
                      const reportCount = state.employees.filter((e) => e.managerId === mgr.id).length;
                      return (
                        <tr key={mgr.id} className="hover:bg-[#FAFBFD]">
                          <td className="py-3 px-4">
                            <div className="font-bold text-[#212141]">{mgr.name}</div>
                            <div className="text-xs text-slate-500">{mgr.title}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EEF0FF] text-[#5B63F6]">
                              {mgr.department}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-600 font-mono">
                            <span className="inline-flex items-center gap-1.5">
                              <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                              {mgr.email}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center text-xs font-bold text-[#212141]">
                            {reportCount}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => openEditManagerModal(mgr)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-[#2E7CF6] hover:bg-blue-50 transition"
                                title={bi('แก้ไขข้อมูลหัวหน้างาน', 'Edit manager')}
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                disabled={state.managers.length <= 1}
                                onClick={() => {
                                  const msg =
                                    reportCount > 0
                                      ? bi(
                                          `ยืนยันการลบ ${mgr.name}? ลูกทีม ${reportCount} คนจะถูกโอนย้ายไปยังหัวหน้างานคนถัดไปอัตโนมัติ`,
                                          `Remove ${mgr.name}? Their ${reportCount} direct report(s) will be automatically reassigned to another manager.`
                                        )
                                      : bi(
                                          `ยืนยันการลบหัวหน้างาน ${mgr.name}?`,
                                          `Remove manager ${mgr.name} from the directory?`
                                        );
                                  if (window.confirm(msg)) {
                                    deleteManager(mgr.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition disabled:opacity-30"
                                title={bi('ลบหัวหน้างาน', 'Delete manager')}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Employees Directory */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-sm font-extrabold text-[#212141]">
                  {bi('รายชื่อพนักงานทั้งหมด (Employees)', 'Employees Directory')}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {bi(
                    `แสดงพนักงาน ${enrichedEmployees.length} คน ใน ${departments.length} แผนก — พนักงานทุกคนที่เพิ่มใหม่สามารถใช้ Email เข้าสู่ระบบได้ทันที`,
                    `Showing ${enrichedEmployees.length} employees across ${departments.length} departments. Newly added employees can sign in immediately.`
                  )}
                </p>
              </div>
              <button
                onClick={() => {
                  setNewEmpMgrId(state.managers[0]?.id ?? '');
                  setShowAddEmp(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#EE5D36] hover:bg-[#DC4E28] text-white text-xs font-bold transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                {bi('เพิ่มพนักงาน', 'Add Employee')}
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-[#E8ECF2] shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F7F8FA] border-b border-[#E8ECF2] text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3.5 px-4">{bi('พนักงาน', 'Employee')}</th>
                      <th className="py-3.5 px-4">{bi('วันเริ่มงาน', 'Join Date')}</th>
                      <th className="py-3.5 px-4">{bi('หัวหน้างาน', 'Reporting Manager')}</th>
                      <th className="py-3.5 px-4">{bi('สิทธิ์รอบประเมิน', 'Cycle Eligibility')}</th>
                      <th className="py-3.5 px-4">{bi('การรับทราบผล', 'Sign-Off')}</th>
                      <th className="py-3.5 px-4 text-right">{bi('ลบ', 'Delete')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {enrichedEmployees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-slate-50/70">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{emp.name}</div>
                          <div className="text-xs text-slate-500">
                            {emp.role} • {emp.email}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600 font-mono">
                          {emp.joinDate}
                        </td>
                        <td className="py-3.5 px-4">
                          <select
                            value={emp.managerId}
                            onChange={(e) => {
                              const mgr = state.managers.find((m) => m.id === e.target.value);
                              if (mgr) {
                                updateEmployeeRecord(emp.id, {
                                  managerId: mgr.id,
                                  managerName: mgr.name,
                                  department: mgr.department,
                                });
                              }
                            }}
                            className="text-xs font-semibold border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white"
                          >
                            {state.managers.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name} ({m.department})
                              </option>
                            ))}
                          </select>
                        </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={emp.employmentStatus}
                          onChange={(e) =>
                            updateEmployeeRecord(emp.id, {
                              employmentStatus: e.target.value as EmploymentStatus,
                            })
                          }
                          className={`text-xs font-bold border rounded-lg px-2.5 py-1.5 ${
                            emp.employmentStatus === 'ELIGIBLE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          <option value="ELIGIBLE">Eligible (In Pool)</option>
                          <option value="PROBATION">Probation (Exempt)</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        {emp.acknowledgment.status === 'ACKNOWLEDGED' ? (
                          <span className="font-bold text-emerald-600">✓ Acknowledged</span>
                        ) : emp.acknowledgment.status === 'DISPUTED' ? (
                          <span className="font-bold text-rose-600">⚑ 1-on-1 Requested</span>
                        ) : (
                          <span className="text-slate-400">Pending</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Remove ${emp.name} from the employee directory?`)) {
                              deleteEmployee(emp.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Delete employee"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 6: AUDIT TRAIL ==================== */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Governance & Calibration Log</h2>
            <span className="text-xs text-slate-500">{state.auditLogs.length} events recorded</span>
          </div>
          <div className="divide-y divide-slate-100">
            {state.auditLogs.map((log) => (
              <div key={log.id} className="px-5 py-3.5 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900">{log.action}</span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {log.target}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{log.details}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-semibold text-slate-700">{log.actorName}</div>
                  <div className="text-[11px] text-slate-400 font-mono">{log.timestamp}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calibration Slide-over Drawer */}
      <EmployeeCalibrationDrawer
        employee={selectedEmployee}
        onClose={() => setSelectedEmpId(null)}
      />

      {/* Add Employee Modal */}
      {showAddEmp &&
        createPortal(
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-[#212141]/45 backdrop-blur-[1px]"
              onClick={() => setShowAddEmp(false)}
            />
            <form
              onSubmit={handleCreateEmployee}
              className="relative z-10 bg-white w-full max-w-md rounded-2xl shadow-2xl border border-[#E8ECF2] p-6 space-y-4 animate-modal-pop"
            >
            <h3 className="text-base font-extrabold text-slate-900">
              {bi('เพิ่มพนักงานใหม่', 'Add New Employee')}
            </h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {bi('ชื่อ–นามสกุล', 'Full Name')}
              </label>
              <input
                type="text"
                required
                value={newEmpName}
                onChange={(e) => setNewEmpName(e.target.value)}
                placeholder="e.g., Somchai K."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {bi('อีเมลองค์กร (ใช้ล็อกอิน)', 'Work Email (Login)')}
                </label>
                <input
                  type="email"
                  required
                  value={newEmpEmail}
                  onChange={(e) => setNewEmpEmail(e.target.value)}
                  placeholder="somchai@empeo.co"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {bi('รหัสผ่านเริ่มต้น', 'Login Password')}
                </label>
                <input
                  type="text"
                  required
                  value={newEmpPassword}
                  onChange={(e) => setNewEmpPassword(e.target.value)}
                  placeholder="password123"
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-xl"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {bi('ตำแหน่งงาน', 'Job Title')}
              </label>
              <input
                type="text"
                required
                value={newEmpRole}
                onChange={(e) => setNewEmpRole(e.target.value)}
                placeholder="e.g., Data Analyst"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {bi('หัวหน้างาน', 'Manager')}
                </label>
                <select
                  value={newEmpMgrId}
                  onChange={(e) => setNewEmpMgrId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
                >
                  {state.managers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.department})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {bi('สิทธิ์รอบประเมิน', 'Eligibility')}
                </label>
                <select
                  value={newEmpStatus}
                  onChange={(e) => setNewEmpStatus(e.target.value as EmploymentStatus)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
                >
                  <option value="ELIGIBLE">{bi('มีสิทธิ์ประเมิน', 'Eligible')}</option>
                  <option value="PROBATION">{bi('ทดลองงาน (ยกเว้น)', 'Probation (Exempt)')}</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {bi('วันที่เริ่มงาน', 'Join Date')}
              </label>
              <input
                type="date"
                value={newEmpJoinDate}
                onChange={(e) => setNewEmpJoinDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddEmp(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                {bi('ยกเลิก', 'Cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#EE5D36] hover:bg-[#DC4E28] text-white"
              >
                {bi('สร้างข้อมูลพนักงาน', 'Create Employee')}
              </button>
            </div>
          </form>
        </div>,
          document.body
        )}

      {/* Add / Edit Manager Modal */}
      {showMgrModal &&
        createPortal(
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-[#212141]/45 backdrop-blur-[1px]"
              onClick={() => setShowMgrModal(false)}
            />
            <form
              onSubmit={handleSaveManager}
              className="relative z-10 bg-white w-full max-w-md rounded-2xl shadow-2xl border border-[#E8ECF2] p-6 space-y-4 animate-modal-pop"
            >
              <h3 className="text-base font-extrabold text-[#212141]">
                {editingMgrId
                  ? bi('แก้ไขข้อมูลหัวหน้างาน', 'Edit People Manager')
                  : bi('เพิ่มหัวหน้างานใหม่', 'Add New People Manager')}
              </h3>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {bi('ชื่อ–นามสกุล', 'Full Name')}
                </label>
                <input
                  type="text"
                  required
                  value={mgrName}
                  onChange={(e) => setMgrName(e.target.value)}
                  placeholder="e.g., Wichai P."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {bi('อีเมลองค์กร (ใช้ล็อกอิน)', 'Work Email (Login)')}
                  </label>
                  <input
                    type="email"
                    required
                    value={mgrEmail}
                    onChange={(e) => setMgrEmail(e.target.value)}
                    placeholder="wichai@empeo.co"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {bi('รหัสผ่าน', 'Password')}
                  </label>
                  <input
                    type="text"
                    required
                    value={mgrPassword}
                    onChange={(e) => setMgrPassword(e.target.value)}
                    placeholder="password123"
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-xl"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {bi('ตำแหน่ง', 'Job Title')}
                  </label>
                  <input
                    type="text"
                    required
                    value={mgrTitle}
                    onChange={(e) => setMgrTitle(e.target.value)}
                    placeholder="e.g., Head of Product"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {bi('แผนก', 'Department')}
                  </label>
                  <input
                    type="text"
                    required
                    value={mgrDept}
                    onChange={(e) => setMgrDept(e.target.value)}
                    placeholder="e.g., Product"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMgrModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  {bi('ยกเลิก', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#212141] hover:bg-[#2d2d57] text-white"
                >
                  {editingMgrId
                    ? bi('บันทึกการแก้ไข', 'Save Changes')
                    : bi('สร้างหัวหน้างาน', 'Create Manager')}
                </button>
              </div>
            </form>
          </div>,
          document.body
        )}

      {/* Add / Edit Evaluation Criterion Modal */}
      {showCompModal &&
        createPortal(
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-[#212141]/45 backdrop-blur-[1px]"
              onClick={() => setShowCompModal(false)}
            />
            <form
              onSubmit={handleSaveComp}
              className="relative z-10 bg-white w-full max-w-md rounded-2xl shadow-2xl border border-[#E8ECF2] p-6 space-y-4 animate-modal-pop"
            >
              <h3 className="text-base font-extrabold text-[#212141]">
                {editingCompId
                  ? bi('แก้ไขหัวข้อการประเมิน', 'Edit Evaluation Criterion')
                  : bi('เพิ่มหัวข้อการประเมินใหม่', 'Add New Evaluation Criterion')}
              </h3>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {bi('ชื่อหัวข้อ / สมรรถนะ', 'Criterion / Competency Name')}
                </label>
                <input
                  type="text"
                  required
                  value={compName}
                  onChange={(e) => setCompName(e.target.value)}
                  placeholder={bi('เช่น Customer Centricity / การคิดเชิงนวัตกรรม', 'e.g., Customer Centricity')}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {bi('คำอธิบายเกณฑ์การประเมิน / คำถาม', 'Evaluation Description / Prompt')}
                </label>
                <textarea
                  rows={3}
                  required
                  value={compDesc}
                  onChange={(e) => setCompDesc(e.target.value)}
                  placeholder={bi(
                    'อธิบายพฤติกรรมที่คาดหวังเพื่อให้หัวหน้าและพนักงานใช้เกณฑ์เดียวกัน...',
                    'Describe the expected behaviors so managers and employees share one standard...'
                  )}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCompModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  {bi('ยกเลิก', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#EE5D36] hover:bg-[#DC4E28] text-white"
                >
                  {editingCompId
                    ? bi('บันทึกการแก้ไข', 'Save Changes')
                    : bi('เพิ่มหัวข้อประเมิน', 'Add Criterion')}
                </button>
              </div>
            </form>
          </div>,
          document.body
        )}

      {/* Publish Confirmation Modal */}
      {showPublishConfirm &&
        createPortal(
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-[#212141]/45 backdrop-blur-[1px]"
              onClick={() => setShowPublishConfirm(false)}
            />
            <div className="relative z-10 bg-white w-full max-w-md rounded-2xl shadow-2xl border border-[#E8ECF2] p-6 space-y-4 animate-modal-pop">
              <h3 className="text-base font-extrabold text-slate-900">
                {bi('ยืนยันการประกาศผลประเมินทางการ?', 'Publish Official Performance Results?')}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {bi(
                  'การประกาศผลจะล็อกการประเมินของหัวหน้างานทั้งหมด และเปิดเผยคะแนนปรับเทียบทางการพร้อมข้อเสนอแนะให้พนักงานเห็นใน Employee Portal',
                  'Publishing will lock all manager evaluations and release final calibrated scores and manager feedback to employees in their Employee Portal.'
                )}
              </p>
              {overdueEmployees.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                  <strong>{bi('ข้อควรระวัง:', 'Heads up:')}</strong>{' '}
                  {bi(
                    `ยังมีพนักงานที่มีสิทธิ์อีก ${overdueEmployees.length} คนที่หัวหน้ายังไม่ส่งผลประเมิน คุณยังสามารถประกาศผลตอนนี้หรือรอให้ส่งครบก่อนได้`,
                    `${overdueEmployees.length} eligible employee(s) still have unsubmitted manager reviews. You can still publish now or wait until they submit.`
                  )}
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowPublishConfirm(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  {bi('ยกเลิก', 'Cancel')}
                </button>
                <button
                  onClick={() => {
                    publishCycle();
                    setShowPublishConfirm(false);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {bi('ยืนยันและประกาศผล', 'Confirm & Publish')}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </AppShell>
  );
};

