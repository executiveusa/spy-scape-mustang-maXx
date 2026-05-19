from __future__ import annotations

from dataclasses import asdict, dataclass
import re
from typing import Any
from uuid import uuid4

from . import maxx_runtime
from .lead_acquisition_drivers import (
    browser_worker_health,
    discover_web_research_prospects,
    lead_acquisition_sources,
    run_browser_worker_job,
    web_research_health,
)
from .models import (
    AcquisitionPolicy,
    ClientCreateRequest,
    ClientRecord,
    HeartbeatSummary,
    LeadAcquisitionJob,
    LeadAcquisitionJobCreateRequest,
    LeadDeskSubmission,
    LeadDeskTask,
    LeadQualification,
    PromotionResult,
    ProspectEvidence,
    ProspectInput,
    ProspectPromotionRequest,
    ProspectRecord,
    ProspectStatusUpdate,
    RuntimeNote,
    RuntimeRoute,
    RuntimeSystem,
    SmartSiteManifest,
    WorkflowPack,
    utc_now,
)
from .storage import (
    build_seed_log_messages,
    load_clients,
    load_heartbeats,
    load_tasks,
    load_workflow_packs,
    manifest_from_request,
    save_clients,
    save_heartbeats,
    load_acquisition_jobs,
    load_acquisition_policies,
    load_prospects,
    save_tasks,
    save_acquisition_jobs,
    save_acquisition_policies,
    save_prospects,
    default_acquisition_policy,
)


@dataclass
class QualificationResult:
    tier: str
    score: int
    confidence: str
    reasons: list[str]
    next_action: str


def list_clients() -> list[ClientRecord]:
    return [_reconcile_client_runtime(client) for client in load_clients()]


def create_client(request: ClientCreateRequest) -> ClientRecord:
    clients = load_clients()
    client_id = request.client_id.strip()
    if not client_id:
        raise ValueError("Client ID is required")

    if any(client.client_id == client_id for client in clients):
        raise FileExistsError(client_id)

    slug = _slug_for(client_id)
    if any(client.slug == slug for client in clients):
        raise FileExistsError(slug)

    timestamp = utc_now()
    manifest = manifest_from_request(request.model_copy(update={"client_id": client_id}), slug)
    client = ClientRecord(
        client_id=client_id,
        slug=slug,
        status="provisioning-required",
        manifest=manifest,
        hermes={
            "profile_name": slug,
            "profile_home": "",
            "workspace_path": "",
            "provider": maxx_runtime.DEFAULT_PROVIDER,
            "model": maxx_runtime.DEFAULT_MODEL,
            "status": "pending",
        },
        created_at=timestamp,
        updated_at=timestamp,
    )

    clients.append(client)
    save_clients(clients)
    return client


def list_workflow_packs() -> list[WorkflowPack]:
    return load_workflow_packs()


def list_heartbeats() -> list[HeartbeatSummary]:
    return load_heartbeats()


def acquisition_policy_for(client_id: str) -> AcquisitionPolicy:
    policies = load_acquisition_policies()
    for policy in policies:
        if policy.client_id == client_id:
            return policy

    policy = default_acquisition_policy(client_id)
    policies.append(policy)
    save_acquisition_policies(policies)
    return policy


def list_acquisition_sources() -> dict[str, Any]:
    return {
        "sources": [source.model_dump() for source in lead_acquisition_sources()],
        "policy_defaults": default_acquisition_policy().model_dump(),
        "product_boundary": (
            "Agent MAXX exposes Lead Acquisition as a lead operations workflow; "
            "private research and browser drivers are implementation details."
        ),
    }


