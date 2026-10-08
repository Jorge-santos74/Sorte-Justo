/**
 * Módulo de lógica pura para SORTEO JUSTO (Fase 1: Estructura base)
 * Se completará en la Fase 2.
 */

export const CONFIG = {
  /** Cantidad mínima de estudiantes permitida para un sorteo (unidades: personas) */
  MIN_ESTUDIANTES: 2,
  /** Cantidad mínima de equipos permitida (unidades: equipos) */
  MIN_EQUIPOS: 2,
  /** Cantidad máxima de intentos para minimizar parejas repetidas (unidades: intentos) */
  MAX_INTENTOS_SORTEO: 250,
  /** Semilla inicial por defecto para el generador pseudoaleatorio (unidades: valor numérico entero) */
  SEMILLA_POR_DEFECTO: 202637,
} as const;
