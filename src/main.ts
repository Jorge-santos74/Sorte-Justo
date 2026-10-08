/**
 * Interfaz de usuario principal para SORTEO JUSTO (Fase 5: Optimización móvil Android)
 * Consume únicamente las funciones de src/logica.ts.
 * Implementa actualizaciones parciales del DOM para evitar cierres del teclado virtual
 * en celulares, minimizar el consumo de memoria RAM y evitar bloqueos de la interfaz.
 */

import './estilo.css';
import {
  CONFIG,
  obtenerEstado,
  registrarEstudiante,
  modificarEstudiante,
  eliminarEstudiante,
  configurarCantidadEquipos,
  configurarSemilla,
  realizarSorteo,
  seleccionarSorteoDeHistorial,
  prepararNuevoSorteo,
  limpiarHistorial,
  reiniciarAplicacion,
  exportarDatosParaGuardar,
  cargarDatosGuardados,
  type EstadoSorteo,
  type ResultadoSorteo,
  type TipoMensaje,
} from './logica';

const CLAVE_STORAGE = 'sorteo_justo_datos_v1';
const LIMITE_HISTORIAL_COMPACTO = 8;

/** Identificador del estudiante que está siendo editado en línea */
let idEstudianteEditando: string | null = null;

/** Indica si se muestra el cuadro de confirmación para reiniciar todos los datos */
let mostrandoConfirmacionReinicio = false;

/** Indica si en móviles se despliega el historial completo cuando supera LIMITE_HISTORIAL_COMPACTO */
let mostrarHistorialCompleto = false;

/** Evita ejecuciones simultáneas mientras se procesa un sorteo */
let sorteoEnCurso = false;

const ESTUDIANTES_EJEMPLO = [
  'Ana María Rojas',
  'Carlos Andrés Pérez',
  'Valentina Gómez',
  'Mateo Hernández',
  'Sofía Fernández',
  'Sebastián Torres',
  'Camila Vargas',
  'Diego Alejandro Ruiz',
];

/** Referencias en caché a nodos del DOM para actualizaciones parciales ultrarrápidas */
interface ReferenciasDom {
  resumenIndicadores: HTMLElement;
  btnReiniciarTodo: HTMLButtonElement;
  panelConfirmacion: HTMLElement;
  bannerMensaje: HTMLElement;
  iconoBanner: HTMLElement;
  textoBanner: HTMLElement;
  metaTotalEstudiantes: HTMLElement;
  inputNombreEstudiante: HTMLInputElement;
  contenedorListaEstudiantes: HTMLElement;
  btnDecrementarEquipos: HTMLButtonElement;
  valorEquipos: HTMLElement;
  btnIncrementarEquipos: HTMLButtonElement;
  notaEquilibrio: HTMLElement;
  inputSemilla: HTMLInputElement;
  btnEjecutarSorteo: HTMLButtonElement;
  contenedorBtnNuevoSorteo: HTMLElement;
  seccionResultados: HTMLElement;
  metaResultados: HTMLElement;
  contenedorResultados: HTMLElement;
  contenedorAccionHistorial: HTMLElement;
  contenedorHistorial: HTMLElement;
}

let refs: ReferenciasDom | null = null;

/**
 * Escapa caracteres HTML especiales en una sola pasada.
 */
function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Formatea una fecha ISO a hora local legible.
 */
function formatearFechaCorta(fechaIso: string): string {
  try {
    const fecha = new Date(fechaIso);
    return fecha.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return fechaIso;
  }
}

/**
 * Guarda el estado actual en localStorage sin bloquear el hilo principal.
 */
function guardarEnAlmacenamientoLocal(): void {
  try {
    const datos = exportarDatosParaGuardar();
    window.localStorage.setItem(CLAVE_STORAGE, JSON.stringify(datos));
  } catch {
    // Continúa en memoria si el navegador restringe el almacenamiento
  }
}

/**
 * Restaura los datos guardados en localStorage al iniciar la aplicación.
 */
function restaurarDeAlmacenamientoLocal(): void {
  try {
    const crudo = window.localStorage.getItem(CLAVE_STORAGE);
    if (!crudo) {
      return;
    }
    const parseado: unknown = JSON.parse(crudo);
    cargarDatosGuardados(parseado);
  } catch {
    // Si hay datos corruptos, se mantiene el estado base limpio
  }
}

/**
 * Devuelve el icono SVG ligero correspondiente al tipo de mensaje.
 */
