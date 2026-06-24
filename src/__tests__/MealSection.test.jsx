import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MealSection from '../components/Dashboard/MealSection';

// Mock matchMedia and framer-motion if needed
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('MealSection Component', () => {
  const mockFullDB = {
    'food_1': { name: 'Apple', cals: 50, unit: 'item' }
  };

  it('renders the custom title passed to it instead of the default config label', () => {
    render(
      <MealSection 
        mealKey="custom_123" 
        title="Pre-Workout" 
        foods={{}} 
        fullDB={mockFullDB}
        isLocked={false}
        onUpdateQty={() => {}}
        onRemoveFood={() => {}}
        onDitto={() => {}}
        onAddTap={() => {}}
        onDeleteMeal={() => {}}
      />
    );
    
    // Should render the custom title
    expect(screen.getByText('Pre-Workout')).toBeInTheDocument();
    
    // Should NOT render "Morning" just because it fell back to the morning config
    expect(screen.queryByText('Morning')).not.toBeInTheDocument();
  });
});
