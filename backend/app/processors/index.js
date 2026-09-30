/**
 * File processors.
 *
 * Each module imported below registers its processor on import. To add one,
 * create `my-format.js` that calls `register({...})` (see base.js) and add it
 * to the import list.
 */
import "./csv.js";
import "./image.js";
import "./json.js";
import "./tle.js";
import "./txt.js";

export { ProcessingError } from "./base.js";
export { allProcessors, getProcessor, processorFor, register } from "./registry.js";
