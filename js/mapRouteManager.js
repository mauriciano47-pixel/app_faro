// Módulo de Mapa y Seguimiento de Ruta Segura para Faro App

export const ORIGEN_DEMO = [10.4806, -66.9036];
export const DESTINO_DEMO = [10.4892, -66.8945];

/**
 * Genera puntos interpolados entre dos coordenadas para simular avance en ruta
 * @param {[number, number]} p1 
 * @param {[number, number]} p2 
 * @param {number} pasos 
 * @returns {Array<[number, number]>}
 */
export function interpolar(p1, p2, pasos) {
  const pts = [];
  for (let i = 0; i <= pasos; i++) {
    const t = i / pasos;
    pts.push([
      Number((p1[0] + (p2[0] - p1[0]) * t).toFixed(6)),
      Number((p1[1] + (p2[1] - p1[1]) * t).toFixed(6)),
    ]);
  }
  return pts;
}

export const RUTA_COMPLETA = interpolar(ORIGEN_DEMO, DESTINO_DEMO, 60);

export let pasoActual = 10;
export let modoGPSReal = false;
export let ubicacionActual = { lat: 10.4806, lng: -66.9036 };

let mapaIniciado = false;
let mapa = null;
let marcadorUsuaria = null;
let lineaRuta = null;
let simInterval = null;
let marcadorGPSReal = null;

/**
 * Genera un enlace de Google Maps con las coordenadas dadas
 * @param {number} lat 
 * @param {number} lng 
 * @returns {string}
 */
export function generarEnlaceGoogleMaps(lat, lng) {
  const la = Number(lat).toFixed(6);
  const lo = Number(lng).toFixed(6);
  return `https://maps.google.com/?q=${la},${lo}`;
}

/**
 * Inicializa el mapa Leaflet con proveedor oscuro ESRI y fallback OSM
 */
export function inicializarMapa() {
  if (mapaIniciado) return;
  if (typeof L === 'undefined' || typeof document === 'undefined') return;

  const mapContainer = document.getElementById('mapa-ruta');
  if (!mapContainer) return;

  mapaIniciado = true;

  try {
    mapa = L.map('mapa-ruta', {
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      scrollWheelZoom: false,
    }).setView(RUTA_COMPLETA[pasoActual], 15);

    const capaMapaOscuro = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri',
      maxZoom: 19,
      maxNativeZoom: 16,
    });

    capaMapaOscuro.on('tileerror', function() {
      if (!mapa._hasOsmFallback) {
        mapa._hasOsmFallback = true;
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap'
        }).addTo(mapa);
      }
    });

    capaMapaOscuro.addTo(mapa);
  } catch (err) {
    console.error('Error al inicializar Leaflet:', err);
    return;
  }

  const iconoUsuaria = L.divIcon({
    html: '<div style="width:28px;height:28px;background:var(--accent-teal);border-radius:50%;border:3px solid white;box-shadow:0 0 12px rgba(0,229,200,0.8);display:flex;align-items:center;justify-content:center;font-size:12px;">🚶‍♀️</div>',
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

  const iconoDestino = L.divIcon({
    html: '<div style="width:32px;height:32px;background:var(--accent-coral);border-radius:50%;border:3px solid white;box-shadow:0 0 14px rgba(255,79,114,0.7);display:flex;align-items:center;justify-content:center;font-size:14px;">🏠</div>',
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  L.polyline(RUTA_COMPLETA, {
    color: 'rgba(255,255,255,0.15)',
    weight: 4,
    dashArray: '8,6',
  }).addTo(mapa);

  lineaRuta = L.polyline(RUTA_COMPLETA.slice(0, pasoActual + 1), {
    color: '#00e5c8',
    weight: 5,
    lineCap: 'round',
  }).addTo(mapa);

  marcadorUsuaria = L.marker(RUTA_COMPLETA[pasoActual], { icon: iconoUsuaria }).addTo(mapa);
  L.marker(DESTINO_DEMO, { icon: iconoDestino }).addTo(mapa);

  iniciarSimulacion();
}

/**
 * Inicia la animación simulada de avance en ruta
 */
export function iniciarSimulacion() {
  if (simInterval) clearInterval(simInterval);
  simInterval = setInterval(() => {
    if (pasoActual >= RUTA_COMPLETA.length - 1) {
      clearInterval(simInterval);
      return;
    }
    pasoActual++;
    const pos = RUTA_COMPLETA[pasoActual];
    if (marcadorUsuaria) marcadorUsuaria.setLatLng(pos);
    if (lineaRuta) lineaRuta.addLatLng(pos);
    if (mapa) mapa.panTo(pos, { animate: true, duration: 1.5 });

    const progreso = pasoActual / (RUTA_COMPLETA.length - 1);
    const distRestante = (1.4 * (1 - progreso)).toFixed(1);
    const etaRestante = Math.max(1, Math.round(18 * (1 - progreso)));

    const distVal = document.getElementById('dist-value');
    const etaVal = document.getElementById('eta-value');
    if (distVal) distVal.textContent = distRestante;
    if (etaVal) etaVal.textContent = etaRestante + "'";
  }, 2500);
}

/**
 * Detiene la simulación de movimiento
 */
export function detenerSimulacion() {
  if (simInterval) {
    clearInterval(simInterval);
    simInterval = null;
  }
}

/**
 * Actualiza la vista del mapa con coordenadas reales del dispositivo
 */
export function actualizarMapaGPSReal() {
  if (!mapa || typeof L === 'undefined') return;
  const latlng = [ubicacionActual.lat, ubicacionActual.lng];
  mapa.setView(latlng, 16);

  const iconoGPS = L.divIcon({
    html: '<div style="width:32px;height:32px;background:var(--accent-teal);border-radius:50%;border:3px solid white;box-shadow:0 0 16px rgba(0,229,200,0.9);display:flex;align-items:center;justify-content:center;font-size:15px;">📍</div>',
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  if (!marcadorGPSReal) {
    marcadorGPSReal = L.marker(latlng, { icon: iconoGPS }).addTo(mapa);
  } else {
    marcadorGPSReal.setLatLng(latlng);
  }

  const distVal = document.getElementById('dist-value');
  const etaVal = document.getElementById('eta-value');
  if (distVal) distVal.textContent = 'GPS';
  if (etaVal) etaVal.textContent = 'En vivo';
}

/**
 * Alterna entre modo GPS Real y Demo simulado
 */
export function toggleModoGPS() {
  if (!modoGPSReal) {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      if (typeof window.mostrarToast === 'function') {
        window.mostrarToast('⚠️', 'Geolocalización no soportada en este navegador');
      }
      return;
    }
    if (typeof window.mostrarToast === 'function') {
      window.mostrarToast('🛰️', 'Buscando satélites GPS...');
    }
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

        detenerSimulacion();
        actualizarMapaGPSReal();
        if (typeof window.mostrarToast === 'function') {
          window.mostrarToast('📍', 'Ubicación GPS real sincronizada');
        }
      },
      (err) => {
        console.warn('Error GPS:', err);
        if (typeof window.mostrarToast === 'function') {
          window.mostrarToast('⚠️', 'No se pudo obtener GPS. Continuando en modo simulación.');
        }
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
    if (typeof window.mostrarToast === 'function') {
      window.mostrarToast('🏙️', 'Modo simulación demo activado');
    }
  }
}

if (typeof window !== 'undefined') {
  window.inicializarMapa = inicializarMapa;
  window.toggleModoGPS = toggleModoGPS;
  window.actualizarMapaGPSReal = actualizarMapaGPSReal;
}
