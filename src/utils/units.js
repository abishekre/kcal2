// ═══════════════════════════════════════════════════════════════════════════
// Unit conversion — the engine and stored profile are ALWAYS metric (kg/cm).
// These helpers convert only for display/entry when the user picks imperial.
// ═══════════════════════════════════════════════════════════════════════════

export const KG_PER_LB = 0.45359237;

export const kgToLbs = (kg) => kg / KG_PER_LB;
export const lbsToKg = (lbs) => lbs * KG_PER_LB;

export const cmToFeetInches = (cm) => {
  const totalInches = cm / 2.54;
  return { feet: Math.floor(totalInches / 12), inches: Math.round(totalInches % 12) };
};
export const feetInchesToCm = (feet, inches) => Math.round(((feet * 12) + inches) * 2.54);

/** The weight unit label for the chosen system. */
export const weightUnit = (system) => (system === 'imperial' ? 'lbs' : 'kg');

/**
 * Converts a metric-stored kg value into the number shown for the chosen unit
 * system: whole pounds for imperial, one-decimal kg for metric.
 */
export const toDisplayWeight = (kg, system) => {
  if (kg == null || Number.isNaN(Number(kg))) return null;
  return system === 'imperial' ? Math.round(kgToLbs(kg)) : Math.round(kg * 10) / 10;
};

/** Inverse of toDisplayWeight: takes an entered value and returns kg for storage. */
export const fromDisplayWeight = (value, system) => {
  const n = Number(value);
  if (Number.isNaN(n)) return null;
  return system === 'imperial' ? Math.round(lbsToKg(n) * 10) / 10 : n;
};

/** "79.4 kg" / "175 lbs" — a ready-to-render string. */
export const formatWeight = (kg, system) => {
  const v = toDisplayWeight(kg, system);
  return v == null ? '—' : `${v} ${weightUnit(system)}`;
};
