'use client';

import { Project } from '@/types/project';
import { motion } from 'framer-motion';
import { FolderGit2, Users, Calendar, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'completed':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'archived':
        return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
      default:
        return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const calculateProgress = (start: string, end: string | null | undefined) => {
    if (!end) return { percent: 50, label: 'Ongoing' };
    const startDate = new Date(start).getTime();
    const endDate = new Date(end).getTime();
    const now = Date.now();
    
    if (now < startDate) return { percent: 0, label: 'Not Started' };
    if (now > endDate) return { percent: 100, label: 'Completed' };
    
    const total = endDate - startDate;
    const elapsed = now - startDate;
    const percent = Math.round((elapsed / total) * 100);
    return { percent, label: `${percent}%` };
  };

  const progress = calculateProgress(project.startDate, project.endDate);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 transition-all shadow-sm hover:shadow-md"
    >
      <Link href={`/projects/${project.id}`} className="absolute inset-0 z-10" />
      
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
            <FolderGit2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-black text-lg text-slate-900 dark:text-white font-outfit">
              {project.name}
            </h3>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border mt-1 ${getStatusColor(project.status)}`}>
              {project.status}
            </span>
          </div>
        </div>
        <div className="text-slate-400 group-hover:text-indigo-500 transition-colors">
          <ChevronRight className="w-5 h-5" />
        </div>
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 line-clamp-2">
        {project.description || 'No description provided.'}
      </p>

      {/* Progress Bar */}
      <div className="mb-6 space-y-1.5">
        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
          <span>Progress</span>
          <span>{progress.label}</span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-500 rounded-full transition-all duration-1000" 
            style={{ width: `${progress.percent}%` }} 
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
          <Users className="w-4 h-4 text-slate-400" />
          <span>{project.memberCount || 0} Members</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>{new Date(project.startDate).toLocaleDateString()}</span>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="text-xs text-slate-500">
          Lead: <span className="font-medium text-slate-700 dark:text-slate-300">{project.leadName}</span>
        </div>
      </div>
    </motion.div>
  );
}
