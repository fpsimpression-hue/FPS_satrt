import logging
from dataclasses import dataclass
from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Category, PriceTier, Product, ProductVariant

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class ResolvedPrice:
    product: Product
    variant: ProductVariant
    total_price: Decimal | None


async def load_product(
    session: AsyncSession, product_id: UUID, variant_id: UUID
) -> tuple[Product, ProductVariant]:
    product = await session.scalar(
        select(Product)
        .join(Product.category)
        .where(Product.id == product_id, Product.is_active.is_(True))
        .where(Category.is_active.is_(True))
        .options(selectinload(Product.category), selectinload(Product.options))
    )
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")

    variant = await session.scalar(
        select(ProductVariant).where(
            ProductVariant.id == variant_id,
            ProductVariant.product_id == product.id,
            ProductVariant.is_active.is_(True),
        )
    )
    if variant is None:
        raise HTTPException(status_code=422, detail="The selected variant is unavailable")
    return product, variant


def validate_options(product: Product, options: dict[str, str]) -> None:
    known_codes = {option.code for option in product.options}
    unknown_codes = options.keys() - known_codes
    if unknown_codes:
        raise HTTPException(status_code=422, detail="One or more selected options are invalid")

    for option in product.options:
        value = options.get(option.code)
        if value is None:
            if option.is_required:
                raise HTTPException(
                    status_code=422,
                    detail=f"Option '{option.code}' is required",
                )
            continue
        allowed_values = {
            str(item["value"])
            for item in option.values
            if isinstance(item, dict) and "value" in item
        }
        if value not in allowed_values:
            raise HTTPException(
                status_code=422,
                detail=f"Invalid value for option '{option.code}'",
            )


async def resolve_price(
    session: AsyncSession,
    product_id: UUID,
    variant_id: UUID,
    quantity: int,
    options: dict[str, str],
) -> ResolvedPrice:
    product, variant = await load_product(session, product_id, variant_id)
    validate_options(product, options)
    tiers = (
        await session.scalars(
            select(PriceTier).where(
                PriceTier.product_id == product.id,
                PriceTier.variant_id == variant.id,
                PriceTier.is_active.is_(True),
                PriceTier.quantity_min <= quantity,
                PriceTier.quantity_max >= quantity,
            )
        )
    ).all()
    matching_tiers = [tier for tier in tiers if tier.option_values == options]

    if len(matching_tiers) > 1:
        logger.error(
            "Overlapping price tiers for product=%s variant=%s quantity=%s options=%s",
            product.id,
            variant.id,
            quantity,
            options,
        )
        raise HTTPException(status_code=500, detail="Pricing configuration needs review")

    return ResolvedPrice(
        product=product,
        variant=variant,
        total_price=matching_tiers[0].total_price if matching_tiers else None,
    )
