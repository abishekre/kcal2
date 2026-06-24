export const ACTIVITY_LEVELS = {
  sedentary: { label: 'Sedentary', desc: 'Desk job, little exercise', multiplier: 1.2, emoji: '🪑' },
  light: { label: 'Light', desc: 'Exercise 1-3 days/week', multiplier: 1.375, emoji: '🚶' },
  moderate: { label: 'Moderate', desc: 'Exercise 3-5 days/week', multiplier: 1.55, emoji: '🏃' },
  heavy: { label: 'Heavy', desc: 'Exercise 6-7 days/week', multiplier: 1.725, emoji: '🏋️' },
  athlete: { label: 'Athlete', desc: '2x training / physical job', multiplier: 1.9, emoji: '⚡' },
};

export const GOAL_CONFIGS = {
  cut: { label: 'Cut', emoji: '🔥', desc: 'Lose fat, preserve muscle', color: 'rose', calorieMultiplier: 0.80, proteinPerKg: 2.2 },
  recomp: { label: 'Recomp', emoji: '🔄', desc: 'Lose fat & build muscle', color: 'violet', calorieMultiplier: 0.90, proteinPerKg: 2.0 },
  bulk: { label: 'Lean Bulk', emoji: '💪', desc: 'Build muscle with minimal fat', color: 'blue', calorieMultiplier: 1.10, proteinPerKg: 1.8 },
  maintain: { label: 'Maintain', emoji: '⚖️', desc: 'Stay at current weight', color: 'emerald', calorieMultiplier: 1.0, proteinPerKg: 1.6 },
};

/**
 * Calculates Basal Metabolic Rate (BMR) using the Mifflin-St Jeor equation.
 * Recognized by the Academy of Nutrition and Dietetics as the most reliable predictive equation.
 * Reference: Mifflin, M. D., et al. (1990). "A new predictive equation for resting energy expenditure in healthy individuals".
 * The American Journal of Clinical Nutrition. DOI: 10.1093/ajcn/51.2.241
 */
export function calculateBMR(gender, weight, height, age) {
  if (gender === 'male') {
    return (10 * weight) + (6.25 * height) - (5 * age) + 5;
  }
  return (10 * weight) + (6.25 * height) - (5 * age) - 161;
}

export function calculateTDEE(bmr, activityLevel) {
  const multiplier = ACTIVITY_LEVELS[activityLevel]?.multiplier || 1.2;
  return Math.round(bmr * multiplier);
}

/**
 * Calculates Target Calories and Macronutrients based on user profile and goal.
 * Protein multipliers range from 1.6g to 2.2g per kg of body weight based on current sports nutrition guidelines.
 * References: 
 * - Helms, E. R., et al. (2014). "Evidence-based recommendations for natural bodybuilding contest preparation". JISSN. DOI: 10.1186/1550-2783-11-20
 * - Morton, R. W., et al. (2018). "A systematic review, meta-analysis and meta-regression of the effect of protein supplementation...". BJSM. DOI: 10.1136/bjsports-2017-097608
 */
export function calculateGoalCalories(profile, goal, activityLevel) {
  const bmr = calculateBMR(profile.gender, profile.weight, profile.height, profile.age);
  const tdee = calculateTDEE(bmr, activityLevel);
  const config = GOAL_CONFIGS[goal] || GOAL_CONFIGS.maintain;
  const targetCals = Math.round(tdee * config.calorieMultiplier);
  
  const protein = Math.round(profile.weight * config.proteinPerKg);
  const proteinCals = protein * 4;
  const remainingCals = Math.max(0, targetCals - proteinCals);
  
  let carbsCals;
  let fatCals;
  
  if (goal === 'cut') {
    carbsCals = remainingCals * 0.60;
    fatCals = remainingCals * 0.40;
  } else if (goal === 'bulk') {
    carbsCals = remainingCals * 0.55;
    fatCals = remainingCals * 0.45;
  } else {
    carbsCals = remainingCals * 0.55;
    fatCals = remainingCals * 0.45;
  }
  
  const carbs = Math.max(0, Math.round(carbsCals / 4));
  const fat = Math.max(0, Math.round(fatCals / 9));
  
  const weeklyChange = ((targetCals - tdee) * 7) / 7700;

  return {
    bmr: Math.round(bmr),
    tdee,
    targetCals,
    macros: { p: protein, c: carbs, f: fat },
    weeklyChange: Number(weeklyChange.toFixed(2)),
    status: getHealthStatus(targetCals, weeklyChange, profile.gender)
  };
}

export function calculateConsumption(meals, fullDB) {
  let cals = 0, p = 0, c = 0, f = 0;
  const categories = {};
  const mealCals = {};
  
  Object.entries(meals || {}).forEach(([mealKey, meal]) => {
    mealCals[mealKey] = 0;
    Object.entries(meal || {}).forEach(([foodId, qty]) => {
      const food = fullDB[foodId];
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
      f: Math.round(f)
    },
    categories,
    mealCals
  };
}

export function projectTimeline(currentWeight, targetWeight, weeklyChange) {
  if (weeklyChange === 0) {
    if (currentWeight === targetWeight) {
      return { weeks: 0, date: new Date(), feasibility: 'achievable' };
    }
    return { weeks: Infinity, date: null, feasibility: 'unrealistic' };
  }
  
  const diff = targetWeight - currentWeight;
  const isCorrectDirection = (diff > 0 && weeklyChange > 0) || (diff < 0 && weeklyChange < 0);
  
  if (!isCorrectDirection) {
    return { weeks: Infinity, date: null, feasibility: 'unrealistic' };
  }
  
  const weeks = Math.abs(diff / weeklyChange);
  const date = new Date();
  date.setDate(date.getDate() + (weeks * 7));
  
  let feasibility = 'achievable';
  if (Math.abs(weeklyChange) > 1) feasibility = 'unrealistic';
  else if (Math.abs(weeklyChange) > 0.75) feasibility = 'challenging';
  
  return {
    weeks: Math.round(weeks),
    date,
    feasibility
  };
}

export function getHealthStatus(targetCals, weeklyChange, gender) {
  const minCals = gender === 'female' ? 1200 : 1500;
  if (targetCals < minCals || Math.abs(weeklyChange) > 1) return 'dangerous';
  if (Math.abs(weeklyChange) > 0.75) return 'aggressive';
  if (Math.abs(weeklyChange) > 0.25) return 'moderate';
  return 'optimal';
}

export function getStreak(ledger, fullDB, targetCals) {
  let streak = 0;
  const today = new Date();
  
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toLocaleDateString('en-CA');
    
    if (i === 0) {
      if (ledger[key]?.locked && calculateConsumption(ledger[key]?.meals, fullDB).cals <= targetCals) {
        streak++;
      }
      continue;
    }
    
    const record = ledger[key];
    if (record && record.locked) {
      const c = calculateConsumption(record.meals, fullDB);
      if (c.cals <= targetCals) {
        streak++;
      } else {
        break;
      }
    } else {
      break;
    }
  }
  return streak;
}
