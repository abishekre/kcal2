import { createClient } from '@supabase/supabase-js';

import fs from 'fs';
import path from 'url';

// Quick hack to get env in node
const envRaw = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envRaw.split('\n').forEach(line => {
  if (line.includes('=')) {
    const [k, v] = line.split('=');
    env[k.trim()] = v.trim();
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

// Dummy seed data since we can't easily import ES modules containing JSX/React logic here without a transpiler
const globalFoods = [
  { food_key: "egg", data: { name: "Whole Egg", cals: 72, p: 6, c: 0, f: 5, serving: "1 large" } },
  { food_key: "chicken_breast", data: { name: "Chicken Breast", cals: 165, p: 31, c: 0, f: 3.6, serving: "100g raw" } },
  { food_key: "white_rice", data: { name: "White Rice", cals: 130, p: 2.7, c: 28, f: 0.3, serving: "100g cooked" } },
  { food_key: "whey", data: { name: "Whey Protein", cals: 120, p: 24, c: 3, f: 1.5, serving: "1 scoop (30g)" } },
  { food_key: "oats", data: { name: "Rolled Oats", cals: 389, p: 16.9, c: 66.3, f: 6.9, serving: "100g dry" } },
  { food_key: "banana", data: { name: "Banana", cals: 105, p: 1.3, c: 27, f: 0.3, serving: "1 medium" } },
];

const robotMessages = [
  { scenario: 'morning_empty', mode: 'bad', message: "Nothing logged yet. Already giving up on the day?" },
  { scenario: 'morning_empty', mode: 'good', message: "Good morning! Let's hit those macros today." },
  { scenario: 'morning_empty', mode: 'normal', message: "Awaiting initial calorie intake data." }
];

const insightTexts = [
  { insight_key: 'backloading', mode: 'bad', message: "You skipped the entire morning and are backloading all calories now. Your digestion is going to hate you." },
  { insight_key: 'backloading', mode: 'good', message: "Backloading calories today! Make sure you don't go to bed feeling too full." },
  { insight_key: 'backloading', mode: 'normal', message: "All calories consumed in the evening window." }
];

async function seed() {
  console.log('Seeding Global Foods...');
  for (const food of globalFoods) {
    await supabase.from('global_foods').upsert(food);
  }

  console.log('Seeding Robot Messages...');
  for (const msg of robotMessages) {
    await supabase.from('robot_messages').upsert(msg);
  }

  console.log('Seeding Insight Texts...');
  for (const ins of insightTexts) {
    await supabase.from('insight_texts').upsert(ins);
  }

  console.log('Seeding complete!');
}

seed().catch(console.error);
