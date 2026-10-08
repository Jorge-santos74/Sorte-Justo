# Registro de Prompts — Proyecto SORTEO JUSTO (Encargo N.° 37)

Este documento contiene el registro cronológico y organizado por fases de las instrucciones reales enviadas a la Inteligencia Artificial durante la construcción del proyecto académico **SORTEO JUSTO**.

- **Estudiante / Autor:** Jorge Alberto Villegas Santos (`@JorgeSantos3422`)
- **Repositorio:** `https://github.com/JorgeSantos3422/Sorteo-Justo`

---

## Fase Preliminar: Revisión de la especificación y arquitectura

- **Número de fase:** Fase 0 (Análisis previo)
- **Objetivo:** Revisar la especificación del encargo número 37, detectar posibles contradicciones técnicas con las reglas de arquitectura y definir la estructura exacta de carpetas antes de escribir el código.
- **Prompt utilizado:**
  > Actúa como un desarrollador profesional de aplicaciones web, especialista en TypeScript, Vite, HTML5, CSS3, diseño responsive y pruebas automatizadas con Vitest. Necesito desarrollar un proyecto académico llamado SORTEO JUSTO, correspondiente al encargo número 37 de una práctica de Desarrollo de Software. [...] Primero revisa esta especificación, señala cualquier contradicción con los requisitos técnicos, propone la estructura exacta de carpetas y explícame cómo preparar el proyecto Vite + TypeScript en Visual Studio Code. No generes todavía toda la aplicación. Espera a que te entregue mi ficha aprobada y autorice la primera fase de desarrollo.
- **Archivos desarrollados o modificados:**
  - `metadata.json`
  - `index.html` (metadatos iniciales)
- **Resultados obtenidos:**
  - Se identificó cómo conciliar el uso de `localStorage` con la regla de no usar `window` en `src/logica.ts` mediante funciones puras de exportación/importación de estado.
  - Se definió cómo cumplir simultáneamente el retorno booleano (`true`/`false`) en las funciones mutadoras y la exposición de mensajes claros y advertencias matemáticas en el estado.
- **Correcciones realizadas:** Ninguna; se aprobó la arquitectura propuesta para iniciar la Fase 1.

---

## Fase 1: Creación y configuración del proyecto

- **Número de fase:** Fase 1
- **Objetivo:** Preparar el entorno de desarrollo en Visual Studio Code con Vite, TypeScript y Vitest, crear la estructura organizada de carpetas (`src/`, `test/`, `evidencias/`), crear `PROMPTS.md` y registrar el primer commit `"inicio: proyecto creado"`.
- **Prompt utilizado:**
  > Te autorizo a iniciar la Fase 1: creación y configuración del proyecto SORTEO JUSTO. Primero quiero preparar el entorno de desarrollo en Visual Studio Code, utilizando Vite, TypeScript y Vitest. Necesito que me entregues: 1. Los comandos exactos para crear el proyecto. 2. La estructura organizada de carpetas y archivos. 3. La configuración de Vitest para las pruebas. 4. Las instrucciones para ejecutar la aplicación. 5. Cómo crear el repositorio de GitHub y sincronizarlo desde Visual Studio Code. 6. Cómo realizar el primer commit con el mensaje exacto: "inicio: proyecto creado". 7. Cómo crear PROMPTS.md y la carpeta evidencias. No avances todavía a la Fase 2.
- **Archivos desarrollados o modificados:**
  - `package.json`
  - `index.html`
  - `src/logica.ts` (estructura base con `CONFIG`)
  - `src/main.ts` (estructura base inicial)
  - `src/estilo.css` (estilos base iniciales)
  - `test/logica.test.ts` (prueba inicial de verificación de entorno)
  - `PROMPTS.md`
  - `evidencias/.gitkeep`
- **Resultados obtenidos:**
  - Proyecto configurado compilando sin errores con `npx tsc --noEmit` y superando la prueba inicial en Vitest (`1 passed`).
- **Correcciones realizadas:** Se eliminaron los archivos de plantilla que no formaban parte de la arquitectura Vanilla TypeScript solicitada.

---

## Fase 2: Desarrollo de la lógica (`src/logica.ts`)

