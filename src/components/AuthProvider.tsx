
'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, User, signOut, signInWithCustomToken } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { firebaseAuth } from '@/lib/firebase';
import { ADMIN_LEVEL } from '@/lib/constants';

interface AuthContextType {
  userAuth: User | null;
  userData: any;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  isLoggedIn: boolean;
  signIn: (customToken: string, userData: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

async function fetchUserData(token: string) {
    const response = await fetch('/api/auth/user', {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });
    if (!response.ok) {
        throw new Error("Failed to fetch user data on session restore.");
    }
    return response.json();
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [userAuth, setUserAuth] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const router = useRouter();

  // signIn is simplified; onAuthStateChanged handles the session cookie.
  const signIn = async (customToken: string, fetchedUserData: any) => {
    console.log("[AuthProvider] signIn called");
    setLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithCustomToken(firebaseAuth, customToken);
      // The onAuthStateChanged listener will handle the rest.
    } catch (err: any) {
      console.error("[AuthProvider] signIn error:", err);
      setError(err.message || "An unknown error occurred during sign-in.");
      setLoading(false);
    }
  };

  // logout is simplified; onAuthStateChanged handles clearing the session cookie.
  const logout = useCallback(async () => {
    console.log("[AuthProvider] logout called");
    await signOut(firebaseAuth);
    router.push('/');
  }, [router]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      console.log(`[AuthProvider] Auth state changed. (User: ${user?.uid})`);
      setIsSyncing(true);
      if (user) {
        console.log(`[AuthProvider] Syncing server session. (User: ${user?.uid})`);
        try {
          const idToken = await user.getIdToken();
          // Proactively create/validate the server-side session cookie.
          // This is the key to preventing redirect loops.
          await fetch('/api/auth/session', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${idToken}`
              },
          });
          console.log('[AuthProvider] Server session cookie created/validated.');
          
          setUserAuth(user);
          setToken(idToken);

          // Fetch user data only on initial session restore.
          if (!userData) {
              const fetchedData = await fetchUserData(idToken);
              setUserData(fetchedData);
          }
        } catch (e: any) {
            console.error("Auth state sync error:", e);
            setError(e.message);
            await logout();
        }
      } else {
        // User is logged out, ensure the server session is cleared.
        console.log('[AuthProvider] No user. Clearing server session cookie.');
        // NOTE: This assumes your API route handles a DELETE request to clear the cookie.
        await fetch('/api/auth/session', { method: 'DELETE' });
        
        setUserAuth(null);
        setUserData(null);
        setToken(null);
      }
      setIsSyncing(false);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [logout, userData]);

  const isAdmin = userData?.roleLevel >= ADMIN_LEVEL;
  const isLoggedIn = !!userAuth && !!userData;

  const value = {
    userAuth,
    userData,
    token,
    loading: loading || isSyncing,
    error,
    isAdmin,
    isLoggedIn,
    signIn,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
