export function buildConsensus(engine1, engine2) {
  if (!engine1 || !engine2) {
    return {
      approved: false,
      score: 0,
      direction: "WAIT",
      reasons: ["Sin consenso disponible."]
    };
  }

  const approved =
    engine2.approved &&
    engine1.direction === engine2.direction &&
    !["WAIT", "NO_OPERAR"].includes(engine1.direction);

  return {
    approved,
    // El score de la validación (engine2) ya combina las dos lecturas
    // frescas independientes; no se vuelve a mezclar con engine1 para no
    // sesgar el resultado hacia la primera lectura.
    score: engine2.score,
    direction: approved ? engine1.direction : "WAIT",
    reasons: [
      ...(engine1.reasons || []),
      ...(engine2.reasons || [])
    ],
    warnings: engine1.warnings || [],
    metadata: engine1.metadata || {}
  };
}
