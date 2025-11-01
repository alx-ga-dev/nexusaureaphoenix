
// src/app/dashboard/users/[id]/page.tsx
'use server';

import { firebaseAdminAuth, firebaseAdminFirestore } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import type { Gift, User, Transaction } from '@/lib/types';
import UserProfileClient from './user-profile-client';
import { getOrSetCache } from '@/lib/cache';

interface UserProfilePageProps {
  params: { id: string };
}

// --- Server-side Data Fetching Function ---
async function fetchUserProfileData(profileUserId: string) {
  const sessionCookie = (await cookies()).get('session')?.value || '';

  try {
    const decodedClaims = await firebaseAdminAuth.verifySessionCookie(sessionCookie, true);
    const currentUserId = decodedClaims.uid;

    // --- Fetch all data in parallel using the cache ---
    const [profileUser, currentUser, allGifts, giftedTransactions] = await Promise.all([
      getOrSetCache(`user:${profileUserId}`, async () => {
        const userDoc = await firebaseAdminFirestore.collection('users').doc(profileUserId).get();
        if (!userDoc.exists) return null;
        return { id: userDoc.id, ...(userDoc.data() as Omit<User, 'id'>) };
      }, 30), // Cache profile user data for 30s

      getOrSetCache(`user:${currentUserId}`, async () => {
        const userDoc = await firebaseAdminFirestore.collection('users').doc(currentUserId).get();
        if (!userDoc.exists) return null;
        return { id: userDoc.id, ...(userDoc.data() as Omit<User, 'id'>) };
      }, 30), // Cache current user data for 30s

      getOrSetCache('gifts:all', async () => {
        const snapshot = await firebaseAdminFirestore.collection('gifts').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<Gift, 'id'>) }));
      }, 0), // On-demand revalidation for all gifts

      getOrSetCache(`transactions:gifted:${profileUserId}`, async () => {
        const snapshot = await firebaseAdminFirestore.collection('transactions').where('toUserId', '==', profileUserId).where('deliveryStatus', '==', 'Delivered').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<Transaction, 'id'>) }));
      }, 30) // Cache for 30 seconds
    ]);

    if (!profileUser) {
      return { profileUser: null, wishlist: null, allGifts: [], giftedGiftIds: [], error: 'User profile not found.' };
    }
    
    if (!currentUser) {
        return { profileUser: null, wishlist: null, allGifts: [], giftedGiftIds: [], error: 'Could not verify current user.' };
    }

    const giftedGiftIds = (giftedTransactions || []).map(tx => tx.giftId);

    return {
      profileUser,
      wishlist: profileUser.wishlist,
      allGifts: allGifts || [],
      giftedGiftIds,
      error: null
    };

  } catch (error: any) {
    console.error('[UserProfile Server] Authentication or data fetching failed:', error);
    (await cookies()).delete('session');
    return {
      profileUser: null,
      wishlist: null,
      allGifts: [],
      giftedGiftIds: [],
      error: 'Authentication or data fetching failed. Please try logging in again.'
    };
  }
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
    const { id } = await params
    const { profileUser, wishlist, allGifts, giftedGiftIds, error } = await fetchUserProfileData(id);

    return (
        <UserProfileClient
            profileUser={profileUser}
            wishlist= {wishlist || null}
            allGifts={allGifts}
            giftedGiftIds={giftedGiftIds}
            serverError={error}
        />
    );
}
