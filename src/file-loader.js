/**
 * File loading — drop zones, file selection, paste, URL fetch.
 *
 * Ported from monolithic app.js (lines 182-207 + DOMContentLoaded handlers).
 */

import { state } from './state.js';
import { reorganize } from './reorganizer.js';
import { computeStats } from './diff-engine.js';
import { refreshView } from './tree-renderer.js';

// =========================================================================
//  Fetch helper
// =========================================================================

export function tryFetch(url) {
  return fetch(url).then(function (r) {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  });
}

// =========================================================================
//  Set side data (from file or paste)
// =========================================================================

export function setSideData(side, data, filename) {
  if (side === 'left') {
    state.DATA_LEFT = data;
    state.FILE_LEFT = filename || '';
  } else {
    state.DATA_RIGHT = data;
    state.FILE_RIGHT = filename || '';
  }
  const cap = side.charAt(0).toUpperCase() + side.slice(1);
  document.getElementById('drop' + cap + 'Name').textContent =
    filename || '(pasted)';
  document.getElementById('drop' + cap).classList.add('loaded');
}

// =========================================================================
//  onDataLoaded — called when both sides have data
// =========================================================================

export function onDataLoaded() {
  state.JMESPATH_ACTIVE = false;
  state.currentFilter = null;
  state.currentMap = null;
  state.DATA_LEFT_RAW = JSON.parse(JSON.stringify(state.DATA_LEFT));
  state.DATA_RIGHT_RAW = JSON.parse(JSON.stringify(state.DATA_RIGHT));
  if (state.reorganizeEnabled) {
    state.DATA_LEFT = reorganize(state.DATA_LEFT);
    state.DATA_RIGHT = reorganize(state.DATA_RIGHT);
  }
  document.getElementById('toolbar').style.display = 'flex';
  document.getElementById('splitView').style.display = 'flex';
  document.getElementById('panelLeftTitle').textContent = state.FILE_LEFT;
  document.getElementById('panelRightTitle').textContent = state.FILE_RIGHT;
  state.CACHED_STATS = computeStats(state.DATA_LEFT, state.DATA_RIGHT);
  refreshView();
}

// =========================================================================
//  Drop zone setup
// =========================================================================

export function setupDropZone(side) {
  const zone = document.getElementById(
    'drop' + side.charAt(0).toUpperCase() + side.slice(1),
  );
  const fileInput = zone.querySelector('input[type="file"]');

  // Click to select
  zone.addEventListener('click', function () {
    fileInput.click();
  });

  // File selected via dialog
  fileInput.addEventListener('change', function () {
    const file = fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        setSideData(side, JSON.parse(e.target.result), file.name);
        if (state.DATA_LEFT && state.DATA_RIGHT) onDataLoaded();
      } catch (err) {
        /* ignore */
      }
    };
    reader.readAsText(file);
  });

  // Drag & drop
  zone.addEventListener('dragover', function (e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    zone.classList.add('drag-over');
  });
  zone.addEventListener('dragleave', function () {
    zone.classList.remove('drag-over');
  });
  zone.addEventListener('drop', function (e) {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const file = Array.from(e.dataTransfer.files).find(function (f) {
      return f.name.endsWith('.json');
    });
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (ev) {
      try {
        setSideData(side, JSON.parse(ev.target.result), file.name);
        if (state.DATA_LEFT && state.DATA_RIGHT) onDataLoaded();
      } catch (err) {
        /* ignore */
      }
    };
    reader.readAsText(file);
  });
}
