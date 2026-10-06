import asyncio
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import engine, session_factory
from app.models import Category, Product, ProductOption, ProductVariant

CATALOG = [
    {
        "category": {
            "slug": "cartes-papeterie",
            "sort_order": 1,
            "translations": {
                "fr": "Cartes & papeterie",
                "ar": "بطاقات وقرطاسية",
                "en": "Cards & stationery",
            },
        },
        "product": {
            "slug": "cartes-de-visite",
            "sort_order": 1,
            "translations": {
                "fr": "Cartes de visite",
                "ar": "بطاقات عمل",
                "en": "Business cards",
            },
            "descriptions": {
                "fr": "Des cartes de visite imprimées selon vos choix.",
                "ar": "بطاقات عمل مطبوعة حسب اختياراتكم.",
                "en": "Business cards printed to your specifications.",
            },
            "variant": {
                "sku": "CARD-STANDARD",
                "translations": {
                    "fr": "Format standard",
                    "ar": "حجم قياسي",
                    "en": "Standard size",
                },
            },
            "options": [
                {
                    "code": "paper",
                    "translations": {"fr": "Papier", "ar": "الورق", "en": "Paper"},
                    "values": [
                        {
                            "value": "mat",
                            "labels": {"fr": "Mat", "ar": "مطفي", "en": "Matte"},
                        },
                        {
                            "value": "brillant",
                            "labels": {"fr": "Brillant", "ar": "لامع", "en": "Glossy"},
                        },
                    ],
                    "is_required": True,
                }
            ],
        },
    },
    {
        "category": {
            "slug": "flyers-brochures",
            "sort_order": 2,
            "translations": {
                "fr": "Flyers & brochures",
                "ar": "منشورات وكتيّبات",
                "en": "Flyers & brochures",
            },
        },
        "product": {
            "slug": "flyers",
            "sort_order": 1,
            "translations": {"fr": "Flyers", "ar": "منشورات", "en": "Flyers"},
            "descriptions": {
                "fr": "Des flyers personnalisés pour vos événements et votre activité.",
                "ar": "منشورات مخصّصة لفعالياتكم وأنشطتكم.",
                "en": "Custom flyers for your events and business.",
            },
            "variant": {
                "sku": "FLYER-A5",
                "translations": {"fr": "Format A5", "ar": "حجم A5", "en": "A5 size"},
            },
            "options": [
                {
                    "code": "sides",
                    "translations": {"fr": "Impression", "ar": "الطباعة", "en": "Printing"},
                    "values": [
                        {"value": "recto", "labels": {"fr": "Recto", "ar": "وجه واحد", "en": "Single-sided"}},
                        {"value": "recto-verso", "labels": {"fr": "Recto-verso", "ar": "وجهان", "en": "Double-sided"}},
                    ],
                    "is_required": True,
                }
            ],
        },
    },
    {
        "category": {
            "slug": "affiches-signaletique",
            "sort_order": 3,
            "translations": {
                "fr": "Affiches & signalétique",
                "ar": "ملصقات ولافتات",
                "en": "Posters & signage",
            },
        },
        "product": {
            "slug": "affiches",
            "sort_order": 1,
            "translations": {"fr": "Affiches", "ar": "ملصقات", "en": "Posters"},
            "descriptions": {
                "fr": "Des affiches personnalisées pour vos campagnes et événements.",
                "ar": "ملصقات مخصّصة لحملاتكم وفعالياتكم.",
                "en": "Custom posters for your campaigns and events.",
            },
            "variant": {
                "sku": "POSTER-A3",
                "translations": {"fr": "Format A3", "ar": "حجم A3", "en": "A3 size"},
            },
            "options": [],
        },
    },
    {
        "category": {
            "slug": "textile-personnalise",
            "sort_order": 4,
            "translations": {
                "fr": "Textile personnalisé",
                "ar": "ملابس مخصّصة",
                "en": "Custom apparel",
            },
        },
        "product": {
            "slug": "t-shirt-personnalise",
            "sort_order": 1,
            "translations": {
                "fr": "T-shirt personnalisé",
                "ar": "قميص مخصّص",
                "en": "Custom t-shirt",
            },
            "descriptions": {
                "fr": "Un t-shirt personnalisé avec votre visuel.",
                "ar": "قميص مخصّص بتصميمكم.",
                "en": "A custom t-shirt featuring your design.",
            },
            "variant": {
                "sku": "TSHIRT-CLASSIC",
                "translations": {
                    "fr": "T-shirt classique",
                    "ar": "قميص كلاسيكي",
                    "en": "Classic t-shirt",
                },
            },
            "options": [
                {
                    "code": "size",
                    "translations": {"fr": "Taille", "ar": "المقاس", "en": "Size"},
                    "values": [
                        {"value": "s", "labels": {"fr": "S", "ar": "S", "en": "S"}},
                        {"value": "m", "labels": {"fr": "M", "ar": "M", "en": "M"}},
                        {"value": "l", "labels": {"fr": "L", "ar": "L", "en": "L"}},
                        {"value": "xl", "labels": {"fr": "XL", "ar": "XL", "en": "XL"}},
                    ],
                    "is_required": True,
                }
            ],
        },
    },
    {
        "category": {
            "slug": "objets-personnalises",
            "sort_order": 5,
            "translations": {
                "fr": "Objets personnalisés",
                "ar": "هدايا مخصّصة",
                "en": "Personalised gifts",
            },
        },
        "product": {
            "slug": "mug-personnalise",
            "sort_order": 1,
            "translations": {
                "fr": "Mug personnalisé",
                "ar": "كوب مخصّص",
                "en": "Custom mug",
            },
            "descriptions": {
                "fr": "Un mug personnalisé pour offrir ou se faire plaisir.",
                "ar": "كوب مخصّص كهدية أو للاستخدام الشخصي.",
                "en": "A custom mug to gift or enjoy yourself.",
            },
            "variant": {
                "sku": "MUG-CLASSIC",
                "translations": {
                    "fr": "Mug classique",
                    "ar": "كوب كلاسيكي",
                    "en": "Classic mug",
                },
            },
            "options": [],
        },
    },
    {
        "category": {
            "slug": "grand-format",
            "sort_order": 6,
            "translations": {
                "fr": "Impression grand format",
                "ar": "طباعة كبيرة الحجم",
                "en": "Large format",
            },
        },
        "product": {
            "slug": "banderole",
            "sort_order": 1,
            "translations": {"fr": "Banderole", "ar": "لافتة", "en": "Banner"},
            "descriptions": {
                "fr": "Une banderole grand format pour vos événements.",
                "ar": "لافتة كبيرة الحجم لفعالياتكم.",
                "en": "A large-format banner for your events.",
            },
            "variant": {
                "sku": "BANNER-STANDARD",
                "translations": {
                    "fr": "Format à confirmer",
                    "ar": "يُحدّد الحجم",
                    "en": "Size to be confirmed",
                },
            },
            "options": [],
        },
    },
]


