import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { PageHeader } from '@/components/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import type { Gift, Collection, Rarity, User } from '@/lib/types';
import { firebaseAdminAuth, firebaseAdminFirestore } from '@/lib/firebase-admin';
import AdminCatalogClient from './admin-catalog-client';
import { getOrSetCache } from '@/lib/cache';
import { ADMIN_LEVEL } from '@/lib/constants';

async function fetchAdminCatalogData() {
  const sessionCookie = (await cookies()).get('session')?.value || '';

  if (!sessionCookie) {
      console.log('[AdminCatalogPage Server] No session cookie found, redirecting to login.');
      redirect('/'); // Redirect to login if no session
  }

  try {
      const decodedClaims = await firebaseAdminAuth.verifySessionCookie(sessionCookie, true);
      const userId = decodedClaims.uid;

      // IMPORTANT: Manager level or higher required to access this page
      if (decodedClaims.roleLevel < ADMIN_LEVEL) {
        console.warn(`[AdminCatalogPage Server] User ${userId} is not manager or higher. Redirecting to dashboard.`);
        redirect('/dashboard'); // Redirect non-admins to dashboard
      }

      // --- Fetch all data in parallel using the cache ---
      const [initialGifts, initialCollections, initialRarities] = await Promise.all([
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

      console.log(`[AdminCatalogPage Server] Admin authenticated: ${userId}. Fetched ${initialGifts.length} gifts.`);
      return {
          initialGifts,
          initialCollections,
          initialRarities
      };

  } catch (error: any) {
      console.error('[AdminCatalogPage Server] Authentication or data fetching failed:', error);
      (await cookies()).delete('session');
      redirect('/'); // Redirect to login on any server-side auth/data error
  }
}

export default async function AdminCatalogPage() {
  const data = await fetchAdminCatalogData();

  return (
    <Suspense fallback={
      <div className="flex flex-col h-full">
        <PageHeader title="Admin Catalog" description="Manage all gifts, collections, and rarities." />
        <div className="p-4 md:p-6">
          <Skeleton className="h-10 w-full mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    }>
      <AdminCatalogClient
        initialGifts={data.initialGifts}
        initialCollections={data.initialCollections}
        initialRarities={data.initialRarities}
      />
    </Suspense>
  );
}