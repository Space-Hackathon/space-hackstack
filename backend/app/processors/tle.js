import fs from "node:fs/promises";

import { ProcessingError } from "./base.js";
import { register } from "./registry.js";

const EARTH_MU_KM3_S2 = 398600.4418;
const EARTH_RADIUS_KM = 6378.137;
const NUMBER = /^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i;

function num(field, label) {
  const s = field.trim();
  if (!NUMBER.test(s)) throw new Error(`invalid ${label}: '${s}'`);
  return Number(s);
}

/** TLE epoch (YYDDD.DDDDDDDD) as ISO 8601 with microseconds, e.g. 2008-09-20T12:25:40.104192+00:00. */
function epoch(field) {
  let year = num(field.slice(0, 2), "epoch year");
  year += year < 57 ? 2000 : 1900;
  const totalMicros = Math.round((num(field.slice(2), "epoch day") - 1) * 86400 * 1e6);
  const micros = totalMicros % 1_000_000;
  const date = new Date(Date.UTC(year, 0, 1) + (totalMicros - micros) / 1000);
  const fraction = micros ? `.${String(micros).padStart(6, "0")}` : "";
  return `${date.toISOString().slice(0, 19)}${fraction}+00:00`;
}

function parseTle(name, line1, line2) {
  if (line1.length < 8) throw new Error("line 1 is too short");
  const meanMotion = num(line2.slice(52, 63), "mean motion"); // revolutions per day
  const periodS = 86400 / meanMotion;
  const semiMajorKm = Math.cbrt(EARTH_MU_KM3_S2 * (periodS / (2 * Math.PI)) ** 2);
  const eccentricity = num(`0.${line2.slice(26, 33).trim()}`, "eccentricity");
  return {
    name,
    norad_id: num(line1.slice(2, 7), "catalog number"),
    classification: line1[7],
    international_designator: line1.slice(9, 17).trim(),
    epoch: epoch(line1.slice(18, 32).trim()),
    inclination_deg: num(line2.slice(8, 16), "inclination"),
    raan_deg: num(line2.slice(17, 25), "RAAN"),
    eccentricity,
    arg_perigee_deg: num(line2.slice(34, 42), "argument of perigee"),
    mean_anomaly_deg: num(line2.slice(43, 51), "mean anomaly"),
    mean_motion_rev_per_day: meanMotion,
    period_min: periodS / 60,
    apogee_km: semiMajorKm * (1 + eccentricity) - EARTH_RADIUS_KM,
    perigee_km: semiMajorKm * (1 - eccentricity) - EARTH_RADIUS_KM,
  };
}

export default register({
  name: "tle",
  description: "Satellite Two-Line Element sets: parsed orbital elements per object.",
  extensions: [".tle", ".3le"],

  async process(filePath) {
    const lines = (await fs.readFile(filePath, "utf8"))
      .split(/\r\n|\r|\n/)
      .filter((ln) => ln.trim())
      .map((ln) => ln.trimEnd());
    const satellites = [];
    const errors = [];

    let i = 0;
    while (i < lines.length) {
      let name = null;
      if (!lines[i].startsWith("1 ")) {
        name = lines[i].replace(/^0 /, "").trim();
        i += 1;
      }
      if (i + 1 >= lines.length || !lines[i].startsWith("1 ") || !lines[i + 1].startsWith("2 ")) {
        errors.push(`Malformed TLE near line ${i + 1}`);
        i += 1;
        continue;
      }
      try {
        satellites.push(parseTle(name, lines[i], lines[i + 1]));
      } catch (err) {
        errors.push(`Could not parse TLE near line ${i + 1}: ${err.message}`);
      }
      i += 2;
    }

    if (satellites.length === 0) {
      throw new ProcessingError(`No valid TLE records found${errors.length ? `: ${errors[0]}` : ""}`);
    }
    return { count: satellites.length, satellites, errors };
  },
});
