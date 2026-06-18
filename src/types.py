from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class DiffStatus(Enum):
    UNCHANGED = "unchanged"
    CHANGED = "changed"
    ADDED = "added"
    REMOVED = "removed"


@dataclass
class DiffNode:
    path: str
    type: str
    status: DiffStatus
    left: Any = None
    right: Any = None
    children: list[DiffNode] | None = None
    has_changes: bool = False

    def to_dict(self) -> dict:
        d: dict = {
            "path": self.path,
            "type": self.type,
            "status": self.status.value,
            "has_changes": self.has_changes,
        }
        if self.status == DiffStatus.CHANGED:
            d["left"] = _serialize(self.left)
            d["right"] = _serialize(self.right)
        elif self.status == DiffStatus.ADDED:
            d["value"] = _serialize(self.right)
        elif self.status == DiffStatus.REMOVED:
            d["value"] = _serialize(self.left)
        elif self.status == DiffStatus.UNCHANGED and self.type == "value":
            d["value"] = _serialize(self.left)
        if self.children:
            d["children"] = [c.to_dict() for c in self.children]
        return d


def _serialize(obj: Any) -> Any:
    if isinstance(obj, dict):
        return {k: _serialize(v) for k, v in obj.items() if not is_id_key(k)}
    if isinstance(obj, list):
        return [_serialize(v) for v in obj]
    return obj


IGNORED_KEYS = frozenset({"$type", "id"})
ID_SUFFIXES = ("_ID", "_id")


def is_id_key(key: str) -> bool:
    return key in IGNORED_KEYS or key.endswith(ID_SUFFIXES)


def is_list_key(key: str) -> bool:
    return key.endswith("List")
