import logging
import uuid
from datetime import UTC, datetime
from pathlib import Path
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, File, HTTPException, Request, Response, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth_routes import require_admin, verify_admin_origin
from app.catalog import validate_options
from app.database import get_session
from app.file_storage import store_upload
from app.models import (
    NotificationOutbox,
    Order,
    OrderItem,
    PriceTier,
    Product,
    ProductVariant,
    QuoteRequest,
    UploadedFile,
)
from app.schemas import (
    AdminOrderOut,
    AdminOrderStatusIn,
    AdminOverviewOut,
    AdminNotificationOut,
    AdminPriceTierIn,
    AdminPriceTierOut,
    AdminQuoteOut,
    AdminQuoteUpdateIn,
)
from app.settings import settings
from app.whatsapp import queue_whatsapp_update

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["administration"])
SessionDep = Annotated[AsyncSession, Depends(get_session)]
AdminDep = Annotated[str, Depends(require_admin)]

ORDER_TRANSITIONS: dict[str, set[str]] = {
    "pending_review": {"confirmed", "cancelled"},
    "confirmed": {"in_production", "cancelled"},
    "in_production": {"ready", "cancelled"},
    "ready": {"completed"},
    "completed": set(),
    "cancelled": set(),
}


def ensure_admin_origin(request: Request) -> None:
    verify_admin_origin(request)


@router.get("/overview", response_model=AdminOverviewOut)
async def overview(
    session: SessionDep,
    _: AdminDep,
) -> AdminOverviewOut:
    pending_quotes = await session.scalar(
        select(func.count()).select_from(QuoteRequest).where(QuoteRequest.status == "pending")
    )
    quoted_requests = await session.scalar(
        select(func.count()).select_from(QuoteRequest).where(QuoteRequest.status == "quoted")
    )
    orders = {
        status: await session.scalar(
            select(func.count()).select_from(Order).where(Order.status == status)
        )
        for status in ("pending_review", "in_production", "ready")
    }
    notification_counts = {
        status: await session.scalar(
            select(func.count())
            .select_from(NotificationOutbox)
            .where(NotificationOutbox.status == status)
        )
        for status in ("pending", "processing", "failed")
    }
    return AdminOverviewOut(
        pending_quotes=pending_quotes or 0,
        quoted_requests=quoted_requests or 0,
        orders_to_review=orders["pending_review"] or 0,
        orders_in_production=orders["in_production"] or 0,
        orders_ready=orders["ready"] or 0,
        whatsapp_pending=(notification_counts["pending"] or 0)
        + (notification_counts["processing"] or 0),
        whatsapp_failed=notification_counts["failed"] or 0,
    )


@router.get("/notifications", response_model=list[AdminNotificationOut])
async def list_notifications(
    session: SessionDep,
    _: AdminDep,
) -> list[AdminNotificationOut]:
    notifications = (
        await session.scalars(
            select(NotificationOutbox)
            .order_by(NotificationOutbox.created_at.desc())
            .limit(100)
        )
    ).all()
    return notifications


@router.post(
    "/notifications/{notification_id}/retry",
    response_model=AdminNotificationOut,
)
async def retry_notification(
    notification_id: uuid.UUID,
    request: Request,
    session: SessionDep,
    _: AdminDep,
) -> AdminNotificationOut:
    ensure_admin_origin(request)
    async with session.begin():
        notification = await session.get(
            NotificationOutbox,
            notification_id,
            with_for_update=True,
        )
        if notification is None:
            raise HTTPException(status_code=404, detail="Notification not found")
        if notification.status != "failed":
            raise HTTPException(status_code=409, detail="Only failed notifications can be retried")
        notification.status = "pending"
        notification.attempts = 0
        notification.next_attempt_at = datetime.now(UTC)
        notification.last_error = None
    await session.refresh(notification)
    return notification


def quote_query():
    return select(QuoteRequest).options(
        selectinload(QuoteRequest.customer),
        selectinload(QuoteRequest.files),
    )


