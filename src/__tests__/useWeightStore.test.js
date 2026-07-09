import { describe, it, expect, beforeEach } from 'vitest';
import { useWeightStore } from '../store/useWeightStore';

describe('useWeightStore read methods', () => {
  beforeEach(() => {
    useWeightStore.setState({ weightLog: { '2024-01-01': 80, '2024-01-03': 79, '2024-01-02': 79.5 }, dirty: {} });
  });

  it('getLatestWeight and getWeightTrend do not call set() — safe to call directly during render', () => {
    // Regression: these used to memoize sorted keys via set(), which is a
    // state update triggered synchronously during render whenever a
    // component (e.g. ProgressPage) calls them in its render body — React
    // throws "Cannot update a component while rendering a different
    // component" for exactly this pattern.
    let setCallCount = 0;
    const unsubscribe = useWeightStore.subscribe(() => { setCallCount++; });

    useWeightStore.getState().getLatestWeight();
    useWeightStore.getState().getWeightTrend(30);
    useWeightStore.getState().getWeightTrend();

    unsubscribe();
    expect(setCallCount).toBe(0);
  });

  it('getLatestWeight returns the most recent date\'s weight', () => {
    expect(useWeightStore.getState().getLatestWeight()).toBe(79);
  });

  it('getWeightTrend returns entries sorted ascending by date', () => {
    const trend = useWeightStore.getState().getWeightTrend();
    expect(trend.map(d => d.date)).toEqual(['2024-01-01', '2024-01-02', '2024-01-03']);
  });
});
