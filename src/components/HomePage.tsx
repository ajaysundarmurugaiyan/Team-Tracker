'use client';
import { useEffect } from 'react';
import CalendarGrid from '@/components/CalendarGrid';
import ProfileCard from '@/components/ProfileCard';
import { useProfile } from '@/hooks/useProfile';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Zap, LogOut, Users } from 'lucide-react';

export default function HomePage() {
  const { user, profile, loading, signOut } = useProfile();
  const router = useRouter();

  // Safety timeout to prevent infinite loading if something hangs
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        // Fallback to clear loading state if it takes too long
        // This allows the redirect logic to kick in if the user is truly null
      }, 10000); 
      return () => clearTimeout(timer);
    }
  }, [loading]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Synchronizing Identity...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Redirecting to Portal...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 lg:p-12 bg-[#f8fafc]">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8 pb-8 border-b border-slate-200/60">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center shadow-2xl shadow-slate-900/20">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-4xl font-black font-outfit tracking-tight text-slate-900">
                LUMINA<span className="text-slate-400">SYNC</span>
              </h1>
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.3em] max-w-md">
              High-Precision Performance Auditing & Skill Mapping
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {profile?.role === 'lead' && (
              <button
                onClick={() => router.push('/lead')}
                className="px-6 py-4 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 transition-all font-black uppercase tracking-widest text-[10px] flex items-center gap-2 shadow-sm"
              >
                <Users className="w-4 h-4" />
                <span>Lead Ops</span>
              </button>
            )}
            
            <button
              onClick={() => router.push('/log')}
              className="px-8 py-4 bg-slate-900 text-white rounded-xl shadow-xl shadow-slate-900/10 hover:bg-black transition-all font-black uppercase tracking-[0.2em] text-[10px] flex items-center gap-3 border border-white/10"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Initialize Capture</span>
            </button>

            <button
              onClick={signOut}
              className="p-4 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-red-500 transition-all shadow-sm group"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          <div className="lg:col-span-8 h-full">
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="h-full"
            >
              <CalendarGrid />
            </motion.div>
          </div>
          
          <div className="lg:col-span-4 sticky top-12">
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="h-full"
            >
              <ProfileCard />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
