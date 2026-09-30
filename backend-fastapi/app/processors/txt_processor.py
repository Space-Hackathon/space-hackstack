from pathlib import Path
from typing import Any

from app.processors.base import BaseProcessor
from app.processors.registry import register

PREVIEW_LINES = 20


@register
class TextProcessor(BaseProcessor):
    name = "txt"
    description = "Plain text: line/word/char counts and a preview."
    extensions = (".txt", ".log", ".md")

    def process(self, path: Path) -> dict[str, Any]:
        text = path.read_text(encoding="utf-8", errors="replace")
        lines = text.splitlines()
        return {
            "line_count": len(lines),
            "word_count": len(text.split()),
            "char_count": len(text),
            "preview": lines[:PREVIEW_LINES],
        }
