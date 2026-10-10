// Módulo de Gestión Dinámica de Faros (Contactos de Confianza) para Faro App

export const FAROS_STORAGE_KEY = 'faro_contactos_v1';

export const FAROS_DEFAULT = [
  { id: 'faro-1', nombre: 'Mamá · Elena', telefono: '+58 414 123 4567', emoji: '👩', rol: 'Mamá', fijo: true },
  { id: 'faro-2', nombre: 'Sofía · Amiga', telefono: '+58 412 987 6543', emoji: '👧', rol: 'Amiga', fijo: true },
  { id: 'faro-3', nombre: 'Pablo · Hermano', telefono: '+58 416 555 8899', emoji: '👦', rol: 'Hermano', fijo: true },
];

/**
 * Normaliza y limpia una cadena de teléfono para enlaces tel: y WhatsApp
 * @param {string} tel 
 * @returns {string}
 */
export function sanitizarTelefono(tel) {
  if (typeof tel !== 'string') return '';
  return tel.replace(/[^\d+]/g, '');
}

/**
 * Obtiene la lista de Faros almacenados o retorna los valores predeterminados
 * @returns {Array<{ id: string, nombre: string, telefono: string, emoji: string, rol: string, fijo: boolean }>}
 */
export function obtenerFaros() {
  if (typeof localStorage === 'undefined') return FAROS_DEFAULT;
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

/**
 * Guarda la lista de Faros en almacenamiento local y refresca la UI
 * @param {Array<object>} faros 
 */
export function guardarFaros(faros) {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(FAROS_STORAGE_KEY, JSON.stringify(faros));
    } catch (e) {
      console.error('Error al guardar faros:', e);
    }
  }
  renderizarFaros();
}

/**
 * Agrega un nuevo contacto a la lista de Faros
 * @param {{ nombre: string, telefono: string, emoji?: string, rol?: string }} datos 
 * @returns {object}
 */
export function agregarFaro(datos) {
  const faros = obtenerFaros();
  const nuevo = {
    id: 'faro-' + Date.now(),
    nombre: datos.nombre,
    telefono: datos.telefono,
    emoji: datos.emoji || '👤',
    rol: datos.rol || 'Contacto',
    fijo: false
  };
  faros.push(nuevo);
  guardarFaros(faros);
  return nuevo;
}

/**
 * Elimina un Faro por su identificador
 * @param {string} id 
 * @returns {boolean}
 */
export function eliminarFaro(id) {
  let faros = obtenerFaros();
  const inicial = faros.length;
  faros = faros.filter(f => f.id !== id);
  if (faros.length < inicial) {
    guardarFaros(faros);
    if (typeof window.mostrarToast === 'function') {
      window.mostrarToast('🗑️', 'Faro eliminado');
    }
    return true;
  }
  return false;
}

/**
 * Renderiza la lista de Faros en el DOM
 */
export function renderizarFaros() {
  if (typeof document === 'undefined') return;
  const container = document.getElementById('faro-list-container');
  if (!container) return;

  const faros = obtenerFaros();
  container.textContent = '';

  faros.forEach((faro) => {
    const card = document.createElement('div');
    card.className = 'faro-card';

    const avatar = document.createElement('div');
    avatar.className = 'contact-avatar';
    avatar.style.cssText = 'width:46px;height:46px;font-size:20px;flex-shrink:0;background:linear-gradient(135deg, #5b21b6, #7c3aed);';
    avatar.textContent = faro.emoji || '👤';

    const info = document.createElement('div');
    info.className = 'faro-info';
    const nameEl = document.createElement('div');
    nameEl.className = 'faro-name';
    nameEl.textContent = faro.nombre;
    const phoneEl = document.createElement('div');
    phoneEl.className = 'faro-phone';
    phoneEl.textContent = faro.telefono;
    info.appendChild(nameEl);
    info.appendChild(phoneEl);

    const actions = document.createElement('div');
    actions.className = 'faro-actions';

    const callLink = document.createElement('a');
    callLink.href = `tel:${sanitizarTelefono(faro.telefono)}`;
    callLink.className = 'faro-action-icon faro-call';
    callLink.title = 'Llamar';
    callLink.innerHTML = '<svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.38C1.58 2.3 2.36 1.32 3.44 1H6a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 8.91A16 16 0 0 0 15 16.91l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>';
    actions.appendChild(callLink);

    if (!faro.fijo) {
      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'faro-action-icon faro-delete';
      delBtn.title = 'Eliminar';
      delBtn.onclick = () => eliminarFaro(faro.id);
      delBtn.innerHTML = '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
      actions.appendChild(delBtn);
    } else {
      const badge = document.createElement('div');
      badge.className = 'faro-badge';
      badge.innerHTML = '<svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Activo';
      actions.appendChild(badge);
    }

    card.appendChild(avatar);
    card.appendChild(info);
    card.appendChild(actions);
    container.appendChild(card);
  });

  const farosValEl = document.getElementById('faros-value');
  if (farosValEl) farosValEl.textContent = faros.length;

  const homeStatusDetail = document.getElementById('home-status-detail');
  if (homeStatusDetail) {
    homeStatusDetail.textContent = `Sin rutas activas · Faros disponibles: ${faros.length}`;
  }
}

/**
 * Abre el modal para registrar un nuevo Faro
 */
export function abrirModalFaro() {
  if (typeof document === 'undefined') return;
  const modal = document.getElementById('modal-add-faro');
  if (modal) modal.classList.add('active');
}

/**
 * Cierra el modal de nuevo Faro y limpia el formulario
 */
export function cerrarModalFaro() {
  if (typeof document === 'undefined') return;
  const modal = document.getElementById('modal-add-faro');
  if (modal) modal.classList.remove('active');
  const form = document.getElementById('form-add-faro');
  if (form) form.reset();
}

/**
 * Procesa el envío del formulario para agregar Faro
 * @param {Event} e 
 */
export function guardarNuevoFaro(e) {
  if (e && e.preventDefault) e.preventDefault();
  if (typeof document === 'undefined') return;

  const name = document.getElementById('faro-input-name')?.value.trim();
  const rel = document.getElementById('faro-input-rel')?.value.trim();
  const phone = document.getElementById('faro-input-phone')?.value.trim();
  const emoji = document.querySelector('input[name="faro-emoji"]:checked')?.value || '👤';

  if (!name || !phone) {
    if (typeof window.mostrarToast === 'function') {
      window.mostrarToast('⚠️', 'Por favor ingresa nombre y teléfono');
    }
    return;
  }

  agregarFaro({
    nombre: `${name} · ${rel || 'Contacto'}`,
    telefono: phone,
    emoji: emoji,
    rol: rel
  });

  cerrarModalFaro();
  if (typeof window.mostrarToast === 'function') {
    window.mostrarToast('🌟', `¡${name} agregado a tus Faros!`);
  }
}

if (typeof window !== 'undefined') {
  window.obtenerFaros = obtenerFaros;
  window.guardarFaros = guardarFaros;
  window.renderizarFaros = renderizarFaros;
  window.abrirModalFaro = abrirModalFaro;
  window.cerrarModalFaro = cerrarModalFaro;
  window.guardarNuevoFaro = guardarNuevoFaro;
  window.eliminarFaro = eliminarFaro;
}
