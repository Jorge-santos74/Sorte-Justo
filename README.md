# SORTEO JUSTO — Encargo N.° 37 (Desarrollo de Software)

---

## 1. Nombre del proyecto
**SORTEO JUSTO** — Organizador inteligente de equipos estudiantiles equilibrados y sin repetición de compañeros.

---

## 2. Descripción general
**SORTEO JUSTO** es una aplicación web estática, progresiva y adaptable (*mobile-first*), desarrollada con **TypeScript**, **Vite**, **HTML5**, **CSS3** y **Vitest**. Permite a docentes de cualquier nivel educativo conformar equipos de trabajo equilibrados de manera pseudoaleatoria reproducible, minimizando automáticamente la repetición de parejas de compañeros que ya trabajaron juntos en el sorteo inmediato anterior.

---

## 3. Problema que resuelve
En el aula de clases, al organizar actividades grupales de manera frecuente, suelen presentarse tres problemas habituales:
1. **Desequilibrio en el tamaño de los equipos:** Algunos grupos quedan sobrecargados mientras otros tienen pocos integrantes.
2. **Repetición de las mismas agrupaciones:** Los sorteos puramente al azar o por afinidad tienden a repetir parejas de estudiantes de una actividad a otra, reduciendo la integración del grupo.
3. **Dependencia de conexión o equipos de escritorio:** Muchas herramientas requieren servidores externos, cuentas de usuario o consumen demasiados recursos en teléfonos móviles económicos.

**SORTEO JUSTO** resuelve estos tres problemas mediante un algoritmo determinista con memoria del sorteo anterior y una interfaz ultraligera que funciona directamente desde el navegador de cualquier celular Android o computadora.

---

## 4. Objetivo general
Crear una aplicación web funcional, moderna y adaptable a teléfonos celulares que permita a un docente organizar estudiantes en equipos equilibrados de manera aleatoria, tratando de evitar que se repitan las mismas agrupaciones de los sorteos anteriores.

---

## 5. Objetivos específicos
1. Implementar un módulo de lógica pura en TypeScript (`src/logica.ts`) totalmente desacoplado del DOM para gestionar estudiantes, validaciones, semillas, sorteos e historial.
2. Garantizar que el reparto de estudiantes forme equipos cuya diferencia de integrantes sea de **máximo 1 persona**.
3. Incorporar un generador pseudoaleatorio con semilla (*PRNG Mulberry32*) y mezcla *Fisher-Yates* que evalúe hasta `CONFIG.MAX_INTENTOS_SORTEO` (`250` intentos) para evitar o minimizar las parejas repetidas respecto al sorteo anterior.
4. Validar todas las reglas de negocio mediante una suite de pruebas unitarias automatizadas con **Vitest** (`test/logica.test.ts`).
5. Construir una interfaz visual de alto contraste (azul marino oscuro, turquesa, verde esmeralda y violeta) optimizada para pantallas desde `320 px` y teléfonos Android de bajos recursos.
6. Conservar la lista de estudiantes y el historial de sorteos en el navegador mediante `localStorage`.

---

## 6. Alcance del sistema
- Registro individual y carga rápida de listas de prueba de hasta `200` estudiantes.
- Validación en tiempo real contra nombres vacíos, longitudes fuera de rango (`2` a `60` caracteres) y nombres duplicados (insensible a mayúsculas, minúsculas y tildes).
- Edición en línea y eliminación individual de estudiantes antes de realizar un sorteo.
- Selección dinámica de la cantidad de equipos (mínimo `2` equipos y nunca superior al total de estudiantes).
- Configuración manual o automática de la semilla numérica de reproducibilidad.
- Visualización de resultados en tarjetas con indicación transparente de parejas repetidas.
- Historial consultable de hasta `50` sorteos previos con persistencia local en el dispositivo.

---

## 7. Limitaciones
- **Persistencia local por dispositivo:** Dado que la aplicación no requiere servidor ni base de datos externa, los datos guardados en `localStorage` pertenecen al navegador donde fueron registrados.
- **Imposibilidad combinatoria (Principio del Palomar):** Cuando la proporción entre estudiantes y equipos hace matemáticamente imposible evitar el 100 % de las parejas del sorteo anterior (por ejemplo, `5` estudiantes repartidos en `2` equipos), el sistema selecciona el reparto con el menor número posible de coincidencias y muestra un aviso transparente explicando el motivo matemático.
- **Comparación enfocada en el sorteo inmediato anterior:** El algoritmo prioriza evitar las parejas formadas en el sorteo inmediatamente precedente (`historial[0]`).

---

