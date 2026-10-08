/**
 * Módulo de lógica pura para SORTEO JUSTO (Encargo 37)
 * Fase 2: Reglas de negocio, validaciones, generador pseudoaleatorio con semilla,
 * reparto equilibrado con minimización de parejas repetidas e historial.
 *
 * IMPORTANTE: Este archivo es 100% libre de DOM (no usa document, window, alert ni localStorage).
 */

export const CONFIG = {
  /** Cantidad mínima de estudiantes requerida para realizar un sorteo (unidades: personas) */
  MIN_ESTUDIANTES: 2,
  /** Cantidad máxima de estudiantes permitida en una lista (unidades: personas) */
  MAX_ESTUDIANTES: 200,
  /** Cantidad mínima de equipos permitida (unidades: equipos) */
  MIN_EQUIPOS: 2,
  /** Longitud mínima permitida para el nombre de un estudiante (unidades: caracteres) */
  MIN_LONGITUD_NOMBRE: 2,
  /** Longitud máxima permitida para el nombre de un estudiante (unidades: caracteres) */
  MAX_LONGITUD_NOMBRE: 60,
  /** Cantidad máxima de intentos para minimizar parejas repetidas (unidades: intentos) */
  MAX_INTENTOS_SORTEO: 250,
  /** Semilla numérica inicial por defecto para reproducibilidad (unidades: valor numérico entero) */
  SEMILLA_POR_DEFECTO: 202637,
  /** Cantidad máxima de sorteos almacenados en el historial (unidades: sorteos) */
  MAX_HISTORIAL: 50,
} as const;

/** Representa a un estudiante registrado en la aplicación */
export interface Estudiante {
  id: string;
  nombre: string;
}

/** Representa un equipo conformado durante un sorteo */
export interface Equipo {
  numero: number;
  nombre: string;
  integrantes: Estudiante[];
}

/** Representa el resultado completo de un sorteo realizado */
export interface ResultadoSorteo {
  id: string;
  fechaIso: string;
  semillaUtilizada: number;
  cantidadEstudiantes: number;
  cantidadEquipos: number;
  equipos: Equipo[];
  parejasRepetidas: number;
  intentosRealizados: number;
  evitoTodasLasRepeticiones: boolean;
}

/** Categorías de mensajes de retroalimentación para la interfaz */
export type TipoMensaje = 'info' | 'exito' | 'advertencia' | 'error';

/** Estructura del estado global de la aplicación */
export interface EstadoSorteo {
  estudiantes: Estudiante[];
  cantidadEquipos: number;
  semilla: number;
  sorteoActual: ResultadoSorteo | null;
  historial: ResultadoSorteo[];
  ultimoMensaje: string;
  tipoMensaje: TipoMensaje;
}

/** Estructura serializable para persistencia externa (por ejemplo en localStorage desde main.ts) */
export interface DatosPersistidos {
  estudiantes: Estudiante[];
  cantidadEquipos: number;
  semilla: number;
  historial: ResultadoSorteo[];
}

/** Estado interno único de la aplicación */
let estado: EstadoSorteo = crearEstadoBase();

/** Contador incremental interno para identificadores deterministas */
let contadorSecuencial = 1;

/**
 * Crea un estado limpio con los valores iniciales de CONFIG.
 */
function crearEstadoBase(): EstadoSorteo {
  return {
    estudiantes: [],
    cantidadEquipos: CONFIG.MIN_EQUIPOS,
    semilla: CONFIG.SEMILLA_POR_DEFECTO,
    sorteoActual: null,
    historial: [],
    ultimoMensaje: 'Aplicación lista para registrar estudiantes.',
    tipoMensaje: 'info',
  };
}

/**
 * Devuelve una copia profunda e inmutable del estado actual para su consulta segura desde la interfaz o pruebas.
 */
export function obtenerEstado(): EstadoSorteo {
  return {
    estudiantes: estado.estudiantes.map((e) => ({ ...e })),
    cantidadEquipos: estado.cantidadEquipos,
    semilla: estado.semilla,
    sorteoActual: estado.sorteoActual ? clonarResultadoSorteo(estado.sorteoActual) : null,
    historial: estado.historial.map(clonarResultadoSorteo),
    ultimoMensaje: estado.ultimoMensaje,
    tipoMensaje: estado.tipoMensaje,
  };
}

/**
 * Clona un resultado de sorteo para evitar mutaciones externas.
 */
