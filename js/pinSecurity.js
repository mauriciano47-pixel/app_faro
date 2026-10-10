// Módulo de Autenticación y Seguridad por PIN para Faro App

export const PIN_STORAGE_KEY = 'faro_user_profile';

let faroUserProfile = null;
let accionPendientePin = null;

/**
 * Valida que un PIN tenga exactamente 4 dígitos numéricos
 * @param {string} pin 
 * @returns {boolean}
 */
export function validarFormatoPin(pin) {
  if (typeof pin !== 'string') return false;
  return /^\d{4}$/.test(pin.trim());
}

/**
 * Comprueba si un PIN ingresado coincide con el perfil registrado
 * @param {string} inputPin 
 * @param {{ pin?: string } | null} profile 
 * @returns {boolean}
 */
export function verificarPinUsuario(inputPin, profile) {
  if (!profile || !profile.pin) return true; // Si no hay PIN configurado, aprueba
  return String(inputPin).trim() === String(profile.pin).trim();
}

/**
 * Obtiene el perfil de usuaria desde almacenamiento local
 * @returns {{ nombre: string, pin: string } | null}
 */
export function obtenerPerfilUsuaria() {
  if (typeof localStorage === 'undefined') return faroUserProfile;
  try {
    const raw = localStorage.getItem(PIN_STORAGE_KEY);
    if (raw) {
      faroUserProfile = JSON.parse(raw);
    }
  } catch (e) {
    faroUserProfile = null;
  }
  return faroUserProfile;
}

/**
 * Guarda el perfil de usuaria en almacenamiento local
 * @param {{ nombre: string, pin: string }} profile 
 */
export function guardarPerfilUsuaria(profile) {
  faroUserProfile = profile;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(profile));
  }
}

/**
 * Solicita autorización mediante PIN antes de ejecutar una acción sensible
 * @param {Function} callback Acción a ejecutar si el PIN es correcto
 */
export function solicitarPIN(callback) {
  const profile = obtenerPerfilUsuaria();
  if (!profile || !profile.pin) {
    callback();
    return;
  }

  accionPendientePin = callback;
  if (typeof document === 'undefined') return;

  const modal = document.getElementById('modal-pin-auth');
  const input = document.getElementById('auth-pin');
  const error = document.getElementById('auth-pin-error');

  if (error) error.style.display = 'none';
  if (input) input.value = '';
  if (modal) modal.classList.add('active');
  if (input) setTimeout(() => input.focus(), 100);
}

/**
 * Cierra el modal de autorización por PIN
 */
export function cerrarModalPin() {
  accionPendientePin = null;
  if (typeof document === 'undefined') return;
  const modal = document.getElementById('modal-pin-auth');
  if (modal) modal.classList.remove('active');
}

/**
 * Verifica automáticamente cuando se ingresan 4 dígitos en el input
 * @param {string} val 
 */
export function chequearPinAutomatico(val) {
  if (val && val.length === 4) {
    verificarPin();
  }
}

/**
 * Verifica el PIN del input contra el perfil registrado
 */
export function verificarPin() {
  if (typeof document === 'undefined') return;
  const input = document.getElementById('auth-pin');
  const error = document.getElementById('auth-pin-error');
  if (!input) return;

  const profile = obtenerPerfilUsuaria();
  if (verificarPinUsuario(input.value, profile)) {
    cerrarModalPin();
    if (accionPendientePin) {
      const fn = accionPendientePin;
      accionPendientePin = null;
      fn();
    }
  } else {
    if (error) error.style.display = 'block';
    input.value = '';
    input.focus();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate([100, 100, 100]); } catch(e){}
    }
  }
}

/**
 * Completa el formulario de onboarding inicial
 * @param {Event} e 
 */
export function completarRegistro(e) {
  if (e && e.preventDefault) e.preventDefault();
  if (typeof document === 'undefined') return;

  const nameEl = document.getElementById('reg-name');
  const pinEl = document.getElementById('reg-pin');
  const nombre = nameEl ? nameEl.value.trim() : '';
  const pin = pinEl ? pinEl.value.trim() : '';

  if (nombre && validarFormatoPin(pin)) {
    guardarPerfilUsuaria({ nombre, pin });

    const greetingEl = document.getElementById('greeting-name');
    if (greetingEl) greetingEl.textContent = nombre + ' 🌟';

    const overlay = document.getElementById('onboarding-overlay');
    if (overlay) {
      overlay.style.opacity = '0';
      setTimeout(() => {
        overlay.style.display = 'none';
        if (typeof window.mostrarToast === 'function') {
          window.mostrarToast('🎉', '¡Bienvenida a Faro, ' + nombre + '!');
        }
      }, 400);
    }
  }
}

if (typeof window !== 'undefined') {
  window.solicitarPIN = solicitarPIN;
  window.cerrarModalPin = cerrarModalPin;
  window.chequearPinAutomatico = chequearPinAutomatico;
  window.verificarPin = verificarPin;
  window.completarRegistro = completarRegistro;
}
