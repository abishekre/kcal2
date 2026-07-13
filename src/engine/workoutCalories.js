// ═══════════════════════════════════════════════════════════════════════════
// Workout calorie-burn engine — MET-based estimation.
//
//   kcal = MET × body-weight (kg) × duration (hours)
//
// Same approach Apple Health / MyFitnessPal use. These are population
// estimates (MET includes resting energy), so every surface that shows a
// burn number labels it "estimated".
//
// Strength work has no explicit duration per set, so working time is
// approximated as completedSets × STRENGTH_SET_SECONDS, capped by the
// session's wall-clock elapsed time — idle time between sets never inflates
// the number. Cardio/activity entries use their explicit durations.
// ═══════════════════════════════════════════════════════════════════════════
import {
  STRENGTH_SET_SECONDS,
  STRENGTH_DEFAULT_MET,
  WORKOUT_SANITY_MAX_KCAL,
} from '../utils/constants';

/** Core MET formula. Returns whole kcal. */
export function estimateCalories({ met, weightKg, durationSeconds }) {
  if (!(met > 0) || !(weightKg > 0) || !(durationSeconds > 0)) return 0;
  return Math.round(met * weightKg * (durationSeconds / 3600));
}

/**
 * MET for a cardio exercise, scaled by pace when the exercise defines a
 * metByPace table ([[km/h, MET], …] sorted ascending). Linear interpolation
 * between rows, clamped at the ends; falls back to defaultMet/met without
 * pace data.
 */
export function getCardioMet(exercise, { speedKmh } = {}) {
  const fallback = exercise?.defaultMet ?? exercise?.met ?? STRENGTH_DEFAULT_MET;
  const table = exercise?.metByPace;
  if (!table?.length || !(speedKmh > 0)) return fallback;

  if (speedKmh <= table[0][0]) return table[0][1];
  const last = table[table.length - 1];
  if (speedKmh >= last[0]) return last[1];

  for (let i = 1; i < table.length; i++) {
    const [s1, m1] = table[i - 1];
    const [s2, m2] = table[i];
    if (speedKmh <= s2) {
      const t = (speedKmh - s1) / (s2 - s1);
      return m1 + t * (m2 - m1);
    }
  }
  return fallback;
}

/** Completed (done, non-warmup) set count for a strength entry. */
const completedSets = (entry) =>
  (entry.sets || []).filter((s) => s.done && !s.isWarmup).length;

/**
 * Estimated burn for a whole session.
 *
 * @param {object} session - { entries: [...], startedAt, endedAt }
 *   entry: { exerciseKey, type, sets?, durationSeconds?, distanceM? }
 * @param {object} opts - { weightKg, exerciseDB, elapsedSeconds? }
 * @returns {{ total: number, capped: boolean }}
 */
export function estimateSessionCalories(session, { weightKg, exerciseDB, elapsedSeconds }) {
  if (!(weightKg > 0)) return { total: 0, capped: false };

  const elapsed =
    elapsedSeconds ??
    (session.startedAt && session.endedAt
      ? Math.max(0, (session.endedAt - session.startedAt) / 1000)
      : Infinity);

  let total = 0;
  let strengthSeconds = 0;
  let strengthMetWeightedSeconds = 0;

  for (const entry of session.entries || []) {
    const ex = exerciseDB?.[entry.exerciseKey];
    if (entry.type === 'strength') {
      const secs = completedSets(entry) * STRENGTH_SET_SECONDS;
      strengthSeconds += secs;
      strengthMetWeightedSeconds += secs * (ex?.met ?? STRENGTH_DEFAULT_MET);
    } else {
      const dur = entry.durationSeconds || 0;
      if (dur <= 0) continue;
      let met = ex?.met ?? ex?.defaultMet ?? STRENGTH_DEFAULT_MET;
      if (entry.type === 'cardio') {
        const speedKmh = entry.distanceM > 0 ? (entry.distanceM / 1000) / (dur / 3600) : 0;
        met = getCardioMet(ex, { speedKmh });
      }
      total += estimateCalories({ met, weightKg, durationSeconds: dur });
    }
  }

  // Strength: cap total estimated working time at the session's wall-clock
  // elapsed time, scaling the MET-weighted sum proportionally.
  if (strengthSeconds > 0) {
    const usable = Math.min(strengthSeconds, elapsed);
    const avgMet = strengthMetWeightedSeconds / strengthSeconds;
    total += estimateCalories({ met: avgMet, weightKg, durationSeconds: usable });
  }

  const capped = total > WORKOUT_SANITY_MAX_KCAL;
  return { total: capped ? WORKOUT_SANITY_MAX_KCAL : total, capped };
}

/**
 * Detects strength PRs in `session` vs. prior history: for each exercise, a
 * new best set weight or a new best estimated volume (weight × reps single-set).
 *
 * @returns [{ exerciseKey, kind: 'weight'|'volume', value, previous }]
 */
export function detectPRs(session, historySessions) {
  const bests = {}; // exerciseKey -> { weight, volume }
  for (const past of historySessions || []) {
    for (const entry of past.entries || []) {
      if (entry.type !== 'strength') continue;
      const b = (bests[entry.exerciseKey] ??= { weight: 0, volume: 0 });
      for (const s of entry.sets || []) {
        if (!s.done || s.isWarmup) continue;
        const w = s.weight || 0;
        const vol = w * (s.reps || 0);
        if (w > b.weight) b.weight = w;
        if (vol > b.volume) b.volume = vol;
      }
    }
  }

  const prs = [];
  for (const entry of session.entries || []) {
    if (entry.type !== 'strength') continue;
    const b = bests[entry.exerciseKey] || { weight: 0, volume: 0 };
    let bestW = 0;
    let bestVol = 0;
    for (const s of entry.sets || []) {
      if (!s.done || s.isWarmup) continue;
      const w = s.weight || 0;
      const vol = w * (s.reps || 0);
      if (w > bestW) bestW = w;
      if (vol > bestVol) bestVol = vol;
    }
    // Weight PR is the headline; only report volume PR when weight didn't move.
    if (bestW > b.weight && b.weight > 0) {
      prs.push({ exerciseKey: entry.exerciseKey, kind: 'weight', value: bestW, previous: b.weight });
    } else if (bestVol > b.volume && b.volume > 0) {
      prs.push({ exerciseKey: entry.exerciseKey, kind: 'volume', value: bestVol, previous: b.volume });
    }
  }
  return prs;
}

/** Total lifted volume (kg) across completed working sets. */
export function sessionVolume(session) {
  let vol = 0;
  for (const entry of session.entries || []) {
    if (entry.type !== 'strength') continue;
    for (const s of entry.sets || []) {
      if (s.done && !s.isWarmup) vol += (s.weight || 0) * (s.reps || 0);
    }
  }
  return Math.round(vol);
}
