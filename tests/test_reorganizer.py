import copy

from src.reorganizer import (
    _build_segment_lookup,
    _build_multi_ref_index,
    _make_lightweight_ref,
    _nest_single_ref,
    _NULL_GUID,
    reorganize,
)


# ---------------------------------------------------------------------------
#  Helpers
# ---------------------------------------------------------------------------

_SEG_A_ID = "seg-a-0000-0000-0000-000000000001"
_SEG_B_ID = "seg-b-0000-0000-0000-000000000002"

_SEG_A = {"id": _SEG_A_ID, "segmentType": "IP", "segmentTypeSuffix": 1}
_SEG_B = {"id": _SEG_B_ID, "segmentType": "RF", "segmentTypeSuffix": 0}


def _make_unit(**overrides: object) -> dict:
    """Return a minimal unit dict with segmentList."""
    base = {"unit": {"segmentList": [copy.deepcopy(_SEG_A), copy.deepcopy(_SEG_B)]}}
    for k, v in overrides.items():
        base["unit"][k] = copy.deepcopy(v) if isinstance(v, (dict, list)) else v
    return base


# ===================================================================
#  _build_segment_lookup
# ===================================================================

class TestBuildSegmentLookup:
    def test_empty_list(self) -> None:
        assert _build_segment_lookup([]) == {}

    def test_single_segment(self) -> None:
        segs = [{"id": "x"}]
        result = _build_segment_lookup(segs)
        assert result == {"x": {"id": "x"}}

    def test_multiple_segments(self) -> None:
        segs = [{"id": "a"}, {"id": "b"}]
        result = _build_segment_lookup(segs)
        assert result["a"] is segs[0]
        assert result["b"] is segs[1]


# ===================================================================
#  _nest_single_ref
# ===================================================================

class TestNestSingleRef:
    def setup_method(self) -> None:
        self.lookup = _build_segment_lookup(
            [copy.deepcopy(_SEG_A), copy.deepcopy(_SEG_B)],
        )

    def test_all_matched(self) -> None:
        items = [
            {"id": "o1", "associatedUISegmentID": _SEG_A_ID},
            {"id": "o2", "associatedUISegmentID": _SEG_B_ID},
        ]
        unmatched = _nest_single_ref(self.lookup, items, "associatedUISegmentID", "openings")
        assert unmatched == []
        assert len(self.lookup[_SEG_A_ID]["openings"]) == 1
        assert self.lookup[_SEG_A_ID]["openings"][0]["id"] == "o1"
        assert len(self.lookup[_SEG_B_ID]["openings"]) == 1
        assert self.lookup[_SEG_B_ID]["openings"][0]["id"] == "o2"

    def test_partial_unmatched(self) -> None:
        items = [
            {"id": "o1", "associatedUISegmentID": _SEG_A_ID},
            {"id": "o2", "associatedUISegmentID": "nonexistent-seg"},
        ]
        unmatched = _nest_single_ref(self.lookup, items, "associatedUISegmentID", "openings")
        assert len(unmatched) == 1
        assert unmatched[0]["id"] == "o2"
        assert len(self.lookup[_SEG_A_ID]["openings"]) == 1

    def test_all_unmatched(self) -> None:
        items = [
            {"id": "o1", "associatedUISegmentID": "missing-1"},
            {"id": "o2", "associatedUISegmentID": "missing-2"},
        ]
        unmatched = _nest_single_ref(self.lookup, items, "associatedUISegmentID", "openings")
        assert len(unmatched) == 2

    def test_null_guid_is_unmatched(self) -> None:
        items = [
            {"id": "o1", "associatedUISegmentID": _NULL_GUID},
        ]
        unmatched = _nest_single_ref(self.lookup, items, "associatedUISegmentID", "openings")
        assert len(unmatched) == 1
        assert unmatched[0]["id"] == "o1"

    def test_empty_ref_is_unmatched(self) -> None:
        items = [
            {"id": "o1", "associatedUISegmentID": ""},
        ]
        unmatched = _nest_single_ref(self.lookup, items, "associatedUISegmentID", "openings")
        assert len(unmatched) == 1

    def test_missing_ref_field_is_unmatched(self) -> None:
        items = [
            {"id": "o1"},  # no associatedUISegmentID
        ]
        unmatched = _nest_single_ref(self.lookup, items, "associatedUISegmentID", "openings")
        assert len(unmatched) == 1


# ===================================================================
#  _make_lightweight_ref
# ===================================================================

