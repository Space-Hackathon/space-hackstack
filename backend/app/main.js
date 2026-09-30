import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";

import "./extensions.js";
import { apiRouter } from "./api/router.js";
import { buildOpenApi } from "./api/openapi.js";
import { settings } from "./core/config.js";
import { errorHandler, notFound } from "./core/errors.js";

export function createApp() {
  const app = express();
  const openapi = buildOpenApi();

  app.use(cors({ origin: settings.corsOrigins, credentials: true }));
  app.use(express.json({ limit: "10mb" }));

  app.use(settings.apiPrefix, apiRouter);

  app.get("/", (_req, res) => {
    res.json({ name: settings.appName, docs: "/docs", health: `${settings.apiPrefix}/health` });
  });
  app.get("/openapi.json", (_req, res) => res.json(openapi));
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapi));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
