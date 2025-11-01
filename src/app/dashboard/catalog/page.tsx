
// src/app/dashboard/catalog/page.tsx
// (No 'use client' directive here)

// Imports for Server Component
import { firebaseAdminAuth, firebaseAdminFirestore } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import type { Gift, Collection, Rarity, User } from '@/lib/types';
import CatalogPageClient from './catalog-page-client'; // New Client Component
import { redirect } from 'next/navigation';
import { DEFAULT_USER_ID } from '@/lib/constants';

// --- Server-side Data Fetching Function ---
async function fetchCatalogData() {
  const sessionCookie = (await cookies()).get('session')?.value || '';

  if (!sessionCookie) {
      console.log('[CatalogPage Server] No session cookie found, redirecting to login.');
      redirect('/'); // Redirect to login if no session
  }

  let firebaseUser: { uid: string; isAnonymous: boolean; } | null = null;
  let userData: User | null = null;

  try {
      const decodedClaims = await firebaseAdminAuth.verifySessionCookie(sessionCookie, true);
      firebaseUser = { uid: decodedClaims.uid, isAnonymous: decodedClaims.firebase.sign_in_provider === 'anonymous' };

      // Fetch user data from Firestore
      const userId = firebaseUser.isAnonymous ? DEFAULT_USER_ID : firebaseUser.uid;
      const userDoc = await firebaseAdminFirestore.collection('users').doc(userId).get();

      if (!userDoc.exists) {
          console.warn(`[CatalogPage Server] Authenticated user (UID: ${userId}) has no Firestore profile. Redirecting to login.`);
          redirect('/'); 
      }
      userData = { id: userDoc.id, ...(userDoc.data() as Omit<User, 'id'>) };

      // --- Fetch all catalog-specific data ---
      const [giftsSnapshot, collectionsSnapshot, raritiesSnapshot] = await Promise.all([
          firebaseAdminFirestore.collection('gifts').get(),
          firebaseAdminFirestore.collection('collections').get(),
          firebaseAdminFirestore.collection('rarities').get(),
      ]);

      const gifts = giftsSnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<Gift, 'id'>) }));
      const allCollections = collectionsSnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<Collection, 'id'>) }));
      const allRarities = raritiesSnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<Rarity, 'id'>) }));

      return {
          isAuthenticated: true,
          currentUser: userData,
          gifts,
          allCollections,
          allRarities,
          error: null
      };

  } catch (error: any) {
      console.error('[CatalogPage Server] Authentication or data fetching failed:', error);
      (await cookies()).delete('session');
      redirect('/'); // Redirect to login on any server-side auth/data error
  }
}

export default async function CatalogPage() {
  const data = await fetchCatalogData();

  // If redirected, this part won't execute.
  // Pass the fetched data to a Client Component for interaction
  return (
    <CatalogPageClient
      initialCurrentUser={data.currentUser}
      initialGifts={data.gifts}
      initialCollections={data.allCollections}
      initialRarities={data.allRarities}
      serverError={data.error}
    />
  );
}