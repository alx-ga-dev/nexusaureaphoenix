import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { firebaseAdminAuth, firebaseAdminFirestore } from '@/lib/firebase-admin';
import type { Gift, User, Transaction } from '@/lib/types';
import { Suspense } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import PayDeliverClientPage from './pay-deliver-client';
import { getOrSetCache } from '@/lib/cache';
import { DEFAULT_USER_ID, MANAGER_LEVEL } from '@/lib/constants';

// Define the Operation type directly in this server component,
// as it's needed for server-side logic and not imported from the client component.
type Operation = 'Pay' | 'Deliver' | 'Cancel';

async function fetchPayDeliverData() {
  const sessionCookie = (await cookies()).get('session')?.value || '';
  const searchParamsCookie = (await cookies()).get('searchParams');
  const searchParams = new URLSearchParams(searchParamsCookie?.value || '');
  
  // Clear searchParams cookie after reading, if it was set for a one-time use
  if (searchParamsCookie) {
    (await cookies()).delete('searchParams');
  }

  let serverError: string | null = null;

  try {
      const decodedClaims = await firebaseAdminAuth.verifySessionCookie(sessionCookie, true);

      // IMPORTANT: Role check for this page
      if ( decodedClaims.roleLevel < MANAGER_LEVEL ) {
        console.warn(`[PayDeliverPage Server] User ${decodedClaims.uid} is not a manager. Redirecting to dashboard.`);
        redirect('/dashboard'); // Redirect non-admins to dashboard
    }

    // Fetch current user data from Firestore
      const userId = decodedClaims.uid;

      // --- Fetch all data in parallel using the cache ---
      const [currentUser, initialUsers, initialGifts, allTransactions] = await Promise.all([
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

      // Derive initial state for client component from URL params
      const urlTxId = searchParams.get('txId');
      const urlUserIdParam = searchParams.get('userId');
      const urlActionParam = (searchParams.get('operation') as Operation) || 'Pay';

      let initialSelectedUserId: string | null = urlUserIdParam;
      let initialSelectedOperation: Operation = urlActionParam;
      let initialTransaction: Transaction | null = null;

      if (urlTxId) {
          initialTransaction = allTransactions.find(tx => tx.id === urlTxId) || null;
          if (initialTransaction) {
              // Derive userId based on action type if txId is present
              if (initialSelectedOperation === 'Pay' || initialSelectedOperation === 'Cancel') {
                  initialSelectedUserId = initialTransaction.fromUserId;
              } else if (initialSelectedOperation === 'Deliver') {
                  initialSelectedUserId = initialTransaction.toUserId;
              }
          } else {
              console.warn(`[PayDeliverPage Server] Transaction with ID ${urlTxId} not found.`);
              serverError = `Transaction with ID ${urlTxId} not found.`;
          }
      }
      
      // Filter transactions based on initial derived state
      const initialTransactionsFiltered = allTransactions.filter(tx => {
        if (((currentUser?.roleLevel || 0) < MANAGER_LEVEL) && !(tx.fromUserId === currentUser?.id || tx.toUserId === currentUser?.id)) {
          return false;
        }

        if (initialSelectedOperation === 'Deliver') {
          return tx.toUserId === initialSelectedUserId && tx.deliveryStatus === 'Pending' && tx.paymentStatus === 'Completed';
        } else if (initialSelectedOperation === 'Pay') {
          return tx.fromUserId === initialSelectedUserId && tx.paymentStatus === 'Pending';
        } else if (initialSelectedOperation === 'Cancel') {
          return (tx.fromUserId === initialSelectedUserId || tx.toUserId === initialSelectedUserId) && 
                 (tx.paymentStatus === 'Pending' || tx.deliveryStatus === 'Pending');
        }
        return false;
      });

      console.log(`[PayDeliverPage Server] Admin authenticated: ${userId}. Initial transactions to display: ${initialTransactionsFiltered.length}`);
      return {
          isAuthenticated: true,
          currentUser,
          initialGifts,
          initialUsers,
          initialTransactions: initialTransactionsFiltered,
          initialSelectedUserId,
          initialSelectedOperation,
          serverError
      };

  } catch (error: any) {
      console.error('[PayDeliverPage Server] Authentication or data fetching failed:', error);
      (await cookies()).delete('session');
      redirect('/'); // Redirect to login on any server-side auth/data error
  }
}

export default async function PayDeliverPageWrapper() {
  // Fetch initial data for the server component
  const data = await fetchPayDeliverData();

  // If redirected, this part won't execute.
  // Pass the fetched data to a Client Component for interaction
  return (
    <Suspense fallback={ // Removed use of t() in fallback, as it's a client hook
      <div className="flex flex-col h-full">
        <PageHeader title="Process Transactions" description="Manage gift deliveries, settlements, and cancellations." />
        <div className="flex-1 p-4 md:p-6"><Skeleton className="h-full w-full" /></div>
      </div>
    }>
      <PayDeliverClientPage
        initialCurrentUser={data.currentUser}
        initialGifts={data.initialGifts}
        initialUsers={data.initialUsers}
        initialTransactions={data.initialTransactions}
        initialSelectedUserId={data.initialSelectedUserId}
        initialSelectedOperation={data.initialSelectedOperation}
        serverError={data.serverError}
      />
    </Suspense>
  );
}