from __future__ import annotations

import json
from pathlib import Path

from fastapi import Body, Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from . import maxx_runtime
from .auth import require_bff_secret, shared_secret_configured
from .settings import allowed_origins, production_config_warnings
from .control_plane import (
    create_lead_acquisition_job,
    create_client,
    get_client,
    get_lead_acquisition_job,
    get_task,
    list_acquisition_sources,
    list_lead_acquisition_jobs,
    list_clients,
    list_heartbeats,
    list_prospects,
    list_tasks,
    list_workflow_packs,
    manifest_for,
    maxx_wrapper_readiness,
    promote_prospect_to_lead_desk,
    provision_client,
    quickstart_client,
    runtime_logs,
    runtime_routes,
    runtime_systems,
    submit_lead,
    update_prospect_status,
    update_task_status,
)
from .lead_acquisition_drivers import browser_worker_health, web_research_health
from .models import (
    ClientCreateRequest,
    LeadAcquisitionJobCreateRequest,
    LeadDeskStatusUpdate,
    LeadDeskSubmission,
    ProspectPromotionRequest,
    ProspectStatusUpdate,
)

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


PUBLIC_KEY_ALIASES = {
    "hermes": "maxx_runtime",
    "hermes_profile": "maxx_profile",
    "hermes_dispatch": "maxx_dispatch",
}


def public_payload(value: object) -> object:
    if isinstance(value, list):
        return [public_payload(item) for item in value]
    if isinstance(value, dict):
        return {
            PUBLIC_KEY_ALIASES.get(str(key), str(key)): public_payload(item)
            for key, item in value.items()
        }
    return value


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
    runtime = maxx_runtime.health()
    warnings = production_config_warnings()
    return {
        "status": "ok" if runtime.available and not warnings else "degraded",
        "service": "agent-maxx-bff",
        "runtime": runtime.status,
    }


Protected = Depends(require_bff_secret)


@app.get("/v1/maxx/runtime/health", dependencies=[Protected])
def maxx_runtime_health() -> dict[str, object]:
    return maxx_runtime.health().model_dump()


@app.get("/v1/maxx/runtime/profiles", dependencies=[Protected])
def maxx_runtime_profiles() -> dict[str, object]:
    return {
        "profiles": maxx_runtime.list_profiles(),
        "runtime_home": str(maxx_runtime.runtime_home()),
    }


@app.get("/v1/maxx/runtime/providers", dependencies=[Protected])
def maxx_runtime_providers() -> dict[str, object]:
    runtime = maxx_runtime.health()
    return {
        "providers": [
            {
                "provider": runtime.provider,
                "model": runtime.model,
                "configured": runtime.provider_configured,
                "execution_ready": runtime.execution_ready,
            }
        ]
    }


@app.get("/v1/maxx/browser/health", dependencies=[Protected])
def maxx_browser_health() -> dict[str, object]:
    return browser_worker_health().model_dump()


@app.get("/v1/maxx/web-research/health", dependencies=[Protected])
def maxx_web_research_health() -> dict[str, object]:
    return web_research_health().model_dump()


@app.get("/v1/hermes/health", dependencies=[Protected])
def hermes_health_compatibility_alias() -> dict[str, object]:
    return maxx_runtime_health()


@app.get("/v1/hermes/profiles", dependencies=[Protected])
def hermes_profiles_compatibility_alias() -> dict[str, object]:
    return maxx_runtime_profiles()


@app.get("/v1/providers", dependencies=[Protected])
def providers() -> dict[str, object]:
    return maxx_runtime_providers()


@app.get("/v1/maxx/readiness", dependencies=[Protected])
def maxx_readiness(client_id: str = Query(default="maxx-demo")) -> dict[str, object]:
    return maxx_wrapper_readiness(client_id)


@app.post("/v1/maxx/quickstart", dependencies=[Protected])
def maxx_quickstart(request: ClientCreateRequest | None = Body(default=None)) -> dict[str, object]:
    try:
        return quickstart_client(request)
    except FileExistsError as error:
        raise HTTPException(status_code=409, detail=f"Client already exists: {error.args[0]}") from error
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error


@app.get("/v1/clients", dependencies=[Protected])
def clients() -> dict[str, object]:
    return public_payload({"clients": [client.model_dump() for client in list_clients()]})  # type: ignore[return-value]


