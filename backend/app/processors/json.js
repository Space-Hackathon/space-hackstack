import fs from "node:fs/promises";

import { ProcessingError } from "./base.js";
import { register } from "./registry.js";

// Type names match the FastAPI backend (Python type names) so results are identical.
function typeName(value) {
  if (value === null) return "NoneType";
  if (Array.isArray(value)) return "list";
  if (typeof value === "object") return "dict";
  if (typeof value === "string") return "str";
  if (typeof value === "boolean") return "bool";
  return Number.isInteger(value) ? "int" : "float";
}

/** Summarise the shape of a JSON value without echoing all of it. */
function describe(value, depth = 0, maxDepth = 3) {
  if (Array.isArray(value)) {
    if (value.length === 0) return "array(0)";
    return { array: value.length, items: describe(value[0], depth + 1, maxDepth) };
  }
  if (value !== null && typeof value === "object") {
    const keys = Object.keys(value);
    if (depth >= maxDepth) return `object(${keys.length} keys)`;
    return Object.fromEntries(keys.map((k) => [k, describe(value[k], depth + 1, maxDepth)]));
  }
  return typeName(value);
}

export default register({
  name: "json",
  description: "JSON / GeoJSON: structure summary and GeoJSON feature counts.",
  extensions: [".json", ".geojson"],

  async process(filePath) {
    let data;
    try {
      data = JSON.parse(await fs.readFile(filePath, "utf8"));
    } catch (err) {
      throw new ProcessingError(`Invalid JSON: ${err.message}`);
    }

    const result = { root_type: typeName(data), schema: describe(data) };
    if (typeName(data) === "dict" && data.type === "FeatureCollection") {
      const features = data.features || [];
      const geometryTypes = {};
      for (const feature of features) {
        const gtype = feature?.geometry?.type ?? "None";
        geometryTypes[gtype] = (geometryTypes[gtype] ?? 0) + 1;
      }
      result.geojson = { feature_count: features.length, geometry_types: geometryTypes };
    }
    return result;
  },
});
