import { DataFile } from "../models.js";
import { ProcessingError } from "../processors/index.js";

/** Run `processor` on a stored file and persist the result or error. */
export async function runProcessor(row, processor) {
  const update = { processor: processor.name, result: null, error: null };
  try {
    update.result = await processor.process(row.stored_path);
    update.status = "processed";
  } catch (err) {
    // Surface unexpected processor bugs to the client, not just ProcessingError.
    update.status = "failed";
    update.error = err instanceof ProcessingError ? err.message : `${err.name}: ${err.message}`;
  }
  return DataFile.saveResult(row.id, update);
}
