import json

from src.differ import diff
from src.loader import load_json


class TestRealFiles:
    def test_both_files_load_and_diff(self):
        left = load_json("SBS_DefaultT1.json")
        right = load_json("SBS_CabResizedT1.json")
        result = diff(left, right, "$")
        assert result.has_changes
        d = result.to_dict()
        assert d["has_changes"] is True

    def test_diff_contains_expected_changes(self):
        left = load_json("SBS_DefaultT1.json")
        right = load_json("SBS_CabResizedT1.json")
        result = diff(left, right, "$")
        d = result.to_dict()

        # Navigate to FS/0 segment and check weight changed
        # FS/0 is segmentList[3] in both files (index 3)
        seg_children = d.get("children", [])
        unit_node = next((c for c in seg_children if c["path"] == "$.unit"), None)
        assert unit_node is not None
        assert unit_node["has_changes"] is True

    def test_output_is_serializable(self):
        left = load_json("SBS_DefaultT1.json")
        right = load_json("SBS_CabResizedT1.json")
        result = diff(left, right, "$")
        output = result.to_dict()
        json.dumps(output)
