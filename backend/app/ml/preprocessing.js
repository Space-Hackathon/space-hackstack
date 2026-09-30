/**
 * Turn a raw request payload into model input.
 *
 * Placeholder: expects `{"features": [numbers...]}`. Replace with real feature
 * extraction (e.g. loading and normalising an image tile).
 */
export function preprocess(payload) {
  const { features } = payload;
  if (!Array.isArray(features) || !features.every((x) => typeof x === "number" && Number.isFinite(x))) {
    throw new RangeError("payload must contain 'features': a list of numbers");
  }
  return features;
}
