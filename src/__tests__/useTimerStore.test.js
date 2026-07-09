import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useTimerStore } from '../store/useTimerStore';

describe('useTimerStore', () => {
  beforeEach(() => {
    useTimerStore.setState({ timerState: 'idle', startTime: null, protocol: '16:8', elapsed: 0 });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses the selected protocol\'s actual fasting duration, not always 16h', () => {
    // Regression: tick()/getProgress() used to read protocolConfig.fastHours,
    // a field that doesn't exist (FASTING_PROTOCOLS stores it under `fast`),
    // so every protocol silently behaved like 16:8.
    vi.useFakeTimers();
    const start = new Date(2024, 0, 1, 8, 0, 0);
    vi.setSystemTime(start);

    useTimerStore.getState().setProtocol('20:4');
    useTimerStore.getState().startFast();

    // 17 hours in: past the 16h a bugged implementation would've completed at,
    // but still short of the real 20h target for this protocol.
    vi.setSystemTime(new Date(start.getTime() + 17 * 3600 * 1000));
    useTimerStore.getState().tick();

    expect(useTimerStore.getState().timerState).toBe('fasting');
    expect(useTimerStore.getState().getProgress()).toBeCloseTo(17 / 20, 5);
  });

  it('transitions to the eating window once the fast completes, sized to that protocol', () => {
    vi.useFakeTimers();
    const start = new Date(2024, 0, 1, 8, 0, 0);
    vi.setSystemTime(start);

    useTimerStore.getState().setProtocol('20:4');
    useTimerStore.getState().startFast();

    vi.setSystemTime(new Date(start.getTime() + 20 * 3600 * 1000 + 1000));
    useTimerStore.getState().tick();

    expect(useTimerStore.getState().timerState).toBe('eating');
    expect(useTimerStore.getState().isEatingWindowOver()).toBe(false);

    vi.setSystemTime(new Date(start.getTime() + 20 * 3600 * 1000 + 4 * 3600 * 1000 + 1000));
    useTimerStore.getState().tick();
    expect(useTimerStore.getState().isEatingWindowOver()).toBe(true);
  });
});
