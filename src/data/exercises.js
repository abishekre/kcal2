// ═══════════════════════════════════════════════════════════════════════════
// Exercise library — strength, cardio, and general activity.
//
// Each entry:
//   name       display name
//   category   key into EXERCISE_CATEGORIES (drives filtering + emoji)
//   type       'strength' (sets × reps × weight) | 'cardio' (duration ± distance)
//              | 'activity' (duration only)
//   met        MET value (2011 Compendium of Physical Activities) used by the
//              calorie-burn engine: kcal = MET × kg × hours. Strength METs are
//              applied to estimated *working* time, not wall-clock time.
//   metByPace  (cardio only) [[speed km/h, MET], …] for pace-scaled accuracy;
//              defaultMet is the fallback when no distance/pace is available.
//   primary /  main + assisting muscle groups (display + future analytics)
//   secondary
//   equipment  barbell | dumbbell | machine | cable | bodyweight | kettlebell |
//              band | smith | other | none
//
// MET values are population estimates — burn numbers are always labeled
// "estimated" in the UI. Strength ≈4–6, vigorous conditioning ≈8+.
// ═══════════════════════════════════════════════════════════════════════════

export const EXERCISE_CATEGORIES = {
  chest:     { label: 'Chest',      emoji: '🏋️' },
  back:      { label: 'Back',       emoji: '🚣' },
  shoulders: { label: 'Shoulders',  emoji: '🤸' },
  biceps:    { label: 'Biceps',     emoji: '💪' },
  triceps:   { label: 'Triceps',    emoji: '🦾' },
  legs:      { label: 'Legs',       emoji: '🦵' },
  glutes:    { label: 'Glutes',     emoji: '🍑' },
  core:      { label: 'Core',       emoji: '🧱' },
  fullbody:  { label: 'Full Body',  emoji: '🔥' },
  cardio:    { label: 'Cardio',     emoji: '🏃' },
  activity:  { label: 'Sports & More', emoji: '⚽' },
};

