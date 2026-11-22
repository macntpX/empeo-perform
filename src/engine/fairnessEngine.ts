import {
  DataIssue,
  Employee,
  EnrichedEmployee,
  ManagerStats,
  ReviewCycle,
  TalentTier,
} from '../types/hrm';

const TODAY_STR = new Date().toISOString().slice(0, 10);

export function classifyTier(score: number | null, status: Employee['employmentStatus']): TalentTier {
  if (status === 'PROBATION') return 'Probation (Exempt)';
  if (score === null) return 'Pending Review';
  if (score >= 4.0) return 'High Performer';
  if (score < 2.8) return 'Low Performer';
  return 'Core Performer';
}

export function isCyclePastDeadline(deadline: string): boolean {
  return TODAY_STR > deadline;
}

export function isManagerLockedForCycle(cycle: ReviewCycle, managerId: string): boolean {
  if (cycle.phase === 'PUBLISHED') return true;
  if (isCyclePastDeadline(cycle.deadline)) {
    return !cycle.gracePeriodManagerIds.includes(managerId);
  }
  return false;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function computeFairnessEngine(
  employees: Employee[],
  cycle: ReviewCycle
): {
  enriched: EnrichedEmployee[];
  managerStats: ManagerStats[];
  orgMeanRaw: number | null;
  orgMeanFinal: number | null;
} {
  const pastDeadline = isCyclePastDeadline(cycle.deadline);
  const kpiRatio = cycle.kpiWeight / 100;
  const compRatio = cycle.competencyWeight / 100;

  // Step 1: Compute individual raw KPI, Competency, Composite, Self-Score & Data Health
  const prelim = employees.map((emp) => {
    const totalGoalWeight = emp.goals.reduce((sum, g) => sum + Number(g.weight || 0), 0);
    const issues: DataIssue[] = [];

    if (emp.employmentStatus === 'PROBATION') {
      issues.push({
        code: 'PROBATION',
        severity: 'info',
        label: 'Probation (Exempt)',
        detail: 'Joined within 90 days. Excluded from annual calibration pool.',
      });
      return {
        ...emp,
        totalGoalWeight,
        kpiRawScore: null,
        competencyRawScore: null,
        rawCompositeScore: null,
        selfCompositeScore: null,
        selfManagerGap: null,
        zScore: null,
        normalizedScore: null,
        finalScore: null,
        scoreSource: 'NONE' as const,
        tier: 'Probation (Exempt)' as TalentTier,
        rawTier: 'Probation (Exempt)' as TalentTier,
        isOverdue: false,
        issues,
      };
    }

    if (totalGoalWeight !== 100) {
      issues.push({
        code: 'WEIGHT_MISMATCH',
        severity: 'warning',
        label: `Goal weights = ${totalGoalWeight}%`,
        detail: `Weights should sum to 100%. Engine auto-rebalanced across active goals (${totalGoalWeight}%) to prevent distortion.`,
      });
    }

    const isOverdue =
      pastDeadline &&
      emp.managerReviewStatus !== 'SUBMITTED' &&
      cycle.phase !== 'PUBLISHED';

    if (isOverdue) {
      const hasGrace = cycle.gracePeriodManagerIds.includes(emp.managerId);
      issues.push({
        code: 'OVERDUE_REVIEW',
        severity: 'error',
        label: hasGrace ? 'Overdue (Grace Period)' : 'Overdue (Locked)',
        detail: hasGrace
          ? `Manager ${emp.managerName} missed ${cycle.deadline} deadline; HR grace period is active.`
          : `Manager ${emp.managerName} missed ${cycle.deadline} deadline. Grant a grace period or send a reminder.`,
      });
    }

    if (emp.selfReviewStatus !== 'SUBMITTED') {
      issues.push({
        code: 'SELF_MISSING',
        severity: 'warning',
        label: 'Self-Review Missing',
        detail: 'Employee has not submitted self-assessment yet. Manager can still evaluate.',
      });
    }

    // Weighted Manager KPI score
    const scoredGoals = emp.goals.filter((g) => g.managerScore !== null);
    let kpiRawScore: number | null = null;
    if (scoredGoals.length > 0) {
      const weightSum = scoredGoals.reduce((s, g) => s + Number(g.weight || 0), 0);
      kpiRawScore =
        weightSum > 0
          ? round2(
              scoredGoals.reduce((s, g) => s + (g.managerScore as number) * g.weight, 0) /
                weightSum
            )
          : round2(
              scoredGoals.reduce((s, g) => s + (g.managerScore as number), 0) /
                scoredGoals.length
            );
    }

    // Manager Competency average
    const scoredComps = emp.competencies.filter((c) => c.managerScore !== null);
    const competencyRawScore =
      scoredComps.length > 0
        ? round2(
            scoredComps.reduce((s, c) => s + (c.managerScore as number), 0) / scoredComps.length
          )
        : null;

    // Composite Raw Manager Score
    let rawCompositeScore: number | null = null;
    if (kpiRawScore !== null && competencyRawScore !== null) {
      rawCompositeScore = round2(kpiRawScore * kpiRatio + competencyRawScore * compRatio);
    } else if (kpiRawScore !== null) {
      rawCompositeScore = kpiRawScore;
    } else if (competencyRawScore !== null) {
      rawCompositeScore = competencyRawScore;
    }

    // Self Composite Score
    const selfGoals = emp.goals.filter((g) => g.selfScore !== null);
    const selfComps = emp.competencies.filter((c) => c.selfScore !== null);
    let selfCompositeScore: number | null = null;
    if (selfGoals.length > 0 || selfComps.length > 0) {
      const selfKpi =
        selfGoals.length > 0
          ? (() => {
              const w = selfGoals.reduce((s, g) => s + Number(g.weight || 0), 0);
              return w > 0
                ? selfGoals.reduce((s, g) => s + (g.selfScore as number) * g.weight, 0) / w
                : selfGoals.reduce((s, g) => s + (g.selfScore as number), 0) / selfGoals.length;
            })()
          : null;
      const selfComp =
        selfComps.length > 0
          ? selfComps.reduce((s, c) => s + (c.selfScore as number), 0) / selfComps.length
          : null;

      if (selfKpi !== null && selfComp !== null) {
        selfCompositeScore = round2(selfKpi * kpiRatio + selfComp * compRatio);
      } else {
        selfCompositeScore = round2((selfKpi ?? selfComp) as number);
      }
    }

    const selfManagerGap =
      selfCompositeScore !== null && rawCompositeScore !== null
        ? round2(selfCompositeScore - rawCompositeScore)
        : null;

    if (selfManagerGap !== null && Math.abs(selfManagerGap) >= 1.0) {
      issues.push({
        code: 'SCORE_GAP',
        severity: 'warning',
        label: `Self/Mgr Gap (${selfManagerGap > 0 ? '+' : ''}${selfManagerGap.toFixed(2)})`,
        detail:
          'Self-assessment and Manager score differ by >= 1.0 point. Recommend alignment 1-on-1 before finalizing.',
      });
    }

    return {
      ...emp,
      totalGoalWeight,
      kpiRawScore,
      competencyRawScore,
      rawCompositeScore,
      selfCompositeScore,
      selfManagerGap,
      zScore: null as number | null,
      normalizedScore: null as number | null,
      finalScore: rawCompositeScore,
      scoreSource: (rawCompositeScore !== null ? 'RAW' : 'NONE') as
        | 'OVERRIDE'
        | 'NORMALIZED'
        | 'RAW'
        | 'NONE',
      tier: classifyTier(rawCompositeScore, emp.employmentStatus),
      rawTier: classifyTier(rawCompositeScore, emp.employmentStatus),
      isOverdue,
      issues,
    };
  });

  // Step 2: Compute Org-Wide Mean Raw (across scored eligible employees)
  const scoredEligible = prelim.filter(
    (e) => e.employmentStatus === 'ELIGIBLE' && e.rawCompositeScore !== null
  );
  const orgMeanRaw =
    scoredEligible.length > 0
      ? round2(
          scoredEligible.reduce((s, e) => s + (e.rawCompositeScore as number), 0) /
            scoredEligible.length
        )
      : null;

  // Step 3: Compute Per-Manager Stats (Mean, StdDev, Bias Detection)
  const managerIds = [...new Set(employees.map((e) => e.managerId))];
  const statsMap: Record<string, ManagerStats> = {};

  managerIds.forEach((mgrId) => {
    const team = prelim.filter((e) => e.managerId === mgrId);
    const eligible = team.filter((e) => e.employmentStatus === 'ELIGIBLE');
    const scored = eligible.filter((e) => e.rawCompositeScore !== null);
    const submitted = eligible.filter((e) => e.managerReviewStatus === 'SUBMITTED');

    let meanRaw: number | null = null;
    let stdDev: number | null = null;
    let biasLabel: ManagerStats['biasLabel'] = 'Insufficient Data';
    let biasDelta = 0;

    if (scored.length > 0) {
      meanRaw = round2(
        scored.reduce((s, e) => s + (e.rawCompositeScore as number), 0) / scored.length
      );
      const variance =
        scored.reduce((s, e) => s + Math.pow((e.rawCompositeScore as number) - meanRaw!, 2), 0) /
        scored.length;
      stdDev = round2(Math.sqrt(variance));

      if (orgMeanRaw !== null && scored.length >= 2) {
        biasDelta = round2(meanRaw - orgMeanRaw);
        if (biasDelta <= -0.35) biasLabel = 'Strict Grader';
        else if (biasDelta >= 0.35) biasLabel = 'Lenient Grader';
        else biasLabel = 'Balanced';
      }
    }

    statsMap[mgrId] = {
      managerId: mgrId,
      managerName: team[0]?.managerName ?? mgrId,
      department: team[0]?.department ?? 'General',
      eligibleCount: eligible.length,
      submittedCount: submitted.length,
      pendingCount: eligible.length - submitted.length,
      meanRaw,
      stdDev,
      meanNormalized: null,
      biasLabel,
      biasDelta,
    };
  });

  // Step 4: Apply Z-Score Normalization & Manual Override Hierarchy
  const enriched: EnrichedEmployee[] = prelim.map((emp) => {
    if (emp.employmentStatus !== 'ELIGIBLE' || emp.rawCompositeScore === null) {
      return emp;
    }

    const mgr = statsMap[emp.managerId];
    let zScore: number | null = null;
    let normalizedScore: number | null = emp.rawCompositeScore;

    // Only apply Z-score when manager has >= 2 scored reports with non-trivial spread
    if (mgr && mgr.meanRaw !== null && mgr.stdDev !== null && mgr.stdDev > 0.05) {
      zScore = round2((emp.rawCompositeScore - mgr.meanRaw) / mgr.stdDev);
      normalizedScore = round2(Math.min(5.0, Math.max(1.0, 3.5 + zScore * 0.75)));
    } else {
      zScore = 0;
    }

    let finalScore: number;
    let scoreSource: EnrichedEmployee['scoreSource'];

    if (emp.calibrationOverride) {
      finalScore = round2(emp.calibrationOverride.score);
      scoreSource = 'OVERRIDE';
    } else if (cycle.normalizationEnabled && normalizedScore !== null) {
      finalScore = normalizedScore;
      scoreSource = 'NORMALIZED';
    } else {
      finalScore = emp.rawCompositeScore;
      scoreSource = 'RAW';
    }

    return {
      ...emp,
      zScore,
      normalizedScore,
      finalScore,
      scoreSource,
      tier: classifyTier(finalScore, emp.employmentStatus),
      rawTier: classifyTier(emp.rawCompositeScore, emp.employmentStatus),
    };
  });

  // Populate meanNormalized on managerStats
  const managerStats = Object.values(statsMap).map((ms) => {
    const teamFinal = enriched.filter(
      (e) => e.managerId === ms.managerId && e.employmentStatus === 'ELIGIBLE' && e.finalScore !== null
    );
    const meanNormalized =
      teamFinal.length > 0
        ? round2(
            teamFinal.reduce((s, e) => s + (e.finalScore as number), 0) / teamFinal.length
          )
        : null;
    return { ...ms, meanNormalized };
  });

  const allFinal = enriched.filter(
    (e) => e.employmentStatus === 'ELIGIBLE' && e.finalScore !== null
  );
  const orgMeanFinal =
    allFinal.length > 0
      ? round2(allFinal.reduce((s, e) => s + (e.finalScore as number), 0) / allFinal.length)
      : null;

  return { enriched, managerStats, orgMeanRaw, orgMeanFinal };
}

