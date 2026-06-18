from __future__ import annotations

import argparse
import io
import json
import os
import sys

from src.differ import diff
from src.loader import LoadError, load_json
from src.reorganizer import reorganize


def _write_reorganized(data: dict, original_path: str) -> str:
    """Write a reorganized JSON file alongside the original.

    Returns the output path written to.
    """
    base, ext = os.path.splitext(original_path)
    out_path = f"{base}_reorganized{ext}"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    return out_path


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Compare two AHU JSON files semantically.",
    )
    parser.add_argument("left", help="Path to left JSON file")
    parser.add_argument("right", help="Path to right JSON file")
    parser.add_argument(
        "--pretty", "-p",
        action="store_true",
        help="Pretty-print diff output",
    )
    parser.add_argument(
        "--reorganize", "-r",
        action="store_true",
        help="Reorganize flat JSON into segment-nested structure before diffing",
    )
    parser.add_argument(
        "--output-reorganized", "-o",
        action="store_true",
        help="Write reorganized JSON files alongside originals (implies --reorganize)",
    )

    args = parser.parse_args()

    try:
        left_data = load_json(args.left)
        right_data = load_json(args.right)
    except LoadError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

    if args.reorganize or args.output_reorganized:
        left_data = reorganize(left_data)
        right_data = reorganize(right_data)
        if args.output_reorganized:
            left_out = _write_reorganized(left_data, args.left)
            right_out = _write_reorganized(right_data, args.right)
            print(f"Reorganized left  -> {left_out}", file=sys.stderr)
            print(f"Reorganized right -> {right_out}", file=sys.stderr)

    result = diff(left_data, right_data, "$")
    output = result.to_dict()

    indent = 2 if args.pretty else None
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    json.dump(output, sys.stdout, indent=indent, ensure_ascii=False)
    print()


if __name__ == "__main__":
    main()
