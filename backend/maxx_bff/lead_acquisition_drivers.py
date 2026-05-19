from __future__ import annotations

import json
import os
from urllib import request
from urllib.parse import urlparse

from .models import ProspectInput, SourceCredentialStatus


FIRECRAWL_API_BASE = os.environ.get("MAXX_FIRECRAWL_API_BASE", "https://api.firecrawl.dev").rstrip("/")


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


def discover_web_research_prospects(
    query: str,
    max_records: int,
    target_url: str | None = None,
) -> tuple[list[ProspectInput], list[str]]:
    api_key = os.environ.get("FIRECRAWL_API_KEY", "").strip()
    if not api_key:
        return [], ["Web research driver is not configured; no external discovery was attempted."]

    if target_url:
        payload = _firecrawl_post(
            "/v2/scrape",
            api_key,
            {"url": target_url, "formats": ["markdown"]},
        )
        prospect = _prospect_from_scrape_payload(payload, target_url)
        return [prospect] if prospect else [], [f"Scraped {target_url} for public evidence."]

    payload = _firecrawl_post(
        "/v2/search",
        api_key,
        {
            "query": query,
            "limit": max_records,
            "scrapeOptions": {"formats": ["markdown"]},
        },
    )
    prospects = _prospects_from_search_payload(payload, max_records)
    return prospects, [f"Search completed for '{query}' with {len(prospects)} normalized result(s)."]


def run_browser_worker_job(
    query: str,
    target_url: str,
    max_records: int,
) -> tuple[list[ProspectInput], list[str]]:
    worker_url = os.environ.get("MAXX_BROWSER_WORKER_URL", "").strip().rstrip("/")
    autonomy_enabled = os.environ.get("MAXX_BROWSER_AUTONOMY_ENABLED", "").lower() in {"1", "true", "yes"}
    if not worker_url or not autonomy_enabled:
        return [], ["Private browser worker is disabled; no browser action was attempted."]

    headers = {"Content-Type": "application/json"}
    worker_secret = os.environ.get("MAXX_BROWSER_WORKER_SECRET", "").strip()
    if worker_secret:
        headers["X-MAXX-BROWSER-WORKER-SECRET"] = worker_secret

    body = {
        "query": query,
        "target_url": target_url,
        "max_records": max_records,
        "mode": "prospect-discovery",
    }
    payload = json.dumps(body).encode("utf-8")
    http_request = request.Request(
        f"{worker_url}/v1/browser/jobs",
        data=payload,
        method="POST",
        headers=headers,
    )
    with request.urlopen(http_request, timeout=30) as response:
        result = json.loads(response.read().decode("utf-8"))

    prospects = _prospects_from_worker_payload(result, max_records)
    return prospects, [f"Private browser worker returned {len(prospects)} normalized result(s)."]


def _firecrawl_post(path: str, api_key: str, body: dict[str, object]) -> dict[str, object]:
    payload = json.dumps(body).encode("utf-8")
    http_request = request.Request(
        f"{FIRECRAWL_API_BASE}{path}",
        data=payload,
        method="POST",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
    )
    with request.urlopen(http_request, timeout=20) as response:
        return json.loads(response.read().decode("utf-8"))


def _prospects_from_worker_payload(payload: dict[str, object], max_records: int) -> list[ProspectInput]:
    raw_results = payload.get("prospects") or payload.get("data") or []
    if not isinstance(raw_results, list):
        return []

    prospects: list[ProspectInput] = []
    for item in raw_results[:max_records]:
        if not isinstance(item, dict):
            continue
        company = str(item.get("company") or item.get("organization") or item.get("name") or "").strip()
        if not company:
            continue
        prospects.append(
            ProspectInput(
                name=_optional_string(item.get("contact_name") or item.get("name")),
                title=_optional_string(item.get("title")),
                company=company[:120],
                email=_optional_string(item.get("email")),
                phone=_optional_string(item.get("phone")),
                linkedin_url=_optional_string(item.get("linkedin_url")),
                location=_optional_string(item.get("location")),
                seniority=_optional_string(item.get("seniority")),
                department=_optional_string(item.get("department")),
                organization_domain=_optional_string(item.get("organization_domain") or item.get("domain")),
                notes=_optional_string(item.get("notes") or item.get("evidence")),
                source_url=_optional_string(item.get("source_url")),
            )
        )
    return prospects


def _optional_string(value: object) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _prospects_from_search_payload(payload: dict[str, object], max_records: int) -> list[ProspectInput]:
    raw_results = payload.get("data") or payload.get("results") or []
    if not isinstance(raw_results, list):
        return []

    prospects: list[ProspectInput] = []
    for item in raw_results[:max_records]:
        if not isinstance(item, dict):
            continue
        url = str(item.get("url") or item.get("sourceURL") or "").strip()
        title = str(item.get("title") or _domain_label(url) or "Public web result").strip()
        description = str(item.get("description") or item.get("markdown") or item.get("content") or "").strip()
        domain = _domain_from_url(url)
        prospects.append(
            ProspectInput(
                company=title[:120],
                organization_domain=domain,
                notes=description[:700] or f"Public web result captured for {title}.",
                source_url=url or None,
            )
        )
    return prospects


def _prospect_from_scrape_payload(payload: dict[str, object], target_url: str) -> ProspectInput | None:
    data = payload.get("data") if isinstance(payload.get("data"), dict) else payload
    if not isinstance(data, dict):
        return None
    metadata = data.get("metadata") if isinstance(data.get("metadata"), dict) else {}
    title = str(metadata.get("title") or _domain_label(target_url) or "Public website").strip()
    markdown = str(data.get("markdown") or data.get("content") or "").strip()
    return ProspectInput(
        company=title[:120],
        organization_domain=_domain_from_url(target_url),
        notes=markdown[:700] or f"Public website captured from {target_url}.",
        source_url=target_url,
    )


def _domain_from_url(url: str) -> str | None:
    if not url:
        return None
    hostname = urlparse(url).hostname
    return hostname.lower().removeprefix("www.") if hostname else None


def _domain_label(url: str) -> str | None:
    domain = _domain_from_url(url)
    if not domain:
        return None
    return domain.split(".")[0].replace("-", " ").title()
