import { MARKETS } from "./config.js";
import { diagnostics } from "./diagnostics.js";

const STORAGE_KEY = "trading-analyst-custom-markets-v11-3";

class MarketRegistry {
  constructor() {
    this.custom = this.loadCustom();
    this.remote = {};
  }

  loadCustom() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  }

  saveCustom() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.custom));
    } catch {}
  }

  all() {
    return { ...MARKETS, ...this.remote, ...this.custom };
  }

  addManual({ symbol, name, oneSecond = false }) {
    const cleanSymbol = String(symbol || "").trim();
    const cleanName = String(name || "").trim();

    if (!cleanSymbol || !cleanName) {
      throw new Error("Símbolo y nombre son obligatorios.");
    }

    const lowerName = cleanName.toLowerCase();
    const strategies =
      lowerName.includes("boom") ? ["boom"] :
      lowerName.includes("crash") ? ["crash"] :
      ["rise_fall", "even_odd", "over_under", "match"];

    this.custom[cleanSymbol] = {
      name: cleanName,
      enabled: true,
      oneSecond: Boolean(oneSecond),
      source: "manual",
      strategies
    };

    this.saveCustom();
    diagnostics.ok("Mercado manual agregado.", { symbol: cleanSymbol, name: cleanName });
    return this.custom[cleanSymbol];
  }

  removeManual(symbol) {
    delete this.custom[symbol];
    this.saveCustom();
  }

  ingestActiveSymbols(items = []) {
    const detected = {};

    items.forEach((item) => {
      const symbol =
        item.underlying_symbol ||
        item.symbol ||
        item.market_symbol ||
        "";

      const name =
        item.underlying_symbol_name ||
        item.display_name ||
        item.name ||
        symbol;

      const marketText = [
        item.market,
        item.submarket,
        item.subgroup,
        item.underlying_symbol_type,
        item.symbol_type,
        item.market_display_name,
        item.submarket_display_name,
        name,
        symbol
      ].filter(Boolean).join(" ").toLowerCase();

      const looksSupported =
        marketText.includes("volatility") ||
        marketText.includes("synthetic") ||
        marketText.includes("boom") ||
        marketText.includes("crash") ||
        /^1HZ\d+V$/.test(symbol) ||
        /^R_\d+$/.test(symbol);

      if (!symbol || !looksSupported) return;

      const isBoom = /boom/i.test(marketText);
      const isCrash = /crash/i.test(marketText);
      const strategies =
        isBoom ? ["boom"] :
        isCrash ? ["crash"] :
        ["rise_fall", "even_odd", "over_under", "match"];

      detected[symbol] = {
        name,
        enabled: true,
        source: "deriv",
        oneSecond: /^1HZ/.test(symbol) || /\(1s\)|1 second/i.test(name),
        family: isBoom ? "boom" : isCrash ? "crash" : "volatility",
        strategies
      };
    });

    this.remote = detected;
    diagnostics.info("Mercados detectados desde Deriv.", {
      count: Object.keys(detected).length
    });

    return detected;
  }
}

export const marketRegistry = new MarketRegistry();
