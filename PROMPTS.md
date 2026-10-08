# Registro de Prompts — Proyecto SORTEO JUSTO (Encargo 37)

Este documento registra en orden cronológico las instrucciones enviadas a la Inteligencia Artificial durante el desarrollo por fases del proyecto **SORTEO JUSTO**.

---

## Prompt 1: Especificación inicial y revisión de arquitectura
- **Objetivo:** Revisar la especificación del encargo número 37, detectar posibles contradicciones técnicas y definir la estructura de archivos antes de escribir código.
- **Resultado obtenido:** Análisis de pureza en `src/logica.ts`, propuesta de estructura de carpetas y guía inicial.

---

## Prompt 2: Fase 1 — Creación y configuración del proyecto
- **Objetivo:** Preparar el entorno en Visual Studio Code con Vite, TypeScript y Vitest, crear la estructura de carpetas (`src/`, `test/`, `evidencias/`), el archivo `PROMPTS.md` y realizar el primer commit `"inicio: proyecto creado"`.
- **Resultado obtenido:** Estructura base funcional, configuración de Vitest y verificación de compilación.

---

## Prompt 3: Fase 2 — Desarrollo de `src/logica.ts`
- **Objetivo:** Implementar la lógica pura de **SORTEO JUSTO** en `src/logica.ts` con tipos definidos, constante `CONFIG`, registro/edición/eliminación de estudiantes sin duplicados ni vacíos, generador pseudoaleatorio reproducible por semilla, reparto equilibrado minimizando parejas repetidas del sorteo anterior, historial y funciones puras de serialización para `localStorage`.
- **Resultado obtenido:** Módulo `src/logica.ts` completo, 100% libre de DOM y verificado con TypeScript y Vitest.

---

## Prompt 4: Fase 3 — Pruebas automatizadas con Vitest (`test/logica.test.ts`)
- **Objetivo:** Implementar la batería completa de pruebas automatizadas en `test/logica.test.ts` comprobando estado inicial, validaciones y duplicados, equilibrio de equipos, ausencia de repetidos por sorteo, historial, imposibilidad matemática de evitar parejas repetidas y recorrido completo de usuario.
- **Resultado obtenido:** 6 pruebas automatizadas reales aprobadas con `npm test`, `npm run lint` y `npm run build`.

---

## Prompt 5: Fase 4 — Diseño e interfaz de usuario (`index.html`, `src/main.ts`, `src/estilo.css`)
- **Objetivo:** Desarrollar la interfaz visual completa de **SORTEO JUSTO** con estética azul marino oscuro y acentos turquesa, verde esmeralda y violeta, tarjetas de equipos, edición en línea, confirmación integrada de reinicio, persistencia en `localStorage` y optimización de rendimiento para celulares Android económicos (`>= 320px`, controles táctiles `>= 44x44px`).
- **Resultado obtenido:** Interfaz funcional conectada a `src/logica.ts`, compilada y verificada con `npm run lint`, `npm test` y `npm run build`.

---

## Prompt 6: Fase 5 — Optimización y adaptación para dispositivos móviles (`src/main.ts`, `src/estilo.css`)
- **Objetivo:** Optimizar el rendimiento y la experiencia táctil para celulares Android económicos en resoluciones de `320px`, `360px`, `375px`, `390px` y `414px`, implementando actualizaciones parciales del DOM (evitando cierres del teclado móvil), ejecución no bloqueante con `requestAnimationFrame`, paginación ligera de historial y aislamiento de repintado CSS (`contain: content`).
- **Resultado obtenido:** Interfaz móvil fluida sin desplazamiento horizontal, controles táctiles de `48px` de alto, 6 pruebas automatizadas en verde y compilación limpia.
