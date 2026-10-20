import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  clampFiniteNumber,
  sanitizeAndValidateCoordinates,
  sanitizeAndValidateContact,
  sanitizeAndValidatePin
} from '../js/runtimeContracts.js';

test('Fuzzing Matemático — Invariantes de Coordenadas GPS WGS84', () => {
  const extremeVectors = [
    NaN, Infinity, -Infinity, null, undefined, '', 'abc', {}, [],
    -90.0000000001, 90.0000000001, -180.00000001, 180.0000001,
    1e308, -1e308, Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER
  ];

  for (const lat of extremeVectors) {
    for (const lon of extremeVectors) {
      const res = sanitizeAndValidateCoordinates(lat, lon);
      assert.equal(typeof res.valid, 'boolean');
      assert.equal(Number.isFinite(res.data.lat), true);
      assert.equal(Number.isFinite(res.data.lon), true);
      assert.equal(res.data.lat >= -90 && res.data.lat <= 90, true);
      assert.equal(res.data.lon >= -180 && res.data.lon <= 180, true);
    }
  }
});

test('Fuzzing de Seguridad — Invariantes de PIN contra inyecciones arbitrarias', () => {
  const pinVectors = [
    null, undefined, '', ' ', '123', '12345', 'abcd', '123a',
    '<script>alert(1)</script>', "' OR '1'='1", '0000', '9999',
    1234, 0, false, true, {}, []
  ];

  for (const pin of pinVectors) {
    const res = sanitizeAndValidatePin(pin);
    assert.equal(typeof res.valid, 'boolean');
    assert.equal(typeof res.data, 'string');
    assert.equal(/^\d{4}$/.test(res.data), true);
  }
});
