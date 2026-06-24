import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CustomMealSheet from '../components/Sheets/CustomMealSheet';

describe('CustomMealSheet Component', () => {
  it('calls onAdd with the meal name when submitted', () => {
    const handleAdd = vi.fn();
    const handleClose = vi.fn();
    
    render(<CustomMealSheet onAdd={handleAdd} onClose={handleClose} />);
    
    const input = screen.getByPlaceholderText('e.g. Pre-Workout, Midnight Snack...');
    fireEvent.change(input, { target: { value: 'Post-Workout' } });
    
    const addButton = screen.getByText('Add Meal');
    fireEvent.click(addButton);
    
    expect(handleAdd).toHaveBeenCalledWith('Post-Workout');
    expect(handleClose).toHaveBeenCalled();
  });

  it('disables the add button if input is empty', () => {
    render(<CustomMealSheet onAdd={vi.fn()} onClose={vi.fn()} />);
    
    const addButton = screen.getByText('Add Meal');
    expect(addButton).toBeDisabled();
  });
});
