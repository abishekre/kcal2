// ═══════════════════════════════════════════════════════════════════════════
// Input Validation — Centralized validators for all user inputs
// ═══════════════════════════════════════════════════════════════════════════
import { VALIDATION } from './constants';

/**
 * Clamp a numeric value to min/max bounds.
 * Returns { value, clamped, error } — `clamped` is true if the value was adjusted.
 */
export function clampValue(val, min, max) {
  const num = Number(val);
  if (isNaN(num)) return { value: min, clamped: true, error: 'Not a number' };
  if (num < min) return { value: min, clamped: true, error: `Minimum is ${min}` };
  if (num > max) return { value: max, clamped: true, error: `Maximum is ${max}` };
  return { value: num, clamped: false, error: null };
}

/** Validate weight in kg — returns { valid, value, error } */
export function validateWeight(val) {
  const num = Number(val);
  if (isNaN(num) || val === '' || val === null || val === undefined) {
    return { valid: false, value: null, error: 'Enter a valid weight' };
  }
  if (num < VALIDATION.weight.min) return { valid: false, value: num, error: `Weight must be at least ${VALIDATION.weight.min} kg` };
  if (num > VALIDATION.weight.max) return { valid: false, value: num, error: `Weight must be under ${VALIDATION.weight.max} kg` };
  return { valid: true, value: num, error: null };
}

/** Validate height in cm */
export function validateHeight(val) {
  const num = Number(val);
  if (isNaN(num) || val === '' || val === null || val === undefined) {
    return { valid: false, value: null, error: 'Enter a valid height' };
  }
  if (num < VALIDATION.height.min) return { valid: false, value: num, error: `Height must be at least ${VALIDATION.height.min} cm` };
  if (num > VALIDATION.height.max) return { valid: false, value: num, error: `Height must be under ${VALIDATION.height.max} cm` };
  return { valid: true, value: num, error: null };
}

/** Validate age in years */
export function validateAge(val) {
  const num = Number(val);
  if (isNaN(num) || val === '' || val === null || val === undefined) {
    return { valid: false, value: null, error: 'Enter a valid age' };
  }
  if (num < VALIDATION.age.min) return { valid: false, value: num, error: `Must be at least ${VALIDATION.age.min} years old` };
  if (num > VALIDATION.age.max) return { valid: false, value: num, error: `Must be under ${VALIDATION.age.max} years old` };
  return { valid: true, value: Math.floor(num), error: null };
}

/** Validate calorie value */
export function validateCalories(val) {
  const num = Number(val);
  if (isNaN(num) || val === '' || val === null || val === undefined) {
    return { valid: false, value: null, error: 'Enter a valid calorie value' };
  }
  if (num < VALIDATION.calories.min) return { valid: false, value: num, error: 'Calories must be positive' };
  if (num > VALIDATION.calories.max) return { valid: false, value: num, error: `Maximum is ${VALIDATION.calories.max} kcal` };
  return { valid: true, value: Math.round(num), error: null };
}

/** Validate macro gram value */
export function validateMacro(val) {
  const num = Number(val);
  if (isNaN(num) || val === '' || val === null || val === undefined) {
    return { valid: false, value: 0, error: null }; // Macros can be empty (defaults to 0)
  }
  if (num < VALIDATION.macroGrams.min) return { valid: false, value: 0, error: 'Cannot be negative' };
  if (num > VALIDATION.macroGrams.max) return { valid: false, value: num, error: `Maximum is ${VALIDATION.macroGrams.max}g` };
  return { valid: true, value: Math.round(num), error: null };
}

/** Validate serving quantity */
export function validateQty(val) {
  const num = Number(val);
  if (isNaN(num) || val === '' || val === null || val === undefined) {
    return { valid: false, value: 0, error: 'Enter a quantity' };
  }
  if (num < 0) return { valid: false, value: 0, error: 'Cannot be negative' };
  if (num > VALIDATION.servingQty.max) return { valid: false, value: VALIDATION.servingQty.max, error: `Maximum is ${VALIDATION.servingQty.max}` };
  return { valid: true, value: num, error: null };
}

/** Check weight change anomaly — returns warning message or null */
export function checkWeightAnomaly(newWeight, lastWeight) {
  if (!lastWeight || !newWeight) return null;
  const diff = Math.abs(newWeight - lastWeight);
  if (diff > 2) {
    return `That's ${diff.toFixed(1)} kg ${newWeight > lastWeight ? 'more' : 'less'} than your last weigh-in. Are you sure?`;
  }
  return null;
}

/** Validate goal/target weight consistency */
export function validateGoalTarget(goal, currentWeight, targetWeight) {
  if (goal === 'cut' && targetWeight >= currentWeight) {
    return { valid: false, error: 'Target weight must be less than current weight for a cut goal' };
  }
  if (goal === 'bulk' && targetWeight <= currentWeight) {
    return { valid: false, error: 'Target weight must be more than current weight for a bulk goal' };
  }
  return { valid: true, error: null };
}
