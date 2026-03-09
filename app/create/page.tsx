'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import CreatePost from '@/components/CreatePost';
import Navbar from '@/components/Navbar';

export default function CreatePageLayout() {
  const { session, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !session) {
      router.push('/login');
    }
  }, [session, authLoading, router]);

  if (authLoading || !session) {
    return <div className="flex items-center justify-center min-h-screen text-slate-600">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <CreatePost />
      </div>
    </div>
  );
}
