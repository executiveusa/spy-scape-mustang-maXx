from __future__ import annotations

import os

from .models import SourceCredentialStatus


def web_research_health() -> SourceCredentialStatus:
    configured = bool(os.environ.get("FIRECRAWL_API_KEY"))
    return SourceCredentialStatus(
        source="web-research",
        label="Web Research Driver",
        status="online" if configured else "warning",
        configured=configured,
        enabled=configured,
        detail=(
            "Public web discovery and structured extraction are configured."
            if configured
            else "Set FIRECRAWL_API_KEY on the private backend to enable public web discovery."
        ),
    )


def browser_worker_health() -> SourceCredentialStatus:
    worker_url = os.environ.get("MAXX_BROWSER_WORKER_URL", "").strip()
    autonomy_enabled = os.environ.get("MAXX_BROWSER_AUTONOMY_ENABLED", "").lower() in {"1", "true", "yes"}
    configured = bool(worker_url)
    return SourceCredentialStatus(
        source="browser-worker",
        label="Private Browser Worker",
        status="online" if configured and autonomy_enabled else "warning",
        configured=configured,
        enabled=configured and autonomy_enabled,
        detail=(
            "Task-scoped browser automation is enabled for trusted tenants."
            if configured and autonomy_enabled
            else "Browser automation is disabled by default until tenant policy, allowlists, and operator approval are in place."
        ),
    )


def authorized_contact_import_health() -> SourceCredentialStatus:
    return SourceCredentialStatus(
        source="authorized-contact-import",
        label="Authorized Contact Import",
        status="online",
        configured=True,
        enabled=True,
        detail="Owner-provided exports or approved contact data can be normalized into MAXX prospect records.",
    )


def manual_source_health() -> SourceCredentialStatus:
    return SourceCredentialStatus(
        source="manual",
        label="Manual Prospect Intake",
        status="online",
        configured=True,
        enabled=True,
        detail="Operators can seed safe prospects for scoring, dedupe, and Lead Desk promotion.",
    )


def lead_acquisition_sources() -> list[SourceCredentialStatus]:
    return [
        manual_source_health(),
        web_research_health(),
        browser_worker_health(),
        authorized_contact_import_health(),
    ]
