/**
 * Simple in-memory cache with TTL for Firestore reference data
 * Avoids repeated lookups of static/semi-static data (buildings, categories, etc.)
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class FirestoreCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get cached value if not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cache value with TTL
   */
  set<T>(key: string, data: T, ttlMs: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear cache entry
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Get cache statistics
   */
  stats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

export const firestoreCache = new FirestoreCache();
