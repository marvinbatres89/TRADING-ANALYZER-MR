const clamp = (value, min, max) =>
  Math.max(min, Math.min(max, Number(value) || 0));

function output(
  strategy,
  direction,
  score,
  reasons,
  warnings = [],
  metadata = {}
) {
  const rawScore = Number(score) || 0;

  const visibleScore =
    Math.round(
      clamp(
        rawScore,
        0,
        100
      )
    );

  return {
    source: "ENGINE_1",
    strategy,
    direction,

    score:
      visibleScore,

    rawScore:
      Math.round(
        rawScore * 100
      ) / 100,

    reasons,
    warnings,

    metadata: {
      ...metadata,

      rawScore:
        Math.round(
          rawScore * 100
        ) / 100,

      visibleScore,

      scoreSaturated:
        rawScore > 100
    },

    createdAt:
      Date.now()
  };
}


function riseFall(snapshot) {
  let bullish = 0;
  let bearish = 0;

  const upReasons = [];
  const downReasons = [];
  const warnings = [];

  if (snapshot.trend.direction === "BULLISH") {
    bullish +=
      26 +
      snapshot.trend.strength * 4;

    upReasons.push(
      "Tendencia principal alcista."
    );
  }

  if (snapshot.trend.direction === "BEARISH") {
    bearish +=
      26 +
      snapshot.trend.strength * 4;

    downReasons.push(
      "Tendencia principal bajista."
    );
  }

  if (snapshot.momentum.direction === "POSITIVE") {
    bullish +=
      18 +
      snapshot.momentum.strength * 3;

    upReasons.push(
      "Momentum positivo."
    );
  }

  if (snapshot.momentum.direction === "NEGATIVE") {
    bearish +=
      18 +
      snapshot.momentum.strength * 3;

    downReasons.push(
      "Momentum negativo."
    );
  }

  if (snapshot.shortFlow.direction === "BULLISH") {
    bullish +=
      18 +
      snapshot.shortFlow.strength * 3;

    upReasons.push(
      "Flujo corto alcista."
    );
  }

  if (snapshot.shortFlow.direction === "BEARISH") {
    bearish +=
      18 +
      snapshot.shortFlow.strength * 3;

    downReasons.push(
      "Flujo corto bajista."
    );
  }

  if (snapshot.mediumFlow.direction === "BULLISH") {
    bullish += 8;
  }

  if (snapshot.mediumFlow.direction === "BEARISH") {
    bearish += 8;
  }

  /*
    Autocorrelación de lag-1 con prueba de significancia
    (Bartlett). Es el único componente aquí respaldado por
    una prueba estadística real, no una heurística visual,
    así que pesa más que el resto.
  */
  if (snapshot.autocorr?.significant) {

    const peso =
      22 +
      snapshot.autocorr.strength * 6;

    if (snapshot.autocorr.direction === "BULLISH") {
      bullish += peso;
      upReasons.push(
        `Autocorrelación significativa (r=${snapshot.autocorr.r}).`
      );
    }

    if (snapshot.autocorr.direction === "BEARISH") {
      bearish += peso;
      downReasons.push(
        `Autocorrelación significativa (r=${snapshot.autocorr.r}).`
      );
    }

  } else {
    warnings.push(
      "Sin autocorrelación significativa (posible ruido)."
    );
  }

  if (snapshot.rsiState === "BULLISH") {
    bullish += 10;
  }

  if (snapshot.rsiState === "BEARISH") {
    bearish += 10;
  }

  if (snapshot.lateral) {
    bullish -= 12;
    bearish -= 12;

    warnings.push(
      "Mercado lateral."
    );
  }

  if (snapshot.volatility.level === "VERY HIGH") {
    bullish -= 14;
    bearish -= 14;

    warnings.push(
      "Volatilidad extrema."
    );
  }

  const direction =
    bullish >= bearish
      ? "RISE"
      : "FALL";

  const score =
    Math.max(
      bullish,
      bearish
    );

  const difference =
    Math.abs(
      bullish -
      bearish
    );

  return output(
    "rise_fall",

    difference < 8
      ? "WAIT"
      : direction,

    difference < 8
      ? score - 10
      : score,

    direction === "RISE"
      ? upReasons
      : downReasons,

    warnings,

    {
      difference
    }
  );
}


