/**
 * Keyboard shortcuts — N/P for change navigation, Escape to close help.
 *
 * Ported from monolithic app.js (lines 1276-1294).
 */

import { navigateToChange } from './change-nav.js';
import { closeHelp } from './help-modal.js';

export function initKeyboard() {
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeHelp();

    // Change navigation: N/P keys (not when typing in inputs)
    if (e.key === 'n' || e.key === 'N') {
      const tag = e.target && e.target.tagName;
      if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
        e.preventDefault();
        navigateToChange(1);
      }
    }
    if (e.key === 'p' || e.key === 'P') {
      const tag = e.target && e.target.tagName;
      if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
        e.preventDefault();
        navigateToChange(-1);
      }
    }
  });
}
