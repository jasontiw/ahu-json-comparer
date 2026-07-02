/**
 * Pure helper / utility functions.
 * Shared by all DOM-manipulating modules.
 */

import { state } from './state.js';

/**
 * HTML-entity-escape a string value.
 */
export function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Parse a comma-separated exclude-field input value.
 * Returns a Set of trimmed names.
 */
export function parseExcludeInput(value) {
  const set = new Set();
  if (!value || !value.trim()) return set;
  const parts = value.split(',');
  for (let i = 0; i < parts.length; i++) {
    const name = parts[i].trim();
    if (name) set.add(name);
  }
  return set;
}

/**
 * Check whether a field name is excluded from diff calculations.
 * Supports glob-ish wildcard patterns (e.g. *_ID).
 */
export function isExcludedField(key) {
  if (!key || state.EXCLUDED_FIELDS.size === 0) return false;
  if (state.EXCLUDED_FIELDS.has(key)) return true;
  // Glob-ish wildcard: *_ID matches SEGMENT_ID, IP_ID, etc.
  const patterns = Array.from(state.EXCLUDED_FIELDS);
  for (let pi = 0; pi < patterns.length; pi++) {
    const pattern = patterns[pi];
    if (pattern.indexOf('*') !== -1) {
      const re = new RegExp(
        '^' +
          pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') +
          '$',
      );
      if (re.test(key)) return true;
    }
  }
  return false;
}

/**
 * Format a JSON value for display in the tree.
 * Returns an HTML string.
 */
export function formatValue(v) {
  if (v === null || v === undefined)
    return '<span class="value-null">null</span>';
  if (typeof v === 'boolean')
    return '<span class="value-bool">' + v + '</span>';
  if (typeof v === 'string')
    return '<span class="value-string">"' + esc(v) + '"</span>';
  if (typeof v === 'number')
    return '<span class="value-number">' + v + '</span>';
  return '<span class="value-same">' + esc(JSON.stringify(v)) + '</span>';
}

/**
 * Describe a JMESPath result value for display / stats.
 */
export function describeResult(v) {
  if (v === null || v === undefined) return '\u2205';
  if (typeof v === 'string') return 'string(' + v.length + ')';
  if (typeof v === 'number') return 'number';
  if (typeof v === 'boolean') return 'boolean';
  if (Array.isArray(v)) return 'array[' + v.length + ']';
  return 'object{' + Object.keys(v).length + '}';
}
