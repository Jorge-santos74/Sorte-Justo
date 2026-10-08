/**
 * Interfaz de usuario principal para SORTEO JUSTO (Fase 4)
 * Consume únicamente las funciones y el estado exportados por src/logica.ts.
 * Gestiona eventos del DOM, persistencia en localStorage y renderizado eficiente.
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
} from './logica';

const CLAVE_STORAGE = 'sorteo_justo_datos_v1';

/** Identificador del estudiante que se encuentra actualmente en modo edición en línea */
let idEstudianteEditando: string | null = null;

/** Indica si se muestra el panel de confirmación para reiniciar todos los datos */
let mostrandoConfirmacionReinicio = false;

/** Lista de ejemplo para facilitar pruebas rápidas en el aula */
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

/**
 * Escapa caracteres especiales para prevenir inyección HTML al mostrar nombres.
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
 * Formatea una fecha ISO en formato legible en español.
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
 * Guarda el estado actual en localStorage de manera segura.
 */
function guardarEnAlmacenamientoLocal(): void {
  try {
    const datos = exportarDatosParaGuardar();
    window.localStorage.setItem(CLAVE_STORAGE, JSON.stringify(datos));
  } catch {
    // En modo privado restringido o memoria llena, la aplicación continúa en memoria sin bloquearse
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
    // Si el almacenamiento local está corrupto, se conserva el estado limpio inicial
  }
}

/**
 * Calcula una descripción clara de cómo quedarán repartidos los equipos antes de sortear.
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
 * Genera el bloque HTML para mostrar el sorteo activo o el estado vacío.
 */
