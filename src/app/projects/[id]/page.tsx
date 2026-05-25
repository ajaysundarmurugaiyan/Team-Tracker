'use client';

import { useEffect, useState, useMemo, use } from 'react';
import { Project, ProjectMember } from '@/types/project';
import { ProjectLog } from '@/contexts/ProjectContext';
import { useProfile } from '@/hooks/useProfile';
import { useRouter } from 'next/navigation';
import {
  FolderGit2, Users, Calendar, ArrowLeft, CheckCircle2,
  ClipboardList, BarChart3, Sparkles, Trophy, Code, Brain,
  Clock, TrendingUp, User, ShieldCheck, FileText, ChevronRight,
  AlertCircle, Zap, Lock
} from 'lucide-react';
import Link from 'next/link';
import ProjectTimeline from '@/components/ProjectTimeline';
import { useProjects } from '@/contexts/ProjectContext';
import { useCopilot } from '@/contexts/CopilotContext';
import { motion, AnimatePresence } from 'framer-motion';

type TabKey = 'activity' | 'members' | 'skills' | 'retrospective';

const STATUS_CONFIG = {
  active: { bar: 'from-emerald-400 to-teal-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Active' },
  completed: { bar: 'from-slate-700 to-slate-900', badge: 'bg-slate-100 text-slate-800 border-slate-300', label: 'Completed' },
  archived: { bar: 'from-slate-300 to-slate-400', badge: 'bg-slate-50 text-slate-600 border-slate-200', label: 'Archived' },
};