function obtenerIconoBanner(tipo: TipoMensaje): string {
  switch (tipo) {
    case 'exito':
      return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>`;
    case 'error':
      return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>`;
    case 'advertencia':
      return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>`;
    default:
      return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>`;
  }
}

/**
 * Describe la distribución exacta de integrantes antes de ejecutar el sorteo.
 */
function describirEquilibrioPrevio(totalEstudiantes: number, cantidadEquipos: number): string {
  if (totalEstudiantes < CONFIG.MIN_ESTUDIANTES) {
    return `Registra al menos ${CONFIG.MIN_ESTUDIANTES} estudiantes para habilitar el sorteo.`;
  }
  if (cantidadEquipos > totalEstudiantes) {
    return `Reduce los equipos a máximo ${totalEstudiantes} o agrega más estudiantes.`;
  }

  const base = Math.floor(totalEstudiantes / cantidadEquipos);
  const extra = totalEstudiantes % cantidadEquipos;

  if (extra === 0) {
    return `Se formarán ${cantidadEquipos} equipos exactos de ${base} ${
      base === 1 ? 'integrante' : 'integrantes'
    } cada uno.`;
  }

  return `Equilibrio garantizado: ${extra} ${
    extra === 1 ? 'equipo tendrá' : 'equipos tendrán'
  } ${base + 1} integrantes y ${cantidadEquipos - extra} ${
    cantidadEquipos - extra === 1 ? 'equipo tendrá' : 'equipos tendrán'
  } ${base} (diferencia máxima de 1 persona).`;
}

/**
 * Monta una sola vez el esqueleto HTML estático y guarda las referencias de los contenedores dinámicos.
 * Así el campo de texto y el teclado virtual en móviles Android nunca se destruyen ni parpadean al agregar estudiantes.
 */
