import { describe, it, expect, vi } from 'vitest';
import { generateInsight } from '../engine/insights';
import { getRobotMessage, SCENARIOS } from '../robot/messages';

describe('generateInsight', () => {
  it('warns about high sugar intake', () => {
    const consumption = {
      cals: 1000,
      categories: { sweets: 400 } // 40%
    };
    const target = { cals: 2000 };
    
    const insight = generateInsight(consumption, target, 'cut', 1, 'good');
    expect(insight.text).toContain('sugar');
  });

  it('warns about backloading calories', () => {
    // Real ledger meal keys are morning/lunch/eve/dinner — using the actual
    // 'eve' key here (not a made-up 'evening') so this exercises the same
    // shape generateInsight sees from the real store.
    const consumption = {
      cals: 1500,
      mealCals: { eve: 1500, morning: 0, lunch: 0 }
    };
    const target = { cals: 2000 };

    vi.useFakeTimers();
    vi.setSystemTime(new Date(2023, 0, 1, 19, 0, 0));

    const insight = generateInsight(consumption, target, 'cut', 1, 'good');
    expect(insight.text).toContain('Backloading');

    vi.useRealTimers();
  });

  it('does not false-positive on backloading when a user has no morning/lunch slots at all', () => {
    // Regression for the bug where firstHalfCals hardcoded mealCals['morning']
    // + mealCals['lunch'] — a user who removed those default slots and logs
    // everything under a custom (early) slot always read as 0, incorrectly
    // triggering "backloading" every evening regardless of when they ate.
    const consumption = {
      cals: 900,
      mealCals: { custom_brunch: 900 } // logged mid-morning, no 'eve'/'dinner' entries
    };
    const target = { cals: 2000 };

    vi.useFakeTimers();
    vi.setSystemTime(new Date(2023, 0, 1, 19, 0, 0));

    const insight = generateInsight(consumption, target, 'cut', 1, 'good');
    expect(insight.text).not.toContain('Backloading');

    vi.useRealTimers();
  });

  it('still detects genuine backloading without relying on morning/lunch keys being present', () => {
    // All calories in the late-day slots, and the early keys are entirely
    // absent from mealCals (not just zeroed) — should still fire.
    const consumption = {
      cals: 1200,
      mealCals: { eve: 700, dinner: 500 }
    };
    const target = { cals: 2000 };

    vi.useFakeTimers();
    vi.setSystemTime(new Date(2023, 0, 1, 20, 0, 0));

    const insight = generateInsight(consumption, target, 'cut', 1, 'good');
    expect(insight.text).toContain('Backloading');

    vi.useRealTimers();
  });
});

describe('savage (bad) companion mode', () => {
  it('produces genuinely different, non-supportive copy from good mode', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2023, 0, 1, 15, 0, 0)); // afternoon, past the "ate early" branch

    // 100% of target with protein hit → the "perfect" branch, whose bad
    // variant used to read "...well done" (fully supportive). Guard against
    // that regression.
    const consumption = { cals: 2000, macros: { p: 200 }, categories: {}, mealCals: {} };
    const target = { cals: 2000, p: 100 };

    const good = generateInsight(consumption, target, 'cut', 1, 'good').text;
    const bad = generateInsight(consumption, target, 'cut', 1, 'bad').text;

    expect(bad).not.toBe(good);
    expect(bad.toLowerCase()).not.toContain('well done');

    vi.useRealTimers();
  });

  it('softens to neutral (not savage) when intake is very low — ED safety guard', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2023, 0, 1, 13, 0, 0)); // midday avoids the evening under-eating branch

    // Under 500 kcal in bad mode must fall back to the neutral copy.
    const consumption = { cals: 400, macros: { p: 5 }, categories: { sweets: 250 }, mealCals: {} };
    const target = { cals: 2000, p: 100 };

    const bad = generateInsight(consumption, target, 'cut', 1, 'bad').text;
    const normal = generateInsight(consumption, target, 'cut', 1, 'normal').text;

    expect(bad).toBe(normal);

    vi.useRealTimers();
  });

  it('getRobotMessage returns a line from the scenario\'s bad pool in bad mode', () => {
    const msg = getRobotMessage('morning_empty', 'bad', 'seed');
    expect(SCENARIOS.morning_empty.bad).toContain(msg);
    // And that bad pool must be distinct from the supportive one.
    expect(SCENARIOS.morning_empty.bad).not.toEqual(SCENARIOS.morning_empty.good);
  });
});
