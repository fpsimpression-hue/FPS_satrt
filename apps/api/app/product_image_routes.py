import logging
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, Response, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.auth_routes import require_admin, verify_admin_origin
from app.database import get_session
from app.models import Product, ProductImage
from app.product_image_storage import product_image_path, store_product_image
from app.schemas import AdminProductImageUpdateIn, ProductImageOut

logger = logging.getLogger(__name__)
router = APIRouter(tags=["product images"])
SessionDep = Annotated[AsyncSession, Depends(get_session)]
AdminDep = Annotated[str, Depends(require_admin)]
MAX_IMAGES_PER_PRODUCT = 20


@router.get("/admin/products/{product_id}/images", response_model=list[ProductImageOut])
async def list_product_images(
    product_id: uuid.UUID,
    session: SessionDep,
    _: AdminDep,
) -> list[ProductImage]:
    product = await session.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return list(
        (
            await session.scalars(
                select(ProductImage)
                .where(ProductImage.product_id == product_id)
                .order_by(ProductImage.sort_order, ProductImage.created_at)
            )
        ).all()
    )


@router.post(
    "/admin/products/{product_id}/images",
    response_model=ProductImageOut,
    status_code=201,
)
async def create_product_image(
    product_id: uuid.UUID,
    request: Request,
    session: SessionDep,
    _: AdminDep,
    image: Annotated[UploadFile, File()],
    alt_fr: Annotated[str, Form(max_length=300)] = "",
    alt_ar: Annotated[str, Form(max_length=300)] = "",
    alt_en: Annotated[str, Form(max_length=300)] = "",
    is_primary: Annotated[bool, Form()] = False,
) -> ProductImage:
    verify_admin_origin(request)
    storage_key: str | None = None
    try:
        async with session.begin():
            product = await session.scalar(
                select(Product).where(Product.id == product_id).with_for_update()
            )
            if product is None:
                raise HTTPException(status_code=404, detail="Product not found")
            image_count = await session.scalar(
                select(func.count()).select_from(ProductImage).where(
                    ProductImage.product_id == product_id
                )
            )
            if (image_count or 0) >= MAX_IMAGES_PER_PRODUCT:
                raise HTTPException(
                    status_code=409,
                    detail=f"A product can have at most {MAX_IMAGES_PER_PRODUCT} images",
                )
            sort_order = await session.scalar(
                select(func.coalesce(func.max(ProductImage.sort_order), -1)).where(
                    ProductImage.product_id == product_id
                )
            )
            storage_key, size_bytes, sha256, content_type = await store_product_image(image)
            if is_primary or image_count == 0:
                existing_primary = (
                    await session.scalars(
                        select(ProductImage)
                        .where(
                            ProductImage.product_id == product_id,
                            ProductImage.is_primary.is_(True),
                        )
                        .with_for_update()
                    )
                ).all()
                for item in existing_primary:
                    item.is_primary = False
                await session.flush()

            product_image = ProductImage(
                product_id=product_id,
                storage_key=storage_key,
                size_bytes=size_bytes,
                sha256=sha256,
                content_type=content_type,
                alt_texts={
                    locale: value
                    for locale, value in {
                        "fr": alt_fr.strip(),
                        "ar": alt_ar.strip(),
                        "en": alt_en.strip(),
                    }.items()
                    if value
                },
                sort_order=(sort_order or -1) + 1,
                is_primary=is_primary or image_count == 0,
            )
            session.add(product_image)
            await session.flush()
            await session.refresh(product_image)
    except BaseException:
        if storage_key is not None:
            try:
                product_image_path(storage_key).unlink(missing_ok=True)
            except OSError:
                logger.exception("Could not clean up failed product image upload")
        raise
    return product_image


@router.patch(
    "/admin/products/{product_id}/images/{image_id}",
    response_model=ProductImageOut,
)
async def update_product_image(
    product_id: uuid.UUID,
    image_id: uuid.UUID,
    update: AdminProductImageUpdateIn,
    request: Request,
    session: SessionDep,
    _: AdminDep,
) -> ProductImage:
    verify_admin_origin(request)
    async with session.begin():
        product = await session.scalar(
            select(Product).where(Product.id == product_id).with_for_update()
        )
        if product is None:
            raise HTTPException(status_code=404, detail="Product not found")
        product_image = await session.scalar(
            select(ProductImage)
            .where(
                ProductImage.id == image_id,
                ProductImage.product_id == product_id,
            )
            .with_for_update()
        )
        if product_image is None:
            raise HTTPException(status_code=404, detail="Product image not found")
        changes = update.model_dump(exclude_unset=True)
        if changes.get("is_primary") is True:
            current_primary = (
                await session.scalars(
                    select(ProductImage)
                    .where(
                        ProductImage.product_id == product_id,
                        ProductImage.is_primary.is_(True),
                    )
                    .with_for_update()
                )
            ).all()
            for item in current_primary:
                item.is_primary = False
            await session.flush()
        for field, value in changes.items():
            if value is not None:
                setattr(product_image, field, value)
        await session.flush()
        await session.refresh(product_image)
    return product_image


@router.delete(
    "/admin/products/{product_id}/images/{image_id}",
    status_code=204,
)
async def delete_product_image(
    product_id: uuid.UUID,
    image_id: uuid.UUID,
    request: Request,
    session: SessionDep,
    _: AdminDep,
) -> Response:
    verify_admin_origin(request)
    async with session.begin():
        product = await session.scalar(
            select(Product).where(Product.id == product_id).with_for_update()
        )
        if product is None:
            raise HTTPException(status_code=404, detail="Product not found")
        product_image = await session.scalar(
            select(ProductImage)
            .where(
                ProductImage.id == image_id,
                ProductImage.product_id == product_id,
            )
            .with_for_update()
        )
        if product_image is None:
            raise HTTPException(status_code=404, detail="Product image not found")
        stored_path = product_image_path(product_image.storage_key)
        promote_next = product_image.is_primary
        await session.delete(product_image)
        await session.flush()
        if promote_next:
            next_image = await session.scalar(
                select(ProductImage)
                .where(ProductImage.product_id == product_id)
                .order_by(ProductImage.sort_order, ProductImage.created_at)
                .limit(1)
                .with_for_update()
            )
            if next_image is not None:
                next_image.is_primary = True
    try:
        stored_path.unlink(missing_ok=True)
    except OSError as exc:
        logger.exception("Could not remove product image file %s", image_id)
        raise HTTPException(status_code=500, detail="Image record deleted but stored file cleanup failed") from exc
    return Response(status_code=204)


@router.get("/catalog/product-images/{image_id}")
async def serve_product_image(
    image_id: uuid.UUID,
    session: SessionDep,
) -> FileResponse:
    image = await session.scalar(
        select(ProductImage).where(
            ProductImage.id == image_id,
            ProductImage.is_active.is_(True),
        )
    )
    if image is None:
        raise HTTPException(status_code=404, detail="Product image not found")
    path = product_image_path(image.storage_key)
    if not path.is_file():
        logger.error("Product image storage object is missing: %s", image_id)
        raise HTTPException(status_code=404, detail="Product image is unavailable")
    return FileResponse(
        path,
        media_type=image.content_type,
        headers={
            "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
            "X-Content-Type-Options": "nosniff",
        },
    )
