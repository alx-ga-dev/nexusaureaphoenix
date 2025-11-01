
// src/app/dashboard/catalog/page.tsx
'use server';

import { firebaseAdminAuth, firebaseAdminFirestore } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import type { Gift, Collection, Rarity, User } from '@/lib/types';
import CatalogPageClient from './catalog-page-client';
import { getOrSetCache } from '@/lib/cache';

// --- Server-side Data Fetching Function with Caching ---
async function fetchCatalogData() {
  const sessionCookie = (await cookies()).get('session')?.value || '';

  try {
    const decodedClaims = await firebaseAdminAuth.verifySessionCookie(sessionCookie, true);
    const userId = decodedClaims.uid;

    // --- Fetch all data in parallel using the cache ---
    const [currentUser, gifts, allCollections, allRarities] = await Promise.all([
      getOrSetCache(`user:${userId}`, async () => {
        const userDoc = await firebaseAdminFirestore.collection('users').doc(userId).get();
        if (!userDoc.exists) return null;
        return { id: userDoc.id, ...(userDoc.data() as Omit<User, 'id'>) };
      }, 60), // Cache user data for 60 seconds

      getOrSetCache('gifts:all', async () => {
        console.log('[Cache Miss] Fetching all gifts');
        const snapshot = await firebaseAdminFirestore.collection('gifts').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<Gift, 'id'>) }));
      }, 0), // On-demand revalidation

      getOrSetCache('collections:all', async () => {
        console.log('[Cache Miss] Fetching all collections');
        const snapshot = await firebaseAdminFirestore.collection('collections').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<Collection, 'id'>) }));
      }, 0), // On-demand revalidation

      getOrSetCache('rarities:all', async () => {
        console.log('[Cache Miss] Fetching all rarities');
        const snapshot = await firebaseAdminFirestore.collection('rarities').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<Rarity, 'id'>) }));
      }, 0) // On-demand revalidation
    ]);

    if (!currentUser) {
      return {
        currentUser: null,
        gifts: [],
        allCollections: [],
        allRarities: [],
        error: `User ID ${userId} has no profile.`
      };
    }

    return {
      currentUser,
      gifts: gifts || [],
      allCollections: allCollections || [],
      allRarities: allRarities || [],
      error: null
    };

  } catch (error: any) {
    console.error('[CatalogPage Server] Authentication or data fetching failed:', error);
    (await cookies()).delete('session');
    return {
      currentUser: null,
      gifts: [],
      allCollections: [],
      allRarities: [],
      error: 'Authentication or data fetching failed. Please try logging in again.'
    };
  }
}

export default async function CatalogPage() {
  const data = await fetchCatalogData();

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
