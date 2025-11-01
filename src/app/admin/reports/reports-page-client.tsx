// src/app/reports/reports-page-client.tsx
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { useTranslation } from '@/hooks/use-translation';
import type { OperationStatus, Gift, User, Transaction } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { MoreHorizontal, SlidersHorizontal, ChevronsUpDown, X, User as UserIcon, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';

type FilterableColumn = 'gift' | 'from' | 'to' | 'deliveryStatus' | 'paymentStatus';

const filterableColumns: { value: FilterableColumn, label: string }[] = [
    { value: 'gift', label: 'giftName' }, // Using translation key
    { value: 'from', label: 'fromUser' }, // Using translation key
    { value: 'to', label: 'toUser' },     // Using translation key
    { value: 'deliveryStatus', label: 'deliveryStatus' }, // Using translation key
    { value: 'paymentStatus', label: 'paymentStatus' }, // Using translation key
];

interface ManagementReportsClientProps {
  initialCurrentUser: User | null;
  initialGifts: Gift[];
  initialUsers: User[];
  initialTransactions: Transaction[];
  serverError?: string | null;
}

export default function ManagementReportsClient({
  initialCurrentUser,
  initialGifts,
  initialUsers,
  initialTransactions,
  serverError,
}: ManagementReportsClientProps) {
  const { t, language } = useTranslation();
  const router = useRouter();

  const { 
    userAuth, 
    userData, 
    loading: authLoading, 
    error: authClientError,
  } = useAuth();

  // Use initial data from props, allow client-side userData to override if available
  const currentUser = userData || initialCurrentUser;
  const gifts = initialGifts;
  const users = initialUsers;
  const transactions = initialTransactions;

  const [activeFilterColumn, setActiveFilterColumn] = useState<FilterableColumn>('gift');
  const [textFilter, setTextFilter] = useState('');
  const [statusFilters, setStatusFilters] = useState<{ deliveryStatus: OperationStatus[], paymentStatus: OperationStatus[] }>({
      deliveryStatus: [],
      paymentStatus: [],
  });
  const [showCompleted, setShowCompleted] = useState(false); // Default to false (hide completed)
  
  const operationStatusMap: { [key in OperationStatus]: { label: string, className: string } } = {
      Pending: { label: t('pending'), className: 'bg-red-500/20 text-red-400 border-red-500/30' },
      Completed: { label: t('completed'), className: 'bg-green-500/20 text-green-400 border-green-500/30' },
      Canceled: { label: t('canceled'), className: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' },
  };

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    
    return transactions.filter(tx => {
      console.log(`[ManagementReportsClient] Filtering transaction ${tx.id} - ${tx.paymentStatus} - ${tx.deliveryStatus}`);
      const isTransactionCompleted = tx.deliveryStatus === 'Completed' && tx.paymentStatus === 'Completed';

      if (!showCompleted && isTransactionCompleted) {
          return false;
      }

      const gift = gifts?.find(g => g.id === tx.giftId);
      const fromUser = users?.find(u => u.id === tx.fromUserId);
      const toUser = users?.find(u => u.id === tx.toUserId);

      let baseFilter = true;
      if (statusFilters.deliveryStatus.length > 0) {
        baseFilter = statusFilters.deliveryStatus.includes(tx.deliveryStatus);
      }
      if (statusFilters.paymentStatus.length > 0) {
        baseFilter = baseFilter && statusFilters.paymentStatus.includes(tx.paymentStatus);
      }

      if (textFilter && gift) {
          switch (activeFilterColumn) {
              case 'gift':
                  baseFilter = baseFilter && !!(gift.name[language] || gift.name.en).toLowerCase().includes(textFilter.toLowerCase());
                  break;
              case 'from':
                  baseFilter = baseFilter && !!fromUser?.name.toLowerCase().includes(textFilter.toLowerCase());
                  break;
              case 'to':
                  baseFilter = baseFilter && !!toUser?.name.toLowerCase().includes(textFilter.toLowerCase());
                  break;
          }
      }

      return baseFilter;
    });
  }, [transactions, activeFilterColumn, textFilter, statusFilters, gifts, language, users, showCompleted]);

  const handleActionClick = (action: 'Deliver' | 'Settle' | 'Cancel', txId: string) => {
    // Redirect to deliver-settle page with relevant parameters
    router.push(`/management/deliver-settle?action=${action}&txId=${txId}`);
  };
  
  const handleFilterColumnChange = (value: FilterableColumn) => {
      setActiveFilterColumn(value);
      if (value !== 'deliveryStatus' && value !== 'paymentStatus') {
        setStatusFilters({ deliveryStatus: [], paymentStatus: [] });
      } else {
        setTextFilter('');
      }
  }

  const handleStatusFilterChange = (statusType: 'deliveryStatus' | 'paymentStatus', value: string, checked: boolean) => {
      setActiveFilterColumn(statusType);
      setTextFilter('');
      setStatusFilters(prev => ({
          ...prev,
          [statusType]: checked
              ? [...prev[statusType], value]
              : prev[statusType].filter(v => v !== value)
      }));
  }

  const renderFilterValueInput = () => {
    const isStatusFilter = activeFilterColumn === 'deliveryStatus' || activeFilterColumn === 'paymentStatus';

    if (isStatusFilter) {
        const options = activeFilterColumn === 'deliveryStatus' ? Object.keys(operationStatusMap) : Object.keys(operationStatusMap);
        const selectedValues = statusFilters[activeFilterColumn];
        
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-[200px] justify-between">
                        <span>{selectedValues.length > 0 ? `${selectedValues.length} selected` : t('selectStatusPlaceholder')}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[200px]">
                    <DropdownMenuLabel>{t('filterBy', { column: t(activeFilterColumn as any) })}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {options.map(option => (
                       <DropdownMenuCheckboxItem
                            key={option}
                            checked={selectedValues.includes(option as any)}
                            onCheckedChange={checked => handleStatusFilterChange(activeFilterColumn, option, !!checked)}
                       >
                            {t(option.toLowerCase() as any)}
                       </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    return <Input placeholder={t('filterBy', { column: t(activeFilterColumn as any) })} value={textFilter} onChange={e => setTextFilter(e.target.value)} className="max-w-xs"/>;
  }

  const isFilterActive = textFilter || statusFilters.deliveryStatus.length > 0 || statusFilters.paymentStatus.length > 0;

  // Consolidated loading for the entire page
  const pageIsLoading = authLoading; // giftsLoading, usersLoading, transactionsLoading are handled by server component
  const currentError = serverError || authClientError;

  // Render loading skeleton if AuthProvider is loading
  if (pageIsLoading || !currentUser) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title={t('adminReportsTitle')} description={t('adminReportsSubTitle')} />
        <div className="p-4 md:px-6 border-b">
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    {Array.from({length: 7}).map((_, i) => (
                      <TableHead key={i}><Skeleton className="h-6 w-24"/></TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({length: 5}).map((_, i) => (
                      <TableRow key={i}>
                          <TableCell><Skeleton className="h-5 w-24"/></TableCell>
                          <TableCell><Skeleton className="h-5 w-32"/></TableCell>
                          <TableCell><Skeleton className="h-5 w-28"/></TableCell>
                          <TableCell><Skeleton className="h-5 w-28"/></TableCell>
                          <TableCell><Skeleton className="h-6 w-20"/></TableCell>
                          <TableCell><Skeleton className="h-6 w-20"/></TableCell>
                          <TableCell><Skeleton className="h-8 w-8 ml-auto"/></TableCell>
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

  // If not loading and no authenticated Firebase user, let AppShell handle redirect
  if (!userAuth) {
      return null; 
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={t('adminReportsTitle')} description={t('adminReportsSubTitle')} />
      
      <div className="p-4 md:px-6 border-b">
        <div className="flex items-center gap-2 mb-4">
            <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">{t('filtersTitle')}</h3>
        </div>
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
                <Select value={activeFilterColumn} onValueChange={handleFilterColumnChange}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder={t('filterByColumnPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                        {filterableColumns.map(col => (
                            <SelectItem key={col.value} value={col.value}>{t(col.label as any)}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {renderFilterValueInput()}
                
                {isFilterActive && (
                    <Button variant="ghost" onClick={() => { setTextFilter(''); setStatusFilters({ deliveryStatus: [], paymentStatus: [] }); setShowCompleted(false); }}>
                        <X className="mr-2 h-4 w-4" />
                        {t('clearFilterButton')}
                    </Button>
                )}
            </div>

            <div className="flex items-center space-x-2 self-start"> 
              <Checkbox
                id="showCompleted"
                checked={showCompleted}
                onCheckedChange={(checked: boolean | 'indeterminate') => setShowCompleted(!!checked)}
              />
              <label
                htmlFor="showCompleted"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {t('showCompletedTransactions')}
              </label>
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('giftName')}</TableHead>
                  <TableHead>{t('fromUser')}</TableHead>
                  <TableHead>{t('toUser')}</TableHead>
                  <TableHead>{t('paymentStatus')}</TableHead>
                  <TableHead>{t('deliveryStatus')}</TableHead>
                  <TableHead className="text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions?.length === 0 && !pageIsLoading && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">{t('noTransactionsFound')}</TableCell></TableRow>
                )}
                {filteredTransactions.map((tx) => {
                  const gift = gifts?.find((g) => g.id === tx.giftId);
                  const fromUser = users?.find((u) => u.id === tx.fromUserId);
                  const toUser = users?.find((u) => u.id === tx.toUserId);

                  const canDeliver = tx.paymentStatus === 'Completed' && tx.deliveryStatus === 'Pending';
                  const canSettle = tx.paymentStatus === 'Pending';
                  const canCancel = tx.paymentStatus === 'Pending';
                  const noActions = tx.deliveryStatus === 'Completed' || tx.deliveryStatus === 'Canceled';
                  
                  return (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium">{gift?.name[language] || gift?.name.en}</TableCell>
                      <TableCell><div className="flex items-center gap-2"><UserIcon className="h-4 w-4 text-muted-foreground"/>{fromUser?.name}</div></TableCell>
                      <TableCell><div className="flex items-center gap-2"><UserIcon className="h-4 w-4 text-muted-foreground"/>{toUser?.name}</div></TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('font-semibold', operationStatusMap[tx.paymentStatus].className)}>
                            {t(tx.paymentStatus.toLowerCase() as any)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('font-semibold', operationStatusMap[tx.deliveryStatus]?.className)}>
                            {t(tx.deliveryStatus.toLowerCase() as any)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0" disabled={noActions}>
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {noActions && <DropdownMenuItem disabled>{t('noActionsAvailable')}</DropdownMenuItem>}
                            {canSettle && <DropdownMenuItem onClick={() => handleActionClick('Settle', tx.id)}>{t('settleAction')}</DropdownMenuItem>}
                            {canDeliver && <DropdownMenuItem onClick={() => handleActionClick('Deliver', tx.id)}>{t('deliverAction')}</DropdownMenuItem>}
                            {canCancel && <DropdownMenuItem onClick={() => handleActionClick('Cancel', tx.id)}>{t('cancelAction')}</DropdownMenuItem>}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}