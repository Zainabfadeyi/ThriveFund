type NombaLogContext = {
  method: string;
  path: string;
  merchantTxRef?: string;
  amountKobo?: number;
  status?: number;
  providerCode?: string;
  latencyMs?: number;
  error?: string;
};

export function logNombaCall(context: NombaLogContext) {
  const payload = {
    service: 'nomba',
    ts: new Date().toISOString(),
    ...context,
  };
  if (context.error) {
    console.error(JSON.stringify(payload));
  } else {
    console.log(JSON.stringify(payload));
  }
}
