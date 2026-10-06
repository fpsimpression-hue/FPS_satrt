import hashlib
import os
import re
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile

from app.settings import settings

MAX_PRODUCT_IMAGE_BYTES = 8 * 1024 * 1024
IMAGE_SIGNATURES: dict[str, tuple[str, bytes, bytes]] = {
    ".jpg": ("image/jpeg", b"\xff\xd8\xff", b""),
    ".jpeg": ("image/jpeg", b"\xff\xd8\xff", b""),
    ".png": ("image/png", b"\x89PNG\r\n\x1a\n", b""),
    ".webp": ("image/webp", b"RIFF", b"WEBP"),
}
SAFE_IMAGE_FILENAME = re.compile(r"[^A-Za-z0-9._ -]")


def product_image_path(storage_key: str) -> Path:
    root = Path(settings.product_image_storage_path).resolve()
    path = (root / storage_key).resolve()
    if path.parent != root:
        raise ValueError("Product image storage key is outside the configured media directory")
    return path


async def store_product_image(upload: UploadFile) -> tuple[str, int, str, str]:
    filename = (upload.filename or "").replace("\\", "/").rsplit("/", maxsplit=1)[-1]
    safe_filename = SAFE_IMAGE_FILENAME.sub("_", filename).strip(" .")[:255]
    extension = Path(safe_filename).suffix.lower()
    signature = IMAGE_SIGNATURES.get(extension)
    if signature is None:
        await upload.close()
        raise HTTPException(status_code=415, detail="Use a JPEG, PNG or WebP product image")

    content_type, prefix, suffix = signature
    file_id = uuid.uuid4()
    storage_key = f"{file_id.hex}{extension}"
    path = product_image_path(storage_key)
    temporary_path = path.with_suffix(".tmp")
    digest = hashlib.sha256()
    header = bytearray()
    total_size = 0

    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        with temporary_path.open("xb") as stored_file:
            while chunk := await upload.read(1024 * 1024):
                total_size += len(chunk)
                if total_size > MAX_PRODUCT_IMAGE_BYTES:
                    raise HTTPException(
                        status_code=413,
                        detail="Product images must not exceed 8 MB",
                    )
                if len(header) < 12:
                    header.extend(chunk[: 12 - len(header)])
                digest.update(chunk)
                stored_file.write(chunk)

        content_matches = bytes(header).startswith(prefix) and (
            not suffix or bytes(header[8:12]) == suffix
        )
        if total_size == 0 or not content_matches:
            raise HTTPException(
                status_code=415,
                detail="Image content does not match its JPEG, PNG or WebP extension",
            )
        os.replace(temporary_path, path)
    except BaseException:
        temporary_path.unlink(missing_ok=True)
        raise
    finally:
        await upload.close()

    return storage_key, total_size, digest.hexdigest(), content_type
