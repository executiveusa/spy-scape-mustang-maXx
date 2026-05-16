from __future__ import annotations

import os
import sys
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

from .models import HermesDispatchResult, HermesProfileBinding, HermesRuntimeHealth, SmartSiteManifest

DEFAULT_VENDOR_PATH = Path(
    os.environ.get(
        "MAXX_HERMES_VENDOR_PATH",
        r"E:\ACTIVE PROJECTS-PIPELINE\ACTIVE PROJECTS-PIPELINE\AFROMATIONS\vendors\hermes-agent",
    )
).resolve()
DEFAULT_PROVIDER = os.environ.get("MAXX_HERMES_PROVIDER", "openrouter")
DEFAULT_MODEL = os.environ.get("MAXX_HERMES_MODEL", "openrouter/owl-alpha")
DEFAULT_RUNTIME_HOME = Path(
    os.environ.get(
        "MAXX_HERMES_HOME",
        str(Path(__file__).resolve().parents[2] / "backend" / "runtime" / "hermes"),
    )
).resolve()


@contextmanager
def hermes_profile_env() -> Iterator[None]:
    vendor_added = False
    old_home = os.environ.get("HERMES_HOME")

    if str(DEFAULT_VENDOR_PATH) not in sys.path:
        sys.path.insert(0, str(DEFAULT_VENDOR_PATH))
        vendor_added = True

    os.environ["HERMES_HOME"] = str(DEFAULT_RUNTIME_HOME)
    DEFAULT_RUNTIME_HOME.mkdir(parents=True, exist_ok=True)

    try:
        yield
    finally:
        if old_home is None:
            os.environ.pop("HERMES_HOME", None)
        else:
            os.environ["HERMES_HOME"] = old_home
        if vendor_added:
            try:
                sys.path.remove(str(DEFAULT_VENDOR_PATH))
            except ValueError:
                pass


def vendor_available() -> bool:
    return DEFAULT_VENDOR_PATH.exists() and (DEFAULT_VENDOR_PATH / "hermes_cli" / "profiles.py").exists()


def provider_api_key() -> str | None:
    for key in ("MAXX_OPENROUTER_API_KEY", "OPENROUTER_API_KEY"):
        value = os.environ.get(key)
        if value:
            return value
    return None


def provider_configured() -> bool:
    return bool(provider_api_key())


def runtime_home() -> Path:
    DEFAULT_RUNTIME_HOME.mkdir(parents=True, exist_ok=True)
    return DEFAULT_RUNTIME_HOME


def load_profile_module():
    if not vendor_available():
        raise FileNotFoundError(f"Hermes vendor not found at {DEFAULT_VENDOR_PATH}")

    with hermes_profile_env():
        from hermes_cli import profiles  # type: ignore

        return profiles


def load_agent_class():
    if not vendor_available():
        raise FileNotFoundError(f"Hermes vendor not found at {DEFAULT_VENDOR_PATH}")

    with hermes_profile_env():
        from run_agent import AIAgent  # type: ignore

        return AIAgent


def list_profiles() -> list[dict[str, object]]:
    if not vendor_available():
        return []

    profiles = load_profile_module()
    with hermes_profile_env():
        items = profiles.list_profiles()

    return [
        {
            "name": item.name,
            "path": str(item.path),
            "is_default": item.is_default,
            "gateway_running": item.gateway_running,
            "model": item.model,
            "provider": item.provider,
            "has_env": item.has_env,
            "skill_count": item.skill_count,
        }
        for item in items
    ]


def profile_home(profile_name: str) -> Path:
    profiles = load_profile_module()
    with hermes_profile_env():
        return Path(profiles.get_profile_dir(profile_name)).resolve()


def provision_profile(profile_name: str) -> HermesProfileBinding:
    if not vendor_available():
        profile_dir = runtime_home() / "profiles" / profile_name
        workspace_path = profile_dir / "workspace"
        workspace_path.mkdir(parents=True, exist_ok=True)
        binding = HermesProfileBinding(
            profile_name=profile_name,
            profile_home=str(profile_dir.resolve()),
            workspace_path=str(workspace_path.resolve()),
            provider=DEFAULT_PROVIDER,
            model=DEFAULT_MODEL,
            status="vendor-missing",
        )
        write_maxx_profile_persona(binding)
        return binding

    profiles = load_profile_module()
    with hermes_profile_env():
        if not profiles.profile_exists(profile_name):
            profile_dir = profiles.create_profile(profile_name, no_alias=True)
        else:
            profile_dir = profiles.get_profile_dir(profile_name)

    workspace_path = Path(profile_dir) / "workspace"
    workspace_path.mkdir(parents=True, exist_ok=True)
    binding = HermesProfileBinding(
        profile_name=profile_name,
        profile_home=str(Path(profile_dir).resolve()),
        workspace_path=str(workspace_path.resolve()),
        provider=DEFAULT_PROVIDER,
        model=DEFAULT_MODEL,
        status="ready",
    )
    write_maxx_profile_persona(binding)
    return binding


