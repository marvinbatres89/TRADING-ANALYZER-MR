export const APP_VERSION = "12.0.3-CONFIDENCE-SYNC";

export const DERIV = Object.freeze({
  publicWebSocket: "wss://api.derivws.com/trading/v1/options/ws/public",
  pingIntervalMs: 30000,
  reconnectBaseMs: 1500,
  reconnectMaxMs: 12000
});

export const MARKETS = Object.freeze({
  "1HZ10V": {
    name: "Volatility 10 (1s) Index",
    enabled: true,
    strategies: ["rise_fall", "even_odd", "over_under", "match"]
  },
  "1HZ25V": {
    name: "Volatility 25 (1s) Index",
    enabled: true,
    strategies: ["rise_fall", "even_odd", "over_under", "match"]
  },
  "1HZ50V": {
    name: "Volatility 50 (1s) Index",
    enabled: true,
    strategies: ["rise_fall", "even_odd", "over_under", "match"]
  },
  "1HZ75V": {
    name: "Volatility 75 (1s) Index",
    enabled: true,
    strategies: ["rise_fall", "even_odd", "over_under", "match"]
  },
  "1HZ100V": {
    name: "Volatility 100 (1s) Index",
    enabled: true,
    strategies: ["rise_fall", "even_odd", "over_under", "match"]
  },
  "R_10": {
    name: "Volatility 10 Index",
    enabled: true,
    strategies: ["rise_fall", "even_odd", "over_under", "match"]
  },
  "R_25": {
    name: "Volatility 25 Index",
    enabled: true,
    strategies: ["rise_fall", "even_odd", "over_under", "match"]
  },
  "R_50": {
    name: "Volatility 50 Index",
    enabled: true,
    strategies: ["rise_fall", "even_odd", "over_under", "match"]
  },
  "R_75": {
    name: "Volatility 75 Index",
    enabled: true,
    strategies: ["rise_fall", "even_odd", "over_under", "match"]
  },
  "R_100": {
    name: "Volatility 100 Index",
    enabled: true,
    strategies: ["rise_fall", "even_odd", "over_under", "match"]
  }
});

export const STRATEGIES = Object.freeze({
  rise_fall: { name: "Rise / Fall", voice: "sube o baja" },
  even_odd: { name: "Even / Odd", voice: "par o impar" },
  over_under: { name: "Over / Under", voice: "mayor o menor" },
  match: { name: "Matches", voice: "coincidencia" },
  boom: { name: "Boom", voice: "boom" },
  crash: { name: "Crash", voice: "crash" }
});

export const ENGINE = Object.freeze({
  maxPrices: 500,
  maxDigits: 500,
  maxLogLines: 100,
  maxDiagnosticEvents: 250,
  minFastTicks: 30,
  minDeepTicks: 80,
  minMatchTicks: 50,
  minSpikeTicks: 45,
  scanIntervalMs: 250,
  quickValidationMs: 1800,
  riseFallValidationMs: 1100,
  spikeValidationMs: 1000,
  secondConfirmationMs: 500,
  preparePauseMs: 1800,
  executionSeconds: 10,
  cooldownMs: 3000,
  qualityThresholds: {
    rise_fall: 76,
    even_odd: 80,
    over_under: 80,
    match: 84,
    boom: 78,
    crash: 78
  },
  latency: {
    optimalMs: 500,
    acceptableMs: 1000,
    delayedMs: 2000,
    recoveryTicks: 3
  },
  calibration: {
    minimumPreliminarySamples: 20,
    minimumObservedSamples: 50,
    allowedSeconds: [10,9,8,7,6,5,4,3,2,1]
  }
});

export const VOICE = Object.freeze({
  language: "es-SV",
  rate: 1.05
});