@app.post("/v1/clients", dependencies=[Protected])
def create_tenant(request: ClientCreateRequest) -> dict[str, object]:
    try:
        client = create_client(request)
    except FileExistsError as error:
        raise HTTPException(status_code=409, detail=f"Client already exists: {error.args[0]}") from error
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    return public_payload(client.model_dump())  # type: ignore[return-value]


@app.post("/v1/clients/{client_id}/provision", dependencies=[Protected])
def provision(client_id: str) -> dict[str, object]:
    try:
        client = provision_client(client_id)
    except KeyError as error:
        raise HTTPException(status_code=404, detail=f"Unknown client: {error.args[0]}") from error
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    return public_payload(client.model_dump())  # type: ignore[return-value]


@app.get("/v1/clients/{client_id}/manifest", dependencies=[Protected])
def client_manifest(client_id: str) -> dict[str, object]:
    try:
        return manifest_for(client_id).model_dump()
    except KeyError as error:
        raise HTTPException(status_code=404, detail=f"Unknown client: {error.args[0]}") from error


@app.get("/v1/workflows", dependencies=[Protected])
def workflows() -> dict[str, object]:
    return {"workflow_packs": [workflow.model_dump() for workflow in list_workflow_packs()]}


@app.get("/v1/heartbeats", dependencies=[Protected])
def heartbeats() -> dict[str, object]:
    return {"heartbeats": [heartbeat.model_dump() for heartbeat in list_heartbeats()]}


@app.get("/v1/lead-acquisition/sources", dependencies=[Protected])
def lead_acquisition_sources_route() -> dict[str, object]:
    return list_acquisition_sources()


@app.post("/v1/lead-acquisition/jobs", dependencies=[Protected])
def create_acquisition_job(request: LeadAcquisitionJobCreateRequest) -> dict[str, object]:
    try:
        job = create_lead_acquisition_job(request)
    except KeyError as error:
        raise HTTPException(status_code=404, detail=f"Unknown client: {error.args[0]}") from error
    except PermissionError as error:
        raise HTTPException(status_code=403, detail=str(error)) from error
    return job.model_dump()


@app.get("/v1/lead-acquisition/jobs", dependencies=[Protected])
def acquisition_jobs(client_id: str | None = Query(default=None)) -> dict[str, object]:
    return {"jobs": [job.model_dump() for job in list_lead_acquisition_jobs(client_id=client_id)]}


@app.get("/v1/lead-acquisition/jobs/{job_id}", dependencies=[Protected])
def acquisition_job(job_id: str) -> dict[str, object]:
    try:
        return get_lead_acquisition_job(job_id).model_dump()
    except KeyError as error:
        raise HTTPException(status_code=404, detail=f"Unknown job: {error.args[0]}") from error


@app.get("/v1/lead-acquisition/prospects", dependencies=[Protected])
def acquisition_prospects(
    client_id: str | None = Query(default=None),
    status: str | None = Query(default=None),
) -> dict[str, object]:
    return {"prospects": [prospect.model_dump() for prospect in list_prospects(client_id=client_id, status=status)]}


@app.patch("/v1/lead-acquisition/prospects/{prospect_id}", dependencies=[Protected])
def patch_acquisition_prospect(prospect_id: str, update: ProspectStatusUpdate) -> dict[str, object]:
    try:
        return update_prospect_status(prospect_id, update).model_dump()
    except KeyError as error:
        raise HTTPException(status_code=404, detail=f"Unknown prospect: {error.args[0]}") from error


@app.post("/v1/lead-acquisition/prospects/{prospect_id}/promote", dependencies=[Protected])
def promote_acquisition_prospect(
    prospect_id: str,
    request: ProspectPromotionRequest | None = Body(default=None),
) -> dict[str, object]:
    try:
        result = promote_prospect_to_lead_desk(prospect_id, request)
    except KeyError as error:
        raise HTTPException(status_code=404, detail=f"Unknown prospect: {error.args[0]}") from error
    except FileExistsError as error:
        raise HTTPException(status_code=409, detail=f"Prospect already promoted to task: {error.args[0]}") from error
    except PermissionError as error:
        raise HTTPException(status_code=403, detail=str(error)) from error
    return public_payload(result.model_dump())  # type: ignore[return-value]


@app.post("/v1/lead-desk/tasks", dependencies=[Protected])
def create_lead_desk_task(submission: LeadDeskSubmission) -> dict[str, object]:
    try:
        task = submit_lead(submission)
    except KeyError as error:
        raise HTTPException(status_code=404, detail=f"Unknown client: {error.args[0]}") from error
    return public_payload(task.model_dump())  # type: ignore[return-value]


