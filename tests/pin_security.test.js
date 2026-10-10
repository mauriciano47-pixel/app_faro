import test from 'node:test';
import assert from 'node:assert/strict';
import { validarFormatoPin, verificarPinUsuario } from '../js/pinSecurity.js';

test('Seguridad por PIN - Validación Estricta de Formato de 4 Dígitos', () => {
  assert.equal(validarFormatoPin("1234"), true);
  assert.equal(validarFormatoPin("0000"), true);
  assert.equal(validarFormatoPin("9876"), true);

  assert.equal(validarFormatoPin("123"), false, "Debe rechazar menos de 4 dígitos");
  assert.equal(validarFormatoPin("12345"), false, "Debe rechazar más de 4 dígitos");
  assert.equal(validarFormatoPin("abcd"), false, "Debe rechazar caracteres no numéricos");
  assert.equal(validarFormatoPin("12a4"), false, "Debe rechazar alfanuméricos");
  assert.equal(validarFormatoPin(""), false, "Debe rechazar cadenas vacías");
  assert.equal(validarFormatoPin(null), false, "Debe rechazar valores nulos");
});

test('Seguridad por PIN - Verificación Contra Perfil Registrado', () => {
  const perfilValido = { nombre: "Valentina", pin: "4321" };

  assert.equal(verificarPinUsuario("4321", perfilValido), true);
  assert.equal(verificarPinUsuario(" 4321 ", perfilValido), true, "Debe permitir espacios accidentales recortados");
  assert.equal(verificarPinUsuario("1234", perfilValido), false, "Debe rechazar PIN incorrecto");
  assert.equal(verificarPinUsuario("", perfilValido), false);

  assert.equal(verificarPinUsuario("Cualquiera", null), true, "Perfil nulo permite la acción");
  assert.equal(verificarPinUsuario("Cualquiera", {}), true, "Perfil sin PIN permite la acción");
});
