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

    const prevButton = screen.getByLabelText('Previous day');
    fireEvent.click(prevButton);

    expect(mockOnDateChange).toHaveBeenCalled();
  });

  it('disables forward button when today is selected', () => {
    render(<DateNavigator selectedDate={today} onDateChange={mockOnDateChange} ledger={{}} />);

    expect(screen.getByLabelText('Next day')).toBeDisabled();
  });
});
