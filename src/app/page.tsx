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
    if (!loading) {
      if (!user) {
        console.log('Team Tracker: Authorization Required. Routing to secure portal.');
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  // If loading, show the high-fidelity sync screen
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <Loader label="Team Tracker" sublabel="Synchronizing Secure Identity" />
      </div>
    );
  }

  // If user is null after loading, show a quick transitional state before redirect completes
  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-8 text-center animate-pulse">
          <div className="w-16 h-16 bg-slate-900 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-slate-900/20">
            <Zap className="w-8 h-8 text-white fill-white" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Redirecting</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Establishing Access Link v1.5.2</p>
          </div>
        </div>
      </div>
    );
  }

  return <HomePage />;
}
