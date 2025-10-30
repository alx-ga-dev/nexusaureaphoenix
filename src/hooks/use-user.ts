
import { useState, useEffect, useCallback, useRef } from 'react';

interface UseUserOptions {
    initialData?: any;
    enabled?: boolean;
}

export function useUser(token: string | null, options: UseUserOptions = {}) {
    const { initialData, enabled = true } = options;
    const [user, setUser] = useState<any>(initialData || null);
    const [isLoading, setIsLoading] = useState(!initialData && enabled);
    const [error, setError] = useState<Error | null>(null);

    // Use a ref to hold the latest 'user' state without making 'user' a dependency of fetchUserStable
    const userStateRef = useRef(user);
    useEffect(() => {
        userStateRef.current = user;
    }, [user]);

    // Use a ref to hold the latest 'isLoading' state
    const isLoadingRef = useRef(isLoading);
    useEffect(() => {
        isLoadingRef.current = isLoading;
    }, [isLoading]);

    const fetchUserStable = useCallback(async () => {
        if (!enabled || !token) {
            // Only update if current state is not already null/false
            if (userStateRef.current !== null) setUser(null);
            if (isLoadingRef.current !== false) setIsLoading(false);
            return;
        }

        // Only set isLoading if it's not already true, to avoid flicker
        if (!isLoadingRef.current) setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/auth/user', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch user');
            }

            const fetchedData = await response.json();
            // Perform deep comparison before setting state to prevent unnecessary re-renders.
            // Access 'user' state via ref to avoid 'user' in useCallback dependencies.
            if (JSON.stringify(fetchedData) !== JSON.stringify(userStateRef.current)) {
                setUser(fetchedData);
            }
        } catch (err: any) {
            setError(err);
            setUser(null); // Clear user state on error
        } finally {
            setIsLoading(false);
        }
    }, [enabled, token, setUser, setError, setIsLoading]); // Only stable setters and 'enabled', 'token' are dependencies.

    useEffect(() => {
        if (enabled) {
            fetchUserStable();
        } else {
            // If disabled, ensure state is reset
            if (user !== null) setUser(null);
            if (isLoading !== false) setIsLoading(false);
        }
    }, [fetchUserStable, enabled]);

    return { user, isLoading, error, refetch: fetchUserStable };
}