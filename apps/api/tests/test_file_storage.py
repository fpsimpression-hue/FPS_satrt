import io

import pytest
from fastapi import HTTPException, UploadFile
from starlette.datastructures import Headers

from app import file_storage


def make_upload(filename: str, content: bytes) -> UploadFile:
    return UploadFile(
        file=io.BytesIO(content),
        filename=filename,
        headers=Headers({"content-type": "application/octet-stream"}),
    )


@pytest.mark.anyio
async def test_stores_print_file_with_random_private_name(tmp_path, monkeypatch) -> None:
    monkeypatch.setattr(file_storage.settings, "file_storage_path", str(tmp_path))
    upload = make_upload("../../mon-logo.pdf", b"%PDF-1.7\nprint artwork")

    key, filename, size, digest, content_type = await file_storage.store_upload(upload)

    assert filename == "mon-logo.pdf"
    assert key.endswith(".pdf")
    assert "/" not in key and "\\" not in key
    assert size == len(b"%PDF-1.7\nprint artwork")
    assert len(digest) == 64
    assert content_type == "application/pdf"
    assert (tmp_path / key).read_bytes() == b"%PDF-1.7\nprint artwork"


@pytest.mark.anyio
async def test_rejects_file_with_mismatched_signature(tmp_path, monkeypatch) -> None:
    monkeypatch.setattr(file_storage.settings, "file_storage_path", str(tmp_path))

    with pytest.raises(HTTPException) as error:
        await file_storage.store_upload(make_upload("image.png", b"not an image"))

    assert error.value.status_code == 415
    assert list(tmp_path.iterdir()) == []


@pytest.mark.anyio
async def test_enforces_file_size_limit_and_removes_partial_file(tmp_path, monkeypatch) -> None:
    monkeypatch.setattr(file_storage.settings, "file_storage_path", str(tmp_path))
    monkeypatch.setattr(file_storage, "MAX_UPLOAD_BYTES", 8)

    with pytest.raises(HTTPException) as error:
        await file_storage.store_upload(make_upload("large.pdf", b"%PDF-1.7" + b"x"))

    assert error.value.status_code == 413
    assert list(tmp_path.iterdir()) == []