- **Número de fase:** Fase 2
- **Objetivo:** Implementar la lógica pura del sorteo en `src/logica.ts` (registro, modificación y eliminación de estudiantes sin vacíos ni duplicados, configuración de equipos, generador pseudoaleatorio con semilla, algoritmo de reparto equilibrado minimizando parejas repetidas del sorteo anterior, historial y funciones de serialización).
- **Prompt utilizado:**
  > Te autorizo a iniciar la FASE 2 del proyecto SORTEO JUSTO. La Fase 1 ya está configurada en Visual Studio Code. TypeScript funciona y la prueba inicial con Vitest ha sido aprobada. Ahora necesito implementar la lógica real de la aplicación. [...] Implementar la lógica en src/logica.ts. Centralizar los valores configurables en CONFIG. No utilizar document, window ni alert dentro de logica.ts. Mantener compatibilidad con Vitest. [...] Cuando termines, espera mi confirmación para realizar el segundo commit con este mensaje exacto: `reglas: logica desde mi ficha`
- **Archivos desarrollados o modificados:**
  - `src/logica.ts`
  - `PROMPTS.md`
- **Resultados obtenidos:**
  - Módulo `src/logica.ts` 100 % funcional y libre de referencias al DOM, con todas las funciones mutadoras devolviendo `true` o `false` según la validez de la operación.
- **Correcciones realizadas:** Se incluyó normalización Unicode (`NFD`) para detectar nombres duplicados incluso cuando se escriben con o sin tilde o con distinta capitalización.

---

## Fase 3: Pruebas automatizadas con Vitest (`test/logica.test.ts`)

- **Número de fase:** Fase 3
- **Objetivo:** Crear la suite completa de pruebas automatizadas en `test/logica.test.ts` comprobando estado inicial, validaciones de estudiantes, ausencia de repetidos, equilibrio de equipos, historial, imposibilidad matemática de evitar repeticiones y recorrido completo.
- **Prompt utilizado:**
  > Te autorizo a iniciar la Fase 3 del proyecto SORTEO JUSTO. La lógica del sorteo ya fue implementada en la Fase 2. Ahora necesito crear y completar las pruebas automatizadas utilizando Vitest. REQUISITOS: 1. Crear o actualizar test/logica.test.ts. 2. Incluir como mínimo cinco pruebas automatizadas reales. [...] Cuando termine de verificar las pruebas, registraré el tercer commit con este mensaje exacto: `pruebas: reglas comprobadas`
- **Archivos desarrollados o modificados:**
  - `test/logica.test.ts`
  - `PROMPTS.md`
- **Resultados obtenidos:**
  - Se implementaron 6 pruebas automatizadas completas que finalizaron con `6 passed (6)` en `npm test`, `0` errores en `npm run lint` y compilación exitosa en `npm run build`.
- **Correcciones realizadas:** Se demostró mediante el Principio del Palomar el caso de 5 estudiantes en 2 equipos para comprobar de forma determinista el mensaje de advertencia transparente cuando es imposible evitar todas las parejas repetidas.

---

## Fase 4: Desarrollo de la interfaz de usuario (`index.html`, `src/main.ts`, `src/estilo.css`)

- **Número de fase:** Fase 4
- **Objetivo:** Transformar `SORTEO JUSTO` en una aplicación web con diseño profesional azul marino oscuro y acentos turquesa, verde esmeralda y violeta, conectada a `src/logica.ts` y `localStorage`.
- **Prompt utilizado:**
  > Te autorizo a iniciar la FASE 4 del proyecto SORTEO JUSTO: DISEÑO E INTERFAZ PROFESIONAL. Las Fases 1, 2 y 3 están terminadas. [...] Transformar SORTEO JUSTO en una aplicación web con una interfaz visual moderna, profesional, atractiva, intuitiva y completamente funcional, manteniendo la lógica y las pruebas existentes. [...] El cuarto commit debe llamarse exactamente: `pantalla: interfaz basica`
- **Archivos desarrollados o modificados:**
  - `index.html`
  - `src/main.ts`
  - `src/estilo.css`
  - `PROMPTS.md`
