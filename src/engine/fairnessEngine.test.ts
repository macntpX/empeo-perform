import { describe, expect, it } from 'vitest';
import {
  classifyTier,
  computeFairnessEngine,
  isManagerLockedForCycle,
} from './fairnessEngine';
import { INITIAL_HRM_STATE } from '../data/seedData';
import { Employee, ReviewCycle } from '../types/hrm';

function cloneSeed() {
  return {
    cycle: structuredClone(INITIAL_HRM_STATE.cycle),
    employees: structuredClone(INITIAL_HRM_STATE.employees),
  };
}

describe('empeo Perform — Fairness & Calibration Engine', () => {
  it('classifies talent tiers cleanly across boundaries and special statuses', () => {
    expect(classifyTier(4.0, 'ELIGIBLE')).toBe('High Performer');
    expect(classifyTier(3.99, 'ELIGIBLE')).toBe('Core Performer');
    expect(classifyTier(2.8, 'ELIGIBLE')).toBe('Core Performer');
    expect(classifyTier(2.79, 'ELIGIBLE')).toBe('Low Performer');
    expect(classifyTier(null, 'ELIGIBLE')).toBe('Pending Review');
    expect(classifyTier(4.8, 'PROBATION')).toBe('Probation (Exempt)');
  });

  it('corrects Strict vs. Lenient manager bias via Z-Score normalization', () => {
    const { employees, cycle } = cloneSeed();
    const { enriched, managerStats } = computeFairnessEngine(employees, cycle);

    const ken = managerStats.find((m) => m.managerId === 'MGR-ENG');
    const sarah = managerStats.find((m) => m.managerId === 'MGR-SLS');
    expect(ken?.biasLabel).toBe('Strict Grader');
    expect(sarah?.biasLabel).toBe('Lenient Grader');

    // Nadia: Top performer under strict manager (Ken) -> raw ~4.00, normalized >= 4.00 (High Performer)
    const nadia = enriched.find((e) => e.id === 'EMP-01')!;
    // Kanya: Bottom performer under lenient manager (Sarah) -> raw ~3.75, normalized < 2.80 (Low Performer)
    const kanya = enriched.find((e) => e.id === 'EMP-06')!;

    expect(nadia.rawCompositeScore).toBeGreaterThan(3.9);
    expect(nadia.normalizedScore).toBeGreaterThan(nadia.rawCompositeScore!);
    expect(nadia.tier).toBe('High Performer');

    expect(kanya.rawCompositeScore).toBeGreaterThan(3.5);
    expect(kanya.normalizedScore).toBeLessThan(2.8);
    expect(kanya.tier).toBe('Low Performer');
  });

  it('excludes Probation employees from team calibration pool so they do not distort team averages', () => {
    const { employees, cycle } = cloneSeed();
    const { enriched } = computeFairnessEngine(employees, cycle);

    const arthit = enriched.find((e) => e.id === 'EMP-07')!;
    expect(arthit.employmentStatus).toBe('PROBATION');
    expect(arthit.tier).toBe('Probation (Exempt)');
    expect(arthit.finalScore).toBeNull();
    expect(arthit.zScore).toBeNull();
    expect(arthit.issues.some((i) => i.code === 'PROBATION')).toBe(true);
  });

  it('auto-reweights KPIs and raises WEIGHT_MISMATCH warning when goal weights do not sum to 100%', () => {
    const { employees, cycle } = cloneSeed();
    const emp: Employee = {
      ...employees[0],
      id: 'EMP-TEST-WEIGHT',
      goals: [
        {
          id: 'G-1',
          title: 'Goal A',
          description: 'Desc A',
          weight: 40,
          progress: 100,
          status: 'APPROVED',
          selfScore: 4.0,
          managerScore: 4.0,
          employeeComment: '',
        },
        {
          id: 'G-2',
          title: 'Goal B',
          description: 'Desc B',
          weight: 20,
          progress: 80,
          status: 'APPROVED',
          selfScore: 2.5,
          managerScore: 2.5,
          employeeComment: '',
        },
      ],
      competencies: [
        {
          id: 'C-1',
          name: 'Execution',
          description: '',
          selfScore: 3.5,
          managerScore: 3.5,
        },
      ],
    };

    const { enriched } = computeFairnessEngine([emp], cycle);
    const res = enriched[0];
    // Weighted KPI avg = (4.0*40 + 2.5*20) / 60 = 210 / 60 = 3.50
    expect(res.totalGoalWeight).toBe(60);
    expect(res.kpiRawScore).toBe(3.5);
    expect(res.rawCompositeScore).toBe(3.5);
    expect(res.issues.some((i) => i.code === 'WEIGHT_MISMATCH')).toBe(true);
  });

  it('flags large Self vs. Manager score gaps (>= 1.0 point) for 1-on-1 alignment', () => {
    const { employees, cycle } = cloneSeed();
    const { enriched } = computeFairnessEngine(employees, cycle);

    const ploypailin = enriched.find((e) => e.id === 'EMP-03')!;
    expect(ploypailin.selfManagerGap).not.toBeNull();
    expect(Math.abs(ploypailin.selfManagerGap!)).toBeGreaterThanOrEqual(1.0);
    expect(ploypailin.issues.some((i) => i.code === 'SCORE_GAP')).toBe(true);
  });

  it('respects HR Calibration Manual Override over automated Z-Score and updates final tier', () => {
    const { employees, cycle } = cloneSeed();
    const target = employees.find((e) => e.id === 'EMP-06')!;
    target.calibrationOverride = {
      score: 3.25,
      reason: 'Committee adjusted for territory transition in Q2',
      updatedBy: 'Pimchanok S.',
      updatedAt: '2026-11-23',
    };

    const { enriched } = computeFairnessEngine(employees, cycle);
    const updated = enriched.find((e) => e.id === 'EMP-06')!;
    expect(updated.finalScore).toBe(3.25);
    expect(updated.scoreSource).toBe('OVERRIDE');
    expect(updated.tier).toBe('Core Performer');
  });

  it('locks managers after cycle deadline unless HR grants a Grace Period, and always locks when PUBLISHED', () => {
    const pastCycle: ReviewCycle = {
      ...INITIAL_HRM_STATE.cycle,
      deadline: '2020-01-01',
      phase: 'CALIBRATION',
      gracePeriodManagerIds: ['MGR-ENG'],
    };

    expect(isManagerLockedForCycle(pastCycle, 'MGR-ENG')).toBe(false);
    expect(isManagerLockedForCycle(pastCycle, 'MGR-SLS')).toBe(true);

    const publishedCycle: ReviewCycle = { ...pastCycle, phase: 'PUBLISHED' };
    expect(isManagerLockedForCycle(publishedCycle, 'MGR-ENG')).toBe(true);
  });
});
