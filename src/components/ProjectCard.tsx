'use client';

import { Project } from '@/types/project';
import { motion } from 'framer-motion';
import { FolderGit2, Users, Calendar, ChevronRight, FileText, Clock } from 'lucide-react';
import Link from 'next/link';

interface ProjectCardProps {
  project: Project;
  index?: number;
}

const STATUS_CONFIG = {
  active: {
    bar: 'from-emerald-400 to-teal-500',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    label: 'Active',
    glow: 'shadow-emerald-100',
  },
  completed: {
    bar: 'from-slate-700 to-slate-900',
    badge: 'bg-slate-100 text-slate-800 border-slate-300',
    dot: 'bg-slate-700',
    label: 'Completed',
    glow: 'shadow-slate-200',
  },
  archived: {
    bar: 'from-slate-300 to-slate-400',
    badge: 'bg-slate-50 text-slate-600 border-slate-200',
    dot: 'bg-slate-400',
    label: 'Archived',
    glow: 'shadow-slate-100',
  },
};

function calculateProgress(start: string, end: string | null | undefined, status: string) {
  if (status === 'completed') return { percent: 100, label: '100%' };
  if (!end) return { percent: 55, label: 'Ongoing' };
  const startDate = new Date(start).getTime();
  const endDate = new Date(end).getTime();
  const now = Date.now();
  if (now < startDate) return { percent: 0, label: 'Not Started' };
  if (now > endDate) return { percent: 100, label: '100%' };
  const percent = Math.round(((now - startDate) / (endDate - startDate)) * 100);
  return { percent, label: `${percent}%` };
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function ProjectCard({ project, index = 0 }: ProjectCardProps) {
  const cfg = STATUS_CONFIG[project.status] || STATUS_CONFIG.archived;
  const progress = calculateProgress(project.startDate, project.endDate, project.status);
  const daysLeft = project.endDate
    ? Math.max(0, Math.ceil((new Date(project.endDate).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`group relative bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-lg ${cfg.glow} transition-all duration-300 overflow-hidden`}
    >
      {/* Status accent bar */}
      <div className={`h-1 w-full bg-gradient-to-r ${cfg.bar}`} />

      <Link href={`/projects/${project.id}`} className="absolute inset-0 z-10" />

      <div className="p-5 space-y-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br ${cfg.bar} shadow-sm flex-shrink-0`}>
              <FolderGit2 className="w-4.5 h-4.5 text-white w-[18px] h-[18px]" />
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-sm text-slate-900 truncate leading-tight font-outfit">
                {project.name}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${project.status === 'active' ? 'animate-pulse' : ''}`} />
                <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border ${cfg.badge}`}>
                  {cfg.label}
                </span>
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
        </div>

        {/* Description */}
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
          {project.description || 'No description provided.'}
        </p>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Progress</span>
            <span className="text-[9px] font-black text-slate-600">{progress.label}</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress.percent}%` }}
              transition={{ duration: 1, delay: index * 0.06 + 0.3, ease: 'easeOut' }}
              className={`h-full bg-gradient-to-r ${cfg.bar} rounded-full`}
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-slate-500">
              <Users className="w-3 h-3" />
              <span className="text-[10px] font-semibold">{project.memberCount ?? 0}</span>
            </div>
            <div className="flex items-center gap-1 text-slate-500">
              <FileText className="w-3 h-3" />
              <span className="text-[10px] font-semibold">{project.logCount ?? 0} logs</span>
            </div>
            {daysLeft !== null && project.status === 'active' && (
              <div className="flex items-center gap-1 text-slate-500">
                <Clock className="w-3 h-3" />
                <span className="text-[10px] font-semibold">
                  {daysLeft === 0 ? 'Due today' : `${daysLeft}d left`}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-[7px] font-black text-slate-600">
              {getInitials(project.leadName || 'L')}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
