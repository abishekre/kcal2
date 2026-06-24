import { describe, it, expect } from 'vitest';
import { generateInsight } from '../engine/insights';

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
    const consumption = {
      cals: 1500,
      mealCals: { evening: 1500, morning: 0, lunch: 0 }
    };
    const target = { cals: 2000 };
    
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2023, 0, 1, 19, 0, 0));

    const insight = generateInsight(consumption, target, 'cut', 1, 'good');
    expect(insight.text).toContain('Backloading');

    vi.useRealTimers();
  });
});
