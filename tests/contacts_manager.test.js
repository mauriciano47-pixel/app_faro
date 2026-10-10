import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizarTelefono, FAROS_DEFAULT } from '../js/contactsManager.js';

test('Gestión de Faros - Sanitización de Teléfonos para Enlaces y WhatsApp', () => {
  assert.equal(sanitizarTelefono("+58 414 123 4567"), "+584141234567");
  assert.equal(sanitizarTelefono("+56 9 8765 4321"), "+56987654321");
  assert.equal(sanitizarTelefono("  (0212) 555-8899  "), "02125558899");
  assert.equal(sanitizarTelefono(""), "");
  assert.equal(sanitizarTelefono(null), "");
});

test('Gestión de Faros - Integridad de Contactos Predeterminados', () => {
  assert.equal(FAROS_DEFAULT.length, 3);
  FAROS_DEFAULT.forEach(faro => {
    assert.ok(faro.id);
    assert.ok(faro.nombre);
    assert.ok(faro.telefono);
    assert.ok(faro.emoji);
    assert.equal(faro.fijo, true);
  });
});
