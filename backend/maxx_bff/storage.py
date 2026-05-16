from __future__ import annotations

import json
from pathlib import Path
from typing import TypeVar

from .models import (
    BusinessIdentity,
    ClientCreateRequest,
    ClientAvatar,
    ClientRecord,
    ClientTheme,
    HeartbeatSummary,
    IntakeChannel,
    RoutingRule,
    RuntimeNote,
    ServiceOffer,
    SmartSiteManifest,
    WorkflowPack,
    utc_now,
)

T = TypeVar("T")

REPO_ROOT = Path(__file__).resolve().parents[2]
BACKEND_ROOT = REPO_ROOT / "backend"
DATA_ROOT = Path(
    __import__("os").environ.get("MAXX_DATA_DIR", str(BACKEND_ROOT / "data"))
).resolve()
CLIENTS_PATH = DATA_ROOT / "clients.json"
WORKFLOWS_PATH = DATA_ROOT / "workflow_packs.json"
TASKS_PATH = DATA_ROOT / "lead_desk_tasks.json"
HEARTBEATS_PATH = DATA_ROOT / "heartbeats.json"


def _write_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp_path = path.with_suffix(path.suffix + ".tmp")
    temp_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    temp_path.replace(path)


def _read_json(path: Path, default: T) -> T:
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return default


def default_manifest() -> SmartSiteManifest:
    return SmartSiteManifest(
        client_id="maxx-demo",
        business=BusinessIdentity(
            legal_name="MAXX Demo Holdings LLC",
            public_name="MAXX Demo Lead Desk",
            industry="Marketing Agency",
            timezone="America/Mexico_City",
            geography=["Austin", "Dallas", "Remote US"],
            summary=(
                "Reference smart-site tenant used to prove the Hermes-backed Lead Desk "
                "workflow before additional industries are onboarded."
            ),
            offers=[
                ServiceOffer(
                    code="lead-desk",
                    label="Lead Desk Automation",
                    outcome="Qualify inquiries, follow up fast, and route appointments cleanly.",
                ),
                ServiceOffer(
                    code="smart-site",
                    label="Smart Site System",
                    outcome="Give operators one tenant-aware surface for intake, routing, and oversight.",
                ),
            ],
        ),
        intake_channels=[
            IntakeChannel(type="form", label="Site Inquiry Form", destination="lead-desk"),
            IntakeChannel(type="email", label="Operator Inbox", destination="operators@maxx.demo"),
            IntakeChannel(type="calendar", label="Priority Booking", destination="sales-calendar"),
        ],
        routing_rules=[
            RoutingRule(when="hot lead", action="route", target="sales-calendar"),
            RoutingRule(when="warm lead", action="follow-up", target="operator-sequence"),
            RoutingRule(when="cold lead", action="nurture", target="email-drip"),
        ],
        enabled_workflows=["lead-desk"],
        avatar=ClientAvatar(
            avatar_id="maxx-ops-001",
            display_name="Agent MAXX",
            voice_profile="operator-neutral",
            image_set="mustang-maxx-core",
            brand_theme="maxx-cyan",
            industry_preset="agency",
        ),
        theme=ClientTheme(primary="#46d5ff", accent="#f4d35e", shell="#050810"),
        operator_notes=[
            "Lead Desk is the first live backend capability in this tenant.",
            "All public storytelling should map back to this manifest and its enabled workflows.",
        ],
    )


def manifest_from_request(request: ClientCreateRequest, slug: str) -> SmartSiteManifest:
    public_name = request.public_name.strip()
    legal_name = request.legal_name.strip() if request.legal_name else public_name
    geography = request.geography or ["Remote"]
    operator_email = request.operator_email or f"operators+{slug}@maxx.local"

    return SmartSiteManifest(
        client_id=request.client_id,
        business=BusinessIdentity(
            legal_name=legal_name,
            public_name=public_name,
            industry=request.industry,
            timezone=request.timezone,
            geography=geography,
            summary=request.summary,
            offers=[
                ServiceOffer(
                    code="lead-desk",
                    label=request.primary_offer,
                    outcome="Capture inquiries, qualify leads, and route follow-up without handoff mistakes.",
                ),
                ServiceOffer(
                    code="smart-site",
                    label="Smart Site System",
                    outcome="Give the client one branded intake surface connected to a MAXX employee.",
                ),
            ],
        ),
        intake_channels=[
            IntakeChannel(type="form", label="Site Inquiry Form", destination="lead-desk"),
            IntakeChannel(type="email", label="Operator Inbox", destination=operator_email),
            IntakeChannel(type="calendar", label="Priority Booking", destination="sales-calendar"),
        ],
        routing_rules=[
            RoutingRule(when="hot lead", action="route", target="sales-calendar"),
            RoutingRule(when="warm lead", action="follow-up", target="operator-sequence"),
            RoutingRule(when="cold lead", action="nurture", target="email-drip"),
        ],
        enabled_workflows=["lead-desk"],
        avatar=ClientAvatar(
            avatar_id=f"maxx-ops-{slug}",
            display_name="Agent MAXX",
            voice_profile="operator-neutral",
            image_set="mustang-maxx-core",
            brand_theme="maxx-cyan",
            industry_preset=request.industry.lower().replace(" ", "-"),
        ),
        theme=ClientTheme(
            primary=request.theme_primary,
            accent=request.theme_accent,
            shell=request.theme_shell,
        ),
        operator_notes=[
            "Lead Desk is enabled as this tenant's first MAXX employee capability.",
            "Provision the Hermes profile before accepting live inquiries.",
        ],
    )


