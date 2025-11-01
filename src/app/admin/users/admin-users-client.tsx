// src/app/admin/(authed)/users/admin-users-client.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { useTranslation } from '@/hooks/use-translation';
import { User } from '@/lib/types';
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
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { User as UserIcon, PlusCircle, Download, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UserActions } from '@/components/UserActions';
import QRCode from 'react-qr-code';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';

interface AdminUsersClientProps {
  initialCurrentUser: User | null;
  initialUsers: User[];
  serverError?: string | null;
}

export default function AdminUsersClient({
  initialCurrentUser,
  initialUsers,
  serverError,
}: AdminUsersClientProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { token, loading: authLoading, error: authClientError } = useAuth();

  const [dialogState, setDialogState] = useState<{
    deleteUser?: User;
    createTagUser?: User;
    createQrUser?: User;
  }>({});
  const { toast } = useToast();
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const [users, setUsers] = useState<User[]>(initialUsers);

  // Sync users state if initialUsers prop changes (e.g., after a delete and revalidation)
  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  const currentError = serverError || authClientError;

  const handleDelete = async (userToDelete: User) => {
    if (!token) {
      toast({
        variant: "destructive",
        title: t('authenticationError'),
        description: t('notAuthenticatedWarning'),
      });
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to delete user');
      }

      toast({
        title: t('userDeletedToast'),
        description: t('userDeletedToastDesc', { name: userToDelete.name }),
      });
      setDialogState({});
      router.refresh(); // Revalidate server data
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast({
        variant: "destructive",
        title: t('errorDeletingUser'),
        description: error.message || t('unknownError'),
      });
    }
  };

  const handleSaveQrCode = () => {
    if (qrCodeRef.current) {
      const svgElement = qrCodeRef.current.querySelector('svg');
      if (svgElement) {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);
          const pngFile = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.download = `${dialogState.createQrUser?.name}-qrcode.png`;
          downloadLink.href = pngFile;
          downloadLink.click();
        };

        img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
      }
    }
  };

  // Render loading skeleton if AuthProvider is loading
  if (authLoading) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title={t('adminUsersTitle')} description={t('adminUsersSubTitle')} />
        <div className="p-4 md:p-6">
          <Skeleton className="h-10 w-full mb-4" />
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]"><Skeleton className="h-6 w-24"/></TableHead>
                    <TableHead><Skeleton className="h-6 w-20"/></TableHead>
                    <TableHead className="w-[100px] text-right"><Skeleton className="h-6 w-16"/></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i}>
                          <TableCell><Skeleton className="h-8 w-48" /></TableCell>
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
      <PageHeader title={t('adminUsersTitle')} description={t('adminUsersSubTitle')} />
      <div className="p-4 md:p-6">
        <div className="flex justify-end mb-4">
            <Button onClick={() => router.push('/admin/users/add')}>
                <PlusCircle className="mr-2 h-4 w-4" />
                {t('addUserButton')}
            </Button>
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">{t('userName')}</TableHead>
                  <TableHead>{t('userType')}</TableHead>
                  <TableHead className="w-[100px] text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={cn(
                           'w-8 h-8 rounded-full flex items-center justify-center',
                           user.type === 'Blue' ? 'bg-blue-100' : 'bg-pink-100',
                        )}>
                            <UserIcon className={cn(
                                'w-5 h-5',
                                user.type === 'Blue' ? 'text-blue-500' : 'text-pink-500',
                            )}/>
                        </div>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                       <Badge variant="outline" className={cn(
                           user.type === 'Blue' && 'border-blue-400 text-blue-400',
                           user.type === 'Pink' && 'border-pink-400 text-pink-400',
                           user.type === 'Black' && 'border-stone-400 text-stone-400',
                       )}>
                        {user.type}
                       </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <UserActions 
                          user={user}
                          onDelete={() => setDialogState({ deleteUser: user })}
                          onCreateTag={() => setDialogState({ createTagUser: user })}
                          onCreateQr={() => setDialogState({ createQrUser: user })}
                       />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!dialogState.deleteUser} onOpenChange={() => setDialogState({})}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{t('deleteUserTitle')}</AlertDialogTitle>
                <AlertDialogDescription>
                    {t('deleteUserDesc', { name: dialogState.deleteUser?.name || '' })}
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>{t('cancelButton')}</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDelete(dialogState.deleteUser!)} className="bg-destructive hover:bg-destructive/90">{t('deleteButton')}</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Tag Dialog */}
      <Dialog open={!!dialogState.createTagUser} onOpenChange={() => setDialogState({})}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{t('createTagTitle', { name: dialogState.createTagUser?.name || '' })}</DialogTitle>
                <DialogDescription>
                    {t('createTagDesc')}
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <p className="text-sm text-muted-foreground">{t('userIdLabel')}</p>
                <p className="font-mono bg-muted p-2 rounded-md text-sm">{dialogState.createTagUser?.id}</p>
            </div>
            {/* In a real app, this would trigger the Web NFC API */}
            <Button disabled>{t('writeToTagButton')}</Button>
        </DialogContent>
      </Dialog>
      
      {/* Create QR Dialog */}
      <Dialog open={!!dialogState.createQrUser} onOpenChange={() => setDialogState({})}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{t('createQrTitle', { name: dialogState.createQrUser?.name || '' })}</DialogTitle>
                 <DialogDescription>
                    {t('createQrDesc')}
                </DialogDescription>
            </DialogHeader>
            <div className="py-4 flex justify-center">
              {dialogState.createQrUser && (
                <div className="bg-white p-4 rounded-lg" ref={qrCodeRef}>
                    <QRCode value={dialogState.createQrUser.id} />
                </div>
              )}
            </div>
             <div className="py-2">
                <p className="text-sm text-muted-foreground">{t('userIdLabel')}</p>
                <p className="font-mono bg-muted p-2 rounded-md text-sm">{dialogState.createQrUser?.id}</p>
            </div>
             <DialogFooter>
                <Button onClick={handleSaveQrCode}>
                    <Download className="mr-2 h-4 w-4" />
                    {t('saveAsImageButton')}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}