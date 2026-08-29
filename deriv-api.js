import { DERIV } from "./config.js";
import { diagnostics } from "./diagnostics.js";

class DerivAPI {
  constructor() {
    this.socket = null;
    this.symbol = "1HZ100V";
    this.subscriptionId = null;
    this.manualClose = false;
    this.retryCount = 0;
    this.pingTimer = null;
    this.reconnectTimer = null;
    this.listeners = { state: [], tick: [], error: [], log: [], activeSymbols: [] };
  }

  on(event, handler) {
    if (this.listeners[event] && typeof handler === "function") {
      this.listeners[event].push(handler);
    }
  }

  emit(event, payload = {}) {
    (this.listeners[event] || []).forEach((handler) => {
      try {
        handler(payload);
      } catch (error) {
        diagnostics.error(`Error en evento ${event}.`, { message: error.message });
      }
    });
  }

  setState(state, label = state.toUpperCase()) {
    this.emit("state", { state, label });
    diagnostics.info(`Estado WebSocket: ${label}.`);
  }

  isOpen() {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  connect(symbol = this.symbol) {
    this.symbol = symbol;
    this.manualClose = false;

    if (
      this.socket &&
      [WebSocket.OPEN, WebSocket.CONNECTING].includes(this.socket.readyState)
    ) {
      diagnostics.warn("CONNECT ignorado: ya existe una conexión activa.");
      return;
    }

    this.open();
  }

  open() {
    clearTimeout(this.reconnectTimer);
    this.setState("connecting", "CONNECTING");

    diagnostics.info("Abriendo WebSocket público.", {
      url: DERIV.publicWebSocket,
      symbol: this.symbol,
      attempt: this.retryCount + 1
    });

    try {
      this.socket = new WebSocket(DERIV.publicWebSocket);
    } catch (error) {
      diagnostics.error("No se pudo crear el WebSocket.", { message: error.message });
      this.scheduleReconnect();
      return;
    }

    this.socket.onopen = () => {
      this.retryCount = 0;
      this.setState("live", "LIVE");
      this.startPing();
      this.subscribe();
      this.requestActiveSymbols();
      diagnostics.ok("Conexión pública establecida.");
      this.emit("log", { message: "Conexión pública con Deriv establecida.", level: "ok" });
    };

    this.socket.onmessage = (event) => this.handleMessage(event);

    this.socket.onerror = () => {
      diagnostics.error("El navegador informó un error de WebSocket.", {
        readyState: this.socket?.readyState,
        url: DERIV.publicWebSocket
      });
      this.emit("error", { message: "Error de WebSocket." });
    };

    this.socket.onclose = (event) => {
      this.stopPing();
      this.socket = null;
      this.subscriptionId = null;
      this.setState("offline", "OFFLINE");

      diagnostics.warn("WebSocket cerrado.", {
        code: event.code,
        reason: event.reason || "Sin motivo informado",
        clean: event.wasClean,
        manual: this.manualClose
      });

      if (!this.manualClose) this.scheduleReconnect();
    };
  }

  send(payload) {
    if (!this.isOpen()) {
      diagnostics.warn("Solicitud no enviada: socket cerrado.", payload);
      return false;
    }

    try {
      this.socket.send(JSON.stringify(payload));
      diagnostics.info("Solicitud WebSocket enviada.", payload);
      return true;
    } catch (error) {
      diagnostics.error("Error enviando solicitud.", {
        message: error.message,
        payload
      });
      return false;
    }
  }

  requestActiveSymbols() {
    this.send({
      active_symbols: "brief",
      req_id: 913001
    });
  }

  subscribe() {
    this.send({
      ticks: this.symbol,
      subscribe: 1,
      req_id: Date.now()
    });
  }

  forgetCurrent() {
    if (this.subscriptionId && this.isOpen()) {
      this.send({ forget: this.subscriptionId });
    }
    this.subscriptionId = null;
  }

  changeSymbol(symbol) {
    if (!symbol || symbol === this.symbol) return;
    diagnostics.info("Cambio de mercado.", { from: this.symbol, to: symbol });
    this.symbol = symbol;

    if (this.isOpen()) {
      this.forgetCurrent();
      setTimeout(() => this.subscribe(), 200);
    }
  }

  handleMessage(event) {
    let data;

    try {
      data = JSON.parse(event.data);
    } catch {
      diagnostics.error("Respuesta no válida.", {
        preview: String(event.data).slice(0, 200)
      });
      return;
    }

    if (data.error || data.errors) {
      const error = data.error || data.errors?.[0] || {};
      const message = error.message || "Error de Deriv.";
      diagnostics.error("Deriv respondió con error.", {
        code: error.code || error.status || "",
        message,
        response: data
      });
      this.emit("error", { message });
      return;
    }

    if (data.subscription?.id) {
      this.subscriptionId = data.subscription.id;
      diagnostics.ok("Suscripción registrada.", {
        subscriptionId: this.subscriptionId
      });
    }

    if (data.msg_type === "active_symbols" && Array.isArray(data.active_symbols)) {
      this.emit("activeSymbols", { items: data.active_symbols });
      return;
    }

    if (data.msg_type !== "tick" || !data.tick) return;

    const price = Number(data.tick.quote);
    if (!Number.isFinite(price)) return;

    const pipSize = Number.isInteger(Number(data.tick.pip_size))
      ? Number(data.tick.pip_size)
      : 2;

    this.emit("tick", {
      symbol: data.tick.symbol || this.symbol,
      price,
      epoch: Number(data.tick.epoch) || Math.floor(Date.now() / 1000),
      pipSize,
      receivedAt: Date.now()
    });
  }

  startPing() {
    this.stopPing();
    this.pingTimer = setInterval(() => {
      if (this.isOpen()) this.send({ ping: 1 });
    }, DERIV.pingIntervalMs);
  }

  stopPing() {
    clearInterval(this.pingTimer);
    this.pingTimer = null;
  }

  scheduleReconnect() {
    this.retryCount += 1;
    const wait = Math.min(
      DERIV.reconnectMaxMs,
      DERIV.reconnectBaseMs * this.retryCount
    );

    diagnostics.warn("Reconexión programada.", {
      attempt: this.retryCount,
      waitMs: wait
    });

    this.reconnectTimer = setTimeout(() => {
      if (!this.manualClose) this.open();
    }, wait);
  }

  disconnect() {
    this.manualClose = true;
    clearTimeout(this.reconnectTimer);
    this.stopPing();
    this.forgetCurrent();

    try {
      this.socket?.close(1000, "Cierre manual");
    } catch {}

    this.socket = null;
    this.subscriptionId = null;
    this.setState("offline", "OFFLINE");
    diagnostics.info("Desconexión manual completada.");
  }
}

export const derivAPI = new DerivAPI();
