// src/app/operations/pay-devlier/pay-devlier-client.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Hourglass, CheckCircle, User as UserIcon, AlertTriangle, ScanIcon, QrCodeIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrScanner } from '@/components/QrScanner';
import { useToast } from '@/hooks/use-toast';
import { Gift, User, Transaction, OperationStatus } from '@/lib/types';
import { useTranslation } from '@/hooks/use-translation';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/components/AuthProvider'; 
import { MANAGER_LEVEL } from '@/lib/constants';
import Link from 'next/link';

type Operation = 'Pay' | 'Deliver' | 'Cancel';

interface PayDeliverClientPageProps {
  initialCurrentUser: User | null;
  initialGifts: Gift[];
  initialUsers: User[];
  initialTransactions: Transaction[];
  initialSelectedUserId: string | null;
  initialSelectedOperation: Operation;
  serverError?: string | null;
}

export default function PayDeliverClientPage({
  initialCurrentUser,
  initialGifts,
  initialUsers,
  initialTransactions,
  initialSelectedUserId,
  initialSelectedOperation,
  serverError,
}: PayDeliverClientPageProps) {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { t, language } = useTranslation();
  const router = useRouter();

  // Use useAuth to get authentication state and token for client-side API calls
  const { userAuth, userData, token, loading: authLoading, error: authClientError } = useAuth();

  // Use initial data from props, allow client-side userData to override if available
  const currentUser = userData || initialCurrentUser;
  const gifts = initialGifts;
  const users = initialUsers;
  const allTransactions = initialTransactions;

  // State for client-side filtering and interaction
  const [selectedUserId, setSelectedUserId] = useState<string>(initialSelectedUserId || '');
  const [selectedOperation, setSelectedOperation] = useState<Operation>(initialSelectedOperation);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [authStep, setAuthStep] = useState<'idle' | 'confirm_method' | 'scanning_qr' | 'scanning_nfc' | 'authorizing' | 'failure'>('idle');
  const [requireduserAuthId, setRequireduserAuthId] = useState<string | null>(null);
  const [authErrorReason, setAuthErrorReason] = useState<string | null>(null);

  // Update selectedUserId and selectedOperation if URL params change (e.g., from reports page link)
  useEffect(() => {
    const urlUserId = searchParams.get('userId');
    const urlAction = searchParams.get('operaton') as Operation;

    if (urlUserId && urlUserId !== selectedUserId) {
      setSelectedUserId(urlUserId);
    }
    if (urlAction && urlAction !== selectedOperation) {
      setSelectedOperation(urlAction);
    }

    const urlTxId = searchParams.get('txId');
    if (urlTxId && !selectedTransactions.includes(urlTxId)) {
      setSelectedTransactions([urlTxId]);
    } else if (!urlTxId && selectedTransactions.length > 0) {
        // If txId is no longer in URL, clear selection
        setSelectedTransactions([]);
    }
  }, [searchParams, selectedUserId, selectedOperation, selectedTransactions]);

  const transactionsToDisplay = useMemo(() => {
    if (!allTransactions || !currentUser) return [];

    return allTransactions.filter(tx => {
      // Managers or higher can see all, other users only their own transactions
      if ( (currentUser.roleLevel < MANAGER_LEVEL) && !(tx.fromUserId === currentUser.id || tx.toUserId === currentUser.id)) {
        return false;
      }

      if (selectedOperation === 'Deliver') {
        return tx.toUserId === selectedUserId && tx.deliveryStatus === 'Pending' && tx.paymentStatus === 'Completed';
      } else if (selectedOperation === 'Pay') {
        return tx.fromUserId === selectedUserId && tx.paymentStatus === 'Pending';
      } else if (selectedOperation === 'Cancel') {
        // For cancel, show transactions where the selected user is either from or to, and status is Unpaid/Pending
        return (tx.fromUserId === selectedUserId || tx.toUserId === selectedUserId) && 
               (tx.paymentStatus === 'Pending' || tx.deliveryStatus === 'Pending');
      }
      return false; // Should not reach here
    });
  }, [allTransactions, currentUser, selectedUserId, selectedOperation]);

  const handleProcess = async () => {
    if (!token || selectedTransactions.length === 0) {
        toast({
            variant: 'destructive',
            title: t('authenticationError'),
            description: t('notAuthenticatedWarning'),
        });
        return;
    }

    let authorizingUserId: string | null = null;
    if (selectedTransactions.length > 0) {
        const firstTx = allTransactions.find(tx => tx.id === selectedTransactions[0]);
        if (firstTx) {
            if (selectedOperation === 'Deliver') {
                authorizingUserId = firstTx.toUserId;
            } else if (selectedOperation === 'Pay' || selectedOperation === 'Cancel') {
                authorizingUserId = firstTx.fromUserId;
            }
        }
    }

    if (!authorizingUserId) {
        toast({
            variant: 'destructive',
            title: t('authRequiredError'),
            description: t('authRequiredErrorDesc'),
        });
        return;
    }

    setRequireduserAuthId(authorizingUserId);
    setAuthStep('confirm_method');
    setIsProcessing(false);
  };

  const handleAuthorization = async (scannedUserId: string | null) => {
    setAuthStep('authorizing');
    setAuthErrorReason(null);

    if (!scannedUserId) {
        console.error('[DeliverSettlePage] Authorization failed: QR scan returned null or empty data.');
        setAuthErrorReason(t('qrScanFailedToast'));
        setAuthStep('failure');
        return;
    }

    if (scannedUserId !== requireduserAuthId) {
      console.error(`[DeliverSettlePage] Authorization failed: Scanned User ID '${scannedUserId}' does not match required User ID '${requireduserAuthId}'.`);
      setAuthErrorReason(t('authFailedMismatch'));
      setAuthStep('failure');
      return;
    }

    setIsProcessing(true);
    try {
        const response = await fetch('/api/data', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` + (scannedUserId === userAuth?.uid ? '' : `&x-authorized-user=${scannedUserId}`),
            },
            body: JSON.stringify({
                collection: 'transactions',
                action: 'batchUpdateStatus',
                transactions: selectedTransactions.map(txId => ({
                    id: txId,
                    statusType: selectedOperation === 'Deliver' ? 'deliveryStatus' : 'paymentStatus',
                    newStatus: selectedOperation === 'Deliver' ? 'Delivered' : (selectedOperation === 'Pay' ? 'Completed' : 'Canceled'),
                    ...(selectedOperation === 'Cancel' && { deliveryStatus: 'Canceled', paymentStatus: 'Canceled' })
                })),
                authorizingUserId: scannedUserId,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('[DeliverSettlePage] API processing failed:', errorData);
            setAuthErrorReason(errorData.error || t('failedToProcessTransactions'));
            setAuthStep('failure');
            return;
        }

        setIsProcessing(false);
        setIsSuccess(true);
        
        toast({
            title: t('processSuccessTitle', { action: t(selectedOperation.toLowerCase() as any) }),
            description: t('processSuccessDesc', { count: selectedTransactions.length.toString() }),
        });

        setTimeout(() => {
            setIsSuccess(false);
            setAuthStep('idle'); // Reset modal
            router.refresh(); // Use router.refresh() to revalidate server data
            setSelectedTransactions([]); // Clear selections after processing
        }, 2000);

    } catch (error: any) {
        console.error("Error processing transactions after authorization:", error);
        setAuthErrorReason(error.message || t('failedToProcessTransactions'));
        setAuthStep('failure');
        setIsProcessing(false);
    }
  };

  const resetAuthFlow = () => {
    setAuthStep('idle');
    setRequireduserAuthId(null);
    setAuthErrorReason(null);
    setIsProcessing(false);
    setIsSuccess(false);
  };
  
  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedTransactions(transactionsToDisplay.map(t => t.id));
    } else {
      setSelectedTransactions([]);
    }
  };

  const isAllSelected = transactionsToDisplay.length > 0 && selectedTransactions.length === transactionsToDisplay.length;
  const isSomeSelected = selectedTransactions.length > 0 && selectedTransactions.length < transactionsToDisplay.length;

  const nfcConfirmationUser = useMemo(() => {
    if (!requireduserAuthId || !users) return '';
    const user = users.find(u => u.id === requireduserAuthId);
    return user ? user.name : '';
  }, [requireduserAuthId, users]);

  const pageIsLoading = authLoading; // gifts, users, transactions loading are handled by server component
  const currentError = serverError || authClientError;

  if (pageIsLoading || !currentUser) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title={t('deliverSettleTitle')} description={t('deliverSettleSubTitle')} />
        <div className="p-4 md:p-6 space-y-6">
            <Card>
              <CardHeader><Skeleton className="h-6 w-1/3"/></CardHeader>
              <CardContent className="flex flex-col md:flex-row items-center gap-4"><Skeleton className="h-10 w-full md:w-[240px]"/><Skeleton className="h-10 w-full md:w-[180px]"/><Skeleton className="h-10 w-24 self-end"/></CardContent>
            </Card>
            <Card>
              <CardHeader><Skeleton className="h-6 w-full"/></CardHeader>
              <CardContent><Skeleton className="h-40 w-full"/></CardContent>
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
        <Button asChild className="mt-4"><Link href="/">{t('returnToLogin')}</Link></Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={t('deliverSettleTitle')} description={t('deliverSettleSubTitle')} />
      <div className="p-4 md:p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('selectActionTitle')}</CardTitle>
            <CardDescription>{t('selectActionDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row items-center gap-4">
            <div className="grid gap-1.5 w-full md:w-auto">
                <label className="text-sm font-medium">{t('userLabel')}</label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="w-full md:w-[240px]">
                    <SelectValue placeholder={t('selectUserPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                    {users?.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-muted-foreground" />
                        {user.name}
                      </div>
                    </SelectItem>
                    ))}
                </SelectContent>
                </Select>
            </div>
            <div className="grid gap-1.5 w-full md:w-auto">
                <label className="text-sm font-medium">{t('actionLabel')}</label>
                <Select value={selectedOperation} onValueChange={(v) => setSelectedOperation(v as Operation)}>
                    <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder={t('selectActionPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Pay">{t('payAction')}</SelectItem>
                        <SelectItem value="Deliver">{t('deliverAction')}</SelectItem>
                        <SelectItem value="Cancel">{t('cancelAction')}</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            {/* The search button is now implied by the select changes */}
            <Button onClick={() => {
              // This button is just to trigger the state update manually, but the selects already do it
            }} disabled={!selectedUserId || isProcessing} className="self-end">{t('searchButton')}</Button>
          </CardContent>
        </Card>

        {transactionsToDisplay.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('pendingTransactionsTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox 
                        checked={isAllSelected ? true : (isSomeSelected ? 'indeterminate' : false)}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>{t('giftLabel')}</TableHead>
                    <TableHead>{t(selectedOperation === 'Deliver' ? 'fromUser' : 'toUser')}</TableHead>
                    <TableHead>{t('date')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactionsToDisplay.map(tx => {
                    const gift = gifts?.find(g => g.id === tx.giftId);
                    const relevantUser = users?.find(u => u.id === (selectedOperation === 'Deliver' ? tx.fromUserId : tx.toUserId));
                    return (
                      <TableRow key={tx.id} data-state={selectedTransactions.includes(tx.id) && "selected"}>
                        <TableCell>
                          <Checkbox
                            checked={selectedTransactions.includes(tx.id)}
                            onCheckedChange={checked => {
                              setSelectedTransactions(prev => 
                                checked ? [...prev, tx.id] : prev.filter(id => id !== tx.id)
                              )
                            }}
                          />
                        </TableCell>
                        <TableCell>{gift?.name[language] || gift?.name.en}</TableCell>
                        <TableCell>{relevantUser?.name}</TableCell>
                        <TableCell>{new Date(tx.date).toLocaleDateString()}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
        
        {transactionsToDisplay.length > 0 && (
          <div className="flex justify-end">
            <Button onClick={handleProcess} disabled={selectedTransactions.length === 0 || isProcessing}>
                {isProcessing && <Hourglass className="mr-2 h-4 w-4 animate-spin" />}
                {t('processSelectedButton', {count: selectedTransactions.length.toString()})}
            </Button>
          </div>
        )}

        {transactionsToDisplay.length === 0 && selectedUserId && (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <h2 className="text-lg font-semibold">{t('noPendingTransactionsTitle')}</h2>
            <p className="text-muted-foreground">{t('noPendingTransactionsDesc')}</p>
          </div>
        )}

        { !selectedUserId && (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <h2 className="text-lg font-semibold">{t('selectUserToProcessTitle')}</h2>
            <p className="text-muted-foreground">{t('selectUserToProcessDesc')}</p>
          </div>
        )}
      </div>
      
      <Dialog open={authStep !== 'idle' || isSuccess || authErrorReason !== null} onOpenChange={(open) => !open && resetAuthFlow()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            {authStep === 'confirm_method' && <DialogTitle className="font-headline">{t('confirmAuthTitle')}</DialogTitle>}
            {authStep === 'scanning_qr' && <DialogTitle className="font-headline">{t('scanQRTitle')}</DialogTitle>}
            {authStep === 'scanning_nfc' && <DialogTitle className="font-headline">{t('scanNfcTitle')}</DialogTitle>}
            {authStep === 'authorizing' && <DialogTitle className="font-headline sr-only">{t('authorizingTitle')}</DialogTitle>}
            {isSuccess && <DialogTitle className="font-headline">{t('processCompleteTitle')}</DialogTitle>}
            {authStep === 'failure' && <DialogTitle className="font-headline text-destructive">{t('authFailedTitle')}</DialogTitle>}

            {authStep === 'confirm_method' && <DialogDescription>{t('confirmAuthDesc', { userType: nfcConfirmationUser })}</DialogDescription>}
            {authStep === 'scanning_qr' && <DialogDescription>{t('scanQRDesc')}</DialogDescription>}
            {authStep === 'scanning_nfc' && <DialogDescription>{t('scanningNfcDesc')}</DialogDescription>}
            {authStep === 'failure' && <DialogDescription>{authErrorReason || t('unknownAuthError')}</DialogDescription>}
            {isSuccess && <DialogDescription>{t('processCompleteDesc')}</DialogDescription>}
          </DialogHeader>
          <div className="p-6 text-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={authStep}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                {/* Confirm Method */}
                {authStep === 'confirm_method' && (
                  <div className="flex flex-col items-center gap-6">
                    {users && requireduserAuthId && (
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                                <UserIcon className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <span className="font-semibold">{users.find(u => u.id === requireduserAuthId)?.name || 'Unknown User'}</span>
                            <p className="text-sm text-muted-foreground">{t('needsToAuthorize')}</p>
                        </div>
                    )}
                    <Button onClick={() => setAuthStep('scanning_nfc')} size="lg" className="w-full font-bold text-lg py-7" disabled={isProcessing}>
                      <ScanIcon className="mr-2 h-5 w-5" />{t('scanNFCButton')}
                    </Button>
                    <Button onClick={() => setAuthStep('scanning_qr')} size="lg" variant="outline" className="w-full font-bold text-lg py-7" disabled={isProcessing}>
                      <QrCodeIcon className="mr-2 h-5 w-5" />{t('scanQRButton')}
                    </Button>
                  </div>
                )}

                {/* Scanning QR */}
                {authStep === 'scanning_qr' && (
                  <div className="flex flex-col items-center">
                    <QrScanner onScanSuccess={handleAuthorization} />
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" onClick={() => setAuthStep('confirm_method')} disabled={isProcessing}>
                        {t('cancelButton')}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Scanning NFC */}
                {authStep === 'scanning_nfc' && (
                  <div className="flex flex-col items-center gap-6">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                      <Hourglass className="w-24 h-24 text-primary" />
                    </motion.div>
                    <h2 className="text-2xl font-headline font-bold">{t('scanningNfcTitle')}</h2>
                    <p className="text-muted-foreground">{t('scanningNfcDesc')}</p>
                    <Button variant="outline" onClick={() => setAuthStep('confirm_method')} disabled={isProcessing}>
                        {t('cancelButton')}
                    </Button>
                  </div>
                )}

                {/* Authorizing... / Processing... (when API call is in progress) */}
                {(authStep === 'authorizing' || isProcessing) && (
                  <div className="flex flex-col items-center gap-6">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                      <Hourglass className="w-24 h-24 text-primary" />
                    </motion.div>
                    <h2 className="text-2xl font-headline font-bold">{t('authorizingTitle')}</h2>
                    <p className="text-muted-foreground">{t('authorizingDesc')}</p>
                  </div>
                )}

                {/* Success */}
                {isSuccess && (
                  <div className="flex flex-col items-center gap-6">
                    <CheckCircle className="w-24 h-24 text-green-500" />
                    <h2 className="text-2xl font-headline font-bold">{t('processCompleteTitle')}</h2>
                    <p className="text-muted-foreground">{t('processCompleteDesc')}</p>
                    <Button size="lg" className="w-full" onClick={resetAuthFlow}>
                      {t('doneButton')}
                    </Button>
                  </div>
                )}

                {/* Failure */}
                {authStep === 'failure' && (
                  <div className="flex flex-col items-center gap-6">
                    <AlertTriangle className="w-24 h-24 text-destructive" />
                    <h2 className="2xl font-headline font-bold">{t('authFailedTitle')}</h2>
                    <p className="text-muted-foreground">{authErrorReason || t('unknownAuthError')}</p>
                    <Button size="lg" className="w-full" onClick={resetAuthFlow}>
                      {t('doneButton')}
                    </Button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}