const TRANSLATIONS = {
  es: {
    marketLabel:"MERCADO", strategyLabel:"ESTRATEGIA", modeLabel:"MODO",
    fast:"Rápido", deep:"Profundo", connect:"CONECTAR", disconnect:"DESCONECTAR",
    startEngine:"INICIAR MOTOR", stopEngine:"DETENER MOTOR", prediction:"PREDICCIÓN",
    waitButton:"ESPERE...", engineStatus:"ESTADO DE LOS MOTORES", liveMarket:"MERCADO EN VIVO",
    signal:"SEÑAL", trend:"TENDENCIA", rsi:"RSI", momentum:"IMPULSO", volatility:"VOLATILIDAD",
    noData:"SIN DATOS", bullish:"ALCISTA", bearish:"BAJISTA", neutral:"NEUTRO",
    positive:"POSITIVO", negative:"NEGATIVO", low:"BAJA", medium:"MEDIA", high:"ALTA",
    veryHigh:"MUY ALTA", connected:"CONECTADO", offline:"DESCONECTADO",
    last20:"ÚLTIMOS 20 DÍGITOS", even:"PARES", odd:"IMPARES", rises:"SUBIDAS", falls:"BAJADAS",
    currentPrice:"PRECIO ACTUAL", lastDigit:"ÚLTIMO DÍGITO", liveTicker:"TICKER EN VIVO",
    price:"PRECIO", ticks:"TICKS", time:"HORA", technicalConfidence:"Confianza técnica",
    executionCalibrator:"CALIBRADOR DE EJECUCIÓN", calibratorTitle:"Calibrador del segundo de entrada",
    saveResult:"GUARDAR RESULTADO", resetCalibration:"REINICIAR CALIBRACIÓN",
    marketRegistry:"REGISTRO DE MERCADOS", addMarket:"Agregar mercado manualmente",
    refreshDeriv:"ACTUALIZAR DESDE DERIV", derivSymbol:"Símbolo Deriv", visibleName:"Nombre visible",
    oneSecondMarket:"Mercado de 1 segundo", addMarketButton:"AGREGAR MERCADO",
    systemHealth:"SALUD DEL SISTEMA"
  },
  en: {
    marketLabel:"MARKET", strategyLabel:"STRATEGY", modeLabel:"MODE",
    fast:"Fast", deep:"Deep", connect:"CONNECT", disconnect:"DISCONNECT",
    startEngine:"START ENGINE", stopEngine:"STOP ENGINE", prediction:"PREDICTION",
    waitButton:"WAIT...", engineStatus:"ENGINE STATUS", liveMarket:"LIVE MARKET",
    signal:"SIGNAL", trend:"TREND", rsi:"RSI", momentum:"MOMENTUM", volatility:"VOLATILITY",
    noData:"NO DATA", bullish:"BULLISH", bearish:"BEARISH", neutral:"NEUTRAL",
    positive:"POSITIVE", negative:"NEGATIVE", low:"LOW", medium:"MEDIUM", high:"HIGH",
    veryHigh:"VERY HIGH", connected:"CONNECTED", offline:"OFFLINE",
    last20:"LAST 20 DIGITS", even:"EVEN", odd:"ODD", rises:"RISES", falls:"FALLS",
    currentPrice:"CURRENT PRICE", lastDigit:"LAST DIGIT", liveTicker:"LIVE TICKER",
    price:"PRICE", ticks:"TICKS", time:"TIME", technicalConfidence:"Technical confidence",
    executionCalibrator:"EXECUTION CALIBRATOR", calibratorTitle:"Entry-second calibrator",
    saveResult:"SAVE RESULT", resetCalibration:"RESET CALIBRATION",
    marketRegistry:"MARKET REGISTRY", addMarket:"Add market manually",
    refreshDeriv:"REFRESH FROM DERIV", derivSymbol:"Deriv symbol", visibleName:"Visible name",
    oneSecondMarket:"1-second market", addMarketButton:"ADD MARKET",
    systemHealth:"SYSTEM HEALTH"
  }
};

class I18n {
  constructor() {
    this.language = localStorage.getItem("trading-analyst-language") || "es";
  }
  t(key) {
    return TRANSLATIONS[this.language]?.[key] ?? TRANSLATIONS.es[key] ?? key;
  }
  setLanguage(language) {
    if (!TRANSLATIONS[language]) return;
    this.language = language;
    localStorage.setItem("trading-analyst-language", language);
    document.documentElement.lang = language;
    window.dispatchEvent(new CustomEvent("languagechange", { detail: { language } }));
  }
  translateState(value) {
    const map = {
      BULLISH:"bullish", BEARISH:"bearish", LATERAL:"neutral", NEUTRAL:"neutral",
      POSITIVE:"positive", NEGATIVE:"negative", LOW:"low", MEDIUM:"medium",
      HIGH:"high", "VERY HIGH":"veryHigh", "NO DATA":"noData", "SIN DATOS":"noData"
    };
    return this.t(map[value] || value);
  }
}
export const i18n = new I18n();
