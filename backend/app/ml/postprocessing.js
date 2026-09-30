/** Convert raw model output into the API response shape. */
export function postprocess(rawOutput) {
  return { prediction: rawOutput };
}
