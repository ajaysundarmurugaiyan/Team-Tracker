'use client';

import { ProjectLog } from '@/contexts/ProjectContext';
import { motion } from 'framer-motion';
import { Clock, User, Brain, Code, ShieldCheck } from 'lucide-react';

interface ProjectTimelineProps {
  logs: ProjectLog[];
  showOrgLead?: boolean;
}

function groupByDate(logs: ProjectLog[]) {
  const groups: Record<string, ProjectLog[]> = {};
  logs.forEach(log => {
    const d = log.date || new Date(log.createdAt).toISOString().split('T')[0];
    if (!groups[d]) groups[d] = [];
    groups[d].push(log);
  });
  return Object.entries(groups).sort(([a], [b]) => (a < b ? 1 : -1));
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = [
  'from-blue-400 to-indigo-500',
  'from-violet-400 to-purple-500',
  'from-emerald-400 to-teal-500',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-pink-500',
  'from-cyan-400 to-sky-500',
];

function getColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function ProjectTimeline({ logs, showOrgLead = false }: ProjectTimelineProps) {
  if (!logs || logs.length === 0) {
    return (
      <div className="py-16 flex flex-col items-center justify-center bg-slate-50 rounded-2xl border border-slate-100">
        <div className="w-14 h-14 bg-white rounded-2xl border border-slate-200 flex items-center justify-center mb-3 shadow-sm">
          <Clock className="w-7 h-7 text-slate-300" />
        </div>
        <p className="text-sm font-semibold text-slate-500">No activity logged yet</p>
        <p className="text-xs text-slate-400 mt-1">Logs tagged to this project will appear here</p>
      </div>
    );
  }

  const grouped = groupByDate(logs);
  let globalIndex = 0;

  return (
    <div className="space-y-8">
      {grouped.map(([dateStr, dateLogs]) => (
        <div key={dateStr} className="space-y-3">
          {/* Date separator */}
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-slate-900 rounded-full">
              <span className="text-[9px] font-black text-white uppercase tracking-widest">
                {formatDate(dateStr)}
              </span>
            </div>
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              {dateLogs.length} {dateLogs.length === 1 ? 'entry' : 'entries'}
            </span>
          </div>

          {/* Logs for this date */}
          <div className="space-y-3 ml-2">
            {dateLogs.map((log) => {
              const idx = globalIndex++;
              const memberName = log.userName || 'Team Member';
              const avatarColor = getColor(memberName);
              const isDifferentLead = showOrgLead && log.orgLeadName;

              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.3 }}
                  className="flex gap-3"
                >
                  {/* Avatar */}
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${avatarColor} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                      <span className="text-[9px] font-black text-white">{getInitials(memberName)}</span>
                    </div>
                    <div className="w-px flex-1 bg-slate-100 mt-2 min-h-[16px]" />
                  </div>

                  {/* Log card */}
                  <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow mb-1">
                    {/* Card header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <span className="text-xs font-black text-slate-900">{memberName}</span>
                        {isDifferentLead && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <ShieldCheck className="w-2.5 h-2.5 text-amber-500" />
                            <span className="text-[8px] font-bold text-amber-600 uppercase tracking-wider">
                              Reports to: {log.orgLeadName}
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="text-[8px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Content */}
                    <p className="text-xs text-slate-700 leading-relaxed mb-3">{log.content}</p>

                    {/* Skills */}
                    {log.skills && log.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        <Code className="w-3 h-3 text-indigo-400 mt-0.5 flex-shrink-0" />
                        {log.skills.map((skill, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[9px] font-black uppercase tracking-wider rounded-full border border-indigo-100"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Learnings */}
                    {log.learnings && log.learnings.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 space-y-1">
                        <div className="flex items-center gap-1 mb-1">
                          <Brain className="w-3 h-3 text-emerald-500" />
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Learnings</span>
                        </div>
                        {log.learnings.map((l, i) => (
                          <p key={i} className="text-[10px] text-slate-600 italic leading-relaxed pl-4 border-l-2 border-emerald-200">
                            "{l}"
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
