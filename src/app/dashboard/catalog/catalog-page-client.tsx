// src/app/dashboard/catalog/catalog-page-client.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { useAuth } from '@/components/AuthProvider';
import { Gift, Collection, Rarity, User } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/hooks/use-translation';

import { GiftCard } from '@/components/GiftCard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';


interface CatalogPageClientProps {
    initialCurrentUser: User | null;
    initialGifts: Gift[];
    initialCollections: Collection[];
    initialRarities: Rarity[];
    serverError?: string | null;
}

export default function CatalogPageClient({
    initialCurrentUser,
    initialGifts,
    initialCollections,
    initialRarities,
    serverError,
}: CatalogPageClientProps) {
    const router = useRouter();
    const { t, language } = useTranslation();

    // Client-side authentication context
    const { userAuth, userData, loading: authLoading, token, error: authClientError } = useAuth();

    // Use initial data as primary source, but allow AuthProvider's userData to update if it changes client-side
    const currentUser = userData || initialCurrentUser;
    const gifts = initialGifts;
    const allCollections = initialCollections;
    const allRarities = initialRarities;

    const [rarityFilter, setRarityFilter] = useState('all');
    const [collectionFilter, setCollectionFilter] = useState('all');

    // Combine server-side and client-side errors for display
    const currentError = serverError || authClientError;

    const handleRarityChange = (value: string) => {
        setRarityFilter(value);
    };

    const handleCollectionChange = (value: string) => {
        setCollectionFilter(value);
    };

    const filteredGifts = useMemo(() => {
        if (!gifts) return [];
        return gifts.filter(gift => {
            const rarityMatch = rarityFilter === 'all' || (allRarities?.find(r => r.id === gift.rarityId)?.name.en === rarityFilter);
            const collectionMatch = collectionFilter === 'all' || (allCollections?.find(c => c.id === gift.collectionId)?.name.en === collectionFilter);
            return rarityMatch && collectionMatch;
        });
    }, [gifts, rarityFilter, collectionFilter, allRarities, allCollections]);


    // Render a basic loading state while client-side auth is initializing
    if (authLoading) {
        return (
            <div className="flex flex-col h-full items-center justify-center text-center p-4">
                <PageHeader title={t('catalogTitle')} description={t('catalogSubTitle')} />
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
        router.push('/');
        return null;
    }


    return (
        <div className="flex flex-col h-full">
            <PageHeader title={t('catalogTitle')} description={t('catalogSubTitle')} />
            <div className="p-4 md:p-6 border-b flex flex-col md:flex-row gap-4 items-center">
                <Select value={rarityFilter} onValueChange={handleRarityChange}>
                    <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder={t('filterByRarity')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('allRarities')}</SelectItem>
                        {allRarities?.map((r) => (
                            <SelectItem key={r.id} value={r.name.en}>
                                {r.name[language] || r.name.en}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={collectionFilter} onValueChange={handleCollectionChange}>
                    <SelectTrigger className="w-full md:w-[240px]">
                        <SelectValue placeholder={t('filterByCollection')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('allCollections')}</SelectItem>
                        {allCollections?.map((c) => (
                            <SelectItem key={c.id} value={c.name.en}>
                                {c.name[language] || c.name.en}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredGifts?.length === 0 && (
                        <div className="col-span-full text-center py-12 border-2 border-dashed rounded-lg text-muted-foreground">
                            <h2 className="text-lg font-semibold mb-2">{t('noGiftsFound')}</h2>
                            <p>{t('noGiftsFoundSubtext')}</p>
                        </div>
                    )}
                    {filteredGifts?.map((gift) => (
                        <GiftCard key={gift.id} gift={gift} />
                    ))}
                </div>
            </div>
        </div>
    );
}