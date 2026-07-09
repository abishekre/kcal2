import { format, subDays } from 'date-fns';
import {
  BMR_WEIGHT_COEF,
  BMR_HEIGHT_COEF,
  BMR_AGE_COEF,
  BMR_MALE_OFFSET,
  BMR_FEMALE_OFFSET,
  KCAL_PER_KG_FAT,
  ACTIVITY_MULTIPLIERS,
  PROTEIN_PER_KG,
  MACRO_SPLITS,
  GOAL_CALORIE_ADJUSTMENTS,
  PROTEIN_KCAL_PER_G,
  CARB_KCAL_PER_G,
  FAT_KCAL_PER_G,
  MAX_PROJECTION_WEEKS,
  METABOLIC_ADAPTATION_PER_KG,
  MIN_WEEKLY_CHANGE_KG,
  STREAK_FREEZES,
  VALIDATION,
  WATER_GLASS_ML,
} from '../utils/constants';
import { validateWeight, validateHeight, validateAge } from '../utils/validation';

// ── Activity levels (UI config with labels, descriptions, and emojis) ──
export const ACTIVITY_LEVELS = {
  sedentary: { label: 'Sedentary', desc: 'Desk job, little exercise', multiplier: ACTIVITY_MULTIPLIERS.sedentary, emoji: '🪑' },
  light: { label: 'Light', desc: 'Exercise 1-3 days/week', multiplier: ACTIVITY_MULTIPLIERS.light, emoji: '🚶' },
  moderate: { label: 'Moderate', desc: 'Exercise 3-5 days/week', multiplier: ACTIVITY_MULTIPLIERS.moderate, emoji: '🏃' },
  heavy: { label: 'Heavy', desc: 'Exercise 6-7 days/week', multiplier: ACTIVITY_MULTIPLIERS.active, emoji: '🏋️' },
  athlete: { label: 'Athlete', desc: '2x training / physical job', multiplier: ACTIVITY_MULTIPLIERS.very_active, emoji: '⚡' },
};

// ── Goal configurations (UI config with labels, colors, protein targets) ──
export const GOAL_CONFIGS = {
  cut: { label: 'Cut', emoji: '🔥', desc: 'Lose fat, preserve muscle', color: 'rose', calorieAdjustment: GOAL_CALORIE_ADJUSTMENTS.cut, proteinPerKg: PROTEIN_PER_KG.cut },
  recomp: { label: 'Recomp', emoji: '🔄', desc: 'Lose fat & build muscle', color: 'violet', calorieAdjustment: GOAL_CALORIE_ADJUSTMENTS.recomp, proteinPerKg: PROTEIN_PER_KG.recomp },
  bulk: { label: 'Lean Bulk', emoji: '💪', desc: 'Build muscle with minimal fat', color: 'blue', calorieAdjustment: GOAL_CALORIE_ADJUSTMENTS.bulk, proteinPerKg: PROTEIN_PER_KG.bulk },
  maintain: { label: 'Maintain', emoji: '⚖️', desc: 'Stay at current weight', color: 'emerald', calorieAdjustment: GOAL_CALORIE_ADJUSTMENTS.maintain, proteinPerKg: PROTEIN_PER_KG.maintain },
};

// ── Thresholds for health status classification ──
const MIN_CALS_FEMALE = 1200;
const MIN_CALS_MALE = 1500;
const DANGEROUSLY_LOW_CALS = 800;
const DANGEROUS_WEEKLY_CHANGE = 1;    // kg per week
const AGGRESSIVE_WEEKLY_CHANGE = 0.75;
const MODERATE_WEEKLY_CHANGE = 0.25;
const PROTEIN_MAX_PCT_OF_TOTAL = 0.4; // warn if protein exceeds 40% of total calories

