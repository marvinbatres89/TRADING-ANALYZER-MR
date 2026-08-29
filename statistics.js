class StatisticsStore {
  constructor() {
    this.key = "trading-analyst-pro-mr-statistics-v10";
    this.data = this.load();
  }

  load() {
    try {
      return JSON.parse(localStorage.getItem(this.key) || "{}");
    } catch {
      return {};
    }
  }

  save() {
    try {
      localStorage.setItem(this.key, JSON.stringify(this.data));
    } catch {}
  }

  get(key) {
    if (!this.data[key]) {
      this.data[key] = { tests: 0, success: 0, failed: 0 };
    }
    return this.data[key];
  }

  record(key, success) {
    const stats = this.get(key);
    stats.tests += 1;
    if (success) stats.success += 1;
    else stats.failed += 1;
    this.save();
    return stats;
  }

  reset(key) {
    this.data[key] = { tests: 0, success: 0, failed: 0 };
    this.save();
  }
}

export const statistics = new StatisticsStore();
