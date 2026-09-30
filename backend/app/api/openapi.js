import { settings } from "../core/config.js";

const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const json = (schema) => ({ content: { "application/json": { schema } } });
const error = (description) => ({ description, ...json(ref("Error")) });
const fileId = { name: "fileId", in: "path", required: true, schema: { type: "integer" } };
const processorQuery = (description) => ({ name: "processor", in: "query", schema: { type: "string" }, description });

/** OpenAPI description of the backend contract, served at /openapi.json and /docs. */
export function buildOpenApi() {
  const p = settings.apiPrefix;
  return {
    openapi: "3.1.0",
    info: { title: settings.appName, version: "0.1.0" },
    paths: {
      [p + "/capabilities"]: {
        get: {
          tags: ["capabilities"], summary: "Frontend configuration and available features",
          responses: { 200: { description: "OK", ...json({ type: "object", properties: {
            contract_version: { type: "string" }, max_upload_bytes: { type: "integer" },
            processors: { type: "array", items: ref("Processor") },
            features: { type: "object", additionalProperties: { type: "boolean" } },
          } }) } },
        },
      },
      [`${p}/health`]: {
        get: {
          tags: ["health"],
          summary: "App and database status",
          responses: { 200: { description: "OK", ...json(ref("Health")) } },
        },
      },
      [`${p}/processors`]: {
        get: {
          tags: ["processors"],
          summary: "Registered processors",
          responses: { 200: { description: "OK", ...json({ type: "array", items: ref("Processor") }) } },
        },
      },
      [`${p}/files`]: {
        get: {
          tags: ["files"],
          summary: "List uploads",
          parameters: [
            { name: "offset", in: "query", schema: { type: "integer", default: 0, minimum: 0 } },
            { name: "limit", in: "query", schema: { type: "integer", default: 50, minimum: 1, maximum: 200 } },
          ],
          responses: { 200: { description: "OK", ...json({ type: "array", items: ref("DataFileRead") }) } },
        },
        post: {
          tags: ["files"],
          summary: "Upload a file (auto-processed by extension)",
          parameters: [
            {
              name: "process",
              in: "query",
              schema: { type: "boolean", default: true },
              description: "Run the matching processor immediately",
            },
            processorQuery("Force a processor by name"),
          ],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: { type: "object", required: ["file"], properties: { file: { type: "string", format: "binary" } } },
              },
            },
          },
          responses: {
            201: { description: "Created", ...json(ref("DataFileDetail")) },
            400: error("Unknown processor"),
            413: error("File too large"),
            422: error("Validation error"),
          },
        },
      },
      [`${p}/files/{fileId}`]: {
        get: {
          tags: ["files"],
          summary: "File metadata and processing result",
          parameters: [fileId],
          responses: { 200: { description: "OK", ...json(ref("DataFileDetail")) }, 404: error("Not found") },
        },
        delete: {
          tags: ["files"],
          summary: "Delete record and stored file",
          parameters: [fileId],
          responses: { 204: { description: "Deleted" }, 404: error("Not found") },
        },
      },
      [`${p}/files/{fileId}/download`]: {
        get: {
          tags: ["files"],
          summary: "Download the original file",
          parameters: [fileId],
          responses: {
            200: { description: "File contents" },
            404: error("Not found"),
            410: error("Stored file is missing"),
          },
        },
      },
      [`${p}/files/{fileId}/process`]: {
        post: {
          tags: ["files"],
          summary: "(Re)run a processor",
          parameters: [fileId, processorQuery("Processor name; auto-detected if omitted")],
          responses: {
            200: { description: "OK", ...json(ref("DataFileDetail")) },
            400: error("No matching or unknown processor"),
            404: error("Not found"),
          },
        },
      },
      [`${p}/ml/model`]: {
        get: {
          tags: ["ml"],
          summary: "Loaded model info",
          responses: { 200: { description: "OK", ...json(ref("ModelInfo")) } },
        },
      },
      [`${p}/ml/predict`]: {
        post: {
          tags: ["ml"],
          summary: "Run the ML pipeline",
          requestBody: {
            required: true,
            ...json({ type: "object", example: { features: [1, 2, 3] }, additionalProperties: true }),
          },
          responses: {
            200: { description: "OK", ...json(ref("Prediction")) },
            422: error("Invalid payload"),
          },
        },
      },
    },
    components: {
      schemas: {
        Error: { type: "object", properties: { detail: { type: "string" } } },
        Health: {
          type: "object",
          properties: {
            status: { type: "string", enum: ["ok", "degraded"] },
            app: { type: "string" },
            environment: { type: "string" },
            database: { type: "string", enum: ["ok", "error"] },
          },
        },
        Processor: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            extensions: { type: "array", items: { type: "string" } },
          },
        },
        DataFileRead: {
          type: "object",
          properties: {
            filename: { type: "string" },
            content_type: { type: ["string", "null"] },
            size_bytes: { type: "integer" },
            processor: { type: ["string", "null"] },
            status: { type: "string", enum: ["uploaded", "processed", "failed"] },
            id: { type: "integer" },
            created_at: { type: "string", format: "date-time" },
            processed_at: { type: ["string", "null"], format: "date-time" },
          },
        },
        DataFileDetail: {
          allOf: [
            ref("DataFileRead"),
            {
              type: "object",
              properties: {
                result: { type: ["object", "null"], additionalProperties: true },
                error: { type: ["string", "null"] },
              },
            },
          ],
        },
        ModelInfo: {
          type: "object",
          properties: {
            model: { type: "string" },
            model_path: { type: "string" },
            model_file_present: { type: "boolean" },
          },
        },
        Prediction: {
          type: "object",
          properties: { prediction: {}, model: { type: "string" } },
        },
      },
    },
  };
}
