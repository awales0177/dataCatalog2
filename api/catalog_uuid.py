"""Time-ordered UUIDs (version 7) for new catalog entities."""

try:
    from uuid6 import uuid7 as _uuid7
except ImportError:  # pragma: no cover
    import uuid as _uuid_std

    if not hasattr(_uuid_std, "uuid7"):
        raise ImportError(
            "Install uuid6 (see api/requirements.txt) or use Python 3.13+ (uuid.uuid7)"
        ) from None
    _uuid7 = _uuid_std.uuid7


def new_uuid_str() -> str:
    return str(_uuid7())
