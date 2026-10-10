// Módulo de Disparadores por Sensores Físicos (Agitar y Botón Power) para Faro App
import { activarSOS } from './sosManager.js';

export const SHAKE_THRESHOLD = 15; // Sensibilidad de agitar (m/s^2)
export const SHAKE_LIMIT = 4;      // Sacudidas bruscas consecutivas requeridas

let shakeActive = false;
let lastX = null, lastY = null, lastZ = null;
let lastTime = 0;
let shakeCount = 0;
let lastShakeTime = 0;

let powerActive = false;
let visibilityTimestamps = [];

/**
 * Calcula la magnitud de variación de velocidad a partir de aceleración y delta de tiempo
 * @param {number} x 
 * @param {number} y 
 * @param {number} z 
 * @param {number} lx 
 * @param {number} ly 
 * @param {number} lz 
 * @param {number} diffTime 
 * @returns {number}
 */
export function calcularVelocidadMovimiento(x, y, z, lx, ly, lz, diffTime) {
  if (diffTime <= 0) return 0;
  return (Math.abs(x + y + z - lx - ly - lz) / diffTime) * 10000;
}

/**
 * Procesa el evento de movimiento del dispositivo
 * @param {DeviceMotionEvent} event 
 */
export function handleMotion(event) {
  const acceleration = event.acceleration || event.accelerationIncludingGravity;
  if (!acceleration) return;

  const current = new Date().getTime();
  if ((current - lastTime) > 100) {
    const diffTime = current - lastTime;
    lastTime = current;

    const x = acceleration.x || 0;
    const y = acceleration.y || 0;
    const z = acceleration.z || 0;

    if (lastX !== null && lastY !== null && lastZ !== null) {
      const speed = calcularVelocidadMovimiento(x, y, z, lastX, lastY, lastZ, diffTime);

      if (speed > SHAKE_THRESHOLD) {
        const timeDiff = current - lastShakeTime;
        if (timeDiff > 1500) {
          shakeCount = 0;
        }

        shakeCount++;
        lastShakeTime = current;

        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(60);
        }

        if (shakeCount >= SHAKE_LIMIT) {
          shakeCount = 0;
          activarSOS();
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([200, 100, 200, 100, 500]);
          }
        }
      }
    }

    lastX = x;
    lastY = y;
    lastZ = z;
  }
}

export function startShakeDetection() {
  if (shakeActive || typeof window === 'undefined') return;
  shakeActive = true;
  shakeCount = 0;
  window.addEventListener('devicemotion', handleMotion, true);
}

export function stopShakeDetection() {
  if (typeof window === 'undefined') return;
  shakeActive = false;
  window.removeEventListener('devicemotion', handleMotion, true);
}

export function toggleShakeDetection(checkbox) {
  if (checkbox && checkbox.checked) {
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      DeviceMotionEvent.requestPermission()
        .then(permissionState => {
          if (permissionState === 'granted') {
            startShakeDetection();
            if (typeof localStorage !== 'undefined') localStorage.setItem('shake_sos_enabled', 'true');
            if (typeof window.mostrarToast === 'function') window.mostrarToast('📳', 'SOS por Agitado Activado. Prueba a agitar tu celular.');
          } else {
            checkbox.checked = false;
            if (typeof window.mostrarToast === 'function') window.mostrarToast('⚠️', 'Permiso de sensores denegado.');
          }
        })
        .catch(err => {
          console.error(err);
          checkbox.checked = false;
          if (typeof window.mostrarToast === 'function') window.mostrarToast('⚠️', 'Error al solicitar permisos del sensor.');
        });
    } else {
      startShakeDetection();
      if (typeof localStorage !== 'undefined') localStorage.setItem('shake_sos_enabled', 'true');
      if (typeof window.mostrarToast === 'function') window.mostrarToast('📳', 'SOS por Agitado Activado. Prueba a agitar tu celular.');
    }
  } else {
    stopShakeDetection();
    if (typeof localStorage !== 'undefined') localStorage.removeItem('shake_sos_enabled');
    if (typeof window.mostrarToast === 'function') window.mostrarToast('📳', 'SOS por Agitado Desactivado.');
  }
}

export function handleVisibilityChange() {
  if (typeof document === 'undefined') return;
  const current = new Date().getTime();
  visibilityTimestamps.push(current);
  visibilityTimestamps = visibilityTimestamps.filter(t => (current - t) < 4000);

  if (visibilityTimestamps.length >= 4) {
    visibilityTimestamps = [];
    if (document.visibilityState === 'visible') {
      activarSOS();
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 500]);
      }
    }
  }
}

export function startPowerDetection() {
  if (powerActive || typeof document === 'undefined') return;
  powerActive = true;
  visibilityTimestamps = [];
  document.addEventListener('visibilitychange', handleVisibilityChange);
}

export function stopPowerDetection() {
  if (typeof document === 'undefined') return;
  powerActive = false;
  document.removeEventListener('visibilitychange', handleVisibilityChange);
}

export function togglePowerDetection(checkbox) {
  if (checkbox && checkbox.checked) {
    startPowerDetection();
    if (typeof localStorage !== 'undefined') localStorage.setItem('power_sos_enabled', 'true');
    if (typeof window.mostrarToast === 'function') window.mostrarToast('⚡', 'SOS por Botón Físico Activado. Bloquea y desbloquea rápido para probar.');
  } else {
    stopPowerDetection();
    if (typeof localStorage !== 'undefined') localStorage.removeItem('power_sos_enabled');
    if (typeof window.mostrarToast === 'function') window.mostrarToast('⚡', 'SOS por Botón Físico Desactivado.');
  }
}

if (typeof window !== 'undefined') {
  window.toggleShakeDetection = toggleShakeDetection;
  window.togglePowerDetection = togglePowerDetection;
}
