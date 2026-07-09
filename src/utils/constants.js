// ═══════════════════════════════════════════════════════════════════════════
// Constants — Single source of truth for all magic numbers and defaults
// ═══════════════════════════════════════════════════════════════════════════

// ── BMR (Mifflin-St Jeor) ──
export const BMR_WEIGHT_COEF = 10;
export const BMR_HEIGHT_COEF = 6.25;
export const BMR_AGE_COEF = 5;
export const BMR_MALE_OFFSET = 5;
export const BMR_FEMALE_OFFSET = -161;

// ── Energy ──
// Both of these are population-average approximations, not exact physical
// constants — see the "How this is approximated" note in ScienceSheet.
export const KCAL_PER_KG_FAT = 7700;
export const METABOLIC_ADAPTATION_PER_KG = 15; // kcal BMR drop per kg lost

// ── Macro calories per gram (Atwater factors) ──
export const PROTEIN_KCAL_PER_G = 4;
export const CARB_KCAL_PER_G = 4;
export const FAT_KCAL_PER_G = 9;
export const ALCOHOL_KCAL_PER_G = 7;

// ── Default macro targets (used as fallbacks when profile not loaded) ──
export const DEFAULT_MACRO_TARGETS = {
  p: 100, // protein g
  c: 200, // carbs g
  f: 60,  // fat g
};

// ── Activity level multipliers ──
export const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const ACTIVITY_LABELS = {
  sedentary: 'Sedentary (desk job)',
  light: 'Lightly Active (1-3 days/week)',
  moderate: 'Moderately Active (3-5 days/week)',
  active: 'Very Active (6-7 days/week)',
  very_active: 'Athlete (2x per day)',
};

// ── Protein per kg by goal ──
export const PROTEIN_PER_KG = {
  cut: 2.2,
  maintain: 1.8,
  recomp: 2.0,
  bulk: 1.8,
};

// ── Macro split ratios (carbs:fat of remaining cals after protein) ──
// Fat is kept in the ~25-30% of remaining-calories range cited in
// ScienceSheet, with carbs filling the rest.
export const MACRO_SPLITS = {
  cut: { carbs: 0.70, fat: 0.30 },
  maintain: { carbs: 0.72, fat: 0.28 },
  recomp: { carbs: 0.72, fat: 0.28 },
  bulk: { carbs: 0.75, fat: 0.25 },
};

// ── Calorie adjustments by goal ──
// Expressed as a percentage of TDEE (not a flat kcal offset) so the
// adjustment scales with body size — the same -20% cut is a very different
// absolute deficit for a 1,600 kcal TDEE than a 3,200 kcal one, which is
// exactly the point. Matches the percentages cited in ScienceSheet.
export const GOAL_CALORIE_ADJUSTMENTS = {
  cut: -0.20,
  maintain: 0,
  recomp: -0.10,
  bulk: 0.10,
};

// ── Validation ranges ──
export const VALIDATION = {
  age: { min: 13, max: 120 },
  height: { min: 100, max: 250 },       // cm
  weight: { min: 20, max: 350 },         // kg
  calories: { min: 1, max: 10000 },
  macroGrams: { min: 0, max: 1000 },
  servingQty: { min: 0, max: 9999 },
  foodNameMaxLength: 50,
  mealNameMaxLength: 30,
  waterGlassesMax: 30,
  waterMlMax: 10000,
};

// ── Streak milestones ──
export const STREAK_MILESTONES = [
  { min: 3,   label: '🔥 Spark',          icon: '⚡' },
  { min: 7,   label: '🔥 Week Warrior',   icon: '🗡️' },
  { min: 14,  label: '🔥 Fortnight',      icon: '💪' },
  { min: 21,  label: '🔥 Three Weeks',    icon: '🌟' },
  { min: 30,  label: '🔥 Monthly Master', icon: '👑' },
  { min: 60,  label: '🔥 Iron Will',      icon: '🏆' },
  { min: 90,  label: '🔥 Quarter Year',   icon: '💎' },
  { min: 180, label: '🔥 Half Year',      icon: '🌍' },
  { min: 365, label: '🔥 Legendary',      icon: '🐉' },
];

