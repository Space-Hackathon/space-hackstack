import { Router } from "express";

import { HttpError, validationError } from "../../core/errors.js";
import { modelInfo } from "../../ml/inference.js";
import { predict } from "../../ml/pipeline.js";

const router = Router();

router.get("/model", (_req, res) => {
  res.json(modelInfo());
});

router.post("/predict", (req, res) => {
  const payload = req.body;
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    throw validationError("dict_type", ["body"], "Input should be a valid dictionary", payload ?? null);
  }
  try {
    res.json(predict(payload));
  } catch (err) {
    if (err instanceof RangeError) throw new HttpError(422, err.message);
    throw err;
  }
});

export default router;
