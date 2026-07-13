// ═══════════════════════════════════════════════════════════════════════════
// Shared search helpers — used by both the food search and exercise search.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Relevance score for a substring match. Lower is better: a name that
 * *starts with* the query beats a word-boundary match, which beats a
 * mid-word substring — so "chic" surfaces "Chicken…" ahead of
 * "Butter Chicken" instead of raw insertion order.
 */
export function matchScore(name, q) {
  if (name === q) return 0;
  if (name.startsWith(q)) return 1;
  if (name.includes(` ${q}`)) return 2; // start of a later word
  return 3;
}

/** Bounded Levenshtein distance for typo tolerance. */
export function levenshtein(a, b) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const curr = [i];
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = curr;
  }
  return prev[n];
}

/**
 * Typo-tolerant match used only as a fallback when strict substring search
 * finds nothing — so "chiken" still surfaces "Chicken Curry". Allows 1 edit
 * for short queries, 2 for longer ones, against the whole name or any word.
 */
export function fuzzyMatches(name, q) {
  const threshold = q.length <= 4 ? 1 : 2;
  if (levenshtein(name, q) <= threshold) return true;
  for (const word of name.split(/\s+/)) {
    if (levenshtein(word, q) <= threshold) return true;
    if (word.length > q.length && levenshtein(word.slice(0, q.length), q) <= threshold) return true;
  }
  return false;
}
