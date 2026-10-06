import hashlib
import os
import re
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile

from app.settings import settings

MAX_UPLOAD_BYTES = settings.max_upload_size_bytes
ALLOWED_SIGNATURES: dict[str, tuple[str, bytes, bytes]] = {
    ".pdf": ("application/pdf", b"%PDF-", b""),
    ".png": ("image/png", b"\x89PNG\r\n\x1a\n", b""),
    ".jpg": ("image/jpeg", b"\xff\xd8\xff", b""),
    ".jpeg": ("image/jpeg", b"\xff\xd8\xff", b""),
    ".tif": ("image/tiff", b"II*\x00", b""),
    ".tiff": ("image/tiff", b"II*\x00", b""),
}
BIG_ENDIAN_TIFF = b"MM\x00*"
SAFE_FILENAME = re.compile(r"[^A-Za-z0-9._ -]")


def safe_original_filename(filename: str | None) -> tuple[str, str]:
    normalized = (filename or "").replace("\\", "/").rsplit("/", maxsplit=1)[-1]
    sanitized = SAFE_FILENAME.sub("_", normalized).strip(" .")[:255]
    suffix = Path(sanitized).suffix.lower()
    if not sanitized or suffix not in ALLOWED_SIGNATURES:
        raise HTTPException(
            status_code=415,
            detail="Only PDF, PNG, JPEG and TIFF print files are accepted",
        )
    return sanitized, suffix


async def store_upload(upload: UploadFile) -> tuple[str, str, int, str, str]:
    original_filename, extension = safe_original_filename(upload.filename)
    content_type, signature, _ = ALLOWED_SIGNATURES[extension]
    storage_root = Path(settings.file_storage_path)
    storage_root.mkdir(parents=True, exist_ok=True)
    file_id = uuid.uuid4()
    storage_key = f"{file_id.hex}{extension}"
    temporary_path = storage_root / f".{file_id.hex}.tmp"
    stored_path = storage_root / storage_key
    digest = hashlib.sha256()
    first_bytes = bytearray()
    total_size = 0

    try:
        with temporary_path.open("xb") as stored_file:
            while chunk := await upload.read(1024 * 1024):
                total_size += len(chunk)
                if total_size > MAX_UPLOAD_BYTES:
                    raise HTTPException(
                        status_code=413,
                        detail=f"Files must not exceed {MAX_UPLOAD_BYTES // (1024 * 1024)} MB",
                    )
                if len(first_bytes) < 8:
                    first_bytes.extend(chunk[: 8 - len(first_bytes)])
                digest.update(chunk)
                stored_file.write(chunk)

        accepted_signature = signature
        if extension in {".tif", ".tiff"} and bytes(first_bytes[:4]) == BIG_ENDIAN_TIFF:
            accepted_signature = BIG_ENDIAN_TIFF
        if total_size == 0 or not bytes(first_bytes).startswith(accepted_signature):
            raise HTTPException(status_code=415, detail="File content does not match its extension")
        os.replace(temporary_path, stored_path)
    except BaseException:
        temporary_path.unlink(missing_ok=True)
        raise
    finally:
        await upload.close()

    return storage_key, original_filename, total_size, digest.hexdigest(), content_type
