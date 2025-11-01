
'use client';
import Link from 'next/link';
import { User as UserType, Transaction } from '@/lib/types';
import { Card, CardContent } from './ui/card';
import { cn } from '@/lib/utils';
import { User as UserIcon, ArrowRight, Gift, AlertTriangle } from 'lucide-react'; // Import AlertTriangle
import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from '@/hooks/use-translation';
import { useAuth } from '@/components/AuthProvider'; // Import useAuth
import { useCollection } from '@/hooks/use-collection'; // Import useCollection hook
import { Skeleton } from '@/components/ui/skeleton';

type UserCardProps = {
  user: UserType; // This 'user' prop is actually the Firestore 'userData'
};

export function UserCard({ user }: UserCardProps) {
  const [wishlistCounts, setWishlistCounts] = useState({ total: 0, gifted: 0 });
  const { t } = useTranslation();

  // Use useAuth to get authentication state and token
  const { token, loading: authLoading, error: authError } = useAuth();

  // Refactor data fetching for gifted transactions to use the centralized /api/data endpoint
  const giftedToUserQuery = useMemo(() => {
    if (!token || !user?.id) {
      return null; // Skip query if token or user ID is not available
    }
    return [
      { type: 'where', field: 'toUserId', operator: '==', value: user.id },
      { type: 'where', field: 'deliveryStatus', operator: '==', value: 'Delivered' },
    ];
  }, [token, user?.id]);

  const { data: giftedTransactions, isLoading: giftedTransactionsLoading, error: giftedTransactionsError } = useCollection<Transaction>(giftedToUserQuery ? 'transactions' : null, giftedToUserQuery || []);

  // CORRECTED: Use user?.wishlist instead of user?.wishlistGiftIds
  const userWishlistGiftIds = useMemo(() => user?.wishlist || [], [user]);

  useEffect(() => {
    // Only run if giftedTransactions data is loaded and not during initial auth loading
    if (!giftedTransactionsLoading && !authLoading && user && userWishlistGiftIds.length > 0) {
      const totalItems = userWishlistGiftIds.length;
      const giftedIds = new Set(giftedTransactions?.map(tx => tx.giftId) || []);
      const giftedItemsCount = userWishlistGiftIds.filter((giftId: string) => giftedIds.has(giftId)).length;

      setWishlistCounts({ total: totalItems, gifted: giftedItemsCount });
    } else if (!authLoading && user && userWishlistGiftIds.length === 0) {
        // If wishlist is empty, reset counts
        setWishlistCounts({ total: 0, gifted: 0 });
    }
  }, [user, userWishlistGiftIds, giftedTransactions, giftedTransactionsLoading, authLoading]);

  const ungiftedItemsCount = wishlistCounts.total - wishlistCounts.gifted;
  
  // Consolidated loading for the card itself
  const isLoading = authLoading || giftedTransactionsLoading;
  const currentError = authError || giftedTransactionsError;

  if (isLoading) {
    return (
      <Card className="overflow-hidden flex flex-col h-full group">
        <CardContent className="p-6 flex flex-col items-center justify-center text-center flex-1">
          <Skeleton className="w-20 h-20 rounded-full mb-4" />
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/3 mt-4" />
        </CardContent>
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
    <Link href={`/dashboard/users/${user.id}`}>
        <Card className="overflow-hidden flex flex-col transition-all hover:shadow-lg hover:-translate-y-1 h-full group">
        <CardContent className="p-6 flex flex-col items-center justify-center text-center flex-1">
            <div className={cn(
                'w-20 h-20 rounded-full flex items-center justify-center mb-4',
                user.type === 'Blue' ? 'bg-blue-100' : 'bg-pink-100',
            )}>
                <UserIcon className={cn(
                    'w-10 h-10',
                    user.type === 'Blue' ? 'text-blue-500' : 'text-pink-500',
                )}/>
            </div>
            <p className="text-lg font-headline font-bold">{user.name}</p>
            
            <div className="mt-2 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Gift className="h-4 w-4" />
              <span>
                <span className="font-bold text-foreground">{ungiftedItemsCount}</span>
                <span className="text-xs">/{wishlistCounts.total} {t('toGiftLabel')}</span>
              </span>
            </div>

            <div className="mt-4 flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary">
                {t('viewWishlistLink')} <ArrowRight className="h-3 w-3" />
            </div>
        </CardContent>
        </Card>
    </Link>
  );
}