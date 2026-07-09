import { describe, it, expect, vi, afterEach } from 'vitest';
import { getStreak, calculateGoalCalories, getRecommendedWaterGlasses, calculateConsumption } from '../engine/projection';

describe('calculateConsumption', () => {
  it("treats 'g'/'ml' foods as per-100 and everything else as per-serving", () => {
    const fullDB = {
      rice: { cals: 130, p: 2, c: 28, f: 0, unit: 'g' },      // per 100g
      juice: { cals: 45, p: 0, c: 11, f: 0, unit: 'ml' },     // per 100ml
      egg: { cals: 70, p: 6, c: 0, f: 5, unit: 'item' },      // per item
    };
    const meals = {
      lunch: { rice: 200, juice: 250, egg: 2 },
    };

    const result = calculateConsumption(meals, fullDB);

    // 130*(200/100) + 45*(250/100) + 70*2 = 260 + 112.5 + 140 = 512.5 -> 513
    expect(result.cals).toBe(513);
    // A custom food saved with unit 'g' must scale the same way a base
    // gram-food does (regression guard for the CustomFoodSheet unit fix).
    expect(calculateConsumption({ m: { rice: 100 } }, fullDB).cals).toBe(130);
    expect(calculateConsumption({ m: { rice: 250 } }, fullDB).cals).toBe(325);
  });
});

describe('calculateGoalCalories', () => {
  it('scales the deficit with TDEE instead of applying the same flat offset to everyone', () => {
    const small = { gender: 'female', weight: 50, height: 155, age: 25 };
    const large = { gender: 'male', weight: 110, height: 190, age: 25 };

    const smallCut = calculateGoalCalories(small, 'cut', 'sedentary');
    const largeCut = calculateGoalCalories(large, 'cut', 'sedentary');

    // Both should reflect a ~20% reduction from their own TDEE, not the
    // same absolute number.
    expect(smallCut.targetCals).toBeCloseTo(Math.round(smallCut.tdee * 0.8), 0);
    expect(largeCut.targetCals).toBeCloseTo(Math.round(largeCut.tdee * 0.8), 0);
    expect(largeCut.tdee - largeCut.targetCals).toBeGreaterThan(smallCut.tdee - smallCut.targetCals);
  });

  it('applies 0% adjustment for maintain and +10% for bulk', () => {
    const profile = { gender: 'male', weight: 80, height: 178, age: 30 };
    const maintain = calculateGoalCalories(profile, 'maintain', 'sedentary');
    const bulk = calculateGoalCalories(profile, 'bulk', 'sedentary');

    expect(maintain.targetCals).toBe(maintain.tdee);
    expect(bulk.targetCals).toBeCloseTo(Math.round(bulk.tdee * 1.1), 0);
  });
});

describe('getRecommendedWaterGlasses', () => {
  it('scales with body weight instead of returning a flat number for everyone', () => {
    expect(getRecommendedWaterGlasses(50)).toBeLessThan(getRecommendedWaterGlasses(100));
  });

  it('clamps to a sane range for extreme inputs', () => {
    expect(getRecommendedWaterGlasses(20)).toBeGreaterThanOrEqual(4);
    expect(getRecommendedWaterGlasses(0)).toBeGreaterThanOrEqual(4);
  });
});

describe('getStreak', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('counts consecutive logged, on-target days without requiring a commit/lock', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 0, 10, 12, 0, 0)); // Jan 10 2024, noon

    const fullDB = { food: { cals: 100, p: 0, c: 0, f: 0 } };
    const ledger = {
      // None of these are locked — logging alone must be enough to count.
      '2024-01-10': { locked: false, meals: { morning: { food: 5 } } }, // today, 500 under
      '2024-01-09': { locked: false, meals: { morning: { food: 5 } } },
      '2024-01-08': { locked: false, meals: { morning: { food: 5 } } },
    };

    expect(getStreak(ledger, fullDB, 2000)).toBe(3);
  });

  it('ends the streak on a completed day that is logged but over target', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 0, 10, 12, 0, 0));

    const fullDB = { food: { cals: 100, p: 0, c: 0, f: 0 } };
    const ledger = {
      '2024-01-10': { meals: { morning: { food: 5 } } }, // today under → +1
      '2024-01-09': { meals: { morning: { food: 30 } } }, // 3000 over → breaks
      '2024-01-08': { meals: { morning: { food: 5 } } },
    };

    expect(getStreak(ledger, fullDB, 2000)).toBe(1);
  });

  it('ends the streak on a day with no food logged (a gap)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 0, 10, 12, 0, 0));

    const fullDB = { food: { cals: 100, p: 0, c: 0, f: 0 } };
    const ledger = {
      '2024-01-10': { meals: { morning: { food: 5 } } }, // today → +1
      // 2024-01-09 missing entirely → gap
      '2024-01-08': { meals: { morning: { food: 5 } } },
    };

    expect(getStreak(ledger, fullDB, 2000)).toBe(1);
  });

  it('does not let an over-target today erase the streak from prior days', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 0, 10, 12, 0, 0));

    const fullDB = { food: { cals: 100, p: 0, c: 0, f: 0 } };
    const ledger = {
      '2024-01-10': { meals: { morning: { food: 30 } } }, // today over — not counted, but doesn't break
      '2024-01-09': { meals: { morning: { food: 5 } } }, // +1
      '2024-01-08': { meals: { morning: { food: 5 } } }, // +1
    };

    expect(getStreak(ledger, fullDB, 2000)).toBe(2);
  });
});
