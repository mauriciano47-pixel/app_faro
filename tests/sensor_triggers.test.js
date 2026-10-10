import test from 'node:test';
import assert from 'node:assert/strict';
import { calcularVelocidadMovimiento, SHAKE_THRESHOLD, SHAKE_LIMIT } from '../js/sensorTriggers.js';

test('Sensores Físicos - Cálculo de Magnitud de Variación de Velocidad', () => {
  // Sin variación (reposo absoluto)
  const velocidadReposo = calcularVelocidadMovimiento(0, 0, 9.8, 0, 0, 9.8, 100);
  assert.equal(velocidadReposo, 0);

  // Movimiento brusco acelerado: cambio de 15 m/s^2 en 100ms
  const velocidadBrusca = calcularVelocidadMovimiento(15, 10, 5, 0, 0, 0, 100);
  assert.ok(velocidadBrusca > SHAKE_THRESHOLD, "Debe superar el umbral de disparo de agitación");
});

test('Sensores Físicos - Umbrales de Calibración Anti-Falsos Positivos', () => {
  assert.equal(SHAKE_THRESHOLD, 15);
  assert.equal(SHAKE_LIMIT, 4);
});
