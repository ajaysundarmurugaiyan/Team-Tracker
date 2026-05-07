'use client';
import HomePage from '@/components/HomePage';
import { useProfile } from '@/hooks/useProfile';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, ShieldCheck } from 'lucide-react';
import Loader from '@/components/Loader';

export default function Page() {
  const { user, loading } = useProfile();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      console.log('Team Tracker: No session detected. Redirecting to authorization portal.');
      router.replace('/login');
    }
  }, [user, loading, router]);

  // If loading, show the premium sync screen
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <Loader label="Team Tracker" sublabel="Establishing Secure Channel" />
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
