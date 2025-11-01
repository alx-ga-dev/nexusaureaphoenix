
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';

const collectionCache = new Map<string, any>();

export interface UseCollectionResult<T> {
  data: T[] | null;
  isLoading: boolean;
  error: Error | null;
}

export function useCollection<T = any>(
    collectionName: string | null | undefined,
    queries: any[] = []
): UseCollectionResult<T> {
  const { token } = useAuth();
  const queryKey = JSON.stringify(queries);

  const cacheKey = collectionName ? `${collectionName}?queries=${queryKey}` : null;
  const cachedData = cacheKey ? collectionCache.get(cacheKey) : undefined;

  const [data, setData] = useState<T[] | null>(cachedData || null);
  const [isLoading, setIsLoading] = useState(!cachedData && !!(token && cacheKey));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!token || !collectionName) {
        setIsLoading(false);
        setData(null);
        return;
    }

    const currentCacheKey = `${collectionName}?queries=${queryKey}`;
    const currentCachedData = collectionCache.get(currentCacheKey);

    if (currentCachedData) {
      console.log(`[Cache Hit] Serving '${collectionName}' from cache.`);
      setData(currentCachedData);
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      console.log(`[Cache Miss] Fetching '${collectionName}' from server.`);
      setIsLoading(true);
      setError(null);

      try {
        const apiRequest = {
            name: collectionName,
            collection: collectionName,
            queries: queries,
        };

        const response = await fetch('/api/data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ requests: [apiRequest] }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Failed to fetch ${collectionName}: ${errorBody}`);
        }

        const result = await response.json();
        const fetchedData = result[collectionName];

        if (fetchedData) {
          console.log(`[Cache Set] Caching '${collectionName}'.`);
          collectionCache.set(currentCacheKey, fetchedData);
        }
        setData(fetchedData || null);

      } catch (err: any) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [collectionName, queryKey, token]);

  return { data, isLoading, error };
}