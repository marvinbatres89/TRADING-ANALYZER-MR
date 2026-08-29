export function evaluateTiming({ strategy, snapshot, latency }) {
  if (!latency?.operable) {
    return {
      approved: false,
      status: "NO OPERAR",
      scoreAdjustment: -25,
      reason: `Latencia ${latency?.status || "desconocida"}.`
    };
  }

  if (strategy === "rise_fall") {
    if (snapshot.lateral) {
      return {
        approved: false,
        status: "ESPERAR",
        scoreAdjustment: -15,
        reason: "Mercado lateral."
      };
    }

    if (snapshot.volatility.level === "VERY HIGH") {
      return {
        approved: false,
        status: "ESPERAR",
        scoreAdjustment: -15,
        reason: "Volatilidad extrema."
      };
    }
  }

  return {
    approved: true,
    status: "AHORA",
    scoreAdjustment: 4,
    reason: "Timing operativo."
  };
}
