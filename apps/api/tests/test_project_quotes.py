from datetime import date, timedelta
from typing import get_args

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.main import app
from app.models import NotificationOutbox, Order, QuoteRequest
from app.order_routes import PROJECT_CATEGORY_LABELS, new_reference
from app.schemas import ProjectCategory, ProjectQuoteRequestIn


def project_request(**overrides: object) -> dict[str, object]:
    payload: dict[str, object] = {
        "category": "enseignes",
        "description": "  Enseigne lumineuse 200 x 60 cm pour une boutique.  ",
        "quantity": 1,
        "customer": {"full_name": "Client Test", "phone": "+216 55 123 456"},
    }
    payload.update(overrides)
    return payload


def test_every_project_category_has_a_team_label() -> None:
    assert set(get_args(ProjectCategory)) == set(PROJECT_CATEGORY_LABELS)
    assert all(len(label) <= 180 for label in PROJECT_CATEGORY_LABELS.values())


@pytest.mark.parametrize("prefix", ["DV", "FP"])
def test_references_fit_every_column_that_stores_them(prefix: str) -> None:
    reference = new_reference(prefix)
    for column in (Order.reference, QuoteRequest.reference, NotificationOutbox.reference):
        assert len(reference) <= column.type.length


def test_accepts_a_complete_custom_project() -> None:
    request = ProjectQuoteRequestIn(
        **project_request(
            dimensions="  200 x 60 cm ",
            desired_date=date.today() + timedelta(days=10),
            design_help=True,
            fulfillment_method="delivery",
            delivery_address="12 rue de la République, Sahline",
        )
    )

    assert request.description == "Enseigne lumineuse 200 x 60 cm pour une boutique."
    assert request.dimensions == "200 x 60 cm"
    assert request.design_help is True


def test_blank_dimensions_are_stored_as_empty() -> None:
    assert ProjectQuoteRequestIn(**project_request(dimensions="   ")).dimensions is None


@pytest.mark.parametrize(
    "overrides",
    [
        {"description": "    court     "},
        {"category": "inconnue"},
        {"quantity": 0},
        {"desired_date": (date.today() - timedelta(days=1)).isoformat()},
        {"website": "https://spam.example"},
        {"fulfillment_method": "delivery", "delivery_address": "Sahline"},
        {"file_ids": ["00000000-0000-0000-0000-000000000001"] * 6},
    ],
)
def test_rejects_invalid_custom_projects(overrides: dict[str, object]) -> None:
    with pytest.raises(ValidationError):
        ProjectQuoteRequestIn(**project_request(**overrides))


def test_delivery_requires_an_address_before_touching_the_database() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/project-quote-requests",
            json=project_request(fulfillment_method="delivery"),
        )

    assert response.status_code == 422
    assert response.json()["detail"] == "A delivery address is required for delivery quote requests"