def quote_output(quote: QuoteRequest) -> AdminQuoteOut:
    return AdminQuoteOut(
        id=quote.id,
        reference=quote.reference,
        status=quote.status,
        product_name=quote.product_name,
        variant_name=quote.variant_name,
        quantity=quote.quantity,
        selected_options=quote.selected_options,
        fulfillment_method=quote.fulfillment_method,
        delivery_address=quote.delivery_address,
        notes=quote.notes,
        quoted_amount=quote.quoted_amount,
        created_at=quote.created_at,
        customer_name=quote.customer.full_name,
        customer_phone=quote.customer.phone,
        customer_email=quote.customer.email,
        files=quote.files,
    )


@router.post("/quotes/{quote_id}/files", response_model=AdminQuoteOut, status_code=201)
async def attach_quote_file(
    quote_id: uuid.UUID,
    request: Request,
    session: SessionDep,
    _: AdminDep,
    file: Annotated[UploadFile, File()],
) -> AdminQuoteOut:
    ensure_admin_origin(request)
    storage_key, original_filename, size_bytes, sha256, content_type = await store_upload(file)
    storage_path = Path(settings.file_storage_path) / storage_key
    try:
        async with session.begin():
            quote = await session.scalar(
                quote_query().where(QuoteRequest.id == quote_id).with_for_update()
            )
            if quote is None:
                raise HTTPException(status_code=404, detail="Quote request not found")
            if quote.status in {"accepted", "declined"}:
                raise HTTPException(status_code=409, detail="This quote request is closed")
            uploaded_file = UploadedFile(
                original_filename=original_filename,
                storage_key=storage_key,
                content_type=content_type,
                size_bytes=size_bytes,
                sha256=sha256,
            )
            quote.files.append(uploaded_file)
            await session.flush()
    except BaseException:
        storage_path.unlink(missing_ok=True)
        raise
    return quote_output(quote)


@router.get("/quotes", response_model=list[AdminQuoteOut])
async def list_quotes(
    session: SessionDep,
    _: AdminDep,
    status_filter: Literal["pending", "quoted", "accepted", "declined"] | None = None,
) -> list[AdminQuoteOut]:
    query = quote_query()
    if status_filter is not None:
        query = query.where(QuoteRequest.status == status_filter)
    quotes = (
        await session.scalars(query.order_by(QuoteRequest.created_at.desc()).limit(200))
    ).all()
    return [quote_output(quote) for quote in quotes]


@router.patch("/quotes/{quote_id}", response_model=AdminQuoteOut)
async def update_quote(
    quote_id: uuid.UUID,
    update: AdminQuoteUpdateIn,
    request: Request,
    session: SessionDep,
    _: AdminDep,
) -> AdminQuoteOut:
    ensure_admin_origin(request)
    async with session.begin():
        quote = await session.scalar(
            quote_query().where(QuoteRequest.id == quote_id).with_for_update()
        )
        if quote is None:
            raise HTTPException(status_code=404, detail="Quote request not found")
        if quote.status not in {"pending", "quoted"}:
            raise HTTPException(status_code=409, detail="This quote request can no longer be updated")
        if update.status == "quoted" and update.quoted_amount is None:
            raise HTTPException(
                status_code=422,
                detail="A confirmed total in TND is required before marking the quote as ready",
            )
        quote.status = update.status
        quote.quoted_amount = update.quoted_amount if update.status == "quoted" else None
        await session.flush()
        if update.status == "quoted":
            amount = f"{update.quoted_amount:.3f} TND"
            await queue_whatsapp_update(
                session,
                quote.customer,
                event_type="quote_prepared",
                reference=quote.reference,
                details={
                    "fr": f"Votre devis est prêt : {amount}. L’atelier vous contactera pour confirmer.",
                    "ar": f"عرض السعر جاهز: {amount}. ستتواصل معكم الورشة للتأكيد.",
                    "en": f"Your quote is ready: {amount}. The workshop will contact you to confirm.",
                },
                dedupe_key=f"quote:{quote.id}:quoted:{update.quoted_amount}",
            )
        else:
            await queue_whatsapp_update(
                session,
                quote.customer,
                event_type="quote_declined",
                reference=quote.reference,
                details={
                    "fr": "Votre demande de devis a été clôturée. Contactez l’atelier pour toute question.",
                    "ar": "تم إغلاق طلب عرض السعر. يمكنكم التواصل مع الورشة لأي استفسار.",
                    "en": "Your quote request was closed. Contact the workshop if you have questions.",
                },
                dedupe_key=f"quote:{quote.id}:declined",
            )
        return quote_output(quote)


