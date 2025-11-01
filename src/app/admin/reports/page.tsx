import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { firebaseAdminAuth, firebaseAdminFirestore } from '@/lib/firebase-admin';
import type { Gift, User, Transaction } from '@/lib/types';
import ManagementReportsClient from './reports-page-client';
import { getOrSetCache } from '@/lib/cache';
import { MANAGER_LEVEL } from '@/lib/constants';

async function fetchReportsData() {
  const sessionCookie = (await cookies()).get('session')?.value || '';

  try {
      const decodedClaims = await firebaseAdminAuth.verifySessionCookie(sessionCookie, true);

      // Fetch current user data from Firestore
      const userId = decodedClaims.uid;

      // IMPORTANT: Manager level or higher required to access this page
      if (decodedClaims.roleLevel < MANAGER_LEVEL) {
        console.warn(`[AdminReportsPage Server] User ${userId} is not manager or higher. Redirecting to dashboard.`);
        redirect('/dashboard'); // Redirect non-admins to dashboard
      }

      // --- Fetch all data in parallel using the cache ---
      const [currentUser, initialUsers, initialGifts, initialTransactions] = await Promise.all([
        getOrSetCache(`user:${userId}`, async () => {
            const userDoc = await firebaseAdminFirestore.collection('users').doc(userId).get();
            if (!userDoc.exists) return null;
            return { id: userDoc.id, ...(userDoc.data() as Omit<User, 'id'>) };
        }, 30), // Cache current user data for 30s

        getOrSetCache('users:all', async () => {
          console.log('[Cache Miss] Fetching all users');
          const snapshot = await firebaseAdminFirestore.collection('users').get();
          return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<User, 'id'>) }));
        }, 0), // Use on-demand revalidation for all users
  
        getOrSetCache('gifts:all', async () => {
            const snapshot = await firebaseAdminFirestore.collection('gifts').get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<Gift, 'id'>) }));
        }, 0), // On-demand revalidation for all gifts

        getOrSetCache('transactions:all', async () => {
            const snapshot = await firebaseAdminFirestore.collection('transactions').get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<Transaction, 'id'>) }));
        }, 30) // Cache for 30 seconds
      ]);

      console.log(`[AdminReportsPage Server] Admin authenticated: ${userId}. Fetched ${initialTransactions.length} transactions.`);
      return {
          isAuthenticated: true,
          currentUser,
          initialGifts,
          initialUsers,
          initialTransactions,
          error: null
      };

  } catch (error: any) {
      console.error('[AdminReportsPage Server] Authentication or data fetching failed:', error);
      (await cookies()).delete('session');
      redirect('/'); // Redirect to login on any server-side auth/data error
  }
}

export default async function ManagementReportsPage() {
  const data = await fetchReportsData();

  // If redirected, this part won't execute.
  // Pass the fetched data to a Client Component for interaction
  return (
    <ManagementReportsClient
      initialCurrentUser={data.currentUser}
      initialGifts={data.initialGifts}
      initialUsers={data.initialUsers}
      initialTransactions={data.initialTransactions}
      serverError={data.error}
    />
  );
}