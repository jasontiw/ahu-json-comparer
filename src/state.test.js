import { describe, it, expect } from 'vitest';
import { state } from './state.js';

describe('state default shape', () => {
  it('has all 20 properties with correct default values', () => {
    // Data properties
    expect(state.DATA_LEFT).toBeNull();
    expect(state.DATA_RIGHT).toBeNull();
    expect(state.FILE_LEFT).toBe('');
    expect(state.FILE_RIGHT).toBe('');

    // Performance / optimisation
    expect(state.NODE_MAP).toBeInstanceOf(Map);
    expect(state.NODE_MAP.size).toBe(0);
    expect(state.CACHED_STATS).toBeNull();
    expect(state.filterTimer).toBeNull();
    expect(state.DATA_LEFT_RAW).toBeNull();
    expect(state.DATA_RIGHT_RAW).toBeNull();
    expect(state.reorganizeEnabled).toBe(true);
    expect(state.sortByXEnabled).toBe(true);
    expect(state.EXCLUDED_FIELDS).toBeInstanceOf(Set);
    expect(state.EXCLUDED_FIELDS.size).toBe(0);

    // JMESPath results
    expect(state.JMESPATH_LEFT).toBeNull();
    expect(state.JMESPATH_RIGHT).toBeNull();
    expect(state.JMESPATH_ACTIVE).toBe(false);

    // Expand/collapse guards
    expect(state.isExpanding).toBe(false);

    // Dedup guards
    expect(state.currentFilter).toBeNull();
    expect(state.currentMap).toBeNull();

    // Change navigation
    expect(state.CHANGE_INDEX).toEqual([]);
    expect(state.currentChangeIdx).toBe(-1);
  });
});