export const BASE_EXERCISE_DB = {
  // ── Chest ──
  bench_press:          { name: 'Bench Press (Barbell)', category: 'chest', type: 'strength', met: 6.0, primary: ['chest'], secondary: ['triceps', 'front delts'], equipment: 'barbell' },
  incline_bench_press:  { name: 'Incline Bench Press (Barbell)', category: 'chest', type: 'strength', met: 6.0, primary: ['upper chest'], secondary: ['triceps', 'front delts'], equipment: 'barbell' },
  decline_bench_press:  { name: 'Decline Bench Press (Barbell)', category: 'chest', type: 'strength', met: 6.0, primary: ['lower chest'], secondary: ['triceps'], equipment: 'barbell' },
  close_grip_bench:     { name: 'Close-Grip Bench Press', category: 'chest', type: 'strength', met: 6.0, primary: ['triceps'], secondary: ['chest', 'front delts'], equipment: 'barbell' },
  db_bench_press:       { name: 'Bench Press (Dumbbell)', category: 'chest', type: 'strength', met: 5.0, primary: ['chest'], secondary: ['triceps', 'front delts'], equipment: 'dumbbell' },
  db_incline_press:     { name: 'Incline Press (Dumbbell)', category: 'chest', type: 'strength', met: 5.0, primary: ['upper chest'], secondary: ['triceps', 'front delts'], equipment: 'dumbbell' },
  db_fly:               { name: 'Chest Fly (Dumbbell)', category: 'chest', type: 'strength', met: 4.0, primary: ['chest'], secondary: ['front delts'], equipment: 'dumbbell' },
  incline_db_fly:       { name: 'Incline Fly (Dumbbell)', category: 'chest', type: 'strength', met: 4.0, primary: ['upper chest'], secondary: ['front delts'], equipment: 'dumbbell' },
  cable_fly:            { name: 'Cable Fly', category: 'chest', type: 'strength', met: 4.0, primary: ['chest'], secondary: ['front delts'], equipment: 'cable' },
  cable_crossover:      { name: 'Cable Crossover', category: 'chest', type: 'strength', met: 4.0, primary: ['chest'], secondary: ['front delts'], equipment: 'cable' },
  pec_deck:             { name: 'Pec Deck (Machine Fly)', category: 'chest', type: 'strength', met: 4.0, primary: ['chest'], secondary: [], equipment: 'machine' },
  machine_chest_press:  { name: 'Chest Press (Machine)', category: 'chest', type: 'strength', met: 4.5, primary: ['chest'], secondary: ['triceps'], equipment: 'machine' },
  smith_bench_press:    { name: 'Bench Press (Smith Machine)', category: 'chest', type: 'strength', met: 5.0, primary: ['chest'], secondary: ['triceps'], equipment: 'smith' },
  push_up:              { name: 'Push-Up', category: 'chest', type: 'strength', met: 3.8, primary: ['chest'], secondary: ['triceps', 'core'], equipment: 'bodyweight' },
  wide_push_up:         { name: 'Wide-Grip Push-Up', category: 'chest', type: 'strength', met: 3.8, primary: ['chest'], secondary: ['front delts'], equipment: 'bodyweight' },
  diamond_push_up:      { name: 'Diamond Push-Up', category: 'chest', type: 'strength', met: 3.8, primary: ['triceps'], secondary: ['chest'], equipment: 'bodyweight' },
  decline_push_up:      { name: 'Decline Push-Up', category: 'chest', type: 'strength', met: 3.8, primary: ['upper chest'], secondary: ['triceps', 'core'], equipment: 'bodyweight' },
  chest_dips:           { name: 'Dips (Chest)', category: 'chest', type: 'strength', met: 5.0, primary: ['lower chest'], secondary: ['triceps', 'front delts'], equipment: 'bodyweight' },
  svend_press:          { name: 'Svend Press (Plate)', category: 'chest', type: 'strength', met: 4.0, primary: ['chest'], secondary: ['front delts'], equipment: 'other' },

  // ── Back ──
  deadlift:             { name: 'Deadlift (Conventional)', category: 'back', type: 'strength', met: 6.0, primary: ['lower back', 'glutes'], secondary: ['hamstrings', 'traps', 'forearms'], equipment: 'barbell' },
  sumo_deadlift:        { name: 'Sumo Deadlift', category: 'back', type: 'strength', met: 6.0, primary: ['glutes', 'lower back'], secondary: ['quads', 'adductors'], equipment: 'barbell' },
  rack_pull:            { name: 'Rack Pull', category: 'back', type: 'strength', met: 6.0, primary: ['upper back', 'traps'], secondary: ['lower back', 'forearms'], equipment: 'barbell' },
  pull_up:              { name: 'Pull-Up', category: 'back', type: 'strength', met: 5.0, primary: ['lats'], secondary: ['biceps', 'mid back'], equipment: 'bodyweight' },
  chin_up:              { name: 'Chin-Up', category: 'back', type: 'strength', met: 5.0, primary: ['lats', 'biceps'], secondary: ['mid back'], equipment: 'bodyweight' },
  weighted_pull_up:     { name: 'Weighted Pull-Up', category: 'back', type: 'strength', met: 6.0, primary: ['lats'], secondary: ['biceps', 'mid back'], equipment: 'bodyweight' },
  lat_pulldown:         { name: 'Lat Pulldown', category: 'back', type: 'strength', met: 4.5, primary: ['lats'], secondary: ['biceps'], equipment: 'cable' },
  close_grip_pulldown:  { name: 'Close-Grip Pulldown', category: 'back', type: 'strength', met: 4.5, primary: ['lats'], secondary: ['biceps'], equipment: 'cable' },
  straight_arm_pulldown:{ name: 'Straight-Arm Pulldown', category: 'back', type: 'strength', met: 4.0, primary: ['lats'], secondary: ['triceps long head'], equipment: 'cable' },
  barbell_row:          { name: 'Bent-Over Row (Barbell)', category: 'back', type: 'strength', met: 6.0, primary: ['mid back', 'lats'], secondary: ['biceps', 'lower back'], equipment: 'barbell' },
  pendlay_row:          { name: 'Pendlay Row', category: 'back', type: 'strength', met: 6.0, primary: ['mid back'], secondary: ['lats', 'lower back'], equipment: 'barbell' },
  db_row:               { name: 'One-Arm Row (Dumbbell)', category: 'back', type: 'strength', met: 5.0, primary: ['lats', 'mid back'], secondary: ['biceps'], equipment: 'dumbbell' },
  chest_supported_row:  { name: 'Chest-Supported Row', category: 'back', type: 'strength', met: 4.5, primary: ['mid back'], secondary: ['lats', 'biceps'], equipment: 'dumbbell' },
  seated_cable_row:     { name: 'Seated Cable Row', category: 'back', type: 'strength', met: 4.5, primary: ['mid back', 'lats'], secondary: ['biceps'], equipment: 'cable' },
  tbar_row:             { name: 'T-Bar Row', category: 'back', type: 'strength', met: 5.5, primary: ['mid back'], secondary: ['lats', 'biceps'], equipment: 'barbell' },
  machine_row:          { name: 'Row (Machine)', category: 'back', type: 'strength', met: 4.5, primary: ['mid back'], secondary: ['lats', 'biceps'], equipment: 'machine' },
  meadows_row:          { name: 'Meadows Row (Landmine)', category: 'back', type: 'strength', met: 5.0, primary: ['lats', 'mid back'], secondary: ['biceps'], equipment: 'barbell' },
  inverted_row:         { name: 'Inverted Row', category: 'back', type: 'strength', met: 4.5, primary: ['mid back'], secondary: ['lats', 'biceps'], equipment: 'bodyweight' },
  shrug_bb:             { name: 'Shrug (Barbell)', category: 'back', type: 'strength', met: 4.0, primary: ['traps'], secondary: ['forearms'], equipment: 'barbell' },
  shrug_db:             { name: 'Shrug (Dumbbell)', category: 'back', type: 'strength', met: 4.0, primary: ['traps'], secondary: ['forearms'], equipment: 'dumbbell' },
  good_morning:         { name: 'Good Morning', category: 'back', type: 'strength', met: 5.0, primary: ['lower back', 'hamstrings'], secondary: ['glutes'], equipment: 'barbell' },
  back_extension:       { name: 'Back Extension (Hyperextension)', category: 'back', type: 'strength', met: 4.0, primary: ['lower back'], secondary: ['glutes', 'hamstrings'], equipment: 'bodyweight' },

  // ── Shoulders ──
  overhead_press:       { name: 'Overhead Press (Barbell)', category: 'shoulders', type: 'strength', met: 6.0, primary: ['front delts', 'side delts'], secondary: ['triceps', 'core'], equipment: 'barbell' },
  push_press:           { name: 'Push Press', category: 'shoulders', type: 'strength', met: 6.0, primary: ['delts'], secondary: ['triceps', 'legs'], equipment: 'barbell' },
  db_shoulder_press:    { name: 'Shoulder Press (Dumbbell)', category: 'shoulders', type: 'strength', met: 5.0, primary: ['front delts', 'side delts'], secondary: ['triceps'], equipment: 'dumbbell' },
  arnold_press:         { name: 'Arnold Press', category: 'shoulders', type: 'strength', met: 5.0, primary: ['delts'], secondary: ['triceps'], equipment: 'dumbbell' },
  machine_shoulder_press:{ name: 'Shoulder Press (Machine)', category: 'shoulders', type: 'strength', met: 4.5, primary: ['delts'], secondary: ['triceps'], equipment: 'machine' },
  landmine_press:       { name: 'Landmine Press', category: 'shoulders', type: 'strength', met: 5.0, primary: ['front delts'], secondary: ['upper chest', 'core'], equipment: 'barbell' },
  lateral_raise:        { name: 'Lateral Raise (Dumbbell)', category: 'shoulders', type: 'strength', met: 4.0, primary: ['side delts'], secondary: [], equipment: 'dumbbell' },
  cable_lateral_raise:  { name: 'Lateral Raise (Cable)', category: 'shoulders', type: 'strength', met: 4.0, primary: ['side delts'], secondary: [], equipment: 'cable' },
  front_raise:          { name: 'Front Raise', category: 'shoulders', type: 'strength', met: 4.0, primary: ['front delts'], secondary: [], equipment: 'dumbbell' },
  rear_delt_fly:        { name: 'Rear Delt Fly (Dumbbell)', category: 'shoulders', type: 'strength', met: 4.0, primary: ['rear delts'], secondary: ['mid back'], equipment: 'dumbbell' },
  reverse_pec_deck:     { name: 'Reverse Pec Deck', category: 'shoulders', type: 'strength', met: 4.0, primary: ['rear delts'], secondary: ['mid back'], equipment: 'machine' },
  face_pull:            { name: 'Face Pull (Cable)', category: 'shoulders', type: 'strength', met: 4.0, primary: ['rear delts'], secondary: ['traps', 'rotator cuff'], equipment: 'cable' },
  upright_row:          { name: 'Upright Row', category: 'shoulders', type: 'strength', met: 4.5, primary: ['side delts', 'traps'], secondary: ['biceps'], equipment: 'barbell' },

  // ── Biceps ──
  barbell_curl:         { name: 'Barbell Curl', category: 'biceps', type: 'strength', met: 4.0, primary: ['biceps'], secondary: ['forearms'], equipment: 'barbell' },
  ez_bar_curl:          { name: 'EZ-Bar Curl', category: 'biceps', type: 'strength', met: 4.0, primary: ['biceps'], secondary: ['forearms'], equipment: 'barbell' },
  db_curl:              { name: 'Dumbbell Curl', category: 'biceps', type: 'strength', met: 4.0, primary: ['biceps'], secondary: ['forearms'], equipment: 'dumbbell' },
  hammer_curl:          { name: 'Hammer Curl', category: 'biceps', type: 'strength', met: 4.0, primary: ['biceps', 'brachialis'], secondary: ['forearms'], equipment: 'dumbbell' },
  incline_db_curl:      { name: 'Incline Dumbbell Curl', category: 'biceps', type: 'strength', met: 4.0, primary: ['biceps (long head)'], secondary: [], equipment: 'dumbbell' },
  preacher_curl:        { name: 'Preacher Curl', category: 'biceps', type: 'strength', met: 4.0, primary: ['biceps (short head)'], secondary: [], equipment: 'barbell' },
  cable_curl:           { name: 'Cable Curl', category: 'biceps', type: 'strength', met: 4.0, primary: ['biceps'], secondary: ['forearms'], equipment: 'cable' },
  concentration_curl:   { name: 'Concentration Curl', category: 'biceps', type: 'strength', met: 3.5, primary: ['biceps'], secondary: [], equipment: 'dumbbell' },
  spider_curl:          { name: 'Spider Curl', category: 'biceps', type: 'strength', met: 4.0, primary: ['biceps (short head)'], secondary: [], equipment: 'dumbbell' },
  reverse_curl:         { name: 'Reverse Curl', category: 'biceps', type: 'strength', met: 4.0, primary: ['forearms', 'brachialis'], secondary: ['biceps'], equipment: 'barbell' },
  wrist_curl:           { name: 'Wrist Curl', category: 'biceps', type: 'strength', met: 3.0, primary: ['forearms'], secondary: [], equipment: 'dumbbell' },

  // ── Triceps ──
  tricep_pushdown:      { name: 'Tricep Pushdown (Bar)', category: 'triceps', type: 'strength', met: 4.0, primary: ['triceps'], secondary: [], equipment: 'cable' },
  rope_pushdown:        { name: 'Rope Pushdown', category: 'triceps', type: 'strength', met: 4.0, primary: ['triceps'], secondary: [], equipment: 'cable' },
  overhead_tricep_ext:  { name: 'Overhead Tricep Extension', category: 'triceps', type: 'strength', met: 4.0, primary: ['triceps (long head)'], secondary: [], equipment: 'dumbbell' },
  skull_crusher:        { name: 'Skull Crusher (EZ-Bar)', category: 'triceps', type: 'strength', met: 4.0, primary: ['triceps'], secondary: [], equipment: 'barbell' },
  db_kickback:          { name: 'Tricep Kickback', category: 'triceps', type: 'strength', met: 3.5, primary: ['triceps'], secondary: [], equipment: 'dumbbell' },
  bench_dips:           { name: 'Bench Dips', category: 'triceps', type: 'strength', met: 4.0, primary: ['triceps'], secondary: ['chest', 'front delts'], equipment: 'bodyweight' },
  tricep_dips:          { name: 'Dips (Triceps, Upright)', category: 'triceps', type: 'strength', met: 5.0, primary: ['triceps'], secondary: ['chest'], equipment: 'bodyweight' },
  machine_tricep_ext:   { name: 'Tricep Extension (Machine)', category: 'triceps', type: 'strength', met: 4.0, primary: ['triceps'], secondary: [], equipment: 'machine' },

  // ── Legs ──
  squat:                { name: 'Squat (Barbell, Back)', category: 'legs', type: 'strength', met: 6.0, primary: ['quads', 'glutes'], secondary: ['hamstrings', 'core', 'lower back'], equipment: 'barbell' },
  front_squat:          { name: 'Front Squat', category: 'legs', type: 'strength', met: 6.0, primary: ['quads'], secondary: ['glutes', 'core', 'upper back'], equipment: 'barbell' },
  goblet_squat:         { name: 'Goblet Squat', category: 'legs', type: 'strength', met: 5.0, primary: ['quads', 'glutes'], secondary: ['core'], equipment: 'dumbbell' },
  hack_squat:           { name: 'Hack Squat (Machine)', category: 'legs', type: 'strength', met: 5.5, primary: ['quads'], secondary: ['glutes'], equipment: 'machine' },
  smith_squat:          { name: 'Squat (Smith Machine)', category: 'legs', type: 'strength', met: 5.5, primary: ['quads', 'glutes'], secondary: ['hamstrings'], equipment: 'smith' },
  leg_press:            { name: 'Leg Press', category: 'legs', type: 'strength', met: 5.0, primary: ['quads', 'glutes'], secondary: ['hamstrings'], equipment: 'machine' },
  bulgarian_split_squat:{ name: 'Bulgarian Split Squat', category: 'legs', type: 'strength', met: 5.5, primary: ['quads', 'glutes'], secondary: ['hamstrings', 'core'], equipment: 'dumbbell' },
  walking_lunge:        { name: 'Walking Lunge', category: 'legs', type: 'strength', met: 5.5, primary: ['quads', 'glutes'], secondary: ['hamstrings', 'core'], equipment: 'dumbbell' },
  reverse_lunge:        { name: 'Reverse Lunge', category: 'legs', type: 'strength', met: 5.0, primary: ['glutes', 'quads'], secondary: ['hamstrings'], equipment: 'dumbbell' },
  step_up:              { name: 'Step-Up', category: 'legs', type: 'strength', met: 5.5, primary: ['quads', 'glutes'], secondary: ['hamstrings'], equipment: 'dumbbell' },
  leg_extension:        { name: 'Leg Extension', category: 'legs', type: 'strength', met: 4.0, primary: ['quads'], secondary: [], equipment: 'machine' },
  lying_leg_curl:       { name: 'Leg Curl (Lying)', category: 'legs', type: 'strength', met: 4.0, primary: ['hamstrings'], secondary: [], equipment: 'machine' },
  seated_leg_curl:      { name: 'Leg Curl (Seated)', category: 'legs', type: 'strength', met: 4.0, primary: ['hamstrings'], secondary: [], equipment: 'machine' },
  romanian_deadlift:    { name: 'Romanian Deadlift', category: 'legs', type: 'strength', met: 6.0, primary: ['hamstrings', 'glutes'], secondary: ['lower back'], equipment: 'barbell' },
  db_romanian_deadlift: { name: 'Romanian Deadlift (Dumbbell)', category: 'legs', type: 'strength', met: 5.0, primary: ['hamstrings', 'glutes'], secondary: ['lower back'], equipment: 'dumbbell' },
  nordic_curl:          { name: 'Nordic Hamstring Curl', category: 'legs', type: 'strength', met: 5.0, primary: ['hamstrings'], secondary: ['calves'], equipment: 'bodyweight' },
  standing_calf_raise:  { name: 'Calf Raise (Standing)', category: 'legs', type: 'strength', met: 4.0, primary: ['calves'], secondary: [], equipment: 'machine' },
  seated_calf_raise:    { name: 'Calf Raise (Seated)', category: 'legs', type: 'strength', met: 3.5, primary: ['calves (soleus)'], secondary: [], equipment: 'machine' },
  pistol_squat:         { name: 'Pistol Squat', category: 'legs', type: 'strength', met: 6.0, primary: ['quads', 'glutes'], secondary: ['core', 'balance'], equipment: 'bodyweight' },

  // ── Glutes ──
  hip_thrust:           { name: 'Hip Thrust (Barbell)', category: 'glutes', type: 'strength', met: 5.0, primary: ['glutes'], secondary: ['hamstrings'], equipment: 'barbell' },
  glute_bridge:         { name: 'Glute Bridge', category: 'glutes', type: 'strength', met: 4.0, primary: ['glutes'], secondary: ['hamstrings', 'core'], equipment: 'bodyweight' },
  cable_kickback:       { name: 'Glute Kickback (Cable)', category: 'glutes', type: 'strength', met: 4.0, primary: ['glutes'], secondary: ['hamstrings'], equipment: 'cable' },
  hip_abduction:        { name: 'Hip Abduction (Machine)', category: 'glutes', type: 'strength', met: 4.0, primary: ['glute medius'], secondary: [], equipment: 'machine' },
  hip_adduction:        { name: 'Hip Adduction (Machine)', category: 'glutes', type: 'strength', met: 4.0, primary: ['adductors'], secondary: [], equipment: 'machine' },

  // ── Core ──
  plank:                { name: 'Plank', category: 'core', type: 'strength', met: 3.3, primary: ['core'], secondary: ['shoulders'], equipment: 'bodyweight' },
  side_plank:           { name: 'Side Plank', category: 'core', type: 'strength', met: 3.3, primary: ['obliques'], secondary: ['core'], equipment: 'bodyweight' },
  crunch:               { name: 'Crunch', category: 'core', type: 'strength', met: 3.8, primary: ['abs'], secondary: [], equipment: 'bodyweight' },
  bicycle_crunch:       { name: 'Bicycle Crunch', category: 'core', type: 'strength', met: 3.8, primary: ['abs', 'obliques'], secondary: [], equipment: 'bodyweight' },
  sit_up:               { name: 'Sit-Up', category: 'core', type: 'strength', met: 3.8, primary: ['abs'], secondary: ['hip flexors'], equipment: 'bodyweight' },
  cable_crunch:         { name: 'Cable Crunch', category: 'core', type: 'strength', met: 4.0, primary: ['abs'], secondary: [], equipment: 'cable' },
  hanging_leg_raise:    { name: 'Hanging Leg Raise', category: 'core', type: 'strength', met: 4.5, primary: ['lower abs'], secondary: ['hip flexors', 'grip'], equipment: 'bodyweight' },
  hanging_knee_raise:   { name: 'Hanging Knee Raise', category: 'core', type: 'strength', met: 4.0, primary: ['lower abs'], secondary: ['hip flexors'], equipment: 'bodyweight' },
  lying_leg_raise:      { name: 'Lying Leg Raise', category: 'core', type: 'strength', met: 3.8, primary: ['lower abs'], secondary: ['hip flexors'], equipment: 'bodyweight' },
  russian_twist:        { name: 'Russian Twist', category: 'core', type: 'strength', met: 3.8, primary: ['obliques'], secondary: ['abs'], equipment: 'bodyweight' },
  ab_wheel:             { name: 'Ab Wheel Rollout', category: 'core', type: 'strength', met: 4.5, primary: ['abs'], secondary: ['lats', 'shoulders'], equipment: 'other' },
  dead_bug:             { name: 'Dead Bug', category: 'core', type: 'strength', met: 3.3, primary: ['deep core'], secondary: [], equipment: 'bodyweight' },
  bird_dog:             { name: 'Bird Dog', category: 'core', type: 'strength', met: 3.0, primary: ['core', 'lower back'], secondary: ['glutes'], equipment: 'bodyweight' },
  v_up:                 { name: 'V-Up', category: 'core', type: 'strength', met: 4.0, primary: ['abs'], secondary: ['hip flexors'], equipment: 'bodyweight' },
  dragon_flag:          { name: 'Dragon Flag', category: 'core', type: 'strength', met: 5.0, primary: ['abs'], secondary: ['lats'], equipment: 'bodyweight' },
  pallof_press:         { name: 'Pallof Press', category: 'core', type: 'strength', met: 3.5, primary: ['anti-rotation core'], secondary: ['obliques'], equipment: 'cable' },
  woodchopper:          { name: 'Cable Woodchopper', category: 'core', type: 'strength', met: 4.0, primary: ['obliques'], secondary: ['core'], equipment: 'cable' },
  mountain_climbers:    { name: 'Mountain Climbers', category: 'core', type: 'strength', met: 8.0, primary: ['core'], secondary: ['shoulders', 'hip flexors'], equipment: 'bodyweight' },

  // ── Full body / conditioning ──
  power_clean:          { name: 'Power Clean', category: 'fullbody', type: 'strength', met: 6.0, primary: ['full body'], secondary: ['traps', 'glutes', 'quads'], equipment: 'barbell' },
  clean_and_jerk:       { name: 'Clean & Jerk', category: 'fullbody', type: 'strength', met: 6.0, primary: ['full body'], secondary: ['shoulders', 'legs'], equipment: 'barbell' },
  snatch:               { name: 'Snatch', category: 'fullbody', type: 'strength', met: 6.0, primary: ['full body'], secondary: ['shoulders', 'traps'], equipment: 'barbell' },
  thruster:             { name: 'Thruster', category: 'fullbody', type: 'strength', met: 8.0, primary: ['quads', 'shoulders'], secondary: ['glutes', 'core'], equipment: 'barbell' },
  kettlebell_swing:     { name: 'Kettlebell Swing', category: 'fullbody', type: 'strength', met: 8.0, primary: ['glutes', 'hamstrings'], secondary: ['core', 'shoulders'], equipment: 'kettlebell' },
  kettlebell_clean_press:{ name: 'Kettlebell Clean & Press', category: 'fullbody', type: 'strength', met: 8.0, primary: ['full body'], secondary: ['shoulders', 'core'], equipment: 'kettlebell' },
  turkish_get_up:       { name: 'Turkish Get-Up', category: 'fullbody', type: 'strength', met: 6.0, primary: ['full body'], secondary: ['core', 'shoulders'], equipment: 'kettlebell' },
  burpee:               { name: 'Burpee', category: 'fullbody', type: 'strength', met: 8.0, primary: ['full body'], secondary: ['chest', 'legs', 'core'], equipment: 'bodyweight' },
  farmers_walk:         { name: "Farmer's Walk", category: 'fullbody', type: 'strength', met: 6.0, primary: ['grip', 'traps'], secondary: ['core', 'legs'], equipment: 'dumbbell' },
  sled_push:            { name: 'Sled Push', category: 'fullbody', type: 'strength', met: 8.0, primary: ['legs'], secondary: ['core', 'shoulders'], equipment: 'other' },
  battle_ropes:         { name: 'Battle Ropes', category: 'fullbody', type: 'strength', met: 8.0, primary: ['shoulders', 'arms'], secondary: ['core'], equipment: 'other' },
  wall_ball:            { name: 'Wall Ball', category: 'fullbody', type: 'strength', met: 8.0, primary: ['quads', 'shoulders'], secondary: ['core'], equipment: 'other' },
  box_jump:             { name: 'Box Jump', category: 'fullbody', type: 'strength', met: 8.0, primary: ['quads', 'glutes'], secondary: ['calves'], equipment: 'bodyweight' },
  med_ball_slam:        { name: 'Medicine Ball Slam', category: 'fullbody', type: 'strength', met: 7.0, primary: ['core', 'lats'], secondary: ['shoulders'], equipment: 'other' },
  bear_crawl:           { name: 'Bear Crawl', category: 'fullbody', type: 'strength', met: 6.0, primary: ['core', 'shoulders'], secondary: ['quads'], equipment: 'bodyweight' },

  // ── Cardio (duration ± distance; pace scales MET where it matters) ──
  running:              { name: 'Running', category: 'cardio', type: 'cardio', defaultMet: 9.8, metByPace: [[6.4, 6.0], [8.0, 8.3], [9.7, 9.8], [11.3, 11.0], [12.9, 11.8], [16.0, 14.5]], tracksDistance: true, primary: ['legs', 'cardio'], secondary: [], equipment: 'none' },
  walking:              { name: 'Walking', category: 'cardio', type: 'cardio', defaultMet: 3.5, metByPace: [[3.2, 2.8], [4.8, 3.5], [5.6, 4.3], [6.4, 5.0]], tracksDistance: true, primary: ['legs'], secondary: [], equipment: 'none' },
  incline_walk:         { name: 'Incline Treadmill Walk', category: 'cardio', type: 'cardio', defaultMet: 6.0, tracksDistance: true, primary: ['legs', 'glutes'], secondary: ['calves'], equipment: 'machine' },
  cycling:              { name: 'Cycling (Outdoor)', category: 'cardio', type: 'cardio', defaultMet: 8.0, metByPace: [[16.0, 6.8], [19.0, 8.0], [22.5, 10.0], [25.7, 12.0]], tracksDistance: true, primary: ['quads', 'cardio'], secondary: ['calves'], equipment: 'other' },
  stationary_bike:      { name: 'Stationary Bike', category: 'cardio', type: 'cardio', defaultMet: 6.8, primary: ['quads', 'cardio'], secondary: [], equipment: 'machine' },
  spinning:             { name: 'Spinning Class', category: 'cardio', type: 'cardio', defaultMet: 8.5, primary: ['quads', 'cardio'], secondary: [], equipment: 'machine' },
  elliptical:           { name: 'Elliptical', category: 'cardio', type: 'cardio', defaultMet: 5.0, primary: ['legs', 'cardio'], secondary: ['arms'], equipment: 'machine' },
  rowing_machine:       { name: 'Rowing Machine', category: 'cardio', type: 'cardio', defaultMet: 7.0, tracksDistance: true, primary: ['back', 'legs'], secondary: ['arms', 'core'], equipment: 'machine' },
  stair_climber:        { name: 'Stair Climber', category: 'cardio', type: 'cardio', defaultMet: 9.0, primary: ['legs', 'glutes'], secondary: ['calves'], equipment: 'machine' },
  jump_rope:            { name: 'Jump Rope (Skipping)', category: 'cardio', type: 'cardio', defaultMet: 11.0, primary: ['calves', 'cardio'], secondary: ['shoulders'], equipment: 'other' },
  swimming_freestyle:   { name: 'Swimming (Freestyle)', category: 'cardio', type: 'cardio', defaultMet: 7.0, tracksDistance: true, primary: ['full body'], secondary: [], equipment: 'none' },
  swimming_breaststroke:{ name: 'Swimming (Breaststroke)', category: 'cardio', type: 'cardio', defaultMet: 6.0, tracksDistance: true, primary: ['full body'], secondary: [], equipment: 'none' },
  sprinting:            { name: 'Sprint Intervals', category: 'cardio', type: 'cardio', defaultMet: 12.0, tracksDistance: true, primary: ['legs', 'cardio'], secondary: ['core'], equipment: 'none' },

  // ── Sports & general activity (duration only) ──
  yoga:                 { name: 'Yoga (Hatha)', category: 'activity', type: 'activity', met: 3.0, primary: ['flexibility'], secondary: ['core'], equipment: 'none' },
  power_yoga:           { name: 'Power Yoga / Vinyasa', category: 'activity', type: 'activity', met: 4.0, primary: ['full body'], secondary: ['core'], equipment: 'none' },
  surya_namaskar:       { name: 'Surya Namaskar', category: 'activity', type: 'activity', met: 3.8, primary: ['full body'], secondary: ['flexibility'], equipment: 'none' },
  pilates:              { name: 'Pilates', category: 'activity', type: 'activity', met: 3.0, primary: ['core'], secondary: ['flexibility'], equipment: 'none' },
  stretching:           { name: 'Stretching / Mobility', category: 'activity', type: 'activity', met: 2.3, primary: ['flexibility'], secondary: [], equipment: 'none' },
  hiit_class:           { name: 'HIIT Class', category: 'activity', type: 'activity', met: 8.0, primary: ['full body'], secondary: ['cardio'], equipment: 'none' },
  crossfit_wod:         { name: 'CrossFit WOD', category: 'activity', type: 'activity', met: 8.0, primary: ['full body'], secondary: ['cardio'], equipment: 'other' },
  badminton:            { name: 'Badminton', category: 'activity', type: 'activity', met: 5.5, primary: ['legs', 'shoulders'], secondary: ['cardio'], equipment: 'none' },
  cricket:              { name: 'Cricket', category: 'activity', type: 'activity', met: 4.8, primary: ['full body'], secondary: [], equipment: 'none' },
  football:             { name: 'Football (Soccer)', category: 'activity', type: 'activity', met: 7.0, primary: ['legs', 'cardio'], secondary: [], equipment: 'none' },
  basketball:           { name: 'Basketball', category: 'activity', type: 'activity', met: 6.5, primary: ['legs', 'cardio'], secondary: [], equipment: 'none' },
  tennis:               { name: 'Tennis', category: 'activity', type: 'activity', met: 7.0, primary: ['legs', 'shoulders'], secondary: ['cardio'], equipment: 'none' },
  table_tennis:         { name: 'Table Tennis', category: 'activity', type: 'activity', met: 4.0, primary: ['arms'], secondary: ['legs'], equipment: 'none' },
  volleyball:           { name: 'Volleyball', category: 'activity', type: 'activity', met: 4.0, primary: ['legs', 'shoulders'], secondary: [], equipment: 'none' },
  kabaddi:              { name: 'Kabaddi', category: 'activity', type: 'activity', met: 8.0, primary: ['full body'], secondary: ['cardio'], equipment: 'none' },
  boxing_bag:           { name: 'Boxing (Heavy Bag)', category: 'activity', type: 'activity', met: 5.5, primary: ['shoulders', 'core'], secondary: ['cardio'], equipment: 'other' },
  martial_arts:         { name: 'Martial Arts / MMA', category: 'activity', type: 'activity', met: 9.0, primary: ['full body'], secondary: ['cardio'], equipment: 'none' },
  dancing:              { name: 'Dancing', category: 'activity', type: 'activity', met: 5.0, primary: ['legs', 'cardio'], secondary: [], equipment: 'none' },
  zumba:                { name: 'Zumba', category: 'activity', type: 'activity', met: 6.5, primary: ['legs', 'cardio'], secondary: ['core'], equipment: 'none' },
  hiking:               { name: 'Hiking / Trekking', category: 'activity', type: 'activity', met: 6.0, primary: ['legs'], secondary: ['cardio'], equipment: 'none' },
  rock_climbing:        { name: 'Rock Climbing / Bouldering', category: 'activity', type: 'activity', met: 7.5, primary: ['back', 'grip'], secondary: ['core', 'legs'], equipment: 'none' },
};

// Sensible defaults for a brand-new user with no workout history —
// the classic gym staples first.
export const POPULAR_EXERCISE_KEYS = [
  'bench_press', 'squat', 'deadlift', 'lat_pulldown', 'db_shoulder_press',
  'barbell_curl', 'tricep_pushdown', 'leg_press', 'seated_cable_row',
  'lateral_raise', 'push_up', 'plank', 'running', 'walking', 'cycling', 'badminton',
];