function montarEstructuraBase(): void {
  const contenedor = document.querySelector<HTMLDivElement>('#app');
  if (!contenedor) {
    return;
  }

  contenedor.innerHTML = `
    <div class="contenedor-app">
      <!-- Encabezado principal -->
      <header class="encabezado">
        <div class="encabezado-identidad">
          <div class="marca-icono" aria-hidden="true">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87"/>
              <path d="M16 3.13a4 4 0 010 7.75"/>
            </svg>
          </div>
          <div>
            <h1 class="titulo-app">SORTEO JUSTO</h1>
            <p class="subtitulo-app">Equipos equilibrados al azar sin repetir compañeros</p>
          </div>
        </div>

        <div class="barra-metricas">
          <div id="dom-resumen-indicadores" class="resumen-indicadores" aria-label="Indicadores del grupo"></div>

          <div class="acciones-encabezado">
            <button type="button" class="btn btn-secundario" data-accion="cargar-ejemplo">
              Cargar grupo de prueba
            </button>
            <button
              id="dom-btn-reiniciar"
              type="button"
              class="btn btn-peligro"
              data-accion="solicitar-reinicio"
            >
              Reiniciar todo
            </button>
          </div>
        </div>
      </header>

      <!-- Confirmación segura de reinicio integrada -->
      <section
        id="dom-panel-confirmacion"
        class="panel-confirmacion oculto"
        role="alertdialog"
        aria-labelledby="titulo-confirmar-reinicio"
      >
        <p id="titulo-confirmar-reinicio" class="panel-confirmacion-texto">
          <strong>¿Deseas reiniciar todos los datos?</strong> Se borrarán la lista de estudiantes y el historial guardado en este dispositivo.
        </p>
        <div class="panel-confirmacion-botones">
          <button type="button" class="btn btn-peligro" data-accion="confirmar-reinicio">
            Sí, borrar todo y reiniciar
          </button>
          <button type="button" class="btn btn-secundario" data-accion="cancelar-reinicio">
            Cancelar
          </button>
        </div>
      </section>

      <!-- Banner de mensajes de éxito / advertencia / error -->
      <div id="dom-banner-mensaje" class="banner-mensaje info" role="status" aria-live="polite">
        <span id="dom-icono-banner" class="banner-icono"></span>
        <span id="dom-texto-banner"></span>
      </div>

      <!-- Rejilla principal (1 columna en celular, 2 en escritorio) -->
      <main class="rejilla-principal">
        <!-- Panel 1 y 2: Estudiantes y Configuración -->
        <section class="tarjeta-seccion" aria-labelledby="titulo-panel-estudiantes">
          <div class="encabezado-seccion">
            <h2 id="titulo-panel-estudiantes" class="titulo-seccion">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <line x1="19" y1="8" x2="19" y2="14"/>
                <line x1="22" y1="11" x2="16" y2="11"/>
              </svg>
              <span>1. Estudiantes</span>
            </h2>
            <span id="dom-meta-estudiantes" class="meta-seccion">0 registrados</span>
          </div>

          <form id="form-registro-estudiante" class="formulario-registro" novalidate>
            <label for="input-nombre-estudiante" class="etiqueta-campo">Nombre del estudiante</label>
            <div class="fila-entrada">
              <input
                id="input-nombre-estudiante"
                name="nombre"
                type="text"
                class="campo-texto"
                placeholder="Ej. Lucía Fernández"
                maxlength="${CONFIG.MAX_LONGITUD_NOMBRE}"
                autocomplete="off"
                autocapitalize="words"
                enterkeyhint="done"
              />
              <button type="submit" class="btn btn-turquesa">
                Agregar estudiante
              </button>
            </div>
          </form>

          <div id="dom-contenedor-lista-estudiantes"></div>

          <!-- Configuración de equipos y semilla -->
          <div class="bloque-configuracion">
            <div>
              <label class="etiqueta-campo">2. Cantidad de equipos</label>
              <div class="control-equipos" style="margin-top: 0.5rem;">
                <button
                  id="dom-btn-decrementar-equipos"
                  type="button"
                  class="btn btn-secundario"
                  data-accion="decrementar-equipos"
                  aria-label="Disminuir cantidad de equipos"
                >
                  −
                </button>
                <span id="dom-valor-equipos" class="valor-equipos" aria-live="polite">2</span>
                <button
                  id="dom-btn-incrementar-equipos"
                  type="button"
                  class="btn btn-secundario"
                  data-accion="incrementar-equipos"
                  aria-label="Aumentar cantidad de equipos"
                >
                  +
                </button>
              </div>
              <p id="dom-nota-equilibrio" class="nota-equilibrio" style="margin-top: 0.5rem;"></p>
            </div>

            <div class="fila-semilla">
              <label for="input-semilla" class="etiqueta-campo">
                Semilla numérica (reproducibilidad)
              </label>
              <div class="controles-semilla">
                <input
                  id="input-semilla"
                  type="number"
                  inputmode="numeric"
                  min="1"
                  step="1"
                  class="campo-numero"
                  value="${CONFIG.SEMILLA_POR_DEFECTO}"
                />
                <button
                  type="button"
                  class="btn btn-secundario"
                  data-accion="aplicar-semilla"
                >
                  Fijar
                </button>
              </div>
            </div>

            <div class="acciones-sorteo">
              <button
                id="dom-btn-ejecutar-sorteo"
                type="button"
                class="btn btn-verde btn-bloque"
                data-accion="ejecutar-sorteo"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
                  <polyline points="16 3 21 3 21 8"/>
                  <line x1="4" y1="20" x2="21" y2="3"/>
                  <polyline points="21 16 21 21 16 21"/>
                  <line x1="15" y1="15" x2="21" y2="21"/>
                  <line x1="4" y1="4" x2="9" y2="9"/>
                </svg>
                <span>Sortear Equipos Ahora</span>
              </button>

              <div id="dom-contenedor-btn-nuevo-sorteo"></div>
            </div>
          </div>
        </section>

        <!-- Columna derecha: Resultados en tarjetas e Historial -->
        <div class="columna-derecha">
          <section id="dom-seccion-resultados" class="tarjeta-seccion" aria-labelledby="titulo-panel-resultados">
            <div class="encabezado-seccion">
              <h2 id="titulo-panel-resultados" class="titulo-seccion">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <rect x="3" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="14" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/>
                </svg>
                <span>3. Equipos Conformados</span>
              </h2>
              <span id="dom-meta-resultados" class="meta-seccion">Sin sorteo activo</span>
            </div>

            <div id="dom-contenedor-resultados"></div>
          </section>

          <section class="tarjeta-seccion" aria-labelledby="titulo-panel-historial">
            <div class="encabezado-seccion">
              <h2 id="titulo-panel-historial" class="titulo-seccion">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                <span>4. Historial de Sorteos</span>
              </h2>
              <div id="dom-contenedor-accion-historial"></div>
            </div>

            <div id="dom-contenedor-historial"></div>
          </section>
        </div>
      </main>
    </div>
  `;

  refs = {
    resumenIndicadores: document.getElementById('dom-resumen-indicadores')!,
    btnReiniciarTodo: document.getElementById('dom-btn-reiniciar') as HTMLButtonElement,
    panelConfirmacion: document.getElementById('dom-panel-confirmacion')!,
    bannerMensaje: document.getElementById('dom-banner-mensaje')!,
    iconoBanner: document.getElementById('dom-icono-banner')!,
    textoBanner: document.getElementById('dom-texto-banner')!,
    metaTotalEstudiantes: document.getElementById('dom-meta-estudiantes')!,
    inputNombreEstudiante: document.getElementById('input-nombre-estudiante') as HTMLInputElement,
    contenedorListaEstudiantes: document.getElementById('dom-contenedor-lista-estudiantes')!,
    btnDecrementarEquipos: document.getElementById(
      'dom-btn-decrementar-equipos'
    ) as HTMLButtonElement,
    valorEquipos: document.getElementById('dom-valor-equipos')!,
    btnIncrementarEquipos: document.getElementById(
      'dom-btn-incrementar-equipos'
    ) as HTMLButtonElement,
    notaEquilibrio: document.getElementById('dom-nota-equilibrio')!,
    inputSemilla: document.getElementById('input-semilla') as HTMLInputElement,
    btnEjecutarSorteo: document.getElementById('dom-btn-ejecutar-sorteo') as HTMLButtonElement,
    contenedorBtnNuevoSorteo: document.getElementById('dom-contenedor-btn-nuevo-sorteo')!,
    seccionResultados: document.getElementById('dom-seccion-resultados')!,
    metaResultados: document.getElementById('dom-meta-resultados')!,
    contenedorResultados: document.getElementById('dom-contenedor-resultados')!,
    contenedorAccionHistorial: document.getElementById('dom-contenedor-accion-historial')!,
    contenedorHistorial: document.getElementById('dom-contenedor-historial')!,
  };
}

