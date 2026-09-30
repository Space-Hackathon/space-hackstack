"""File processors.

Each module imported below registers its processor on import. To add one,
create ``my_processor.py`` with a ``BaseProcessor`` subclass decorated with
``@register`` and add it to the import list.
"""

from app.processors import (  # noqa: F401
    csv_processor,
    image_processor,
    json_processor,
    tle_processor,
    txt_processor,
)
from app.processors.base import BaseProcessor, ProcessingError
from app.processors.registry import all_processors, get_processor, processor_for, register

__all__ = [
    "BaseProcessor",
    "ProcessingError",
    "all_processors",
    "get_processor",
    "processor_for",
    "register",
]
