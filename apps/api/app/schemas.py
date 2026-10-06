import uuid
import re
from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

from app.whatsapp import normalize_whatsapp_recipient


class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    slug: str
    translations: dict[str, str]


class ProductVariantOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    sku: str
    translations: dict[str, str]


class ProductOptionValueOut(BaseModel):
    value: str
    labels: dict[str, str]


class ProductOptionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    code: str
    translations: dict[str, str]
    values: list[ProductOptionValueOut]
    is_required: bool


class ProductImageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    url: str
    content_type: Literal["image/jpeg", "image/png", "image/webp"]
    size_bytes: int
    alt_texts: dict[str, str]
    sort_order: int
    is_primary: bool


class ProductOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    slug: str
    translations: dict[str, str]
    descriptions: dict[str, str]
    category: CategoryOut
    variants: list[ProductVariantOut]
    options: list[ProductOptionOut]
    images: list[ProductImageOut]


class AdminProductImageUpdateIn(BaseModel):
    alt_texts: dict[str, str] | None = Field(default=None, max_length=3)
    sort_order: int | None = Field(default=None, ge=0, le=10_000)
    is_primary: bool | None = None

    @field_validator("alt_texts")
    @classmethod
    def validate_alt_texts(cls, value: dict[str, str] | None) -> dict[str, str] | None:
        if value is None:
            return None
        if any(locale not in {"fr", "ar", "en"} for locale in value):
            raise ValueError("Image descriptions may only use fr, ar or en")
        if any(len(text) > 300 for text in value.values()):
            raise ValueError("Image descriptions must not exceed 300 characters")
        return value


class PriceCheckIn(BaseModel):
    variant_id: uuid.UUID
    quantity: int = Field(ge=1, le=100_000)
    options: dict[str, str] = Field(default_factory=dict, max_length=20)


class PriceCheckOut(BaseModel):
    status: Literal["priced", "quote_required"]
    total_price: Decimal | None = None
    currency: Literal["TND"] = "TND"


class CustomerIn(BaseModel):
    full_name: str = Field(min_length=2, max_length=160)
    phone: str = Field(min_length=7, max_length=40)
    email: EmailStr | None = None
    locale: Literal["fr", "ar", "en"] = "fr"
    whatsapp_opt_in: bool = False

    @field_validator("full_name", "phone")
    @classmethod
    def strip_contact_fields(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("This field must not be blank")
        return normalized

    @field_validator("phone")
    @classmethod
    def validate_phone_characters(cls, value: str) -> str:
        if re.fullmatch(r"\+?[0-9][0-9\s().-]{5,38}", value) is None:
            raise ValueError("Enter a valid phone number")
        return value

    @model_validator(mode="after")
    def validate_whatsapp_consent(self) -> "CustomerIn":
        if self.whatsapp_opt_in:
            normalize_whatsapp_recipient(self.phone)
        return self


def validate_delivery_address(value: str | None) -> str | None:
    if value is not None:
        normalized = value.strip()
        if len(normalized) < 10:
            raise ValueError("A delivery address must contain at least 10 characters")
        return normalized
    return None


class QuoteRequestIn(PriceCheckIn):
    product_id: uuid.UUID
    customer: CustomerIn
    file_ids: list[uuid.UUID] = Field(default_factory=list, max_length=5)
    fulfillment_method: Literal["pickup", "delivery"] = "pickup"
    delivery_address: str | None = Field(default=None, max_length=1000)
    notes: str | None = Field(default=None, max_length=2000)

    @field_validator("delivery_address")
    @classmethod
    def validate_address(cls, value: str | None) -> str | None:
        return validate_delivery_address(value)


class OrderCreateIn(QuoteRequestIn):
    file_ids: list[uuid.UUID] = Field(min_length=1, max_length=5)
    payment_method: Literal["cash_on_fulfillment"] = "cash_on_fulfillment"


class QuoteRequestOut(BaseModel):
    reference: str
    status: Literal["pending"]
    created_at: datetime


class OrderOut(BaseModel):
    reference: str
    status: Literal["pending_review"]
    total_amount: Decimal
    currency: Literal["TND"]
    payment_method: Literal["cash_on_fulfillment"]
    fulfillment_method: Literal["pickup", "delivery"]
    created_at: datetime


class UploadedFileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    original_filename: str
    content_type: str
    size_bytes: int
    review_status: Literal["pending", "approved", "rejected"]


class AdminLoginIn(BaseModel):
    username: str = Field(min_length=1, max_length=80)
    password: str = Field(min_length=12, max_length=256)


class AdminSessionOut(BaseModel):
    username: str


class AdminQuoteOut(BaseModel):
    id: uuid.UUID
    reference: str
    status: Literal["pending", "quoted", "accepted", "declined"]
    product_name: str
    variant_name: str
    quantity: int
    selected_options: dict[str, str]
    fulfillment_method: Literal["pickup", "delivery"]
    delivery_address: str | None
    notes: str | None
    quoted_amount: Decimal | None
    created_at: datetime
    customer_name: str
    customer_phone: str
    customer_email: str | None
    files: list[UploadedFileOut]


class AdminQuoteUpdateIn(BaseModel):
    status: Literal["quoted", "declined"]
    quoted_amount: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=3)


class AdminOrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    product_name: str
    variant_name: str
    quantity: int
    selected_options: dict[str, str]
    line_total: Decimal
    files: list[UploadedFileOut]


class AdminOrderOut(BaseModel):
    id: uuid.UUID
    reference: str
    status: Literal["pending_review", "confirmed", "in_production", "ready", "completed", "cancelled"]
    fulfillment_method: Literal["pickup", "delivery"]
    delivery_address: str | None
    payment_method: Literal["cash_on_fulfillment"]
    total_amount: Decimal
    currency: Literal["TND"]
    created_at: datetime
    customer_name: str
    customer_phone: str
    customer_email: str | None
    items: list[AdminOrderItemOut]


class AdminOrderStatusIn(BaseModel):
    status: Literal["confirmed", "in_production", "ready", "completed", "cancelled"]


class AdminPriceTierIn(BaseModel):
    product_id: uuid.UUID
    variant_id: uuid.UUID
    option_values: dict[str, str] = Field(default_factory=dict, max_length=20)
    quantity_min: int = Field(ge=1, le=100_000)
    quantity_max: int = Field(ge=1, le=100_000)
    total_price: Decimal = Field(ge=0, max_digits=12, decimal_places=3)

    @field_validator("quantity_max")
    @classmethod
    def validate_quantity_range(cls, value: int, info) -> int:
        quantity_min = info.data.get("quantity_min")
        if quantity_min is not None and value < quantity_min:
            raise ValueError("Maximum quantity must be greater than or equal to minimum quantity")
        return value


class AdminPriceTierOut(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    product_name: str
    variant_id: uuid.UUID
    variant_name: str
    option_values: dict[str, str]
    quantity_min: int
    quantity_max: int
    total_price: Decimal
    currency: Literal["TND"]
    is_active: bool


class AdminOverviewOut(BaseModel):
    pending_quotes: int
    quoted_requests: int
    orders_to_review: int
    orders_in_production: int
    orders_ready: int
    whatsapp_pending: int
    whatsapp_failed: int


class AdminNotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    event_type: str
    reference: str
    status: Literal["pending", "processing", "sent", "failed"]
    attempts: int
    last_error: str | None
    created_at: datetime
    sent_at: datetime | None
