import { useState, useEffect } from 'react';

/**
 * Tracks the user's prefers-reduced-motion OS setting so components can
 * disable/simplify decorative animation (infinite loops, springs) for
 * anyone who's asked for less motion.
 */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) || false
  );

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => setReduced(mql.matches);
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  return reduced;
}
