
// src/app/dashboard/users/[id]/user-profile-client.tsx
'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { GiftCard } from '@/components/GiftCard';
import { useTranslation } from '@/hooks/use-translation';
import type { Gift, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User as UserIcon, AlertTriangle } from 'lucide-react';

interface UserProfileClientProps {
  profileUser: User | null;
  wishlist: string[] | null;
  allGifts: Gift[];
  giftedGiftIds: string[];
  serverError?: string | null;
}

export default function UserProfileClient({
  profileUser,
  wishlist,
  allGifts,
  giftedGiftIds,
  serverError,
}: UserProfileClientProps) {
  const { t } = useTranslation();
  const router = useRouter();

  // Memoize the list of gifted IDs for quick lookups
  const giftedIds = useMemo(() => new Set(giftedGiftIds), [giftedGiftIds]);

  // Filter the main gift list to get only the items in the user's wishlist
  const wishlistGifts = useMemo(() => {
    if (!wishlist || !allGifts) return [];
    const wishlistGiftIds = new Set(wishlist);
    return allGifts.filter(gift => wishlistGiftIds.has(gift.id));
  }, [wishlist, allGifts]);

  // Handle server-side errors, e.g., user not found or auth failed
  if (serverError) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center p-4">
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold font-headline mb-2">{t('error')}</h1>
        <p className="text-muted-foreground max-w-md">{serverError}</p>
        <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/users')} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('backToUsers')}
        </Button>
      </div>
    );
  }
  
  // This should ideally not be hit if server component handles it, but it's a good fallback
  if (!profileUser) {
      return null; 
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={t('userWishListTitle', { name: profileUser.name })} description={t('userWishListSubTitle')} />
      <div className="p-4 md:px-6">
        <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/users')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('backToUsers')}
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {wishlistGifts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistGifts.map((gift) => (
              <GiftCard key={gift.id} gift={gift} isGifted={giftedIds.has(gift.id)} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <UserIcon className="w-8 h-8 text-muted-foreground" />
              </div>
            </div>
            <p className="text-lg font-semibold">{t('userEmptyWishList', { name: profileUser.name })}</p>
            <p className="text-muted-foreground">{t('userEmptyWishListSubtext')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
