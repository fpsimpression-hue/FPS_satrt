import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.catalog import resolve_price
from app.database import get_session
from app.models import Category, Product, ProductImage, ProductVariant
from app.schemas import CategoryOut, PriceCheckIn, PriceCheckOut, ProductOut

router = APIRouter(prefix="/catalog", tags=["catalog"])
SessionDep = Annotated[AsyncSession, Depends(get_session)]


@router.get("/categories", response_model=list[CategoryOut])
async def list_categories(session: SessionDep) -> list[Category]:
    return list(
        (
            await session.scalars(
                select(Category)
                .where(Category.is_active.is_(True))
                .order_by(Category.sort_order, Category.slug)
            )
        ).all()
    )


def product_query():
    return (
        select(Product)
        .join(Product.category)
        .where(Product.is_active.is_(True))
        .where(Category.is_active.is_(True))
        .options(
            selectinload(Product.category),
            selectinload(Product.variants.and_(ProductVariant.is_active.is_(True))),
            selectinload(Product.options),
            selectinload(Product.images.and_(ProductImage.is_active.is_(True))),
        )
    )


@router.get("/products", response_model=list[ProductOut])
async def list_products(
    session: SessionDep,
    category: Annotated[str | None, Query(max_length=100)] = None,
) -> list[Product]:
    query = product_query()
    if category is not None:
        query = query.where(Category.slug == category)
    return list(
        (
            await session.scalars(
                query.order_by(Category.sort_order, Product.sort_order, Product.slug)
            )
        ).all()
    )


@router.get("/products/{slug}", response_model=ProductOut)
async def get_product(slug: str, session: SessionDep) -> Product:
    product = await session.scalar(product_query().where(Product.slug == slug))
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("/products/{product_id}/price", response_model=PriceCheckOut)
async def check_price(
    product_id: uuid.UUID,
    request: PriceCheckIn,
    session: SessionDep,
) -> PriceCheckOut:
    resolved = await resolve_price(
        session,
        product_id,
        request.variant_id,
        request.quantity,
        request.options,
    )
    if resolved.total_price is None:
        return PriceCheckOut(status="quote_required")
    return PriceCheckOut(status="priced", total_price=resolved.total_price)
