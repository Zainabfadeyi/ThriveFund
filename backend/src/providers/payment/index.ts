import { env } from '../../config/env';
import { NombaProvider } from './nomba.provider';
import type { PaymentProvider } from './payment-provider.interface';

let instance: PaymentProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  if (instance) return instance;

  instance = new NombaProvider();

  return instance;
}

/** Reset provider instance (for tests) */
export function resetPaymentProvider() {
  instance = null;
}

export * from './payment-provider.interface';
export { NombaProvider } from './nomba.provider';
