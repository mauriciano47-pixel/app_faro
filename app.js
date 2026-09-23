/* =========================================
   FARO APP – Lógica Interactiva (app.js)
   ========================================= */

// ─── UTILIDADES ──────────────────────────────────────────────────────────────

/** Genera estrellas aleatorias en el fondo */
function generarEstrellas() {
  const container = document.getElementById('stars-container');
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
function actualizarReloj() {
  const now = new Date();
  const hours = now.getHours();
  const h = String(hours).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  document.getElementById('status-clock').textContent = `${h}:${m}`;

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
function mostrarToast(icono, mensaje) {
  const toast = document.getElementById('toast');
  document.getElementById('toast-icon').textContent = icono;
  document.getElementById('toast-text').textContent = mensaje;
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

function irA(screenId) {
  // Si vamos a la ruta, inicializamos el mapa
  if (screenId === 'screen-ruta' && !mapaIniciado) {
    setTimeout(inicializarMapa, 100);
  }

  // Ocultar todas las pantallas
  SCREENS.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });

  // Mostrar la pantalla objetivo
  const target = document.getElementById(screenId);
  if (target) target.classList.add('active');

  // Actualizar barra de navegación
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navId = NAV_MAP[screenId];
  if (navId) document.getElementById(navId)?.classList.add('active');
}

// ─── MOTOR DE AUDIO SINTETIZADO (WEB AUDIO API) ──────────────────────────────
let audioCtx = null;
let sirenOsc = null;
let sirenGain = null;
let sirenInterval = null;
let sirenaSonando = false;

let ringtoneInterval = null;
let ringtoneSonando = false;

function getAudioContext() {
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

function iniciarSirena() {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (sirenaSonando) return;
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

function detenerSirena() {
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

function iniciarTimbreLlamada() {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ringtoneSonando) return;
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

function detenerTimbreLlamada() {
  ringtoneSonando = false;
  if (ringtoneInterval) {
    clearInterval(ringtoneInterval);
    ringtoneInterval = null;
  }
}

// ─── BOTÓN S.O.S. ─────────────────────────────────────────────────────────────

let sosPressTimer = null;
let sosCountdownTimer = null;
let sosActive = false;

function activarSOS() {
  if (sosActive) return;
  const overlay = document.getElementById('sos-overlay');
  if (overlay) overlay.classList.add('active');
  sosActive = true;
  let cuenta = 5;

  const countdownEl = document.getElementById('sos-countdown');
  const titleEl = document.querySelector('.sos-active-title');
  const subEl = document.getElementById('sos-active-sub');

  if (countdownEl) {
    countdownEl.style.display = '';
    countdownEl.textContent = cuenta;
  }
  if (titleEl) titleEl.textContent = '¡S.O.S. ACTIVADO!';
  if (subEl) subEl.innerHTML = 'Transmitiendo auxilio automático en <b style="color:var(--accent-coral)">5 segundos</b>...<br/>Toca cancelar si fue un error.';

  // Iniciar sirena disuasoria automáticamente durante la cuenta de emergencia
  iniciarSirena();

  // Vibración háptica continua si el dispositivo lo soporta
  if (navigator.vibrate) {
    try { navigator.vibrate([200, 100, 200, 100, 400]); } catch(e){}
  }

  sosCountdownTimer = setInterval(() => {
    cuenta--;
    if (countdownEl) countdownEl.textContent = cuenta;
    if (subEl && cuenta > 0) {
      subEl.innerHTML = `Transmitiendo auxilio automático en <b style="color:var(--accent-coral)">${cuenta} segundos</b>...<br/>Toca cancelar si fue un error.`;
    }

    if (cuenta <= 0) {
      clearInterval(sosCountdownTimer);
      sosCountdownTimer = null;
      if (countdownEl) countdownEl.style.display = 'none';
      if (titleEl) titleEl.textContent = '¡S.O.S. TRANSMITIDO!';
      if (subEl) subEl.innerHTML = '¡Alerta enviada a tus Faros de confianza con tu geolocalización precisa!<br/>La ayuda está en camino.';
      mostrarToast('🚨', '¡Alerta enviada! Faros notificados con tu ubicación');
      
      // Auto-enviar alerta de WhatsApp a los contactos de confianza
      enviarAlertaWhatsApp();
    }
  }, 1000);
}

function cancelarSOS() {
  if (sosCountdownTimer) {
    clearInterval(sosCountdownTimer);
    sosCountdownTimer = null;
  }
  detenerSirena();
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
  if (subEl) subEl.innerHTML = 'Tu ubicación fue enviada a tus Faros de confianza.<br/>Llegará ayuda de inmediato.';

  sosActive = false;
  mostrarToast('✅', 'Alerta cancelada. ¡Estás a salvo!');
}

// ─── BOTONES RÁPIDOS DEL HOME ─────────────────────────────────────────────────

function activarAlarma() {
  const card = document.querySelectorAll('.quick-card.alarma')[0];
  if (sirenaSonando) {
    detenerSirena();
    mostrarToast('🔇', 'Sirena disuasoria apagada');
    if (card) {
      card.style.borderColor = '';
      card.style.background = '';
    }
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

function toggleModoDiscreto() {
  const card = document.querySelectorAll('.quick-card.discreta')[0];
  const statusDot = document.querySelector('.status-dot');
  const statusTitle = document.querySelector('.status-title');
  const statusSub = document.querySelector('.status-sub');

  modoDiscretoActivo = !modoDiscretoActivo;

  if (modoDiscretoActivo) {
    detenerSirena();
    if (navigator.vibrate) {
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
  }
}

function modoDiscreto() {
  toggleModoDiscreto();
}

// ─── MAPA LEAFLET (RUTA SEGURA) ───────────────────────────────────────────────

let mapaIniciado = false;
let mapa = null;
let marcadorUsuaria = null;
let lineaRuta = null;
let simInterval = null;

// Coordenadas simuladas de Caracas, Venezuela
const ORIGEN = [10.4806, -66.9036];
const DESTINO = [10.4892, -66.8945];

// Genera puntos interpolados para la simulación
function interpolar(p1, p2, pasos) {
  const pts = [];
  for (let i = 0; i <= pasos; i++) {
    const t = i / pasos;
    pts.push([
      p1[0] + (p2[0] - p1[0]) * t,
      p1[1] + (p2[1] - p1[1]) * t,
    ]);
  }
  return pts;
}

const RUTA_COMPLETA = interpolar(ORIGEN, DESTINO, 60);
let pasoActual = 10; // Empieza a 1/6 del camino (ya caminó un rato)

// Variables para geolocalización real
let modoGPSReal = false;
let ubicacionActual = { lat: 10.4806, lng: -66.9036 };
let marcadorGPSReal = null;

function inicializarMapa() {
  if (mapaIniciado) return;
  if (typeof L === 'undefined') {
    console.warn('Leaflet no está cargado aún, esperando...');
    setTimeout(inicializarMapa, 200);
    return;
  }
  mapaIniciado = true;

  try {
    mapa = L.map('mapa-ruta', {
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      scrollWheelZoom: false,
    }).setView(RUTA_COMPLETA[pasoActual], 15);

    // Proveedor nocturno de alta disponibilidad 100% libre sin API key (ESRI World Dark Gray Base + OSM Fallback)
    const capaMapaOscuro = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
      maxZoom: 19,
      maxNativeZoom: 16,
    });

    capaMapaOscuro.on('tileerror', function() {
      if (!mapa._hasOsmFallback) {
        mapa._hasOsmFallback = true;
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(mapa);
      }
    });

    capaMapaOscuro.addTo(mapa);
  } catch (err) {
    console.error('Error al inicializar Leaflet:', err);
    return;
  }

  // Icono personalizado para la usuaria
  const iconoUsuaria = L.divIcon({
    html: `<div style="
      width:28px;height:28px;
      background:var(--accent-teal);
      border-radius:50%;
      border:3px solid white;
      box-shadow:0 0 12px rgba(0,229,200,0.8);
      display:flex;align-items:center;justify-content:center;
      font-size:12px;
    ">🚶‍♀️</div>`,
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

  // Icono de destino
  const iconoDestino = L.divIcon({
    html: `<div style="
      width:32px;height:32px;
      background:var(--accent-coral);
      border-radius:50%;
      border:3px solid white;
      box-shadow:0 0 14px rgba(255,79,114,0.7);
      display:flex;align-items:center;justify-content:center;
      font-size:14px;
    ">🏠</div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  // Línea de ruta completa (gris)
  L.polyline(RUTA_COMPLETA, {
    color: 'rgba(255,255,255,0.15)',
    weight: 4,
    dashArray: '8,6',
  }).addTo(mapa);

  // Línea recorrida (teal)
  lineaRuta = L.polyline(RUTA_COMPLETA.slice(0, pasoActual + 1), {
    color: '#00e5c8',
    weight: 5,
    lineCap: 'round',
  }).addTo(mapa);

  // Marcadores
  marcadorUsuaria = L.marker(RUTA_COMPLETA[pasoActual], { icon: iconoUsuaria }).addTo(mapa);
  L.marker(DESTINO, { icon: iconoDestino }).addTo(mapa);

  // Iniciar simulación de movimiento
  iniciarSimulacion();
}

function iniciarSimulacion() {
  if (simInterval) clearInterval(simInterval);
  simInterval = setInterval(() => {
    if (pasoActual >= RUTA_COMPLETA.length - 1) {
      clearInterval(simInterval);
      return;
    }
    pasoActual++;
    const pos = RUTA_COMPLETA[pasoActual];
    marcadorUsuaria.setLatLng(pos);
    lineaRuta.addLatLng(pos);
    mapa.panTo(pos, { animate: true, duration: 1.5 });

    // Actualizar stats
    const progreso = pasoActual / (RUTA_COMPLETA.length - 1);
    const distRestante = (1.4 * (1 - progreso)).toFixed(1);
    const etaRestante = Math.max(1, Math.round(18 * (1 - progreso)));
    document.getElementById('dist-value').textContent = distRestante;
    document.getElementById('eta-value').textContent = etaRestante + "'";
  }, 2500);
}

// Alternar entre Demo y GPS Real
function toggleModoGPS() {
  if (!modoGPSReal) {
    if (!navigator.geolocation) {
      mostrarToast('⚠️', 'Geolocalización no soportada en este navegador');
      return;
    }
    mostrarToast('🛰️', 'Buscando satélites GPS...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        modoGPSReal = true;
        ubicacionActual.lat = pos.coords.latitude;
        ubicacionActual.lng = pos.coords.longitude;

        const btnText = document.getElementById('gps-mode-text');
        const btnIcon = document.getElementById('gps-mode-icon');
        const btn = document.getElementById('gps-mode-btn');
        if (btnText) btnText.textContent = 'Demo';
        if (btnIcon) btnIcon.textContent = '🏙️';
        if (btn) btn.classList.add('active');

        if (simInterval) clearInterval(simInterval);
        actualizarMapaGPSReal();
        mostrarToast('📍', 'Ubicación GPS real sincronizada');
      },
      (err) => {
        console.warn('Error GPS:', err);
        mostrarToast('⚠️', 'No se pudo obtener GPS. Continuando en modo simulación.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  } else {
    modoGPSReal = false;
    const btnText = document.getElementById('gps-mode-text');
    const btnIcon = document.getElementById('gps-mode-icon');
    const btn = document.getElementById('gps-mode-btn');
    if (btnText) btnText.textContent = 'GPS Real';
    if (btnIcon) btnIcon.textContent = '🛰️';
    if (btn) btn.classList.remove('active');

    if (marcadorGPSReal && mapa) {
      mapa.removeLayer(marcadorGPSReal);
      marcadorGPSReal = null;
    }
    if (mapa) {
      mapa.setView(RUTA_COMPLETA[pasoActual], 15);
    }
    iniciarSimulacion();
    mostrarToast('🏙️', 'Modo simulación demo activado');
  }
}

function actualizarMapaGPSReal() {
  if (!mapa || typeof L === 'undefined') return;
  const latlng = [ubicacionActual.lat, ubicacionActual.lng];
  mapa.setView(latlng, 16);

  const iconoGPS = L.divIcon({
    html: `<div style="
      width:32px;height:32px;
      background:var(--accent-teal);
      border-radius:50%;
      border:3px solid white;
      box-shadow:0 0 16px rgba(0,229,200,0.9);
      display:flex;align-items:center;justify-content:center;
      font-size:15px;
    ">📍</div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  if (!marcadorGPSReal) {
    marcadorGPSReal = L.marker(latlng, { icon: iconoGPS }).addTo(mapa);
  } else {
    marcadorGPSReal.setLatLng(latlng);
  }

  // Actualizar stats simulados
  document.getElementById('dist-value').textContent = 'GPS';
  document.getElementById('eta-value').textContent = 'En vivo';
}

// Alerta de auxilio con coordenadas reales o actuales a WhatsApp
function enviarAlertaWhatsApp() {
  const faros = typeof obtenerFaros === 'function' ? obtenerFaros() : [];
  const destino = faros.length > 0 && faros[0].telefono ? faros[0].telefono.replace(/[^\d+]/g, '') : '';
  const lat = ubicacionActual.lat.toFixed(6);
  const lng = ubicacionActual.lng.toFixed(6);
  const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`;
  const nombreEl = document.getElementById('greeting-name');
  const nombreUsuaria = nombreEl ? nombreEl.textContent.replace(/[^\w\s]/gi, '').trim() : 'Carla';

  const mensaje = encodeURIComponent(
    `🚨 ¡ALERTA S.O.S. DE ${nombreUsuaria.toUpperCase()} (FARO)!\n` +
    `Necesito ayuda urgente. Mi ubicación en tiempo real es:\n` +
    `${mapsUrl}\n\n` +
    `Por favor comunícate conmigo de inmediato.`
  );

  let whatsappUrl = `https://api.whatsapp.com/send?text=${mensaje}`;
  if (destino && destino.length >= 8) {
    whatsappUrl += `&phone=${destino}`;
  }

  const btnWhatsApp = document.getElementById('sos-whatsapp-btn');
  if (btnWhatsApp) {
    btnWhatsApp.href = whatsappUrl;
  }

  try {
    window.open(whatsappUrl, '_blank');
  } catch (e) {
    console.warn('Popup bloqueado, el botón en pantalla ya contiene el enlace:', e);
  }
  mostrarToast('💬', 'Alerta preparada · Abriendo WhatsApp...');
}

// ─── TEMPORIZADOR DE SEGURIDAD ────────────────────────────────────────────────

const TIEMPO_TOTAL_SEG = 20 * 60; // 20 minutos
let tiempoRestante = TIEMPO_TOTAL_SEG;
let timerRunning = true;
let timerInterval = null;

function formatTiempo(segs) {
  const m = Math.floor(segs / 60).toString().padStart(2, '0');
  const s = (segs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function actualizarTimerUI() {
  document.getElementById('timer-display').textContent = formatTiempo(tiempoRestante);
  const pct = (tiempoRestante / TIEMPO_TOTAL_SEG) * 100;
  document.getElementById('timer-progress').style.width = pct + '%';

  // Cambiar color según urgencia
  const fill = document.getElementById('timer-progress');
  if (pct <= 20) {
    fill.style.background = 'linear-gradient(90deg, var(--accent-coral), #c9003a)';
    document.getElementById('timer-display').style.backgroundImage =
      'linear-gradient(90deg, var(--accent-coral), #c9003a)';
  } else if (pct <= 50) {
    fill.style.background = 'linear-gradient(90deg, var(--accent-amber), #d97706)';
    document.getElementById('timer-display').style.backgroundImage =
      'linear-gradient(90deg, var(--accent-amber), #d97706)';
  }
}

function tickTimer() {
  if (!timerRunning) return;
  tiempoRestante--;
  actualizarTimerUI();
  if (tiempoRestante <= 0) {
    clearInterval(timerInterval);
    // Simular alerta automática
    mostrarToast('🚨', '¡Tiempo agotado! Alertando a tus Faros automáticamente');
    document.getElementById('timer-status-badge').textContent = '¡ALERTANDO!';
    document.getElementById('timer-status-badge').style.color = 'var(--accent-coral)';
    activarSOS();
  }
}

function toggleTimer() {
  timerRunning = !timerRunning;
  const btn = document.getElementById('timer-toggle-btn');
  if (timerRunning) {
    btn.innerHTML = `<svg viewBox="0 0 24 24" style="width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:2.5;"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pausar`;
    document.getElementById('timer-status-badge').textContent = 'ACTIVO';
    document.getElementById('timer-status-badge').style.color = 'var(--accent-teal)';
    mostrarToast('▶️', 'Temporizador reanudado');
  } else {
    btn.innerHTML = `<svg viewBox="0 0 24 24" style="width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:2.5;"><polygon points="5 3 19 12 5 21 5 3"/></svg> Reanudar`;
    document.getElementById('timer-status-badge').textContent = 'PAUSADO';
    document.getElementById('timer-status-badge').style.color = 'var(--accent-amber)';
    mostrarToast('⏸', 'Temporizador pausado');
  }
}

function resetTimer() {
  tiempoRestante = TIEMPO_TOTAL_SEG;
  timerRunning = true;
  document.getElementById('timer-status-badge').textContent = 'ACTIVO';
  document.getElementById('timer-status-badge').style.color = 'var(--accent-teal)';
  document.getElementById('timer-display').style.backgroundImage =
    'linear-gradient(90deg, var(--accent-teal), #00b09b)';
  document.getElementById('timer-progress').style.background =
    'linear-gradient(90deg, var(--accent-teal), #00b09b)';
  const btn = document.getElementById('timer-toggle-btn');
  btn.innerHTML = `<svg viewBox="0 0 24 24" style="width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:2.5;"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pausar`;
  actualizarTimerUI();
  mostrarToast('🔄', 'Temporizador reiniciado a 20 minutos');
}

function confirmarLlegada() {
  clearInterval(timerInterval);
  clearInterval(simInterval);
  timerRunning = false;
  mostrarToast('🏠', '¡Llegaste sana y salva! Faros notificados.');
  document.getElementById('timer-status-badge').textContent = 'COMPLETADO';
  document.getElementById('timer-status-badge').style.color = 'var(--accent-teal)';
  // Actualizar home
  document.getElementById('home-status-title').textContent = 'Llegaste sana y salva 🏠';
  document.getElementById('home-status-detail').textContent = 'Ruta finalizada · Todos tus Faros fueron notificados';
  setTimeout(() => irA('screen-home'), 1500);
}

// ─── FALSA LLAMADA ─────────────────────────────────────────────────────────────

let delayFalsaLlamada = 0;
let falsaLlamadaTimer = null;
let callDurationInterval = null;
let callSeconds = 0;
let enLlamada = false;

function selDelay(el, segundos) {
  document.querySelectorAll('.delay-opt').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  delayFalsaLlamada = segundos;
}

function iniciarFalsaLlamada(nombre, avClass, emoji) {
  const callScreen = document.getElementById('call-screen');
  document.getElementById('call-name').textContent = nombre;
  document.getElementById('call-avatar-emoji').textContent = emoji;
  document.getElementById('call-status-text').textContent =
    delayFalsaLlamada === 0 ? 'Llamada entrante…' : `Llamará en ${delayFalsaLlamada}s…`;
  document.getElementById('call-actions').style.display = 'flex';
  document.getElementById('call-end-actions').style.display = 'none';
  document.getElementById('call-timer').style.display = 'none';
  callScreen.classList.add('active');
  callSeconds = 0;
  enLlamada = false;

  if (delayFalsaLlamada > 0) {
    mostrarToast('📱', `Llamada programada en ${delayFalsaLlamada} segundos`);
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    falsaLlamadaTimer = setTimeout(() => {
      document.getElementById('call-status-text').textContent = 'Llamada entrante…';
      iniciarTimbreLlamada();
      if (navigator.vibrate) navigator.vibrate([500, 200, 500, 200, 500]);
    }, delayFalsaLlamada * 1000);
  } else {
    iniciarTimbreLlamada();
    if (navigator.vibrate) navigator.vibrate([500, 200, 500, 200, 500]);
  }
}

function contestarLlamada() {
  detenerTimbreLlamada();
  enLlamada = true;
  document.getElementById('call-status-text').textContent = 'En llamada…';
  document.getElementById('call-actions').style.display = 'none';
  document.getElementById('call-end-actions').style.display = 'flex';
  const timerEl = document.getElementById('call-timer');
  timerEl.style.display = 'block';
  timerEl.textContent = '00:00';

  callDurationInterval = setInterval(() => {
    callSeconds++;
    const m = Math.floor(callSeconds / 60).toString().padStart(2, '0');
    const s = (callSeconds % 60).toString().padStart(2, '0');
    timerEl.textContent = `${m}:${s}`;
  }, 1000);
}

function colgarLlamada() {
  detenerTimbreLlamada();
  if (falsaLlamadaTimer) clearTimeout(falsaLlamadaTimer);
  if (callDurationInterval) clearInterval(callDurationInterval);
  enLlamada = false;
  document.getElementById('call-screen').classList.remove('active');
  mostrarToast('📵', 'Llamada finalizada');
}

// ─── SENSOR DE MOVIMIENTO (DETECCION DE AGITAR / SHAKE) ──────────────────────

let shakeActive = false;
let lastX = null, lastY = null, lastZ = null;
let lastTime = 0;
const SHAKE_THRESHOLD = 15; // Sensibilidad del agitar (m/s^2)
const SHAKE_LIMIT = 4;      // Cuántos movimientos bruscos consecutivos requerimos
let shakeCount = 0;
let lastShakeTime = 0;

function toggleShakeDetection(checkbox) {
  if (checkbox.checked) {
    // Si estamos en iOS 13+ solicitamos permiso explícito
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      DeviceMotionEvent.requestPermission()
        .then(permissionState => {
          if (permissionState === 'granted') {
            startShakeDetection();
            localStorage.setItem('shake_sos_enabled', 'true');
            mostrarToast('📳', 'SOS por Agitado Activado. Prueba a agitar tu celular.');
          } else {
            checkbox.checked = false;
            mostrarToast('⚠️', 'Permiso de sensores denegado.');
          }
        })
        .catch(err => {
          console.error(err);
          checkbox.checked = false;
          mostrarToast('⚠️', 'Error al solicitar permisos del sensor.');
        });
    } else {
      // Android o navegadores de escritorio (sin requerir permisos especiales de iOS)
      startShakeDetection();
      localStorage.setItem('shake_sos_enabled', 'true');
      mostrarToast('📳', 'SOS por Agitado Activado. Prueba a agitar tu celular.');
    }
  } else {
    stopShakeDetection();
    localStorage.removeItem('shake_sos_enabled');
    mostrarToast('📳', 'SOS por Agitado Desactivado.');
  }
}

function startShakeDetection() {
  if (shakeActive) return;
  shakeActive = true;
  shakeCount = 0;
  window.addEventListener('devicemotion', handleMotion, true);
}

function stopShakeDetection() {
  shakeActive = false;
  window.removeEventListener('devicemotion', handleMotion, true);
}

function handleMotion(event) {
  const acceleration = event.acceleration || event.accelerationIncludingGravity;
  if (!acceleration) return;

  const current = new Date().getTime();
  if ((current - lastTime) > 100) {
    const diffTime = current - lastTime;
    lastTime = current;

    const x = acceleration.x;
    const y = acceleration.y;
    const z = acceleration.z;

    if (lastX !== null && lastY !== null && lastZ !== null) {
      const speed = Math.abs(x + y + z - lastX - lastY - lastZ) / diffTime * 10000;

      if (speed > SHAKE_THRESHOLD) {
        const timeDiff = current - lastShakeTime;
        
        // Si el último agitar fue hace más de 1.5 segundos, reiniciamos el conteo
        if (timeDiff > 1500) {
          shakeCount = 0;
        }

        shakeCount++;
        lastShakeTime = current;

        // Feedback táctil suave para que Carla sepa que el celular está detectando el agitar
        if (navigator.vibrate) navigator.vibrate(60);

        if (shakeCount >= SHAKE_LIMIT) {
          shakeCount = 0;
          // Activar la alerta de seguridad
          activarSOS();
          // Vibración fuerte y prolongada para avisarle discretamente que se activó
          if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 500]);
        }
      }
    }

    lastX = x;
    lastY = y;
    lastZ = z;
  }
}

// ─── DETECCION SIMULADA DE BOTON FISICO (BLOQUEO/DESBLOQUEO RAPIDO) ──────────

let powerActive = false;
let visibilityTimestamps = [];

function togglePowerDetection(checkbox) {
  if (checkbox.checked) {
    startPowerDetection();
    localStorage.setItem('power_sos_enabled', 'true');
    mostrarToast('⚡', 'SOS por Botón Físico Activado. Bloquea y desbloquea rápido para probar.');
  } else {
    stopPowerDetection();
    localStorage.removeItem('power_sos_enabled');
    mostrarToast('⚡', 'SOS por Botón Físico Desactivado.');
  }
}

function startPowerDetection() {
  if (powerActive) return;
  powerActive = true;
  visibilityTimestamps = [];
  document.addEventListener('visibilitychange', handleVisibilityChange);
}

function stopPowerDetection() {
  powerActive = false;
  document.removeEventListener('visibilitychange', handleVisibilityChange);
}

function handleVisibilityChange() {
  const current = new Date().getTime();
  
  // Guardamos la marca de tiempo de cada cambio de visibilidad (apagar o encender pantalla)
  visibilityTimestamps.push(current);

  // Limpiamos marcas de tiempo de más de 4 segundos de antigüedad
  visibilityTimestamps = visibilityTimestamps.filter(t => (current - t) < 4000);

  // Cada bloqueo/desbloqueo completo representa 2 transiciones (hidden -> visible o visible -> hidden).
  // Si Carla presiona el botón Power 4 veces rápidamente:
  // Presión 1: Apaga pantalla (1)
  // Presión 2: Enciende pantalla (2)
  // Presión 3: Apaga pantalla (3)
  // Presión 4: Enciende pantalla (4)
  // Eso genera 4 transiciones rápidas de visibilidad.
  if (visibilityTimestamps.length >= 4) {
    visibilityTimestamps = []; // Reiniciamos
    
    // Si la pantalla es visible ahora, disparamos el SOS inmediatamente.
    // Si sigue apagada, se disparará al encenderse (en la siguiente transición que la haga visible).
    if (document.visibilityState === 'visible') {
      activarSOS();
      if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 500]);
    }
  }
}

// ─── GESTIÓN DINÁMICA DE FAROS (LOCALSTORAGE) ─────────────────────────────────
const FAROS_STORAGE_KEY = 'faro_contactos_v1';
const FAROS_DEFAULT = [
  { id: 'faro-1', nombre: 'Mamá · Elena', telefono: '+58 414 123 4567', emoji: '👩', rol: 'Mamá', fijo: true },
  { id: 'faro-2', nombre: 'Sofía · Amiga', telefono: '+58 412 987 6543', emoji: '👧', rol: 'Amiga', fijo: true },
  { id: 'faro-3', nombre: 'Pablo · Hermano', telefono: '+58 416 555 8899', emoji: '👦', rol: 'Hermano', fijo: true },
];

function obtenerFaros() {
  try {
    const raw = localStorage.getItem(FAROS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(FAROS_STORAGE_KEY, JSON.stringify(FAROS_DEFAULT));
      return FAROS_DEFAULT;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : FAROS_DEFAULT;
  } catch (e) {
    return FAROS_DEFAULT;
  }
}

function guardarFaros(faros) {
  try {
    localStorage.setItem(FAROS_STORAGE_KEY, JSON.stringify(faros));
  } catch (e) {
    console.error('Error al guardar faros:', e);
  }
  renderizarFaros();
}

function renderizarFaros() {
  const container = document.getElementById('faro-list-container');
  if (!container) return;

  const faros = obtenerFaros();
  container.innerHTML = '';

  faros.forEach((faro) => {
    const card = document.createElement('div');
    card.className = 'faro-card';
    card.innerHTML = `
      <div class="contact-avatar" style="width:46px;height:46px;font-size:20px;flex-shrink:0;background:linear-gradient(135deg, #5b21b6, #7c3aed);">${faro.emoji || '👤'}</div>
      <div class="faro-info">
        <div class="faro-name">${faro.nombre}</div>
        <div class="faro-phone">${faro.telefono}</div>
      </div>
      <div class="faro-actions">
        <a href="tel:${faro.telefono.replace(/\\s+/g, '')}" class="faro-action-icon faro-call" title="Llamar">
          <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.38C1.58 2.3 2.36 1.32 3.44 1H6a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 8.91A16 16 0 0 0 15 16.91l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
        </a>
        ${!faro.fijo ? `
        <button class="faro-action-icon faro-del" onclick="eliminarFaro('${faro.id}')" title="Eliminar">
          <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        ` : `
        <div class="faro-badge">
          <svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          Activo
        </div>
        `}
      </div>
    `;
    container.appendChild(card);
  });

  // Actualizar indicadores del dashboard
  const numFaros = faros.length;
  const farosValEl = document.getElementById('faros-value');
  if (farosValEl) farosValEl.textContent = numFaros;

  const homeStatusDetail = document.getElementById('home-status-detail');
  if (homeStatusDetail) {
    homeStatusDetail.textContent = `Sin rutas activas · Faros disponibles: ${numFaros}`;
  }
}

function abrirModalFaro() {
  const modal = document.getElementById('modal-add-faro');
  if (modal) modal.classList.add('active');
}

function cerrarModalFaro() {
  const modal = document.getElementById('modal-add-faro');
  if (modal) modal.classList.remove('active');
  const form = document.getElementById('form-add-faro');
  if (form) form.reset();
}

function guardarNuevoFaro(e) {
  e.preventDefault();
  const name = document.getElementById('faro-input-name').value.trim();
  const rel = document.getElementById('faro-input-rel').value.trim();
  const phone = document.getElementById('faro-input-phone').value.trim();
  const emoji = document.querySelector('input[name="faro-emoji"]:checked')?.value || '👤';

  if (!name || !phone) {
    mostrarToast('⚠️', 'Por favor ingresa nombre y teléfono');
    return;
  }

  const faros = obtenerFaros();
  const nuevoFaro = {
    id: 'faro-' + Date.now(),
    nombre: `${name} · ${rel || 'Contacto'}`,
    telefono: phone,
    emoji: emoji,
    rol: rel,
    fijo: false
  };

  faros.push(nuevoFaro);
  guardarFaros(faros);
  cerrarModalFaro();
  mostrarToast('🌟', `¡${name} agregado a tus Faros!`);
}

function eliminarFaro(id) {
  let faros = obtenerFaros();
  faros = faros.filter(f => f.id !== id);
  guardarFaros(faros);
  mostrarToast('🗑️', 'Faro eliminado');
}

// ─── INICIALIZACIÓN ───────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  generarEstrellas();

  // Reloj en tiempo real
  actualizarReloj();
  setInterval(actualizarReloj, 10000);

  // Renderizar lista dinámica de Faros desde localStorage
  renderizarFaros();

  // Temporizador de seguridad (en background)
  timerInterval = setInterval(tickTimer, 1000);
  actualizarTimerUI();

  // Cargar preferencia de agitar
  const shakeToggle = document.getElementById('shake-toggle');
  if (shakeToggle) {
    const shakeSaved = localStorage.getItem('shake_sos_enabled') === 'true';
    if (shakeSaved) {
      shakeToggle.checked = true;
      startShakeDetection();
    }
  }

  // Cargar preferencia del botón físico
  const powerToggle = document.getElementById('power-toggle');
  if (powerToggle) {
    const powerSaved = localStorage.getItem('power_sos_enabled') === 'true';
    if (powerSaved) {
      powerToggle.checked = true;
      startPowerDetection();
    }
  }

  // Soporte para lanzar el SOS de inmediato si viene del query param (Atajo de iOS)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('action') === 'sos') {
    setTimeout(activarSOS, 300);
  }

  // Inicializar mapa si ya estamos en la pantalla de ruta
  if (document.getElementById('screen-ruta').classList.contains('active')) {
    setTimeout(inicializarMapa, 100);
  }

  console.log('🔦 Faro App · v1.5.2 App Oficial Fortificada – Inicializado correctamente');
});

// ─── GESTIÓN DE INSTALACIÓN PWA (INDEPENDIENTE) ─────────────────────────────
let deferredFaroPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredFaroPrompt = e;
  const banner = document.getElementById('install-pwa-banner');
  if (banner && !window.matchMedia('(display-mode: standalone)').matches) {
    banner.style.display = 'flex';
  }
});

function instalarPwaDesdeApp() {
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

