
// src/app/dashboard/page.tsx
'use server';

import { firebaseAdminAuth, firebaseAdminFirestore } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import type { Gift, User, Transaction } from '@/lib/types';
import DashboardPageClient from './dashboard-page-client';
import { getOrSetCache } from '@/lib/cache';

// --- Server-side Data Fetching Function with Caching ---
async function fetchDashboardData() {
  const sessionCookie = (await cookies()).get('session')?.value || '';

  let userData: User | null = null;

  try {
    const decodedClaims = await firebaseAdminAuth.verifySessionCookie(sessionCookie, true);
    const userId = decodedClaims.uid;

    // --- 1. Fetch user data with caching ---
    userData = await getOrSetCache(`user:${userId}`, async () => {
      const userDoc = await firebaseAdminFirestore.collection('users').doc(userId).get();
      if (!userDoc.exists) return null;
      return { id: userDoc.id, ...(userDoc.data() as Omit<User, 'id'>) };
    }, 0); // Use on-demand revalidation

    if (!userData) {
      console.warn(`[DashboardPage Server] Authenticated user (UID: ${userId}) has no Firestore profile.`);
      // Ensure the returned object has a consistent shape
      return {
        isAuthenticated: true,
        currentUser: null,
        gifts: [],
        users: [],
        pendingGifts: [],
        recentTransactions: [],
        featuredGift: null,
        error: `User ID ${userId} has no profile.`
      };
    }

    // --- 2. Fetch all other dashboard data in parallel, with caching ---
    const [gifts, users, pendingGifts, recentTransactions, featuredGift] = await Promise.all([
      // On-demand revalidation for static catalogs
      getOrSetCache('gifts:all', async () => {
        console.log('[Cache Miss] Fetching all gifts');
        const snapshot = await firebaseAdminFirestore.collection('gifts').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<Gift, 'id'>) }));
      }, 0), // Use on-demand revalidation

      getOrSetCache('users:all', async () => {
        console.log('[Cache Miss] Fetching all users');
        const snapshot = await firebaseAdminFirestore.collection('users').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<User, 'id'>) }));
      }, 0), // Use on-demand revalidation

      // Time-based TTL for dynamic, user-specific data
      getOrSetCache(`transactions:pending:${userId}`, async () => {
        console.log(`[Cache Miss] Fetching pending transactions for user: ${userId}`);
        const snapshot = await firebaseAdminFirestore.collection('transactions').where('toUserId', '==', userId).where('deliveryStatus', '==', 'Pending').where('type', '==', 'send').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<Transaction, 'id'>) }));
      }, 30), // Cache for 30 seconds

      getOrSetCache(`transactions:recent:${userId}`, async () => {
        console.log(`[Cache Miss] Fetching recent transactions for user: ${userId}`);
        const snapshot = await firebaseAdminFirestore.collection('transactions').where('participants', 'array-contains', userId).orderBy('date', 'desc').limit(5).get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<Transaction, 'id'>) }));
      }, 30), // Cache for 30 seconds

      // On-demand revalidation for the featured gift
      getOrSetCache('gifts:featured', async () => {
        console.log('[Cache Miss] Fetching featured gift');
        const snapshot = await firebaseAdminFirestore.collection('gifts').where('rarity', '==', 'Legendary').limit(1).get();
        if (snapshot.empty) return null;
        return { id: snapshot.docs[0].id, ...(snapshot.docs[0].data() as Omit<Gift, 'id'>) };
      }, 0) // Use on-demand revalidation
    ]);

    return {
      isAuthenticated: true,
      currentUser: userData,
      gifts: gifts || [],
      users: users || [],
      pendingGifts: pendingGifts || [],
      recentTransactions: recentTransactions || [],
      featuredGift: featuredGift || null,
      error: null
    };

  } catch (error: any) {
    console.error('[DashboardPage Server] Authentication or data fetching failed:', error);
    (await cookies()).delete('session');
    return {
      isAuthenticated: false,
      currentUser: null,
      gifts: [],
      users: [],
      pendingGifts: [],
      recentTransactions: [],
      featuredGift: null,
      error: 'Authentication or data fetching failed. Please try logging in again.'
    };
  }
}

export default async function DashboardPage() {
  const data = await fetchDashboardData();

  return (
    <DashboardPageClient
      initialCurrentUser={data.currentUser}
      initialGifts={data.gifts}
      initialUsers={data.users}
      initialPendingGifts={data.pendingGifts}
      initialRecentTransactions={data.recentTransactions}
      initialFeaturedGift={data.featuredGift}
      serverError={data.error}
    />
  );
}
