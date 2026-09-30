import fs from "node:fs/promises";

import { register } from "./registry.js";

const PREVIEW_LINES = 20;

export default register({
  name: "txt",
  description: "Plain text: line/word/char counts and a preview.",
  extensions: [".txt", ".log", ".md"],

  async process(filePath) {
    // Normalise newlines like Python's text mode so counts match the FastAPI backend.
    const text = (await fs.readFile(filePath)).toString("utf8").replace(/\r\n?/g, "\n");
    const lines = text === "" ? [] : text.replace(/\n$/, "").split("\n");
    const words = text.split(/\s+/).filter(Boolean);
    return {
      line_count: lines.length,
      word_count: words.length,
      char_count: [...text].length,
      preview: lines.slice(0, PREVIEW_LINES),
    };
  },
});
