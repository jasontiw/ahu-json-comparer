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
  //  Theme restore
  // ===================================================================

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    const btn = document.getElementById('themeToggle');
    if (btn) btn.textContent = theme === 'dark' ? '\u{1F319}' : '\u{2600}\u{FE0F}';
  }

  function initTheme() {
    let theme = 'dark';
    try { theme = localStorage.getItem('jci-theme') || 'dark'; } catch (e) { /* ignore */ }
    applyTheme(theme);

    document.getElementById('themeToggle').addEventListener('click', function () {
      const current = document.documentElement.dataset.theme || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem('jci-theme', next); } catch (e) { /* ignore */ }
    });
  }

  initTheme();

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
  //  JMESPath toolbar textarea — auto-resize + newline-stripped display
  // ===================================================================

  const mapInput = document.getElementById('mapInput');

  /** Preserved value with newlines — for the panel editor */
  let jmespathRealValue = '';

  function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = Math.max(el.scrollHeight, 28) + 'px';
  }

  /** Set toolbar display (flat) + update real value */
  function setToolbarDisplay(value) {
    jmespathRealValue = value;
    mapInput.value = value.replace(/\n/g, ' ');
    autoResize(mapInput);
  }

  mapInput.addEventListener('input', function () {
    // Strip any newlines typed/pasted in the toolbar — keep it compact
    if (this.value.includes('\n')) {
      this.value = this.value.replace(/\n/g, ' ');
    }
    jmespathRealValue = this.value;
    autoResize(this);
  });

  mapInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      try { localStorage.setItem('jci-jmespath-expr', jmespathRealValue); } catch (ex) { /* ignore */ }
      saveQueryHistory(jmespathRealValue);
      refreshView();
    }
    if (e.key === 'Escape') {
      this.value = '';
      jmespathRealValue = '';
      this.style.height = 'auto';
      try { localStorage.setItem('jci-jmespath-expr', ''); } catch (ex) { /* ignore */ }
      refreshView();
    }
  });

  document.getElementById('mapBtn').addEventListener('click', function () {
    try { localStorage.setItem('jci-jmespath-expr', jmespathRealValue); } catch (ex) { /* ignore */ }
    saveQueryHistory(jmespathRealValue);
    refreshView();
  });

  // ===================================================================
  //  JMESPath expandable editor panel
  // ===================================================================

  const mapExpandBtn = document.getElementById('mapExpandBtn');
  const jmespathEditor = document.getElementById('jmespathEditor');
  const jmespathEditorInput = document.getElementById('jmespathEditorInput');
  const jmespathEditorClose = document.getElementById('jmespathEditorClose');
  const jmespathEditorRun = document.getElementById('jmespathEditorRun');

  let justOpened = false;

  const jmespathGroup = mapInput.parentElement;

  function openEditor() {
    jmespathEditorInput.value = jmespathRealValue;
    jmespathEditor.style.display = 'block';
    jmespathGroup.classList.add('editor-open');
    justOpened = true;
    setTimeout(function () { justOpened = false; }, 250);
    setTimeout(function () { jmespathEditorInput.focus(); }, 50);
  }

  function closeEditor() {
    jmespathRealValue = jmespathEditorInput.value;
    setToolbarDisplay(jmespathRealValue);
    jmespathEditor.style.display = 'none';
    jmespathGroup.classList.remove('editor-open');
  }

  function closeEditorAndRun() {
    jmespathRealValue = jmespathEditorInput.value;
    try { localStorage.setItem('jci-jmespath-expr', jmespathRealValue); } catch (ex) { /* ignore */ }
    saveQueryHistory(jmespathRealValue);
    setToolbarDisplay(jmespathRealValue);
    jmespathEditor.style.display = 'none';
    jmespathGroup.classList.remove('editor-open');
    refreshView();
  }

  mapExpandBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    openEditor();
  });

  // Also open editor when toolbar textarea gets focus (for long expressions)
  mapInput.addEventListener('focus', function () {
    if (this.value.length > 80) openEditor();
  });

  jmespathEditorClose.addEventListener('click', function (e) {
    e.stopPropagation();
    closeEditor();
  });

  jmespathEditorRun.addEventListener('click', function (e) {
    e.stopPropagation();
    closeEditorAndRun();
  });

  // Ctrl+Enter in panel editor runs the query
  jmespathEditorInput.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      jmespathEditorRun.click();
    }
    if (e.key === 'Escape' && !e.shiftKey) {
      closeEditor();
    }
  });

  // Click outside the editor panel closes it (ignores clicks right after open)
  document.addEventListener('click', function (e) {
    if (jmespathEditor.style.display === 'none') return;
    if (justOpened) return;
    if (jmespathEditor.contains(e.target)) return;
    if (mapExpandBtn.contains(e.target)) return;
    closeEditor();
  });

  // ===================================================================
  //  JMESPath Query History
  // ===================================================================

  const HISTORY_KEY = 'jci-jmespath-history';
  const MAX_HISTORY = 20;

  function loadQueryHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveQueryHistory(query) {
    const trimmed = query.trim();
    if (!trimmed) return;
    let history = loadQueryHistory();
    history = history.filter(function (entry) { return entry.query !== trimmed; });
    history.unshift({ query: trimmed, timestamp: Date.now() });
    if (history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (e) { /* ignore */ }
  }

  function renderQueryHistory() {
    const list = document.getElementById('mapHistoryList');
    const history = loadQueryHistory();
    if (history.length === 0) {
      list.innerHTML = '<li class="jmespath-history-empty">No previous queries</li>';
      return;
    }
    var html = '';
    for (var i = 0; i < history.length; i++) {
      const display = history[i].query.length > 50
        ? history[i].query.slice(0, 50) + '…'
        : history[i].query;
      html += '<li data-query="' + escAttr(history[i].query) + '">' + esc(display) + '</li>';
    }
    html += '<li class="history-clear" data-action="clear">Clear history</li>';
    list.innerHTML = html;
  }

  function escAttr(str) {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  document.getElementById('mapHistoryBtn').addEventListener('click', function (e) {
    e.stopPropagation();
    const list = document.getElementById('mapHistoryList');
    const isOpen = list.style.display === 'block';
    if (isOpen) {
      list.style.display = 'none';
    } else {
      renderQueryHistory();
      list.style.display = 'block';
    }
  });

  document.getElementById('mapHistoryList').addEventListener('click', function (e) {
    const li = e.target.closest('li');
    if (!li) return;
    if (li.getAttribute('data-action') === 'clear') {
      try { localStorage.removeItem(HISTORY_KEY); } catch (ex) { /* ignore */ }
      renderQueryHistory();
      this.style.display = 'none';
      return;
    }
    const query = li.getAttribute('data-query');
    if (!query) return;
    setToolbarDisplay(query);
    try { localStorage.setItem('jci-jmespath-expr', query); } catch (ex) { /* ignore */ }
    saveQueryHistory(query);
    this.style.display = 'none';
    refreshView();
  });

  document.addEventListener('click', function (e) {
    const wrap = document.querySelector('.jmespath-history-wrap');
    if (wrap && !wrap.contains(e.target)) {
      document.getElementById('mapHistoryList').style.display = 'none';
    }
  });

  // ===================================================================
  //  Restore saved JMESPath expression
  // ===================================================================

  try {
    const savedExpr = localStorage.getItem('jci-jmespath-expr');
    if (savedExpr) {
      jmespathRealValue = savedExpr;
      setToolbarDisplay(savedExpr);
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

  // Close help on overlay click (but not when clicking an insertable example)
  document.getElementById('helpOverlay').addEventListener('click', function (e) {
    if (e.target.closest('.help-insert')) return;
    closeHelp();
  });

  // Close help on × button
  document.querySelector('.help-modal-close').addEventListener('click', closeHelp);

  // Prevent overlay click from propagating through modal body
  document.querySelector('.help-modal').addEventListener('click', function (e) {
    e.stopPropagation();
  });

  // ===================================================================
  //  Click help examples to insert into input (JMESPath / Skip fields)
  // ===================================================================

  document.getElementById('helpModalBody').addEventListener('click', function (e) {
    const code = e.target.closest('.help-insert');
    if (!code) return;
    const value = code.textContent.trim();
    const target = code.getAttribute('data-insert');

    if (target === 'jmespath') {
      setToolbarDisplay(value);
      try { localStorage.setItem('jci-jmespath-expr', value); } catch (ex) { /* ignore */ }
      saveQueryHistory(value);
      closeHelp();
      refreshView();
    } else if (target === 'skip') {
      const input = document.getElementById('excludeInput');
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      closeHelp();
    }
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
