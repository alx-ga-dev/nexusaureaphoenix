// src/app/admin/catalog/[id]/edit/admin-gift-edit-client.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';

import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, PlusCircle, Trash2, Upload, AlertTriangle } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { useAuth } from '@/components/AuthProvider';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { giftSchema, GiftFormData, AdminGiftClientProps } from '@/app/admin/catalog/admin-catalog-lib';

export default function AdminGiftEditClient({
  initialGift,
  initialCollections,
  initialRarities,
}: AdminGiftClientProps) {
  const router = useRouter();
  const { token, loading: authLoading, error: authClientError } = useAuth();
  const { toast } = useToast();
  const { t, language } = useTranslation();

  const giftToEdit = initialGift;           // Gift being edited from server props
  const allCollections = initialCollections; // From server props
  const allRarities = initialRarities;       // From server props

  const [preview, setPreview] = useState<string | null>(giftToEdit?.imageUrl || null);

  const { control, handleSubmit, reset, formState: { errors, isSubmitting }, watch, setValue } = useForm<GiftFormData>({
    resolver: zodResolver(giftSchema),
    defaultValues: useMemo(() => ({
      name: giftToEdit ? Object.entries(giftToEdit.name).map(([lang, value]) => ({ lang, value })) : [{ lang: 'en', value: '' }, { lang: 'es', value: '' }],
      collectionId: giftToEdit?.collectionId || '',
      rarityId: giftToEdit?.rarityId || '',
      image: null, // Image is initially null, only set if new file is selected
      imageHint: giftToEdit?.imageHint || '',
    }), [giftToEdit]),
  });

  // Reset form with new default values if initialGift changes
  useEffect(() => {
    if (giftToEdit) {
      reset({
        name: Object.entries(giftToEdit.name).map(([lang, value]) => ({ lang, value })),
        collectionId: giftToEdit.collectionId,
        rarityId: giftToEdit.rarityId,
        image: null, // Keep image null after reset to ensure file input is clear
        imageHint: giftToEdit.imageHint,
      });
      setPreview(giftToEdit.imageUrl); // Reset image preview to current image
    }
  }, [giftToEdit, reset]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "name"
  });

  const imageFile = watch('image');

  useEffect(() => {
    let objectUrl: string | null = null;
    if (imageFile && imageFile.size > 0) {
      objectUrl = URL.createObjectURL(imageFile);
      setPreview(objectUrl);
    } else if (!imageFile && giftToEdit?.imageUrl) {
      // If no new image selected, but there was an initial image
      setPreview(giftToEdit.imageUrl);
    } else {
      setPreview(null);
    }
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [imageFile, giftToEdit]);

  const currentError = authClientError;

  const onSubmit = async (data: GiftFormData) => {
    if (!token || !giftToEdit) {
      toast({
        variant: "destructive",
        title: t('authenticationError'),
        description: t('notAuthenticatedWarning'),
      });
      return;
    }

    try {
      let imageUrl = giftToEdit.imageUrl; // Start with existing image URL

      // Only upload new image if a file is selected
      if (data.image && typeof data.image !== 'string') { // Check if it's a File object
          const formData = new FormData();
          formData.append('file', data.image);
          formData.append('folder', 'gift-images');

          const uploadResponse = await fetch('/api/upload', {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
              body: formData,
          });

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json();
            throw new Error(errorData.details || 'Failed to upload new image');
          }
          const { url } = await uploadResponse.json();
          imageUrl = url; // Update with new image URL
      }

      // Prepare localized names
      const localizedName = data.name.reduce((acc, current) => {
          if (current.lang && current.value) {
              acc[current.lang] = current.value;
          }
          return acc;
      }, {} as Record<string, string>);

      // Update gift document
      const updateResponse = await fetch('/api/data', {
          method: 'PUT',
          headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
              collection: 'gifts',
              docId: giftToEdit.id,
              data: {
                  name: localizedName,
                  collectionId: data.collectionId,
                  rarityId: data.rarityId,
                  imageUrl: imageUrl,
                  imageHint: data.imageHint,
              },
          }),
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.details || 'Failed to update gift details');
      }

      toast({
          title: t('giftUpdatedToast'),
          description: t('giftUpdatedToastDesc', {name: localizedName.en || ''}),
      });
      router.push('/admin/catalog');

    } catch (error: any) {
      console.error("Error updating gift: ", error);
      toast({
        variant: "destructive",
        title: t('errorUpdatingGift'),
        description: error.message || t('unknownError'),
      });
    }
  };

  // Render loading skeleton if AuthProvider is loading OR initial gift data is not yet available
  if (authLoading || !giftToEdit) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title={t('editGiftTitle')} description={t('editGiftDesc', { name: "Loading" })} />
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
    );
  }
  
  // Render error if any occurred
  if (currentError) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center p-4">
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold font-headline mb-2">{t('error')}</h1>
        <p className="text-muted-foreground max-w-md">{currentError}</p>
        <Button asChild className="mt-4"><Link href="/admin/catalog">{t('backToCatalog')}</Link></Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={t('editGiftTitle')} description={t('editGiftDesc', { name: giftToEdit.name.en })} />
      <div className="p-4 md:p-6">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('backToCatalog')}
        </Button>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>{t('giftDetailsTitle')}</CardTitle>
              <CardDescription>{t('editGiftFormDesc', { name: giftToEdit.name.en })}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="giftId">{t('giftIdLabel')}</Label>
                <Input id="giftId" value={giftToEdit.id} disabled />
              </div>

               <div className="space-y-4 rounded-lg border p-4">
                 <Label>{t('localizedNamesLabel')}</Label>
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-[80px_1fr_auto] items-center gap-2">
                    <Input {...control.register(`name.${index}.lang`)} placeholder="e.g. 'en'" />
                    <Input {...control.register(`name.${index}.value`)} placeholder={t('nameInLangPlaceholder')} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                 {errors.name && <p className="text-sm text-destructive">{errors.name.root?.message || t('addOneNameError')}</p>}
                 <Button type="button" variant="outline" size="sm" onClick={() => append({ lang: '', value: '' })}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {t('addLanguageButton')}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="collection">{t('collectionLabel')}</Label>
                  <Controller
                    name="collectionId"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="collection">
                          <SelectValue placeholder={t('selectCollectionPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {allCollections?.map(c => <SelectItem key={c.id} value={c.id}>{c.name[language] || c.name.en}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.collectionId && <p className="text-sm text-destructive">{errors.collectionId.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rarity">{t('rarityLabel')}</Label>
                  <Controller
                    name="rarityId"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="rarity">
                          <SelectValue placeholder={t('selectRarityPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {allRarities?.map(r => <SelectItem key={r.id} value={r.id}>{r.name[language] || r.name.en}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.rarityId && <p className="text-sm text-destructive">{errors.rarityId.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('giftImageLabel')}</Label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-md border border-dashed flex items-center justify-center bg-muted">
                    {preview ? <Image src={preview} alt="Preview" width={96} height={96} className="object-contain rounded-md" /> : <Upload className="w-6 h-6 text-muted-foreground" />}
                  </div>
                  <div className="flex-1">
                    <Controller
                        name="image"
                        control={control}
                        render={({ field }) => (
                            <Input 
                                type="file" 
                                accept="image/*"
                                onChange={(e) => field.onChange(e.target.files ? e.target.files[0] : null)} 
                            />
                        )}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('imageUploadDesc')}
                    </p>
                  </div>
                </div>
                {errors.image && <p className="text-sm text-destructive">{errors.image.message as string}</p>}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => router.push('/admin/catalog')}>{t('cancelButton')}</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? t('savingButton') : t('saveChangesButton')}
                </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
}