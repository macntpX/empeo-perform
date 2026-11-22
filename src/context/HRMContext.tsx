import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  ActionPlanType,
  AuditLogEntry,
  CompetencyScore,
  CompetencyTemplate,
  Employee,
  EmploymentStatus,
  EnrichedEmployee,
  Goal,
  HRMState,
  ManagerProfile,
  ManagerStats,
  ReviewCycle,
  UserAccount,
} from '../types/hrm';
import {
  DEFAULT_COMPETENCIES,
  DEMO_ACCOUNTS,
  INITIAL_HRM_STATE,
  MANAGERS_LIST,
} from '../data/seedData';
import { computeFairnessEngine } from '../engine/fairnessEngine';

const STORAGE_KEY = 'empeo_perform_hrm_v1';
const SESSION_KEY = 'empeo_perform_session_v1';

interface ToastMessage {
  id: number;
  text: string;
  type: 'success' | 'info' | 'warning';
}

export type DBStatus = 'synced' | 'saving' | 'local-only';

interface HRMContextValue {
  currentUser: UserAccount | null;
  allAccounts: UserAccount[];
  loginWithCredentials: (email: string, password: string) => { ok: boolean; error?: string };
  loginAsDemoAccount: (accountId: string) => void;
  logout: () => void;

  state: HRMState;
  dbStatus: DBStatus;
  lastSavedAt: string | null;
  enrichedEmployees: EnrichedEmployee[];
  managerStats: ManagerStats[];
  orgMeanRaw: number | null;
  orgMeanFinal: number | null;
  toast: ToastMessage | null;
  notify: (text: string, type?: ToastMessage['type']) => void;

  // Cycle & HR Admin Actions
  updateCycle: (updates: Partial<ReviewCycle>) => void;
  toggleNormalization: () => void;
  grantGracePeriod: (managerId: string, managerName: string) => void;
  revokeGracePeriod: (managerId: string, managerName: string) => void;
  sendReminder: (managerId: string, managerName: string) => void;
  publishCycle: () => void;
  reopenCalibration: () => void;

  // Evaluation Criteria / Core Competencies Builder
  addCompetencyTemplate: (data: { name: string; description: string }) => void;
  updateCompetencyTemplate: (
    compId: string,
    updates: Partial<Pick<CompetencyTemplate, 'name' | 'description'>>
  ) => void;
  deleteCompetencyTemplate: (compId: string) => void;

  // Calibration & Talent Actions
  setCalibrationOverride: (empId: string, score: number, reason: string) => void;
  clearCalibrationOverride: (empId: string) => void;
  setActionPlan: (empId: string, type: ActionPlanType, note: string) => void;

  // Goal & Evaluation Actions
  addGoal: (
    empId: string,
    goal: { title: string; description: string; weight: number; status?: 'APPROVED' | 'PROPOSED' }
  ) => void;
  updateGoal: (empId: string, goalId: string, updates: Partial<Goal>) => void;
  deleteGoal: (empId: string, goalId: string) => void;
  saveManagerEvaluation: (
    empId: string,
    data: {
      goals: Goal[];
      competencies: CompetencyScore[];
      potential: 1 | 2 | 3;
      managerStrengths: string;
      managerDevelopment: string;
    },
    submit: boolean
  ) => void;
  saveSelfAssessment: (
    empId: string,
    data: {
      goals: Goal[];
      competencies: CompetencyScore[];
      selfSummary: string;
    },
    submit: boolean
  ) => void;
  submitAcknowledgment: (
    empId: string,
    status: 'ACKNOWLEDGED' | 'DISPUTED',
    comment?: string
  ) => void;

  // Manager Directory Actions
  addManager: (data: {
    name: string;
    email: string;
    title: string;
    department: string;
    password?: string;
  }) => void;
  updateManager: (
    managerId: string,
    updates: Partial<Pick<ManagerProfile, 'name' | 'email' | 'title' | 'department' | 'password'>>
  ) => void;
  deleteManager: (managerId: string) => void;

  // Employee Directory Actions
  addEmployee: (data: {
    name: string;
    email: string;
    password?: string;
    role: string;
    department: string;
    managerId: string;
    managerName: string;
    joinDate: string;
    employmentStatus: EmploymentStatus;
  }) => void;
  updateEmployeeRecord: (
    empId: string,
    updates: Partial<
      Pick<
        Employee,
        'name' | 'email' | 'password' | 'employmentStatus' | 'managerId' | 'managerName' | 'department' | 'role'
      >
    >
  ) => void;
  deleteEmployee: (empId: string) => void;

