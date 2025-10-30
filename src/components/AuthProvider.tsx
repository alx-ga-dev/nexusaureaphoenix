
'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, User, signOut, signInWithCustomToken } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { firebaseAuth } from '@/lib/firebase';
import { useUser } from '@/hooks/use-user';
import { ADMIN_LEVEL } from '@/lib/constants';

interface AuthContextType {
  firebaseUser: User | null;
  userData: any;
  token: string | null;
  loading: boolean;
  error: Error | null;
  isAdmin: boolean;
  isLoggedIn: boolean;
  isAnonymous: boolean;
  login: (customToken: string) => Promise<void>;
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

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const router = useRouter();

  const isAnonymous = authUser ? authUser.isAnonymous : false;

  const { user: profileData, error: userError, isLoading: userLoading } = useUser(token, {
    enabled: !!token,
  });

  const login = async (customToken: string) => {
    try {
      const userCredential = await signInWithCustomToken(firebaseAuth, customToken);
      setAuthUser(userCredential.user);
      const idToken = await userCredential.user.getIdToken();
      setToken(idToken);
    } catch (err: any) {
      setError(err);
      throw err;
    }
  };

  const logout = useCallback(async () => {
    await signOut(firebaseAuth);
    setAuthUser(null);
    setToken(null);
    router.push('/');
  }, [router]);

  useEffect(() => {
    if (userError) {
      console.error('[AuthProvider] Error fetching user data, logging out:', userError);
      logout();
    }
  }, [userError, logout]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (currentUser) => {
      setAuthUser(currentUser);
      if (currentUser) {
        try {
          const idToken = await currentUser.getIdToken();
          setToken(idToken);
        } catch (err) {
          console.error('[AuthProvider] Error getting ID token:', err);
          setToken(null);
        }
      } else {
        setToken(null);
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  const isLoading = loadingAuth || (!!authUser && userLoading);
  const isAdmin = profileData?.roleLevel >= ADMIN_LEVEL;
  const isLoggedIn = !!profileData && !isAnonymous;

  const value = {
    firebaseUser: authUser,
    userData: profileData,
    token,
    loading: isLoading,
    error: error || userError,
    isAdmin,
    isLoggedIn,
    isAnonymous,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
