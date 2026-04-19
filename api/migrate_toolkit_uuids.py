#!/usr/bin/env python3
"""One-off: add stable uuid to toolkit workbenches and nested technologies (keeps legacy id)."""
import json
import uuid
from pathlib import Path

from catalog_uuid import new_uuid_str


def _is_uuid(s: str) -> bool:
    try:
        uuid.UUID(str(s))
        return True
    except (ValueError, TypeError, AttributeError):
        return False


def main():
    p = Path(__file__).resolve().parent / "_data" / "toolkit.json"
    data = json.loads(p.read_text(encoding="utf-8"))
    toolkits = data.get("toolkit", {}).get("toolkits") or []
    for tk in toolkits:
        if not tk.get("uuid"):
            tid = tk.get("id")
            tk["uuid"] = str(tid) if _is_uuid(tid) else new_uuid_str()
        for tech in tk.get("technologies") or []:
            if not tech.get("uuid"):
                tid = tech.get("id")
                tech["uuid"] = str(tid) if _is_uuid(tid) else new_uuid_str()
    p.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Updated {p}")


if __name__ == "__main__":
    main()
