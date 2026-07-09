import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { BASE_FOOD_DB } from '../src/data/foods.js';
import { SCENARIOS } from '../src/robot/messages.js';

const envRaw = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envRaw.split('\n').forEach(line => {
  if (line.includes('=')) {
    const [k, ...v] = line.split('=');
    env[k.trim()] = v.join('=').trim();
  }
});

// After applying rls_hardening.sql, the anon key can no longer write to
// global_foods/robot_messages/insight_texts — this script needs the
// project's service_role key (Project Settings → API) instead. Add
// SUPABASE_SERVICE_ROLE_KEY to .env.local; falls back to the anon key so
// this still runs before that migration is applied.
const supabase = createClient(
  env.VITE_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY
);

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

async function migrate() {
  console.log('--- STARTING FULL DATA MIGRATION ---');

  // 1. Foods
  console.log('\\n1. Migrating Food Database...');
  const foodKeys = Object.keys(BASE_FOOD_DB);
  console.log(`Found ${foodKeys.length} foods.`);
  for (const key of foodKeys) {
    const data = BASE_FOOD_DB[key];
    await supabase.from('global_foods').upsert({ food_key: key, data });
  }

  // 2. Robot Messages
  console.log('\\n2. Migrating Robot Messages...');
  let msgCount = 0;
  for (const scenario of Object.keys(SCENARIOS)) {
    for (const mode of Object.keys(SCENARIOS[scenario])) {
      const messages = SCENARIOS[scenario][mode];
      for (const message of messages) {
        await supabase.from('robot_messages').upsert({
          scenario, mode, message
        }, { onConflict: 'scenario,mode,message' });
        msgCount++;
      }
    }
  }
  console.log(`Migrated ${msgCount} robot messages.`);

  // 3. Insight Texts
  console.log('\\n3. Migrating Insight Texts...');
  for (const insight of INSIGHTS_DB) {
    await supabase.from('insight_texts').upsert({ insight_key: insight.key, mode: 'good', message: insight.good }, { onConflict: 'insight_key,mode' });
    await supabase.from('insight_texts').upsert({ insight_key: insight.key, mode: 'normal', message: insight.normal }, { onConflict: 'insight_key,mode' });
    await supabase.from('insight_texts').upsert({ insight_key: insight.key, mode: 'bad', message: insight.bad }, { onConflict: 'insight_key,mode' });
  }
  console.log(`Migrated ${INSIGHTS_DB.length * 3} insight rules.`);

  console.log('\\n--- MIGRATION COMPLETE ---');
}

migrate().catch(console.error);
