from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_catalog_contains_five_apps():
    response = client.get("/api/apps")

    assert response.status_code == 200
    assert response.json()["total"] == 5


def test_search_slack():
    response = client.get("/api/apps?q=slack")

    assert response.status_code == 200

    results = response.json()["results"]

    assert len(results) == 1
    assert results[0]["id"] == "slack"
    assert results[0]["guide_available"] is True


def test_guide_library():
    response = client.get("/api/guides")

    assert response.status_code == 200
    assert response.json()["total"] == 5


def test_google_guide_has_sources():
    response = client.get("/api/guides/google")

    assert response.status_code == 200

    guide = response.json()

    assert guide["app_name"] == "Google"
    assert len(guide["steps"]) > 0
    assert len(guide["sources"]) > 0
    assert guide["evidence_status"] == "curated"


def test_approval_wait_is_unknown():
    response = client.get("/api/guides/google")

    assert response.status_code == 200
    assert response.json()["estimated_wait_days"] is None


def test_unknown_guide_returns_404():
    response = client.get("/api/guides/unknown")

    assert response.status_code == 404


def test_strategy_recommends_investigation():
    response = client.post(
        "/api/strategy",
        json={
            "app_id": "github",
            "use_case": "Read repository issues",
            "production": False,
            "needs_custom_branding": False,
            "needs_custom_scopes": False,
            "needs_dedicated_quota": False,
        },
    )

    assert response.status_code == 200

    result = response.json()

    assert result["recommended_strategy"] == "investigate_first"
    assert len(result["sources"]) > 0


def test_custom_branding_recommends_custom_oauth():
    response = client.post(
        "/api/strategy",
        json={
            "app_id": "slack",
            "use_case": "Public AI agent",
            "production": True,
            "needs_custom_branding": True,
            "needs_custom_scopes": False,
            "needs_dedicated_quota": False,
        },
    )

    assert response.status_code == 200

    assert (
        response.json()["recommended_strategy"]
        == "custom_oauth"
    )


def test_unknown_strategy_app_returns_404():
    response = client.post(
        "/api/strategy",
        json={
            "app_id": "unknown",
            "use_case": "Test",
        },
    )

    assert response.status_code == 404