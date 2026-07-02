/** Nomba API amounts are in kobo; ThriveFund stores naira in the database. */

export function toKobo(naira: number): number {
  return Math.round(Number(naira) * 100);
}

export function fromKobo(kobo: number): number {
  return Math.round(Number(kobo)) / 100;
}

export function normalizeNombaInboundAmount(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  // Nomba transaction API returns kobo; webhook payloads in this integration use naira.
  return amount;
}

export function normalizeNombaTransactionAmount(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return fromKobo(amount);
}
