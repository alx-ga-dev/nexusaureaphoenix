
import { Loader2 } from 'lucide-react';

export function LoadingSpinner() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-background to-secondary">
      <Loader2 className="h-16 w-16 animate-spin text-primary" />
    </div>
  );
}
