'use client';
import { motion } from 'framer-motion';
import { WorkLog } from '@/types/log';

interface Props {
  date: Date;
  logs: WorkLog[];
  onClick: () => void;
}

export default function CalendarCell({ date, logs, onClick }: Props) {
  const isToday = new Date().toDateString() === date.toDateString();
  const day = date.getDate();
  const logCount = logs.length;

  const getLogIntensity = (log: WorkLog) => {
    const score = log.skills.length + (log.content.length / 50);
    if (score > 15) return 'bg-emerald-700';
    if (score > 10) return 'bg-emerald-600';
    if (score > 5) return 'bg-emerald-500';
    return 'bg-emerald-400';
  };

  return (
    <motion.button
      whileHover={{ scale: 0.98 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`w-full h-full p-2 flex flex-col items-start gap-1 transition-all relative group ${
        logCount > 0 ? 'cursor-pointer' : 'cursor-default'
      }`}
    >
      <div className="flex items-center justify-between w-full">
        <span className={`text-[8px] font-black ${
          isToday 
            ? 'text-white bg-slate-900 w-4 h-4 rounded-md flex items-center justify-center' 
            : 'text-slate-400'
        }`}>
          {day}
        </span>
      </div>
      
      <div className="flex-1 w-full flex items-end">
        <div className="w-full h-1.5 flex gap-[1px] rounded-full overflow-hidden transition-all duration-500 group-hover:h-2">
          {logCount === 0 ? (
            <div className="flex-1 h-full bg-slate-100" />
          ) : (
            logs.map((log, i) => (
              <div 
                key={log.id} 
                className={`h-full flex-1 ${getLogIntensity(log)} transition-all duration-500`}
                title={`${log.date} Audit`}
              />
            ))
          )}
        </div>
      </div>
    </motion.button>
  );
}
