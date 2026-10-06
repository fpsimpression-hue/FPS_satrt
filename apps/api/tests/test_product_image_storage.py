import asyncio
from io import BytesIO

import pytest
from fastapi import HTTPException, UploadFile

from app.product_image_storage import (
    MAX_PRODUCT_IMAGE_BYTES,
    product_image_path,
    store_product_image,
)
from app.schemas import AdminProductImageUpdateIn, ProductImageOut
from app.settings import settings


@pytest.mark.parametrize(
    ("filename", "content_type", "content"),
    [
        ("preview.jpg", "image/jpeg", b"\xff\xd8\xffvalid-jpeg"),
        ("preview.png", "image/png", b"\x89PNG\r\n\x1a\nvalid-png"),
        ("preview.webp", "image/webp", b"RIFF\x00\x00\x00\x00WEBPvalid-webp"),
    ],
)
def test_stores_supported_catalogue_images(
    tmp_path,
    monkeypatch,
    filename: str,
    content_type: str,
    content: bytes,
) -> None:
    monkeypatch.setattr(settings, "product_image_storage_path", str(tmp_path))

    async def store():
        return await store_product_image(
            UploadFile(filename=filename, file=BytesIO(content))
        )

    storage_key, size_bytes, sha256, actual_content_type = asyncio.run(store())
    stored_path = product_image_path(storage_key)
    assert stored_path.is_file()
    assert stored_path.read_bytes() == content
    assert size_bytes == len(content)
    assert len(sha256) == 64
    assert actual_content_type == content_type
    assert stored_path.parent == tmp_path


def test_rejects_mismatched_signature_and_cleans_temporary_file(tmp_path, monkeypatch) -> None:
    monkeypatch.setattr(settings, "product_image_storage_path", str(tmp_path))

    async def store():
        await store_product_image(
            UploadFile(filename="not-an-image.png", file=BytesIO(b"not a png"))
        )

    with pytest.raises(HTTPException) as error:
        asyncio.run(store())
    assert error.value.status_code == 415
    assert list(tmp_path.iterdir()) == []


def test_rejects_oversized_product_image(tmp_path, monkeypatch) -> None:
    monkeypatch.setattr(settings, "product_image_storage_path", str(tmp_path))
    content = b"\x89PNG\r\n\x1a\n" + (b"x" * MAX_PRODUCT_IMAGE_BYTES)

    async def store():
        await store_product_image(
            UploadFile(filename="large.png", file=BytesIO(content))
        )

    with pytest.raises(HTTPException) as error:
        asyncio.run(store())
    assert error.value.status_code == 413
    assert list(tmp_path.iterdir()) == []


def test_rejects_invalid_localized_alt_text() -> None:
    with pytest.raises(ValueError):
        AdminProductImageUpdateIn(alt_texts={"de": "Not a supported locale"})
    with pytest.raises(ValueError):
        AdminProductImageUpdateIn(alt_texts={"fr": "x" * 301})


def test_product_image_response_builds_stable_public_url() -> None:
    class ProductImageRecord:
        id = "d5b730f1-b7ae-4c18-b986-11c67e7cf21b"
        url = f"/api/v1/catalog/product-images/{id}"
        content_type = "image/png"
        size_bytes = 10
        alt_texts = {"fr": "Cartes", "ar": "بطاقات", "en": "Cards"}
        sort_order = 0
        is_primary = True

    output = ProductImageOut.model_validate(ProductImageRecord())
    assert output.url == (
        "/api/v1/catalog/product-images/d5b730f1-b7ae-4c18-b986-11c67e7cf21b"
    )


def test_admin_product_image_listing_requires_session() -> None:
    from fastapi.testclient import TestClient

    from app.main import app

    with TestClient(app) as client:
        response = client.get(
            "/api/v1/admin/products/d5b730f1-b7ae-4c18-b986-11c67e7cf21b/images"
        )
    assert response.status_code == 401
