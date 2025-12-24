type Fetcher<T> = () => Promise<T>;

interface CacheEntry<T> {
  value: T;
  expiresAt: number; // timestamp
}

const cache = new Map<string, CacheEntry<any>>();

export function clearCache() {
  cache.clear();
}

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value as T;
}

export async function getOrFetch<T>(
  key: string,
  fetcher: Fetcher<T>,
  ttlMs = 5 * 60 * 1000
): Promise<T> {
  const existing = getCached<T>(key);
  if (existing !== null) return existing;

  // Prevent duplicate fetches by storing a placeholder promise
  const inFlightKey = `__inflight__${key}`;
  const inFlight = cache.get(inFlightKey) as CacheEntry<Promise<T>> | undefined;
  if (inFlight) {
    return inFlight.value;
  }

  const promise = (async () => {
    try {
      const v = await fetcher();
      cache.set(key, { value: v, expiresAt: Date.now() + ttlMs });
      return v;
    } finally {
      cache.delete(inFlightKey);
    }
  })();

  // mark in-flight
  cache.set(inFlightKey, { value: promise, expiresAt: Date.now() + 60 * 1000 });
  return promise;
}
