const average = (values) =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

const clamp = (value, min, max) =>
  Math.max(min, Math.min(max, Number(value) || 0));

function trend(prices, size) {
  const sample = prices.slice(-size);
  if (sample.length < 8) {
    return { direction: "LATERAL", strength: 0, percent: 0 };
  }

  const part = Math.max(2, Math.floor(sample.length / 3));
  const first = average(sample.slice(0, part));
  const last = average(sample.slice(-part));
  const percent = first ? ((last - first) / first) * 100 : 0;

  return {
    direction: Math.abs(percent) < 0.003 ? "LATERAL" : percent > 0 ? "BULLISH" : "BEARISH",
    strength: clamp(Math.abs(percent) * 900, 0, 3),
    percent
  };
}

function rsi(prices, period = 14) {
  if (prices.length < period + 1) return null;

  const sample = prices.slice(-(period + 1));
  let gains = 0;
  let losses = 0;

  for (let i = 1; i < sample.length; i += 1) {
    const change = sample[i] - sample[i - 1];
    if (change > 0) gains += change;
    if (change < 0) losses += Math.abs(change);
  }

  if (!losses) return 100;
  const rs = (gains / period) / (losses / period);
  return 100 - 100 / (1 + rs);
}

function momentum(prices, size) {
  if (prices.length < size + 1) {
    return { direction: "NEUTRAL", strength: 0, percent: 0 };
  }

  const start = prices[prices.length - size - 1];
  const end = prices.at(-1);
  const percent = start ? ((end - start) / start) * 100 : 0;

  return {
    direction: Math.abs(percent) < 0.001 ? "NEUTRAL" : percent > 0 ? "POSITIVE" : "NEGATIVE",
    strength: clamp(Math.abs(percent) * 1200, 0, 3),
    percent
  };
}

function flow(prices, size) {
  const sample = prices.slice(-(size + 1));
  let rises = 0;
  let falls = 0;

  for (let i = 1; i < sample.length; i += 1) {
    if (sample[i] > sample[i - 1]) rises += 1;
    if (sample[i] < sample[i - 1]) falls += 1;
  }

  const total = Math.max(1, rises + falls);
  const difference = Math.abs(rises - falls);

  return {
    direction: difference / total < 0.16 ? "NEUTRAL" : rises > falls ? "BULLISH" : "BEARISH",
    strength: clamp(difference / 2, 0, 3),
    rises,
    falls
  };
}

function logReturns(prices) {
  const returns = [];
  for (let i = 1; i < prices.length; i += 1) {
    const prev = prices[i - 1];
    if (prev) {
      returns.push((prices[i] - prev) / prev);
    }
  }
  return returns;
}

/*
  Autocorrelación de lag-1 de los retornos, con prueba de
  significancia estadística (límite de Bartlett: r > 2/√n
  para descartar que la correlación sea puro ruido).

  r > 0 y significativo: momentum real (persistencia).
  r < 0 y significativo: reversión a la media real.
  no significativo: no hay patrón explotable, se ignora.
*/
function autocorrelationSignal(prices, size = 40) {
  const sample = prices.slice(-(size + 1));
  const returns = logReturns(sample);

  const n = returns.length;

  if (n < 15) {
    return { direction: "NEUTRAL", strength: 0, r: 0, significant: false, n };
  }

  const meanR = average(returns);

  let numerator = 0;
  let denominator = 0;

  for (let i = 1; i < n; i += 1) {
    numerator += (returns[i] - meanR) * (returns[i - 1] - meanR);
  }

  for (let i = 0; i < n; i += 1) {
    denominator += (returns[i] - meanR) ** 2;
  }

  const r = denominator ? numerator / denominator : 0;

  const bartlettBound = 2 / Math.sqrt(n);

  const significant = Math.abs(r) > bartlettBound;

  const lastReturn = returns.at(-1) || 0;
  const lastSign = lastReturn > 0 ? "UP" : lastReturn < 0 ? "DOWN" : null;

  let direction = "NEUTRAL";

  if (significant && lastSign) {
    if (r > 0) {
      // Momentum: continúa en la misma dirección del último retorno.
      direction = lastSign === "UP" ? "BULLISH" : "BEARISH";
    } else {
      // Reversión: se espera el sentido contrario.
      direction = lastSign === "UP" ? "BEARISH" : "BULLISH";
    }
  }

  return {
    direction,
    strength: significant ? clamp(Math.abs(r) * 6, 0, 3) : 0,
    r: Math.round(r * 1000) / 1000,
    bartlettBound: Math.round(bartlettBound * 1000) / 1000,
    significant,
    n
  };
}

export function volatility(prices, size = 30) {
  const sample = prices.slice(-size);
  if (sample.length < 5) return { level: "LOW", percent: 0 };

  const mean = average(sample);
  const deviation = Math.sqrt(
    average(sample.map((value) => (value - mean) ** 2))
  );
  const percent = mean ? (deviation / mean) * 100 : 0;

  return {
    level: percent > 0.08 ? "VERY HIGH" : percent > 0.04 ? "HIGH" : percent > 0.015 ? "MEDIUM" : "LOW",
    percent
  };
}

function digitWindow(digits, size) {
  const sample = digits.slice(-size);
  const frequency = Array(10).fill(0);

  sample.forEach((digit) => {
    if (Number.isInteger(digit) && digit >= 0 && digit <= 9) {
      frequency[digit] += 1;
    }
  });

  const even = sample.filter((digit) => digit % 2 === 0).length;
  const low = sample.filter((digit) => digit <= 4).length;

  let hotDigit = 0;
  frequency.forEach((count, index) => {
    if (count > frequency[hotDigit]) hotDigit = index;
  });

  return {
    count: sample.length,
    even,
    odd: sample.length - even,
    evenPercent: sample.length ? (even / sample.length) * 100 : 0,
    oddPercent: sample.length ? ((sample.length - even) / sample.length) * 100 : 0,
    low,
    high: sample.length - low,
    lowPercent: sample.length ? (low / sample.length) * 100 : 0,
    highPercent: sample.length ? ((sample.length - low) / sample.length) * 100 : 0,
    frequency,
    hotDigit,
    hotFrequency: frequency[hotDigit]
  };
}

export function buildSnapshot({ prices = [], digits = [], mode = "fast" } = {}) {
  const deep = mode === "deep";
  const trendValue = trend(prices, deep ? 40 : 20);
  const rsiValue = rsi(prices);
  const momentumValue = momentum(prices, deep ? 18 : 10);
  const shortFlow = flow(prices, 8);
  const mediumFlow = flow(prices, 20);
  const volatilityValue = volatility(prices);
  const autocorr = autocorrelationSignal(prices, deep ? 60 : 40);

  return {
    mode,
    rawPrices: prices.slice(-140),
    rawDigits: digits.slice(-100),
    trend: trendValue,
    rsi: rsiValue,
    rsiState:
      rsiValue === null ? "NO DATA" :
      rsiValue >= 58 ? "BULLISH" :
      rsiValue <= 42 ? "BEARISH" :
      "NEUTRAL",
    momentum: momentumValue,
    shortFlow,
    mediumFlow,
    volatility: volatilityValue,
    autocorr,
    lateral: trendValue.direction === "LATERAL" || shortFlow.direction === "NEUTRAL",
    digits: {
      short: digitWindow(digits, 20),
      medium: digitWindow(digits, 50),
      long: digitWindow(digits, 100)
    }
  };
}
