/**
 * Generates a contextual insight message based on current consumption, targets, and user behavior.
 * Includes safety guards for eating disorders — auto-switches to 'normal' mode if cals < 500 in 'bad' mode.
 *
 * @param {object} consumption - { cals, macros: { p, c, f }, categories, mealCals }
 * @param {object} target - { cals, macros: { p, c, f } }
 * @param {string} goal - 'cut', 'bulk', 'maintain', or 'recomp'
 * @param {number} streak - Current streak count
 * @param {string} mode - 'good', 'normal', or 'bad'
 * @returns {{ text: string }} Insight message
 */
export function generateInsight(consumption, target, goal, streak, mode = 'good') {
  const cals = consumption?.cals || 0;
  const targetCals = target?.cals || 0;
  const protein = consumption?.macros?.p || 0;
  const targetP = target?.macros?.p || target?.p || 100;

  // Safety guard: if targetCals is 0 or missing, return a generic message
  if (!targetCals || targetCals <= 0) {
    return { text: "Set up your profile and goals to get personalized insights." };
  }

  // Eating disorder safety: in 'bad' mode, if cals < 500, auto-switch to 'normal'
  let safeMode = mode;
  if (safeMode === 'bad' && cals < 500 && cals > 0) {
    safeMode = 'normal';
  }

  const remaining = targetCals - cals;
  const pctConsumed = (cals / targetCals) * 100;
  const proteinDeficit = targetP - protein;
  const hour = new Date().getHours();

  const categories = consumption?.categories || {};
  const mealCals = consumption?.mealCals || {};

  // Helpers
  const getCatRatio = (catName) => (categories[catName] || 0) / (cals || 1);

  const getMsg = (good, normal, bad) => {
    if (safeMode === 'bad') return { text: bad || normal || good };
    if (safeMode === 'good') return { text: good || normal };
    return { text: normal || good };
  };

  // 1. Time & Empty states
  if (cals === 0) {
    if (hour < 10) return getMsg(
      "Start your day right. A protein-rich breakfast sets the metabolic tone.",
      "Breakfast window is open. Awaiting initial logs.",
      "Empty log, big talk. Eat something and prove you're serious."
    );
    if (hour >= 10 && hour < 14) return getMsg(
      "Half the day is gone and you haven't logged. Don't fall into the trap of guessing later.",
      "No data received by midday.",
      "Noon and still nothing? You're not fasting, you're procrastinating."
    );
    // Under-eating detection: late in the day with zero calories
    if (hour >= 18) return getMsg(
      "Fasting today? Make sure you hydrate!",
      "Zero calories recorded. Day is almost over.",
      "It's late and nothing is logged. Please make sure you're eating enough today."
    );
    return getMsg(
      "Fasting today? Make sure you hydrate!",
      "Zero calories recorded. Day is almost over.",
      "No food logged yet. Make sure to fuel your body properly."
    );
  }

  // Under-eating detection: cals < 800 and evening — warn about eating too little
  if (cals < 800 && hour >= 18) {
    return getMsg(
      `Only ${cals} kcal logged today and it's evening. Make sure you're eating enough to support your health.`,
      `Very low intake detected (${cals} kcal). Consider eating a proper meal.`,
      `${cals} kcal is very low for a full day. Your body needs adequate fuel — please eat a proper meal.`
    );
  }

  // 2. Critical macro imbalances (highly personalized)
  const sweetsRatio = getCatRatio('sweets');
  if (sweetsRatio > 0.3) {
    return getMsg(
      `Enjoyed the treats! Just be mindful of an energy dip later since ${Math.round(sweetsRatio * 100)}% of your fuel is sugar.`,
      `Over ${Math.round(sweetsRatio * 100)}% of calories derived from sweets.`,
      `${Math.round(sweetsRatio * 100)}% of today's calories are literally sugar. Enjoy the crash you're scheduling.`
    );
  }

  const fastFoodRatio = getCatRatio('fastfood');
  if (fastFoodRatio > 0.4) {
    return getMsg(
      "Treated yourself to some takeout! Drink extra water today to balance the sodium.",
      "High fast food ratio detected. Sodium levels elevated.",
      "A drive-thru is not a meal prep strategy. The scale will remind you tomorrow."
    );
  }

  const fitnessRatio = getCatRatio('fitness'); // supplements, whey, etc
  if (fitnessRatio > 0.4) {
    return getMsg(
      "Getting that easy protein in! Try to get some whole foods later for better digestion.",
      "Supplement dependency high today.",
      "Shakes aren't food. Chew a real meal before your stomach forgets how."
    );
  }

  // 3. Timing / Backloading analysis
  // Sum everything *except* the late-day slots, rather than hardcoding
  // 'morning'/'lunch' by name — so this still works for a user who renamed
  // or removed those default slots but kept 'eve'/'dinner'.
  const lateSlotCals = (mealCals['eve'] || 0) + (mealCals['dinner'] || 0);
  const firstHalfCals = Math.max(0, cals - lateSlotCals);
  if (hour >= 18 && firstHalfCals === 0 && cals > 0) {
    return getMsg(
      "Backloading calories today! Make sure you don't go to bed feeling too full.",
      "All calories consumed in the evening window.",
      "Every calorie crammed into the evening. Great plan, if the goal is to sleep bloated."
    );
  }

  if (hour < 14 && pctConsumed > 80) {
    return getMsg(
      "You've eaten most of your food early! You'll need serious willpower tonight.",
      "80% budget exhausted before 14:00.",
      "80% gone before 2 PM. Hope you enjoy staring at an empty budget all night."
    );
  }

  // 4. Overages & Adherence
  if (pctConsumed > 110) {
    if (goal === 'cut') return getMsg(
      "You blew past your cutting target. Acknowledge it, log it, and reset tomorrow. No guilt!",
      "Surplus detected during cut phase.",
      "Blew the deficit. Don't you dare starve tomorrow to 'fix' it — just log clean and move on."
    );
    if (goal === 'recomp') return getMsg(
      "Over your recomp target today. A slight surplus can still support muscle growth if you trained.",
      "Surplus detected during recomp phase.",
      "Over on a recomp day. If you trained, fine. If you didn't, that was just eating. Recalibrate."
    );
    if (goal === 'maintain') return getMsg(
      "A bit over your maintenance level. One day won't move the needle — stay consistent!",
      "Daily calorie budget exceeded for maintenance.",
      "Over maintenance. Don't 'balance it out' by undereating tomorrow — just stop overshooting."
    );
    return getMsg(
      "Over target today. Tomorrow's a reset — not a reason to spiral into a binge.",
      "Daily calorie budget exceeded.",
      "Over target. It's not a catastrophe, but it's not nothing. Tighten up tomorrow."
    );
  }

  if (pctConsumed >= 95 && pctConsumed <= 105) {
    if (proteinDeficit <= 10) return getMsg(
      "Absolute perfection. Calories nailed, protein hit. This is how you change your body.",
      "Calories and protein precisely on target.",
      "Calories and protein both on point. Good. Now do it again — one day proves nothing."
    );
    return getMsg(
      "Right on your calorie target! Consistency like this is what drives real results.",
      "Calorie goal achieved.",
      "Calories nailed, protein slacking. Half a job. Hit the protein next time."
    );
  }

  // 5. Goal-specific & Protein advice
  if (goal === 'cut' && proteinDeficit > 40 && remaining > 300) {
    return getMsg(
      `You have calories left but are missing ${Math.round(proteinDeficit)}g of protein. Lean meats are your best friends right now.`,
      `Protein deficit of ${Math.round(proteinDeficit)}g detected.`,
      `${Math.round(proteinDeficit)}g short on protein with budget to spare. Eat the chicken, not the chips.`
    );
  }

  if (goal === 'bulk' && remaining > 500 && hour >= 19) {
    return getMsg(
      "You're leaving gains on the table! Eat those remaining calories if you want to grow.",
      "Large surplus required for bulk is unmet.",
      "You want to grow but won't finish your calories. Muscle doesn't build on good intentions. Eat."
    );
  }

  if (goal === 'recomp' && remaining > 200 && remaining <= 500 && hour >= 16) {
    return getMsg(
      "Recomp requires precision. You've got some room left — a protein-rich snack would be ideal.",
      "Recomp target not yet met.",
      "Recomp is precision work, and you're coasting. Hit a high-protein option and stop winging it."
    );
  }

  if (goal === 'maintain' && Math.abs(remaining) <= 50) {
    return getMsg(
      "Perfectly maintaining! Your consistency is keeping your weight stable.",
      "Maintenance target achieved with high precision.",
      "Dead on maintenance. Don't get smug — anyone can hold steady for one day."
    );
  }

  if (remaining < 200 && remaining > 0 && hour < 18) {
    return getMsg(
      `Only ${Math.round(remaining)} kcal left but it's early. Time to master the art of high-volume, low-calorie foods.`,
      `Low remaining budget (${Math.round(remaining)} kcal) early in the day.`,
      `Only ${Math.round(remaining)} kcal left and it's barely afternoon. Hope you like salad, because you spent recklessly.`
    );
  }

  if (pctConsumed >= 50 && pctConsumed < 80) {
    return getMsg(
      `${Math.round(remaining)} kcal left in the budget. Plan your remaining meals wisely!`,
      `Budget at ${Math.round(pctConsumed)}%.`,
      `${Math.round(remaining)} kcal left. Don't blow it all on one impulsive dinner.`
    );
  }

  // 6. Streak Milestones — scale to actual streak length
  if (streak && streak > 0) {
    if (streak >= 100 && streak % 100 === 0) {
      return getMsg(
        `${streak} days! You are in truly elite territory. This level of consistency changes lives!`,
        `Incredible milestone: ${streak} days tracked.`,
        `${streak} days. Elite territory. Don't let it go to your head and blow it.`
      );
    }
    if (streak >= 30 && streak % 30 === 0) {
      return getMsg(
        `${streak} days straight! Month after month, you keep showing up. Legendary!`,
        `Monthly milestone: ${streak} days tracked.`,
        `${streak} days. Impressive — for now. Streaks mean nothing the day you quit.`
      );
    }
    if (streak >= 7 && streak % 7 === 0) {
      return getMsg(
        `${streak} days straight of logging! This isn't just a diet anymore, it's your lifestyle!`,
        `Weekly milestone: ${streak} days tracked.`,
        `${streak} days. Cute number. Keep it boring — never miss.`
      );
    }
  }

  // 7. General positive reinforcement
  const meatRatio = getCatRatio('protein');
  if (meatRatio > 0.4) {
    return getMsg(
      "Solid protein foundation today. Carnivore style!",
      "Dietary source: predominantly meat.",
      "Loads of protein, zero greens. Your colon isn't a fan. Add fiber."
    );
  }

  const plantRatio = getCatRatio('vegetables') + getCatRatio('fruits');
  if (plantRatio > 0.2) {
    return getMsg(
      "Great micronutrient profile today. Keep eating those plants!",
      "Plant-based nutrient intake is optimal.",
      "Decent plants today. A rare display of competence. Keep it up."
    );
  }

  return getMsg(
    "Every entry builds the habit. Trust the data, trust the process.",
    "Data logging is active and proceeding normally.",
    "Log it or lie to yourself — those are the options. The scale keeps its own records."
  );
}
