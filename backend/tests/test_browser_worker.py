from __future__ import annotations

import importlib
import os
import sys
import unittest
from pathlib import Path

from fastapi.testclient import TestClient


BACKEND_ROOT = Path(__file__).resolve().parents[1]


class BrowserWorkerTests(unittest.TestCase):
    def setUp(self) -> None:
        if str(BACKEND_ROOT) not in sys.path:
            sys.path.insert(0, str(BACKEND_ROOT))
        for name in [key for key in sys.modules if key.startswith("maxx_browser_worker")]:
            sys.modules.pop(name, None)
        os.environ["MAXX_BROWSER_WORKER_SECRET"] = "worker-secret"
        os.environ["MAXX_BROWSER_AUTONOMY_ENABLED"] = "true"
        os.environ["MAXX_BROWSER_ALLOWED_DOMAINS"] = "example.com"
        self.main = importlib.import_module("maxx_browser_worker.main")
        self.client = TestClient(self.main.app)

    def tearDown(self) -> None:
        for key in [
            "MAXX_BROWSER_WORKER_SECRET",
            "MAXX_BROWSER_AUTONOMY_ENABLED",
            "MAXX_BROWSER_ALLOWED_DOMAINS",
        ]:
            os.environ.pop(key, None)

    def test_health_reports_private_worker_state(self) -> None:
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["service"], "agent-maxx-browser-worker")
        self.assertTrue(payload["secret_configured"])
        self.assertTrue(payload["autonomy_enabled"])
        self.assertIn("example.com", payload["allowed_domains"])

    def test_browser_job_requires_secret_and_allowlist(self) -> None:
        missing_secret = self.client.post(
            "/v1/browser/jobs",
            json={
                "query": "Find prospects",
                "target_url": "https://example.com/team",
                "max_records": 1,
            },
        )
        self.assertEqual(missing_secret.status_code, 401)

        blocked_target = self.client.post(
            "/v1/browser/jobs",
            headers={"X-MAXX-BROWSER-WORKER-SECRET": "worker-secret"},
            json={
                "query": "Find prospects",
                "target_url": "https://not-allowed.invalid/team",
                "max_records": 1,
            },
        )
        self.assertEqual(blocked_target.status_code, 403)

        accepted = self.client.post(
            "/v1/browser/jobs",
            headers={"X-MAXX-BROWSER-WORKER-SECRET": "worker-secret"},
            json={
                "query": "Find prospects",
                "target_url": "https://example.com/team",
                "max_records": 1,
            },
        )
        self.assertEqual(accepted.status_code, 200)
        payload = accepted.json()
        self.assertTrue(payload["prospects"])
        self.assertEqual(payload["prospects"][0]["domain"], "example.com")


if __name__ == "__main__":
    unittest.main()
