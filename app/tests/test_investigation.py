from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_investigation_requires_a_target():
    response = client.post(
        "/api/investigate",
        json={},
    )

    assert response.status_code == 422


def test_unknown_app_can_be_investigated():
    fake_result = {
        "guide": {
            "app_name": "Example App",
            "website": "https://example.com",
            "difficulty": "moderate",
            "summary": "Example OAuth guide",
            "prerequisites": [],
            "steps": [],
            "estimated_active_minutes": None,
            "estimated_wait_days": None,
            "approval_required": "unknown",
            "approval_notes": [],
            "managed_auth_options": [],
            "custom_oauth_supported": None,
            "blockers": [],
            "human_actions_required": [],
            "tested_actions": [],
            "untested_actions": [
                "Live OAuth authorization"
            ],
            "sources": [
                "https://example.com/docs"
            ],
            "uncertainties": [
                "Approval requirements remain unknown"
            ],
            "evidence_status": "partially_verified",
            "generated_at": "2026-10-28T00:00:00+00:00",
        },
        "progress": [],
        "research": {
            "search_results": [],
            "fetched_page_count": 1,
            "evidence_count": 1,
        },
    }

    with patch(
        "app.main.run_investigation",
        new_callable=AsyncMock,
        return_value=fake_result,
    ):
        response = client.post(
            "/api/investigate",
            json={
                "app_name": "Example App",
                "website": "https://example.com",
            },
        )

    assert response.status_code == 200
    assert response.json()["status"] == "completed"
    assert (
        response.json()["guide"]["app_name"]
        == "Example App"
    )


def test_investigation_failure_is_handled():
    with patch(
        "app.main.run_investigation",
        new_callable=AsyncMock,
        side_effect=RuntimeError("Provider unavailable"),
    ):
        response = client.post(
            "/api/investigate",
            json={
                "app_name": "Example App"
            },
        )

    assert response.status_code == 502
    assert "could not be completed" in response.json()["detail"]