from __future__ import annotations

import json
from pathlib import Path

from fastapi import Body, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from . import hermes_vendor
from .settings import allowed_origins, production_config_warnings
from .control_plane import (
    create_client,
    get_client,
    get_task,
    list_clients,
    list_heartbeats,
    list_tasks,
    list_workflow_packs,
    manifest_for,
    maxx_wrapper_readiness,
    provision_client,
    quickstart_client,
    runtime_logs,
    runtime_routes,
    runtime_systems,
    submit_lead,
    update_task_status,
)
from .models import ClientCreateRequest, LeadDeskStatusUpdate, LeadDeskSubmission

REPO_ROOT = Path(__file__).resolve().parents[2]
PACKAGE_JSON_PATH = REPO_ROOT / "package.json"
PUBLIC_ASSET_DIR = REPO_ROOT / "public" / "mustang-maxx-images"


def load_package_manifest() -> dict[str, object]:
    try:
        return json.loads(PACKAGE_JSON_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {}


def next_runtime_label() -> str:
    package_manifest = load_package_manifest()
    dependencies = package_manifest.get("dependencies")
    if not isinstance(dependencies, dict):
        return "Next.js (version unavailable)"

    next_version = dependencies.get("next")
    if isinstance(next_version, str) and next_version.strip():
        return f"Next.js {next_version.lstrip('^~')}"

    return "Next.js (version unavailable)"


def public_asset_stats() -> dict[str, int]:
    try:
        files = [entry for entry in PUBLIC_ASSET_DIR.iterdir() if entry.is_file()]
    except Exception:
        return {"count": 0, "bytes": 0}

    total_bytes = sum(file.stat().st_size for file in files)
    return {"count": len(files), "bytes": total_bytes}


def format_megabytes(total_bytes: int) -> str:
    return f"{total_bytes / (1024 * 1024):.1f} MB"


app = FastAPI(
    title="Agent MAXX BFF",
    version="0.3.0",
    description="Tenant-aware backend-for-frontend control plane for the Agent MAXX smart-site platform.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    hermes = hermes_vendor.health()
    warnings = production_config_warnings()
    return {
        "status": "ok" if hermes.available and not warnings else "degraded",
        "service": "agent-maxx-bff",
        "hermes": hermes.status,
    }


@app.get("/v1/hermes/health")
def hermes_health() -> dict[str, object]:
    return hermes_vendor.health().model_dump()


@app.get("/v1/hermes/profiles")
def hermes_profiles() -> dict[str, object]:
    return {
        "profiles": hermes_vendor.list_profiles(),
        "runtime_home": str(hermes_vendor.runtime_home()),
    }


@app.get("/v1/providers")
def providers() -> dict[str, object]:
    hermes = hermes_vendor.health()
    return {
        "providers": [
            {
                "provider": hermes.provider,
                "model": hermes.model,
                "configured": hermes.provider_configured,
                "execution_ready": hermes.execution_ready,
            }
        ]
    }


@app.get("/v1/maxx/readiness")
def maxx_readiness(client_id: str = Query(default="maxx-demo")) -> dict[str, object]:
    return maxx_wrapper_readiness(client_id)


@app.post("/v1/maxx/quickstart")
def maxx_quickstart(request: ClientCreateRequest | None = Body(default=None)) -> dict[str, object]:
    try:
        return quickstart_client(request)
    except FileExistsError as error:
        raise HTTPException(status_code=409, detail=f"Client already exists: {error.args[0]}") from error
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error


@app.get("/v1/clients")
def clients() -> dict[str, object]:
    return {"clients": [client.model_dump() for client in list_clients()]}


@app.post("/v1/clients")
def create_tenant(request: ClientCreateRequest) -> dict[str, object]:
    try:
        client = create_client(request)
    except FileExistsError as error:
        raise HTTPException(status_code=409, detail=f"Client already exists: {error.args[0]}") from error
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    return client.model_dump()


@app.post("/v1/clients/{client_id}/provision")
def provision(client_id: str) -> dict[str, object]:
    try:
        client = provision_client(client_id)
    except KeyError as error:
        raise HTTPException(status_code=404, detail=f"Unknown client: {error.args[0]}") from error
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    return client.model_dump()


@app.get("/v1/clients/{client_id}/manifest")
def client_manifest(client_id: str) -> dict[str, object]:
    try:
        return manifest_for(client_id).model_dump()
    except KeyError as error:
        raise HTTPException(status_code=404, detail=f"Unknown client: {error.args[0]}") from error


@app.get("/v1/workflows")
def workflows() -> dict[str, object]:
    return {"workflow_packs": [workflow.model_dump() for workflow in list_workflow_packs()]}


@app.get("/v1/heartbeats")
def heartbeats() -> dict[str, object]:
    return {"heartbeats": [heartbeat.model_dump() for heartbeat in list_heartbeats()]}


@app.post("/v1/lead-desk/tasks")
def create_lead_desk_task(submission: LeadDeskSubmission) -> dict[str, object]:
    try:
        task = submit_lead(submission)
    except KeyError as error:
        raise HTTPException(status_code=404, detail=f"Unknown client: {error.args[0]}") from error
    return task.model_dump()


@app.get("/v1/lead-desk/tasks")
def lead_desk_tasks(client_id: str | None = Query(default=None)) -> dict[str, object]:
    return {"tasks": [task.model_dump() for task in list_tasks(client_id=client_id)]}


@app.get("/v1/lead-desk/tasks/{task_id}")
def lead_desk_task(task_id: str) -> dict[str, object]:
    try:
        return get_task(task_id).model_dump()
    except KeyError as error:
        raise HTTPException(status_code=404, detail=f"Unknown task: {error.args[0]}") from error


@app.patch("/v1/lead-desk/tasks/{task_id}")
def patch_lead_desk_task(task_id: str, update: LeadDeskStatusUpdate) -> dict[str, object]:
    try:
        task = update_task_status(task_id, update.status, update.note)
    except KeyError as error:
        raise HTTPException(status_code=404, detail=f"Unknown task: {error.args[0]}") from error
    return task.model_dump()


@app.get("/v1/meta")
def meta() -> dict[str, object]:
    hermes = hermes_vendor.health()
    workflows_count = len(list_workflow_packs())
    clients_count = len(list_clients())
    return {
        "name": "Agent MAXX BFF",
        "version": "0.3.0",
        "mode": "lead-desk-control-plane",
        "frontend": next_runtime_label(),
        "auth": "unconfigured",
        "memory": "profile-backed",
        "tenancy": "multi-tenant",
        "allowed_origins": allowed_origins(),
        "hermes_mode": hermes.mode,
        "provider": hermes.provider,
        "model": hermes.model,
        "provider_configured": hermes.provider_configured,
        "workflow_packs": workflows_count,
        "clients": clients_count,
        "notes": [
            "MAXX is a branded wrapper around Hermes Agent, customized for tenant-scoped smart-site operations.",
            "MAXX now uses a tenant-aware control plane instead of scaffold-only runtime placeholders.",
            "Lead Desk is the first real workflow pack; broader orchestration remains a Wave 2 seam.",
            *production_config_warnings(),
        ],
    }


@app.get("/v1/access")
def access() -> dict[str, object]:
    return {
        "status": "scaffold",
        "provider": "private-network",
        "operator_login_route": "/login",
        "session_mode": "auth-deferred-private-backend",
        "allowed_surfaces": [
            "Public cinematic homepage",
            "Command deck runtime readout",
            "Deployment console",
            "Tenant manifest retrieval",
            "Lead Desk task intake",
        ],
        "blocked_surfaces": [
            "Public unauthenticated BFF exposure",
            "Role-based tenant control",
            "Production deployment actions",
        ],
        "recommended_next_steps": [
            "Keep FastAPI private behind firewall, tunnel, or IP allowlist while app-level auth is deferred.",
            "Set MAXX_ALLOWED_ORIGINS to the production Vercel origin list.",
            "Add real operator auth before exposing tenant mutation endpoints beyond trusted network paths.",
        ],
        "env_targets": [
            "MAXX_BFF_URL",
            "MAXX_ALLOWED_ORIGINS",
            "MAXX_ENV",
            "MAXX_ALLOW_PUBLIC_BFF",
            "MAXX_OPENROUTER_API_KEY",
        ],
    }


@app.get("/v1/systems")
def systems() -> dict[str, object]:
    return {"systems": [system.model_dump() for system in runtime_systems()]}


@app.get("/v1/logs")
def logs() -> dict[str, object]:
    return {"logs": [log.model_dump() for log in runtime_logs()]}


@app.get("/v1/routes")
def routes() -> dict[str, object]:
    return {"routes": [route.model_dump() for route in runtime_routes()]}


@app.get("/v1/runtime")
def runtime() -> dict[str, object]:
    return {
        "health": health(),
        "meta": meta(),
        "access": access(),
        "routes": routes()["routes"],
        "systems": systems()["systems"],
        "logs": logs()["logs"],
        "hermes": hermes_health(),
        "clients": clients()["clients"],
        "workflow_packs": workflows()["workflow_packs"],
        "heartbeats": heartbeats()["heartbeats"],
        "providers": providers()["providers"],
        "readiness": maxx_wrapper_readiness(),
    }


@app.get("/v1/deploy")
def deploy() -> dict[str, object]:
    asset_stats = public_asset_stats()
    asset_weight = format_megabytes(asset_stats["bytes"])
    asset_count = asset_stats["count"]
    hermes = hermes_vendor.health()

    return {
        "mode": "local-stack",
        "status": "ready" if hermes.available else "degraded",
        "frontend_url": "http://127.0.0.1:3011",
        "dashboard_url": "http://127.0.0.1:3011/dashboard",
        "backend_url": "http://127.0.0.1:8010",
        "launcher": {
            "start": "start-local-stack.bat",
            "stop": "stop-local-stack.bat",
            "script": "scripts/start-local-stack.ps1",
        },
        "vercel": {
            "project_id": "prj_i5FPLcORy8KYstJSDM2SdguJDNVr",
            "project_name": "spy-scape-mustang-maxx",
            "team": "the-pauli-effect",
            "preview_url": "https://spy-scape-mustang-maxx-ncl58dyko-the-pauli-effect.vercel.app",
            "inspect_url": "https://vercel.com/the-pauli-effect/spy-scape-mustang-maxx/JCcG4EDm1re5NLAcWkyzPT9SsQ2f",
            "status": "preview-ready",
        },
        "steps": [
            "Run start-local-stack.bat from the repo root.",
            "Provision the demo tenant through /v1/clients/maxx-demo/provision.",
            "Submit a Lead Desk inquiry to /v1/lead-desk/tasks or the future site intake path.",
            "Review Hermes profile health and tenant heartbeats before broader orchestration work.",
        ],
        "blockers": [
            "App-level auth is deferred; keep the BFF private behind firewall, tunnel, or IP allowlist.",
            "Hermes provider credentials still need to be supplied for fully model-backed execution."
            if not hermes.provider_configured
            else "Role-based tenant access still needs to be wired on top of the live control plane.",
            "Final MAXX-owned art is still placeholder-driven.",
            f"The public asset library currently serves {asset_count} placeholder file(s) at about {asset_weight}.",
        ],
    }