/*
  Prueba z de proporción binomial: ¿la proporción observada de
  un evento binario (par/impar, alto/bajo) se aleja de forma
  estadísticamente significativa del 50% esperado en un proceso
  uniforme? z > 1.96 (o < -1.96) equivale a un 95% de confianza.

  Sin esto, cualquier racha de pares/impares por puro azar se
  leía como "señal", igual que pasaba con el dígito caliente de
  Matches antes de corregirlo.
*/
function binomialProportionTest(countA, n, p0 = 0.5) {
  if (!n) {
    return { z: 0, significant: false, pHat: p0 };
  }

  const pHat = countA / n;
  const stdError = Math.sqrt((p0 * (1 - p0)) / n);
  const z = stdError ? (pHat - p0) / stdError : 0;

  return {
    z: Math.round(z * 100) / 100,
    significant: Math.abs(z) > 1.96,
    pHat: Math.round(pHat * 1000) / 1000
  };
}


function digitBinary(
  strategy,
  snapshot
) {
  const short =
    snapshot.digits.short;

  const medium =
    snapshot.digits.medium;

  const long =
    snapshot.digits.long;

  if (short.count < 20) {
    return output(
      strategy,
      "WAIT",
      0,
      [
        "Recopilando dígitos."
      ]
    );
  }

  let direction;
  let labelA;
  let labelB;
  let countA;

  if (strategy === "even_odd") {
    labelA = "pares";
    labelB = "impares";
  } else {
    labelA = "altos";
    labelB = "bajos";
  }

  /*
    Usa la ventana más grande disponible (más muestra = más
    poder estadístico, menos falsos positivos por ruido).
  */
  const testWindow =
    long.count >= 80
      ? long
      : medium;

  countA =
    strategy === "even_odd"
      ? testWindow.even
      : testWindow.high;

  const zTest = binomialProportionTest(countA, testWindow.count);

  if (!zTest.significant) {
    return output(
      strategy,
      "NO_OPERAR",
      0,
      [
        `Proporción de ${labelA} (${(zTest.pHat * 100).toFixed(1)}%) sin desviación significativa del 50% (z=${zTest.z}). No operar: patrón indistinguible de ruido.`
      ],
      [
        "La distribución histórica no garantiza el siguiente dígito."
      ],
      { zTest }
    );
  }

  direction =
    zTest.z > 0
      ? (strategy === "even_odd" ? "EVEN" : "OVER")
      : (strategy === "even_odd" ? "ODD" : "UNDER");

  const visibleScore =
    Math.round(
      clamp(50 + Math.abs(zTest.z) * 15, 0, 100)
    );

  return output(
    strategy,

    direction,

    visibleScore,

    [
      `Desviación significativa: ${(zTest.pHat * 100).toFixed(1)}% ${labelA} sobre ${testWindow.count} dígitos (z=${zTest.z}).`,
      `Comparación de ${labelA} frente a ${labelB}.`
    ],

    [
      "La distribución histórica no garantiza el siguiente dígito."
    ],

    {
      zTest,
      visibleScore
    }
  );
}


function median(values) {
  if (!values.length) {
    return 0;
  }

  const sorted =
    values
      .slice()
      .sort(
        (a, b) =>
          a - b
      );

  const mid =
    Math.floor(
      sorted.length / 2
    );

  return sorted.length % 2
    ? sorted[mid]
    : (
        sorted[mid - 1] +
        sorted[mid]
      ) / 2;
}


