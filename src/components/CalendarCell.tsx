'use client';
import { motion } from 'framer-motion';

interface Props {
  date: Date;
  intensity: string;
  logCount: number;
  onClick: () => void;
}

export default function CalendarCell({ date, intensity, logCount, onClick }: Props) {
  const isToday = new Date().toDateString() === date.toDateString();
  const day = date.getDate();

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
        <span className={`text-[10px] font-black ${
          isToday 
            ? 'text-white bg-slate-900 w-5 h-5 rounded-md flex items-center justify-center' 
            : 'text-slate-400'
        }`}>
          {day}
        </span>
      </div>
      
      <div className="flex-1 w-full flex items-end">
        <div className={`w-full h-1.5 rounded-full transition-all duration-500 ${intensity} ${
          logCount > 0 ? 'opacity-100' : 'opacity-20'
        } group-hover:h-2`} />
      </div>

      {logCount > 1 && (
        <div className="absolute top-2 right-2 flex gap-0.5">
          {Array.from({ length: Math.min(logCount, 3) }).map((_, i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-slate-200" />
          ))}
        </div>
      )}
    </motion.button>
  );
}
