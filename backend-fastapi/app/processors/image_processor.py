from pathlib import Path
from typing import Any

from PIL import Image, ImageStat, UnidentifiedImageError

from app.processors.base import BaseProcessor, ProcessingError
from app.processors.registry import register


@register
class ImageProcessor(BaseProcessor):
    name = "image"
    description = "Raster imagery: dimensions, bands and per-band statistics."
    extensions = (".png", ".jpg", ".jpeg", ".tif", ".tiff", ".bmp", ".webp")

    def process(self, path: Path) -> dict[str, Any]:
        try:
            with Image.open(path) as img:
                bands = img.getbands()
                result: dict[str, Any] = {
                    "format": img.format,
                    "mode": img.mode,
                    "width": img.width,
                    "height": img.height,
                    "bands": list(bands),
                    "frames": getattr(img, "n_frames", 1),
                }
                try:
                    stat = ImageStat.Stat(img)
                    result["band_stats"] = {
                        band: {
                            "min": stat.extrema[i][0],
                            "max": stat.extrema[i][1],
                            "mean": stat.mean[i],
                            "stddev": stat.stddev[i],
                        }
                        for i, band in enumerate(bands)
                    }
                except (ValueError, NotImplementedError):
                    # Some modes (e.g. 32-bit float GeoTIFFs) are not supported by ImageStat.
                    result["band_stats"] = None
                return result
        except UnidentifiedImageError as exc:
            raise ProcessingError("Unrecognised or corrupt image file") from exc
