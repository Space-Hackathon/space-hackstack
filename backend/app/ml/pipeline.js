/**
 * Pluggable ML pipeline: preprocessing -> inference -> postprocessing.
 *
 * Drop model weights in app/ml/models/ (see MODEL_PATH) and replace the
 * placeholder logic in the three stage modules. The routes in
 * app/api/routes/ml.js call `predict` and do not need to change.
 */
import { infer, modelInfo } from "./inference.js";
import { postprocess } from "./postprocessing.js";
import { preprocess } from "./preprocessing.js";

export function predict(payload) {
  const output = postprocess(infer(preprocess(payload)));
  output.model = modelInfo().model;
  return output;
}
