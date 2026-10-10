import test from 'node:test';
import assert from 'node:assert/strict';
import { construirMensajeWhatsApp } from '../js/sosManager.js';

test('Alerta SOS - Composición del Mensaje WhatsApp de Auxilio', () => {
  const mensaje = construirMensajeWhatsApp("Valentina", 10.4806, -66.9036);

  assert.ok(mensaje.includes("🚨 ¡ALERTA S.O.S. DE VALENTINA (FARO)!"));
  assert.ok(mensaje.includes("https://maps.google.com/?q=10.480600,-66.903600"));
  assert.ok(mensaje.includes("Necesito ayuda urgente."));
  assert.ok(mensaje.includes("Por favor comunícate conmigo de inmediato."));
});

test('Alerta SOS - Saneamiento de Nombre ante Caracteres Especiales', () => {
  const mensaje = construirMensajeWhatsApp("<script>alert(1)</script> Sofía", 10.5, -66.8);
  assert.ok(!mensaje.includes("<script>"));
  assert.ok(mensaje.includes("SOFÍA"));
});
