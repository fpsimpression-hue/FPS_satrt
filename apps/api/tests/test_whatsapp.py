import asyncio
import json

import httpx
import pytest

from app.schemas import CustomerIn
from app.settings import settings
from app.whatsapp import (
    WhatsAppDeliveryError,
    _send_notification,
    dispatch_one,
    normalize_whatsapp_recipient,
    queue_whatsapp_update,
)


@pytest.mark.parametrize(
    ("phone", "expected"),
    [
        ("55 123 456", "+21655123456"),
        ("216 55 123 456", "+21655123456"),
        ("+33 6 12 34 56 78", "+33612345678"),
        ("0033 6 12 34 56 78", "+33612345678"),
    ],
)
def test_normalize_whatsapp_recipient(phone: str, expected: str) -> None:
    assert normalize_whatsapp_recipient(phone) == expected


def test_whatsapp_consent_requires_valid_international_phone() -> None:
    with pytest.raises(ValueError):
        CustomerIn(full_name="Client Test", phone="1234567", whatsapp_opt_in=True)

    customer = CustomerIn(full_name="Client Test", phone="55123456")
    assert customer.whatsapp_opt_in is False


def test_notification_is_enqueued_only_after_customer_consent() -> None:
    class CapturingSession:
        statement = None

        async def execute(self, statement) -> None:
            self.statement = statement

    async def enqueue() -> tuple[CapturingSession, CapturingSession]:
        session = CapturingSession()
        opted_in_customer = type(
            "Customer",
            (),
            {
                "whatsapp_opt_in": True,
                "phone": "55123456",
                "locale": "fr",
                "full_name": "Fatma",
            },
        )()
        await queue_whatsapp_update(
            session,
            opted_in_customer,
            event_type="quote_received",
            reference="DV-123",
            details={"fr": "Demande reçue"},
            dedupe_key="quote:123:received",
        )
        no_consent_session = CapturingSession()
        opted_out_customer = type(
            "Customer",
            (),
            {"whatsapp_opt_in": False},
        )()
        await queue_whatsapp_update(
            no_consent_session,
            opted_out_customer,
            event_type="quote_received",
            reference="DV-456",
            details={"fr": "Demande reçue"},
            dedupe_key="quote:456:received",
        )
        return session, no_consent_session

    session, no_consent_session = asyncio.run(enqueue())
    assert session.statement is not None
    assert session.statement.compile().params["recipient"] == "+21655123456"
    assert session.statement.compile().params["parameters"] == [
        "Fatma",
        "DV-123",
        "Demande reçue",
    ]
    assert no_consent_session.statement is None


def test_whatsapp_template_is_sent_with_configured_locale(monkeypatch) -> None:
    monkeypatch.setattr(settings, "whatsapp_access_token", "test-token")
    monkeypatch.setattr(settings, "whatsapp_phone_number_id", "test-phone-id")
    monkeypatch.setattr(settings, "whatsapp_api_version", "v99.0")
    monkeypatch.setattr(settings, "whatsapp_template_fr", "fastprint_update_fr")
    captured: dict[str, object] = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["url"] = str(request.url)
        captured["authorization"] = request.headers["Authorization"]
        captured["json"] = json.loads(request.content)
        return httpx.Response(200, json={"messages": [{"id": "wamid.test"}]})

    async def send() -> None:
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            await _send_notification(
                {
                    "recipient": "+21655123456",
                    "locale": "fr",
                    "parameters": ["Fatma", "FP-123", "Commande prête"],
                },
                client,
            )

    asyncio.run(send())

    assert captured["url"] == "https://graph.facebook.com/v99.0/test-phone-id/messages"
    assert captured["authorization"] == "Bearer test-token"
    payload = captured["json"]
    assert isinstance(payload, dict)
    assert payload["template"]["name"] == "fastprint_update_fr"
    assert payload["template"]["components"][0]["parameters"][2]["text"] == "Commande prête"


def test_provider_permanent_error_is_not_retried(monkeypatch) -> None:
    monkeypatch.setattr(settings, "whatsapp_access_token", "test-token")
    monkeypatch.setattr(settings, "whatsapp_phone_number_id", "test-phone-id")
    monkeypatch.setattr(settings, "whatsapp_api_version", "v99.0")
    monkeypatch.setattr(settings, "whatsapp_template_fr", "fastprint_update_fr")

    async def handler(_: httpx.Request) -> httpx.Response:
        return httpx.Response(400, json={"error": {"message": "template is not approved"}})

    async def send() -> None:
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            with pytest.raises(WhatsAppDeliveryError) as error:
                await _send_notification(
                    {
                        "recipient": "+21655123456",
                        "locale": "fr",
                        "parameters": ["Fatma", "FP-123", "Commande prête"],
                    },
                    client,
                )
        assert error.value.retryable is False
        assert str(error.value) == "WhatsApp provider returned HTTP 400"

    asyncio.run(send())


def test_worker_does_not_attempt_delivery_when_unconfigured(monkeypatch) -> None:
    monkeypatch.setattr(settings, "whatsapp_access_token", "")

    assert asyncio.run(dispatch_one(None, None)) is False
