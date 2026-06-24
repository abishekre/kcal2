import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import DateNavigator from '../components/Core/DateNavigator';

vi.mock('../utils/haptics', () => ({
  triggerHaptic: vi.fn()
}));

describe('DateNavigator', () => {
  const mockOnDateChange = vi.fn();
  const today = new Date().toLocaleDateString('en-CA');
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders today string and day numbers correctly', () => {
    render(<DateNavigator selectedDate={today} onDateChange={mockOnDateChange} ledger={{}} />);
    
    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('calls onDateChange when previous button is clicked', () => {
    render(<DateNavigator selectedDate={today} onDateChange={mockOnDateChange} ledger={{}} />);
    
    // There are multiple buttons, the first one is the left chevron
    const prevButton = screen.getAllByRole('button')[0];
    fireEvent.click(prevButton);
    
    expect(mockOnDateChange).toHaveBeenCalled();
  });

  it('disables forward button when today is selected', () => {
    render(<DateNavigator selectedDate={today} onDateChange={mockOnDateChange} ledger={{}} />);
    
    // The second to last button in the header should be disabled if we exclude the week days
    // Actually the header has two buttons: prev and next.
    const buttons = screen.getAllByRole('button');
    const nextButton = buttons[1]; // Index 1 is the next arrow
    
    expect(nextButton).toBeDisabled();
  });
});