async def seed_catalog(session: AsyncSession) -> None:
    for entry in CATALOG:
        category_data = entry["category"]
        product_data = entry["product"]
        category = await session.scalar(
            select(Category).where(Category.slug == category_data["slug"])
        )
        if category is None:
            category = Category(
                id=uuid.uuid5(uuid.NAMESPACE_URL, f"fast-print/category/{category_data['slug']}"),
                **category_data,
            )
            session.add(category)

        product = await session.scalar(
            select(Product).where(Product.slug == product_data["slug"])
        )
        if product is not None:
            continue

        variant_data = product_data["variant"]
        options_data = product_data["options"]
        product = Product(
            id=uuid.uuid5(uuid.NAMESPACE_URL, f"fast-print/product/{product_data['slug']}"),
            category=category,
            slug=product_data["slug"],
            translations=product_data["translations"],
            descriptions=product_data["descriptions"],
            sort_order=product_data["sort_order"],
            variants=[
                ProductVariant(
                    id=uuid.uuid5(uuid.NAMESPACE_URL, f"fast-print/variant/{variant_data['sku']}"),
                    **variant_data,
                )
            ],
            options=[
                ProductOption(
                    id=uuid.uuid5(
                        uuid.NAMESPACE_URL,
                        f"fast-print/option/{product_data['slug']}/{option['code']}",
                    ),
                    sort_order=index,
                    **option,
                )
                for index, option in enumerate(options_data)
            ],
        )
        session.add(product)
    await session.commit()


async def main() -> None:
    async with session_factory() as session:
        await seed_catalog(session)
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
