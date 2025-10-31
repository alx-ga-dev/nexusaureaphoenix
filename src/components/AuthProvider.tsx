
'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, User, signOut, signInWithCustomToken, getIdToken } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { firebaseAuth } from '@/lib/firebase';
import { ADMIN_LEVEL } from '@/lib/constants';

// The 'token' is back in the context, as it's needed for API calls.
interface AuthContextType {
  userAuth: User | null;
  userData: any;
  token: string | null; // <-- THIS IS THE FIX
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  isLoggedIn: boolean;
  isAnonymous: boolean;
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

// This is a new helper function to fetch user data on session restoration (e.g., page refresh)
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
  const [token, setToken] = useState<string | null>(null); // Token state is back
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const isAnonymous = userAuth ? userAuth.isAnonymous : false;

  // The new signIn function accepts the pre-fetched user data.
  // This is the key to the performance improvement on initial login.
  const signIn = async (customToken: string, fetchedUserData: any) => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithCustomToken(firebaseAuth, customToken);
      const idToken = await userCredential.user.getIdToken();
      setUserAuth(userCredential.user);
      setToken(idToken);
      // We set the user data that we already fetched from the server action.
      // This avoids a redundant client-side fetch.
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
    setLoading(true);
    await signOut(firebaseAuth);
    setUserAuth(null);
    setUserData(null);
    setToken(null);
    setError(null);
    setLoading(false);
    router.push('/');
  }, [router]);

  // onAuthStateChanged handles session restoration (e.g. page refresh)
  // and token refresh.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (user) {
        const idToken = await user.getIdToken();
        setUserAuth(user);
        setToken(idToken);
        // If userData is not already loaded (i.e., this is a page refresh, not a fresh login),
        // then we fetch it using the token.
        if (!userData) {
            try {
                const fetchedData = await fetchUserData(idToken);
                setUserData(fetchedData);
            } catch (e: any) {
                console.error("Session restore error:", e);
                setError(e.message);
                // Logout if we have a firebase user but can't get their data
                await logout();
            }
        }
      } else {
        // User is not logged in.
        setUserAuth(null);
        setUserData(null);
        setToken(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
    // We add `logout` and `userData` to deps to handle the session restore case correctly.
  }, [logout, userData]);

  const isAdmin = userData?.roleLevel >= ADMIN_LEVEL;
  // The definition of isLoggedIn now correctly depends on having user data.
  const isLoggedIn = !!userAuth && !!userData && !isAnonymous;

  const value = {
    userAuth,
    userData,
    token, // The token is now provided to the rest of the app
    loading,
    error,
    isAdmin,
    isLoggedIn,
    isAnonymous,
    signIn,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
