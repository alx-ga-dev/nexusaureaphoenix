// src/app/dashboard/wish-list/wish-list-client.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { PageHeader } from '@/components/PageHeader';
import { useAuth } from '@/components/AuthProvider';
import { Gift, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Loader2, RefreshCcw, AlertTriangle } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

interface WishListClientProps {
  initialCurrentUser: User | null;
  initialWishlistGifts: Gift[];
  initialAllGifts: Gift[]; // All available gifts for AI suggestions
  serverError?: string | null;
}

export default function WishListClient({
  initialCurrentUser,
  initialWishlistGifts,
  initialAllGifts,
  serverError,
}: WishListClientProps) {
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const { userAuth, userData, loading: authLoading, token, error: authClientError } = useAuth();

  const currentUser = userData || initialCurrentUser;
  const [wishlistGifts, setWishlistGifts] = useState<Gift[]>(initialWishlistGifts);

  // Update wishlistGifts if initial props change (e.g., after an add/remove that revalidates data)
  useEffect(() => {
    setWishlistGifts(initialWishlistGifts);
  }, [initialWishlistGifts]);

  const currentError = serverError || authClientError;

  const availableGiftsForSuggestions = useMemo(() => {
    if (!initialAllGifts) return [];
    const wishlistGiftIds = new Set(wishlistGifts.map(g => g.id));
    return initialAllGifts.filter(gift => !wishlistGiftIds.has(gift.id));
  }, [initialAllGifts, wishlistGifts]);

  const handleAddGiftToWishlist = useCallback(async (giftId: string) => {
    if (!currentUser || !token) return;

    toast({
      title: t('addingGift'),
      description: t('addingGiftDesc'),
    });

    try {
      const response = await fetch('/api/firestore/users/' + currentUser.id, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'addWishlistItem', giftId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to add gift to wishlist');
      }

      // Trigger a revalidation of the server-side data by refreshing the router
      // This will cause the parent Server Component to re-fetch data and pass updated props.
      window.location.reload(); // Simple full page reload to revalidate all server data

    } catch (err: any) {
      console.error('Error adding gift to wishlist:', err);
      toast({
        variant: "destructive",
        title: t('error'),
        description: err.message || t('errorAddingGift'),
      });
    }
  }, [currentUser, token, toast, t]);

  // Render a basic loading state while client-side auth is initializing
  if (authLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center p-4">
        <PageHeader title={t('wishListTitle')} description={t('wishListSubTitle')} />
        <Skeleton className="h-40 w-full max-w-lg mt-8" />
        <p className="mt-4 text-muted-foreground">{t('loading')}...</p>
      </div>
    );
  }

  // If there's an error (from server or client-side auth)
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

  // If not authenticated (server-side redirect would have caught this, but as a fallback)
  if (!userAuth || !currentUser) {
    // This case should ideally be handled by the Server Component's redirect,
    // but a client-side fallback ensures resilience.
    // router.push('/'); // Removed client-side router.push, let server handle
    return null; // Return null as the server will handle the redirect
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={t('wishListTitle')} description={t('wishListSubTitle')} />
      <div className="flex-1 overflow-y-auto p-4 md:p-6 grid md:grid-cols-1 gap-8">
        <div>
          <h2 className="text-xl font-headline font-semibold mb-4">{t('currentWishlistTitle')}</h2>
          {wishlistGifts.length > 0 ? (
            <div className="space-y-4">
              {wishlistGifts.map(gift => (
                <Card key={gift.id} className="flex items-center p-4">
                  <Image src={gift.imageUrl} alt={gift.name[language] || gift.name.en} width={64} height={64} className="rounded-md mr-4" data-ai-hint={gift.imageHint} />
                  <div className="flex-1">
                    <p className="font-semibold">{gift.name[language] || gift.name.en}</p>
                    <p className="text-sm text-muted-foreground">{gift.collection}</p>
                  </div>
                  {/* Add remove button if needed */}
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <p className="text-lg font-semibold">{t('emptyWishList')}</p>
              <p className="text-muted-foreground">{t('emptyWishListSubtext')}</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}