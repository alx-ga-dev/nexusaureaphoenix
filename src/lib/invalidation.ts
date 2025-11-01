
// src/lib/invalidation.ts

/**
 * A placeholder for the real invalidation tracker.
 * This file will eventually connect to a centralized API or read a file
 * to determine if a specific piece of cached data has been marked as stale.
 */
const staleKeys = new Set<string>();

/**
 * Checks if a given cache key has been marked as stale.
 * In a real-world scenario, this function would involve an API call or
 * reading a shared resource that is updated by your backend services.
 *
 * @param key The cache key to check (e.g., 'users:all').
 * @returns {Promise<boolean>} True if the key is stale and needs re-fetching, false otherwise.
 */
export async function isCacheStale(key: string): Promise<boolean> {
  // TODO: Replace this placeholder with the actual invalidation logic.
  // Example: 
  //   const response = await fetch(`https://api.yourapp.com/invalidations?key=${key}`);
  //   const data = await response.json();
  //   return data.isStale;

  if (staleKeys.has(key)) {
    staleKeys.delete(key); // The key has been checked, so we can remove it to prevent unnecessary re-fetches
    return true;
  }

  return false;
}

/**
 * A utility function to manually mark a key as stale. In a real application,
 * this would likely be triggered by a webhook from your CMS or central API.
 * @param key The cache key to invalidate.
 */
export function markKeyAsStale(key: string) {
    console.log(`[Invalidation] Marking key as stale: ${key}`);
    staleKeys.add(key);
}
