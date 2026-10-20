import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeAndValidateContact, sanitizeAndValidateCoordinates } from '../js/runtimeContracts.js';

test('Chaos Engineering — Resiliencia ante JSON de Almacenamiento Local Corrupto', () => {
  const corruptedPayloads = [
    '{"name": "Mama", "phone": ', // Truncated JSON
    'null',
    'undefined',
    '{"contacts": [null, {"phone": 123}, {}, "string_item"]}',
    '{"coordinates": {"lat": "Infinity", "lon": "NaN"}}'
  ];

  for (const raw of corruptedPayloads) {
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = null; // Fallback simula autorreparación
    }

    const contact = sanitizeAndValidateContact(parsed);
    assert.equal(typeof contact.valid, 'boolean');
    assert.equal(typeof contact.data.name, 'string');
    assert.equal(typeof contact.data.phone, 'string');
  }
});

test('Chaos Engineering — Tormenta de Llamadas Concurrentes SOS (Burst Simulation)', () => {
  const burstResults = [];
  for (let i = 0; i < 200; i++) {
    const lat = -33.4489 + (Math.random() - 0.5) * 0.01;
    const lon = -70.6693 + (Math.random() - 0.5) * 0.01;
    const res = sanitizeAndValidateCoordinates(lat, lon);
    burstResults.push(res);
  }

  assert.equal(burstResults.length, 200);
  assert.equal(burstResults.every(r => r.valid === true), true);
});