@router.post("/quotes/{quote_id}/convert-to-order", response_model=AdminOrderOut, status_code=201)
async def convert_quote_to_order(
    quote_id: uuid.UUID,
    request: Request,
    session: SessionDep,
    _: AdminDep,
) -> AdminOrderOut:
    ensure_admin_origin(request)
    async with session.begin():
        quote = await session.scalar(
            quote_query().where(QuoteRequest.id == quote_id).with_for_update()
        )
        if quote is None:
            raise HTTPException(status_code=404, detail="Quote request not found")
        if quote.status != "quoted" or quote.quoted_amount is None:
            raise HTTPException(
                status_code=409,
                detail="Only a priced quote can be converted into an order",
            )
        if not quote.files:
            raise HTTPException(
                status_code=409,
                detail="A print-ready file must be attached before creating an order",
            )
        product = await session.scalar(
            select(Product).where(Product.id == quote.product_id, Product.is_active.is_(True))
        )
        variant = await session.scalar(
            select(ProductVariant).where(
                ProductVariant.id == quote.variant_id,
                ProductVariant.is_active.is_(True),
            )
        )
        if product is None or variant is None:
            raise HTTPException(status_code=409, detail="The quoted product is no longer available")

        order = Order(
            reference=f"FP-{uuid.uuid4().hex[:20].upper()}",
            customer=quote.customer,
            fulfillment_method=quote.fulfillment_method,
            delivery_address=quote.delivery_address,
            total_amount=quote.quoted_amount,
            currency="TND",
        )
        item = OrderItem(
            product_id=quote.product_id,
            variant_id=quote.variant_id,
            product_name=quote.product_name,
            variant_name=quote.variant_name,
            quantity=quote.quantity,
            selected_options=quote.selected_options,
            line_total=quote.quoted_amount,
            files=quote.files,
        )
        order.items.append(item)
        order.files = quote.files
        for uploaded_file in quote.files:
            uploaded_file.quote_request_id = None
            uploaded_file.order = order
            uploaded_file.order_item = item
        quote.status = "accepted"
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
        return order_output(order)


def order_query():
    return select(Order).options(
        selectinload(Order.customer),
        selectinload(Order.items).selectinload(OrderItem.files),
        selectinload(Order.files),
    )


def order_output(order: Order) -> AdminOrderOut:
    return AdminOrderOut(
        id=order.id,
        reference=order.reference,
        status=order.status,
        fulfillment_method=order.fulfillment_method,
        delivery_address=order.delivery_address,
        payment_method=order.payment_method,
        total_amount=order.total_amount,
        currency=order.currency,
        created_at=order.created_at,
        customer_name=order.customer.full_name,
        customer_phone=order.customer.phone,
        customer_email=order.customer.email,
        items=order.items,
    )


@router.get("/orders", response_model=list[AdminOrderOut])
async def list_orders(
    session: SessionDep,
    _: AdminDep,
) -> list[AdminOrderOut]:
    orders = (
        await session.scalars(order_query().order_by(Order.created_at.desc()).limit(200))
    ).all()
    return [order_output(order) for order in orders]


