/** Example opt-in processor: PROCESSOR_MODULES=["./app/plugins/ndjson.js"]. */
import fs from 'node:fs/promises';
import { ProcessingError } from '../processors/base.js';
import { register } from '../processors/index.js';

export default register({
  name: 'ndjson',
  description: 'Read newline-delimited JSON records',
  extensions: ['.ndjson', '.jsonl'],
  async process(filePath) {
    const text = await fs.readFile(filePath, 'utf8');
    let count = 0;
    const preview = [];
    for (const [index, line] of text.replace(/^\uFEFF/, '').split(/\r?\n/).entries()) {
      if (!line.trim()) continue;
      let record;
      try { record = JSON.parse(line); }
      catch { throw new ProcessingError('Invalid JSON on line ' + (index + 1)); }
      count++;
      if (preview.length < 5) preview.push(record);
    }
    return { record_count: count, preview };
  },
});
