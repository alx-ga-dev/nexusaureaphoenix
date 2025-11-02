import { Suspense } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { PageHeader } from '@/components/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { firebaseAdminAuth, firebaseAdminFirestore } from '@/lib/firebase-admin';
import type { Gift, Collection, Rarity } from '@/lib/types';
import AdminGiftEditClient from './admin-catalog-edit-client';
import { getOrSetCache } from '@/lib/cache';
import { ADMIN_LEVEL } from '@/lib/constants';

async function fetchAdminGiftEditData(giftId: string) {
  const sessionCookie = (await cookies()).get('session')?.value || '';

  if (!sessionCookie) {
      console.log('[AdminGiftEditPage Server] No session cookie found, redirecting to login.');
      redirect('/'); // Redirect to login if no session
  }

  try {
      const decodedClaims = await firebaseAdminAuth.verifySessionCookie(sessionCookie, true);
      const userId = decodedClaims.uid;

      if (decodedClaims.roleLevel < ADMIN_LEVEL) {
        console.warn(`[AdminUsersPage Server] User ${userId} is not an admin. Redirecting to dashboard.`);
        redirect('/dashboard');
      }

      // --- Fetch all data in parallel using the cache ---
      const [initialGift, initialCollections, initialRarities] = await Promise.all([
        getOrSetCache(`gift:${giftId}`, async () => {
          console.log(`[Cache Miss] Fetching gift data for ${giftId}`);
          const giftDoc = await firebaseAdminFirestore.collection('gifts').doc(giftId).get();
          if (!giftDoc.exists) return null;
          return { id: giftDoc.id, ...(giftDoc.data() as Omit<Gift, 'id'>) };
        }, 30), // Cache current gift to edit for 30s

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

      console.log(`[AdminGiftEditPage Server] Admin ${userId} is editing gift ${giftId}.`);
      return {
          initialGift,
          initialCollections,
          initialRarities,
      };

  } catch (error: any) {
      console.error('[AdminGiftEditPage Server] Authentication or data fetching failed:', error);
      (await cookies()).delete('session');
      redirect('/'); // Redirect to login on any server-side auth/data error
  }
}

interface AdminGiftEditPageProps {
    params: { id: string };
}

export default async function AdminGiftEditPage({ params }: AdminGiftEditPageProps) {
  const data = await fetchAdminGiftEditData(params.id);

  return (
    <Suspense fallback={
      <div className="flex flex-col h-full">
        <PageHeader title="Edit Gift" description="Edit gift details in the catalog." />
        <div className="p-4 md:p-6">
          <Card>
            <CardHeader><Skeleton className="h-6 w-1/2"/></CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-8 w-full"/>
              <Skeleton className="h-8 w-full"/>
              <Skeleton className="h-8 w-full"/>
              <Skeleton className="h-8 w-full"/>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Skeleton className="h-10 w-24"/>
              <Skeleton className="h-10 w-24"/>
            </CardFooter>
          </Card>
        </div>
      </div>
    }>
      <AdminGiftEditClient
        initialGift={data.initialGift}
        initialCollections={data.initialCollections}
        initialRarities={data.initialRarities}
      />
    </Suspense>
  );
}