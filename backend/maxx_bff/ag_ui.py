from __future__ import annotations

from typing import Any

from . import maxx_runtime
from .models import HeartbeatSummary, LeadAcquisitionJob, LeadDeskTask, ProspectRecord, utc_now
from .storage import load_acquisition_jobs, load_heartbeats, load_prospects
from .control_plane import list_tasks


AG_UI_PROTOCOL_VERSION = "0.2"
AG_UI_TRANSPORT = "json-polling-now-sse-later"


def _event(
    event_type: str,
    event_id: str,
    run_id: str,
    payload: dict[str, Any],
) -> dict[str, Any]:
    return {
        "type": event_type,
        "event_id": event_id,
        "run_id": run_id,
        "timestamp": utc_now(),
        "payload": payload,
    }


def _task_event(task: LeadDeskTask) -> dict[str, Any]:
    return _event(
        "MAXX_TASK_STATE",
        f"task:{task.task_id}:{task.updated_at}",
        f"lead-desk:{task.client_id}",
        {
            "client_id": task.client_id,
            "workflow_id": task.workflow_id,
            "task_id": task.task_id,
            "status": task.status,
            "assignee": task.assignee,
            "operator_summary": task.operator_summary,
            "next_action": task.next_action,
            "routing_target": task.routing_target,
            "qualification": task.qualification.model_dump(),
            "dispatch": task.hermes_dispatch.model_dump(),
        },
    )


def _prospect_event(prospect: ProspectRecord) -> dict[str, Any]:
    return _event(
        "MAXX_PROSPECT_STATE",
        f"prospect:{prospect.prospect_id}:{prospect.updated_at}",
        f"lead-acquisition:{prospect.client_id}",
        {
            "client_id": prospect.client_id,
            "workflow_id": "lead-acquisition",
            "prospect_id": prospect.prospect_id,
            "job_id": prospect.job_id,
            "status": prospect.status,
            "source": prospect.source,
            "company": prospect.company,
            "name": prospect.name,
            "score": prospect.score,
            "confidence": prospect.confidence,
            "reasons": prospect.reasons,
            "evidence": [item.model_dump() for item in prospect.evidence],
            "promoted_task_id": prospect.promoted_task_id,
        },
    )


def _job_event(job: LeadAcquisitionJob) -> dict[str, Any]:
    return _event(
        "MAXX_JOB_STATE",
        f"job:{job.job_id}:{job.updated_at}",
        f"lead-acquisition:{job.client_id}",
        {
            "client_id": job.client_id,
            "workflow_id": "lead-acquisition",
            "job_id": job.job_id,
            "source": job.source,
            "status": job.status,
            "query": job.query,
            "target_url": job.target_url,
            "discovered_count": job.discovered_count,
            "qualified_count": job.qualified_count,
            "rejected_count": job.rejected_count,
            "events": job.events,
        },
    )


def _heartbeat_event(heartbeat: HeartbeatSummary) -> dict[str, Any]:
    return _event(
        "MAXX_HEARTBEAT_STATE",
        f"heartbeat:{heartbeat.heartbeat_id}:{heartbeat.next_due_at}",
        f"{heartbeat.workflow_id}:{heartbeat.client_id}",
        {
            "client_id": heartbeat.client_id,
            "workflow_id": heartbeat.workflow_id,
            "heartbeat_id": heartbeat.heartbeat_id,
            "status": heartbeat.status,
            "summary": heartbeat.summary,
            "next_due_at": heartbeat.next_due_at,
            "pending_task_ids": heartbeat.pending_task_ids,
        },
    )


def _runtime_event(client_id: str) -> dict[str, Any]:
    runtime = maxx_runtime.health()
    return _event(
        "MAXX_RUNTIME_STATE",
        f"runtime:{client_id}:{runtime.status}:{runtime.profiles_total}",
        f"runtime:{client_id}",
        {
            "client_id": client_id,
            "runtime": runtime.model_dump(),
            "product_boundary": (
                "AG-UI carries Agent MAXX state into operator screens; private drivers remain implementation details."
            ),
        },
    )


def ag_ui_event_feed(client_id: str = "maxx-demo", limit: int = 50) -> dict[str, Any]:
    tasks = [task for task in list_tasks(client_id=client_id)]
    prospects = [prospect for prospect in load_prospects() if prospect.client_id == client_id]
    jobs = [job for job in load_acquisition_jobs() if job.client_id == client_id]
    heartbeats = [heartbeat for heartbeat in load_heartbeats() if heartbeat.client_id == client_id]

    events: list[dict[str, Any]] = [_runtime_event(client_id)]
    events.extend(_task_event(task) for task in tasks)
    events.extend(_prospect_event(prospect) for prospect in prospects)
    events.extend(_job_event(job) for job in jobs)
    events.extend(_heartbeat_event(heartbeat) for heartbeat in heartbeats)

    return {
        "protocol": "ag-ui",
        "protocol_version": AG_UI_PROTOCOL_VERSION,
        "transport": AG_UI_TRANSPORT,
        "client_id": client_id,
        "events": events[:limit],
        "next_step": "Replace polling with SSE/WebSocket transport when the operator console needs live streaming.",
    }
