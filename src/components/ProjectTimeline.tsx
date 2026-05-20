'use client';

import { WorkLog } from '@/types/log';
import { motion } from 'framer-motion';
import { Clock, User, CheckCircle2 } from 'lucide-react';

interface ProjectTimelineProps {
  logs: (WorkLog & { userName?: string })[];
}

export default function ProjectTimeline({ logs }: ProjectTimelineProps) {
  if (!logs || logs.length === 0) {
    return (
      <div className="py-12 text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
        <Clock className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
        <p className="font-medium">No logs recorded for this project yet.</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-700 before:to-transparent">
      {logs.map((log, index) => {
        const date = new Date(log.date || log.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });

        return (
          <motion.div
            key={log.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-900 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-500 dark:text-indigo-400 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                  {date}
                </span>
                <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                  <User className="w-3.5 h-3.5 mr-1" />
                  {log.userName || 'Team Member'}
                </div>
              </div>
              
              <div className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap mb-4">
                {log.content}
              </div>

              {(log.skills && log.skills.length > 0) && (
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  {log.skills.map((skill, idx) => (
                    <span key={idx} className="px-2 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
