/**
 * Application entry point.
 *
 * Imports all modules, wires DOM event listeners, and initialises
 * scroll-sync / breadcrumb / keyboard.
 *
 * Ported from monolithic app.js DOMContentLoaded closure (lines 710-1077).
 */

import { state } from './state.js';
import { esc, parseExcludeInput } from './utils.js';
import { reorganize } from './reorganizer.js';
import { computeStats } from './diff-engine.js';
import {
  refreshView,
  expandAll,
  collapseAll,
} from './tree-renderer.js';
import {
  tryFetch,
  setSideData,
  onDataLoaded,
  setupDropZone,
} from './file-loader.js';
import { navigateToChange } from './change-nav.js';
import { openHelp, closeHelp } from './help-modal.js';
import { initScrollSync } from './scroll-sync.js';
import { initBreadcrumb } from './breadcrumb.js';
import { initKeyboard } from './keyboard.js';
import { serializeState, deserializeState } from './share-state.js';

document.addEventListener('DOMContentLoaded', function () {
  // ===================================================================
  //  Drop zones
  // ===================================================================

  setupDropZone('left');
  setupDropZone('right');

  // ===================================================================
  //  Paste toggle — show / hide textarea
  // ===================================================================

  document.querySelectorAll('.paste-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const side = this.getAttribute('data-side');
      const ta = document.getElementById(
        'paste' + side.charAt(0).toUpperCase() + side.slice(1),
      );
      const loadBtn = document.getElementById(
        'pasteLoad' + side.charAt(0).toUpperCase() + side.slice(1),
      );
      const isOpen = ta.classList.toggle('open');
      loadBtn.style.display = isOpen ? 'inline-block' : 'none';
    });
  });

  // ===================================================================
  //  Paste load buttons
  // ===================================================================

  document.getElementById('pasteLoadLeft').addEventListener('click', function () {
    const ta = document.getElementById('pasteLeft');
    try {
      setSideData('left', JSON.parse(ta.value));
      ta.classList.remove('open');
      this.style.display = 'none';
      if (state.DATA_RIGHT) onDataLoaded();
    } catch (e) {
      alert('Invalid JSON in left paste area');
    }
  });

  document.getElementById('pasteLoadRight').addEventListener('click', function () {
    const ta = document.getElementById('pasteRight');
    try {
      setSideData('right', JSON.parse(ta.value));
      ta.classList.remove('open');
      this.style.display = 'none';
      if (state.DATA_LEFT) onDataLoaded();
    } catch (e) {
      alert('Invalid JSON in right paste area');
    }
  });

  // ===================================================================
  //  Filter input (debounced)
  // ===================================================================

  document.getElementById('filterInput').addEventListener('input', function () {
    clearTimeout(state.filterTimer);
    state.filterTimer = setTimeout(refreshView, 200);
  });

  document.getElementById('filterInput').addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      this.value = '';
      refreshView();
    }
  });

  document.getElementById('filterBtn').addEventListener('click', refreshView);

  // ===================================================================
  //  JMESPath input (Enter to execute)
  // ===================================================================

  document.getElementById('mapInput').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      try {
        localStorage.setItem('jci-jmespath-expr', this.value);
      } catch (ex) {
        /* ignore */
      }
      refreshView();
    }
    if (e.key === 'Escape') {
      this.value = '';
      try {
        localStorage.setItem('jci-jmespath-expr', '');
      } catch (ex) {
        /* ignore */
      }
      refreshView();
    }
  });

  document.getElementById('mapBtn').addEventListener('click', function () {
    const val = document.getElementById('mapInput').value;
    try {
      localStorage.setItem('jci-jmespath-expr', val);
    } catch (ex) {
      /* ignore */
    }
    refreshView();
  });

  // ===================================================================
  //  Restore saved JMESPath expression
  // ===================================================================

  try {
    const savedExpr = localStorage.getItem('jci-jmespath-expr');
    if (savedExpr) {
      document.getElementById('mapInput').value = savedExpr;
    }
  } catch (ex) {
    /* ignore */
  }

  // ===================================================================
  //  Reorganize toggle
  // ===================================================================

  document.getElementById('reorganizeToggle').addEventListener('change', function () {
    state.reorganizeEnabled = this.checked;
    document.getElementById('sortByXToggle').disabled = !state.reorganizeEnabled;
    if (!state.DATA_LEFT_RAW) return;
    state.DATA_LEFT = state.reorganizeEnabled
      ? reorganize(JSON.parse(JSON.stringify(state.DATA_LEFT_RAW)))
      : JSON.parse(JSON.stringify(state.DATA_LEFT_RAW));
    state.DATA_RIGHT = state.reorganizeEnabled
      ? reorganize(JSON.parse(JSON.stringify(state.DATA_RIGHT_RAW)))
      : JSON.parse(JSON.stringify(state.DATA_RIGHT_RAW));
    state.CACHED_STATS = computeStats(state.DATA_LEFT, state.DATA_RIGHT);
    state.currentFilter = null;
    state.currentMap = null;
    refreshView();
  });

  // ===================================================================
  //  Sort by X toggle
  // ===================================================================

  document.getElementById('sortByXToggle').addEventListener('change', function () {
    state.sortByXEnabled = this.checked;
    try {
      localStorage.setItem('jci-sort-by-x', state.sortByXEnabled);
    } catch (e) {
      /* ignore */
    }
    if (!state.DATA_LEFT_RAW || !state.reorganizeEnabled) return;
    state.DATA_LEFT = reorganize(JSON.parse(JSON.stringify(state.DATA_LEFT_RAW)));
    state.DATA_RIGHT = reorganize(
      JSON.parse(JSON.stringify(state.DATA_RIGHT_RAW)),
    );
    state.CACHED_STATS = computeStats(state.DATA_LEFT, state.DATA_RIGHT);
    state.currentFilter = null;
    state.currentMap = null;
    refreshView();
  });

  // ===================================================================
  //  Init sort toggle from localStorage
  // ===================================================================

  try {
    const savedSort = localStorage.getItem('jci-sort-by-x');
    if (savedSort !== null) {
      state.sortByXEnabled = savedSort === 'true';
      document.getElementById('sortByXToggle').checked = state.sortByXEnabled;
    }
  } catch (e) {
    /* ignore */
  }
  document.getElementById('sortByXToggle').disabled =
    !document.getElementById('reorganizeToggle').checked;

  // ===================================================================
  //  Exclude fields
  // ===================================================================

  const EXCLUDE_STORAGE_KEY = 'jci-exclude-fields';
  let excludeTimer = null;

  function saveExcludeToStorage(value) {
    try {
      localStorage.setItem(EXCLUDE_STORAGE_KEY, value);
    } catch (e) {
      /* ignore */
    }
  }

  function loadExcludeFromStorage() {
    try {
      const saved = localStorage.getItem(EXCLUDE_STORAGE_KEY);
      return saved || '';
    } catch (e) {
      return '';
    }
  }

  function applyExclude(value) {
    state.EXCLUDED_FIELDS = parseExcludeInput(value);
    const input = document.getElementById('excludeInput');
    input.classList.toggle('active', value.trim().length > 0);
    if (state.DATA_LEFT) {
      state.CACHED_STATS = computeStats(state.DATA_LEFT, state.DATA_RIGHT);
      state.currentFilter = null;
      state.currentMap = null;
      refreshView();
    }
  }

  // Restore saved exclude value on load
  const savedExclude = loadExcludeFromStorage();
  if (savedExclude) {
    document.getElementById('excludeInput').value = savedExclude;
    applyExclude(savedExclude);
  }

  // ===================================================================
  //  Hash state restore (overrides localStorage for shared links)
  // ===================================================================

  const hash = window.location.hash.slice(1);
  if (hash) {
    deserializeState(hash);
  }

  document.getElementById('excludeInput').addEventListener('input', function () {
    clearTimeout(excludeTimer);
    const input = this;
    excludeTimer = setTimeout(function () {
      saveExcludeToStorage(input.value);
      applyExclude(input.value);
    }, 300);
  });

  document.getElementById('excludeInput').addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      this.value = '';
      clearTimeout(excludeTimer);
      saveExcludeToStorage('');
      applyExclude('');
    }
  });

  // ===================================================================
  //  Scroll sync
  // ===================================================================

  initScrollSync();

  // ===================================================================
  //  Breadcrumb
  // ===================================================================

  initBreadcrumb();

  // ===================================================================
  //  Expand / Collapse all
  // ===================================================================

  document.getElementById('expandAllBtn').addEventListener('click', expandAll);
  document.getElementById('collapseAllBtn').addEventListener('click', collapseAll);

  // ===================================================================
  //  Share link — Copy Link button
  // ===================================================================

  document.getElementById('shareLinkBtn').addEventListener('click', function () {
    const hash = serializeState();
    window.location.hash = hash;
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(function () {
      const btn = document.getElementById('shareLinkBtn');
      const orig = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(function () { btn.textContent = orig; }, 2000);
    }).catch(function () {
      // Fallback: execCommand
      const ta = document.createElement('textarea');
      ta.value = url;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      const btn = document.getElementById('shareLinkBtn');
      const orig = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(function () { btn.textContent = orig; }, 2000);
    });
  });

  // ===================================================================
  //  Change navigation
  // ===================================================================

  document.getElementById('nextChangeBtn').addEventListener('click', function () {
    navigateToChange(1);
  });
  document.getElementById('prevChangeBtn').addEventListener('click', function () {
    navigateToChange(-1);
  });

  // ===================================================================
  //  Help modal
  // ===================================================================

  // Help buttons with data-topic attributes
  document.querySelectorAll('.help-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const topic = this.getAttribute('data-topic');
      openHelp(topic);
    });
  });

  // Close help on overlay click
  document.getElementById('helpOverlay').addEventListener('click', closeHelp);

  // Close help on × button
  document.querySelector('.help-modal-close').addEventListener('click', closeHelp);

  // Prevent overlay click from propagating through modal body
  document.querySelector('.help-modal').addEventListener('click', function (e) {
    e.stopPropagation();
  });

  // ===================================================================
  //  Keyboard shortcuts
  // ===================================================================

  initKeyboard();

  // ===================================================================
  //  URL params — ?left=...&right=...
  // ===================================================================

  const params = new URLSearchParams(window.location.search);
  if (params.has('left') && params.has('right')) {
    Promise.all([tryFetch(params.get('left')), tryFetch(params.get('right'))])
      .then(function (results) {
        setSideData('left', results[0], params.get('left'));
        setSideData('right', results[1], params.get('right'));
        onDataLoaded();
      })
      .catch(function () {
        // URL params failed — user picks files manually
      });
  }
});
