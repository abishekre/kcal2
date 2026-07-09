import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import RobotBanner from '../components/Dashboard/RobotBanner';
import * as messages from '../robot/messages';
import * as insights from '../engine/insights';

describe('RobotBanner', () => {
  it('renders both the robot message and the insight text', () => {
    vi.spyOn(messages, 'determineScenario').mockReturnValue('morning_empty');
    vi.spyOn(messages, 'getRobotMessage').mockReturnValue('Robot punchline here.');
    vi.spyOn(insights, 'generateInsight').mockReturnValue({ text: 'Specific insight text here.' });

    const consumption = { cals: 0 };
    const target = { cals: 2000 };

    render(
      <RobotBanner 
        mode="good"
        cals={0}
        targetCals={2000}
        streakCount={1}
        goal="cut"
        hour={8}
        consumption={consumption}
        target={target}
      />
    );

    expect(screen.getByText(/Robot punchline here\./)).toBeInTheDocument();
    expect(screen.getByText(/Specific insight text here\./)).toBeInTheDocument();
  });

  // Regression: the dashboard passes calorie/target data but the real
  // generateInsight must still produce a personalized insight. A previous bug
  // meant the target object never reached generateInsight, so every banner
  // silently fell back to the generic "set up your profile" copy.
  it('shows a real insight (not the setup fallback) from live data', () => {
    render(
      <RobotBanner
        mode="good"
        cals={0}
        targetCals={2000}
        streakCount={1}
        goal="cut"
        hour={8}
        consumption={{ cals: 0, macros: { p: 0, c: 0, f: 0 }, categories: {}, mealCals: {} }}
        target={{ cals: 2000, p: 150, c: 200, f: 60 }}
      />
    );

    expect(
      screen.queryByText(/set up your profile and goals/i)
    ).not.toBeInTheDocument();
  });

  // Even if a caller forgets the full `target` object, a bare targetCals must
  // still yield a personalized insight rather than the setup fallback.
  it('degrades gracefully when only targetCals is provided', () => {
    render(
      <RobotBanner
        mode="good"
        cals={0}
        targetCals={2000}
        streakCount={1}
        goal="cut"
        hour={8}
        consumption={{ cals: 0, macros: { p: 0, c: 0, f: 0 }, categories: {}, mealCals: {} }}
      />
    );

    expect(
      screen.queryByText(/set up your profile and goals/i)
    ).not.toBeInTheDocument();
  });
});
