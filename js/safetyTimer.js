// Módulo de Temporizador de Seguridad y Llegada Segura para Faro App
import { activarSOS } from './sosManager.js';
import { detenerSimulacion } from './mapRouteManager.js';

export const TIEMPO_TOTAL_SEG = 20 * 60; // 20 minutos
export let tiempoRestante = TIEMPO_TOTAL_SEG;
export let timerRunning = true;
let timerInterval = null;

/**
 * Convierte una cantidad de segundos a formato legible mm:ss
 * @param {number} segs 
 * @returns {string}
 */
export function formatTiempo(segs) {
  const s = Math.max(0, Math.floor(segs));
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const restoSegs = (s % 60).toString().padStart(2, '0');
  return `${m}:${restoSegs}`;
}

/**
 * Calcula el porcentaje restante del temporizador
 * @param {number} restante 
 * @param {number} [total=TIEMPO_TOTAL_SEG] 
 * @returns {number}
 */
export function calcularPorcentajeTimer(restante, total = TIEMPO_TOTAL_SEG) {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(100, (restante / total) * 100));
}

/**
 * Actualiza los elementos del temporizador en pantalla
 */
export function actualizarTimerUI() {
  if (typeof document === 'undefined') return;

  const display = document.getElementById('timer-display');
  const progress = document.getElementById('timer-progress');
  if (!display || !progress) return;

  display.textContent = formatTiempo(tiempoRestante);
  const pct = calcularPorcentajeTimer(tiempoRestante, TIEMPO_TOTAL_SEG);
  progress.style.width = pct + '%';

  if (pct <= 20) {
    progress.style.background = 'linear-gradient(90deg, var(--accent-coral), #c9003a)';
    display.style.backgroundImage = 'linear-gradient(90deg, var(--accent-coral), #c9003a)';
  } else if (pct <= 50) {
    progress.style.background = 'linear-gradient(90deg, var(--accent-amber), #d97706)';
    display.style.backgroundImage = 'linear-gradient(90deg, var(--accent-amber), #d97706)';
  } else {
    progress.style.background = 'linear-gradient(90deg, var(--accent-teal), #00b09b)';
    display.style.backgroundImage = 'linear-gradient(90deg, var(--accent-teal), #00b09b)';
  }
}

/**
 * Ejecuta un ciclo del temporizador
 */
export function tickTimer() {
  if (!timerRunning) return;
  tiempoRestante--;
  actualizarTimerUI();

  if (tiempoRestante <= 0) {
    if (timerInterval) clearInterval(timerInterval);
    if (typeof window.mostrarToast === 'function') {
      window.mostrarToast('🚨', '¡Tiempo agotado! Alertando a tus Faros automáticamente');
    }
    const badge = document.getElementById('timer-status-badge');
    if (badge) {
      badge.textContent = '¡ALERTANDO!';
      badge.style.color = 'var(--accent-coral)';
    }
    activarSOS();
  }
}

/**
 * Alterna entre pausar y reanudar el temporizador
 */
export function toggleTimer() {
  timerRunning = !timerRunning;
  const btn = document.getElementById('timer-toggle-btn');
  const badge = document.getElementById('timer-status-badge');

  if (timerRunning) {
    if (btn) {
      btn.textContent = ' Pausar';
      btn.insertAdjacentHTML('afterbegin', '<svg viewBox="0 0 24 24" style="width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:2.5;"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>');
    }
    if (badge) {
      badge.textContent = 'ACTIVO';
      badge.style.color = 'var(--accent-teal)';
    }
    if (typeof window.mostrarToast === 'function') {
      window.mostrarToast('▶️', 'Temporizador reanudado');
    }
  } else {
    if (btn) {
      btn.textContent = ' Reanudar';
      btn.insertAdjacentHTML('afterbegin', '<svg viewBox="0 0 24 24" style="width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:2.5;"><polygon points="5 3 19 12 5 21 5 3"/></svg>');
    }
    if (badge) {
      badge.textContent = 'PAUSADO';
      badge.style.color = 'var(--accent-amber)';
    }
    if (typeof window.mostrarToast === 'function') {
      window.mostrarToast('⏸', 'Temporizador pausado');
    }
  }
}

/**
 * Reinicia el temporizador de seguridad a 20 minutos
 */
export function resetTimer() {
  tiempoRestante = TIEMPO_TOTAL_SEG;
  timerRunning = true;
  const badge = document.getElementById('timer-status-badge');
  if (badge) {
    badge.textContent = 'ACTIVO';
    badge.style.color = 'var(--accent-teal)';
  }
  const btn = document.getElementById('timer-toggle-btn');
  if (btn) {
    btn.textContent = ' Pausar';
    btn.insertAdjacentHTML('afterbegin', '<svg viewBox="0 0 24 24" style="width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:2.5;"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>');
  }
  actualizarTimerUI();
  if (typeof window.mostrarToast === 'function') {
    window.mostrarToast('🔄', 'Temporizador reiniciado a 20 minutos');
  }
}

/**
 * Confirma la llegada segura a casa
 */
export function confirmarLlegada() {
  if (timerInterval) clearInterval(timerInterval);
  detenerSimulacion();
  timerRunning = false;

  if (typeof window.mostrarToast === 'function') {
    window.mostrarToast('🏠', '¡Llegaste sana y salva! Faros notificados.');
  }

  const badge = document.getElementById('timer-status-badge');
  if (badge) {
    badge.textContent = 'COMPLETADO';
    badge.style.color = 'var(--accent-teal)';
  }

  const homeTitle = document.getElementById('home-status-title');
  const homeDetail = document.getElementById('home-status-detail');
  if (homeTitle) homeTitle.textContent = 'Llegaste sana y salva 🏠';
  if (homeDetail) homeDetail.textContent = 'Ruta finalizada · Todos tus Faros fueron notificados';

  setTimeout(() => {
    if (typeof window.irA === 'function') window.irA('screen-home');
  }, 1500);
}

/**
 * Inicializa el intervalo del temporizador
 */
export function iniciarTimerLoop() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(tickTimer, 1000);
  actualizarTimerUI();
}

if (typeof window !== 'undefined') {
  window.toggleTimer = toggleTimer;
  window.resetTimer = resetTimer;
  window.confirmarLlegada = confirmarLlegada;
}
