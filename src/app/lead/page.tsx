'use client';
import { useState, useEffect, useMemo } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useLogs } from '@/hooks/useLogs';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Search, ChevronRight, ArrowLeft, ShieldAlert, CheckCircle2,
  FileText, Zap, Award, Target, List, Brain, Sparkles
} from 'lucide-react';
import { formatDate } from '@/lib/dates';
import MemberHeatmap from '@/components/MemberHeatmap';

export default function LeadDashboard() {
  const { profile, loading: profileLoading, fetchAllProfiles } = useProfile();
  const { fetchAllMembersLogs } = useLogs();
  const router = useRouter();

  const [members, setMembers] = useState<any[]>([]);
  const [allLogs, setAllLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'logged' | 'not-logged'>('all');
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [memberIntel, setMemberIntel] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!profileLoading && profile?.role !== 'lead') {
      router.push('/');
    } else if (profile?.role === 'lead') {
      loadData();
    }
  }, [profile, profileLoading, router]);

  const loadData = async () => {
    setLoading(true);
    const [profilesData, logsData] = await Promise.all([
      fetchAllProfiles(),
      fetchAllMembersLogs()
    ]);
    setMembers(profilesData);
    setAllLogs(logsData);
    setLoading(false);
  };

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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 border-2 border-slate-100 rounded-2xl" />
            <div className="absolute inset-0 border-2 border-slate-900 rounded-2xl border-t-transparent animate-spin" />
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Compiling Intelligence...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 sm:p-8 md:p-12 transition-colors duration-300">
      <div className="max-w-[1600px] mx-auto">
        {/* Navigation Bar */}
        <nav className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 md:mb-16 pb-8 border-b border-slate-100 gap-6">
          <div className="flex items-center justify-between w-full lg:w-auto gap-8">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-3 text-slate-400 hover:text-slate-900 transition-all group shrink-0"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest">Dashboard</span>
            </button>
            <div className="hidden sm:block w-[1px] h-4 bg-slate-100" />
            <div className="flex items-center gap-3 shrink-0">
              <Zap className="w-5 h-5 text-slate-900" />
              <h1 className="text-base sm:text-xl font-black tracking-tighter text-slate-900 whitespace-nowrap">LEAD OPERATIONS</h1>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6 w-full lg:w-auto">
            <div className="relative group w-full sm:w-64">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-slate-900 transition-colors" />
              <input
                type="text"
                placeholder="SEARCH IDENTITY..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-4 py-2 bg-transparent border-b border-slate-200 sm:border-transparent focus:border-slate-900 focus:outline-none font-black text-[10px] tracking-widest w-full transition-all"
              />
            </div>
            <div className="flex gap-1 p-1 bg-slate-50 rounded-lg self-start sm:self-auto overflow-x-auto max-w-full">
              {(['all', 'logged', 'not-logged'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 text-[8px] font-black uppercase tracking-widest transition-all rounded whitespace-nowrap ${filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {f === 'not-logged' ? 'Missing' : f}
                </button>
              ))}
            </div>
          </div>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
          {/* Left Sidebar: Member Directory */}
          <div className="w-full lg:w-80 shrink-0 space-y-8">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Team Directory</h2>
              <span className="text-[10px] font-black text-slate-900">{filteredMembers.length}</span>
            </div>
            
            <div className="space-y-2 max-h-[400px] lg:max-h-[700px] overflow-y-auto pr-2 scrollbar-hide">
              {filteredMembers.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMember(m)}
                  className={`w-full p-4 rounded-xl transition-all text-left flex items-center justify-between group ${
                    selectedMember?.id === m.id 
                    ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10' 
                    : 'bg-white border border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${selectedMember?.id === m.id ? 'bg-white/10' : 'bg-slate-50 text-slate-400'}`}>
                      {m.full_name?.[0]}
                    </div>
                    <div className="min-w-0">
                      <h3 className={`font-black text-[11px] tracking-tight truncate ${selectedMember?.id === m.id ? 'text-white' : 'text-slate-900'}`}>{m.full_name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${m.hasLoggedToday ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <span className={`text-[8px] font-black uppercase tracking-widest truncate ${selectedMember?.id === m.id ? 'text-white/50' : 'text-slate-400'}`}>
                          {m.stats.monthlyConsistency}% Sync
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${selectedMember?.id === m.id ? 'text-white translate-x-1' : 'text-slate-200 group-hover:translate-x-1'}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Right Panel: Member Details */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {selectedMember ? (
                <motion.div
                  key={selectedMember.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8 md:space-y-12"
                >
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-2xl sm:text-4xl font-black text-slate-200 shrink-0">
                        {selectedMember.full_name?.[0]}
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tighter truncate">{selectedMember.full_name}</h2>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <span className="px-2 py-0.5 bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest rounded">{selectedMember.role}</span>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID: {selectedMember.employee_id}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 w-full md:w-auto">
                      <div className="text-left md:text-right p-4 md:p-0 bg-slate-50 md:bg-transparent rounded-xl md:rounded-none">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Monthly Sync</p>
                        <p className="text-2xl font-black text-slate-900">{selectedMember.stats.monthlyConsistency}%</p>
                      </div>
                      <div className="text-left md:text-right p-4 md:p-0 bg-slate-50 md:bg-transparent rounded-xl md:rounded-none">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Yearly target</p>
                        <p className="text-2xl font-black text-slate-900">{selectedMember.stats.yearlyConsistency}%</p>
                      </div>
                      <div className="text-left md:text-right p-4 md:p-0 bg-slate-50 md:bg-transparent rounded-xl md:rounded-none">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Audits</p>
                        <p className="text-2xl font-black text-slate-900">{selectedMember.stats.totalLogs}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 sm:p-8 bg-slate-50/50 rounded-3xl border border-slate-100 overflow-x-auto scrollbar-hide">
                    <div className="min-w-[600px] sm:min-w-0">
                      <MemberHeatmap logs={selectedMember.logs} />
                    </div>
                  </div>

                  <div className="flex flex-col lg:flex-row gap-12">
                    <div className="w-full lg:w-80 shrink-0 space-y-8">
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                          <Award className="w-4 h-4 text-slate-900" />
                          Top Competencies
                        </h4>
                        <div className="space-y-3">
                          {selectedMember.stats.topSkills.map((s: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-3 sm:p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                              <span className="text-[10px] sm:text-[11px] font-black text-slate-900 uppercase tracking-tight">{s.name}</span>
                              <span className="text-[9px] sm:text-[10px] font-black text-slate-400">{s.count} Uses</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-6 bg-slate-900 rounded-2xl text-white space-y-4 shadow-xl shadow-slate-900/10">
                        <div className="flex items-center gap-3">
                          <Brain className="w-4 h-4 text-emerald-400" />
                          <h4 className="text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                            Growth Intelligence
                            {!memberIntel[selectedMember.id] && <Sparkles className="w-3 h-3 animate-spin" />}
                          </h4>
                        </div>
                        <p className="text-[11px] font-medium leading-relaxed opacity-70 italic">
                          &quot;{memberIntel[selectedMember.id] || 'Generating audit insights...'}&quot;
                        </p>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 space-y-6">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <List className="w-4 h-4 text-slate-900" />
                        Audit History
                      </h4>
                      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-0 sm:pr-4 scrollbar-hide">
                        {selectedMember.logs.map((log: any) => (
                          <div key={log.id} className="group p-6 bg-white border border-slate-100 rounded-2xl hover:border-slate-300 transition-all shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{log.date}</span>
                                <div className="hidden sm:block w-1 h-1 bg-slate-200 rounded-full" />
                                <span className="text-[9px] font-bold text-slate-300 uppercase">
                                  {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {log.skills?.slice(0, 3).map((s: string, i: number) => (
                                  <span key={i} className="px-2 py-0.5 bg-slate-50 text-[8px] font-black text-slate-400 rounded uppercase tracking-tighter">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <p className="text-xs font-bold text-slate-500 leading-relaxed group-hover:text-slate-900 transition-colors italic">
                              &quot;{log.content}&quot;
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="h-[400px] lg:h-[700px] flex flex-col items-center justify-center text-center px-4">
                  <div className="w-20 h-20 lg:w-24 lg:h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-8 rotate-12">
                    <Users className="w-8 h-8 lg:w-10 lg:h-10 text-slate-200 -rotate-12" />
                  </div>
                  <h3 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tighter mb-2">Team Intel Hub</h3>
                  <p className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] max-w-xs leading-loose">
                    Select a technical asset to perform a deep-dive audit of their activity timeline and growth trajectory.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
