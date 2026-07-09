import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

const COLORS = ['#10b981', '#f59e0b', '#6366f1', '#f43f5e', '#38bdf8', '#a855f7'];
const PARTICLE_COUNT = 28;

// Built once at module load (not during render, so it stays pure and stable).
// A fixed layout is plenty random-looking for a sub-2s confetti burst.
const PARTICLES = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
  id: i,
  left: Math.random() * 100,
  delay: Math.random() * 0.15,
  duration: 1.1 + Math.random() * 0.7,
  color: COLORS[i % COLORS.length],
  size: 8 + Math.random() * 8,
  rotate: (Math.random() - 0.5) * 720,
  round: i % 2 === 0,
}));

/**
 * A brief, self-contained confetti burst + "Target hit!" badge shown the moment
 * the user reaches their calorie goal for the day. Purely decorative
 * (pointer-events-none, aria-hidden) and self-dismissing. Honors reduced-motion
 * by dropping the particles and shortening the badge.
 */
export default function Celebration({ show, onDone }) {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(onDone, reduced ? 900 : 1700);
    return () => clearTimeout(t);
  }, [show, onDone, reduced]);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[150] pointer-events-none flex items-center justify-center overflow-hidden"
      aria-hidden="true"
    >
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.15, 1, 1], opacity: [0, 1, 1, 0] }}
        transition={{ duration: reduced ? 0.9 : 1.6, times: [0, 0.2, 0.7, 1] }}
        className="px-6 py-3 rounded-full bg-emerald-500 text-white font-black text-lg shadow-xl shadow-emerald-500/30"
      >
        🎯 Target hit!
      </motion.div>

      {!reduced &&
        PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            initial={{ top: '38%', left: `${p.left}%`, opacity: 1, rotate: 0 }}
            animate={{ top: '108%', opacity: [1, 1, 0], rotate: p.rotate }}
            transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
            style={{
              position: 'absolute',
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              borderRadius: p.round ? '50%' : '2px',
            }}
          />
        ))}
    </div>
  );
}
