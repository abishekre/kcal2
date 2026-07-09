import { describe, it, expect, beforeEach } from 'vitest';
import { useFoodStore } from '../store/useFoodStore';
import { useAppStore } from '../store/useAppStore';

describe('useFoodStore', () => {
  beforeEach(() => {
    useFoodStore.setState({ customFoods: {} });
    // addCustomFood/removeCustomFood require a signed-in user — without
    // this they bail out before touching state and these tests would
    // pass trivially without exercising the code they claim to cover.
    useAppStore.setState({ userId: 'test-user' });
  });

  it('adds a custom food successfully with an ID', () => {
    const foodData = {
      name: 'Test Chicken',
      cals: 250,
      p: 30,
      c: 0,
      f: 10,
      unit: 'serving',
      category: 'lunch'
    };

    useFoodStore.getState().addCustomFood('test_id_123', foodData);
    const store = useFoodStore.getState();
    
    expect(store.customFoods['test_id_123']).toEqual(foodData);
  });

  it('retrieves full DB including custom foods', () => {
    useFoodStore.getState().addCustomFood('custom_apple', {
      name: 'Custom Apple', cals: 100, p: 0, c: 25, f: 0, unit: 'item', category: 'snack'
    });
    
    const db = useFoodStore.getState().getFullDB();
    expect(db['custom_apple']).toBeDefined();
    expect(db['custom_apple'].name).toBe('Custom Apple');
    // Assuming BASE_FOOD_DB has something like 'apple_1' or whatever
    expect(Object.keys(db).length).toBeGreaterThan(1);
  });

  it('removes a custom food successfully', () => {
    useFoodStore.getState().addCustomFood('test_1', { name: 'Food 1', cals: 100 });
    useFoodStore.getState().addCustomFood('test_2', { name: 'Food 2', cals: 200 });
    
    useFoodStore.getState().removeCustomFood('test_1');
    const store = useFoodStore.getState();
    
    expect(store.customFoods['test_1']).toBeUndefined();
    expect(store.customFoods['test_2']).toBeDefined();
  });
});