class TestMakeLightweightRef:
    def test_basic_pointer(self) -> None:
        item = {"id": "cab-1"}
        ref_entry = {"id": "ref-guid", "sequence": 3, "segmentID": "seg-x"}
        ptr = _make_lightweight_ref("cabinetList", item, ref_entry)
        assert ptr == {"sourceList": "cabinetList", "itemId": "cab-1", "sequence": 3}

    def test_missing_sequence_defaults_zero(self) -> None:
        item = {"id": "skid-1"}
        ref_entry = {"segmentID": "seg-y"}
        ptr = _make_lightweight_ref("shippingSkidList", item, ref_entry)
        assert ptr == {"sourceList": "shippingSkidList", "itemId": "skid-1", "sequence": 0}

    def test_missing_item_id_defaults_empty(self) -> None:
        item: dict = {}
        ref_entry = {"sequence": 1, "segmentID": "seg-z"}
        ptr = _make_lightweight_ref("airPathList", item, ref_entry)
        assert ptr == {"sourceList": "airPathList", "itemId": "", "sequence": 1}


# ===================================================================
#  _build_multi_ref_index
# ===================================================================

class TestBuildMultiRefIndex:
    def test_single_item_referencing_two_segments(self) -> None:
        lists = {
            "cabinetList": [
                {
                    "id": "cab-1",
                    "segmentReferenceList": [
                        {"id": "r1", "sequence": 0, "segmentID": _SEG_A_ID},
                        {"id": "r2", "sequence": 1, "segmentID": _SEG_B_ID},
                    ],
                },
            ],
        }
        index = _build_multi_ref_index(lists)
        assert len(index[_SEG_A_ID]) == 1
        assert index[_SEG_A_ID][0]["sourceList"] == "cabinetList"
        assert index[_SEG_A_ID][0]["itemId"] == "cab-1"
        assert len(index[_SEG_B_ID]) == 1

    def test_item_with_empty_segment_reference_list(self) -> None:
        lists = {
            "shippingSkidList": [
                {"id": "skid-1", "segmentReferenceList": []},
            ],
        }
        index = _build_multi_ref_index(lists)
        assert index == {}

    def test_item_with_no_segment_reference_list(self) -> None:
        lists = {
            "drawingViewList": [
                {"id": "dv-1"},
            ],
        }
        index = _build_multi_ref_index(lists)
        assert index == {}

    def test_null_guid_segment_id_skipped(self) -> None:
        lists = {
            "airPathList": [
                {
                    "id": "ap-1",
                    "segmentReferenceList": [
                        {"id": "r1", "sequence": 0, "segmentID": _NULL_GUID},
                    ],
                },
            ],
        }
        index = _build_multi_ref_index(lists)
        assert index == {}

    def test_item_referenced_by_three_segments(self) -> None:
        """A single multi-ref item is NOT duplicated — lightweight pointers
        are created for each referencing segment."""
        lists = {
            "cabinetList": [
                {
                    "id": "cab-1",
                    "segmentReferenceList": [
                        {"id": "r1", "sequence": 0, "segmentID": _SEG_A_ID},
                        {"id": "r2", "sequence": 2, "segmentID": _SEG_B_ID},
                    ],
                },
            ],
        }
        index = _build_multi_ref_index(lists)
        assert len(index[_SEG_A_ID]) == 1
        assert len(index[_SEG_B_ID]) == 1
        # Sequences are preserved
        assert index[_SEG_A_ID][0]["sequence"] == 0
        assert index[_SEG_B_ID][0]["sequence"] == 2


# ===================================================================
#  reorganize()  —  main function
# ===================================================================

class TestReorganizeValidation:
    def test_non_dict_raises_type_error(self) -> None:
        try:
            reorganize("not a dict")  # type: ignore[arg-type]
            assert False, "Expected TypeError"
        except TypeError:
            pass

    def test_missing_unit_key_raises_value_error(self) -> None:
        try:
            reorganize({"other": 1})
            assert False, "Expected ValueError"
        except ValueError:
            pass

    def test_empty_input(self) -> None:
        result = reorganize({"unit": {}})
        assert result == {"unit": {}}

    def test_no_segment_list(self) -> None:
        data = {"unit": {"id": "u1", "openingList": [{"id": "o1"}]}}
        result = reorganize(data)
        # No segmentList → nothing to nest → unchanged
        assert result == data


