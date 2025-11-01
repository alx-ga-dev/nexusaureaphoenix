
// src/app/dashboard/catalog/catalog-page-client.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { PageHeader } from '@/components/PageHeader';
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
    const { t, language } = useTranslation();

    // State for filters is handled purely on the client
    const [rarityFilter, setRarityFilter] = useState('all');
    const [collectionFilter, setCollectionFilter] = useState('all');

    const handleRarityChange = (value: string) => {
        setRarityFilter(value);
    };

    const handleCollectionChange = (value: string) => {
        setCollectionFilter(value);
    };

    // Memoize the filtering logic to run only when data or filters change
    const filteredGifts = useMemo(() => {
        if (!initialGifts) return [];
        return initialGifts.filter(gift => {
            const rarityMatch = rarityFilter === 'all' || (initialRarities?.find(r => r.id === gift.rarityId)?.name.en === rarityFilter);
            const collectionMatch = collectionFilter === 'all' || (initialCollections?.find(c => c.id === gift.collectionId)?.name.en === collectionFilter);
            return rarityMatch && collectionMatch;
        });
    }, [initialGifts, rarityFilter, collectionFilter, initialRarities, initialCollections]);

    // Handle server-side errors
    if (serverError) {
        return (
            <div className="flex flex-col h-full items-center justify-center text-center p-4">
                <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
                <h1 className="text-2xl font-bold font-headline mb-2">{t('error')}</h1>
                <p className="text-muted-foreground max-w-md">{serverError}</p>
                <Button asChild className="mt-4"><Link href="/">{t('returnToLogin')}</Link></Button>
            </div>
        );
    }

    // Show a skeleton UI if the user data hasn't been passed down yet
    if (!initialCurrentUser) {
        return (
             <div className="flex flex-col h-full">
                <PageHeader title={t('catalogTitle')} description={t('catalogSubTitle')} />
                <div className="p-4 md:p-6">
                    <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
                       <Skeleton className="h-10 w-full md:w-[180px]" />
                       <Skeleton className="h-10 w-full md:w-[240px]" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {Array.from({ length: 8 }).map((_, i) => (
                           <Skeleton key={i} className="h-[300px] w-full rounded-lg" />
                        ))}
                    </div>
                </div>
            </div>
        );
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
                        {initialRarities?.map((r) => (
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
                        {initialCollections?.map((c) => (
                            <SelectItem key={c.id} value={c.name.en}>
                                {c.name[language] || c.name.en}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredGifts.length === 0 ? (
                        <div className="col-span-full text-center py-12 border-2 border-dashed rounded-lg text-muted-foreground">
                            <h2 className="text-lg font-semibold mb-2">{t('noGiftsFound')}</h2>
                            <p>{t('noGiftsFoundSubtext')}</p>
                        </div>
                    ) : (
                        filteredGifts.map((gift) => (
                            <GiftCard key={gift.id} gift={gift} />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
