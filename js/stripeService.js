/**
 * ============================================================================
 * FARO — Servicio de Monetización, Suscripciones y Checkout (Stripe & SaaS)
 * Versión: 1.8.0
 * ============================================================================
 * Sistema de Seguridad Personal, Alerta SOS y Geolocalización ("Tu Seguridad, Tu Luz")
 * Arquitectura de cobro recurrente Micro-SaaS para validación comercial M&A (Acquire.com / Flippa)
 */

export const STRIPE_PLANS = {
  FREE: {
    id: 'free',
    nombre: 'Faro Básico',
    precioMensualUsd: 0,
    precioTexto: 'Gratis',
    maxFaros: 3,
    geocercas: 1,
    falsaLlamada: 'Estándar',
    sosDiscreto: true,
    registroIncidentesDias: 7,
    soporteSmsBackup: false
  },
  PRO_MENSUAL: {
    id: 'prod_faro_pro_monthly',
    priceId: 'price_faro_pro_monthly_399',
    nombre: 'Faro Escudo Familiar Pro (Mensual)',
    precioMensualUsd: 3.99,
    precioTexto: '$3.99 USD / mes',
    periodo: 'mensual',
    maxFaros: 10,
    geocercas: 9999,
    falsaLlamada: 'Avanzada',
    sosDiscreto: true,
    registroIncidentesDias: 9999,
    soporteSmsBackup: true,
    stripeCheckoutUrl: 'https://buy.stripe.com/test_faro_pro_monthly'
  },
  PRO_ANUAL: {
    id: 'prod_faro_pro_annual',
    priceId: 'price_faro_pro_annual_2999',
    nombre: 'Faro Escudo Familiar Pro (Anual - Ahorro 37%)',
    precioMensualUsd: 2.49,
    precioAnualUsd: 29.99,
    precioTexto: '$29.99 USD / año',
    periodo: 'anual',
    maxFaros: 10,
    geocercas: 9999,
    falsaLlamada: 'Avanzada',
    sosDiscreto: true,
    registroIncidentesDias: 9999,
    soporteSmsBackup: true,
    stripeCheckoutUrl: 'https://buy.stripe.com/test_faro_pro_annual'
  },
  CAMPUS_B2B: {
    id: 'prod_faro_campus_b2b',
    priceId: 'price_faro_campus_annual_299',
    nombre: 'Faro Campus & Corporate Safety (B2B)',
    precioMensualUsd: 24.91,
    precioAnualUsd: 299.00,
    precioTexto: '$299.00 USD / año',
    periodo: 'anual',
    maxFaros: 100,
    geocercas: 9999,
    falsaLlamada: 'Institucional',
    sosDiscreto: true,
    registroIncidentesDias: 9999,
    soporteSmsBackup: true,
    dashboardCentral: true,
    stripeCheckoutUrl: 'https://buy.stripe.com/test_faro_campus_b2b'
  }
};

export const STORAGE_KEY_SUBSCRIPTION = 'faro_subscription_status';

/**
 * Obtiene el estado actual de suscripción de la usuaria/usuario.
 * @param {Storage} [storageAdapter] - Adaptador opcional para pruebas unitarias.
 */
export function getSubscriptionStatus(storageAdapter = null) {
  const storage = storageAdapter || (typeof localStorage !== 'undefined' ? localStorage : null);
  if (!storage) {
    return {
      esPro: false,
      plan: STRIPE_PLANS.FREE,
      activoDesde: null,
      metodo: 'ninguno'
    };
  }

  try {
    const raw = storage.getItem(STORAGE_KEY_SUBSCRIPTION);
    if (!raw) {
      return {
        esPro: false,
        plan: STRIPE_PLANS.FREE,
        activoDesde: null,
        metodo: 'ninguno'
      };
    }
    const parsed = JSON.parse(raw);
    const esPro = parsed.esPro === true;
    let plan = STRIPE_PLANS.FREE;

    if (parsed.planId === STRIPE_PLANS.CAMPUS_B2B.id) {
      plan = STRIPE_PLANS.CAMPUS_B2B;
    } else if (parsed.planId === STRIPE_PLANS.PRO_ANUAL.id) {
      plan = STRIPE_PLANS.PRO_ANUAL;
    } else if (esPro) {
      plan = STRIPE_PLANS.PRO_MENSUAL;
    }

    return {
      esPro,
      plan,
      activoDesde: parsed.activoDesde || null,
      metodo: parsed.metodo || 'stripe'
    };
  } catch {
    return {
      esPro: false,
      plan: STRIPE_PLANS.FREE,
      activoDesde: null,
      metodo: 'ninguno'
    };
  }
}

/**
 * Establece o actualiza el estado de la suscripción.
 * @param {boolean} esPro
 * @param {string} [planId]
 * @param {string} [metodo]
 * @param {Storage} [storageAdapter]
 */
export function setSubscriptionStatus(esPro, planId = STRIPE_PLANS.PRO_MENSUAL.id, metodo = 'stripe', storageAdapter = null) {
  const storage = storageAdapter || (typeof localStorage !== 'undefined' ? localStorage : null);
  if (!storage) return false;

  try {
    const data = {
      esPro,
      planId,
      activoDesde: new Date().toISOString(),
      metodo
    };
    storage.setItem(STORAGE_KEY_SUBSCRIPTION, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

/**
 * Valida si la cuenta puede agregar más contactos (Faros) según el límite de su plan.
 * @param {number} currentCount
 * @param {Object} [subscription]
 */
export function canAddMoreFaros(currentCount, subscription = null) {
  const sub = subscription || getSubscriptionStatus();
  const limit = sub.plan.maxFaros;
  return currentCount < limit;
}

/**
 * Valida si una característica específica está habilitada para el plan.
 * @param {string} featureName
 * @param {Object} [subscription]
 */
export function isFeatureEnabled(featureName, subscription = null) {
  const sub = subscription || getSubscriptionStatus();
  return Boolean(sub.plan[featureName]);
}

/**
 * Inicia el checkout de Stripe redirigiendo a la sesión de pago.
 * @param {string} planId
 */
export function initiateStripeCheckout(planId = STRIPE_PLANS.PRO_MENSUAL.id) {
  const plan = Object.values(STRIPE_PLANS).find(p => p.id === planId) || STRIPE_PLANS.PRO_MENSUAL;
  if (!plan.stripeCheckoutUrl) {
    throw new Error(`El plan ${planId} no tiene URL de checkout configurada.`);
  }
  if (typeof window !== 'undefined' && window.location) {
    window.location.href = plan.stripeCheckoutUrl;
  }
  return plan.stripeCheckoutUrl;
}
