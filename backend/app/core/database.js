import fs from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";

import { settings } from "./config.js";

let db;

// Table layout matches the FastAPI backend (SQLModel `DataFile`), so the same
// data/app.db works with either implementation.
const SCHEMA = `
CREATE TABLE IF NOT EXISTS datafile (
  filename VARCHAR NOT NULL,
  content_type VARCHAR,
  size_bytes INTEGER NOT NULL,
  processor VARCHAR,
  status VARCHAR NOT NULL,
  id INTEGER NOT NULL,
  stored_path VARCHAR NOT NULL,
  result JSON,
  error VARCHAR,
  created_at DATETIME NOT NULL,
  processed_at DATETIME,
  PRIMARY KEY (id)
)`;

export function initDb() {
  if (db) return db;
  const file = settings.databasePath;
  if (file !== ":memory:") fs.mkdirSync(path.dirname(file), { recursive: true });
  db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.exec(SCHEMA);
  return db;
}

export function getDb() {
  return db ?? initDb();
}

export function closeDb() {
  db?.close();
  db = undefined;
}
