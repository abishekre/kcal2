// Deterministic random selection based on seed to prevent UI flickering
function getSeededRandom(seedString) {
  let h = 0;
  for (let i = 0; i < seedString.length; i++) {
    h = Math.imul(31, h) + seedString.charCodeAt(i) | 0;
  }
  // Convert to 0-1 range
  const t = h + 0x6D2B79F5;
  let t2 = Math.imul(t ^ t >>> 15, t | 1);
  t2 ^= t2 + Math.imul(t2 ^ t2 >>> 7, t2 | 61);
  const result = ((t2 ^ t2 >>> 14) >>> 0) / 4294967296;
  return result;
}

export const SCENARIOS = {
  // === MORNING & EMPTY ===
  morning_empty: {
    good: [
      "Rise and grind! Ready to absolutely crush these macros?",
      "The sun is up and your calorie budget is pristine. Let's get to work.",
      "Good morning! Your muscles are hungry, feed them right.",
      "A new day, a clean slate. Let's make it a masterpiece.",
      "Morning coach! Hydrate and let's get that first meal in."
    ],
    normal: [
      "Good morning. Dashboard is zeroed out. Awaiting input.",
      "Time to break the fast.",
      "Morning. Log your breakfast when ready.",
      "Awaiting initial calorie intake data.",
      "System initialized. Ready for today's logs."
    ],
    bad: [
      "Photosynthesis isn't a meal plan. Log something.",
      "Zero calories logged. Bold strategy — let's see how starving goes.",
      "The dashboard is emptier than your excuses. Eat, then track it.",
      "Still nothing? Your goals aren't going to chase themselves.",
      "Your metabolism clocked in hours ago. Where are you?"
    ]
  },
  morning_active: {
    good: [
      "Great start! That's how you set the tone for the day.",
      "Breakfast of champions officially logged.",
      "Solid early momentum. Keep this energy going!",
      "Love the morning protein hit. Synthesis engaged.",
      "Already moving the needle! Let's keep it clean."
    ],
    normal: [
      "Morning calories registered.",
      "Initial meal tracked.",
      "Breakfast logged. Proceeding with the day.",
      "Data received. Keep tracking.",
      "Off to a standard start."
    ],
    bad: [
      "One meal in. Don't celebrate — that's the bare minimum.",
      "Breakfast logged. Cute. The day hasn't even started.",
      "Okay, you ate. Now prove it wasn't a fluke by lunch.",
      "Decent start. Blow it by 2pm and we'll both know.",
      "Logged. Momentum means nothing if you quit at noon."
    ]
  },

  // === AFTERNOON ===
  afternoon_check: {
    good: [
      "Halfway through the day and looking strong!",
      "Afternoon check-in! You're pacing perfectly.",
      "Crushing it today! Keep the discipline high.",
      "The afternoon is where legends are made. Stay focused!",
      "Solid tracking so far. Let's nail the evening."
    ],
    normal: [
      "Afternoon status: ongoing.",
      "Half the day is gone. Review your remaining macros.",
      "Midday check. Keep logging.",
      "Afternoon. Stay on budget.",
      "Tracking is active."
    ],
    bad: [
      "Half the day gone. Are you tracking or just decorating the app?",
      "3 PM craving incoming. Fold now and today was pointless.",
      "Midday and I'm not impressed. Tighten it up.",
      "Plenty of day left to ruin this. Don't.",
      "You've got the afternoon to actually try. Radical, I know."
    ]
  },

  // === EVENING ===
  evening_push: {
    good: [
      "Almost done! Finish strong and secure the win.",
      "The day is wrapping up. You've done great so far!",
      "Evening is here. Let's close out these macros perfectly.",
      "Just dinner left. You've got this in the bag.",
      "Excellent discipline today. Bring it home!"
    ],
    normal: [
      "Evening approaching. Log your final meals.",
      "Review your remaining budget for dinner.",
      "Day is ending. Check your totals.",
      "Almost over. Stay aware of your target.",
      "Evening log required."
    ],
    bad: [
      "Nighttime is where discipline goes to die. Prove me wrong.",
      "One mindless snack and today's numbers are trash. Choose wisely.",
      "You made it this far. Don't fumble it at the fridge.",
      "Your willpower's at its lowest right now — so is my patience. Plan the last meal.",
      "Finish clean, or don't bother logging the excuses."
    ]
  },

  // === UNDER-EATING ===
  under_eating: {
    good: [
      "Your intake is very low today. Make sure you're nourishing your body properly.",
      "Low calorie day — please eat a proper meal if you haven't already.",
      "Your body needs fuel. Consider having a balanced meal before bed."
    ],
    normal: [
      "Very low calorie intake detected for this time of day.",
      "Calorie intake appears insufficient. Please eat adequately.",
      "Low intake flagged. Adequate nutrition is important for health."
    ],
    bad: [
      "Your intake is very low. Undereating can be just as harmful as overeating. Please eat.",
      "Your calorie count is concerning. Your body needs adequate fuel to function.",
      "Very low intake today. Please prioritize eating a proper meal."
    ]
  },

  // === MACRO & CALORIE HITS ===
  perfect_macros: {
    good: [
      "Flawless macros! You are an absolute machine today!",
      "Chef's kiss! That macro split is a work of art.",
      "Perfect protein, carbs, and fat. Text-book execution!",
      "This is how you build a physique. Incredible precision.",
      "Nailed the macros perfectly. Outstanding dedication!"
    ],
    normal: [
      "Macros are exactly on point.",
      "Optimal macro distribution achieved.",
      "Protein, carbs, and fat targets met.",
      "Macro ratio is optimal.",
      "Precise logging today."
    ],
    bad: [
      "Perfect macros. Once. Anyone can have one good day — do it again.",
      "Flawless. Now string seven together before you brag.",
      "You nailed it today. Tomorrow we find out if it was luck.",
      "Textbook. A single perfect day changes nothing. Repeat it.",
      "Great. Now stop admiring it and do it again."
    ]
  },
  target_hit: {
    good: [
      "Bullseye! You hit your exact calorie target!",
      "Perfection! Exactly what we aimed for today.",
      "Amazing precision! You are a master of tracking.",
      "Target hit! Your metabolism thanks you.",
      "Flawless victory today! Rest easy."
    ],
    normal: [
      "Target achieved.",
      "Calories match goal perfectly.",
      "Goal met for today.",
      "Budget exhausted exactly.",
      "Mission accomplished."
    ],
    bad: [
      "You hit the target. Groundbreaking. Do it again tomorrow.",
      "One clean day. Don't get comfortable.",
      "On the mark. A pattern would be more convincing than a fluke.",
      "Nice. Now make it boring — hit it every single day.",
      "You did the bare minimum correctly. Progress, I suppose."
    ]
  },
  near_target: {
    good: [
      "So close! Practically perfect tracking today!",
      "Within the margin of error. Brilliant job!",
      "Basically nailed it. That's a huge win!",
      "Excellent restraint, finishing right on the edge of the goal.",
      "Great work! Just shy of perfect, but totally effective."
    ],
    normal: [
      "Close enough to target.",
      "Acceptable variance.",
      "Near goal.",
      "Within acceptable limits.",
      "Almost exact."
    ],
    bad: [
      "Close doesn't count. Dial in the portions.",
      "'Almost' is just a nicer word for 'missed'.",
      "So near, yet you still winged the portions. Measure next time.",
      "A near miss is still a miss. Focus.",
      "You were close. 'Close' doesn't change your body. Exact does."
    ]
  },

  // === OVERAGES ===
  over_minor: {
    good: [
      "Slightly over, but totally manageable. Great day overall!",
      "A little extra fuel today. Put it to use in your next workout!",
      "Just a tiny bump over the line. Nothing a walk can't fix.",
      "Don't sweat the small stuff. You're still on a great path.",
      "A few extra calories won't derail you. Stay positive!"
    ],
    normal: [
      "Slightly over target.",
      "Calorie goal exceeded marginally.",
      "Over budget by a small amount.",
      "Minor surplus detected.",
      "A little extra today."
    ],
    bad: [
      "Over. Barely — but 'barely' every day is how you stall for months.",
      "'Just this once' is exactly what got you here. Watch it.",
      "Slightly over. Those sneaky bites add up faster than your excuses.",
      "Over the line. Stop eating five minutes sooner. It's not hard.",
      "Minor overage. Major problem if 'not caring' becomes the pattern."
    ]
  },
  over_moderate: {
    good: [
      "Moderately over your target. A solid workout could balance this out!",
      "A bit of a surplus today. Don't stress — just recalibrate tomorrow.",
      "Over by a noticeable amount, but one day doesn't define your journey.",
      "Higher intake today. Use the extra energy productively!",
      "Slightly heavy day. You're still doing great overall."
    ],
    normal: [
      "Moderately over calorie target.",
      "Noticeable surplus detected.",
      "Over budget by a moderate amount.",
      "Intake exceeds target by 100-400 kcal.",
      "Moderate surplus today."
    ],
    bad: [
      "Noticeably over. Was it worth it? Be honest with yourself.",
      "That surplus wasn't an accident. Own it and adjust.",
      "Impulse or plan? You already know the answer.",
      "This is the gap between wanting results and getting them. Tighten up.",
      "Keep 'treating yourself' like this daily and the scale won't move."
    ]
  },
  over_major: {
    good: [
      "Oops, a bit of a blowout! It happens to everyone. Reset tomorrow!",
      "We all have high-calorie days. Don't stress, just bounce back!",
      "A heavy day! Use that extra energy to crush a workout tomorrow.",
      "Don't let one bad day ruin your week. Forgive yourself and move on.",
      "Big surplus today. Remember: consistency beats perfection!"
    ],
    normal: [
      "Significantly over target.",
      "Calorie goal exceeded heavily.",
      "Way over budget.",
      "Major surplus recorded.",
      "Excessive intake detected."
    ],
    bad: [
      "Big blowout. Don't 'fix' it by starving tomorrow — that's how people spiral.",
      "Way over. It happened. Sulking burns zero calories — reset and move on.",
      "You torched the budget. Learn the trigger so it's not a weekly ritual.",
      "Massive surplus. One day won't ruin you; quitting will. Back to work tomorrow.",
      "Over by a lot. The scale will notice. So should you — tomorrow, cleanly."
    ]
  },

  // === FOOD SPECIFIC ===
  high_sugar: {
    good: [
      "Enjoyed some treats today! Balance is key to a sustainable diet.",
      "Got that sweet tooth out of the system! Back to whole foods tomorrow.",
      "A sugary day! Fueling up for some high-intensity work!"
    ],
    normal: [
      "High proportion of sugar detected.",
      "Carbs primarily sourced from sweets.",
      "Sugar intake is elevated."
    ],
    bad: [
      "That much sugar? Enjoy the crash you're signing up for.",
      "Basically mainlining dessert. Balance it or feel it later.",
      "Sugar city. Your energy's about to nosedive — don't say I didn't warn you."
    ]
  },
  high_fast_food: {
    good: [
      "Treated yourself today! Nothing wrong with a quick meal.",
      "Fast food day! As long as it fits your macros, you're fine.",
      "Enjoy the convenience! Tomorrow we cook."
    ],
    normal: [
      "Fast food detected in logs.",
      "Dietary source: Quick service.",
      "High sodium intake likely."
    ],
    bad: [
      "Drive-thru diet in full effect. Enjoy the bloat tomorrow.",
      "That's a lot of grease. The scale will lie tomorrow — it's water. You'll still panic.",
      "Processed everything today. Your body is filing a formal complaint."
    ]
  },
  liquid_diet: {
    good: [
      "Shakes on shakes! Getting that quick protein in!",
      "Liquid fuel today! Easy digestion.",
      "Supplementing hard! Keep grinding."
    ],
    normal: [
      "High proportion of liquid calories/supplements.",
      "Solid food intake is low.",
      "Relying heavily on fitness foods."
    ],
    bad: [
      "Drinking your calories won't keep you full. Chew something.",
      "Powders aren't a personality or a meal. Eat real food.",
      "Supplement city. Impressive, if the goal was to be hungry in an hour."
    ]
  },
  carnivore: {
    good: [
      "Meat machine! Building that dense muscle.",
      "Incredible protein sourcing today. Pure gains.",
      "Carnivore style! Your recovery is going to be insane."
    ],
    normal: [
      "High proportion of meat consumed.",
      "Protein sourced heavily from animals.",
      "Meat-heavy day."
    ],
    bad: [
      "All protein, zero fiber. Your gut is going to have words with you.",
      "Meat-maxxing again. Throw in a vegetable before your digestion revolts.",
      "Great protein. Shame about the total absence of plants."
    ]
  },

  // === STREAKS ===
  streak_3: {
    good: [
      "3 days strong! The habit is taking root!",
      "Three in a row! You are on absolute fire!",
      "A solid 3-day streak! I love this momentum!"
    ],
    normal: ["3 day streak.", "Streak of 3 reached.", "Three days on track."],
    bad: [
      "3 days. Congrats on doing the thing you signed up to do.",
      "Three whole days. Toddlers stay consistent longer. Keep going.",
      "3-day streak. Cute. Come back when it's 30."
    ]
  },
  streak_7: {
    good: [
      "A whole week! You are officially unstoppable!",
      "7 days of perfection! Incredible discipline!",
      "One full week down! Your body is adapting!"
    ],
    normal: ["7 day streak achieved.", "One full week on target.", "Streak: 7 days."],
    bad: [
      "A week. Now the habit actually starts — everything before this was easy.",
      "7 days. Most people quit by now. Low bar, but you cleared it.",
      "One week. Don't you dare get comfortable."
    ]
  },
  streak_10: {
    good: [
      "10 days! Double digits! You're building something real!",
      "Day 10! The consistency is becoming second nature!",
      "10 days of discipline. This is how transformations start!"
    ],
    normal: ["10 day streak.", "Double digit streak reached.", "Streak: 10 days."],
    bad: [
      "10 days. Double digits. Don't celebrate — just don't break it.",
      "Ten days in. Proving you're not all talk. Barely.",
      "10 days. Fine. Now make it forgettable by never missing."
    ]
  },
  streak_14: {
    good: [
      "Two whole weeks! A fortnight of pure dedication!",
      "14 days! You've turned tracking into a real habit!",
      "Two weeks strong! The results should be starting to show!"
    ],
    normal: ["14 day streak.", "Two weeks on target.", "Fortnight streak achieved."],
    bad: [
      "Two weeks. It's a habit now — so no more excuses for slipping.",
      "14 days. The data's watching. So am I.",
      "A fortnight. Respectable. Don't ruin it tomorrow."
    ]
  },
  streak_21: {
    good: [
      "21 days! They say it takes 21 days to build a habit — you've done it!",
      "Three weeks of absolute consistency! This is your lifestyle now!",
      "21 days! The habit is cemented. You're unstoppable!"
    ],
    normal: ["21 day streak.", "Three weeks on target.", "Streak: 21 days."],
    bad: [
      "21 days. The habit's built. Breaking it now would be genuinely stupid.",
      "Three weeks. You've officially run out of excuses. Good.",
      "21 days. Prove it wasn't beginner's luck."
    ]
  },
  streak_30: {
    good: [
      "30 DAYS! You are an absolute legend!",
      "A month of pure dedication. This is life-changing!",
      "30 day streak! I am genuinely proud of you!"
    ],
    normal: ["30 day streak.", "One month on track.", "Streak of 30 days."],
    bad: [
      "30 days. Okay, that's real. Don't get cocky now.",
      "A month. Fine — mildly impressed. Keep it that way.",
      "30 straight. Most can't do 3. Don't become them tomorrow."
    ]
  },
  streak_50: {
    good: [
      "50 DAYS! Half a century of consistency! You are extraordinary!",
      "50 days of logging! Most people can't do 5. You are built different!",
      "50 days! The transformation is undeniable at this point!"
    ],
    normal: ["50 day streak.", "50 days tracked consecutively.", "Streak: 50 days."],
    bad: [
      "50 days. Alright, that's actual discipline. Don't fumble it now.",
      "Fifty days. You've made your point. Now make it a lifestyle.",
      "50 in a row. Respect — grudgingly. Keep going."
    ]
  },
  streak_100: {
    good: [
      "100 DAYS! Triple digits! You are in ELITE territory!",
      "100 days of pure dedication! You have completely transformed your habits!",
      "ONE HUNDRED DAYS! This level of consistency is genuinely rare. Legend!"
    ],
    normal: ["100 day streak.", "Triple digit streak achieved.", "Streak: 100 days."],
    bad: [
      "100 days. Fine. You're the real deal. Don't let it go to your head.",
      "Triple digits. I'm out of insults. Just don't stop.",
      "100 days. Elite. Now prove it's permanent, not a phase."
    ]
  },
  streak_broken: {
    good: [
      "Streak broken, but that's okay! Start a new one today!",
      "Don't let one slip ruin your momentum. Bounce back!",
      "A streak ends, but the journey continues. You got this!"
    ],
    normal: ["Streak lost.", "Back to zero.", "Streak broken today."],
    bad: [
      "Streak's dead. Sulking won't revive it — start a new one today.",
      "Back to zero. That's what one lazy day costs. Don't repeat it.",
      "You broke it. Own it, restart it, and don't be precious about it."
    ]
  },
  first_day: {
    good: [
      "Welcome! Let's crush these goals together!",
      "Day 1! The beginning of a stronger you!",
      "So happy you're here. Let's make every calorie count!"
    ],
    normal: ["First day tracking.", "Welcome to the app.", "Log your first meal."],
    bad: [
      "Day one. Everyone's motivated on day one. Talk to me on day thirty.",
      "Fresh start. Prove you're not another person who quits by Friday.",
      "First day. The hardest part is not quitting. Most people fail that."
    ]
  }
};

