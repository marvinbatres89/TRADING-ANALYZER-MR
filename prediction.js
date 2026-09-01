/**
 * TRADING-ANALYZER-MR
 * Módulo: prediction.js (Actualizado a Motor de Aceleración y Volatilidad)
 */

class TickAccelerationEngine {
    constructor(config = {}) {
        // Umbral de volatilidad adaptable por índice
        this.minVolatility = config.minVolatility || 0.0008; 
        this.historySize = 20; 
    }

    calculateVolatility(prices) {
        const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
        const variance = prices.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / prices.length;
        return Math.sqrt(variance);
    }

    analyze(ticksPrices) {
        if (!ticksPrices || ticksPrices.length < this.historySize) {
            return { signal: 'NEUTRAL', confidence: 0, reason: 'Esperando más ticks de historial...' };
        }

        const recentTicks = ticksPrices.slice(-this.historySize);

        // 1. Validar filtro de volatilidad mínima (Filtro de régimen)
        const volatility = this.calculateVolatility(recentTicks);
        if (volatility < this.minVolatility) {
            return { 
                signal: 'NEUTRAL', 
                confidence: 0, 
                reason: `Mercado en compresión (Volatilidad baja: ${volatility.toFixed(5)})` 
            };
        }

        // 2. Cálculo de micro-aceleración (Últimos 4 Ticks)
        const t0 = recentTicks[recentTicks.length - 1]; // Tick actual
        const t1 = recentTicks[recentTicks.length - 2];
        const t2 = recentTicks[recentTicks.length - 3];
        const t3 = recentTicks[recentTicks.length - 4];

        const delta1 = t0 - t1;
        const delta2 = t1 - t2;
        const delta3 = t2 - t3;

        // Patron de Aceleración Alcista (CALL)
        const isBullish = (delta1 > 0 && delta2 > 0 && delta3 > 0) && (delta1 >= delta2);
        
        // Patron de Aceleración Bajista (PUT)
        const isBearish = (delta1 < 0 && delta2 < 0 && delta3 < 0) && (Math.abs(delta1) >= Math.abs(delta2));

        if (isBullish) {
            const score = Math.min(85, 72 + Math.round((delta1 / volatility) * 10));
            return {
                signal: 'CALL',
                confidence: score,
                reason: 'Aceleración alcista consecutiva confirmada'
            };
        }

        if (isBearish) {
            const score = Math.min(85, 72 + Math.round((Math.abs(delta1) / volatility) * 10));
            return {
                signal: 'PUT',
                confidence: score,
                reason: 'Aceleración bajista consecutiva confirmada'
            };
        }

        return { signal: 'NEUTRAL', confidence: 0, reason: 'Flujo de ticks sin aceleración sostenida' };
    }
}

// Instancia global del motor
const tickEngine = new TickAccelerationEngine();

/**
 * Función principal que consume el analizador de la interfaz
 * @param {Array<number>} priceHistory - Array de precios de ticks
 * @returns {Object} Resultado para el consensus / bridge
 */
function generatePrediction(priceHistory) {
    return tickEngine.analyze(priceHistory);
}

// Exportación para navegadores y entornos Node.js
if (typeof window !== 'undefined') {
    window.generatePrediction = generatePrediction;
    window.TickAccelerationEngine = TickAccelerationEngine;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { generatePrediction, TickAccelerationEngine };
}
