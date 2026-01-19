type Fetcher<T> = () => Promise<T>;

interface StoredEntry<T> {
  value: T;
  expiresAt: number;
}

const PREFIX = "mlcache:";
const SHARED_PREFIX = "mlcache:shared:";
const inMemory = new Map<string, StoredEntry<any>>();
const sharedMemory = new Map<string, StoredEntry<any>>(); // Global cache across all users in same session
const inFlight = new Map<string, Promise<any>>();

function now() {
  return Date.now();
}

function hasWindow(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function storageKey(key: string) {
  return `${PREFIX}${key}`;
}

export function clearPersistentCache(prefix?: string) {
  if (!hasWindow()) return;
  if (!prefix) {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  } else {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX + prefix))
      .forEach((k) => localStorage.removeItem(k));
  }
  inMemory.clear();
}

export function clearSharedCache(prefix?: string) {
  // Clear in-memory shared cache
  if (!prefix) {
    sharedMemory.clear();
  } else {
    Array.from(sharedMemory.keys())
      .filter((k) => k.startsWith(prefix))
      .forEach((k) => sharedMemory.delete(k));
  }
}

export function clearAllCaches(prefix?: string) {
  clearPersistentCache(prefix);
  clearSharedCache(prefix);
}

export function getCachedPersistent<T>(
  key: string,
  useShared = true
): T | null {
  // Check shared cache first (data analyzed by any user)
  if (useShared) {
    const shared = sharedMemory.get(key) as StoredEntry<T> | undefined;
    if (shared && shared.expiresAt > now()) return shared.value;
  }

  // Prefer in-memory for speed
  const mem = inMemory.get(key) as StoredEntry<T> | undefined;
  if (mem && mem.expiresAt > now()) return mem.value;

  if (!hasWindow()) return null;
  try {
    const raw = localStorage.getItem(storageKey(key));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredEntry<T>;
    if (!parsed || typeof parsed.expiresAt !== "number") {
      localStorage.removeItem(storageKey(key));
      return null;
    }
    if (parsed.expiresAt <= now()) {
      localStorage.removeItem(storageKey(key));
      return null;
    }
    // hydrate memory and shared for quicker subsequent access
    inMemory.set(key, parsed);
    if (useShared) sharedMemory.set(key, parsed);
    return parsed.value;
  } catch {
    // Corrupt entry; remove it
    localStorage.removeItem(storageKey(key));
    return null;
  }
}

export async function getOrFetchPersistent<T>(
  key: string,
  fetcher: Fetcher<T>,
  ttlMs = 5 * 60 * 1000,
  useShared = true
): Promise<T> {
  const existing = getCachedPersistent<T>(key, useShared);
  if (existing !== null) return existing;

  const inflight = inFlight.get(key) as Promise<T> | undefined;
  if (inflight) return inflight;

  const p: Promise<T> = (async () => {
    const v = await fetcher();
    const entry: StoredEntry<T> = { value: v, expiresAt: now() + ttlMs };
    inMemory.set(key, entry);
    if (useShared) sharedMemory.set(key, entry);
    if (hasWindow()) {
      try {
        localStorage.setItem(storageKey(key), JSON.stringify(entry));
      } catch {
        // best-effort
      }
    }
    return v;
  })();

  inFlight.set(key, p);
  try {
    const result = await p;
    return result;
  } finally {
    inFlight.delete(key);
  }
}
