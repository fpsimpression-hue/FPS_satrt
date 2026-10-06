from fastapi.testclient import TestClient

from app.main import app


def test_liveness_reports_service_is_running() -> None:
    with TestClient(app) as client:
        response = client.get("/health/live")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_readiness_reports_database_connection_failure(monkeypatch) -> None:
    async def fail_connection() -> None:
        raise OSError("database is unavailable")

    monkeypatch.setattr("app.main.check_database_connection", fail_connection)

    with TestClient(app) as client:
        response = client.get("/health/ready")

    assert response.status_code == 503
    assert response.json() == {"detail": "Database is unavailable"}
