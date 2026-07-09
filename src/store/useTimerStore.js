import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FASTING_PROTOCOLS } from '../utils/constants';

export const useTimerStore = create(
  persist(
    (set, get) => ({
      timerState: 'idle',   // 'idle' | 'fasting' | 'eating'
      startTime: null,      // timestamp when the current phase (fast or eat) started
      protocol: '16:8',     // selected fasting protocol
      elapsed: 0,           // elapsed seconds in the current phase

      startFast: () => {
        set({
          timerState: 'fasting',
          startTime: Date.now(),
          elapsed: 0
        });
      },

      stopFast: () => {
        set({
          timerState: 'idle',
          startTime: null,
          elapsed: 0
        });
      },

      setProtocol: (p) => {
        if (FASTING_PROTOCOLS[p]) {
          set({ protocol: p });
        }
      },

      tick: () => {
        const { timerState, startTime } = get();
        if (timerState === 'idle' || !startTime) return;

        const elapsed = Math.floor((Date.now() - startTime) / 1000);

        if (timerState === 'fasting') {
          const protocolConfig = FASTING_PROTOCOLS[get().protocol];
          const fastingSeconds = (protocolConfig?.fast ?? 16) * 3600;
          if (elapsed >= fastingSeconds) {
            // Fasting window completed — switch to the eating window
            set({ timerState: 'eating', startTime: Date.now(), elapsed: 0 });
            return;
          }
        }

        set({ elapsed });
      },

      // Progress (0-1) within the *current* phase (fasting or eating).
      getProgress: () => {
        const { elapsed, protocol, timerState } = get();
        const protocolConfig = FASTING_PROTOCOLS[protocol];
        const phaseHours = timerState === 'eating'
          ? (protocolConfig?.eat ?? 8)
          : (protocolConfig?.fast ?? 16);
        const phaseSeconds = phaseHours * 3600;
        return phaseSeconds > 0 ? Math.min(1, elapsed / phaseSeconds) : 0;
      },

      // True once the eating window's duration has elapsed — the UI uses
      // this to prompt starting the next fast rather than auto-starting it.
      isEatingWindowOver: () => {
        const { timerState, elapsed, protocol } = get();
        if (timerState !== 'eating') return false;
        const protocolConfig = FASTING_PROTOCOLS[protocol];
        const eatingSeconds = (protocolConfig?.eat ?? 8) * 3600;
        return elapsed >= eatingSeconds;
      },

      getFormattedTime: () => {
        const { elapsed } = get();
        const hours = Math.floor(elapsed / 3600);
        const minutes = Math.floor((elapsed % 3600) / 60);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      },

      clearAll: () => {
        set({ timerState: 'idle', startTime: null, elapsed: 0 });
      }
    }),
    {
      name: 'kcal-timer',
      partialize: (state) => ({
        timerState: state.timerState,
        startTime: state.startTime,
        protocol: state.protocol,
      }),
    }
  )
);
