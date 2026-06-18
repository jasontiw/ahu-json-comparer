from __future__ import annotations

from typing import Any

from src.matcher import match_items
from src.types import DiffNode, DiffStatus, is_id_key, is_list_key


def diff(left: Any, right: Any, path: str = "$") -> DiffNode:
    left_type = _value_type(left)
    right_type = _value_type(right)

    if left is None and right is not None:
        return DiffNode(
            path=path,
            type=right_type,
            status=DiffStatus.ADDED,
            left=left,
            right=right,
            has_changes=True,
        )

    if left is not None and right is None:
        return DiffNode(
            path=path,
            type=left_type,
            status=DiffStatus.REMOVED,
            left=left,
            right=right,
            has_changes=True,
        )

    if left_type != right_type:
        return DiffNode(
            path=path,
            type=f"{left_type}->{right_type}",
            status=DiffStatus.CHANGED,
            left=left,
            right=right,
            has_changes=True,
        )

    if left_type == "object":
        return _diff_dicts(left, right, path)
    if left_type == "array":
        return _diff_lists(left, right, path)
    return _diff_values(left, right, path)


def _value_type(v: Any) -> str:
    if isinstance(v, dict):
        return "object"
    if isinstance(v, list):
        return "array"
    if isinstance(v, bool):
        return "boolean"
    if isinstance(v, int):
        return "integer"
    if isinstance(v, float):
        return "number"
    if isinstance(v, str):
        return "string"
    if v is None:
        return "null"
    return type(v).__name__


def _diff_dicts(left: dict, right: dict, path: str) -> DiffNode:
    all_keys = set(left) | set(right)
    children: list[DiffNode] = []
    has_changes = False

    for key in sorted(all_keys):
        if is_id_key(key):
            continue
        child_path = f"{path}.{key}"
        lv = left.get(key)
        rv = right.get(key)
        child = diff(lv, rv, child_path)
        if child.has_changes:
            has_changes = True
        children.append(child)

    status = DiffStatus.UNCHANGED if not has_changes else DiffStatus.CHANGED
    return DiffNode(
        path=path,
        type="object",
        status=status,
        left=left,
        right=right,
        children=children,
        has_changes=has_changes,
    )


def _diff_lists(left: list, right: list, path: str) -> DiffNode:
    children: list[DiffNode] = []
    has_changes = False

    is_biz_list = any(isinstance(x, dict) for x in left + right) and (
        path.endswith("List") or any(is_list_key(path.split(".")[-1].split("[")[0]) for _ in [1])
    )

    if is_biz_list and left and right and isinstance(left[0], dict):
        items = match_items(left, right)
        for key_str, match in items.items():
            lv = match["left"]
            rv = match["right"]
            status = match["status"]

            if status == "removed":
                child_key = lv.get("segmentType", lv.get("growthType", lv.get("description", "unknown")))
                child = diff(lv, None, f"{path}[removed:{child_key}]")
                children.append(child)
                has_changes = True
            elif status == "added":
                child_key = rv.get("segmentType", rv.get("growthType", rv.get("description", "unknown")))
                child = diff(None, rv, f"{path}[added:{child_key}]")
                children.append(child)
                has_changes = True
            else:
                child_key = lv.get("segmentType", lv.get("growthType", lv.get("description", key_str)))
                child = diff(lv, rv, f"{path}[match:{child_key}]")
                if child.has_changes:
                    has_changes = True
                children.append(child)
    else:
        max_len = max(len(left), len(right))
        for i in range(max_len):
            child_path = f"{path}[{i}]"
            lv = left[i] if i < len(left) else None
            rv = right[i] if i < len(right) else None
            child = diff(lv, rv, child_path)
            if child.has_changes:
                has_changes = True
            children.append(child)

    status = DiffStatus.UNCHANGED if not has_changes else DiffStatus.CHANGED
    return DiffNode(
        path=path,
        type="array",
        status=status,
        left=left,
        right=right,
        children=children,
        has_changes=has_changes,
    )


def _diff_values(left: Any, right: Any, path: str) -> DiffNode:
    left_type = _value_type(left)
    if left == right:
        return DiffNode(
            path=path,
            type=left_type,
            status=DiffStatus.UNCHANGED,
            left=left,
            right=right,
            has_changes=False,
        )
    return DiffNode(
        path=path,
        type=left_type,
        status=DiffStatus.CHANGED,
        left=left,
        right=right,
        has_changes=True,
    )
