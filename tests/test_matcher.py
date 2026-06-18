from src.matcher import match_items, match_segments


class TestMatchItems:
    def test_both_empty(self):
        assert match_items([], []) == {}

    def test_all_matched_by_business_key(self):
        left = [
            {"id": "guid-1", "growthType": "EndWall", "growthLength": 2},
            {"id": "guid-2", "growthType": "System", "growthLength": 25},
        ]
        right = [
            {"id": "guid-3", "growthType": "System", "growthLength": 25},
            {"id": "guid-4", "growthType": "EndWall", "growthLength": 2},
        ]
        result = match_items(left, right)
        matched = {k: v for k, v in result.items() if v["status"] == "matched"}
        assert len(matched) == 2

    def test_added_items(self):
        left = [
            {"id": "g1", "growthType": "EndWall"},
        ]
        right = [
            {"id": "g1", "growthType": "EndWall"},
            {"id": "g2", "growthType": "System"},
        ]
        result = match_items(left, right)
        added = {k: v for k, v in result.items() if v["status"] == "added"}
        assert len(added) == 1

    def test_removed_items(self):
        left = [
            {"id": "g1", "growthType": "EndWall"},
            {"id": "g2", "growthType": "System"},
        ]
        right = [
            {"id": "g1", "growthType": "EndWall"},
        ]
        result = match_items(left, right)
        removed = {k: v for k, v in result.items() if v["status"] == "removed"}
        assert len(removed) == 1


class TestMatchSegments:
    def test_same_segments(self):
        left = [
            {"id": "a", "segmentType": "IP", "segmentTypeSuffix": 1},
            {"id": "b", "segmentType": "RF", "segmentTypeSuffix": 0},
        ]
        right = [
            {"id": "c", "segmentType": "IP", "segmentTypeSuffix": 1},
            {"id": "d", "segmentType": "RF", "segmentTypeSuffix": 0},
        ]
        pairs = match_segments(left, right)
        assert len(pairs) == 2
        for l, r in pairs:
            assert l is not None and r is not None

    def test_added_removed(self):
        left = [
            {"id": "a", "segmentType": "IP", "segmentTypeSuffix": 1},
        ]
        right = [
            {"id": "b", "segmentType": "IP", "segmentTypeSuffix": 1},
            {"id": "c", "segmentType": "RF", "segmentTypeSuffix": 0},
        ]
        pairs = match_segments(left, right)
        assert len(pairs) == 2
        assert pairs[0][0] is not None and pairs[0][1] is not None
        assert pairs[1][0] is None and pairs[1][1] is not None
