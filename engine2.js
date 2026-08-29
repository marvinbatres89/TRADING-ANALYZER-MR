export function validateOpportunity(opportunity, freshOpportunity, snapshot) {
  if (!opportunity || !freshOpportunity || !snapshot) {
    return {
      approved: false,
      score: 0,
      direction: "WAIT",
      reasons: ["Información insuficiente."]
    };
  }

  const sameDigit =
    opportunity.strategy !== "match" ||
    opportunity.metadata?.digit === freshOpportunity.metadata?.digit;

  const sameDirection =
    opportunity.direction === freshOpportunity.direction &&
    opportunity.strategy === freshOpportunity.strategy &&
    sameDigit;

  let score = Math.round((opportunity.score + freshOpportunity.score) / 2);
  const reasons = [];

  if (sameDirection) {
    score += opportunity.strategy === "match" ? 8 : 6;
    reasons.push(
      opportunity.strategy === "match"
        ? "El mismo dígito se mantuvo durante la validación."
        : "El validador mantiene la misma dirección."
    );
  } else {
    score -= 25;
    reasons.push(
      opportunity.strategy === "match"
        ? "El candidato de Matches cambió durante la validación."
        : "La dirección cambió durante la validación."
    );
  }

  if (opportunity.strategy === "rise_fall") {
    if (snapshot.lateral) score -= 12;
    if (snapshot.volatility.level === "VERY HIGH") score -= 12;
  }

  return {
    approved: sameDirection && score >= 55,
    score: Math.max(0, Math.min(100, score)),
    direction: sameDirection ? opportunity.direction : "WAIT",
    reasons
  };
}
