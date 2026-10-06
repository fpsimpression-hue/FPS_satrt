import secrets
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.catalog import load_product, resolve_price, validate_options
from app.database import get_session
from app.models import Customer, Order, OrderItem, QuoteRequest, UploadedFile
from app.schemas import (
    OrderCreateIn,
    OrderOut,
    QuoteRequestIn,
    QuoteRequestOut,
)
from app.whatsapp import queue_whatsapp_update

router = APIRouter(tags=["orders"])
SessionDep = Annotated[AsyncSession, Depends(get_session)]


async def lock_unassigned_files(
    session: AsyncSession, file_ids: list[uuid.UUID]
) -> list[UploadedFile]:
    if len(file_ids) != len(set(file_ids)):
        raise HTTPException(status_code=422, detail="Duplicate file identifiers are not allowed")
    if not file_ids:
        return []

    files = list(
        (
            await session.scalars(
                select(UploadedFile)
                .where(
                    UploadedFile.id.in_(file_ids),
                    UploadedFile.order_id.is_(None),
                    UploadedFile.quote_request_id.is_(None),
                )
                .with_for_update()
            )
        ).all()
    )
    if len(files) != len(file_ids):
        raise HTTPException(status_code=409, detail="One or more files are unavailable")
    return files


def create_customer(details: QuoteRequestIn) -> Customer:
    return Customer(
        full_name=details.customer.full_name.strip(),
        phone=details.customer.phone.strip(),
        email=str(details.customer.email) if details.customer.email else None,
        locale=details.customer.locale,
        whatsapp_opt_in=details.customer.whatsapp_opt_in,
    )


def new_reference(prefix: str) -> str:
    return f"{prefix}-{secrets.token_hex(8).upper()}"


@router.post("/quote-requests", response_model=QuoteRequestOut, status_code=201)
async def create_quote_request(
    request: QuoteRequestIn,
    session: SessionDep,
) -> QuoteRequestOut:
    if request.fulfillment_method == "delivery" and not request.delivery_address:
        raise HTTPException(
            status_code=422,
            detail="A delivery address is required for delivery quote requests",
        )
    async with session.begin():
        product, variant = await load_product(session, request.product_id, request.variant_id)
        validate_options(product, request.options)
        files = await lock_unassigned_files(session, request.file_ids)
        quote = QuoteRequest(
            reference=new_reference("DV"),
            customer=create_customer(request),
            product_id=product.id,
            variant_id=variant.id,
            product_name=product.translations.get("fr", product.slug),
            variant_name=variant.translations.get("fr", variant.sku),
            quantity=request.quantity,
            selected_options=request.options,
            fulfillment_method=request.fulfillment_method,
            delivery_address=(
                request.delivery_address.strip()
                if request.fulfillment_method == "delivery" and request.delivery_address
                else None
            ),
            notes=request.notes,
            files=files,
        )
        session.add(quote)
        await session.flush()
        await queue_whatsapp_update(
            session,
            quote.customer,
            event_type="quote_received",
            reference=quote.reference,
            details={
                "fr": "Nous avons reçu votre demande de devis.",
                "ar": "لقد تلقّينا طلب عرض السعر الخاص بكم.",
                "en": "We have received your quote request.",
            },
            dedupe_key=f"quote:{quote.id}:received",
        )
        return QuoteRequestOut(
            reference=quote.reference,
            status="pending",
            created_at=quote.created_at,
        )


@router.post("/orders", response_model=OrderOut, status_code=201)
async def create_order(
    request: OrderCreateIn,
    session: SessionDep,
) -> OrderOut:
    if request.fulfillment_method == "delivery" and not request.delivery_address:
        raise HTTPException(
            status_code=422,
            detail="A delivery address is required for delivery orders",
        )
    if request.fulfillment_method == "delivery":
        raise HTTPException(
            status_code=409,
            detail="Delivery pricing is not configured; submit a quote request instead",
        )

    async with session.begin():
        resolved = await resolve_price(
            session,
            request.product_id,
            request.variant_id,
            request.quantity,
            request.options,
        )
        if resolved.total_price is None:
            raise HTTPException(
                status_code=409,
                detail="No validated price exists; submit a quote request instead",
            )
        files = await lock_unassigned_files(session, request.file_ids)
        reference = new_reference("FP")
        order = Order(
            reference=reference,
            customer=create_customer(request),
            fulfillment_method=request.fulfillment_method,
            delivery_address=(
                request.delivery_address.strip()
                if request.fulfillment_method == "delivery" and request.delivery_address
                else None
            ),
            payment_method=request.payment_method,
            total_amount=resolved.total_price,
            currency="TND",
        )
        order.items.append(
            OrderItem(
                product_id=resolved.product.id,
                variant_id=resolved.variant.id,
                product_name=resolved.product.translations.get("fr", resolved.product.slug),
                variant_name=resolved.variant.translations.get("fr", resolved.variant.sku),
                quantity=request.quantity,
                selected_options=request.options,
                line_total=resolved.total_price,
                files=files,
            )
        )
        order.files = files
        session.add(order)
        await session.flush()
        await queue_whatsapp_update(
            session,
            order.customer,
            event_type="order_received",
            reference=order.reference,
            details={
                "fr": "Votre commande a été reçue et va être vérifiée par l’atelier.",
                "ar": "تم استلام طلبكم وستقوم الورشة بمراجعته.",
                "en": "Your order was received and will be reviewed by the workshop.",
            },
            dedupe_key=f"order:{order.id}:received",
        )
        return OrderOut(
            reference=order.reference,
            status="pending_review",
            total_amount=order.total_amount,
            currency="TND",
            payment_method="cash_on_fulfillment",
            fulfillment_method=order.fulfillment_method,
            created_at=order.created_at,
        )