@app.get("/v1/lead-desk/tasks", dependencies=[Protected])
def lead_desk_tasks(client_id: str | None = Query(default=None)) -> dict[str, object]:
    return public_payload({"tasks": [task.model_dump() for task in list_tasks(client_id=client_id)]})  # type: ignore[return-value]


@app.get("/v1/lead-desk/tasks/{task_id}", dependencies=[Protected])
def lead_desk_task(task_id: str) -> dict[str, object]:
    try:
        return public_payload(get_task(task_id).model_dump())  # type: ignore[return-value]
    except KeyError as error:
        raise HTTPException(status_code=404, detail=f"Unknown task: {error.args[0]}") from error


@app.patch("/v1/lead-desk/tasks/{task_id}", dependencies=[Protected])
def patch_lead_desk_task(task_id: str, update: LeadDeskStatusUpdate) -> dict[str, object]:
    try:
        task = update_task_status(task_id, update.status, update.note)
    except KeyError as error:
        raise HTTPException(status_code=404, detail=f"Unknown task: {error.args[0]}") from error
    return public_payload(task.model_dump())  # type: ignore[return-value]


@app.get("/v1/meta", dependencies=[Protected])
def meta() -> dict[str, object]:
    runtime = maxx_runtime.health()
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
        "shared_secret_required": shared_secret_configured(),
        "allowed_origins": allowed_origins(),
        "runtime_mode": runtime.mode,
        "provider": runtime.provider,
        "model": runtime.model,
        "provider_configured": runtime.provider_configured,
        "workflow_packs": workflows_count,
        "clients": clients_count,
        "notes": [
            "Agent MAXX is the branded runtime and control harness for tenant-scoped smart-site operations.",
            "MAXX now uses a tenant-aware control plane instead of scaffold-only runtime placeholders.",
            "Lead Desk is the first real workflow pack; broader orchestration remains a Wave 2 seam.",
            *production_config_warnings(),
        ],
    }


@app.get("/v1/access", dependencies=[Protected])
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
            "MAXX_BFF_SHARED_SECRET",
            "MAXX_ALLOWED_ORIGINS",
            "MAXX_ENV",
            "MAXX_ALLOW_PUBLIC_BFF",
            "MAXX_OPENROUTER_API_KEY",
        ],
    }


@app.get("/v1/systems", dependencies=[Protected])
def systems() -> dict[str, object]:
    return {"systems": [system.model_dump() for system in runtime_systems()]}


@app.get("/v1/logs", dependencies=[Protected])
def logs() -> dict[str, object]:
    return {"logs": [log.model_dump() for log in runtime_logs()]}


@app.get("/v1/routes", dependencies=[Protected])
def routes() -> dict[str, object]:
    return {"routes": [route.model_dump() for route in runtime_routes()]}


@app.get("/v1/runtime", dependencies=[Protected])
def runtime() -> dict[str, object]:
    return {
        "health": health(),
        "meta": meta(),
        "access": access(),
        "routes": routes()["routes"],
        "systems": systems()["systems"],
        "logs": logs()["logs"],
        "maxx_runtime": maxx_runtime_health(),
        "clients": clients()["clients"],
        "workflow_packs": workflows()["workflow_packs"],
        "heartbeats": heartbeats()["heartbeats"],
        "providers": providers()["providers"],
        "readiness": maxx_wrapper_readiness(),
    }


@app.get("/v1/deploy", dependencies=[Protected])
def deploy() -> dict[str, object]:
    asset_stats = public_asset_stats()
    asset_weight = format_megabytes(asset_stats["bytes"])
    asset_count = asset_stats["count"]
    runtime = maxx_runtime.health()

    return {
        "mode": "local-stack",
        "status": "ready" if runtime.available else "degraded",
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
            "Review Agent MAXX profile health and tenant heartbeats before broader orchestration work.",
        ],
        "blockers": [
            "App-level auth is deferred; keep the BFF private behind firewall, tunnel, or IP allowlist.",
            "Agent MAXX provider credentials still need to be supplied for fully model-backed execution."
            if not runtime.provider_configured
            else "Role-based tenant access still needs to be wired on top of the live control plane.",
            "Final MAXX-owned art is still placeholder-driven.",
            f"The public asset library currently serves {asset_count} placeholder file(s) at about {asset_weight}.",
        ],
    }