// ── Achievement definitions ──
export const ACHIEVEMENTS = {
  // Streak-based
  streak_3: { id: 'streak_3', title: 'First Spark', desc: 'Log 3 days in a row', icon: '⚡', category: 'streak' },
  streak_7: { id: 'streak_7', title: 'Week Warrior', desc: 'Log 7 days in a row', icon: '🗡️', category: 'streak' },
  streak_14: { id: 'streak_14', title: 'Fortnight Fighter', desc: 'Log 14 days in a row', icon: '🛡️', category: 'streak' },
  streak_30: { id: 'streak_30', title: 'Monthly Master', desc: 'Log 30 days in a row', icon: '👑', category: 'streak' },
  streak_60: { id: 'streak_60', title: 'Iron Will', desc: 'Log 60 days in a row', icon: '🏆', category: 'streak' },
  streak_90: { id: 'streak_90', title: 'Quarter Year', desc: 'Log 90 days in a row', icon: '💎', category: 'streak' },
  streak_365: { id: 'streak_365', title: 'Legendary', desc: 'Log every day for a year', icon: '🐉', category: 'streak' },

  // Logging milestones
  first_log: { id: 'first_log', title: 'First Bite', desc: 'Log your first meal', icon: '🍽️', category: 'logging' },
  meals_50: { id: 'meals_50', title: 'Getting the Hang', desc: 'Log 50 meals', icon: '📝', category: 'logging' },
  meals_200: { id: 'meals_200', title: 'Dedicated Tracker', desc: 'Log 200 meals', icon: '📊', category: 'logging' },
  meals_500: { id: 'meals_500', title: 'Master Logger', desc: 'Log 500 meals', icon: '🏅', category: 'logging' },

  // Weight milestones
  first_weigh: { id: 'first_weigh', title: 'Scale Buddy', desc: 'Log your first weigh-in', icon: '⚖️', category: 'weight' },
  lost_2kg: { id: 'lost_2kg', title: 'First Drop', desc: 'Lose 2 kg from start', icon: '📉', category: 'weight' },
  lost_5kg: { id: 'lost_5kg', title: 'Halfway Hero', desc: 'Lose 5 kg from start', icon: '🎯', category: 'weight' },
  lost_10kg: { id: 'lost_10kg', title: 'Transformation', desc: 'Lose 10 kg from start', icon: '🦋', category: 'weight' },

  // Consistency
  perfect_day: { id: 'perfect_day', title: 'Perfect Day', desc: 'Hit calorie target within 5%', icon: '✨', category: 'consistency' },
  perfect_week: { id: 'perfect_week', title: 'Perfect Week', desc: 'Hit target 7 days in a row', icon: '🌟', category: 'consistency' },
  protein_champ: { id: 'protein_champ', title: 'Protein Champion', desc: 'Hit protein target 7 days', icon: '💪', category: 'consistency' },
  hydration_hero: { id: 'hydration_hero', title: 'Hydration Hero', desc: 'Hit water target 7 days', icon: '💧', category: 'consistency' },
};

// ── Default meal configs ──
export const DEFAULT_MEALS = {
  morning: { label: 'Morning', emoji: '🌅', accent: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-100 dark:border-amber-500/20' },
  lunch:   { label: 'Lunch',   emoji: '☀️', accent: 'text-blue-500',  bg: 'bg-blue-50 dark:bg-blue-500/10',  border: 'border-blue-100 dark:border-blue-500/20' },
  eve:     { label: 'Evening', emoji: '🌤️', accent: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10', border: 'border-orange-100 dark:border-orange-500/20' },
  dinner:  { label: 'Dinner',  emoji: '🌙', accent: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10', border: 'border-indigo-100 dark:border-indigo-500/20' },
};

export const CUSTOM_MEAL_DEFAULTS = {
  accent: 'text-gray-500',
  bg: 'bg-gray-50 dark:bg-gray-500/10',
  border: 'border-gray-100 dark:border-gray-500/20',
};

// ── Water tracking ──
export const WATER_GLASS_ML = 250;
export const WATER_BOTTLE_ML = 500;
export const DEFAULT_WATER_TARGET = 8; // glasses per day

// ── Fasting protocols ──
export const FASTING_PROTOCOLS = {
  '16:8':  { fast: 16, eat: 8,  label: '16:8' },
  '18:6':  { fast: 18, eat: 6,  label: '18:6' },
  '20:4':  { fast: 20, eat: 4,  label: '20:4' },
  'OMAD':  { fast: 23, eat: 1,  label: 'OMAD' },
};

// ── Timeline / Projection caps ──
export const MAX_PROJECTION_WEEKS = 520; // 10 years
export const MIN_WEEKLY_CHANGE_KG = 0.01;

// ── Streak forgiveness ──
// How many slipped days the current streak can absorb before it breaks — one
// bad day shouldn't wipe out weeks of progress (retention + anti-restriction).
export const STREAK_FREEZES = 1;
