import type { ComponentType } from "react";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

export interface Health {
  status: "ok" | "degraded";
  app: string;
  environment: string;
  database: "ok" | "error";
}

export interface ProcessorDescriptor {
  name: string;
  description: string;
  extensions: string[];
}

export interface Capabilities {
  contract_version: string;
  max_upload_bytes: number;
  processors: ProcessorDescriptor[];
  features: Record<string, boolean>;
}

export interface FileSummary {
  id: number;
  filename: string;
  content_type: string | null;
  size_bytes: number;
  processor: string | null;
  status: "uploaded" | "processed" | "failed";
  created_at: string;
  processed_at: string | null;
}

export interface FileRecord extends FileSummary {
  result: JsonObject | null;
  error: string | null;
}

export interface ModelInfo {
  model: string;
  model_path: string;
  model_file_present: boolean;
}

export type ResultRenderer = ComponentType<{ result: JsonValue | null }>;
