import { env } from '../config/env';
import { collectionLifecycleService } from '../modules/goals/collection-lifecycle.service';

const DEFAULT_INTERVAL_MS = 60 * 60 * 1000;

export function scheduleCollectionExpiry() {
  if (env.NODE_ENV === 'test') return;

  const intervalMs = Number(process.env.COLLECTION_EXPIRY_INTERVAL_MS ?? DEFAULT_INTERVAL_MS);

  const run = async () => {
    try {
      const result = await collectionLifecycleService.processDueExpirations();
      if (result.processed > 0) {
        console.log(JSON.stringify({
          service: 'collection-expiry',
          event: 'completed',
          ts: new Date().toISOString(),
          processed: result.processed,
          results: result.results,
        }));
      }
    } catch (err) {
      console.error(JSON.stringify({
        service: 'collection-expiry',
        event: 'failed',
        ts: new Date().toISOString(),
        error: err instanceof Error ? err.message : 'unknown',
      }));
    }
  };

  setTimeout(run, 45_000);
  setInterval(run, intervalMs);
}
