import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Baliza de Telemetría Pasiva RUM: Archivo y script inyectado en index.html', () => {
  assert.equal(fs.existsSync('./js/rumBeacon.js'), true, 'La baliza RUM debe existir en js/');
  const code = fs.readFileSync('./js/rumBeacon.js', 'utf8');
  assert.match(code, /window\.__VGUARD_RUM__/, 'Debe exponer API soberana __VGUARD_RUM__');
  assert.match(code, /vguard_rum_metrics/, 'Debe persistir en clave de almacenamiento seguro');

  const html = fs.readFileSync('./index.html', 'utf8');
  assert.match(html, /src="js\/rumBeacon\.js"/, 'index.html debe enlazar la baliza RUM');
});

test('Pipeline CI/CD Tier-1: Especificación de verificación automatizada debe existir', () => {
  const ciExists = fs.existsSync('./ci/verify.yml') || fs.existsSync('./.github/workflows/verify.yml');
  assert.equal(ciExists, true, 'La especificación de CI debe existir');
});
