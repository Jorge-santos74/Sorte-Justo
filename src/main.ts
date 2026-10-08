/**
 * Punto de entrada de la interfaz para SORTEO JUSTO (Fase 1: Estructura base)
 * Se completará en la Fase 4.
 */
import './estilo.css';
import { CONFIG } from './logica';

const contenedor = document.querySelector<HTMLDivElement>('#app');

if (contenedor) {
  contenedor.innerHTML = `
    <main class="contenedor-inicial">
      <h1>SORTEO JUSTO</h1>
      <p>Entorno base configurado correctamente (Fase 1).</p>
      <p>Intentos máximos configurados: ${CONFIG.MAX_INTENTOS_SORTEO}</p>
    </main>
  `;
}
