// src/app/admin/catalog/admin-catalog-client.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { Rarity, Collection, Gift, User } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreHorizontal, Trash2, Edit, PlusCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { useTranslation } from '@/hooks/use-translation';
import { useAuth } from '@/components/AuthProvider';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

interface AdminCatalogClientProps {
  initialGifts: Gift[];
  initialCollections: Collection[];
  initialRarities: Rarity[];
  serverError?: string | null;
}

export default function AdminCatalogClient({
  initialGifts,
  initialCollections,
  initialRarities,
  serverError,
}: AdminCatalogClientProps) {
  const router = useRouter();
  const { token, loading: authLoading, error: authClientError } = useAuth();

  const [dialogState, setDialogState] = useState<{ deleteGift?: Gift }>({});
  const { toast } = useToast();
  const { t, language } = useTranslation();

  const [gifts, setGifts] = useState<Gift[]>(initialGifts);
  const collections = initialCollections;
  const rarities = initialRarities;

  // Sync gifts state if initialGifts prop changes (e.g., after a delete and revalidation)
  useEffect(() => {
    setGifts(initialGifts);
  }, [initialGifts]);

  const currentError = serverError || authClientError;

  const handleDelete = async (giftToDelete: Gift) => {
    if (!token) {
      toast({
        variant: "destructive",
        title: t('authenticationError'),
        description: t('notAuthenticatedWarning'),
      });
      return;
    }

    try {
      const response = await fetch('/api/data', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          collection: 'gifts',
          docId: giftToDelete.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to delete gift');
      }

      toast({
        title: t('giftDeletedToast'),
        description: t('giftDeletedToastDesc', { name: giftToDelete.name.en }),
      });
      setDialogState({});
      router.refresh(); // Revalidate server data
    } catch (err: any) {
      console.error("Error deleting gift:", err);
      toast({
        title: t('error'),
        description: err.message || t('errorDeletingGift'),
        variant: 'destructive',
      });
    }
  };

  const getRarityColor = (rarityId: string) => {
    const rarity = rarities?.find(r => r.id === rarityId);
    return rarity ? rarity.color : '#A1A1AA'; // A default neutral color
  };

  const getLocalizedCollectionName = (collectionId: string) => {
      const collection = collections?.find(c => c.id === collectionId);
      return collection ? (collection.name[language] || collection.name.en) : collectionId;
  }
  
  const getLocalizedRarityName = (rarityId: string) => {
      const rarity = rarities?.find(r => r.id === rarityId);
      return rarity ? (rarity.name[language] || rarity.name.en) : rarityId;
  }

  // Render loading skeleton if AuthProvider is loading
  if (authLoading) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title={t('navAdminCatalog')} description={t('adminCatalogSubTitle')} />
        <div className="p-4 md:p-6">
          <Skeleton className="h-10 w-full mb-4" />
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]"><Skeleton className="h-6 w-24"/></TableHead>
                    <TableHead><Skeleton className="h-6 w-20"/></TableHead>
                    <TableHead><Skeleton className="h-6 w-24"/></TableHead>
                    <TableHead className="w-[100px] text-right"><Skeleton className="h-6 w-16"/></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-8 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Render error if any occurred
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

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={t('navAdminCatalog')} description={t('adminCatalogSubTitle')} />
      <div className="p-4 md:p-6">
        <div className="flex justify-end mb-4">
            <Button onClick={() => router.push('/admin/catalog/add')}>
                <PlusCircle className="mr-2 h-4 w-4" />
                {t('addGiftButton')}
            </Button>
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('giftName')}</TableHead>
                  <TableHead>{t('collectionLabel')}</TableHead>
                  <TableHead>{t('rarityLabel')}</TableHead>
                  <TableHead className="w-[100px] text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gifts.length === 0 && !authLoading && !currentError && (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center">
                        {t('noGiftsFound')}
                        </TableCell>
                    </TableRow>
                )}
                {gifts.map((gift) => (
                  <TableRow key={gift.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Image src={gift.imageUrl} alt={gift.name[language] || gift.name.en} width={40} height={40} className="rounded-md" />
                        <span className="font-medium">{gift.name[language] || gift.name.en}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getLocalizedCollectionName(gift.collectionId)}</TableCell>
                    <TableCell>
                       <Badge 
                        variant="outline" 
                        style={{
                            borderColor: getRarityColor(gift.rarityId),
                            color: getRarityColor(gift.rarityId),
                        }}
                       >
                        {getLocalizedRarityName(gift.rarityId)}
                       </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/admin/catalog/${gift.id}/edit`)}>
                                <Edit className="mr-2 h-4 w-4"/>
                                <span>{t('editAction')}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDialogState({ deleteGift: gift })} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4"/>
                                <span>{t('deleteAction')}</span>
                            </DropdownMenuItem>
                         </DropdownMenuContent>
                       </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!dialogState.deleteGift} onOpenChange={() => setDialogState({})}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{t('deleteGiftTitle')}</AlertDialogTitle>
                <AlertDialogDescription>
                    {t('deleteGiftDesc', { name: dialogState.deleteGift?.name.en || '' })}
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>{t('cancelButton')}</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDelete(dialogState.deleteGift!)} className="bg-destructive hover:bg-destructive/90">{t('deleteButton')}</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}