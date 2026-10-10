import test from 'node:test';
import assert from 'node:assert/strict';
import { interpolar, generarEnlaceGoogleMaps } from '../js/mapRouteManager.js';

test('Interpolador de Rutas - Cálculo de Puntos Lineales Intermedios', () => {
  const p1 = [10.0, -66.0];
  const p2 = [20.0, -76.0];
  const pasos = 10;

  const puntos = interpolar(p1, p2, pasos);
  assert.equal(puntos.length, pasos + 1);

  // El primer punto debe ser p1
  assert.equal(puntos[0][0], 10.0);
  assert.equal(puntos[0][1], -66.0);

  // El último punto debe ser p2
  assert.equal(puntos[pasos][0], 20.0);
  assert.equal(puntos[pasos][1], -76.0);

  // El punto intermedio exacto (paso 5)
  assert.equal(puntos[5][0], 15.0);
  assert.equal(puntos[5][1], -71.0);
});

test('Geolocalización - Generación de Enlace de Google Maps', () => {
  const url = generarEnlaceGoogleMaps(10.4806, -66.9036);
  assert.equal(url, "https://maps.google.com/?q=10.480600,-66.903600");
});
