export const SCENARIOS = {
  morning_empty: {
    good: ['Rise and shine! Ready to fuel up?', 'Morning! A blank slate awaits.', 'Good morning! Let\'s hit those goals today.'],
    normal: ['Good morning. No food logged yet.', 'Time to log breakfast.', 'Morning. Ready to start tracking?'],
    bad: ['Are we fasting, or did you forget to log?', 'Wakey wakey, time to log your food.', 'Cutting means discipline, not starvation. Eat!']
  },
  morning_active: {
    good: ['Great start to the day!', 'Looking strong early on!', 'Breakfast of champions logged!'],
    normal: ['Breakfast logged. Keep it up.', 'Off to a good start.', 'Morning calories accounted for.'],
    bad: ['Finally, some food. Keep it clean.', 'Decent start. Don\'t ruin it by lunch.', 'That was breakfast. Stay focused.']
  },
  afternoon_check: {
    good: ['Halfway there! Keep up the momentum!', 'Afternoon check-in! Doing great.', 'You are crushing it today.'],
    normal: ['Afternoon. Stay on track.', 'Half the day gone. How are the macros?', 'Keep tracking, don\'t slip up now.'],
    bad: ['Afternoon slump? Don\'t reach for the junk.', 'Still tracking? Better be.', 'Don\'t ruin your day with a bad snack now.']
  },
  evening_push: {
    good: ['Almost done for the day. Finish strong!', 'Evening is here, wrap up those macros!', 'Great day so far, bring it home!'],
    normal: ['Evening. Log your dinner.', 'Day is ending, check your totals.', 'Almost over. Stay disciplined.'],
    bad: ['Nighttime cravings hitting? Stay strong.', 'Don\'t let a midnight snack ruin everything.', 'Late night snacking is how diets die.']
  },
  target_hit: {
    good: ['Spot on! You hit your target calories!', 'Perfection! Exactly what we aimed for.', 'Amazing precision today!'],
    normal: ['Target hit. Good job.', 'Calories are right on target.', 'Goal achieved for today.'],
    bad: ['About time you hit the exact target.', 'You finally followed the plan.', 'Target hit. Do it again tomorrow.']
  },
  near_target: {
    good: ['So close! Great tracking today!', 'Basically nailed it. Good work!', 'Within margin of error. Awesome job!'],
    normal: ['Close enough to target.', 'Almost exact. Acceptable.', 'Near your goal today.'],
    bad: ['Close, but no cigar. Try harder tomorrow.', 'Almost there, but almost doesn\'t count.', 'Missed the exact mark. Better luck next time.']
  },
  over_minor: {
    good: ['Slightly over, but totally manageable!', 'A little over, nothing a walk can\'t fix!', 'Just a bump in the road, stay positive!'],
    normal: ['Slightly over target.', 'Missed the goal by a bit.', 'A little extra today.'],
    bad: ['Slipping up? Reign it in.', 'A minor failure is still a failure.', 'Little bites add up. Watch it.']
  },
  over_major: {
    good: ['Oops, a bit of a blowout. Tomorrow is a new day!', 'Don\'t stress the big overage, just get back on track.', 'We all have those days. Bounce back!'],
    normal: ['Significantly over target today.', 'Calorie goal exceeded by a lot.', 'Way over budget.'],
    bad: ['Absolute disaster. Did you eat a horse?', 'This is why you are not reaching your goals.', 'What a mess. Tomorrow better be flawless.']
  },
  streak_3: {
    good: ['3 days strong! The habit is forming!', 'Three in a row! You are on fire!', 'A solid 3-day streak! Love it!'],
    normal: ['3 day streak.', 'Streak of 3 reached.', 'Three days on track.'],
    bad: ['3 days is a warmup. Keep going.', 'Don\'t celebrate a 3 day streak. Give me 30.', 'Three days. Don\'t break it now.']
  },
  streak_7: {
    good: ['A whole week! You are unstoppable!', '7 days of perfection! Incredible!', 'One week down! Amazing dedication!'],
    normal: ['7 day streak achieved.', 'One full week on target.', 'Streak: 7 days.'],
    bad: ['A week. Not bad, for you.', 'Seven days. Now the real test begins.', 'Don\'t let a 7 day streak get to your head.']
  },
  streak_30: {
    good: ['30 DAYS! You are an absolute legend!', 'A month of pure dedication. So proud!', '30 day streak! That is life changing!'],
    normal: ['30 day streak.', 'One month on track.', 'Streak of 30 days.'],
    bad: ['30 days. Okay, I am slightly impressed.', 'A whole month. Finally, some discipline.', '30 days down. Now do a year.']
  },
  streak_broken: {
    good: ['Streak broken, but that\'s okay. Start a new one!', 'Don\'t let one slip ruin your momentum!', 'A streak ends, but your journey continues!'],
    normal: ['Streak lost.', 'Back to zero.', 'Streak broken today.'],
    bad: ['And... the streak is dead. Pathetic.', 'All that hard work, ruined.', 'Back to day one. Try not to mess it up this time.']
  },
  first_day: {
    good: ['Welcome! Let\'s crush these goals together!', 'Day 1! The beginning of something great!', 'So happy you are here. Let\'s do this!'],
    normal: ['First day tracking.', 'Welcome to the app.', 'Log your first meal.'],
    bad: ['Day 1. Let\'s see how long you last.', 'Welcome. Don\'t give up in a week.', 'First day. Prove you have what it takes.']
  },
  perfect_macros: {
    good: ['Flawless macros! You are a machine!', 'Perfect macro split today! Outstanding!', 'Chef\'s kiss for those macros!'],
    normal: ['Macros hit perfectly.', 'Optimal macro distribution today.', 'Protein, carbs, and fat on point.'],
    bad: ['Perfect macros. I suspect a calculator was used.', 'Macros hit. Must be a fluke.', 'Perfect macros today. Don\'t let it be a one-off.']
  }
};

export function determineScenario(cals, targetCals, streakCount, hour, wasStreakBroken = false, isFirstDay = false, perfectMacros = false) {
  if (isFirstDay) return 'first_day';
  if (wasStreakBroken) return 'streak_broken';
  
  if (streakCount === 3) return 'streak_3';
  if (streakCount === 7) return 'streak_7';
  if (streakCount === 30) return 'streak_30';
  
  if (perfectMacros) return 'perfect_macros';
  
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

export function getRobotMessage(scenario, mode = 'good') {
  const options = SCENARIOS[scenario]?.[mode] || SCENARIOS.afternoon_check[mode];
  const idx = Math.floor(Math.random() * options.length);
  return options[idx];
}