## 8. Tecnologías utilizadas
| Tecnología | Propósito en el proyecto |
| :--- | :--- |
| **TypeScript** | Tipado estático estricto, interfaces de dominio y lógica pura en `src/logica.ts` y `src/main.ts`. |
| **Vite** | Servidor de desarrollo rápido y empaquetador de producción estático para GitHub Pages. |
| **HTML5** | Estructura semántica accesible (`lang="es"`, regiones ARIA y atributos de teclado móvil). |
| **CSS3** | Diseño *mobile-first*, variables CSS, rejillas adaptables (`Grid`/`Flexbox`) y aislamiento `contain: content`. |
| **Vitest** | Ejecución de las pruebas automatizadas unitarias e integrales en `test/logica.test.ts`. |
| **GitHub Pages / Actions** | Publicación continua y alojamiento web estático gratuito. |

---

## 9. Requerimientos funcionales
- **RF-01:** Permitir registrar estudiantes por su nombre completo.
- **RF-02:** Mostrar la lista numerada de estudiantes registrados.
- **RF-03:** Validar que no se ingresen campos vacíos ni nombres duplicados (ignorando diferencias de tildes o mayúsculas).
- **RF-04:** Permitir corregir el nombre de un estudiante o eliminarlo de la lista antes del sorteo.
- **RF-05:** Permitir incrementar o disminuir la cantidad de equipos dentro de los límites válidos.
- **RF-06:** Distribuir a todos los estudiantes sin omitir ni duplicar a ninguno, con diferencia máxima de `1` integrante entre equipos.
- **RF-07:** Minimizar las parejas repetidas respecto al sorteo anterior utilizando hasta `250` intentos pseudoaleatorios.
- **RF-08:** Mostrar un aviso transparente cuando sea matemáticamente inevitable repetir alguna pareja.
- **RF-09:** Almacenar y permitir consultar el historial de sorteos realizados.
- **RF-10:** Permitir preparar un nuevo sorteo o reiniciar toda la aplicación con confirmación previa.
- **RF-11:** Conservar estudiantes, configuración e historial en `localStorage`.
- **RF-12:** Mostrar mensajes claros de información, éxito, advertencia o error en cada operación.

---

## 10. Requerimientos no funcionales
- **RNF-01 (Separación de capas):** `src/logica.ts` no utiliza `document`, `window`, `alert` ni manipulación del DOM; toda función mutadora devuelve `boolean` (`true` o `false`).
- **RNF-02 (Compatibilidad móvil):** Ningún botón o control táctil mide menos de `44 × 44 px` (`48 px` en móvil), el texto base es de `16 px` y existe cero desplazamiento horizontal desde `320 px` de ancho.
- **RNF-03 (Rendimiento en gama baja):** Actualizaciones parciales del DOM sin destruir el formulario activo, cero uso de desenfoques costosos (`backdrop-filter`) y animaciones exclusivas en `transform` y `opacity` respetando `prefers-reduced-motion`.
- **RNF-04 (Calidad verificable):** Compilación limpia con `npx tsc --noEmit` y aprobación del 100 % de las pruebas en `npm test`.

---

## 11. Estructura de carpetas

```text
Sorteo-Justo/
├── .github/
│   └── workflows/
│       └── deploy.yml        # Flujo de publicación automática en GitHub Pages
├── evidencias/               # Capturas de pantalla reales de las 6 fases del desarrollo
│   └── .gitkeep
├── src/
│   ├── logica.ts             # Lógica pura, tipos, CONFIG, PRNG con semilla y algoritmo de sorteo
│   ├── main.ts               # Interfaz de usuario, eventos delegados y persistencia localStorage
│   └── estilo.css            # Estilos responsive mobile-first (azul marino, turquesa, verde y violeta)
├── test/
│   └── logica.test.ts        # 6 pruebas automatizadas con Vitest
├── index.html                # Documento HTML5 principal en español
├── package.json              # Scripts (dev, build, preview, lint, test) y dependencias de desarrollo
├── tsconfig.json             # Configuración del compilador TypeScript
├── vite.config.ts            # Configuración de Vite con base relativa ('./') para GitHub Pages
├── PROMPTS.md                # Registro cronológico y organizado por fases de los prompts utilizados
└── README.md                 # Documentación general del proyecto
```

---