function spikeWatch(
  strategy,
  snapshot
) {
  const prices =
    snapshot.rawPrices ||
    [];

  if (prices.length < 45) {
    return output(
      strategy,
      "WAIT",
      0,

      [
        `Recopilando precios para ${
          strategy === "boom"
            ? "Boom"
            : "Crash"
        }: ${prices.length}/45.`
      ],

      [
        "Motor experimental de contexto previo a picos."
      ]
    );
  }


  const sample =
    prices.slice(-45);


  const deltas =
    [];


  for (
    let i = 1;
    i < sample.length;
    i += 1
  ) {
    deltas.push(
      sample[i] -
      sample[i - 1]
    );
  }


  const absDeltas =
    deltas.map(
      (v) =>
        Math.abs(v)
    );


  const typical =
    Math.max(
      median(
        absDeltas
      ),
      1e-12
    );


  const spikeLimit =
    typical * 4.5;


  const recent =
    deltas.slice(-12);


  const spikeDirection =
    strategy === "boom"
      ? 1
      : -1;


  let lastSpike =
    -1;


  recent.forEach(
    (
      delta,
      index
    ) => {
      if (
        Math.sign(
          delta
        ) ===
          spikeDirection &&
        Math.abs(
          delta
        ) >=
          spikeLimit
      ) {
        lastSpike =
          index;
      }
    }
  );


  const ticksSinceSpike =
    lastSpike < 0
      ? 12
      : recent.length -
        1 -
        lastSpike;


  const driftMatches =
    strategy === "boom"
      ? [
          "BEARISH",
          "LATERAL"
        ].includes(
          snapshot.trend.direction
        )
      : [
          "BULLISH",
          "LATERAL"
        ].includes(
          snapshot.trend.direction
        );


  const momentumMatches =
    strategy === "boom"
      ? [
          "NEGATIVE",
          "NEUTRAL"
        ].includes(
          snapshot.momentum.direction
        )
      : [
          "POSITIVE",
          "NEUTRAL"
        ].includes(
          snapshot.momentum.direction
        );


  const flowMatches =
    strategy === "boom"
      ? [
          "BEARISH",
          "NEUTRAL"
        ].includes(
          snapshot.shortFlow.direction
        )
      : [
          "BULLISH",
          "NEUTRAL"
        ].includes(
          snapshot.shortFlow.direction
        );


  const quietContext =
    [
      "LOW",
      "MEDIUM"
    ].includes(
      snapshot.volatility.level
    );


  const expectedSign =
    strategy === "boom"
      ? -1
      : 1;


  const stableRun =
    recent.filter(
      (delta) =>
        Math.sign(
          delta
        ) ===
        expectedSign
    ).length;


  let score =
    48;


  const reasons =
    [];


  const warnings = [
    "Boom/Crash es experimental: el momento exacto del pico no puede garantizarse.",
    "La señal evalúa contexto reciente, no certeza del siguiente tick."
  ];


  if (driftMatches) {
    score += 10;

    reasons.push(
      "Tendencia compatible con la fase previa buscada."
    );
  }


  if (momentumMatches) {
    score += 9;

    reasons.push(
      "Momentum compatible con el contexto."
    );
  }


  if (flowMatches) {
    score += 8;

    reasons.push(
      "Flujo corto compatible con la estrategia."
    );
  }


  if (quietContext) {
    score += 8;

    reasons.push(
      "Volatilidad reciente contenida."
    );
  }


  if (ticksSinceSpike >= 6) {
    score += 9;

    reasons.push(
      `Sin pico dominante en los últimos ${ticksSinceSpike} ticks observados.`
    );
  }

  else {
    score -= 16;

    warnings.push(
      "Se detectó un pico reciente; se aplica enfriamiento."
    );
  }


  if (stableRun >= 7) {
    score += 7;

    reasons.push(
      `Secuencia reciente consistente: ${stableRun}/12 movimientos compatibles.`
    );
  }


  score =
    Math.max(
      0,
      Math.min(
        100,
        score
      )
    );


  const approved =
    driftMatches &&
    momentumMatches &&
    flowMatches &&
    ticksSinceSpike >= 5 &&
    score >= 72;


  return output(
    strategy,

    approved
      ? (
          strategy === "boom"
            ? "BOOM"
            : "CRASH"
        )
      : "WAIT",

    score,

    reasons.length
      ? reasons
      : [
          "Contexto todavía insuficiente."
        ],

    warnings,

    {
      ticksSinceSpike,
      typicalMovement:
        typical,
      spikeLimit,
      stableRun
    }
  );
}


/*
  Prueba chi-cuadrado de bondad de ajuste: ¿la distribución de
  dígitos observada se aleja de forma estadísticamente
  significativa de la distribución uniforme esperada (10% cada
  dígito)? Si no se aleja, el "dígito caliente" es ruido de
  muestreo, no un patrón real, y no debe operarse.

  Valor crítico para 9 grados de libertad, alpha=0.05: 16.92.
*/
function chiSquareUniformTest(frequency, n) {
  if (!n) {
    return { chiSquare: 0, significant: false, criticalValue: 16.92 };
  }

  const expected = n / 10;
  let chiSquare = 0;

  for (let digit = 0; digit <= 9; digit += 1) {
    const diff = frequency[digit] - expected;
    chiSquare += (diff * diff) / expected;
  }

  const criticalValue = 16.92;

  return {
    chiSquare: Math.round(chiSquare * 100) / 100,
    significant: chiSquare > criticalValue,
    criticalValue
  };
}


