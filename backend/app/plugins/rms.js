/** Example adapter, not a trained model: ML_PIPELINE_MODULE=./app/plugins/rms.js. */
import { preprocess } from '../ml/preprocessing.js';

export function modelInfo() {
  return { model: 'example-rms', model_path: '', model_file_present: false };
}
export function predict(payload) {
  const features = preprocess(payload);
  const scale = features.reduce((max, x) => Math.max(max, Math.abs(x)), 0);
  const prediction = scale ? scale * Math.sqrt(features.reduce((sum, x) => sum + (x / scale) ** 2, 0) / features.length) : 0;
  return { prediction, model: 'example-rms' };
}
