
'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { DEFAULT_USER_ID } from '@/lib/constants';

type WishlistContextType = {
  wishlist: string[];
  addGiftToWishlist: (giftId: string) => void;
  removeGiftFromWishlist: (giftId: string) => void;
  isLoading: boolean;
  isInWishlist: (giftId: string) => boolean; // Added for convenience
};

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider = ({ children }: { children: React.ReactNode }) => {
  const { toast } = useToast();
  const { userAuth, userData: currentUser, token, loading: authLoading } = useAuth();
  
  const userId = useMemo(() => userAuth?.uid, [userAuth]);

  const wishlist = useMemo(() => currentUser?.wishlist || [], [currentUser]);

  const updateWishlistInFirestore = async (updatedWishlist: string[]) => {
    if (!userId || !token || authLoading) return;

    try {
      const response = await fetch('/api/data', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          collection: 'users',
          docId: userId,
          data: { wishlist: updatedWishlist },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update wishlist.');
      }
    } catch (error: any) {
      console.error('Could not update wishlist in Firestore', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Could not update your wishlist.',
      });
    }
  };

  const addGiftToWishlist = (giftId: string) => {
    if (wishlist.includes(giftId)) return; 
    const updatedWishlist = [...wishlist, giftId];
    updateWishlistInFirestore(updatedWishlist);
    if (currentUser) currentUser.wishlist = updatedWishlist; 
  };

  const removeGiftFromWishlist = (giftId: string) => {
    // CORRECTED: Explicitly type the 'id' parameter as string
    const updatedWishlist = wishlist.filter((id: string) => id !== giftId);
    updateWishlistInFirestore(updatedWishlist);
    if (currentUser) currentUser.wishlist = updatedWishlist;
  };

  const isInWishlist = useMemo(() => (giftId: string) => wishlist.includes(giftId), [wishlist]);

  const isLoading = authLoading || !currentUser;

  return (
    <WishlistContext.Provider value={{
      wishlist,
      addGiftToWishlist,
      removeGiftFromWishlist,
      isLoading,
      isInWishlist,
    }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};