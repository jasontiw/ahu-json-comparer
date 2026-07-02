/**
 * Breadcrumb — shows current path hierarchy at top of each panel on scroll.
 *
 * Ported from monolithic app.js (lines 947-1005).
 */

import { esc } from './utils.js';

export function initBreadcrumb() {
  const panelLeft = document.querySelector('.panel-left');
  const panelRight = document.querySelector('.panel-right');
  if (!panelLeft || !panelRight) return;

  let bcTimer = null;

  function updateBreadcrumb(panel, bcId) {
    const panelRect = panel.getBoundingClientRect();
    let x = panelRect.left + panelRect.width / 2;
    let y = panelRect.top + 40; // below sticky breadcrumb bar

    // Find the actual rendered element at that point
    let el = document.elementFromPoint(x, y);

    // Walk up to find nearest .children[data-path]
    let foundPath = '';
    while (el && el !== panel && el !== document.body) {
      if (
        el.classList &&
        el.classList.contains('children') &&
        !el.classList.contains('hidden')
      ) {
        const p = el.getAttribute('data-path');
        if (p !== null && p !== undefined) {
          foundPath = p;
          break;
        }
      }
      el = el.parentElement;
    }

    // Fallback: if we landed in the breadcrumb area, try a bit lower
    if (foundPath === '' && y < panelRect.top + panelRect.height) {
      y += 40;
      if (y < panelRect.top + panelRect.height) {
        el = document.elementFromPoint(x, y);
        while (el && el !== panel && el !== document.body) {
          if (
            el.classList &&
            el.classList.contains('children') &&
            !el.classList.contains('hidden')
          ) {
            const p2 = el.getAttribute('data-path');
            if (p2 !== null && p2 !== undefined) {
              foundPath = p2;
              break;
            }
          }
          el = el.parentElement;
        }
      }
    }

    const segments = foundPath
      ? foundPath.split('/').filter(Boolean)
      : [];
    const bc = document.getElementById(bcId);
    if (!bc) return;
    let html = '<span class="bc-root">root</span>';
    for (let si = 0; si < segments.length; si++) {
      html +=
        '<span class="bc-sep"> \u203A </span><span class="bc-seg">' +
        esc(segments[si]) +
        '</span>';
    }
    bc.innerHTML = html;
  }

  function scheduleBreadcrumb(panel, bcId) {
    if (!bcTimer) {
      bcTimer = requestAnimationFrame(function () {
        bcTimer = null;
        updateBreadcrumb(panel, bcId);
      });
    }
  }

  panelLeft.addEventListener(
    'scroll',
    function () {
      scheduleBreadcrumb(panelLeft, 'breadcrumbLeft');
    },
    { passive: true },
  );
  panelRight.addEventListener(
    'scroll',
    function () {
      scheduleBreadcrumb(panelRight, 'breadcrumbRight');
    },
    { passive: true },
  );
}
