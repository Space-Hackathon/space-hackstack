import path from "node:path";

import dotenv from "dotenv";

dotenv.config({ quiet: true });

function env(name, fallback) {
  const value = process.env[name];
  return value === undefined || value === "" ? fallback : value;
}

function parseOrigins(raw) {
  // Same format as the FastAPI backend: a JSON list, e.g. ["http://localhost:5173"].
  // A comma-separated string is also accepted for convenience.
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    // fall through
  }
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

function sqlitePath(url) {
  const match = /^sqlite:\/\/\/(.+)$/.exec(url);
  if (!match) {
    throw new Error(`Unsupported DATABASE_URL '${url}': the Node backend supports sqlite:///<path> only`);
  }
  return match[1];
}

function loadSettings() {
  const databaseUrl = env("DATABASE_URL", "sqlite:///./data/app.db");
  return {
    appName: env("APP_NAME", "Space Hackstack API"),
    environment: env("ENVIRONMENT", "development"),
    apiPort: Number(env("API_PORT", "8000")),
    apiPrefix: env("API_PREFIX", "/api"),
    corsOrigins: parseOrigins(env("CORS_ORIGINS", '["http://localhost:5173","http://127.0.0.1:5173"]')),
    databaseUrl,
    databasePath: sqlitePath(databaseUrl),
    uploadDir: path.normalize(env("UPLOAD_DIR", "./data/raw")),
    maxUploadMb: Number(env("MAX_UPLOAD_MB", "200")),
    modelPath: path.normalize(env("MODEL_PATH", "./app/ml/models/model.pt")),
  };
}

export const settings = loadSettings();