- **Resultados obtenidos:**
  - Interfaz completa con registro, edición en línea, eliminación, selector de equipos, semilla, tarjetas de equipos, historial interactivo, carga rápida de grupo de prueba y confirmación integrada de reinicio sin usar `window.alert` ni `window.confirm`.
- **Correcciones realizadas:** Se evitó el uso de filtros pesados (`backdrop-filter: blur`) y librerías externas para mantener un empaquetado ligero.

---

## Fase 5: Adaptación y optimización para dispositivos móviles

- **Número de fase:** Fase 5
- **Objetivo:** Optimizar el rendimiento de JavaScript y CSS para celulares Android de bajos recursos y adaptar la interfaz a pantallas de `320 px`, `360 px`, `375 px`, `390 px` y `414 px` con uso completo mediante el dedo.
- **Prompt utilizado:**
  > Te autorizo a iniciar la FASE 5 de SORTEO JUSTO: OPTIMIZACIÓN Y ADAPTACIÓN PARA DISPOSITIVOS MÓVILES. [...] Quiero que la aplicación funcione de manera fluida, rápida y estable en celulares Android, especialmente dispositivos de bajos recursos, sin perder el diseño moderno que ya tenemos. [...] Cuando termine de verificar el funcionamiento móvil, registraré el quinto commit con este mensaje exacto: `movil: funciona con el dedo`
- **Archivos desarrollados o modificados:**
  - `src/main.ts`
  - `src/estilo.css`
  - `PROMPTS.md`
- **Resultados obtenidos:**
  - Se implementaron actualizaciones parciales del DOM con nodos en caché para que el teclado virtual de Android no se cierre al registrar estudiantes consecutivos.
  - Se garantizó una altura táctil de `48 px` en botones, ejecución de sorteo con `requestAnimationFrame` y desplazamiento automático hacia los equipos en pantallas móviles.
- **Correcciones realizadas:** Se añadió paginación compacta al historial (mostrando los 8 más recientes con opción a expandir) y la propiedad CSS `contain: content` para reducir el consumo de memoria RAM y CPU móvil.

---

## Fase 6: Documentación, publicación y entrega final

- **Número de fase:** Fase 6
- **Objetivo:** Elaborar la documentación final en `README.md` y `PROMPTS.md`, configurar Vite y GitHub Actions para la publicación en GitHub Pages (`https://jorgesantos3422.github.io/Sorteo-Justo/`) y realizar la verificación integral antes del sexto commit.
- **Prompt utilizado:**
  > Actúa como un desarrollador senior, especialista en documentación de software, GitHub, Vite, TypeScript, Vitest, optimización web y despliegue de aplicaciones. Te autorizo a comenzar la FASE 6: DOCUMENTACIÓN, PUBLICACIÓN Y ENTREGA FINAL de mi proyecto académico SORTEO JUSTO, correspondiente al encargo número 37. [...] Cuando los cambios hayan sido revisados y comprobados, debo registrar el sexto commit con el mensaje exacto: `docs: readme y publicacion`
- **Archivos desarrollados o modificados:**
  - `README.md`
  - `PROMPTS.md`
  - `vite.config.ts`
  - `.github/workflows/deploy.yml`
- **Resultados obtenidos:**
  - Documentación completa de 27 puntos en `README.md`, historial estructurado en `PROMPTS.md`, rutas relativas `./assets/...` verificadas en `dist/index.html` para evitar errores 404 en GitHub Pages y flujo de despliegue automatizado listo.
- **Correcciones realizadas:** Se configuró `base: './'` en `vite.config.ts` para que los recursos JavaScript y CSS carguen correctamente tanto en la subruta `/Sorteo-Justo/` de GitHub Pages como en cualquier servidor local.

---

## Apartado opcional para notas adicionales del autor
*(Espacio reservado por si deseas añadir observaciones personales sobre tus pruebas en teléfono físico o ajustes locales realizados en Visual Studio Code):*

- **Dispositivo móvil utilizado en pruebas locales:** `[Completar modelo de teléfono Android y versión de Chrome]`
- **Fecha de verificación del enlace público en GitHub Pages:** `[Completar fecha al verificar https://jorgesantos3422.github.io/Sorteo-Justo/]`
- **Observaciones adicionales del estudiante:** `[Opcional]`
