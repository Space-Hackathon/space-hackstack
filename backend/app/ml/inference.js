import fs from "node:fs";

import { settings } from "../core/config.js";

/** Stand-in used until a real model file is present at MODEL_PATH. */
const dummyModel = {
  name: "dummy-mean",
  predict(features) {
    return features.length ? features.reduce((a, b) => a + b, 0) / features.length : 0;
  },
};

let model;

export function loadModel() {
  if (model) return model;
  if (fs.existsSync(settings.modelPath)) {
    // Load your real model here, e.g. with onnxruntime-node:
    //   const ort = await import("onnxruntime-node");
    //   const session = await ort.InferenceSession.create(settings.modelPath);
  }
  model = dummyModel;
  return model;
}

export function modelInfo() {
  return {
    model: loadModel().name,
    model_path: settings.modelPath,
    model_file_present: fs.existsSync(settings.modelPath),
  };
}

export function infer(features) {
  return loadModel().predict(features);
}