## 12. Descripción del algoritmo de sorteo
El algoritmo implementado en `src/logica.ts` consta de tres etapas deterministas:
1. **Generador pseudoaleatorio con semilla (`crearGeneradorConSemilla`):** Implementa el algoritmo *Mulberry32* de 32 bits, el cual produce una secuencia reproducible de números en el intervalo `[0, 1)` a partir de una semilla entera positiva (`semilla`).
2. **Permutación uniforme (`mezclarConSemilla`):** Aplica el algoritmo de mezcla *Fisher-Yates* utilizando el generador con semilla para ordenar aleatoriamente una copia de la lista de estudiantes sin alterar el arreglo original ni repetir elementos.
3. **Partición equilibrada (`distribuirEnEquiposEquilibrados`):** Dados $N$ estudiantes y $K$ equipos:
   - Calcula el tamaño base $\lfloor N / K \rfloor$ y el residuo $R = N \bmod K$.
   - Los primeros $R$ equipos reciben $\lfloor N / K \rfloor + 1$ estudiantes y los $K - R$ equipos restantes reciben $\lfloor N / K \rfloor$ estudiantes.
   - Así se garantiza matemáticamente que la diferencia de tamaño entre cualquier par de equipos sea a lo sumo $1$ persona.

---

## 13. Explicación de cómo se evitan las repeticiones de compañeros
1. Antes de realizar un nuevo sorteo, el sistema revisa si existe un sorteo inmediato anterior en `historial[0]`.
2. Si existe, la función `extraerParejasDeEquipos` genera un conjunto (`Set<string>`) con todas las parejas de compañeros que compartieron equipo en dicho sorteo, normalizando los nombres y ordenándolos alfabéticamente (`nombreA||nombreB`).
3. Durante `realizarSorteo`, el sistema ejecuta un bucle acotado por `CONFIG.MAX_INTENTOS_SORTEO` (`250` intentos):
   - En cada intento genera una nueva mezcla con el PRNG, forma los equipos equilibrados y cuenta cuántas parejas coinciden con el conjunto del sorteo anterior (`contarParejasRepetidas`).
   - Guarda siempre la distribución candidata que haya obtenido el **menor número de parejas repetidas**.
   - Si en cualquier intento encuentra una distribución con **`0` parejas repetidas**, detiene la búsqueda de inmediato y la selecciona como ganadora.
   - Si tras evaluar los `250` intentos ninguna combinación logra `0` repeticiones (por límite combinatorio), conserva la mejor distribución encontrada e informa con total transparencia cuántas parejas se repitieron.

---

## 14. Funcionamiento del historial de sorteos
- Cada vez que `realizarSorteo` finaliza con éxito, el objeto `ResultadoSorteo` (que incluye `id`, `fechaIso`, `semillaUtilizada`, `equipos`, `parejasRepetidas`, `intentosRealizados` y `evitoTodasLasRepeticiones`) se inserta al inicio de `estado.historial` hasta un máximo de `CONFIG.MAX_HISTORIAL` (`50` registros).
- La semilla avanza automáticamente de forma determinista para el siguiente sorteo consecutivo.
- El docente puede tocar el botón **"Consultar sorteo"** en cualquier registro del historial para volver a visualizar las tarjetas de ese sorteo en pantalla, o tocar **"Limpiar historial"** para reiniciar el registro histórico sin perder la lista de estudiantes.

---

## 15. Instrucciones de instalación
Requisitos previos: tener instalado **Node.js** (versión 18 o superior) y **Git**.

```bash
# 1. Clonar el repositorio
git clone https://github.com/JorgeSantos3422/Sorteo-Justo.git

# 2. Entrar en la carpeta del proyecto
cd Sorteo-Justo

# 3. Instalar las dependencias
npm install
```

---