/**
 * Actualiza únicamente el encabezado de métricas, el panel de confirmación y el banner de mensajes.
 */
function actualizarIndicadoresYBanner(estado: EstadoSorteo): void {
  if (!refs) {
    return;
  }

  const totalEstudiantes = estado.estudiantes.length;

  refs.resumenIndicadores.innerHTML = `
    <span class="indicador-dato">Estudiantes: <strong>${totalEstudiantes}</strong></span>
    <span class="separador-punto" aria-hidden="true">·</span>
    <span class="indicador-dato">Equipos: <strong>${estado.cantidadEquipos}</strong></span>
    <span class="separador-punto" aria-hidden="true">·</span>
    <span class="indicador-dato">Historial: <strong>${estado.historial.length}</strong></span>
  `;

  refs.btnReiniciarTodo.disabled = totalEstudiantes === 0 && estado.historial.length === 0;
  refs.panelConfirmacion.classList.toggle('oculto', !mostrandoConfirmacionReinicio);

  refs.bannerMensaje.className = `banner-mensaje ${estado.tipoMensaje}`;
  refs.iconoBanner.innerHTML = obtenerIconoBanner(estado.tipoMensaje);
  refs.textoBanner.textContent = estado.ultimoMensaje;
}

/**
 * Actualiza únicamente la lista de estudiantes registrados.
 */
function actualizarListaEstudiantes(estado: EstadoSorteo): void {
  if (!refs) {
    return;
  }

  const total = estado.estudiantes.length;
  refs.metaTotalEstudiantes.textContent = `${total} ${total === 1 ? 'registrado' : 'registrados'}`;

  if (total === 0) {
    refs.contenedorListaEstudiantes.innerHTML = `
      <div class="estado-vacio">
        <p>Aún no hay estudiantes en la lista.</p>
        <p>Escribe un nombre arriba o toca <strong>Cargar grupo de prueba</strong>.</p>
      </div>
    `;
    return;
  }

  refs.contenedorListaEstudiantes.innerHTML = `
    <ul class="lista-estudiantes" aria-label="Lista de estudiantes registrados">
      ${estado.estudiantes
        .map((est, idx) => {
          if (idEstudianteEditando === est.id) {
            return `
              <li class="item-estudiante">
                <div class="fila-edicion">
                  <input
                    id="input-edicion-estudiante"
                    type="text"
                    class="campo-texto"
                    value="${escaparHtml(est.nombre)}"
                    maxlength="${CONFIG.MAX_LONGITUD_NOMBRE}"
                    autocapitalize="words"
                    enterkeyhint="done"
                    aria-label="Editar nombre de ${escaparHtml(est.nombre)}"
                  />
                  <div class="botones-edicion">
                    <button
                      type="button"
                      class="btn btn-verde"
                      data-accion="guardar-edicion"
                      data-id="${escaparHtml(est.id)}"
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      class="btn btn-secundario"
                      data-accion="cancelar-edicion"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </li>
            `;
          }

          return `
            <li class="item-estudiante">
              <div class="info-estudiante">
                <span class="numero-orden">${idx + 1}.</span>
                <span class="nombre-estudiante">${escaparHtml(est.nombre)}</span>
              </div>
              <div class="acciones-estudiante">
                <button
                  type="button"
                  class="btn-icono"
                  data-accion="iniciar-edicion"
                  data-id="${escaparHtml(est.id)}"
                  title="Corregir nombre de ${escaparHtml(est.nombre)}"
                  aria-label="Corregir nombre de ${escaparHtml(est.nombre)}"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path d="M12 20h9"/>
                    <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
                  </svg>
                </button>
                <button
                  type="button"
                  class="btn-icono eliminar"
                  data-accion="eliminar-estudiante"
                  data-id="${escaparHtml(est.id)}"
                  title="Eliminar a ${escaparHtml(est.nombre)}"
                  aria-label="Eliminar a ${escaparHtml(est.nombre)}"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                  </svg>
                </button>
              </div>
            </li>
          `;
        })
        .join('')}
    </ul>
  `;

  if (idEstudianteEditando) {
    const inputEdicion = document.querySelector<HTMLInputElement>('#input-edicion-estudiante');
    if (inputEdicion) {
      inputEdicion.focus();
      inputEdicion.select();
    }
  }
}

