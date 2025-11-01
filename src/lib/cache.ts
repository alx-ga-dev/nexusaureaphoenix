
import { isCacheStale } from './invalidation';

interface CacheEntry<T> {
  value: T;
  timestamp: number; // Keep timestamp for debugging and potential future use cases
}

const cache = new Map<string, CacheEntry<any>>();

/**
 * An advanced server-side in-memory cache with two modes:
 * 1. Time-to-Live (TTL): Caches data for a specified number of seconds.
 * 2. On-Demand Revalidation: Caches data "perpetually" until it's marked as stale.
 *
 * @param key A unique string to identify the cache entry.
 * @param factory An async function that fetches and returns the data.
 * @param ttlSeconds The cache duration. If > 0, uses TTL. If <= 0, uses on-demand revalidation.
 * @returns The cached or freshly fetched data.
 */
export async function getOrSetCache<T>(
  key: string,
  factory: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  const existing = cache.get(key);
  const now = Date.now();

  // --- On-Demand Revalidation Strategy ---
  if (ttlSeconds <= 0) {
    if (existing) {
      // Check if the centralized invalidation system has marked this key as stale.
      const stale = await isCacheStale(key);
      if (!stale) {
        console.log(`[Cache Hit | Perpetual] Returning cached data for key: ${key}`);
        return existing.value;
      }
      // If it is stale, we fall through to the "Cache Miss" section.
      console.log(`[Cache Stale] Key marked as stale, re-fetching: ${key}`);
    }
  } 
  // --- Time-Based (TTL) Revalidation Strategy ---
  else {
    if (existing && now - existing.timestamp < ttlSeconds * 1000) {
      console.log(`[Cache Hit | TTL] Returning cached data for key: ${key}`);
      return existing.value;
    }
    // If expired, we fall through to the "Cache Miss" section.
  }

  // --- Cache Miss ---
  // This block is reached if:
  // 1. The item doesn't exist in the cache.
  // 2. The item is expired (TTL mode).
  // 3. The item is marked as stale (On-Demand mode).
  console.log(`[Cache Miss] Fetching fresh data for key: ${key}`);
  const freshValue = await factory();

  cache.set(key, {
    value: freshValue,
    timestamp: now,
  });

  return freshValue;
}