function matches(snapshot) {
  const short =
    snapshot.digits.short;

  const medium =
    snapshot.digits.medium;

  const long =
    snapshot.digits.long;


  if (
    short.count < 20 ||
    medium.count < 50
  ) {
    return output(
      "match",
      "WAIT",
      0,

      [
        `Recopilando dígitos para Matches: ${medium.count}/50.`
      ]
    );
  }


  /*
    Usa la ventana más grande disponible para la prueba
    estadística (más muestra = más poder para detectar un
    sesgo real y menos falsos positivos por ruido).
  */
  const testWindow =
    long.count >= 80
      ? long
      : medium;

  const chiTest =
    chiSquareUniformTest(
      testWindow.frequency,
      testWindow.count
    );

  if (!chiTest.significant) {
    return output(
      "match",
      "NO_OPERAR",
      0,

      [
        `Distribución de dígitos sin sesgo real (χ²=${chiTest.chiSquare} < ${chiTest.criticalValue}). No operar: patrón indistinguible de ruido.`
      ],

      [],

      { chiTest }
    );
  }


  const recentDigits =
    snapshot.rawDigits
      ?.slice(-10) ||
    [];


  const recentFrequency =
    Array(10)
      .fill(0);


  recentDigits.forEach(
    (digit) => {
      if (
        Number.isInteger(
          digit
        ) &&
        digit >= 0 &&
        digit <= 9
      ) {
        recentFrequency[
          digit
        ] += 1;
      }
    }
  );


  const scores =
    Array(10)
      .fill(0);


  for (
    let digit = 0;
    digit <= 9;
    digit += 1
  ) {
    const shortRate =
      short.frequency[
        digit
      ] /
      Math.max(
        1,
        short.count
      );


    const mediumRate =
      medium.frequency[
        digit
      ] /
      Math.max(
        1,
        medium.count
      );


    const longRate =
      long.frequency[
        digit
      ] /
      Math.max(
        1,
        long.count
      );


    const recentRate =
      recentFrequency[
        digit
      ] /
      Math.max(
        1,
        recentDigits.length ||
        1
      );


    scores[
      digit
    ] =
      shortRate * 42 +
      mediumRate * 30 +
      longRate * 13 +
      recentRate * 15;
  }


  const ranked =
    scores
      .map(
        (
          score,
          digit
        ) => ({
          digit,
          score
        })
      )
      .sort(
        (
          a,
          b
        ) =>
          b.score -
          a.score
      );


  const first =
    ranked[0];


  const second =
    ranked[1];


  const separation =
    first.score -
    second.score;


  if (first.digit === 0) {
    return output(
      "match",
      "NO_OPERAR",
      0,

      [
        "El número 0 es el candidato dominante."
      ],

      [
        "Regla del proyecto: 0 = NO OPERAR."
      ],

      {
        digit:
          0,

        separation
      }
    );
  }


  const leaderVotes =
    [
      short.hotDigit,
      medium.hotDigit,
      long.hotDigit
    ]
      .filter(
        (digit) =>
          digit ===
          first.digit
      )
      .length;


  const recentHits =
    recentFrequency[
      first.digit
    ] ||
    0;


  const support =
    leaderVotes >= 2 &&
    short.hotDigit ===
      first.digit &&
    recentHits >= 2;


  let score =
    54 +
    Math.min(
      16,
      separation * 7
    ) +
    Math.min(
      14,
      Math.max(
        0,
        first.score - 9.5
      ) * 3
    ) +
    (
      leaderVotes >= 2
        ? 8
        : 0
    ) +
    (
      recentHits >= 2
        ? 5
        : 0
    );


  score =
    Math.max(
      0,
      Math.min(
        100,
        score
      )
    );


  const approved =
    support &&
    separation >= 0.75 &&
    first.score >= 10.5 &&
    score >= 76;


  return output(
    "match",

    approved
      ? "MATCH"
      : "WAIT",

    score,

    [
      `Candidato ${first.digit}: frecuencia combinada ${first.score.toFixed(2)}%.`,

      `Separación frente al segundo candidato: ${separation.toFixed(2)} puntos.`,

      `Confirmación de ventanas: ${leaderVotes}/3; presencia reciente: ${recentHits}/10.`
    ],

    [
      "Matches sigue siendo experimental.",
      "La frecuencia pasada no garantiza el siguiente dígito."
    ],

    {
      digit:
        first.digit,

      separation,

      combinedFrequency:
        first.score,

      leaderVotes,

      recentHits,

      support
    }
  );
}


export function exploreOpportunity(
  strategy,
  snapshot
) {
  if (!snapshot) {
    return output(
      strategy,
      "WAIT",
      0,
      [
        "Sin análisis."
      ]
    );
  }


  if (strategy === "rise_fall") {
    return riseFall(
      snapshot
    );
  }


  if (strategy === "even_odd") {
    return digitBinary(
      "even_odd",
      snapshot
    );
  }


  if (strategy === "over_under") {
    return digitBinary(
      "over_under",
      snapshot
    );
  }


  if (
    strategy === "boom" ||
    strategy === "crash"
  ) {
    return spikeWatch(
      strategy,
      snapshot
    );
  }


  return matches(
    snapshot
  );
}
