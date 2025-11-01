
'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Gift,
  ScrollText,
  Users as UsersIcon,
  FileText,
  UserCircle,
  LogOut,
  Cog,
  Hourglass,
  CheckCircle,
  Send,
  Package,
  ClipboardList,
  User,
  Shapes,
  Gem,
  Settings,
  QrCode,
  Scan,
  Database,
  Frown,
} from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { User as UserType, Gift as GiftType } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AnimatePresence, motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from './ui/card';
import Image from 'next/image';
import { QrScanner } from './QrScanner';
import { Badge } from './ui/badge';
import { useAuth } from '@/components/AuthProvider';
import { useCollection } from '@/hooks/use-collection';
import { WishlistProvider } from '@/context/WishListContext';
import { DEFAULT_USER_ID, ADMIN_LEVEL, MANAGER_LEVEL } from '@/lib/constants';
import { useMemo } from 'react';

type ExchangeContextType = {
  startExchange: (gift: GiftType) => void;
  startSend: (gift: GiftType) => void;
};

const ExchangeContext = React.createContext<ExchangeContextType | null>(null);

export function useExchange() {
  const context = React.useContext(ExchangeContext);
  if (!context) throw new Error('useExchange must be used within an ExchangeProvider');
  return context;
}

function ExchangeProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { userAuth, token, userData } = useAuth(); // Use userAuth and userData
  const userId = useMemo(() => userAuth?.isAnonymous ? DEFAULT_USER_ID : userAuth?.uid, [userAuth]);

  // Use userData from AuthProvider directly if available, otherwise fetch if needed
  const currentUser = userData; 
 
  const [step, setStep] = React.useState<'idle' | 'confirm_gift_now' | 'scanning_nfc' | 'scanning_qr' | 'confirm_exchange' | 'success' | 'confirm_send'>('idle');
  const [gift, setGift] = React.useState<GiftType | null>(null);
  const { data: users } = useCollection<UserType>(gift ? 'users' : null);
  const [scannedUser, setScannedUser] = React.useState<UserType | null>(null);
  const [sendToUser, setSendToUser] = React.useState<string>('');
  const { toast } = useToast();

  const startExchange = (g: GiftType) => {
    setGift(g);
    setStep('confirm_gift_now');
  };
  
  const startSend = (g: GiftType) => {
    setGift(g);
    setSendToUser('');
    setStep('confirm_send');
  };

  const handleStartNFCScan = () => {
    setStep('scanning_nfc');
    setTimeout(() => {
      const otherUser = users?.find(u => u.id !== currentUser?.id);
      if (otherUser) {
        setScannedUser(otherUser);
        setStep('confirm_exchange');
      } else {
        toast({ variant: 'destructive', title: t('userNotFoundToast') });
        reset();
      }
    }, 2000);
  };
  
  const handleStartQRScan = () => setStep('scanning_qr');

  const handleQrScanSuccess = (scannedId: string | null) => {
    if (scannedId) {
        const user = users?.find(u => u.id === scannedId);
        if (user) {
            setScannedUser(user);
            setStep('confirm_exchange');
        } else {
            toast({ variant: 'destructive', title: t('invalidQrToast'), description: t('invalidQrToastDesc') });
            setStep('confirm_gift_now');
        }
    } else {
        toast({ variant: 'destructive', title: t('qrScanFailedToast') });
        setStep('confirm_gift_now');
    }
  };

  const handleConfirmExchange = async () => {
    if (!gift || !scannedUser || !currentUser || !token) return;
    
    const transactionData = {
      giftId: gift.id, fromUserId: currentUser.id, toUserId: scannedUser.id,
      participants: [currentUser.id, scannedUser.id], date: new Date().toISOString(),
      deliveryStatus: 'Pending', settlementStatus: 'Unpaid', type: 'exchange' as const,
    };

    await fetch('/api/data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ collection: 'transactions', data: transactionData }),
    });
    setStep('success');
  };

  const handleConfirmSend = async () => {
    if (!gift || !sendToUser || !currentUser || !token) return;
    
    const transactionData = {
      giftId: gift.id, fromUserId: currentUser.id, toUserId: sendToUser,
      participants: [currentUser.id, sendToUser], date: new Date().toISOString(),
      deliveryStatus: 'Pending', settlementStatus: 'Unpaid', type: 'send' as const,
    };

    await fetch('/api/data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ collection: 'transactions', data: transactionData }),
    });

    toast({ title: t('giftSentToast'), description: t('giftSentToastDesc', { giftName: gift.name.en, userName: users?.find((u) => u.id === sendToUser)?.name || '' }), });
    reset();
  };

  const reset = () => {
    setStep('idle');
    setGift(null);
    setScannedUser(null);
    setSendToUser('');
  };

  return (
    <ExchangeContext.Provider value={{ startExchange, startSend }}>
      {children}
      <Dialog open={step === 'confirm_gift_now'} onOpenChange={(open) => !open && reset()}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-headline">{t('confirmGiftTitle')}</DialogTitle><DialogDescription>{t('confirmGiftDesc', { giftName: gift?.name.en || '' })}</DialogDescription></DialogHeader>
           <div className="flex flex-col items-center space-y-4 pt-4">
              <Button onClick={handleStartNFCScan} size="lg" className="w-full font-bold text-lg py-7"><Scan className="mr-2 h-5 w-5" />{t('scanNFCButton')}</Button>
              <Button onClick={handleStartQRScan} size="lg" variant="outline" className="w-full font-bold text-lg py-7"><QrCode className="mr-2 h-5 w-5" />{t('scanQRButton')}</Button>
           </div>
          <DialogFooter><Button variant="outline" onClick={reset}>{t('cancelButton')}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={step === 'scanning_qr'} onOpenChange={(open) => !open && setStep('confirm_gift_now')}>
        <DialogContent>
           <DialogHeader><DialogTitle className="font-headline">{t('scanQRTitle')}</DialogTitle><DialogDescription>{t('scanQRDesc')}</DialogDescription></DialogHeader>
           <div className="flex justify-center p-4"><QrScanner onScanSuccess={handleQrScanSuccess} /></div>
            <DialogFooter className="gap-2 sm:justify-end">
                <Button variant="outline" onClick={() => setStep('confirm_gift_now')}>{t('cancelButton')}</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={step === 'confirm_exchange'} onOpenChange={(open) => !open && reset()}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-headline">{t('confirmGiftTitle')}</DialogTitle><DialogDescription>{t('confirmSendDesc', { giftName: gift?.name.en || '', userName: scannedUser?.name || '' })}</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center space-x-4">
              <div className="flex flex-col items-center gap-2"><div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center"><User className="w-8 h-8 text-muted-foreground" /></div><span className="font-semibold">{t('you')}</span></div>
              <Gift className="w-8 h-8 text-muted-foreground" />
              <div className="flex flex-col items-center gap-2"><div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center"><User className="w-8 h-8 text-muted-foreground" /></div><span className="font-semibold">{scannedUser?.name}</span></div>
            </div>
            {gift && gift.imageUrl && (<div className="flex items-center gap-4 bg-secondary p-4 rounded-lg"><Image src={gift.imageUrl} alt={gift.name.en} width={64} height={64} className="rounded-md" data-ai-hint={gift.name.en} /><div><p className="font-bold">{gift.name.en}</p><p className="text-sm text-muted-foreground">{gift.collectionId}</p></div></div>)}
          </div>
          <DialogFooter><Button variant="outline" onClick={reset}>{t('cancelButton')}</Button><Button onClick={handleConfirmExchange}>{t('confirmGiftButton')}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={step === 'confirm_send'} onOpenChange={(open) => !open && reset()}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-headline">{t('sendGiftModalTitle')}</DialogTitle><DialogDescription>{t('sendGiftModalDesc', { giftName: gift?.name.en || '' })}</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            {gift && gift.imageUrl && (<div className="flex items-center gap-4 bg-secondary p-4 rounded-lg"><Image src={gift.imageUrl} alt={gift.name.en} width={64} height={64} className="rounded-md" data-ai-hint={gift.name.en} /><div><p className="font-bold">{gift.name.en}</p><p className="text-sm text-muted-foreground">{gift.collectionId}</p></div></div>)}
            <div><label className="text-sm font-medium">{t('sendToLabel')}</label><Select onValueChange={setSendToUser}><SelectTrigger><SelectValue placeholder={t('selectUserPlaceholder')} /></SelectTrigger><SelectContent>{users?.filter((u) => u.id !== currentUser?.id).map((user) => (<SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>))}</SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={reset}>{t('cancelButton')}</Button><Button onClick={handleConfirmSend} disabled={!sendToUser}>{t('confirmAndSendButton')}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={step === 'scanning_nfc' || step === 'success'} onOpenChange={(open) => !open && reset()}>
        <DialogContent className="max-w-sm"><DialogHeader><DialogTitle className="sr-only">{step === 'scanning_nfc' ? 'Scanning for NFC tag.' : 'Gift exchange successful.'}</DialogTitle></DialogHeader><Card className="w-full text-center shadow-none border-none"><CardContent className="p-6"><AnimatePresence mode="wait"><motion.div key={step} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.3 }}>
                  {step === 'scanning_nfc' && (<div className="flex flex-col items-center gap-6"><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear', }}><Hourglass className="w-24 h-24 text-primary" /></motion.div><h2 className="text-2xl font-headline font-bold">{t('scanningTitle')}</h2><p className="text-muted-foreground">{t('scanningNfcDesc')}</p></div>)}
                  {step === 'success' && (<div className="flex flex-col items-center gap-6"><CheckCircle className="w-24 h-24 text-green-500" /><h2 className="text-2xl font-headline font-bold">{t('giftSuccessTitle')}</h2><p className="text-muted-foreground">{t('giftSuccessDesc')}</p><Button size="lg" className="w-full" onClick={reset}>{t('doneButton')}</Button></div>)}
        </motion.div></AnimatePresence></CardContent></Card></DialogContent>
      </Dialog>
    </ExchangeContext.Provider>
  );
}

function GiftIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" >
      <path d="M20 12v10H4V12" />
      <path d="M2 7h20v5H2z" />
      <path d="m12 22 4-10-8 0 4 10" />
      <path d="M12 2v5" />
    </svg>
  );
}

function MobileHeader() {
    const { isMobile } = useSidebar();
    const { t } = useTranslation();
    if (!isMobile) return null;

    return (
        <header className="p-2 border-b flex items-center gap-2 md:hidden">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-primary bg-primary/20 hover:bg-primary/30" asChild>
                  <Link href="/dashboard"><GiftIcon className="w-5 h-5" /></Link>
                </Button>
                <h2 className="text-lg font-headline font-semibold tracking-tight">{t('loginTitle')}</h2>
            </div>
        </header>
    )
}

function AppShellSkeleton() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary"></div>
        <h2 className="text-xl font-semibold">Loading...</h2>
        <p className="text-muted-foreground">Preparing your dashboard.</p>
      </div>
    </div>
  )
}

const AppLayout = ({ userData, children }: { userData: UserType, children: React.ReactNode }) => {
    const pathname = usePathname();
    const { t, language } = useTranslation();
    const { logout } = useAuth(); // Destructure logout directly
    const router = useRouter();

    const isAdmin = (userData.roleLevel >= ADMIN_LEVEL);

    const navItems = [
        { href: '/dashboard', icon: LayoutDashboard, label: t('navDashboard') },
        { href: '/dashboard/catalog', icon: Package, label: t('navCatalog') },
        { href: '/dashboard/users', icon: UsersIcon, label: t('navUsers') },
        { href: '/dashboard/wish-list', icon: ScrollText, label: t('navWishList') },
    ];
    const operationsNavItems = [
      { href: '/operations/pay-deliver', icon: ClipboardList, label: t('navDeliverPay') },
    ];
    const adminNavItems = [
        { href: '/admin/reports', icon: FileText, label: t('navReports') },
    ];
    const managementNavItems = [
        { href: '/admin/users', icon: UsersIcon, label: t('navUsers') },
        { href: '/admin/catalog', icon: Gift, label: t('navAdminCatalog') },
        { href: '/admin/collections', icon: Shapes, label: t('navAdminCollections') },
        { href: '/admin/rarities', icon: Gem, label: t('navAdminRarities') },
    ];
    
    const handleLogout = async () => {
      await logout(); // Call logout directly
      router.push('/');
    };

    return (
      <WishlistProvider>
        <ExchangeProvider>
            <SidebarProvider>
            <Sidebar>
                <SidebarHeader>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="text-primary bg-primary/20 hover:bg-primary/30" asChild>
                      <Link href={'/dashboard'}><GiftIcon className="w-5 h-5" /></Link>
                    </Button>
                    <h2 className="text-lg font-headline font-semibold tracking-tight">{t('loginTitle')}</h2>
                  </div>
                </SidebarHeader>
                <SidebarContent>
                <SidebarMenu>
                    {navItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                        <Link href={item.href}>
                        <SidebarMenuButton isActive={pathname.startsWith(item.href) && (item.href !== '/dashboard' || pathname === '/dashboard')} tooltip={{ children: item.label }} >
                            <item.icon /><span>{item.label}</span>
                        </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                    ))}
                </SidebarMenu>
                {userData.roleLevel >= MANAGER_LEVEL && (
                    <SidebarMenu className="mt-4">
                      <SidebarMenuItem><h3 className="px-2 text-sm font-semibold text-muted-foreground">{t('navOperations')}</h3></SidebarMenuItem>
                      {operationsNavItems.map((item) => (<SidebarMenuItem key={item.href}><Link href={item.href}><SidebarMenuButton isActive={pathname.startsWith(item.href)} tooltip={{ children: item.label }}><item.icon /><span>{item.label}</span></SidebarMenuButton></Link></SidebarMenuItem>))}
                    </SidebarMenu>
                )}
                {userData.roleLevel >= ADMIN_LEVEL && (
                    <SidebarMenu className="mt-4">
                      <SidebarMenuItem><h3 className="px-2 text-sm font-semibold text-muted-foreground">{t('navAdmin')}</h3></SidebarMenuItem>
                      {adminNavItems.map((item) => (<SidebarMenuItem key={item.href}><Link href={item.href}><SidebarMenuButton isActive={pathname.startsWith(item.href)} tooltip={{ children: item.label }}><item.icon /><span>{item.label}</span></SidebarMenuButton></Link></SidebarMenuItem>))}
                      <SidebarGroup>
                        <SidebarGroupLabel>{t('managementLabel')}</SidebarGroupLabel>
                        <SidebarGroupContent>
                          {managementNavItems.map((item) => (<SidebarMenuItem key={item.href}><Link href={item.href}><SidebarMenuButton isActive={pathname.startsWith(item.href)} tooltip={{ children: item.label }}><item.icon /><span>{item.label}</span></SidebarMenuButton></Link></SidebarMenuItem>))}
                        </SidebarGroupContent>
                      </SidebarGroup>
                    </SidebarMenu>
                )}
                <div className="mt-auto p-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="w-full justify-start gap-2 px-2">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"><User className="w-4 h-4 text-muted-foreground" /></div>
                          {userData && (<div className="text-left"><p className="text-sm font-medium">{userData.name}</p></div>)}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56 mb-2" side="top" align="start">
                        <DropdownMenuLabel className="flex justify-between items-center">{t('myAccountTitle')}<Badge variant="outline">{language.toUpperCase()}</Badge></DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout}><LogOut className="mr-2 h-4 w-4" /><span>{t('logoutLabel')}</span></DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                </SidebarContent>
            </Sidebar>
            <SidebarInset><MobileHeader />{children}</SidebarInset>
            </SidebarProvider>
        </ExchangeProvider>
      </WishlistProvider>
    );
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { userAuth, userData, loading, error } = useAuth();
  const pathname = usePathname(); // ADD this line if not already present

  React.useEffect(() => {
    // If auth is no longer loading AND there's no authenticated Firebase user,
    // AND we are not already on the login page, then redirect to login.
    if (!loading && !userAuth && pathname !== '/') {
      console.log('[AppShell] Not authenticated and not on login page, redirecting to login.');
      router.push('/');
    }
    // If authenticated but userData is missing/failed to load, redirect to  
    // the user record not found page
    else if (!loading && userAuth && !userData && error && pathname !== '/') {
      console.log('[AppShell] Authenticated but user data missing/error, redirecting to Login page.');
      router.push('/'); // Redirect to login page
    }
  }, [loading, userAuth, userData, error, router, pathname]);


  // ==========================================================
  // Primary Rendering Logic - strictly conditional JSX returns
  // This logic is for what JSX the AppShell ITSELF should render.
  // Redirects are handled by the useEffect above as a side effect.
  // ==========================================================

  // 1. Show Loading Skeleton if overall authentication and data fetching is still in progress
  if (loading) {
    return <AppShellSkeleton />;
  }

  // 2. If authentication is complete but no Firebase user, and not currently redirecting,
  //    return null to let the useEffect above handle the navigation.
  if (!userAuth) {
    // The useEffect above has already pushed to '/', so nothing to render here.
    return null;
  }

  // 3. If Firebase user exists, but no Firestore userData (e.g., deleted profile, seeding needed)
  //    AND there was an error fetching user data, display the "User Record Not Found" view.
  if (!userData && userAuth && error) {
     return (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4 h-screen bg-background">
            <Frown className="w-16 h-16 text-destructive mb-4" />
            <h1 className="text-2xl font-bold font-headline mb-2">User Record Not Found</h1>
            <p className="text-muted-foreground max-w-md">
              Your authentication is valid, but we couldn't find a corresponding user document in the database. 
              This can happen if the database hasn't been seeded with the default users.
            </p>
            <div className="flex gap-4 mt-6">
                <Button asChild variant="outline"><Link href="/">Return to Login</Link></Button>
            </div>
        </div>
    );
  }

  // 4. If everything is loaded and user data is present, render the main AppLayout
  if (userData) {
    return <AppLayout userData={userData}>{children}</AppLayout>;
  }

  // 5. Fallback - This should ideally not be reached if the logic above is sound.
  //    If it is reached, it implies an unhandled state, so show loading.
  return <AppShellSkeleton />;
}