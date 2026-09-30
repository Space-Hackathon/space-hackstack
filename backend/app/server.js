import fs from "node:fs";

import { settings } from "./core/config.js";
import { initDb } from "./core/database.js";
import { createApp } from "./main.js";

initDb();
fs.mkdirSync(settings.uploadDir, { recursive: true });

createApp().listen(settings.apiPort, "0.0.0.0", () => {
  console.log(`${settings.appName} listening on http://localhost:${settings.apiPort}`);
  console.log(`Docs: http://localhost:${settings.apiPort}/docs`);
});