function renderizarZonaResultados(estado: EstadoSorteo): string {
  const sorteo: ResultadoSorteo | null = estado.sorteoActual;

  if (!sorteo) {
    return `
      <div class="estado-vacio">
        <p>Aún no hay un sorteo activo en pantalla.</p>
        <p>Registra a tus estudiantes, elige el número de equipos y presiona <strong> Sortear Equipos Ahora</strong>.</p>
      </div>
    `;
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
      (equipo, idx) => `
      <article class="tarjeta-equipo" style="animation-delay: ${Math.min(idx * 45, 250)}ms">
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

  return `
    <div class="resumen-sorteo-actual">
      <div class="resumen-indicadores">
        <span class="indicador-dato">Semilla utilizada: <strong>${sorteo.semillaUtilizada}</strong></span>
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
 * Genera el bloque HTML para la lista del historial de sorteos realizados.
 */
function renderizarZonaHistorial(estado: EstadoSorteo): string {
  if (estado.historial.length === 0) {
    return `
      <div class="estado-vacio">
        <p>Todavía no se han registrado sorteos en el historial.</p>
      </div>
    `;
  }

  return `
    <ul class="lista-historial">
      ${estado.historial
        .map((item, indice) => {
          const numeroSorteo = estado.historial.length - indice;
          const esActivo = estado.sorteoActual?.id === item.id;
          return `
            <li class="item-historial ${esActivo ? 'activo' : ''}">
              <div class="info-historial">
                <span class="titulo-item-historial">Sorteo #${numeroSorteo}</span>
                <span class="separador-punto" aria-hidden="true">·</span>
                <span>${item.cantidadEquipos} equipos (${item.cantidadEstudiantes} estudiantes)</span>
                <span class="separador-punto" aria-hidden="true">·</span>
                <span>Semilla ${item.semillaUtilizada}</span>
                <span class="separador-punto" aria-hidden="true">·</span>
                <span>${
                  item.parejasRepetidas === 0
                    ? 'Sin parejas repetidas'
                    : `${item.parejasRepetidas} ${
                        item.parejasRepetidas === 1 ? 'pareja repetida' : 'parejas repetidas'
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
  `;
}

/**
 * Renderiza toda la interfaz dentro de #app manteniendo el foco de manera predecible.
 */
function renderizarAplicacion(focoEnCampo?: 'nuevo-estudiante' | 'edicion'): void {
  const contenedor = document.querySelector<HTMLDivElement>('#app');
  if (!contenedor) {
    return;
  }

  const estado = obtenerEstado();
  const totalEstudiantes = estado.estudiantes.length;
  const puedeSortear =
    totalEstudiantes >= CONFIG.MIN_ESTUDIANTES &&
    estado.cantidadEquipos >= CONFIG.MIN_EQUIPOS &&
    estado.cantidadEquipos <= totalEstudiantes;

  const iconoBanner =
    estado.tipoMensaje === 'exito'
      ? `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>`
      : estado.tipoMensaje === 'error'
      ? `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>`
      : estado.tipoMensaje === 'advertencia'
      ? `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>`
      : `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>`;

  contenedor.innerHTML = `
    <div class="contenedor-app">
      <!-- Encabezado principal -->
      <header class="encabezado">
        <div>
          <div class="encabezado-identidad">
            <div class="marca-icono" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                <path d="M16 3.13a4 4 0 010 7.75"/>
              </svg>
            </div>
            <div>
              <h1 class="titulo-app">SORTEO JUSTO</h1>
              <p class="subtitulo-app">Organizador inteligente de equipos equilibrados sin repetir compañeros</p>
            </div>
          </div>

          <div class="barra-metricas">
            <div class="resumen-indicadores" aria-label="Indicadores del grupo">
              <span class="indicador-dato">Estudiantes: <strong>${totalEstudiantes}</strong></span>
              <span class="separador-punto" aria-hidden="true">·</span>
              <span class="indicador-dato">Equipos: <strong>${estado.cantidadEquipos}</strong></span>
              <span class="separador-punto" aria-hidden="true">·</span>
              <span class="indicador-dato">Sorteos en historial: <strong>${estado.historial.length}</strong></span>
            </div>

            <div class="acciones-encabezado">
              <button type="button" class="btn btn-secundario" data-accion="cargar-ejemplo">
                Cargar grupo de prueba
              </button>
              <button
                type="button"
                class="btn btn-peligro"
                data-accion="solicitar-reinicio"
                ${totalEstudiantes === 0 && estado.historial.length === 0 ? 'disabled' : ''}
              >
                Reiniciar todo
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Confirmación segura de reinicio (cuando el usuario presiona Reiniciar todo) -->
      ${
        mostrandoConfirmacionReinicio
          ? `
        <section class="panel-confirmacion" role="alertdialog" aria-labelledby="titulo-confirmar-reinicio">
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
      `
          : ''
      }

      <!-- Banner de retroalimentación clara -->
      <div class="banner-mensaje ${estado.tipoMensaje}" role="status" aria-live="polite">
        <span class="banner-icono">${iconoBanner}</span>
        <span>${escaparHtml(estado.ultimoMensaje)}</span>
      </div>

      <!-- Rejilla principal de dos columnas en escritorio y una en móvil -->
      <main class="rejilla-principal">
        <!-- Columna izquierda: Registro de estudiantes y configuración -->
        <section class="tarjeta-seccion" aria-labelledby="titulo-panel-estudiantes">
          <div class="encabezado-seccion">
            <h2 id="titulo-panel-estudiantes" class="titulo-seccion">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <line x1="19" y1="8" x2="19" y2="14"/>
                <line x1="22" y1="11" x2="16" y2="11"/>
              </svg>
              <span>1. Estudiantes</span>
            </h2>
            <span class="meta-seccion">${totalEstudiantes} registrados</span>
          </div>

          <form id="form-registro-estudiante" class="formulario-registro" novalidate>
            <label for="input-nombre-estudiante" class="etiqueta-campo">Nombre completo del estudiante</label>
            <div class="fila-entrada">
              <input
                id="input-nombre-estudiante"
                name="nombre"
                type="text"
                class="campo-texto"
                placeholder="Ej. Lucía Fernández"
                maxlength="${CONFIG.MAX_LONGITUD_NOMBRE}"
                autocomplete="off"
              />
              <button type="submit" class="btn btn-turquesa">
                Agregar
              </button>
            </div>
          </form>

          ${
            totalEstudiantes === 0
              ? `
            <div class="estado-vacio">
              <p>Aún no hay estudiantes en la lista.</p>
              <p>Escribe un nombre arriba o usa el botón <strong>Cargar grupo de prueba</strong>.</p>
            </div>
          `
              : `
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
                            aria-label="Editar nombre de ${escaparHtml(est.nombre)}"
                          />
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
          `
          }

          <!-- Bloque de configuración de equipos y semilla -->
          <div class="bloque-configuracion">
            <div>
              <label class="etiqueta-campo">2. Cantidad de equipos a formar</label>
              <div class="control-equipos" style="margin-top: 0.5rem;">
                <button
                  type="button"
                  class="btn btn-secundario"
                  data-accion="decrementar-equipos"
                  aria-label="Disminuir cantidad de equipos"
                  ${estado.cantidadEquipos <= CONFIG.MIN_EQUIPOS ? 'disabled' : ''}
                >
                  −
                </button>
                <span class="valor-equipos" aria-live="polite">${estado.cantidadEquipos}</span>
                <button
                  type="button"
                  class="btn btn-secundario"
                  data-accion="incrementar-equipos"
                  aria-label="Aumentar cantidad de equipos"
                  ${
                    totalEstudiantes >= CONFIG.MIN_ESTUDIANTES &&
                    estado.cantidadEquipos >= totalEstudiantes
                      ? 'disabled'
                      : ''
                  }
                >
                  +
                </button>
              </div>
              <p class="nota-equilibrio" style="margin-top: 0.5rem;">
                ${describirEquilibrioPrevio(totalEstudiantes, estado.cantidadEquipos)}
              </p>
            </div>

            <div class="fila-semilla">
              <label for="input-semilla" class="etiqueta-campo">
                Semilla pseudoaleatoria (reproducibilidad)
              </label>
              <div class="controles-semilla">
                <input
                  id="input-semilla"
                  type="number"
                  min="1"
                  step="1"
                  class="campo-numero"
                  value="${estado.semilla}"
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
                type="button"
                class="btn btn-verde btn-bloque"
                data-accion="ejecutar-sorteo"
                ${!puedeSortear ? 'disabled' : ''}
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

              ${
                estado.sorteoActual
                  ? `
                <button
                  type="button"
                  class="btn btn-violeta btn-bloque"
                  data-accion="preparar-nuevo-sorteo"
                >
                  Preparar nuevo sorteo
                </button>
              `
                  : ''
              }
            </div>
          </div>
        </section>

        <!-- Columna derecha: Resultados en tarjetas e Historial -->
        <div>
          <section class="tarjeta-seccion" aria-labelledby="titulo-panel-resultados">
            <div class="encabezado-seccion">
              <h2 id="titulo-panel-resultados" class="titulo-seccion">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <rect x="3" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="14" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/>
                </svg>
                <span>3. Equipos Conformados</span>
              </h2>
              <span class="meta-seccion">
                ${
                  estado.sorteoActual
                    ? `${estado.sorteoActual.cantidadEquipos} equipos activos`
                    : 'Sin sorteo en pantalla'
                }
              </span>
            </div>

            ${renderizarZonaResultados(estado)}
          </section>

          <section class="tarjeta-seccion seccion-historial" aria-labelledby="titulo-panel-historial">
            <div class="encabezado-seccion">
              <h2 id="titulo-panel-historial" class="titulo-seccion">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                <span>4. Historial de Sorteos</span>
              </h2>
              ${
                estado.historial.length > 0
                  ? `
                <button
                  type="button"
                  class="btn btn-secundario"
                  data-accion="limpiar-historial"
                >
                  Limpiar historial
                </button>
              `
                  : `<span class="meta-seccion">0 guardados</span>`
              }
            </div>

            ${renderizarZonaHistorial(estado)}
          </section>
        </div>
      </main>
    </div>
  `;

  if (focoEnCampo === 'nuevo-estudiante') {
    const inputNuevo = document.querySelector<HTMLInputElement>('#input-nombre-estudiante');
    inputNuevo?.focus();
  } else if (focoEnCampo === 'edicion') {
    const inputEdicion = document.querySelector<HTMLInputElement>('#input-edicion-estudiante');
    if (inputEdicion) {
      inputEdicion.focus();
      inputEdicion.select();
    }
  }
}

/**
 * Configura la delegación de eventos sobre el contenedor #app una sola vez para máximo rendimiento.
 */
function inicializarEventos(): void {
  const contenedor = document.querySelector<HTMLDivElement>('#app');
  if (!contenedor) {
    return;
  }

  // Envío del formulario para agregar estudiante
  contenedor.addEventListener('submit', (evento) => {
    const formulario = (evento.target as HTMLElement).closest('#form-registro-estudiante');
    if (!formulario) {
      return;
    }
    evento.preventDefault();

    const inputNombre = document.querySelector<HTMLInputElement>('#input-nombre-estudiante');
    const valor = inputNombre ? inputNombre.value : '';

    const exito = registrarEstudiante(valor);
    if (exito) {
      guardarEnAlmacenamientoLocal();
    }
    renderizarAplicacion('nuevo-estudiante');
  });

  // Delegación de clics para todos los botones con atributo data-accion
  contenedor.addEventListener('click', (evento) => {
    const boton = (evento.target as HTMLElement).closest<HTMLButtonElement>('[data-accion]');
    if (!boton || boton.disabled) {
      return;
    }

    const accion = boton.dataset.accion;
    const id = boton.dataset.id ?? '';

    switch (accion) {
      case 'iniciar-edicion': {
        idEstudianteEditando = id;
        renderizarAplicacion('edicion');
        break;
      }

      case 'cancelar-edicion': {
        idEstudianteEditando = null;
        renderizarAplicacion();
        break;
      }

      case 'guardar-edicion': {
        const inputEdicion = document.querySelector<HTMLInputElement>('#input-edicion-estudiante');
        const nuevoNombre = inputEdicion ? inputEdicion.value : '';
        if (modificarEstudiante(id, nuevoNombre)) {
          idEstudianteEditando = null;
          guardarEnAlmacenamientoLocal();
          renderizarAplicacion();
        } else {
          renderizarAplicacion('edicion');
        }
        break;
      }

      case 'eliminar-estudiante': {
        if (idEstudianteEditando === id) {
          idEstudianteEditando = null;
        }
        if (eliminarEstudiante(id)) {
          guardarEnAlmacenamientoLocal();
        }
        renderizarAplicacion();
        break;
      }

      case 'decrementar-equipos': {
        const actual = obtenerEstado().cantidadEquipos;
        if (configurarCantidadEquipos(actual - 1)) {
          guardarEnAlmacenamientoLocal();
        }
        renderizarAplicacion();
        break;
      }

      case 'incrementar-equipos': {
        const actual = obtenerEstado().cantidadEquipos;
        if (configurarCantidadEquipos(actual + 1)) {
          guardarEnAlmacenamientoLocal();
        }
        renderizarAplicacion();
        break;
      }

      case 'aplicar-semilla': {
        const inputSemilla = document.querySelector<HTMLInputElement>('#input-semilla');
        const valorSemilla = inputSemilla ? Number(inputSemilla.value) : NaN;
        if (configurarSemilla(valorSemilla)) {
          guardarEnAlmacenamientoLocal();
        }
        renderizarAplicacion();
        break;
      }

      case 'ejecutar-sorteo': {
        const inputSemilla = document.querySelector<HTMLInputElement>('#input-semilla');
        const valorSemilla = inputSemilla ? Number(inputSemilla.value) : undefined;
        if (realizarSorteo(valorSemilla)) {
          guardarEnAlmacenamientoLocal();
        }
        renderizarAplicacion();
        break;
      }

      case 'preparar-nuevo-sorteo': {
        prepararNuevoSorteo();
        renderizarAplicacion();
        break;
      }

      case 'ver-historial': {
        seleccionarSorteoDeHistorial(id);
        renderizarAplicacion();
        break;
      }

      case 'limpiar-historial': {
        if (limpiarHistorial()) {
          guardarEnAlmacenamientoLocal();
        }
        renderizarAplicacion();
        break;
      }

      case 'cargar-ejemplo': {
        for (const nombre of ESTUDIANTES_EJEMPLO) {
          registrarEstudiante(nombre);
        }
        configurarCantidadEquipos(2);
        guardarEnAlmacenamientoLocal();
        renderizarAplicacion();
        break;
      }

      case 'solicitar-reinicio': {
        mostrandoConfirmacionReinicio = true;
        renderizarAplicacion();
        break;
      }

      case 'cancelar-reinicio': {
        mostrandoConfirmacionReinicio = false;
        renderizarAplicacion();
        break;
      }

      case 'confirmar-reinicio': {
        mostrandoConfirmacionReinicio = false;
        idEstudianteEditando = null;
        reiniciarAplicacion();
        try {
          window.localStorage.removeItem(CLAVE_STORAGE);
        } catch {
          // Ignorar errores de acceso a almacenamiento restringido
        }
        renderizarAplicacion('nuevo-estudiante');
        break;
      }
    }
  });

  // Soporte de teclado para guardar edición con Enter o cancelar con Escape
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
        renderizarAplicacion();
      } else {
        renderizarAplicacion('edicion');
      }
    } else if (evento.key === 'Escape') {
      evento.preventDefault();
      idEstudianteEditando = null;
      renderizarAplicacion();
    }
  });
}

// Inicialización al cargar el documento
restaurarDeAlmacenamientoLocal();
inicializarEventos();
renderizarAplicacion();