def write_maxx_profile_persona(binding: HermesProfileBinding) -> str:
    """Customize the Hermes profile so MAXX behaves like the client's Lead Desk employee."""
    profile_root = Path(binding.profile_home)
    profile_root.mkdir(parents=True, exist_ok=True)
    soul_path = profile_root / "SOUL.md"
    soul_path.write_text(
        "\n".join(
            [
                "You are Hermes Agent operating through the Agent MAXX wrapper.",
                "",
                "Agent MAXX is a branded smart-site employee layer on top of Hermes. "
                "Your Wave 1 assignment is Lead Desk operations for one tenant at a time.",
                "",
                "## Business outcomes",
                "- Capture more qualified leads from the smart site.",
                "- Save operator time by summarizing and routing inquiries.",
                "- Remove handoff mistakes by preserving tenant context, follow-up actions, and routing status.",
                "",
                "## Operating rules",
                "- Use the tenant smart-site manifest as the source of truth.",
                "- Keep internal names literal: Lead Desk, tenant, manifest, workflow pack, heartbeat.",
                "- Do not claim bookings, CRM writes, payment actions, or external integrations unless the payload proves they exist.",
                "- When provider execution is unavailable, stage the task cleanly for operator review instead of pretending it ran.",
                "- Return concise operator-ready output: qualification, next action, route target, missing info, and risk.",
                "",
                "## Current MAXX scope",
                "- One smart site.",
                "- One MAXX employee.",
                "- One Hermes profile per client on one server.",
                "- Lead Desk first; multi-agent company orchestration is intentionally deferred.",
            ]
        ),
        encoding="utf-8",
    )
    return str(soul_path.resolve())


def write_manifest_context(manifest: SmartSiteManifest, workflow_ids: list[str], profile_name: str | None = None) -> list[str]:
    binding = provision_profile(profile_name or manifest.client_id)
    workspace_root = Path(binding.workspace_path) / "maxx"
    workspace_root.mkdir(parents=True, exist_ok=True)

    manifest_path = workspace_root / "smart-site-manifest.json"
    manifest_path.write_text(manifest.model_dump_json(indent=2), encoding="utf-8")

    context_path = workspace_root / "MAXX_CONTEXT.md"
    context_path.write_text(
        "\n".join(
            [
                f"# {manifest.business.public_name} Lead Desk Context",
                "",
                f"Client ID: {manifest.client_id}",
                f"Industry: {manifest.business.industry}",
                f"Timezone: {manifest.business.timezone}",
                f"Enabled workflows: {', '.join(workflow_ids)}",
                "",
                "## Operator mission",
                "Convert smart-site inquiries into qualified next actions with fast follow-up and low handoff risk.",
                "",
                "## Offers",
                *[f"- {offer.label}: {offer.outcome}" for offer in manifest.business.offers],
                "",
                "## Routing rules",
                *[f"- {rule.when} -> {rule.action} -> {rule.target}" for rule in manifest.routing_rules],
            ]
        ),
        encoding="utf-8",
    )

    return [str(manifest_path.resolve()), str(context_path.resolve())]


def write_lead_task(profile_name: str, task_id: str, payload: dict[str, object]) -> list[str]:
    binding = provision_profile(profile_name)
    lead_root = Path(binding.workspace_path) / "maxx" / "lead-desk" / "tasks"
    lead_root.mkdir(parents=True, exist_ok=True)

    json_path = lead_root / f"{task_id}.json"
    md_path = lead_root / f"{task_id}.md"

    import json

    json_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    md_path.write_text(
        "\n".join(
            [
                f"# Lead Desk Task {task_id}",
                "",
                f"Client: {payload.get('client_id')}",
                f"Status: {payload.get('status')}",
                f"Qualification: {payload.get('qualification', {}).get('tier', 'unknown')}",
                "",
                "## Operator summary",
                str(payload.get("operator_summary", "")),
                "",
                "## Follow-up actions",
                *[f"- {action}" for action in payload.get("follow_up_actions", [])],
            ]
        ),
        encoding="utf-8",
    )

    return [str(json_path.resolve()), str(md_path.resolve())]


@contextmanager
def hermes_execution_env() -> Iterator[None]:
    api_key = provider_api_key()
    old_openrouter = os.environ.get("OPENROUTER_API_KEY")
    if api_key:
        os.environ["OPENROUTER_API_KEY"] = api_key
    try:
        yield
    finally:
        if old_openrouter is None:
            os.environ.pop("OPENROUTER_API_KEY", None)
        else:
            os.environ["OPENROUTER_API_KEY"] = old_openrouter


