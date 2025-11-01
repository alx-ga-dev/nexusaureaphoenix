// src/app/admin/users/add/admin-users-add-client.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/use-translation';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/components/AuthProvider';
import { User } from '@/lib/types';
import { userSchema, UserFormValues, UserClientProps } from '@/app/admin/users/admin-users-lib'

export default function AdminUserAddClient({
  serverError,
}: UserClientProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { token, loading: authLoading, error: authClientError } = useAuth();


  const { handleSubmit, control, formState: { errors } } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      type: 'Blue',
      roleLevel: 0,
    },
  });

  const { toast } = useToast();

  const currentError = serverError || authClientError;

  const handleAddUser = async (data: UserFormValues) => {
    if (!token) {
      toast({
        variant: "destructive",
        title: t('authenticationError'),
        description: t('notAuthenticatedWarning'),
      });
      return;
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to add user');
      }

      toast({
        title: t('userAddedToast'),
        description: t('userAddedToastDesc', { name: data.name }),
      });
      router.push('/admin/users'); // Redirect back to users list
    } catch (error: any) {
      console.error("Error adding user:", error);
      toast({
        variant: "destructive",
        title: t('errorAddingUser'),
        description: error.message || t('unknownError'),
      });
    }
  };

  // Render loading state if AuthProvider is loading
  if (authLoading) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title={t('addUserTitle')} description={t('addUserSubTitle')} />
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
        <Button asChild className="mt-4"><Link href="/admin/users">{t('returnToUsers')}</Link></Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={t('addUserTitle')} description={t('addUserSubTitle')} />
      <div className="p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('addUserCardTitle')}</CardTitle>
            <CardDescription>{t('addUserCardDesc')}</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(handleAddUser)}>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">{t('userName')}</Label>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => <Input id="name" {...field} />}
                />
                {/* Add error message here if needed */}
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
                    </RadioGroup>
                  )}
                />
              </div>
              <div className="flex items-center space-x-2">
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
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => router.push('/admin/users')}>
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