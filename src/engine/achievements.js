import { ACHIEVEMENTS } from '../utils/constants';
import { calculateConsumption } from './projection';
import { format, subDays } from 'date-fns';

// Count every food entry logged across all days (a rough "meals logged" proxy).
function countFoodEntries(ledger) {
  let n = 0;
  for (const date of Object.keys(ledger)) {
    const meals = ledger[date]?.meals || {};
    for (const mealKey of Object.keys(meals)) {
      n += Object.keys(meals[mealKey] || {}).length;
    }
  }
  return n;
}

// Longest run of consecutive calendar days (ending anytime in the last year)
// for which `predicate(dateKey)` holds. Used for the "7 in a row" achievements.
function maxConsecutive(predicate) {
  let best = 0;
  let run = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const key = format(subDays(today, i), 'yyyy-MM-dd');
    if (predicate(key)) {
      run += 1;
      if (run > best) best = run;
    } else {
      run = 0;
    }
  }
  return best;
}

/**
 * Evaluates every achievement against the user's data. Returns an array of
 * achievement definitions decorated with { unlocked, current, goal, progress }
 * so the UI can show earned badges and progress toward locked ones.
 *
 * Deliberately derives everything from data already in the stores — no new
 * persistence, so a user's badges are always consistent with their real log.
 */
export function evaluateAchievements({
  ledger = {},
  fullDB = {},
  targetCals = 0,
  targetProtein = 0,
  weightLog = {},
  waterLog = {},
  waterTarget = 8,
  initialWeight = 0,
  streak = 0,
}) {
  const foodEntries = countFoodEntries(ledger);
  const weighIns = Object.keys(weightLog).length;

  const weightDates = Object.keys(weightLog).sort((a, b) => new Date(a) - new Date(b));
  const latestWeight = weightDates.length ? weightLog[weightDates[weightDates.length - 1]] : initialWeight;
  const kgLost = initialWeight && latestWeight ? Math.max(0, initialWeight - latestWeight) : 0;

  const dayCals = (key) => {
    const rec = ledger[key];
    if (!rec?.meals) return null;
    return calculateConsumption(rec.meals, fullDB);
  };

  // Longest streaks of specific per-day conditions.
  const perfectRun = targetCals > 0
    ? maxConsecutive((key) => {
        const c = dayCals(key);
        if (!c || c.cals <= 0) return false;
        const pct = (c.cals / targetCals) * 100;
        return pct >= 90 && pct <= 110;
      })
    : 0;

  const proteinRun = targetProtein > 0
    ? maxConsecutive((key) => {
        const c = dayCals(key);
        return !!c && (c.macros?.p || 0) >= targetProtein;
      })
    : 0;

  const hydrationRun = waterTarget > 0
    ? maxConsecutive((key) => (waterLog[key]?.glasses || 0) >= waterTarget)
    : 0;

  const perfectDayExists = perfectRun >= 1;

  // Map each achievement id to [current, goal] so unlocked + progress derive
  // uniformly. `streak` is passed in (already computed elsewhere).
  const m = {
    streak_3: [streak, 3], streak_7: [streak, 7], streak_14: [streak, 14],
    streak_30: [streak, 30], streak_60: [streak, 60], streak_90: [streak, 90],
    streak_365: [streak, 365],
    first_log: [foodEntries, 1], meals_50: [foodEntries, 50],
    meals_200: [foodEntries, 200], meals_500: [foodEntries, 500],
    first_weigh: [weighIns, 1], lost_2kg: [kgLost, 2], lost_5kg: [kgLost, 5], lost_10kg: [kgLost, 10],
    perfect_day: [perfectDayExists ? 1 : 0, 1],
    perfect_week: [perfectRun, 7],
    protein_champ: [proteinRun, 7],
    hydration_hero: [hydrationRun, 7],
  };

  return Object.values(ACHIEVEMENTS).map((def) => {
    const [current, goal] = m[def.id] || [0, 1];
    return {
      ...def,
      current,
      goal,
      unlocked: current >= goal,
      progress: Math.max(0, Math.min(1, goal > 0 ? current / goal : 0)),
    };
  });
}
