from __future__ import annotations

import json
import os
from typing import Any


class LoadError(Exception):
    pass


def load_json(path: str) -> dict:
    if not os.path.isfile(path):
        raise LoadError(f"File not found: {path}")
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except UnicodeDecodeError:
        try:
            with open(path, encoding="cp1252") as f:
                return json.load(f)
        except json.JSONDecodeError as e:
            raise LoadError(f"Invalid JSON in {path}: {e}") from e
    except json.JSONDecodeError as e:
        raise LoadError(f"Invalid JSON in {path}: {e}") from e
    except OSError as e:
        raise LoadError(f"Cannot read {path}: {e}") from e
