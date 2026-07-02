/**
 * Difference engine — compares two JSON trees and produces change data.
 *
 * Ported from monolithic app.js (lines 255-306 + 1086-1131).
 */

import { state } from './state.js';
import { isExcludedField } from './utils.js';
import { updateChangeCounter } from './change-nav.js';

// ---------------------------------------------------------------------------
//  Value comparison
// ---------------------------------------------------------------------------

/**
 * Compare two values and return a status string.
 *
 * @param {*} leftVal
 * @param {*} rightVal
 * @returns {'same'|'added'|'removed'|'changed'}
 */
export function getValueStatus(leftVal, rightVal) {
  if (leftVal === undefined || leftVal === null) {
    if (rightVal === undefined || rightVal === null) return 'same';
    return 'added';
  }
  if (rightVal === undefined || rightVal === null) return 'removed';
  if (typeof leftVal !== typeof rightVal) return 'changed';
  if (typeof leftVal !== 'object') {
    return leftVal !== rightVal ? 'changed' : 'same';
  }
  if (leftVal === rightVal) return 'same';
  try {
    return JSON.stringify(leftVal) === JSON.stringify(rightVal)
      ? 'same'
      : 'changed';
  } catch (e) {
    return 'changed';
  }
}

// ---------------------------------------------------------------------------
//  Stats
// ---------------------------------------------------------------------------

/**
 * Walk both objects and count changes.
 *
 * @returns {{ changed: number, added: number, removed: number, same: number }}
 */
export function computeStats(left, right) {
  let changed = 0,
    added = 0,
    removed = 0,
    same = 0;

  function walk(l, r, parentKey) {
    if (l === undefined && r === undefined) return;
    if (l === undefined || r === undefined) {
      if (isExcludedField(parentKey)) {
        same++;
        return;
      }
      if (l === undefined && r !== undefined) added++;
      else if (r === undefined && l !== undefined) removed++;
      return;
    }
    if (
      typeof l !== 'object' ||
      l === null ||
      typeof r !== 'object' ||
      r === null
    ) {
      if (isExcludedField(parentKey)) {
        same++;
        return;
      }
      if (JSON.stringify(l) === JSON.stringify(r)) same++;
      else changed++;
      return;
    }
    if (Array.isArray(l) && Array.isArray(r)) {
      const maxLen = Math.max(l.length, r.length);
      for (let i = 0; i < maxLen; i++) walk(l[i], r[i], parentKey);
    } else if (!Array.isArray(l) && !Array.isArray(r)) {
      const allKeys = Object.keys(l).concat(Object.keys(r));
      const keySet = {};
      for (let ki = 0; ki < allKeys.length; ki++) keySet[allKeys[ki]] = true;
      for (const key in keySet) walk(l[key], r[key], key);
    } else {
      if (isExcludedField(parentKey)) {
        same++;
        return;
      }
      changed++;
    }
  }

  walk(left, right, '');
  return { changed, added, removed, same };
}

// ---------------------------------------------------------------------------
//  Change index  (ordered list of change paths for navigation)
// ---------------------------------------------------------------------------

/**
 * Build an ordered list of change paths by walking both trees.
 * Results are stored in state.CHANGE_INDEX and sorted shallow-first.
 */
export function buildChangeIndex(leftData, rightData) {
  state.CHANGE_INDEX = [];
  state.currentChangeIdx = -1;
  if (!leftData || !rightData) return;

  function walk(l, r, path, parentKey) {
    if (l === undefined && r === undefined) return;
    if (l === undefined || r === undefined) {
      if (!isExcludedField(parentKey)) {
        state.CHANGE_INDEX.push({
          path,
          status: l === undefined ? 'added' : 'removed',
        });
      }
      return;
    }
    if (
      typeof l !== 'object' ||
      l === null ||
      typeof r !== 'object' ||
      r === null
    ) {
      if (!isExcludedField(parentKey) && JSON.stringify(l) !== JSON.stringify(r)) {
        state.CHANGE_INDEX.push({ path, status: 'changed' });
      }
      return;
    }
    if (Array.isArray(l) && Array.isArray(r)) {
      const maxLen = Math.max(l.length, r.length);
      for (let i = 0; i < maxLen; i++)
        walk(l[i], r[i], path + '/[' + i + ']', parentKey);
    } else if (!Array.isArray(l) && !Array.isArray(r)) {
      const allKeys = Object.keys(l).concat(Object.keys(r));
      const keySet = {};
      for (let ki = 0; ki < allKeys.length; ki++) keySet[allKeys[ki]] = true;
      for (const key in keySet)
        walk(l[key], r[key], path + '/' + key, key);
    } else {
      if (!isExcludedField(parentKey)) {
        state.CHANGE_INDEX.push({ path, status: 'changed' });
      }
    }
  }

  walk(leftData, rightData, '', '');

  // Sort shallow paths first so top-level changes appear before deeply nested ones
  state.CHANGE_INDEX.sort(function (a, b) {
    const depthA = a.path.split('/').filter(Boolean).length;
    const depthB = b.path.split('/').filter(Boolean).length;
    if (depthA !== depthB) return depthA - depthB;
    return a.path < b.path ? -1 : a.path > b.path ? 1 : 0;
  });

  updateChangeCounter();
}


