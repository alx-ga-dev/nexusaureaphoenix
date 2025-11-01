
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
import { Skeleton } from '@/components/ui/skeleton';

type UserTypeFilter = 'All' | 'Blue' | 'Pink';

interface UsersPageClientProps {
  initialCurrentUser: User | null;
  initialAllUsers: User[];
  serverError?: string | null;
}

export default function UsersPageClient({ initialCurrentUser, initialAllUsers, serverError }: UsersPageClientProps) {
  const { t } = useTranslation();
  
  const [currentUser] = useState(initialCurrentUser);
  const [allUsers] = useState(initialAllUsers);
  
  const [typeFilter, setTypeFilter] = useState<UserTypeFilter>('All');
  const [searchFilter, setSearchFilter] = useState('');
  
  useEffect(() => {
    if (currentUser) {
      setTypeFilter(currentUser.type === 'Blue' ? 'Pink' : 'Blue');
    }
  }, [currentUser]);

  const filteredUsers = useMemo(() => {
    if (!allUsers || !currentUser) return [];
    
    return allUsers.filter(user => {
      if (user.id === currentUser.id) return false;
      
      const typeMatch = typeFilter === 'All' || user.type === typeFilter;
      const searchMatch = user.name.toLowerCase().includes(searchFilter.toLowerCase());

      return typeMatch && searchMatch;
    });
  }, [typeFilter, searchFilter, currentUser, allUsers]);

  if (serverError) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center p-4">
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold font-headline mb-2">{t('error')}</h1>
        <p className="text-muted-foreground max-w-md">{serverError || t('unknownError')}</p>
      </div>
    );
  }
  
  if (!currentUser) {
     return (
        <div className="flex flex-col h-full">
            <PageHeader title={t('navUsers')} description={t('usersPageSubTitle')} />
            <div className="p-4 md:p-6">
                <div className="flex items-center gap-4 mb-4">
                  <Skeleton className="h-10 w-[250px]" />
                  <Skeleton className="h-10 w-[180px]" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                     <Skeleton key={i} className="h-[200px] w-full rounded-lg" />
                  ))}
                </div>
            </div>
        </div>
    );
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