@router.patch("/orders/{order_id}/status", response_model=AdminOrderOut)
async def update_order_status(
    order_id: uuid.UUID,
    update: AdminOrderStatusIn,
    request: Request,
    session: SessionDep,
    _: AdminDep,
) -> AdminOrderOut:
    ensure_admin_origin(request)
    async with session.begin():
        order = await session.scalar(
            order_query().where(Order.id == order_id).with_for_update()
        )
        if order is None:
            raise HTTPException(status_code=404, detail="Order not found")
        allowed_transitions = ORDER_TRANSITIONS[order.status]
        if update.status not in allowed_transitions:
            raise HTTPException(
                status_code=409,
                detail=f"Cannot move an order from '{order.status}' to '{update.status}'",
            )
        if update.status == "in_production":
            if not order.files:
                raise HTTPException(
                    status_code=409,
                    detail="Attach a print-ready file before starting production",
                )
            if any(uploaded_file.review_status != "approved" for uploaded_file in order.files):
                raise HTTPException(
                    status_code=409,
                    detail="Approve every uploaded file before starting production",
                )
        order.status = update.status
        await session.flush()
        queue_details = {
            "confirmed": {
                "fr": "Votre commande est confirmée.",
                "ar": "تم تأكيد طلبكم.",
                "en": "Your order is confirmed.",
            },
            "in_production": {
                "fr": "La production de votre commande a commencé.",
                "ar": "بدأ إنتاج طلبكم.",
                "en": "Production of your order has started.",
            },
            "ready": {
                "fr": "Votre commande est prête. Vous pouvez la récupérer à l’atelier.",
                "ar": "طلبكم جاهز. يمكنكم استلامه من الورشة.",
                "en": "Your order is ready for collection from the workshop.",
            },
            "completed": {
                "fr": "Votre commande est terminée. Merci pour votre confiance.",
                "ar": "اكتمل طلبكم. شكراً لثقتكم بنا.",
                "en": "Your order is complete. Thank you for choosing us.",
            },
            "cancelled": {
                "fr": "Votre commande a été annulée. Contactez l’atelier si vous avez des questions.",
                "ar": "تم إلغاء طلبكم. تواصلوا مع الورشة لأي استفسار.",
                "en": "Your order was cancelled. Contact the workshop if you have questions.",
            },
        }
        await queue_whatsapp_update(
            session,
            order.customer,
            event_type=f"order_{update.status}",
            reference=order.reference,
            details=queue_details[update.status],
            dedupe_key=f"order:{order.id}:{update.status}",
        )
        return order_output(order)


@router.get("/prices", response_model=list[AdminPriceTierOut])
async def list_price_tiers(
    session: SessionDep,
    _: AdminDep,
    include_inactive: bool = False,
) -> list[AdminPriceTierOut]:
    query = (
        select(PriceTier)
        .options(selectinload(PriceTier.product), selectinload(PriceTier.variant))
        .order_by(PriceTier.product_id, PriceTier.variant_id, PriceTier.quantity_min)
    )
    if not include_inactive:
        query = query.where(PriceTier.is_active.is_(True))
    tiers = (await session.scalars(query.limit(500))).all()
    return [
        AdminPriceTierOut(
            id=tier.id,
            product_id=tier.product_id,
            product_name=tier.product.translations.get("fr", tier.product.slug),
            variant_id=tier.variant_id,
            variant_name=tier.variant.translations.get("fr", tier.variant.sku),
            option_values=tier.option_values,
            quantity_min=tier.quantity_min,
            quantity_max=tier.quantity_max,
            total_price=tier.total_price,
            currency="TND",
            is_active=tier.is_active,
        )
        for tier in tiers
    ]


