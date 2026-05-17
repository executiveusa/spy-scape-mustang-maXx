from __future__ import annotations

import os

from .auth import shared_secret_configured


LOCAL_ALLOWED_ORIGINS = [
    "http://127.0.0.1:3000",
    "http://localhost:3000",
    "http://127.0.0.1:3011",
    "http://localhost:3011",
]


def environment() -> str:
    return os.environ.get("MAXX_ENV", "development").strip().lower()


def is_production() -> bool:
    return environment() == "production"


def allowed_origins() -> list[str]:
    configured = os.environ.get("MAXX_ALLOWED_ORIGINS", "").strip()
    if configured:
        return [origin.strip().rstrip("/") for origin in configured.split(",") if origin.strip()]
    return LOCAL_ALLOWED_ORIGINS


def production_config_warnings() -> list[str]:
    warnings: list[str] = []
    origins = allowed_origins()

    if is_production() and origins == LOCAL_ALLOWED_ORIGINS:
        warnings.append("MAXX_ALLOWED_ORIGINS is not set; production CORS is still using local development origins.")
    if "*" in origins:
        warnings.append("MAXX_ALLOWED_ORIGINS must not include '*' for production.")
    if is_production() and os.environ.get("MAXX_ALLOW_PUBLIC_BFF", "").lower() == "true":
        warnings.append("MAXX_ALLOW_PUBLIC_BFF=true is only acceptable for short-lived demos, not client production.")
    if is_production() and not shared_secret_configured():
        warnings.append("MAXX_BFF_SHARED_SECRET is not set; /v1 routes are not protected from direct access.")

    return warnings
