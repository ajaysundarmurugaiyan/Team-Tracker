'use client';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

interface LoaderProps {
  label?: string;
  sublabel?: string;
}

export default function Loader({ label = "Synchronizing", sublabel = "Team Tracker Core" }: LoaderProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-10 max-w-sm w-full px-8">
        {/* Minimalist Executive Loader */}
        <div className="relative flex flex-col items-center gap-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center shadow-2xl shadow-slate-900/20"
          >
            <Zap className="w-7 h-7 text-white fill-white" />
          </motion.div>
          
          <div className="space-y-1.5 text-center">
            <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase">{label}</h2>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">{sublabel}</p>
          </div>
        </div>

        {/* Smooth Progress Indicator */}
        <div className="w-full max-w-[200px] h-[2px] bg-slate-100 rounded-full overflow-hidden relative">
          <motion.div 
            className="absolute top-0 left-0 h-full bg-slate-900 w-1/2"
            animate={{ 
              left: ["-50%", "100%"] 
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          />
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex items-center gap-2"
        >
          <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Secure Connection Verified</span>
        </motion.div>
      </div>
    </div>
  );
}