/**
 * Determines which scenario to display based on current state.
 * Priority: first day → streak broken → under-eating → calorie overages → streaks → food categories → time-of-day
 *
 * @param {number} cals - Calories consumed today
 * @param {number} targetCals - Target calories
 * @param {number} streakCount - Current streak count
 * @param {number} hour - Current hour (0-23)
 * @param {object} consumptionDetails - { categories, mealCals }
 * @param {boolean} wasStreakBroken - Whether the streak was just broken
 * @param {boolean} isFirstDay - Whether this is the user's first day
 * @param {boolean} perfectMacros - Whether macros are perfect
 * @returns {string} Scenario key
 */
export function determineScenario(cals, targetCals, streakCount, hour, consumptionDetails = {}, wasStreakBroken = false, isFirstDay = false, perfectMacros = false) {
  if (isFirstDay) return 'first_day';
  if (wasStreakBroken) return 'streak_broken';

  // Under-eating detection: cals < 800 in the evening is a safety concern
  if (cals > 0 && cals < 800 && hour >= 18) return 'under_eating';

  // Check calorie overages BEFORE time-of-day messages
  const diff = cals - (targetCals || 1);

  if (cals > 0 && targetCals > 0) {
    if (perfectMacros && Math.abs(diff) <= 100) return 'perfect_macros';
    if (Math.abs(diff) <= 10) return 'target_hit';
    if (Math.abs(diff) <= 100) return 'near_target';
    if (diff > 400) return 'over_major';
    if (diff > 100) return 'over_moderate';
    if (diff > 50) return 'over_minor';
  }

  // Streak milestones (check specific values, then ranges)
  if (streakCount === 100) return 'streak_100';
  if (streakCount === 50) return 'streak_50';
  if (streakCount === 30) return 'streak_30';
  if (streakCount === 21) return 'streak_21';
  if (streakCount === 14) return 'streak_14';
  if (streakCount === 10) return 'streak_10';
  if (streakCount === 7) return 'streak_7';
  if (streakCount === 3) return 'streak_3';

  // Analyze food choices if consumption details are provided
  const categories = consumptionDetails?.categories || {};
  const getCatRatio = (cat) => (categories[cat] || 0) / (cals || 1);

  if (cals > 500) {
    if (getCatRatio('sweets') > 0.35) return 'high_sugar';
    if (getCatRatio('fastfood') > 0.4) return 'high_fast_food';
    if (getCatRatio('fitness') > 0.5) return 'liquid_diet';

    const meatRatio = getCatRatio('protein');
    if (meatRatio > 0.5) return 'carnivore';
  }

  // Time-of-day fallbacks
  if (cals === 0) {
    if (hour < 12) return 'morning_empty';
    if (hour < 17) return 'afternoon_check';
    return 'evening_push';
  }

  if (hour < 12 && cals > 0) return 'morning_active';
  if (hour >= 17) return 'evening_push';
  return 'afternoon_check';
}

