'use client';
import { useEffect } from 'react';
import LoggerWizard from '@/components/LoggerWizard';
import { useLogs } from '@/hooks/useLogs';
import { useProfile } from '@/hooks/useProfile';
import { useProjects } from '@/contexts/ProjectContext';
import { extractSkills, extractLearnings } from '@/lib/parser';
import { formatDate } from '@/lib/dates';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LogPage() {
  const { addLog } = useLogs();
  const { user, profile, loading, updateSkills } = useProfile();
  const { tagLogToProject } = useProjects();
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
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center font-outfit">
        <div className="flex flex-col items-center gap-6">
          <div className="w-12 h-12 border-[3px] border-slate-200 border-t-slate-900 rounded-full animate-spin shadow-sm" />
          <div className="space-y-2 text-center">
            <span className="block text-xs font-black text-slate-900 uppercase tracking-[0.4em]">Validating Access</span>
            <span className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Establishing Secure Uplink</span>
          </div>
        </div>
      </div>
    );
  }

  const handleComplete = async (data: { answers: string[], skills?: string[], learnings?: string[], projectId?: string }) => {
    const combined = data.answers.join(' ');
    
    const allSkills = data.skills && data.skills.length > 0 
      ? data.skills 
      : extractSkills(combined);
      
    const allLearnings = data.learnings && data.learnings.length > 0
      ? data.learnings
      : extractLearnings(combined);
    
    const log = {
      content: combined,
      date: formatDate(new Date()),
      skills: allSkills,
      learnings: allLearnings
    };

    const newLogId = await addLog(log);
    if (newLogId && data.projectId) {
      await tagLogToProject(newLogId, data.projectId);
    }
    
    await updateSkills(allSkills);
  };

  return (
    <div className="min-h-screen py-4 px-4 sm:px-6 md:py-6 md:px-8 lg:py-8 lg:px-12 bg-[#f8fafc] font-outfit relative">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-indigo-500/5 pointer-events-none" />
      <div className="max-w-6xl mx-auto relative z-10">
        <button
          onClick={() => router.push('/')}
          className="mb-12 w-10 h-10 rounded-xl bg-white flex items-center justify-center hover:bg-slate-50 transition-all border border-slate-200 group shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-slate-900 transition-colors" />
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
