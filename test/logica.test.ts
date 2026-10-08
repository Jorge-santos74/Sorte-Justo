import { describe, it, expect } from 'vitest';
import { CONFIG } from '../src/logica';

describe('Fase 1: Verificación del entorno de pruebas', () => {
  it('debe cargar correctamente el objeto CONFIG con sus parámetros iniciales', () => {
    expect(CONFIG.MIN_ESTUDIANTES).toBe(2);
    expect(CONFIG.MIN_EQUIPOS).toBe(2);
    expect(CONFIG.MAX_INTENTOS_SORTEO).toBeGreaterThan(0);
  });
});
