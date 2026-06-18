#!/usr/bin/env python3
"""
JCI JSON Reorganizer.

Loads two JSON files and writes reorganized versions with nested lists
(openings, bulkheads, coilPanels) placed under their owning segments.

Usage:
  python run_diff.py                                    # Default files with reorganize
  python run_diff.py --skip-reorganize                   # Without reorganize
  python run_diff.py a.json b.json                       # Custom files
  python run_diff.py a.json b.json --skip-reorganize     # Custom files without reorganize

After running, open comparer.html and load the *_reorganized.json files.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

from src.loader import load_json, LoadError
from src.reorganizer import reorganize

REPO = Path(__file__).resolve().parent
DEFAULT_LEFT = "SBS_DefaultT1.json"
DEFAULT_RIGHT = "SBS_CabResizedT1.json"


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    """Parse CLI arguments."""
    parser = argparse.ArgumentParser(
        description="Reorganize JCI JSON files for use with comparer.html",
    )
    parser.add_argument(
        "file1",
        nargs="?",
        default=DEFAULT_LEFT,
        help=f"Left JSON file (default: {DEFAULT_LEFT})",
    )
    parser.add_argument(
        "file2",
        nargs="?",
        default=DEFAULT_RIGHT,
        help=f"Right JSON file (default: {DEFAULT_RIGHT})",
    )
    parser.add_argument(
        "--skip-reorganize",
        action="store_true",
        help="Skip reorganize step, use raw JSON data",
    )
    return parser.parse_args(argv)


def resolve_path(raw: str) -> str:
    """Resolve a potentially relative path against REPO root."""
    p = Path(raw)
    if p.is_absolute():
        return raw
    return str(REPO / p)


def write_reorganized(data: dict, path: str) -> str:
    """Write reorganized JSON sidecar, return the path written."""
    base, ext = path.rsplit(".", 1)
    reorg_path = f"{base}_reorganized.{ext}"
    with open(reorg_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    return reorg_path


def main() -> None:
    args = parse_args()

    try:
        left_path = resolve_path(args.file1)
        right_path = resolve_path(args.file2)

        print(f"Left:  {left_path}")
        print(f"Right: {right_path}")
        print(f"Reorganize: {'NO' if args.skip_reorganize else 'YES'}")

        left_raw = load_json(left_path)
        right_raw = load_json(right_path)

        if args.skip_reorganize:
            left_data = left_raw
            right_data = right_raw
            print("\nSkipped reorganize — use original files in comparer.html.")
        else:
            print("\nReorganizing...")
            left_data = reorganize(left_raw)
            right_data = reorganize(right_raw)

            left_reorg = write_reorganized(left_data, left_path)
            right_reorg = write_reorganized(right_data, right_path)
            print(f"   -> {os.path.basename(left_reorg)}")
            print(f"   -> {os.path.basename(right_reorg)}")
            print("\nDone. Open comparer.html and load the *_reorganized.json files.")

    except (LoadError, TypeError, ValueError) as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)




if __name__ == "__main__":
    main()
