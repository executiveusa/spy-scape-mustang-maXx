from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator, TypeVar

from .models import (
    BusinessIdentity,
    ClientCreateRequest,
    ClientAvatar,
    ClientRecord,
    ClientTheme,
    AcquisitionPolicy,
    HeartbeatSummary,
    IntakeChannel,
    LeadAcquisitionJob,
    ProspectRecord,
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
ACQUISITION_JOBS_PATH = DATA_ROOT / "lead_acquisition_jobs.json"
PROSPECTS_PATH = DATA_ROOT / "lead_acquisition_prospects.json"
ACQUISITION_POLICIES_PATH = DATA_ROOT / "acquisition_policies.json"
DB_PATH = DATA_ROOT / "maxx.db"


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


@contextmanager
def _connect() -> Iterator[sqlite3.Connection]:
    DATA_ROOT.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    try:
        yield connection
    finally:
        connection.close()


def _create_tables(connection: sqlite3.Connection) -> None:
    connection.executescript(
        """
        CREATE TABLE IF NOT EXISTS clients (
            client_id TEXT PRIMARY KEY,
            payload TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS workflow_packs (
            workflow_id TEXT PRIMARY KEY,
            payload TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS lead_desk_tasks (
            task_id TEXT PRIMARY KEY,
            client_id TEXT NOT NULL,
            payload TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS heartbeats (
            heartbeat_id TEXT PRIMARY KEY,
            client_id TEXT NOT NULL,
            workflow_id TEXT NOT NULL,
            payload TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS lead_acquisition_jobs (
            job_id TEXT PRIMARY KEY,
            client_id TEXT NOT NULL,
            payload TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS lead_acquisition_prospects (
            prospect_id TEXT PRIMARY KEY,
            client_id TEXT NOT NULL,
            job_id TEXT NOT NULL,
            payload TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS acquisition_policies (
            client_id TEXT PRIMARY KEY,
            payload TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        """
    )


def _table_count(connection: sqlite3.Connection, table: str) -> int:
    row = connection.execute(f"SELECT COUNT(*) AS total FROM {table}").fetchone()
    return int(row["total"])


def _upsert_payload(connection: sqlite3.Connection, table: str, key_column: str, key: str, payload: dict) -> None:
    timestamp = utc_now()
    serialized = json.dumps(payload, indent=2)
    if table == "lead_desk_tasks":
        connection.execute(
            """
            INSERT INTO lead_desk_tasks (task_id, client_id, payload, updated_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(task_id) DO UPDATE SET
                client_id = excluded.client_id,
                payload = excluded.payload,
                updated_at = excluded.updated_at
            """,
            (key, payload.get("client_id", ""), serialized, timestamp),
        )
        return
    if table == "lead_acquisition_jobs":
        connection.execute(
            """
            INSERT INTO lead_acquisition_jobs (job_id, client_id, payload, updated_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(job_id) DO UPDATE SET
                client_id = excluded.client_id,
                payload = excluded.payload,
                updated_at = excluded.updated_at
            """,
            (key, payload.get("client_id", ""), serialized, timestamp),
        )
        return
    if table == "lead_acquisition_prospects":
        connection.execute(
            """
            INSERT INTO lead_acquisition_prospects (prospect_id, client_id, job_id, payload, updated_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(prospect_id) DO UPDATE SET
                client_id = excluded.client_id,
                job_id = excluded.job_id,
                payload = excluded.payload,
                updated_at = excluded.updated_at
            """,
            (key, payload.get("client_id", ""), payload.get("job_id", ""), serialized, timestamp),
        )
        return
    if table == "heartbeats":
        connection.execute(
            """
            INSERT INTO heartbeats (heartbeat_id, client_id, workflow_id, payload, updated_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(heartbeat_id) DO UPDATE SET
                client_id = excluded.client_id,
                workflow_id = excluded.workflow_id,
                payload = excluded.payload,
                updated_at = excluded.updated_at
            """,
            (key, payload.get("client_id", ""), payload.get("workflow_id", ""), serialized, timestamp),
        )
        return

    connection.execute(
        f"""
        INSERT INTO {table} ({key_column}, payload, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT({key_column}) DO UPDATE SET
            payload = excluded.payload,
            updated_at = excluded.updated_at
        """,
        (key, serialized, timestamp),
    )


def _load_payloads(connection: sqlite3.Connection, table: str, order_by: str) -> list[dict]:
    rows = connection.execute(f"SELECT payload FROM {table} ORDER BY {order_by}").fetchall()
    return [json.loads(row["payload"]) for row in rows]


def _replace_table(connection: sqlite3.Connection, table: str, key_column: str, rows: list[dict]) -> None:
    connection.execute(f"DELETE FROM {table}")
    for row in rows:
        key = str(row.get(key_column, ""))
        if key:
            _upsert_payload(connection, table, key_column, key, row)


def _migrate_or_seed(connection: sqlite3.Connection) -> None:
    if _table_count(connection, "clients") == 0:
        client_rows = _read_json(CLIENTS_PATH, [item.model_dump() for item in default_clients()])
        for row in client_rows:
            _upsert_payload(connection, "clients", "client_id", row["client_id"], row)

    if _table_count(connection, "workflow_packs") == 0:
        workflow_rows = _read_json(WORKFLOWS_PATH, [item.model_dump() for item in default_workflow_packs()])
        for row in workflow_rows:
            _upsert_payload(connection, "workflow_packs", "workflow_id", row["workflow_id"], row)
    else:
        existing_ids = {
            row["workflow_id"]
            for row in connection.execute("SELECT workflow_id FROM workflow_packs").fetchall()
        }
        for workflow in default_workflow_packs():
            if workflow.workflow_id not in existing_ids:
                _upsert_payload(connection, "workflow_packs", "workflow_id", workflow.workflow_id, workflow.model_dump())

    if _table_count(connection, "lead_desk_tasks") == 0:
        for row in _read_json(TASKS_PATH, []):
            task_id = row.get("task_id")
            if task_id:
                _upsert_payload(connection, "lead_desk_tasks", "task_id", task_id, row)

    if _table_count(connection, "heartbeats") == 0:
        for row in _read_json(HEARTBEATS_PATH, []):
            heartbeat_id = row.get("heartbeat_id")
            if heartbeat_id:
                _upsert_payload(connection, "heartbeats", "heartbeat_id", heartbeat_id, row)

    if _table_count(connection, "lead_acquisition_jobs") == 0:
        for row in _read_json(ACQUISITION_JOBS_PATH, []):
            job_id = row.get("job_id")
            if job_id:
                _upsert_payload(connection, "lead_acquisition_jobs", "job_id", job_id, row)

    if _table_count(connection, "lead_acquisition_prospects") == 0:
        for row in _read_json(PROSPECTS_PATH, []):
            prospect_id = row.get("prospect_id")
            if prospect_id:
                _upsert_payload(connection, "lead_acquisition_prospects", "prospect_id", prospect_id, row)

    if _table_count(connection, "acquisition_policies") == 0:
        policy_rows = _read_json(ACQUISITION_POLICIES_PATH, [default_acquisition_policy().model_dump()])
        for row in policy_rows:
            client_id = row.get("client_id")
            if client_id:
                _upsert_payload(connection, "acquisition_policies", "client_id", client_id, row)


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
                "Reference smart-site tenant used to prove the Agent MAXX Lead Desk "
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
        enabled_workflows=["lead-desk", "lead-acquisition"],
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
        enabled_workflows=["lead-desk", "lead-acquisition"],
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
            "Provision the Agent MAXX profile before accepting live inquiries.",
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
        ),
        WorkflowPack(
            workflow_id="lead-acquisition",
            label="Lead Acquisition",
            capability="Discover, enrich, score, dedupe, and promote owner-approved prospects.",
            outcome_targets=["more leads", "save time", "remove mistakes"],
            status="canary",
            seams=["web-research-driver", "browser-worker", "authorized-contact-import", "operator-review"],
        ),
    ]


