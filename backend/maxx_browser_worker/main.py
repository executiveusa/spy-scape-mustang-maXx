from __future__ import annotations

import os
from typing import Any
from urllib.parse import urlparse

from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel, Field


class BrowserJobRequest(BaseModel):
    query: str = Field(min_length=3)
    target_url: str = Field(min_length=8)
    max_records: int = Field(default=5, ge=1, le=10)
    mode: str = Field(default="prospect-discovery")


class BrowserProspect(BaseModel):
    company: str
    contact_name: str | None = None
    title: str | None = None
    email: str | None = None
    phone: str | None = None
    linkedin_url: str | None = None
    location: str | None = None
    seniority: str | None = None
    department: str | None = None
    domain: str | None = None
    source_url: str
    notes: str


def configured_secret() -> str:
    return os.environ.get("MAXX_BROWSER_WORKER_SECRET", "").strip()


def autonomy_enabled() -> bool:
    return os.environ.get("MAXX_BROWSER_AUTONOMY_ENABLED", "").lower() in {"1", "true", "yes"}


def allowed_domains() -> list[str]:
    raw = os.environ.get("MAXX_BROWSER_ALLOWED_DOMAINS", "example.com,iana.org")
    return [item.strip().lower() for item in raw.split(",") if item.strip()]


def browser_harness_available() -> bool:
    try:
        __import__("browser_harness")
        return True
    except Exception:
        return False


def require_worker_secret(
    x_maxx_browser_worker_secret: str | None = Header(default=None),
) -> None:
    secret = configured_secret()
    if not secret:
        raise HTTPException(status_code=503, detail="Browser worker secret is not configured.")
    if x_maxx_browser_worker_secret != secret:
        raise HTTPException(status_code=401, detail="Browser worker secret required.")


def target_allowed(target_url: str) -> bool:
    hostname = (urlparse(target_url).hostname or "").lower().removeprefix("www.")
    return any(hostname == domain or hostname.endswith(f".{domain}") for domain in allowed_domains())


app = FastAPI(
    title="Agent MAXX Browser Worker",
    version="0.1.0",
    description="Private browser worker for allowlisted Agent MAXX acquisition jobs.",
)


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "service": "agent-maxx-browser-worker",
        "status": "online" if configured_secret() and autonomy_enabled() else "disabled",
        "autonomy_enabled": autonomy_enabled(),
        "secret_configured": bool(configured_secret()),
        "browser_harness_available": browser_harness_available(),
        "allowed_domains": allowed_domains(),
    }


@app.post("/v1/browser/jobs", dependencies=[Depends(require_worker_secret)])
def create_browser_job(request: BrowserJobRequest) -> dict[str, Any]:
    if not autonomy_enabled():
        raise HTTPException(status_code=403, detail="Browser worker autonomy is disabled.")
    if request.mode != "prospect-discovery":
        raise HTTPException(status_code=400, detail="Unsupported browser worker mode.")
    if not target_allowed(request.target_url):
        raise HTTPException(status_code=403, detail="Target URL is outside the browser worker allowlist.")

    hostname = (urlparse(request.target_url).hostname or "").lower().removeprefix("www.")
    label = hostname.split(".")[0].replace("-", " ").title() if hostname else "Allowlisted Site"

    # Real Chrome automation is intentionally a later VPS-only switch. Until then,
    # dry-run output proves the control path without touching authenticated sites.
    prospect = BrowserProspect(
        company=f"{label} Browser Review",
        domain=hostname or None,
        source_url=request.target_url,
        notes=(
            "Dry-run browser worker response. Enable the installed browser harness on the VPS "
            "before allowing real authenticated navigation."
        ),
    )
    return {
        "status": "dry-run" if not browser_harness_available() else "ready-for-runner",
        "query": request.query,
        "target_url": request.target_url,
        "prospects": [prospect.model_dump()],
        "events": [
            "Secret accepted.",
            "Target URL passed allowlist.",
            "Dry-run prospect returned without launching a browser.",
        ],
    }
