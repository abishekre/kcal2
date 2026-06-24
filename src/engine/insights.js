export function generateInsight(consumption, target, goal, streak, mode = 'good') {
  const cals = consumption?.cals || 0;
  const targetCals = target?.cals || 2000;
  const protein = consumption?.macros?.p || 0;
  const targetP = target?.macros?.p || target?.p || 100;
  
  const remaining = targetCals - cals;
  const pctConsumed = targetCals > 0 ? (cals / targetCals) * 100 : 0;
  const proteinDeficit = targetP - protein;
  const hour = new Date().getHours();

  const categories = consumption?.categories || {};
  const mealCals = consumption?.mealCals || {};
  
  // Helpers
  const getCatRatio = (catName) => (categories[catName] || 0) / (cals || 1);
  
  const getMsg = (good, normal, bad) => {
    if (mode === 'bad') return { text: bad || normal };
    if (mode === 'good') return { text: good || normal };
    return { text: normal };
  };

  // 1. Time & Empty states
  if (cals === 0) {
    if (hour < 10) return getMsg(
      "Start your day right. A protein-rich breakfast sets the metabolic tone.",
      "Breakfast window is open. Awaiting initial logs.",
      "Don't even think about skipping breakfast and complaining about hunger later."
    );
    if (hour >= 10 && hour < 14) return getMsg(
      "Half the day is gone and you haven't logged. Don't fall into the trap of guessing later.",
      "No data received by midday.",
      "No logs by noon? You're setting yourself up for an evening binge."
    );
    return getMsg(
      "Fasting today? Make sure you hydrate!",
      "Zero calories recorded. Day is almost over.",
      "Fasting? If not, you are playing a dangerous game with your macros right now."
    );
  }

  // 2. Critical macro imbalances (highly personalized)
  const sweetsRatio = getCatRatio('sweets');
  if (sweetsRatio > 0.3) {
    return getMsg(
      `Enjoyed the treats! Just be mindful of an energy dip later since ${Math.round(sweetsRatio * 100)}% of your fuel is sugar.`,
      `Over ${Math.round(sweetsRatio * 100)}% of calories derived from sweets.`,
      `Over ${Math.round(sweetsRatio * 100)}% of your calories are from sweets today. Expect a massive crash. Your pancreas hates you.`
    );
  }

  const fastFoodRatio = getCatRatio('fast_food');
  if (fastFoodRatio > 0.4) {
    return getMsg(
      "Treated yourself to some takeout! Drink extra water today to balance the sodium.",
      "High fast food ratio detected. Sodium levels elevated.",
      "Heavy on the fast food today. The scale is going to spike tomorrow from sodium retention. Stop poisoning yourself."
    );
  }

  const fitnessRatio = getCatRatio('fitness'); // supplements, whey, etc
  if (fitnessRatio > 0.4) {
    return getMsg(
      "Getting that easy protein in! Try to get some whole foods later for better digestion.",
      "Supplement dependency high today.",
      "You're living on powders and bars. Eat some actual solid food, you're not an astronaut."
    );
  }

  // 3. Timing / Backloading analysis
  const morningCals = (mealCals['morning'] || 0) + (mealCals['lunch'] || 0);
  if (hour >= 18 && morningCals === 0 && cals > 0) {
    return getMsg(
      "Backloading calories today! Make sure you don't go to bed feeling too full.",
      "All calories consumed in the evening window.",
      "You skipped the entire morning and are backloading all calories now. Your digestion is going to hate you."
    );
  }
  
  if (hour < 14 && pctConsumed > 80) {
    return getMsg(
      "You've eaten most of your food early! You'll need serious willpower tonight.",
      "80% budget exhausted before 14:00.",
      "You've burned through 80% of your calories before 2 PM. Tonight is going to be a miserable test of willpower."
    );
  }

  // 4. Overages & Adherence
  if (pctConsumed > 110) {
    if (goal === 'cut') return getMsg(
      "You blew past your cutting target. Acknowledge it, log it, and reset tomorrow. No guilt!",
      "Surplus detected during cut phase.",
      "You blew past your deficit. This is exactly why you aren't losing weight. Do better tomorrow."
    );
    return getMsg(
      "Over target today. Tomorrow's a reset — not a reason to spiral into a binge.",
      "Daily calorie budget exceeded.",
      "Over your target. Again. A complete lack of dietary discipline."
    );
  }

  if (pctConsumed >= 95 && pctConsumed <= 105) {
    if (proteinDeficit <= 10) return getMsg(
      "Absolute perfection. Calories nailed, protein hit. This is how you change your body.",
      "Calories and protein precisely on target.",
      "You actually hit your calories and protein perfectly. I'm genuinely shocked."
    );
    return getMsg(
      "Right on your calorie target! Consistency like this is what drives real results.",
      "Calorie goal achieved.",
      "You hit your calories, but missed the protein. Don't get sloppy."
    );
  }

  // 5. Goal-specific & Protein advice
  if (goal === 'cut' && proteinDeficit > 40 && remaining > 300) {
    return getMsg(
      `You have calories left but are missing ${Math.round(proteinDeficit)}g of protein. Lean meats are your best friends right now.`,
      `Protein deficit of ${Math.round(proteinDeficit)}g detected.`,
      `You have room for food but you're missing ${Math.round(proteinDeficit)}g of protein. Eat some chicken before you lose all your muscle.`
    );
  }

  if (goal === 'bulk' && remaining > 500 && hour >= 19) {
    return getMsg(
      "You're leaving gains on the table! Eat those remaining calories if you want to grow.",
      "Large surplus required for bulk is unmet.",
      "You're trying to bulk but skipping meals? Eat your food or stay small forever."
    );
  }

  if (remaining < 200 && remaining > 0 && hour < 18) {
    return getMsg(
      `Only ${Math.round(remaining)} kcal left but it's early. Time to master the art of high-volume, low-calorie foods.`,
      `Low remaining budget (${Math.round(remaining)} kcal) early in the day.`,
      `Only ${Math.round(remaining)} kcal left and the sun is still out. You're going to be starving tonight. Poor planning.`
    );
  }

  if (pctConsumed >= 50 && pctConsumed < 80) {
    return getMsg(
      `${Math.round(remaining)} kcal left in the budget. Plan your remaining meals wisely!`,
      `Budget at ${Math.round(pctConsumed)}%.`,
      `${Math.round(remaining)} kcal left. Don't blow it all on one stupid snack.`
    );
  }

  // 6. Streak Milestones
  if (streak && streak > 0 && streak % 7 === 0) {
    return getMsg(
      `${streak} days straight of logging! This isn't just a diet anymore, it's your lifestyle!`,
      `Weekly milestone: ${streak} days tracked.`,
      `${streak} days logged. Finally showing a shred of consistency.`
    );
  }

  // 7. General positive reinforcement
  const meatRatio = getCatRatio('meat') + getCatRatio('seafood') + getCatRatio('poultry');
  if (meatRatio > 0.4) {
    return getMsg(
      "Solid protein foundation today. Carnivore style!",
      "Dietary source: predominantly meat.",
      "Eating like a pure carnivore today. Hope your digestion can handle it."
    );
  }
  
  const plantRatio = getCatRatio('vegetables') + getCatRatio('fruits');
  if (plantRatio > 0.2) {
    return getMsg(
      "Great micronutrient profile today. Keep eating those plants!",
      "Plant-based nutrient intake is optimal.",
      "Actually eating your vegetables today. Look at you acting like an adult."
    );
  }

  return getMsg(
    "Every entry builds the habit. Trust the data, trust the process.",
    "Data logging is active and proceeding normally.",
    "Just keep logging. The math doesn't care about your feelings."
  );
}
