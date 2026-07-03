/**
 * Centralized mutable state object.
 * All modules import `state` and read/write properties directly.
 */

export const state = {
  DATA_LEFT: null,
  DATA_RIGHT: null,
  FILE_LEFT: '',
  FILE_RIGHT: '',

  // Performance / optimisation
  NODE_MAP: new Map(),
  CACHED_STATS: null,
  filterTimer: null,
  DATA_LEFT_RAW: null,
  DATA_RIGHT_RAW: null,
  reorganizeEnabled: true,
  sortByXEnabled: true,
  EXCLUDED_FIELDS: new Set(),

  // JMESPath results
  JMESPATH_LEFT: null,
  JMESPATH_RIGHT: null,
  JMESPATH_ACTIVE: false,

  // Expand/collapse guards
  isExpanding: false,

  // Dedup guards
  currentFilter: null,
  currentMap: null,

  // Change navigation
  CHANGE_INDEX: [],
  currentChangeIdx: -1,
};
