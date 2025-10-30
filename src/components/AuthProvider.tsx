
'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { firebaseAuth } from '@/lib/firebase';
import { useUser } from '@/hooks/use-user';
import { signInWithCustomToken } from 'firebase/auth';
import { ADMIN_LEVEL } from '@/lib/constants';

// Define the shape of the context data
interface AuthContextType {
  firebaseUser: User | null; // Explicitly for Firebase Auth User object
  userData: any; // Explicitly for Firestore user profile data
  token: string | null;
  loading: boolean; // Consolidated loading state
  error: Error | null;
  isAdmin: boolean;
  isLoggedIn: boolean;
  isAnonymous: boolean;
  login: (customToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Create the authentication context
console.log('[AuthProvider] Creating AuthContext');
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use the authentication context
export const useAuth = () => {
  console.log(`[AuthProvider] Verifying context from ${AuthContext}`);
  const context = useContext(AuthContext);
  console.log(`[AuthProvider] Verifying context: ${context}`);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Provider component that wraps the app and makes auth object available to any child component
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authUser, setAuthUser] = useState<User | null>(null); // Raw Firebase Auth User
  const [token, setToken] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true); // Internal loading for Firebase Auth state
  const [error, setError] = useState<Error | null>(null);
  const router = useRouter();

  const isAnonymous = authUser ? authUser.isAnonymous : false;

  const { user: profileData, error: userError, isLoading: userLoading, refetch } = useUser(token, {
    enabled: !!token, // Only fetch user data when a token is available
  });

  const login = async (customToken: string) => {
    try {
      console.log('[AuthProvider] Attempting to sign in with custom token.');
      const userCredential = await signInWithCustomToken(firebaseAuth, customToken);
      console.log('[AuthProvider] Successfully signed in with custom token.');
      setAuthUser(userCredential.user);
      const idToken = await userCredential.user.getIdToken();
      setToken(idToken);
    } catch (err: any) {
      console.error('[AuthProvider] Error during custom token sign-in:', err);
      setError(err);
      throw err; // Re-throw the error to be caught by the login page
    }
  };

  const logout = useCallback(async () => {
    await firebaseAuth.signOut();
    setAuthUser(null);
    setToken(null);
    console.log('[AuthProvider] User logged out. Redirecting to /');
    router.push('/'); // Redirect to login page after logout
  }, [router]);

  useEffect(() => {
    if (userError) {
      console.error('[AuthProvider] Error fetching user data, logging out:', userError);
      logout();
    }
  }, [userError, logout]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (currentUser) => {
      console.log('[AuthProvider] onAuthStateChanged triggered. User:', currentUser ? currentUser.uid : 'null');
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
      setLoadingAuth(false); // Firebase Auth state is now known
    });

    return () => unsubscribe();
  }, []);

  // Consolidated loading state: true if Firebase Auth is loading OR user data is loading AND there's an authUser
  const isLoading = loadingAuth || (!!authUser && userLoading);

  // Determine if the user is an admin
  const isAdmin = profileData?.roleLevel >= ADMIN_LEVEL;

  // Determine if user is logged in (based on profile data, not just authUser presence)
  const isLoggedIn = !!profileData && !isAnonymous; // Changed to use profileData for isLoggedIn

  const value = {
    firebaseUser: authUser,
    userData: profileData,
    token,
    loading: isLoading, // Export consolidated loading state
    error: error || userError,
    isAdmin,
    isLoggedIn,
    isAnonymous,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};