/**
 * Gets a robot message for a given scenario, mode, and seed.
 * Safety check: if user's cals < 500 in 'bad' mode, auto-switches to 'normal' mode.
 *
 * @param {string} scenario - Scenario key from SCENARIOS
 * @param {string} mode - 'good', 'normal', or 'bad'
 * @param {string} seedInfo - Additional seed info for deterministic selection
 * @param {number} currentCals - Current calorie intake (for safety check)
 * @returns {string} The selected message
 */
export function getRobotMessage(scenario, mode = 'good', seedInfo = '', currentCals = null) {
  // Safety check: if cals < 500 in 'bad' mode, auto-switch to 'normal'
  let safeMode = mode;
  if (safeMode === 'bad' && currentCals !== null && currentCals < 500 && currentCals > 0) {
    safeMode = 'normal';
  }

  const scenarioData = SCENARIOS[scenario] || SCENARIOS.afternoon_check;
  const options = scenarioData[safeMode] || scenarioData['normal'] || scenarioData['good'];

  if (!options || options.length === 0) {
    return "Keep tracking your meals.";
  }

  // Use a deterministic seed based on today's date, scenario, mode, and seedInfo (like calorie count)
  // This prevents the message from flickering every render.
  const todayStr = new Date().toISOString().slice(0, 10); // yyyy-MM-dd format without date-fns dependency
  const seedString = `${todayStr}-${scenario}-${safeMode}-${seedInfo}`;

  const rand = getSeededRandom(seedString);
  const idx = Math.floor(rand * options.length);

  return options[idx];
}