def default_acquisition_policy(client_id: str = "maxx-demo") -> AcquisitionPolicy:
    return AcquisitionPolicy(
        client_id=client_id,
        allowed_domains=["example.com", "iana.org"],
        allowed_sources=["manual", "web-research", "authorized-contact-import"],
        max_daily_records=25,
        browser_autonomy_enabled=False,
        outreach_requires_operator_approval=True,
        suppression_terms=["do not contact", "unsubscribe"],
    )


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
    with _connect() as connection:
        _create_tables(connection)
        _migrate_or_seed(connection)
        connection.commit()


def load_clients() -> list[ClientRecord]:
    ensure_seed_data()
    with _connect() as connection:
        rows = _load_payloads(connection, "clients", "client_id")
    return [ClientRecord.model_validate(item) for item in rows]


def save_clients(clients: list[ClientRecord]) -> None:
    ensure_seed_data()
    with _connect() as connection:
        _replace_table(connection, "clients", "client_id", [client.model_dump() for client in clients])
        connection.commit()


def load_workflow_packs() -> list[WorkflowPack]:
    ensure_seed_data()
    with _connect() as connection:
        rows = _load_payloads(connection, "workflow_packs", "workflow_id")
    return [WorkflowPack.model_validate(item) for item in rows]


def load_tasks() -> list[dict]:
    ensure_seed_data()
    with _connect() as connection:
        return _load_payloads(connection, "lead_desk_tasks", "updated_at")


