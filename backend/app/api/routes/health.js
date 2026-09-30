import { Router } from "express";

import { settings } from "../../core/config.js";
import { getDb } from "../../core/database.js";

const router = Router();

router.get("/health", (_req, res) => {
  let database = "ok";
  try {
    getDb().prepare("SELECT 1").get();
  } catch {
    database = "error";
  }
  res.json({
    status: database === "ok" ? "ok" : "degraded",
    app: settings.appName,
    environment: settings.environment,
    database,
  });
});

export default router;
