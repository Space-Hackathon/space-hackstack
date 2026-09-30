import sharp from "sharp";

import { ProcessingError } from "./base.js";
import { register } from "./registry.js";

// Report mode/bands with the same names Pillow uses in the FastAPI backend.
const MODES = {
  1: ["L", ["L"]],
  2: ["LA", ["L", "A"]],
  3: ["RGB", ["R", "G", "B"]],
  4: ["RGBA", ["R", "G", "B", "A"]],
};

function modeAndBands(meta) {
  if (meta.space === "cmyk") return ["CMYK", ["C", "M", "Y", "K"]];
  return MODES[meta.channels] ?? [`${meta.channels}-band`, Array.from({ length: meta.channels }, (_, i) => `band_${i + 1}`)];
}

export default register({
  name: "image",
  description: "Raster imagery: dimensions, bands and per-band statistics.",
  // BMP is not supported by sharp, so unlike the FastAPI backend it is not listed here.
  extensions: [".png", ".jpg", ".jpeg", ".tif", ".tiff", ".webp"],

  async process(filePath) {
    let meta;
    try {
      meta = await sharp(filePath).metadata();
    } catch {
      throw new ProcessingError("Unrecognised or corrupt image file");
    }

    const [mode, bands] = modeAndBands(meta);
    const result = {
      format: meta.format?.toUpperCase() ?? null,
      mode,
      width: meta.width,
      height: meta.height,
      bands,
      frames: meta.pages ?? 1,
    };
    try {
      const { channels } = await sharp(filePath).stats();
      result.band_stats = Object.fromEntries(
        bands.map((band, i) => [
          band,
          { min: channels[i].min, max: channels[i].max, mean: channels[i].mean, stddev: channels[i].stdev },
        ]),
      );
    } catch {
      result.band_stats = null;
    }
    return result;
  },
});
