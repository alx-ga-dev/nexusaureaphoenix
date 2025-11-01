
'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, User, signOut, signInWithCustomToken, getIdToken } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { firebaseAuth } from '@/lib/firebase';
import { ADMIN_LEVEL } from '@/lib/constants';

// Corrected interface: isAnonymous is removed.
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
  const router = useRouter();

  const signIn = async (customToken: string, fetchedUserData: any) => {
    console.log("[AuthProvider] signIn called");
    setLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithCustomToken(firebaseAuth, customToken);
      const idToken = await userCredential.user.getIdToken();
      setUserAuth(userCredential.user);
      setToken(idToken);
      setUserData(fetchedUserData);
    } catch (err: any) {
      console.error("[AuthProvider] signIn error:", err);
      setError(err.message || "An unknown error occurred during sign-in.");
      setUserAuth(null);
      setUserData(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(async () => {
    console.log("[AuthProvider] logout called");
    setLoading(true);
    await signOut(firebaseAuth);
    setUserAuth(null);
    setUserData(null);
    setToken(null);
    setError(null);
    setLoading(false);
    router.push('/');
  }, [router]);

  // useEffect dependency array is now corrected.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      console.log("[AuthProvider] auth state changed");
      if (user) {
        const idToken = await user.getIdToken();
        setUserAuth(user);
        setToken(idToken);
        // This condition correctly uses the closure's initial `userData` state (null)
        // to ensure it only runs once on session restore.
        if (!userData) {
            try {
                const fetchedData = await fetchUserData(idToken);
                setUserData(fetchedData);
            } catch (e: any) {
                console.error("Session restore error:", e);
                setError(e.message);
                await logout();
            }
        }
      } else {
        setUserAuth(null);
        setUserData(null);
        setToken(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
    // By removing `userData`, we break the infinite loop. The effect now runs only when
    // the component mounts, which is the correct behavior for onAuthStateChanged.
  }, [logout]);

  const isAdmin = userData?.roleLevel >= ADMIN_LEVEL;
  // isLoggedIn is also corrected to not use isAnonymous
  const isLoggedIn = !!userAuth && !!userData;

  const value = {
    userAuth,
    userData,
    token,
    loading,
    error,
    isAdmin,
    isLoggedIn,
    signIn,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
