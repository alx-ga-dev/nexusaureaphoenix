
'use client';

import { useRouter } from 'next/navigation';
import { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash2, Edit, Nfc, QrCode } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

type UserActionsProps = {
  user: User;
  onDelete: (user: User) => void;
  onCreateTag: (user: User) => void;
  onCreateQr: (user: User) => void;
};

export function UserActions({ user, onDelete, onCreateTag, onCreateQr }: UserActionsProps) {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => router.push(`/admin/users/${user.id}/edit`)}>
          <Edit className="mr-2 h-4 w-4" />
          <span>{t('editAction')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onCreateTag(user)}>
          <Nfc className="mr-2 h-4 w-4" />
          <span>{t('createTagAction')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onCreateQr(user)}>
          <QrCode className="mr-2 h-4 w-4" />
          <span>{t('createQrAction')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDelete(user)} className="text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          <span>{t('deleteAction')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}