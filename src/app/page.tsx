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
        <Loader label="Redirecting" sublabel="Establishing Access Link v2.0" />
      </div>
    );
  }

  return <HomePage />;
}
