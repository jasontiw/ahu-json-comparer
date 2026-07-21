import { describe, it, expect, beforeEach } from 'vitest';
import { state } from './state.js';
import { reorganize } from './reorganizer.js';

const SIMPLE_FIXTURE = {
  unit: {
    segmentList: [
      { id: 'seg-A', geometry: { x: 100 }, name: 'Segment A' },
      { id: 'seg-B', geometry: { x: 50 }, name: 'Segment B' },
    ],
    openingList: [
      { id: 'op-1', associatedUISegmentID: 'seg-A', width: 600 },
    ],
    bulkheadList: [
      { id: 'bh-1', associatedUISegmentID: 'seg-B', height: 300 },
    ],
  },
};

describe('reorganize()', () => {
  beforeEach(() => {
    state.sortByXEnabled = false;
  });

  it('nests single-ref items into parent segments', () => {
    const result = reorganize(SIMPLE_FIXTURE);
    const segments = result.unit.segmentList;

    // seg-A should have openings
    const segA = segments.find((s) => s.id === 'seg-A');
    expect(segA.openings).toBeDefined();
    expect(segA.openings).toHaveLength(1);
    expect(segA.openings[0].id).toBe('op-1');

    // seg-B should have bulkheads
    const segB = segments.find((s) => s.id === 'seg-B');
    expect(segB.bulkheads).toBeDefined();
    expect(segB.bulkheads).toHaveLength(1);
    expect(segB.bulkheads[0].id).toBe('bh-1');
  });

  it('deletes consumed source lists from result', () => {
    const result = reorganize(SIMPLE_FIXTURE);
    expect(result.unit.openingList).toBeUndefined();
    expect(result.unit.bulkheadList).toBeUndefined();
  });

  it('deep clones input — original is unmodified', () => {
    const original = JSON.parse(JSON.stringify(SIMPLE_FIXTURE));
    reorganize(SIMPLE_FIXTURE);
    expect(SIMPLE_FIXTURE).toEqual(original);
    // Verify original lists are still intact
    expect(SIMPLE_FIXTURE.unit.openingList).toBeDefined();
    expect(SIMPLE_FIXTURE.unit.bulkheadList).toBeDefined();
  });

  it('sorts segments by geometry.x when sortByXEnabled is true', () => {
    state.sortByXEnabled = true;
    const result = reorganize(SIMPLE_FIXTURE);
    const ids = result.unit.segmentList.map((s) => s.id);
    // seg-B (x=50) should come before seg-A (x=100)
    expect(ids).toEqual(['seg-B', 'seg-A']);
  });

  it('preserves original order when sortByXEnabled is false', () => {
    const result = reorganize(SIMPLE_FIXTURE);
    const ids = result.unit.segmentList.map((s) => s.id);
    expect(ids).toEqual(['seg-A', 'seg-B']);
  });

  it('collects unmatched items in _unmatched', () => {
    const data = {
      unit: {
        segmentList: [{ id: 'seg-A', geometry: { x: 100 }, name: 'Segment A' }],
        openingList: [
          { id: 'op-1', associatedUISegmentID: 'nonexistent', width: 600 },
        ],
      },
    };
    const result = reorganize(data);
    expect(result.unit._unmatched).toBeDefined();
    expect(result.unit._unmatched.openings).toHaveLength(1);
    expect(result.unit._unmatched.openings[0].id).toBe('op-1');
  });

  it('handles null GUID items as unmatched', () => {
    const data = {
      unit: {
        segmentList: [{ id: 'seg-A', geometry: { x: 100 } }],
        openingList: [
          { id: 'op-1', associatedUISegmentID: '00000000-0000-0000-0000-000000000000' },
        ],
      },
    };
    const result = reorganize(data);
    expect(result.unit._unmatched).toBeDefined();
    expect(result.unit._unmatched.openings).toHaveLength(1);
  });

  it('returns input unchanged when segmentList is missing', () => {
    const data = { unit: {} };
    const result = reorganize(data);
    expect(result).toEqual(data);
  });

  it('returns input unchanged when segmentList is empty', () => {
    const data = { unit: { segmentList: [] } };
    const result = reorganize(data);
    expect(result).toEqual(data);
  });
});
