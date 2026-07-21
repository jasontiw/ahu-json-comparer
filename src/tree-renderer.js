/**
 * Full-tree JSON diff renderer — lazy DOM builder for the side-by-side view.
 *
 * Ported from monolithic app.js (lines 308-653) plus refreshView,
 * expandAll, and collapseAll.
 */

import { state } from './state.js';
import { esc, isExcludedField, formatValue } from './utils.js';
import { reorganize } from './reorganizer.js';
import { getValueStatus, computeStats, buildChangeIndex } from './diff-engine.js';
import jmespath from 'jmespath';

// =========================================================================
//  Path resolution
// =========================================================================

/**
 * Resolve a slash-delimited path string against a data object.
 * Supports array index segments like /[0].
 */
export function resolvePath(obj, path) {
  if (!path || path === '') return obj;
  const parts = path.split('/').filter(Boolean);
  let current = obj;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (current === null || current === undefined) return undefined;
    if (part.startsWith('[') && part.endsWith(']')) {
      const idx = parseInt(part.slice(1, -1), 10);
      current = Array.isArray(current) ? current[idx] : undefined;
    } else {
      current = current[part];
    }
  }
  return current;
}

// =========================================================================
//  Descriptor factory
// =========================================================================

/**
 * Build a descriptor object for a tree node.
 * The descriptor contains all metadata needed to render a node.
 */
export function makeDescriptor(key, val, otherVal, side, depth, path) {
  const isBranch =
    val !== null && val !== undefined && typeof val === 'object';
  const hasChildren =
    isBranch &&
    (Array.isArray(val)
      ? val.length > 0
      : Object.keys(val).length > 0);
  let status = getValueStatus(val, otherVal);
  // Force 'same' for excluded fields — they still show but not as diffs
  if (status !== 'same' && isExcludedField(key)) {
    status = 'same';
  }
  return {
    key,
    val,
    otherVal,
    side,
    depth,
    path,
    isBranch,
    hasChildren,
    status,
  };
}

// =========================================================================
//  Filter match
// =========================================================================

/**
 * Check whether a node descriptor matches a lowercased filter string.
 */
export function computeFilterKey(desc, filterLower) {
  if (!filterLower) return true;
  if (desc.key && desc.key.toLowerCase().includes(filterLower)) return true;
  const checkVal =
    desc.val !== null && desc.val !== undefined
      ? desc.val
      : desc.otherVal;
  if (checkVal !== null && checkVal !== undefined) {
    const str = JSON.stringify(checkVal).toLowerCase();
    if (str.includes(filterLower)) return true;
  }
  return false;
}

// =========================================================================
//  Lazy expand
// =========================================================================

/**
 * Lazily populate a children container for the given descriptor.
 */
export function lazyExpandChildren(childrenDiv, desc) {
  const side = desc.side;
  const leftSource = state.JMESPATH_ACTIVE
    ? state.JMESPATH_LEFT
    : state.DATA_LEFT;
  const rightSource = state.JMESPATH_ACTIVE
    ? state.JMESPATH_RIGHT
    : state.DATA_RIGHT;
  const data = resolvePath(
    side === 'left' ? leftSource : rightSource,
    desc.path,
  );
  const otherData = resolvePath(
    side === 'left' ? rightSource : leftSource,
    desc.path,
  );

  if (data === null || data === undefined || typeof data !== 'object') return;

  const filterInput = document.getElementById('filterInput');
  const filterText = filterInput ? filterInput.value.trim().toLowerCase() : '';
  const fragment = document.createDocumentFragment();

  const childDepth = desc.depth + 1;

  if (Array.isArray(data)) {
    const otherArr = Array.isArray(otherData) ? otherData : [];
    for (let i = 0; i < data.length; i++) {
      const childPath = desc.path + '/[' + i + ']';
      const childDesc = makeDescriptor(
        '[' + i + ']',
        data[i],
        otherArr[i],
        side,
        childDepth,
        childPath,
      );
      if (filterText && !computeFilterKey(childDesc, filterText)) continue;
      const el = renderNodeFromDescriptor(childDesc);
      if (el) fragment.appendChild(el);
    }
  } else {
    const otherObj =
      otherData && typeof otherData === 'object' && !Array.isArray(otherData)
        ? otherData
        : {};
    for (const key in data) {
      const childPath = desc.path + '/' + key;
      const childDesc = makeDescriptor(
        key,
        data[key],
        otherObj[key],
        side,
        childDepth,
        childPath,
      );
      if (filterText && !computeFilterKey(childDesc, filterText)) continue;
      const el = renderNodeFromDescriptor(childDesc);
      if (el) fragment.appendChild(el);
    }
    // Keys only in the other side (leaf nodes — not expandable)
    if (
      otherData &&
      typeof otherData === 'object' &&
      !Array.isArray(otherData)
    ) {
      for (const key in otherData) {
        if (data[key] !== undefined) continue;
        const childPath = desc.path + '/' + key;
        const childDesc = makeDescriptor(
          key,
          undefined,
          otherData[key],
          side,
          childDepth,
          childPath,
        );
        if (filterText && !computeFilterKey(childDesc, filterText)) continue;
        const el = renderNodeFromDescriptor(childDesc);
        if (el) fragment.appendChild(el);
      }
    }
  }

  childrenDiv.appendChild(fragment);
}

