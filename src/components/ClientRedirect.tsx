'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ClientRedirectProps {
  url: string;
}

export function ClientRedirect({ url }: ClientRedirectProps) {
  const router = useRouter();

  useEffect(() => {
    console.log('ClientRedirect - Redirecting to:', url);
    router.push(url);
  }, [url, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to chat...</p>
      </div>
    </div>
  );
}