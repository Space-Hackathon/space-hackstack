import { Router } from "express";

import { HttpError } from "../../core/errors.js";
import { modelInfo } from "../../ml/inference.js";
import { predict } from "../../ml/pipeline.js";

const router = Router();

router.get("/model", (_req, res) => {
  res.json(modelInfo());
});

router.post("/predict", (req, res) => {
  const payload = req.body;
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    throw new HttpError(422, "Request body must be a JSON object");
  }
  try {
    res.json(predict(payload));
  } catch (err) {
    if (err instanceof RangeError) throw new HttpError(422, err.message);
    throw err;
  }
});

export default router;
