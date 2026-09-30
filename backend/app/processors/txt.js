import fs from "node:fs/promises";

import { register } from "./registry.js";

const PREVIEW_LINES = 20;

export default register({
  name: "txt",
  description: "Plain text: line/word/char counts and a preview.",
  extensions: [".txt", ".log", ".md"],

  async process(filePath) {
    const text = (await fs.readFile(filePath)).toString("utf8");
    const lines = text === "" ? [] : text.replace(/(\r\n|\r|\n)$/, "").split(/\r\n|\r|\n/);
    const words = text.split(/\s+/).filter(Boolean);
    return {
      line_count: lines.length,
      word_count: words.length,
      char_count: [...text].length,
      preview: lines.slice(0, PREVIEW_LINES),
    };
  },
});