def save_tasks(tasks: list[dict]) -> None:
    ensure_seed_data()
    with _connect() as connection:
        _replace_table(connection, "lead_desk_tasks", "task_id", tasks)
        connection.commit()


def load_heartbeats() -> list[HeartbeatSummary]:
    ensure_seed_data()
    with _connect() as connection:
        rows = _load_payloads(connection, "heartbeats", "updated_at")
    return [HeartbeatSummary.model_validate(item) for item in rows]


def save_heartbeats(heartbeats: list[HeartbeatSummary]) -> None:
    ensure_seed_data()
    with _connect() as connection:
        _replace_table(connection, "heartbeats", "heartbeat_id", [heartbeat.model_dump() for heartbeat in heartbeats])
        connection.commit()


def load_acquisition_jobs() -> list[LeadAcquisitionJob]:
    ensure_seed_data()
    with _connect() as connection:
        rows = _load_payloads(connection, "lead_acquisition_jobs", "updated_at")
    return [LeadAcquisitionJob.model_validate(item) for item in rows]


def save_acquisition_jobs(jobs: list[LeadAcquisitionJob]) -> None:
    ensure_seed_data()
    with _connect() as connection:
        _replace_table(connection, "lead_acquisition_jobs", "job_id", [job.model_dump() for job in jobs])
        connection.commit()


def load_prospects() -> list[ProspectRecord]:
    ensure_seed_data()
    with _connect() as connection:
        rows = _load_payloads(connection, "lead_acquisition_prospects", "updated_at")
    return [ProspectRecord.model_validate(item) for item in rows]


def save_prospects(prospects: list[ProspectRecord]) -> None:
    ensure_seed_data()
    with _connect() as connection:
        _replace_table(
            connection,
            "lead_acquisition_prospects",
            "prospect_id",
            [prospect.model_dump() for prospect in prospects],
        )
        connection.commit()


def load_acquisition_policies() -> list[AcquisitionPolicy]:
    ensure_seed_data()
    with _connect() as connection:
        rows = _load_payloads(connection, "acquisition_policies", "client_id")
    return [AcquisitionPolicy.model_validate(item) for item in rows]


def save_acquisition_policies(policies: list[AcquisitionPolicy]) -> None:
    ensure_seed_data()
    with _connect() as connection:
        _replace_table(
            connection,
            "acquisition_policies",
            "client_id",
            [policy.model_dump() for policy in policies],
        )
        connection.commit()


def build_seed_log_messages(clients: list[ClientRecord]) -> list[RuntimeNote]:
    now = utc_now()[11:19]
    provisioned = sum(1 for client in clients if client.hermes.status == "ready")
    return [
        RuntimeNote(
            id="runtime-1",
            timestamp=now,
            type="success",
            message=f"{provisioned} Agent MAXX tenant profile(s) ready for Lead Desk routing",
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
