import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

from app.core.config import get_settings

CHUNK_SIZE = 1024 * 1024


def safe_filename(filename: str | None) -> str:
    # Strip any client-supplied directories to prevent path traversal.
    name = Path(filename or "upload").name
    return name or "upload"


async def save_upload(upload: UploadFile) -> tuple[Path, int]:
    """Stream an upload to disk under a unique name; return (path, size)."""
    settings = get_settings()
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    max_bytes = settings.max_upload_mb * 1024 * 1024

    dest = settings.upload_dir / f"{uuid.uuid4().hex}_{safe_filename(upload.filename)}"
    size = 0
    try:
        with dest.open("wb") as out:
            while chunk := await upload.read(CHUNK_SIZE):
                size += len(chunk)
                if size > max_bytes:
                    raise HTTPException(
                        status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        f"File exceeds {settings.max_upload_mb} MB limit",
                    )
                out.write(chunk)
    except BaseException:
        dest.unlink(missing_ok=True)
        raise
    return dest, size


def delete_file(path: str | Path) -> None:
    Path(path).unlink(missing_ok=True)
