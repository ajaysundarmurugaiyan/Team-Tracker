'use client';
import { useState, useEffect } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useLogs } from '@/hooks/useLogs';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, Users, UserCheck, ShieldAlert, 
  ChevronRight, ArrowLeft, Zap, List, Activity,
  ChevronDown, User, Calendar, Clock, BarChart, Globe
} from 'lucide-react';
import Loader from '@/components/Loader';
import { formatDate } from '@/lib/dates';

export default function ManagerDashboard() {
  const { profile, loading: profileLoading, fetchManagerStats, signOut } = useProfile();
  const { fetchLogsForUser } = useLogs();
  const router = useRouter();
  
  const [data, setData] = useState<{ leads: any[], members: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userLogs, setUserLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    if (!profileLoading && profile?.role !== 'manager') {
      router.push('/manager-login');
    } else if (profile?.role === 'manager') {
      loadStats();
    }
  }, [profile, profileLoading]);

  const loadStats = async () => {
    setLoading(true);
    const stats = await fetchManagerStats();
    setData(stats);
    setLoading(false);
  };

  const handleUserSelect = async (user: any) => {
    setSelectedUser(user);
    setLogsLoading(true);
    const logs = await fetchLogsForUser(user.id);
    setUserLogs(logs);
    setLogsLoading(false);
  };

  if (profileLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader label="Executive Suite" sublabel="Synchronizing Network Intelligence" />
      </div>
    );
  }

  const membersUnderLead = (leadId: string) => {
    return data?.members.filter(m => m.lead_id === leadId) || [];
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 flex flex-col md:flex-row font-outfit">
      {/* Executive Sidebar: Recycler View for Leads */}
      <div className="w-full md:w-80 bg-slate-900/50 border-r border-slate-800/50 backdrop-blur-xl flex flex-col h-screen overflow-hidden z-20">
        <div className="p-8 border-b border-slate-800/50 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black text-white uppercase tracking-[0.3em]">Oversight</h1>
              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Global Executive</p>
            </div>
          </div>
          <button 
            onClick={signOut}
            className="w-full py-4 px-4 bg-white/5 border border-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-red-500/10 hover:border-red-500/20 transition-all flex items-center justify-between"
          >
            <span>Terminate Session</span>
            <Zap className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
          <h2 className="px-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Tier-1 Operational Leads</h2>
          <div className="space-y-1">
            {data?.leads.map(lead => (
              <button
                key={lead.id}
                onClick={() => {
                  setSelectedLead(lead);
                  setSelectedUser(null);
                  setUserLogs([]);
                }}
                className={`w-full p-5 rounded-2xl transition-all text-left flex items-center justify-between group relative overflow-hidden ${
                  selectedLead?.id === lead.id 
                  ? 'bg-white text-slate-950 shadow-2xl' 
                  : 'hover:bg-white/5 text-slate-400'
                }`}
              >
                <div className="relative z-10">
                  <p className="text-[11px] font-black uppercase tracking-tight">{lead.full_name}</p>
                  <p className={`text-[8px] font-bold uppercase tracking-widest mt-0.5 ${selectedLead?.id === lead.id ? 'text-slate-500' : 'text-slate-600'}`}>
                    {membersUnderLead(lead.id).length} Active Assets
                  </p>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 relative z-10 ${selectedLead?.id === lead.id ? 'opacity-100' : 'opacity-0'}`} />
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 bg-white/5 border-t border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Network Secure</span>
          </div>
        </div>
      </div>

      {/* Primary Intelligence Field */}
      <div className="flex-1 h-screen overflow-y-auto bg-slate-950 p-6 md:p-16 scrollbar-thin scrollbar-thumb-slate-900">
        <AnimatePresence mode="wait">
          {selectedLead ? (
            <motion.div
              key={selectedLead.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-5xl mx-auto space-y-16"
            >
              {/* Executive Unit Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 border-b border-slate-800/50 pb-12">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="px-3 py-1 bg-white/10 text-white text-[8px] font-black uppercase tracking-[0.3em] rounded-full border border-white/10">Unit Alpha</span>
                    <h2 className="text-5xl font-black text-white tracking-tighter uppercase">{selectedLead.full_name}</h2>
                  </div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em]">Performing Tier-2 unit deep-dive and audit analysis</p>
                </div>
                
                <button 
                  onClick={() => handleUserSelect(selectedLead)}
                  className={`px-8 py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.2em] transition-all flex items-center gap-4 shadow-2xl border ${
                    selectedUser?.id === selectedLead.id 
                    ? 'bg-white text-slate-950 border-white' 
                    : 'bg-transparent text-white border-white/10 hover:bg-white hover:text-slate-950'
                  }`}
                >
                  <BarChart className="w-4 h-4" />
                  Audit Lead Metrics
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                {/* Unit Asset Roster (Recycler View) */}
                <div className="lg:col-span-4 space-y-8">
                  <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Unit Assets</h3>
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-900">
                    {membersUnderLead(selectedLead.id).map(member => (
                      <button
                        key={member.id}
                        onClick={() => handleUserSelect(member)}
                        className={`w-full p-5 rounded-2xl transition-all text-left flex items-center gap-5 group relative ${
                          selectedUser?.id === member.id 
                          ? 'bg-white text-slate-950 shadow-2xl scale-[1.02]' 
                          : 'bg-white/5 border border-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[10px] ${
                          selectedUser?.id === member.id ? 'bg-slate-950 text-white' : 'bg-slate-900 text-slate-500'
                        }`}>
                          {member.full_name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-black uppercase truncate">{member.full_name}</p>
                          <p className={`text-[8px] font-bold uppercase tracking-tighter ${selectedUser?.id === member.id ? 'text-slate-500' : 'text-slate-600'}`}>
                            Asset ID: {member.employee_id}
                          </p>
                        </div>
                      </button>
                    ))}
                    {membersUnderLead(selectedLead.id).length === 0 && (
                      <div className="py-20 text-center border border-dashed border-slate-800 rounded-[3rem] opacity-20">
                        <User className="w-8 h-8 mx-auto mb-4" />
                        <p className="text-[9px] font-black uppercase tracking-widest">No Registered Assets</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Secure Audit Feed (Recycler View) */}
                <div className="lg:col-span-8 space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">
                      {selectedUser ? `${selectedUser.full_name} Data Feed` : 'Awaiting Selection'}
                    </h3>
                    {selectedUser && (
                      <span className="px-3 py-1 bg-white/5 text-white text-[8px] font-black uppercase tracking-[0.2em] rounded-md border border-white/5">
                        {userLogs.length} Records Decrypted
                      </span>
                    )}
                  </div>

                  <div className="space-y-6 max-h-[700px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-slate-900">
                    {logsLoading ? (
                      <div className="py-32 flex flex-col items-center justify-center gap-6">
                        <div className="w-12 h-12 border-2 border-white/10 border-t-white animate-spin rounded-full" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Querying Global Matrix...</p>
                      </div>
                    ) : selectedUser ? (
                      userLogs.map(log => (
                        <motion.div 
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          key={log.id} 
                          className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 backdrop-blur-md space-y-8 hover:bg-white/10 transition-colors group"
                        >
                          <div className="flex items-center justify-between border-b border-white/5 pb-6">
                            <div className="flex items-center gap-4">
                              <Calendar className="w-4 h-4 text-slate-500" />
                              <span className="text-[11px] font-black text-white uppercase tracking-widest">{formatDate(log.date)}</span>
                            </div>
                            <div className="flex items-center gap-4 text-slate-500">
                              <Clock className="w-4 h-4" />
                              <span className="text-[9px] font-black uppercase tracking-widest">{new Date(log.createdAt).toLocaleTimeString()}</span>
                            </div>
                          </div>
                          
                          <div className="space-y-6">
                            <p className="text-sm font-bold text-slate-300 leading-loose italic border-l-2 border-white/10 pl-6 group-hover:border-white/30 transition-colors">
                              &quot;{log.content}&quot;
                            </p>
                            
                            <div className="flex flex-wrap gap-2 pt-2">
                              {log.skills.map((skill: string) => (
                                <span key={skill} className="px-3 py-1.5 bg-slate-950 border border-white/5 text-white text-[9px] font-black uppercase tracking-wider rounded-lg">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="py-48 text-center space-y-8 bg-white/5 rounded-[4rem] border border-white/5 border-dashed">
                        <Activity className="w-16 h-16 text-slate-800 mx-auto" />
                        <p className="text-[11px] font-black text-slate-600 uppercase tracking-[0.4em]">Select an Asset to Decrypt History</p>
                      </div>
                    )}
                    
                    {selectedUser && userLogs.length === 0 && !logsLoading && (
                      <div className="py-32 text-center space-y-4 opacity-20">
                        <ShieldAlert className="w-12 h-12 mx-auto" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Zero Records Found in Global Registry</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-10 opacity-20">
              <div className="w-40 h-40 bg-white/5 rounded-[4rem] border border-white/5 flex items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-indigo-500/10 animate-pulse" />
                <Briefcase className="w-16 h-16 text-white relative z-10" />
              </div>
              <div className="space-y-4">
                <h2 className="text-3xl font-black text-white uppercase tracking-[0.5em]">Executive System Ready</h2>
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] max-w-sm leading-loose">
                  Select an operational lead to begin high-fidelity unit intelligence analysis
                </p>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
