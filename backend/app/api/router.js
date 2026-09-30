import { Router } from "express";

import files from "./routes/files.js";
import health from "./routes/health.js";
import ml from "./routes/ml.js";
import processors from "./routes/processors.js";

export const apiRouter = Router();
apiRouter.use(health);
apiRouter.use("/files", files);
apiRouter.use("/processors", processors);
apiRouter.use("/ml", ml);
