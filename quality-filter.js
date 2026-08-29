import { ENGINE } from "./config.js";

export function applyQualityFilter({
  strategy,
  opportunity,
  consensus,
  timing
}) {
  const threshold = ENGINE.qualityThresholds[strategy] ?? 70;
  const score = Math.max(
    0,
    Math.min(100, Math.round((consensus?.score || 0) + (timing?.scoreAdjustment || 0)))
  );

  if (opportunity?.direction === "NO_OPERAR") {
    return {
      approved: false,
      state: "NO_OPERAR",
      score,
      reason: "El candidato es 0. Regla oficial: no operar."
    };
  }

  if (!timing?.approved) {
    return {
      approved: false,
      state: "WAIT",
      score,
      reason: timing?.reason || "Timing no aprobado."
    };
  }

  if (!consensus?.approved || score < threshold) {
    return {
      approved: false,
      state: "WAIT",
      score,
      reason: `Calidad insuficiente (${score}/${threshold}).`
    };
  }

  return {
    approved: true,
    state: "READY",
    score,
    reason: "Los filtros principales fueron superados."
  };
}
