import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { Suspense } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';

import { firebaseAdminAuth, firebaseAdminFirestore } from '@/lib/firebase-admin';
import AdminUserEditClient from './admin-users-edit-client';
import type { User } from '@/lib/types';
import { getOrSetCache } from '@/lib/cache';
import { ADMIN_LEVEL } from '@/lib/constants';

async function fetchUserEditData(userIdToEdit: string) {
  const sessionCookie = (await cookies()).get('session')?.value || '';

  if (!sessionCookie) {
      console.log('[AdminUserEditPage Server] No session cookie found, redirecting to login.');
      redirect('/'); // Redirect to login if no session
  }

  let serverError: string | null = null;
  let userToEdit: User | null = null;

  try {
      const decodedClaims = await firebaseAdminAuth.verifySessionCookie(sessionCookie, true);
      const userId = decodedClaims.uid;

      if (decodedClaims.roleLevel < ADMIN_LEVEL) {
        console.warn(`[AdminUsersPage Server] User ${userId} is not an admin. Redirecting to dashboard.`);
        redirect('/dashboard');
      }

      // --- Fetch all data in parallel using the cache ---
      const [currentUser, userToEdit] = await Promise.all([
        getOrSetCache(`user:${userId}`, async () => {
            const userDoc = await firebaseAdminFirestore.collection('users').doc(userId).get();
            if (!userDoc.exists) return null;
            return { id: userDoc.id, ...(userDoc.data() as Omit<User, 'id'>) };
        }, 30), // Cache current user data for 30s

        getOrSetCache(`user:${userIdToEdit}`, async () => {
          console.log(`[Cache Miss] Fetching user data for ${userIdToEdit}`);
          const userDoc = await firebaseAdminFirestore.collection('users').doc(userIdToEdit).get();
          if (!userDoc.exists) return null;
          return { id: userDoc.id, ...(userDoc.data() as Omit<User, 'id'>) };
      }, 30), // Cache current user to edit for 30s
      ]);
      
      console.log(`[AdminUserEditPage Server] Admin ${userId} is editing user ${userIdToEdit}.`);
      return {
          isAuthenticated: true,
          currentUser,
          userToEdit,
          serverError
      };

  } catch (error: any) {
      console.error('[AdminUserEditPage Server] Authentication or data fetching failed:', error);
      (await cookies()).delete('session');
      redirect('/'); // Redirect to login on any server-side auth/data error
  }
}

interface AdminUserEditPageProps {
    params: { id: string };
}

export default async function AdminUserEditPage({ params }: AdminUserEditPageProps) {
  const data = await fetchUserEditData(params.id);

  return (
    <Suspense fallback={
      <div className="flex flex-col h-full">
        <PageHeader title="Edit User" description="Edit user details and roles." />
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
      <AdminUserEditClient
        initialEditUser={data.userToEdit}
        serverError={data.serverError}
      />
    </Suspense>
  );
}