/**
 * Calculates Basal Metabolic Rate (BMR) using the Mifflin-St Jeor equation.
 * Recognized by the Academy of Nutrition and Dietetics as the most reliable predictive equation.
 * Reference: Mifflin, M. D., et al. (1990). "A new predictive equation for resting energy expenditure in healthy individuals".
 * The American Journal of Clinical Nutrition. DOI: 10.1093/ajcn/51.2.241
 *
 * @param {string} gender - 'male', 'female', 'other', or 'nonbinary'
 * @param {number} weight - Body weight in kg
 * @param {number} height - Height in cm
 * @param {number} age - Age in years
 * @returns {number} BMR in kcal/day
 */
export function calculateBMR(gender, weight, height, age) {
  // Input validation — clamp to safe ranges
  const w = validateWeight(weight);
  const h = validateHeight(height);
  const a = validateAge(age);

  const safeWeight = w.valid ? w.value : VALIDATION.weight.min;
  const safeHeight = h.valid ? h.value : VALIDATION.height.min;
  const safeAge = a.valid ? a.value : VALIDATION.age.min;

  const base = (BMR_WEIGHT_COEF * safeWeight) + (BMR_HEIGHT_COEF * safeHeight) - (BMR_AGE_COEF * safeAge);

  if (gender === 'male') {
    return base + BMR_MALE_OFFSET;
  }
  if (gender === 'female') {
    return base + BMR_FEMALE_OFFSET;
  }
  // 'other' / 'nonbinary' — the source study only defines male/female
  // offsets, so this averages the two as a reasonable approximation, not a
  // value derived from the original research. Flagged as such in ScienceSheet.
  return base + (BMR_MALE_OFFSET + BMR_FEMALE_OFFSET) / 2;
}

/**
 * Calculates Total Daily Energy Expenditure (TDEE) from BMR and activity level.
 *
 * @param {number} bmr - Basal Metabolic Rate in kcal/day
 * @param {string} activityLevel - Key from ACTIVITY_LEVELS or ACTIVITY_MULTIPLIERS
 * @returns {number} TDEE in kcal/day (rounded)
 */
export function calculateTDEE(bmr, activityLevel) {
  // Look up multiplier from ACTIVITY_LEVELS first (UI keys), then ACTIVITY_MULTIPLIERS (constant keys)
  const multiplier =
    ACTIVITY_LEVELS[activityLevel]?.multiplier ||
    ACTIVITY_MULTIPLIERS[activityLevel] ||
    ACTIVITY_MULTIPLIERS.sedentary;
  return Math.round(bmr * multiplier);
}

/**
 * Calculates Target Calories and Macronutrients based on user profile and goal.
 * Protein multipliers range from 1.8g to 2.2g per kg of body weight based on current sports nutrition guidelines.
 * References:
 * - Helms, E. R., et al. (2014). "Evidence-based recommendations for natural bodybuilding contest preparation". JISSN. DOI: 10.1186/1550-2783-11-20
 * - Morton, R. W., et al. (2018). "A systematic review, meta-analysis and meta-regression of the effect of protein supplementation...". BJSM. DOI: 10.1136/bjsports-2017-097608
 *
 * @param {object} profile - { gender, weight, height, age }
 * @param {string} goal - 'cut', 'bulk', 'maintain', or 'recomp'
 * @param {string} activityLevel - Activity level key
 * @returns {object} { bmr, tdee, targetCals, macros: { p, c, f }, weeklyChange, proteinWarning, status }
 */
