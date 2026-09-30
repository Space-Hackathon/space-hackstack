/** Load trusted local modules selected in backend/.env. */
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { settings } from './core/config.js';
import { predict as defaultPredict } from './ml/pipeline.js';
import { modelInfo as defaultModelInfo } from './ml/inference.js';

export async function loadPipeline(specifier) {
  if (!specifier) return { predict: defaultPredict, modelInfo: defaultModelInfo };
  const module = await import(pathToFileURL(path.resolve(specifier)).href);
  if (typeof module.predict !== 'function' || typeof module.modelInfo !== 'function') {
    throw new TypeError('ML_PIPELINE_MODULE must export predict(payload) and modelInfo()');
  }
  return module;
}

for (const specifier of settings.processorModules) {
  await import(pathToFileURL(path.resolve(specifier)).href);
}
const pipeline = await loadPipeline(settings.mlPipelineModule);
export const predict = (payload) => pipeline.predict(payload);
export const modelInfo = () => pipeline.modelInfo();
