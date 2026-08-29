import { ENGINE } from "./config.js";

class MarketBuffer {
  constructor() {
    this.reset();
  }

  reset() {
    this.prices = [];
    this.digits = [];
    this.ticks = 0;
    this.lastPrice = null;
    this.lastEpoch = null;
    this.pipSize = 2;
  }

  push(tick) {
    const formatted = Number(tick.price).toFixed(tick.pipSize);
    const match = formatted.match(/(\d)(?!.*\d)/);
    const digit = match ? Number(match[1]) : null;

    this.lastPrice = tick.price;
    this.lastEpoch = tick.epoch;
    this.pipSize = tick.pipSize;
    this.ticks += 1;

    this.prices.push(tick.price);
    if (this.prices.length > ENGINE.maxPrices) this.prices.shift();

    if (Number.isInteger(digit)) {
      this.digits.push(digit);
      if (this.digits.length > ENGINE.maxDigits) this.digits.shift();
    }

    return { formatted, digit };
  }

  snapshot() {
    return {
      prices: [...this.prices],
      digits: [...this.digits],
      ticks: this.ticks,
      lastPrice: this.lastPrice,
      lastEpoch: this.lastEpoch,
      pipSize: this.pipSize
    };
  }
}

export const marketBuffer = new MarketBuffer();
