TRADING ANALYST PRO MR V11.3.4 — ARQUITECTURA CONSOLIDADA
========================================================

FUNCIONAMIENTO
1. CONNECT.
2. START ENGINE.
3. El análisis trabaja continuamente en segundo plano.
4. PREDICTION solicita una decisión rápida.
5. Si supera filtros, se muestra una sola señal.
6. Explicación breve.
7. Cuenta regresiva de 10 segundos.
8. Predicción finalizada.
9. No se genera otra señal automáticamente.

MOTORES
- Motor Explorador.
- Motor Validador.
- Motor de Consenso.
- Detector de Timing.
- Filtro de Calidad.

MATCHES
- 0 = NO OPERAR.
- 1 al 9 = elegibles si superan todos los filtros.
- Las señales válidas también tienen cuenta regresiva de 10 segundos.

MANTENIMIENTO
- Máximo de 500 precios y 500 dígitos.
- Limpieza al apagar.
- Limpieza al cambiar de mercado.
- Caché versionada.
- JavaScript solicitado sin caché antigua.
- Diagnóstico permanente.
- Control de latencia y bloqueo cuando los datos llegan retrasados.

AGREGAR NUEVOS MERCADOS
Edite solamente MARKETS dentro de config.js. Cada mercado puede definir nombre,
estado activo y estrategias permitidas.

SUBIDA A GITHUB
- Extraiga el ZIP.
- Suba todos los archivos a la raíz del repositorio.
- No cree subcarpetas.
- Active GitHub Pages desde main / root.
- Espere el cheque verde.
- Pruebe primero en cuenta demo.

IMPORTANTE
La confianza técnica es una puntuación interna, no una garantía de resultado.
La herramienta no ejecuta operaciones ni puede asegurar ganancias.


NOVEDADES V11
- Cambio de mercado sin apagar el motor.
- Cambio de estrategia sin apagar el motor.
- Validación más estricta; calidad antes que cantidad.
- Explicación breve y pausada.
- Preparación de 10 segundos y ejecución de 10 segundos.
- Conteos completos desde 10 hasta 0.
- Mensaje final: “Predicción finalizada. Genera una nueva señal.”
- Matches reforzado y más selectivo.
- Calibrador manual del segundo de entrada.
- Recomendación solo después de suficientes pruebas.


AJUSTES V11.3.4
- Se conserva el primer conteo como único conteo operativo.
- Se elimina el segundo conteo tardío.
- La explicación y la voz tienen pausas más naturales.
- El conteo inicia en 10 y termina en 0 sin repetir números.
- Matches queda un poco más abierto, pero mantiene filtros y 0 = NO OPERAR.
- Se rediseña la zona de Mercado, Estrategia y Modo.
- No se modifica la conexión, el cambio de mercado en caliente ni el resto de la arquitectura estable.


AJUSTES V11.3.4
- Mercado, Estrategia y Modo usan selectores personalizados oscuros.
- Las opciones ya no dependen visualmente del cuadro blanco nativo de Android.
- Cada opción tiene fondo oscuro, borde, selección verde y radio visual.
- En teléfono se abre un panel inferior oscuro con fondo atenuado.
- No se modificó la lógica de predicción ni los motores.


AJUSTE V11.3.4 — AUDIO Y CONTEO
- Predicción, explicación y aviso de diez segundos se dicen de forma continua.
- Sin pausas largas antes del conteo.
- Conteo basado en el reloj real del navegador.
- Cada número cambia cada segundo.
- Números pronunciados a mayor velocidad.
- Se conserva un solo conteo operativo de 10 a 0.


NOVEDADES V11.3
- Panel Ticker en Vivo con precio grande, último dígito y últimos 20 dígitos.
- Conteos de pares, impares, subidas y bajadas.
- Interfaz bilingüe Español / English.
- Nombres oficiales de mercados y estrategias se mantienen.
- Indicadores visibles traducidos.
- Consulta de símbolos activos desde Deriv.
- Registro manual de mercados adicionales.
- Lista manual de mercados como respaldo.
- No se presenta la confianza técnica como garantía de resultado.


CAMBIOS V11.3.4
- Español / English funcional en los principales textos de interfaz.
- Nombres oficiales de mercados y estrategias permanecen sin traducir.
- active_symbols actualizado a la API actual de Deriv, sin product_type.
- Soporte para underlying_symbol, underlying_symbol_name y underlying_symbol_type.
- El selector visual se reconstruye al recibir mercados nuevos.
- Matches espera 36 ticks antes de habilitar PREDICTION.
- Matches usa ventanas 20/50/100 y los últimos 10 dígitos.
- Umbral Matches ajustado de 78 a 70.
- Matches valida que el mismo dígito se mantenga.
- 0 = NO OPERAR se conserva.
- Las otras estrategias no se modificaron.


CAMBIOS V11.3.4
- Even/Odd y Over/Under no se modifican.
- Punto visual de entrada: segundo inicial 10.
- AHORA aparece al terminar de pronunciar el número elegido.
- Retraso configurable de 0.0 a 0.5 s; inicial 0.1 s.
- La preferencia se guarda en el teléfono.
- Boom y Crash se agregan como estrategias funcionales experimentales.
- Sus mercados se detectan desde active_symbols de Deriv y se filtran por familia.
- Boom/Crash usan un motor propio de contexto previo a picos.
- Si el contexto no es suficiente, responde ESPERAR.
- Seguridad/licencias quedan para la etapa posterior.
