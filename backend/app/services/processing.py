from datetime import datetime, timezone
from pathlib import Path

from sqlmodel import Session

from app.models import DataFile
from app.processors import BaseProcessor, ProcessingError


def run_processor(session: Session, data_file: DataFile, processor: BaseProcessor) -> DataFile:
    """Run ``processor`` on a stored file and persist the result or error."""
    data_file.processor = processor.name
    data_file.processed_at = datetime.now(timezone.utc)
    try:
        data_file.result = processor.process(Path(data_file.stored_path))
        data_file.status = "processed"
        data_file.error = None
    except ProcessingError as exc:
        data_file.result = None
        data_file.status = "failed"
        data_file.error = str(exc)
    except Exception as exc:  # noqa: BLE001 - surface unexpected processor bugs to the client
        data_file.result = None
        data_file.status = "failed"
        data_file.error = f"{type(exc).__name__}: {exc}"

    session.add(data_file)
    session.commit()
    session.refresh(data_file)
    return data_file
