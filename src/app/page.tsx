'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (status === 'authenticated') {
      const sheetId = searchParams.get('sheetId');
      if (sheetId) {
        router.push('/buscar');
      } else {
        router.push('/buscar');
      }
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600 mb-4" />
        <p className="text-gray-600">Carregando...</p>
      </div>
    </div>
  );
}
