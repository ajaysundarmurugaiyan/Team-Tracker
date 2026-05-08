'use client';
import { useEffect } from 'react';
import LoggerWizard from '@/components/LoggerWizard';
import { useLogs } from '@/hooks/useLogs';
import { useProfile } from '@/hooks/useProfile';
import { extractSkills, extractLearnings } from '@/lib/parser';
import { formatDate } from '@/lib/dates';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LogPage() {
  const { addLog } = useLogs();
  const { user, profile, loading, updateSkills } = useProfile();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (profile?.role === 'manager') {
        router.push('/manager');
      }
    }
  }, [user, loading, profile, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center font-outfit">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-[3px] border-white/5 border-t-white rounded-full animate-spin shadow-[0_0_20px_rgba(255,255,255,0.1)]" />
          <div className="space-y-2 text-center">
            <span className="block text-xs font-black text-white uppercase tracking-[0.4em]">Validating Channel</span>
            <span className="block text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] opacity-50">Establishing Secure Uplink v4.0</span>
          </div>
        </div>
      </div>
    );
  }

  const handleComplete = async (data: { answers: string[], skills?: string[], learnings?: string[] }) => {
    const combined = data.answers.join(' ');
    
    const extractedSkills = extractSkills(combined);
    const rawSkills = [...(data.skills || []), ...extractedSkills];
    const uniqueSkills = Array.from(new Set(rawSkills.map(s => s.trim().toLowerCase())));
    
    const allSkills = uniqueSkills.map(u => {
      const original = rawSkills.find(r => r.toLowerCase() === u);
      return original || u;
    });
    
    const extractedLearnings = extractLearnings(combined);
    const allLearnings = Array.from(new Set([...(data.learnings || []), ...extractedLearnings]));
    
    const log = {
      content: combined,
      date: formatDate(new Date()),
      skills: allSkills,
      learnings: allLearnings
    };

    await addLog(log);
    await updateSkills(allSkills);
  };

  return (
    <div className="min-h-screen p-6 md:p-12 lg:p-20 bg-[#020617] font-outfit overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-indigo-600/5 pointer-events-none" />
      <div className="max-w-4xl mx-auto relative z-10">
        <button
          onClick={() => router.push('/')}
          className="mb-12 w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-white/10 hover:scale-105 transition-all border border-white/10 group shadow-2xl"
        >
          <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <LoggerWizard onComplete={handleComplete} />
        </motion.div>
      </div>
    </div>
  );
}