def default_workflow_packs() -> list[WorkflowPack]:
    return [
        WorkflowPack(
            workflow_id="lead-desk",
            label="Lead Desk",
            capability="Lead capture, qualification, follow-up, and appointment routing.",
            outcome_targets=["more leads", "save time", "remove mistakes"],
            status="live",
            seams=["task-queue", "heartbeats", "assignee-model", "future-multi-agent"],
        )
    ]


def default_clients() -> list[ClientRecord]:
    manifest = default_manifest()
    timestamp = utc_now()
    return [
        ClientRecord(
            client_id="maxx-demo",
            slug="maxx-demo",
            status="provisioning-required",
            manifest=manifest,
            hermes={
                "profile_name": "maxx-demo",
                "profile_home": "",
                "workspace_path": "",
                "provider": "openrouter",
                "model": "openrouter/owl-alpha",
                "status": "pending",
            },
            created_at=timestamp,
            updated_at=timestamp,
        )
    ]


def ensure_seed_data() -> None:
    DATA_ROOT.mkdir(parents=True, exist_ok=True)

    if not CLIENTS_PATH.exists():
        _write_json(CLIENTS_PATH, [item.model_dump() for item in default_clients()])
    if not WORKFLOWS_PATH.exists():
        _write_json(WORKFLOWS_PATH, [item.model_dump() for item in default_workflow_packs()])
    if not TASKS_PATH.exists():
        _write_json(TASKS_PATH, [])
    if not HEARTBEATS_PATH.exists():
        _write_json(HEARTBEATS_PATH, [])


def load_clients() -> list[ClientRecord]:
    ensure_seed_data()
    return [ClientRecord.model_validate(item) for item in _read_json(CLIENTS_PATH, [])]


def save_clients(clients: list[ClientRecord]) -> None:
    _write_json(CLIENTS_PATH, [client.model_dump() for client in clients])


def load_workflow_packs() -> list[WorkflowPack]:
    ensure_seed_data()
    return [WorkflowPack.model_validate(item) for item in _read_json(WORKFLOWS_PATH, [])]


def load_tasks() -> list[dict]:
    ensure_seed_data()
    return _read_json(TASKS_PATH, [])


def save_tasks(tasks: list[dict]) -> None:
    _write_json(TASKS_PATH, tasks)


def load_heartbeats() -> list[HeartbeatSummary]:
    ensure_seed_data()
    return [HeartbeatSummary.model_validate(item) for item in _read_json(HEARTBEATS_PATH, [])]


def save_heartbeats(heartbeats: list[HeartbeatSummary]) -> None:
    _write_json(HEARTBEATS_PATH, [heartbeat.model_dump() for heartbeat in heartbeats])


def build_seed_log_messages(clients: list[ClientRecord]) -> list[RuntimeNote]:
    now = utc_now()[11:19]
    provisioned = sum(1 for client in clients if client.hermes.status == "ready")
    return [
        RuntimeNote(
            id="runtime-1",
            timestamp=now,
            type="success",
            message=f"{provisioned} Hermes tenant profile(s) ready for Lead Desk routing",
        ),
        RuntimeNote(
            id="runtime-2",
            timestamp=now,
            type="info",
            message="Smart-site manifests are being served from the tenant-aware MAXX control plane",
        ),
        RuntimeNote(
            id="runtime-3",
            timestamp=now,
            type="warning",
            message="Production auth is still unconfigured for operator sessions",
        ),
    ]
