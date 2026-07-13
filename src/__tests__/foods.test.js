import { describe, it, expect } from 'vitest';
import { BASE_FOOD_DB, FOOD_CATEGORIES, POPULAR_FOOD_KEYS } from '../data/foods';

// Atwater factors: protein 4, carbs 4, fat 9, alcohol 7 kcal/g.
const macroCals = (f) => (f.p || 0) * 4 + (f.c || 0) * 4 + (f.f || 0) * 9 + (f.a || 0) * 7;

describe('BASE_FOOD_DB integrity', () => {
  const entries = Object.entries(BASE_FOOD_DB);

  it('every food has valid, non-negative fields and a known category', () => {
    for (const [key, f] of entries) {
      expect(typeof f.name, `${key}.name`).toBe('string');
      expect(f.name.length, `${key}.name`).toBeGreaterThan(0);
      expect(typeof f.unit, `${key}.unit`).toBe('string');
      expect(FOOD_CATEGORIES[f.category], `${key}.category "${f.category}"`).toBeTruthy();
      for (const m of ['cals', 'p', 'c', 'f']) {
        expect(typeof f[m], `${key}.${m}`).toBe('number');
        expect(f[m], `${key}.${m}`).toBeGreaterThanOrEqual(0);
      }
      expect(f.cals, `${key}.cals`).toBeGreaterThan(0);
    }
  });

  it('macros never overstate calories (physical sanity: derived ≤ cals + slack)', () => {
    // Macro-derived calories can be a bit BELOW stated (fiber + food-specific
    // Atwater factors), but should never meaningfully EXCEED the label — that
    // would mean the macros are internally inconsistent. Allow 15% + 6 kcal.
    for (const [key, f] of entries) {
      const derived = macroCals(f);
      expect(derived, `${key}: macros (${derived}) exceed calories (${f.cals})`)
        .toBeLessThanOrEqual(f.cals * 1.15 + 6);
    }
  });

  it('macros are not grossly below calories either (>35% under flags a data error)', () => {
    for (const [key, f] of entries) {
      const derived = macroCals(f);
      // Near-zero-calorie items (green tea, black coffee) are exempt.
      if (f.cals <= 15) continue;
      expect(derived, `${key}: macros (${derived}) far below calories (${f.cals})`)
        .toBeGreaterThanOrEqual(f.cals * 0.65);
    }
  });

  it('POPULAR_FOOD_KEYS all reference existing foods', () => {
    for (const key of POPULAR_FOOD_KEYS) {
      expect(BASE_FOOD_DB[key], `POPULAR key "${key}"`).toBeTruthy();
    }
  });
});
