/** Thrown by a processor when a file cannot be processed. */
export class ProcessingError extends Error {
  constructor(message) {
    super(message);
    this.name = "ProcessingError";
  }
}

/**
 * A processor is a plain object:
 *
 *   {
 *     name: "my-format",            // identifies it in the API
 *     description: "What it extracts",
 *     extensions: [".dat"],         // lowercase, with the dot; used for auto-selection
 *     async process(filePath) { return { ...JSON-serialisable result } },
 *   }
 *
 * Throw ProcessingError for bad input. Register it with `register()`.
 */