/**
 * Actualiza los botones y estado de configuración de equipos y semilla.
 */
function actualizarControlesSorteo(estado: EstadoSorteo): void {
  if (!refs) {
    return;
  }

  const totalEstudiantes = estado.estudiantes.length;
  const puedeSortear =
    !sorteoEnCurso &&
    totalEstudiantes >= CONFIG.MIN_ESTUDIANTES &&
    estado.cantidadEquipos >= CONFIG.MIN_EQUIPOS &&
    estado.cantidadEquipos <= totalEstudiantes;

  refs.btnDecrementarEquipos.disabled = estado.cantidadEquipos <= CONFIG.MIN_EQUIPOS;
  refs.valorEquipos.textContent = String(estado.cantidadEquipos);
  refs.btnIncrementarEquipos.disabled =
    totalEstudiantes >= CONFIG.MIN_ESTUDIANTES && estado.cantidadEquipos >= totalEstudiantes;

  refs.notaEquilibrio.textContent = describirEquilibrioPrevio(
    totalEstudiantes,
    estado.cantidadEquipos
  );

  if (document.activeElement !== refs.inputSemilla) {
    refs.inputSemilla.value = String(estado.semilla);
  }

  refs.btnEjecutarSorteo.disabled = !puedeSortear;
  refs.contenedorBtnNuevoSorteo.innerHTML = estado.sorteoActual
    ? `
      <button
        type="button"
        class="btn btn-violeta btn-bloque"
        data-accion="preparar-nuevo-sorteo"
      >
        Preparar nuevo sorteo
      </button>
    `
    : '';
}

/**
 * Actualiza únicamente la zona de tarjetas de equipos conformados.
 */
