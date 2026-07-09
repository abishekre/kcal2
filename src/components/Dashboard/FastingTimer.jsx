import { memo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Timer, Play, Square } from 'lucide-react';
import { useTimerStore } from '../../store/useTimerStore';
import { triggerHaptic } from '../../utils/haptics';
import { FASTING_PROTOCOLS } from '../../utils/constants';

/**
 * Compact fasting timer widget for the dashboard.
 * Shows a circular progress ring, elapsed time, and start/stop controls.
 */
function FastingTimer() {
  const timerState = useTimerStore(s => s.timerState);
  const protocol = useTimerStore(s => s.protocol);
  const startFast = useTimerStore(s => s.startFast);
  const stopFast = useTimerStore(s => s.stopFast);
  const tick = useTimerStore(s => s.tick);
  const setProtocol = useTimerStore(s => s.setProtocol);
  // Selecting through the getter (not the raw `elapsed` field) so the
  // string/number it returns is what triggers the per-second re-render.
  const timeStr = useTimerStore(s => s.getFormattedTime());
  const progress = useTimerStore(s => s.getProgress());
  const isEatingWindowOver = useTimerStore(s => s.isEatingWindowOver());

  const intervalRef = useRef(null);

  // Tick every second while a fast or eating window is active
  useEffect(() => {
    if (timerState === 'fasting' || timerState === 'eating') {
      intervalRef.current = setInterval(tick, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerState, tick]);

  const protocolConfig = FASTING_PROTOCOLS[protocol];

  // SVG ring calculations
  const size = 80;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const isActive = timerState === 'fasting' || timerState === 'eating';

  const handleToggle = () => {
    triggerHaptic('medium');
    if (isActive) {
      stopFast();
    } else {
      startFast();
    }
  };

  return (
    <div className="bg-white dark:bg-[#141416] rounded-[24px] p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-violet-50 dark:bg-violet-500/10 rounded-[10px] flex items-center justify-center">
            <Timer size={16} className="text-violet-500" />
          </div>
          <span className="text-sm font-bold text-gray-900 dark:text-white">Fasting</span>
        </div>
        {/* Protocol selector */}
        <select
          value={protocol}
          onChange={(e) => setProtocol(e.target.value)}
          disabled={isActive}
          aria-label="Select fasting protocol"
          className="text-xs font-bold bg-gray-50 dark:bg-white/5 border-0 rounded-lg px-2 py-1 text-gray-600 dark:text-gray-400 outline-none appearance-none cursor-pointer disabled:opacity-50"
        >
          {Object.entries(FASTING_PROTOCOLS).map(([key]) => (
            <option key={key} value={key}>{key}</option>
          ))}
        </select>
      </div>

      {/* Timer display */}
      <div className="flex items-center gap-4">
        {/* Ring */}
        <div className="relative flex-shrink-0">
          <svg width={size} height={size} className="-rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-gray-100 dark:text-white/5"
            />
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="url(#timerGradient)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
            <defs>
              <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#6d28d9" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-black tabular-nums text-gray-900 dark:text-white">
              {timeStr}
            </span>
          </div>
        </div>

        {/* Status & controls */}
        <div className="flex-1">
          <p className={`text-xs font-bold mb-1 ${
            timerState === 'fasting' ? 'text-violet-500' :
            timerState === 'eating' ? (isEatingWindowOver ? 'text-amber-500' : 'text-emerald-500') :
            'text-gray-400'
          }`}>
            {timerState === 'fasting' ? '🔥 Fasting' :
             timerState === 'eating' ? (isEatingWindowOver ? '⏰ Eating window closed' : '🍽️ Eating Window') :
             'Ready'}
          </p>
          <p className="text-[10px] text-gray-400 mb-2">
            {protocolConfig ? `${protocolConfig.fast}h fast / ${protocolConfig.eat}h eat` : protocol}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggle}
              aria-label={isActive ? 'Stop fasting' : 'Start fasting'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                isActive
                  ? 'bg-red-50 dark:bg-red-500/10 text-red-500'
                  : 'bg-violet-50 dark:bg-violet-500/10 text-violet-500'
              }`}
            >
              {isActive ? <><Square size={10} fill="currentColor" /> Stop</> : <><Play size={10} fill="currentColor" /> Start Fast</>}
            </button>
            {isEatingWindowOver && (
              <button
                onClick={() => { triggerHaptic('medium'); startFast(); }}
                aria-label="Start next fast"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 bg-violet-50 dark:bg-violet-500/10 text-violet-500"
              >
                <Play size={10} fill="currentColor" /> Next Fast
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {isActive && (
        <div className="mt-3 h-1 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-violet-500 rounded-full"
            animate={{ width: `${Math.min(100, progress * 100)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      )}
    </div>
  );
}

export default memo(FastingTimer);
