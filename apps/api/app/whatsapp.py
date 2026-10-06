import re
from datetime import UTC, datetime, timedelta
from typing import Any

import httpx
from sqlalchemy import or_, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.models import Customer, NotificationOutbox
from app.settings import settings

MAX_ERROR_LENGTH = 300
CLAIM_LEASE_SECONDS = 60
MAX_RETRY_DELAY_SECONDS = 3600


class WhatsAppDeliveryError(Exception):
    def __init__(self, message: str, *, retryable: bool) -> None:
        super().__init__(message)
        self.retryable = retryable


def normalize_whatsapp_recipient(phone: str) -> str:
    compact = re.sub(r"[\s().-]", "", phone)
    if compact.startswith("00"):
        compact = f"+{compact[2:]}"
    elif compact.startswith("+"):
        pass
    elif re.fullmatch(r"\d{8}", compact):
        compact = f"+216{compact}"
    elif re.fullmatch(r"216\d{8}", compact):
        compact = f"+{compact}"
    if re.fullmatch(r"\+[1-9]\d{7,14}", compact) is None:
        raise ValueError("WhatsApp updates require a valid international or Tunisian phone number")
    return compact


async def queue_whatsapp_update(
    session: AsyncSession,
    customer: Customer,
    *,
    event_type: str,
    reference: str,
    details: dict[str, str],
    dedupe_key: str,
) -> None:
    if not customer.whatsapp_opt_in:
        return
    statement = insert(NotificationOutbox).values(
            dedupe_key=dedupe_key,
            event_type=event_type,
            reference=reference,
            recipient=normalize_whatsapp_recipient(customer.phone),
            locale=customer.locale,
            parameters=[
                customer.full_name,
                reference,
                details.get(customer.locale, details["fr"]),
            ],
    )
    await session.execute(statement.on_conflict_do_nothing(index_elements=["dedupe_key"]))


def _template_name(locale: str) -> str:
    field = settings.whatsapp_templates[locale]
    return getattr(settings, field)


async def _send_notification(
    notification: dict[str, Any],
    client: httpx.AsyncClient,
) -> None:
    url = (
        f"https://graph.facebook.com/{settings.whatsapp_api_version}/"
        f"{settings.whatsapp_phone_number_id}/messages"
    )
    payload = {
        "messaging_product": "whatsapp",
        "to": notification["recipient"],
        "type": "template",
        "template": {
            "name": _template_name(notification["locale"]),
            "language": {"code": notification["locale"]},
            "components": [
                {
                    "type": "body",
                    "parameters": [
                        {"type": "text", "text": value}
                        for value in notification["parameters"]
                    ],
                }
            ],
        },
    }
    try:
        response = await client.post(
            url,
            headers={"Authorization": f"Bearer {settings.whatsapp_access_token}"},
            json=payload,
        )
    except httpx.TimeoutException as exc:
        raise WhatsAppDeliveryError("WhatsApp provider timed out", retryable=True) from exc
    except httpx.RequestError as exc:
        raise WhatsAppDeliveryError("WhatsApp provider could not be reached", retryable=True) from exc

    if response.is_success:
        return
    retryable = response.status_code == 429 or response.status_code >= 500
    raise WhatsAppDeliveryError(
        f"WhatsApp provider returned HTTP {response.status_code}",
        retryable=retryable,
    )


async def dispatch_one(
    session_factory: async_sessionmaker[AsyncSession],
    client: httpx.AsyncClient,
) -> bool:
    if not settings.whatsapp_is_configured:
        return False
    now = datetime.now(UTC)
    async with session_factory() as session:
        async with session.begin():
            notification = await session.scalar(
                select(NotificationOutbox)
                .where(
                    or_(
                        (
                            (NotificationOutbox.status == "pending")
                            & (NotificationOutbox.next_attempt_at <= now)
                        ),
                        (
                            (NotificationOutbox.status == "processing")
                            & (NotificationOutbox.locked_until < now)
                        ),
                    )
                )
                .order_by(NotificationOutbox.created_at)
                .with_for_update(skip_locked=True)
                .limit(1)
            )
            if notification is None:
                return False
            notification.status = "processing"
            notification.attempts += 1
            notification.locked_until = now + timedelta(seconds=CLAIM_LEASE_SECONDS)
            snapshot = {
                "id": notification.id,
                "recipient": notification.recipient,
                "locale": notification.locale,
                "parameters": notification.parameters,
                "attempts": notification.attempts,
            }

    try:
        await _send_notification(snapshot, client)
    except WhatsAppDeliveryError as exc:
        async with session_factory() as session:
            async with session.begin():
                notification = await session.get(NotificationOutbox, snapshot["id"], with_for_update=True)
                if notification is None or notification.status != "processing":
                    return True
                notification.last_error = str(exc)[:MAX_ERROR_LENGTH]
                notification.locked_until = None
                if exc.retryable and notification.attempts < settings.whatsapp_max_attempts:
                    delay = min(2 ** notification.attempts * 15, MAX_RETRY_DELAY_SECONDS)
                    notification.status = "pending"
                    notification.next_attempt_at = datetime.now(UTC) + timedelta(seconds=delay)
                else:
                    notification.status = "failed"
    else:
        async with session_factory() as session:
            async with session.begin():
                notification = await session.get(NotificationOutbox, snapshot["id"], with_for_update=True)
                if notification is None or notification.status != "processing":
                    return True
                notification.status = "sent"
                notification.sent_at = datetime.now(UTC)
                notification.last_error = None
                notification.locked_until = None
    return True
