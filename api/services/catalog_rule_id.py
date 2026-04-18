"""Catalog model-rule IDs: {stage}_{zone}_{NNN} (NNN zero-padded, per stage+zone)."""

from __future__ import annotations

import re
from typing import Any, Dict, List

_ALLOWED_STAGES = frozenset({"bronze", "silver", "gold"})
_ALLOWED_ZONES = frozenset({"value", "schema", "product", "other"})


def normalize_rule_stage(raw: Any) -> str:
    s = str(raw or "").lower().strip()
    return s if s in _ALLOWED_STAGES else "bronze"


def normalize_rule_zone(raw: Any) -> str:
    s = str(raw or "").lower().strip()
    return s if s in _ALLOWED_ZONES else "value"


def next_catalog_rule_id(existing_rules: List[Dict[str, Any]], stage: Any, zone: Any) -> str:
    st = normalize_rule_stage(stage)
    rz = normalize_rule_zone(zone)
    prefix = f"{st}_{rz}_"
    pattern = re.compile(r"^" + re.escape(prefix) + r"(\d+)$")
    max_n = 0
    for r in existing_rules:
        rid = str(r.get("id") or "")
        m = pattern.match(rid)
        if m:
            max_n = max(max_n, int(m.group(1)))
    return f"{prefix}{max_n + 1:03d}"
