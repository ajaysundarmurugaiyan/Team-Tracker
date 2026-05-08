'use client';
import { useState, useMemo, useEffect } from 'react';
import { useLogs } from '@/hooks/useLogs';
import { formatDate, getDaysInMonth, getMonthName } from '@/lib/dates';
import CalendarCell from './CalendarCell';
import LogModal from './LogModal';
import { WorkLog } from '@/types/log';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Activity, Target } from 'lucide-react';

export default function CalendarGrid({ logs: managedLogs }: { logs?: WorkLog[] }) {
  const { getLogsByDate: contextGetLogsByDate, logs: contextLogs } = useLogs();
  
  const logs = managedLogs || contextLogs;
  const getLogsByDate = (date: string) => 
    managedLogs ? managedLogs.filter(l => l.date === date) : contextGetLogsByDate(date);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCurrentDate(new Date());
  }, []);

  const stats = useMemo(() => {
    if (!currentDate || !mounted) return { monthCount: 0, monthTotal: 0, weekCount: 0, weekTotal: 7, completionRate: 0 };

    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const days = getDaysInMonth(year, month);

    const monthLogs = logs.filter(l => {
      const [y, m] = l.date.split('-').map(Number);
      return (m - 1) === month && y === year;
    });

    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (6 - today.getDay()));

    const weekLogs = logs.filter(l => {
      const logDate = new Date(l.date);
      return logDate >= startOfWeek && logDate <= endOfWeek;
    });

    return {
      monthCount: new Set(monthLogs.map(l => l.date)).size,
      monthTotal: days.length,
      weekCount: new Set(weekLogs.map(l => l.date)).size,
      weekTotal: 7,
      completionRate: Math.round((new Set(monthLogs.map(l => l.date)).size / (days.length || 1)) * 100)
    };
  }, [logs, currentDate, mounted]);

  const getIntensity = (dayLogs: WorkLog[]) => {
    if (dayLogs.length === 0) return 'bg-slate-100';
    const totalScore = dayLogs.reduce((acc, log) => acc + log.skills.length + (log.content.length / 50), 0);
    if (totalScore > 15) return 'bg-emerald-700';
    if (totalScore > 10) return 'bg-emerald-600';
    if (totalScore > 5) return 'bg-emerald-500';
    return 'bg-emerald-400';
  };

  const selectedDayLogs = selectedDate ? getLogsByDate(selectedDate) : [];

  if (!mounted || !currentDate) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl h-[600px] animate-pulse flex items-center justify-center">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Initializing Matrix...</span>
      </div>
    );
  }

  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  const days = getDaysInMonth(year, month);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const emptySlots = Array(firstDayOfMonth).fill(null);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  return (
    <div className="bg-white border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full rounded-2xl transition-colors">
      <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-8">
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
            <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-slate-700" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-outfit tracking-tight truncate">
              {getMonthName(month)} {year}
            </h2>
            <div className="flex items-center gap-2 sm:gap-3 mt-1">
              <span className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Efficiency Metrics</span>
              <div className="h-1 w-12 sm:w-20 bg-slate-200 rounded-full overflow-hidden shrink-0">
                <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${stats.completionRate}%` }}
                   className="h-full bg-emerald-500"
                />
              </div>
              <span className="text-[8px] sm:text-[10px] font-black text-emerald-600 shrink-0">{stats.completionRate}%</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6">
          <div className="flex items-center justify-between sm:justify-start gap-4 sm:gap-6">
            <div className="text-right flex-1 sm:flex-none">
              <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 sm:mb-1">Monthly Active</p>
              <p className="text-base sm:text-lg font-black text-slate-900">{stats.monthCount}<span className="text-slate-300 text-[10px] sm:text-sm">/{stats.monthTotal}D</span></p>
            </div>
            <div className="w-[1px] h-8 sm:h-10 bg-slate-200" />
            <div className="text-right flex-1 sm:flex-none">
              <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 sm:mb-1">Weekly Active</p>
              <p className="text-base sm:text-lg font-black text-slate-900">{stats.weekCount}<span className="text-slate-300 text-[10px] sm:text-sm">/7D</span></p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-full sm:w-auto">
            <button onClick={prevMonth} className="flex-1 sm:flex-none p-2 hover:bg-slate-50 rounded-lg transition-all text-slate-500 flex items-center justify-center"><ChevronLeft className="w-4 h-4 sm:w-5 h-5" /></button>
            <button onClick={() => setCurrentDate(new Date())} className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 text-[8px] sm:text-[10px] font-black text-slate-600 hover:text-slate-900 uppercase tracking-widest">Today</button>
            <button onClick={nextMonth} className="flex-1 sm:flex-none p-2 hover:bg-slate-50 rounded-lg transition-all text-slate-500 flex items-center justify-center"><ChevronRight className="w-4 h-4 sm:w-5 h-5" /></button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-slate-100 bg-white">
        {dayNames.map(day => (
          <div key={day} className="py-4 text-center border-r last:border-r-0 border-slate-50">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{day}</span>
          </div>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-7 auto-rows-fr gap-[1px] bg-slate-100 border-b border-slate-100">
        {emptySlots.map((_, i) => (
          <div key={`empty-${i}`} className="bg-slate-50/50 h-full" />
        ))}
        {days.map((day) => {
          const dateStr = formatDate(day);
          const dayLogs = getLogsByDate(dateStr);
          
          return (
            <div key={dateStr} className="bg-white h-full">
              <CalendarCell 
                date={day} 
                logs={dayLogs}
                onClick={() => dayLogs.length > 0 && setSelectedDate(dateStr)} 
              />
            </div>
          );
        })}
      </div>

      <div className="p-6 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <Activity className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Efficiency Index</span>
          </div>
          <div className="flex gap-2">
            {[200, 400, 500, 600, 700].map(v => (
              <div key={v} className={`w-3 h-3 rounded-sm ${v === 200 ? 'bg-emerald-200' : v === 400 ? 'bg-emerald-400' : v === 500 ? 'bg-emerald-500' : v === 600 ? 'bg-emerald-600' : 'bg-emerald-700'}`} />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <Target className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Enterprise Auditor v1.4</span>
        </div>
      </div>

      <LogModal 
        isOpen={!!selectedDate} 
        onClose={() => setSelectedDate(null)} 
        logs={selectedDayLogs}
        date={selectedDate || ''}
      />
    </div>
  );
}
