'use client';
import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useLogs } from '@/hooks/useLogs';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Search, ChevronRight, ArrowLeft, ShieldAlert, CheckCircle2, ShieldCheck,
  FileText, Zap, Award, Target, List, Brain, Sparkles, Code, Plus,
  Activity, BarChart3, Database
} from 'lucide-react';
import { formatDate } from '@/lib/dates';
import MemberHeatmap from '@/components/MemberHeatmap';
import Loader from '@/components/Loader';

import CalendarGrid from '@/components/CalendarGrid';
import ProfileCard from '@/components/ProfileCard';
import { useSearchParams } from 'next/navigation';

function LeadDashboard() {
  const { profile, loading: profileLoading, fetchAllProfiles, addMemberToLead, signOut } = useProfile();
  const { fetchAllMembersLogs, fetchLogsForUser } = useLogs();
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialMemberId = searchParams.get('memberId');

  const [members, setMembers] = useState<any[]>([]);
  const [allLogs, setAllLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'logged' | 'not-logged'>('all');
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [memberLogs, setMemberLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [profilesData, logsData] = await Promise.all([
      fetchAllProfiles(),
      fetchAllMembersLogs()
    ]);
    setMembers(profilesData);
    setAllLogs(logsData);
    
    if (initialMemberId) {
      const member = profilesData.find(m => m.id === initialMemberId);
      if (member) handleMemberSelect(member, false);
    }
    
    setLoading(false);
  }, [fetchAllProfiles, fetchAllMembersLogs, initialMemberId]);

  const [newMemberId, setNewMemberId] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberId) return;
    
    setIsAddingMember(true);
    const success = await addMemberToLead(newMemberId);
    if (success) {
      setNewMemberId('');
      loadData();
    }
    setIsAddingMember(false);
  };

  const handleMemberSelect = async (member: any, updateUrl = true) => {
    setSelectedMember(member);
    setLogsLoading(true);
    
    if (updateUrl) {
      const params = new URLSearchParams(window.location.search);
      params.set('memberId', member.id);
      router.replace(`${window.location.pathname}?${params.toString()}`);
    }

    const logs = await fetchLogsForUser(member.id);
    setMemberLogs(logs);
    setLogsLoading(false);
    
    if (window.innerWidth < 768) setShowSidebar(false);
  };

  useEffect(() => {
    if (!profileLoading && profile?.role !== 'lead') {
      router.push('/');
    } else if (profile?.role === 'lead') {
      loadData();
    }
  }, [profile, profileLoading, router, loadData]);

  const todayStr = formatDate(new Date());
  
  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const matchesSearch = m.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const hasLoggedToday = allLogs.some(l => l.user_id === m.id && l.date === todayStr);
      
      if (filter === 'logged') return matchesSearch && hasLoggedToday;
      if (filter === 'not-logged') return matchesSearch && !hasLoggedToday;
      return matchesSearch;
    });
  }, [members, allLogs, searchQuery, filter, todayStr]);

  if (profileLoading || loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <Loader label="Lead Operations" sublabel="Tactical Command Sync" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-outfit overflow-x-hidden">
      {/* Tactical Header */}
      <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0 z-30 relative shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-all border border-slate-200 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
          </button>
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black text-slate-900 tracking-tight uppercase leading-none">Tactical Command</h1>
              <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Lead Operations</p>
            </div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
            <input
              type="text"
              placeholder="SEARCH ASSETS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-[9px] font-black tracking-widest focus:outline-none focus:border-blue-500/50 w-48 transition-all"
            />
          </div>
          <div className="w-[1px] h-6 bg-slate-200" />
          <button onClick={signOut} className="text-[9px] font-black text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest">Sign Out</button>
        </div>

        <button 
          onClick={() => setShowSidebar(!showSidebar)}
          className="md:hidden p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500"
        >
          <List className="w-4 h-4" />
        </button>
      </header>

      <div className="flex-1 flex flex-col md:flex-row relative">
        {/* Left Sidebar: Unit Roster */}
        <aside className={`absolute md:sticky md:top-20 w-full md:w-80 border-r border-slate-200 bg-white flex flex-col h-[calc(100vh-5rem)] z-40 transition-all duration-500 ${showSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="p-6 border-b border-slate-100 space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit Assets</span>
              <span className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[8px] font-black text-slate-500">{filteredMembers.length} ACTIVE</span>
            </div>
            
            <form onSubmit={handleAddMember} className="relative">
              <input
                type="text"
                inputMode="numeric"
                placeholder="DEPLOY ID..."
                value={newMemberId}
                onChange={(e) => setNewMemberId(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-3 text-[11px] font-black tracking-widest focus:outline-none focus:border-blue-500/50 transition-all"
              />
              <button type="submit" disabled={isAddingMember || !newMemberId} className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-slate-900 rounded-lg text-white hover:bg-black transition-all disabled:opacity-20 flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </button>
            </form>

            <div className="flex gap-1 p-1 bg-slate-50 border border-slate-200 rounded-xl">
              {(['all', 'logged', 'not-logged'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 py-2 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all ${filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {f === 'not-logged' ? 'Missing' : f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-hide">
            {filteredMembers.map((m) => {
               const hasLoggedToday = allLogs.some(l => l.user_id === m.id && l.date === todayStr);
               return (
                <button
                  key={m.id}
                  onClick={() => handleMemberSelect(m)}
                  className={`w-full p-3 rounded-xl transition-all text-left flex items-center justify-between group ${
                    selectedMember?.id === m.id 
                    ? 'bg-slate-900 text-white shadow-lg' 
                    : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-[9px] ${selectedMember?.id === m.id ? 'bg-white/20' : 'bg-slate-100 text-slate-400'}`}>
                      {m.full_name?.[0] || '?'}
                    </div>
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-tight truncate max-w-[140px] leading-none">{m.full_name}</h3>
                      <div className="flex items-center gap-1 mt-1">
                        <div className={`w-1 h-1 rounded-full ${hasLoggedToday ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span className="text-[6px] font-black uppercase tracking-widest opacity-60">{hasLoggedToday ? 'Synced' : 'Missing'}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className={`w-3 h-3 transition-transform group-hover:translate-x-0.5 ${selectedMember?.id === m.id ? 'opacity-100' : 'opacity-20'}`} />
                </button>
               );
            })}
          </div>
        </aside>

        {/* Main Content: Normal UI */}
        <main className="flex-1 bg-[#f8fafc] p-4 md:p-8 lg:p-12">
          <AnimatePresence mode="wait">
            {selectedMember ? (
              <motion.div
                key={selectedMember.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-7xl mx-auto"
              >
                <div className="mb-8 flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Managed Identity: {selectedMember.full_name}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
                  <div className="lg:col-span-8 h-full">
                    <CalendarGrid logs={memberLogs} />
                  </div>
                  
                  <div className="lg:col-span-4 sticky top-0">
                    <ProfileCard profile={{
                      id: selectedMember.id,
                      name: selectedMember.full_name,
                      role: selectedMember.role,
                      employeeId: selectedMember.employee_id,
                      skills: selectedMember.skills || []
                    }} logs={memberLogs} />
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-12">
                <div className="w-28 h-28 bg-white rounded-[2.5rem] border border-slate-200 flex items-center justify-center shadow-xl shadow-slate-200/50">
                  <Users className="w-10 h-10 text-slate-400" />
                </div>
                <div className="space-y-4">
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-[0.4em]">Tactical Operations</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest max-w-xs leading-loose">
                    Select a unit asset to initialize telemetry analysis
                  </p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default function LeadPage() {
  return (
    <Suspense fallback={<Loader label="Command Center" sublabel="Initializing Lead Portal" />}>
      <LeadDashboard />
    </Suspense>
  );
}
