// Central registry of per-store flush functions.
// Stores register a flusher that retries anything still marked dirty in
// their persisted state. Called on app boot (after hydration) and whenever
// the browser comes back online, so a write that failed while offline
// isn't lost — it just waits for the next successful flush.

const flushers = new Set();

export function registerFlusher(fn) {
  flushers.add(fn);
  return () => flushers.delete(fn);
}

export async function flushAll() {
  await Promise.allSettled(Array.from(flushers).map((fn) => fn()));
}
