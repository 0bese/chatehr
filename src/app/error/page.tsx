'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function ErrorPage() {
  const searchParams = useSearchParams();
  const message = searchParams.get('message') || 'An unexpected error occurred';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-4 p-6 bg-card rounded-lg shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-6 h-6 text-destructive" />
          <h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
        </div>

        <p className="text-muted-foreground mb-6">
          {message}
        </p>

        <div className="flex gap-3">
          <Link href="/chat">
            <Button variant="default">
              Try Again
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline">
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}