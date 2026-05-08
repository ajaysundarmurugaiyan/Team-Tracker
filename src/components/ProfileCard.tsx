'use client';
import { useProfile } from '@/hooks/useProfile';
import { useLogs } from '@/hooks/useLogs';
import { motion } from 'framer-motion';
import { Target, Code, Brain, Sparkles, TrendingUp } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';

export default function ProfileCard({ profile: managedProfile, logs: managedLogs }: { profile?: any, logs?: any[] }) {
  const { profile: contextProfile } = useProfile();
  const { logs: contextLogs } = useLogs();
  
  const profile = managedProfile || contextProfile;
  const logs = managedLogs || contextLogs;
  const [growthIntel, setGrowthIntel] = useState<string>('Analyzing your trajectory...');
  const [isLoadingIntel, setIsLoadingIntel] = useState(false);

  const stats = useMemo(() => {
    if (!logs.length) return { monthly: 0, yearly: 0, total: 0 };

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyLogs = logs.filter(l => {
      // l.date is "YYYY-MM-DD"
      const [y, m] = l.date.split('-').map(Number);
      return y === currentYear && (m - 1) === currentMonth;
    });

    const yearlyLogs = logs.filter(l => {
      const [y] = l.date.split('-').map(Number);
      return y === currentYear;
    });

    const uniqueMonthlyDays = new Set(monthlyLogs.map(l => l.date)).size;
    const uniqueYearlyDays = new Set(yearlyLogs.map(l => l.date)).size;

    // Helper to count working days in a range
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

    // Calculate total working days in the WHOLE month
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const totalWorkingDaysInMonth = countWorkingDaysInRange(firstDayOfMonth, lastDayOfMonth);

    // Calculate total working days in the WHOLE year
    const firstDayOfYear = new Date(currentYear, 0, 1);
    const lastDayOfYear = new Date(currentYear, 11, 31);
    const totalWorkingDaysInYear = countWorkingDaysInRange(firstDayOfYear, lastDayOfYear);

    return {
      monthCount: uniqueMonthlyDays,
      monthTotal: totalWorkingDaysInMonth,
      monthly: Math.round((uniqueMonthlyDays / totalWorkingDaysInMonth) * 100),
      yearly: Math.round((uniqueYearlyDays / totalWorkingDaysInYear) * 100),
      total: logs.length
    };
  }, [logs]);

  useEffect(() => {
    if (profile && logs.length > 0) {
      generateIntelligence();
    } else if (profile && logs.length === 0) {
      setGrowthIntel("Ready to begin auditing. Initialize your first capture to start intelligence mapping.");
    }
  }, [profile?.id, logs.length]);

  const generateIntelligence = async () => {
    if (isLoadingIntel) return;
    setIsLoadingIntel(true);
    try {
      const topSkills = [...(profile?.skills || [])].sort((a, b) => b.count - a.count).slice(0, 3).map(s => s.name);
      const recentLogs = logs.slice(0, 5).map(l => l.content).join('; ');
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: `Based on this user profile, provide a professional, unique "Growth Intelligence" insight (max 20 words). 
          Skills: ${topSkills.join(', ')}
          Recent Activity: ${recentLogs}
          Consistency: ${stats.monthly}% this month.`,
          conversationHistory: [{ role: 'system', content: 'You are a high-level performance auditor. Provide a unique, data-driven growth insight for an employee. Be concise and professional. Do not use generic praise. Focus on trajectory.' }]
        })
      });
      const data = await response.json();
      if (data.reply) {
        setGrowthIntel(data.reply);
      }
    } catch (err) {
      setGrowthIntel(`Maintaining ${stats.monthly}% monthly target progress. Focus on ${profile?.skills[0]?.name || 'core tech'} specialization.`);
    } finally {
      setIsLoadingIntel(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden transition-all h-full flex flex-col shadow-2xl shadow-slate-200/50">
      <div className="p-10 border-b border-slate-100 bg-slate-50/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Target className="w-20 h-20 text-slate-900" />
        </div>
        <div className="flex items-center gap-4 mb-6 relative z-10">
          <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-2xl relative shrink-0">
            {profile.name?.[0] || '?'}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg border-2 border-white">
               <TrendingUp className="w-3 h-3 text-white" />
            </div>
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-black text-slate-900 tracking-tighter truncate leading-none">{profile.name}</h3>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-900 text-[7px] font-black uppercase tracking-widest rounded border border-slate-200">{profile.role}</span>
              <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded truncate">ID: {profile.employeeId}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 relative z-10">
          <div className="p-3.5 bg-white border border-slate-100 rounded-xl shadow-sm space-y-1 group hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between">
              <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Monthly Sync</p>
              <span className="text-[7px] font-bold text-slate-300">{stats.monthCount}/{stats.monthTotal}D</span>
            </div>
            <p className="text-lg font-black text-slate-900 tracking-tighter">{stats.monthly}%</p>
          </div>
          <div className="p-3.5 bg-white border border-slate-100 rounded-xl shadow-sm space-y-1 group hover:border-indigo-500/30 transition-all">
            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Yearly Goal</p>
            <p className="text-lg font-black text-slate-900 tracking-tighter">{stats.yearly}%</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6 flex-1 overflow-y-auto scrollbar-hide">
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Code className="w-3 h-3 text-blue-600" />
            <h4 className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Core Competencies</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {(profile.skills || []).map((skill: any) => (
              <div key={skill.name} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl group hover:border-blue-500/50 hover:bg-white transition-all shadow-sm">
                <span className="text-[9px] font-black text-slate-700 uppercase tracking-tight">{skill.name}</span>
                <span className="w-5 h-5 bg-white border border-slate-200 rounded-md flex items-center justify-center text-[8px] font-black text-slate-400 group-hover:text-blue-600">
                  {skill.count || 0}
                </span>
              </div>
            ))}
            {(!profile.skills || profile.skills.length === 0) && (
              <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest italic">No telemetry data detected</p>
            )}
          </div>
        </section>

        <section className="p-5 bg-white border border-slate-100 rounded-[1.5rem] shadow-xl shadow-slate-200/50 space-y-2 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover:opacity-10 transition-opacity">
            <Brain className="w-12 h-12 text-slate-900" />
          </div>
          <div className="flex items-center gap-2 relative z-10">
            <div className="w-6 h-6 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Brain className="w-3 h-3 text-emerald-600" />
            </div>
            <h4 className="text-[8px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2">
              Growth Intel
              {isLoadingIntel && <Sparkles className="w-3 h-3 animate-spin" />}
            </h4>
          </div>
          <p className="text-[10px] font-bold leading-normal text-slate-600 italic border-l border-emerald-500/30 pl-4 relative z-10">
            &quot;{growthIntel}&quot;
          </p>
        </section>
      </div>
    </div>
  );
}