## 16. Cómo ejecutar el proyecto en Visual Studio Code
1. Abre la carpeta del proyecto en **Visual Studio Code** (`Archivo > Abrir carpeta...`).
2. Abre la terminal integrada (`` Ctrl + ` `` o `Ctrl + Ñ`).
3. Inicia el servidor de desarrollo ejecutando:
   ```bash
   npm run dev
   ```
4. Haz `Ctrl + Clic` sobre el enlace local mostrado en la terminal (por ejemplo `http://localhost:5173` o `http://localhost:3000`) para abrir la aplicación en el navegador.

---

## 17. Cómo ejecutar las pruebas automatizadas
Para ejecutar la suite de pruebas automatizadas con **Vitest** y verificar los tipos con **TypeScript**:

```bash
# Ejecutar las 6 pruebas automatizadas
npm test

# Comprobar que no existan errores de compilación TypeScript
npm run lint
```

---

## 18. Cómo generar la versión de producción
Para compilar y empaquetar los archivos estáticos optimizados en la carpeta `dist/`:

```bash
npm run build
```

Para previsualizar localmente la versión de producción generada:

```bash
npm run preview
```

---

## 19. Instrucciones para utilizarlo desde un celular
No necesitas instalar ninguna aplicación en tu teléfono Android ni mantener encendida tu computadora una vez publicado en GitHub Pages:
1. Abre el navegador **Google Chrome** en tu teléfono celular.
2. Ingresa al enlace público de la aplicación (ver sección 21).
3. **Paso 1 (Estudiantes):** Escribe el nombre de cada estudiante y toca **"Agregar estudiante"** (o toca **"Cargar grupo de prueba"** para probar de inmediato con 8 nombres). Si necesitas corregir un nombre o eliminar una baja, usa los botones táctiles de lápiz o papelera (`48 × 48 px`).
4. **Paso 2 (Equipos):** Usa los botones `−` y `+` para elegir cuántos equipos deseas formar y revisa el indicador de equilibrio previo.
5. **Paso 3 (Sorteo):** Toca **"Sortear Equipos Ahora"**. La pantalla se desplazará suavemente hacia las tarjetas de los equipos conformados.
6. **Paso 4 (Segundo sorteo sin repetir):** Vuelve a tocar **"Sortear Equipos Ahora"** en la siguiente actividad para que el algoritmo reorganice los equipos evitando las parejas del sorteo anterior.

---

## 20. Enlace al repositorio de GitHub
- **URL prevista del repositorio:** [https://github.com/JorgeSantos3422/Sorteo-Justo](https://github.com/JorgeSantos3422/Sorteo-Justo)
*(Nota: Verificar el acceso público tras subir los commits desde Visual Studio Code).*

---

## 21. Enlace público de la aplicación (GitHub Pages)
- **URL prevista de publicación:** [https://jorgesantos3422.github.io/Sorteo-Justo/](https://jorgesantos3422.github.io/Sorteo-Justo/)
*(Nota: Este enlace queda activo automáticamente tras subir el sexto commit y habilitar GitHub Pages en la pestaña Settings > Pages del repositorio).*

---

## 22. Descripción de las seis fases del desarrollo
1. **Fase 1 — Creación y configuración del proyecto:** Inicialización de la estructura con Vite, TypeScript y Vitest, creación de carpetas `src/`, `test/` y `evidencias/`, y verificación del entorno base.
2. **Fase 2 — Desarrollo de la lógica (`src/logica.ts`):** Implementación de tipos, constante `CONFIG`, generador pseudoaleatorio por semilla, validaciones de estudiantes, reparto equilibrado minimizando parejas repetidas, historial y serialización pura.
3. **Fase 3 — Pruebas automatizadas (`test/logica.test.ts`):** Creación de 6 pruebas unitarias e integrales con Vitest comprobando todas las reglas de negocio y casos borde matemáticos.
4. **Fase 4 — Interfaz de usuario profesional (`index.html`, `src/main.ts`, `src/estilo.css`):** Construcción de la interfaz con paleta azul marino oscuro, turquesa, verde esmeralda y violeta, edición en línea, confirmación integrada de reinicio y persistencia en `localStorage`.
5. **Fase 5 — Adaptación y optimización móvil:** Refactorización del renderizado con actualizaciones parciales del DOM, soporte para pantallas de `320 px` a `414 px`, botones táctiles de `48 px` y optimización para teléfonos Android de bajos recursos.
6. **Fase 6 — Documentación, publicación y entrega final:** Redacción de `README.md` y `PROMPTS.md`, configuración de `vite.config.ts` con ruta base relativa y flujo de despliegue automático para GitHub Pages.

---

## 23. Registro resumido de los seis commits

| N.° | Mensaje exacto del commit | Fase correspondiente | Archivos principales incluidos |
| :-: | :--- | :--- | :--- |
| **1** | `inicio: proyecto creado` | Fase 1 | `package.json`, `tsconfig.json`, `index.html`, `src/logica.ts`, `src/main.ts`, `src/estilo.css`, `test/logica.test.ts`, `PROMPTS.md`, `evidencias/.gitkeep` |
| **2** | `reglas: logica desde mi ficha` | Fase 2 | `src/logica.ts`, `PROMPTS.md` |
| **3** | `pruebas: reglas comprobadas` | Fase 3 | `test/logica.test.ts`, `PROMPTS.md` |
| **4** | `pantalla: interfaz basica` | Fase 4 | `index.html`, `src/main.ts`, `src/estilo.css`, `PROMPTS.md` |
| **5** | `movil: funciona con el dedo` | Fase 5 | `src/main.ts`, `src/estilo.css`, `PROMPTS.md` |
| **6** | `docs: readme y publicacion` | Fase 6 | `README.md`, `PROMPTS.md`, `vite.config.ts`, `.github/workflows/deploy.yml`, `evidencias/` |

---

## 24. Evidencias del desarrollo
Guarda las capturas reales de cada etapa dentro de la carpeta `./evidencias/` con los siguientes nombres para que se visualicen automáticamente en el repositorio:

### Fase 1: Configuración inicial del proyecto
![Evidencia Fase 1 - Configuración inicial](./evidencias/fase1-configuracion.png)

### Fase 2: Desarrollo de la lógica (`src/logica.ts`)
![Evidencia Fase 2 - Lógica implementada](./evidencias/fase2-logica.png)

### Fase 3: Pruebas automatizadas aprobadas con Vitest
![Evidencia Fase 3 - Pruebas en Vitest](./evidencias/fase3-pruebas.png)

### Fase 4: Interfaz profesional en escritorio
![Evidencia Fase 4 - Interfaz profesional](./evidencias/fase4-interfaz.png)

### Fase 5: Funcionamiento y adaptación móvil (`320px` - `414px`)
![Evidencia Fase 5 - Vista móvil](./evidencias/fase5-movil.png)

### Fase 6: Publicación final en GitHub Pages
![Evidencia Fase 6 - Publicación en GitHub Pages](./evidencias/fase6-publicacion.png)

---

## 25. Pruebas realizadas y resultados reales
Al ejecutar `npm test` (Vitest) y `npm run lint` (`tsc --noEmit`), el proyecto supera las siguientes **6 pruebas automatizadas reales** definidas en `test/logica.test.ts`:

| Prueba | Descripción verificada | Resultado real (`Vitest`) |
| :--- | :--- | :---: |
| **Prueba 1** | Comprueba el estado inicial limpio y los parámetros numéricos de `CONFIG`. | **APROBADA (`PASS`)** |
| **Prueba 2** | Valida el registro, edición y eliminación de estudiantes rechazando vacíos y duplicados (con/sin tildes o mayúsculas). | **APROBADA (`PASS`)** |
| **Prueba 3** | Verifica las restricciones del reparto y que ningún estudiante se repita ni se omita en un sorteo. | **APROBADA (`PASS`)** |
| **Prueba 4** | Comprueba el equilibrio de los equipos (`10` estudiantes en `3` equipos $\rightarrow [4, 3, 3]$), la reproducibilidad por semilla y la consulta del historial. | **APROBADA (`PASS`)** |
| **Prueba 5** | Verifica que se eviten el 100 % de parejas repetidas cuando es posible (`6` est. en `3` equipos) y que se emita la advertencia transparente cuando es matemáticamente imposible (`5` est. en `2` equipos). | **APROBADA (`PASS`)** |
| **Prueba 6** | Recorrido completo de usuario: registro, corrección, eliminación de baja, sorteos consecutivos, exportación/importación de `localStorage` y reinicio. | **APROBADA (`PASS`)** |

Resumen de ejecución real en consola:
- `Test Files: 1 passed (1)`
- `Tests: 6 passed (6)`
- `npx tsc --noEmit`: `0` errores de tipos.

---

## 26. Declaración de autoría y uso de inteligencia artificial
- **Autor del proyecto:** Jorge Alberto Villegas Santos (`@JorgeSantos3422`)
- **Encargo académico:** Práctica de Desarrollo de Software — Encargo N.° 37 (**SORTEO JUSTO**).
- **Declaración de uso de IA:** Durante el desarrollo de este proyecto se utilizó asistencia de Inteligencia Artificial como apoyo de programación y documentación, bajo la dirección, revisión, ejecución en Visual Studio Code, verificación de pruebas y control de versiones en GitHub por parte del estudiante autor. Todas las instrucciones enviadas se encuentran registradas de manera transparente en el archivo [`PROMPTS.md`](./PROMPTS.md).

---

## 27. Conclusiones del proyecto
1. **Separación efectiva de responsabilidades:** Aislar por completo las reglas de negocio en `src/logica.ts` permitió verificar matemáticamente el algoritmo de sorteo y sus casos borde con Vitest sin depender del navegador.
2. **Justicia y transparencia algorítmica:** El uso de un generador pseudoaleatorio con semilla combinado con la evaluación de múltiples intentos resuelve el problema práctico de la repetición de compañeros en el aula e informa con honestidad cuando existe una restricción combinatoria inevitable.
3. **Accesibilidad y eficiencia móvil:** Mediante actualizaciones parciales del DOM y CSS ligero sin dependencias pesadas, se logró una aplicación web estática que responde instantáneamente en celulares Android de bajos recursos y funciona de forma autónoma desde GitHub Pages.
