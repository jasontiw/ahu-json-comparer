from __future__ import annotations

import copy
import logging
from typing import Any

logger = logging.getLogger(__name__)

# Single-ref lists: list_name -> (ref_field_on_item, target_key_under_segment)
_SINGLE_REF_LISTS: dict[str, tuple[str, str]] = {
    "openingList": ("associatedUISegmentID", "openings"),
    "bulkheadList": ("associatedUISegmentID", "bulkheads"),
    "coilPanelList": ("associatedSegmentID", "coilPanels"),
}

# Multi-ref lists: stay at top level; build relatedReferences under segments
_MULTI_REF_LISTS: frozenset[str] = frozenset({
    "airPathList",
    "cabinetList",
    "shippingSkidList",
    "drawingViewList",
})

# Sentinel value meaning "no reference"
_NULL_GUID = "00000000-0000-0000-0000-000000000000"


def _build_segment_lookup(segments: list[dict]) -> dict[str, dict]:
    """Build a mapping from segment.id -> segment dict.

    Args:
        segments: List of segment dicts from unit["segmentList"].

    Returns:
        Dict keyed by segment id.
    """
    return {seg["id"]: seg for seg in segments}


def _nest_single_ref(
    segment_lookup: dict[str, dict],
    items: list[dict],
    ref_field: str,
    target_key: str,
) -> list[dict]:
    """Nest single-ref items under their owning segment.

    Matched items are appended to ``segment[target_key]`` (created if needed).
    Unmatched items are returned as a list.

    Args:
        segment_lookup: segment.id -> segment dict.
        items: Items from a single-ref top-level list.
        ref_field: The field on each item that contains the segment id.
        target_key: The key to create under the segment (e.g. "openings").

    Returns:
        List of items that could not be matched to any segment.
    """
    unmatched: list[dict] = []
    for item in items:
        ref_value = item.get(ref_field, "")
        if not ref_value or ref_value == _NULL_GUID:
            unmatched.append(item)
            continue
        segment = segment_lookup.get(ref_value)
        if segment is None:
            unmatched.append(item)
            continue
        segment.setdefault(target_key, []).append(item)
    return unmatched


def _make_lightweight_ref(
    source_list: str,
    item: dict,
    ref_entry: dict,
) -> dict:
    """Create a lightweight pointer dict for ``relatedReferences``.

    Args:
        source_list: Name of the source list (e.g. "cabinetList").
        item: The item from the multi-ref list.
        ref_entry: A single entry from ``segmentReferenceList``.

    Returns:
        Pointer dict with sourceList, itemId, and sequence.
    """
    return {
        "sourceList": source_list,
        "itemId": item.get("id", ""),
        "sequence": ref_entry.get("sequence", 0),
    }


def _build_multi_ref_index(
    multi_ref_lists: dict[str, list[dict]],
) -> dict[str, list[dict]]:
    """Build a segment-id -> list of relatedReferences from multi-ref lists.

    Iterates every item in every multi-ref list and collects lightweight
    pointers for every ``segmentReferenceList[].segmentID`` that is a
    non-empty, non-null value.

    Args:
        multi_ref_lists: Mapping of list name -> items for each multi-ref list.

    Returns:
        Dict keyed by segment id, values are lists of lightweight ref dicts.
    """
    index: dict[str, list[dict]] = {}
    for list_name, items in multi_ref_lists.items():
        for item in items:
            refs = item.get("segmentReferenceList", [])
            if not refs:
                continue
            for ref_entry in refs:
                segment_id = ref_entry.get("segmentID", "")
                if not segment_id or segment_id == _NULL_GUID:
                    continue
                index.setdefault(segment_id, []).append(
                    _make_lightweight_ref(list_name, item, ref_entry),
                )
    return index


def reorganize(data: dict) -> dict:
    """Restructure flat AHU JSON into segment-nested form.

    Single-ref lists (openingList, bulkheadList, coilPanelList) are moved
    under their owning segment. Multi-ref lists (airPathList, cabinetList,
    shippingSkidList, drawingViewList) stay at top level; each segment gains
    a ``relatedReferences`` array with lightweight pointers. Unmatched items
    are collected under ``unit._unmatched.<target_key>``.

    Args:
        data: Raw loaded JSON dict. Must contain a top-level ``"unit"`` key.

    Returns:
        Restructured dict. The original ``data`` is NOT mutated.

    Raises:
        TypeError: If data is not a dict.
        ValueError: If data has no ``"unit"`` key.
    """
    if not isinstance(data, dict):
        raise TypeError(f"Expected dict, got {type(data).__name__}")

    if "unit" not in data:
        raise ValueError("Input must contain a 'unit' key")

    # Deep copy — never mutate the caller's data
    result: dict = copy.deepcopy(data)
    result_unit: dict = result["unit"]

    # ---- 1. Build segment lookup ----
    segments: list[dict] | Any = result_unit.get("segmentList", [])
    if not isinstance(segments, list) or len(segments) == 0:
        return result  # nothing to nest into

    segment_lookup = _build_segment_lookup(segments)

    # ---- 2. Process single-ref lists ----
    unmatched: dict[str, list[dict]] = {}
    consumed: set[str] = set()

    for list_name, (ref_field, target_key) in _SINGLE_REF_LISTS.items():
        items = result_unit.get(list_name)
        if not isinstance(items, list):
            continue

        if len(items) > 0:
            unmatched_items = _nest_single_ref(
                segment_lookup, items, ref_field, target_key,
            )
            if unmatched_items:
                unmatched[target_key] = unmatched_items
                logger.warning(
                    "%d unmatched %s item(s) placed in unit._unmatched.%s",
                    len(unmatched_items),
                    list_name,
                    target_key,
                )
        consumed.add(list_name)

    # ---- 3. Process multi-ref lists ----
    multi_ref_items: dict[str, list[dict]] = {}
    for list_name in _MULTI_REF_LISTS:
        items = result_unit.get(list_name)
        if isinstance(items, list) and len(items) > 0:
            multi_ref_items[list_name] = items

    if multi_ref_items:
        ref_index = _build_multi_ref_index(multi_ref_items)
        for seg_id, refs in ref_index.items():
            segment = segment_lookup.get(seg_id)
            if segment is not None:
                segment.setdefault("relatedReferences", []).extend(refs)

    # ---- 4. Remove consumed lists from top level ----
    for list_name in consumed:
        result_unit.pop(list_name, None)

    # ---- 5. Attach unmatched items ----
    if unmatched:
        result_unit["_unmatched"] = unmatched

    return result