def maxx_wrapper_readiness(client_id: str = "maxx-demo") -> dict[str, Any]:
    clients = list_clients()
    client = next((item for item in clients if item.client_id == client_id), None)
    runtime = maxx_runtime.health()
    workflows = load_workflow_packs()
    lead_desk_enabled = any(workflow.workflow_id == "lead-desk" and workflow.status == "live" for workflow in workflows)
    profile_ready = bool(client and client.hermes.status == "ready")
    profile_staged = bool(client and client.hermes.status in {"ready", "vendor-missing"})
    can_stage_today = bool(client and lead_desk_enabled and profile_staged)
    can_execute_model_today = bool(can_stage_today and runtime.execution_ready and profile_ready)

    blockers: list[str] = []
    if client is None:
        blockers.append(f"Create tenant {client_id}.")
    if client and not profile_staged:
        blockers.append(f"Provision Agent MAXX profile {client.hermes.profile_name}.")
    if not lead_desk_enabled:
        blockers.append("Enable the Lead Desk workflow pack.")
    if not runtime.available:
        blockers.append("Install or point MAXX_RUNTIME_VENDOR_PATH at the Agent MAXX runtime driver checkout.")
    if not runtime.provider_configured:
        blockers.append("Set MAXX_OPENROUTER_API_KEY or OPENROUTER_API_KEY for model-backed execution.")

    return {
        "product": "Agent MAXX",
        "runtime_wrapper": {
            "base_runtime": "Agent MAXX Runtime",
            "customized_as": "Agent MAXX Lead Desk employee",
            "tenant_model": "one Agent MAXX profile per client on one server",
            "first_use_case": "Lead Desk: capture, qualify, follow up, route, and summarize inquiries",
        },
        "client_id": client_id,
        "can_run_today": can_stage_today,
        "run_mode": "model-backed" if can_execute_model_today else "profile-backed-staging" if can_stage_today else "not-ready",
        "model_backed_execution_ready": can_execute_model_today,
        "profile_ready": profile_ready,
        "lead_desk_enabled": lead_desk_enabled,
        "maxx_runtime": runtime.model_dump(),
        "blockers": blockers,
        "today_path": [
            "Create or select a tenant.",
            "Provision its Agent MAXX profile.",
            "Submit one Lead Desk inquiry.",
            "Review the operator summary, qualification, routing target, and workspace task files.",
            "Add provider credentials when you need live model-backed Agent MAXX execution instead of staged operator review.",
        ],
    }


def quickstart_client(request: ClientCreateRequest | None = None) -> dict[str, Any]:
    client_id = request.client_id if request else "maxx-demo"
    try:
        client = get_client(client_id)
    except KeyError:
        if request is None:
            request = ClientCreateRequest(client_id=client_id, public_name="MAXX Demo Lead Desk")
        client = create_client(request)

    if client.manifest.client_id != client.client_id:
        raise ValueError(
            f"Manifest mismatch for {client.client_id}: manifest is tagged {client.manifest.client_id}"
        )

    provisioned = provision_client(client.client_id)
    return {
        "client": provisioned.model_dump(),
        "readiness": maxx_wrapper_readiness(provisioned.client_id),
        "next_steps": [
            "Open /lead-desk and submit a test inquiry.",
            "Use /v1/lead-desk/tasks to inspect created tasks.",
            "Use /v1/maxx/runtime/health to confirm whether execution is staged or model-backed.",
        ],
    }


def get_client(client_id: str) -> ClientRecord:
    for client in load_clients():
        if client.client_id == client_id:
            return _reconcile_client_runtime(client)
    raise KeyError(client_id)


def _reconcile_client_runtime(client: ClientRecord) -> ClientRecord:
    if maxx_runtime.vendor_available() or client.hermes.status != "ready":
        return client

    binding = maxx_runtime.provision_profile(client.slug)
    return client.model_copy(
        update={
            "status": "degraded",
            "hermes": binding,
        }
    )


