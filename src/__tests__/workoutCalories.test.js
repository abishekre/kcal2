import { describe, it, expect } from 'vitest';
import {
  estimateCalories,
  getCardioMet,
  estimateSessionCalories,
  detectPRs,
  sessionVolume,
} from '../engine/workoutCalories';
import { BASE_EXERCISE_DB, EXERCISE_CATEGORIES, POPULAR_EXERCISE_KEYS } from '../data/exercises';

describe('estimateCalories (MET formula)', () => {
  it('computes the golden MET value: 8 MET × 70kg × 30min = 280 kcal', () => {
    expect(estimateCalories({ met: 8, weightKg: 70, durationSeconds: 1800 })).toBe(280);
  });

  it('returns 0 for missing/invalid inputs', () => {
    expect(estimateCalories({ met: 0, weightKg: 70, durationSeconds: 1800 })).toBe(0);
    expect(estimateCalories({ met: 8, weightKg: 0, durationSeconds: 1800 })).toBe(0);
    expect(estimateCalories({ met: 8, weightKg: 70, durationSeconds: 0 })).toBe(0);
  });
});

describe('getCardioMet (pace scaling)', () => {
  const running = BASE_EXERCISE_DB.running;

  it('clamps to table endpoints', () => {
    expect(getCardioMet(running, { speedKmh: 2 })).toBe(running.metByPace[0][1]);
    expect(getCardioMet(running, { speedKmh: 30 })).toBe(running.metByPace.at(-1)[1]);
  });

  it('interpolates linearly between rows', () => {
    // Midway between [8.0, 8.3] and [9.7, 9.8] → ~9.05 at 8.85 km/h
    const met = getCardioMet(running, { speedKmh: 8.85 });
    expect(met).toBeGreaterThan(8.3);
    expect(met).toBeLessThan(9.8);
  });

  it('falls back to defaultMet without pace', () => {
    expect(getCardioMet(running, {})).toBe(running.defaultMet);
  });
});

describe('estimateSessionCalories', () => {
  const db = BASE_EXERCISE_DB;
  const strengthEntry = (key, doneSets) => ({
    exerciseKey: key,
    type: 'strength',
    sets: Array.from({ length: doneSets }, () => ({ weight: 60, reps: 8, done: true })),
  });

  it('strength burn uses working-set time, capped by session elapsed', () => {
    // 10 done sets × 60s = 600s working. Squat MET 6 → 6 × 80 × (600/3600) = 80.
    const uncapped = estimateSessionCalories(
      { entries: [strengthEntry('squat', 10)] },
      { weightKg: 80, exerciseDB: db, elapsedSeconds: 3600 }
    );
    expect(uncapped.total).toBe(80);

    // Same sets but session only lasted 300s → half the working time counts.
    const capped = estimateSessionCalories(
      { entries: [strengthEntry('squat', 10)] },
      { weightKg: 80, exerciseDB: db, elapsedSeconds: 300 }
    );
    expect(capped.total).toBe(40);
  });

  it('cardio uses explicit duration and pace-scaled MET', () => {
    // 30 min run at 9.7 km/h (4850m) → MET 9.8 → 9.8 × 70 × 0.5 = 343
    const r = estimateSessionCalories(
      { entries: [{ exerciseKey: 'running', type: 'cardio', durationSeconds: 1800, distanceM: 4850 }] },
      { weightKg: 70, exerciseDB: db, elapsedSeconds: 1800 }
    );
    expect(r.total).toBe(343);
  });

  it('applies the sanity cap and flags it', () => {
    const r = estimateSessionCalories(
      { entries: [{ exerciseKey: 'running', type: 'cardio', durationSeconds: 5 * 3600 }] },
      { weightKg: 100, exerciseDB: db, elapsedSeconds: 5 * 3600 }
    );
    expect(r.capped).toBe(true);
    expect(r.total).toBe(1500);
  });

  it('ignores warmup and not-done sets', () => {
    const entry = {
      exerciseKey: 'squat',
      type: 'strength',
      sets: [
        { weight: 40, reps: 10, done: true, isWarmup: true },
        { weight: 100, reps: 5, done: false },
        { weight: 100, reps: 5, done: true },
      ],
    };
    const r = estimateSessionCalories(
      { entries: [entry] },
      { weightKg: 80, exerciseDB: db, elapsedSeconds: 3600 }
    );
    // Only 1 counted set × 60s → 6 × 80 × (60/3600) = 8
    expect(r.total).toBe(8);
  });
});

describe('detectPRs', () => {
  const history = [
    {
      entries: [
        { exerciseKey: 'bench_press', type: 'strength', sets: [{ weight: 80, reps: 5, done: true }] },
      ],
    },
  ];

  it('reports a weight PR when a heavier set is completed', () => {
    const session = {
      entries: [{ exerciseKey: 'bench_press', type: 'strength', sets: [{ weight: 85, reps: 3, done: true }] }],
    };
    const prs = detectPRs(session, history);
    expect(prs).toEqual([{ exerciseKey: 'bench_press', kind: 'weight', value: 85, previous: 80 }]);
  });

  it('reports nothing without history (first time is not a "PR")', () => {
    const session = {
      entries: [{ exerciseKey: 'squat', type: 'strength', sets: [{ weight: 100, reps: 5, done: true }] }],
    };
    expect(detectPRs(session, history)).toEqual([]);
  });

  it('reports a volume PR when weight ties but volume rises', () => {
    const session = {
      entries: [{ exerciseKey: 'bench_press', type: 'strength', sets: [{ weight: 80, reps: 8, done: true }] }],
    };
    const prs = detectPRs(session, history);
    expect(prs).toEqual([{ exerciseKey: 'bench_press', kind: 'volume', value: 640, previous: 400 }]);
  });
});

describe('sessionVolume', () => {
  it('sums weight × reps over done working sets only', () => {
    const session = {
      entries: [{
        exerciseKey: 'squat', type: 'strength',
        sets: [
          { weight: 60, reps: 10, done: true },
          { weight: 60, reps: 10, done: true, isWarmup: true },
          { weight: 60, reps: 10, done: false },
        ],
      }],
    };
    expect(sessionVolume(session)).toBe(600);
  });
});

describe('BASE_EXERCISE_DB integrity', () => {
  it('every exercise has valid fields and a known category', () => {
    for (const [key, ex] of Object.entries(BASE_EXERCISE_DB)) {
      expect(typeof ex.name, `${key}.name`).toBe('string');
      expect(EXERCISE_CATEGORIES[ex.category], `${key}.category`).toBeTruthy();
      expect(['strength', 'cardio', 'activity'], `${key}.type`).toContain(ex.type);
      const met = ex.met ?? ex.defaultMet;
      expect(met, `${key}.met`).toBeGreaterThan(0);
      expect(met, `${key}.met sane`).toBeLessThanOrEqual(15);
      expect(Array.isArray(ex.primary), `${key}.primary`).toBe(true);
      expect(typeof ex.equipment, `${key}.equipment`).toBe('string');
      if (ex.metByPace) {
        for (let i = 1; i < ex.metByPace.length; i++) {
          expect(ex.metByPace[i][0], `${key}.metByPace order`).toBeGreaterThan(ex.metByPace[i - 1][0]);
        }
      }
    }
  });

  it('POPULAR_EXERCISE_KEYS all exist', () => {
    for (const k of POPULAR_EXERCISE_KEYS) expect(BASE_EXERCISE_DB[k], k).toBeTruthy();
  });
});
