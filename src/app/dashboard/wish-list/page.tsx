import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { firebaseAdminAuth, firebaseAdminFirestore } from '@/lib/firebase-admin';
import type { Gift, User } from '@/lib/types';
import WishListClient from './wish-list-client';
import { getOrSetCache } from '@/lib/cache';

async function fetchWishListData() {
  const sessionCookie = (await cookies()).get('session')?.value || '';

  if (!sessionCookie) {
      console.log('[WishListPage Server] No session cookie found, redirecting to login.');
      redirect('/'); // Redirect to login if no session
  }

  try {
        const decodedClaims = await firebaseAdminAuth.verifySessionCookie(sessionCookie, true);
        const userId = decodedClaims.uid;

        // --- Fetch all data in parallel using the cache ---
        const [currentUser, allGifts] = await Promise.all([

            getOrSetCache(`user:${userId}`, async () => {
                const userDoc = await firebaseAdminFirestore.collection('users').doc(userId).get();
                if (!userDoc.exists) return null;
                return { id: userDoc.id, ...(userDoc.data() as Omit<User, 'id'>) };
            }, 30), // Cache current user data for 30s

            getOrSetCache('gifts:all', async () => {
                const snapshot = await firebaseAdminFirestore.collection('gifts').get();
                return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<Gift, 'id'>) }));
            }, 0), // On-demand revalidation for all gifts

        ]);

      // Get the user's wishlist gift IDs from the user document
      const wishlistGiftIds = new Set(currentUser?.wishlist || []);
      const wishlistGifts: Gift[] = allGifts.filter(gift => wishlistGiftIds.has(gift.id));

      console.log(`[WishListPage Server] User authenticated: ${userId}. Wishlist items: ${wishlistGifts.length}`);
      return {
          isAuthenticated: true,
          currentUser,
          initialWishlistGifts: wishlistGifts,
          initialAllGifts: allGifts,
          error: null
      };

  } catch (error: any) {
      console.error('[WishListPage Server] Authentication or data fetching failed:', error);
      (await cookies()).delete('session');
      redirect('/'); // Redirect to login on any server-side auth/data error
  }
}

export default async function WishListPage() {
  const data = await fetchWishListData();

  // If redirected, this part won't execute.
  // Pass the fetched data to a Client Component for interaction
  return (
    <WishListClient
      initialCurrentUser={data.currentUser}
      initialWishlistGifts={data.initialWishlistGifts}
      initialAllGifts={data.initialAllGifts}
      serverError={data.error}
    />
  );
}