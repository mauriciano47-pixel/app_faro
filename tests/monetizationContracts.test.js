import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STRIPE_PLANS,
  getSubscriptionStatus,
  setSubscriptionStatus,
  canAddMoreFaros,
  isFeatureEnabled,
  initiateStripeCheckout
} from '../js/stripeService.js';

// Mock simple de Storage para entorno Node sin browser
class MemoryStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  clear() {
    this.store = {};
  }
}

test('Monetización Stripe - Estructura de Catálogo y Precios Turnkey M&A', () => {
  // Plan Gratuito
  assert.equal(STRIPE_PLANS.FREE.id, 'free');
  assert.equal(STRIPE_PLANS.FREE.precioMensualUsd, 0);
  assert.equal(STRIPE_PLANS.FREE.maxFaros, 3);
  assert.equal(STRIPE_PLANS.FREE.soporteSmsBackup, false);

  // Plan Pro Mensual
  assert.equal(STRIPE_PLANS.PRO_MENSUAL.id, 'prod_faro_pro_monthly');
  assert.equal(STRIPE_PLANS.PRO_MENSUAL.precioMensualUsd, 3.99);
  assert.equal(STRIPE_PLANS.PRO_MENSUAL.maxFaros, 10);
  assert.equal(STRIPE_PLANS.PRO_MENSUAL.soporteSmsBackup, true);
  assert.ok(STRIPE_PLANS.PRO_MENSUAL.stripeCheckoutUrl.includes('stripe.com'));

  // Plan Pro Anual
  assert.equal(STRIPE_PLANS.PRO_ANUAL.id, 'prod_faro_pro_annual');
  assert.equal(STRIPE_PLANS.PRO_ANUAL.precioAnualUsd, 29.99);
  assert.ok(STRIPE_PLANS.PRO_ANUAL.stripeCheckoutUrl.includes('stripe.com'));

  // Plan B2B Campus
  assert.equal(STRIPE_PLANS.CAMPUS_B2B.id, 'prod_faro_campus_b2b');
  assert.equal(STRIPE_PLANS.CAMPUS_B2B.precioAnualUsd, 299.00);
  assert.equal(STRIPE_PLANS.CAMPUS_B2B.maxFaros, 100);
  assert.equal(STRIPE_PLANS.CAMPUS_B2B.dashboardCentral, true);
});

test('Monetización Stripe - Ciclo de Vida de Suscripción y Persistencia Local', () => {
  const mockStorage = new MemoryStorage();

  // Estado inicial por defecto: Free
  const initial = getSubscriptionStatus(mockStorage);
  assert.equal(initial.esPro, false);
  assert.equal(initial.plan.id, 'free');

  // Activar suscripción Pro Anual
  const saved = setSubscriptionStatus(true, STRIPE_PLANS.PRO_ANUAL.id, 'stripe', mockStorage);
  assert.equal(saved, true);

  const updated = getSubscriptionStatus(mockStorage);
  assert.equal(updated.esPro, true);
  assert.equal(updated.plan.id, STRIPE_PLANS.PRO_ANUAL.id);
  assert.ok(updated.activoDesde);
  assert.equal(updated.metodo, 'stripe');
});

test('Monetización Stripe - Control de Cuotas de Contactos (Faros Guardados)', () => {
  const freeSub = { esPro: false, plan: STRIPE_PLANS.FREE };
  const proSub = { esPro: true, plan: STRIPE_PLANS.PRO_MENSUAL };

  // En Free: límite es 3
  assert.equal(canAddMoreFaros(2, freeSub), true);
  assert.equal(canAddMoreFaros(3, freeSub), false);
  assert.equal(canAddMoreFaros(5, freeSub), false);

  // En Pro: límite es 10
  assert.equal(canAddMoreFaros(3, proSub), true);
  assert.equal(canAddMoreFaros(9, proSub), true);
  assert.equal(canAddMoreFaros(10, proSub), false);
});

test('Monetización Stripe - Habilitación de Capacidades Avanzadas por Tier', () => {
  const freeSub = { esPro: false, plan: STRIPE_PLANS.FREE };
  const proSub = { esPro: true, plan: STRIPE_PLANS.PRO_MENSUAL };
  const b2bSub = { esPro: true, plan: STRIPE_PLANS.CAMPUS_B2B };

  // SMS Backup solo en Pro y B2B
  assert.equal(isFeatureEnabled('soporteSmsBackup', freeSub), false);
  assert.equal(isFeatureEnabled('soporteSmsBackup', proSub), true);
  assert.equal(isFeatureEnabled('soporteSmsBackup', b2bSub), true);

  // Dashboard Central solo en B2B
  assert.equal(isFeatureEnabled('dashboardCentral', freeSub), false);
  assert.equal(isFeatureEnabled('dashboardCentral', proSub), false);
  assert.equal(isFeatureEnabled('dashboardCentral', b2bSub), true);

  // URL de checkout
  const url = initiateStripeCheckout(STRIPE_PLANS.PRO_MENSUAL.id);
  assert.ok(url.startsWith('https://buy.stripe.com/'));
});
