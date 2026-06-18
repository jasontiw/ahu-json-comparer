from src.differ import diff
from src.types import DiffStatus


class TestDiffScalars:
    def test_equal_strings(self):
        result = diff("hello", "hello", "$.name")
        assert result.status == DiffStatus.UNCHANGED
        assert not result.has_changes

    def test_different_strings(self):
        result = diff("hello", "world", "$.name")
        assert result.status == DiffStatus.CHANGED
        assert result.has_changes
        assert result.left == "hello"
        assert result.right == "world"

    def test_equal_numbers(self):
        result = diff(42, 42, "$.x")
        assert result.status == DiffStatus.UNCHANGED

    def test_different_numbers(self):
        result = diff(42, 43, "$.x")
        assert result.status == DiffStatus.CHANGED

    def test_added_value(self):
        result = diff(None, "new", "$.x")
        assert result.status == DiffStatus.ADDED
        assert result.has_changes

    def test_removed_value(self):
        result = diff("old", None, "$.x")
        assert result.status == DiffStatus.REMOVED
        assert result.has_changes


class TestDiffDicts:
    def test_identical_dicts(self):
        left = {"a": 1, "b": "hello"}
        right = {"a": 1, "b": "hello"}
        result = diff(left, right, "$")
        assert result.status == DiffStatus.UNCHANGED
        assert not result.has_changes

    def test_dict_with_changes(self):
        left = {"a": 1, "b": "hello"}
        right = {"a": 2, "b": "hello"}
        result = diff(left, right, "$")
        assert result.status == DiffStatus.CHANGED
        assert result.has_changes

    def test_ignores_id_fields(self):
        left = {"id": "guid-1", "value": 10}
        right = {"id": "guid-2", "value": 10}
        result = diff(left, right, "$")
        assert result.status == DiffStatus.UNCHANGED

    def test_ignores_sid_fields(self):
        left = {"segmentIP_ID": "g1", "value": 10}
        right = {"segmentIP_ID": "g2", "value": 10}
        result = diff(left, right, "$")
        assert result.status == DiffStatus.UNCHANGED


class TestDiffLists:
    def test_identical_positional_lists(self):
        left = [1, 2, 3]
        right = [1, 2, 3]
        result = diff(left, right, "$.items")
        assert result.status == DiffStatus.UNCHANGED

    def test_different_positional_lists(self):
        left = [1, 2, 3]
        right = [1, 5, 3]
        result = diff(left, right, "$.items")
        assert result.status == DiffStatus.CHANGED
        assert result.has_changes

    def test_biz_list_matches_items(self):
        left = [
            {"id": "g1", "growthType": "EndWall", "growthLength": 2},
            {"id": "g2", "growthType": "System", "growthLength": 25},
        ]
        right = [
            {"id": "g3", "growthType": "System", "growthLength": 25},
            {"id": "g4", "growthType": "EndWall", "growthLength": 2},
        ]
        result = diff(left, right, "$.segmentGrowthList")
        # Both items matched, no added/removed
        statuses = [c.status for c in result.children] if result.children else []
        assert DiffStatus.ADDED not in statuses
        assert DiffStatus.REMOVED not in statuses


class TestDiffIntegration:
    def test_full_object_with_ids(self):
        left = {
            "unit": {
                "id": "u1",
                "segmentList": [
                    {
                        "id": "s1",
                        "segmentType": "IP",
                        "segmentTypeSuffix": 1,
                        "weight": 100,
                        "segmentGrowthList": [
                            {"id": "g1", "growthType": "EndWall", "growthLength": 2}
                        ],
                    }
                ],
            }
        }
        right = {
            "unit": {
                "id": "u2",
                "segmentList": [
                    {
                        "id": "s2",
                        "segmentType": "IP",
                        "segmentTypeSuffix": 1,
                        "weight": 150,
                        "segmentGrowthList": [
                            {"id": "g2", "growthType": "EndWall", "growthLength": 2}
                        ],
                    }
                ],
            }
        }
        result = diff(left, right, "$")
        assert result.has_changes
        d = result.to_dict()
        assert d["has_changes"] is True
