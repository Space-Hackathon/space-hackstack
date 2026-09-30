import fs from "node:fs";
import path from "node:path";

import { Router } from "express";

import { HttpError, validationError } from "../../core/errors.js";
import { DataFile, toDetail } from "../../models.js";
import { getProcessor, processorFor } from "../../processors/index.js";
import { runProcessor } from "../../services/processing.js";
import { deleteFile, safeFilename, saveUpload } from "../../services/storage.js";

const router = Router();

const TRUE = new Set(["1", "true", "t", "yes", "y", "on"]);
const FALSE = new Set(["0", "false", "f", "no", "n", "off"]);

// Query/path parsing mirrors FastAPI, including its 422 error format.
function boolParam(value, loc, fallback) {
  if (value === undefined) return fallback;
  const v = String(value).toLowerCase();
  if (TRUE.has(v)) return true;
  if (FALSE.has(v)) return false;
  throw validationError("bool_parsing", loc, "Input should be a valid boolean, unable to interpret input", value);
}

function intParam(value, loc, { fallback, min, max } = {}) {
  if (value === undefined) return fallback;
  if (!/^\s*[+-]?\d+\s*$/.test(String(value))) {
    throw validationError("int_parsing", loc, "Input should be a valid integer, unable to parse string as an integer", value);
  }
  const n = Number(value);
  if (min !== undefined && n < min) {
    throw validationError("greater_than_equal", loc, "Input should be greater than or equal to " + min, value, { ge: min });
  }
  if (max !== undefined && n > max) {
    throw validationError("less_than_equal", loc, `Input should be less than or equal to ${max}`, value, { le: max });
  }
  return n;
}

function getOr404(req) {
  const row = DataFile.get(intParam(req.params.fileId, ["path", "file_id"]));
  if (!row) throw new HttpError(404, "File not found");
  return row;
}

// Validate the query before accepting the upload so bad requests don't leave files behind.
function checkUploadQuery(req, _res, next) {
  const { processor } = req.query;
  if (processor && !getProcessor(processor)) {
    return next(new HttpError(400, `Unknown processor '${processor}'`));
  }
  req.shouldProcess = boolParam(req.query.process, ["query", "process"], true);
  next();
}

router.post("/", checkUploadQuery, saveUpload, async (req, res) => {
  let row = DataFile.create({
    filename: safeFilename(req.file.originalname),
    contentType: req.file.mimetype || null,
    sizeBytes: req.file.size,
    storedPath: req.file.path,
  });

  const chosen = (req.query.processor && getProcessor(req.query.processor)) || processorFor(row.filename);
  if (req.shouldProcess && chosen) row = await runProcessor(row, chosen);
  res.status(201).json(toDetail(row));
});

router.get("/", (req, res) => {
  const offset = intParam(req.query.offset, ["query", "offset"], { fallback: 0, min: 0 });
  const limit = intParam(req.query.limit, ["query", "limit"], { fallback: 50, min: 1, max: 200 });
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
