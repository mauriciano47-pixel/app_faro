/**
 * FARO — Guardián de Contratos en Tiempo de Ejecución (Zero-Trust Runtime I/O)
 * Valida y sanitiza esquemas de entrada/salida (Contactos SOS, Coordenadas GPS,
 * PIN de Seguridad y Almacenamiento Local) en tiempo de ejecución.
 */

export function clampFiniteNumber(val, fallback, min, max) {
  const num = typeof val === 'number' ? val : Number(val);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, num));
}

export function sanitizeStringField(val, fallback, maxLength = 250) {
  if (typeof val !== 'string') return fallback;
  const trimmed = val.trim();
  if (!trimmed) return fallback;
  return trimmed.slice(0, maxLength);
}

export function validateContract(raw, validator) {
  try {
    return validator(raw);
  } catch (err) {
    return {
      valid: false,
      data: null,
      errors: [err instanceof Error ? err.message : 'Unknown runtime contract error']
    };
  }
}

export function sanitizeAndValidateContact(rawInput) {
  const raw = (typeof rawInput === 'object' && rawInput !== null ? rawInput : {});
  const errors = [];

  const name = sanitizeStringField(raw.name, 'Contacto de Emergencia', 80);
  const rawPhone = String(raw.phone || '').replace(/[^\d+]/g, '');

  if (rawPhone.length < 8) {
    errors.push('Número de teléfono inválido (mínimo 8 dígitos)');
  }

  const phone = rawPhone || '+56900000000';
  const relation = sanitizeStringField(raw.relation, 'Familiar', 40);

  return {
    valid: errors.length === 0,
    data: { name, phone, relation },
    errors
  };
}

export function sanitizeAndValidateCoordinates(lat, lon) {
  const cleanLat = clampFiniteNumber(lat, 0, -90, 90);
  const cleanLon = clampFiniteNumber(lon, 0, -180, 180);

  const isValid = Number.isFinite(Number(lat)) && Number.isFinite(Number(lon)) &&
                  lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;

  return {
    valid: isValid,
    data: { lat: cleanLat, lon: cleanLon },
    errors: isValid ? [] : ['Coordenadas geográficas fuera de rango WGS84']
  };
}

export function sanitizeAndValidatePin(pin) {
  const str = String(pin || '').trim();
  const isValid = /^\d{4}$/.test(str);
  return {
    valid: isValid,
    data: isValid ? str : '0000',
    errors: isValid ? [] : ['El PIN de seguridad debe contener exactamente 4 dígitos numéricos']
  };
}
