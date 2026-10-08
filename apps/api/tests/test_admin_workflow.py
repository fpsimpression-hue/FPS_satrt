import uuid
from collections.abc import Iterator
from datetime import UTC, datetime
from decimal import Decimal
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient
from pwdlib import PasswordHash

from app.database import get_session
from app.main import app
from app.settings import settings

ORIGIN = {"Origin": "http://localhost:3000"}
PASSWORD = "A-Strong-Test-Password-783!"


def make_file(review_status: str = "pending") -> SimpleNamespace:
    return SimpleNamespace(
        id=uuid.uuid4(),
        original_filename="logo.pdf",
        content_type="application/pdf",
        size_bytes=10,
        review_status=review_status,
    )


def make_order(status: str = "pending_review", files: list[SimpleNamespace] | None = None) -> SimpleNamespace:
    files = [make_file()] if files is None else files
    item = SimpleNamespace(
        product_name="Enseignes & signalétique",
        variant_name="Projet sur mesure",
        quantity=1,
        selected_options={},
        line_total=Decimal("450.000"),
        files=files,
    )
    return SimpleNamespace(
        id=uuid.uuid4(),
        reference="FP-0123456789ABCDEF",
        status=status,
        fulfillment_method="pickup",
        delivery_address=None,
        payment_method="cash_on_fulfillment",
        total_amount=Decimal("450.000"),
        currency="TND",
        created_at=datetime.now(UTC),
        customer=SimpleNamespace(full_name="Client Test", phone="+21655123456", email=None, whatsapp_opt_in=False),
        items=[item],
        files=files,
    )


class FakeSession:
    def __init__(self, order: SimpleNamespace) -> None:
        self.order = order

    def begin(self) -> "FakeSession":
        return self

    async def __aenter__(self) -> "FakeSession":
        return self

    async def __aexit__(self, *_: object) -> None:
        return None

    async def scalar(self, *_: object) -> SimpleNamespace:
        return self.order

    async def flush(self) -> None:
        return None


@pytest.fixture
def admin_client(monkeypatch: pytest.MonkeyPatch) -> Iterator[tuple[TestClient, list[SimpleNamespace]]]:
    monkeypatch.setattr(settings, "admin_username", "atelier")
    monkeypatch.setattr(settings, "admin_password_hash", PasswordHash.recommended().hash(PASSWORD))
    orders: list[SimpleNamespace] = []

    async def override_session():
        yield FakeSession(orders[0])

    app.dependency_overrides[get_session] = override_session
    try:
        with TestClient(app) as client:
            login = client.post(
                "/api/v1/admin/auth/login",
                headers=ORIGIN,
                json={"username": "atelier", "password": PASSWORD},
            )
            assert login.status_code == 200
            yield client, orders
    finally:
        app.dependency_overrides.pop(get_session, None)


def test_start_production_checks_files_and_launches_in_one_step(admin_client) -> None:
    client, orders = admin_client
    rejected = make_file("rejected")
    orders.append(make_order(files=[make_file(), rejected]))

    response = client.post(f"/api/v1/admin/orders/{orders[0].id}/start-production", headers=ORIGIN)

    assert response.status_code == 200
    assert response.json()["status"] == "in_production"
    assert [file.review_status for file in orders[0].files] == ["approved", "rejected"]


@pytest.mark.parametrize("files", [[], [make_file("rejected")]])
def test_start_production_requires_a_usable_file(admin_client, files: list[SimpleNamespace]) -> None:
    client, orders = admin_client
    orders.append(make_order(files=files))

    response = client.post(f"/api/v1/admin/orders/{orders[0].id}/start-production", headers=ORIGIN)

    assert response.status_code == 409
    assert response.json()["detail"] == "Attach a print-ready file before starting production"
    assert orders[0].status == "pending_review"


def test_start_production_only_from_an_order_awaiting_launch(admin_client) -> None:
    client, orders = admin_client
    orders.append(make_order(status="ready"))

    response = client.post(f"/api/v1/admin/orders/{orders[0].id}/start-production", headers=ORIGIN)

    assert response.status_code == 409
    assert orders[0].status == "ready"
