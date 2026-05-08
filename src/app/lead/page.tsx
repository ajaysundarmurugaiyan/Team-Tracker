'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useLogs } from '@/hooks/useLogs';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Search, ChevronRight, ArrowLeft, ShieldAlert, CheckCircle2,
  FileText, Zap, Award, Target, List, Brain, Sparkles, Code, Plus,
  Activity, BarChart3, Database
} from 'lucide-react';
import { formatDate } from '@/lib/dates';
import MemberHeatmap from '@/components/MemberHeatmap';
import Loader from '@/components/Loader';

export default function LeadDashboard() {
  const { profile, loading: profileLoading, fetchAllProfiles, addMemberToLead } = useProfile();
  const { fetchAllMembersLogs } = useLogs();
  const router = useRouter();

  const [members, setMembers] = useState<any[]>([]);
  const [allLogs, setAllLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'logged' | 'not-logged'>('all');
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [memberIntel, setMemberIntel] = useState<Record<string, string>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    const [profilesData, logsData] = await Promise.all([
      fetchAllProfiles(),
      fetchAllMembersLogs()
    ]);
    setMembers(profilesData);
    setAllLogs(logsData);
    setLoading(false);
  }, [fetchAllProfiles, fetchAllMembersLogs]);

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

  useEffect(() => {
    if (!profileLoading && profile?.role !== 'lead') {
      router.push('/');
    } else if (profile?.role === 'lead') {
      loadData();
    }
  }, [profile, profileLoading, router, loadData]);

  const todayStr = formatDate(new Date());
  
  const processedMembers = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const countWorkingDaysInRange = (start: Date, end: Date) => {
      let count = 0;
      const cur = new Date(start);
      while (cur <= end) {
        const dayOfWeek = cur.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) count++;
        cur.setDate(cur.getDate() + 1);
      }
      return count || 1;
    };

    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const totalWorkingDaysInMonth = countWorkingDaysInRange(firstDayOfMonth, lastDayOfMonth);

    const firstDayOfYear = new Date(currentYear, 0, 1);
    const lastDayOfYear = new Date(currentYear, 11, 31);
    const totalWorkingDaysInYear = countWorkingDaysInRange(firstDayOfYear, lastDayOfYear);

    return members.map(m => {
      const memberLogs = allLogs.filter(l => l.user_id === m.id);
      const hasLoggedToday = memberLogs.some(l => l.date === todayStr);
      
      const monthlyLogs = memberLogs.filter(l => {
        const d = new Date(l.created_at);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });

      const yearlyLogs = memberLogs.filter(l => {
        const d = new Date(l.created_at);
        return d.getFullYear() === currentYear;
      });

      const uniqueMonthlyDays = new Set(monthlyLogs.map(l => l.date)).size;
      const uniqueYearlyDays = new Set(yearlyLogs.map(l => l.date)).size;
      
      const topSkills = [...(m.skills || [])]
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 3);
        
      return {
        ...m,
        logs: memberLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
        hasLoggedToday,
        stats: {
          totalLogs: memberLogs.length,
          monthlyConsistency: Math.round((uniqueMonthlyDays / totalWorkingDaysInMonth) * 100),
          yearlyConsistency: Math.round((uniqueYearlyDays / totalWorkingDaysInYear) * 100),
          topSkills,
          lastSync: memberLogs[0]?.created_at
        }
      };
    });
  }, [members, allLogs, todayStr]);

  const generateMemberIntel = async (m: any) => {
    if (memberIntel[m.id]) return;
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: `Analyze this member's performance for the lead dashboard:
          Name: ${m.full_name}
          Skills: ${m.stats.topSkills.map((s: any) => s.name).join(', ')}
          Target Progress: ${m.stats.monthlyConsistency}% (Month), ${m.stats.yearlyConsistency}% (Year)
          Recent Logs: ${m.logs.slice(0, 3).map((l: any) => l.content).join('; ')}`,
          conversationHistory: [{ role: 'system', content: 'You are a technical lead. Provide a unique, high-impact growth insight (max 20 words) for this specific member based on their audit data. Be critical but constructive.' }]
        })
      });
      const data = await response.json();
      if (data.reply) {
        setMemberIntel(prev => ({ ...prev, [m.id]: data.reply }));
      }
    } catch (err) {
      setMemberIntel(prev => ({ ...prev, [m.id]: `Progressing toward ${m.stats.monthlyConsistency}% of monthly target. Technical trajectory remains stable.` }));
    }
  };

  useEffect(() => {
    if (selectedMember) {
      generateMemberIntel(selectedMember);
    }
  }, [selectedMember?.id]);

  const filteredMembers = processedMembers.filter(m => {
    const matchesSearch = m.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    if (filter === 'logged') return matchesSearch && m.hasLoggedToday;
    if (filter === 'not-logged') return matchesSearch && !m.hasLoggedToday;
    return matchesSearch;
  });

  if (profileLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <Loader label="Lead Operations" sublabel="Tactical Command Sync" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 flex flex-col h-screen overflow-hidden font-outfit">
      {/* Tactical Header */}
      <header className="h-24 border-b border-white/5 bg-slate-900/20 backdrop-blur-3xl flex items-center justify-between px-8 shrink-0 z-30 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-transparent to-indigo-600/5 pointer-events-none" />
        <div className="flex items-center gap-8 relative z-10">
          <button
            onClick={() => router.push('/')}
            className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-white/10 hover:scale-105 transition-all border border-white/10 group shadow-2xl"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
            <div>
              <h1 className="text-lg font-black text-white tracking-[0.25em] uppercase italic">Tactical Command</h1>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] opacity-60">Unit Oversight Protocol v4.2.0</p>
            </div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-10 relative z-10">
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest opacity-40">System Status</span>
            <span className="text-xs font-black text-emerald-400 uppercase tracking-tighter drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">Operational</span>
          </div>
          <div className="w-[1px] h-10 bg-white/5" />
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-blue-400 transition-colors" />
              <input
                type="text"
                placeholder="LOCATE IDENTITY..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-3 text-[10px] font-black tracking-widest focus:outline-none focus:border-blue-500/50 w-64 transition-all placeholder:text-slate-700"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left Sidebar: Unit Roster (Recycler View) */}
        <aside className="w-full lg:w-96 border-r border-white/5 bg-slate-900/10 backdrop-blur-2xl flex flex-col h-full z-20">
          <div className="p-8 border-b border-white/5 space-y-8">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Unit Roster</span>
              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black text-white shadow-xl">{filteredMembers.length} ASSETS</span>
            </div>
            
            <form onSubmit={handleAddMember} className="relative group">
              <input
                type="text"
                inputMode="numeric"
                placeholder="DEPLOY ID..."
                value={newMemberId}
                onChange={(e) => setNewMemberId(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-5 pr-12 py-4 text-[11px] font-black tracking-[0.2em] placeholder:text-slate-800 focus:outline-none focus:border-blue-500/50 transition-all shadow-2xl"
              />
              <button type="submit" disabled={isAddingMember || !newMemberId} className="absolute right-2.5 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-600 rounded-xl text-white hover:bg-blue-500 hover:scale-105 transition-all disabled:opacity-10 shadow-lg flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </button>
            </form>

            <div className="flex gap-2 p-1.5 bg-white/5 border border-white/5 rounded-2xl">
              {(['all', 'logged', 'not-logged'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 py-2.5 text-[8px] font-black uppercase tracking-widest rounded-xl transition-all ${filter === f ? 'bg-white text-slate-950 shadow-2xl' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                >
                  {f === 'not-logged' ? 'Missing' : f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-3 scrollbar-thin scrollbar-thumb-white/5">
            {filteredMembers.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedMember(m)}
                className={`w-full p-5 rounded-3xl border transition-all text-left group relative overflow-hidden ${
                  selectedMember?.id === m.id 
                  ? 'bg-white border-white text-slate-950 shadow-[0_20px_40px_rgba(255,255,255,0.1)] scale-[1.02]' 
                  : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs ${selectedMember?.id === m.id ? 'bg-slate-950 text-white' : 'bg-slate-900 text-slate-500'}`}>
                      {m.full_name?.[0]}
                    </div>
                    <div>
                      <h3 className="font-black text-xs tracking-tight uppercase truncate">{m.full_name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${m.hasLoggedToday ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-rose-600'}`} />
                        <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${selectedMember?.id === m.id ? 'text-slate-500' : 'text-slate-600'}`}>
                          {m.stats.monthlyConsistency}% SYNCED
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${selectedMember?.id === m.id ? 'opacity-100 text-slate-950' : 'opacity-20'}`} />
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Main Command Center */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-6 md:p-12 scrollbar-thin scrollbar-thumb-slate-900 relative">
          <AnimatePresence mode="wait">
            {selectedMember ? (
              <motion.div
                key={selectedMember.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-5xl mx-auto space-y-12"
              >
                {/* Asset Dossier */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 border-b border-white/5 pb-16">
                  <div className="flex items-center gap-10">
                    <div className="w-28 h-28 bg-gradient-to-br from-white/10 to-transparent rounded-[3rem] border border-white/10 flex items-center justify-center text-5xl font-black text-white shadow-2xl relative overflow-hidden group">
                      <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="relative z-10">{selectedMember.full_name?.[0]}</span>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <span className="px-3 py-1 bg-blue-600/20 text-[9px] font-black text-blue-400 uppercase tracking-[0.3em] rounded-lg border border-blue-600/20">Operational Asset</span>
                        <span className="text-[11px] font-black text-slate-600 uppercase tracking-[0.4em]">Unit ID: {selectedMember.employee_id}</span>
                      </div>
                      <h2 className="text-6xl font-black text-white tracking-tighter uppercase italic">{selectedMember.full_name}</h2>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-12">
                    {[
                      { label: 'Sync Status', val: selectedMember.stats.monthlyConsistency, color: 'text-blue-400' },
                      { label: 'Yearly Goal', val: selectedMember.stats.yearlyConsistency, color: 'text-indigo-400' },
                      { label: 'Audit Count', val: selectedMember.stats.totalLogs, color: 'text-slate-500' }
                    ].map((s, i) => (
                      <div key={i} className="space-y-2">
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">{s.label}</p>
                        <p className={`text-4xl font-black tracking-tighter ${s.color}`}>{s.val}{i < 2 ? '%' : ''}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Heatmap Section */}
                <section className="bg-slate-900/30 border border-slate-800 p-8 rounded-[2.5rem] relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
                  <div className="mb-6 flex items-center justify-between">
                    <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Activity className="w-3 h-3 text-blue-500" />
                      Temporal Sync Heatmap
                    </h4>
                    <span className="text-[8px] font-black text-slate-700 uppercase tracking-[0.3em]">Protocol v4.0.1</span>
                  </div>
                  <div className="overflow-x-auto scrollbar-hide pb-2">
                    <div className="min-w-[600px] lg:min-w-0 invert brightness-200 opacity-20 hover:opacity-100 transition-opacity">
                      <MemberHeatmap logs={selectedMember.logs} />
                    </div>
                  </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                  {/* Intel Sidebar */}
                  <div className="lg:col-span-4 space-y-10">
                    <div className="space-y-4">
                      <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Database className="w-3 h-3 text-blue-500" />
                        Core Competencies
                      </h4>
                      <div className="space-y-2">
                        {selectedMember.stats.topSkills.map((s: any, i: number) => (
                          <div key={i} className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors">
                            <span className="text-[10px] font-black text-white uppercase">{s.name}</span>
                            <span className="text-[9px] font-black text-slate-600">{s.count} INSTANCES</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-6 bg-blue-600/10 border border-blue-500/20 rounded-2xl space-y-4 relative overflow-hidden group">
                      <div className="absolute top-[-20%] right-[-20%] w-20 h-20 bg-blue-500/10 blur-2xl rounded-full group-hover:scale-150 transition-transform duration-1000" />
                      <div className="flex items-center gap-3">
                        <Brain className="w-4 h-4 text-blue-400" />
                        <h4 className="text-[9px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                          Growth Intel
                          {!memberIntel[selectedMember.id] && <Sparkles className="w-3 h-3 animate-spin" />}
                        </h4>
                      </div>
                      <p className="text-[11px] font-bold text-slate-300 leading-relaxed italic border-l-2 border-blue-500/30 pl-4">
                        &quot;{memberIntel[selectedMember.id] || 'Synthesizing performance telemetry...'}&quot;
                      </p>
                    </div>
                  </div>

                  {/* Audit Timeline (Recycler View) */}
                  <div className="lg:col-span-8 space-y-6">
                    <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <List className="w-3 h-3 text-blue-500" />
                      Audit Timeline
                    </h4>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-900">
                      {selectedMember.logs.map((log: any) => (
                        <button 
                          key={log.id} 
                          onClick={() => setSelectedLog(log)}
                          className="w-full p-6 bg-slate-900/20 border border-slate-800 rounded-2xl hover:bg-slate-900/40 hover:border-blue-500/30 transition-all text-left relative overflow-hidden group"
                        >
                          <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ChevronRight className="w-4 h-4 text-blue-500" />
                          </div>
                          <div className="flex items-center gap-4 mb-4">
                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{log.date}</span>
                            <div className="w-1 h-1 bg-slate-800 rounded-full" />
                            <span className="text-[8px] font-black text-slate-600 uppercase">
                              {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-400 leading-relaxed line-clamp-2 italic">
                            &quot;{log.content}&quot;
                          </p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {log.skills?.slice(0, 4).map((s: string, i: number) => (
                              <span key={i} className="px-2 py-0.5 bg-slate-800 text-[7px] font-black text-slate-500 rounded uppercase tracking-tighter">
                                {s}
                              </span>
                            ))}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-8 opacity-10">
                <div className="w-32 h-32 bg-slate-900 rounded-[3rem] border border-slate-800 flex items-center justify-center rotate-12">
                  <BarChart3 className="w-16 h-16 text-slate-500 -rotate-12" />
                </div>
                <div className="space-y-3">
                  <h2 className="text-2xl font-black text-white uppercase tracking-[0.4em]">Ready for Analysis</h2>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] max-w-xs leading-loose">
                    Select a technical identity to initialize full audit telemetry and growth projection.
                  </p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Audit Detail Modal */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLog(null)}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-600/20">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white uppercase tracking-widest">Audit Narrative</h3>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{selectedLog.date} • FULL ENCRYPTION</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedLog(null)}
                  className="p-3 bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all"
                >
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-thin scrollbar-thumb-slate-800">
                <div className="p-8 bg-slate-950/50 rounded-3xl border border-slate-800">
                  <p className="text-sm font-bold text-slate-300 leading-loose italic">
                    &quot;{selectedLog.content}&quot;
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Code className="w-3 h-3 text-blue-500" />
                      Detected Skills
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedLog.skills?.map((s: string, i: number) => (
                        <span key={i} className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-[10px] font-black text-white rounded-lg uppercase">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Sparkles className="w-3 h-3 text-blue-500" />
                      Verified Learnings
                    </h4>
                    <div className="space-y-2">
                      {selectedLog.learnings?.map((l: string, i: number) => (
                        <div key={i} className="flex items-start gap-3 p-4 bg-slate-950/30 border border-slate-800 rounded-xl">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5" />
                          <p className="text-[11px] font-bold text-slate-400">{l}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Target className="w-4 h-4 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Audit Validated by System Protocol</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
