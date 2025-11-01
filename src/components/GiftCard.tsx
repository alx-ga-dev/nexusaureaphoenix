
'use client';

import Image from 'next/image';
import { Gift as GiftType } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import React, { useMemo } from 'react';
import { PlusCircle, Send, Gift, CheckCircle, AlertTriangle } from 'lucide-react';
import { useExchange } from './AppShell';
import { Collection, Rarity } from '@/lib/types'; // Import Collection and Rarity types
import { useWishlist } from '@/context/WishListContext';
import { useTranslation } from '@/hooks/use-translation';
import { useCollection } from '@/hooks/use-collection'; // Use our custom useCollection hook
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/components/AuthProvider'; // Import useAuth

type GiftCardProps = {
  gift: GiftType;
  isGifted?: boolean;
};

export function GiftCard({ gift, isGifted = false }: GiftCardProps) {
  const { addGiftToWishlist, removeGiftFromWishlist, isInWishlist } = useWishlist();
  const { startExchange, startSend } = useExchange();
  const { t, language } = useTranslation();

  // Use useAuth to get authentication state and loading
  const { loading: authLoading, error: authError } = useAuth();

  // Refactor data fetching for collections and rarities to use useCollection
  const { data: collections, isLoading: collectionsLoading, error: collectionsError } = useCollection<Collection>(!authLoading ? 'collections' : null, []);
  const { data: rarities, isLoading: raritiesLoading, error: raritiesError } = useCollection<Rarity>(!authLoading ? 'rarities' : null, []);

  const rarity = useMemo(() => rarities?.find(r => r.id === gift.rarityId), [rarities, gift.rarityId]); // Changed to rarityId
  const collectionData = useMemo(() => collections?.find(c => c.id === gift.collectionId), [collections, gift.collectionId]); // Changed to collectionId

  const giftName = gift.name[language] || gift.name.en;
  const collectionName = collectionData ? (collectionData.name[language] || collectionData.name.en) : gift.collectionId; // Fallback to ID
  const rarityName = rarity ? (rarity.name[language] || rarity.name.en) : gift.rarityId; // Fallback to ID

  // Consolidated loading and error for the card itself
  const cardIsLoading = authLoading || collectionsLoading || raritiesLoading;
  const currentError = authError || collectionsError || raritiesError;

  const toggleWishlist = () => {
    if (isInWishlist(gift.id)) {
      removeGiftFromWishlist(gift.id);
    } else {
      addGiftToWishlist(gift.id);
    }
  };

  if (cardIsLoading) {
    return (
      <Card className="overflow-hidden flex flex-col h-full">
        <CardHeader className="p-0 relative"><Skeleton className="w-full h-40" /></CardHeader>
        <CardContent className="p-4 flex-1">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
        <CardFooter className="p-4 pt-0 flex flex-col items-stretch gap-2">
          <div className="flex justify-between items-center mb-2">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-8 w-1/3" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </CardFooter>
      </Card>
    );
  }

  if (currentError) {
    return (
      <Card className="overflow-hidden flex flex-col h-full group bg-destructive/10 border-destructive">
        <CardContent className="p-6 flex flex-col items-center justify-center text-center flex-1 text-destructive">
          <AlertTriangle className="w-10 h-10 mb-4" />
          <p className="font-bold">{t('error')}</p>
          <p className="text-sm">currentError || t('unknownError')</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden flex flex-col transition-all", !isGifted && "hover:shadow-lg hover:-translate-y-1", isGifted && "opacity-60")}>
      <CardHeader className="p-0 relative">
        {isGifted && (
          <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center">
            <Badge variant="secondary" className="text-sm">
                <CheckCircle className="mr-2 h-4 w-4" />
                {t('giftedBadge')}
            </Badge>
          </div>
        )}
        <div className="aspect-w-16 aspect-h-9">
          <Image
            src={gift.imageUrl}
            alt={giftName}
            width={600}
            height={400}
            className="object-cover w-full h-full"
            data-ai-hint={gift.imageHint}
          />
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-1">
        <CardTitle className="text-lg font-headline mb-1">{giftName}</CardTitle>
        <p className="text-sm text-muted-foreground">{collectionName}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex flex-col items-stretch gap-2">
        <div className="flex justify-between items-center mb-2">
            <Badge
            style={{ 
              backgroundColor: rarity?.color || '#A1A1AA',
              color: 'hsl(var(--primary-foreground))'
            }}
            className="font-bold border-none"
            >
            {rarityName}
            </Badge>
            <Button variant="ghost" size="sm" onClick={toggleWishlist} disabled={isGifted}>
              <PlusCircle className="mr-2 h-4 w-4" />
              {isInWishlist(gift.id) ? t('removeFromWishlistButton') : t('addToWishlistButton')}
            </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => startExchange(gift)} disabled={isGifted}>
                <Gift className="mr-2 h-4 w-4" />
                {t('giftNowButton')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => startSend(gift)} disabled={isGifted}>
                <Send className="mr-2 h-4 w-4" />
                {t('sendGiftButton')}
            </Button>
        </div>
      </CardFooter>
    </Card>
  );
}