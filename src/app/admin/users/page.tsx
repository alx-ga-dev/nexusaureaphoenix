import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { Suspense } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { firebaseAdminAuth, firebaseAdminFirestore } from '@/lib/firebase-admin';

import AdminUsersClient from './admin-users-client';
import { User, Transaction } from '@/lib/types'; // Import Transaction type
import { getOrSetCache } from '@/lib/cache';
import { ADMIN_LEVEL } from '@/lib/constants';

// Define the extended User type with transactions
interface UserWithTransactions extends User {
  transactions: Transaction[];
}

async function fetchAdminUsersData() {
  const sessionCookie = (await cookies()).get('session')?.value || '';

  if (!sessionCookie) {
      console.log('[AdminUsersPage Server] No session cookie found, redirecting to login.');
      redirect('/');
  }

  try {
      const decodedClaims = await firebaseAdminAuth.verifySessionCookie(sessionCookie, true);
    
      const userId = decodedClaims.uid;

      if (decodedClaims.roleLevel < ADMIN_LEVEL) {
        console.warn(`[AdminUsersPage Server] User ${userId} is not an admin. Redirecting to dashboard.`);
        redirect('/dashboard');
      }
      
      // --- Fetch all data in parallel using the cache ---
      const [currentUser, allUsers, allTransactions] = await Promise.all([
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
  
        getOrSetCache('transactions:all', async () => {
            const snapshot = await firebaseAdminFirestore.collection('transactions').get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<Transaction, 'id'>) }));
        }, 30) // Cache for 30 seconds
      ]);

      // Merge user data and their transactions
      const initialUsers = allUsers.map(user => {
        // Use filter() to find all transactions for the current user
        const userTransactions = allTransactions.filter(
          transaction => transaction.participants.includes(user.id)
        );
      
        // Return a new object that merges the user data with the new transactions array
        return {
          ...user,
          transactions: userTransactions,
        };
      });
      
      console.log(`[AdminUsersPage Server] Admin authenticated: ${userId}. Fetched ${initialUsers.length} users with their transactions.`);
      
      return {
          currentUser,
          initialUsers, // This now contains users with their transactions
          serverError: null
      };

  } catch (error: any) {
      console.error('[AdminUsersPage Server] Authentication or data fetching failed:', error);
      (await cookies()).delete('session');
      redirect('/');
  }
}

export default async function AdminUsersPageWrapper() {
  const data = await fetchAdminUsersData();

  return (
    <Suspense fallback={
      <div className="flex flex-col h-full">
        <PageHeader title="User Management" description="Manage users and their roles." />
        <div className="p-4 md:p-6">
          <Skeleton className="h-10 w-full mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        </div>
      </div>
    }>
      <AdminUsersClient
        initialCurrentUser={data.currentUser}
        initialUsers={data.initialUsers} // Pass the enhanced user data
        serverError={data.serverError}
      />
    </Suspense>
  );
}