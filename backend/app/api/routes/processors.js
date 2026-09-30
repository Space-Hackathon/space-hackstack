import { Router } from "express";

import { allProcessors } from "../../processors/index.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json(
    allProcessors().map((p) => ({ name: p.name, description: p.description, extensions: [...p.extensions] })),
  );
});

export default router;
