import { describe, it, expect, beforeEach } from 'vitest';
import {
  CONFIG,
  obtenerEstado,
  reiniciarEstado,
  registrarEstudiante,
  modificarEstudiante,
  eliminarEstudiante,
  configurarCantidadEquipos,
  configurarSemilla,
  realizarSorteo,
  seleccionarSorteoDeHistorial,
  prepararNuevoSorteo,
  limpiarHistorial,
  exportarDatosParaGuardar,
  cargarDatosGuardados,
} from '../src/logica';

describe('Suite de pruebas automatizadas — SORTEO JUSTO (Fase 3)', () => {
  beforeEach(() => {
    reiniciarEstado();
  });

  it('Prueba 1: Comprueba el estado inicial correcto y los parámetros de CONFIG', () => {
    const estado = obtenerEstado();

    expect(CONFIG.MIN_ESTUDIANTES).toBe(2);
    expect(CONFIG.MIN_EQUIPOS).toBe(2);
    expect(CONFIG.MAX_INTENTOS_SORTEO).toBeGreaterThan(0);

    expect(estado.estudiantes).toEqual([]);
    expect(estado.cantidadEquipos).toBe(CONFIG.MIN_EQUIPOS);
    expect(estado.semilla).toBe(CONFIG.SEMILLA_POR_DEFECTO);
    expect(estado.sorteoActual).toBeNull();
    expect(estado.historial).toEqual([]);
    expect(estado.tipoMensaje).toBe('info');
  });

  it('Prueba 2: Valida el registro, edición y eliminación de estudiantes evitando vacíos y duplicados', () => {
    // Rechazar nombres vacíos o de solo espacios
    expect(registrarEstudiante('')).toBe(false);
    expect(registrarEstudiante('   ')).toBe(false);
    expect(obtenerEstado().tipoMensaje).toBe('error');
    expect(obtenerEstado().estudiantes).toHaveLength(0);

    // Registrar estudiantes válidos
    expect(registrarEstudiante('  Ana María  ')).toBe(true);
    expect(registrarEstudiante('Carlos Pérez')).toBe(true);
    expect(obtenerEstado().estudiantes).toHaveLength(2);
    expect(obtenerEstado().estudiantes[0].nombre).toBe('Ana María');

    // Rechazar duplicados exactos, con distinta capitalización o sin tilde
    expect(registrarEstudiante('Ana María')).toBe(false);
    expect(registrarEstudiante('ana maria')).toBe(false);
    expect(registrarEstudiante('CARLOS PEREZ')).toBe(false);
    expect(obtenerEstado().estudiantes).toHaveLength(2);

    // Modificar nombre de un estudiante y validar restricciones de edición
    const idAna = obtenerEstado().estudiantes[0].id;
    expect(modificarEstudiante(idAna, '')).toBe(false);
    expect(modificarEstudiante(idAna, 'carlos perez')).toBe(false);
    expect(modificarEstudiante(idAna, 'Ana Sofía')).toBe(true);
    expect(obtenerEstado().estudiantes[0].nombre).toBe('Ana Sofía');

    // Eliminar estudiante existente e inexistente
    expect(eliminarEstudiante('id-inexistente')).toBe(false);
    expect(eliminarEstudiante(idAna)).toBe(true);
    expect(obtenerEstado().estudiantes).toHaveLength(1);
  });

  it('Prueba 3: Verifica restricciones del reparto y que ningún estudiante se repita ni omita', () => {
    // No permitir sorteo sin suficientes estudiantes
    expect(realizarSorteo()).toBe(false);

    const listaNombres = [
      'Lucía Fernández',
      'Mateo Gómez',
      'Valentina Díaz',
      'Santiago Ruiz',
      'Camila Herrera',
      'Sebastián Castro',
      'Isabella Vargas',
    ];

    for (const nombre of listaNombres) {
      expect(registrarEstudiante(nombre)).toBe(true);
    }

    // No permitir menos de 2 equipos ni más equipos que estudiantes
    expect(configurarCantidadEquipos(1)).toBe(false);
    expect(configurarCantidadEquipos(10)).toBe(false);
    expect(configurarCantidadEquipos(3)).toBe(true);

    expect(realizarSorteo(12345)).toBe(true);
    const sorteo = obtenerEstado().sorteoActual;
    expect(sorteo).not.toBeNull();

    const integrantesTotales = sorteo!.equipos.flatMap((eq) => eq.integrantes.map((e) => e.nombre));
    const conjuntoUnico = new Set(integrantesTotales);

    // Todos los estudiantes deben estar presentes exactamente una vez
    expect(integrantesTotales).toHaveLength(listaNombres.length);
    expect(conjuntoUnico.size).toBe(listaNombres.length);
    for (const nombre of listaNombres) {
      expect(conjuntoUnico.has(nombre)).toBe(true);
    }
  });

  it('Prueba 4: Comprueba el equilibrio de los equipos, la reproducibilidad por semilla y el historial', () => {
    // 10 estudiantes en 3 equipos -> tamaños deben ser [4, 3, 3] (diferencia máxima de 1 persona)
    for (let i = 1; i <= 10; i++) {
      registrarEstudiante(`Estudiante ${i}`);
    }

    expect(configurarCantidadEquipos(3)).toBe(true);
    expect(realizarSorteo(99999)).toBe(true);

    const primerResultado = obtenerEstado().sorteoActual!;
    const tamanos = primerResultado.equipos.map((e) => e.integrantes.length);
    const maximo = Math.max(...tamanos);
    const minimo = Math.min(...tamanos);

    expect(maximo - minimo).toBeLessThanOrEqual(1);
    expect(tamanos).toEqual([4, 3, 3]);

    // Verificar reproducibilidad exacta con la misma semilla y lista inicial
    reiniciarEstado();
    for (let i = 1; i <= 10; i++) {
      registrarEstudiante(`Estudiante ${i}`);
    }
    configurarCantidadEquipos(3);
    realizarSorteo(99999);

    const segundoResultadoMismaSemilla = obtenerEstado().sorteoActual!;
    expect(segundoResultadoMismaSemilla.equipos).toEqual(primerResultado.equipos);

    // Realizar un segundo sorteo consecutivo y comprobar historial
    expect(realizarSorteo(54321)).toBe(true);
    const estadoConHistorial = obtenerEstado();
    expect(estadoConHistorial.historial).toHaveLength(2);

    // Consultar el primer sorteo desde el historial
    const idPrimerSorteo = estadoConHistorial.historial[1].id;
    expect(seleccionarSorteoDeHistorial(idPrimerSorteo)).toBe(true);
    expect(obtenerEstado().sorteoActual?.id).toBe(idPrimerSorteo);
  });

  it('Prueba 5: Evita parejas repetidas cuando es posible y avisa con transparencia cuando es matemáticamente imposible', () => {
    // Caso A: 6 estudiantes en 3 equipos de 2 personas -> es posible evitar el 100% de repeticiones en el segundo sorteo
    const seisEstudiantes = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    for (const nombre of seisEstudiantes) {
      registrarEstudiante(nombre);
    }
    configurarCantidadEquipos(3);

    expect(realizarSorteo(10101)).toBe(true);
    expect(realizarSorteo(20202)).toBe(true);

    const segundoSorteoCasoA = obtenerEstado().sorteoActual!;
    expect(segundoSorteoCasoA.parejasRepetidas).toBe(0);
    expect(segundoSorteoCasoA.evitoTodasLasRepeticiones).toBe(true);
    expect(obtenerEstado().tipoMensaje).toBe('exito');

    // Caso B: 5 estudiantes en 2 equipos (un equipo de 3 y un equipo de 2).
    // Por el Principio del Palomar, de los 3 compañeros del Equipo 1 en el primer sorteo,
    // al menos 2 coincidirán obligatoriamente en uno de los 2 equipos del segundo sorteo.
    reiniciarEstado();
    const cincoEstudiantes = ['Elena', 'Pablo', 'Sofía', 'Diego', 'Valeria'];
    for (const nombre of cincoEstudiantes) {
      registrarEstudiante(nombre);
    }
    configurarCantidadEquipos(2);

    expect(realizarSorteo(777)).toBe(true);
    expect(realizarSorteo(888)).toBe(true);

    const estadoImposible = obtenerEstado();
    expect(estadoImposible.sorteoActual).not.toBeNull();
    // Minimiza las repeticiones a solo 1 pareja (en vez de 3 o 4) y avisa de forma transparente
    expect(estadoImposible.sorteoActual!.parejasRepetidas).toBe(1);
    expect(estadoImposible.sorteoActual!.evitoTodasLasRepeticiones).toBe(false);
    expect(estadoImposible.sorteoActual!.intentosRealizados).toBe(CONFIG.MAX_INTENTOS_SORTEO);
    expect(estadoImposible.tipoMensaje).toBe('advertencia');
    expect(estadoImposible.ultimoMensaje).toContain('matemáticamente inevitable');
  });

  it('Prueba 6: Recorrido completo desde el registro, corrección, sorteo, persistencia y reinicio', () => {
    // 1. Registrar grupo de estudiantes
    expect(registrarEstudiante('Andrés López')).toBe(true);
    expect(registrarEstudiante('Beatriz Silva')).toBe(true);
    expect(registrarEstudiante('Camilo Torres')).toBe(true);
    expect(registrarEstudiante('Daniela Mora')).toBe(true);
    expect(registrarEstudiante('Temporal Baja')).toBe(true);

    // 2. Corregir un estudiante y eliminar la baja antes del sorteo
    const listaPrevia = obtenerEstado().estudiantes;
    const estAndres = listaPrevia.find((e) => e.nombre === 'Andrés López')!;
    const estBaja = listaPrevia.find((e) => e.nombre === 'Temporal Baja')!;

    expect(modificarEstudiante(estAndres.id, 'Andrés Felipe López')).toBe(true);
    expect(eliminarEstudiante(estBaja.id)).toBe(true);
    expect(obtenerEstado().estudiantes).toHaveLength(4);

    // 3. Configurar equipos y semilla
    expect(configurarCantidadEquipos(2)).toBe(true);
    expect(configurarSemilla(2026)).toBe(true);

    // 4. Realizar primer sorteo y luego un segundo sorteo evitando parejas repetidas
    expect(realizarSorteo()).toBe(true);
    expect(realizarSorteo()).toBe(true);

    const estadoTrasSorteos = obtenerEstado();
    expect(estadoTrasSorteos.historial).toHaveLength(2);
    expect(estadoTrasSorteos.sorteoActual?.parejasRepetidas).toBe(0);

    // 5. Exportar datos para persistencia (simulando guardado en localStorage) y restaurar
    const respaldo = exportarDatosParaGuardar();
    reiniciarEstado();
    expect(obtenerEstado().estudiantes).toHaveLength(0);

    expect(cargarDatosGuardados(respaldo)).toBe(true);
    expect(obtenerEstado().estudiantes).toHaveLength(4);
    expect(obtenerEstado().historial).toHaveLength(2);

    // 6. Preparar nuevo sorteo y limpiar historial
    expect(prepararNuevoSorteo()).toBe(true);
    expect(obtenerEstado().sorteoActual).toBeNull();
    expect(limpiarHistorial()).toBe(true);
    expect(obtenerEstado().historial).toHaveLength(0);
  });
});
