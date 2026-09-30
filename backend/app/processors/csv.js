import fs from "node:fs";
import path from "node:path";

import { parse } from "csv-parse";

import { ProcessingError } from "./base.js";
import { register } from "./registry.js";

const PREVIEW_ROWS = 10;
const NUMBER = /^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i;

export default register({
  name: "csv",
  description: "Tabular data: columns, row count, preview and numeric column stats.",
  extensions: [".csv", ".tsv"],

  async process(filePath) {
    const delimiter = path.extname(filePath).toLowerCase() === ".tsv" ? "\t" : ",";
    const parser = fs
      .createReadStream(filePath)
      .pipe(parse({ delimiter, bom: true, relax_column_count: true, skip_empty_lines: true }));

    let columns = null;
    let stats;
    let numeric;
    const preview = [];
    let rowCount = 0;

    for await (const record of parser) {
      if (!columns) {
        columns = record;
        stats = Object.fromEntries(columns.map((c) => [c, { min: null, max: null, sum: 0, count: 0 }]));
        numeric = new Set(columns);
        continue;
      }
      rowCount += 1;
      const row = Object.fromEntries(columns.map((c, i) => [c, record[i] ?? null]));
      if (preview.length < PREVIEW_ROWS) preview.push(row);

      for (const col of [...numeric]) {
        const raw = (row[col] ?? "").trim();
        if (raw === "") continue;
        if (!NUMBER.test(raw)) {
          numeric.delete(col);
          continue;
        }
        const value = Number(raw);
        const s = stats[col];
        s.min = s.min === null ? value : Math.min(s.min, value);
        s.max = s.max === null ? value : Math.max(s.max, value);
        s.sum += value;
        s.count += 1;
      }
    }

    if (!columns) throw new ProcessingError("CSV file has no header row");

    const numericStats = {};
    for (const col of columns) {
      const s = stats[col];
      if (numeric.has(col) && s.count) {
        numericStats[col] = { min: s.min, max: s.max, mean: s.sum / s.count, count: s.count };
      }
    }
    return { columns, row_count: rowCount, preview, numeric_stats: numericStats };
  },
});
