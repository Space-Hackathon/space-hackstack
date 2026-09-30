import crypto from "node:crypto";
import fs from "node:fs";

import multer from "multer";

import { settings } from "../core/config.js";
import { HttpError, validationError } from "../core/errors.js";

export function safeFilename(filename) {
  // Strip any client-supplied directories (either separator) to prevent path traversal.
  const name = String(filename ?? "").split(/[\\/]/).pop();
  return !name || name === "." || name === ".." ? "upload" : name;
}

const upload = multer({
  storage: multer.diskStorage({
    destination(_req, _file, cb) {
      fs.mkdirSync(settings.uploadDir, { recursive: true });
      cb(null, settings.uploadDir);
    },
    filename(_req, file, cb) {
      cb(null, `${crypto.randomUUID().replaceAll("-", "")}_${safeFilename(file.originalname)}`);
    },
  }),
  limits: { fileSize: settings.maxUploadMb * 1024 * 1024, files: 1 },
  defParamCharset: "utf8",
});

/** Middleware that streams the multipart `file` field to UPLOAD_DIR. */
export function saveUpload(req, res, next) {
  upload.single("file")(req, res, (err) => {
    if (!err) {
      if (!req.file) return next(validationError("missing", ["body", "file"], "Field required", null));
      return next();
    }
    if (err.code === "LIMIT_FILE_SIZE") {
      return next(new HttpError(413, `File exceeds ${settings.maxUploadMb} MB limit`));
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return next(validationError("missing", ["body", "file"], "Field required", null));
    }
    if (err instanceof multer.MulterError) return next(new HttpError(422, err.message));
    return next(err);
  });
}

export function deleteFile(filePath) {
  fs.rmSync(filePath, { force: true });
}
