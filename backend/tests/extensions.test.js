import './setup.js';
import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import request from 'supertest';

// Exercise the actual startup loader and API rather than registering directly.
process.env.PROCESSOR_MODULES = '["./app/plugins/ndjson.js"]';
process.env.ML_PIPELINE_MODULE = './app/plugins/rms.js';
const { createApp } = await import('../app/main.js');
const { initDb, closeDb } = await import('../app/core/database.js');
const { loadPipeline } = await import('../app/extensions.js');
initDb();
const app = createApp();
after(() => closeDb());

test('capabilities include configured processors and upload limit', async () => {
  const response = await request(app).get('/api/capabilities').expect(200);
  assert.equal(response.body.contract_version, '1');
  assert.equal(response.body.max_upload_bytes, 200 * 1024 * 1024);
  assert.ok(response.body.processors.some((p) => p.name === 'ndjson'));
});
test('configured processor handles uploads and reports invalid records', async () => {
  const response = await request(app).post('/api/files').attach('file', Buffer.from('{"value":1}\n{"value":2}\n'), 'records.jsonl').expect(201);
  assert.equal(response.body.processor, 'ndjson');
  assert.equal(response.body.result.record_count, 2);
  const bad = await request(app).post('/api/files').attach('file', Buffer.from('{bad}\n'), 'bad.jsonl').expect(201);
  assert.equal(bad.body.status, 'failed');
});
test('configured model adapter is used without route changes', async () => {
  const info = await request(app).get('/api/ml/model').expect(200);
  assert.equal(info.body.model, 'example-rms');
  const result = await request(app).post('/api/ml/predict').send({ features: [3, 3] }).expect(200);
  assert.deepEqual(result.body, { prediction: 3, model: 'example-rms' });
});
test('malformed model adapter fails early', async () => {
  await assert.rejects(loadPipeline('./app/plugins/ndjson.js'), /must export/);
});
test('negative offsets and empty pages are rejected', async () => {
  await request(app).get('/api/files?offset=-1').expect(422);
  await request(app).get('/api/files?limit=0').expect(422);
});
