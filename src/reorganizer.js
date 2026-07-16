/**
 * AHU JSON reorganizer — nests child entities into their parent segments.
 *
 * Ported from monolithic app.js (lines 38-180).
 */

import { state } from './state.js';
import jmespath from 'jmespath';

// ---------------------------------------------------------------------------
//  Constants
// ---------------------------------------------------------------------------

const _SINGLE_REF_LISTS = {
  openingList: { refField: 'associatedUISegmentID', targetKey: 'openings' },
  bulkheadList: { refField: 'associatedUISegmentID', targetKey: 'bulkheads' },
  coilPanelList: { refField: 'associatedSegmentID', targetKey: 'coilPanels' },
};

const _MULTI_REF_LISTS = [
  'airPathList',
  'cabinetList',
  'shippingSkidList',
  'drawingViewList',
];

const _NULL_GUID = '00000000-0000-0000-0000-000000000000';

// ---------------------------------------------------------------------------
//  Internal helpers
// ---------------------------------------------------------------------------

function _buildSegmentLookup(segments) {
  const lookup = {};
  for (let i = 0; i < segments.length; i++) {
    lookup[segments[i].id] = segments[i];
  }
  return lookup;
}

function _nestSingleRef(segmentLookup, items, refField, targetKey) {
  const unmatched = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const refValue = item[refField] || '';
    if (!refValue || refValue === _NULL_GUID) {
      unmatched.push(item);
      continue;
    }
    const segment = segmentLookup[refValue];
    if (segment === undefined) {
      unmatched.push(item);
      continue;
    }
    if (!segment[targetKey]) {
      segment[targetKey] = [];
    }
    segment[targetKey].push(item);
  }
  return unmatched;
}

function _makeLightweightRef(sourceList, item, refEntry) {
  return {
    sourceList: sourceList,
    itemId: item.id || '',
    sequence: refEntry.sequence || 0,
  };
}

function _buildMultiRefIndex(multiRefLists) {
  const index = {};
  for (const listName in multiRefLists) {
    if (!Object.hasOwn(multiRefLists, listName)) continue;
    const items = multiRefLists[listName];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const refs = item.segmentReferenceList;
      if (!refs || !Array.isArray(refs)) continue;
      for (let j = 0; j < refs.length; j++) {
        const refEntry = refs[j];
        const segmentId = refEntry.segmentID || '';
        if (!segmentId || segmentId === _NULL_GUID) continue;
        if (!index[segmentId]) {
          index[segmentId] = [];
        }
        index[segmentId].push(_makeLightweightRef(listName, item, refEntry));
      }
    }
  }
  return index;
}

// ---------------------------------------------------------------------------
//  Main export
// ---------------------------------------------------------------------------

/**
 * Reorganize AHU JSON data: nest child entities into parent segments
 * and optionally sort segments by geometry.x.
 *
 * @param {object} data  Raw AHU JSON
 * @returns {object}      Deep-cloned & reorganised copy
 */
export function reorganize(data) {
  const result = JSON.parse(JSON.stringify(data));
  const resultUnit = result.unit;
  const segments = resultUnit && resultUnit.segmentList;
  if (!Array.isArray(segments) || segments.length === 0) {
    return result;
  }
  const segmentLookup = _buildSegmentLookup(segments);
  const unmatched = {};
  const consumed = new Set();

  for (const listName in _SINGLE_REF_LISTS) {
    if (!Object.hasOwn(_SINGLE_REF_LISTS, listName)) continue;
    const { refField, targetKey } = _SINGLE_REF_LISTS[listName];
    const items = resultUnit[listName];
    if (!Array.isArray(items)) continue;
    if (items.length > 0) {
      const unmatchedItems = _nestSingleRef(
        segmentLookup,
        items,
        refField,
        targetKey,
      );
      if (unmatchedItems.length > 0) {
        unmatched[targetKey] = unmatchedItems;
      }
    }
    consumed.add(listName);
  }

  const multiRefItems = {};
  for (let i = 0; i < _MULTI_REF_LISTS.length; i++) {
    const listName = _MULTI_REF_LISTS[i];
    const items = resultUnit[listName];
    if (Array.isArray(items) && items.length > 0) {
      multiRefItems[listName] = items;
    }
  }

  if (Object.keys(multiRefItems).length > 0) {
    const refIndex = _buildMultiRefIndex(multiRefItems);
    for (const segId in refIndex) {
      if (!Object.hasOwn(refIndex, segId)) continue;
      const segment = segmentLookup[segId];
      if (segment !== undefined) {
        if (!segment.relatedReferences) {
          segment.relatedReferences = [];
        }
        segment.relatedReferences.push(...refIndex[segId]);
      }
    }
  }

  for (const listName of consumed) {
    delete resultUnit[listName];
  }

  if (Object.keys(unmatched).length > 0) {
    resultUnit._unmatched = unmatched;
  }

  // Sort segmentList by segmentTypeSuffix then geometry.x (JMESPath sort_by)
  if (state.sortByXEnabled && Array.isArray(resultUnit.segmentList)) {
    try {
      resultUnit.segmentList = jmespath.search(
        { list: resultUnit.segmentList },
        'list | sort_by(@, &segmentTypeSuffix) | sort_by(@, &geometry.x)',
      );
    } catch (e) {
      // Fallback: plain sort by geometry.x only
      resultUnit.segmentList.sort(function (a, b) {
        const ax = a.geometry && a.geometry.x != null ? a.geometry.x : Infinity;
        const bx = b.geometry && b.geometry.x != null ? b.geometry.x : Infinity;
        return ax - bx;
      });
    }
  }

  return result;
}
