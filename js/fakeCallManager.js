// Módulo de Falsa Llamada Disuasoria para Faro App
import { iniciarTimbreLlamada, detenerTimbreLlamada } from './audioEngine.js';

export let delayFalsaLlamada = 0;
let falsaLlamadaTimer = null;
let callDurationInterval = null;
export let callSeconds = 0;
export let enLlamada = false;

/**
 * Selecciona los segundos de retraso para programar la llamada
 * @param {HTMLElement} el 
 * @param {number} segundos 
 */
export function selDelay(el, segundos) {
  if (typeof document !== 'undefined') {
    document.querySelectorAll('.delay-opt').forEach(o => o.classList.remove('selected'));
  }
  if (el) el.classList.add('selected');
  delayFalsaLlamada = segundos;
}

/**
 * Inicia la interfaz de llamada fingida
 * @param {string} nombre 
 * @param {string} avClass 
 * @param {string} emoji 
 */
export function iniciarFalsaLlamada(nombre, avClass, emoji) {
  if (typeof document === 'undefined') return;

  const callScreen = document.getElementById('call-screen');
  const callName = document.getElementById('call-name');
  const callEmoji = document.getElementById('call-avatar-emoji');
  const callStatus = document.getElementById('call-status-text');
  const callActions = document.getElementById('call-actions');
  const callEndActions = document.getElementById('call-end-actions');
  const callTimer = document.getElementById('call-timer');

  if (callName) callName.textContent = nombre;
  if (callEmoji) callEmoji.textContent = emoji;
  if (callStatus) {
    callStatus.textContent = delayFalsaLlamada === 0 ? 'Llamada entrante…' : `Llamará en ${delayFalsaLlamada}s…`;
  }
  if (callActions) callActions.style.display = 'flex';
  if (callEndActions) callEndActions.style.display = 'none';
  if (callTimer) callTimer.style.display = 'none';
  if (callScreen) callScreen.classList.add('active');

  callSeconds = 0;
  enLlamada = false;

  if (delayFalsaLlamada > 0) {
    if (typeof window.mostrarToast === 'function') {
      window.mostrarToast('📱', `Llamada programada en ${delayFalsaLlamada} segundos`);
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
    falsaLlamadaTimer = setTimeout(() => {
      if (callStatus) callStatus.textContent = 'Llamada entrante…';
      iniciarTimbreLlamada();
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([500, 200, 500, 200, 500]);
      }
    }, delayFalsaLlamada * 1000);
  } else {
    iniciarTimbreLlamada();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([500, 200, 500, 200, 500]);
    }
  }
}

/**
 * Descuelga la llamada simulada y arranca el contador de duración
 */
export function contestarLlamada() {
  detenerTimbreLlamada();
  enLlamada = true;

  if (typeof document === 'undefined') return;

  const callStatus = document.getElementById('call-status-text');
  const callActions = document.getElementById('call-actions');
  const callEndActions = document.getElementById('call-end-actions');
  const timerEl = document.getElementById('call-timer');

  if (callStatus) callStatus.textContent = 'En llamada…';
  if (callActions) callActions.style.display = 'none';
  if (callEndActions) callEndActions.style.display = 'flex';
  if (timerEl) {
    timerEl.style.display = 'block';
    timerEl.textContent = '00:00';
  }

  callDurationInterval = setInterval(() => {
    callSeconds++;
    const m = Math.floor(callSeconds / 60).toString().padStart(2, '0');
    const s = (callSeconds % 60).toString().padStart(2, '0');
    if (timerEl) timerEl.textContent = `${m}:${s}`;
  }, 1000);
}

/**
 * Cuelga la llamada simulada y restaura la pantalla
 */
export function colgarLlamada() {
  detenerTimbreLlamada();
  if (falsaLlamadaTimer) clearTimeout(falsaLlamadaTimer);
  if (callDurationInterval) clearInterval(callDurationInterval);
  enLlamada = false;

  if (typeof document !== 'undefined') {
    const callScreen = document.getElementById('call-screen');
    if (callScreen) callScreen.classList.remove('active');
  }

  if (typeof window.mostrarToast === 'function') {
    window.mostrarToast('📵', 'Llamada finalizada');
  }
}

if (typeof window !== 'undefined') {
  window.selDelay = selDelay;
  window.iniciarFalsaLlamada = iniciarFalsaLlamada;
  window.contestarLlamada = contestarLlamada;
  window.colgarLlamada = colgarLlamada;
}
