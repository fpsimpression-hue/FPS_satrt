import pytest
from fastapi import HTTPException
from types import SimpleNamespace

from app.catalog import validate_options
from app.models import ProductOption
from app.schemas import CustomerIn, OrderCreateIn


def make_product() -> SimpleNamespace:
    return SimpleNamespace(
        options=[
            ProductOption(
                code="paper",
                is_required=True,
                values=[
                    {"value": "mat", "labels": {"fr": "Mat", "ar": "مطفي", "en": "Matte"}},
                    {"value": "glossy", "labels": {"fr": "Brillant", "ar": "لامع", "en": "Glossy"}},
                ],
            ),
            ProductOption(
                code="lamination",
                is_required=False,
                values=[
                    {"value": "soft-touch", "labels": {"fr": "Velours", "ar": "ناعم", "en": "Soft-touch"}}
                ],
            ),
        ]
    )


def test_accepts_valid_required_and_optional_options() -> None:
    validate_options(make_product(), {"paper": "mat", "lamination": "soft-touch"})


@pytest.mark.parametrize(
    ("options", "expected_detail"),
    [
        ({}, "Option 'paper' is required"),
        ({"paper": "unknown"}, "Invalid value for option 'paper'"),
        ({"paper": "mat", "unknown": "value"}, "One or more selected options are invalid"),
    ],
)
def test_rejects_missing_unknown_or_invalid_options(
    options: dict[str, str],
    expected_detail: str,
) -> None:
    with pytest.raises(HTTPException) as error:
        validate_options(make_product(), options)

    assert error.value.status_code == 422
    assert error.value.detail == expected_detail


def test_rejects_blank_customer_name_and_invalid_phone() -> None:
    with pytest.raises(ValueError):
        CustomerIn(full_name="  ", phone="+216 55 123 456")
    with pytest.raises(ValueError):
        CustomerIn(full_name="Test Customer", phone="++216555123456")


def test_immediate_orders_require_at_least_one_print_file() -> None:
    with pytest.raises(ValueError):
        OrderCreateIn(
            product_id="2e8ac1e8-9311-5a26-8006-df7b85b574c8",
            variant_id="63705bd3-3264-59e1-9ea7-2093a3efd73d",
            quantity=100,
            options={"paper": "mat"},
            customer={"full_name": "Test Customer", "phone": "+216 55 123 456"},
            fulfillment_method="pickup",
        )
