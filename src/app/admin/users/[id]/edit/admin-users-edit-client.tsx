
// src/app/admin/users/[id]/edit/admin-user-edit-client.tsx
'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

import type { User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/use-translation';
import { useAuth } from '@/components/AuthProvider';
import { userSchema, UserFormValues, UserClientProps } from '@/app/admin/users/admin-users-lib'

export default function AdminUserEditClient({
  initialEditUser,
  serverError,
}: UserClientProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { token, loading: authLoading, error: authClientError } = useAuth();

  const userToEdit = initialEditUser;

  const { handleSubmit, control, reset, formState: { errors } } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: useMemo(() => ({
      name: userToEdit?.name || '',
      type: userToEdit?.type || 'Blue',
      roleLevel: userToEdit?.roleLevel ?? 0,
    }), [userToEdit]),
  });

  useEffect(() => {
    if (userToEdit) {
      reset({
        name: userToEdit.name,
        type: userToEdit.type,
        roleLevel: userToEdit.roleLevel,
      });
    }
  }, [userToEdit, reset]);

  const { toast } = useToast();

  const currentError = serverError || authClientError;

  const handleSave = async (values: UserFormValues) => {
    if (!token || !userToEdit) {
      toast({
        variant: "destructive",
        title: t('authenticationError'),
        description: t('notAuthenticatedWarning'),
      });
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userToEdit.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to update user');
      }

      toast({
        title: t('userUpdatedToast'),
        description: t('userUpdatedToastDesc', { name: values.name }),
      });
      router.push('/admin/users');
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast({
        variant: "destructive",
        title: t('errorUpdatingUser'),
        description: error.message || t('unknownError'),
      });
    }
  };

  if (authLoading || !userToEdit) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title={t('editUserTitle')} description={t('editUserSubTitle')} />
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

  if (currentError) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center p-4">
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold font-headline mb-2">{t('error')}</h1>
        <p className="text-muted-foreground max-w-md">{currentError}</p>
        <Button asChild className="mt-4"><Link href="/admin/users">{t('returnToUsers')}</Link></Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={t('editUserTitle')} description={t('editUserSubTitle')} />
      <div className="p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('editUserCardTitle')}</CardTitle>
            <CardDescription>{t('editUserCardDesc', { name: userToEdit?.name || '' })}</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(handleSave)}>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">{t('userName')}</Label>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => <Input id="name" {...field} />}
                />
                {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <Label>{t('userType')}</Label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-4 mt-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Blue" id="type-blue" />
                        <Label htmlFor="type-blue">Blue</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Pink" id="type-pink" />
                        <Label htmlFor="type-pink">Pink</Label>
                      </div>
                       <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Black" id="type-black" />
                        <Label htmlFor="type-black">Black</Label>
                      </div>
                    </RadioGroup>
                  )}
                />
                {errors.type && <p className="text-sm text-destructive mt-1">{errors.type.message}</p>}
              </div>
              <div>
                <Label>{t('roleLabel')}</Label>
                 <Controller
                    name="roleLevel"
                    control={control}
                    render={({ field }) => (
                    <Select
                        onValueChange={(value) => field.onChange(parseInt(value, 10))}
                        value={String(field.value)}
                    >
                        <SelectTrigger>
                        <SelectValue placeholder={t('selectRolePlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="0">{t('roleStandard')}</SelectItem>
                        <SelectItem value="1">{t('roleManager')}</SelectItem>
                        <SelectItem value="2">{t('roleAdmin')}</SelectItem>
                        </SelectContent>
                    </Select>
                    )}
                />
                {errors.roleLevel && <p className="text-sm text-destructive mt-1">{errors.roleLevel.message}</p>}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => router.push('/admin/users')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('cancelButton')}
              </Button>
              <Button type="submit" disabled={authLoading}> {t('saveButton')}</Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
