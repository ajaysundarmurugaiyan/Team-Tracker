'use client';
import { useMemo, useState, useEffect } from 'react';
import { formatDate } from '@/lib/dates';

interface Props {
  logs: any[];
}

export default function MemberHeatmap({ logs }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const years = useMemo(() => {
    if (!mounted) return { months: [], logDates: new Set() };

    const logDates = new Set(logs.map(l => l.date));
    const now = new Date();
    
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        name: d.toLocaleString('default', { month: 'short' }),
        month: d.getMonth(),
        year: d.getFullYear(),
        days: new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
      });
    }
    return { months, logDates };
  }, [logs, mounted]);

  if (!mounted) {
    return (
      <div className="h-32 bg-slate-50 rounded-2xl animate-pulse" />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Activity Distribution (Last 6 Months)</h4>
        <div className="flex items-center gap-2">
          <span className="text-[8px] font-bold text-slate-300 uppercase">Less</span>
          <div className="flex gap-1">
            <div className="w-2.5 h-2.5 bg-slate-100 rounded-[2px]" />
            <div className="w-2.5 h-2.5 bg-emerald-100 rounded-[2px]" />
            <div className="w-2.5 h-2.5 bg-emerald-300 rounded-[2px]" />
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-[2px]" />
          </div>
          <span className="text-[8px] font-bold text-slate-300 uppercase">More</span>
        </div>
      </div>

      <div className="flex justify-between items-start gap-4 overflow-x-auto pb-4 scrollbar-hide w-full">
        {years.months.map((m, mi) => (
          <div key={mi} className="flex flex-col gap-1.5 shrink-0">
            <span className="text-[8px] font-bold text-slate-300 uppercase text-center">{m.name}</span>
            <div className="grid grid-rows-7 grid-flow-col gap-1.5">
              {Array.from({ length: m.days }).map((_, di) => {
                const date = new Date(m.year, m.month, di + 1);
                const dateStr = formatDate(date);
                const dayLogs = logs.filter(l => l.date === dateStr);
                const intensity = dayLogs.length === 0 ? 'bg-slate-50' : 
                                 dayLogs.length === 1 ? 'bg-emerald-100' :
                                 dayLogs.length === 2 ? 'bg-emerald-300' : 'bg-emerald-500';
                
                return (
                  <div 
                    key={di} 
                    className={`w-3.5 h-3.5 rounded-[3px] transition-colors ${intensity} hover:ring-2 ring-slate-200 ring-offset-2`}
                    title={`${dateStr}: ${dayLogs.length} logs`}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
