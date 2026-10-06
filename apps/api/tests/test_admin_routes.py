import uuid
from decimal import Decimal

from fastapi.testclient import TestClient
from pwdlib import PasswordHash

from app.database import get_session
from app.main import app
from app.settings import settings


class EmptyFileQuote:
    status = "quoted"
    quoted_amount = Decimal("25.000")
    files: list[object] = []


class FakeSession:
    def __init__(self) -> None:
        self.quote = EmptyFileQuote()

    def begin(self) -> "FakeSession":
        return self

    async def __aenter__(self) -> "FakeSession":
        return self

    async def __aexit__(self, *_: object) -> None:
        return None

    async def scalar(self, *_: object) -> EmptyFileQuote:
        return self.quote


def test_quote_without_file_cannot_be_converted_to_order(monkeypatch) -> None:
    monkeypatch.setattr(settings, "admin_username", "atelier")
    monkeypatch.setattr(
        settings,
        "admin_password_hash",
        PasswordHash.recommended().hash("A-Strong-Test-Password-783!"),
    )
    fake_session = FakeSession()

    async def override_session():
        yield fake_session

    app.dependency_overrides[get_session] = override_session
    origin = {"Origin": "http://localhost:3000"}
    try:
        with TestClient(app) as client:
            login = client.post(
                "/api/v1/admin/auth/login",
                headers=origin,
                json={"username": "atelier", "password": "A-Strong-Test-Password-783!"},
            )
            assert login.status_code == 200

            response = client.post(
                f"/api/v1/admin/quotes/{uuid.uuid4()}/convert-to-order",
                headers=origin,
            )

        assert response.status_code == 409
        assert response.json()["detail"] == "A print-ready file must be attached before creating an order"
    finally:
        app.dependency_overrides.pop(get_session, None)
