import { APP_VERSION, ENGINE } from "./config.js";

class Diagnostics {
  constructor() {
    this.entries = [];
    this.listeners = new Set();
    this.version = APP_VERSION;
  }

  add(level, message, data = null) {
    const entry = {
      time: new Date().toLocaleTimeString("es-SV"),
      level,
      message: String(message),
      data
    };

    this.entries.push(entry);

    if (this.entries.length > ENGINE.maxDiagnosticEvents) {
      this.entries.shift();
    }

    this.listeners.forEach((listener) => {
      try {
        listener([...this.entries]);
      } catch (error) {
        console.error(error);
      }
    });

    const method = level === "error" ? "error" : level === "warn" ? "warn" : "log";
    console[method](`[TA ${APP_VERSION}] ${message}`, data ?? "");
  }

  info(message, data) { this.add("info", message, data); }
  ok(message, data) { this.add("ok", message, data); }
  warn(message, data) { this.add("warn", message, data); }
  error(message, data) { this.add("error", message, data); }

  subscribe(listener) {
    this.listeners.add(listener);
    listener([...this.entries]);
    return () => this.listeners.delete(listener);
  }

  clear() {
    this.entries = [];
    this.listeners.forEach((listener) => listener([]));
  }

  exportText() {
    return this.entries.map((entry) => {
      const extra = entry.data ? ` ${JSON.stringify(entry.data)}` : "";
      return `[${entry.time}] ${entry.level.toUpperCase()} ${entry.message}${extra}`;
    }).join("\n");
  }
}

export const diagnostics = new Diagnostics();
