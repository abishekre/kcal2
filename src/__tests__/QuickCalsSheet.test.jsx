import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import QuickCalsSheet from '../components/Sheets/QuickCalsSheet';

describe('QuickCalsSheet Component', () => {
  it('calls onAdd with numeric calories when submitted', () => {
    const handleAdd = vi.fn();
    const handleClose = vi.fn();
    
    render(<QuickCalsSheet onAdd={handleAdd} onClose={handleClose} />);
    
    const input = screen.getByPlaceholderText('0');
    fireEvent.change(input, { target: { value: '350' } });
    
    const addButton = screen.getByText('Add Calories');
    fireEvent.click(addButton);
    
    expect(handleAdd).toHaveBeenCalledWith(350);
    expect(handleClose).toHaveBeenCalled();
  });

  it('disables the add button if input is empty or zero', () => {
    render(<QuickCalsSheet onAdd={vi.fn()} onClose={vi.fn()} />);
    
    const addButton = screen.getByText('Add Calories');
    expect(addButton).toBeDisabled();
    
    const input = screen.getByPlaceholderText('0');
    fireEvent.change(input, { target: { value: '0' } });
    expect(addButton).toBeDisabled();
  });
});