  exportCalibrationCSV: () => void;
  resetAllData: () => void;
}

const HRMContext = createContext<HRMContextValue | null>(null);

function formatNow(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function normalizeHRMState(raw: Partial<HRMState> | null | undefined): HRMState {
  if (!raw || !raw.cycle || !Array.isArray(raw.employees)) {
    return INITIAL_HRM_STATE;
  }
  const defaultTemplates: CompetencyTemplate[] = DEFAULT_COMPETENCIES.map(
    ({ id, name, description }) => ({ id, name, description })
  );
  return {
    cycle: raw.cycle,
    competencyTemplates:
      Array.isArray(raw.competencyTemplates) && raw.competencyTemplates.length > 0
        ? raw.competencyTemplates
        : defaultTemplates,
    managers: Array.isArray(raw.managers) && raw.managers.length > 0 ? raw.managers : MANAGERS_LIST,
    employees: raw.employees,
    auditLogs: Array.isArray(raw.auditLogs) ? raw.auditLogs : [],
  };
}

function buildAccountsFromState(state: HRMState): UserAccount[] {
  const hrAccount = DEMO_ACCOUNTS.find((a) => a.role === 'HR')!;
  const managerAccounts: UserAccount[] = state.managers.map((m) => ({
    id: `USR-${m.id}`,
    email: m.email,
    password: m.password || 'password123',
    name: m.name,
    title: m.title,
    role: 'MANAGER',
    department: m.department,
    managerId: m.id,
    avatarInitials: getInitials(m.name),
  }));
  const employeeAccounts: UserAccount[] = state.employees.map((e) => ({
    id: `USR-${e.id}`,
    email: e.email,
    password: e.password || 'password123',
    name: e.name,
    title: e.employmentStatus === 'PROBATION' ? `${e.role} (Probation)` : e.role,
    role: 'EMPLOYEE',
    department: e.department,
    employeeId: e.id,
    avatarInitials: getInitials(e.name),
  }));
  return [hrAccount, ...managerAccounts, ...employeeAccounts];
}

export const HRMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<HRMState>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      return cached ? normalizeHRMState(JSON.parse(cached) as Partial<HRMState>) : INITIAL_HRM_STATE;
    } catch {
      return INITIAL_HRM_STATE;
    }
  });

  const allAccounts = useMemo(() => buildAccountsFromState(state), [state]);

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (!saved) return null;
      const parsed = JSON.parse(saved) as UserAccount;
      const initialAccounts = buildAccountsFromState(
        (() => {
          try {
            const cached = localStorage.getItem(STORAGE_KEY);
            return cached
              ? normalizeHRMState(JSON.parse(cached) as Partial<HRMState>)
              : INITIAL_HRM_STATE;
          } catch {
            return INITIAL_HRM_STATE;
          }
        })()
      );
      return (
        initialAccounts.find(
          (a) => a.id === parsed.id || a.email.toLowerCase() === parsed.email?.toLowerCase()
        ) ?? null
      );
    } catch {
      return null;
    }
  });

  const [dbStatus, setDbStatus] = useState<DBStatus>('local-only');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [dbHydrated, setDbHydrated] = useState(false);

  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Hydrate from real backend DB API (/api/state -> data/empeo-db.json) on startup
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const health = await fetch('/api/health');
        if (!health.ok) throw new Error('No backend API');
        const res = await fetch('/api/state');
        if (cancelled) return;
        if (res.ok) {
          const remoteState = normalizeHRMState((await res.json()) as Partial<HRMState>);
          setState(remoteState);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteState));
          setDbStatus('synced');
          setLastSavedAt(new Date().toLocaleTimeString());
        } else if (res.status === 404) {
          // Seed the real DB file on disk with current state
          await fetch('/api/state', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(state),
          });
          setDbStatus('synced');
          setLastSavedAt(new Date().toLocaleTimeString());
        }
      } catch {
        if (!cancelled) {
          setDbStatus('local-only');
        }
      } finally {
        if (!cancelled) setDbHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist every CRUD state mutation to localStorage + real backend DB API
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (!dbHydrated) return;

    let cancelled = false;
    setDbStatus((prev) => (prev === 'local-only' ? 'local-only' : 'saving'));

    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/state', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(state),
        });
        if (!cancelled && res.ok) {
          setDbStatus('synced');
          setLastSavedAt(new Date().toLocaleTimeString());
        }
      } catch {
        if (!cancelled) setDbStatus('local-only');
      }
    }, 150);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [state, dbHydrated]);

  useEffect(() => {
    if (currentUser) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }, [currentUser]);

  const notify = (text: string, type: ToastMessage['type'] = 'success') => {
    const id = Date.now();
    setToast({ id, text, type });
    setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 3500);
  };

  const appendAudit = (
    prev: HRMState,
    entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'actorName' | 'actorRole'>
  ): AuditLogEntry[] => {
    const newEntry: AuditLogEntry = {
      id: `AUD-${Date.now()}`,
      timestamp: formatNow(),
      actorName: currentUser?.name ?? 'System',
      actorRole: currentUser?.role ?? 'HR',
      ...entry,
    };
    return [newEntry, ...prev.auditLogs];
  };

  const { enriched, managerStats, orgMeanRaw, orgMeanFinal } = useMemo(
    () => computeFairnessEngine(state.employees, state.cycle),
    [state.employees, state.cycle]
  );

  // Auth — supports HR + ALL Managers + ALL Employees (including newly added ones)
  const loginWithCredentials = (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const account = allAccounts.find((a) => a.email.toLowerCase() === cleanEmail);
    if (!account) {
      return { ok: false, error: 'Account not found. Try one of the workspace accounts below.' };
    }
    if (account.password !== password) {
      return { ok: false, error: 'Incorrect password. Default demo password is "password123".' };
    }
    setCurrentUser(account);
    notify(`Signed in as ${account.name} (${account.role})`);
    return { ok: true };
  };

  const loginAsDemoAccount = (accountId: string) => {
    const account = allAccounts.find((a) => a.id === accountId);
    if (account) {
      setCurrentUser(account);
      notify(`Signed in as ${account.name} (${account.role})`);
    }
  };

  const logout = () => {
    setCurrentUser(null);
  };

  // HR Cycle actions
  const updateCycle = (updates: Partial<ReviewCycle>) => {
    setState((prev) => ({
      ...prev,
      cycle: { ...prev.cycle, ...updates },
      auditLogs: appendAudit(prev, {
        action: 'Updated Cycle Policy',
        target: prev.cycle.name,
        details: `Updated fields: ${Object.keys(updates).join(', ')}`,
        category: 'CYCLE',
      }),
    }));
    notify('Review cycle settings saved.');
  };

  const toggleNormalization = () => {
    setState((prev) => {
      const next = !prev.cycle.normalizationEnabled;
      return {
        ...prev,
        cycle: { ...prev.cycle, normalizationEnabled: next },
        auditLogs: appendAudit(prev, {
          action: next ? 'Enabled Z-Score Calibration' : 'Disabled Z-Score Calibration',
          target: prev.cycle.name,
          details: next
            ? 'Unified fairness normalization active across departments.'
            : 'Switched view to raw unadjusted manager scores.',
          category: 'CALIBRATION',
        }),
      };
    });
  };

  const grantGracePeriod = (managerId: string, managerName: string) => {
    setState((prev) => {
      if (prev.cycle.gracePeriodManagerIds.includes(managerId)) return prev;
      return {
        ...prev,
        cycle: {
          ...prev.cycle,
          gracePeriodManagerIds: [...prev.cycle.gracePeriodManagerIds, managerId],
        },
        auditLogs: appendAudit(prev, {
          action: 'Granted Grace Period',
          target: managerName,
          details: 'Unlocked overdue manager evaluation forms for late submission.',
          category: 'CYCLE',
        }),
      };
    });
    notify(`Grace period granted to ${managerName}.`);
  };

  const revokeGracePeriod = (managerId: string, managerName: string) => {
    setState((prev) => ({
      ...prev,
      cycle: {
        ...prev.cycle,
        gracePeriodManagerIds: prev.cycle.gracePeriodManagerIds.filter((id) => id !== managerId),
      },
      auditLogs: appendAudit(prev, {
        action: 'Closed Grace Period',
        target: managerName,
        details: 'Re-locked evaluation forms for this manager.',
        category: 'CYCLE',
      }),
    }));
    notify(`Grace period closed for ${managerName}.`, 'info');
  };

  const sendReminder = (managerId: string, managerName: string) => {
    setState((prev) => ({
      ...prev,
      auditLogs: appendAudit(prev, {
        action: 'Sent Overdue Reminder',
        target: managerName,
        details: `Automated email & empeo mobile push reminder sent to ${managerName} (${managerId}).`,
        category: 'REMINDER',
      }),
    }));
    notify(`Reminder sent to ${managerName}.`, 'info');
  };

  const publishCycle = () => {
    setState((prev) => ({
      ...prev,
      cycle: {
        ...prev.cycle,
        phase: 'PUBLISHED',
        publishedAt: formatNow(),
      },
      auditLogs: appendAudit(prev, {
        action: 'Published Final Results',
        target: prev.cycle.name,
        details: 'Official calibrated performance scores and manager feedback released to all eligible employees.',
        category: 'CYCLE',
      }),
    }));
    notify('Cycle published! Employees can now view their official results.');
  };

  const reopenCalibration = () => {
    setState((prev) => ({
      ...prev,
      cycle: {
        ...prev.cycle,
        phase: 'CALIBRATION',
      },
      auditLogs: appendAudit(prev, {
        action: 'Reopened Calibration',
        target: prev.cycle.name,
        details: 'Results temporarily hidden from employee portal for further HR calibration.',
        category: 'CYCLE',
      }),
    }));
    notify('Cycle reopened for HR calibration.', 'info');
  };

  const setCalibrationOverride = (empId: string, score: number, reason: string) => {
    const emp = state.employees.find((e) => e.id === empId);
    if (!emp) return;
    const clamped = Math.min(5, Math.max(1, Math.round(score * 100) / 100));
    setState((prev) => ({
      ...prev,
      employees: prev.employees.map((e) =>
        e.id === empId
          ? {
              ...e,
              calibrationOverride: {
                score: clamped,
                reason: reason.trim(),
                updatedBy: currentUser?.name ?? 'HR Admin',
                updatedAt: formatNow(),
              },
            }
          : e
      ),
      auditLogs: appendAudit(prev, {
        action: 'Manual Calibration Override',
        target: emp.name,
        details: `Set calibrated score to ${clamped.toFixed(2)}. Reason: "${reason.trim()}"`,
        category: 'CALIBRATION',
      }),
    }));
    notify(`Calibration override saved for ${emp.name}.`);
  };

  const clearCalibrationOverride = (empId: string) => {
    const emp = state.employees.find((e) => e.id === empId);
    if (!emp) return;
    setState((prev) => ({
      ...prev,
      employees: prev.employees.map((e) =>
        e.id === empId ? { ...e, calibrationOverride: null } : e
      ),
      auditLogs: appendAudit(prev, {
        action: 'Cleared Calibration Override',
        target: emp.name,
        details: 'Reverted employee to automatic engine score.',
        category: 'CALIBRATION',
      }),
    }));
    notify(`Override cleared for ${emp.name}.`, 'info');
  };

  const setActionPlan = (empId: string, type: ActionPlanType, note: string) => {
    const emp = state.employees.find((e) => e.id === empId);
    if (!emp) return;
    setState((prev) => ({
      ...prev,
      employees: prev.employees.map((e) =>
        e.id === empId
          ? {
              ...e,
              actionPlan:
                type === 'NONE'
                  ? null
                  : { type, note: note.trim(), updatedAt: formatNow() },
            }
          : e
      ),
      auditLogs: appendAudit(prev, {
        action: 'Updated Talent Action Plan',
        target: emp.name,
        details: type === 'NONE' ? 'Cleared action plan.' : `Assigned ${type}: ${note.trim()}`,
        category: 'CALIBRATION',
      }),
    }));
    notify(`Action plan updated for ${emp.name}.`);
  };

  // Goal CRUD
  const addGoal = (
    empId: string,
    goal: { title: string; description: string; weight: number; status?: 'APPROVED' | 'PROPOSED' }
  ) => {
    const emp = state.employees.find((e) => e.id === empId);
    if (!emp) return;
    const newGoal: Goal = {
      id: `g-${Date.now()}`,
      title: goal.title.trim(),
      description: goal.description.trim(),
      weight: Number(goal.weight),
      progress: 0,
      selfScore: null,
      managerScore: null,
      employeeComment: '',
      status: goal.status ?? 'APPROVED',
    };
    setState((prev) => ({
      ...prev,
      employees: prev.employees.map((e) =>
        e.id === empId ? { ...e, goals: [...e.goals, newGoal] } : e
      ),
      auditLogs: appendAudit(prev, {
        action: goal.status === 'PROPOSED' ? 'Proposed Goal' : 'Added Goal',
        target: emp.name,
        details: `"${newGoal.title}" (${newGoal.weight}%)`,
        category: 'REVIEW',
      }),
    }));
    notify(goal.status === 'PROPOSED' ? 'Goal proposed for manager review.' : 'Goal added.');
  };

  const updateGoal = (empId: string, goalId: string, updates: Partial<Goal>) => {
    setState((prev) => ({
      ...prev,
      employees: prev.employees.map((e) =>
        e.id === empId
          ? {
              ...e,
              goals: e.goals.map((g) => (g.id === goalId ? { ...g, ...updates } : g)),
            }
          : e
      ),
    }));
  };

  const deleteGoal = (empId: string, goalId: string) => {
    setState((prev) => ({
      ...prev,
      employees: prev.employees.map((e) =>
        e.id === empId ? { ...e, goals: e.goals.filter((g) => g.id !== goalId) } : e
      ),
    }));
    notify('Goal removed.', 'info');
  };

  const saveManagerEvaluation = (
    empId: string,
    data: {
      goals: Goal[];
      competencies: CompetencyScore[];
      potential: 1 | 2 | 3;
      managerStrengths: string;
      managerDevelopment: string;
    },
    submit: boolean
  ) => {
    const emp = state.employees.find((e) => e.id === empId);
    if (!emp) return;
    setState((prev) => ({
      ...prev,
      employees: prev.employees.map((e) =>
        e.id === empId
          ? {
              ...e,
              goals: data.goals,
              competencies: data.competencies,
              potential: data.potential,
              managerStrengths: data.managerStrengths,
              managerDevelopment: data.managerDevelopment,
              managerReviewStatus: submit ? 'SUBMITTED' : 'DRAFT',
            }
          : e
      ),
      auditLogs: submit
        ? appendAudit(prev, {
            action: 'Submitted Manager Evaluation',
            target: emp.name,
            details: `Final evaluation submitted by ${currentUser?.name ?? emp.managerName}.`,
            category: 'REVIEW',
          })
        : prev.auditLogs,
    }));
    notify(submit ? `Evaluation submitted for ${emp.name}!` : `Draft saved for ${emp.name}.`);
  };

  const saveSelfAssessment = (
    empId: string,
    data: {
      goals: Goal[];
      competencies: CompetencyScore[];
      selfSummary: string;
    },
    submit: boolean
  ) => {
    const emp = state.employees.find((e) => e.id === empId);
    if (!emp) return;
    setState((prev) => ({
      ...prev,
      employees: prev.employees.map((e) =>
        e.id === empId
          ? {
              ...e,
              goals: data.goals,
              competencies: data.competencies,
              selfSummary: data.selfSummary,
              selfReviewStatus: submit ? 'SUBMITTED' : 'DRAFT',
            }
          : e
      ),
      auditLogs: submit
        ? appendAudit(prev, {
            action: 'Submitted Self-Assessment',
            target: emp.name,
            details: 'Employee completed and submitted annual self-assessment.',
            category: 'REVIEW',
          })
        : prev.auditLogs,
    }));
    notify(submit ? 'Self-assessment submitted!' : 'Self-assessment draft saved.');
  };

  const submitAcknowledgment = (
    empId: string,
    status: 'ACKNOWLEDGED' | 'DISPUTED',
    comment?: string
  ) => {
    const emp = state.employees.find((e) => e.id === empId);
    if (!emp) return;
    setState((prev) => ({
      ...prev,
      employees: prev.employees.map((e) =>
        e.id === empId
          ? {
              ...e,
              acknowledgment: {
                status,
                comment: comment?.trim(),
                updatedAt: formatNow(),
              },
            }
          : e
      ),
      auditLogs: appendAudit(prev, {
        action: status === 'ACKNOWLEDGED' ? 'Employee Signed Off' : 'Employee Requested Review Discussion',
        target: emp.name,
        details: comment?.trim() || 'Employee acknowledged published performance review.',
        category: 'REVIEW',
      }),
    }));
    notify(
      status === 'ACKNOWLEDGED'
        ? 'Performance review acknowledged and signed off.'
        : 'Follow-up discussion request sent to your manager & HR.',
      status === 'ACKNOWLEDGED' ? 'success' : 'info'
    );
  };

  // Evaluation Criteria / Core Competencies CRUD (with Phase Guardrail + Auto-Sync)
  const addCompetencyTemplate = (data: { name: string; description: string }) => {
    if (state.cycle.phase === 'PUBLISHED') {
      notify('Evaluation criteria are locked while results are Published. Reopen Calibration first.', 'warning');
      return;
    }
    const cleanName = data.name.trim();
    const cleanDesc = data.description.trim();
    if (!cleanName) return;

    const newTemplate: CompetencyTemplate = {
      id: `comp-${Date.now().toString().slice(-5)}`,
      name: cleanName,
      description: cleanDesc || 'Evaluated on the standardized 1–5 company rubric.',
    };

    setState((prev) => ({
      ...prev,
      competencyTemplates: [...prev.competencyTemplates, newTemplate],
      employees: prev.employees.map((e) => ({
        ...e,
        competencies: [
          ...e.competencies,
          { ...newTemplate, selfScore: null, managerScore: null },
        ],
      })),
      auditLogs: appendAudit(prev, {
        action: 'Added Evaluation Criterion',
        target: newTemplate.name,
        details: `Added competency "${newTemplate.name}" across ${prev.employees.length} employee evaluation forms (Phase: ${prev.cycle.phase}).`,
        category: 'CYCLE',
      }),
    }));
    notify(`Added criterion "${newTemplate.name}" across all evaluations.`);
  };

  const updateCompetencyTemplate = (
    compId: string,
    updates: Partial<Pick<CompetencyTemplate, 'name' | 'description'>>
  ) => {
    if (state.cycle.phase === 'PUBLISHED') {
      notify('Evaluation criteria are locked while results are Published. Reopen Calibration first.', 'warning');
      return;
    }
    const existing = state.competencyTemplates.find((c) => c.id === compId);
    if (!existing) return;

    const nextName = updates.name !== undefined ? updates.name.trim() || existing.name : existing.name;
    const nextDesc =
      updates.description !== undefined ? updates.description.trim() : existing.description;

    setState((prev) => ({
      ...prev,
      competencyTemplates: prev.competencyTemplates.map((c) =>
        c.id === compId ? { ...c, name: nextName, description: nextDesc } : c
      ),
      employees: prev.employees.map((e) => ({
        ...e,
        competencies: e.competencies.map((c) =>
          c.id === compId ? { ...c, name: nextName, description: nextDesc } : c
        ),
      })),
      auditLogs: appendAudit(prev, {
        action: 'Updated Evaluation Criterion',
        target: nextName,
        details: `Updated competency "${existing.name}" → "${nextName}" (existing scores preserved).`,
        category: 'CYCLE',
      }),
    }));
    notify(`Updated criterion "${nextName}".`);
  };

  const deleteCompetencyTemplate = (compId: string) => {
    if (state.cycle.phase === 'PUBLISHED') {
      notify('Evaluation criteria are locked while results are Published.', 'warning');
      return;
    }
    if (state.competencyTemplates.length <= 1) {
      notify('At least 1 Core Competency criterion is required.', 'warning');
      return;
    }
    const existing = state.competencyTemplates.find((c) => c.id === compId);
    if (!existing) return;

    setState((prev) => ({
      ...prev,
      competencyTemplates: prev.competencyTemplates.filter((c) => c.id !== compId),
      employees: prev.employees.map((e) => ({
        ...e,
        competencies: e.competencies.filter((c) => c.id !== compId),
      })),
      auditLogs: appendAudit(prev, {
        action: 'Removed Evaluation Criterion',
        target: existing.name,
        details: `Removed competency "${existing.name}" from cycle criteria; composite scores recalculated.`,
        category: 'CYCLE',
      }),
    }));
    notify(`Removed criterion "${existing.name}".`, 'info');
  };

  // Manager Directory CRUD
  const addManager = (data: {
    name: string;
    email: string;
    title: string;
    department: string;
    password?: string;
  }) => {
    const cleanEmail = data.email.trim().toLowerCase();
    const duplicate = allAccounts.some((a) => a.email.toLowerCase() === cleanEmail);
    if (duplicate) {
      notify(`Email "${cleanEmail}" is already in use.`, 'warning');
      return;
    }
    const newMgr: ManagerProfile = {
      id: `MGR-${Date.now().toString().slice(-5)}`,
      name: data.name.trim(),
      email: cleanEmail,
      title: data.title.trim(),
      department: data.department.trim(),
      password: data.password?.trim() || 'password123',
    };
    setState((prev) => ({
      ...prev,
      managers: [...prev.managers, newMgr],
      auditLogs: appendAudit(prev, {
        action: 'Added People Manager',
        target: newMgr.name,
        details: `${newMgr.title} (${newMgr.department}) — Login: ${newMgr.email}`,
        category: 'DIRECTORY',
      }),
    }));
    notify(`Manager ${newMgr.name} added! Can now sign in with ${newMgr.email}.`);
  };

  const updateManager = (
    managerId: string,
    updates: Partial<Pick<ManagerProfile, 'name' | 'email' | 'title' | 'department' | 'password'>>
  ) => {
    const existing = state.managers.find((m) => m.id === managerId);
    if (!existing) return;

    const cleanUpdates: Partial<ManagerProfile> = {
      ...updates,
      ...(updates.name !== undefined ? { name: updates.name.trim() } : {}),
      ...(updates.email !== undefined ? { email: updates.email.trim().toLowerCase() } : {}),
      ...(updates.title !== undefined ? { title: updates.title.trim() } : {}),
      ...(updates.department !== undefined ? { department: updates.department.trim() } : {}),
      ...(updates.password !== undefined && updates.password.trim()
        ? { password: updates.password.trim() }
        : {}),
    };

    const nextName = cleanUpdates.name ?? existing.name;
    const nextDept = cleanUpdates.department ?? existing.department;

    setState((prev) => ({
      ...prev,
      managers: prev.managers.map((m) => (m.id === managerId ? { ...m, ...cleanUpdates } : m)),
      // Keep direct reports' managerName & department in sync
      employees: prev.employees.map((e) =>
        e.managerId === managerId
          ? { ...e, managerName: nextName, department: nextDept }
          : e
      ),
      auditLogs: appendAudit(prev, {
        action: 'Updated Manager Profile',
        target: nextName,
        details: `Updated manager ${existing.name} (${nextDept})`,
        category: 'DIRECTORY',
      }),
    }));
    notify(`Updated manager profile for ${nextName}.`);
  };

  const deleteManager = (managerId: string) => {
    if (state.managers.length <= 1) {
      notify('Cannot remove the last remaining manager in the organization.', 'warning');
      return;
    }
    const target = state.managers.find((m) => m.id === managerId);
    if (!target) return;
    const fallback = state.managers.find((m) => m.id !== managerId)!;
    const reassignedCount = state.employees.filter((e) => e.managerId === managerId).length;

    setState((prev) => ({
      ...prev,
      managers: prev.managers.filter((m) => m.id !== managerId),
      employees: prev.employees.map((e) =>
        e.managerId === managerId
          ? { ...e, managerId: fallback.id, managerName: fallback.name }
          : e
      ),
      cycle: {
        ...prev.cycle,
        gracePeriodManagerIds: prev.cycle.gracePeriodManagerIds.filter((id) => id !== managerId),
      },
      auditLogs: appendAudit(prev, {
        action: 'Removed People Manager',
        target: target.name,
        details:
          reassignedCount > 0
            ? `Removed ${target.name} (${target.department}); reassigned ${reassignedCount} direct report(s) to ${fallback.name}.`
            : `Removed ${target.name} (${target.department}) from directory.`,
        category: 'DIRECTORY',
      }),
    }));
    notify(
      reassignedCount > 0
        ? `Removed ${target.name}. Reassigned ${reassignedCount} report(s) to ${fallback.name}.`
        : `Removed manager ${target.name}.`,
      'info'
    );
  };

  const addEmployee = (data: {
    name: string;
    email: string;
    password?: string;
    role: string;
    department: string;
    managerId: string;
    managerName: string;
    joinDate: string;
    employmentStatus: EmploymentStatus;
  }) => {
    const cleanEmail = data.email.trim().toLowerCase();
    const duplicate = allAccounts.some((a) => a.email.toLowerCase() === cleanEmail);
    if (duplicate) {
      notify(`Email "${cleanEmail}" is already in use.`, 'warning');
      return;
    }
    const suffix = Date.now().toString().slice(-4);
    const num = state.employees.length + 11;
    const newEmp: Employee = {
      id: `EMP-${suffix}`,
      employeeCode: `EMP-${1000 + num}`,
      ...data,
      name: data.name.trim(),
      email: cleanEmail,
      password: data.password?.trim() || 'password123',
      selfReviewStatus: 'NOT_STARTED',
      managerReviewStatus: 'NOT_STARTED',
      potential: 2,
      goals: [
        {
          id: `g-${Date.now()}`,
          title:
            data.employmentStatus === 'PROBATION'
              ? 'Complete 90-Day Onboarding Plan'
              : 'Deliver Core Role Objectives for FY 2026',
          description: 'Initial objective assigned upon directory creation.',
          weight: 100,
          progress: 0,
          selfScore: null,
          managerScore: null,
          employeeComment: '',
          status: 'APPROVED',
        },
      ],
      competencies: state.competencyTemplates.map((c) => ({
        ...c,
        selfScore: null,
        managerScore: null,
      })),
      selfSummary: '',
      managerStrengths: '',
      managerDevelopment: '',
      calibrationOverride: null,
      actionPlan: null,
      acknowledgment: { status: 'PENDING' },
    };
    setState((prev) => ({
      ...prev,
      employees: [...prev.employees, newEmp],
      auditLogs: appendAudit(prev, {
        action: 'Added Employee',
        target: newEmp.name,
        details: `${newEmp.role} (${newEmp.department}) — Login: ${newEmp.email} — Status: ${newEmp.employmentStatus}`,
        category: 'DIRECTORY',
      }),
    }));
    notify(`${newEmp.name} added! Can now sign in with ${newEmp.email}.`);
  };

  const updateEmployeeRecord = (
    empId: string,
    updates: Partial<
      Pick<
        Employee,
        'name' | 'email' | 'password' | 'employmentStatus' | 'managerId' | 'managerName' | 'department' | 'role'
      >
    >
  ) => {
    const emp = state.employees.find((e) => e.id === empId);
    if (!emp) return;
    setState((prev) => ({
      ...prev,
      employees: prev.employees.map((e) => (e.id === empId ? { ...e, ...updates } : e)),
      auditLogs: appendAudit(prev, {
        action: 'Updated Employee Profile',
        target: emp.name,
        details: `Updated: ${Object.entries(updates)
          .map(([k, v]) => `${k}=${v}`)
          .join(', ')}`,
        category: 'DIRECTORY',
      }),
    }));
    notify(`Updated profile for ${emp.name}.`);
  };

  const deleteEmployee = (empId: string) => {
    const emp = state.employees.find((e) => e.id === empId);
    if (!emp) return;
    setState((prev) => ({
      ...prev,
      employees: prev.employees.filter((e) => e.id !== empId),
      auditLogs: appendAudit(prev, {
        action: 'Removed Employee',
        target: emp.name,
        details: `Removed ${emp.employeeCode} (${emp.role}, ${emp.department}) from directory.`,
        category: 'DIRECTORY',
      }),
    }));
    notify(`${emp.name} removed from directory.`, 'info');
  };

  const exportCalibrationCSV = () => {
    const headers = [
      'Employee Code',
      'Name',
      'Role',
      'Department',
      'Manager',
      'Status',
      'Manager Review',
      'Self Score',
      'Raw Manager Score',
      'Z-Score',
      'Normalized Score',
      'Final Calibrated Score',
      'Score Source',
      'Talent Tier',
      'Potential (1-3)',
      'Action Plan',
    ];
    const rows = enriched.map((e) => [
      e.employeeCode,
      `"${e.name}"`,
      `"${e.role}"`,
      e.department,
      `"${e.managerName}"`,
      e.employmentStatus,
      e.managerReviewStatus,
      e.selfCompositeScore ?? '',
      e.rawCompositeScore ?? '',
      e.zScore ?? '',
      e.normalizedScore ?? '',
      e.finalScore ?? '',
      e.scoreSource,
      `"${e.tier}"`,
      e.potential,
      e.actionPlan?.type ?? 'NONE',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `empeo-calibration-${state.cycle.id}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    notify('Calibration report exported to CSV.');
  };

  const resetAllData = () => {
    localStorage.removeItem(STORAGE_KEY);
    fetch('/api/state', { method: 'DELETE' }).catch(() => {});
    setState(INITIAL_HRM_STATE);
    notify('Workspace & database reset to initial dataset.', 'info');
  };

  return (
    <HRMContext.Provider
      value={{
        currentUser,
        allAccounts,
        loginWithCredentials,
        loginAsDemoAccount,
        logout,
        state,
        dbStatus,
        lastSavedAt,
        enrichedEmployees: enriched,
        managerStats,
        orgMeanRaw,
        orgMeanFinal,
        toast,
        notify,
        updateCycle,
        toggleNormalization,
        grantGracePeriod,
        revokeGracePeriod,
        sendReminder,
        publishCycle,
        reopenCalibration,
        addCompetencyTemplate,
        updateCompetencyTemplate,
        deleteCompetencyTemplate,
        setCalibrationOverride,
        clearCalibrationOverride,
        setActionPlan,
        addGoal,
        updateGoal,
        deleteGoal,
        saveManagerEvaluation,
        saveSelfAssessment,
        submitAcknowledgment,
        addManager,
        updateManager,
        deleteManager,
        addEmployee,
        updateEmployeeRecord,
        deleteEmployee,
        exportCalibrationCSV,
        resetAllData,
      }}
    >
      {children}
    </HRMContext.Provider>
  );
};

export function useHRM() {
  const ctx = useContext(HRMContext);
  if (!ctx) throw new Error('useHRM must be used within HRMProvider');
  return ctx;
}

