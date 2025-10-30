'use client';
import { useEffect, useRef, useState, forwardRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { QrCode } from 'lucide-react';
import jsQR from 'jsqr';
import { cn } from '@/lib/utils';

type QrScannerProps = {
    onScanSuccess: (data: string | null) => void;
};

type ScanStatus = 'idle' | 'scanning' | 'no_code' | 'found';

export const QrScanner = forwardRef<any, QrScannerProps>(({ onScanSuccess }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const { toast } = useToast();
  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');

  useEffect(() => {
    let stream: MediaStream | null = null;
    let animationFrameId: number;
    let isMounted = true;

    const setupCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (!isMounted) {
            mediaStream.getTracks().forEach(track => track.stop());
            return;
        }
        stream = mediaStream;
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          animationFrameId = requestAnimationFrame(scanLoop);
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this app.',
        });
      }
    };

    const scanLoop = () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
        setScanStatus('scanning');
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const context = canvas.getContext('2d');

        if (context) {
            canvas.height = video.videoHeight;
            canvas.width = video.videoWidth;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
            });

            if (code && code.data) {
                setScanStatus('found');
                onScanSuccess(code.data);
                // Stop the loop on success
                return;
            } else {
                 setScanStatus('no_code');
            }
        }
    }
      animationFrameId = requestAnimationFrame(scanLoop);
    };

    setupCamera();
    
    // Cleanup function
    return () => {
        isMounted = false;
        cancelAnimationFrame(animationFrameId);
        if(stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    }
  }, [onScanSuccess, toast]);
  
  const statusMessages: Record<ScanStatus, string> = {
    idle: 'Ready to scan.',
    scanning: 'Scanning for QR code...',
    no_code: 'No QR code found. Try moving your camera.',
    found: 'QR code found!',
  };

  return (
    <div className="flex flex-col items-center justify-center text-center space-y-2">
        <div className="relative w-64 h-64 overflow-hidden rounded-lg border bg-background">
            <video ref={videoRef} className="absolute top-0 left-0 w-full h-full object-cover" autoPlay playsInline muted />
            <canvas ref={canvasRef} className="hidden" />

            <div className="absolute inset-0 z-10 flex flex-col items-center justify-between p-4">
                 <div className="w-full text-left">
                    {hasCameraPermission === false && (
                        <Alert variant="destructive">
                        <QrCode className="h-4 w-4" />
                        <AlertTitle>Camera Access Required</AlertTitle>
                        <AlertDescription>
                            Please allow camera access to scan a QR code.
                        </AlertDescription>
                        </Alert>
                    )}
                </div>

                <div className={cn("w-full h-full border-4 border-primary/50 rounded-lg", scanStatus === 'scanning' && "qr-scanner-scanning-box")} />
                
                {scanStatus === 'scanning' && <div className="qr-scanner-line" />}
            </div>
        </div>
        <p className={cn(
            "text-sm h-4",
            scanStatus === 'found' ? 'text-green-500' : 'text-muted-foreground'
        )}>
            {statusMessages[scanStatus]}
        </p>
    </div>
  );
});

QrScanner.displayName = "QrScanner";