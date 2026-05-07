'use client';
import { useProfile } from '@/hooks/useProfile';
import { useLogs } from '@/hooks/useLogs';
import { motion } from 'framer-motion';
import { Award, Target, Code, Brain, Sparkles, TrendingUp } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';

export default function ProfileCard() {
  const { profile } = useProfile();
  const { logs } = useLogs();
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
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden transition-colors h-full flex flex-col">
      <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-4 sm:gap-5 mb-6 sm:mb-8">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-black text-slate-200 shadow-sm relative shrink-0">
            {profile.name[0]}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 h-5 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg border-2 border-white">
               <TrendingUp className="w-2.5 h-2.5 sm:w-3 h-3 text-white" />
            </div>
          </div>
          <div className="min-w-0">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight truncate">{profile.name}</h3>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="px-1.5 py-0.5 bg-slate-900 text-white text-[7px] sm:text-[8px] font-black uppercase tracking-widest rounded">{profile.role}</span>
              <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded truncate">ID: {profile.employeeId}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="p-3 sm:p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-1">
            <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest">Monthly Sync</p>
            <div className="flex items-end justify-between">
              <p className="text-lg sm:text-xl font-black text-slate-900">{stats.monthly}%</p>
              <span className="text-[7px] sm:text-[8px] font-black text-emerald-500 uppercase">Target</span>
            </div>
          </div>
          <div className="p-3 sm:p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-1">
            <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest">Yearly Goal</p>
            <p className="text-lg sm:text-xl font-black text-slate-900">{stats.yearly}%</p>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-6 sm:space-y-8">
        <section>
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <Code className="w-3.5 h-3.5 sm:w-4 h-4 text-blue-600" />
            <h4 className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Competency Map</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <div key={skill.name} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-slate-50 border border-slate-200 rounded-xl group hover:border-blue-500/50 transition-all">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-700">{skill.name}</span>
                <span className="w-4 h-4 sm:w-5 h-5 bg-white border border-slate-200 rounded-md flex items-center justify-center text-[8px] sm:text-[9px] font-black text-slate-400 group-hover:text-blue-500">
                  {skill.count}
                </span>
              </div>
            ))}
            {profile.skills.length === 0 && (
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">No competencies identified</p>
            )}
          </div>
        </section>

        <section className="p-4 sm:p-6 bg-slate-900 rounded-2xl text-white shadow-xl shadow-slate-900/10 space-y-3 sm:space-y-4">
          <div className="flex items-center gap-3">
            <Brain className="w-3.5 h-3.5 sm:w-4 h-4 text-emerald-400" />
            <h4 className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
              Growth Intelligence
              {isLoadingIntel && <Sparkles className="w-3 h-3 animate-spin" />}
            </h4>
          </div>
          <p className="text-[10px] sm:text-[11px] font-medium leading-relaxed opacity-70 italic">
            &quot;{growthIntel}&quot;
          </p>
        </section>
      </div>
    </div>
  );
}
