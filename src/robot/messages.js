// Deterministic random selection based on seed to prevent UI flickering
function getSeededRandom(seedString) {
  let h = 0;
  for (let i = 0; i < seedString.length; i++) {
    h = Math.imul(31, h) + seedString.charCodeAt(i) | 0;
  }
  // Convert to 0-1 range
  const t = h += 0x6D2B79F5;
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
      "Are we photosynthesizing today or did you forget to log?",
      "Wakey wakey. Fasting won't save you from a bad diet.",
      "I see a lot of zeros. A diet requires actually tracking things.",
      "Good morning. Still asleep, or just ignoring your macros?",
      "Your metabolism is waiting. Stop procrastinating and eat."
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
      "You call that breakfast? Better make up for it later.",
      "Finally, some food. Let's hope lunch is better planned.",
      "Logged. Try not to ruin your macros by noon.",
      "Decent start. Don't let the afternoon slump ruin it.",
      "I recorded that. I'm judging it, but I recorded it."
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
      "Afternoon slump hitting? Put down the chips.",
      "Half the day gone and your macros look like a crime scene.",
      "Don't let a 3 PM sugar craving destroy your progress.",
      "I see you slipping. Reign it in before dinner.",
      "Midday review: You can do better than this."
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
      "Nighttime cravings are a trap. Don't ruin today.",
      "Late-night snacking is how diets die. Step away from the fridge.",
      "Don't undo a whole day of work with a midnight binge.",
      "The sun is down, which means your willpower is dropping. Stay strong.",
      "I'm watching your evening calories. Don't disappoint me."
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
      "Perfect macros? Let me guess, you used a calculator to round it out.",
      "Wow, perfect macros. Must be a glitch in the matrix.",
      "You actually hit your macros. Try doing it twice in a row.",
      "I'm shocked. You actually followed the plan today.",
      "Enjoy the perfect score. Tomorrow is a new day to mess up."
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
      "About time you actually hit the target.",
      "You finally followed the plan. Was it that hard?",
      "Target hit. Let's see if you can repeat this miracle.",
      "Don't get cocky. One good day doesn't erase a bad week.",
      "Okay, you hit it. Now do it again tomorrow."
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
      "Close, but no cigar. Try harder tomorrow.",
      "Almost there, but 'almost' doesn't build muscle.",
      "Missed the exact mark. Precision matters.",
      "Sloppy ending. You couldn't just hit the number?",
      "You were so close, yet you failed."
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
      "Slipping up? Those 'little bites' add up fast.",
      "A minor failure is still a failure. Reign it in.",
      "You couldn't just stop eating 5 minutes earlier?",
      "Slightly over. Discipline is doing what you hate, do it.",
      "Those extra calories are going straight to your waistline."
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
      "Absolute disaster. Did you eat a horse?",
      "This is why you aren't reaching your goals. Zero self-control.",
      "What a mess. Tomorrow better be an absolute masterclass in fasting.",
      "A 400+ calorie surplus? So much for the summer body.",
      "I'm updating your profile to 'professional competitive eater'."
    ]
  },

  // === FOOD SPECIFIC (New) ===
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
      "Are you 5 years old? Stop eating so much candy.",
      "A massive sugar spike. Enjoy the inevitable crash.",
      "Tracking macros doesn't mean you should fill them with garbage."
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
      "Fast food again? Your arteries are begging for mercy.",
      "The scale is going to spike tomorrow from all that sodium.",
      "You are literally made of what you eat. Today, you are trash."
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
      "You're living on whey protein. Eat a real piece of meat.",
      "Drinkable calories won't keep you full. You're going to starve later.",
      "Chew your food once in a while. Real food matters."
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
      "Did you spare any animals today? Eat a vegetable.",
      "Your digestion must be working overtime right now.",
      "Meat is great, but fiber exists for a reason."
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
      "3 days is a warmup. Keep going.",
      "Don't celebrate a 3-day streak. Give me 30.",
      "Three days. Try not to break it this weekend."
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
      "A week. Not bad... for you.",
      "Seven days. Now the real test begins.",
      "Don't let a 7-day streak inflate your ego."
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
      "30 days. Okay, I am slightly impressed.",
      "A whole month. Finally, some actual discipline.",
      "30 days down. Don't ruin it on day 31."
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
      "And... the streak is dead. Pathetic.",
      "All that hard work, ruined by zero self-control.",
      "Back to day one. Try not to mess it up this time."
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
      "Day 1. Let's see how long you actually last.",
      "Welcome. Don't give up in a week like you usually do.",
      "First day. Prove you actually have what it takes."
    ]
  }
};

export function determineScenario(cals, targetCals, streakCount, hour, consumptionDetails = {}, wasStreakBroken = false, isFirstDay = false, perfectMacros = false) {
  if (isFirstDay) return 'first_day';
  if (wasStreakBroken) return 'streak_broken';
  
  if (streakCount === 3) return 'streak_3';
  if (streakCount === 7) return 'streak_7';
  if (streakCount === 30) return 'streak_30';
  
  if (perfectMacros) return 'perfect_macros';

  // Analyze food choices if consumption details are provided
  const categories = consumptionDetails?.categories || {};
  const getCatRatio = (cat) => (categories[cat] || 0) / (cals || 1);

  if (cals > 500) {
    if (getCatRatio('sweets') > 0.35) return 'high_sugar';
    if (getCatRatio('fast_food') > 0.4) return 'high_fast_food';
    if (getCatRatio('fitness') > 0.5) return 'liquid_diet';
    
    const meatRatio = getCatRatio('meat') + getCatRatio('poultry') + getCatRatio('seafood');
    if (meatRatio > 0.5) return 'carnivore';
  }
  
  const diff = cals - targetCals;
  
  if (cals === 0) {
    if (hour < 12) return 'morning_empty';
    if (hour < 17) return 'afternoon_check';
    return 'evening_push';
  }
  
  if (hour < 12 && cals > 0) return 'morning_active';
  
  if (Math.abs(diff) <= 10) return 'target_hit';
  if (Math.abs(diff) <= 100) return 'near_target';
  
  if (diff > 400) return 'over_major';
  if (diff > 50) return 'over_minor';
  
  if (hour >= 17) return 'evening_push';
  return 'afternoon_check';
}

export function getRobotMessage(scenario, mode = 'good', seedInfo = '') {
  const options = SCENARIOS[scenario]?.[mode] || SCENARIOS.afternoon_check[mode];
  
  // Use a deterministic seed based on today's date, scenario, mode, and seedInfo (like calorie count)
  // This prevents the message from flickering every render.
  const todayStr = new Date().toLocaleDateString('en-CA');
  const seedString = `${todayStr}-${scenario}-${mode}-${seedInfo}`;
  
  const rand = getSeededRandom(seedString);
  const idx = Math.floor(rand * options.length);
  
  return options[idx];
}
