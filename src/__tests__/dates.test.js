import { describe, it, expect, vi, afterEach } from 'vitest';
import { getDaysRemaining } from '../utils/dates';

describe('getDaysRemaining', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('reports 1 day remaining for tomorrow even late in the current day', () => {
    // Regression: differenceInDays truncates by 24h, so at 11pm "tomorrow"
    // was under-reported as 0 days remaining. Calendar-day math should
    // always say 1 regardless of what time it currently is.
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 0, 10, 23, 0, 0)); // Jan 10, 11pm

    expect(getDaysRemaining('2024-01-11')).toBe(1);
  });

  it('reports 0 days remaining for today at any time of day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 0, 10, 23, 59, 0));

    expect(getDaysRemaining('2024-01-10')).toBe(0);
  });

  it('reports a negative count for a past target date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 0, 10, 8, 0, 0));

    expect(getDaysRemaining('2024-01-08')).toBe(-2);
  });
});