class TestReorganizeSingleRef:
    def test_opening_list_nested(self) -> None:
        data = _make_unit(
            openingList=[
                {"id": "o1", "associatedUISegmentID": _SEG_A_ID},
                {"id": "o2", "associatedUISegmentID": _SEG_B_ID},
            ],
        )
        result = reorganize(data)
        unit = result["unit"]
        # openingList removed from top level
        assert "openingList" not in unit
        # Items nested under segments
        seg_a = unit["segmentList"][0]
        seg_b = unit["segmentList"][1]
        assert len(seg_a["openings"]) == 1
        assert seg_a["openings"][0]["id"] == "o1"
        assert len(seg_b["openings"]) == 1
        assert seg_b["openings"][0]["id"] == "o2"

    def test_bulkhead_list_nested(self) -> None:
        data = _make_unit(
            bulkheadList=[
                {"id": "b1", "associatedUISegmentID": _SEG_A_ID},
            ],
        )
        result = reorganize(data)
        assert "bulkheadList" not in result["unit"]
        assert len(result["unit"]["segmentList"][0]["bulkheads"]) == 1

    def test_coil_panel_list_nested(self) -> None:
        data = _make_unit(
            coilPanelList=[
                {"id": "c1", "associatedSegmentID": _SEG_B_ID},
            ],
        )
        result = reorganize(data)
        assert "coilPanelList" not in result["unit"]
        assert len(result["unit"]["segmentList"][1]["coilPanels"]) == 1

    def test_empty_single_ref_list_removed(self) -> None:
        data = _make_unit(openingList=[])
        result = reorganize(data)
        assert "openingList" not in result["unit"]
        # No openings key created on segments
        assert "openings" not in result["unit"]["segmentList"][0]

    def test_single_ref_with_unmatched_goes_to_orphans(self) -> None:
        data = _make_unit(
            openingList=[
                {"id": "o1", "associatedUISegmentID": _SEG_A_ID},
                {"id": "o2", "associatedUISegmentID": "nonexistent"},
            ],
        )
        result = reorganize(data)
        unit = result["unit"]
        assert "openingList" not in unit
        # o1 nested
        assert unit["segmentList"][0]["openings"][0]["id"] == "o1"
        # o2 in orphans
        assert unit["_unmatched"]["openings"][0]["id"] == "o2"

    def test_all_orphans(self) -> None:
        data = _make_unit(
            openingList=[
                {"id": "o1", "associatedUISegmentID": "missing-1"},
                {"id": "o2", "associatedUISegmentID": "missing-2"},
            ],
        )
        result = reorganize(data)
        unit = result["unit"]
        assert len(unit["_unmatched"]["openings"]) == 2
        assert "openings" not in unit["segmentList"][0]


class TestReorganizeMultiRef:
    def test_related_references_added(self) -> None:
        data = _make_unit(
            cabinetList=[
                {
                    "id": "cab-1",
                    "segmentReferenceList": [
                        {"id": "r1", "sequence": 0, "segmentID": _SEG_A_ID},
                        {"id": "r2", "sequence": 2, "segmentID": _SEG_B_ID},
                    ],
                },
            ],
        )
        result = reorganize(data)
        unit = result["unit"]
        # cabinetList stays at top level
        assert "cabinetList" in unit
        # Each segment has a relatedReferences pointer
        seg_a = unit["segmentList"][0]
        seg_b = unit["segmentList"][1]
        assert len(seg_a["relatedReferences"]) == 1
        assert seg_a["relatedReferences"][0]["sourceList"] == "cabinetList"
        assert seg_a["relatedReferences"][0]["itemId"] == "cab-1"
        assert seg_b["relatedReferences"][0]["sourceList"] == "cabinetList"

    def test_multi_ref_stays_at_top_level(self) -> None:
        """airPathList, cabinetList, shippingSkidList, drawingViewList
        must remain at top level after reorganize."""
        data = _make_unit(
            airPathList=[{"id": "ap-1", "segmentReferenceList": []}],
            cabinetList=[{"id": "cab-1", "segmentReferenceList": []}],
            shippingSkidList=[{"id": "skid-1", "segmentReferenceList": []}],
            drawingViewList=[{"id": "dv-1", "segmentReferenceList": []}],
        )
        result = reorganize(data)
        unit = result["unit"]
        assert "airPathList" in unit
        assert "cabinetList" in unit
        assert "shippingSkidList" in unit
        assert "drawingViewList" in unit

    def test_item_with_empty_segment_reference_list(self) -> None:
        data = _make_unit(
            shippingSkidList=[
                {"id": "skid-1", "segmentReferenceList": []},
            ],
        )
        result = reorganize(data)
        unit = result["unit"]
        assert "shippingSkidList" in unit
        # No relatedReferences entries created
        for seg in unit["segmentList"]:
            assert "relatedReferences" not in seg