function actualizarResultados(estado: EstadoSorteo): void {
  if (!refs) {
    return;
  }

  const sorteo: ResultadoSorteo | null = estado.sorteoActual;
  refs.metaResultados.textContent = sorteo
    ? `${sorteo.cantidadEquipos} equipos activos`
    : 'Sin sorteo en pantalla';

  if (!sorteo) {
    refs.contenedorResultados.innerHTML = `
      <div class="estado-vacio">
        <p>Aún no hay un sorteo activo en pantalla.</p>
        <p>Registra a tus estudiantes, elige la cantidad de equipos y toca <strong>Sortear Equipos Ahora</strong>.</p>
      </div>
    `;
    return;
  }

  const avisoRepeticiones = sorteo.evitoTodasLasRepeticiones
    ? `<p class="aviso-sin-repeticiones">✓ 0 parejas repetidas respecto al sorteo inmediato anterior (${sorteo.intentosRealizados} ${
        sorteo.intentosRealizados === 1 ? 'intento evaluado' : 'intentos evaluados'
      }).</p>`
    : `<div class="aviso-repeticiones" role="status">
         <strong>Transparencia matemática:</strong> Se evaluaron ${sorteo.intentosRealizados} combinaciones posibles y se eligió el reparto más justo. Por límite combinatorio fue inevitable repetir <strong>${sorteo.parejasRepetidas}</strong> ${
        sorteo.parejasRepetidas === 1 ? 'pareja' : 'parejas'
      } del sorteo anterior.
       </div>`;

  const tarjetasEquipos = sorteo.equipos
    .map(
      (equipo) => `
      <article class="tarjeta-equipo">
        <header class="cabecera-equipo">
          <h3 class="nombre-equipo">${escaparHtml(equipo.nombre)}</h3>
          <span class="conteo-equipo">${equipo.integrantes.length} ${
        equipo.integrantes.length === 1 ? 'estudiante' : 'estudiantes'
      }</span>
        </header>
        <ul class="lista-integrantes">
          ${equipo.integrantes
            .map(
              (est) => `
            <li class="integrante-item">
              <span class="punto-integrante" aria-hidden="true"></span>
              <span>${escaparHtml(est.nombre)}</span>
            </li>
          `
            )
            .join('')}
        </ul>
      </article>
    `
    )
    .join('');

  refs.contenedorResultados.innerHTML = `
    <div class="resumen-sorteo-actual">
      <div class="resumen-indicadores">
        <span class="indicador-dato">Semilla: <strong>${sorteo.semillaUtilizada}</strong></span>
        <span class="separador-punto" aria-hidden="true">·</span>
        <span class="indicador-dato">Participantes: <strong>${sorteo.cantidadEstudiantes}</strong></span>
        <span class="separador-punto" aria-hidden="true">·</span>
        <span class="indicador-dato">Equipos: <strong>${sorteo.cantidadEquipos}</strong></span>
        <span class="separador-punto" aria-hidden="true">·</span>
        <span class="indicador-dato">Hora: <strong>${formatearFechaCorta(sorteo.fechaIso)}</strong></span>
      </div>
      ${avisoRepeticiones}
    </div>
    <div class="rejilla-equipos">
      ${tarjetasEquipos}
    </div>
  `;
}

/**
 * Actualiza de forma eficiente la lista del historial limitando nodos en pantallas móviles si hay muchos registros.
 */
function actualizarHistorial(estado: EstadoSorteo): void {
  if (!refs) {
    return;
  }

  const totalHistorial = estado.historial.length;

  refs.contenedorAccionHistorial.innerHTML =
    totalHistorial > 0
      ? `
      <button
        type="button"
        class="btn btn-secundario"
        data-accion="limpiar-historial"
      >
        Limpiar historial
      </button>
    `
      : `<span class="meta-seccion">0 guardados</span>`;

  if (totalHistorial === 0) {
    refs.contenedorHistorial.innerHTML = `
      <div class="estado-vacio">
        <p>Todavía no se han registrado sorteos en el historial.</p>
      </div>
    `;
    return;
  }

  const elementosVisibles = mostrarHistorialCompleto
    ? estado.historial
    : estado.historial.slice(0, LIMITE_HISTORIAL_COMPACTO);

  const botonExpandir =
    totalHistorial > LIMITE_HISTORIAL_COMPACTO
      ? `
      <div style="margin-top: 0.75rem;">
        <button
          type="button"
          class="btn btn-secundario btn-bloque"
          data-accion="alternar-historial-completo"
        >
          ${
            mostrarHistorialCompleto
              ? 'Mostrar solo los más recientes'
              : `Ver los ${totalHistorial} sorteos del historial`
          }
        </button>
      </div>
    `
      : '';

  refs.contenedorHistorial.innerHTML = `
    <ul class="lista-historial">
      ${elementosVisibles
        .map((item, indice) => {
          const numeroSorteo = totalHistorial - indice;
          const esActivo = estado.sorteoActual?.id === item.id;
          return `
            <li class="item-historial ${esActivo ? 'activo' : ''}">
              <div class="info-historial">
                <span class="titulo-item-historial">Sorteo #${numeroSorteo}</span>
                <span class="separador-punto" aria-hidden="true">·</span>
                <span>${item.cantidadEquipos} equipos (${item.cantidadEstudiantes} est.)</span>
                <span class="separador-punto" aria-hidden="true">·</span>
                <span>Semilla ${item.semillaUtilizada}</span>
                <span class="separador-punto" aria-hidden="true">·</span>
                <span>${
                  item.parejasRepetidas === 0
                    ? '0 repetidas'
                    : `${item.parejasRepetidas} ${
                        item.parejasRepetidas === 1 ? 'repetida' : 'repetidas'
                      }`
                }</span>
              </div>
              <button
                type="button"
                class="btn btn-secundario"
                data-accion="ver-historial"
                data-id="${escaparHtml(item.id)}"
                ${esActivo ? 'disabled' : ''}
              >
                ${esActivo ? 'En pantalla' : 'Consultar sorteo'}
              </button>
            </li>
          `;
        })
        .join('')}
    </ul>
    ${botonExpandir}
  `;
}

