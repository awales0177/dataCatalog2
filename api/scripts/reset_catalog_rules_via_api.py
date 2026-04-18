#!/usr/bin/env python3
"""Delete all catalog model rules and recreate samples via live HTTP calls to the API."""

from __future__ import annotations

import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request
from urllib.parse import quote

_API_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_VENV_PY = os.path.join(_API_DIR, ".venv", "bin", "python3")
if not os.path.isfile(_VENV_PY):
    _VENV_PY = os.path.join(_API_DIR, ".venv", "bin", "python")

PORT = int(os.environ.get("RESET_RULES_API_PORT", "9876"))
BASE = f"http://127.0.0.1:{PORT}"
AUTH_HEADERS = {"Authorization": "Bearer reset-script", "Content-Type": "application/json"}


def _request(method: str, path: str, body: dict | None = None) -> tuple[int, dict | list | None]:
    url = f"{BASE}{path}"
    data = None if body is None else json.dumps(body).encode("utf-8")
    req = urllib.request.Request(url, data=data, method=method)
    for k, v in AUTH_HEADERS.items():
        req.add_header(k, v)
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            raw = resp.read().decode("utf-8")
            if not raw:
                return resp.status, None
            return resp.status, json.loads(raw)
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"{method} {path} -> {e.code}: {err_body}") from e


def main() -> None:
    seeds = [
        {
            "name": "Library: required fields present",
            "description": "Template rule in the catalog library.",
            "documentation": "",
            "ruleType": "validation",
            "stage": "bronze",
            "ruleZone": "value",
            "enabled": True,
            "tags": ["library", "baseline"],
        },
        {
            "name": "Schema: keys and types",
            "description": "Validate schema contracts for the customer model.",
            "documentation": "",
            "ruleType": "validation",
            "stage": "silver",
            "ruleZone": "schema",
            "enabled": True,
            "tags": ["schema", "cust"],
            "modelShortName": "CUST",
        },
        {
            "name": "Product: metric aggregates",
            "description": "Transformation rules for product analytics fields.",
            "documentation": "",
            "ruleType": "transformation",
            "stage": "gold",
            "ruleZone": "product",
            "enabled": True,
            "tags": ["product", "cust"],
            "modelShortName": "CUST",
        },
        {
            "name": "Cross-cutting documentation",
            "description": "Catch-all metadata and documentation checks.",
            "documentation": "",
            "ruleType": "validation",
            "stage": "bronze",
            "ruleZone": "other",
            "enabled": True,
            "tags": ["docs"],
            "modelShortName": "CUST",
        },
    ]

    if not os.path.isfile(_VENV_PY):
        print("Create the API venv first: cd api && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt", file=sys.stderr)
        sys.exit(1)

    proc = subprocess.Popen(
        [_VENV_PY, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", str(PORT)],
        cwd=_API_DIR,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.PIPE,
    )
    try:
        ready = False
        for _ in range(40):
            time.sleep(0.25)
            try:
                st, _ = _request("GET", "/api/rules")
                if st == 200:
                    ready = True
                    break
            except (urllib.error.URLError, RuntimeError, OSError):
                continue
        if not ready:
            err = proc.stderr.read().decode("utf-8", errors="replace") if proc.stderr else ""
            raise RuntimeError(f"Server did not become ready on {BASE}. stderr:\n{err}")

        _, payload = _request("GET", "/api/rules")
        rules = (payload or {}).get("rules") or []
        print(f"Deleting {len(rules)} rule(s)...")
        for rule in rules:
            rid = rule.get("id")
            if not rid:
                continue
            path_id = quote(str(rid), safe="")
            _request("DELETE", f"/api/rules/{path_id}")
            print(f"  deleted {rid}")

        print(f"Creating {len(seeds)} rule(s)...")
        for body in seeds:
            _, created = _request("POST", "/api/rules", body)
            cid = (created or {}).get("id")
            print(f"  created {cid} — {body.get('name')}")

        print("Done.")
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()


if __name__ == "__main__":
    main()