class TestReorganizePassThrough:
    def test_non_segment_lists_unchanged(self) -> None:
        data = _make_unit(
            convergenceDivergenceList=[{"id": "cd-1"}],
            unitDeviationList=[{"id": "ud-1"}],
            freightDetailsList=[{"id": "fd-1"}],
            pricingDetailList=[{"id": "pd-1"}],
            pricingSubTotalList=[{"id": "ps-1"}],
            unitBaseList=[{"id": "ub-1"}],
            unitDescriptorList=[{"id": "des-1"}],
            soundDetailList=[{"id": "sd-1"}],
        )
        result = reorganize(data)
        unit = result["unit"]
        assert unit["convergenceDivergenceList"] == data["unit"]["convergenceDivergenceList"]
        assert unit["unitDeviationList"] == data["unit"]["unitDeviationList"]
        assert unit["freightDetailsList"] == data["unit"]["freightDetailsList"]
        assert unit["pricingDetailList"] == data["unit"]["pricingDetailList"]
        assert unit["pricingSubTotalList"] == data["unit"]["pricingSubTotalList"]
        assert unit["unitBaseList"] == data["unit"]["unitBaseList"]
        assert unit["unitDescriptorList"] == data["unit"]["unitDescriptorList"]
        assert unit["soundDetailList"] == data["unit"]["soundDetailList"]

    def test_segment_internal_lists_untouched(self) -> None:
        seg_a_with_growth = copy.deepcopy(_SEG_A)
        seg_a_with_growth["segmentGrowthList"] = [
            {"id": "g1", "growthType": "EndWall", "growthLength": 2},
        ]
        seg_a_with_growth["lightList"] = [{"id": "l1"}]
        seg_a_with_growth["soundDetailList"] = [{"id": "sd1"}]
        seg_a_with_growth["segmentStateList"] = [{"id": "st1"}]
        seg_a_with_growth["weightDescriptionList"] = [{"id": "wd1"}]

        data: dict = {
            "unit": {
                "segmentList": [seg_a_with_growth],
            },
        }
        result = reorganize(data)
        seg = result["unit"]["segmentList"][0]
        assert seg["segmentGrowthList"] == seg_a_with_growth["segmentGrowthList"]
        assert seg["lightList"] == seg_a_with_growth["lightList"]
        assert seg["soundDetailList"] == seg_a_with_growth["soundDetailList"]
        assert seg["segmentStateList"] == seg_a_with_growth["segmentStateList"]
        assert seg["weightDescriptionList"] == seg_a_with_growth["weightDescriptionList"]

    def test_scalar_keys_pass_through(self) -> None:
        data = _make_unit(id="unit-1", quantity=5)
        result = reorganize(data)
        assert result["unit"]["id"] == "unit-1"
        assert result["unit"]["quantity"] == 5


class TestReorganizeNoMutation:
    def test_input_is_not_mutated(self) -> None:
        data = _make_unit(
            openingList=[
                {"id": "o1", "associatedUISegmentID": _SEG_A_ID},
            ],
        )
        original = copy.deepcopy(data)
        reorganize(data)
        assert data == original


# ===================================================================
#  Integration with real data
# ===================================================================

class TestReorganizeRealData:
    def test_all_openings_nested_and_15_segments(self) -> None:
        """Integration: load SBS_DefaultT1.json, reorganize, verify counts."""
        from src.loader import load_json

        data = load_json("SBS_DefaultT1.json")
        result = reorganize(data)

        unit = result["unit"]
        segments = unit["segmentList"]

        assert len(segments) == 15
        assert "openingList" not in unit
        assert "bulkheadList" not in unit
        assert "coilPanelList" not in unit

        # Count total openings across all segments
        total_openings = sum(
            len(seg.get("openings", [])) for seg in segments
        )
        assert total_openings == 27

        # Count total bulkheads
        total_bulkheads = sum(
            len(seg.get("bulkheads", [])) for seg in segments
        )
        assert total_bulkheads == 8

        # Count total coil panels
        total_coils = sum(
            len(seg.get("coilPanels", [])) for seg in segments
        )
        assert total_coils == 2

        # Multi-ref lists stay at top level
        assert "airPathList" in unit
        assert "cabinetList" in unit
        assert "shippingSkidList" in unit
        assert "drawingViewList" in unit

        # Each segment has relatedReferences (since all multi-ref items
        # reference real segment IDs in the default file)
        for seg in segments:
            assert "relatedReferences" in seg, f"Segment {seg['id'][:8]} missing relatedReferences"
            assert len(seg["relatedReferences"]) > 0

    def test_no_orphans_in_default_file(self) -> None:
        """All items in SBS_DefaultT1.json reference valid segment IDs."""
        from src.loader import load_json

        data = load_json("SBS_DefaultT1.json")
        result = reorganize(data)
        unit = result["unit"]

        assert "_unmatched" not in unit, (
            "Unexpected orphans in default file"
        )
