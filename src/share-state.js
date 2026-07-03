/**
 * Serialize and deserialize application state for share links.
 *
 * Reads DOM element values, compresses via LZ-String, and produces
 * a URL-safe hash string (no leading #).
 */

import LZString from 'lz-string';
import { state } from './state.js';
import { parseExcludeInput } from './utils.js';
import { refreshView } from './tree-renderer.js';

/**
 * Read current UI state from the DOM and return a compressed hash string.
 * @returns {string} LZ-String compressed URI-encoded string (no leading #)
 */
export function serializeState() {
  const payload = {
    f: document.getElementById('filterInput').value,
    j: document.getElementById('mapInput').value,
    r: document.getElementById('reorganizeToggle').checked,
    s: document.getElementById('sortByXToggle').checked,
    e: document.getElementById('excludeInput').value,
  };
  return LZString.compressToEncodedURIComponent(JSON.stringify(payload));
}

/**
 * Restore UI state from a compressed hash string.
 * @param {string} hash - LZ-String compressed URI-encoded string (may have leading #)
 */
export function deserializeState(hash) {
  try {
    // Strip leading # if present
    const clean = hash.startsWith('#') ? hash.slice(1) : hash;
    const json = LZString.decompressFromEncodedURIComponent(clean);
    if (!json) return;
    const payload = JSON.parse(json);

    // Restore DOM elements
    const filterInput = document.getElementById('filterInput');
    if (payload.f !== undefined) filterInput.value = payload.f;

    const mapInput = document.getElementById('mapInput');
    if (payload.j !== undefined) mapInput.value = payload.j;

    const reorganizeToggle = document.getElementById('reorganizeToggle');
    if (payload.r !== undefined) reorganizeToggle.checked = payload.r;

    const sortByXToggle = document.getElementById('sortByXToggle');
    if (payload.s !== undefined) sortByXToggle.checked = payload.s;

    const excludeInput = document.getElementById('excludeInput');
    if (payload.e !== undefined) {
      excludeInput.value = payload.e;
      excludeInput.classList.toggle('active', payload.e.trim().length > 0);
    }

    // Update state properties
    state.reorganizeEnabled = reorganizeToggle.checked;
    state.sortByXEnabled = sortByXToggle.checked;

    // Apply exclude fields to state
    state.EXCLUDED_FIELDS = parseExcludeInput(excludeInput.value);

    // Sort toggle disabled state depends on reorganize
    sortByXToggle.disabled = !reorganizeToggle.checked;

    // Refresh view if both data sides are loaded
    if (state.DATA_LEFT && state.DATA_RIGHT) {
      refreshView();
    }
  } catch (e) {
    // Silently ignore invalid hashes
  }
}
