// Point the app at a throwaway DB and upload dir. Import this before any app module.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "hackstack-test-"));
process.env.DATABASE_URL = `sqlite:///${path.join(tmp, "test.db").replaceAll("\\", "/")}`;
process.env.UPLOAD_DIR = path.join(tmp, "raw");

export const SAMPLES = path.resolve(import.meta.dirname, "..", "data", "samples");
