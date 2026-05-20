'use client';

import { useEffect, useState } from 'react';
import { Project, ProjectMember } from '@/types/project';
import { WorkLog } from '@/types/log';
import { useProfile } from '@/hooks/useProfile';
import { useRouter } from 'next/navigation';
import Loader from '@/components/Loader';
import { FolderGit2, Users, Calendar, ArrowLeft, CheckCircle2, ClipboardList } from 'lucide-react';
import Link from 'next/link';
import ProjectTimeline from '@/components/ProjectTimeline';
import { useProjects } from '@/contexts/ProjectContext';
import CalendarGrid from '@/components/CalendarGrid';

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const { fetchProjectById, fetchProjectMembers, fetchProjectLogs, loading: contextLoading } = useProjects();
  const { profile } = useProfile();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [logs, setLogs] = useState<(WorkLog & { userName?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const p = await fetchProjectById(params.id);
        if (p) {
          setProject(p);
          const [m, l] = await Promise.all([
            fetchProjectMembers(params.id),
            fetchProjectLogs(params.id)
          ]);
          setMembers(m);
          setLogs(l);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (!contextLoading) {
      loadData();
    }
  }, [params.id, fetchProjectById, fetchProjectMembers, fetchProjectLogs, contextLoading]);

  if (loading || contextLoading) {
    return <Loader />;
  }

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

  const progress = project ? calculateProgress(project.startDate, project.endDate) : { percent: 0, label: '' };

  const logsByMember = logs.reduce((acc, log) => {
    const name = log.userName || 'Unknown Member';
    if (!acc[name]) acc[name] = [];
    acc[name].push(log);
    return acc;
  }, {} as Record<string, typeof logs>);

  if (!project) {
    return (
      <div className="max-w-7xl mx-auto py-20 text-center">
        <h2 className="text-2xl font-black font-outfit text-slate-800 dark:text-slate-200">Project Not Found</h2>
        <p className="text-slate-500 mt-2">The project you are looking for does not exist or you do not have access.</p>
        <Link href="/projects" className="mt-6 inline-flex items-center text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push(profile?.role === 'manager' ? '/manager' : '/')}
          className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Dashboard
        </button>
        <span className="text-slate-300">/</span>
        <Link href="/projects" className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
          Projects Hub
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4 md:gap-6">
            <div className="p-3 md:p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl text-indigo-600 dark:text-indigo-400 shrink-0">
              <FolderGit2 className="w-8 h-8 md:w-10 md:h-10" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl md:text-3xl font-black font-outfit text-slate-900 dark:text-white">
                  {project.name}
                </h1>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                  project.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                  project.status === 'completed' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                  'bg-slate-500/10 text-slate-600 border-slate-500/20'
                }`}>
                  {project.status}
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 max-w-3xl">
                {project.description || 'No description provided.'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 mb-8">
          <div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Lead</div>
            <div className="font-semibold text-slate-700 dark:text-slate-300">{project.leadName}</div>
          </div>
          <div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Start Date</div>
            <div className="font-semibold text-slate-700 dark:text-slate-300">{new Date(project.startDate).toLocaleDateString()}</div>
          </div>
          <div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">End Date</div>
            <div className="font-semibold text-slate-700 dark:text-slate-300">{project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Ongoing'}</div>
          </div>
          <div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Team Size</div>
            <div className="font-semibold text-slate-700 dark:text-slate-300">{members.length} Members</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest text-slate-500">
            <span>Project Stage Completion</span>
            <span className="text-indigo-600 dark:text-indigo-400">{progress.label}</span>
          </div>
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 rounded-full transition-all duration-1000 relative" 
              style={{ width: `${progress.percent}%` }} 
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Jira-like Member Task Board */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm">
            <h2 className="text-xl font-black font-outfit text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-indigo-500" />
              Member Tasks (Active Board)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.keys(logsByMember).length === 0 ? (
                <div className="col-span-full py-8 text-center text-slate-500 text-sm">
                  No tasks recorded in this project yet.
                </div>
              ) : (
                Object.entries(logsByMember).map(([memberName, memberLogs]) => (
                  <div key={memberName} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <h3 className="font-black text-sm uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-3 flex items-center justify-between">
                      <span>{memberName}</span>
                      <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-300">
                        {memberLogs.length} tasks
                      </span>
                    </h3>
                    <div className="space-y-3 max-h-60 overflow-y-auto scrollbar-thin pr-2">
                      {memberLogs.map(log => (
                        <div key={log.id} className="bg-white dark:bg-slate-900 p-3 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/60">
                          <p className="text-xs text-slate-700 dark:text-slate-300 mb-2 line-clamp-3 leading-relaxed">
                            {log.content}
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span className="font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Logged</span>
                            <span>{new Date(log.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm">
            <h2 className="text-xl font-black font-outfit text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-indigo-500" />
              Project Calendar
            </h2>
            <div className="h-[500px]">
              <CalendarGrid logs={logs} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm">
            <h2 className="text-xl font-black font-outfit text-slate-900 dark:text-white mb-6">Activity Timeline</h2>
            <ProjectTimeline logs={logs} />
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black font-outfit text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-6 h-6 text-indigo-500" />
                Team Roster
              </h2>
            </div>
            
            <div className="space-y-4">
              {members.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No members assigned yet.</p>
              ) : (
                members.map(member => (
                  <div key={member.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                    <div>
                      <div className="font-semibold text-sm text-slate-800 dark:text-slate-200">{member.memberName}</div>
                      <div className="text-xs text-slate-500 capitalize">{member.role}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
