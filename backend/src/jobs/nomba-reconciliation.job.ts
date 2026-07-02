import { env } from '../config/env';
import { nombaSyncService } from '../modules/nomba-sync/nomba-sync.service';

const DEFAULT_INTERVAL_MS = 24 * 60 * 60 * 1000;

export function scheduleNombaSync() {
  if (env.NODE_ENV === 'test') return;

  const intervalMs = Number(process.env.NOMBA_SYNC_INTERVAL_MS ?? DEFAULT_INTERVAL_MS);
  const run = async () => {
    try {
      console.log(JSON.stringify({ service: 'nomba-sync', event: 'started', ts: new Date().toISOString() }));
      const result = await nombaSyncService.runSync();
      console.log(JSON.stringify({
        service: 'nomba-sync',
        event: 'completed',
        ts: new Date().toISOString(),
        drift_ngn: result?.drift_ngn,
        matched_count: result?.matched_count,
        unmatched_count: result?.unmatched_count,
      }));
    } catch (err) {
      console.error(JSON.stringify({
        service: 'nomba-sync',
        event: 'failed',
        ts: new Date().toISOString(),
        error: err instanceof Error ? err.message : 'unknown',
      }));
    }
  };

  setTimeout(run, 30_000);
  setInterval(run, intervalMs);
}
