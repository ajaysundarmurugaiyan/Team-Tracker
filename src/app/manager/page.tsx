'use client';
import { useState, useEffect } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useLogs } from '@/hooks/useLogs';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, Users, UserCheck, ShieldAlert, 
  ChevronRight, ArrowLeft, Zap, List, Activity,
  ChevronDown, User, Calendar, Clock
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader label="Executive Suite" sublabel="Synchronizing Network Intelligence" />
      </div>
    );
  }

  const membersUnderLead = (leadId: string) => {
    return data?.members.filter(m => m.lead_id === leadId) || [];
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row">
      {/* Fixed Sidebar: Leads List */}
      <div className="w-full md:w-80 bg-white border-r border-slate-200 flex flex-col h-screen overflow-hidden">
        <div className="p-8 border-b border-slate-100 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black text-slate-900 uppercase">Oversight</h1>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Global Admin</p>
            </div>
          </div>
          <button 
            onClick={signOut}
            className="w-full py-3 px-4 bg-slate-50 border border-slate-100 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-all flex items-center justify-between"
          >
            <span>Exit Portal</span>
            <Zap className="w-3 h-3" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <h2 className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Operational Leads</h2>
          <div className="space-y-1">
            {data?.leads.map(lead => (
              <button
                key={lead.id}
                onClick={() => {
                  setSelectedLead(lead);
                  setSelectedUser(null);
                  setUserLogs([]);
                }}
                className={`w-full p-4 rounded-xl transition-all text-left flex items-center justify-between group ${
                  selectedLead?.id === lead.id ? 'bg-slate-900 text-white shadow-lg' : 'hover:bg-slate-50'
                }`}
              >
                <div className="space-y-0.5">
                  <p className="text-xs font-black">{lead.full_name}</p>
                  <p className={`text-[8px] font-bold uppercase tracking-widest ${selectedLead?.id === lead.id ? 'text-slate-400' : 'text-slate-500'}`}>
                    {membersUnderLead(lead.id).length} Active Members
                  </p>
                </div>
                <ChevronRight className={`w-3 h-3 ${selectedLead?.id === lead.id ? 'opacity-100' : 'opacity-20'}`} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content: Drill-down */}
      <div className="flex-1 h-screen overflow-y-auto bg-slate-50/50 p-6 md:p-12">
        <AnimatePresence mode="wait">
          {selectedLead ? (
            <motion.div
              key={selectedLead.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto space-y-12"
            >
              {/* Unit Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200 pb-8">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest rounded-full">Lead Unit</span>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">{selectedLead.full_name}</h2>
                  </div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Drill down to specific member audits or lead history</p>
                </div>
                
                <button 
                  onClick={() => handleUserSelect(selectedLead)}
                  className={`px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-3 shadow-sm ${
                    selectedUser?.id === selectedLead.id ? 'bg-slate-900 text-white' : 'bg-white text-slate-900 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" />
                  View Lead Logs
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Members List */}
                <div className="lg:col-span-4 space-y-6">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned Members</h3>
                  <div className="space-y-2">
                    {membersUnderLead(selectedLead.id).map(member => (
                      <button
                        key={member.id}
                        onClick={() => handleUserSelect(member)}
                        className={`w-full p-4 rounded-2xl transition-all text-left flex items-center gap-4 group ${
                          selectedUser?.id === member.id ? 'bg-white border-2 border-slate-900 shadow-xl' : 'bg-white border border-slate-200 hover:border-slate-400 shadow-sm'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] ${
                          selectedUser?.id === member.id ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400'
                        }`}>
                          {member.full_name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-black text-slate-900 uppercase truncate">{member.full_name}</p>
                          <p className="text-[8px] font-bold text-slate-400 tracking-tighter uppercase">ID: {member.employee_id}</p>
                        </div>
                        <ChevronRight className={`w-3 h-3 ${selectedUser?.id === member.id ? 'opacity-100' : 'opacity-0'} transition-opacity`} />
                      </button>
                    ))}
                    {membersUnderLead(selectedLead.id).length === 0 && (
                      <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-3xl opacity-30">
                        <User className="w-6 h-6 mx-auto mb-2" />
                        <p className="text-[8px] font-black uppercase tracking-widest">Empty Unit</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Audit Logs View */}
                <div className="lg:col-span-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {selectedUser ? `${selectedUser.full_name}'s History` : 'Audit Records'}
                    </h3>
                    {selectedUser && (
                      <span className="px-2 py-1 bg-slate-100 text-slate-400 text-[8px] font-black uppercase tracking-widest rounded-md">
                        {userLogs.length} Records Found
                      </span>
                    )}
                  </div>

                  <div className="space-y-4">
                    {logsLoading ? (
                      <div className="py-20 flex flex-col items-center justify-center gap-4 opacity-30">
                        <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 animate-spin rounded-full" />
                        <p className="text-[9px] font-black uppercase tracking-widest">Querying Audit Trail...</p>
                      </div>
                    ) : selectedUser ? (
                      userLogs.map(log => (
                        <div key={log.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                          <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                            <div className="flex items-center gap-3">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-[10px] font-black text-slate-900">{formatDate(log.date)}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-[10px] font-black text-slate-400">Captured at {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <p className="text-sm font-bold text-slate-700 leading-relaxed italic border-l-2 border-slate-100 pl-4">
                              "{log.content}"
                            </p>
                            
                            <div className="flex flex-wrap gap-2">
                              {log.skills.map((skill: string) => (
                                <span key={skill} className="px-2 py-1 bg-slate-50 text-slate-400 text-[8px] font-black uppercase tracking-widest rounded-md">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-32 text-center space-y-4 bg-white rounded-[3rem] border border-slate-200 border-dashed">
                        <Activity className="w-12 h-12 text-slate-100 mx-auto" />
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Select a Lead or Member to begin Audit</p>
                      </div>
                    )}
                    
                    {selectedUser && userLogs.length === 0 && !logsLoading && (
                      <div className="py-20 text-center space-y-3 opacity-30">
                        <ShieldAlert className="w-8 h-8 mx-auto" />
                        <p className="text-[10px] font-black uppercase tracking-widest">No Audit Records Available for this user</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-30">
              <Zap className="w-16 h-16 text-slate-200" />
              <div className="space-y-2">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.3em]">Awaiting Unit Selection</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Operational Intelligence starts with Lead Selection</p>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
