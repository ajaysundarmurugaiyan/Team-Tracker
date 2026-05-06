'use client';
import HomePage from '@/components/HomePage';
import { useProfile } from '@/hooks/useProfile';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, ShieldCheck } from 'lucide-react';

export default function Page() {
  const { user, loading } = useProfile();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      console.log('Lumina Sync: No session detected. Redirecting to authorization portal.');
      router.replace('/login');
    }
  }, [user, loading, router]);

  // If loading, show the premium sync screen
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-8 text-center">
          <div className="relative">
            <div className="w-20 h-20 border-2 border-slate-100 rounded-3xl" />
            <div className="absolute inset-0 border-2 border-slate-900 rounded-3xl border-t-transparent animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap className="w-8 h-8 text-slate-900 animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Lumina Sync</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Establishing Secure Channel</p>
          </div>
        </div>
      </div>
    );
  }

  // Strictly check user before rendering dashboard
  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-6 text-center">
          <ShieldCheck className="w-12 h-12 text-slate-200" />
          <div className="space-y-1">
            <h2 className="text-sm font-black text-slate-900 tracking-tight uppercase">Authorization Required</h2>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Redirecting to Secure Portal v1.5.2...</p>
          </div>
        </div>
      </div>
    );
  }

  return <HomePage />;
}
