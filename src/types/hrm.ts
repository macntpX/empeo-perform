export type UserRole = 'HR' | 'MANAGER' | 'EMPLOYEE';

export type CyclePhase =
  | 'GOAL_SETTING'
  | 'SELF_REVIEW'
  | 'MANAGER_REVIEW'
  | 'CALIBRATION'
  | 'PUBLISHED';

export type EmploymentStatus = 'ELIGIBLE' | 'PROBATION';
export type ReviewProgressStatus = 'NOT_STARTED' | 'DRAFT' | 'SUBMITTED';
export type TalentTier = 'High Performer' | 'Core Performer' | 'Low Performer' | 'Probation (Exempt)' | 'Pending Review';
export type ActionPlanType = 'NONE' | 'PROMOTION' | 'MERIT_BONUS' | 'COACHING' | 'PIP';

export interface UserAccount {
  id: string;
  email: string;
  password: string;
  name: string;
  title: string;
  role: UserRole;
  department: string;
  employeeId?: string;
  managerId?: string;
  avatarInitials: string;
}

export interface RatingRubricItem {
  score: number;
  label: string;
  description: string;
}

export interface ReviewCycle {
  id: string;
  name: string;
  period: string;
  phase: CyclePhase;
  deadline: string; // YYYY-MM-DD
  kpiWeight: number; // e.g. 70
  competencyWeight: number; // e.g. 30
  normalizationEnabled: boolean;
  gracePeriodManagerIds: string[]; // manager IDs allowed to edit past deadline
  publishedAt: string | null;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  weight: number;
  progress: number; // 0 - 100
  selfScore: number | null;
  managerScore: number | null;
  employeeComment: string;
  status: 'APPROVED' | 'PROPOSED';
}

export interface CompetencyTemplate {
  id: string;
  name: string;
  description: string;
}

export interface CompetencyScore {
  id: string;
  name: string;
  description: string;
  selfScore: number | null;
  managerScore: number | null;
}

export interface CalibrationOverride {
  score: number;
  reason: string;
  updatedBy: string;
  updatedAt: string;
}

export interface TalentActionPlan {
  type: ActionPlanType;
  note: string;
  updatedAt: string;
}

export interface EmployeeAcknowledgment {
  status: 'PENDING' | 'ACKNOWLEDGED' | 'DISPUTED';
  comment?: string;
  updatedAt?: string;
}

export interface ManagerProfile {
  id: string;
  name: string;
  email: string;
  title: string;
  department: string;
  password?: string;
}

export interface Employee {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  password?: string;
  role: string;
  department: string;
  managerId: string;
  managerName: string;
  joinDate: string;
  employmentStatus: EmploymentStatus;
  selfReviewStatus: ReviewProgressStatus;
  managerReviewStatus: ReviewProgressStatus;
  potential: 1 | 2 | 3; // 1=Low, 2=Moderate, 3=High
  goals: Goal[];
  competencies: CompetencyScore[];
  selfSummary: string;
  managerStrengths: string;
  managerDevelopment: string;
  calibrationOverride: CalibrationOverride | null;
  actionPlan: TalentActionPlan | null;
  acknowledgment: EmployeeAcknowledgment;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  target: string;
  details: string;
  category: 'CALIBRATION' | 'CYCLE' | 'REVIEW' | 'DIRECTORY' | 'REMINDER';
}

export interface HRMState {
  cycle: ReviewCycle;
  competencyTemplates: CompetencyTemplate[];
  managers: ManagerProfile[];
  employees: Employee[];
  auditLogs: AuditLogEntry[];
}

export interface DataIssue {
  code: 'WEIGHT_MISMATCH' | 'OVERDUE_REVIEW' | 'SELF_MISSING' | 'SCORE_GAP' | 'PROBATION';
  severity: 'error' | 'warning' | 'info';
  label: string;
  detail: string;
}

export interface EnrichedEmployee extends Employee {
  totalGoalWeight: number;
  kpiRawScore: number | null;
  competencyRawScore: number | null;
  rawCompositeScore: number | null;
  selfCompositeScore: number | null;
  selfManagerGap: number | null;
  zScore: number | null;
  normalizedScore: number | null;
  finalScore: number | null;
  scoreSource: 'OVERRIDE' | 'NORMALIZED' | 'RAW' | 'NONE';
  tier: TalentTier;
  rawTier: TalentTier;
  isOverdue: boolean;
  issues: DataIssue[];
}

export interface ManagerStats {
  managerId: string;
  managerName: string;
  department: string;
  eligibleCount: number;
  submittedCount: number;
  pendingCount: number;
  meanRaw: number | null;
  stdDev: number | null;
  meanNormalized: number | null;
  biasLabel: 'Strict Grader' | 'Lenient Grader' | 'Balanced' | 'Insufficient Data';
  biasDelta: number; // vs org mean
}

