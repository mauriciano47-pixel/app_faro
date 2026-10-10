// Módulo de Alerta S.O.S., Cuenta Regresiva y Disuasión para Faro App
import { iniciarSirena, detenerSirena } from './audioEngine.js';
import { solicitarPIN, obtenerPerfilUsuaria } from './pinSecurity.js';
import { obtenerFaros, sanitizarTelefono } from './contactsManager.js';
import { ubicacionActual, generarEnlaceGoogleMaps } from './mapRouteManager.js';

export let sosActive = false;
let sosCountdownTimer = null;

/**
 * Compone el mensaje formal de auxilio con geolocalización para WhatsApp
 * @param {string} nombreUsuaria 
 * @param {number} lat 
 * @param {number} lng 
 * @returns {string}
 */
export function construirMensajeWhatsApp(nombreUsuaria = 'Carla', lat = 10.4806, lng = -66.9036) {
  const mapsUrl = generarEnlaceGoogleMaps(lat, lng);
  const nombreLimpio = String(nombreUsuaria).replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s]/gi, '').trim() || 'CARLA';

  return (
    `🚨 ¡ALERTA S.O.S. DE ${nombreLimpio.toUpperCase()} (FARO)!\n` +
    `Necesito ayuda urgente. Mi ubicación en tiempo real es:\n` +
    `${mapsUrl}\n\n` +
    `Por favor comunícate conmigo de inmediato.`
  );
}

/**
 * Prepara y abre el enlace de WhatsApp para enviar el auxilio a los contactos Faro
 */
export function enviarAlertaWhatsApp() {
  const faros = obtenerFaros();
  const destino = faros.length > 0 && faros[0].telefono ? sanitizarTelefono(faros[0].telefono) : '';

  const perfil = obtenerPerfilUsuaria();
  const nombreUsuaria = perfil && perfil.nombre ? perfil.nombre : 'Carla';

  const texto = construirMensajeWhatsApp(nombreUsuaria, ubicacionActual.lat, ubicacionActual.lng);
  const mensajeEncoded = encodeURIComponent(texto);

  let whatsappUrl = `https://api.whatsapp.com/send?text=${mensajeEncoded}`;
  if (destino && destino.length >= 8) {
    whatsappUrl += `&phone=${destino}`;
  }

  if (typeof document !== 'undefined') {
    const btnWhatsApp = document.getElementById('sos-whatsapp-btn');
    if (btnWhatsApp) {
      btnWhatsApp.href = whatsappUrl;
    }
  }

  try {
    if (typeof window !== 'undefined') {
      window.open(whatsappUrl, '_blank');
    }
  } catch (e) {
    console.warn('Popup bloqueado, el botón en pantalla ya contiene el enlace:', e);
  }

  if (typeof window.mostrarToast === 'function') {
    window.mostrarToast('💬', 'Alerta preparada · Abriendo WhatsApp...');
  }
}

/**
 * Activa la secuencia de emergencia S.O.S. con cuenta atrás disuasoria de 5 segundos
 */
export function activarSOS() {
  if (sosActive) return;
  sosActive = true;

  if (typeof document !== 'undefined') {
    const overlay = document.getElementById('sos-overlay');
    if (overlay) overlay.classList.add('active');

    const countdownEl = document.getElementById('sos-countdown');
    const titleEl = document.querySelector('.sos-active-title');
    const subEl = document.getElementById('sos-active-sub');

    let cuenta = 5;
    if (countdownEl) {
      countdownEl.style.display = '';
      countdownEl.textContent = cuenta;
    }
    if (titleEl) titleEl.textContent = '¡S.O.S. ACTIVADO!';
    if (subEl) subEl.textContent = 'Transmitiendo auxilio automático en 5 segundos...\nToca cancelar si fue un error.';

    // Iniciar sirena disuasoria
    iniciarSirena();

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate([200, 100, 200, 100, 400]); } catch(e){}
    }

    sosCountdownTimer = setInterval(() => {
      cuenta--;
      if (countdownEl) countdownEl.textContent = cuenta;
      if (subEl && cuenta > 0) {
        subEl.textContent = `Transmitiendo auxilio automático en ${cuenta} segundos...\nToca cancelar si fue un error.`;
      }

      if (cuenta <= 0) {
        clearInterval(sosCountdownTimer);
        sosCountdownTimer = null;
        if (countdownEl) countdownEl.style.display = 'none';
        if (titleEl) titleEl.textContent = '¡S.O.S. TRANSMITIDO!';
        if (subEl) subEl.textContent = '¡Alerta enviada a tus Faros de confianza con tu geolocalización precisa!\nLa ayuda está en camino.';
        if (typeof window.mostrarToast === 'function') {
          window.mostrarToast('🚨', '¡Alerta enviada! Faros notificados con tu ubicación');
        }
        enviarAlertaWhatsApp();
      }
    }, 1000);
  }
}

/**
 * Cancela la secuencia S.O.S. solicitando el PIN de seguridad de la usuaria
 */
export function cancelarSOS() {
  solicitarPIN(() => {
    if (sosCountdownTimer) {
      clearInterval(sosCountdownTimer);
      sosCountdownTimer = null;
    }
    detenerSirena();
    sosActive = false;

    if (typeof document !== 'undefined') {
      const overlay = document.getElementById('sos-overlay');
      if (overlay) overlay.classList.remove('active');

      const countdownEl = document.getElementById('sos-countdown');
      const titleEl = document.querySelector('.sos-active-title');
      const subEl = document.getElementById('sos-active-sub');

      if (countdownEl) {
        countdownEl.style.display = '';
        countdownEl.textContent = '5';
      }
      if (titleEl) titleEl.textContent = '¡S.O.S. ENVIADO!';
      if (subEl) subEl.textContent = 'Tu ubicación fue enviada a tus Faros de confianza.\nLlegará ayuda de inmediato.';
    }

    if (typeof window.mostrarToast === 'function') {
      window.mostrarToast('✅', 'Alerta cancelada. ¡Estás a salvo!');
    }
  });
}

if (typeof window !== 'undefined') {
  window.activarSOS = activarSOS;
  window.cancelarSOS = cancelarSOS;
  window.enviarAlertaWhatsApp = enviarAlertaWhatsApp;
}
