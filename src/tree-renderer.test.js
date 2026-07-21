import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock change-nav since diff-engine imports it (even though we only test pure functions)
vi.mock('./change-nav.js', () => ({ updateChangeCounter: vi.fn() }));

import { state } from './state.js';
import {
  resolvePath,
  makeDescriptor,
  computeFilterKey,
} from './tree-renderer.js';

describe('resolvePath()', () => {
  const obj = {
    a: 1,
    items: [{ name: 'alpha' }, { name: 'beta' }],
    nested: { deep: { value: 'found' } },
  };

  it('returns the root object for empty path', () => {
    expect(resolvePath(obj, '')).toBe(obj);
  });

  it('returns the root object for slash-only path', () => {
    expect(resolvePath(obj, '/')).toBe(obj);
  });

  it('resolves a top-level key', () => {
    expect(resolvePath(obj, '/a')).toBe(1);
  });

  it('resolves a nested key', () => {
    expect(resolvePath(obj, '/nested/deep/value')).toBe('found');
  });

  it('resolves array index with bracket syntax', () => {
    expect(resolvePath(obj, '/items/[0]/name')).toBe('alpha');
    expect(resolvePath(obj, '/items/[1]/name')).toBe('beta');
  });

  it('returns undefined for missing key', () => {
    expect(resolvePath(obj, '/nonexistent')).toBeUndefined();
  });

  it('returns undefined for missing deep path', () => {
    expect(resolvePath(obj, '/nested/missing')).toBeUndefined();
  });

  it('handles path without leading slash', () => {
    expect(resolvePath(obj, 'items/[0]/name')).toBe('alpha');
  });
});

describe('makeDescriptor()', () => {
  beforeEach(() => {
    state.EXCLUDED_FIELDS = new Set();
  });

  it('marks branch nodes with children', () => {
    const desc = makeDescriptor('x', { a: 1 }, { a: 2 }, 'left', 0, '/x');
    expect(desc.key).toBe('x');
    expect(desc.isBranch).toBe(true);
    expect(desc.hasChildren).toBe(true);
    expect(desc.status).toBe('changed');
    expect(desc.side).toBe('left');
    expect(desc.depth).toBe(0);
    expect(desc.path).toBe('/x');
  });

  it('marks empty object as branch without children', () => {
    const desc = makeDescriptor('empty', {}, {}, 'right', 1, '/empty');
    expect(desc.isBranch).toBe(true);
    expect(desc.hasChildren).toBe(false);
    expect(desc.status).toBe('same');
  });

  it('marks null as non-branch', () => {
    const desc = makeDescriptor('n', null, null, 'left', 0, '/n');
    expect(desc.isBranch).toBe(false);
    expect(desc.hasChildren).toBe(false);
  });

  it('marks leaf values as non-branch', () => {
    const desc = makeDescriptor('v', 42, 42, 'right', 2, '/v');
    expect(desc.isBranch).toBe(false);
    expect(desc.hasChildren).toBe(false);
    expect(desc.status).toBe('same');
  });

  it('computes changed status for different values', () => {
    const desc = makeDescriptor('v', 1, 2, 'left', 0, '/v');
    expect(desc.status).toBe('changed');
  });

  it('forces status to "same" for excluded fields', () => {
    state.EXCLUDED_FIELDS = new Set(['timestamp']);
    const desc = makeDescriptor('timestamp', 'old', 'new', 'left', 0, '/timestamp');
    expect(desc.status).toBe('same');
  });
});

describe('computeFilterKey()', () => {
  it('returns true when filter is empty', () => {
    expect(computeFilterKey({ key: 'anything' }, '')).toBe(true);
  });

  it('returns true when key matches filter (case-insensitive)', () => {
    const desc = { key: 'UserName', val: 'Alice' };
    expect(computeFilterKey(desc, 'user')).toBe(true);
    // filter is pre-lowercased by the caller
    expect(computeFilterKey(desc, 'name')).toBe(true);
  });

  it('returns true when value matches filter (case-insensitive)', () => {
    const desc = { key: 'name', val: 'Alice' };
    expect(computeFilterKey(desc, 'alice')).toBe(true);
  });

  it('returns false when neither key nor value matches', () => {
    const desc = { key: 'UserName', val: 'Alice' };
    expect(computeFilterKey(desc, 'bob')).toBe(false);
  });

  it('matches against otherVal when val is null/undefined', () => {
    const desc = { key: 'name', val: null, otherVal: 'Bob' };
    expect(computeFilterKey(desc, 'bob')).toBe(true);
  });

  it('matches against JSON.stringify of objects', () => {
    const desc = { key: 'tags', val: ['important'] };
    expect(computeFilterKey(desc, 'important')).toBe(true);
  });
});
