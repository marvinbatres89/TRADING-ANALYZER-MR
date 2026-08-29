const STORAGE_KEY = "trading-analyzer-v12-test-registry";
const MAX_RECORDS = 500;

function readAll() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function writeAll(records) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(-MAX_RECORDS)));
    return true;
  } catch {
    return false;
  }
}

function update(id, patch) {
  const records = readAll();
  const index = records.findIndex((item) => item.id === id);
  if (index < 0) return null;
  records[index] = { ...records[index], ...patch, updatedAt: Date.now() };
  writeAll(records);
  return records[index];
}

export const testRegistry = {
  create(data) {
    const now = Date.now();
    const record = {
      id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: now,
      updatedAt: now,
      status: "WAITING_TARGET",
      result: null,
      targetTenAt: null,
      executedAt: null,
      executionOffsetMs: null,
      executedSecond: null,
      withinSecondMs: null,
      ...data
    };
    const records = readAll();
    records.push(record);
    writeAll(records);
    return record;
  },

  setTarget(id, targetTenAt) {
    return update(id, {
      targetTenAt: Number(targetTenAt),
      status: "WAITING_EXECUTION"
    });
  },

  markExecution(id, executedAt = Date.now()) {
    const records = readAll();
    const record = records.find((item) => item.id === id);
    if (!record || !Number.isFinite(Number(record.targetTenAt))) return null;

    const offset = Number(executedAt) - Number(record.targetTenAt);
    const positive = Math.max(0, offset);
    const second = Math.max(1, Math.min(10, 10 - Math.floor(positive / 1000)));
    const withinSecondMs = positive % 1000;

    return update(id, {
      executedAt: Number(executedAt),
      executionOffsetMs: offset,
      executedSecond: second,
      withinSecondMs,
      status: "WAITING_RESULT"
    });
  },

  setResult(id, result) {
    return update(id, {
      result,
      status: "CLOSED",
      closedAt: Date.now()
    });
  },

  get(id) {
    return readAll().find((item) => item.id === id) || null;
  },

  all() {
    return readAll();
  },

  clear() {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  },

  exportText() {
    return JSON.stringify(readAll(), null, 2);
  }
};
