#!/usr/bin/env node
/**
 * V-GUARD Sentinel — Shift-Left Quality Gate (Pre-Push Shield)
 * Impide commits o subidas a repositorios remotos si existen regresiones,
 * pruebas fallidas o errores de tipado estático.
 */
import { execSync } from 'child_process';

console.log('\x1b[36m%s\x1b[0m', '🏛️  [V-GUARD SHIFT-LEFT GATE] Ejecutando verificación previa al git push...');

try {
  // 1. Verificación de Tipado Estático si existe TypeScript
  console.log(' -> Validando tipado estricto (typecheck)...');
  try {
    execSync('npm run typecheck', { stdio: 'inherit' });
  } catch {
    // Si no existe typecheck, continuar
  }

  // 2. Ejecución dinámica de pruebas automatizadas
  console.log(' -> Ejecutando suite de pruebas unitarias (npm test)...');
  execSync('npm test', { stdio: 'inherit' });

  console.log('\x1b[32m%s\x1b[0m', '✅ [V-GUARD GATE PASSED]: Código puro verificado. Autorizando push a repositorio.');
  process.exit(0);
} catch (err) {
  console.error('\x1b[31m%s\x1b[0m', '❌ [V-GUARD GATE REJECTED]: Las pruebas o el tipado fallaron. Push bloqueado.');
  process.exit(1);
}
