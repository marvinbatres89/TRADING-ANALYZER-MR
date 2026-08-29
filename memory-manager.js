import { diagnostics } from "./diagnostics.js";

class MemoryManager {
  constructor() {
    this.cleaners = new Set();
  }

  register(cleaner) {
    if (typeof cleaner === "function") this.cleaners.add(cleaner);
  }

  clean(reason = "manual") {
    this.cleaners.forEach((cleaner) => {
      try {
        cleaner();
      } catch (error) {
        diagnostics.warn("Error durante limpieza.", { message: error.message });
      }
    });

    if ("speechSynthesis" in window) speechSynthesis.cancel();

    diagnostics.info("Limpieza automática completada.", { reason });
  }
}

export const memoryManager = new MemoryManager();
