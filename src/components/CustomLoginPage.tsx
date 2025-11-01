
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Nfc, QrCode, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/hooks/use-translation';
import { AnimatePresence, motion } from 'framer-motion';
import { QrScanner } from '@/components/QrScanner';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/components/AuthProvider';
import { loginAndGetUser } from '@/actions/authActions';
import { DEFAULT_USER_ID } from '@/lib/constants';

export default function CustomLoginPage() {
  const router = useRouter();
  const { signIn, isLoggedIn, loading, error } = useAuth(); // Simplified useAuth
  const [activeScan, setActiveScan] = useState<'NFC' | 'QR' | null>(null);
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false);
  const [debugUserId, setDebugUserId] = useState('');
  const [nfcSupported, setNfcSupported] = useState(false);
  const { t } = useTranslation();
  const { toast } = useToast();

  console.log("[LoginPage] CustomLoginPage called.");

  useEffect(() => {
    if (typeof window !== 'undefined' && 'NDEFReader' in window) {
      setNfcSupported(true);
    }
  }, []);

  useEffect(() => {
    // Redirect if the user is already logged in.
    console.log("[LoginPage] Checking if user is already logged in...");
    if (isLoggedIn) {
      router.push('/dashboard');
    }
  }, [isLoggedIn, router]);

  useEffect(() => {
    // Handle login errors
    if (error) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error,
      });
    }
  }, [error, toast]);

  const handleLoginAttempt = useCallback(async (uid: string) => {
    console.log("[LoginPage] handleLoginAttempt called...");
    if (loading) return;

    toast({
      title: t('loggingInToast'),
      description: t('loggingInToastDesc'),
    });

    const result = await loginAndGetUser(uid);

    if (result.status === 'success') {
      // Pass both token and user data to the new signIn function
      await signIn(result.customToken, result.userData);
      // The useEffect for isLoggedIn will handle the redirect
    } else {
      // The error useEffect will display the toast
      console.error(result.message);
    }
  }, [signIn, loading, toast, t]);

  const handleLogin = (type: 'NFC' | 'QR' | 'default') => {
    if (loading) return;

    if (type === 'NFC' || type === 'default') {
      if (type === 'NFC') {
        setActiveScan('NFC');
        toast({
            title: "NFC Scan",
            description: `Simulating NFC scan. Logging in as default user.`
        });
      }
      handleLoginAttempt(DEFAULT_USER_ID);
    } else if (type === 'QR') {
      setActiveScan('QR');
    }
  };
  
  const handleQrScanSuccess = useCallback((data: string | null) => {
    setActiveScan(null);
    if (data && data.trim() !== '') {
      handleLoginAttempt(data);
    } else {
      toast({
        variant: "destructive",
        title: t('invalidQrToast'),
        description: t('invalidQrToastDesc'),
      });
    }
  }, [handleLoginAttempt, toast, t]);

  const handleManualLogin = () => {
    if (debugUserId && !loading) {
      setIsDebugModalOpen(false);
      handleLoginAttempt(debugUserId);
    }
  }

  function GiftIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 12v10H4V12" />
        <path d="M2 7h20v5H2z" />
        <path d="m12 22 4-10-8 0 4 10" />
        <path d="M12 2v5" />
      </svg>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-background to-secondary">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeScan ? 'scanning' : 'login'}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="w-full max-w-md shadow-2xl backdrop-blur-sm bg-card/80">
            <CardHeader className="text-center">
              <div className="mx-auto bg-primary/20 text-primary p-3 rounded-full w-fit mb-4">
                 <GiftIcon className="w-8 h-8" />
              </div>
              <CardTitle className="text-3xl font-headline">{t('loginTitle')}</CardTitle>
              <CardDescription>{t('loginSubTitle')}</CardDescription>
            </CardHeader>
            <CardContent>
              {activeScan === 'QR' ? (
                <div className="flex flex-col items-center">
                  <QrScanner onScanSuccess={handleQrScanSuccess} />
                   <div className="flex gap-2 mt-4">
                    <Button variant="outline" onClick={() => setActiveScan(null)} disabled={loading}>
                        {t('cancelButton')}
                    </Button>
                  </div>
                </div>
              ) : activeScan === 'NFC' ? (
                 <div className="flex flex-col items-center justify-center text-center p-8 space-y-4">
                    <Nfc className="w-16 h-16 text-primary animate-pulse" />
                    <p className="font-semibold text-lg">{t('scanningNfcTitle')}</p>
                    <p className="text-muted-foreground text-sm">{t('scanningNfcDesc')}</p>
                </div>
              ) : (
                <div className="w-full space-y-2">
                    <Button
                      onClick={() => handleLogin('NFC')}
                      size="lg"
                      className="w-full font-bold text-lg py-7"
                      disabled={!nfcSupported || loading}
                    >
                      <Nfc className="mr-2 h-5 w-5" />
                      {loading ? t('loggingInToast') : t('loginButton')}
                    </Button>
                     <Button
                      onClick={() => handleLogin('QR')}
                      size="lg"
                      variant="outline"
                      className="w-full font-bold text-lg py-7"
                      disabled={loading}
                    >
                      <QrCode className="mr-2 h-5 w-5" />
                      {loading ? t('loggingInToast') : t('loginQrButton')}
                    </Button>
                    <div className="relative py-2">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">
                          For Demo
                        </span>
                      </div>
                    </div>
                     <Button
                      onClick={() => handleLogin('default')}
                      size="lg"
                      variant="secondary"
                      className="w-full font-bold text-lg py-7"
                      disabled={loading}
                    >
                      {loading ? t('loggingInToast') : t('loginDefaultUserButton')}
                    </Button>
                     <Button
                        onClick={() => setIsDebugModalOpen(true)}
                        size="sm"
                        variant="link"
                        className="w-full"
                        disabled={loading}
                        >
                        {t('loginManualButton')}
                    </Button>

                  {!nfcSupported && (
                    <p className="text-sm text-destructive text-center pt-2">{t('nfcNotSupported')}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
      <Dialog open={isDebugModalOpen} onOpenChange={setIsDebugModalOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{t('manualLoginTitle')}</DialogTitle>
                <DialogDescription>
                    {t('manualLoginDesc')}
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="userId" className="text-right">
                        {t('userIdLabel')}
                    </Label>
                    <Input
                        id="userId"
                        value={debugUserId}
                        onChange={(e) => setDebugUserId(e.target.value)}
                        className="col-span-3"
                    />
                </div>
            </div>
            <DialogFooter>
                <Button onClick={handleManualLogin} disabled={!debugUserId || loading}>
                    <LogIn className="mr-2 h-4 w-4" />
                    {loading ? t('loggingInToast') : t('loginButton')}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}