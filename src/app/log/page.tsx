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
  const { user, loading, updateSkills } = useProfile();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Validating Channel...</span>
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
    <div className="min-h-screen p-4 md:p-8 lg:p-12 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => router.push('/')}
          className="mb-8 flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-bold group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Dashboard</span>
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
