import uuid
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.file_storage import store_upload
from app.models import UploadedFile
from app.schemas import UploadedFileOut
from app.settings import settings

router = APIRouter(prefix="/uploads", tags=["uploads"])
SessionDep = Annotated[AsyncSession, Depends(get_session)]


@router.post("", response_model=UploadedFileOut, status_code=201)
async def upload_print_file(
    session: SessionDep,
    file: Annotated[UploadFile, File()],
) -> UploadedFileOut:
    storage_key, original_filename, size_bytes, sha256, content_type = await store_upload(file)
    stored_path = Path(settings.file_storage_path) / storage_key

    try:
        async with session.begin():
            record = UploadedFile(
                id=uuid.uuid4(),
                original_filename=original_filename,
                storage_key=storage_key,
                content_type=content_type,
                size_bytes=size_bytes,
                sha256=sha256,
            )
            session.add(record)
            await session.flush()
            response = UploadedFileOut(
                id=record.id,
                original_filename=record.original_filename,
                content_type=record.content_type,
                size_bytes=record.size_bytes,
                review_status="pending",
            )
    except BaseException:
        stored_path.unlink(missing_ok=True)
        raise
    return response
