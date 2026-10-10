import test from 'node:test';
import assert from 'node:assert/strict';
import { selDelay, delayFalsaLlamada, callSeconds, enLlamada } from '../js/fakeCallManager.js';

test('Falsa Llamada - Configuración de Retardo', () => {
  selDelay(null, 15);
  assert.equal(delayFalsaLlamada, 15);

  selDelay(null, 0);
  assert.equal(delayFalsaLmaradaInmediata(), 0);
  function delayFalsaLmaradaInmediata() { return delayFalsaLlamada; }
});

test('Falsa Llamada - Estado Inicial Silencioso', () => {
  assert.equal(callSeconds, 0);
  assert.equal(enLlamada, false);
});
