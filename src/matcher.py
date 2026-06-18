from __future__ import annotations

from typing import Any

from src.types import is_id_key, is_list_key


def _business_key(item: dict) -> tuple:
    """
    Derive a business key for an item by using non-id properties,
    sorted by key name for stability, converting values to strings for comparability.
    """
    props = sorted(
        (str(v) if not isinstance(v, float) else str(round(v, 6)))
        for k, v in item.items()
        if not is_id_key(k) and not is_list_key(k) and not isinstance(v, (dict, list))
    )
    return tuple(props)


def _unique_props(item: dict) -> list[str]:
    return sorted(
        k
        for k, v in item.items()
        if not is_id_key(k) and not isinstance(v, (dict, list))
    )


def match_items(left_items: list[dict], right_items: list[dict]) -> dict[str, dict]:
    """
    Match items between two lists using best-effort business key.
    Returns a dict mapping business-key-string -> {left, right, status}.
    """
    if not left_items and not right_items:
        return {}

    left_keys = [_business_key(it) for it in left_items]
    right_keys = [_business_key(it) for it in right_items]

    left_set = set(left_keys)
    right_set = set(right_keys)

    matched_left = {}
    unmatched_right_indices = set(range(len(right_items)))
    unmatched_left_indices = set(range(len(left_items)))

    for li, lk in enumerate(left_keys):
        if lk in right_set:
            # find first unmatched right with same key
            for ri in list(unmatched_right_indices):
                if right_keys[ri] == lk:
                    matched_left[li] = ri
                    unmatched_right_indices.remove(ri)
                    unmatched_left_indices.remove(li)
                    break

    result = {}
    for li in unmatched_left_indices:
        key_str = str(left_keys[li])
        result[f"left-only:{key_str}"] = {
            "left": left_items[li],
            "right": None,
            "status": "removed",
        }

    for ri in unmatched_right_indices:
        key_str = str(right_keys[ri])
        result[f"right-only:{key_str}"] = {
            "left": None,
            "right": right_items[ri],
            "status": "added",
        }

    for li, ri in matched_left.items():
        key_str = str(left_keys[li])
        result[f"matched:{key_str}"] = {
            "left": left_items[li],
            "right": right_items[ri],
            "status": "matched",
        }

    return result


def match_segments(left_segments: list[dict], right_segments: list[dict]) -> list[tuple[dict | None, dict | None]]:
    """
    Match segments by segmentType + segmentTypeSuffix.
    Returns list of (left_seg, right_seg) pairs; either may be None.
    """
    left_index = {}
    for seg in left_segments:
        key = (seg.get("segmentType"), seg.get("segmentTypeSuffix"))
        left_index[key] = seg

    right_index = {}
    for seg in right_segments:
        key = (seg.get("segmentType"), seg.get("segmentTypeSuffix"))
        right_index[key] = seg

    all_keys = set(left_index) | set(right_index)
    result = []
    for key in sorted(all_keys):
        result.append((left_index.get(key), right_index.get(key)))
    return result
