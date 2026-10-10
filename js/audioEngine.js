// Módulo de Motor de Audio Sintetizado (Web Audio API) para Faro App

let audioCtx = null;
let sirenOsc = null;
let sirenGain = null;
let sirenInterval = null;
export let sirenaSonando = false;

let ringtoneInterval = null;
export let ringtoneSonando = false;

/**
 * Obtiene o inicializa el contexto de audio
 * @returns {AudioContext | null}
 */
export function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Inicia la sirena disuasoria oscilatoria de alta frecuencia
 */
export function iniciarSirena() {
  const ctx = getAudioContext();
  if (!ctx || sirenaSonando) return;
  sirenaSonando = true;

  try {
    sirenOsc = ctx.createOscillator();
    sirenGain = ctx.createGain();
    sirenOsc.type = 'sawtooth';
    sirenGain.gain.setValueAtTime(0.25, ctx.currentTime);

    sirenOsc.connect(sirenGain);
    sirenGain.connect(ctx.destination);
    sirenOsc.start();

    let high = false;
    sirenOsc.frequency.setValueAtTime(750, ctx.currentTime);
    sirenInterval = setInterval(() => {
      if (!sirenaSonando || !sirenOsc) return;
      high = !high;
      const freq = high ? 1250 : 750;
      sirenOsc.frequency.exponentialRampToValueAtTime(freq, ctx.currentTime + 0.35);
    }, 400);
  } catch (e) {
    console.warn('Audio no disponible:', e);
  }
}

/**
 * Detiene la sirena disuasoria
 */
export function detenerSirena() {
  sirenaSonando = false;
  if (sirenInterval) {
    clearInterval(sirenInterval);
    sirenInterval = null;
  }
  if (sirenOsc) {
    try {
      sirenOsc.stop();
      sirenOsc.disconnect();
    } catch (e) {}
    sirenOsc = null;
  }
}

/**
 * Inicia el timbre de llamada entrante simulada (dual tone 440/480 Hz)
 */
export function iniciarTimbreLlamada() {
  const ctx = getAudioContext();
  if (!ctx || ringtoneSonando) return;
  ringtoneSonando = true;

  function ringCycle() {
    if (!ringtoneSonando) return;
    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(440, now);
      osc2.frequency.setValueAtTime(480, now);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.setValueAtTime(0.12, now + 1.8);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 2.0);
      osc2.stop(now + 2.0);
    } catch (e) {}
  }

  ringCycle();
  ringtoneInterval = setInterval(ringCycle, 3800);
}

/**
 * Detiene el timbre de llamada simulada
 */
export function detenerTimbreLlamada() {
  ringtoneSonando = false;
  if (ringtoneInterval) {
    clearInterval(ringtoneInterval);
    ringtoneInterval = null;
  }
}

if (typeof window !== 'undefined') {
  window.iniciarSirena = iniciarSirena;
  window.detenerSirena = detenerSirena;
  window.iniciarTimbreLlamada = iniciarTimbreLlamada;
  window.detenerTimbreLlamada = detenerTimbreLlamada;
}