function clonarResultadoSorteo(sorteo: ResultadoSorteo): ResultadoSorteo {
  return {
    ...sorteo,
    equipos: sorteo.equipos.map((eq) => ({
      ...eq,
      integrantes: eq.integrantes.map((est) => ({ ...est })),
    })),
  };
}

/**
 * Limpia espacios múltiples y extremos del nombre ingresado.
 */
export function limpiarNombre(nombre: string): string {
  return nombre.trim().replace(/\s+/g, ' ');
}

/**
 * Normaliza un nombre para comparaciones insensibles a mayúsculas/minúsculas y tildes.
 */
export function normalizarNombreParaComparar(nombre: string): string {
  return limpiarNombre(nombre)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Generador pseudoaleatorio determinista basado en semilla (algoritmo Mulberry32).
 * Devuelve una función que produce números decimales en el rango [0, 1).
 */
export function crearGeneradorConSemilla(semilla: number): () => number {
  let estadoSemilla = (Math.floor(Math.abs(semilla)) || 1) >>> 0;
  return function siguienteAleatorio(): number {
    estadoSemilla = (estadoSemilla + 0x6d2b79f5) >>> 0;
    let t = Math.imul(estadoSemilla ^ (estadoSemilla >>> 15), 1 | estadoSemilla);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Mezcla un arreglo de elementos de forma reproducible usando el algoritmo Fisher-Yates y un generador con semilla.
 */
export function mezclarConSemilla<T>(elementos: readonly T[], generador: () => number): T[] {
  const copia = [...elementos];
  for (let i = copia.length - 1; i > 0; i--) {
    const indiceAleatorio = Math.floor(generador() * (i + 1));
    const temporal = copia[i];
    copia[i] = copia[indiceAleatorio];
    copia[indiceAleatorio] = temporal;
  }
  return copia;
}

/**
 * Construye una clave única y ordenada alfabéticamente para representar una pareja de compañeros.
 */
export function obtenerClavePareja(idA: string, idB: string): string {
  const a = normalizarNombreParaComparar(idA);
  const b = normalizarNombreParaComparar(idB);
  return a < b ? `${a}||${b}` : `${b}||${a}`;
}

/**
 * Extrae el conjunto de todas las parejas de compañeros presentes en una lista de equipos.
 * Se basa en el nombre normalizado para mantener consistencia incluso si se recargan listas.
 */
export function extraerParejasDeEquipos(equipos: readonly Equipo[]): Set<string> {
  const parejas = new Set<string>();
  for (const equipo of equipos) {
    const lista = equipo.integrantes;
    for (let i = 0; i < lista.length; i++) {
      for (let j = i + 1; j < lista.length; j++) {
        parejas.add(obtenerClavePareja(lista[i].nombre, lista[j].nombre));
      }
    }
  }
  return parejas;
}

/**
 * Cuenta cuántas parejas de una distribución candidata ya estuvieron juntas en el sorteo anterior.
 */
export function contarParejasRepetidas(
  equiposCandidatos: readonly Equipo[],
  parejasAnteriores: ReadonlySet<string>
): number {
  if (parejasAnteriores.size === 0) {
    return 0;
  }
  const parejasActuales = extraerParejasDeEquipos(equiposCandidatos);
  let repetidas = 0;
  for (const pareja of parejasActuales) {
    if (parejasAnteriores.has(pareja)) {
      repetidas++;
    }
  }
  return repetidas;
}

/**
 * Reparte una lista de estudiantes ya mezclada en la cantidad de equipos indicada,
 * garantizando que la diferencia de integrantes entre cualquier par de equipos sea como máximo 1 persona.
 */
export function distribuirEnEquiposEquilibrados(
  estudiantesMezclados: readonly Estudiante[],
  cantidadEquipos: number
): Equipo[] {
  const totalEstudiantes = estudiantesMezclados.length;
  const tamanoBase = Math.floor(totalEstudiantes / cantidadEquipos);
  const equiposConUnoExtra = totalEstudiantes % cantidadEquipos;

  const equipos: Equipo[] = [];
  let cursor = 0;

  for (let i = 0; i < cantidadEquipos; i++) {
    const cantidadEnEsteEquipo = i < equiposConUnoExtra ? tamanoBase + 1 : tamanoBase;
    const integrantes = estudiantesMezclados
      .slice(cursor, cursor + cantidadEnEsteEquipo)
      .map((est) => ({ ...est }));
    cursor += cantidadEnEsteEquipo;

    equipos.push({
      numero: i + 1,
      nombre: `Equipo ${i + 1}`,
      integrantes,
    });
  }

  return equipos;
}

/**
 * Registra un nuevo estudiante validando que el nombre no sea vacío, cumpla la longitud y no esté duplicado.
 * Devuelve true si la operación es válida y false cuando no lo es.
 */
export function registrarEstudiante(nombreInput: string): boolean {
  if (typeof nombreInput !== 'string') {
    estado.ultimoMensaje = 'El nombre del estudiante debe ser un texto válido.';
    estado.tipoMensaje = 'error';
    return false;
  }

  const nombreLimpio = limpiarNombre(nombreInput);

  if (nombreLimpio.length === 0) {
    estado.ultimoMensaje = 'El nombre del estudiante no puede estar vacío.';
    estado.tipoMensaje = 'error';
    return false;
  }

  if (nombreLimpio.length < CONFIG.MIN_LONGITUD_NOMBRE) {
    estado.ultimoMensaje = `El nombre debe tener al menos ${CONFIG.MIN_LONGITUD_NOMBRE} caracteres.`;
    estado.tipoMensaje = 'error';
    return false;
  }

  if (nombreLimpio.length > CONFIG.MAX_LONGITUD_NOMBRE) {
    estado.ultimoMensaje = `El nombre no puede superar los ${CONFIG.MAX_LONGITUD_NOMBRE} caracteres.`;
    estado.tipoMensaje = 'error';
    return false;
  }

  if (estado.estudiantes.length >= CONFIG.MAX_ESTUDIANTES) {
    estado.ultimoMensaje = `Se alcanzó el límite máximo de ${CONFIG.MAX_ESTUDIANTES} estudiantes.`;
    estado.tipoMensaje = 'error';
    return false;
  }

  const claveNueva = normalizarNombreParaComparar(nombreLimpio);
  const existeDuplicado = estado.estudiantes.some(
    (est) => normalizarNombreParaComparar(est.nombre) === claveNueva
  );

  if (existeDuplicado) {
    estado.ultimoMensaje = `El estudiante "${nombreLimpio}" ya está registrado en la lista.`;
    estado.tipoMensaje = 'error';
    return false;
  }

  const nuevoEstudiante: Estudiante = {
    id: `est-${contadorSecuencial++}`,
    nombre: nombreLimpio,
  };

  estado.estudiantes.push(nuevoEstudiante);
  estado.ultimoMensaje = `Estudiante "${nombreLimpio}" registrado correctamente.`;
  estado.tipoMensaje = 'exito';
  return true;
}

/**
 * Modifica el nombre de un estudiante existente verificando que no quede vacío ni duplique a otro compañero.
 * Devuelve true si la operación es válida y false cuando no lo es.
 */
export function modificarEstudiante(idEstudiante: string, nuevoNombreInput: string): boolean {
  const indice = estado.estudiantes.findIndex((est) => est.id === idEstudiante);
  if (indice === -1) {
    estado.ultimoMensaje = 'No se encontró el estudiante que se intenta modificar.';
    estado.tipoMensaje = 'error';
    return false;
  }

  if (typeof nuevoNombreInput !== 'string') {
    estado.ultimoMensaje = 'El nuevo nombre debe ser un texto válido.';
    estado.tipoMensaje = 'error';
    return false;
  }

  const nombreLimpio = limpiarNombre(nuevoNombreInput);

  if (nombreLimpio.length === 0) {
    estado.ultimoMensaje = 'El nuevo nombre del estudiante no puede estar vacío.';
    estado.tipoMensaje = 'error';
    return false;
  }

  if (nombreLimpio.length < CONFIG.MIN_LONGITUD_NOMBRE) {
    estado.ultimoMensaje = `El nombre debe tener al menos ${CONFIG.MIN_LONGITUD_NOMBRE} caracteres.`;
    estado.tipoMensaje = 'error';
    return false;
  }

  if (nombreLimpio.length > CONFIG.MAX_LONGITUD_NOMBRE) {
    estado.ultimoMensaje = `El nombre no puede superar los ${CONFIG.MAX_LONGITUD_NOMBRE} caracteres.`;
    estado.tipoMensaje = 'error';
    return false;
  }

  const claveNueva = normalizarNombreParaComparar(nombreLimpio);
  const duplicadoEnOtro = estado.estudiantes.some(
    (est, idx) => idx !== indice && normalizarNombreParaComparar(est.nombre) === claveNueva
  );

  if (duplicadoEnOtro) {
    estado.ultimoMensaje = `Ya existe otro estudiante llamado "${nombreLimpio}".`;
    estado.tipoMensaje = 'error';
    return false;
  }

  const nombreAnterior = estado.estudiantes[indice].nombre;
  estado.estudiantes[indice].nombre = nombreLimpio;
  estado.ultimoMensaje = `Se actualizó "${nombreAnterior}" a "${nombreLimpio}".`;
  estado.tipoMensaje = 'exito';
  return true;
}

/** Alias de modificarEstudiante para mayor legibilidad desde distintos módulos */
export const editarEstudiante = modificarEstudiante;

/**
 * Elimina a un estudiante de la lista por su identificador único.
 * Devuelve true si se eliminó correctamente y false si no existe.
 */
export function eliminarEstudiante(idEstudiante: string): boolean {
  const indice = estado.estudiantes.findIndex((est) => est.id === idEstudiante);
  if (indice === -1) {
    estado.ultimoMensaje = 'No se encontró el estudiante que se desea eliminar.';
    estado.tipoMensaje = 'error';
    return false;
  }

  const [eliminado] = estado.estudiantes.splice(indice, 1);

  if (
    estado.estudiantes.length >= CONFIG.MIN_EQUIPOS &&
    estado.cantidadEquipos > estado.estudiantes.length
  ) {
    estado.cantidadEquipos = estado.estudiantes.length;
  }

  estado.ultimoMensaje = `Estudiante "${eliminado.nombre}" eliminado de la lista.`;
  estado.tipoMensaje = 'info';
  return true;
}

/**
 * Configura la cantidad de equipos deseada para el sorteo.
 * Devuelve true cuando la cantidad es válida y false cuando no cumple las restricciones.
 */
export function configurarCantidadEquipos(cantidad: number): boolean {
  if (!Number.isInteger(cantidad) || cantidad < CONFIG.MIN_EQUIPOS) {
    estado.ultimoMensaje = `La cantidad de equipos debe ser un número entero mayor o igual a ${CONFIG.MIN_EQUIPOS}.`;
    estado.tipoMensaje = 'error';
    return false;
  }

  if (
    estado.estudiantes.length >= CONFIG.MIN_ESTUDIANTES &&
    cantidad > estado.estudiantes.length
  ) {
    estado.ultimoMensaje = `No se pueden crear ${cantidad} equipos con solo ${estado.estudiantes.length} estudiantes registrados.`;
    estado.tipoMensaje = 'error';
    return false;
  }

  estado.cantidadEquipos = cantidad;
  estado.ultimoMensaje = `Cantidad de equipos configurada en ${cantidad}.`;
  estado.tipoMensaje = 'exito';
  return true;
}

/**
 * Configura la semilla numérica para el generador pseudoaleatorio.
 * Devuelve true si la semilla es un número válido y false en caso contrario.
 */
export function configurarSemilla(nuevaSemilla: number): boolean {
  if (typeof nuevaSemilla !== 'number' || !Number.isFinite(nuevaSemilla) || nuevaSemilla <= 0) {
    estado.ultimoMensaje = 'La semilla debe ser un número positivo válido.';
    estado.tipoMensaje = 'error';
    return false;
  }

  estado.semilla = Math.floor(nuevaSemilla);
  estado.ultimoMensaje = `Semilla configurada en ${estado.semilla}.`;
  estado.tipoMensaje = 'info';
  return true;
}

/**
 * Ejecuta el sorteo de equipos equilibrados intentando minimizar las parejas repetidas
 * respecto al sorteo inmediatamente anterior mediante hasta CONFIG.MAX_INTENTOS_SORTEO intentos.
 * Devuelve true cuando el sorteo se realiza con éxito y false cuando las condiciones no son válidas.
 */
export function realizarSorteo(semillaOpcional?: number): boolean {
  const totalEstudiantes = estado.estudiantes.length;
  const totalEquipos = estado.cantidadEquipos;

  if (totalEstudiantes < CONFIG.MIN_ESTUDIANTES) {
    estado.ultimoMensaje = `Se necesitan al menos ${CONFIG.MIN_ESTUDIANTES} estudiantes registrados para realizar un sorteo.`;
    estado.tipoMensaje = 'error';
    return false;
  }

  if (totalEquipos < CONFIG.MIN_EQUIPOS) {
    estado.ultimoMensaje = `Debe seleccionar al menos ${CONFIG.MIN_EQUIPOS} equipos para el sorteo.`;
    estado.tipoMensaje = 'error';
    return false;
  }

  if (totalEquipos > totalEstudiantes) {
    estado.ultimoMensaje = `La cantidad de equipos (${totalEquipos}) no puede superar la cantidad de estudiantes (${totalEstudiantes}).`;
    estado.tipoMensaje = 'error';
    return false;
  }

  if (semillaOpcional !== undefined) {
    if (
      typeof semillaOpcional !== 'number' ||
      !Number.isFinite(semillaOpcional) ||
      semillaOpcional <= 0
    ) {
      estado.ultimoMensaje = 'La semilla proporcionada para el sorteo no es válida.';
      estado.tipoMensaje = 'error';
      return false;
    }
    estado.semilla = Math.floor(semillaOpcional);
  }

  const semillaUsada = estado.semilla;
  const generador = crearGeneradorConSemilla(semillaUsada);

  const sorteoAnterior = estado.historial.length > 0 ? estado.historial[0] : null;
  const parejasAnteriores = sorteoAnterior
    ? extraerParejasDeEquipos(sorteoAnterior.equipos)
    : new Set<string>();

  let mejorDistribucion: Equipo[] = [];
  let menorCantidadRepetidas = Number.POSITIVE_INFINITY;
  let intentosEfectuados = 0;

  const limiteIntentos =
    parejasAnteriores.size === 0 ? 1 : Math.max(1, CONFIG.MAX_INTENTOS_SORTEO);

  for (let intento = 1; intento <= limiteIntentos; intento++) {
    intentosEfectuados = intento;
    const mezclados = mezclarConSemilla(estado.estudiantes, generador);
    const equiposCandidatos = distribuirEnEquiposEquilibrados(mezclados, totalEquipos);
    const repetidas = contarParejasRepetidas(equiposCandidatos, parejasAnteriores);

    if (repetidas < menorCantidadRepetidas) {
      menorCantidadRepetidas = repetidas;
      mejorDistribucion = equiposCandidatos;
    }

    if (menorCantidadRepetidas === 0) {
      break;
    }
  }

  const resultado: ResultadoSorteo = {
    id: `sorteo-${contadorSecuencial++}-${semillaUsada}`,
    fechaIso: new Date().toISOString(),
    semillaUtilizada: semillaUsada,
    cantidadEstudiantes: totalEstudiantes,
    cantidadEquipos: totalEquipos,
    equipos: mejorDistribucion,
    parejasRepetidas: menorCantidadRepetidas,
    intentosRealizados: intentosEfectuados,
    evitoTodasLasRepeticiones: menorCantidadRepetidas === 0,
  };

  estado.sorteoActual = resultado;
  estado.historial.unshift(clonarResultadoSorteo(resultado));

  if (estado.historial.length > CONFIG.MAX_HISTORIAL) {
    estado.historial = estado.historial.slice(0, CONFIG.MAX_HISTORIAL);
  }

  // Avanza la semilla de forma determinista para el siguiente sorteo consecutivo
  estado.semilla = ((semillaUsada * 1664525 + 1013904223) >>> 0) || CONFIG.SEMILLA_POR_DEFECTO;

  if (menorCantidadRepetidas === 0) {
    estado.ultimoMensaje =
      sorteoAnterior === null
        ? `Sorteo realizado con éxito en ${totalEquipos} equipos equilibrados.`
        : `Sorteo completado sin repetir ninguna pareja del sorteo anterior (en ${intentosEfectuados} ${
            intentosEfectuados === 1 ? 'intento' : 'intentos'
          }).`;
    estado.tipoMensaje = 'exito';
  } else {
    estado.ultimoMensaje = `Aviso transparente: Tras evaluar ${intentosEfectuados} combinaciones posibles, fue matemáticamente inevitable repetir ${menorCantidadRepetidas} ${
      menorCantidadRepetidas === 1 ? 'pareja' : 'parejas'
    } del sorteo anterior. Se seleccionó el reparto más justo posible.`;
    estado.tipoMensaje = 'advertencia';
  }

  return true;
}

/**
 * Permite seleccionar y visualizar en sorteoActual un sorteo previo almacenado en el historial.
 * Devuelve true si el sorteo existe en el historial y false en caso contrario.
 */
export function seleccionarSorteoDeHistorial(idSorteo: string): boolean {
  const encontrado = estado.historial.find((item) => item.id === idSorteo);
  if (!encontrado) {
    estado.ultimoMensaje = 'El sorteo consultado no existe en el historial.';
    estado.tipoMensaje = 'error';
    return false;
  }

  estado.sorteoActual = clonarResultadoSorteo(encontrado);
  estado.ultimoMensaje = `Consultando sorteo histórico (${encontrado.cantidadEquipos} equipos, semilla ${encontrado.semillaUtilizada}).`;
  estado.tipoMensaje = 'info';
  return true;
}

/**
 * Prepara la vista para un nuevo sorteo limpiando el sorteo en pantalla pero conservando estudiantes e historial.
 * Devuelve siempre true.
 */
export function prepararNuevoSorteo(): boolean {
  estado.sorteoActual = null;
  estado.ultimoMensaje = 'Listo para configurar y ejecutar un nuevo sorteo.';
  estado.tipoMensaje = 'info';
  return true;
}

/**
 * Borra el historial de sorteos realizados manteniendo la lista actual de estudiantes.
 * Devuelve siempre true.
 */
export function limpiarHistorial(): boolean {
  estado.historial = [];
  estado.sorteoActual = null;
  estado.ultimoMensaje = 'El historial de sorteos se ha limpiado correctamente.';
  estado.tipoMensaje = 'info';
  return true;
}

/**
 * Reinicia por completo el estado de la aplicación a sus valores iniciales.
 * Devuelve siempre true.
 */
export function reiniciarAplicacion(): boolean {
  contadorSecuencial = 1;
  estado = crearEstadoBase();
  return true;
}

/** Alias de reiniciarAplicacion para pruebas unitarias */
export const reiniciarEstado = reiniciarAplicacion;

/**
 * Exporta los datos relevantes del estado en un objeto serializable puro para que la capa de interfaz
 * pueda guardarlos en localStorage sin acoplar logica.ts al navegador.
 */
export function exportarDatosParaGuardar(): DatosPersistidos {
  const copia = obtenerEstado();
  return {
    estudiantes: copia.estudiantes,
    cantidadEquipos: copia.cantidadEquipos,
    semilla: copia.semilla,
    historial: copia.historial,
  };
}

/**
 * Restaura el estado a partir de datos previamente guardados (por ejemplo, leídos desde localStorage en main.ts).
 * Valida la estructura antes de aplicarla y devuelve true si la carga fue válida o false si los datos están corruptos.
 */
export function cargarDatosGuardados(datos: unknown): boolean {
  if (!datos || typeof datos !== 'object') {
    estado.ultimoMensaje = 'Los datos almacenados no tienen un formato válido.';
    estado.tipoMensaje = 'error';
    return false;
  }

  const posible = datos as Partial<DatosPersistidos>;

  if (!Array.isArray(posible.estudiantes) || !Array.isArray(posible.historial)) {
    estado.ultimoMensaje = 'La estructura de estudiantes o historial guardado es inválida.';
    estado.tipoMensaje = 'error';
    return false;
  }

  const estudiantesValidos: Estudiante[] = [];
  const nombresVistos = new Set<string>();

  for (const item of posible.estudiantes) {
    if (item && typeof item.id === 'string' && typeof item.nombre === 'string') {
      const limpio = limpiarNombre(item.nombre);
      const clave = normalizarNombreParaComparar(limpio);
      if (limpio.length >= CONFIG.MIN_LONGITUD_NOMBRE && !nombresVistos.has(clave)) {
        nombresVistos.add(clave);
        estudiantesValidos.push({ id: item.id, nombre: limpio });
      }
    }
  }

  const cantidadEquiposValida =
    typeof posible.cantidadEquipos === 'number' &&
    Number.isInteger(posible.cantidadEquipos) &&
    posible.cantidadEquipos >= CONFIG.MIN_EQUIPOS
      ? posible.cantidadEquipos
      : CONFIG.MIN_EQUIPOS;

  const semillaValida =
    typeof posible.semilla === 'number' && Number.isFinite(posible.semilla) && posible.semilla > 0
      ? Math.floor(posible.semilla)
      : CONFIG.SEMILLA_POR_DEFECTO;

  estado = {
    estudiantes: estudiantesValidos,
    cantidadEquipos: cantidadEquiposValida,
    semilla: semillaValida,
    sorteoActual: posible.historial.length > 0 ? clonarResultadoSorteo(posible.historial[0]) : null,
    historial: posible.historial.slice(0, CONFIG.MAX_HISTORIAL).map(clonarResultadoSorteo),
    ultimoMensaje: 'Datos recuperados correctamente.',
    tipoMensaje: 'info',
  };

  contadorSecuencial = estudiantesValidos.length + estado.historial.length + 1;
  return true;
}