function calculateProgress(start: string, end: string | null | undefined, status: string) {
  if (status === 'completed') return { percent: 100, label: '100%' };
  if (!end) return { percent: 55, label: 'Ongoing' };
  const s = new Date(start).getTime(), e = new Date(end).getTime(), n = Date.now();
  if (n < s) return { percent: 0, label: 'Not Started' };
  if (n > e) return { percent: 100, label: '100%' };
  const pct = Math.round(((n - s) / (e - s)) * 100);
  return { percent: pct, label: `${pct}%` };
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = [
  'from-blue-400 to-indigo-500', 'from-violet-400 to-purple-500',
  'from-emerald-400 to-teal-500', 'from-amber-400 to-orange-500',
  'from-rose-400 to-pink-500', 'from-cyan-400 to-sky-500',
];
function getColor(name: string) {
  let h = 0; for (const c of name) h = c.charCodeAt(0) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2">
      <div className="flex items-center gap-2 text-slate-400">{icon}<span className="text-[9px] font-black uppercase tracking-widest">{label}</span></div>
      <div className="text-2xl font-black text-slate-900 font-outfit">{value}</div>
      {sub && <div className="text-[10px] text-slate-400 font-medium">{sub}</div>}
    </div>
  );
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { fetchProjectById, fetchProjectMembers, fetchProjectLogs, updateProject, addMemberToProject, removeMemberFromProject, loading: ctxLoading } = useProjects();
  const { profile } = useProfile();
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [logs, setLogs] = useState<ProjectLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('activity');
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [newMemberId, setNewMemberId] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Member');
  const [isAddingMember, setIsAddingMember] = useState(false);
  
  const { actionPayload, setActionPayload } = useCopilot();

  // Listen for AI voice commands to switch tabs
  useEffect(() => {
    if (actionPayload?.intent === 'switch_tab' && actionPayload.tabName) {
      if (['activity', 'members', 'skills', 'retrospective'].includes(actionPayload.tabName)) {
        setActiveTab(actionPayload.tabName as TabKey);
        setActionPayload(null);
      }
    }
  }, [actionPayload, setActionPayload]);

  const isLead = profile?.role === 'lead' || profile?.role === 'manager';
  const isProjectLead = project ? profile?.id === project.leadId : false;
  const isManager = profile?.role === 'manager';
  
  const canManageProject = isProjectLead || isManager;
  const canManageMembers = isLead || isManager;

  useEffect(() => {
    if (ctxLoading) return;
    (async () => {
      setLoading(true);
      try {
        const p = await fetchProjectById(id);
        if (p) {
          setProject(p);
          const [m, l] = await Promise.all([
            fetchProjectMembers(id),
            fetchProjectLogs(id),
          ]);
          setMembers(m);
          setLogs(l);
          // Auto-switch to retrospective for completed projects
          if (p.status === 'completed') setActiveTab('retrospective');
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [id, ctxLoading]);

  // Computed stats
  const progress = useMemo(() => project ? calculateProgress(project.startDate, project.endDate, project.status) : { percent: 0, label: '' }, [project]);

  const memberContributions = useMemo(() => {
    const map: Record<string, { name: string; userId: string; logs: ProjectLog[]; skills: Set<string>; orgLeadName?: string | null }> = {};
    logs.forEach(log => {
      const key = log.userId || log.userName || 'unknown';
      if (!map[key]) map[key] = { name: log.userName || 'Team Member', userId: key, logs: [], skills: new Set(), orgLeadName: log.orgLeadName };
      map[key].logs.push(log);
      (log.skills || []).forEach(s => map[key].skills.add(s));
    });
    return Object.values(map).sort((a, b) => b.logs.length - a.logs.length);
  }, [logs]);

  const allSkills = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach(log => (log.skills || []).forEach(s => { counts[s] = (counts[s] || 0) + 1; }));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [logs]);

  const totalDays = useMemo(() => {
    if (!project) return 0;
    const start = new Date(project.startDate).getTime();
    const end = project.endDate ? new Date(project.endDate).getTime() : Date.now();
    return Math.max(1, Math.ceil((end - start) / 86400000));
  }, [project]);

  const handleMarkComplete = async () => {
    if (!project || !canManageProject) return;
    setIsMarkingComplete(true);
    const today = new Date().toISOString().split('T')[0];
    const success = await updateProject(project.id, { status: 'completed', endDate: today });
    if (success !== false) { // updateProject might return void if typing was weird, but now it returns boolean
      setProject(prev => prev ? { ...prev, status: 'completed', endDate: today } : null);
      setActiveTab('retrospective');
    }
    setIsMarkingComplete(false);
  };

  const handleAddMember = async () => {
    if (!project || !newMemberId || !canManageMembers) return;
    setIsAddingMember(true);
    try {
      await addMemberToProject(project.id, newMemberId, newMemberRole || 'Member');
      const m = await fetchProjectMembers(project.id);
      setMembers(m);
      setNewMemberId('');
      setNewMemberRole('Member');
    } catch (e) {
      console.error(e);
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!project || !canManageMembers) return;
    if (confirm('Are you sure you want to remove this member from the project?')) {
      await removeMemberFromProject(project.id, memberId);
      const m = await fetchProjectMembers(project.id);
      setMembers(m);
    }
  };

  const cfg = project ? (STATUS_CONFIG[project.status] || STATUS_CONFIG.archived) : STATUS_CONFIG.archived;

  if (loading || ctxLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-[3px] border-slate-200 border-t-slate-900 rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Project</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-rose-400" />
          </div>
          <h2 className="text-xl font-black text-slate-800 font-outfit">Project Not Found</h2>
          <p className="text-slate-500 text-sm">This project doesn't exist or you don't have access.</p>
          <Link href="/projects" className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white font-black text-xs uppercase tracking-wider rounded-xl hover:bg-black transition-colors border border-slate-900">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  const TABS: { key: TabKey; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'activity', label: 'Activity Feed', icon: <Zap className="w-3.5 h-3.5" />, count: logs.length },
    { key: 'members', label: 'Team & Leads', icon: <Users className="w-3.5 h-3.5" />, count: members.length },
    { key: 'skills', label: 'Skill Matrix', icon: <Code className="w-3.5 h-3.5" />, count: allSkills.length },
    { key: 'retrospective', label: 'Timeline', icon: <Clock className="w-3.5 h-3.5" />, count: logs.length },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Project Hero Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className={`h-1.5 w-full bg-gradient-to-r ${cfg.bar}`} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <button onClick={() => router.push(profile?.role === 'manager' ? '/manager' : '/')} className="hover:text-slate-700 transition-colors font-semibold">Dashboard</button>
            <ChevronRight className="w-3 h-3" />
            <Link href="/projects" className="hover:text-slate-700 transition-colors font-semibold">Projects</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-600 font-black truncate max-w-[200px]">{project.name}</span>
          </div>

          {/* Project title row */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${cfg.bar} flex items-center justify-center shadow-lg flex-shrink-0`}>
                <FolderGit2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-black text-slate-900 font-outfit">{project.name}</h1>
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${cfg.badge}`}>
                    {cfg.label}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-1 max-w-2xl">{project.description || 'No description provided.'}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs text-slate-500">Project Lead: <strong className="text-slate-700">{project.leadName}</strong></span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 shrink-0 w-full md:w-auto mt-4 md:mt-0">
              {canManageProject && project.status === 'active' && (
                <button
                  onClick={handleMarkComplete}
                  disabled={isMarkingComplete}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-black text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-slate-900/10 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="truncate">{isMarkingComplete ? 'Updating...' : 'Mark Complete'}</span>
                </button>
              )}
              <button onClick={() => router.push('/projects')} className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-500 shrink-0">
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Start Date', value: new Date(project.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), icon: <Calendar className="w-4 h-4 text-slate-400" /> },
              { label: 'End Date', value: project.endDate ? new Date(project.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Ongoing', icon: <Clock className="w-4 h-4 text-slate-400" /> },
              { label: 'Team Size', value: `${members.length} Members`, icon: <Users className="w-4 h-4 text-emerald-400" /> },
              { label: 'Total Logs', value: `${logs.length} Entries`, icon: <FileText className="w-4 h-4 text-blue-400" /> },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-2.5 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                {s.icon}
                <div>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.label}</div>
                  <div className="text-sm font-black text-slate-800 mt-0.5">{s.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
              <span>Project Completion</span>
              <span className="text-slate-900">{progress.label}</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress.percent}%` }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                className={`h-full bg-gradient-to-r ${cfg.bar} rounded-full relative`}
              >
                <div className="absolute inset-0 bg-white/20 rounded-full" />
              </motion.div>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 p-1 bg-slate-50 border border-slate-200 rounded-xl w-full sm:w-fit overflow-x-auto no-scrollbar snap-x">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap snap-start shrink-0 ${
                  activeTab === tab.key
                    ? 'bg-white shadow-sm text-slate-900 border border-slate-200'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                {tab.icon}{tab.label}
                {tab.count !== undefined && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black ${activeTab === tab.key ? 'bg-slate-200 text-slate-800' : 'bg-slate-100 text-slate-500'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">

          {/* ─── ACTIVITY FEED ─── */}
          {activeTab === 'activity' && (
            <motion.div key="activity" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-500" /> Live Activity Feed
                </h2>
                {logs.length === 0 ? (
                  <div className="py-16 bg-white rounded-2xl border border-slate-200 text-center">
                    <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-500">No logs tagged to this project yet</p>
                    <p className="text-xs text-slate-400 mt-1">Members can tag their logs to this project when capturing work</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {logs.slice(0, 10).map((log, i) => (
                      <motion.div key={log.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${getColor(log.userName || 'T')} flex items-center justify-center flex-shrink-0`}>
                            <span className="text-[9px] font-black text-white">{getInitials(log.userName || 'TM')}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <span className="text-xs font-black text-slate-900">{log.userName || 'Team Member'}</span>
                                {log.orgLeadName && (
                                  <span className="ml-2 text-[8px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                    Org: {log.orgLeadName}
                                  </span>
                                )}
                              </div>
                              <span className="text-[9px] text-slate-400 font-semibold whitespace-nowrap">
                                {new Date(log.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed line-clamp-2">{log.content}</p>
                            {log.skills && log.skills.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {log.skills.slice(0, 4).map((s, j) => (
                                  <span key={j} className="px-1.5 py-0.5 bg-slate-100 text-slate-700 text-[8px] font-black rounded-full border border-slate-200">{s}</span>
                                ))}
                                {log.skills.length > 4 && <span className="text-[8px] text-slate-400 font-bold">+{log.skills.length - 4}</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    {logs.length > 10 && (
                      <p className="text-center text-xs text-slate-400 font-semibold">
                        Showing 10 of {logs.length} logs. View full timeline in the Timeline tab.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Contribution sidebar */}
              <div className="space-y-4">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-500" /> Contributions
                </h2>
                {memberContributions.length === 0 ? (
                  <div className="py-8 bg-white rounded-2xl border border-slate-200 text-center">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-semibold">No contributions yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {memberContributions.map((mc, i) => {
                      const maxLogs = memberContributions[0].logs.length;
                      const pct = Math.round((mc.logs.length / maxLogs) * 100);
                      return (
                        <div key={mc.userId} className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm space-y-2">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${getColor(mc.name)} flex items-center justify-center flex-shrink-0`}>
                              <span className="text-[8px] font-black text-white">{getInitials(mc.name)}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-black text-slate-800 truncate">{mc.name}</p>
                              {mc.orgLeadName && (
                                <p className="text-[8px] text-amber-600 font-bold">↳ {mc.orgLeadName}</p>
                              )}
                            </div>
                            <span className="text-[9px] font-black text-slate-500 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-full">{mc.logs.length} logs</span>
                          </div>
                          <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ delay: i * 0.1 + 0.3, duration: 0.8, ease: 'easeOut' }}
                              className={`h-full bg-gradient-to-r ${getColor(mc.name)} rounded-full`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ─── TEAM & LEADS ─── */}
          {activeTab === 'members' && (
            <motion.div key="members" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-500" /> Team Roster & Authority Map
                </h2>
                {isLead && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Dual-lead indicators shown</span>
                  </div>
                )}
              </div>

              {canManageMembers && project?.status === 'active' && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 w-full space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Employee ID</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 1045"
                      value={newMemberId}
                      onChange={e => setNewMemberId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-all"
                    />
                  </div>
                  <div className="flex-1 w-full space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Role</label>
                    <div className="relative">
                      <select 
                        value={newMemberRole}
                        onChange={e => setNewMemberRole(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-all appearance-none cursor-pointer text-slate-800"
                      >
                        <option value="Member">Member</option>
                        <option value="Lead">Lead</option>
                      </select>
                      <ChevronRight className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none rotate-90" />
                    </div>
                  </div>
                  <button
                    onClick={handleAddMember}
                    disabled={!newMemberId || isAddingMember}
                    className="w-full md:w-auto px-6 py-2.5 bg-slate-900 text-white rounded-lg font-black text-[10px] uppercase tracking-wider hover:bg-black disabled:opacity-50 transition-colors h-[42px] flex items-center justify-center shadow-md shadow-slate-900/10"
                  >
                    {isAddingMember ? 'Adding...' : 'Assign Asset'}
                  </button>
                </div>
              )}

              {/* Legend */}
              <div className="flex flex-wrap gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-slate-900 rounded-full" />Project Lead (created project)</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-amber-500 rounded-full" />Org Lead (member's reporting lead)</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-slate-300 rounded-full" />Member (contributor)</div>
              </div>

              {members.length === 0 ? (
                <div className="py-16 bg-white rounded-2xl border border-slate-200 text-center">
                  <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-500">No members assigned yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {members.map((member, i) => {
                    const contribution = memberContributions.find(mc => mc.userId === member.memberId);
                    const isOrgDifferent = member.orgLeadId && member.orgLeadId !== project.leadId;

                    return (
                      <motion.div
                        key={member.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getColor(member.memberName || 'M')} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                            <span className="text-xs font-black text-white">{getInitials(member.memberName || 'TM')}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-black text-slate-900">{member.memberName}</h3>
                              <span className="text-[8px] font-bold text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded-full uppercase">{member.role}</span>
                            </div>
                            {member.employeeId && (
                              <p className="text-[9px] text-slate-400 font-mono mt-0.5">ID: {member.employeeId}</p>
                            )}

                            {/* Lead indicators */}
                            <div className="mt-2 space-y-1">
                              <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 bg-slate-900 rounded-full flex-shrink-0" />
                                <span className="text-[9px] font-bold text-slate-500">Project Lead: <span className="text-slate-700">{project.leadName}</span></span>
                              </div>
                              {member.orgLeadName && (
                                <div className="flex items-center gap-1.5">
                                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isOrgDifferent ? 'bg-amber-500' : 'bg-slate-300'}`} />
                                  <span className={`text-[9px] font-bold ${isOrgDifferent ? 'text-amber-700' : 'text-slate-500'}`}>
                                    Org Lead: <span className={isOrgDifferent ? 'text-amber-800' : 'text-slate-700'}>{member.orgLeadName}</span>
                                    {isOrgDifferent && <span className="ml-1 text-amber-500 text-[8px]">(Different lead)</span>}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-black text-slate-900">{contribution?.logs.length ?? 0}</div>
                            <div className="text-[8px] font-bold text-slate-400 uppercase mb-2">Logs</div>
                            {canManageMembers && (
                              <button
                                onClick={() => handleRemoveMember(member.memberId)}
                                className="text-[9px] font-black text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded-md transition-colors uppercase tracking-widest"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ─── SKILL MATRIX ─── */}
          {activeTab === 'skills' && (
            <motion.div key="skills" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="space-y-4">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Code className="w-4 h-4 text-emerald-500" /> Skill Matrix — All Member Contributions
              </h2>
              {allSkills.length === 0 ? (
                <div className="py-16 bg-white rounded-2xl border border-slate-200 text-center">
                  <Code className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-500">No skills detected yet</p>
                  <p className="text-xs text-slate-400 mt-1">Skills are extracted from member logs</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Skill frequency chart */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                    <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest">Skill Frequency</h3>
                    <div className="space-y-2.5">
                      {allSkills.slice(0, 10).map(([skill, count], i) => {
                        const maxCount = allSkills[0][1];
                        const pct = Math.round((count / maxCount) * 100);
                        return (
                          <div key={skill} className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-slate-700">{skill}</span>
                              <span className="text-[9px] font-black text-slate-500">{count}×</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ delay: i * 0.06 + 0.2, duration: 0.7, ease: 'easeOut' }}
                                className="h-full bg-gradient-to-r from-slate-600 to-slate-800 rounded-full"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Skill cloud */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest mb-4">Skill Cloud</h3>
                    <div className="flex flex-wrap gap-2">
                      {allSkills.map(([skill, count], i) => {
                        const maxCount = allSkills[0][1];
                        const size = Math.max(10, Math.round((count / maxCount) * 16));
                        return (
                          <motion.span
                            key={skill}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.04 }}
                            style={{ fontSize: `${size}px` }}
                            className="px-2.5 py-1 bg-slate-100 text-slate-700 font-black rounded-full border border-slate-200 hover:bg-slate-200 transition-colors cursor-default"
                          >
                            {skill}
                          </motion.span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Per-member skill breakdown */}
                  <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                    <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest">Per-Member Skill Breakdown</h3>
                    <div className="divide-y divide-slate-100">
                      {memberContributions.map(mc => (
                        <div key={mc.userId} className="py-3 flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getColor(mc.name)} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                            <span className="text-[8px] font-black text-white">{getInitials(mc.name)}</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-black text-slate-800 mb-1.5">{mc.name}</p>
                            <div className="flex flex-wrap gap-1">
                              {[...mc.skills].map(s => (
                                <span key={s} className="px-2 py-0.5 bg-slate-50 text-slate-700 text-[9px] font-bold rounded-full border border-slate-200">{s}</span>
                              ))}
                              {mc.skills.size === 0 && <span className="text-[10px] text-slate-400 italic">No skills extracted</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ─── TIMELINE / RETROSPECTIVE ─── */}
          {activeTab === 'retrospective' && (
            <motion.div key="retro" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="space-y-6">

              {/* Retrospective banner for completed projects */}
              {project.status === 'completed' && (
                <div className="relative overflow-hidden bg-slate-900 rounded-2xl p-6 text-white shadow-xl shadow-slate-900/20">
                  <div className="absolute inset-0 bg-white/5 mix-blend-overlay" />
                  <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full" />
                  <div className="absolute -right-4 -bottom-8 w-24 h-24 bg-white/10 rounded-full" />
                  <div className="relative flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black uppercase tracking-tight">Project Retrospective</h2>
                      <p className="text-white/70 text-xs font-semibold mt-0.5">
                        {project.name} · Completed · {totalDays} days · {logs.length} logs · {members.length} contributors
                      </p>
                    </div>
                  </div>
                  {/* Retro stats */}
                  <div className="grid grid-cols-3 gap-3 mt-5">
                    {[
                      { label: 'Contributors', value: members.length },
                      { label: 'Total Logs', value: logs.length },
                      { label: 'Unique Skills', value: allSkills.length },
                    ].map(s => (
                      <div key={s.label} className="bg-white/10 rounded-xl p-3 text-center">
                        <div className="text-2xl font-black">{s.value}</div>
                        <div className="text-[9px] font-bold text-white/70 uppercase tracking-wider mt-0.5">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-blue-500" /> Full Activity Timeline
                </h2>
                <ProjectTimeline logs={logs} showOrgLead={isLead} />
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