export function calculateGoalCalories(profile, goal, activityLevel) {
  const bmr = calculateBMR(profile.gender, profile.weight, profile.height, profile.age);
  const tdee = calculateTDEE(bmr, activityLevel);
  const config = GOAL_CONFIGS[goal] || GOAL_CONFIGS.maintain;

  // Apply calorie adjustment from constants — a percentage of TDEE (-20%
  // cut, -10% recomp, +10% bulk, 0% maintain), so the deficit/surplus
  // scales with the person's own energy expenditure rather than being the
  // same flat number for everyone.
  const targetCals = Math.max(0, Math.round(tdee * (1 + config.calorieAdjustment)));

  // Protein based on body weight and goal-specific multiplier
  const proteinPerKg = config.proteinPerKg || PROTEIN_PER_KG.maintain;
  const protein = Math.round(profile.weight * proteinPerKg);
  const proteinCals = protein * PROTEIN_KCAL_PER_G;

  // Warn if protein exceeds 40% of total calories
  let proteinWarning = null;
  if (targetCals > 0 && proteinCals / targetCals > PROTEIN_MAX_PCT_OF_TOTAL) {
    proteinWarning = `Protein (${protein}g = ${proteinCals} kcal) exceeds 40% of your ${targetCals} kcal target. Consider adjusting.`;
  }

  const remainingCals = Math.max(0, targetCals - proteinCals);

  // Macro split from constants — carbs and fat ratios of remaining calories after protein
  const split = MACRO_SPLITS[goal] || MACRO_SPLITS.maintain;
  const carbsCals = remainingCals * split.carbs;
  const fatCals = remainingCals * split.fat;

  const carbs = Math.max(0, Math.round(carbsCals / CARB_KCAL_PER_G));
  const fat = Math.max(0, Math.round(fatCals / FAT_KCAL_PER_G));

  // Weekly weight change estimate: (surplus or deficit * 7 days) / kcal per kg of fat
  const weeklyChange = KCAL_PER_KG_FAT > 0
    ? ((targetCals - tdee) * 7) / KCAL_PER_KG_FAT
    : 0;

  return {
    bmr: Math.round(bmr),
    tdee,
    targetCals,
    macros: { p: protein, c: carbs, f: fat },
    weeklyChange: Number(weeklyChange.toFixed(2)),
    proteinWarning,
    status: getHealthStatus(targetCals, weeklyChange, profile.gender),
  };
}

/**
 * Calculates total consumption from meals and the food database.
 * Guards against undefined food entries in fullDB.
 * Hint: for repeated calls with the same meals, consider memoizing results by meal hash.
 *
 * @param {object} meals - { mealKey: { foodId: qty, ... }, ... }
 * @param {object} fullDB - Food database keyed by foodId
 * @returns {object} { cals, macros: { p, c, f }, categories, mealCals }
 */
export function calculateConsumption(meals, fullDB) {
  let cals = 0, p = 0, c = 0, f = 0, a = 0;
  const categories = {};
  const mealCals = {};

  Object.entries(meals || {}).forEach(([mealKey, meal]) => {
    mealCals[mealKey] = 0;
    Object.entries(meal || {}).forEach(([foodId, qty]) => {
      // Guard: skip if food not found in database
      const food = fullDB?.[foodId];
      if (!food || qty <= 0) return;

      let multiplier = qty;
      if (food.unit === 'g' || food.unit === 'ml') {
        multiplier = qty / 100;
      }

      const itemCals = (food.cals || 0) * multiplier;
      cals += itemCals;
      p += (food.p || 0) * multiplier;
      c += (food.c || 0) * multiplier;
      f += (food.f || 0) * multiplier;
      a += (food.a || 0) * multiplier; // alcohol grams, where present

      mealCals[mealKey] += itemCals;

      const cat = food.category || 'other';
      categories[cat] = (categories[cat] || 0) + itemCals;
    });
  });

  return {
    cals: Math.round(cals),
    macros: {
      p: Math.round(p),
      c: Math.round(c),
      f: Math.round(f),
      a: Math.round(a),
    },
    categories,
    mealCals,
  };
}

/**
 * Projects a timeline to reach a target weight, accounting for metabolic adaptation.
 * BMR decreases by METABOLIC_ADAPTATION_PER_KG for each kg lost.
 * Capped at MAX_PROJECTION_WEEKS to avoid runaway calculations.
 *
 * @param {number} currentWeight - Current body weight in kg
 * @param {number} targetWeight - Target body weight in kg
 * @param {number} weeklyChange - Estimated weekly weight change in kg (negative = losing)
 * @returns {object} { weeks, date, feasibility, adaptedWeeklyChange }
 */
