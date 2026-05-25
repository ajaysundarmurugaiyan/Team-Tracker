'use client';
import { useState, useEffect, Suspense } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useLogs } from '@/hooks/useLogs';
import { useProjects } from '@/contexts/ProjectContext';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, Users, ShieldCheck,
  ChevronRight, ArrowLeft, Zap, List,
  Globe, FileText, FolderGit2, ExternalLink, Code
} from 'lucide-react';
import Loader from '@/components/Loader';
import { useSearchParams } from 'next/navigation';
import CalendarGrid from '@/components/CalendarGrid';
import ProfileCard from '@/components/ProfileCard';
import Link from 'next/link';

type UserTab = 'general' | 'projects';

function ManagerDashboard() {
  const { profile, loading: profileLoading, fetchManagerStats, signOut } = useProfile();
  const { fetchLogsForUser } = useLogs();
  const { fetchMemberProjectLogs } = useProjects();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [data, setData] = useState<{ leads: any[], members: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  
  const initialLeadId = searchParams.get('leadId');
  const initialMemberId = searchParams.get('memberId');
  
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userLogs, setUserLogs] = useState<any[]>([]);
  const [userProjectLogs, setUserProjectLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [userTab, setUserTab] = useState<UserTab>('general');

  useEffect(() => {
    if (!profileLoading && profile?.role !== 'manager') {
      router.replace('/manager-login');
    } else if (profile?.role === 'manager') {
      loadStats();
    }
  }, [profile, profileLoading]);

  const loadStats = async () => {
    setLoading(true);
    const stats = await fetchManagerStats();
    setData(stats);
    if (stats) {
      if (initialLeadId) {
        const lead = stats.leads.find((l: any) => l.id === initialLeadId);
        if (lead) setSelectedLead(lead);
      }
      if (initialMemberId) {
        const member = stats.members.find((m: any) => m.id === initialMemberId) || 
                       stats.leads.find((l: any) => l.id === initialMemberId);
        if (member) handleUserSelect(member, false);
      }
    }
    setLoading(false);
  };

  const handleUserSelect = async (user: any, updateUrl = true) => {
    setSelectedUser(user);
    setLogsLoading(true);
    setUserTab('general');
    if (updateUrl) {
      const params = new URLSearchParams(window.location.search);
      params.set('memberId', user.id);
      if (selectedLead) params.set('leadId', selectedLead.id);
      router.replace(`${window.location.pathname}?${params.toString()}`);
    }
    const [logs, projLogs] = await Promise.all([
      fetchLogsForUser(user.id),
      fetchMemberProjectLogs(user.id)
    ]);
    setUserLogs(logs);
    setUserProjectLogs(projLogs);
    setLogsLoading(false);
  };

  const selectLead = (lead: any) => {
    setSelectedLead(lead);
    setSelectedUser(null);
    setUserLogs([]);
    setUserProjectLogs([]);
    const params = new URLSearchParams();
    params.set('leadId', lead.id);
    router.replace(`${window.location.pathname}?${params.toString()}`);
    if (window.innerWidth < 768) setShowSidebar(false);
  };

  // Group project logs by project
  const projectLogGroups = (() => {
    const groups: Record<string, typeof userProjectLogs> = {};
    userProjectLogs.forEach(log => {
      const key = log.projectName || 'Unknown Project';
      if (!groups[key]) groups[key] = [];
      groups[key].push(log);
    });
    return Object.entries(groups);
  })();

  if (profileLoading || loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <Loader label="Executive Suite" sublabel="Synchronizing Network Intelligence" />
      </div>
    );
  }

  const membersUnderLead = (leadId: string) => data?.members.filter(m => m.lead_id === leadId) || [];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col md:flex-row font-outfit overflow-x-hidden">
      {/* Sidebar */}
      <div className={`w-full md:w-80 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 z-30 transition-all duration-500 ${!showSidebar && '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 border-b border-slate-100 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-xl">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black text-slate-900 tracking-tight uppercase">Oversight</h1>
              <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Executive Portal</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/projects')}
            className="w-full py-2.5 px-4 bg-slate-900 border border-slate-900 rounded-xl text-[8px] font-black uppercase tracking-widest text-white hover:bg-black transition-all flex items-center justify-between group"
          >
            <span>Projects Hub</span>
            <Globe className="w-3 h-3 group-hover:scale-110 transition-transform" />
          </button>
          <button
            onClick={signOut}
            className="w-full py-2.5 px-4 bg-slate-50 border border-slate-100 rounded-xl text-[8px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 hover:bg-red-50/50 transition-all flex items-center justify-between group"
          >
            <span>Terminate Session</span>
            <Zap className="w-3 h-3 group-hover:scale-110 transition-transform" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
          <h2 className="px-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Operational Leads</h2>
          <div className="space-y-1">
            {data?.leads.map(lead => (
              <button key={lead.id} onClick={() => selectLead(lead)}
                className={`w-full p-3 rounded-xl transition-all text-left flex items-center justify-between group ${selectedLead?.id === lead.id ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'hover:bg-slate-50 text-slate-600'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[9px] ${selectedLead?.id === lead.id ? 'bg-white/20 text-white' : 'bg-slate-100'}`}>
                    {lead.full_name?.[0] || '?'}
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-tight">{lead.full_name}</h3>
                    <p className={`text-[7px] font-bold uppercase tracking-widest mt-0.5 text-slate-400`}>
                      {membersUnderLead(lead.id).length} Assets
                    </p>
                  </div>
                </div>
                <ChevronRight className={`w-3 h-3 transition-transform ${selectedLead?.id === lead.id ? 'translate-x-1 opacity-100' : 'opacity-20 group-hover:opacity-100'}`} />
              </button>
            ))}
          </div>

          {selectedLead && (
            <>
              <div className="h-px bg-slate-100 mx-4" />
              <h2 className="px-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Unit Assets</h2>
              <div className="space-y-1">
                <button onClick={() => handleUserSelect(selectedLead)}
                  className={`w-full p-4 rounded-xl transition-all text-left flex items-center gap-4 ${selectedUser?.id === selectedLead.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'hover:bg-slate-50 text-slate-600'}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] ${selectedUser?.id === selectedLead.id ? 'bg-white/20' : 'bg-slate-100'}`}>L</div>
                  <span className="text-[11px] font-black uppercase tracking-tight truncate">{selectedLead.full_name} (Lead)</span>
                </button>
                {membersUnderLead(selectedLead.id).map(member => (
                  <button key={member.id} onClick={() => handleUserSelect(member)}
                    className={`w-full p-4 rounded-xl transition-all text-left flex items-center gap-4 ${selectedUser?.id === member.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'hover:bg-slate-50 text-slate-600'}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] ${selectedUser?.id === member.id ? 'bg-white/20' : 'bg-slate-100'}`}>
                      {member.full_name?.[0] || '?'}
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-tight truncate">{member.full_name}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 bg-[#f8fafc] p-4 md:p-8 lg:p-12">
        <AnimatePresence mode="wait">
          {selectedUser ? (
            <motion.div key={selectedUser.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto">
              <div className="mb-6 flex items-center justify-between">
                <button onClick={() => setShowSidebar(true)} className="md:hidden p-3 bg-white border border-slate-200 rounded-xl text-slate-600 shadow-sm">
                  <List className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Intelligence: {selectedUser.full_name}</span>
                </div>
              </div>

              {/* Dual tab switcher */}
              <div className="flex gap-1 p-1 bg-white border border-slate-200 rounded-xl mb-6 w-fit shadow-sm">
                <button
                  onClick={() => setUserTab('general')}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${userTab === 'general' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-700'}`}
                >
                  <FileText className="w-3 h-3" />
                  General Logs
                  <span className={`px-1.5 py-0.5 rounded-full text-[7px] font-black ${userTab === 'general' ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>
                    {userLogs.length}
                  </span>
                </button>
                <button
                  onClick={() => setUserTab('projects')}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${userTab === 'projects' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-700'}`}
                >
                  <FolderGit2 className="w-3 h-3" />
                  All Project Logs
                  <span className={`px-1.5 py-0.5 rounded-full text-[7px] font-black ${userTab === 'projects' ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>
                    {userProjectLogs.length}
                  </span>
                </button>
              </div>

              {logsLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  {userTab === 'general' && (
                    <motion.div key="general" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                      className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                      <div className="lg:col-span-8 h-full">
                        <CalendarGrid logs={userLogs} />
                      </div>
                      <div className="lg:col-span-4 sticky top-0">
                        <ProfileCard profile={{
                          id: selectedUser.id,
                          name: selectedUser.full_name,
                          role: selectedUser.role,
                          employeeId: selectedUser.employee_id,
                          skills: selectedUser.skills || []
                        }} logs={userLogs} />
                      </div>
                    </motion.div>
                  )}

                  {userTab === 'projects' && (
                    <motion.div key="projects" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                      className="space-y-4">
                      {projectLogGroups.length === 0 ? (
                        <div className="py-20 bg-white rounded-2xl border border-slate-200 text-center shadow-sm">
                          <FolderGit2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                          <h3 className="text-sm font-black text-slate-600">No project contributions</h3>
                          <p className="text-xs text-slate-400 mt-1">{selectedUser.full_name} hasn't tagged any logs to projects yet.</p>
                        </div>
                      ) : (
                        projectLogGroups.map(([projectName, pLogs], gi) => (
                          <motion.div key={projectName} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: gi * 0.06 }}
                            className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-100">
                              <div className="flex items-center gap-2">
                                <FolderGit2 className="w-4 h-4 text-indigo-500" />
                                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">{projectName}</span>
                                <span className="text-[8px] font-bold text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded-full">{pLogs.length} logs</span>
                              </div>
                              {pLogs[0]?.projectId && (
                                <Link href={`/projects/${pLogs[0].projectId}`}
                                  className="flex items-center gap-1 text-[9px] font-black text-indigo-600 hover:text-indigo-800 transition-colors">
                                  <ExternalLink className="w-3 h-3" />
                                  View Project
                                </Link>
                              )}
                            </div>
                            {pLogs[0]?.orgLeadName && (
                              <div className="px-5 py-2 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
                                <ShieldCheck className="w-3 h-3 text-amber-500 flex-shrink-0" />
                                <span className="text-[9px] font-bold text-amber-700">
                                  Project owned by: <strong>{pLogs[0].orgLeadName}</strong>
                                </span>
                              </div>
                            )}
                            <div className="divide-y divide-slate-100">
                              {pLogs.map((log: any) => (
                                <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="text-xs text-slate-700 leading-relaxed flex-1">{log.content}</p>
                                    <span className="text-[9px] text-slate-400 font-semibold whitespace-nowrap">
                                      {new Date(log.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </span>
                                  </div>
                                  {log.skills && log.skills.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {log.skills.map((s: string, i: number) => (
                                        <span key={i} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-[8px] font-black rounded-full border border-indigo-100">{s}</span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-12">
              <div className="w-32 h-32 bg-white rounded-[3rem] border border-slate-200 flex items-center justify-center shadow-xl shadow-slate-200/50 relative group">
                <div className="absolute inset-0 bg-blue-500/5 rounded-[3rem] animate-pulse" />
                <Briefcase className="w-12 h-12 text-slate-400 relative z-10" />
              </div>
              <div className="space-y-4">
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-[0.4em]">Executive Suite</h2>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] max-w-xs leading-loose">
                  Select an operational lead to begin unit analysis
                </p>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function ManagerPage() {
  return (
    <Suspense fallback={<Loader label="Executive Oversight" sublabel="Initializing Management Portal" />}>
      <ManagerDashboard />
    </Suspense>
  );
}
