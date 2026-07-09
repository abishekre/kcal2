import { useEffect, useState } from 'react';
import { animate } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

/**
 * Renders a number that smoothly counts up/down to `value` when it changes —
 * a small dopamine detail for the calorie total. Honors reduced-motion by
 * snapping instantly (duration 0 still routes through onUpdate, so there's no
 * synchronous setState in the effect body).
 */
export default function CountUp({ value, className }) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const controls = animate(display, value, {
      duration: reduced ? 0 : 0.5,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    });
    return () => controls.stop();
    // display is intentionally omitted — including it would restart the
    // animation every frame. We only re-animate when the target value changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reduced]);

  return <span className={className}>{display}</span>;
}
