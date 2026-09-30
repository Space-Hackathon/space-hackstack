from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any, ClassVar


class ProcessingError(Exception):
    """Raised by a processor when a file cannot be processed."""


class BaseProcessor(ABC):
    """Subclass this and decorate with ``@register`` to add a file processor.

    ``name`` identifies the processor in the API; ``extensions`` (lowercase,
    with the leading dot) lets the registry auto-select it for uploads.
    """

    name: ClassVar[str]
    description: ClassVar[str] = ""
    extensions: ClassVar[tuple[str, ...]] = ()

    @abstractmethod
    def process(self, path: Path) -> dict[str, Any]:
        """Process the file at ``path`` and return a JSON-serialisable result."""