@contextmanager
def hermes_workspace(profile_name: str) -> Iterator[Path]:
    binding = provision_profile(profile_name)
    workspace_path = Path(binding.workspace_path)
    old_cwd = Path.cwd()
    os.chdir(workspace_path)
    try:
        yield workspace_path
    finally:
        os.chdir(old_cwd)


def execute_lead_task(profile_name: str, task_id: str, payload: dict[str, object]) -> HermesDispatchResult:
    if not vendor_available():
        return HermesDispatchResult(
            status="vendor-missing",
            provider=DEFAULT_PROVIDER,
            model=DEFAULT_MODEL,
            configured=False,
            notes=["Hermes vendor is unavailable, so MAXX could not dispatch this Lead Desk task."],
        )

    if not provider_configured():
        return HermesDispatchResult(
            status="provider-missing",
            provider=DEFAULT_PROVIDER,
            model=DEFAULT_MODEL,
            configured=False,
            notes=[
                "Hermes profile provisioning is ready, but no OpenRouter credential is configured.",
                "Set MAXX_OPENROUTER_API_KEY or OPENROUTER_API_KEY to enable model-backed execution.",
            ],
        )

    try:
        AIAgent = load_agent_class()
        with hermes_profile_env(), hermes_execution_env(), hermes_workspace(profile_name):
            agent = AIAgent(
                provider=DEFAULT_PROVIDER,
                model=DEFAULT_MODEL,
                api_key=provider_api_key(),
                max_iterations=8,
                quiet_mode=True,
                verbose_logging=False,
            )
            response = agent.run_conversation(
                user_message=(
                    "Process this Lead Desk task for Agent MAXX.\n\n"
                    f"Task payload:\n{payload}\n\n"
                    "Return a concise operator-ready action plan with:\n"
                    "1. qualification summary\n"
                    "2. immediate follow-up recommendation\n"
                    "3. routing decision\n"
                    "4. risks or missing info\n"
                ),
                system_message=(
                    "You are the Hermes runtime for Agent MAXX Lead Desk. "
                    "Support operator triage for a smart-site tenant. "
                    "Do not invent systems that are not in the payload. "
                    "Prefer concise, operational output."
                ),
                task_id=task_id,
            )
    except Exception as error:
        return HermesDispatchResult(
            status="dispatch-failed",
            provider=DEFAULT_PROVIDER,
            model=DEFAULT_MODEL,
            configured=True,
            notes=[f"Hermes dispatch failed: {error}"],
        )

    final_response = str(response.get("final_response") or "").strip()
    if not final_response:
        return HermesDispatchResult(
            status="dispatch-empty",
            provider=DEFAULT_PROVIDER,
            model=DEFAULT_MODEL,
            configured=True,
            notes=["Hermes execution completed, but it did not return a final operator response."],
        )

    return HermesDispatchResult(
        status="completed",
        provider=DEFAULT_PROVIDER,
        model=DEFAULT_MODEL,
        configured=True,
        notes=["Hermes executed a model-backed Lead Desk pass for this tenant."],
        response_excerpt=final_response[:800],
    )


def health() -> HermesRuntimeHealth:
    if not vendor_available():
        return HermesRuntimeHealth(
            available=False,
            status="vendor-missing",
            mode="unavailable",
            vendor_path=str(DEFAULT_VENDOR_PATH),
            runtime_home=str(runtime_home()),
            provider=DEFAULT_PROVIDER,
            model=DEFAULT_MODEL,
            provider_configured=provider_configured(),
            execution_ready=False,
            profiles_total=0,
            notes=["Hermes vendor checkout could not be found from the MAXX backend."],
        )

    try:
        profiles_total = len(list_profiles())
        notes = [
            "Hermes vendor checkout is available for profile-backed control-plane work.",
            "MAXX is using Hermes profile homes on one server as the Wave 1 tenancy model.",
        ]
        if provider_configured():
            notes.append("Provider credentials are present for model-backed Hermes execution.")
        else:
            notes.append("Provider credentials are still missing, so dispatch remains profile-backed only.")
        return HermesRuntimeHealth(
            available=True,
            status="ready" if provider_configured() else "provider-missing",
            mode="model-backed" if provider_configured() else "profile-control",
            vendor_path=str(DEFAULT_VENDOR_PATH),
            runtime_home=str(runtime_home()),
            provider=DEFAULT_PROVIDER,
            model=DEFAULT_MODEL,
            provider_configured=provider_configured(),
            execution_ready=provider_configured(),
            profiles_total=profiles_total,
            notes=notes,
        )
    except Exception as error:
        return HermesRuntimeHealth(
            available=False,
            status="degraded",
            mode="profile-control",
            vendor_path=str(DEFAULT_VENDOR_PATH),
            runtime_home=str(runtime_home()),
            provider=DEFAULT_PROVIDER,
            model=DEFAULT_MODEL,
            provider_configured=provider_configured(),
            execution_ready=False,
            profiles_total=0,
            notes=[f"Hermes vendor exists, but profile control failed: {error}"],
        )
