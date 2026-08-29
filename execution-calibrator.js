import { ENGINE } from "./config.js";

class ExecutionCalibrator {
  constructor() {
    this.storageKey = "trading-analyst-pro-mr-v11-calibration";
    this.data = this.load();
  }
  load() {
    try { return JSON.parse(localStorage.getItem(this.storageKey) || "{}"); }
    catch { return {}; }
  }
  save() {
    try { localStorage.setItem(this.storageKey, JSON.stringify(this.data)); }
    catch {}
  }
  key({ symbol, strategy, mode }) {
    return [symbol, strategy, mode].join("|");
  }
  ensure(context) {
    const key = this.key(context);
    if (!this.data[key]) {
      this.data[key] = {};
      ENGINE.calibration.allowedSeconds.forEach((second) => {
        this.data[key][second] = { tests: 0, success: 0, failed: 0 };
      });
    }
    return this.data[key];
  }
  record(context, second, success) {
    if (!ENGINE.calibration.allowedSeconds.includes(Number(second))) return null;
    const stats = this.ensure(context)[second];
    stats.tests += 1;
    success ? stats.success += 1 : stats.failed += 1;
    this.save();
    return stats;
  }
  recommendation(context) {
    const rows = ENGINE.calibration.allowedSeconds.map((second) => {
      const stats = this.ensure(context)[second];
      return {
        second, ...stats,
        accuracy: stats.tests ? (stats.success / stats.tests) * 100 : 0
      };
    });
    const eligible = rows.filter(
      (row) => row.tests >= ENGINE.calibration.minimumPreliminarySamples
    );
    if (!eligible.length) {
      return { status: "SIN RECOMENDACIÓN", second: null, rows };
    }
    eligible.sort((a, b) => b.accuracy - a.accuracy || b.tests - a.tests);
    const best = eligible[0];
    return {
      status: best.tests >= ENGINE.calibration.minimumObservedSamples
        ? "MOMENTO OBSERVADO" : "TENDENCIA PRELIMINAR",
      second: best.second,
      accuracy: best.accuracy,
      tests: best.tests,
      rows
    };
  }
  reset(context) {
    delete this.data[this.key(context)];
    this.save();
  }
}
export const executionCalibrator = new ExecutionCalibrator();
