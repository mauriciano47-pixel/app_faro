import test from 'node:test';
import assert from 'node:assert/strict';
import { formatTiempo, calcularPorcentajeTimer, TIEMPO_TOTAL_SEG } from '../js/safetyTimer.js';

test('Temporizador de Seguridad - Formateo de Segundos a mm:ss', () => {
  assert.equal(formatTiempo(1200), "20:00");
  assert.equal(formatTiempo(600), "10:00");
  assert.equal(formatTiempo(65), "01:05");
  assert.equal(formatTiempo(9), "00:09");
  assert.equal(formatTiempo(0), "00:00");
  assert.equal(formatTiempo(-10), "00:00", "No debe generar tiempos negativos");
});

test('Temporizador de Seguridad - Cálculo de Porcentaje de Progreso', () => {
  assert.equal(calcularPorcentajeTimer(1200, 1200), 100);
  assert.equal(calcularPorcentajeTimer(600, 1200), 50);
  assert.equal(calcularPorcentajeTimer(0, 1200), 0);
  assert.equal(calcularPorcentajeTimer(-50, 1200), 0);
  assert.equal(calcularPorcentajeTimer(1500, 1200), 100, "Debe acotar a 100% como máximo");
});
