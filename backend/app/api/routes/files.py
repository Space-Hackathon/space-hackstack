from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import FileResponse
from sqlmodel import Session, col, select

from app.core.database import get_session
from app.models import DataFile, DataFileDetail, DataFileRead
from app.processors import get_processor, processor_for
from app.services.processing import run_processor
from app.services.storage import delete_file, safe_filename, save_upload

router = APIRouter(prefix="/files", tags=["files"])


def _get_or_404(session: Session, file_id: int) -> DataFile:
    data_file = session.get(DataFile, file_id)
    if not data_file:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "File not found")
    return data_file


@router.post("", response_model=DataFileDetail, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    process: bool = Query(True, description="Run the matching processor immediately"),
    processor: str | None = Query(None, description="Force a processor by name"),
    session: Session = Depends(get_session),
) -> DataFile:
    chosen = None
    if processor:
        chosen = get_processor(processor)
        if not chosen:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Unknown processor '{processor}'")

    stored_path, size = await save_upload(file)
    data_file = DataFile(
        filename=safe_filename(file.filename),
        content_type=file.content_type,
        size_bytes=size,
        stored_path=str(stored_path),
    )
    session.add(data_file)
    session.commit()
    session.refresh(data_file)

    chosen = chosen or processor_for(data_file.filename)
    if process and chosen:
        data_file = run_processor(session, data_file, chosen)
    return data_file


@router.get("", response_model=list[DataFileRead])
def list_files(
    offset: int = 0,
    limit: int = Query(50, le=200),
    session: Session = Depends(get_session),
) -> list[DataFile]:
    stmt = select(DataFile).order_by(col(DataFile.created_at).desc()).offset(offset).limit(limit)
    return list(session.exec(stmt).all())


@router.get("/{file_id}", response_model=DataFileDetail)
def get_file(file_id: int, session: Session = Depends(get_session)) -> DataFile:
    return _get_or_404(session, file_id)


@router.get("/{file_id}/download")
def download_file(file_id: int, session: Session = Depends(get_session)) -> FileResponse:
    data_file = _get_or_404(session, file_id)
    if not Path(data_file.stored_path).exists():
        raise HTTPException(status.HTTP_410_GONE, "Stored file is missing")
    return FileResponse(data_file.stored_path, filename=data_file.filename, media_type=data_file.content_type)


@router.post("/{file_id}/process", response_model=DataFileDetail)
def process_file(
    file_id: int,
    processor: str | None = Query(None, description="Processor name; auto-detected if omitted"),
    session: Session = Depends(get_session),
) -> DataFile:
    data_file = _get_or_404(session, file_id)
    chosen = get_processor(processor) if processor else processor_for(data_file.filename)
    if not chosen:
        detail = f"Unknown processor '{processor}'" if processor else "No processor matches this file type"
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail)
    return run_processor(session, data_file, chosen)


@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_file(file_id: int, session: Session = Depends(get_session)) -> None:
    data_file = _get_or_404(session, file_id)
    delete_file(data_file.stored_path)
    session.delete(data_file)
    session.commit()