def _slug_for(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or f"tenant-{uuid4().hex[:8]}"


def provision_client(client_id: str) -> ClientRecord:
    clients = load_clients()
    workflow_ids = [workflow.workflow_id for workflow in load_workflow_packs()]

    for index, client in enumerate(clients):
        if client.client_id != client_id:
            continue
        if client.manifest.client_id != client.client_id:
            raise ValueError(
                f"Manifest mismatch for {client.client_id}: manifest is tagged {client.manifest.client_id}"
            )

        binding = maxx_runtime.provision_profile(client.slug)
        maxx_runtime.write_manifest_context(client.manifest, workflow_ids, client.slug)

        client_status = "live" if binding.status == "ready" else "degraded"
        updated = client.model_copy(
            update={
                "status": client_status,
                "hermes": binding,
                "updated_at": utc_now(),
            }
        )
        clients[index] = updated
        save_clients(clients)
        return updated

    raise KeyError(client_id)


def manifest_for(client_id: str) -> SmartSiteManifest:
    return get_client(client_id).manifest


def qualification_for(submission: LeadDeskSubmission) -> QualificationResult:
    score = 40
    reasons: list[str] = []

    if submission.email:
        score += 10
        reasons.append("email provided for direct follow-up")
    if submission.phone:
        score += 10
        reasons.append("phone provided for high-touch routing")
    if submission.timeline and any(keyword in submission.timeline.lower() for keyword in ["now", "asap", "week", "urgent"]):
        score += 20
        reasons.append("timeline signals near-term buying intent")
    if submission.budget_band and any(keyword in submission.budget_band.lower() for keyword in ["5k", "10k", "premium", "retainer"]):
        score += 15
        reasons.append("budget suggests a qualified commercial opportunity")
    if len(submission.message.strip()) > 120:
        score += 10
        reasons.append("message includes enough context to triage accurately")

    if score >= 75:
        tier = "hot"
        next_action = "route-to-calendar"
        confidence = "high"
    elif score >= 55:
        tier = "warm"
        next_action = "operator-follow-up"
        confidence = "medium"
    else:
        tier = "cold"
        next_action = "nurture-sequence"
        confidence = "medium"

    return QualificationResult(
        tier=tier,
        score=min(score, 100),
        confidence=confidence,
        reasons=reasons or ["baseline inquiry captured for future follow-up"],
        next_action=next_action,
    )


def _route_target(manifest: SmartSiteManifest, tier: str) -> str:
    for rule in manifest.routing_rules:
        if tier in rule.when.lower():
            return rule.target
    return "operator-sequence"


def submit_lead(submission: LeadDeskSubmission) -> LeadDeskTask:
    client = get_client(submission.client_id)
    if client.hermes.status != "ready":
        client = provision_client(submission.client_id)

    qualification = qualification_for(submission)
    task_id = f"lead-{uuid4().hex[:10]}"
    route_target = _route_target(client.manifest, qualification.tier)
    created_at = utc_now()

    follow_up_actions = [
        f"Create operator summary for {submission.contact_name}.",
        f"Route {qualification.tier} lead toward {route_target}.",
        "Persist this inquiry inside the Agent MAXX workspace for tenant recall.",
    ]
    if qualification.next_action == "route-to-calendar":
        follow_up_actions.append("Offer priority booking path immediately.")
    elif qualification.next_action == "operator-follow-up":
        follow_up_actions.append("Generate a human-feeling follow-up within one business day.")
    else:
        follow_up_actions.append("Drop into nurture mode without losing context.")

    preview_payload = {
        "task_id": task_id,
        "client_id": client.client_id,
        "workflow_id": "lead-desk",
        "route_target": route_target,
        "submission": submission.model_dump(),
        "qualification": asdict(qualification),
        "follow_up_actions": follow_up_actions,
    }
    dispatch = maxx_runtime.execute_lead_task(client.hermes.profile_name, task_id, preview_payload)
    task_status = "completed" if dispatch.status == "completed" else "attention"
    if dispatch.status in {"provider-missing", "dispatch-deferred"}:
        task_status = "queued"
    elif dispatch.status in {"dispatch-empty", "dispatch-failed", "vendor-missing"}:
        task_status = "blocked"

    operator_summary = (
        f"{submission.contact_name} submitted a {qualification.tier} Lead Desk inquiry for "
        f"{submission.requested_service}; route via {route_target} and keep follow-up fast."
    )
    if dispatch.response_excerpt:
        operator_summary = f"{operator_summary} Agent MAXX response: {dispatch.response_excerpt[:220]}".strip()

    heartbeat = HeartbeatSummary(
        heartbeat_id=f"hb-{uuid4().hex[:8]}",
        client_id=client.client_id,
        workflow_id="lead-desk",
        status="watching",
        next_due_at=utc_now(),
        summary=f"{qualification.tier.title()} lead {task_status} on {route_target}",
        pending_task_ids=[task_id],
    )

    task = LeadDeskTask(
        task_id=task_id,
        client_id=client.client_id,
        status=task_status,
        assignee=f"{client.slug}:lead-desk",
        workflow_id="lead-desk",
        created_at=created_at,
        updated_at=created_at,
        submission=submission,
        qualification=LeadQualification(**asdict(qualification)),
        operator_summary=operator_summary,
        next_action=qualification.next_action,
        follow_up_actions=follow_up_actions,
        route_target=route_target,
        routing_target=route_target,
        hermes_profile=client.hermes.profile_name,
        workspace_files=[],
        hermes_dispatch=dispatch,
        heartbeat_summary=heartbeat,
    )

    task_payload = task.model_dump()
    task.workspace_files = maxx_runtime.write_lead_task(client.hermes.profile_name, task_id, task_payload)
    task_payload = task.model_dump()

    tasks = load_tasks()
    tasks.append(task_payload)
    save_tasks(tasks)

    heartbeats = load_heartbeats()
    heartbeats = [item for item in heartbeats if item.client_id != client.client_id or item.workflow_id != "lead-desk"]
    heartbeats.append(heartbeat)
    save_heartbeats(heartbeats)

    return task


def get_task(task_id: str) -> LeadDeskTask:
    for task in load_tasks():
        if task.get("task_id") == task_id:
            return LeadDeskTask.model_validate(_normalize_task_payload(task))
    raise KeyError(task_id)


def list_tasks(client_id: str | None = None) -> list[LeadDeskTask]:
    tasks = [LeadDeskTask.model_validate(_normalize_task_payload(task)) for task in load_tasks()]
    if client_id:
        tasks = [task for task in tasks if task.client_id == client_id]
    return sorted(tasks, key=lambda task: task.created_at, reverse=True)


def update_task_status(task_id: str, status: str, note: str | None = None) -> LeadDeskTask:
    tasks = load_tasks()
    updated_task: LeadDeskTask | None = None
    updated_tasks: list[dict[str, Any]] = []

    for task in tasks:
        normalized = _normalize_task_payload(task)
        if normalized.get("task_id") != task_id:
            updated_tasks.append(normalized)
            continue

        current = LeadDeskTask.model_validate(normalized)
        follow_up_actions = list(current.follow_up_actions)
        if note:
            follow_up_actions.append(f"Operator note: {note}")

        updated_task = current.model_copy(
            update={
                "status": status,
                "updated_at": utc_now(),
                "follow_up_actions": follow_up_actions,
            }
        )
        updated_tasks.append(updated_task.model_dump())

    if updated_task is None:
        raise KeyError(task_id)

    save_tasks(updated_tasks)
    heartbeat = _sync_heartbeat_for_task(updated_task)
    updated_task = updated_task.model_copy(update={"heartbeat_summary": heartbeat})
    save_tasks(
        [
            updated_task.model_dump() if task.get("task_id") == task_id else task
            for task in updated_tasks
        ]
    )
    return updated_task


def create_lead_acquisition_job(request: LeadAcquisitionJobCreateRequest) -> LeadAcquisitionJob:
    get_client(request.client_id)
    policy = acquisition_policy_for(request.client_id)
    if request.source not in policy.allowed_sources:
        raise PermissionError(f"Source is not enabled for this tenant: {request.source}")
    if request.source == "browser-worker" and not policy.browser_autonomy_enabled:
        raise PermissionError("Browser worker requires explicit tenant policy approval.")
    if request.target_url and not _target_allowed_by_policy(request.target_url, policy):
        raise PermissionError("Target URL is outside this tenant's acquisition allowlist.")

    now = utc_now()
    job = LeadAcquisitionJob(
        job_id=f"acq-{uuid4().hex[:10]}",
        client_id=request.client_id,
        source=request.source,
        status="running",
        query=request.query,
        target_url=request.target_url,
        requested_records=request.max_records,
        discovered_count=0,
        qualified_count=0,
        rejected_count=0,
        events=[
            f"Lead Acquisition job accepted for {request.source}.",
            "Operator approval is required before any outreach.",
        ],
        created_at=now,
        updated_at=now,
    )

    prospects = load_prospects()
    existing_keys = {_dedupe_key(prospect) for prospect in prospects}
    created: list[ProspectRecord] = []
    rejected = 0

    if request.source in {"manual", "authorized-contact-import"}:
        for prospect_input in request.prospects[: request.max_records]:
            prospect = _prospect_from_input(job, prospect_input)
            key = _dedupe_key(prospect)
            if key in existing_keys:
                rejected += 1
                job.events.append(f"Rejected duplicate prospect for {prospect.company}.")
                continue
            existing_keys.add(key)
            created.append(prospect)
    elif request.source == "web-research":
        health = web_research_health()
        if not health.enabled:
            job.events.append("Web research driver is not configured; no external discovery was attempted.")
            job.status = "degraded"
        else:
            try:
                web_prospects, events = discover_web_research_prospects(
                    request.query,
                    request.max_records,
                    request.target_url,
                )
                job.events.extend(events)
                for prospect_input in web_prospects[: request.max_records]:
                    prospect = _prospect_from_input(job, prospect_input)
                    key = _dedupe_key(prospect)
                    if key in existing_keys:
                        rejected += 1
                        job.events.append(f"Rejected duplicate prospect for {prospect.company}.")
                        continue
                    existing_keys.add(key)
                    created.append(prospect)
            except Exception as error:
                job.events.append(f"Web research driver failed safely: {error.__class__.__name__}.")
                job.status = "degraded"
    elif request.source == "browser-worker":
        health = browser_worker_health()
        if not health.enabled:
            job.events.append("Private browser worker is disabled by tenant policy.")
            job.status = "blocked"
        else:
            if not request.target_url:
                raise ValueError("Browser worker jobs require target_url.")
            try:
                browser_prospects, events = run_browser_worker_job(
                    request.query,
                    request.target_url,
                    request.max_records,
                )
                job.events.extend(events)
                for prospect_input in browser_prospects[: request.max_records]:
                    prospect = _prospect_from_input(job, prospect_input)
                    key = _dedupe_key(prospect)
                    if key in existing_keys:
                        rejected += 1
                        job.events.append(f"Rejected duplicate prospect for {prospect.company}.")
                        continue
                    existing_keys.add(key)
                    created.append(prospect)
            except Exception as error:
                job.events.append(f"Private browser worker failed safely: {error.__class__.__name__}.")
                job.status = "degraded"

    prospects.extend(created)
    if created:
        save_prospects(prospects)

    if job.status == "running":
        job.status = "completed"
    job = job.model_copy(
        update={
            "discovered_count": len(created),
            "qualified_count": sum(1 for prospect in created if prospect.status == "qualified"),
            "rejected_count": rejected,
            "updated_at": utc_now(),
        }
    )
    jobs = load_acquisition_jobs()
    jobs.append(job)
    save_acquisition_jobs(jobs)
    _sync_acquisition_heartbeat(job.client_id)
    return job


def get_lead_acquisition_job(job_id: str) -> LeadAcquisitionJob:
    for job in load_acquisition_jobs():
        if job.job_id == job_id:
            return job
    raise KeyError(job_id)


def list_lead_acquisition_jobs(client_id: str | None = None) -> list[LeadAcquisitionJob]:
    jobs = load_acquisition_jobs()
    if client_id:
        jobs = [job for job in jobs if job.client_id == client_id]
    return sorted(jobs, key=lambda job: job.created_at, reverse=True)


def list_prospects(
    client_id: str | None = None,
    status: str | None = None,
) -> list[ProspectRecord]:
    prospects = load_prospects()
    if client_id:
        prospects = [prospect for prospect in prospects if prospect.client_id == client_id]
    if status:
        prospects = [prospect for prospect in prospects if prospect.status == status]
    return sorted(prospects, key=lambda prospect: prospect.created_at, reverse=True)


def update_prospect_status(prospect_id: str, update: ProspectStatusUpdate) -> ProspectRecord:
    prospects = load_prospects()
    updated: ProspectRecord | None = None
    next_prospects: list[ProspectRecord] = []
    for prospect in prospects:
        if prospect.prospect_id != prospect_id:
            next_prospects.append(prospect)
            continue
        reasons = list(prospect.reasons)
        if update.note:
            reasons.append(f"Operator note: {update.note}")
        updated = prospect.model_copy(update={"status": update.status, "reasons": reasons, "updated_at": utc_now()})
        next_prospects.append(updated)

    if updated is None:
        raise KeyError(prospect_id)
    save_prospects(next_prospects)
    _sync_acquisition_heartbeat(updated.client_id)
    return updated


def promote_prospect_to_lead_desk(
    prospect_id: str,
    request: ProspectPromotionRequest | None = None,
) -> PromotionResult:
    prospects = load_prospects()
    prospect = next((item for item in prospects if item.prospect_id == prospect_id), None)
    if prospect is None:
        raise KeyError(prospect_id)
    if prospect.status == "promoted" and prospect.promoted_task_id:
        raise FileExistsError(prospect.promoted_task_id)
    if prospect.do_not_contact or prospect.opt_out or prospect.status == "rejected":
        raise PermissionError("This prospect is not eligible for promotion.")

    request = request or ProspectPromotionRequest()
    evidence_summary = "; ".join(
        f"{item.label}: {item.excerpt[:140]}" for item in prospect.evidence[:3]
    )
    submission = LeadDeskSubmission(
        client_id=prospect.client_id,
        contact_name=prospect.name or f"{prospect.company} contact",
        company=prospect.company,
        email=prospect.email,
        phone=prospect.phone,
        message=(
            "Outbound prospect promoted by Agent MAXX Lead Acquisition. "
            f"Score {prospect.score}/100 ({prospect.confidence}). "
            f"Reasons: {'; '.join(prospect.reasons)}. "
            f"Evidence: {evidence_summary or 'operator-provided prospect data'}. "
            f"Operator note: {request.note or 'review and decide next outreach step'}."
        ),
        requested_service="lead-acquisition",
        timeline="operator review",
        preferred_channel=request.preferred_channel,
        source="lead-acquisition",
    )
    task = submit_lead(submission)
    updated = prospect.model_copy(
        update={
            "status": "promoted",
            "promoted_task_id": task.task_id,
            "updated_at": utc_now(),
        }
    )
    save_prospects([updated if item.prospect_id == prospect_id else item for item in prospects])
    _sync_acquisition_heartbeat(updated.client_id)
    return PromotionResult(prospect=updated, lead_desk_task=task)


def _prospect_from_input(job: LeadAcquisitionJob, prospect_input: ProspectInput) -> ProspectRecord:
    score, confidence, reasons, status = _score_prospect(job.client_id, prospect_input)
    now = utc_now()
    source_url = prospect_input.source_url or job.target_url
    evidence = ProspectEvidence(
        evidence_id=f"ev-{uuid4().hex[:8]}",
        source=job.source,
        label="Operator-approved prospect evidence",
        url=source_url,
        excerpt=prospect_input.notes or f"{prospect_input.company} was submitted for Agent MAXX review.",
        captured_at=now,
    )
    do_not_contact = _contains_suppression_language(job.client_id, prospect_input)
    return ProspectRecord(
        prospect_id=f"prospect-{uuid4().hex[:10]}",
        client_id=job.client_id,
        job_id=job.job_id,
        status="rejected" if do_not_contact else status,
        source=job.source,
        name=prospect_input.name,
        title=prospect_input.title,
        company=prospect_input.company,
        email=prospect_input.email,
        email_status=prospect_input.email_status,
        phone=prospect_input.phone,
        linkedin_url=prospect_input.linkedin_url,
        location=prospect_input.location,
        seniority=prospect_input.seniority,
        department=prospect_input.department,
        organization_domain=prospect_input.organization_domain,
        score=score,
        confidence=confidence,
        reasons=reasons if not do_not_contact else [*reasons, "suppression language detected"],
        evidence=[evidence],
        do_not_contact=do_not_contact,
        created_at=now,
        updated_at=now,
    )


def _score_prospect(client_id: str, prospect_input: ProspectInput) -> tuple[int, str, list[str], str]:
    manifest = manifest_for(client_id)
    score = 35
    reasons: list[str] = ["prospect captured for operator review"]
    haystack = " ".join(
        value.lower()
        for value in [
            prospect_input.company,
            prospect_input.title or "",
            prospect_input.seniority or "",
            prospect_input.department or "",
            prospect_input.location or "",
            prospect_input.notes or "",
        ]
    )

    if prospect_input.email:
        score += 15
        reasons.append("email evidence present")
    if prospect_input.phone:
        score += 10
        reasons.append("phone evidence present")
    if prospect_input.organization_domain:
        score += 10
        reasons.append("organization domain present")
    if prospect_input.linkedin_url:
        score += 10
        reasons.append("profile URL present")
    if any(term in haystack for term in ["owner", "founder", "ceo", "president", "director", "vp"]):
        score += 15
        reasons.append("seniority suggests decision-maker access")
    if any(geo.lower() in haystack for geo in manifest.business.geography):
        score += 5
        reasons.append("geography matches tenant manifest")
    if any(offer.label.lower() in haystack or offer.code.lower() in haystack for offer in manifest.business.offers):
        score += 10
        reasons.append("offer fit appears in prospect context")

    score = min(score, 100)
    if score >= 75:
        return score, "high", reasons, "qualified"
    if score >= 55:
        return score, "medium", reasons, "enriched"
    return score, "low", reasons, "needs-review"


def _contains_suppression_language(client_id: str, prospect_input: ProspectInput) -> bool:
    policy = acquisition_policy_for(client_id)
    haystack = " ".join(
        value.lower()
        for value in [
            prospect_input.notes or "",
            prospect_input.email_status or "",
        ]
    )
    return any(term.lower() in haystack for term in policy.suppression_terms)


def _target_allowed_by_policy(target_url: str, policy: AcquisitionPolicy) -> bool:
    if not policy.allowed_domains:
        return True
    from urllib.parse import urlparse

    hostname = (urlparse(target_url).hostname or "").lower().removeprefix("www.")
    return any(hostname == domain.lower() or hostname.endswith(f".{domain.lower()}") for domain in policy.allowed_domains)


def _dedupe_key(prospect: ProspectRecord) -> str:
    if prospect.email:
        return f"email:{prospect.email.lower()}"
    if prospect.linkedin_url:
        return f"linkedin:{prospect.linkedin_url.lower().rstrip('/')}"
    if prospect.organization_domain and prospect.name:
        return f"domain-name:{prospect.organization_domain.lower()}:{prospect.name.lower()}"
    return f"company:{prospect.company.lower()}:{prospect.title or ''}:{prospect.location or ''}"


def _sync_acquisition_heartbeat(client_id: str) -> None:
    prospects = list_prospects(client_id=client_id)
    pending_ids = [
        prospect.prospect_id
        for prospect in prospects
        if prospect.status in {"qualified", "needs-review", "enriched"}
    ]
    heartbeat = HeartbeatSummary(
        heartbeat_id=f"hb-acq-{client_id}",
        client_id=client_id,
        workflow_id="lead-acquisition",
        status="watching" if pending_ids else "clear",
        next_due_at=utc_now(),
        summary=f"{len(pending_ids)} prospect(s) awaiting operator review",
        pending_task_ids=pending_ids[:25],
    )
    heartbeats = [
        item
        for item in load_heartbeats()
        if item.client_id != client_id or item.workflow_id != "lead-acquisition"
    ]
    heartbeats.append(heartbeat)
    save_heartbeats(heartbeats)


def _sync_heartbeat_for_task(task: LeadDeskTask) -> HeartbeatSummary:
    heartbeats = load_heartbeats()
    remaining_task_ids = [
        item.task_id
        for item in list_tasks(client_id=task.client_id)
        if item.workflow_id == task.workflow_id and item.status not in {"completed"}
    ]

    next_status = "clear" if not remaining_task_ids else "watching"
    summary = (
        f"Lead Desk clear after {task.task_id} moved to completed"
        if next_status == "clear"
        else f"{len(remaining_task_ids)} Lead Desk task(s) still active after {task.task_id} moved to {task.status}"
    )

    heartbeat = HeartbeatSummary(
        heartbeat_id=f"hb-{uuid4().hex[:8]}",
        client_id=task.client_id,
        workflow_id=task.workflow_id,
        status=next_status,
        next_due_at=utc_now(),
        summary=summary,
        pending_task_ids=remaining_task_ids,
    )
    heartbeats = [item for item in heartbeats if item.client_id != task.client_id or item.workflow_id != task.workflow_id]
    heartbeats.append(heartbeat)
    save_heartbeats(heartbeats)
    return heartbeat


def _normalize_task_payload(task: dict[str, Any]) -> dict[str, Any]:
    task = dict(task)
    if "hermes_dispatch" not in task:
        task["hermes_dispatch"] = {
            "status": "legacy-unknown",
            "provider": maxx_runtime.DEFAULT_PROVIDER,
            "model": maxx_runtime.DEFAULT_MODEL,
            "configured": maxx_runtime.provider_configured(),
            "notes": ["This task was created before Agent MAXX dispatch metadata was added."],
            "response_excerpt": None,
        }

    qualification = task.get("qualification") if isinstance(task.get("qualification"), dict) else {}
    task.setdefault("next_action", qualification.get("next_action", "operator-follow-up"))
    task.setdefault("routing_target", task.get("route_target", "operator-sequence"))
    task.setdefault("route_target", task.get("routing_target", "operator-sequence"))
    task.setdefault("heartbeat_summary", _heartbeat_for_task_payload(task).model_dump())
    return task


def _heartbeat_for_task_payload(task: dict[str, Any]) -> HeartbeatSummary:
    task_id = str(task.get("task_id", ""))
    client_id = str(task.get("client_id", ""))
    workflow_id = str(task.get("workflow_id", "lead-desk"))

    for heartbeat in load_heartbeats():
        if (
            heartbeat.client_id == client_id
            and heartbeat.workflow_id == workflow_id
            and task_id in heartbeat.pending_task_ids
        ):
            return heartbeat

    return HeartbeatSummary(
        heartbeat_id=f"hb-derived-{task_id or 'unknown'}",
        client_id=client_id,
        workflow_id=workflow_id,
        status="watching" if task.get("status") != "completed" else "clear",
        next_due_at=str(task.get("updated_at") or utc_now()),
        summary=f"Lead Desk task {task_id or 'unknown'} is {task.get('status', 'queued')}",
        pending_task_ids=[] if task.get("status") == "completed" else [task_id],
    )


def runtime_routes() -> list[RuntimeRoute]:
    return [
        RuntimeRoute(path="/", label="Homepage", status="live"),
        RuntimeRoute(path="/login", label="Login Portal", status="live"),
        RuntimeRoute(path="/dashboard", label="Command Deck", status="live"),
        RuntimeRoute(path="/deploy", label="Deployment Console", status="live"),
        RuntimeRoute(path="/tenants", label="Tenant Control", status="live"),
        RuntimeRoute(path="/lead-desk", label="Lead Desk Console", status="live"),
        RuntimeRoute(path="/lead-acquisition", label="Lead Acquisition Console", status="live"),
        RuntimeRoute(path="/assets", label="Asset Pipeline", status="live"),
        RuntimeRoute(path="/api/tenants", label="Tenant Registry API", status="live"),
        RuntimeRoute(path="/api/lead-desk", label="Lead Desk Intake API", status="live"),
        RuntimeRoute(path="/api/lead-acquisition", label="Lead Acquisition API", status="live"),
        RuntimeRoute(path="/api/runtime", label="Runtime Proxy API", status="live"),
        RuntimeRoute(path="/api/health", label="Frontend Health API", status="live"),
        RuntimeRoute(path="/v1/maxx/runtime/health", label="Agent MAXX Runtime Health", status="live"),
        RuntimeRoute(path="/v1/maxx/web-research/health", label="MAXX Web Research Health", status="live"),
        RuntimeRoute(path="/v1/maxx/browser/health", label="MAXX Browser Worker Health", status="live"),
        RuntimeRoute(path="/v1/maxx/runtime/profiles", label="Agent MAXX Profile Registry", status="live"),
        RuntimeRoute(path="/v1/clients", label="Tenant Registry", status="live"),
        RuntimeRoute(path="/v1/lead-desk/tasks", label="Lead Desk Task API", status="live"),
        RuntimeRoute(path="/v1/lead-acquisition/jobs", label="Lead Acquisition Job API", status="live"),
    ]


def runtime_systems() -> list[RuntimeSystem]:
    runtime = maxx_runtime.health()
    clients = load_clients()
    workflows = load_workflow_packs()
    heartbeats = load_heartbeats()
    prospects = load_prospects()
    source_health = lead_acquisition_sources()

    return [
        RuntimeSystem(
            name="Frontend Shell",
            status="online",
            latency="12ms",
            detail="Next.js standalone frontend remains the public shell for the MAXX smart-site platform.",
        ),
        RuntimeSystem(
            name="Access Layer",
            status="warning",
            latency="manual",
            detail="Login route is backend-driven now, but production auth and session enforcement are still pending.",
        ),
        RuntimeSystem(
            name="MAXX BFF",
            status="online",
            latency="10ms",
            detail="FastAPI is now acting as the tenant-aware MAXX control plane instead of a mock-only scaffold.",
        ),
        RuntimeSystem(
            name="Agent MAXX Core",
            status="online" if runtime.available else "warning",
            latency=runtime.mode if runtime.available else "degraded",
            detail=(
                f"Agent MAXX runtime status: {runtime.status}. "
                f"{runtime.profiles_total} profile home(s) visible under the Wave 1 one-server tenancy model."
            ),
        ),
        RuntimeSystem(
            name="Lead Desk Engine",
            status="online" if workflows else "warning",
            latency=f"{len(load_tasks())} tasks",
            detail=(
                f"{len(workflows)} workflow pack(s) enabled, "
                f"{len(heartbeats)} active heartbeat summary(ies), and tenant-aware lead triage ready."
            ),
        ),
        RuntimeSystem(
            name="Lead Acquisition Engine",
            status="online" if any(source.enabled for source in source_health) else "warning",
            latency=f"{len(prospects)} prospects",
            detail=(
                "Agent MAXX can normalize owner-approved prospects, score fit, dedupe records, "
                "and promote qualified opportunities into Lead Desk."
            ),
        ),
        RuntimeSystem(
            name="Memory Store",
            status="online" if runtime.available else "warning",
            latency="profile-home",
            detail=(
                "Agent MAXX profile homes are provisioned for tenant memory and workspace context, "
                "even though richer provider-backed recall still depends on full runtime setup."
            ),
        ),
        RuntimeSystem(
            name="Provider Router",
            status="online" if runtime.provider_configured else "warning",
            latency=runtime.provider,
            detail=(
                f"Configured for {runtime.model}. "
                "Model-backed Lead Desk execution is ready."
                if runtime.provider_configured
                else "OpenRouter credentials are still missing, so Agent MAXX can only stage profile-backed tasks."
            ),
        ),
        RuntimeSystem(
            name="Tenant Registry",
            status="online",
            latency=f"{len(clients)} clients",
            detail="Client manifests, avatar metadata, and workflow bindings are stored through the MAXX control plane.",
        ),
    ]


def runtime_logs() -> list[RuntimeNote]:
    clients = load_clients()
    tasks = list_tasks()
    prospects = list_prospects()
    seed_logs = build_seed_log_messages(clients)
    task_logs = [
        RuntimeNote(
            id=task.task_id,
            timestamp=task.created_at[11:19],
            type="success" if task.status in {"triaged", "completed"} else "warning",
            message=task.operator_summary,
        )
        for task in tasks[:5]
    ]
    prospect_logs = [
        RuntimeNote(
            id=prospect.prospect_id,
            timestamp=prospect.created_at[11:19],
            type="success" if prospect.status in {"qualified", "promoted"} else "info",
            message=f"Lead Acquisition prospect {prospect.company} is {prospect.status} at score {prospect.score}.",
        )
        for prospect in prospects[:5]
    ]
    return task_logs + prospect_logs + seed_logs
