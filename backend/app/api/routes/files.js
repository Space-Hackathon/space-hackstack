import fs from "node:fs";
import path from "node:path";

import { Router } from "express";

import { HttpError } from "../../core/errors.js";
import { DataFile, toDetail } from "../../models.js";
import { getProcessor, processorFor } from "../../processors/index.js";
import { runProcessor } from "../../services/processing.js";
import { deleteFile, safeFilename, saveUpload } from "../../services/storage.js";

const router = Router();

const TRUE = new Set(["1", "true", "t", "yes", "y", "on"]);
const FALSE = new Set(["0", "false", "f", "no", "n", "off"]);

function boolQuery(value, name, fallback) {
  if (value === undefined) return fallback;
  const v = String(value).toLowerCase();
  if (TRUE.has(v)) return true;
  if (FALSE.has(v)) return false;
  throw new HttpError(422, `Query parameter '${name}' must be a boolean`);
}

function intParam(value, name, { fallback, min = 0, max = Infinity } = {}) {
  if (value === undefined) return fallback;
  if (!/^-?\d+$/.test(String(value))) throw new HttpError(422, `Parameter '${name}' must be an integer`);
  const n = Number(value);
  if (n < min || n > max) throw new HttpError(422, `Parameter '${name}' must be between ${min} and ${max}`);
  return n;
}

function getOr404(req) {
  const row = DataFile.get(intParam(req.params.fileId, "file_id"));
  if (!row) throw new HttpError(404, "File not found");
  return row;
}

// Validate ?processor before accepting the upload so unknown names don't leave files behind.
function checkProcessorQuery(req, _res, next) {
  const { processor } = req.query;
  if (processor && !getProcessor(processor)) {
    return next(new HttpError(400, `Unknown processor '${processor}'`));
  }
  next();
}

router.post("/", checkProcessorQuery, saveUpload, async (req, res) => {
  let process;
  try {
    process = boolQuery(req.query.process, "process", true);
  } catch (err) {
    deleteFile(req.file.path);
    throw err;
  }

  let row = DataFile.create({
    filename: safeFilename(req.file.originalname),
    contentType: req.file.mimetype || null,
    sizeBytes: req.file.size,
    storedPath: req.file.path,
  });

  const chosen = (req.query.processor && getProcessor(req.query.processor)) || processorFor(row.filename);
  if (process && chosen) row = await runProcessor(row, chosen);
  res.status(201).json(toDetail(row));
});

router.get("/", (req, res) => {
  const offset = intParam(req.query.offset, "offset", { fallback: 0 });
  const limit = intParam(req.query.limit, "limit", { fallback: 50, max: 200 });
  res.json(DataFile.list({ offset, limit }));
});

router.get("/:fileId", (req, res) => {
  res.json(toDetail(getOr404(req)));
});

router.get("/:fileId/download", (req, res) => {
  const row = getOr404(req);
  const filePath = path.resolve(row.stored_path);
  if (!fs.existsSync(filePath)) throw new HttpError(410, "Stored file is missing");
  const headers = row.content_type ? { "Content-Type": row.content_type } : {};
  res.download(filePath, row.filename, { headers });
});

router.post("/:fileId/process", async (req, res) => {
  const row = getOr404(req);
  const { processor } = req.query;
  const chosen = processor ? getProcessor(processor) : processorFor(row.filename);
  if (!chosen) {
    throw new HttpError(
      400,
      processor ? `Unknown processor '${processor}'` : "No processor matches this file type",
    );
  }
  res.json(toDetail(await runProcessor(row, chosen)));
});

router.delete("/:fileId", (req, res) => {
  const row = getOr404(req);
  deleteFile(row.stored_path);
  DataFile.delete(row.id);
  res.status(204).end();
});

export default router;
