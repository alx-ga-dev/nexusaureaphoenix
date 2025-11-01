// src/app/dashboard/dashboard-page-client.tsx
'use client';

import React, { useMemo, useEffect } from 'react'; // Import useEffect
import { PageHeader } from '@/components/PageHeader';
import { useTranslation } from '@/hooks/use-translation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { User as UserIcon, ArrowRightLeft, Gift, Check, X, Hourglass, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Transaction, Gift as GiftType, User } from '@/lib/types';
import { useAuth } from '@/components/AuthProvider';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardPageClientProps {
  initialCurrentUser: User | null;
  initialGifts: GiftType[];
  initialUsers: User[];
  initialPendingGifts: Transaction[];
  initialRecentTransactions: Transaction[];
  initialFeaturedGift: GiftType | null;
  serverError?: string | null;
}

export default function DashboardPageClient({
  initialCurrentUser,
  initialGifts,
  initialUsers,
  initialPendingGifts,
  initialRecentTransactions,
  initialFeaturedGift,
  serverError,
}: DashboardPageClientProps) {
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();

  const { userAuth, userData, loading: authLoading, token, error: authClientError } = useAuth();

  const currentUser = userData || initialCurrentUser;
  const gifts = initialGifts;
  const users = initialUsers;
  const pendingGifts = initialPendingGifts;
  const recentTransactions = initialRecentTransactions;
  const featuredGift = initialFeaturedGift;
  const currentError = serverError || authClientError;

  // Handle redirection for unauthenticated users
  useEffect(() => {
    // Only redirect if auth is no longer loading and user is not found
    if (!authLoading && !currentUser) {
      console.log('[DashboardPageClient] User not authenticated. Redirecting. (userAuth: ', userAuth, ', currentUser: ', currentUser, ')');
      router.push('/');
    }
  }, [authLoading, currentUser, router]);

  if (authLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center p-4">
        <PageHeader title={t('dashboardTitle')} description={t('dashboardSubTitle')} />
        <Skeleton className="h-40 w-full max-w-lg mt-8" />
        <p className="mt-4 text-muted-foreground">{t('loading')}...</p>
      </div>
    );
  }

  if (currentError) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center p-4">
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold font-headline mb-2">{t('error')}</h1>
        <p className="text-muted-foreground max-w-md">{currentError}</p>
        <Button asChild className="mt-4"><Link href="/">{t('returnToLogin')}</Link></Button>
      </div>
    );
  }

  // If user is still not authenticated after loading, the useEffect will handle redirection.
  // Returning null here prevents rendering anything for a brief moment before redirect.
  if (!currentUser) {
    // This case should ideally be handled by the Server Component's redirect,
    // but a client-side fallback ensures resilience.
    console.log('[DashboardPageClient] User not authenticated. Redirecting (resilience. userAuth: ', userAuth, ', currentUser: ', currentUser, ').');
    router.push('/');
  }

  const handleGiftResponse = async (txId: string, accepted: boolean) => {
    if (!token) {
      toast({ variant: 'destructive', title: t('authenticationError'), description: t('notAuthenticatedWarning') });
      return;
    }
    try {
      if (accepted) {
        await fetch('/api/data', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                collection: 'transactions',
                docId: txId,
                data: {
                    type: 'gift',
                    deliveryStatus: 'Delivered',
                    date: new Date().toISOString(),
                }
            }),
        });
      } else {
        await fetch('/api/data', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ collection: 'transactions', docId: txId }),
        });
      }
      toast({
        title: accepted ? t('giftAcceptedToast') : t('giftDeclinedToast'),
        description: t('giftConfirmationToast'),
      });
      router.refresh();
    } catch (error: any) {
      console.error('Failed to respond to gift:', error);
      toast({
        variant: 'destructive',
        title: t('error'),
        description: error.message || t('failedToProcessYourResponse'),
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={`${t('dashboardTitle')}${currentUser.name}!`} description={t('dashboardSubTitle')} />
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {pendingGifts && pendingGifts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2">
                <Hourglass className="text-primary" /> {t('pendingGiftsTitle')}
              </CardTitle>
              <CardDescription>{t('pendingGiftsSubTitle')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                { pendingGifts.map((tx: Transaction) => {
                  const gift = gifts?.find((g: GiftType) => g.id === tx.giftId);
                  const fromUser = users?.find((u: User) => u.id === tx.fromUserId);
                  const giftName = gift ? gift.name[language] || gift.name.en : '';
                  return (
                    <li key={tx.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Image src={gift?.imageUrl || ''} alt={giftName} width={48} height={48} className="rounded-md" data-ai-hint={gift?.imageHint} />
                        <div>
                          <p className="text-sm font-medium">
                            <span className="font-semibold">{fromUser?.name}</span>
                            {t('sentYou')} 
                            <span className="font-semibold text-primary">{giftName}</span>.
                          </p>
                          <p className="text-xs text-muted-foreground">{new Date(tx.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <Button size="sm" variant="outline" onClick={() => handleGiftResponse(tx.id, false)}>
                          <X className="mr-2 h-4 w-4" />
                          {t('declineButton')}
                        </Button>
                        <Button size="sm" onClick={() => handleGiftResponse(tx.id, true)}>
                          <Check className="mr-2 h-4 w-4" />
                          {t('acceptButton')}
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        )}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
              <CardTitle className="font-headline">{t('recentActivityTitle')}</CardTitle>
            </CardHeader>
          <CardContent>
            <ul className="space-y-4">{
              recentTransactions?.map((tx: Transaction) => {
                const gift = gifts?.find((g: GiftType) => g.id === tx.giftId);
                const fromUser = users?.find((u: User) => u.id === tx.fromUserId);
                const toUser = users?.find((u: User) => u.id === tx.toUserId);
                
                const fromName = fromUser?.id === currentUser?.id ? t('you') : fromUser?.name;
                const toName = toUser?.id === currentUser?.id ? t('you').toLowerCase() : toUser?.name;
                const actionText = tx.type === 'send' ? t('sent') : t('gifted');
                const giftName = gift ? gift.name[language] || gift.name.en : '';
                
                return (
                  <li key={tx.id} className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      {tx.type === 'send' ? <ArrowRightLeft className="h-4 w-4 text-muted-foreground" /> : <Gift className="h-4 w-4 text-muted-foreground" />}
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {fromName} {actionText} <span className="font-semibold text-primary">{giftName}</span> to {toName}.
                      </p>
                      <p className="text-xs text-muted-foreground">{new Date(tx.date).toLocaleDateString()}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
          </Card>
          {featuredGift && (
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="font-headline">{t('featuredGiftTitle')}</CardTitle>
                <CardDescription>{t('featuredGiftSubTitle')}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-center items-center">
                <div className="relative w-full h-48 mb-4">
                  <Image src={featuredGift.imageUrl} alt={featuredGift.name[language] || featuredGift.name.en} fill objectFit="cover" className="rounded-lg" data-ai-hint={featuredGift.imageHint} />
                </div>
                <h3 className="font-semibold">{featuredGift.name[language] || featuredGift.name.en}</h3>
                <p className="text-sm text-muted-foreground">{featuredGift.collection}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}