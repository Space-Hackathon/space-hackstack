import type {
  Capabilities,
  FileRecord,
  FileSummary,
  Health,
  JsonObject,
  JsonValue,
  ModelInfo,
  ProcessorDescriptor,
} from "../types";

export interface ApiClientOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

export interface ListFilesOptions {
  offset?: number;
  limit?: number;
  signal?: AbortSignal;
}

export interface UploadOptions {
  process?: boolean;
  processor?: string;
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  query?: Record<string, string | number | boolean | undefined>;
  body?: BodyInit | null;
}

export class ApiError extends Error {
  readonly status: number;
  readonly detail: unknown;

  constructor(message: string, status: number, detail: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

export interface ApiClient {
  health(signal?: AbortSignal): Promise<Health>;
  processors(signal?: AbortSignal): Promise<ProcessorDescriptor[]>;
  capabilities(signal?: AbortSignal): Promise<Capabilities>;
  listFiles(options?: ListFilesOptions): Promise<FileSummary[]>;
  getFile(id: number, signal?: AbortSignal): Promise<FileRecord>;
  uploadFile(file: File, options?: UploadOptions): Promise<FileRecord>;
  processFile(id: number, processor?: string): Promise<FileRecord>;
  deleteFile(id: number): Promise<null>;
  downloadUrl(id: number): string;
  modelInfo(signal?: AbortSignal): Promise<ModelInfo>;
  predict(payload: JsonObject): Promise<JsonValue>;
}

interface ValidationIssue {
  msg?: string;
}

export function createApiClient({
  baseUrl = "/api",
  fetchImpl = globalThis.fetch,
}: ApiClientOptions = {}): ApiClient {
  const base = baseUrl.replace(/\/$/, "");

  async function request<T>(path: string, { query, ...options }: RequestOptions = {}): Promise<T> {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
    }

    const response = await fetchImpl(base + path + (params.size ? "?" + params : ""), options);
    if (response.status === 204) return null as T;

    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const detail = (body as { detail?: unknown } | null)?.detail;
      const message = Array.isArray(detail)
        ? detail.map((item: ValidationIssue) => item.msg ?? "Invalid value").join("; ")
        : typeof detail === "string"
          ? detail
          : "Request failed (" + response.status + ")";
      throw new ApiError(message, response.status, detail);
    }
    return body as T;
  }

  const filePath = (id: number) => "/files/" + encodeURIComponent(id);
  return {
    health: (signal) => request<Health>("/health", { signal }),
    processors: (signal) => request<ProcessorDescriptor[]>("/processors", { signal }),
    capabilities: (signal) => request<Capabilities>("/capabilities", { signal }),
    listFiles: ({ offset = 0, limit = 20, signal } = {}) =>
      request<FileSummary[]>("/files", { query: { offset, limit }, signal }),
    getFile: (id, signal) => request<FileRecord>(filePath(id), { signal }),
    uploadFile: (file, { process = true, processor } = {}) => {
      const body = new FormData();
      body.append("file", file);
      return request<FileRecord>("/files", { method: "POST", body, query: { process, processor } });
    },
    processFile: (id, processor) =>
      request<FileRecord>(filePath(id) + "/process", { method: "POST", query: { processor } }),
    deleteFile: (id) => request<null>(filePath(id), { method: "DELETE" }),
    downloadUrl: (id) => base + filePath(id) + "/download",
    modelInfo: (signal) => request<ModelInfo>("/ml/model", { signal }),
    predict: (payload) =>
      request<JsonValue>("/ml/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
  };
}
