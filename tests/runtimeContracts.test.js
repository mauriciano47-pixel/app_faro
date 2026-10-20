import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  clampFiniteNumber,
  sanitizeStringField,
  validateContract,
  sanitizeAndValidateContact,
  sanitizeAndValidateCoordinates,
  sanitizeAndValidatePin
} from '../js/runtimeContracts.js';

test('Runtime Contracts — Validación y Sanitización de Contactos', () => {
  const validContact = sanitizeAndValidateContact({
    name: '  Mamá SOS  ',
    phone: '+56 9 1234 5678',
    relation: 'Madre'
  });
  assert.equal(validContact.valid, true);
  assert.equal(validContact.data.name, 'Mamá SOS');
  assert.equal(validContact.data.phone, '+56912345678');

  const invalidContact = sanitizeAndValidateContact({ name: '', phone: '123' });
  assert.equal(invalidContact.valid, false);
  assert.equal(invalidContact.errors.length > 0, true);
});

test('Runtime Contracts — Validación de Coordenadas GPS (WGS84)', () => {
  const santiago = sanitizeAndValidateCoordinates(-33.4489, -70.6693);
  assert.equal(santiago.valid, true);
  assert.equal(santiago.data.lat, -33.4489);

  const corrupted = sanitizeAndValidateCoordinates(999, 'NaN');
  assert.equal(corrupted.valid, false);
  assert.equal(corrupted.data.lat, 90); // Clamped
  assert.equal(corrupted.data.lon, 0); // Fallback
});

test('Runtime Contracts — Validación de PIN de Seguridad (4 Dígitos)', () => {
  const okPin = sanitizeAndValidatePin('4321');
  assert.equal(okPin.valid, true);
  assert.equal(okPin.data, '4321');

  const badPin = sanitizeAndValidatePin('12a4');
  assert.equal(badPin.valid, false);
  assert.equal(badPin.data, '0000');
});
