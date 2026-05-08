'use client';
import { useState, useEffect, Suspense } from 'react';
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
import { useSearchParams } from 'next/navigation';
import CalendarGrid from '@/components/CalendarGrid';
import ProfileCard from '@/components/ProfileCard';

function ManagerDashboard() {
  const { profile, loading: profileLoading, fetchManagerStats, signOut } = useProfile();
  const { fetchLogsForUser } = useLogs();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [data, setData] = useState<{ leads: any[], members: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  
  const initialLeadId = searchParams.get('leadId');
  const initialMemberId = searchParams.get('memberId');
  
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userLogs, setUserLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

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
    
    // Restore selection from URL
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
    
    if (updateUrl) {
      const params = new URLSearchParams(window.location.search);
      params.set('memberId', user.id);
      if (selectedLead) params.set('leadId', selectedLead.id);
      router.replace(`${window.location.pathname}?${params.toString()}`);
    }

    const logs = await fetchLogsForUser(user.id);
    setUserLogs(logs);
    setLogsLoading(false);
  };

  const selectLead = (lead: any) => {
    setSelectedLead(lead);
    setSelectedUser(null);
    setUserLogs([]);
    
    const params = new URLSearchParams();
    params.set('leadId', lead.id);
    router.replace(`${window.location.pathname}?${params.toString()}`);
    
    if (window.innerWidth < 768) setShowSidebar(false);
  };

  if (profileLoading || loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <Loader label="Executive Suite" sublabel="Synchronizing Network Intelligence" />
      </div>
    );
  }

  const membersUnderLead = (leadId: string) => {
    return data?.members.filter(m => m.lead_id === leadId) || [];
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col md:flex-row font-outfit overflow-hidden">
      {/* Executive Sidebar */}
      <div className={`w-full md:w-80 bg-white border-r border-slate-200 flex flex-col h-screen z-30 transition-all duration-500 relative ${!showSidebar && '-translate-x-full md:translate-x-0'}`}>
        <div className="p-8 border-b border-slate-100 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">Oversight</h1>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Executive Portal</p>
            </div>
          </div>
          <button 
            onClick={signOut}
            className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all flex items-center justify-between group"
          >
            <span>Terminate Session</span>
            <Zap className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-200">
          <h2 className="px-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Operational Leads</h2>
          <div className="space-y-1">
            {data?.leads.map(lead => (
              <button
                key={lead.id}
                onClick={() => selectLead(lead)}
                className={`w-full p-4 rounded-xl transition-all text-left flex items-center justify-between group ${
                  selectedLead?.id === lead.id 
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' 
                  : 'hover:bg-slate-50 text-slate-600'
                }`}
              >
                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-tight truncate">{lead.full_name}</p>
                  <p className={`text-[8px] font-black uppercase tracking-widest mt-0.5 ${selectedLead?.id === lead.id ? 'text-slate-400' : 'text-slate-400'}`}>
                    {membersUnderLead(lead.id).length} Assets
                  </p>
                </div>
                <ChevronRight className={`w-4 h-4 ${selectedLead?.id === lead.id ? 'opacity-100' : 'opacity-20'}`} />
              </button>
            ))}
          </div>

          {selectedLead && (
            <>
              <div className="h-[1px] bg-slate-100 mx-4 my-2" />
              <h2 className="px-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Unit Assets</h2>
              <div className="space-y-1">
                <button
                  onClick={() => handleUserSelect(selectedLead)}
                  className={`w-full p-4 rounded-xl transition-all text-left flex items-center gap-4 ${
                    selectedUser?.id === selectedLead.id 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                    : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                   <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] ${selectedUser?.id === selectedLead.id ? 'bg-white/20' : 'bg-slate-100'}`}>
                    L
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-tight truncate">{selectedLead.full_name} (Lead)</span>
                </button>
                {membersUnderLead(selectedLead.id).map(member => (
                  <button
                    key={member.id}
                    onClick={() => handleUserSelect(member)}
                    className={`w-full p-4 rounded-xl transition-all text-left flex items-center gap-4 ${
                      selectedUser?.id === member.id 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                      : 'hover:bg-slate-50 text-slate-600'
                    }`}
                  >
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

      {/* Main Intelligence Field */}
      <div className="flex-1 h-screen overflow-y-auto bg-[#f8fafc] p-4 md:p-8 lg:p-12 scrollbar-thin scrollbar-thumb-slate-200">
        <AnimatePresence mode="wait">
          {selectedUser ? (
            <motion.div
              key={selectedUser.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-7xl mx-auto"
            >
              <div className="mb-8 flex items-center justify-between">
                 <button 
                  onClick={() => setShowSidebar(true)}
                  className="md:hidden p-3 bg-white border border-slate-200 rounded-xl text-slate-600 shadow-sm"
                >
                  <List className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Managed Identity: {selectedUser.full_name}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
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
              </div>
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
