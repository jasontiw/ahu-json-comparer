/**
 * Change navigation — expand path, find element, scroll to change, navigate.
 *
 * Ported from monolithic app.js (lines 1079-1210).
 */

import { state } from './state.js';

// =========================================================================
//  Expand a path on a given side (click all ancestor toggles)
// =========================================================================

export function expandPathToNode(side, path) {
  // Ensure root is expanded
  const rootChildren = state.NODE_MAP.get(side + ':');
  if (rootChildren && rootChildren.classList.contains('hidden')) {
    const rootToggle =
      rootChildren.parentElement &&
      rootChildren.parentElement.querySelector('.toggle-icon');
    if (rootToggle) rootToggle.click();
  }
  if (!path) return;

  // NODE_MAP keys use paths with leading slash: /unit, /unit/segmentList, etc.
  const parts = path.split('/').filter(Boolean);
  let accumulated = '';
  for (let i = 0; i < parts.length; i++) {
    accumulated = accumulated + '/' + parts[i];
    const childrenDiv = state.NODE_MAP.get(side + ':' + accumulated);
    if (!childrenDiv) break;
    if (childrenDiv.classList.contains('hidden')) {
      const toggle =
        childrenDiv.parentElement &&
        childrenDiv.parentElement.querySelector('.toggle-icon');
      if (toggle) toggle.click();
    }
  }
}

// =========================================================================
//  Find a tree-node element by path on a given side
// =========================================================================

export function findNodeElement(side, path) {
  if (!path) return null;
  // Escape CSS selector special characters
  const safePath = path
    .replace(/"/g, '\\"')
    .replace(/'/g, "\\'");
  const container =
    side === 'left'
      ? document.getElementById('viewLeft')
      : document.getElementById('viewRight');
  if (!container) return null;
  const tn = container.querySelector(
    '.tree-node[data-path="' + safePath + '"]',
  );
  if (tn) return tn.querySelector('.node-row') || tn;
  return null;
}

// =========================================================================
//  Scroll to a change node
// =========================================================================

export function scrollToChange(side, path) {
  const el = findNodeElement(side, path);
  if (!el) return false;

  // Remove previous highlight from both sides
  document.querySelectorAll('.change-highlight').forEach(function (h) {
    h.classList.remove('change-highlight');
  });

  el.classList.add('change-highlight');
  setTimeout(function () {
    el.classList.remove('change-highlight');
  }, 2000);

  const panel = el.closest('.panel');
  if (panel) {
    // Temporarily disable content-visibility on ancestor children containers
    // so getBoundingClientRect returns real coordinates (Bug 2 fix).
    const ancestors = [];
    let parent = el.parentElement;
    while (parent && parent !== panel) {
      if (parent.classList.contains('children')) {
        ancestors.push(parent);
        parent.style.contentVisibility = 'visible';
      }
      parent = parent.parentElement;
    }

    const panelRect = panel.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const offset =
      elRect.top - panelRect.top + panel.scrollTop - panelRect.height / 3;
    panel.scrollTop = Math.max(0, offset);

    // Restore content-visibility
    for (let i = 0; i < ancestors.length; i++) {
      ancestors[i].style.contentVisibility = '';
    }
  }
  return true;
}

// =========================================================================
//  Navigate to next / previous change
// =========================================================================

export function navigateToChange(delta) {
  if (!state.CHANGE_INDEX || state.CHANGE_INDEX.length === 0) return;
  state.currentChangeIdx =
    (state.currentChangeIdx + delta + state.CHANGE_INDEX.length) %
    state.CHANGE_INDEX.length;
  const change = state.CHANGE_INDEX[state.currentChangeIdx];

  // Expand ancestors on both sides so the element exists in DOM
  expandPathToNode('left', change.path);
  expandPathToNode('right', change.path);

  scrollToChange('left', change.path);
  scrollToChange('right', change.path);
  updateChangeCounter();
}

// =========================================================================
//  Update the change counter in the toolbar
// =========================================================================

export function updateChangeCounter() {
  const el = document.getElementById('changeCounter');
  if (!el) return;
  if (!state.CHANGE_INDEX || state.CHANGE_INDEX.length === 0) {
    el.textContent = '0 / 0';
    return;
  }
  el.textContent =
    (state.currentChangeIdx >= 0
      ? state.currentChangeIdx + 1
      : '-') +
    ' / ' +
    state.CHANGE_INDEX.length;
}
