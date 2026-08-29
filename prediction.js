export function visualDirection(result) {
  if (!result) return "--";
  if (result.direction === "MATCH") {
    return `MATCHES ${result.metadata?.digit ?? "--"}`;
  }
  if (result.direction === "NO_OPERAR") {
    return "MATCHES 0";
  }
  return result.direction;
}

export function briefExplanation(result) {
  const reasons = result?.reasons || [];
  return reasons.slice(0, 2).join(" ");
}
