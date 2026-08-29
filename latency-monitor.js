import { ENGINE } from "./config.js";

class LatencyMonitor {
  constructor() {
    this.recoveryCount = 0;
    this.current = { latencyMs: null, status: "NO DATA", operable: false };
  }

  update(tick) {
    const serverMs = Number(tick.epoch) * 1000;
    const latencyMs = Math.max(0, Number(tick.receivedAt || Date.now()) - serverMs);

    let status = "OPTIMAL";
    let operable = true;

    if (latencyMs > ENGINE.latency.delayedMs) {
      status = "NO OPERAR";
      operable = false;
      this.recoveryCount = 0;
    } else if (latencyMs > ENGINE.latency.acceptableMs) {
      status = "RETRASO";
      operable = false;
      this.recoveryCount = 0;
    } else if (latencyMs > ENGINE.latency.optimalMs) {
      status = "ACEPTABLE";
      this.recoveryCount += 1;
    } else {
      status = "ÓPTIMA";
      this.recoveryCount += 1;
    }

    if (!operable && this.recoveryCount < ENGINE.latency.recoveryTicks) {
      operable = false;
    }

    this.current = { latencyMs, status, operable };
    return this.current;
  }

  reset() {
    this.recoveryCount = 0;
    this.current = { latencyMs: null, status: "NO DATA", operable: false };
  }
}

export const latencyMonitor = new LatencyMonitor();
