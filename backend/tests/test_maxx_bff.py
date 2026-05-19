from __future__ import annotations

import importlib
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient


REPO_ROOT = Path(__file__).resolve().parents[2]
BACKEND_ROOT = REPO_ROOT / "backend"
HERMES_VENDOR_PATH = Path(
    r"E:\ACTIVE PROJECTS-PIPELINE\ACTIVE PROJECTS-PIPELINE\AFROMATIONS\vendors\hermes-agent"
)


class MaxxBffIntegrationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.data_dir = Path(self.temp_dir.name) / "data"
        self.runtime_home = Path(self.temp_dir.name) / "maxx-runtime-root"

        os.environ.pop("MAXX_BFF_SHARED_SECRET", None)
        os.environ["MAXX_DATA_DIR"] = str(self.data_dir)
        os.environ["MAXX_RUNTIME_HOME"] = str(self.runtime_home)
        os.environ["MAXX_RUNTIME_VENDOR_PATH"] = str(HERMES_VENDOR_PATH)

        if str(BACKEND_ROOT) not in sys.path:
            sys.path.insert(0, str(BACKEND_ROOT))

        for name in [key for key in sys.modules if key.startswith("maxx_bff")]:
            sys.modules.pop(name, None)

        self.main = importlib.import_module("maxx_bff.main")
        self.client = TestClient(self.main.app)

    def tearDown(self) -> None:
        self.temp_dir.cleanup()
        for key in [
            "MAXX_DATA_DIR",
            "MAXX_RUNTIME_HOME",
            "MAXX_RUNTIME_VENDOR_PATH",
            "MAXX_ENV",
            "MAXX_ALLOWED_ORIGINS",
            "MAXX_BFF_SHARED_SECRET",
        ]:
            os.environ.pop(key, None)

    def test_maxx_runtime_health_and_client_provisioning(self) -> None:
        health_response = self.client.get("/v1/maxx/runtime/health")
        self.assertEqual(health_response.status_code, 200)
        self.assertIn(health_response.json()["status"], {"ready", "provider-missing", "degraded", "vendor-missing"})
        profiles_response = self.client.get("/v1/maxx/runtime/profiles")
        self.assertEqual(profiles_response.status_code, 200)
        self.assertIn("profiles", profiles_response.json())

        provision_response = self.client.post("/v1/clients/maxx-demo/provision")
        self.assertEqual(provision_response.status_code, 200)
        payload = provision_response.json()
        self.assertEqual(payload["client_id"], "maxx-demo")
        self.assertIn(payload["status"], {"live", "degraded"})
        self.assertTrue(Path(payload["maxx_runtime"]["profile_home"]).exists())
        self.assertTrue((Path(payload["maxx_runtime"]["profile_home"]) / "SOUL.md").exists())

        manifest_response = self.client.get("/v1/clients/maxx-demo/manifest")
        self.assertEqual(manifest_response.status_code, 200)
        manifest = manifest_response.json()
        self.assertEqual(manifest["client_id"], "maxx-demo")
        self.assertIn("lead-desk", manifest["enabled_workflows"])
        self.assertIn("lead-acquisition", manifest["enabled_workflows"])
        self.assertTrue((self.data_dir / "maxx.db").exists())

    def test_shared_secret_protects_v1_routes_when_configured(self) -> None:
        os.environ["MAXX_BFF_SHARED_SECRET"] = "test-secret"

        for name in [key for key in sys.modules if key.startswith("maxx_bff")]:
            sys.modules.pop(name, None)
        self.main = importlib.import_module("maxx_bff.main")
        self.client = TestClient(self.main.app)

        self.assertEqual(self.client.get("/health").status_code, 200)
        self.assertEqual(self.client.get("/v1/maxx/runtime/health").status_code, 401)
        authorized = self.client.get("/v1/maxx/runtime/health", headers={"X-MAXX-BFF-SECRET": "test-secret"})
        self.assertEqual(authorized.status_code, 200)
        compatibility = self.client.get("/v1/hermes/health", headers={"X-MAXX-BFF-SECRET": "test-secret"})
        self.assertEqual(compatibility.status_code, 200)

    def test_client_creation_duplicate_guard_and_provisioning(self) -> None:
        create_response = self.client.post(
            "/v1/clients",
            json={
                "client_id": "acme-dental",
                "public_name": "Acme Dental Studio",
                "legal_name": "Acme Dental Studio LLC",
                "industry": "Dental Clinic",
                "timezone": "America/Chicago",
                "geography": ["Austin", "Round Rock"],
                "summary": "Dental office that wants faster inquiry follow-up and cleaner appointment routing.",
                "primary_offer": "New Patient Lead Desk",
                "operator_email": "frontdesk@example.com",
            },
        )
        self.assertEqual(create_response.status_code, 200)
        client_payload = create_response.json()
        self.assertEqual(client_payload["client_id"], "acme-dental")
        self.assertEqual(client_payload["status"], "provisioning-required")
        self.assertEqual(client_payload["slug"], "acme-dental")
        self.assertEqual(client_payload["manifest"]["business"]["industry"], "Dental Clinic")
        self.assertIn("lead-desk", client_payload["manifest"]["enabled_workflows"])
        self.assertIn("lead-acquisition", client_payload["manifest"]["enabled_workflows"])
        self.assertEqual(client_payload["maxx_runtime"]["status"], "pending")

        duplicate_response = self.client.post(
            "/v1/clients",
            json={
                "client_id": "acme-dental",
                "public_name": "Acme Dental Studio",
            },
        )
        self.assertEqual(duplicate_response.status_code, 409)

        provision_response = self.client.post("/v1/clients/acme-dental/provision")
        self.assertEqual(provision_response.status_code, 200)
        provisioned = provision_response.json()
        self.assertIn(provisioned["status"], {"live", "degraded"})
        self.assertEqual(provisioned["maxx_runtime"]["profile_name"], "acme-dental")
        self.assertTrue(Path(provisioned["maxx_runtime"]["profile_home"]).exists())
        soul = (Path(provisioned["maxx_runtime"]["profile_home"]) / "SOUL.md").read_text(encoding="utf-8")
        self.assertIn("You are Agent MAXX.", soul)
        self.assertNotIn("Hermes", soul)

    def test_maxx_quickstart_and_readiness_contract(self) -> None:
        quickstart_response = self.client.post("/v1/maxx/quickstart")
        self.assertEqual(quickstart_response.status_code, 200)
        quickstart = quickstart_response.json()
        self.assertEqual(quickstart["client"]["client_id"], "maxx-demo")
        self.assertEqual(quickstart["readiness"]["runtime_wrapper"]["base_runtime"], "Agent MAXX Runtime")
        self.assertEqual(quickstart["readiness"]["runtime_wrapper"]["customized_as"], "Agent MAXX Lead Desk employee")
        self.assertTrue(quickstart["readiness"]["lead_desk_enabled"])
        self.assertIn(quickstart["readiness"]["run_mode"], {"model-backed", "profile-backed-staging", "not-ready"})

        readiness_response = self.client.get("/v1/maxx/readiness?client_id=maxx-demo")
        self.assertEqual(readiness_response.status_code, 200)
        readiness = readiness_response.json()
        self.assertEqual(readiness["product"], "Agent MAXX")
        self.assertEqual(readiness["runtime_wrapper"]["tenant_model"], "one Agent MAXX profile per client on one server")
        self.assertIn("today_path", readiness)

    def test_lead_desk_task_round_trip(self) -> None:
        self.client.post("/v1/clients/maxx-demo/provision")

        submission = {
            "client_id": "maxx-demo",
            "contact_name": "Ava Prospect",
            "company": "Northwind Studio",
            "email": "ava@example.com",
            "phone": "+1-555-0110",
            "message": "We need a smart site and fast lead follow-up for an agency launch in the next week.",
            "requested_service": "lead-desk",
            "budget_band": "10k+ monthly",
            "timeline": "ASAP this week",
            "preferred_channel": "email",
            "source": "site",
        }
        create_response = self.client.post("/v1/lead-desk/tasks", json=submission)
        self.assertEqual(create_response.status_code, 200)

        task = create_response.json()
        self.assertEqual(task["client_id"], "maxx-demo")
        self.assertEqual(task["workflow_id"], "lead-desk")
        self.assertGreaterEqual(task["qualification"]["score"], 75)
        self.assertEqual(task["qualification"]["tier"], "hot")
        self.assertIn(task["status"], {"triaged", "queued", "completed", "blocked", "attention"})
        self.assertEqual(task["next_action"], "route-to-calendar")
        self.assertEqual(task["routing_target"], "sales-calendar")
        self.assertEqual(task["heartbeat_summary"]["workflow_id"], "lead-desk")
        self.assertIn(task["task_id"], task["heartbeat_summary"]["pending_task_ids"])
        self.assertEqual(len(task["workspace_files"]), 2)
        self.assertIn("maxx_dispatch", task)
        self.assertIn(
            task["maxx_dispatch"]["status"],
            {"provider-missing", "completed", "dispatch-failed", "dispatch-empty", "dispatch-deferred", "vendor-missing"},
        )
        for file_path in task["workspace_files"]:
            self.assertTrue(Path(file_path).exists())

        get_response = self.client.get(f"/v1/lead-desk/tasks/{task['task_id']}")
        self.assertEqual(get_response.status_code, 200)
        self.assertEqual(get_response.json()["task_id"], task["task_id"])

        update_response = self.client.patch(
            f"/v1/lead-desk/tasks/{task['task_id']}",
            json={"status": "follow-up", "note": "Operator started follow-up."},
        )
        self.assertEqual(update_response.status_code, 200)
        updated_task = update_response.json()
        self.assertEqual(updated_task["status"], "follow-up")
        self.assertIn("Operator note: Operator started follow-up.", updated_task["follow_up_actions"])
        self.assertEqual(updated_task["heartbeat_summary"]["status"], "watching")
        self.assertIn(updated_task["task_id"], updated_task["heartbeat_summary"]["pending_task_ids"])

        runtime_response = self.client.get("/v1/runtime")
        self.assertEqual(runtime_response.status_code, 200)
        runtime = runtime_response.json()
        self.assertTrue(runtime["clients"])
        self.assertTrue(runtime["workflow_packs"])
        self.assertTrue(runtime["heartbeats"])
        self.assertTrue(runtime["providers"])
        self.assertIn("maxx_runtime", runtime)
        self.assertNotIn("hermes", runtime)

    def test_lead_acquisition_job_dedupe_and_promotion(self) -> None:
        self.client.post("/v1/clients/maxx-demo/provision")

        sources_response = self.client.get("/v1/lead-acquisition/sources")
        self.assertEqual(sources_response.status_code, 200)
        sources = sources_response.json()["sources"]
        self.assertTrue(any(source["source"] == "manual" and source["enabled"] for source in sources))

        job_payload = {
            "client_id": "maxx-demo",
            "source": "authorized-contact-import",
            "query": "Owner-approved prospects for Lead Desk.",
            "max_records": 3,
            "prospects": [
                {
                    "name": "Morgan Hale",
                    "title": "Founder",
                    "company": "Northstar Growth Studio",
                    "email": "morgan@example.com",
                    "phone": "+1-555-0144",
                    "linkedin_url": "https://www.linkedin.com/in/example-morgan",
                    "location": "Austin",
                    "seniority": "Founder",
                    "department": "Executive",
                    "organization_domain": "northstargrowth.example",
                    "notes": "Founder exploring Lead Desk automation and smart-site intake.",
                },
                {
                    "name": "Morgan Hale",
                    "title": "Founder",
                    "company": "Northstar Growth Studio",
                    "email": "morgan@example.com",
                    "organization_domain": "northstargrowth.example",
                    "notes": "Duplicate row should not create another prospect.",
                },
            ],
        }
        create_job_response = self.client.post("/v1/lead-acquisition/jobs", json=job_payload)
        self.assertEqual(create_job_response.status_code, 200)
        job = create_job_response.json()
        self.assertEqual(job["status"], "completed")
        self.assertEqual(job["discovered_count"], 1)
        self.assertEqual(job["rejected_count"], 1)
        self.assertEqual(job["qualified_count"], 1)

        prospects_response = self.client.get("/v1/lead-acquisition/prospects?client_id=maxx-demo")
        self.assertEqual(prospects_response.status_code, 200)
        prospects = prospects_response.json()["prospects"]
        self.assertEqual(len(prospects), 1)
        prospect = prospects[0]
        self.assertEqual(prospect["status"], "qualified")
        self.assertGreaterEqual(prospect["score"], 75)
        self.assertTrue(prospect["evidence"])

        promote_response = self.client.post(
            f"/v1/lead-acquisition/prospects/{prospect['prospect_id']}/promote",
            json={"note": "Approved for operator review.", "preferred_channel": "email"},
        )
        self.assertEqual(promote_response.status_code, 200)
        promotion = promote_response.json()
        self.assertEqual(promotion["prospect"]["status"], "promoted")
        self.assertEqual(promotion["lead_desk_task"]["submission"]["source"], "lead-acquisition")
        self.assertIn("Lead Acquisition", promotion["lead_desk_task"]["submission"]["message"])
        self.assertIn("maxx_dispatch", promotion["lead_desk_task"])

        heartbeat_response = self.client.get("/v1/heartbeats")
        self.assertEqual(heartbeat_response.status_code, 200)
        workflow_ids = {heartbeat["workflow_id"] for heartbeat in heartbeat_response.json()["heartbeats"]}
        self.assertIn("lead-acquisition", workflow_ids)

    def test_lead_acquisition_blocks_browser_worker_without_policy(self) -> None:
        blocked_response = self.client.post(
            "/v1/lead-acquisition/jobs",
            json={
                "client_id": "maxx-demo",
                "source": "browser-worker",
                "query": "Attempt browser work without explicit tenant approval.",
                "max_records": 1,
            },
        )
        self.assertEqual(blocked_response.status_code, 403)

        browser_health = self.client.get("/v1/maxx/browser/health")
        self.assertEqual(browser_health.status_code, 200)
        self.assertFalse(browser_health.json()["enabled"])

        web_health = self.client.get("/v1/maxx/web-research/health")
        self.assertEqual(web_health.status_code, 200)
        self.assertIn(web_health.json()["status"], {"online", "warning"})

    def test_web_research_uses_firecrawl_when_configured(self) -> None:
        os.environ["FIRECRAWL_API_KEY"] = "test-firecrawl-key"

        class FakeResponse:
            def __enter__(self):
                return self

            def __exit__(self, *_args):
                return None

            def read(self) -> bytes:
                return b"""
                {
                  "success": true,
                  "data": [
                    {
                      "title": "Austin Founder Lead Desk Agency",
                      "url": "https://example.com/austin-founder",
                      "description": "Founder in Austin looking for Lead Desk automation and smart site routing."
                    }
                  ]
                }
                """

        with patch("maxx_bff.lead_acquisition_drivers.request.urlopen", return_value=FakeResponse()):
            response = self.client.post(
                "/v1/lead-acquisition/jobs",
                json={
                    "client_id": "maxx-demo",
                    "source": "web-research",
                    "query": "Austin founder Lead Desk automation",
                    "max_records": 1,
                },
            )

        self.assertEqual(response.status_code, 200)
        job = response.json()
        self.assertEqual(job["status"], "completed")
        self.assertEqual(job["discovered_count"], 1)
        self.assertIn("Search completed", " ".join(job["events"]))

        prospects = self.client.get("/v1/lead-acquisition/prospects?client_id=maxx-demo").json()["prospects"]
        self.assertEqual(len(prospects), 1)
        self.assertEqual(prospects[0]["source"], "web-research")
        self.assertEqual(prospects[0]["organization_domain"], "example.com")
        self.assertTrue(prospects[0]["evidence"])

    def test_web_research_target_url_respects_allowlist(self) -> None:
        os.environ["FIRECRAWL_API_KEY"] = "test-firecrawl-key"
        response = self.client.post(
            "/v1/lead-acquisition/jobs",
            json={
                "client_id": "maxx-demo",
                "source": "web-research",
                "query": "Do not leave tenant allowlist",
                "target_url": "https://not-allowed.invalid/company",
                "max_records": 1,
            },
        )
        self.assertEqual(response.status_code, 403)

    def test_lead_desk_task_and_heartbeat_survive_app_restart(self) -> None:
        self.client.post("/v1/clients/maxx-demo/provision")

        create_response = self.client.post(
            "/v1/lead-desk/tasks",
            json={
                "client_id": "maxx-demo",
                "contact_name": "Riley Restart",
                "company": "Persistence Co",
                "email": "riley@example.com",
                "message": "We need a smart site and lead follow-up system that survives backend restarts.",
                "requested_service": "lead-desk",
                "timeline": "this week",
                "preferred_channel": "email",
                "source": "site",
            },
        )
        self.assertEqual(create_response.status_code, 200)
        task = create_response.json()
        self.assertTrue((self.data_dir / "maxx.db").exists())

        for name in [key for key in sys.modules if key.startswith("maxx_bff")]:
            sys.modules.pop(name, None)
        restarted_main = importlib.import_module("maxx_bff.main")
        restarted_client = TestClient(restarted_main.app)

        persisted_response = restarted_client.get(f"/v1/lead-desk/tasks/{task['task_id']}")
        self.assertEqual(persisted_response.status_code, 200)
        persisted = persisted_response.json()
        self.assertEqual(persisted["task_id"], task["task_id"])
        self.assertEqual(persisted["heartbeat_summary"]["workflow_id"], "lead-desk")
        self.assertIn(task["task_id"], persisted["heartbeat_summary"]["pending_task_ids"])

    def test_lead_desk_default_dispatch_budget_defers_before_frontend_timeout(self) -> None:
        hermes_vendor = importlib.import_module("maxx_bff.hermes_vendor")
        self.assertLessEqual(hermes_vendor.DEFAULT_DISPATCH_TIMEOUT_SECONDS, 4)

    def test_production_cors_warning_when_origins_are_missing(self) -> None:
        self.tearDown()
        self.setUp()
        os.environ["MAXX_ENV"] = "production"

        for name in [key for key in sys.modules if key.startswith("maxx_bff")]:
            sys.modules.pop(name, None)
        self.main = importlib.import_module("maxx_bff.main")
        self.client = TestClient(self.main.app)

        meta_response = self.client.get("/v1/meta")
        self.assertEqual(meta_response.status_code, 200)
        meta = meta_response.json()
        self.assertIn(
            "MAXX_ALLOWED_ORIGINS is not set; production CORS is still using local development origins.",
            meta["notes"],
        )
        self.assertEqual(self.client.get("/health").json()["status"], "degraded")


if __name__ == "__main__":
    unittest.main()
