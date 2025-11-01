
// src/app/dashboard/users/page.tsx
'use server';

import { firebaseAdminAuth, firebaseAdminFirestore } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import type { User } from '@/lib/types';
import UsersPageClient from './users-page-client';
import { getOrSetCache } from '@/lib/cache';

// --- Server-side Data Fetching Function ---
async function fetchUsersData() {
  const sessionCookie = (await cookies()).get('session')?.value || '';

  try {
    const decodedClaims = await firebaseAdminAuth.verifySessionCookie(sessionCookie, true);
    const userId = decodedClaims.uid;

    // Fetch current user and all users in parallel using the cache
    const [currentUser, allUsers] = await Promise.all([
      getOrSetCache(`user:${userId}`, async () => {
        const userDoc = await firebaseAdminFirestore.collection('users').doc(userId).get();
        if (!userDoc.exists) return null;
        return { id: userDoc.id, ...(userDoc.data() as Omit<User, 'id'>) };
      }, 60), // Cache current user data for 60 seconds

      getOrSetCache('users:all', async () => {
        console.log('[Cache Miss] Fetching all users');
        const snapshot = await firebaseAdminFirestore.collection('users').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<User, 'id'>) }));
      }, 0) // Use on-demand revalidation for all users
    ]);

    return {
      currentUser: currentUser,
      allUsers: allUsers || [],
      error: null
    };

  } catch (error: any) {
    console.error('[UsersPage Server] Authentication or data fetching failed:', error);
    // Invalidate the session cookie if verification fails
    (await cookies()).delete('session');
    return {
      currentUser: null,
      allUsers: [],
      error: 'Authentication or data fetching failed. Please try logging in again.'
    };
  }
}

export default async function UsersPage() {
  const { currentUser, allUsers, error } = await fetchUsersData();

  // Pass the fetched data to the Client Component
  return (
    <UsersPageClient
      initialCurrentUser={currentUser}
      initialAllUsers={allUsers}
      serverError={error}
    />
  );
}
