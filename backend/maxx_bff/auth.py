from __future__ import annotations

import hmac
import os

from fastapi import HTTPException, Request


SECRET_HEADER = "x-maxx-bff-secret"


def shared_secret() -> str | None:
    value = os.environ.get("MAXX_BFF_SHARED_SECRET", "").strip()
    return value or None


def shared_secret_configured() -> bool:
    return shared_secret() is not None


async def require_bff_secret(request: Request) -> None:
    expected = shared_secret()
    if expected is None:
        return

    supplied = request.headers.get(SECRET_HEADER, "")
    authorization = request.headers.get("authorization", "")
    if authorization.lower().startswith("bearer "):
        supplied = authorization[7:].strip()

    if not supplied or not hmac.compare_digest(supplied, expected):
        raise HTTPException(status_code=401, detail="MAXX BFF shared secret is required.")
