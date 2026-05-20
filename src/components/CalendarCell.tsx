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

  // Sort logs chronologically to assign progressive intensity shades
  const sortedLogs = [...logs].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

  const getLogIntensity = (index: number) => {
    const shades = [
      'bg-emerald-200', // Lightest green shade for the first log
      'bg-emerald-300',
      'bg-emerald-450', // Tailwind doesn't have 450, so use bg-emerald-400
      'bg-emerald-400',
      'bg-emerald-500',
      'bg-emerald-600',
      'bg-emerald-750', // Use bg-emerald-700
      'bg-emerald-700',
      'bg-emerald-800'  // Darkest shade for subsequent logs
    ];
    // Filter out invalid classes likebg-emerald-450 and bg-emerald-750
    const validShades = [
      'bg-emerald-200',
      'bg-emerald-300',
      'bg-emerald-450',
      'bg-emerald-400',
      'bg-emerald-500',
      'bg-emerald-600',
      'bg-emerald-700',
      'bg-emerald-800'
    ].filter(s => s !== 'bg-emerald-450' && s !== 'bg-emerald-750');
    
    return validShades[Math.min(index, validShades.length - 1)];
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
            sortedLogs.map((log, i) => (
              <div 
                key={log.id} 
                className={`h-full flex-1 ${getLogIntensity(i)} transition-all duration-500`}
                title={`${log.date} Audit`}
              />
            ))
          )}
        </div>
      </div>
    </motion.button>
  );
}
