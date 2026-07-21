import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('./change-nav.js', () => ({ updateChangeCounter: vi.fn() }));

// Import the mocked module to access the spy
import { updateChangeCounter } from './change-nav.js';
import { state } from './state.js';
import {
  getValueStatus,
  computeStats,
  buildChangeIndex,
} from './diff-engine.js';

describe('getValueStatus()', () => {
  it('returns "same" when both are null', () => {
    expect(getValueStatus(null, null)).toBe('same');
  });

  it('returns "same" when both are undefined', () => {
    expect(getValueStatus(undefined, undefined)).toBe('same');
  });

  it('returns "same" when left null and right undefined', () => {
    expect(getValueStatus(null, undefined)).toBe('same');
    expect(getValueStatus(undefined, null)).toBe('same');
  });

  it('returns "added" when left is null/undefined and right exists', () => {
    expect(getValueStatus(null, 'a')).toBe('added');
    expect(getValueStatus(undefined, 'a')).toBe('added');
  });

  it('returns "removed" when left exists and right is null/undefined', () => {
    expect(getValueStatus('a', null)).toBe('removed');
    expect(getValueStatus('a', undefined)).toBe('removed');
  });

  it('returns "changed" for type mismatch', () => {
    expect(getValueStatus('1', 1)).toBe('changed');
  });

  it('returns "changed" for different primitive values', () => {
    expect(getValueStatus(1, 2)).toBe('changed');
  });

  it('returns "same" for equal primitives', () => {
    expect(getValueStatus(1, 1)).toBe('same');
    expect(getValueStatus('a', 'a')).toBe('same');
    expect(getValueStatus(true, true)).toBe('same');
  });

  it('returns "same" for same object reference', () => {
    const obj = { a: 1 };
    expect(getValueStatus(obj, obj)).toBe('same');
  });

  it('returns "same" for deep-equal objects', () => {
    expect(getValueStatus({ a: 1 }, { a: 1 })).toBe('same');
  });

  it('returns "changed" for deep-different objects', () => {
    expect(getValueStatus({ a: 1 }, { a: 2 })).toBe('changed');
  });

  it('returns "changed" for deeply nested different values', () => {
    expect(getValueStatus({ a: { b: { c: 1 } } }, { a: { b: { c: 2 } } })).toBe('changed');
  });

  it('returns "changed" when JSON.stringify throws (cycle)', () => {
    const a = {};
    const b = {};
    a.self = a;
    b.self = b;
    // Different cycle objects are never deep-equal
    expect(getValueStatus(a, b)).toBe('changed');
  });
});

describe('computeStats()', () => {
  beforeEach(() => {
    state.EXCLUDED_FIELDS = new Set();
  });

  it('returns all zeros for both undefined', () => {
    expect(computeStats(undefined, undefined))
      .toEqual({ changed: 0, added: 0, removed: 0, same: 0 });
  });

  it('counts identical primitives as same', () => {
    expect(computeStats(1, 1))
      .toEqual({ changed: 0, added: 0, removed: 0, same: 1 });
  });

  it('counts type mismatch as changed', () => {
    expect(computeStats('1', 1))
      .toEqual({ changed: 1, added: 0, removed: 0, same: 0 });
  });

  it('counts nested changes correctly', () => {
    const left = { a: { b: 1 } };
    const right = { a: { b: 2 } };
    expect(computeStats(left, right))
      .toEqual({ changed: 1, added: 0, removed: 0, same: 0 });
  });

  it('counts added keys', () => {
    const left = { a: 1 };
    const right = { a: 1, b: 2 };
    expect(computeStats(left, right))
      .toEqual({ changed: 0, added: 1, removed: 0, same: 1 });
  });

  it('counts removed keys', () => {
    const left = { a: 1, b: 2 };
    const right = { a: 1 };
    expect(computeStats(left, right))
      .toEqual({ changed: 0, added: 0, removed: 1, same: 1 });
  });

  it('counts excluded fields as same', () => {
    state.EXCLUDED_FIELDS = new Set(['timestamp']);
    const left = { timestamp: '2024-01-01', value: 100 };
    const right = { timestamp: '2024-01-02', value: 100 };
    expect(computeStats(left, right))
      .toEqual({ changed: 0, added: 0, removed: 0, same: 2 });
  });

  it('counts array vs scalar as changed', () => {
    expect(computeStats([1], { a: 1 }))
      .toEqual({ changed: 1, added: 0, removed: 0, same: 0 });
  });

  it('compares arrays element by element', () => {
    const left = { unit: { name: 'AHU-1', zones: ['zoneA'] } };
    const right = { unit: { name: 'AHU-2', zones: ['zoneA'] } };
    const result = computeStats(left, right);
    // name (changed), zones/zoneA (same)
    expect(result.changed).toBe(1);
    expect(result.same).toBe(1);
    expect(result.added).toBe(0);
    expect(result.removed).toBe(0);
  });
});

describe('buildChangeIndex()', () => {
  beforeEach(() => {
    state.EXCLUDED_FIELDS = new Set();
    state.CHANGE_INDEX = [];
    state.currentChangeIdx = -1;
  });

  it('populates CHANGE_INDEX with change paths', () => {
    const left = { a: { c: 1 }, b: 2 };
    const right = { a: { c: 3 }, b: 2 };

    buildChangeIndex(left, right);

    expect(state.CHANGE_INDEX.length).toBe(1);
    expect(state.CHANGE_INDEX[0]).toEqual({ path: '/a/c', status: 'changed' });
  });

  it('sorts shallow paths first', () => {
    const left = { a: { x: 1 }, b: 2, c: 3 };
    const right = { a: { x: 2 }, b: 3, c: 3 };

    buildChangeIndex(left, right);

    // /b (depth 1) should sort before /a/x (depth 2)
    expect(state.CHANGE_INDEX[0].path).toBe('/b');
    expect(state.CHANGE_INDEX[1].path).toBe('/a/x');
    expect(state.CHANGE_INDEX.length).toBe(2);
  });

  it('respects excluded fields', () => {
    state.EXCLUDED_FIELDS = new Set(['timestamp']);
    const left = { timestamp: 'old', value: 100 };
    const right = { timestamp: 'new', value: 200 };

    buildChangeIndex(left, right);

    // timestamp excluded, value changed
    expect(state.CHANGE_INDEX.length).toBe(1);
    expect(state.CHANGE_INDEX[0].path).toBe('/value');
    expect(state.CHANGE_INDEX[0].status).toBe('changed');
  });

  it('calls updateChangeCounter via the mocked module', () => {
    updateChangeCounter.mockClear();

    buildChangeIndex({ a: 1 }, { a: 2 });

    expect(updateChangeCounter).toHaveBeenCalledTimes(1);
  });

  it('sets currentChangeIdx to -1 and resets index', () => {
    state.currentChangeIdx = 5;
    state.CHANGE_INDEX = [{ path: '/old', status: 'changed' }];

    buildChangeIndex({ a: 1 }, { a: 1 });

    expect(state.currentChangeIdx).toBe(-1);
    expect(state.CHANGE_INDEX).toEqual([]);
  });

  it('returns early when left or right data is missing', () => {
    buildChangeIndex(null, { a: 1 });
    expect(state.CHANGE_INDEX).toEqual([]);

    buildChangeIndex({ a: 1 }, null);
    expect(state.CHANGE_INDEX).toEqual([]);
  });
});