export function projectTimeline(currentWeight, targetWeight, weeklyChange) {
  // Edge case: already at target
  if (Math.abs(currentWeight - targetWeight) < MIN_WEEKLY_CHANGE_KG) {
    return { weeks: 0, date: new Date(), feasibility: 'achievable', adaptedWeeklyChange: 0 };
  }

  // Edge case: weeklyChange near zero — would take infinite time
  if (Math.abs(weeklyChange) < MIN_WEEKLY_CHANGE_KG) {
    return { weeks: Infinity, date: null, feasibility: 'unrealistic', adaptedWeeklyChange: 0 };
  }

  const diff = targetWeight - currentWeight;
  const isCorrectDirection = (diff > 0 && weeklyChange > 0) || (diff < 0 && weeklyChange < 0);

  if (!isCorrectDirection) {
    return { weeks: Infinity, date: null, feasibility: 'unrealistic', adaptedWeeklyChange: weeklyChange };
  }

  // Simulate week-by-week with metabolic adaptation
  let weight = currentWeight;
  let weeks = 0;
  let currentWeeklyChange = weeklyChange;

  while (weeks < MAX_PROJECTION_WEEKS) {
    // Check if we've reached or passed the target
    if ((weeklyChange < 0 && weight <= targetWeight) || (weeklyChange > 0 && weight >= targetWeight)) {
      break;
    }

    // Apply metabolic adaptation: BMR drops by METABOLIC_ADAPTATION_PER_KG per kg lost
    const kgLost = currentWeight - weight; // positive when losing
    if (kgLost > 0 && weeklyChange < 0) {
      // Adaptation reduces the deficit (makes weeklyChange less negative)
      const adaptationKcalPerWeek = kgLost * METABOLIC_ADAPTATION_PER_KG * 7;
      const adaptedDeficitPerWeek = Math.abs(weeklyChange) * KCAL_PER_KG_FAT - adaptationKcalPerWeek;

      if (adaptedDeficitPerWeek <= 0) {
        // Adaptation has eliminated the deficit — can't progress further
        return { weeks, date: null, feasibility: 'plateau', adaptedWeeklyChange: 0 };
      }
      currentWeeklyChange = -(adaptedDeficitPerWeek / KCAL_PER_KG_FAT);
    }

    weight += currentWeeklyChange;
    weeks++;
  }

  // Cap check
  if (weeks >= MAX_PROJECTION_WEEKS) {
    return { weeks: MAX_PROJECTION_WEEKS, date: null, feasibility: 'unrealistic', adaptedWeeklyChange: currentWeeklyChange };
  }

  const date = new Date();
  date.setDate(date.getDate() + (weeks * 7));

  let feasibility = 'achievable';
  if (Math.abs(weeklyChange) > DANGEROUS_WEEKLY_CHANGE) feasibility = 'unrealistic';
  else if (Math.abs(weeklyChange) > AGGRESSIVE_WEEKLY_CHANGE) feasibility = 'challenging';

  return {
    weeks: Math.round(weeks),
    date,
    feasibility,
    adaptedWeeklyChange: Number(currentWeeklyChange.toFixed(3)),
  };
}

/**
 * Classifies the health status of a calorie target and rate of change.
 * Returns 'dangerouslyLow' if calories are below 800 (safety guard).
 *
 * @param {number} targetCals - Target daily calories
 * @param {number} weeklyChange - Weekly weight change in kg
 * @param {string} gender - 'male', 'female', 'other', or 'nonbinary'
 * @returns {string} 'dangerouslyLow' | 'dangerous' | 'aggressive' | 'moderate' | 'optimal'
 */
export function getHealthStatus(targetCals, weeklyChange, gender) {
  if (targetCals < DANGEROUSLY_LOW_CALS) return 'dangerouslyLow';

  const minCals = gender === 'female' ? MIN_CALS_FEMALE : MIN_CALS_MALE;
  if (targetCals < minCals || Math.abs(weeklyChange) > DANGEROUS_WEEKLY_CHANGE) return 'dangerous';
  if (Math.abs(weeklyChange) > AGGRESSIVE_WEEKLY_CHANGE) return 'aggressive';
  if (Math.abs(weeklyChange) > MODERATE_WEEKLY_CHANGE) return 'moderate';
  return 'optimal';
}

