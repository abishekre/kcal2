import fs from 'fs';
import { BASE_FOOD_DB } from '../src/data/foods.js';
import { SCENARIOS } from '../src/robot/messages.js';

const INSIGHTS_DB = [
  { key: 'morning_empty_early', good: "Start your day right. A protein-rich breakfast sets the metabolic tone.", normal: "Breakfast window is open. Awaiting initial logs.", bad: "Don't even think about skipping breakfast and complaining about hunger later." },
  { key: 'morning_empty_mid', good: "Half the day is gone and you haven't logged. Don't fall into the trap of guessing later.", normal: "No data received by midday.", bad: "No logs by noon? You're setting yourself up for an evening binge." },
  { key: 'fasting', good: "Fasting today? Make sure you hydrate!", normal: "Zero calories recorded. Day is almost over.", bad: "Fasting? If not, you are playing a dangerous game with your macros right now." },
  { key: 'high_sugar', good: "Enjoyed the treats! Just be mindful of an energy dip later.", normal: "High ratio of calories derived from sweets.", bad: "High sugar intake today. Expect a massive crash. Your pancreas hates you." },
  { key: 'high_fast_food', good: "Treated yourself to some takeout! Drink extra water today to balance the sodium.", normal: "High fast food ratio detected. Sodium levels elevated.", bad: "Heavy on the fast food today. The scale is going to spike tomorrow from sodium retention. Stop poisoning yourself." },
  { key: 'high_fitness', good: "Getting that easy protein in! Try to get some whole foods later for better digestion.", normal: "Supplement dependency high today.", bad: "You're living on powders and bars. Eat some actual solid food, you're not an astronaut." },
  { key: 'backloading', good: "Backloading calories today! Make sure you don't go to bed feeling too full.", normal: "All calories consumed in the evening window.", bad: "You skipped the entire morning and are backloading all calories now. Your digestion is going to hate you." },
  { key: 'frontloading', good: "You've eaten most of your food early! You'll need serious willpower tonight.", normal: "80% budget exhausted before 14:00.", bad: "You've burned through 80% of your calories before 2 PM. Tonight is going to be a miserable test of willpower." },
  { key: 'over_cut', good: "You blew past your cutting target. Acknowledge it, log it, and reset tomorrow. No guilt!", normal: "Surplus detected during cut phase.", bad: "You blew past your deficit. This is exactly why you aren't losing weight. Do better tomorrow." },
  { key: 'over_general', good: "Over target today. Tomorrow's a reset — not a reason to spiral into a binge.", normal: "Daily calorie budget exceeded.", bad: "Over your target. Again. A complete lack of dietary discipline." },
  { key: 'perfect', good: "Absolute perfection. Calories nailed, protein hit. This is how you change your body.", normal: "Calories and protein precisely on target.", bad: "You actually hit your calories and protein perfectly. I'm genuinely shocked." },
  { key: 'target_hit', good: "Right on your calorie target! Consistency like this is what drives real results.", normal: "Calorie goal achieved.", bad: "You hit your calories, but missed the protein. Don't get sloppy." },
  { key: 'protein_deficit', good: "You have calories left but are missing protein. Lean meats are your best friends right now.", normal: "Protein deficit detected.", bad: "You have room for food but you're missing protein. Eat some chicken before you lose all your muscle." },
  { key: 'bulk_deficit', good: "You're leaving gains on the table! Eat those remaining calories if you want to grow.", normal: "Large surplus required for bulk is unmet.", bad: "You're trying to bulk but skipping meals? Eat your food or stay small forever." },
  { key: 'low_remaining', good: "Very few calories left but it's early. Time to master the art of high-volume, low-calorie foods.", normal: "Low remaining budget early in the day.", bad: "Very few calories left and the sun is still out. You're going to be starving tonight. Poor planning." },
  { key: 'mid_remaining', good: "Budget running low. Plan your remaining meals wisely!", normal: "Budget over half exhausted.", bad: "Running low on calories. Don't blow it all on one stupid snack." },
  { key: 'streak_milestone', good: "Days straight of logging! This isn't just a diet anymore, it's your lifestyle!", normal: "Weekly milestone tracked.", bad: "Streak logged. Finally showing a shred of consistency." },
  { key: 'high_meat', good: "Solid protein foundation today. Carnivore style!", normal: "Dietary source: predominantly meat.", bad: "Eating like a pure carnivore today. Hope your digestion can handle it." },
  { key: 'high_plant', good: "Great micronutrient profile today. Keep eating those plants!", normal: "Plant-based nutrient intake is optimal.", bad: "Actually eating your vegetables today. Look at you acting like an adult." },
  { key: 'default', good: "Every entry builds the habit. Trust the data, trust the process.", normal: "Data logging is active and proceeding normally.", bad: "Just keep logging. The math doesn't care about your feelings." }
];

function escapeSql(str) {
  return str.replace(/'/g, "''");
}

let sql = '';

// 1. global_foods
sql += '-- Global Foods\n';
sql += 'INSERT INTO global_foods (food_key, data)\nVALUES\n';
const foodKeys = Object.keys(BASE_FOOD_DB);
const foodValues = foodKeys.map(key => {
  const data = JSON.stringify(BASE_FOOD_DB[key]);
  return `('${escapeSql(key)}', '${escapeSql(data)}'::jsonb)`;
});
sql += foodValues.join(',\n') + '\nON CONFLICT (food_key) DO UPDATE SET data = EXCLUDED.data;\n\n';

// 2. robot_messages
sql += '-- Robot Messages\n';
sql += 'INSERT INTO robot_messages (scenario, mode, message)\nVALUES\n';
const robotValues = [];
for (const scenario of Object.keys(SCENARIOS)) {
  for (const mode of Object.keys(SCENARIOS[scenario])) {
    for (const msg of SCENARIOS[scenario][mode]) {
      robotValues.push(`('${escapeSql(scenario)}', '${escapeSql(mode)}', '${escapeSql(msg)}')`);
    }
  }
}
sql += robotValues.join(',\n') + '\nON CONFLICT ON CONSTRAINT robot_messages_scenario_mode_message_key DO NOTHING;\n\n';

// 3. insight_texts
sql += '-- Insight Texts\n';
sql += 'INSERT INTO insight_texts (insight_key, mode, message)\nVALUES\n';
const insightValues = [];
for (const insight of INSIGHTS_DB) {
  insightValues.push(`('${escapeSql(insight.key)}', 'good', '${escapeSql(insight.good)}')`);
  insightValues.push(`('${escapeSql(insight.key)}', 'normal', '${escapeSql(insight.normal)}')`);
  insightValues.push(`('${escapeSql(insight.key)}', 'bad', '${escapeSql(insight.bad)}')`);
}
sql += insightValues.join(',\n') + '\nON CONFLICT (insight_key, mode) DO UPDATE SET message = EXCLUDED.message;\n';

fs.writeFileSync('seed.sql', sql, 'utf8');
console.log('Created seed.sql successfully!');
