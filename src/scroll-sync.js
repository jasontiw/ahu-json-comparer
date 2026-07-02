/**
 * Scroll sync — synchronise left and right panel scrolling.
 *
 * Ported from monolithic app.js (lines 922-945).
 * Standalone — no state imports.
 */

export function initScrollSync() {
  let scrollSyncPending = null;

  function doScrollSync() {
    if (!scrollSyncPending) return;
    const s = scrollSyncPending.source;
    const t = scrollSyncPending.target;
    scrollSyncPending = null;
    if (t.scrollTop !== s.scrollTop) t.scrollTop = s.scrollTop;
    if (t.scrollLeft !== s.scrollLeft) t.scrollLeft = s.scrollLeft;
  }

  function syncScroll(source, target) {
    return function () {
      if (!scrollSyncPending) requestAnimationFrame(doScrollSync);
      scrollSyncPending = { source: source, target: target };
    };
  }

  const panelLeft = document.querySelector('.panel-left');
  const panelRight = document.querySelector('.panel-right');

  if (panelLeft && panelRight) {
    panelLeft.addEventListener(
      'scroll',
      syncScroll(panelLeft, panelRight),
      { passive: true },
    );
    panelRight.addEventListener(
      'scroll',
      syncScroll(panelRight, panelLeft),
      { passive: true },
    );
  }
}
