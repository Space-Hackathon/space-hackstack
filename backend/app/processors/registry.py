from pathlib import Path

from app.processors.base import BaseProcessor

_registry: dict[str, BaseProcessor] = {}


def register(cls: type[BaseProcessor]) -> type[BaseProcessor]:
    """Class decorator that registers a processor under its ``name``."""
    if cls.name in _registry:
        raise ValueError(f"Processor '{cls.name}' is already registered")
    _registry[cls.name] = cls()
    return cls


def get_processor(name: str) -> BaseProcessor | None:
    return _registry.get(name)


def processor_for(path: str | Path) -> BaseProcessor | None:
    suffix = Path(path).suffix.lower()
    for processor in _registry.values():
        if suffix in processor.extensions:
            return processor
    return None


def all_processors() -> list[BaseProcessor]:
    return list(_registry.values())
