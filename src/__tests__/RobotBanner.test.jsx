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
});