function renderNodeFromDescriptor(desc) {
  return renderValueNode(desc);
}

// =========================================================================
//  Sync other panel (toggle mirrored on opposite side)
// =========================================================================

export function syncOtherPanel(side, path, expanded, depth) {
  const otherSide = side === 'left' ? 'right' : 'left';
  let otherChildren = state.NODE_MAP.get(otherSide + ':' + path);
  if (!otherChildren) {
    // Fallback: try querySelector if NODE_MAP lookup fails
    const otherId = side === 'left' ? 'viewRight' : 'viewLeft';
    otherChildren = document.querySelector(
      '#' +
        otherId +
        ' [data-path="' +
        path.replace(/\\/g, '\\\\').replace(/"/g, '\\"') +
        '"]',
    );
    if (!otherChildren) return;
  }
  if (!otherChildren.parentElement) return;
  const otherToggle = otherChildren.parentElement.querySelector('.toggle-icon');
  if (!otherToggle) return;
  if (expanded) {
    // Lazy-load on the other side if not yet expanded
    if (otherChildren.children.length === 0) {
      lazyExpandChildren(otherChildren, {
        path,
        depth: depth || 0,
        side: otherSide,
      });
    }
    otherChildren.classList.remove('hidden');
    otherToggle.textContent = '\u25BC';
  } else {
    otherChildren.classList.add('hidden');
    otherToggle.textContent = '\u25B6';
  }
}

// =========================================================================
//  Render a single value node
// =========================================================================

export function renderValueNode(desc) {
  const val = desc.val;
  const otherVal = desc.otherVal;

  // Node exists only on the other side
  if (
    (val === undefined || val === null) &&
    otherVal !== undefined &&
    otherVal !== null
  ) {
    const div = document.createElement('div');
    div.className = 'tree-node';
    if (desc.path) div.setAttribute('data-path', desc.path);
    const row = document.createElement('div');
    row.className = 'node-row';
    row.style.paddingLeft = desc.depth * 18 + 6 + 'px';
    row.innerHTML =
      '<span class="node-key">' +
      esc(desc.key) +
      '</span><span class="node-colon">:</span> ' +
      (desc.side === 'left'
        ? '<span class="value-added">(added)</span>'
        : '<span class="value-removed">(removed)</span>');
    div.appendChild(row);
    return div;
  }

  if (val === undefined || val === null) return null;

  const isBranch = desc.isBranch;
  const status = desc.status;
  const hasChildren = desc.hasChildren;

  const div = document.createElement('div');
  div.className = 'tree-node';
  if (desc.path) div.setAttribute('data-path', desc.path);

  if (isBranch && hasChildren) {
    // Branch node — row with toggle + empty childrenDiv (lazy)
    const row = document.createElement('div');
    row.className = 'node-row branch';
    row.style.paddingLeft = desc.depth * 18 + 6 + 'px';

    if (status !== 'same') {
      row.classList.add('has-diff');
    }

    const toggle = document.createElement('span');
    toggle.className = 'toggle-icon';
    toggle.textContent = '\u25B6';

    const keySpan = document.createElement('span');
    keySpan.className = 'node-key';
    keySpan.textContent = desc.key || '';

    const info = document.createElement('span');
    info.className = 'node-info';
    const effectiveVal =
      val !== null && val !== undefined ? val : otherVal;
    if (Array.isArray(effectiveVal)) {
      info.textContent = '[' + effectiveVal.length + ']';
    } else if (effectiveVal && typeof effectiveVal === 'object') {
      info.textContent = '{' + Object.keys(effectiveVal).length + '}';
    }

    row.appendChild(toggle);
    row.appendChild(keySpan);
    row.appendChild(info);
    div.appendChild(row);

    // Empty childrenDiv (filled on first expand)
    const childrenDiv = document.createElement('div');
    childrenDiv.className = 'children hidden';
    childrenDiv.setAttribute('data-path', desc.path);
    div.appendChild(childrenDiv);

    // Register in NODE_MAP for syncOtherPanel
    state.NODE_MAP.set(desc.side + ':' + desc.path, childrenDiv);

    let expanded = false;

    function toggleBranch() {
      if (expanded) {
        childrenDiv.classList.add('hidden');
        toggle.textContent = '\u25B6';
        expanded = false;
      } else {
        if (childrenDiv.children.length === 0) {
          lazyExpandChildren(childrenDiv, desc);
        }
        childrenDiv.classList.remove('hidden');
        toggle.textContent = '\u25BC';
        expanded = true;
      }
      syncOtherPanel(desc.side, desc.path, expanded, desc.depth);
    }

    row.onclick = function (e) {
      if (e.target.closest('.toggle-icon')) return;
      toggleBranch();
    };

    toggle.onclick = function (e) {
      e.stopPropagation();
      toggleBranch();
    };
  } else {
    // Leaf node
    const row = document.createElement('div');
    row.className = 'node-row';
    row.style.paddingLeft = desc.depth * 18 + 6 + 'px';

    if (status !== 'same') {
      row.classList.add('has-diff');
    }

    let keyHtml = '';
    if (desc.key != null && desc.key !== '') {
      keyHtml =
        '<span class="node-key">' +
        esc(desc.key) +
        '</span><span class="node-colon">:</span> ';
    }

    let valHtml = '';
    if (status === 'changed') {
      if (desc.side === 'left') {
        valHtml =
          '<span class="value-changed-left">' +
          esc(JSON.stringify(val)) +
          '</span>';
      } else {
        valHtml =
          '<span class="value-changed-right">' +
          esc(JSON.stringify(val)) +
          '</span>';
      }
    } else if (status === 'added') {
      valHtml =
        '<span class="value-added">' +
        esc(JSON.stringify(val)) +
        '</span>';
    } else if (status === 'removed') {
      valHtml =
        '<span class="value-removed">' +
        esc(JSON.stringify(val)) +
        '</span>';
    } else {
      valHtml = formatValue(val);
    }

    row.innerHTML = keyHtml + valHtml;
    div.appendChild(row);
  }

  return div;
}

// =========================================================================
//  Render full tree
// =========================================================================

export function renderFullTree(
  container,
  leftData,
  rightData,
  side,
  filterText,
  rootLabel,
) {
  container.innerHTML = '';
  const data = side === 'left' ? leftData : rightData;
  const otherData = side === 'left' ? rightData : leftData;
  const label = rootLabel || '(root)';

  const rootDesc = makeDescriptor(label, data, otherData, side, 0, '');
  const rootEl = renderNodeFromDescriptor(rootDesc);
  if (rootEl) container.appendChild(rootEl);
}

// =========================================================================
//  JMESPath result renderer
// =========================================================================

// JMESPath type-code → human-readable name
const _TYPE_NAMES = [
  'number', 'any', 'string', 'array', 'object',
  'boolean', 'expression', 'null', 'Array<number>', 'Array<string>',
];

/**
 * Parse a JMESPath error into { title, detail, hint } for the UI.
 */
function _parseJmespathError(errMsg, expression) {
  const m = String(errMsg);

  // "expected X, received Y" — translate numeric type codes
  const typeMatch = m.match(/expected (\d+), received (\d+)/);
  if (typeMatch) {
    const expected = _TYPE_NAMES[+typeMatch[1]] || '?';
    const received = _TYPE_NAMES[+typeMatch[2]] || '?';
    return {
      title: 'Sort type mismatch',
      detail: 'Expected ' + expected + ', received ' + received,
      hint: 'Some segments have the sort field as ' + received +
            ' instead of ' + expected +
            '. Check for segments with null/undefined values in that field. ' +
            'Use &not_null(field, `0`) as sort key to handle missing values.',
    };
  }

  // "expected one of X,Y, received Z"
  const oneOfMatch = m.match(/expected one of ([0-9, ]+), received (\d+)/);
  if (oneOfMatch) {
    const allowed = oneOfMatch[1].split(',').map(function (x) {
      return _TYPE_NAMES[+x.trim()] || '?';
    }).join(', ');
    const received = _TYPE_NAMES[+oneOfMatch[2]] || '?';
    return {
      title: 'Invalid argument type',
      detail: 'Expected one of: ' + allowed + ', but received ' + received,
      hint: 'A field in the expression returned ' + received +
            ' where a different type was expected. Try not_null() or filter with [?field].',
    };
  }

  // "length() expected argument 1 to be type ... but received type null instead"
  const funcMatch = m.match(/^(\w+)\(\) expected argument (\d+)/);
  if (funcMatch) {
    return {
      title: 'Error in ' + funcMatch[1] + '()',
      detail: m,
      hint: 'Argument ' + funcMatch[2] + ' of ' + funcMatch[1] +
            '() is null. Use not_null(field, `[]`) or filter with [?field].',
    };
  }

  // Generic TypeError from sort_by first-element check
  if (m === 'TypeError') {
    return {
      title: 'sort_by() type error',
      detail: 'sort_by() could not determine the sort type from the first element.',
      hint: 'The first element\'s sort field is null/undefined. ' +
            'Use &not_null(field, `0`) as sort key.',
    };
  }

  // Fallback — show raw message
  return {
    title: 'JMESPath error',
    detail: m,
    hint: '',
  };
}

export function renderJmesPathResult(expression, filterText) {
  let leftResult, rightResult;
  try {
    leftResult = jmespath.search(state.DATA_LEFT, expression);
    rightResult = jmespath.search(state.DATA_RIGHT, expression);
  } catch (e) {
    var parsed = _parseJmespathError(e.message, expression);
    var errorHtml =
      '<div class="jmespath-error">' +
        '<div class="jmespath-error-title">' + esc(parsed.title) + '</div>' +
        '<div class="jmespath-error-expr">' + esc(expression) + '</div>' +
        '<div class="jmespath-error-detail">' + esc(parsed.detail) + '</div>' +
        (parsed.hint
          ? '<div class="jmespath-error-hint">' + esc(parsed.hint) + '</div>'
          : '') +
        '<div class="jmespath-error-raw">Raw: ' + esc(e.message) + '</div>' +
      '</div>';
    document.getElementById('viewLeft').innerHTML = errorHtml;
    document.getElementById('viewRight').innerHTML = errorHtml;
    return;
  }

  if (state.reorganizeEnabled) {
    if (
      leftResult &&
      typeof leftResult === 'object' &&
      !Array.isArray(leftResult) &&
      leftResult.unit
    ) {
      leftResult = reorganize(leftResult);
    }
    if (
      rightResult &&
      typeof rightResult === 'object' &&
      !Array.isArray(rightResult) &&
      rightResult.unit
    ) {
      rightResult = reorganize(rightResult);
    }
  }

  const stats = computeStats(leftResult, rightResult);
  let resultSummary = '';
  if (leftResult === null && rightResult === null) {
    resultSummary = 'Query returned \u2205 (no match)';
  } else if (Array.isArray(leftResult) && Array.isArray(rightResult)) {
    const len = Math.max(leftResult.length, rightResult.length);
    resultSummary =
      len +
      ' item(s), ' +
      (stats.changed + stats.added + stats.removed) +
      ' difference(s), ' +
      stats.same +
      ' match(es)';
  } else {
    resultSummary =
      stats.changed + stats.added + stats.removed > 0
        ? 'Different'
        : 'Match';
  }

  document.getElementById('statsBar').innerHTML =
    '<span class="stat jmespath-active">JMESPath\u2192 ' +
    esc(expression) +
    '</span>' +
    '<span class="stat stat-total">' +
    resultSummary +
    '</span>' +
    '<span class="stat stat-changed">Changed: ' +
    stats.changed +
    '</span>' +
    '<span class="stat stat-added">Added: ' +
    stats.added +
    '</span>' +
    '<span class="stat stat-removed">Removed: ' +
    stats.removed +
    '</span>' +
    '<span class="stat stat-same">Same: ' +
    stats.same +
    '</span>';

  state.JMESPATH_LEFT = leftResult;
  state.JMESPATH_RIGHT = rightResult;
  state.JMESPATH_ACTIVE = true;

  renderFullTree(
    document.getElementById('viewLeft'),
    leftResult,
    rightResult,
    'left',
    filterText,
    expression,
  );
  renderFullTree(
    document.getElementById('viewRight'),
    leftResult,
    rightResult,
    'right',
    filterText,
    expression,
  );
}

// =========================================================================
//  Refresh view  (orchestrator: re-renders both panels on filter/map change)
// =========================================================================

export function refreshView() {
  if (!state.DATA_LEFT || !state.DATA_RIGHT) return;

  const filterExpr = document.getElementById('filterInput').value;
  const mapExpr = document.getElementById('mapInput').value;

  // Skip re-render if nothing changed (avoids duplicate work from debounce)
  if (filterExpr === state.currentFilter && mapExpr === state.currentMap) return;
  state.currentFilter = filterExpr;
  state.currentMap = mapExpr;

  // Reset node map for new render
  state.NODE_MAP = new Map();

  document.getElementById('splitView').style.display = 'flex';

  if (mapExpr && mapExpr.trim()) {
    renderJmesPathResult(mapExpr, filterExpr);
  } else {
    state.JMESPATH_ACTIVE = false;
    const stats =
      state.CACHED_STATS || computeStats(state.DATA_LEFT, state.DATA_RIGHT);
    document.getElementById('statsBar').innerHTML =
      '<span class="stat stat-total">Total differences: ' +
      (stats.changed + stats.added + stats.removed) +
      '</span>' +
      '<span class="stat stat-changed">Changed: ' +
      stats.changed +
      '</span>' +
      '<span class="stat stat-added">Added: ' +
      stats.added +
      '</span>' +
      '<span class="stat stat-removed">Removed: ' +
      stats.removed +
      '</span>' +
      '<span class="stat stat-same">Same: ' +
      stats.same +
      '</span>';

    renderFullTree(
      document.getElementById('viewLeft'),
      state.DATA_LEFT,
      state.DATA_RIGHT,
      'left',
      filterExpr,
    );
    renderFullTree(
      document.getElementById('viewRight'),
      state.DATA_LEFT,
      state.DATA_RIGHT,
      'right',
      filterExpr,
    );
  }

  // Rebuild change index for navigation
  if (state.JMESPATH_ACTIVE) {
    buildChangeIndex(state.JMESPATH_LEFT, state.JMESPATH_RIGHT);
  } else {
    buildChangeIndex(state.DATA_LEFT, state.DATA_RIGHT);
  }

  // Reset breadcrumbs after re-render
  const bcL = document.getElementById('breadcrumbLeft');
  const bcR = document.getElementById('breadcrumbRight');
  if (bcL) bcL.innerHTML = '<span class="bc-root">root</span>';
  if (bcR) bcR.innerHTML = '<span class="bc-root">root</span>';
}

// =========================================================================
//  Expand / collapse all
// =========================================================================

export function expandAll() {
  // Prevent double-expand
  if (state.isExpanding) return;

  // First pass: expand roots on both sides to trigger first-level lazy loads
  ['left:', 'right:'].forEach(function (rootKey) {
    const rootDiv = state.NODE_MAP.get(rootKey);
    if (!rootDiv || !rootDiv.parentElement) return;
    if (rootDiv.children.length === 0) {
      const side = rootKey === 'left:' ? 'left' : 'right';
      lazyExpandChildren(rootDiv, { path: '', depth: 0, side: side });
    }
    rootDiv.classList.remove('hidden');
    const toggle = rootDiv.parentElement.querySelector('.toggle-icon');
    if (toggle) toggle.textContent = '\u25BC';
  });

  // Collect first-level children containers from both sides
  const rootLeft = state.NODE_MAP.get('left:');
  const rootRight = state.NODE_MAP.get('right:');
  const queue = [];
  function collect(container, side) {
    const children = container.querySelectorAll(
      ':scope > .tree-node > .children',
    );
    for (let ci = 0; ci < children.length; ci++) {
      queue.push({ el: children[ci], side: side });
    }
  }
  if (rootLeft) collect(rootLeft, 'left');
  if (rootRight) collect(rootRight, 'right');

  // Fast path: small tree — use synchronous recursion (same as before)
  if (queue.length < 500) {
    function expandRecursive(container, path, side) {
      if (container.children.length === 0) {
        lazyExpandChildren(container, {
          path,
          depth: pathDepth(path),
          side,
        });
      }
      container.classList.remove('hidden');
      const parentEl = container.parentElement;
      if (parentEl) {
        const toggle = parentEl.querySelector('.toggle-icon');
        if (toggle) toggle.textContent = '\u25BC';
      }
      const childContainers = container.querySelectorAll(
        ':scope > .tree-node > .children',
      );
      for (let ci = 0; ci < childContainers.length; ci++) {
        const childPath = childContainers[ci].getAttribute('data-path');
        if (childPath) {
          expandRecursive(childContainers[ci], childPath, side);
        }
      }
    }
    ['left:', 'right:'].forEach(function (rootKey) {
      const rootDiv = state.NODE_MAP.get(rootKey);
      if (!rootDiv || !rootDiv.parentElement) return;
      expandRecursive(rootDiv, '', rootKey === 'left:' ? 'left' : 'right');
    });
    dispatchScrollEvents();
    return;
  }

  // Incremental path for large trees
  state.isExpanding = true;
  showExpandingIndicator(true);

  let idx = 0;
  const BATCH_SIZE = 300;

  function processBatch() {
    if (!state.isExpanding) {
      showExpandingIndicator(false);
      return;
    }
    const end = Math.min(idx + BATCH_SIZE, queue.length);
    while (idx < end) {
      const item = queue[idx];
      const childrenDiv = item.el;
      const side = item.side;
      const path = childrenDiv.getAttribute('data-path') || '';
      if (childrenDiv.children.length === 0) {
        lazyExpandChildren(childrenDiv, {
          path,
          depth: pathDepth(path),
          side,
        });
      }
      childrenDiv.classList.remove('hidden');
      const parentEl = childrenDiv.parentElement;
      if (parentEl) {
        const toggle = parentEl.querySelector('.toggle-icon');
        if (toggle) toggle.textContent = '\u25BC';
      }
      // Discover grandchildren → queue end (BFS so levels expand evenly)
      const grandChildren = childrenDiv.querySelectorAll(
        ':scope > .tree-node > .children',
      );
      for (let gi = 0; gi < grandChildren.length; gi++) {
        queue.push({ el: grandChildren[gi], side: side });
      }
      idx++;
    }
    if (idx < queue.length) {
      requestAnimationFrame(processBatch);
    } else {
      state.isExpanding = false;
      showExpandingIndicator(false);
      dispatchScrollEvents();
    }
  }

  requestAnimationFrame(processBatch);
}

export function collapseAll() {
  // Abort any in-flight incremental expansion
  state.isExpanding = false;
  showExpandingIndicator(false);

  state.NODE_MAP.forEach(function (cv) {
    cv.classList.add('hidden');
  });
  document.querySelectorAll('.toggle-icon').forEach(function (el) {
    el.textContent = '\u25B6';
  });
  const bcL = document.getElementById('breadcrumbLeft');
  const bcR = document.getElementById('breadcrumbRight');
  if (bcL) bcL.innerHTML = '<span class="bc-root">root</span>';
  if (bcR) bcR.innerHTML = '<span class="bc-root">root</span>';
}

// =========================================================================
//  Incremental expand helpers
// =========================================================================

let expandingIndicator = null;

function showExpandingIndicator(show) {
  const statsBar = document.getElementById('statsBar');
  if (!statsBar) return;
  if (show && !expandingIndicator) {
    expandingIndicator = document.createElement('span');
    expandingIndicator.className = 'stat in-progress';
    expandingIndicator.textContent = 'Expanding\u2026';
    statsBar.appendChild(expandingIndicator);
  } else if (!show && expandingIndicator) {
    if (expandingIndicator.parentNode) {
      expandingIndicator.parentNode.removeChild(expandingIndicator);
    }
    expandingIndicator = null;
  }
}

function dispatchScrollEvents() {
  const panelLeft = document.querySelector('.panel-left');
  const panelRight = document.querySelector('.panel-right');
  if (panelLeft) panelLeft.dispatchEvent(new Event('scroll'));
  if (panelRight) panelRight.dispatchEvent(new Event('scroll'));
}

// =========================================================================
//  Internal helpers
// =========================================================================

function pathDepth(path) {
  if (!path || path === '') return 0;
  return path.split('/').filter(Boolean).length;
}
