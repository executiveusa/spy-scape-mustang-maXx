from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, Field


SystemStatus = Literal["online", "warning", "offline"]
LeadQualificationTier = Literal["hot", "warm", "cold"]
LeadTaskStatus = Literal["triaged", "queued", "attention", "follow-up", "completed", "blocked"]


class ClientTheme(BaseModel):
    primary: str
    accent: str
    shell: str


class ClientAvatar(BaseModel):
    avatar_id: str
    display_name: str
    voice_profile: str
    image_set: str
    brand_theme: str
    industry_preset: str


class ServiceOffer(BaseModel):
    code: str
    label: str
    outcome: str


class IntakeChannel(BaseModel):
    type: str
    label: str
    destination: str


class RoutingRule(BaseModel):
    when: str
    action: str
    target: str


class BusinessIdentity(BaseModel):
    legal_name: str
    public_name: str
    industry: str
    timezone: str
    geography: list[str]
    summary: str
    offers: list[ServiceOffer]


class SmartSiteManifest(BaseModel):
    client_id: str
    business: BusinessIdentity
    intake_channels: list[IntakeChannel]
    routing_rules: list[RoutingRule]
    enabled_workflows: list[str]
    avatar: ClientAvatar
    theme: ClientTheme
    operator_notes: list[str]


class MaxxRuntimeProfileBinding(BaseModel):
    profile_name: str
    profile_home: str
    workspace_path: str
    provider: str = "openrouter"
    model: str = "openrouter/owl-alpha"
    status: str = "ready"


class ClientRecord(BaseModel):
    client_id: str
    slug: str
    status: str
    manifest: SmartSiteManifest
    hermes: MaxxRuntimeProfileBinding
    created_at: str
    updated_at: str


class ClientCreateRequest(BaseModel):
    client_id: str = Field(min_length=3)
    public_name: str = Field(min_length=2)
    legal_name: str | None = None
    industry: str = Field(default="Local Services")
    timezone: str = Field(default="America/Mexico_City")
    geography: list[str] = Field(default_factory=list)
    summary: str = Field(
        default="Client smart site tenant for the Agent MAXX Lead Desk employee."
    )
    primary_offer: str = Field(default="Lead Desk Automation")
    operator_email: str | None = None
    theme_primary: str = Field(default="#46d5ff")
    theme_accent: str = Field(default="#f4d35e")
    theme_shell: str = Field(default="#050810")


class WorkflowPack(BaseModel):
    workflow_id: str
    label: str
    capability: str
    outcome_targets: list[str]
    status: str
    seams: list[str]


class LeadDeskSubmission(BaseModel):
    client_id: str
    contact_name: str = Field(min_length=1)
    company: str | None = None
    email: str | None = None
    phone: str | None = None
    message: str = Field(min_length=10)
    requested_service: str = Field(default="general-inquiry")
    budget_band: str | None = None
    timeline: str | None = None
    preferred_channel: str = Field(default="email")
    source: str = Field(default="site")


class LeadQualification(BaseModel):
    tier: LeadQualificationTier
    score: int
    confidence: str
    reasons: list[str]
    next_action: str


class MaxxRuntimeDispatchResult(BaseModel):
    status: str
    provider: str
    model: str
    configured: bool
    notes: list[str]
    response_excerpt: str | None = None


class HeartbeatSummary(BaseModel):
    heartbeat_id: str
    client_id: str
    workflow_id: str
    status: str
    next_due_at: str
    summary: str
    pending_task_ids: list[str]


class LeadDeskTask(BaseModel):
    task_id: str
    client_id: str
    status: LeadTaskStatus
    assignee: str
    workflow_id: str
    created_at: str
    updated_at: str
    submission: LeadDeskSubmission
    qualification: LeadQualification
    operator_summary: str
    next_action: str
    follow_up_actions: list[str]
    route_target: str
    routing_target: str
    hermes_profile: str
    workspace_files: list[str]
    hermes_dispatch: MaxxRuntimeDispatchResult
    heartbeat_summary: HeartbeatSummary


class LeadDeskStatusUpdate(BaseModel):
    status: LeadTaskStatus
    note: str | None = None


class RuntimeNote(BaseModel):
    id: str
    timestamp: str
    type: Literal["success", "warning", "error", "info"]
    message: str


class RuntimeSystem(BaseModel):
    name: str
    status: SystemStatus
    latency: str
    detail: str


class RuntimeRoute(BaseModel):
    path: str
    label: str
    status: Literal["live", "planned", "offline"]


class MaxxRuntimeHealth(BaseModel):
    available: bool
    status: str
    mode: str
    vendor_path: str
    runtime_home: str
    provider: str
    model: str
    provider_configured: bool
    execution_ready: bool
    profiles_total: int
    notes: list[str]


HermesProfileBinding = MaxxRuntimeProfileBinding
HermesDispatchResult = MaxxRuntimeDispatchResult
HermesRuntimeHealth = MaxxRuntimeHealth


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
