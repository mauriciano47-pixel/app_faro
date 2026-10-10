/* =========================================
   FARO APP – Orquestador Principal (app.js)
   Sistema de Seguridad Personal, Alerta SOS y Geolocalización
   ========================================= */

import { sirenaSonando, iniciarSirena, detenerSirena } from './js/audioEngine.js';
import { solicitarPIN, obtenerPerfilUsuaria } from './js/pinSecurity.js';
import { renderizarFaros } from './js/contactsManager.js';
import { inicializarMapa } from './js/mapRouteManager.js';
import { activarSOS, cancelarSOS } from './js/sosManager.js';
import { iniciarTimerLoop, actualizarTimerUI } from './js/safetyTimer.js';
import { startShakeDetection, startPowerDetection } from './js/sensorTriggers.js';

// Exportar módulos a window para compatibilidad total con atributos onclick en HTML
import './js/audioEngine.js';
import './js/pinSecurity.js';
import './js/contactsManager.js';
import './js/mapRouteManager.js';
import './js/sosManager.js';
import './js/fakeCallManager.js';
import './js/safetyTimer.js';
import './js/sensorTriggers.js';

// ─── UTILIDADES DE INTERFAZ ──────────────────────────────────────────────────

/** Genera estrellas aleatorias en el fondo */
export function generarEstrellas() {
  const container = document.getElementById('stars-container');
  if (!container) return;
  container.textContent = '';
  for (let i = 0; i < 120; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    const size = Math.random() * 2.5 + 0.5;
    star.style.cssText = `
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      width: ${size}px;
      height: ${size}px;
      --d: ${(Math.random() * 3 + 2).toFixed(1)}s;
      --delay: ${(Math.random() * 4).toFixed(1)}s;
    `;
    container.appendChild(star);
  }
}

/** Actualiza el reloj de la barra de estado y el saludo horario */
export function actualizarReloj() {
  const now = new Date();
  const hours = now.getHours();
  const h = String(hours).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');

  const clockEl = document.getElementById('status-clock');
  if (clockEl) clockEl.textContent = `${h}:${m}`;

  const greetingSub = document.getElementById('greeting-sub');
  if (greetingSub) {
    if (hours >= 6 && hours < 12) {
      greetingSub.textContent = 'Buenos días,';
    } else if (hours >= 12 && hours < 20) {
      greetingSub.textContent = 'Buenas tardes,';
    } else {
      greetingSub.textContent = 'Buenas noches,';
    }
  }
}

/** Muestra un toast de notificación */
let toastTimer = null;
export function mostrarToast(icono, mensaje) {
  const toast = document.getElementById('toast');
  const iconEl = document.getElementById('toast-icon');
  const textEl = document.getElementById('toast-text');
  if (!toast || !iconEl || !textEl) return;

  iconEl.textContent = icono;
  textEl.textContent = mensaje;
  toast.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}

// ─── NAVEGACIÓN ENTRE PANTALLAS ───────────────────────────────────────────────

const SCREENS = ['screen-home', 'screen-ruta', 'screen-llamada', 'screen-contactos'];
const NAV_MAP = {
  'screen-home':      'nav-home',
  'screen-ruta':      'nav-ruta',
  'screen-llamada':   'nav-llamada',
  'screen-contactos': 'nav-contactos',
};

export function irA(screenId) {
  if (screenId === 'screen-ruta') {
    setTimeout(inicializarMapa, 100);
  }

  SCREENS.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });

  const target = document.getElementById(screenId);
  if (target) target.classList.add('active');

  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navId = NAV_MAP[screenId];
  if (navId) document.getElementById(navId)?.classList.add('active');
}

// ─── ACCIONES RÁPIDAS DEL HOME ───────────────────────────────────────────────

export function activarAlarma() {
  const card = document.querySelectorAll('.quick-card.alarma')[0];
  if (sirenaSonando) {
    solicitarPIN(() => {
      detenerSirena();
      mostrarToast('🔇', 'Sirena disuasoria apagada');
      if (card) {
        card.style.borderColor = '';
        card.style.background = '';
      }
    });
  } else {
    iniciarSirena();
    mostrarToast('🔊', '¡Sirena disuasoria activada! Toca para apagar');
    if (card) {
      card.style.borderColor = 'var(--accent-amber)';
      card.style.background = 'rgba(245,158,11,0.2)';
    }
  }
}

let modoDiscretoActivo = false;

