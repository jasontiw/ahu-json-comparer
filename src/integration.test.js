import { vi, describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

vi.mock('./change-nav.js', () => ({ updateChangeCounter: vi.fn() }));

import { state } from './state.js';
import { reorganize } from './reorganizer.js';
import { computeStats, buildChangeIndex } from './diff-engine.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadFixture(name) {
  const fixturePath = path.resolve(__dirname, '..', 'data', 'fixtures', name);
  return JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
}

describe('integration: reorganize → computeStats → buildChangeIndex', () => {
  let fixture;

  beforeEach(() => {
    fixture = loadFixture('simple.json');
    state.EXCLUDED_FIELDS = new Set();
    state.CHANGE_INDEX = [];
    state.currentChangeIdx = -1;
    state.sortByXEnabled = false;
  });

  it('wires the full pipeline with non-zero stats', () => {
    // Reorganize the left side
    const reorged = reorganize(fixture);
    // Use reorganized data against itself — all should be "same"
    const stats = computeStats(reorged, reorged);

    expect(stats.same).toBeGreaterThan(0);
    // No differences against self
    expect(stats.changed).toBe(0);
    expect(stats.added).toBe(0);
    expect(stats.removed).toBe(0);
  });

  it('produces change index entries when reorganized data differs from original', () => {
    const reorgedLeft = reorganize(fixture);

    // Make a right copy with a modified value
    const right = JSON.parse(JSON.stringify(fixture));
    right.unit.segmentList[0].name = 'Modified';

    const reorgedRight = reorganize(right);

    buildChangeIndex(reorgedLeft, reorgedRight);

    expect(state.CHANGE_INDEX.length).toBeGreaterThan(0);
    // Every entry has path and status
    for (const entry of state.CHANGE_INDEX) {
      expect(entry).toHaveProperty('path');
      expect(entry).toHaveProperty('status');
      expect(['changed', 'added', 'removed']).toContain(entry.status);
    }
  });

  it('sorts change index shallow-first', () => {
    // Create data with changes at different depths
    const left = {
      unit: {
        segmentList: [
          { id: 'seg-A', geometry: { x: 100 }, details: { temp: 22 } },
        ],
      },
    };
    const right = {
      unit: {
        segmentList: [
          { id: 'seg-B', geometry: { x: 200 }, details: { temp: 25 } },
        ],
      },
    };

    buildChangeIndex(left, right);

    const depths = state.CHANGE_INDEX.map(
      (e) => e.path.split('/').filter(Boolean).length,
    );
    for (let i = 1; i < depths.length; i++) {
      expect(depths[i]).toBeGreaterThanOrEqual(depths[i - 1]);
    }
  });

  it('computeStats returns non-zero stats with reorganized data and a modified copy', () => {
    const reorged = reorganize(fixture);

    // Deep clone and modify a value
    const modified = JSON.parse(JSON.stringify(reorged));
    modified.unit.segmentList[0].name = 'Changed Name';

    const stats = computeStats(reorged, modified);

    expect(stats.changed).toBe(1);
    // The segment objects have multiple keys: id, geometry, name, openings
    // After reorganize, seg-A has: id, geometry, name, openings
    // Same keys + 1 changed = same count = number of shared leaf values
    expect(stats.same).toBeGreaterThan(0);
    expect(stats.added).toBe(0);
    expect(stats.removed).toBe(0);
  });

  it('does not mutate the original fixture', () => {
    const originalJson = JSON.stringify(fixture);
    reorganize(fixture);
    expect(JSON.stringify(fixture)).toBe(originalJson);
  });
});