@router.post("/prices", response_model=AdminPriceTierOut, status_code=201)
async def create_price_tier(
    price: AdminPriceTierIn,
    request: Request,
    session: SessionDep,
    _: AdminDep,
) -> AdminPriceTierOut:
    ensure_admin_origin(request)
    async with session.begin():
        product = await session.scalar(
            select(Product)
            .where(Product.id == price.product_id, Product.is_active.is_(True))
            .options(selectinload(Product.options))
        )
        variant = await session.scalar(
            select(ProductVariant).where(
                ProductVariant.id == price.variant_id,
                ProductVariant.product_id == price.product_id,
                ProductVariant.is_active.is_(True),
            )
        )
        if product is None or variant is None:
            raise HTTPException(status_code=404, detail="Active product variant not found")
        validate_options(product, price.option_values)
        existing_tiers = (
            await session.scalars(
                select(PriceTier).where(
                    PriceTier.product_id == price.product_id,
                    PriceTier.variant_id == price.variant_id,
                    PriceTier.is_active.is_(True),
                )
            )
        ).all()
        overlaps = [
            tier
            for tier in existing_tiers
            if tier.option_values == price.option_values
            and tier.quantity_min <= price.quantity_max
            and price.quantity_min <= tier.quantity_max
        ]
        if overlaps:
            raise HTTPException(
                status_code=409,
                detail="This quantity range overlaps an active price for the same options",
            )
        tier = PriceTier(
            product_id=price.product_id,
            variant_id=price.variant_id,
            option_values=price.option_values,
            quantity_min=price.quantity_min,
            quantity_max=price.quantity_max,
            total_price=price.total_price,
            currency="TND",
            product=product,
            variant=variant,
        )
        session.add(tier)
        await session.flush()
        return AdminPriceTierOut(
            id=tier.id,
            product_id=tier.product_id,
            product_name=tier.product.translations.get("fr", tier.product.slug),
            variant_id=tier.variant_id,
            variant_name=tier.variant.translations.get("fr", tier.variant.sku),
            option_values=tier.option_values,
            quantity_min=tier.quantity_min,
            quantity_max=tier.quantity_max,
            total_price=tier.total_price,
            currency="TND",
            is_active=True,
        )


@router.delete("/prices/{tier_id}", status_code=204)
async def deactivate_price_tier(
    tier_id: uuid.UUID,
    request: Request,
    session: SessionDep,
    _: AdminDep,
) -> Response:
    ensure_admin_origin(request)
    tier = await session.get(PriceTier, tier_id, with_for_update=True)
    if tier is None:
        raise HTTPException(status_code=404, detail="Price tier not found")
    tier.is_active = False
    await session.commit()
    return Response(status_code=204)


@router.patch("/files/{file_id}/review", response_model=Literal["pending", "approved", "rejected"])
async def review_file(
    file_id: uuid.UUID,
    review_status: Literal["approved", "rejected"],
    request: Request,
    session: SessionDep,
    _: AdminDep,
) -> Literal["pending", "approved", "rejected"]:
    ensure_admin_origin(request)
    uploaded_file = await session.get(UploadedFile, file_id, with_for_update=True)
    if uploaded_file is None:
        raise HTTPException(status_code=404, detail="Uploaded file not found")
    uploaded_file.review_status = review_status
    await session.commit()
    return review_status


@router.get("/files/{file_id}/download")
async def download_file(
    file_id: uuid.UUID,
    session: SessionDep,
    _: AdminDep,
) -> FileResponse:
    uploaded_file = await session.get(UploadedFile, file_id)
    if uploaded_file is None:
        raise HTTPException(status_code=404, detail="Uploaded file not found")
    storage_root = Path(settings.file_storage_path).resolve()
    path = (storage_root / uploaded_file.storage_key).resolve()
    if path.parent != storage_root or not path.is_file():
        logger.error("Uploaded file missing or outside private storage: %s", file_id)
        raise HTTPException(status_code=404, detail="Uploaded file is unavailable")
    return FileResponse(
        path,
        media_type=uploaded_file.content_type,
        filename=uploaded_file.original_filename,
        headers={"Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff"},
    )
