# Backend extension kit (Node)

Run commands from backend/. Existing file/storage/database APIs stay intact.

## Processors

Copy app/plugins/ndjson.js as a starting point: export/register a processor object with name, description,
extensions and process(path). It can be asynchronous. Return a JSON-serialisable dictionary; raise ProcessingError for bad input.
Configure a JSON list of trusted local module paths (relative to backend/) in .env:

    PROCESSOR_MODULES=["./app/plugins/ndjson.js"]

Restart the backend. .jsonl/.ndjson uploads now auto-select the processor, it appears in
/api/processors and /api/capabilities, and the frontend selector discovers it automatically.
No central import list or routes need editing. Existing built-ins remain registered; duplicate names
fail startup. Modules execute code at startup, so only configure modules you trust.
Try uploading data/samples/records.ndjson; remove PROCESSOR_MODULES to disable the example.

## Model pipelines

A local module must export predict(payload) and modelInfo() functions (sync or async).
The former returns a JSON dictionary; the latter returns the existing model info contract:
model, model_path, model_file_present. Throw RangeError for invalid inputs (HTTP 422).
The adapter owns preprocessing, loading/caching a model, inference, and postprocessing.
Model files can be located with settings.modelPath from app/core/config.js. No ML dependencies are required by the kit.

    ML_PIPELINE_MODULE=./app/plugins/rms.js

This example computes root mean square; it is not trained inference. POST /api/ml/predict
with {"features":[3,3]} returns {"prediction":3,"model":"example-rms"}.
Remove the setting to use the original dummy-mean pipeline. Invalid adapter exports fail startup.
Changing MODEL_PATH alone does not load weights: provide a model adapter to load them.

## Contract

GET /api/capabilities returns contract_version "1", max_upload_bytes, processor descriptors,
and features {files, processing, inference}. File lists accept offset >= 0 and limit 1–200.
The frontend uses capabilities for early size checks; backend enforcement remains authoritative.

Validation: npm test. The tests cover configuration-selected processors/model adapters,
capability discovery, invalid records, and pagination alongside the original API suite.
