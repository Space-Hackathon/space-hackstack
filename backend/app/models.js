import { getDb } from "./core/database.js";

// Datetimes are stored like SQLAlchemy stores them in SQLite
// ("YYYY-MM-DD HH:MM:SS.ffffff", UTC) and returned as ISO 8601 with "Z".
export function toDbTime(date = new Date()) {
  return date.toISOString().replace("T", " ").replace("Z", "000");
}

function fromDbTime(value) {
  if (!value) return null;
  const [date, time] = String(value).split(" ");
  return `${date}T${time}Z`;
}

function toRead(row) {
  return {
    filename: row.filename,
    content_type: row.content_type,
    size_bytes: row.size_bytes,
    processor: row.processor,
    status: row.status,
    id: row.id,
    created_at: fromDbTime(row.created_at),
    processed_at: fromDbTime(row.processed_at),
  };
}

/** Shape of `DataFileDetail`: list fields plus `result` and `error`. */
export function toDetail(row) {
  return {
    ...toRead(row),
    result: row.result == null ? null : JSON.parse(row.result),
    error: row.error,
  };
}

export const DataFile = {
  create({ filename, contentType, sizeBytes, storedPath }) {
    const info = getDb()
      .prepare(
        `INSERT INTO datafile (filename, content_type, size_bytes, status, stored_path, created_at)
         VALUES (?, ?, ?, 'uploaded', ?, ?)`,
      )
      .run(filename, contentType, sizeBytes, storedPath, toDbTime());
    return DataFile.get(info.lastInsertRowid);
  },

  get(id) {
    return getDb().prepare("SELECT * FROM datafile WHERE id = ?").get(id);
  },

  list({ offset, limit }) {
    return getDb()
      .prepare("SELECT * FROM datafile ORDER BY created_at DESC LIMIT ? OFFSET ?")
      .all(limit, offset)
      .map(toRead);
  },

  saveResult(id, { processor, status, result, error }) {
    getDb()
      .prepare(
        `UPDATE datafile SET processor = ?, status = ?, result = ?, error = ?, processed_at = ?
         WHERE id = ?`,
      )
      .run(processor, status, result == null ? null : JSON.stringify(result), error, toDbTime(), id);
    return DataFile.get(id);
  },

  delete(id) {
    getDb().prepare("DELETE FROM datafile WHERE id = ?").run(id);
  },
};