/**
 * Human-facing copy for each health status. `null` entries (moderate/optimal)
 * are healthy and render no warning. Used to surface safety guidance wherever
 * a target is shown, so a dangerous plan is never presented silently.
 * `severity` drives the UI color: 'danger' (red) vs 'warn' (amber).
 */
export const HEALTH_STATUS_INFO = {
  dangerouslyLow: {
    severity: 'danger',
    title: 'This target is too low to be safe',
    message: 'Under ~800 kcal/day is not safe without medical supervision. Please pick a gentler goal or a higher target weight — slow and steady protects your health and your results.',
  },
  dangerous: {
    severity: 'danger',
    title: 'This pace may be unsafe',
    message: 'This target is below the recommended daily minimum or implies very fast weight change. Easing off protects lean muscle and is far more sustainable.',
  },
  aggressive: {
    severity: 'warn',
    title: 'That’s an aggressive pace',
    message: 'This works short-term, but a more moderate rate is easier to stick with and better preserves muscle. Consider a smaller deficit.',
  },
  moderate: null,
  optimal: null,
};

/**
 * Recommends a daily water intake in glasses, scaled to body weight
 * (~35ml/kg, a common general guideline) instead of a flat number for
 * everyone. This is still a general default, not a personalized clinical
 * target — actual needs vary with activity, climate, and health status.
 *
 * @param {number} weightKg - Body weight in kg
 * @returns {number} Recommended glasses per day
 */
export function getRecommendedWaterGlasses(weightKg) {
  const safeWeight = weightKg && weightKg > 0 ? weightKg : VALIDATION.weight.min;
  const ml = safeWeight * 35;
  const glasses = Math.round(ml / WATER_GLASS_ML);
  return Math.min(VALIDATION.waterGlassesMax, Math.max(4, glasses));
}

/**
 * True once a day has any food logged (any meal, any positive quantity).
 * This is what makes a day "count" for streaks and adherence — no manual
 * commit/lock required. Locking a day is still available as an optional way
 * to finalize it, but it no longer gates any of the reward surfaces.
 *
 * @param {object} record - A ledger day record { meals: { mealKey: { foodId: qty } } }
 * @returns {boolean}
 */
export function hasLoggedFood(record) {
  if (!record?.meals) return false;
  return Object.values(record.meals).some(
    (meal) => meal && Object.values(meal).some((qty) => qty > 0)
  );
}

/**
 * Calculates the current streak of on-target days from the ledger.
 *
 * A day extends the streak once food is logged that day AND intake stayed
 * on/under target — the user never has to "commit" a day for it to count.
 * Today is treated as ongoing: it's counted the moment it qualifies, but an
 * empty or over-target today never *breaks* the run (the day isn't over yet).
 * O(n) — stops at the first gap.
 *
 * @param {object} ledger - { dateKey: { locked, meals, ... }, ... }
 * @param {object} fullDB - Food database
 * @param {number} targetCals - Daily calorie target
 * @returns {number} Current streak length in days
 */
export function getStreak(ledger, fullDB, targetCals, maxFreezes = STREAK_FREEZES) {
  if (!targetCals || targetCals <= 0) return 0;

  let streak = 0;
  let freezes = maxFreezes;
  const today = new Date();
  const maxLookback = 365;

  for (let i = 0; i < maxLookback; i++) {
    const key = format(subDays(today, i), 'yyyy-MM-dd');
    const record = ledger[key];
    const onTargetLoggedDay =
      hasLoggedFood(record) &&
      calculateConsumption(record.meals, fullDB).cals <= targetCals;

    if (i === 0) {
      // Today is still in progress — count it if it already qualifies, but
      // don't let an empty/over-target today break the streak.
      if (onTargetLoggedDay) streak++;
      continue;
    }

    if (onTargetLoggedDay) {
      streak++;
    } else if (freezes > 0) {
      // Streak freeze: forgive a single slipped day (missed or over target)
      // so one bad day doesn't erase weeks of progress and trigger the
      // "I broke it, why bother" spiral. A frozen day doesn't add to the
      // count — it just bridges the gap.
      freezes -= 1;
    } else {
      break;
    }
  }

  return streak;
}
