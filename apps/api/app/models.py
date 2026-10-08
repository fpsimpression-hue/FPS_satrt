import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    JSON,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    Uuid,
    func,
    text,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    type_annotation_map = {
        dict[str, str]: JSON,
    }


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    translations: Mapped[dict[str, str]] = mapped_column(JSON, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    products: Mapped[list["Product"]] = relationship(back_populates="category")


class Product(Base):
    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    category_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("categories.id", ondelete="RESTRICT"))
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    translations: Mapped[dict[str, str]] = mapped_column(JSON, nullable=False)
    descriptions: Mapped[dict[str, str]] = mapped_column(JSON, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    category: Mapped[Category] = relationship(back_populates="products")
    variants: Mapped[list["ProductVariant"]] = relationship(
        back_populates="product", cascade="all, delete-orphan", order_by="ProductVariant.sku"
    )
    options: Mapped[list["ProductOption"]] = relationship(
        back_populates="product", cascade="all, delete-orphan", order_by="ProductOption.sort_order"
    )
    images: Mapped[list["ProductImage"]] = relationship(
        back_populates="product",
        cascade="all, delete-orphan",
        order_by="ProductImage.sort_order",
    )
    price_tiers: Mapped[list["PriceTier"]] = relationship(
        back_populates="product", cascade="all, delete-orphan"
    )


class ProductVariant(Base):
    __tablename__ = "product_variants"
    __table_args__ = (UniqueConstraint("product_id", "sku", name="uq_variant_product_sku"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    product_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"))
    sku: Mapped[str] = mapped_column(String(80), nullable=False)
    translations: Mapped[dict[str, str]] = mapped_column(JSON, nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    product: Mapped[Product] = relationship(back_populates="variants")
    price_tiers: Mapped[list["PriceTier"]] = relationship(back_populates="variant")


class ProductOption(Base):
    __tablename__ = "product_options"
    __table_args__ = (UniqueConstraint("product_id", "code", name="uq_option_product_code"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    product_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"))
    code: Mapped[str] = mapped_column(String(80), nullable=False)
    translations: Mapped[dict[str, str]] = mapped_column(JSON, nullable=False)
    values: Mapped[list[dict[str, object]]] = mapped_column(JSON, nullable=False)
    is_required: Mapped[bool] = mapped_column(default=True, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    product: Mapped[Product] = relationship(back_populates="options")


class ProductImage(Base):
    __tablename__ = "product_images"
    __table_args__ = (
        CheckConstraint("size_bytes > 0", name="ck_product_image_size_positive"),
        CheckConstraint("sort_order >= 0", name="ck_product_image_sort_order"),
        CheckConstraint(
            "content_type IN ('image/jpeg', 'image/png', 'image/webp')",
            name="ck_product_image_content_type",
        ),
        Index("ix_product_images_product_order", "product_id", "is_active", "sort_order"),
        Index(
            "uq_product_image_primary",
            "product_id",
            unique=True,
            postgresql_where=text("is_primary"),
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    product_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"), nullable=False
    )
    storage_key: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    content_type: Mapped[str] = mapped_column(String(32), nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    sha256: Mapped[str] = mapped_column(String(64), nullable=False)
    alt_texts: Mapped[dict[str, str]] = mapped_column(JSON, default=dict, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_primary: Mapped[bool] = mapped_column(default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    product: Mapped[Product] = relationship(back_populates="images")

    @property
    def url(self) -> str:
        return f"/api/v1/catalog/product-images/{self.id}"


class PriceTier(Base):
    __tablename__ = "price_tiers"
    __table_args__ = (
        CheckConstraint("quantity_min > 0", name="ck_price_quantity_min_positive"),
        CheckConstraint("quantity_max >= quantity_min", name="ck_price_quantity_range"),
        CheckConstraint("total_price >= 0", name="ck_price_total_nonnegative"),
        CheckConstraint("currency = 'TND'", name="ck_price_currency_tnd"),
        Index("ix_price_tier_lookup", "product_id", "variant_id", "quantity_min", "quantity_max"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    product_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"))
    variant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("product_variants.id", ondelete="CASCADE"))
    option_values: Mapped[dict[str, str]] = mapped_column(JSON, default=dict, nullable=False)
    quantity_min: Mapped[int] = mapped_column(Integer, nullable=False)
    quantity_max: Mapped[int] = mapped_column(Integer, nullable=False)
    total_price: Mapped[Decimal] = mapped_column(Numeric(12, 3), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="TND", nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    product: Mapped[Product] = relationship(back_populates="price_tiers")
    variant: Mapped[ProductVariant] = relationship(back_populates="price_tiers")


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    full_name: Mapped[str] = mapped_column(String(160), nullable=False)
    phone: Mapped[str] = mapped_column(String(40), index=True, nullable=False)
    email: Mapped[str | None] = mapped_column(String(254))
    locale: Mapped[str] = mapped_column(
        String(2), default="fr", server_default=text("'fr'"), nullable=False
    )
    whatsapp_opt_in: Mapped[bool] = mapped_column(
        default=False, server_default=text("false"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    orders: Mapped[list["Order"]] = relationship(back_populates="customer")
    quote_requests: Mapped[list["QuoteRequest"]] = relationship(back_populates="customer")


class NotificationOutbox(Base):
    __tablename__ = "notification_outbox"
    __table_args__ = (
        CheckConstraint(
            "status IN ('pending', 'processing', 'sent', 'failed')",
            name="ck_notification_outbox_status",
        ),
        CheckConstraint("attempts >= 0", name="ck_notification_outbox_attempts"),
        UniqueConstraint("dedupe_key", name="uq_notification_outbox_dedupe"),
        Index("ix_notification_outbox_delivery", "status", "next_attempt_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    dedupe_key: Mapped[str] = mapped_column(String(200), nullable=False)
    event_type: Mapped[str] = mapped_column(String(40), nullable=False)
    reference: Mapped[str] = mapped_column(String(20), nullable=False)
    recipient: Mapped[str] = mapped_column(String(20), nullable=False)
    locale: Mapped[str] = mapped_column(String(2), nullable=False)
    parameters: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    status: Mapped[str] = mapped_column(String(16), default="pending", nullable=False)
    attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    next_attempt_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    locked_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_error: Mapped[str | None] = mapped_column(String(300))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class QuoteRequest(Base):
    __tablename__ = "quote_requests"
    __table_args__ = (
        CheckConstraint(
            "status IN ('pending', 'quoted', 'accepted', 'declined')",
            name="ck_quote_request_status",
        ),
        CheckConstraint(
            "(fulfillment_method = 'pickup' AND delivery_address IS NULL) OR "
            "(fulfillment_method = 'delivery' AND delivery_address IS NOT NULL)",
            name="ck_quote_request_fulfillment_address",
        ),
        CheckConstraint(
            "status <> 'quoted' OR quoted_amount IS NOT NULL",
            name="ck_quote_request_quoted_amount",
        ),
        CheckConstraint(
            "quoted_amount IS NULL OR quoted_amount >= 0",
            name="ck_quote_request_amount_nonnegative",
        ),
        CheckConstraint(
            "(product_id IS NOT NULL AND variant_id IS NOT NULL) OR project_category IS NOT NULL",
            name="ck_quote_request_subject",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    reference: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    customer_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("customers.id", ondelete="RESTRICT"))
    # A quote targets either a catalogue product/variant or a custom project category.
    product_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("products.id", ondelete="RESTRICT"))
    variant_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("product_variants.id", ondelete="RESTRICT"))
    project_category: Mapped[str | None] = mapped_column(String(40))
    dimensions: Mapped[str | None] = mapped_column(String(200))
    desired_date: Mapped[date | None] = mapped_column(Date)
    design_help: Mapped[bool] = mapped_column(
        default=False, server_default=text("false"), nullable=False
    )
    product_name: Mapped[str] = mapped_column(String(180), nullable=False)
    variant_name: Mapped[str] = mapped_column(String(180), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    selected_options: Mapped[dict[str, str]] = mapped_column(JSON, default=dict, nullable=False)
    fulfillment_method: Mapped[str] = mapped_column(String(16), default="pickup", nullable=False)
    delivery_address: Mapped[str | None] = mapped_column(Text)
    notes: Mapped[str | None] = mapped_column(Text)
    quoted_amount: Mapped[Decimal | None] = mapped_column(Numeric(12, 3))
    status: Mapped[str] = mapped_column(String(24), default="pending", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    customer: Mapped[Customer] = relationship(back_populates="quote_requests")
    files: Mapped[list["UploadedFile"]] = relationship(back_populates="quote_request")


class Order(Base):
    __tablename__ = "orders"
    __table_args__ = (
        CheckConstraint(
            "status IN ('pending_review', 'confirmed', 'in_production', 'ready', 'completed', 'cancelled')",
            name="ck_order_status",
        ),
        CheckConstraint("fulfillment_method IN ('pickup', 'delivery')", name="ck_order_fulfillment"),
        CheckConstraint("payment_method = 'cash_on_fulfillment'", name="ck_order_payment_method"),
        CheckConstraint("total_amount >= 0", name="ck_order_total_nonnegative"),
        CheckConstraint("currency = 'TND'", name="ck_order_currency_tnd"),
        CheckConstraint(
            "(fulfillment_method = 'pickup' AND delivery_address IS NULL) OR "
            "(fulfillment_method = 'delivery' AND delivery_address IS NOT NULL)",
            name="ck_order_fulfillment_address",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    reference: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    customer_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("customers.id", ondelete="RESTRICT"))
    status: Mapped[str] = mapped_column(String(24), default="pending_review", nullable=False)
    fulfillment_method: Mapped[str] = mapped_column(String(16), nullable=False)
    delivery_address: Mapped[str | None] = mapped_column(Text)
    payment_method: Mapped[str] = mapped_column(String(32), default="cash_on_fulfillment", nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 3), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="TND", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    customer: Mapped[Customer] = relationship(back_populates="orders")
    items: Mapped[list["OrderItem"]] = relationship(back_populates="order", cascade="all, delete-orphan")
    files: Mapped[list["UploadedFile"]] = relationship(back_populates="order")


class OrderItem(Base):
    __tablename__ = "order_items"
    __table_args__ = (
        CheckConstraint("quantity > 0", name="ck_order_item_quantity_positive"),
        CheckConstraint("line_total >= 0", name="ck_order_item_total_nonnegative"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    order_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"))
    # Empty for custom projects converted from a quote; product_name keeps the label.
    product_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("products.id", ondelete="RESTRICT"))
    variant_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("product_variants.id", ondelete="RESTRICT"))
    product_name: Mapped[str] = mapped_column(String(180), nullable=False)
    variant_name: Mapped[str] = mapped_column(String(180), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    selected_options: Mapped[dict[str, str]] = mapped_column(JSON, default=dict, nullable=False)
    line_total: Mapped[Decimal] = mapped_column(Numeric(12, 3), nullable=False)
    order: Mapped[Order] = relationship(back_populates="items")
    files: Mapped[list["UploadedFile"]] = relationship(back_populates="order_item")


class UploadedFile(Base):
    __tablename__ = "uploaded_files"
    __table_args__ = (
        CheckConstraint("size_bytes > 0", name="ck_file_size_positive"),
        CheckConstraint("review_status IN ('pending', 'approved', 'rejected')", name="ck_file_review_status"),
        CheckConstraint("NOT (order_id IS NOT NULL AND quote_request_id IS NOT NULL)", name="ck_file_single_owner"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    storage_key: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    content_type: Mapped[str] = mapped_column(String(100), nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    sha256: Mapped[str] = mapped_column(String(64), nullable=False)
    review_status: Mapped[str] = mapped_column(String(16), default="pending", nullable=False)
    order_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"))
    order_item_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("order_items.id", ondelete="SET NULL"))
    quote_request_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("quote_requests.id", ondelete="CASCADE"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    order: Mapped[Order | None] = relationship(back_populates="files")
    order_item: Mapped[OrderItem | None] = relationship(back_populates="files")
    quote_request: Mapped[QuoteRequest | None] = relationship(back_populates="files")
