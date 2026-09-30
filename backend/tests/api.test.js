import { SAMPLES } from "./setup.js";

import assert from "node:assert/strict";
import path from "node:path";
import { after, before, test } from "node:test";

import sharp from "sharp";
import request from "supertest";

import { closeDb, initDb } from "../app/core/database.js";
import { createApp } from "../app/main.js";

let app;
before(() => {
  initDb();
  app = createApp();
});
after(() => closeDb());

const approx = (actual, expected, tol = 1e-6) => assert.ok(Math.abs(actual - expected) < tol, `${actual} != ${expected}`);

test("health", async () => {
  const r = await request(app).get("/api/health");
  assert.equal(r.status, 200);
  assert.equal(r.body.status, "ok");
});

test("list processors", async () => {
  const names = new Set((await request(app).get("/api/processors")).body.map((p) => p.name));
  for (const n of ["csv", "txt", "json", "image", "tle"]) assert.ok(names.has(n), n);
});

test("upload TLE is parsed", async () => {
  const r = await request(app).post("/api/files").attach("file", path.join(SAMPLES, "iss.tle"));
  assert.equal(r.status, 201);
  assert.equal(r.body.status, "processed");
  assert.equal(r.body.processor, "tle");
  const sat = r.body.result.satellites[0];
  assert.equal(sat.norad_id, 25544);
  assert.equal(sat.name, "ISS (ZARYA)");
  assert.equal(sat.epoch, "2008-09-20T12:25:40.104192+00:00");
  approx(sat.inclination_deg, 51.6416);
  assert.ok(sat.period_min > 90 && sat.period_min < 93);
  assert.ok(sat.perigee_km > 300 && sat.perigee_km < 400);
});

test("upload CSV stats", async () => {
  const r = await request(app).post("/api/files").attach("file", path.join(SAMPLES, "ground_passes.csv"));
  const { result } = r.body;
  assert.equal(result.row_count, 5);
  assert.ok(!("satellite" in result.numeric_stats));
  approx(result.numeric_stats.elevation_deg.max, 54.3);
});

test("upload image", async () => {
  const png = await sharp({ create: { width: 4, height: 3, channels: 3, background: { r: 10, g: 20, b: 30 } } })
    .png()
    .toBuffer();
  const r = await request(app).post("/api/files").attach("file", png, { filename: "tile.png", contentType: "image/png" });
  const { result } = r.body;
  assert.deepEqual([result.width, result.height], [4, 3]);
  assert.equal(result.format, "PNG");
  assert.equal(result.mode, "RGB");
  assert.equal(result.band_stats.G.mean, 20);
});

test("invalid JSON is marked failed", async () => {
  const r = await request(app)
    .post("/api/files")
    .attach("file", Buffer.from("{not json"), { filename: "bad.json", contentType: "application/json" });
  assert.equal(r.status, 201);
  assert.equal(r.body.status, "failed");
  assert.match(r.body.error, /Invalid JSON/);
});

test("file lifecycle", async () => {
  let r = await request(app)
    .post("/api/files?process=false")
    .attach("file", Buffer.from("a b c\nd"), { filename: "../../evil.txt", contentType: "text/plain" });
  const fileId = r.body.id;
  assert.equal(r.body.filename, "evil.txt");
  assert.equal(r.body.status, "uploaded");

  r = await request(app).get("/api/files");
  assert.ok(r.body.some((f) => f.id === fileId));
  assert.ok(!("result" in r.body[0]));

  r = await request(app).post(`/api/files/${fileId}/process`);
  assert.equal(r.body.result.word_count, 4);

  r = await request(app).get(`/api/files/${fileId}/download`).buffer(true).parse((res, cb) => {
    const chunks = [];
    res.on("data", (c) => chunks.push(c));
    res.on("end", () => cb(null, Buffer.concat(chunks)));
  });
  assert.equal(r.body.toString(), "a b c\nd");

  assert.equal((await request(app).delete(`/api/files/${fileId}`)).status, 204);
  r = await request(app).get(`/api/files/${fileId}`);
  assert.equal(r.status, 404);
  assert.deepEqual(r.body, { detail: "File not found" });
});

test("unknown processor", async () => {
  const r = await request(app)
    .post("/api/files?processor=nope")
    .attach("file", Buffer.from("x"), { filename: "x.txt", contentType: "text/plain" });
  assert.equal(r.status, 400);
});

test("ml predict", async () => {
  assert.equal((await request(app).get("/api/ml/model")).body.model, "dummy-mean");
  const r = await request(app).post("/api/ml/predict").send({ features: [1, 2, 3] });
  assert.equal(r.body.prediction, 2);
  assert.equal((await request(app).post("/api/ml/predict").send({ features: "x" })).status, 422);
});
