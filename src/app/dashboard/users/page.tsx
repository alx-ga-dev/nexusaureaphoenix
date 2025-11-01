
'use client';
import { useState, useMemo, useEffect } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { UserCard } from '@/components/UserCard';
import { useTranslation } from '@/hooks/use-translation';
import { User } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { User as UserIcon, Search, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useCollection } from '@/hooks/use-collection';
import { DEFAULT_USER_ID } from '@/lib/constants';
import { Skeleton } from '@/components/ui/skeleton';

type UserTypeFilter = 'All' | 'Blue' | 'Pink';

export default function UsersPage() {
  const { t } = useTranslation();
  // Destructure relevant states from useAuth
  const { userAuth, userData, loading: authLoading, token, error: authError } = useAuth();

  // Simplify userId derivation. Use userData.id as primary.
  const userId = useMemo(() => userData?.id || (userAuth?.isAnonymous ? DEFAULT_USER_ID : userAuth?.uid), [userData, userAuth]);

  // Use userData directly for the current user's profile
  const currentUser = userData;

  const { data: allUsers, isLoading: allUsersLoading, error: allUsersError } = useCollection<User>('users');

  const [typeFilter, setTypeFilter] = useState<UserTypeFilter>('All');
  const [searchFilter, setSearchFilter] = useState('');
  
  useEffect(() => {
    // Adjust useEffect to use userData
    if(userData) {
      setTypeFilter(userData.type === 'Blue' ? 'Pink' : 'Blue');
    }
  }, [userData]);

  const filteredUsers = useMemo(() => {
    // Adjust memoization to use userData
    if (!allUsers || !userData) return [];
    return allUsers.filter(user => {
      if (user.id === userData.id) return false; // Compare with userData.id
      
      const typeMatch = typeFilter === 'All' || user.type === typeFilter;
      const searchMatch = user.name.toLowerCase().includes(searchFilter.toLowerCase());

      return typeMatch && searchMatch;
    });
  }, [typeFilter, searchFilter, userData, allUsers]); // Add userData to dependencies

  // Consolidated loading state for this page
  const isLoading = authLoading || allUsersLoading; // Removed isCurrentUserLoading, isAuthUserLoading
  const currentError = authError || allUsersError;

  // Render loading state if AuthProvider is loading OR if this page's data is loading OR no user data yet
  if (isLoading || !currentUser) {
    return (
        <div className="flex flex-col h-full">
            <PageHeader title={t('navUsers')} description={t('usersPageSubTitle')} />
            <div className="p-4 md:p-6">
                <Skeleton className="h-8 w-full mb-4" />
                <Skeleton className="h-12 w-full" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <UserCard key={i} user={{ id: `skeleton-${i}`, name: 'Loading...', type: 'Blue', roleLevel: 0 }} />
                  ))}
                </div>
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
        <p className="text-muted-foreground max-w-md">currentError || t('unknownError')</p>
      </div>
    );
  }

  // If not loading and no authenticated Firebase user, let AppShell handle redirect
  if (!userAuth) {
      return null; 
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={t('navUsers')} description={t('usersPageSubTitle')} />
      <div className="p-4 md:p-6 border-b flex items-center gap-4">
        <div className="relative flex-grow md:flex-grow-0">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t('searchUsersPlaceholder')}
            className="w-full md:w-[250px] pl-8"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as UserTypeFilter)}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder={t('filterByUserType')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">{t('allTypes')}</SelectItem>
            <SelectItem value="Blue">Blue</SelectItem>
            <SelectItem value="Pink">Pink</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {filteredUsers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredUsers.map((user) => (
                <UserCard key={user.id} user={user} />
            ))}
            </div>
        ) : (
             <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                        <UserIcon className="w-8 h-8 text-muted-foreground" />
                    </div>
                </div>
                <p className="text-lg font-semibold">{t('noUsersFound')}</p>
                <p className="text-muted-foreground">{t('noUsersFoundSubtext')}</p>
            </div>
        )}
      </div>
    </div>
  );
}