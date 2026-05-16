from __future__ import annotations

import importlib
import os
import sys
import tempfile
import unittest
from pathlib import Path

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
        self.hermes_home = Path(self.temp_dir.name) / "hermes-root"

        os.environ["MAXX_DATA_DIR"] = str(self.data_dir)
        os.environ["MAXX_HERMES_HOME"] = str(self.hermes_home)
        os.environ["MAXX_HERMES_VENDOR_PATH"] = str(HERMES_VENDOR_PATH)

        if str(BACKEND_ROOT) not in sys.path:
            sys.path.insert(0, str(BACKEND_ROOT))

        for name in [key for key in sys.modules if key.startswith("maxx_bff")]:
            sys.modules.pop(name, None)

        self.main = importlib.import_module("maxx_bff.main")
        self.client = TestClient(self.main.app)

    def tearDown(self) -> None:
        self.temp_dir.cleanup()
        for key in ["MAXX_DATA_DIR", "MAXX_HERMES_HOME", "MAXX_HERMES_VENDOR_PATH", "MAXX_ENV", "MAXX_ALLOWED_ORIGINS"]:
            os.environ.pop(key, None)

    def test_hermes_health_and_client_provisioning(self) -> None:
        health_response = self.client.get("/v1/hermes/health")
        self.assertEqual(health_response.status_code, 200)
        self.assertIn(health_response.json()["status"], {"ready", "provider-missing", "degraded", "vendor-missing"})

        provision_response = self.client.post("/v1/clients/maxx-demo/provision")
        self.assertEqual(provision_response.status_code, 200)
        payload = provision_response.json()
        self.assertEqual(payload["client_id"], "maxx-demo")
        self.assertIn(payload["status"], {"live", "degraded"})
        self.assertTrue(Path(payload["hermes"]["profile_home"]).exists())
        self.assertTrue((Path(payload["hermes"]["profile_home"]) / "SOUL.md").exists())

        manifest_response = self.client.get("/v1/clients/maxx-demo/manifest")
        self.assertEqual(manifest_response.status_code, 200)
        manifest = manifest_response.json()
        self.assertEqual(manifest["client_id"], "maxx-demo")
        self.assertIn("lead-desk", manifest["enabled_workflows"])

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
        self.assertEqual(client_payload["hermes"]["status"], "pending")

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
        self.assertEqual(provisioned["hermes"]["profile_name"], "acme-dental")
        self.assertTrue(Path(provisioned["hermes"]["profile_home"]).exists())
        soul = (Path(provisioned["hermes"]["profile_home"]) / "SOUL.md").read_text(encoding="utf-8")
        self.assertIn("Agent MAXX is a branded smart-site employee layer on top of Hermes", soul)

    def test_maxx_quickstart_and_readiness_contract(self) -> None:
        quickstart_response = self.client.post("/v1/maxx/quickstart")
        self.assertEqual(quickstart_response.status_code, 200)
        quickstart = quickstart_response.json()
        self.assertEqual(quickstart["client"]["client_id"], "maxx-demo")
        self.assertEqual(quickstart["readiness"]["runtime_wrapper"]["base_runtime"], "Hermes Agent")
        self.assertEqual(quickstart["readiness"]["runtime_wrapper"]["customized_as"], "Agent MAXX Lead Desk employee")
        self.assertTrue(quickstart["readiness"]["lead_desk_enabled"])
        self.assertIn(quickstart["readiness"]["run_mode"], {"model-backed", "profile-backed-staging", "not-ready"})

        readiness_response = self.client.get("/v1/maxx/readiness?client_id=maxx-demo")
        self.assertEqual(readiness_response.status_code, 200)
        readiness = readiness_response.json()
        self.assertEqual(readiness["product"], "Agent MAXX")
        self.assertEqual(readiness["runtime_wrapper"]["tenant_model"], "one Hermes profile per client on one server")
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
        self.assertIn(task["status"], {"queued", "completed", "blocked", "attention"})
        self.assertEqual(len(task["workspace_files"]), 2)
        self.assertIn("hermes_dispatch", task)
        self.assertIn(
            task["hermes_dispatch"]["status"],
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

        runtime_response = self.client.get("/v1/runtime")
        self.assertEqual(runtime_response.status_code, 200)
        runtime = runtime_response.json()
        self.assertTrue(runtime["clients"])
        self.assertTrue(runtime["workflow_packs"])
        self.assertTrue(runtime["heartbeats"])
        self.assertTrue(runtime["providers"])

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
