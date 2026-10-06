from fastapi.testclient import TestClient
from pwdlib import PasswordHash

from app.main import app
from app.settings import settings


def test_admin_login_protects_workspace_and_logout(monkeypatch) -> None:
    monkeypatch.setattr(settings, "admin_username", "atelier")
    monkeypatch.setattr(
        settings,
        "admin_password_hash",
        PasswordHash.recommended().hash("A-Strong-Test-Password-783!"),
    )
    origin = {"Origin": "http://localhost:3000"}

    with TestClient(app) as client:
        unauthorized = client.get("/api/v1/admin/overview")
        assert unauthorized.status_code == 401

        login = client.post(
            "/api/v1/admin/auth/login",
            headers=origin,
            json={"username": "atelier", "password": "A-Strong-Test-Password-783!"},
        )
        assert login.status_code == 200
        assert login.json() == {"username": "atelier"}
        assert "httponly" in login.headers["set-cookie"].lower()

        authenticated = client.get("/api/v1/admin/auth/me")
        assert authenticated.status_code == 200
        assert authenticated.json() == {"username": "atelier"}

        logout = client.post("/api/v1/admin/auth/logout", headers=origin)
        assert logout.status_code == 204
        assert client.get("/api/v1/admin/auth/me").status_code == 401


def test_admin_login_rejects_untrusted_origin(monkeypatch) -> None:
    monkeypatch.setattr(settings, "admin_username", "atelier")
    monkeypatch.setattr(
        settings,
        "admin_password_hash",
        PasswordHash.recommended().hash("A-Strong-Test-Password-783!"),
    )

    with TestClient(app) as client:
        response = client.post(
            "/api/v1/admin/auth/login",
            headers={"Origin": "https://untrusted.example"},
            json={"username": "atelier", "password": "A-Strong-Test-Password-783!"},
        )

    assert response.status_code == 403