/**
 * Sincroniza todas las secciones dinámicas del DOM a partir del estado actual.
 */
function sincronizarVistaCompleta(): void {
  const estado = obtenerEstado();
  actualizarIndicadoresYBanner(estado);
  actualizarListaEstudiantes(estado);
  actualizarControlesSorteo(estado);
  actualizarResultados(estado);
  actualizarHistorial(estado);
}

/**
 * En pantallas móviles de una sola columna (< 960px), desplaza suavemente la vista hacia los equipos generados.
 */
function desplazarHaciaResultadosEnMovil(): void {
  if (!refs || window.innerWidth >= 960) {
    return;
  }
  const prefiereReducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  refs.seccionResultados.scrollIntoView({
    behavior: prefiereReducirMovimiento ? 'auto' : 'smooth',
    block: 'start',
  });
}

/**
 * Configura la delegación de eventos una única vez sobre el contenedor raíz.
 */
function inicializarEventos(): void {
  const contenedor = document.querySelector<HTMLDivElement>('#app');
  if (!contenedor) {
    return;
  }

  // Registro de estudiante manteniendo el teclado virtual activo en móviles
  contenedor.addEventListener('submit', (evento) => {
    const formulario = (evento.target as HTMLElement).closest('#form-registro-estudiante');
    if (!formulario || !refs) {
      return;
    }
    evento.preventDefault();

    const valor = refs.inputNombreEstudiante.value;
    const exito = registrarEstudiante(valor);

    if (exito) {
      refs.inputNombreEstudiante.value = '';
      guardarEnAlmacenamientoLocal();
    }

    const estado = obtenerEstado();
    actualizarIndicadoresYBanner(estado);
    actualizarListaEstudiantes(estado);
    actualizarControlesSorteo(estado);
    refs.inputNombreEstudiante.focus();
  });

  // Delegación de todos los botones interactivos
  contenedor.addEventListener('click', (evento) => {
    const boton = (evento.target as HTMLElement).closest<HTMLButtonElement>('[data-accion]');
    if (!boton || boton.disabled || !refs) {
      return;
    }

    const accion = boton.dataset.accion;
    const id = boton.dataset.id ?? '';

    switch (accion) {
      case 'iniciar-edicion': {
        idEstudianteEditando = id;
        actualizarListaEstudiantes(obtenerEstado());
        break;
      }

      case 'cancelar-edicion': {
        idEstudianteEditando = null;
        actualizarListaEstudiantes(obtenerEstado());
        break;
      }

      case 'guardar-edicion': {
        const inputEdicion = document.querySelector<HTMLInputElement>('#input-edicion-estudiante');
        const nuevoNombre = inputEdicion ? inputEdicion.value : '';
        if (modificarEstudiante(id, nuevoNombre)) {
          idEstudianteEditando = null;
          guardarEnAlmacenamientoLocal();
        }
        const estado = obtenerEstado();
        actualizarIndicadoresYBanner(estado);
        actualizarListaEstudiantes(estado);
        break;
      }

      case 'eliminar-estudiante': {
        if (idEstudianteEditando === id) {
          idEstudianteEditando = null;
        }
        if (eliminarEstudiante(id)) {
          guardarEnAlmacenamientoLocal();
        }
        const estado = obtenerEstado();
        actualizarIndicadoresYBanner(estado);
        actualizarListaEstudiantes(estado);
        actualizarControlesSorteo(estado);
        break;
      }

      case 'decrementar-equipos': {
        const actual = obtenerEstado().cantidadEquipos;
        if (configurarCantidadEquipos(actual - 1)) {
          guardarEnAlmacenamientoLocal();
        }
        const estado = obtenerEstado();
        actualizarIndicadoresYBanner(estado);
        actualizarControlesSorteo(estado);
        break;
      }

      case 'incrementar-equipos': {
        const actual = obtenerEstado().cantidadEquipos;
        if (configurarCantidadEquipos(actual + 1)) {
          guardarEnAlmacenamientoLocal();
        }
        const estado = obtenerEstado();
        actualizarIndicadoresYBanner(estado);
        actualizarControlesSorteo(estado);
        break;
      }

      case 'aplicar-semilla': {
        const valorSemilla = Number(refs.inputSemilla.value);
        if (configurarSemilla(valorSemilla)) {
          guardarEnAlmacenamientoLocal();
        }
        const estado = obtenerEstado();
        actualizarIndicadoresYBanner(estado);
        actualizarControlesSorteo(estado);
        break;
      }

      case 'ejecutar-sorteo': {
        if (sorteoEnCurso) {
          return;
        }
        sorteoEnCurso = true;
        refs.btnEjecutarSorteo.disabled = true;

        const valorSemilla = Number(refs.inputSemilla.value);
        const semillaOpcional = Number.isFinite(valorSemilla) ? valorSemilla : undefined;

        // Permite al navegador móvil pintar el estado activo del botón antes de calcular el sorteo
        window.requestAnimationFrame(() => {
          const exito = realizarSorteo(semillaOpcional);
          sorteoEnCurso = false;

          if (exito) {
            guardarEnAlmacenamientoLocal();
          }

          const estado = obtenerEstado();
          actualizarIndicadoresYBanner(estado);
          actualizarControlesSorteo(estado);
          actualizarResultados(estado);
          actualizarHistorial(estado);

          if (exito) {
            desplazarHaciaResultadosEnMovil();
          }
        });
        break;
      }

      case 'preparar-nuevo-sorteo': {
        prepararNuevoSorteo();
        const estado = obtenerEstado();
        actualizarIndicadoresYBanner(estado);
        actualizarControlesSorteo(estado);
        actualizarResultados(estado);
        actualizarHistorial(estado);
        break;
      }

      case 'ver-historial': {
        if (seleccionarSorteoDeHistorial(id)) {
          const estado = obtenerEstado();
          actualizarIndicadoresYBanner(estado);
          actualizarControlesSorteo(estado);
          actualizarResultados(estado);
          actualizarHistorial(estado);
          desplazarHaciaResultadosEnMovil();
        }
        break;
      }

      case 'alternar-historial-completo': {
        mostrarHistorialCompleto = !mostrarHistorialCompleto;
        actualizarHistorial(obtenerEstado());
        break;
      }

      case 'limpiar-historial': {
        if (limpiarHistorial()) {
          mostrarHistorialCompleto = false;
          guardarEnAlmacenamientoLocal();
        }
        const estado = obtenerEstado();
        actualizarIndicadoresYBanner(estado);
        actualizarControlesSorteo(estado);
        actualizarResultados(estado);
        actualizarHistorial(estado);
        break;
      }

      case 'cargar-ejemplo': {
        for (const nombre of ESTUDIANTES_EJEMPLO) {
          registrarEstudiante(nombre);
        }
        configurarCantidadEquipos(2);
        guardarEnAlmacenamientoLocal();
        sincronizarVistaCompleta();
        break;
      }

      case 'solicitar-reinicio': {
        mostrandoConfirmacionReinicio = true;
        actualizarIndicadoresYBanner(obtenerEstado());
        break;
      }

      case 'cancelar-reinicio': {
        mostrandoConfirmacionReinicio = false;
        actualizarIndicadoresYBanner(obtenerEstado());
        break;
      }

      case 'confirmar-reinicio': {
        mostrandoConfirmacionReinicio = false;
        idEstudianteEditando = null;
        mostrarHistorialCompleto = false;
        reiniciarAplicacion();
        try {
          window.localStorage.removeItem(CLAVE_STORAGE);
        } catch {
          // Ignorar restricciones de almacenamiento
        }
        sincronizarVistaCompleta();
        break;
      }
    }
  });

  // Teclado para guardar o cancelar edición en línea
  contenedor.addEventListener('keydown', (evento) => {
    const objetivo = evento.target as HTMLElement;
    if (objetivo.id !== 'input-edicion-estudiante' || !idEstudianteEditando) {
      return;
    }

    if (evento.key === 'Enter') {
      evento.preventDefault();
      const inputEdicion = objetivo as HTMLInputElement;
      if (modificarEstudiante(idEstudianteEditando, inputEdicion.value)) {
        idEstudianteEditando = null;
        guardarEnAlmacenamientoLocal();
      }
      const estado = obtenerEstado();
      actualizarIndicadoresYBanner(estado);
      actualizarListaEstudiantes(estado);
    } else if (evento.key === 'Escape') {
      evento.preventDefault();
      idEstudianteEditando = null;
      actualizarListaEstudiantes(obtenerEstado());
    }
  });
}

// Arranque de la aplicación
restaurarDeAlmacenamientoLocal();
montarEstructuraBase();
inicializarEventos();
sincronizarVistaCompleta();