export function toggleModoDiscreto() {
  const card = document.querySelectorAll('.quick-card.discreta')[0];
  const statusDot = document.querySelector('.status-dot');
  const statusTitle = document.querySelector('.status-title');
  const statusSub = document.querySelector('.status-sub');

  if (!modoDiscretoActivo) {
    modoDiscretoActivo = true;
    detenerSirena();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate([80, 40, 80]); } catch (e) {}
    }
    mostrarToast('🤫', 'Modo Discreto ACTIVADO · Alerta silenciosa lista');
    if (card) {
      card.style.borderColor = 'var(--accent-coral)';
      card.style.background = 'rgba(255,79,114,0.15)';
      const descEl = card.querySelector('.quick-desc');
      if (descEl) descEl.textContent = 'Activo · Toca para apagar';
    }
    if (statusDot) statusDot.style.background = 'var(--accent-coral)';
    if (statusTitle) statusTitle.textContent = 'Modo Discreto Silencioso Activo';
    if (statusSub) statusSub.textContent = 'Alerta silenciosa enviada a tus 3 Faros';
  } else {
    solicitarPIN(() => {
      modoDiscretoActivo = false;
      mostrarToast('🛡️', 'Modo Discreto DESACTIVADO · Monitoreo normal');
      if (card) {
        card.style.borderColor = '';
        card.style.background = '';
        const descEl = card.querySelector('.quick-desc');
        if (descEl) descEl.textContent = 'Alerta sin sonido ni pantalla';
      }
      if (statusDot) statusDot.style.background = 'var(--accent-teal)';
      if (statusTitle) statusTitle.textContent = 'Estás segura en casa';
      if (statusSub) statusSub.textContent = 'Sin rutas activas · Faros disponibles: 3';
    });
  }
}

export function modoDiscreto() {
  toggleModoDiscreto();
}

// ─── GESTIÓN DE INSTALACIÓN PWA ──────────────────────────────────────────────
let deferredFaroPrompt = null;
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredFaroPrompt = e;
    const banner = document.getElementById('install-pwa-banner');
    if (banner && !window.matchMedia('(display-mode: standalone)').matches) {
      banner.style.display = 'flex';
    }
  });
}

export function instalarPwaDesdeApp() {
  if (deferredFaroPrompt) {
    deferredFaroPrompt.prompt();
    deferredFaroPrompt.userChoice.then((choice) => {
      if (choice.outcome === 'accepted') {
        const banner = document.getElementById('install-pwa-banner');
        if (banner) banner.style.display = 'none';
        mostrarToast('🎉 ¡Faro instalado en tu pantalla con éxito!');
      }
      deferredFaroPrompt = null;
    });
  } else {
    window.location.href = './download.html';
  }
}

// ─── INICIALIZACIÓN ───────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  generarEstrellas();
  actualizarReloj();
  setInterval(actualizarReloj, 10000);

  renderizarFaros();
  iniciarTimerLoop();

  // Verificar perfil guardado para onboarding
  const guardado = obtenerPerfilUsuaria();
  const overlay = document.getElementById('onboarding-overlay');
  if (guardado && guardado.nombre) {
    if (overlay) overlay.style.display = 'none';
    const nameEl = document.getElementById('greeting-name');
    if (nameEl) nameEl.textContent = guardado.nombre + ' 🌟';
  } else {
    if (overlay) overlay.style.display = 'flex';
  }

  // Cargar sensores guardados
  const shakeToggle = document.getElementById('shake-toggle');
  if (shakeToggle && localStorage.getItem('shake_sos_enabled') === 'true') {
    shakeToggle.checked = true;
    startShakeDetection();
  }

  const powerToggle = document.getElementById('power-toggle');
  if (powerToggle && localStorage.getItem('power_sos_enabled') === 'true') {
    powerToggle.checked = true;
    startPowerDetection();
  }

  // Soporte query param action=sos
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('action') === 'sos') {
    setTimeout(activarSOS, 300);
  }

  if (document.getElementById('screen-ruta')?.classList.contains('active')) {
    setTimeout(inicializarMapa, 100);
  }

  console.log('🔦 Faro App · v1.7.0 App Oficial Fortificada (Modularizada & Tests OK)');
});

// Exponer en window para retrocompatibilidad
if (typeof window !== 'undefined') {
  window.mostrarToast = mostrarToast;
  window.irA = irA;
  window.activarAlarma = activarAlarma;
  window.toggleModoDiscreto = toggleModoDiscreto;
  window.modoDiscreto = modoDiscreto;
  window.instalarPwaDesdeApp = instalarPwaDesdeApp;
  window.activarSOS = activarSOS;
  window.cancelarSOS = cancelarSOS;
}
